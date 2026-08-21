import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DxButtonModule, DxSelectBoxModule } from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import { Observable, Subject, Subscription } from 'rxjs';

@Component({
    selector: 'app-xc-selectbox',
    templateUrl: './xc-selectbox.component.html',
    styleUrls: ['./xc-selectbox.component.css'],
    imports: [DxSelectBoxModule, CommonModule, DxButtonModule]
})
export class XcSelectboxComponent {

  dataSource: any = [];
  dataSourceFull: any = [];
  valueData: string;
  columnData: any[] = [];
  columnCaption: any;
  dataInfo: any;
  style: any = [{ 'width': '40%', 'float': 'left' }, { 'width': '60%', 'float': 'right' }, {}];


  dropDownOptions: any = {
    width: 600,
    height: 400,
    hideOnParentScroll: true,
    container: '#router-container',
    toolbarItems: [{
      location: 'before',
      toolbar: 'top',
      template: 'tempEncab',
    }]
  };

  private eventsSubscription: Subscription;
  eventsSubjectSbox: Subject<any> = new Subject<any>();
  popupVisible: boolean = false;
  popUpGrid: any;
  componentSbox: any;

  @Input() events: Observable<any>;

  @Input() valorDefecto: any;

  @Input() valueExpr: string;

  @Input() displayExpr: any;

  @Input() nombreObj: any;

  @Input() readOnly: any;

  @Input() customValue: boolean;

  @Output() onRespuestaSelecc = new EventEmitter<any>;

  constructor() {
    this.onInitialized = this.onInitialized.bind(this);
  }

  // Asigna cambios de valores de la forma
  onValueChanged(e: any) {
    this.onRespuestaSelecc.emit(e);
  }
  onInitialized(e: any) {
    this.componentSbox = e.component;
  }
  refreshClick() {
    this.onRespuestaSelecc.emit('refrescar');
  }
  addCustomItem(data) {
    if (!data.text) {
      data.customItem = null;
      return;
    }

    const newItem = {
      [this.valueExpr]: data.text
    };

    data.customItem = this.dataSource.store().insert(newItem)
      .then(() => this.dataSource.load())
      .then(() => newItem)
      .catch((error) => {
        throw error;
      });
  }

  ngOnInit(): void {
    this.eventsSubscription = this.events.subscribe((datos: any) => {

      switch (datos) {

        case 'cerrar':
          this.componentSbox.close();
          break;

        case 'reset':
          this.valorDefecto = '';
          this.componentSbox.option("value", "");
          break;

        default:
          if (datos.dataSource) {
            this.dataSourceFull = datos.dataSource;
            this.dataSource = new DataSource({
              store: datos.dataSource,
              paginate: true,
              pageSize: 20
            });
          }
          if (datos.valueExpr) this.valueExpr = datos.valueExpr;
          if (datos.displayExpr) this.displayExpr = datos.displayExpr;
          if (datos.columnData) this.columnData = datos.columnData;
          if (datos.columnCaption) this.columnCaption = datos.columnCaption !== undefined ? datos.columnCaption : datos.columnData;
          if (datos.valueData) this.valueData = datos.valueData;
          if (datos.valorDefecto) {
            this.valorDefecto = datos.valorDefecto;
            this.componentSbox.option("value", datos.valorDefecto);
          }
          if (datos.customValue) this.customValue = datos.customValue;
          if (datos.style) {
            if (datos.style.colWidth) {
              this.style = [{ 'width': datos.style.colWidth[0] + '%', 'float': 'left' },
              { 'width': datos.style.colWidth[1] + '%', 'float': 'right' },
              { 'width': datos.style.colWidth[2] + '%', 'float': 'right' }];
            }
            if (datos.style.width) {
              this.dropDownOptions = { ...this.dropDownOptions, width: datos.style.width };
            }
          }
          if (datos.searchExpr) {
            this.dropDownOptions = { ...this.dropDownOptions, searchExpr: this.columnData };
          }
          setTimeout(() => {
            this.eventsSubjectSbox.next(datos);
          }, 300);
          break;

      }
    });

  }
  ngAfterViewInit(): void {

  }
  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

}
