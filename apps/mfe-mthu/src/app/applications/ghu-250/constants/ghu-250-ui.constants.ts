import {
  RecordToolbarCapabilities
} from '@xtein/sdk';

import {
  XteinGridColumn
} from '@xtein/ui';

import {
  Ghu250LiquidationClass,
  Ghu250Step
} from './ghu-250.constants';

import {
  Ghu250Employee,
  Ghu250LiquidationClassOption
} from '../models/ghu-250.model';


/**
 * Liquidation classes offered in step 1.
 */
export const Ghu250LiquidationClassOptions:
  readonly Ghu250LiquidationClassOption[] = [

    { text: 'Finalización de Contrato', value: Ghu250LiquidationClass.ContractTermination },
    { text: 'Primas', value: Ghu250LiquidationClass.ServiceBonus },
    { text: 'Vacaciones', value: Ghu250LiquidationClass.Vacations },
    { text: 'Cesantías', value: Ghu250LiquidationClass.Severance },
    { text: 'Intereses de Cesantías', value: Ghu250LiquidationClass.SeveranceInterest }
  ];


/**
 * Wizard step titles.
 */
export const Ghu250Steps:
  readonly { step: Ghu250Step; title: string; description: string }[] = [

    { step: Ghu250Step.Parameters, title: 'Parámetros', description: 'Filtro de la liquidación' },
    { step: Ghu250Step.Employees, title: 'Empleados', description: 'Selección de empleados' },
    { step: Ghu250Step.Liquidation, title: 'Liquidación', description: 'Prestaciones generadas' },
    { step: Ghu250Step.Reports, title: 'Reportes', description: 'Informes generados' }
  ];


/**
 * Numeric format used by every money column.
 */
export const Ghu250MoneyFormat =
  '#,##0';


/**
 * Employee columns shown inside the step 1 drop-down box.
 */
export const Ghu250EmployeeLookupColumns:
  XteinGridColumn<Ghu250Employee, string>[] = [

    { dataField: 'ID_EMPLEADO', caption: 'Id Empleado', width: 130 },
    { dataField: 'NOMBRE', caption: 'Nombre' },
    { dataField: 'FECHA_INICIAL', caption: 'Fecha Inicio', dataType: 'date', format: 'dd/MM/yyyy', width: 110 }
  ];


/**
 * Step 2 grid columns. The selection column is added by the grid
 * through multiple selection with checkboxes.
 */
export const Ghu250EmployeeColumns:
  XteinGridColumn<Ghu250Employee, string>[] = [

    { dataField: 'ID_EMPLEADO', caption: 'Id Empleado', width: 140 },
    { dataField: 'NOMBRE', caption: 'Nombre' },
    { dataField: 'FECHA_INICIAL', caption: 'Fecha Inicio', dataType: 'date', format: 'dd/MM/yyyy', width: 120 },
    { dataField: 'FECHA_FINAL', caption: 'Fecha Final', dataType: 'date', format: 'dd/MM/yyyy', width: 120 },
    { dataField: 'DIAS', caption: 'Días', dataType: 'number', width: 90 }
  ];


/**
 * GHU-250 does not use the record toolbar. Every capability is
 * declared explicitly so shared defaults cannot enable actions.
 */
export const Ghu250ToolbarCapabilities:
  Readonly<RecordToolbarCapabilities> = {

    create: false,
    edit: false,
    delete: false,
    search: false,
    refresh: false,
    copy: false,
    view: false,
    sort: false,
    navigation: false,
    download: false,
    print: false,
    configure: false
  };
