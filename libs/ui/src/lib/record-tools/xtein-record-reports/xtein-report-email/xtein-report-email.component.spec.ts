import { XteinReportEmailComponent } from './xtein-report-email.component';

vi.mock('devextreme-angular', () => Object.fromEntries([
  'DxButtonModule', 'DxButtonComponent', 'DxTextBoxModule', 'DxTextBoxComponent'
].map(name => [name, class {}])));
vi.mock('devextreme-angular/ui/text-area', () => ({ DxTextAreaModule: class {}, DxTextAreaComponent: class {} }));

describe('Report email confirmation', () => {
  it('requires valid recipients and an explicit submit before emitting', () => {
    const component = new XteinReportEmailComponent();
    const send = vi.fn();
    component.send.subscribe(send);
    component.defaults = { ASUNTO: 'Informe' };
    component.ngOnInit();
    expect(send).not.toHaveBeenCalled();
    component.form.controls.DESTINO_EMAIL.setValue('incorrecto');
    component.submit();
    expect(send).not.toHaveBeenCalled();
    component.form.controls.DESTINO_EMAIL.setValue('one@example.com; two@example.com');
    component.submit();
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      DESTINO_EMAIL: 'one@example.com, two@example.com', ASUNTO: 'Informe'
    }));
  });

  it('does not submit twice while a request is pending', () => {
    const component = new XteinReportEmailComponent();
    const send = vi.fn();
    component.send.subscribe(send);
    component.form.patchValue({ ASUNTO: 'Informe', DESTINO_EMAIL: 'one@example.com' });
    component.busy = true;
    component.ngOnChanges();
    component.submit();
    expect(send).not.toHaveBeenCalled();
    expect(component.form.disabled).toBe(true);
  });
});
