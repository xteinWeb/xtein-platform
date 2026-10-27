import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { Cal001ConsultaFiltro } from '../../models/cal-001.model';
import { filaConsulta } from '../../testing/cal-001.fixtures';
import { XteinCal001ConsultaComponent } from './xtein-cal001-consulta.component';

describe('XteinCal001ConsultaComponent (fase 2)', () => {
  let fixture: ComponentFixture<XteinCal001ConsultaComponent>;
  const filtro: Cal001ConsultaFiltro = { FECHA_DESDE: '2026-10-01', FECHA_HASTA: '2026-10-26', ORIGEN: '', DOCUMENTO: '', ID_EMPLEADO: '' };

  function crear(esGestor: boolean, usuario = 'LAURA'): void {
    TestBed.configureTestingModule({ imports: [XteinCal001ConsultaComponent] });
    fixture = TestBed.createComponent(XteinCal001ConsultaComponent);
    fixture.componentRef.setInput('filtroInicial', filtro);
    fixture.componentRef.setInput('esGestor', esGestor);
    fixture.componentRef.setInput('usuario', usuario);
    fixture.componentRef.setInput('resultado', { TOTAL: 2, PAGINA: 1, TAMANO: 50, FILAS: [
      filaConsulta(),
      filaConsulta({ ID_REGISTRO_NC: 8, DOCUMENTO: 'NC-0008', USUARIO_CREA: 'LAURA', NOMBRE_USUARIO_CREA: 'Laura Gómez', AREA_USUARIO_CREA: null,
        CAUSAS: null })
    ] });
    fixture.detectChanges();
  }

  afterEach(() => fixture?.destroy());

  const elemento = (): HTMLElement => fixture.nativeElement;
  const filas = (): HTMLElement[] => Array.from(elemento().querySelectorAll<HTMLElement>('button.cq-fila'));
  const campoCedula = (): HTMLInputElement | undefined => Array.from(elemento().querySelectorAll('label'))
    .find(l => l.textContent?.includes('Cédula del operario'))?.querySelector('input') ?? undefined;

  it('muestra la columna "No conformidad" con las causas (texto completo en title) y "—" si no hay', () => {
    crear(false);
    expect(elemento().querySelector('.cq-titulos')?.textContent).toContain('No conformidad');
    const causas = filas().map(f => f.querySelector<HTMLElement>('.cq-causas'));
    expect(causas[0]?.textContent?.trim()).toBe('Arenilla, Grado');
    expect(causas[0]?.getAttribute('title')).toBe('Arenilla, Grado');
    expect(causas[1]?.textContent?.trim()).toBe('—');
    expect(causas[1]?.hasAttribute('title')).toBe(false);
  });

  it('"Registrado por" muestra nombre · área con el código en title y conserva "(tú)"', () => {
    crear(false);
    const por = filas().map(f => f.querySelector<HTMLElement>('[data-titulo="Por"]'));
    expect(por[0]?.textContent?.trim()).toBe('Edgardo Alcazar · Producción');
    expect(por[0]?.getAttribute('title')).toBe('1002000697');
    expect(por[0]?.textContent).not.toContain('1002000697');
    expect(por[1]?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Laura Gómez (tú)');
  });

  it('el filtro "Cédula del operario" solo aparece para el gestor', () => {
    crear(false);
    expect(campoCedula()).toBeUndefined();
  });

  it('el gestor filtra por cédula y la búsqueda la envía', () => {
    crear(true);
    const emitidos: Cal001ConsultaFiltro[] = [];
    fixture.componentInstance.buscar.subscribe(f => emitidos.push(f));
    const cedula = campoCedula();
    expect(cedula).toBeDefined();
    cedula!.value = '1002000697';
    cedula!.dispatchEvent(new Event('input'));
    elemento().querySelector('form')!.dispatchEvent(new Event('submit'));
    expect(emitidos[0]).toMatchObject({ ID_EMPLEADO: '1002000697' });
  });
});
