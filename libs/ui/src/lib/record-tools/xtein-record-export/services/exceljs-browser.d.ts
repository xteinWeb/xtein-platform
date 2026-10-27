/** Build de navegador de exceljs: misma API que el paquete, sin las dependencias de Node (fs, stream). */
declare module 'exceljs/dist/exceljs.min.js' {
  export * from 'exceljs';
}
