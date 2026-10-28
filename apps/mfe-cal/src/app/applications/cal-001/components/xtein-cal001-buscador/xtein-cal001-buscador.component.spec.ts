import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { type Cal001OpcionBusqueda, XteinCal001BuscadorComponent } from './xtein-cal001-buscador.component';

describe('XteinCal001BuscadorComponent', () => {
  let fixture: ComponentFixture<XteinCal001BuscadorComponent<string>>;
  const buscar = vi.fn<(texto: string) => Promise<Cal001OpcionBusqueda<string>[]>>();

  beforeEach(() => {
    buscar.mockReset();
    buscar.mockResolvedValue([{ valor: '1234567890', codigo: '1234567890', nombre: 'Operario de prueba' }]);
    fixture = TestBed.createComponent(XteinCal001BuscadorComponent<string>);
    fixture.componentRef.setInput('buscar', buscar);
    fixture.detectChanges();
  });
  afterEach(() => fixture.destroy());

  const boton = (): HTMLButtonElement => fixture.nativeElement.querySelector('.cs-boton');

  it('al abrir el panel el foco queda en el campo de búsqueda', async () => {
    boton().click();
    fixture.detectChanges();
    await fixture.whenStable();
    const campo = fixture.nativeElement.querySelector('.cs-buscar') as HTMLInputElement;
    expect(campo).toBeTruthy();
    expect(document.activeElement).toBe(campo);
  });

  it('marca el panel del buscador para dar ancho a la cédula', async () => {
    boton().click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.cs-panel').classList).toContain('cs-buscador');
  });

  it('Escape cierra el panel', async () => {
    boton().click();
    fixture.detectChanges();
    const campo = fixture.nativeElement.querySelector('.cs-buscar') as HTMLInputElement;
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cs-panel')).toBeNull();
  });
});
