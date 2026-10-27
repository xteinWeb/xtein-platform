import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import type { Workbook, Worksheet } from 'exceljs';
import { XteinExcelSheet, XteinExcelWorkbook } from '../models/xtein-record-export.model';

const DefaultWidth = 14;
const DefaultNumFmt = '#,##0.####';
const TitleColor = 'FF1B506F';
const HeaderColor = 'FF334155';
const HeaderFill = 'FFF1F5F9';
const HeaderBorder = 'FFCBD5E1';

/**
 * Genera y descarga archivos de Excel en el navegador, sin depender del servidor de reportes.
 * Cada aplicación arma un XteinExcelWorkbook con sus datos; aquí quedan el formato y la descarga.
 *
 * exceljs se carga solo al exportar. Se usa su build de navegador (exceljs/dist/exceljs.min.js):
 * la entrada principal del paquete es para Node (fs, stream). Cada microfrontend excluye
 * /^exceljs($|\/)/ de Native Federation (skip en federation.config.js) para empaquetarlo localmente.
 */
@Injectable({ providedIn: 'root' })
export class XteinExcelExportService {
  private readonly document = inject(DOCUMENT);

  async export(definition: XteinExcelWorkbook): Promise<void> {
    const { Workbook } = await this.excelJs();
    const book = new Workbook();
    for (const sheet of definition.sheets) this.addSheet(book, sheet);
    await this.download(book, definition.fileName);
  }

  private addSheet(book: Workbook, definition: XteinExcelSheet): void {
    const name = (definition.name || 'Datos').replace(/[\\/*?:[\]]/g, '').slice(0, 31) || 'Datos';
    const sheet = book.addWorksheet(name, { pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    const columns = definition.columns;
    sheet.columns = columns.map(column => ({ width: column.width ?? DefaultWidth }));

    let row = 1;
    if (definition.title) {
      sheet.mergeCells(row, 1, row, Math.max(columns.length, 2));
      const title = sheet.getCell(row, 1);
      title.value = definition.title;
      title.font = { bold: true, size: 14, color: { argb: TitleColor } };
      row += 2;
    }

    const fields = definition.fields ?? [];
    const valueTo = Math.max(2, Math.min(columns.length, 6));
    for (const field of fields) {
      const cells = sheet.getRow(row);
      cells.getCell(1).value = field.label;
      cells.getCell(1).font = { bold: true };
      if (valueTo > 2) sheet.mergeCells(row, 2, row, valueTo);
      cells.getCell(2).value = field.value ?? '';
      cells.getCell(2).alignment = { horizontal: 'left' };
      row++;
    }
    if (fields.length) row++;

    const headerRow = row;
    this.writeHeader(sheet, headerRow, definition);
    definition.rows.forEach((data, index) => {
      const cells = sheet.getRow(headerRow + 1 + index);
      columns.forEach((column, col) => {
        const cell = cells.getCell(col + 1);
        cell.value = (data[column.key] ?? null) as never;
        if (column.numeric) cell.numFmt = column.numFmt ?? DefaultNumFmt;
      });
    });

    sheet.views = [{ state: 'frozen', ySplit: headerRow }];
    if (columns.length) {
      sheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: columns.length } };
    }
  }

  private writeHeader(sheet: Worksheet, rowNumber: number, definition: XteinExcelSheet): void {
    const row = sheet.getRow(rowNumber);
    definition.columns.forEach((column, index) => {
      const cell = row.getCell(index + 1);
      cell.value = column.header;
      cell.font = { bold: true, color: { argb: HeaderColor } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HeaderFill } };
      cell.border = { bottom: { style: 'medium', color: { argb: HeaderBorder } } };
      cell.alignment = { horizontal: column.numeric ? 'right' : 'left', vertical: 'middle', wrapText: true };
    });
  }

  /** El build de navegador es UMD: según el empaquetador la API llega directa o dentro de default. */
  private async excelJs(): Promise<typeof import('exceljs')> {
    const module = await import('exceljs/dist/exceljs.min.js') as unknown as { default?: typeof import('exceljs') } & typeof import('exceljs');
    return module.default ?? module;
  }

  private async download(book: Workbook, fileName: string): Promise<void> {
    const buffer = await book.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = (fileName || 'Exportacion') + '.xlsx';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
