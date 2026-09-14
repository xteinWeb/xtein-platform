import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxDataGridComponent, DxDataGridModule, DxLoadPanelModule, DxTooltipComponent, DxTooltipModule, DxTreeListModule } from 'devextreme-angular';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { PRO029Service } from 'src/app/services/PRO029/PRO029.service';
import { showToast } from '../../../../shared/toast/toastComponent';
import { validatorRes } from 'src/app/shared/validator/validator';
import { on } from 'devextreme/events';

@Component({
  selector: 'app-PRO0290201',
  templateUrl: './PRO0290201.component.html',
  styleUrls: ['./PRO0290201.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxLoadPanelModule, DxTooltipModule, DxTreeListModule]
})
export class PRO0290201Component {
  
  @ViewChild("gridTablaDetalles", { static: false }) gridTablaDetalles: DxDataGridComponent;
  @ViewChild("tooltipInfoDetalles", { static: false }) tooltipInfoDetalles: DxTooltipComponent;  

  datosPass: Subject<any> = new Subject<any>();
  @Input() events: Observable<any>;
  @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();

  private eventsSubscription: Subscription;

  DGdetalles:any [] = [];
	columnVisibles: any = [];
  dataProducto: any = {};

  readOnly: boolean = true;
	loadingVisible: boolean = false;

  toolTipVisible: boolean = false;
  targetIdTooltip: string;
  tooltipTitulo: string;
  tooltipInfo: any = [];
  wrapperAttr = { class: "cls-tooltip-reg" };

  constructor(
    private sData: PRO029Service
  ) {
    this.addColumn = this.addColumn.bind(this);
    this.onCellPrepared = this.onCellPrepared.bind(this);
    this.selectCellTemplate = this.selectCellTemplate.bind(this);
  }

  ngOnInit(): void {
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.accion) {
        case 'init':
          // this.ACCION_LOCAL = datos.accion;
          // this.loadDataInit(datos);
          // this.readOnly = datos.readOnly;
          break;
          
        case 'consulta':
          // this.ACCION_LOCAL = datos.accion;
          // this.loadDataInit(datos);
          break;
          
        case 'Load Data':
          // this.readOnly = datos.readOnly;
          // this.ACCION_LOCAL = datos.accion;
          // this.loadDataInit(datos);
          // this.addColumn(datos.dataSource);
          if (this.DGdetalles.length === 0) {
            this.dataProducto = {
              PRODUCTO: datos.dataSource.PRODUCTO,
              NC_PEDIDO: datos.dataSource.CONSECUTIVO,
              ID_PEDIDO: datos.dataSource.ID_PEDIDO
            }
            this.valoresObjetos('consulta detalles', datos.dataSource);

          } else if (this.DGdetalles.length > 0 && 
            (this.DGdetalles[0].PRODUCTO !== datos.dataSource.PRODUCTO &&
            this.DGdetalles[0].NC_PEDIDO !== datos.dataSource.CONSECUTIVO &&
            this.DGdetalles[0].ID_PEDIDO !== datos.dataSource.ID_PEDIDO
          )) {
            this.dataProducto = {
              PRODUCTO: datos.dataSource.PRODUCTO,
              NC_PEDIDO: datos.dataSource.CONSECUTIVO,
              ID_PEDIDO: datos.dataSource.ID_PEDIDO
            }
            this.valoresObjetos('consulta detalles', datos.dataSource);
          }
          break;

        default:
          break;
      }
    });
  }

  ngOnDestroy() {
    // this.subscription.unsubscribe();
  }


  loadDataInit(data:any) {
    switch (data.accion) {
      case 'init':
        
        break;
        
      case 'consulta':
        
        break;

      case 'Load Data':
        this.loadingVisible = true;
        this.addColumn(data.dataSource);
        break;
    
      default:
        break;
    }
  }


  addColumn(data:any) {
    const dataSoruce:any = data;
		this.DGdetalles = [];
		let columns:any = [];
    var newArray:any = [];
    if (this.columnVisibles.length === 0)
      this.columnVisibles = this.gridTablaDetalles.instance.getVisibleColumns();
    const Index = this.gridTablaDetalles.instance.getVisibleColumns().findIndex((col: any) => col.dataField === 'NOMBRE_PARTE');
    for (let i = 0; i < dataSoruce.length; i++) {
      var element = dataSoruce[i];
      //Agrega Columnas de Atributos
      if (element.ATRIBUTOS !== undefined) {
				element.ATRIBUTOS.forEach((atr:any) => {
					const nomCol = atr.CODIGO?.toUpperCase();
          const desAtr = atr.CODIGO === 'SIN' ? 'SIN' : atr.CLASE.charAt(0).toUpperCase() + atr.CLASE.slice(1).toLowerCase();
          const exis = columns.indexOf(nomCol);
					if (exis === -1) {
						columns.push({
              dataField: nomCol,
              caption: desAtr,
              alignment: 'left',
              visible: true,
              allowHeaderFiltering: false,
              visibleIndex: Index + 1
            });
					}
					element = {...element, [nomCol]:atr.VALOR};
				});
			};
      //Agrega Columnas de Secciones
      if (element.SECCIONES.length > 0) {
        element.SECCIONES.forEach((secc:any) => {
          if (secc.ID_SECCION !== undefined) {
            const nomCol = secc.ID_SECCION?.toUpperCase();
            const desSecc = secc.NOMBRE_SECCION.charAt(0).toUpperCase() + secc.NOMBRE_SECCION.slice(1).toLowerCase();
            const exis = columns.indexOf(nomCol);
            if (exis === -1) {
              columns.push({
                visible: true,
                dataField: nomCol,
                caption: desSecc,
                allowGrouping: false,
                allowHeaderFiltering: false,
                visibleIndex: Index + 1,
                cellTemplate: 'cellContenidoSeccion',
              });
            };
            element = {...element, [nomCol]:secc.NOMBRE_SECCION};
          };
        });
      }
      newArray.push(element);
    };
		
    this.DGdetalles = newArray;
    columns.forEach((col:any) => {
      const columnVisibles:any [] = this.gridTablaDetalles.instance.getVisibleColumns();
      const indexColumn:any = columnVisibles.findIndex((d:any) => d.dataField === col.dataField);
      if (indexColumn === -1)
        this.gridTablaDetalles.instance.addColumn(col);
    });
	}

  onCellPrepared(e:any) {
    if (e.rowType === "data") {
      const indexColumn:any = this.columnVisibles.findIndex((d:any) => d.caption === 'Secciones');
      const ownerBand:any = this.columnVisibles[indexColumn].index;
      if (ownerBand === e.column.ownerBand) {
        on(e.cellElement, "mouseover", (arg:any) => {
          const temData:any [] = e.data.SECCIONES.filter((d:any) => d.ID_SECCION === e.column.dataField);
          if(temData.length > 0)
            // if(temData.length > 0 && temData[0].CANTIDAD > 0)
            this.tooltipInfo = [{...temData[0], ORDEN_PRO: e.data.ORDEN_PRO}];
          if (this.tooltipInfo.length === 0) {
            this.tooltipInfo = [{ErrMesaje:'La sección no pertence a la ruta del producto.'}];
          }
          this.tooltipInfoDetalles.instance.show(arg.target);
        });
        on(e.cellElement, "mouseout", (arg:any) => {
          this.tooltipInfoDetalles.instance.hide();
          this.tooltipInfo = [];
          this.tooltipInfo = [{ErrMesaje:'La sección no pertence a la ruta del producto.'}];
        });
      }
    }
  }

  selectCellTemplate(cellInfo:any, template:any) {
    var res:boolean = false;
    var datos:any = '';
    const pos:any = cellInfo.data.SECCIONES.findIndex((d:any) => d.ID_SECCION === cellInfo.column.dataField);
    switch (template) {
      case 'No Contenido':
        if (pos <= -1)
          res = true;
        break;

      case 'Start Seccion':
        if (pos > -1) {
          if (cellInfo.data.SECCIONES[pos].ESTADO === 'REGISTRADO' || cellInfo.data.SECCIONES[pos].ESTADO === 'PROGRAMADO') {
            if (cellInfo.data.SECCIONES[pos].ORDEN_SECC === 0 || cellInfo.data.SECCIONES[pos].ORDEN_SECC === 1)
              res = true;
          }else
            res = false;
        }
        else
          res = false;
        break;

      case 'Finish Seccion':
        if (pos > -1 && cellInfo.data.SECCIONES[pos].ESTADO === 'FINALIZADO') {
          res = true;
        }
        else
          res = false;
        break;
  
      case 'Process Seccion':
        if (pos > -1) {
          if (cellInfo.data.SECCIONES[pos].ESTADO === 'EN PROCESO') {
            res = true;
          }
          else
            res = false;
        }
        else
          res = false;
      break;
    
      default:
        res = false;
        break;
    }

    return of(res);
  }

  valoresObjetos(obj: string, datos:any) { 
    if (obj === 'consulta detalles' || obj === 'todos') {
      const prm = { ID_PEDIDO: datos.ID_PEDIDO, NC_PEDIDO: datos.CONSECUTIVO, PRODUCTO: datos.PRODUCTO };
      this.loadingVisible = true;
      this.sData.consulta('CONSULTA DETALLES', prm, 'PRO-029').subscribe((data: any)=> {
        const res = validatorRes(data);
        this.loadingVisible = false;
        if(res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        } else {
          // this.DAgenda = res;
          this.addColumn(res);
        }
      });
    };
  }


}
