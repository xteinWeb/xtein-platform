import {
  Ghu250Concept,
  Ghu250LiquidationRow
} from '../models/ghu-250.model';

import {
  ghu250ConceptField
} from './ghu-250-liquidation.utils';


/**
 * Data shared by both GHU-250 reports.
 */
export interface Ghu250ReportContext {
  companyName: string;
  userName: string;
  retirementDate: string | null;
  cause: string;
  liquidationClasses: string;
  consecutive: number | null;
  concepts: readonly Ghu250Concept[];
  rows: readonly Ghu250LiquidationRow[];
}


const money = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

const REPORT_STYLES = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; font: 12px/1.4 "Segoe UI", Roboto, Arial, sans-serif; color: #1f2d3d; background: #fff; }
  h1 { margin: 0 0 4px; font-size: 18px; color: #244d73; }
  h2 { margin: 0 0 8px; font-size: 14px; color: #244d73; }
  .meta { display: flex; flex-wrap: wrap; gap: 4px 24px; margin: 8px 0 16px; color: #4a5b6d; }
  .meta b { color: #1f2d3d; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 5px 7px; border: 1px solid #d6dee8; vertical-align: top; }
  th { background: #eef3f9; color: #244d73; font-weight: 600; text-align: center; }
  td.num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  tr.total td { font-weight: 700; background: #f6f9fc; }
  .band-earned { background: #e8f4ec; }
  .band-deducted { background: #fbecec; }
  .slip { page-break-inside: avoid; break-inside: avoid; margin: 0 0 24px; padding: 16px; border: 1px dashed #9fb0c3; border-radius: 6px; }
  .slip + .slip { page-break-before: always; break-before: page; }
  .slip .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .net { margin-top: 12px; padding: 8px 10px; text-align: right; font-size: 14px; font-weight: 700; background: #eef3f9; }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 48px; }
  .sign div { padding-top: 6px; border-top: 1px solid #1f2d3d; text-align: center; }
  @page { size: landscape; margin: 12mm; }
  @media print { body { padding: 0; } }
`;


/**
 * General liquidation report: the content of the step 3 grid.
 */
export function ghu250BuildGeneralReport(
  context: Ghu250ReportContext
): string {

  const earned = context.concepts.filter(concept => concept.TIPO_VALOR !== 'Deducido');
  const deducted = context.concepts.filter(concept => concept.TIPO_VALOR === 'Deducido');
  const totals = new Map<string, number>();

  const sum = (field: string, value: unknown): string => {
    const amount = Number(value ?? 0) || 0;
    totals.set(field, (totals.get(field) ?? 0) + amount);
    return money.format(amount);
  };

  const fixedFields = ['SALARIO_BASICO', 'BASE_PRESTACIONAL'];

  const body = context.rows.map(row => `
    <tr>
      <td>${escapeHtml(row.ID_EMPLEADO)}</td>
      <td>${escapeHtml(row.NOMBRE)}</td>
      ${fixedFields.map(field => `<td class="num">${sum(field, row[field])}</td>`).join('')}
      ${earned.map(concept => `<td class="num">${sum(ghu250ConceptField(concept), row[ghu250ConceptField(concept)])}</td>`).join('')}
      <td class="num">${sum('TOTAL_DEVENGADO', row.TOTAL_DEVENGADO)}</td>
      ${deducted.map(concept => `<td class="num">${sum(ghu250ConceptField(concept), row[ghu250ConceptField(concept)])}</td>`).join('')}
      <td class="num">${sum('TOTAL_DEDUCIDO', row.TOTAL_DEDUCIDO)}</td>
      <td class="num"><b>${sum('TOTAL_PAGAR', row.TOTAL_PAGAR)}</b></td>
    </tr>`).join('');

  const totalCell = (field: string): string => `<td class="num">${money.format(totals.get(field) ?? 0)}</td>`;

  const footer = `
    <tr class="total">
      <td colspan="2">Totales (${context.rows.length} empleados)</td>
      ${fixedFields.map(totalCell).join('')}
      ${earned.map(concept => totalCell(ghu250ConceptField(concept))).join('')}
      ${totalCell('TOTAL_DEVENGADO')}
      ${deducted.map(concept => totalCell(ghu250ConceptField(concept))).join('')}
      ${totalCell('TOTAL_DEDUCIDO')}
      ${totalCell('TOTAL_PAGAR')}
    </tr>`;

  return documentShell('Informe de liquidación general', `
    <h1>Informe de liquidación general</h1>
    ${header(context)}
    <table>
      <thead>
        <tr>
          <th rowspan="2">Id Empleado</th>
          <th rowspan="2">Nombre</th>
          <th rowspan="2">Salario Básico</th>
          <th rowspan="2">Base Liquidación Prestacional</th>
          <th class="band-earned" colspan="${earned.length + 1}">Devengados</th>
          <th class="band-deducted" colspan="${deducted.length + 1}">Deducidos</th>
          <th rowspan="2">Total a Pagar</th>
        </tr>
        <tr>
          ${earned.map(concept => `<th class="band-earned">${escapeHtml(concept.DESCRIPCION || concept.ID_CONCEPTO)}</th>`).join('')}
          <th class="band-earned">Total Devengado</th>
          ${deducted.map(concept => `<th class="band-deducted">${escapeHtml(concept.DESCRIPCION || concept.ID_CONCEPTO)}</th>`).join('')}
          <th class="band-deducted">Total Deducido</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
      <tfoot>${footer}</tfoot>
    </table>`);
}


/**
 * Individual payment slip ("tirilla") for each employee.
 */
export function ghu250BuildPaySlips(
  context: Ghu250ReportContext
): string {

  const slips = context.rows.map(row => {

    const lines = (type: 'Devengado' | 'Deducido'): string => {

      const items = context.concepts
        .filter(concept => (type === 'Deducido') === (concept.TIPO_VALOR === 'Deducido'))
        .map(concept => ({ concept, value: Number(row[ghu250ConceptField(concept)] ?? 0) || 0 }))
        .filter(item => item.value !== 0);

      if (!items.length) return '<tr><td colspan="2">Sin conceptos</td></tr>';

      return items.map(item => `
        <tr>
          <td>${escapeHtml(item.concept.DESCRIPCION || item.concept.ID_CONCEPTO)}</td>
          <td class="num">${money.format(item.value)}</td>
        </tr>`).join('');
    };

    return `
      <section class="slip">
        <h2>Tirilla de pago - Liquidación de prestaciones</h2>
        <div class="meta">
          <span>Empresa: <b>${escapeHtml(context.companyName)}</b></span>
          <span>Empleado: <b>${escapeHtml(row.ID_EMPLEADO)} - ${escapeHtml(row.NOMBRE)}</b></span>
          <span>Fecha inicio: <b>${formatDate(row.FECHA_INICIAL)}</b></span>
          <span>Fecha retiro: <b>${formatDate(context.retirementDate)}</b></span>
          <span>Causa: <b>${escapeHtml(context.cause || '-')}</b></span>
          <span>Salario básico: <b>${money.format(Number(row.SALARIO_BASICO) || 0)}</b></span>
          <span>Base prestacional: <b>${money.format(Number(row.BASE_PRESTACIONAL) || 0)}</b></span>
        </div>
        <div class="grid">
          <table>
            <thead><tr><th class="band-earned" colspan="2">Devengados</th></tr></thead>
            <tbody>${lines('Devengado')}</tbody>
            <tfoot><tr class="total"><td>Total Devengado</td><td class="num">${money.format(Number(row.TOTAL_DEVENGADO) || 0)}</td></tr></tfoot>
          </table>
          <table>
            <thead><tr><th class="band-deducted" colspan="2">Deducidos</th></tr></thead>
            <tbody>${lines('Deducido')}</tbody>
            <tfoot><tr class="total"><td>Total Deducido</td><td class="num">${money.format(Number(row.TOTAL_DEDUCIDO) || 0)}</td></tr></tfoot>
          </table>
        </div>
        <div class="net">Total a pagar: $ ${money.format(Number(row.TOTAL_PAGAR) || 0)}</div>
        <div class="sign"><div>Firma empleador</div><div>Firma empleado - C.C. ${escapeHtml(row.ID_EMPLEADO)}</div></div>
      </section>`;
  }).join('');

  return documentShell('Tirillas de pago', slips || '<p>No hay empleados liquidados.</p>');
}


function header(
  context: Ghu250ReportContext
): string {

  return `
    <div class="meta">
      <span>Empresa: <b>${escapeHtml(context.companyName)}</b></span>
      <span>Fecha retiro: <b>${formatDate(context.retirementDate)}</b></span>
      <span>Causa: <b>${escapeHtml(context.cause || '-')}</b></span>
      <span>Clase: <b>${escapeHtml(context.liquidationClasses)}</b></span>
      <span>Consecutivo: <b>${context.consecutive ?? '-'}</b></span>
      <span>Generado por: <b>${escapeHtml(context.userName)}</b> el ${new Date().toLocaleString('es-CO')}</span>
    </div>`;
}


function documentShell(
  title: string,
  content: string
): string {

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <style>${REPORT_STYLES}</style></head><body>${content}</body></html>`;
}


function formatDate(
  value: string | null | undefined
): string {

  if (!value) return '-';

  const [year, month, day] = value.slice(0, 10).split('-');

  return day && month && year ? `${day}/${month}/${year}` : escapeHtml(value);
}


function escapeHtml(
  value: unknown
): string {

  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
