import type {
  Cal001Borrador, Cal001Causa, Cal001Operario, Cal001PartesProducto, Cal001RegistroCompleto
} from '../models/cal-001.model';
import { borradorVacio, operarioDesdeMaestro, partesDesdeProducto } from '../utils/cal-001-modelo';

/** Datos de prueba de CAL-001 (no se usan en la aplicación). */
export const HoyPrueba = '2026-10-26';

export const CausasPrueba: Cal001Causa[] = [
  { ID_CAUSA: 'NC-01', NOMBRE: 'Grado', DESCRIPCION: 'Corte de la madera en grado que no sea de acuerdo a lo especificado', TIPO: 'PRODUCCION' },
  { ID_CAUSA: 'NC-02', NOMBRE: 'Arenilla', DESCRIPCION: 'Arenilla', TIPO: 'PRODUCCION' },
  { ID_CAUSA: 'NC-03', NOMBRE: 'Mal acabado', DESCRIPCION: 'Acabado con poros, escurridos o brillo desigual en pintura', TIPO: 'PRODUCCION' },
  { ID_CAUSA: 'RC-01', NOMBRE: 'Durabilidad del material', DESCRIPCION: 'Durabilidad del material', TIPO: 'CLIENTE' }
];

export const PartesPrueba: Cal001PartesProducto = {
  PRODUCTO: 'PF-2201', SIN_PARTES: 0,
  PARTES: [
    { ID_PARTE: 'PA-501', ITEM_PRODUCTO_PARTE: 1, NOMBRE: 'Tapa superior', CANTIDAD: 1 },
    { ID_PARTE: 'PA-504', ITEM_PRODUCTO_PARTE: 2, NOMBRE: 'Frente cajón superior', CANTIDAD: 1 }
  ]
};

export const OperarioPrueba: Cal001Operario = {
  ID_EMPLEADO: '1001', NOMBRE: 'Óscar Villa', ID_SECCION_SUGERIDA: 'S10',
  SECCIONES: [{ ID_SECCION: 'S10', DESCRIPCION: 'Ebanistería', PRINCIPAL: 1 }]
};

export const OperarioPrueba2: Cal001Operario = {
  ID_EMPLEADO: '1002', NOMBRE: 'Diana Mesa', ID_SECCION_SUGERIDA: 'S20',
  SECCIONES: [{ ID_SECCION: 'S20', DESCRIPCION: 'Pintura', PRINCIPAL: 1 }]
};

/** Registro de Producción válido: PA-501 con NC-01 (2 operarios) y NC-02 (1 operario). */
export function borradorProduccion(): Cal001Borrador {
  const borrador = borradorVacio(HoyPrueba);
  borrador.PRODUCTO = 'PF-2201';
  borrador.NOMBRE_PRODUCTO = 'Nochero Duna';
  borrador.CANTIDAD_REFERENCIA = 6;
  borrador.PARTES = partesDesdeProducto(PartesPrueba);
  borrador.PARTES[0].PIEZA = 'Tapa con chapilla roble';
  borrador.PARTES[0].CAUSAS = [
    { ID_CAUSA_NC: null, ID_CAUSA: 'NC-01', NOMBRE: 'Grado', DESCRIPCION: '', OPERARIOS: [
      { ...operarioDesdeMaestro(OperarioPrueba), OCURRENCIAS: 2 },
      { ...operarioDesdeMaestro(OperarioPrueba2), OCURRENCIAS: 1 }
    ] },
    { ID_CAUSA_NC: null, ID_CAUSA: 'NC-02', NOMBRE: 'Arenilla', DESCRIPCION: '', OPERARIOS: [
      { ...operarioDesdeMaestro(OperarioPrueba2), OCURRENCIAS: 3 }
    ] }
  ];
  return borrador;
}

/** Garantía de Cliente sin operarios (historia 6, ajuste 2). */
export function borradorCliente(): Cal001Borrador {
  const borrador = borradorProduccion();
  borrador.ORIGEN = 'CLIENTE';
  borrador.ID_CLIENTE = '900123';
  borrador.NOMBRE_CLIENTE = 'Hogar Pradera S.A.S.';
  borrador.N_SERVICIO = 'SV-3307';
  borrador.ID_AREA_DETECCION = 'Visita al cliente';
  borrador.FUENTE = 'Visita técnica';
  borrador.FECHA_RECLAMO = '2026-10-15';
  borrador.ID_CAUSA_CLIENTE = 'RC-01';
  borrador.PARTES[0].CAUSAS = borrador.PARTES[0].CAUSAS.map(causa => ({ ...causa, OPERARIOS: [] }));
  return borrador;
}

/** Registro guardado (respuesta de `consulta registro`). */
export function registroGuardado(cambios: Partial<Pick<Cal001RegistroCompleto, 'PUEDE_MODIFICAR' | 'PUEDE_AGREGAR_FOTOS' | 'PUEDE_RETIRAR_FOTOS'>> = {}): Cal001RegistroCompleto {
  return {
    REGISTRO: {
      ID_REGISTRO_NC: 7, DOCUMENTO: 'NC-0007', ORIGEN: 'PRODUCCION', PRODUCTO: 'PF-2201', NOMBRE_PRODUCTO: 'Nochero Duna',
      CANTIDAD_REFERENCIA: 6, FECHA_EVENTO: '2026-10-20', FECHA_REGISTRO: '2026-10-20T09:15:00', OBSERVACION: 'Lote revisado',
      ID_CLIENTE: null, NOMBRE_CLIENTE: null, N_SERVICIO: null, ID_AREA_DETECCION: null, FUENTE: null, FECHA_RECLAMO: null,
      ID_CAUSA_CLIENTE: null, NOMBRE_CAUSA_CLIENTE: null, ESTADO: 'REGISTRADO', USUARIO_CREA: 'INSPECTOR',
      FECHA_CREA: '2026-10-20T09:15:00', USUARIO_MODIFICA: null, FECHA_MODIFICA: null, VERSION: 1
    },
    PARTES: [{
      ID_PARTE_NC: 10, ITEM: 1, ID_PARTE: 'PA-501', ITEM_PRODUCTO_PARTE: 1, NOMBRE_PARTE: 'Tapa superior', PIEZA: 'Tapa',
      CAUSAS: [{ ID_CAUSA_NC: 20, ID_CAUSA: 'NC-01', NOMBRE: 'Grado', DESCRIPCION: 'Corte de la madera',
        OPERARIOS: [{ ID_OPERARIO_NC: 30, ID_EMPLEADO: '1001', NOMBRE: 'Óscar Villa', OCURRENCIAS: 2, ID_SECCION: 'S10', DESCRIPCION_SECCION: 'Ebanistería' }] }]
    }],
    FOTOS: [],
    HISTORIAL: [{ VERSION: 1, ACCION: 'CREAR', USUARIO: 'INSPECTOR', FECHA: '2026-10-20T09:15:00' }],
    PUEDE_MODIFICAR: 0, PUEDE_AGREGAR_FOTOS: 0, PUEDE_RETIRAR_FOTOS: 0,
    ...cambios
  };
}
