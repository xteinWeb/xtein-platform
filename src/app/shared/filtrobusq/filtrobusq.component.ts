import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DxAccordionModule, DxButtonModule, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxDateBoxComponent, DxDateBoxModule, DxDropDownBoxModule, DxPopoverModule, DxPopupComponent, DxPopupModule, DxSelectBoxModule, DxTextBoxComponent, DxTextBoxModule } from 'devextreme-angular';
import dxDateBox from 'devextreme/ui/date_box';
import { catchError, lastValueFrom, Observable, Subject, Subscription, takeUntil, throwError } from 'rxjs';
import { GeneralesService } from '../../services/generales/generales.service';
import Swal from 'sweetalert2';
import { SfiltroService } from '../filtro/_sfiltro.service';
import { GlobalVariables } from '../common/global-variables';
import dxDataGrid from 'devextreme/ui/data_grid';
import dxTextBox from 'devextreme/ui/text_box';
import { FiltroaplComponent } from './filtroapl/filtroapl.component';
import { libtools } from 'src/app/shared/common/libtools';

@Component({
    selector: 'app-filtrobusq',
    templateUrl: './filtrobusq.component.html',
    styleUrls: ['./filtrobusq.component.css'],
    imports: [DxPopupModule, DxDataGridModule, DxDateBoxModule, DxTextBoxModule, DxCheckBoxModule, DxSelectBoxModule, DxAccordionModule, DxButtonModule, FiltroaplComponent, DxPopoverModule]
})
export class FiltrobusqComponent implements OnInit {

  @ViewChild("txtBusquedaFiltro", { static: false }) txtBusquedaFiltro: DxTextBoxComponent;
  @ViewChild("popUpFiltro", { static: false }) popUpFiltro: DxPopupComponent;
  // @ViewChild("gridDatosCon", { static: false }) gridDatosCon: DxDataGridComponent;

  gridDatosCon: any;
  opciones: string[] = ["Filtro de la aplicacion"];
  busqButton: any;
  filtroBusqueda: string = '';
  dataResConsulta: any[] = [];
  popupVisible = false;
  subscription: Subscription;
  modo: string = 'rapida';
  datosFiltro: any;
  totalNumDatos: number;
  ltool: any;
  patrones: any[] = [];
  filtroModo: string = "Filtro personalizado"

  prmConsulta: any = { TABLA: "", ID_APLICACION: "", USUARIO: "" };

  private eventsSubscription: Subscription;
  eventsSubjectFiltroApl: Subject<any> = new Subject<any>();

  @Input() events: Observable<any>;

  @Input() visible: boolean;

  @Output() onRespuestaSelecc = new EventEmitter<any>;


  constructor(private _sgenerales: GeneralesService, 
    public datepipe: DatePipe,
    public SFiltro: SfiltroService) 
  {

    this.busqButton = {
      icon: 'search',
      type: 'default',
      onClick: (e) => {
        this.ejecBusqueda();
      },
    };

    this.onKeyDownBusq = this.onKeyDownBusq.bind(this);
    this.customizeColumns = this.customizeColumns.bind(this);
  
  }

  ejecBusqueda() {
  }

  // Ejecución de la búsqueda
  async onKeyDownBusq(e) {
    // this._sgenerales
    // .consulta('consulta', prmQ, 'deepConsulta')
    // .subscribe((data: any) => {
    //   const res = JSON.parse(data.data);
    //   this.dataResConsulta = res;
    // });
    const prmQ = { PRM: this.prmConsulta, FILTRO: this.filtroBusqueda }
    const apiRest = this._sgenerales.consulta('deepConsulta', prmQ, 'generales');
    let res = await lastValueFrom(apiRest, {defaultValue: true});
    res = JSON.parse(res.data); 
    this.dataResConsulta = res;
    this.popUpFiltro.instance.option("height", "340");
    this.gridDatosCon.option("height",250);
    this.totalNumDatos = this.dataResConsulta.length; 

    // setTimeout(() => {
    //   const regex = new RegExp(this.filtroBusqueda, 'gi');
    //   let txth = document.getElementById("resB");
    //   var cells = txth?.getElementsByTagName("td"); 
 
    //   for (var i = 0; i < cells!.length; i++) { 
    //     var cellValue = cells![i].innerHTML; // or cells[i].textContent 
    //     cellValue = cellValue.replace(/(<mark class="highlight">|<\/mark>)/gim, '');
    
    //     const newText = cellValue.replace(regex, '<mark class="highlight">$&</mark>');
    //     cells![i].innerHTML = newText;

    //   } 

    // }, 500);
    // e.event.preventDefault();


  }

  onShown(e: any) {
    if (this.txtBusquedaFiltro == undefined) return;
    this.txtBusquedaFiltro.instance.focus();
  }
  onInitialized(e: any) {
    this.gridDatosCon = e.component;  
  }

  // Selecciona dato y va a aplicacion a consultar
  onRowClick(e: any) {
    // Librería que se encarga de cargar aplicacion con filtro
    const filtro =  { ID_APLICACION: this.datosFiltro.aplicacion, 
                      FILTRO: '{ "ESTRUCTURA": ['+e.data.EXPR_CON+'] }'
                    }
    this.ltool = new libtools(this.datosFiltro.objRegistro, this.datosFiltro.objTab);
    const compoApl = { ID_APLICACION: this.datosFiltro.aplicacion,
                       TABLA: this.datosFiltro.TablaBase,
                       user: this.datosFiltro.usuario,
                       FILTRO: filtro.FILTRO,
                       title: this.datosFiltro.title
                     }
    this.ltool.abrirApl(compoApl, 'consulta'); 
    this.popupVisible = false;

  }

  onResizeEnd(e: any) {
    let popupHeight = Number(this.popUpFiltro.instance.option("height"))?? 340;
    if (this.modo == 'avanzada') {
      this.eventsSubjectFiltroApl.next({ accion: 'resize', height: popupHeight });
    }
    else {
      this.gridDatosCon.option("height",popupHeight-90);
    }
  }

  clickModo(e: any) {
    // Muestra grid del filtro
    this.modo = this.modo === 'rapida' ? 'avanzada' : 'rapida';
    let popupHeight = Number(this.popUpFiltro.instance.option("height"))?? 340;

    // Re-dimensiona
    if (this.modo == 'avanzada') {
      if (popupHeight < 340) {
        popupHeight = 340;
        this.popUpFiltro.instance.option("height", "340");
      }
      // Llama a la grid del filtro de la tabla
      this.datosFiltro = {...this.datosFiltro, height: popupHeight };
      setTimeout(() => {
        this.eventsSubjectFiltroApl.next(this.datosFiltro);
      }, 300);
      this.filtroModo = "Filtro dinámico"
    }
    else {
      // this.popUpFiltro.instance.option("height", "110");
      setTimeout(() => {
        this.gridDatosCon.option("height",popupHeight-90);
        this.txtBusquedaFiltro.instance.focus();
      }, 300);
      this.filtroModo = "Filtro personalizado"
    }
  }

  customizeColumns(columns: any) {
    if (!this.gridDatosCon) return;
    var items = this.gridDatosCon.getDataSource().items();  
    // let totalItems: any;
    // totalItems = this.gridDatosCon.instance.option("summary.totalItems");
    columns.forEach((col: any)=> {  
      if (typeof items[0][col.dataField] === "number") {
        col.dataType = "number";
        col.format = "#,###";
        // if (col.dataField !== 'Anteriores') {
        //   totalItems = [...totalItems, 
        //                   { column: col.dataField, 
        //                     summaryType:"sum",
        //                     displayFormat:"{0}",
        //                     valueFormat:"#,###"} ];
        //   this.gridDatosCon.instance.option("summary.totalItems", totalItems);
        // }
        // col.columns = [];
        // col.columns.push({dataField: col.dataField + '_Total'});  
      } 

      if(col.dataField === "EXPR_CON" || col.dataField === "ITEM"){  
        col.visible = false;
      }
      col.caption = "";
 
    })  
  }
  selectionGrid(e) {
    // this.filasSelecc = e.selectedRowKeys;
  }
  onToolbarPreparing(e:any): void {
  }

  // Si aplicó filtro por campos
  onRespuestaFiltro(e: any) {
    // Librería que se encarga de cargar aplicacion con filtro
    const filtro =  { ID_APLICACION: this.datosFiltro.aplicacion, 
                      FILTRO: e
                    }
    this.ltool = new libtools(this.datosFiltro.objRegistro, this.datosFiltro.objTab);
    const compoApl = { ID_APLICACION: this.datosFiltro.aplicacion,
                       TABLA: this.datosFiltro.TablaBase,
                       user: this.datosFiltro.usuario,
                       FILTRO: filtro.FILTRO,
                       title: this.datosFiltro.title
                     }
    this.ltool.abrirApl(compoApl, 'consulta'); 
    this.popupVisible = false;

  }

  ngOnInit(): void { 

    this.eventsSubscription = this.events.subscribe((datos: any) => {
      if (datos.accion == 'activar') {
        this.popupVisible = true;        
        this.prmConsulta.TABLA = datos.TablaBase;
        this.prmConsulta.ID_APLICACION = datos.aplicacion;
        this.prmConsulta.USUARIO = datos.usuario;
        this.datosFiltro = datos;

        // Carga patrones de búsqueda
        this._sgenerales.consulta('claves consulta', this.prmConsulta,'generales').subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje != "")
            this.patrones = [];
          else
            this.patrones = res;
          
        });

      }
    });
  }

  ngAfterViewInit() {
    const grid:any = document.getElementById("gridDatosCon");
    this.gridDatosCon = dxDataGrid.getInstance(grid) as dxDataGrid;
  }
  ngOnDestroy(){
    this.eventsSubscription.unsubscribe();
  }

}
