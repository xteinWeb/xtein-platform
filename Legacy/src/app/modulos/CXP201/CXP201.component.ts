import { CommonModule, DatePipe, formatNumber } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DxDataGridComponent, DxDataGridModule, DxDateBoxComponent, DxDateBoxModule, DxDropDownButtonModule, DxFormModule, DxLoadPanelModule, DxSelectBoxModule, DxTabsModule, DxTextBoxModule } from 'devextreme-angular';
import { Subject, Subscription } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { clsConsecGexCxp, clsCuentasPagar } from './clsCXP201.class';
import { CXP200Service } from 'src/app/services/CXP200/s_CXP200.service';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { libtools } from 'src/app/shared/common/libtools';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { exportDataGrid as pdfexport } from 'devextreme/pdf_exporter';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { showToast } from '../../shared/toast/toastComponent.js';
import Swal from 'sweetalert2';
import { CXP20101Component } from './CXP20101/CXP20101.component';
import { CXP20102Component } from './CXP20102/CXP20102.component';
import { CXP20103Component } from './CXP20103/CXP20103.component';
import { XcSelectboxComponent } from 'src/app/shared/xc-selectbox/xc-selectbox.component';
import { CXP20104Component } from './CXP20104/CXP20104.component';

@Component({
  selector: 'app-CXP201',
  templateUrl: './CXP201.component.html',
  styleUrls: ['./CXP201.component.css'],
  standalone: true,
  imports: [ DxDataGridModule, CommonModule, DxSelectBoxModule,
    DxLoadPanelModule, DxDropDownButtonModule, CXP20101Component,
    DxTextBoxModule, CXP20102Component, CXP20103Component, CXP20104Component,
    DxTabsModule, DxFormModule, DxDateBoxModule
  ]

})
export class CXP201Component {
  @ViewChild("gridCuentasPagar", { static: false }) gridCuentasPagar: DxDataGridComponent;
  @ViewChild("xs_FECHA_ENTREGA", { static: false }) fechaEntrega: DxDateBoxComponent;

  //Variables fijas de la Aplicación
  subscription: Subscription;
  subscriptionPedidos: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  subs_filtro: Subscription;
  subs_visor: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  VDatosReg: any;
  QFiltro: any;
  readOnly: boolean;
  readOnlyUdp: boolean;
  mnuAccion: string;
  sbDocumento: string;
  sbIdDireccion: string;
  sbPlazo: number;
  sbTipoVenta: string;
  esEdicion: boolean = false;
  esInicioDatos: boolean = false;
  esCreacion: boolean = false;
  esInicioObj: any;
  iniEdicion: boolean = false;
  openDropExportButton: boolean = false;
  esVisibleCartera: boolean = true;
  conCambios: number = 0;
  TOT_GRAV: number;
  focusedRowIndex: number;
  focusedRowKey: string;
  type: string;
  UN_DEF: string;
  MONEDA_DEF: string;
  TIPO_CONDLISTA: string;
  ID_APLICACION: any = 'COM-200';
  stylingMode = 'filled';
  dropDownOptions: any =  { width: 700, 
                            height: 400, 
                            hideOnParentScroll: true, 
                            container: '#router-container',
                            toolbarItems: [{
                              location: 'before', 
                              toolbar: 'top',
                              template: 'tempEncab',
                            }]
                          };
  dropDownOptionsListBox = { hideOnParentScroll: true, container: '#router-container' };
  dropDownOptionsCXP = {
    width: 300
  };
  dSBEstados = ["REGISTRADO","ANULADO","COMPLETADO","EN PROCESO"];
  readonly allowedPageSizes = [5, 10, 20, 50, 100, 'all'];
  bg_color_estado: string;
  ExportButton: any [] = [
    {ID: 1, DESCRIPCION: 'Exportar a excel', KEY: 'EXCEL'},
    {ID: 2, DESCRIPCION: 'Exportar a pdf', KEY: 'PDF'},
    {ID: 3, DESCRIPCION: 'Activar filtros', KEY: 'FILTROS'}
  ];

  // Especirficaciones y valores defecto
  especMoneda: string = "";
  especMonedaFormato: string = "#,##0.00";
  especCantidadFormato: string = "#,##0.00";
  especModificarCantidad: boolean = true;
  especModificarGrav: boolean = true;
  especRepetirItem: boolean = true; 
  especOrigenPrecio: string = ''; 
  especEmailCompras: string = ''; 
  especUsuarioEmail: string = ''; 
  especModificarOrden: boolean = false; 
  eventsSubjectFactPrv: Subject<any> = new Subject<any>();
  eventsSubjectPreEgreso: Subject<any> = new Subject<any>();
  eventsSubjectGenElec: Subject<any> = new Subject<any>();
  eventsSubjectGenSendEgreso: Subject<any> = new Subject<any>();
  visibleAcciones: boolean = false;
  keyFila: any;
  
  //Notificaciones
  toaVisible: boolean;
  toaMessage: string = 'Registro actualizado!';
  toaTipo: string = 'success';
  loadingVisible: boolean = false;

  //Variables de datos
  DCuentasPagar: clsCuentasPagar[] = [];
  DFiltroOC:any = [];
  DListaAcciones:any = [];
  DFacturasPreEgreso: any;
  DProductos: any;
  DProductosLista: any;
  DMonedaDef: any;
  FGestionCxP: clsConsecGexCxp;
  especAplicacion: any;
  filtroDefecto: string;
  totalPreEgreso: string;
  allowExportSelectedData: boolean;
  customizeExcelCell: Function;
  accionesCXP: Array<{ id: Number; text: String; icon: String }> = [
    { id: 1, text: 'Facturas por pagar', icon: 'money' },
    { id: 2, text: 'Detalles del proveedor', icon: 'user' }
  ];

  // Datos reporte
  rpt_id_reporte: string;
  rpt_archivo: string; 
  rpt_datosrpt: any;
  
  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esNuevaFila: boolean = false;
  esVisibleSelecc: string = 'none';
  ltool: any;

  // tooltips
  TooltipTarget: any;
  ToolTipText: string;
  
  constructor(
    private _sdatos: CXP200Service,
		private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private SVisor: SvisorService,
    private datepipe: DatePipe,
    private tabService: TabService
  ) 
  {
    // Servicio de barra de registro
    this.subscription = this._sbarreg.getObsRegApl().subscribe((datreg) => {
      // Valida si la petición es para esta aplicacion
      this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      // if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
      //   this.opMenuRegistro(datreg);
    });

    this.ltool = new libtools(this._sbarreg, this.tabService);

    this.onCellClick = this.onCellClick.bind(this);
    this.customizeColumns =this.customizeColumns.bind(this);
     
  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes
    this._sdatos.accion = operMenu.accion;
    switch (operMenu.accion){
      case 'r_ini':
        const user:any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'ORDENES_COMPRA',
          aplicacion: 'COM-202',
          usuario: user,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: {},
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_refrescar':
				this.valoresObjetos('todos');
				break;

      case 'r_imprimir':
        if (operMenu.operacion.data_rpt.text === 'Orden de Compra')
          this.imprimirReporte(operMenu.operacion.id_reporte, 
                              operMenu.operacion.archivo, 
                              operMenu.operacion.data_rpt);
        break;

      default:
        break;
    }
  }

  imprimirReporte(id_reporte, archivo, datosrpt) {
    let filtroRep = { FILTRO: this.QFiltro };
    const prmLiq = {
      clid: localStorage.getItem('empresa'), 
      usuario: localStorage.getItem('usuario'), 
      idrpt: archivo,
      id_reporte,
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      filtro: filtroRep
    };

    // Si no existe, no está abierta entonces agrega Tab
    const listaTab = this.tabService.tabs.find(c => c.aplicacion === id_reporte);
    if (listaTab === undefined) 
      GlobalVariables.listaAplicaciones.unshift({ aplicacion: id_reporte, barra: undefined, statusEdicion: '' });

    // Abre pestaña con nuevo reporte
    this.tabService.addTab(
      new Tab(
        VisorrepComponent,  // visor
        datosrpt.text,  // título
        { parent: "PrincipalComponent", args: prmLiq },  // parámetro: reporte,filtro
        id_reporte,  // código del reporte
        '',
        'reporte',
        true
    ));

  }
  
  onToolbarPreparingGrid(e: any) {
    let toolbarItems = e.toolbarOptions.items;
    e.toolbarOptions.items.unshift(
      {
        location: 'before'
      }
    );
  }
  onRowPrepared(e) {
    if (e.rowType === "data") {
      if (e.data.isEdit) {
				// e.rowElement.style.backgroundColor = 'lightyellow';
				const className:string = e.rowElement.className;
				e.rowElement.className = className +' row-modified-focused';
			}
      if (!e.isEditing && e.data.isEdit) 
        {
          this.esVisibleSelecc = 'always';
          e.data.isEdit = false;
        }
      }
    if (e.rowType === "header" && e.rowIndex === 2 && !this.esEdicion) {
      e.rowElement.style.display = "none";
    }
  }

  onCellPrepared(e) {
    if(e.rowType === "data" && e.column.dataField === "Pre-Egreso" ) {
      if ( e.data["Pre-Egreso"] !== 0 ) {
        e.cellElement.style.background = "#ffe1d5" 
      }
    }
  }
  onFocusedRowChanged(e){
    const rowData = e.row && e.row.data;
    if (rowData) {
    }
  }

  onCellHoverChanged(e) {
    if (e.rowType === "data") {
      if (e.column.dataField.match("DOCUMENTO")) {
        if (e.eventType === "mouseover") {
          e.cellElement.style.color = "blue";
          e.cellElement.style.textDecoration = "underline";
          e.cellElement.style.cursor = "pointer";
          // this.ToolTipText = e.data.NOMBRE_PRODUCTO;
          // this.toolTip.instance.show(this.TooltipTarget);
        } else {
            // this.toolTip.instance.hide();
            // e.cellElement.style.backgroundColor = "white";
            e.cellElement.style.color = "initial";
            e.cellElement.style.textDecoration = "none";
            e.cellElement.style.cursor = "auto";
        }
      }
    }
  }

  onCellClick(e) {
    if (e.row === undefined) return;

    if (e.row.cells[e.columnIndex].column.dataField === 'ID_ACREEDOR') {
      this.keyFila = e.key;
    }
    if (e.row.cells[e.columnIndex].column.dataField === 'DOCUMENTO') {
      this.keyFila = e.key;
    }

  }

  onContentReady(e:any) {
    // var rowHeader = e.element.find(".dx-header-row");  
    var rowHeader = e.element.getElementsByClassName("dx-header-row");  
    // var row1 = e.element.find(".dx-column-lines:eq(1)");  
    // var row2 = e.element.find(".dx-column-lines:eq(2)");  
    var row1 = e.element.getElementsByClassName("dx-row-lines")[0];  
    if (row1 == undefined) return;
    
    // row1.css('height', '33px');  
    // row2.css('height', '33px');  
 
    rowHeader[0].after(row1);  
    row1.style.backgroundColor = 'rgba(255,255,255,.45)';
    row1.style.fontColor = 'rgba(255,255,255,.45)';
    row1.style.fontSize = '.7rem';
    row1.style.fontWeight = '300';
    // row2.insertAfter(row1); 
    
    // Elimina fila de totales
    const xelim = this.DCuentasPagar.findIndex(p => p.ITEM == -1);
    if (xelim !== -1)
      this.DCuentasPagar.splice(xelim,1);

    // this.gridCuentasPagar.instance.columnOption(0, "fixed", true);
    // this.gridCuentasPagar.instance.columnOption(0, "fixedPosition", "left");
    // this.gridCuentasPagar.instance.columnOption(1, "fixed", true);
    // this.gridCuentasPagar.instance.columnOption(1, "fixedPosition", "left");
 
  }

  onToolbarPreparing(e:any): void {
    // e.toolbarOptions.items.forEach((item:any) => {
    //   if (item.name === "total") {
    //     item.options = {
    //       elementAttr: { class: 'total-header' }
    //     };
    //   }
    // });
  }

  onExporting(e) {
    if (e.format == 'xls') {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('Proveedores');
  ​
      exportDataGrid({
        component: e.component,
        worksheet,
        autoFilterEnabled: true,
      }).then(() => {
        workbook.xlsx.writeBuffer().then((buffer) => {
          saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'Cuentas por pagar.xlsx');
        });
      });
    }
    else {
      const doc = new jsPDF();
      pdfexport({
        jsPDFDocument: doc,
        component: e.component,
        indent: 5,
      }).then(() => {
        doc.save('Cuentas por pagar.pdf');
      });
    }      
    
  }

  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  onSeleccFiltro(e) {

    this.filtroDefecto = e.itemData.FILTRO;

    switch (e.itemData.FILTRO) {
      case "Consultar Cuentas x Pagar":
        this.valoresObjetos('consulta');
        break;

      case "Preparación egresos":
        this.eventsSubjectPreEgreso.next({ 
          accion: 'activar' 
        });
        break;

      case "Pagos electrónicos":
        this.eventsSubjectGenElec.next({ 
          accion: 'activar' 
        });
        break;
      
       case "Envio de egresos": 
          this.eventsSubjectGenSendEgreso.next({ 
            accion: 'activar' 
          });
          break;
      default:
        break;
    }
  }

  onChangeFecha(e) {
    this.FGestionCxP.FECHA = e.value;
    this.fechaEntrega.instance._refresh();
  }

  // Valores de cargue inicial
  valoresDefecto() {
    if(this.especAplicacion) {
      this.especMoneda = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'ID_MONEDA_DEF')?.VALOR_DEFECTO ?? '';
      this.especMonedaFormato = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'FORMATO MONEDA')?.FORMATO ?? '#,##0.00';
      this.especCantidadFormato = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'FORMATO CANTIDAD')?.FORMATO ?? '#,##0.00';
      this.especModificarCantidad = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'MODIFICAR CANTIDAD')?.ACTIVADO ?? false;
      this.especModificarGrav = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'MODIFICAR GRAVAMENES')?.ACTIVADO ?? false;
      this.especRepetirItem = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'REPETIR ITEM')?.ACTIVADO ?? false;
      this.especOrigenPrecio = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'MODIFICAR PRECIO')?.VALOR_DEFECTO ?? '';

      // Cuentas de email usuario
      this.especEmailCompras = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'EMAIL COMPRAS')?.VALOR_DEFECTO ?? '';
      this.especUsuarioEmail = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'EMAIL COMPRAS')?.TITULO ?? '';
      this.especModificarOrden = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'MODIFICAR ORDEN')?.ACTIVADO ?? false;
      if (this.especModificarCantidad)
        this.esEdicion = true;

    }
  }

  onSeleccAcciones(e){
    if (e.addedItems === undefined) return;
    if (e.addedItems.length === 0) return;
    var rowIndex = this.gridCuentasPagar.instance.getRowIndexByKey(this.keyFila);  
    const documento = this.gridCuentasPagar.instance.cellValue(rowIndex, "DOCUMENTO");


  }

  customizeColumns(columns: any) {
    if (!this.gridCuentasPagar) return;
    var items = this.gridCuentasPagar.instance.getDataSource().items();  
    // let totalItems: any;
    // totalItems = this.gridCuentasPagar.instance.option("summary.totalItems");
    columns.forEach((col: any)=> {  
      if (typeof items[0][col.dataField] === "number") {
        col.dataType = "number";
        col.format = "#,###";
        // col.sortOrder = "desc";
        // if (col.dataField !== 'Anteriores') {
        //   totalItems = [...totalItems, 
        //                   { column: col.dataField, 
        //                     summaryType:"sum",
        //                     displayFormat:"{0}",
        //                     valueFormat:"#,###"} ];
        //   this.gridCuentasPagar.instance.option("summary.totalItems", totalItems);
        // }
        // col.columns = [];
        // col.columns.push({dataField: col.dataField + '_Total'});  
      }  
      if(col.dataField === "ID_ACREEDOR"){  
        col.caption = "Id Acreedor"
        col.width = "150";
        col.cellTemplate = "tempAcreedor";
        col.calculateCellValue = (data => {
          return data.ID_ACREEDOR;
        })
        // col.fixed = true;
        // col.fixedPosition = "left";
      }
      if(col.dataField === "NOMBRE"){  
        col.caption = "Nombre"
        // col.fixed = true;
        // col.fixedPosition = "left";
        col.width = "200";
        // col.sortOrder = "asc";
      }
      if(col.dataField.match("ITEM|Vencidos")){  
        col.visible = false;
      }
    })  
  }

  onInitializedGrid(e) {
  }

  // Acciones sobre la orden de compra
  accionClick(e) {

    // Datos de la OC
    var rowIndex = this.gridCuentasPagar.instance.getRowIndexByKey(this.keyFila);  
    const acree = this.gridCuentasPagar.instance.cellValue(rowIndex, "ID_ACREEDOR");
    const nomacree = this.gridCuentasPagar.instance.cellValue(rowIndex, "NOMBRE");

    switch (e.itemData.text) {

      case "Facturas por pagar":
        this.eventsSubjectFactPrv.next({ 
          accion: 'activar', 
          ID_ACREEDOR: acree,
          NOMBRE: nomacree
        });
        break;
    
      default:
        break;
    }
  }

  // Respuesta accion del gestión de facturas
  onRespuestaFactPrv(e: any) {

    if (e.accion === 'aceptar') {
      const prmDatos = { USUARIO: this.prmUsrAplBarReg.usuario, DATOS: e.data };
      this._sdatos
      .save('preparar pago facturas', prmDatos, this.prmUsrAplBarReg.aplicacion)
      .subscribe(
        { next: (resp) => {
          this.loadingVisible = false;
          const res = JSON.parse(resp.data);
          if (res[0].ErrMensaje !== "") {
            this.showModal(res[0].ErrMensaje, 'error');
          } 
          else
          {
            showToast('Registro actualizado', 'success');

            // Retorna lista de los que están marcados para pagar
            this.DFacturasPreEgreso = res;

            // Totaliza pre-egresos
            var sumPre = this.DFacturasPreEgreso.reduce((total, valor) => {
              return total + valor.VALOR_PAGO
            },0);
            if (sumPre == undefined || sumPre == null) sumPre = 0;
            this.totalPreEgreso = formatNumber(sumPre, 'en-US', '1.2-2');
            // this.textBoxPreEgreso.option('value',this.valFac);

            // Actualiza celda de la grid
            if (e.data.length !== 0 && e.data[0].ESTADO !== 'eliminar') {
              var sumPre = e.data.reduce((total, valor) => {
                return total + valor.SALDO
              },0);
              const nx = this.DCuentasPagar.findIndex(p => p["ID_ACREEDOR"] === e.data[0].ID_ACREEDOR);
              if (nx != -1)
                this.DCuentasPagar[nx]["Pre-Egreso"] = sumPre;
            }
            else {
              var rowIndex = this.gridCuentasPagar.instance.getRowIndexByKey(this.keyFila);  
              this.DCuentasPagar[rowIndex]["Pre-Egreso"] = 0;
            }

          }
        },
        error: (e) => {
          this.showModal('Error al guardar pre egreso: '+e.error.message);
          }
        });
    }
    
  } 

  // Respuesta accion de generación de egreso
  onRespuestaPreEgreso(e: any) {

    if (e.accion === 'aceptar') {
      const prmDatos = { USUARIO: this.prmUsrAplBarReg.usuario, DATOS: e.data };
      this._sdatos
      .save('generacion egresos', prmDatos, this.prmUsrAplBarReg.aplicacion)
      .subscribe(
        { next: (resp) => {
          this.loadingVisible = false;
          const res = JSON.parse(resp.data);
          if (res[0].ErrMensaje !== "") {
            this.showModal('', 'error', res[0].ErrMensaje);
          } 
          else
          {
            showToast('Egresos generados! Revise opción Lista de Egresos', 'success');

            // Retorna lista de los que están marcados para pagar
            this.DFacturasPreEgreso = res[0].PRE_EGRESOS;

            // Totaliza pre-egresos
            var sumPre = this.DFacturasPreEgreso.reduce((total, valor) => {
              return total + valor.VALOR_PAGO
            },0);
            this.totalPreEgreso = formatNumber(sumPre, 'en-US', '1.2-2');
            // this.textBoxPreEgreso.option('value',this.valFac);

            // Actualiza celda de la grid
            this.DCuentasPagar.forEach(cxp => {
                cxp["Pre-Egreso"] = 0;
            });
            if (this.DFacturasPreEgreso.length !== 0 && this.DFacturasPreEgreso[0]["ID_ACREEDOR"]) {
              this.DFacturasPreEgreso.forEach(preeg => {
                const nx = this.DCuentasPagar.findIndex(p => p["ID_ACREEDOR"] === preeg.ID_ACREEDOR);
                if (nx != -1)
                  this.DCuentasPagar[nx]["Pre-Egreso"] = sumPre;
              });
            }

            // Refresca cuadro de cuentas x pagar
            this.valoresObjetos('consulta');

            // Si genera archivo electrónico
            if (e.data.PRM_EGRESO.GENERA_ELEC) {
              const prmElec = { accion: 'aceptar', data: { GEN_ELEC: res[0].EGRESOS_GEN } };
              this.onRespuestaGenElec(prmElec);
            }

          }
        },
        error: (e) => {
          this.showModal('Error en la generación de los Egresos: '+e.error.message);
          }
        });
    }
    
  } 

  onTabChanged(e:any){
    switch (e.itemIndex) {
      case 0:
        // this.tabsMovilGespro[0].content = true;
        // this.tabsMovilGespro[1].content = false;
        // this.tabsMovilGespro[2].content = false;
        break;
        
      case 1:
        // this.tabsMovilGespro[0].content = false;
        // this.tabsMovilGespro[1].content = true;
        // this.tabsMovilGespro[2].content = false;
        break;
        
      case 2:
        // this.tabsMovilGespro[0].content = false;
        // this.tabsMovilGespro[1].content = false;
        // this.tabsMovilGespro[2].content = true;
        break;
    
      default:
        break;
    }
  }

  // Generación electrónica de pagos
  onRespuestaGenElec(e: any) {

    if (e.accion === 'aceptar') {
      const prmDatos = { USUARIO: this.prmUsrAplBarReg.usuario, DATOS: e.data };
      this._sdatos
      .save('generacion electronica', prmDatos, this.prmUsrAplBarReg.aplicacion)
      .subscribe(
        { next: (resp) => {
          this.loadingVisible = false;
          const res = JSON.parse(resp.data);
          if (res[0].ErrMensaje !== "") {
            this.showModal('', 'error', res[0].ErrMensaje);
          } 
          else
          {
            // Guarda archivo de pagos electrónicos
            const link = document.createElement("a");
            const content = res.map(t => t.TEXTO).join("\n");
            const file = new Blob([content], { type: 'text/plain' });
            link.href = URL.createObjectURL(file);
            link.download = "egresos-elec.txt";
            link.click();
            URL.revokeObjectURL(link.href);

          }
        },
        error: (e) => {
          this.showModal('Error en la generación de los Egresos: '+e.error.message);
          }
        });
    }
    
  } 


    // Generación electrónica de pagos
  onRespuestaGenSendEgreso(e: any) {
    
  } 


  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined){

    if (obj == 'especificaciones' || obj == 'todos' ) {
      this._sdatos.consulta('ESPECIFICACIONES', 
                            { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, USUARIO: this.prmUsrAplBarReg.usuario }, 
                            'ADM-011')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined)){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.especAplicacion = res;
          this.valoresDefecto();
    
        });
    }

    if (obj == 'consulta' || obj == 'todos' ) {
      this.loadingVisible = true;
      this._sdatos.consulta('consulta', { }, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          this.loadingVisible = false;
          const res = JSON.parse(data.data);
          if ( (data.token != undefined)){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DCuentasPagar = res;
          // var cols = Object.keys(this.DCuentasPagar[0]);
          // Totaliza pre-egresos
          var sumPre = this.DCuentasPagar.reduce((total, valor) => {
            return total + valor["Pre-Egreso"]
          },0);
          this.totalPreEgreso = formatNumber(sumPre, 'en-US', '1.2-2');

        });
    }

    if (obj == 'filtros gestion cuentas por pagar' || obj == 'todos' ) {
      console.log("asdsdsdsdsddsad", this.prmUsrAplBarReg.aplicacion)
      this._sdatos.consulta('FILTROS CUENTAS POR PAGAR', 
                            { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, USUARIO: this.prmUsrAplBarReg.usuario }, 
                            this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined)){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DFiltroOC = res;
          if (res[0]) {
            this.filtroDefecto = this.DFiltroOC.find(f => f.DEFECTO === '1').FILTRO?? '';
          }
    
        });
    }

    if (obj == 'acciones ordenes compra' || obj == 'todos' ) {
      this._sdatos.consulta('ACCIONES ORDENES COMPRA', 
                            { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, USUARIO: this.prmUsrAplBarReg.usuario }, 
                            "COM-200")
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined)){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DListaAcciones = res;
    
        });
    }

  }

  ngOnInit(): void {
    const user:any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: 'CUENTAS_X_PAGAR',
      aplicacion: 'CXP-201',
      usuario: user,
      accion: 'zero',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: {  }
    };

    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this.readOnly = true;
    this.readOnlyUdp = true;
    this.rowNew = false;
    this._sdatos.accion = 'r_ini';
    this.FGestionCxP = new clsConsecGexCxp();
    
  }

  ngAfterViewInit(): void { 
    // this.gridCuentasPagar.instance.filter(['CANTIDAD_PENDIENTE', '>', 0]);
    // Ini datos
    setTimeout(() => {
      this.valoresObjetos('todos');
    }, 300);

  }


  ngOnDestroy(){
    this.subscription.unsubscribe();
    // this.subs_filtro.unsubscribe();
    // this.subs_visor.unsubscribe();
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
