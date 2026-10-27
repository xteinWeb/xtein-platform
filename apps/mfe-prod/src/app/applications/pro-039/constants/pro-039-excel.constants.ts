import { XteinExcelColumn, XteinExcelWorkbook } from '@xtein/ui';
import { Pro039MovementItem } from '../models/pro-039.model';
import { materialLot, matrixTotal, originLot } from '../utils/pro-039-lot.utils';

/** Datos del encabezado de un consumo para el Excel (código y nombre ya resueltos). */
export interface Pro039ExcelHeader {
  documento: string;
  fecha: string;
  fechaRegistro: string;
  estado: string;
  movimiento: string;
  usuario: string;
  producto: string;
  componente: string;
  seccion: string;
  lote: number;
  origen: string;
  destino: string;
  observacion: string;
}

const MaterialColumns: XteinExcelColumn[] = [
  { header: 'Producto', key: 'PRODUCTO', width: 13 },
  { header: 'Nombre', key: 'NOMBRE', width: 45 },
  { header: 'Atr', key: 'ATRIBUTO', width: 8 },
  { header: 'Tipo inv.', key: 'TIPO_INVENTARIO', width: 11 },
  { header: 'UM Pres.', key: 'UDM', width: 9 },
  { header: 'Origen', key: 'ORIGEN', width: 11 },
  { header: 'De productos', key: 'PRODUCTOS_ORIGEN', width: 28 },
  { header: 'Consumo unit.', key: 'CONSUMO_BASE', width: 14, numeric: true },
  { header: 'Lote', key: 'LOTE', width: 9, numeric: true },
  { header: 'Total', key: 'TOTAL', width: 13, numeric: true },
  { header: 'Consumo modificado', key: 'CANTIDAD', width: 19, numeric: true },
  { header: 'UM Equiv', key: 'UDM_EQUIV', width: 10 },
  { header: 'Factor', key: 'FACTOR', width: 9, numeric: true },
  { header: 'Can Equiv', key: 'CANTIDAD_REAL', width: 13, numeric: true }
];

const ConsumptionColumns: XteinExcelColumn[] = [
  { header: 'Documento', key: 'DOCUMENTO', width: 12 },
  { header: 'Fecha', key: 'FECHA', width: 11 },
  { header: 'Estado', key: 'ESTADO', width: 12 },
  { header: 'Productos', key: 'PRODUCTO_CONSUMO', width: 40 },
  { header: 'Componente', key: 'COMPONENTE', width: 30 },
  { header: 'Sección', key: 'SECCION', width: 26 },
  { header: 'Bodega origen', key: 'BODEGA', width: 24 },
  { header: 'Destino', key: 'DESTINO', width: 24 },
  { header: 'Usuario', key: 'USUARIO', width: 11 },
  { header: 'Material', key: 'PRODUCTO', width: 12 },
  { header: 'Nombre', key: 'NOMBRE', width: 40 },
  { header: 'UM Pres.', key: 'UDM', width: 9 },
  { header: 'Origen', key: 'ORIGEN', width: 11 },
  { header: 'De productos', key: 'PRODUCTOS_ORIGEN', width: 28 },
  { header: 'Consumo unit.', key: 'CONSUMO_BASE', width: 13, numeric: true },
  { header: 'Lote', key: 'LOTE', width: 8, numeric: true },
  { header: 'Total', key: 'TOTAL', width: 12, numeric: true },
  { header: 'Consumo modificado', key: 'CANTIDAD', width: 18, numeric: true },
  { header: 'UM Equiv', key: 'UDM_EQUIV', width: 10 },
  { header: 'Factor', key: 'FACTOR', width: 9, numeric: true },
  { header: 'Can Equiv', key: 'CANTIDAD_REAL', width: 13, numeric: true }
];

/** Fila de material: unitario, lote y total solo para los de la matriz. */
function materialRow(item: Pro039MovementItem, lot: number) {
  const matrix = !!item.ES_MATRIZ;
  const base = Number(item.CONSUMO_BASE || 0);
  return {
    PRODUCTO: item.PRODUCTO,
    NOMBRE: item.NOMBRE_PRODUCTO,
    ATRIBUTO: item.ATRIBUTO,
    TIPO_INVENTARIO: item.TIPO_INVENTARIO,
    UDM: item.UDM_PRESENTACION || item.UDM_PRES || item.UDM,
    ORIGEN: matrix ? 'Matriz' : 'Adicional',
    // De qué productos sale el material: "PF000005: 2 x 3" (unitario de la matriz x lote de ese producto)
    PRODUCTOS_ORIGEN: (item.ORIGENES ?? []).map(o => `${o.PRODUCTO_CONSUMO}: ${Number(o.CONSUMO || 0)} x ${originLot(o)}`).join(', '),
    CONSUMO_BASE: matrix ? base : null,
    // Con varios productos de lotes distintos el lote no es uno solo: queda vacío y se ve en "De productos"
    LOTE: matrix ? materialLot(item, lot) : null,
    TOTAL: matrix ? matrixTotal(item, lot) : null,
    CANTIDAD: Number(item.CANTIDAD || 0),
    // Conversión a la unidad equivalente, como COM-203 ("UM Equiv" / "Can Equiv")
    UDM_EQUIV: item.UDM_EQUIV || item.UDM,
    FACTOR: Number(item.CANTIDAD_EQUIV || 0),
    CANTIDAD_REAL: Number(item.CANTIDAD || 0) * Number(item.CANTIDAD_PRES || 1) * Number(item.CANTIDAD_EQUIV || 1)
  };
}

/** Un consumo: encabezado arriba y la tabla de materiales debajo. */
export function pro039ConsumptionWorkbook(header: Pro039ExcelHeader, items: readonly Pro039MovementItem[]): XteinExcelWorkbook {
  return {
    fileName: `Consumo_${header.documento || 'PRO-039'}`,
    sheets: [{
      name: 'Consumo',
      title: `Consumo ${header.documento}`,
      fields: [
        { label: 'Fecha', value: header.fecha },
        { label: 'Fecha de registro', value: header.fechaRegistro },
        { label: 'Estado', value: header.estado },
        { label: 'Movimiento', value: header.movimiento },
        { label: 'Usuario', value: header.usuario },
        { label: 'Productos', value: header.producto },
        { label: 'Componente', value: header.componente || '—' },
        { label: 'Sección', value: header.seccion || '—' },
        { label: 'Bodega origen', value: header.origen },
        { label: 'Destino', value: header.destino },
        { label: 'Observación', value: header.observacion }
      ],
      columns: MaterialColumns,
      rows: items.map(item => materialRow(item, header.lote))
    }]
  };
}

/** Varios consumos: una fila por material con los datos de su consumo, para filtrar y totalizar. */
export function pro039ConsumptionsWorkbook(consumptions: readonly { header: Pro039ExcelHeader; items: readonly Pro039MovementItem[] }[]): XteinExcelWorkbook {
  return {
    fileName: `Consumos_${consumptions.length}`,
    sheets: [{
      name: 'Consumos',
      columns: ConsumptionColumns,
      rows: consumptions.flatMap(({ header, items }) => items.map(item => ({
        DOCUMENTO: header.documento,
        FECHA: header.fecha,
        ESTADO: header.estado,
        PRODUCTO_CONSUMO: header.producto,
        COMPONENTE: header.componente,
        SECCION: header.seccion,
        BODEGA: header.origen,
        DESTINO: header.destino,
        USUARIO: header.usuario,
        ...materialRow(item, header.lote)
      })))
    }]
  };
}
