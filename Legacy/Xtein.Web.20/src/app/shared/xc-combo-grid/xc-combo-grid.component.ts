import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxCheckBoxModule, DxDataGridModule, DxDropDownBoxComponent, DxDropDownBoxModule, DxFormModule, DxPopupModule } from 'devextreme-angular';
import { Observable, Subject, Subscription } from 'rxjs';
import { XcGridComponent } from './xc-grid/xc-grid.component';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-xc-combo-grid',
  templateUrl: './xc-combo-grid.component.html',
  styleUrls: ['./xc-combo-grid.component.css'],
  standalone: true,
  imports: [DxDropDownBoxModule, DxDataGridModule, DxButtonModule, DxCheckBoxModule,
            CommonModule, XcGridComponent, DxPopupModule, MatTabsModule, DxFormModule
           ]
})

export class XcComboGridComponent implements OnInit, OnChanges {
  @ViewChild("tabsGrid", { static: false }) tabsGrid: MatTabGroup;
  @ViewChild("ddBoxGrid", { static: false }) ddBoxGrid: DxDropDownBoxComponent;


  datosConfigGrid: any;
  DDatosGrid: any;
  DDatosGridAlt: any;
  valorItemSelecc: any;
  readOnly: boolean;
  container: string;
  nombreDropDown: string;
  titGrid: string;
  titGrid2: string;
  rowsSelectedGridAlt: any;
  seleccActiva: boolean = false;

  private eventsSubscription: Subscription;
  eventsSubjectGrid: Subject<any> = new Subject<any>();
  eventsSubjectGridAlt: Subject<any> = new Subject<any>();
  popupVisible: boolean = false;
  popUpGrid: any;
  rowsSelectedGrid: any;
  formData: any = { DESCUENTO: 0};
  formItems: any[] = [];
  fieldsConfig: any[] = [];

  @Input() events: Observable<any>;

  @Output() onRespuestaSelecc = new EventEmitter<any>;

  dropDownOptions = { width: 600,
    height: 400,
    hideOnParentScroll: true,
    container: '#router-container'
  };
  dropWidth: number = 600;
  dropHeight: number = 400;
  popWidth: number = 600;
  popHeight: number = 400;

  constructor() {
  }

  onValueChanged(e: any) {
    if (e.value === null) {
      this.valorItemSelecc = [];
    }
  }
  onOpened(e: any) {
    setTimeout(() => {
      const hd = 400; //e.component.element().scrollHeight;
      const heightGrid = { height: hd - (this.container !== 'tab' ? 60 : 120) };
      if (this.container === 'tab') {
        var cont;
        if (this.tabsGrid.selectedIndex === 0)
          cont = document.getElementById("tabContaGrid")!;
        else
          cont = document.getElementById("tabContaGrid2")!;
        cont.style.height = this.dropHeight - 120 + "px";
      }
      if (this.datosConfigGrid.style) {
        if (this.datosConfigGrid.style.width) {
          this.dropWidth = this.datosConfigGrid.style.width;
          this.popWidth = this.datosConfigGrid.style.width;
          this.dropDownOptions =  { ...this.dropDownOptions, width: this.datosConfigGrid.style.width };
        }
        if (this.datosConfigGrid.style.height) {
          this.dropHeight = this.datosConfigGrid.style.height;
          this.popHeight = this.datosConfigGrid.style.height;
          this.dropDownOptions =  { ...this.dropDownOptions, height: this.datosConfigGrid.style.height };
        }
      }
      else {
        this.dropWidth = 600;
        this.dropHeight = 400;
      }
      this.datosConfigGrid = { ...this.datosConfigGrid, height: heightGrid };
      // this.eventsSubjectGrid.next(heightGrid);
      this.eventsSubjectGrid.next(this.datosConfigGrid);
      if (this.datosConfigGrid.datosAlt)
        this.eventsSubjectGridAlt.next(this.datosConfigGrid.datosAlt);
    }, 300);
  }

  onSeleccRows(e) {
    this.rowsSelectedGrid = e;
    this.valorItemSelecc = e;
  }
  onSeleccRowsAlt(e) {
    this.rowsSelectedGridAlt = e;
  }
  cerrarLista(e, accion, templateData) {
    if (accion === 'aceptar') {
      const datprm = { rowsSelected: this.rowsSelectedGrid,
                       accion,
                       rowsSelectedAlt: this.rowsSelectedGridAlt,
                       formData: this.formData,
                       titulo: this.titGrid
                     }
      this.onRespuestaSelecc.emit(datprm);
      if (this.container === 'dropdown')
        this.ddBoxGrid.instance.close();
    }
    else {
      const datprm = { accion }
      this.onRespuestaSelecc.emit(datprm);
    }
    this.popupVisible = false;
  }

  // Muestr las tasas solo seleccionadas
  onSoloSelecc(e) {
    if (this.datosConfigGrid.modoSelection) {
      if (this.datosConfigGrid.modoSelection === 'multiple')
        this.eventsSubjectGrid.next({ soloSelecc: e.value });
    }
    if (this.datosConfigGrid.datosAlt) {
      if (this.datosConfigGrid.datosAlt.modoSelection === 'multiple')
        this.eventsSubjectGridAlt.next({ soloSelecc: e.value });
    }

  }

  onShown(e:any) {

    if (this.datosConfigGrid.style) {
      if (this.datosConfigGrid.style.width) {
        this.popWidth = this.datosConfigGrid.style.width;
      }
      if (this.datosConfigGrid.style.height) {
        this.popHeight = this.datosConfigGrid.style.height;
      }
    }
    else {
      this.popWidth = 600;
      this.popHeight = 400;
    }

  }
  onHidden(e:any) {
    this.popupVisible = false;
  }
  onInitializedPopUp(e: any) {
    this.popUpGrid = e.component;
  }
  onResizeEnd(e: any) {
    setTimeout(() => {
      if (this.container === 'tab') {
        var cont;
        if (this.tabsGrid.selectedIndex === 0)
          cont = document.getElementById("tabContaGrid")!;
        else
          cont = document.getElementById("tabContaGrid2")!;
        cont.style.height = this.dropHeight - 20 + "px";
      }
      // let popupHeight = Number(this.popUpGrid.option("height"))?? this.dropHeight;
      // this.eventsSubjectGrid.next({ heightPopUp: popupHeight-100 });
    }, 300);
  }

  onTabChanged(e:any){
    switch (e.index) {
      case 0:
        let cont = document.getElementById("tabContaGrid")!;
        cont.style.height = this.dropHeight - 50 + "px";
        break;

      case 1:
        let cont2 = document.getElementById("tabContaGrid2")!;
        cont2.style.height = this.dropHeight - 50 + "px";
        break;

      case 2:
        break;

      default:
        break;
    }
  }


  ngOnInit(): void {
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      // this.DDatosGrid = datos.dataSource;
      this.container = datos.container;
      this.popupVisible = this.container.match('popup|tab') ? true : false;
      this.datosConfigGrid = datos;
      this.fieldsConfig = datos.fieldsConfig ?? [];
      this.formItems = this.buildFormItems(this.fieldsConfig);

      setTimeout(() => {
        this.titGrid = datos.titGrid;
        if (this.container.match('popup|tab'))
          this.eventsSubjectGrid.next(datos);
        if (datos.datosAlt) {
          this.titGrid2 = datos.datosAlt.titGrid;
          this.eventsSubjectGridAlt.next(datos.datosAlt);
        }
        if (datos.style) {
          if (datos.style.width) {
            this.dropWidth = datos.style.width;
          }
          if (datos.style.height) {
            this.dropHeight = datos.style.height;
          }
        }
        if (this.container === 'tab') {
          var cont;
          if (this.tabsGrid.selectedIndex === 0)
            cont = document.getElementById("tabContaGrid")!;
          else
            cont = document.getElementById("tabContaGrid2")!;
          cont.style.height = this.dropHeight - 50 + "px";
        }
      }, 300);
    });
  }
  ngAfterViewInit(): void {

  }
  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  ngOnChanges(): void {

  }

  private buildFormItems(fields: any[]): any[] {
    const editorMap: Record<string, string> = {
      number: 'dxNumberBox',
      date: 'dxDateBox',
      string: 'dxTextBox',
      boolean: 'dxCheckBox',
      select: 'dxSelectBox'
    };

    return fields.map(f => ({
      dataField: f.dataField,
      editorType: editorMap[f.type] ?? 'dxTextBox',
      label: { text: f.label ?? f.dataField },
      isRequired: !!f.required,
      readOnly: f.readOnly,
      editorOptions: this.buildEditorOptions(f)
    }));
  }

  private buildEditorOptions(f: any): any {
    switch (f.type) {
      case 'number':
        return { showSpinButtons: false };
      case 'date':
        return { displayFormat: 'dd/MM/yyyy', useMaskBehavior: true };
      case 'select':
        return {
          dataSource: f.options?.dataSource ?? [],
          displayExpr: f.options?.displayExpr ?? 'text',
          valueExpr: f.options?.valueExpr ?? 'value'
        };
      default:
        return {};
    }
  }

}
