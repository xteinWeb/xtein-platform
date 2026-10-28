import type {
  Cal001Borrador,
  Cal001FilaExportacion,
  Cal001NcPorOperario,
  Cal001RegistroCompleto
} from '../models/cal-001.model';

/**
 * Panel "No conformidades por operario" (ajuste 3): por cada operario, sus no conformidades con la suma
 * de ocurrencias de todas las partes. Los operarios aparecen en el orden en que se capturaron.
 */
export function ncPorOperario(borrador: Pick<Cal001Borrador, 'PARTES'>): Cal001NcPorOperario[] {
  const porOperario = new Map<string, Cal001NcPorOperario>();
  for (const parte of borrador.PARTES) {
    for (const causa of parte.CAUSAS) {
      if (!causa.ID_CAUSA) continue;
      for (const operario of causa.OPERARIOS) {
        let fila = porOperario.get(operario.ID_EMPLEADO);
        if (!fila) {
          fila = { ID_EMPLEADO: operario.ID_EMPLEADO, NOMBRE: operario.NOMBRE, PROCESO: operario.DESCRIPCION_SECCION, TOTAL: 0, CAUSAS: [] };
          porOperario.set(operario.ID_EMPLEADO, fila);
        }
        // En modo Agregar se suman las ocurrencias adicionales capturadas para mostrar el total que quedará.
        const ocurrencias = (Number(operario.OCURRENCIAS) || 0) + (Number(operario.ADICIONALES) || 0);
        const existente = fila.CAUSAS.find(c => c.ID_CAUSA === causa.ID_CAUSA);
        if (existente) existente.OCURRENCIAS += ocurrencias;
        else fila.CAUSAS.push({ ID_CAUSA: causa.ID_CAUSA, NOMBRE: causa.NOMBRE, OCURRENCIAS: ocurrencias });
        fila.TOTAL += ocurrencias;
      }
    }
  }
  return [...porOperario.values()];
}

/**
 * Exportación de Consulta (plan §10.1, DP-1): una fila por operario y causa, con documento, fecha de registro,
 * fecha del evento, quién registró (nombre), producto, parte, causa, operario, proceso y ocurrencias. Las causas
 * salen completas del detalle (no de la cadena recortada CAUSAS de la consulta). Una causa sin operarios (origen Cliente) sale en
 * una fila con el operario y las ocurrencias vacíos, para que el registro no desaparezca del archivo.
 */
export function filasExportacion(registros: readonly Cal001RegistroCompleto[]): Cal001FilaExportacion[] {
  const filas: Cal001FilaExportacion[] = [];
  for (const { REGISTRO: r, PARTES, NOMBRE_USUARIO_CREA } of registros) {
    for (const parte of PARTES) {
      const nombreParte = parte.ID_PARTE
        ? [parte.ID_PARTE, parte.NOMBRE_PARTE, parte.PIEZA].filter(Boolean).join(' · ')
        : `Producto completo · ${parte.PIEZA ?? ''}`.trim();
      for (const causa of parte.CAUSAS) {
        const base = {
          DOCUMENTO: r.DOCUMENTO, ORIGEN: r.ORIGEN === 'CLIENTE' ? 'Cliente' : 'Producción',
          FECHA_REGISTRO: (r.FECHA_REGISTRO ?? '').replace('T', ' ').substring(0, 16),
          FECHA_EVENTO: (r.FECHA_EVENTO ?? '').substring(0, 10),
          REGISTRADO_POR: String(NOMBRE_USUARIO_CREA ?? '').trim() || r.USUARIO_CREA, PRODUCTO: r.PRODUCTO, NOMBRE_PRODUCTO: r.NOMBRE_PRODUCTO ?? '',
          PARTE: nombreParte, CAUSA: causa.ID_CAUSA, NOMBRE_CAUSA: causa.NOMBRE
        };
        if (!causa.OPERARIOS.length) {
          filas.push({ ...base, OPERARIO: '', NOMBRE_OPERARIO: '', PROCESO: '', OCURRENCIAS: null });
          continue;
        }
        for (const operario of causa.OPERARIOS) {
          filas.push({ ...base, OPERARIO: operario.ID_EMPLEADO, NOMBRE_OPERARIO: operario.NOMBRE,
            PROCESO: operario.DESCRIPCION_SECCION ?? '', OCURRENCIAS: operario.OCURRENCIAS });
        }
      }
    }
  }
  return filas;
}
