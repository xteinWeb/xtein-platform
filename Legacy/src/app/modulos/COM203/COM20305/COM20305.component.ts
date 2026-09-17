import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DxDataGridModule } from 'devextreme-angular';
import { Observable, Subject, Subscription } from 'rxjs';
import { COM203Service } from 'src/app/services/COM203/COM203.service';
import Swal from 'sweetalert2';
import { clsMovimientos } from '../clsCOM203.class';

@Component({
  selector: 'app-COM20305',
  templateUrl: './COM20305.component.html',
  styleUrls: ['./COM20305.component.css'],
  standalone: true,
  imports: [ DxDataGridModule ]
})
export class COM20305Component {

  eventsSubjectGrid: Subject<any> = new Subject<any>();
  private eventsSubscription: Subscription;
  popupVisible: boolean = false;
  popUpGrid: any;
  componentSbox: any;
  rowsSelected: any[] = [];
  DTotales: any[] = [];

  // Especificaciones y valores defecto
  especMonedaFormato: string = "#,##0.00";
  especCantidadFormato: string = "#,##0.00";
  especModificarOrden: boolean = false; 
  

  @Input() events: Observable<any>;

  @Input() visible: boolean;
  @Input() especAplicacion: any;

  @Output() onRespuestaTotales = new EventEmitter<any>;

  @Input() DMovimientos: clsMovimientos;
  @Output() DMovimientosChange: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private _sdatos: COM203Service,
    private datepipe: DatePipe,
  ) 
    {
    }

  onCellPrepared(e){
    if (e.rowType === 'totalFooter') {
        if (e.summaryItems.length > 0 && e.summaryItems[0].value > 0) {
          e.cellElement.querySelector(".dx-datagrid-summary-item").style.fontSize = '16px';
          e.cellElement.querySelector(".dx-datagrid-summary-item").style.fontWeight = 'bold';
          e.cellElement.querySelector(".dx-datagrid-summary-item").style.color = 'green';
        }
      }
      if (e.rowType === 'data') {
        if (e.data.CONCEPTO == 'Sub total') {
          e.cellElement.style.fontSize = '16px';
          e.cellElement.style.fontWeight = 'bold';
        }
        if (e.data.CONCEPTO == 'Sub total') {
          e.cellElement.style.fontSize = '16px';
          e.cellElement.style.fontWeight = 'bold';
        }
      }

      
  }
  
    
  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined){

    if (obj == 'config' || obj == 'todos') {
      const prm = { CONFIG: opcion,  DATOS: opcion.prmDatos }
      this._sdatos.consulta(opcion.config.accionDatos, prm, 'COM-203').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }

        // Valida si hay datos...
        if (res[0].ErrMensaje !== "") {
          this.showModal(res[0].ErrMensaje);
        }
        else {
          this.eventsSubjectGrid.next({ 
            dataSource: res, 
            rowsSelected: this.rowsSelected,
            keyExpr: opcion.config.keyExpr,   //["ITEM"],
            titGrid: opcion.config.titulo, 
            modoSelection: opcion.config.modoSelection,
            colsConfig: opcion.config.dataConfig, 
            style: { height: opcion.config.height, width: opcion.config.width },
            container: 'popup'
           });
        }
        
      });
    }
 
  }

  // Activa campos de la forma para edición 
  // dependiendo de la acción a realizar
  activarEdicion(accion) {
    switch (accion) {
      case 'consulta':
      case 'inactivo':
        break;
      case 'activo':
      case 'nuevo':
        break;
    
      default:
        break;
    }
  }

  ngOnInit(): void {
    this.eventsSubscription = this.events.subscribe((datos: any) => {

      switch (datos.operacion) {
        case 'ini':
          if(datos.especAplicacion) {
            this.especMonedaFormato = datos.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'FORMATO MONEDA')?.FORMATO ?? '#,##0.00';
          }
          this.DTotales = [{ ITEM: 1, DESCRIPCION: 'Sub total', VALOR: 0}]
          this.DTotales.push({ ITEM: 1, DESCRIPCION: 'Iva', VALOR: 0})
          break;
      
        case 'ver':
          this.DTotales = datos.prmDatos;
          break;

        default:
          break;
      }

      // Inicializa datos
      // this.valoresObjetos('config', datos);

    });

  }

  ngOnDestroy(){
    if (this.eventsSubscription) this.eventsSubscription.unsubscribe();
  }

  showModal(mensaje: any, titulo = '¡Error!', msg_html= '') {
    const tipo = titulo;
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo==='Error' ? 'DF3E3E':'#0F4C81 !important',
			title: titulo,
			text: mensaje,
			allowOutsideClick: true,
			allowEscapeKey: false,
			allowEnterKey: false,
			backdrop: true,
			position: 'center',
      html: msg_html,
			stopKeydownPropagation: false,
		});
	}

}

