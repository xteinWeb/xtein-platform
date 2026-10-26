import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { XteinApiClientService, type XteinApiRequest } from '@xtein/api-client';
import { XTEIN_LOG_SCOPE } from '@xtein/logging';
import { borradorDesdeRegistro } from '../utils/cal-001-modelo';
import { borradorProduccion, registroGuardado } from '../testing/cal-001.fixtures';
import { Cal001Service } from './cal-001.service';

/** Lista blanca del contrato §1.3: cada acción solo por su ruta. */
const ListaBlanca: Record<string, string[]> = {
  '/CAL001N/consulta': ['causas', 'productos', 'partes producto', 'operarios', 'clientes', 'listas cliente', 'permisos', 'consulta', 'consulta registro', 'historial'],
  '/CAL001N/save': ['new', 'update'],
  '/CAL001N/foto-subir': ['foto agregar'],
  '/CAL001N/foto': ['foto ruta'],
  '/CAL001N/foto-retirar': ['foto retirar']
};

describe('Cal001Service: ruta ↔ acción', () => {
  it('cada método llama su acción por la ruta que la admite, autenticado y en JSON', async () => {
    const peticiones: XteinApiRequest[] = [];
    const respuesta = (accion: string): unknown => {
      if (accion === 'foto ruta') return { data: { MIME: 'image/jpeg', BASE64: 'QUJD' } };
      if (accion === 'consulta') return { data: '[{"TOTAL":0,"PAGINA":1,"TAMANO":50,"FILAS":[]}]' };
      return { data: '[{"ID_REGISTRO_NC":1,"ID_FOTO_NC":1,"DOCUMENTO":"NC-0001","VERSION":1,"PRODUCTO":"PF-1","SIN_PARTES":0,"PARTES":[],"PUEDE_VER":1,"PUEDE_CREAR":1,"ES_GESTOR":0,"AREAS_DETECCION":[],"FUENTES":[],"ErrMensaje":""}]' };
    };
    TestBed.configureTestingModule({ providers: [Cal001Service,
      { provide: XTEIN_LOG_SCOPE, useValue: { ID_APLICACION: 'CAL-001', MICROFRONTEND_ID: 'MFE-CAL' } },
      { provide: XteinApiClientService, useValue: { execute: (r: XteinApiRequest) => { peticiones.push(r); return of(respuesta(r.action)); } } }] });
    const servicio = TestBed.inject(Cal001Service);

    await servicio.permisos(); await servicio.causas(); await servicio.productos('pf'); await servicio.partesProducto('PF-1');
    await servicio.operarios('a'); await servicio.clientes('b'); await servicio.listasCliente();
    await servicio.consulta({ FECHA_DESDE: '2026-10-01', FECHA_HASTA: '2026-10-26', ORIGEN: '', DOCUMENTO: '' }, 1);
    await servicio.registro(1); await servicio.historial(1);
    await servicio.guardar(borradorProduccion());
    await servicio.guardar(borradorDesdeRegistro(registroGuardado(), null));
    await servicio.subirFoto(1, 'a.jpg', 'QUJD'); await servicio.foto(1); await servicio.retirarFoto(1, '');

    const usadas = peticiones.map(p => `${p.endpoint} ${p.action}`);
    expect(usadas).toEqual([
      '/CAL001N/consulta permisos', '/CAL001N/consulta causas', '/CAL001N/consulta productos', '/CAL001N/consulta partes producto',
      '/CAL001N/consulta operarios', '/CAL001N/consulta clientes', '/CAL001N/consulta listas cliente', '/CAL001N/consulta consulta',
      '/CAL001N/consulta consulta registro', '/CAL001N/consulta historial', '/CAL001N/save new', '/CAL001N/save update',
      '/CAL001N/foto-subir foto agregar', '/CAL001N/foto foto ruta', '/CAL001N/foto-retirar foto retirar'
    ]);
    for (const p of peticiones) {
      expect(ListaBlanca[p.endpoint]).toContain(p.action);
      expect(p.accessMode).toBe('authenticated');
    }
    expect(peticiones[12].data).toEqual({ ID_REGISTRO_NC: 1, NOMBRE_ORIGINAL: 'a.jpg', BASE64: 'QUJD' });
  });
});
