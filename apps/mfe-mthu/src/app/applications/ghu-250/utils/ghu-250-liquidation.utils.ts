import {
  XteinGridColumn
} from '@xtein/ui';

import {
  Ghu250MoneyFormat
} from '../constants/ghu-250-ui.constants';

import {
  Ghu250Adjustment,
  Ghu250Concept,
  Ghu250ConceptOrigin,
  Ghu250LiquidationResult,
  Ghu250LiquidationRow
} from '../models/ghu-250.model';


/**
 * Returns the grid field that stores one concept value.
 * The origin is part of the key because the same ID_CONCEPTO may
 * exist in LIQUIDACION_NOMINA and LIQUIDACION_OTROS.
 */
export function ghu250ConceptField(
  concept: Pick<Ghu250Concept, 'ORIGEN' | 'ID_CONCEPTO'>
): string {

  return `${concept.ORIGEN === 'NOMINA' ? 'NOM' : 'OTR'}_${concept.ID_CONCEPTO}`;
}


/**
 * Recalculates TOTAL_DEVENGADO, TOTAL_DEDUCIDO and TOTAL_PAGAR.
 */
export function ghu250RecalculateRow(
  row: Ghu250LiquidationRow,
  concepts: readonly Ghu250Concept[]
): Ghu250LiquidationRow {

  let earned = 0;
  let deducted = 0;

  for (const concept of concepts) {

    const value = toNumber(row[ghu250ConceptField(concept)]);

    if (concept.TIPO_VALOR === 'Deducido') deducted += value;
    else earned += value;
  }

  row.TOTAL_DEVENGADO = earned;
  row.TOTAL_DEDUCIDO = deducted;
  row.TOTAL_PAGAR = earned - deducted;

  return row;
}


/**
 * Converts the procedure result into flat grid rows.
 */
export function ghu250BuildRows(
  result: Ghu250LiquidationResult
): Ghu250LiquidationRow[] {

  return result.EMPLEADOS.map(employee => {

    const row: Ghu250LiquidationRow = {
      ID_EMPLEADO: employee.ID_EMPLEADO,
      NOMBRE: employee.NOMBRE,
      FECHA_INICIAL: employee.FECHA_INICIAL,
      FECHA_FINAL: employee.FECHA_FINAL,
      SALARIO_BASICO: toNumber(employee.SALARIO_BASICO),
      BASE_PRESTACIONAL: toNumber(employee.BASE_PRESTACIONAL),
      TOTAL_DEVENGADO: 0,
      TOTAL_DEDUCIDO: 0,
      TOTAL_PAGAR: 0
    };

    for (const concept of result.CONCEPTOS) row[ghu250ConceptField(concept)] = 0;
    for (const value of employee.DETALLE ?? []) row[ghu250ConceptField(value)] = toNumber(value.VALOR);

    return ghu250RecalculateRow(row, result.CONCEPTOS);
  });
}


/**
 * Builds the step 3 grid columns: fixed employee data, one band for
 * earnings, one band for deductions and the amount to pay. Editing a
 * concept recalculates the totals of the edited row.
 */
export function ghu250BuildColumns(
  concepts: readonly Ghu250Concept[]
): XteinGridColumn<Ghu250LiquidationRow, string>[] {

  const conceptColumn = (concept: Ghu250Concept): XteinGridColumn<Ghu250LiquidationRow, string> => {

    const field = ghu250ConceptField(concept);

    return {
      dataField: field,
      caption: concept.DESCRIPCION || concept.ID_CONCEPTO,
      dataType: 'number',
      format: Ghu250MoneyFormat,
      allowEditing: true,
      minWidth: 110,
      editorOptions: { min: 0, format: Ghu250MoneyFormat },
      validationRules: [{ type: 'range', min: 0, message: 'El valor no puede ser negativo.' }],
      setCellValue: (newData: Partial<Ghu250LiquidationRow>, value: unknown, currentRowData: Ghu250LiquidationRow) => {

        const edited = { ...currentRowData, [field]: toNumber(value) } as Ghu250LiquidationRow;

        ghu250RecalculateRow(edited, concepts);

        newData[field] = toNumber(value);
        newData.TOTAL_DEVENGADO = edited.TOTAL_DEVENGADO;
        newData.TOTAL_DEDUCIDO = edited.TOTAL_DEDUCIDO;
        newData.TOTAL_PAGAR = edited.TOTAL_PAGAR;
      }
    };
  };

  const totalColumn = (dataField: string, caption: string): XteinGridColumn<Ghu250LiquidationRow, string> => ({
    dataField,
    caption,
    dataType: 'number',
    format: Ghu250MoneyFormat,
    allowEditing: false,
    minWidth: 120,
    cssClass: 'ghu-250__total-cell'
  });

  const readOnlyColumn = (
    dataField: string,
    caption: string,
    options: Partial<XteinGridColumn<Ghu250LiquidationRow, string>> = {}
  ): XteinGridColumn<Ghu250LiquidationRow, string> => ({ dataField, caption, allowEditing: false, ...options });

  return [
    readOnlyColumn('ID_EMPLEADO', 'Id Empleado', { fixed: true, width: 120 }),
    readOnlyColumn('NOMBRE', 'Nombre', { fixed: true, minWidth: 200 }),
    readOnlyColumn('SALARIO_BASICO', 'Salario Básico', { dataType: 'number', format: Ghu250MoneyFormat, minWidth: 120 }),
    readOnlyColumn('BASE_PRESTACIONAL', 'Base Liquidación Prestacional', { dataType: 'number', format: Ghu250MoneyFormat, minWidth: 140 }),
    {
      caption: 'Devengados',
      columns: [
        ...concepts.filter(concept => concept.TIPO_VALOR !== 'Deducido').map(conceptColumn),
        totalColumn('TOTAL_DEVENGADO', 'Total Devengado')
      ]
    },
    {
      caption: 'Deducidos',
      columns: [
        ...concepts.filter(concept => concept.TIPO_VALOR === 'Deducido').map(conceptColumn),
        totalColumn('TOTAL_DEDUCIDO', 'Total Deducido')
      ]
    },
    totalColumn('TOTAL_PAGAR', 'Total a Pagar')
  ];
}


/**
 * Returns the concept values that differ from the original liquidation.
 */
export function ghu250CollectAdjustments(
  rows: readonly Ghu250LiquidationRow[],
  original: readonly Ghu250LiquidationRow[],
  concepts: readonly Ghu250Concept[]
): Ghu250Adjustment[] {

  const originalById = new Map(original.map(row => [row.ID_EMPLEADO, row]));
  const adjustments: Ghu250Adjustment[] = [];

  for (const row of rows) {

    const before = originalById.get(row.ID_EMPLEADO);

    if (!before) continue;

    for (const concept of concepts) {

      const field = ghu250ConceptField(concept);
      const value = toNumber(row[field]);

      if (value !== toNumber(before[field])) {
        adjustments.push({
          ID_EMPLEADO: row.ID_EMPLEADO,
          ORIGEN: concept.ORIGEN as Ghu250ConceptOrigin,
          ID_CONCEPTO: concept.ID_CONCEPTO,
          VALOR: value
        });
      }
    }
  }

  return adjustments;
}


/**
 * Deep copy of grid rows (rows only contain primitive values).
 */
export function ghu250CloneRows(
  rows: readonly Ghu250LiquidationRow[]
): Ghu250LiquidationRow[] {

  return rows.map(row => ({ ...row }));
}


function toNumber(
  value: unknown
): number {

  const parsed = typeof value === 'number' ? value : Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}
