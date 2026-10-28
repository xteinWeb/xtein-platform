import { TestBed } from '@angular/core/testing';
import type { Cal001HistorialDetalle } from '../../models/cal-001.model';
import { Cal001Service } from '../../services/cal-001.service';
import { XteinCal001HistorialComponent, resumirCambios } from './xtein-cal001-historial.component';

describe('XteinCal001HistorialComponent', () => {
  it('M2: al cambiar de registro limpia el detalle y descarta la respuesta tardía del anterior', async () => {
    let responder: (filas: Cal001HistorialDetalle[]) => void = () => undefined;
    const historial = vi.fn(() => new Promise<Cal001HistorialDetalle[]>(r => { responder = r; }));
    TestBed.configureTestingModule({ imports: [XteinCal001HistorialComponent], providers: [{ provide: Cal001Service, useValue: { historial } }] });
    const fixture = TestBed.createComponent(XteinCal001HistorialComponent);
    const componente = fixture.componentInstance;
    fixture.componentRef.setInput('idRegistro', 1);
    fixture.detectChanges();

    const pendiente = componente.verDetalle();
    fixture.componentRef.setInput('idRegistro', 2);
    fixture.detectChanges();
    responder([{ VERSION: 1, ACCION: 'CREAR', USUARIO: 'A', FECHA: '2026-10-20T09:00:00', MOTIVO: null, DATOS_ANTES: null, DATOS_DESPUES: {} }]);
    await pendiente;
    expect(componente.detalle()).toBeNull();
    expect(componente.cargando()).toBe(false);
    fixture.destroy();
  });

  it('resume los cambios del encabezado y de las partes', () => {
    const cambios = resumirCambios(
      { REGISTRO: { FECHA_EVENTO: '2026-10-20', VERSION: 1 }, PARTES: [{ ID_PARTE: 'PA-1' }] },
      JSON.stringify({ REGISTRO: { FECHA_EVENTO: '2026-10-21', VERSION: 2 }, PARTES: [] }));
    expect(cambios).toEqual(['FECHA_EVENTO: 2026-10-20 → 2026-10-21', 'Partes, no conformidades u operarios modificados.']);
    expect(resumirCambios('{no json', null)).toEqual([]);
  });
});
