import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DxButtonModule, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxDateBoxComponent, DxDateBoxModule, DxDropDownBoxModule, DxPopupModule, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import dxDateBox from 'devextreme/ui/date_box';
import { catchError, lastValueFrom, Subject, Subscription, takeUntil, throwError } from 'rxjs';
import { GeneralesService } from '../../services/generales/generales.service';
import Swal from 'sweetalert2';
import { SfiltroService } from './_sfiltro.service';
import { GlobalVariables } from '../common/global-variables';
import dxDataGrid from 'devextreme/ui/data_grid';
import { SearchboxComponent } from '../searchbox/searchbox.component';
import DataSource from 'devextreme/data/data_source';
import CustomStore from 'devextreme/data/custom_store';

interface clsDataSource {
    [key: string]: any; // Esto permite nombres extra no definidos arriba
}

@Component({
    selector: 'app-filtro',
    templateUrl: './filtro.component.html',
    styleUrls: ['./filtro.component.scss'],
    imports: [DxPopupModule, DxDataGridModule, DxDateBoxModule, DxTextBoxModule, DxCheckBoxModule, DxSelectBoxModule, DxDropDownBoxModule, DxButtonModule, SearchboxComponent]
})
export class FiltroComponent implements OnInit, OnDestroy {
  @ViewChild("Visorfiltro", { static: false }) Visorfiltro: DxDataGridComponent;
  @ViewChild("popUpFiltro", { static: false }) popUpFiltro: DxDataGridComponent;
  @ViewChild("dFechaDesde", { static: false }) dfFechaDesde: DxDateBoxComponent;
  @ViewChild("dFechaHasta", { static: false }) dfFechaHasta: DxDateBoxComponent;
  @ViewChild("gridBoxFiltro", { static: false }) gridBoxFiltro: DxDataGridComponent;

  public _unsubscribeAll: Subject<any>;

  dataSources: clsDataSource = {};
  gridFiltro: any;
  DFiltro: any;
  readonly: boolean = false;
  allowedPageSizes: any[] = [5, 10, 20, 50, 100, 'all'];
  pageSize = 50;
  archExcelLiq: string = "";
  titFiltro: string = "";
  Grupo: string[] = [];
  Filtro: any;
  TablaBase: any;
  aplicacion: any;
  popupVisible = false;
  subscription: Subscription;
  initVisor: boolean = false;
  modeSelection: string = '';
  checkBoxesMode: string = '';
  colsconfig: any;
  fechaDesde: any;
  fechaHasta: any;
  gridBoxValue: string[] = [];
  gridSeleccObj: any[] = [];
  dropDownOptions = { width: 800, height: 400 };

  // Alert de mensajes
  displayModal: boolean = false;
  errMsg: string = "";
  errTit: string = "";

  constructor(private _sgenerales: GeneralesService,
    public datepipe: DatePipe,
    public SFiltro: SfiltroService)
  {
    this._unsubscribeAll = new Subject();

    this.subscription = this.SFiltro.getObsFiltro.subscribe((datvisor) => {
      // Procesa solo la aplicación activa
      /*if (GlobalVariables.idAplicacionActiva !== this.SFiltro.PrmFiltro.aplicacion) {
        return;
      }*/

      this.popupVisible = datvisor;
      this.DFiltro = this.SFiltro.DatosFiltro;
      this.Filtro = this.SFiltro.PrmFiltro.Filtro;
      this.TablaBase = this.SFiltro.PrmFiltro.TablaBase;
      this.titFiltro = this.SFiltro.PrmFiltro.Titulo;
      this.aplicacion = this.SFiltro.PrmFiltro.aplicacion;
      this.cargarDatos(this.SFiltro.PrmFiltro.accion);
    });

    this.aceptarCambios = this.aceptarCambios.bind(this);
    this.onEditingStart = this.onEditingStart.bind(this);
    this.cargarDatos = this.cargarDatos.bind(this);
    this.cargaDatosLista = this.cargaDatosLista.bind(this);
    this.onValueChangedLista = this.onValueChangedLista.bind(this);

  }

  onToolbarPreparing(e: any) {
    // let toolbarItems = e.toolbarOptions.items;

    // e.toolbarOptions.items.unshift(
    //   {
    //       location: 'before',
    //       template: 'titVisordatos'
    //   }
    // );
  }

  onResizeEnd(e: any) {
    let popupHeight = Number(this.popUpFiltro.instance.option("height"))?? 400;
    this.gridFiltro.option("height",popupHeight-100);
  }
  // Seleccion de fila
  onSeleccRegistro(e: any): void {
    // this.popupVisible = false;
    this.SFiltro.setObsFiltro.emit(e.data);
  }
  // Manejo de booleanos
  onValueChangedBool(e:any) {
    if (e.component.skipOnValueChanged) {
      e.component.skipOnValueChanged = false;
      return;
    }
    if (e.component.setUndefinedNextTime) {
      e.component.setUndefinedNextTime = false;
      e.component.skipOnValueChanged = true;
      e.component.option("value", undefined);
      return;
    }
    if (e.value == false) {
      e.component.setUndefinedNextTime = true;
    }
  }

  onRespuestaAutosearch(e: any, cellInfo: any) {
    cellInfo.setValue(e);
  }

  cargarDatos(accion: string) {
    const prm = { TABLA_BASE: this.TablaBase }
    this._sgenerales.columnas(prm)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (data: any)=> {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DFiltro = res;
          this.DFiltro.forEach((filt:any) => {
            if (filt.DATA)

              // Si es una lista, carga los datos
              if (filt.DATA_TYPE == "lista")
                // filt.DATA = JSON.parse(filt.DATA);
                this.cargaDatosLista(filt.CAMPO, filt.DATA);

              // Si es otra lista
              if (filt.DATA_TYPE == "listauni")
                filt.DATA = JSON.parse(filt.DATA);

              // Si es una autosearch, la especificación
              if (filt.DATA_TYPE == "searchbox") {
                const n = filt.DATA.indexOf('|');
                if (n != -1)
                  filt.DATA = filt.DATA.substring(n+1);
              }
          });

          this.gridBoxValue = [];
          this.gridSeleccObj = [];
        },
        error: (err => {
          this.showModal('Error cargue de filtro columnas: '+err.message);
        })
      });
  }

  // Carga datos para listas de selección
  cargaDatosLista(campo: string, data: any) {

    this.dataSources["D_"+campo] = new CustomStore({
      key: 'KEY_COL',

      load: (loadOptions: any) => {
        const skip = loadOptions.skip || 0;
        const take = loadOptions.take || 50;
        const page = (loadOptions.skip || 0) / (loadOptions.take || this.pageSize) + 1;
        const pageSizeTmp = loadOptions.take || this.pageSize;
        const searchValue = loadOptions.searchValue || '';

        let textoBusqueda = '';
        if (loadOptions.filter) {
          // Buscamos el primer elemento que sea un array y extraemos el tercer valor (el texto)
          const filterArray = loadOptions.filter;
          if (Array.isArray(filterArray[0])) {
              textoBusqueda = filterArray[0][2];
          } else {
              // Si es un filtro simple
              textoBusqueda = filterArray[2];
          }
        }

        const prm = { ID_APLICACION : 'generales',
                      USUARIO: localStorage.getItem('usuario'),
                      SKIP: skip,
                      TAKE: take,
                      SEARCH: textoBusqueda,
                      DATA: data,
                      CAMPO: campo,
                      PAGE: page,
                      PAGESIZE: pageSizeTmp
                    };

        return lastValueFrom(
          this._sgenerales.consulta('listaQuery', prm, 'generales'), {defaultValue: true}
        ).then((result) => {
          const total = JSON.parse(result.data)[0].TotalCount || 0;
          const items = JSON.parse(result.data) || [];
          return {
            data: items,
            totalCount: total
          };
        }).catch(error => {
          console.error('Error loading data:', error);
          throw error;
        });
      },

      byKey: (key: any) => {
        // Cargar un item específico por su clave
        return lastValueFrom(
          this._sgenerales.consulta('listaQuery', '{'+key+'}', 'generales')
        ).then(result => {
          const items = JSON.parse(result.data) || [];
          return {
              data: items,
              totalCount: items[0].TotalCount
            };
          }
        );
      }
    });

    // this.dataSources["D_"+campo] = new DataSource({ store });

  }


  onContentReady(e: any) {
    var i = 0;
    /*this.Grupo.forEach((ele:any) => {
      e.component.columnOption(ele, "groupIndex", i);
      i++;
    })*/
    setTimeout(() => {
      this.onResizeEnd(undefined);
    }, 500);
  }
  onShown(e: any) {
    /*var i = 0;
    this.Grupo.forEach((ele:any) => {
      this.gridFiltro.instance.columnOption(ele, "groupIndex", i);
      i++;
    })*/
  }
  onInitialized(e: any) {
    this.gridFiltro = e.component;
    this.gridBoxValue = [];
  }
  setFiltroValor (rowData: any, value: any, currentRowData: any) {
    rowData.VALOR = value;
  }
  onValueFechaDesde(e: any, campo: string, cellInfo: any) {
    var dato = this.DFiltro.filter((c:any) => c.CAMPO == campo);
    if (dato !== undefined) {
      const fd = this.datepipe.transform(e.value, 'MM/dd/yyyy');
      this.fechaDesde = fd??"";
      const datoCell = fd + (this.fechaHasta !== "" && this.fechaHasta !== undefined ? " - " + this.fechaHasta : "");
      cellInfo.setValue(datoCell);
    }
  }
  onValueFechaHasta(e: any, campo: string, cellInfo: any) {
    var dato = this.DFiltro.filter((c:any) => c.CAMPO == campo);
    if (dato !== undefined) {
      const fh = this.datepipe.transform(e.value, 'MM/dd/yyyy');
      this.fechaHasta = fh??"";
      const datoCell = (this.fechaDesde !== "" && this.fechaDesde !== undefined ? this.fechaDesde + " - " : "") + fh;
      cellInfo.setValue(datoCell);
    }
  }
  onIniFechaDesde(e: any, valor: any) {
    let element = document.getElementById("dFechaDesde")!;
    let instance = dxDateBox.getInstance(element) as dxDateBox;
    const fini = valor.trim().split('-')[0];
    instance.option('value',fini);
  }
  onIniFechaHasta(e: any, valor: any) {
    let element = document.getElementById("dFechaHasta")!;
    let instance = dxDateBox.getInstance(element) as dxDateBox;
    const ffin = valor.trim().split('-')[1];
    instance.option('value',ffin);
  }
  onEditorPreparing(e: any) {
    this.dfFechaDesde.instance.option('value',this.fechaDesde);
  }
  onEditingStart(e: any) {
    //his.dfFechaDesde.instance.option('value',this.fechaDesde);
    //this.dfFechaHasta.instance.option('value',this.fechaHasta);
    //let element = document.getElementById("dFechaDesde")!;
    //let instance = dxDateBox.getInstance(element) as dxDateBox;

    /*this.esEdicionFila = true;
    this.bodegasFila = e.data["BODEGAS"];
    this.filaProcesada = e.data;
    const prm = { PRODUCTO : e.data.PRODUCTO, BODEGAS : this.DFacturas.BODEGAS };
    this._sdatos.getDatosProm('CONSULTA ATRIBUTOS PRODUCTO', prm).then((data: any) => {
      const res = JSON.parse(data);
      this.GLAtributos = res[0].PARTES;
      this.GLColores = res[0].ATRIBUTOS;
    });*/

    // Pre-seleccionados
    if (this.gridSeleccObj.findIndex(s => s.CAMPO === e.data.CAMPO) === -1)
      this.gridBoxValue = [];
    else {
      const ix = this.gridSeleccObj.findIndex(s => s.CAMPO === e.data.CAMPO);
      this.gridBoxValue = this.gridSeleccObj[ix].VALOR;
    }

  }
  aceptarCambios(e: any) {
    // Acepta cambios
    this.gridFiltro.saveEditData();

    // Esperar aceptacion de cambios
    setTimeout(() => {

      // Construye filtro
      let datFiltro = "";
      let jFiltro:any = []
      this.DFiltro.forEach((element:any) => {
        if (element.DATA_TYPE !== "smalldatetime") {
          if (element.VALOR !== "") {
            if (!Array.isArray(element.VALOR)) {
              // Array de valores manual
              if (element.VALOR.indexOf(';') != -1) element.VALOR = "['"+element.VALOR.replace(';',"','")+"']";
              datFiltro = datFiltro + (datFiltro !== "" && element.VALOR !== "" ? " AND " : "") +
                          (element.VALOR !== "" ? element.CAMPO + "='" + element.VALOR + "'": "");
              jFiltro.push({ CAMPO: element.CAMPO, EXPRESION: element.VALOR, TABLA: element.TABLA });
            }
            else {
              datFiltro = datFiltro + (datFiltro !== "" && element.VALOR !== "" ? " AND " : "") +
                          (element.VALOR !== "" ? element.CAMPO + "='" + JSON.stringify(element.VALOR) + "'": "");
              jFiltro.push({ CAMPO: element.CAMPO, EXPRESION: JSON.stringify(element.VALOR), TABLA: element.TABLA });
            }
          }
        }
        else {
          if (element.VALOR.indexOf('-') !== -1) {
            datFiltro = datFiltro + (datFiltro !== "" && element.VALOR !== "" ? " AND " : "") +
                        (element.VALOR !== ""
                        ? element.CAMPO + " BETWEEN '" + element.VALOR.split('-')[0].trim() + "' AND '" + element.VALOR.split('-')[1].trim() + "'"
                        : "");
            if (element.VALOR !== "")
              jFiltro.push({ CAMPO: element.CAMPO,
                            EXPRESION: element.VALOR.split('-')[0].trim() + ".." + element.VALOR.split('-')[1].trim(),
                            TABLA: element.TABLA });
          }
          else {
            datFiltro = datFiltro + (datFiltro !== "" && element.VALOR !== "" ? " AND " : "") +
                        (element.VALOR !== "" ? element.CAMPO + "='" + element.VALOR + "'": "");
            if (element.VALOR !== "") {
              if (!Array.isArray(element.VALOR))
                jFiltro.push({ CAMPO: element.CAMPO, EXPRESION: element.VALOR, TABLA: element.TABLA });
              else
                jFiltro.push({ CAMPO: element.CAMPO, EXPRESION: JSON.stringify(element.VALOR), TABLA: element.TABLA });
            }
          }
        }

      });
      this.popupVisible = false;
      const rtaFiltro = JSON.stringify({ FILTRO : datFiltro, ESTRUCTURA: jFiltro, aplicacion: this.aplicacion });
      this.SFiltro.setObsFiltro.emit(rtaFiltro);

    }, 300);

  }

  cancelarCambios(e: any) {
    this.popupVisible = false;
    this.SFiltro.enConsulta = false;
  }

  onSelectionChanged(e: any, templateData: any, campo: any): void {
    var keys = e.selectedRowKeys;
    // templateData.option('value', keys);

    // Guardar histórico
    // if (this.gridSeleccObj.findIndex(s => s.CAMPO === campo) === -1)
    //   this.gridSeleccObj.push({ CAMPO: campo, VALOR: keys });
    // else {
    //   const ix = this.gridSeleccObj.findIndex(s => s.CAMPO === campo);
    //   this.gridSeleccObj[ix].VALOR = keys;
    // }
  }
  customizeColumns(columns: any[]) {
    columns.forEach(col => {
        // Ocultar COLS
        if (col.dataField === "ErrMensaje" ||
            col.dataField === "TotalCount" ||
            col.dataField === "RN") {
            col.visible = false;
        }
        if (col.dataField === "KEY_COL") {
            col.width = 130;
            col.caption = "Id";
        }
    });
  }
  onValueChangedLista(e: any, cellInfo: any) {
    if (e.value === null) {
      this.gridBoxValue = [];
    } else
      cellInfo.setValue(cellInfo.value);
  }

  cerrarListaPT(e:any, accion:any, templateData:any, cellInfo:any) {
    if (accion === 'aceptar') {
      // templateData.option('value', this.gridBoxValue);
      cellInfo.setValue(this.gridBoxValue);
      cellInfo.data.VALOR = this.gridBoxValue;
    }
    else {
      this.gridBoxValue = [];
      cellInfo.setValue(this.gridBoxValue);
      cellInfo.data.VALOR = this.gridBoxValue;
    }
    templateData.close();
  }

  ngOnInit(): void {
  }
  ngAfterViewInit() {
    const grid:any = document.getElementById("Visorfiltro");
    this.gridFiltro = dxDataGrid.getInstance(grid) as dxDataGrid;
  }
  ngOnDestroy(): void {
    this._unsubscribeAll.unsubscribe();
    this.subscription.unsubscribe();
  }

  showModal(mensaje:any, titulo = '¡Error!', msg_html= '') {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
      title: titulo,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: "center",
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }
}
