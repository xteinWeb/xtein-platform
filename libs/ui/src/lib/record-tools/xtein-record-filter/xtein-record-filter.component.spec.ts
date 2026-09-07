import { XteinRecordFilterComponent } from './xtein-record-filter.component';
import { XteinRecordFilterResult } from './models/xtein-record-filter.model';

// The tests verify the emitted backend contract without instantiating browser widgets.
vi.mock('devextreme-angular', () => Object.fromEntries([
  'DxButtonModule', 'DxButtonComponent', 'DxCheckBoxModule', 'DxCheckBoxComponent',
  'DxDataGridModule', 'DxDataGridComponent', 'DxDateBoxModule', 'DxDateBoxComponent',
  'DxPopupModule', 'DxPopupComponent', 'DxSelectBoxModule', 'DxSelectBoxComponent',
  'DxTagBoxModule', 'DxTagBoxComponent', 'DxTextBoxModule', 'DxTextBoxComponent',
  'DxTemplateDirective', 'DxoPagingComponent', 'DxoPagerComponent', 'DxiColumnComponent'
].map(name => [name, class {}])));
vi.mock('devextreme/data/data_source', () => ({ default: class {} }));
vi.mock('devextreme/data/custom_store', () => ({ default: class {} }));
vi.mock('devextreme-angular/core', () => ({ DxTemplateDirective: class {} }));
vi.mock('devextreme-angular/ui/nested', () => ({
  DxoPagingComponent: class {}, DxoPagerComponent: class {}, DxiColumnComponent: class {}
}));

describe('Record filter query criteria', () => {
  let component: XteinRecordFilterComponent;
  let result: XteinRecordFilterResult | undefined;

  beforeEach(() => {
    component = new XteinRecordFilterComponent({} as never, {} as never);
    component.tableBase = 'CONFIG_ORIGEN_DATO';
    component.fields = [{
      TITULO: 'Nombre', CAMPO: 'NOMBRE', DATA_TYPE: 'texto',
      TABLA: 'CONFIG_ORIGEN_DATO', VALOR: ''
    }];
    result = undefined;
    component.search.subscribe(value => result = value);
  });

  it('includes the entered name in the structured query sent to MAD-005', () => {
    component.setValue(component.fields[0], 'Artdecom');
    component.executeSearch();
    expect(result?.ESTRUCTURA).toEqual([
      { CAMPO: 'NOMBRE', EXPRESION: 'Artdecom', TABLA: 'CONFIG_ORIGEN_DATO' }
    ]);
  });

  it.each([undefined, '', '   '])('uses the base table when field TABLA is %s', table => {
    component.fields[0].TABLA = table;
    component.setValue(component.fields[0], 'ArtdecomPdn');
    component.executeSearch();
    expect(result?.ESTRUCTURA).toEqual([
      { CAMPO: 'NOMBRE', EXPRESION: 'ArtdecomPdn', TABLA: 'CONFIG_ORIGEN_DATO' }
    ]);
  });

  it('preserves a configured table different from the base table', () => {
    component.fields[0].TABLA = 'TABLA_RELACIONADA';
    component.setValue(component.fields[0], 'ArtdecomPdn');
    component.executeSearch();
    expect(result?.ESTRUCTURA[0].TABLA).toBe('TABLA_RELACIONADA');
  });

  it('keeps the latest typed value and removes a cleared criterion', () => {
    component.setValue(component.fields[0], 'Art');
    component.setValue(component.fields[0], 'Artdecom');
    component.executeSearch();
    expect(result?.ESTRUCTURA[0].EXPRESION).toBe('Artdecom');
    component.setValue(component.fields[0], '');
    component.executeSearch();
    expect(result?.ESTRUCTURA).toEqual([]);
  });
});

describe('Filter editor row synchronization', () => {
  it('submits a value entered on a detached grid row', () => {
    const component = new XteinRecordFilterComponent({} as never, {} as never);
    component.fields = [{ TITULO: 'Nombre', CAMPO: 'NOMBRE', DATA_TYPE: 'texto', TABLA: 'CONFIG_ORIGEN_DATO', VALOR: '' }];
    const row = { ...component.fields[0] };
    let result: XteinRecordFilterResult | undefined;
    component.search.subscribe(value => result = value);
    component.setValue(row, 'Artdecom');
    component.executeSearch();
    expect(result?.ESTRUCTURA).toEqual([{ CAMPO: 'NOMBRE', EXPRESION: 'Artdecom', TABLA: 'CONFIG_ORIGEN_DATO' }]);
    component.setValue(row, '');
    component.executeSearch();
    expect(result?.ESTRUCTURA).toEqual([]);
  });
});
