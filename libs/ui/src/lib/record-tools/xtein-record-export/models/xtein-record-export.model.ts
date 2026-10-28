/** Qué registros exportar: el actual o todos los de la consulta (igual que en los informes). */
export type XteinExportScope = 'actual' | 'todos';

/** Valor de una celda del Excel. */
export type XteinExcelValue = string | number | boolean | Date | null | undefined;

/** Columna de la tabla de datos de una hoja. */
export interface XteinExcelColumn {
  /** Título de la columna. */
  header: string;
  /** Propiedad de cada fila que va en esta columna. */
  key: string;
  /** Ancho aproximado en caracteres (por defecto 14). */
  width?: number;
  /** Número: se alinea a la derecha y se le aplica formato numérico. */
  numeric?: boolean;
  /** Formato de Excel para columnas numéricas (por defecto '#,##0.####'). */
  numFmt?: string;
}

/** Dato del encabezado de una hoja (etiqueta: valor), arriba de la tabla. */
export interface XteinExcelField {
  label: string;
  value: XteinExcelValue;
}

/** Una hoja del libro: título y encabezado opcionales, y una tabla de datos. */
export interface XteinExcelSheet {
  /** Nombre de la pestaña (máximo 31 caracteres en Excel). */
  name: string;
  /** Título en la primera fila. */
  title?: string;
  /** Encabezado (por ejemplo los datos de un documento) antes de la tabla. */
  fields?: XteinExcelField[];
  columns: XteinExcelColumn[];
  rows: readonly Record<string, XteinExcelValue>[];
}

/** Libro a exportar. */
export interface XteinExcelWorkbook {
  /** Nombre del archivo, sin extensión. */
  fileName: string;
  sheets: XteinExcelSheet[];
}
