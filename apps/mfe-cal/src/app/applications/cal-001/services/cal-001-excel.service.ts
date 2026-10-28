import { Injectable } from '@angular/core';
import type { Cal001FilaExportacion } from '../models/cal-001.model';

/** Columnas del Excel, en orden (exportadas para las pruebas). */
export const Cal001ColumnasExcel: readonly { campo: keyof Cal001FilaExportacion; titulo: string; ancho: number; numerica?: boolean }[] = [
  { campo: 'DOCUMENTO', titulo: 'Documento', ancho: 11 },
  { campo: 'ORIGEN', titulo: 'Origen', ancho: 11 },
  { campo: 'FECHA_REGISTRO', titulo: 'Fecha de registro', ancho: 17 },
  { campo: 'FECHA_EVENTO', titulo: 'Fecha del evento', ancho: 14 },
  { campo: 'REGISTRADO_POR', titulo: 'Registrado por', ancho: 28 },
  { campo: 'PRODUCTO', titulo: 'Producto', ancho: 13 },
  { campo: 'NOMBRE_PRODUCTO', titulo: 'Nombre del producto', ancho: 36 },
  { campo: 'PARTE', titulo: 'Parte', ancho: 34 },
  { campo: 'CAUSA', titulo: 'Causa', ancho: 9 },
  { campo: 'NOMBRE_CAUSA', titulo: 'No conformidad', ancho: 28 },
  { campo: 'OPERARIO', titulo: 'Operario', ancho: 13 },
  { campo: 'NOMBRE_OPERARIO', titulo: 'Nombre del operario', ancho: 30 },
  { campo: 'PROCESO', titulo: 'Proceso', ancho: 22 },
  { campo: 'OCURRENCIAS', titulo: 'Ocurrencias', ancho: 12, numerica: true }
];

/**
 * Exportación de la Consulta a Excel en el navegador (exceljs, cargado solo al exportar, como PRO-039):
 * una fila por operario y causa para el cálculo manual de la bonificación (plan §10.1).
 */
@Injectable({ providedIn: 'root' })
export class Cal001ExcelService {
  async exportar(filas: readonly Cal001FilaExportacion[], nombreArchivo: string): Promise<void> {
    const { Workbook } = await this.excelJs();
    const libro = new Workbook();
    const hoja = libro.addWorksheet('No conformidades', { pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    hoja.columns = Cal001ColumnasExcel.map(columna => ({ header: columna.titulo, width: columna.ancho }));
    const encabezado = hoja.getRow(1);
    encabezado.font = { bold: true, color: { argb: 'FF334155' } };
    encabezado.eachCell(celda => {
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      celda.border = { bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } } };
    });
    for (const fila of filas) hoja.addRow(Cal001ColumnasExcel.map(columna => fila[columna.campo]));
    Cal001ColumnasExcel.forEach((columna, indice) => {
      if (columna.numerica) hoja.getColumn(indice + 1).numFmt = '#,##0';
    });
    hoja.views = [{ state: 'frozen', ySplit: 1 }];
    hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: Cal001ColumnasExcel.length } };
    await this.descargar(libro, nombreArchivo);
  }

  /** El build de navegador de exceljs es UMD: según el empaquetador la API llega directa o en default. */
  private async excelJs(): Promise<typeof import('exceljs')> {
    const modulo = await import('exceljs/dist/exceljs.min.js') as unknown as { default?: typeof import('exceljs') } & typeof import('exceljs');
    return modulo.default ?? modulo;
  }

  private async descargar(libro: import('exceljs').Workbook, nombreArchivo: string): Promise<void> {
    const buffer = await libro.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
