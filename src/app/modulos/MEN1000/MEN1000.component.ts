
import { Component, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownButtonModule, DxLoadPanelModule, DxSelectBoxModule, DxTextBoxModule, DxToolbarModule } from 'devextreme-angular';
import { DxoSearchPanelModule } from 'devextreme-angular/ui/nested';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { Workbook } from 'exceljs';
import { lastValueFrom, Subject, Subscription } from 'rxjs';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { exportDataGrid as pdfexport } from 'devextreme/pdf_exporter';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { MEN1000Service } from 'src/app/services/MEN1000/MEN1000.service';
import { showToast } from '../../shared/toast/toastComponent.js';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { FiltrobusqComponent } from 'src/app/shared/filtrobusq/filtrobusq.component';
import { GlobalVariables } from 'src/app/shared/common/global-variables';

@Component({
    selector: 'app-MEN1000',
    templateUrl: './MEN1000.component.html',
    styleUrls: ['./MEN1000.component.css'],
    imports: [DxButtonModule, DxToolbarModule, DxoSearchPanelModule, DxSelectBoxModule, DxDataGridModule, DxTextBoxModule, DxDropDownButtonModule, DxLoadPanelModule, FiltrobusqComponent]
})
export class MEN1000Component {
  
  @ViewChild("gridConsultas", { static: false }) gridConsultas: DxDataGridComponent;

  subscription: Subscription;
  subs_filtro: Subscription;
  
  prmUsrAplBarReg: clsBarraRegistro;
  DConsultas: any [] = [];
  selectConsulta: any = [];
  DAplicaciones:any [] = [];
  filasSelecc: any[] = [];
  
  keyFila: any;
  aplicacion: string;
  filtroDefecto: string;
  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  loadingVisible: boolean = false;
  readOnly: boolean;
  mnuAccion: string;
  parametros: any;
  eventsSubjectFiltro: Subject<any> = new Subject<any>();  

  constructor(
    private _sdatos: MEN1000Service,
		private _sbarreg: SbarraService,
    private tabService: TabService,
    private _sfiltro: SfiltroService,
  ) {
    // Servicio de barra de registro
    this.subscription = this._sbarreg.getObsRegApl().subscribe((datreg) => {
      // Valida si la petición es para esta aplicacion
      // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opMenuRegistro(datreg);
    });

    // Respuesta del filtro
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe(resp => {
      // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.parametros.aplicacion)
        this.opPrepararBuscar(resp);
    })

    this.customizeColumns = this.customizeColumns.bind(this);
    this.valoresObjetos = this.valoresObjetos.bind(this);
  }
  
  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes

    switch (operMenu.accion) {
      case 'r_ini':
      case 'r_apl_hija':
        const user:any = localStorage.getItem('usuario');
        const n_apli:any = this.tabService.tabs.findIndex((c:any) => c.active === true);
        this.aplicacion = this.tabService.tabs[n_apli].title;
        // this.prmUsrAplBarReg = {
        //   tabla: this.parametros.tabla,
        //   aplicacion: this.parametros.aplicacion,
        //   aplicacionBase: '',
        //   usuario: user,
        //   accion: 'r_ini',
        //   error: '',
        //   r_numReg: 0,
        //   r_totReg: 0,
        //   operacion: {},
        // };
        // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_buscar':
        const act_apli:any = this.tabService.tabs.findIndex((c:any) => c.active === true);
        if (GlobalVariables.idAplicacionActiva !== this.tabService.tabs[act_apli].aplicacion)
          return;
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_refrescar':
        this.valoresObjetos('todos', '');
        break;

      default:
        break;
    }
  }

  ngOnInit(): void {
    const user:any = localStorage.getItem('usuario');
    const n_apli:any = this.tabService.tabs.findIndex((c:any) => c.active === true);
    this.aplicacion = this.tabService.tabs[n_apli].title;
    this.prmUsrAplBarReg = {
      tabla: '',
      aplicacion: this.tabService.tabs[n_apli].title,
      usuario: user,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { }
    };

    this.mnuAccion = '';
    this.readOnly = true;
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

  }

  async ngAfterViewInit() { 
    // Valida parámetros
    const n_apli:any = this.tabService.tabs.findIndex((c:any) => c.active === true);
    this.parametros = { prefiltro: false, 
                        aplicacion: this.tabService.tabs[n_apli].title, 
                        tabla: '' };
    // this.valoresObjetos('parametros', this.tabService.tabs[n_apli].title);
    const prm = { aplicacion : this.tabService.tabs[n_apli].title };
    const apiRest = this._sdatos.consulta('parametros', prm, 'MEN-1000');
    const res = await lastValueFrom(apiRest, {defaultValue: true});
    const datRes = JSON.parse(res.data);
    this.parametros = datRes;

    setTimeout(() => {
      const n_apli:any = this.tabService.tabs.findIndex((c:any) => c.active === true);
      if (!this.parametros.prefiltro) 
        this.valoresObjetos(this.aplicacion, this.tabService.tabs[n_apli].title);
      else {
        // Aplica parámetros de aplicacion
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          accion: 'operacion',
          operacion: { r_buscar: true }
        }
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      }
    }, 300);
  }
  ngOnDestroy() { 
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
  }
  
  onSelectionChangedAplicacion(e:any) {

  }

  customizeColumns(columns:any) {
    if (!this.gridConsultas) return;
    var items = this.gridConsultas.instance.getDataSource().items();  
    // let totalItems: any;
    // totalItems = this.gridConsultas.instance.option("summary.totalItems");
    columns.forEach((col: any)=> {
      if(col.dataField.match('NOMBRE')){
        col.width = "250";
      }
      if(col.dataField === "FECHA"){  
        col.dataType = "date"
      }
      if(col.dataField === "ErrMensaje"){  
        col.visible = false;
      }
      if(col.dataField === "ITEM"){  
        col.visible = false;
      }
      if (items && items.length != 0) {
        if (typeof items[0][col.dataField] === "number") {
          col.dataType = "number";
          col.format = "#,###";
        }
      }
    })  
  }

  onCellPrepared(e:any) {
    // if(e.rowType === "data" && e.column.dataField === "Pre-Egreso" ) {
    //   if ( e.data["Pre-Egreso"] !== 0 ) {
    //     e.cellElement.style.background = "lightsalmon" 
    //   }
    // }
  }
  onFocusedRowChanged(e:any){
    const rowData = e.row && e.row.data;
    if (rowData) {
    }
  }

  onCellHoverChanged(e:any) {
    if (e.rowType === "data") {
      if (e.column.dataField.match("DOCUMENTO")) {
        if (e.eventType === "mouseover") {
          e.cellElement.style.color = "blue";
          e.cellElement.style.textDecoration = "underline";
          e.cellElement.style.cursor = "pointer";
        } else {
            e.cellElement.style.color = "initial";
            e.cellElement.style.textDecoration = "none";
            e.cellElement.style.cursor = "auto";
        }
      }
    }
  }

  onCellClick(e:any) {
    if (e.row === undefined) return;

    if (e.row.cells[e.columnIndex].column.dataField === 'ID_ACREEDOR') {
      this.keyFila = e.key;
    }
    if (e.row.cells[e.columnIndex].column.dataField === 'DOCUMENTO') {
      this.keyFila = e.key;
    }

  }

  onContentReady(e:any) {
    // var rowHeader = e.element.getElementsByClassName("dx-header-row");
    // var row1 = e.element.getElementsByClassName("dx-row-lines")[0];  
    // if (row1 == undefined) return;
 
    // rowHeader[0].after(row1); 
    // // Elimina fila de totales
    // const xelim = this.DConsultas.findIndex((p:any) => p.ITEM == -1);
    // if (xelim !== -1)
    //   this.DConsultas.splice(xelim,1);
  }

  onExporting(e:any) {
    const n_apli:any = this.tabService.tabs.findIndex((c:any) => c.active === true);
    if (e.format == 'xls') {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('Proveedores');
  
      exportDataGrid({
        component: e.component,
        worksheet,
        autoFilterEnabled: true,
      }).then(() => {
        workbook.xlsx.writeBuffer().then((buffer) => {
          saveAs(new Blob([buffer], { type: 'application/octet-stream' }), this.tabService.tabs[n_apli].title+'.xlsx');
        });
      });
    } else {
      const doc = new jsPDF();
      pdfexport({
        jsPDFDocument: doc,
        component: e.component,
        indent: 5,
      }).then(() => {
        doc.save(this.tabService.tabs[n_apli].title+'.pdf');
      });
    }      
    
  }

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  onRespuestaFiltro(e: any) {
    console.log(e);
  }
  opPrepararBuscar(accion): void {
    if (accion === 'filtro') {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para "+this.aplicacion,
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: this.parametros.tabla,
        aplicacion: this.parametros.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);
    } 
    else {
      // Ejecuta búsqueda
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { [this.parametros.tabla]: arrFiltro };
      // Ejecuta búsqueda API
      this.valoresObjetos(this.aplicacion, prm);
      this._sfiltro.enConsulta = false;
    }
  }

  valoresObjetos(obj: string, apl:any){
  
    if (obj === this.aplicacion || obj === 'todos') {
      const prm = apl;
      this.loadingVisible = true;
      this._sdatos.consulta(obj, prm, 'MEN-1000')
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        this.loadingVisible = false;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== undefined && mensaje !== null && mensaje !== '') {
          showToast(mensaje, 'Error');
        } else {
          for (let i = 0; i < res.length; i++) {
            res[i].ITEM = i;
          }
          this.DConsultas = res;
        }
      });
    };

    if (obj === 'parametros') {
      const prm = { aplicacion : apl };
      this._sdatos.consulta('parametros', prm, 'MEN-1000')
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.parametros = res;

      });
    };

  }

}
