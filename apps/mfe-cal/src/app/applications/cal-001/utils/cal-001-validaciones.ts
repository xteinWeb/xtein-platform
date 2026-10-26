import { Cal001Limits, Cal001Origen } from '../constants/cal-001.constants';
import type { Cal001Borrador, Cal001ParteBorrador } from '../models/cal-001.model';
import { esFechaValida } from './cal-001-fecha';

/** Caracteres de cp1252 por encima de 0xFF (los únicos que VARCHAR Latin1_General conserva fuera de Latin-1). */
const ExtrasCp1252 = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');

/** N_SERVICIO se guarda en VARCHAR(50): un carácter fuera de cp1252 se rechaza (E21), no se altera. */
export function cabeEnCp1252(texto: string): boolean {
  for (const caracter of texto) {
    const codigo = caracter.codePointAt(0) ?? 0;
    if (codigo > 0xff && !ExtrasCp1252.has(caracter)) return false;
  }
  return true;
}

function etiquetaParte(parte: Cal001ParteBorrador): string {
  return parte.ID_PARTE ? `${parte.ID_PARTE} · ${parte.NOMBRE_PARTE}` : 'Producto completo';
}

/** Partes que se envían al guardar: las que tienen al menos una no conformidad. */
export function partesConCausas(borrador: Cal001Borrador): Cal001ParteBorrador[] {
  return borrador.PARTES.filter(parte => parte.CAUSAS.length > 0);
}

/**
 * Valida el borrador con las mismas reglas del SP (contrato §2.3, reglas 1-10) para avisar antes de enviar.
 * Devuelve la lista de problemas en orden; vacía = se puede guardar. El SP vuelve a validar todo.
 */
export function validarBorrador(borrador: Cal001Borrador, hoy: string, accion: 'new' | 'update'): string[] {
  const errores: string[] = [];
  const cliente = borrador.ORIGEN === Cal001Origen.Cliente;

  if (borrador.ORIGEN !== Cal001Origen.Produccion && !cliente) errores.push('Elija el origen: Producción o Cliente.');
  if (!borrador.PRODUCTO) errores.push('Elija el producto (PF).');
  const cantidad = borrador.CANTIDAD_REFERENCIA;
  if (cantidad !== null && (!Number.isFinite(cantidad) || cantidad < 0 || Number(cantidad.toFixed(2)) !== cantidad)) {
    errores.push('La cantidad de referencia debe ser un número mayor o igual a 0, con máximo 2 decimales.');
  }
  if (!esFechaValida(borrador.FECHA_EVENTO)) errores.push('La fecha del evento es obligatoria.');
  else if (borrador.FECHA_EVENTO > hoy) errores.push('La fecha del evento no puede ser posterior a hoy.');
  if (borrador.OBSERVACION.length > Cal001Limits.Observation) {
    errores.push(`La observación supera ${Cal001Limits.Observation} caracteres.`);
  }
  if (accion === 'update' && borrador.MOTIVO.length > Cal001Limits.Reason) {
    errores.push(`El motivo de la modificación supera ${Cal001Limits.Reason} caracteres.`);
  }

  if (cliente) {
    const faltan = ([
      ['ID_CLIENTE', 'Cliente'], ['N_SERVICIO', 'Número de servicio'], ['ID_AREA_DETECCION', 'Área de detección'],
      ['FUENTE', 'Fuente'], ['FECHA_RECLAMO', 'Fecha del reclamo'], ['ID_CAUSA_CLIENTE', 'Causa del cliente']
    ] as const).filter(([campo]) => !String(borrador[campo] ?? '').trim()).map(([, etiqueta]) => etiqueta);
    if (faltan.length) errores.push(`Datos de la garantía obligatorios: ${faltan.join(', ')}.`);
    if (borrador.N_SERVICIO.length > Cal001Limits.ServiceNumber) errores.push('El número de servicio supera 50 caracteres.');
    else if (!cabeEnCp1252(borrador.N_SERVICIO)) errores.push('El número de servicio tiene caracteres no permitidos.');
    if (borrador.FECHA_RECLAMO && !esFechaValida(borrador.FECHA_RECLAMO)) errores.push('La fecha del reclamo no es válida.');
    else if (borrador.FECHA_RECLAMO > hoy) errores.push('La fecha del reclamo no puede ser posterior a hoy.');
  }

  const partes = partesConCausas(borrador);
  if (borrador.PRODUCTO && !partes.length) errores.push('Agregue al menos una no conformidad en una parte del producto.');
  if (partes.length > Cal001Limits.Parts) errores.push(`Máximo ${Cal001Limits.Parts} partes por registro.`);
  // Una Pieza escrita en una parte sin no conformidades no se guardaría: se avisa en vez de descartarla en silencio.
  for (const parte of borrador.PARTES) {
    if (!parte.CAUSAS.length && parte.PIEZA.trim()) {
      errores.push(`${etiquetaParte(parte)}: tiene Pieza escrita pero ninguna no conformidad; agregue una o borre la pieza.`);
    }
  }

  for (const parte of partes) {
    const etiqueta = etiquetaParte(parte);
    if (parte.PIEZA.length > Cal001Limits.Piece) errores.push(`${etiqueta}: la pieza supera ${Cal001Limits.Piece} caracteres.`);
    if (!parte.ID_PARTE && !parte.PIEZA.trim()) errores.push('Producto completo: escriba la pieza afectada.');
    if (parte.CAUSAS.length > Cal001Limits.CausesPerPart) errores.push(`${etiqueta}: máximo ${Cal001Limits.CausesPerPart} no conformidades.`);
    const causasVistas = new Set<string>();
    for (const causa of parte.CAUSAS) {
      if (!causa.ID_CAUSA) { errores.push(`${etiqueta}: elija la no conformidad.`); continue; }
      if (causasVistas.has(causa.ID_CAUSA)) errores.push(`${etiqueta}: la no conformidad ${causa.ID_CAUSA} está repetida.`);
      causasVistas.add(causa.ID_CAUSA);
      if (!cliente && !causa.OPERARIOS.length) {
        errores.push(`${etiqueta} · ${causa.ID_CAUSA}: en Producción cada no conformidad necesita al menos un operario.`);
      }
      if (causa.OPERARIOS.length > Cal001Limits.OperatorsPerCause) {
        errores.push(`${etiqueta} · ${causa.ID_CAUSA}: máximo ${Cal001Limits.OperatorsPerCause} operarios.`);
      }
      const operariosVistos = new Set<string>();
      for (const operario of causa.OPERARIOS) {
        const nombre = operario.NOMBRE || operario.ID_EMPLEADO;
        if (operariosVistos.has(operario.ID_EMPLEADO)) errores.push(`${etiqueta} · ${causa.ID_CAUSA}: el operario ${nombre} está repetido.`);
        operariosVistos.add(operario.ID_EMPLEADO);
        const ocurrencias = operario.OCURRENCIAS;
        if (ocurrencias === null || !Number.isInteger(ocurrencias) || ocurrencias < Cal001Limits.MinOccurrences || ocurrencias > Cal001Limits.MaxOccurrences) {
          errores.push(`${nombre}: las ocurrencias deben ser un entero de 1 a 999.`);
        }
        if (!operario.ID_SECCION) errores.push(`${nombre}: elija el proceso (no tiene una única sección principal).`);
      }
    }
  }
  return errores;
}
