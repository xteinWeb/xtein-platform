import { Injectable } from '@angular/core';
import { Pro039MovementItem } from '../models/pro-039.model';

/** Datos del encabezado ya listos para mostrar (código y nombre resueltos). */
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

const Columns: { header: string; width: number; numeric?: boolean }[] = [
  { header: 'Producto', width: 13 },
  { header: 'Nombre', width: 45 },
  { header: 'Atr', width: 8 },
  { header: 'Tipo inv.', width: 11 },
  { header: 'UM', width: 7 },
  { header: 'Origen', width: 11 },
  { header: 'Consumo unit.', width: 14, numeric: true },
  { header: 'Lote', width: 9, numeric: true },
  { header: 'Total', width: 13, numeric: true },
  { header: 'Consumo modificado', width: 19, numeric: true }
];

/**
 * Exporta un consumo a Excel en el navegador (exceljs), sin depender del servidor de reportes.
 * exceljs se carga solo al exportar para no aumentar la carga inicial de la aplicación.
 */
@Injectable({ providedIn: 'root' })
export class Pro039ExcelService {

  /** Un consumo: encabezado arriba y la tabla de materiales debajo. */
  async export(header: Pro039ExcelHeader, items: readonly Pro039MovementItem[]): Promise<void> {
    const { Workbook } = await this.excelJs();
    const book = new Workbook();
    const sheet = book.addWorksheet('Consumo', { pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    sheet.columns = Columns.map(column => ({ width: column.width }));

    sheet.mergeCells(1, 1, 1, Columns.length);
    const title = sheet.getCell(1, 1);
    title.value = `Consumo ${header.documento}`;
    title.font = { bold: true, size: 14, color: { argb: 'FF1B506F' } };

    const fields: [string, string | number][] = [
      ['Fecha', header.fecha],
      ['Fecha de registro', header.fechaRegistro],
      ['Estado', header.estado],
      ['Movimiento', header.movimiento],
      ['Usuario', header.usuario],
      ['Producto', header.producto],
      ['Componente', header.componente || '—'],
      ['Sección', header.seccion || '—'],
      ['Cantidad lote', header.lote],
      ['Bodega origen', header.origen],
      ['Destino', header.destino],
      ['Observación', header.observacion]
    ];
    fields.forEach(([label, value], index) => {
      const row = sheet.getRow(3 + index);
      row.getCell(1).value = label;
      row.getCell(1).font = { bold: true };
      sheet.mergeCells(3 + index, 2, 3 + index, 6);
      row.getCell(2).value = value;
      row.getCell(2).alignment = { horizontal: 'left' };
    });

    const headerRowNumber = 3 + fields.length + 1;
    const headerRow = sheet.getRow(headerRowNumber);
    Columns.forEach((column, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = column.header;
      cell.font = { bold: true, color: { argb: 'FF334155' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } } };
      cell.alignment = { horizontal: column.numeric ? 'right' : 'left', vertical: 'middle', wrapText: true };
    });

    items.forEach((item, index) => {
      const matrix = !!item.ES_MATRIZ;
      const base = Number(item.CONSUMO_BASE || 0);
      const row = sheet.getRow(headerRowNumber + 1 + index);
      row.values = [
        item.PRODUCTO,
        item.NOMBRE_PRODUCTO,
        item.ATRIBUTO,
        item.TIPO_INVENTARIO,
        item.UDM_PRES || item.UDM,
        matrix ? 'Matriz' : 'Adicional',
        matrix ? base : null,
        matrix ? header.lote : null,
        matrix ? base * header.lote : null,
        Number(item.CANTIDAD || 0)
      ];
      Columns.forEach((column, col) => {
        if (column.numeric) row.getCell(col + 1).numFmt = '#,##0.####';
      });
    });

    sheet.views = [{ state: 'frozen', ySplit: headerRowNumber }];
    sheet.autoFilter = { from: { row: headerRowNumber, column: 1 }, to: { row: headerRowNumber, column: Columns.length } };

    await this.download(book, `Consumo_${header.documento || 'PRO-039'}.xlsx`);
  }

  /**
   * Varios consumos (resultados de la búsqueda): una fila por material con los datos de su consumo,
   * lista para filtrar y totalizar en Excel.
   */
  async exportMany(consumptions: readonly { header: Pro039ExcelHeader; items: readonly Pro039MovementItem[] }[]): Promise<void> {
    const { Workbook } = await this.excelJs();
    const book = new Workbook();
    const sheet = book.addWorksheet('Consumos', { pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    const columns: { header: string; width: number; numeric?: boolean }[] = [
      { header: 'Documento', width: 12 }, { header: 'Fecha', width: 11 }, { header: 'Estado', width: 12 },
      { header: 'Producto', width: 34 }, { header: 'Componente', width: 30 }, { header: 'Sección', width: 26 },
      { header: 'Lote', width: 8, numeric: true }, { header: 'Bodega origen', width: 24 }, { header: 'Destino', width: 24 },
      { header: 'Usuario', width: 11 }, { header: 'Material', width: 12 }, { header: 'Nombre', width: 40 },
      { header: 'UM', width: 7 }, { header: 'Origen', width: 11 }, { header: 'Consumo unit.', width: 13, numeric: true },
      { header: 'Total', width: 12, numeric: true }, { header: 'Consumo modificado', width: 18, numeric: true }
    ];
    sheet.columns = columns.map(column => ({ header: column.header, width: column.width }));
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FF334155' } };
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } } };
    });
    for (const { header, items } of consumptions) {
      for (const item of items) {
        const matrix = !!item.ES_MATRIZ;
        const base = Number(item.CONSUMO_BASE || 0);
        sheet.addRow([
          header.documento, header.fecha, header.estado, header.producto, header.componente, header.seccion,
          header.lote, header.origen, header.destino, header.usuario,
          item.PRODUCTO, item.NOMBRE_PRODUCTO, item.UDM_PRES || item.UDM, matrix ? 'Matriz' : 'Adicional',
          matrix ? base : null, matrix ? base * header.lote : null, Number(item.CANTIDAD || 0)
        ]);
      }
    }
    columns.forEach((column, index) => {
      if (column.numeric) sheet.getColumn(index + 1).numFmt = '#,##0.####';
    });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
    await this.download(book, `Consumos_${consumptions.length}.xlsx`);
  }

  /** El build de navegador de exceljs es UMD: según el empaquetador la API llega directa o en default. */
  private async excelJs(): Promise<typeof import('exceljs')> {
    const module = await import('exceljs/dist/exceljs.min.js') as unknown as { default?: typeof import('exceljs') } & typeof import('exceljs');
    return module.default ?? module;
  }

  private async download(book: import('exceljs').Workbook, fileName: string): Promise<void> {
    const buffer = await book.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
