import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { DxDataGridComponent, DxDataGridModule, DxDropDownButtonModule, DxLoadPanelModule, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { clsOrdenCompraItems } from '../../COM200/clsCOM200.class';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { CommonModule, DatePipe } from '@angular/common';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { showToast } from '../../../shared/toast/toastComponent.js';
import Swal from 'sweetalert2';
import { Subject, Subscription } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { COM200Service } from 'src/app/services/COM200/COM200.service';
import { COM20201Component } from './../COM20201/COM20201.component';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { libtools } from 'src/app/shared/common/libtools';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { saveAs } from 'file-saver';
import { FemailComponent } from 'src/app/shared/femail/femail.component';
import { COM20204Component } from '../COM20204/COM20204.component';
import { COM20205Component } from '../COM20205/COM20205.component';

@Component({
  selector: 'app-COM20203',
  templateUrl: './COM20203.component.html',
  styleUrls: ['./COM20203.component.css'],
  standalone: true,
  imports: [ DxDataGridModule, CommonModule, DxSelectBoxModule, COM20201Component,
             DxLoadPanelModule, DxDropDownButtonModule, FemailComponent, 
             COM20204Component, DxTextBoxModule, COM20205Component
           ]
})
export class COM20203Component {
  @ViewChild("gridOrdenCompra", { static: false }) gridOrdenCompra: DxDataGridComponent;

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
  dSBEstados = ["REGISTRADO","ANULADO","COMPLETADO","EN PROCESO"];
  readonly allowedPageSizes = [5, 10, 20, 50, 100, 'all'];
  bg_color_estado: string;

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
  eventsSubjectAcciones: Subject<any> = new Subject<any>();
  eventsSubjectEnvioCorreo: Subject<any> = new Subject<any>();
  eventsSubjectLog: Subject<any> = new Subject<any>();
  eventsSubjectSeg: Subject<any> = new Subject<any>();
  visibleAcciones: boolean = false;
  keyFila: any;
  
  //Notificaciones
  toaVisible: boolean;
  toaMessage: string = 'Registro actualizado!';
  toaTipo: string = 'success';
  loadingVisible: boolean = false;

  //Variables de datos
  DOrdenCompra: clsOrdenCompraItems[] = [];
  DFiltroOC:any = [];
  DListaAcciones:any = [];
  DProductos: any;
  DProductosLista: any;
  DMonedaDef: any;
  listaReportes: any[] = [];
  DProveedores: any;
  especAplicacion: any;
  filtroDefecto: string;
  allowExportSelectedData: boolean;
  customizeExcelCell: Function;

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

  accionesOC: Array<{ id: Number; text: String; icon: String }> = [
    { id: 1, text: 'Ver Orden de Compra', icon: 'import' },
    { id: 2, text: 'Ver detalles de la Orden de compra', icon: 'orderedlist' },
    { id: 3, text: 'Cambio de estado', icon: 'tags' },
    { id: 4, text: 'Trazabilidad', icon: 'runner' },
    { id: 5, text: 'Seguimiento', icon: 'todo' }
  ];
  dropDownOptionsOC = {
      height: 200,
      width: 300
  };

  @Output() onRespuestaSelecc = new EventEmitter<any>;
  
  constructor(
    private _sdatos: COM200Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private _sgenerales: GeneralesService,
    private datepipe: DatePipe,
    private tabService: TabService
  ) 
  {
    this.DOrdenCompra = [new clsOrdenCompraItems()];
    this.ltool = new libtools(this._sbarreg, this.tabService);

    this.onCellClick = this.onCellClick.bind(this);
     
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

  onRowValidating(e: any) {
    // Valida completitud
    var errMsg = '';
    if (e.newData.PRODUCTO !== undefined && e.newData.PRODUCTO == '') 
      errMsg = 'Falta seleccionar producto';
    if (e.newData.VALOR_UNITARIO !== undefined && e.newData.VALOR_UNITARIO <= 0) 
      errMsg = 'Valor unitario no puede ser cero';
    if (e.newData.CANTIDAD !== undefined && e.newData.CANTIDAD <= 0) 
      errMsg = 'Cantidad no puede ser cero';
    if (errMsg !== '') {
      e.isValid = false;
      showToast(errMsg, 'warning');
      return;
    }
  }

  onEditingStart(e) {
    if (e.data.ESTADO.match('ANULADO|CERRADA|TERMINADA')) {
      e.cancel = true;
    }
  }
  onEditorPreparing(e) {
  }
  onCellPrepared(e) {
    if (e.rowType === "data" && e.column.dataField === "FECHA_ENTREGA") {
      const today = new Date();
      const fhoy = this.datepipe.transform(today, 'MM/dd/yyyy');
      const ford = this.datepipe.transform(e.data.FECHA_ENTREGA, 'MM/dd/yyyy');
      const dfhoy = new Date(fhoy!);
      const dford = new Date(ford!);
      if(dford < dfhoy) {
        // e.cellElement.style.backgroundColor = "rgba(255, 0, 0, 0.4)";
        // e.cellElement.style.color = "white";
      }
    }
  }
  onFocusedRowChanged(e){
    const rowData = e.row && e.row.data;
    if (rowData) {
    }
  }

  onEditCanceled(e) {
    this.esVisibleSelecc = 'always';
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

  // Acciones sobre la orden de compra
  accionClick(e, cellInfo) {

    // Datos de la OC
    var rowIndex = this.gridOrdenCompra.instance.getRowIndexByKey(this.keyFila);  
    const doc = this.gridOrdenCompra.instance.cellValue(rowIndex, "DOCUMENTO");
    const documento = { ID_DOCUMENTO: doc.split(' ')[0],
                        CONSECUTIVO: doc.split(' ')[1]
                      }

    switch (e.itemData.text) {

      case "Ver Orden de Compra":
        const compoApl = {ID_APLICACION: "COM-200",
                          title: 'Ordenes de compra',
                          TABLA: this.prmUsrAplBarReg.tabla,
                          user: this.prmUsrAplBarReg.usuario,
                          FILTRO: '{ "ESTRUCTURA": '+
                                  '[{"CAMPO": "ID_DOCUMENTO", "EXPRESION": "'+documento.ID_DOCUMENTO+'"},'+
                                  ' {"CAMPO": "CONSECUTIVO", "EXPRESION": "'+documento.CONSECUTIVO+'"}] }'
                        }
        this.ltool.abrirApl(compoApl, 'consulta'); 
        break;
    
      case "Ver detalles de la Orden de compra":
        const filtro = "OC.ID_DOCUMENTO='" + documento.ID_DOCUMENTO + "' AND OC.CONSECUTIVO=" + documento.CONSECUTIVO;
        this.onRespuestaSelecc.emit(filtro);
        break;

      case "Cambio de estado":
        // Valida si tiene permisos
        if (this.DListaAcciones.length === 0) {
          this.showModal('Este usuario no tiene permisos de cambios de estado!');
          return;
        }

        // Valida si el estado puede ejecutar alguna acción
        this._sdatos.consulta('VALIDAR CAMBIOS ORDEN COMPRA', 
                { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, 
                  USUARIO: this.prmUsrAplBarReg.usuario,
                  DOCUMENTO: doc,
                  ESTADO: this.gridOrdenCompra.instance.cellValue(rowIndex, "ESTADO")
                }, 
                "COM-200")
          .subscribe((data: any) => {
            const res = JSON.parse(data.data);
            if ( (data.token != undefined)){
              const refreshToken = data.token;
              localStorage.setItem("token", refreshToken);
            }

            // Resultado validación
            if (res[0].ErrMensaje !== '') {
              this.showModal(res[0].ErrMensaje, 'Evento cambio de estado');
            }
            else {
              this.eventsSubjectAcciones.next({ 
                dataSource: this.DListaAcciones, 
                visible: true,
                documento: doc
              });
            }
        });
        break;

      case "Trazabilidad":
        this.eventsSubjectLog.next({ 
          accion: 'activar', 
          DOCUMENTO: documento
        });
        break;

      case "Seguimiento":
        this.eventsSubjectSeg.next({ 
          accion: 'activar', 
          DATOS: cellInfo.data
        });
        break;
        

      default:
        break;
    }
  }

  onCellClick(e) {
    if (e.row === undefined) return;

    if (e.row.cells[e.columnIndex].column.dataField === 'ESTADO') {
      this.keyFila = e.key;

      // // Valida si tiene permisos
      // if (this.DListaAcciones.length === 0) {
      //   this.showModal('Este usuario no tiene permisos de cambios de estado!');
      //   return;
      // }

      // // Valida si el estado puede ejecutar alguna acción
      // this._sdatos.consulta('VALIDAR CAMBIOS ORDEN COMPRA', 
      //         { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, 
      //           USUARIO: this.prmUsrAplBarReg.usuario,
      //           DOCUMENTO: e.row.data.DOCUMENTO,
      //           ESTADO: e.row.data.ESTADO
      //         }, 
      //         "COM-200")
      //   .subscribe((data: any) => {
      //     const res = JSON.parse(data.data);
      //     if ( (data.token != undefined)){
      //       const refreshToken = data.token;
      //       localStorage.setItem("token", refreshToken);
      //     }

      //     // Resultado validación
      //     if (res[0].ErrMensaje !== '') {
      //       this.showModal(res[0].ErrMensaje, 'Evento cambio de estado');
      //     }
      //     else {
      //       this.eventsSubjectAcciones.next({ 
      //         dataSource: this.DListaAcciones, 
      //         visible: true,
      //         documento: e.row.data.DOCUMENTO
      //       });
      //     }
      // });

    }
    if (e.row.cells[e.columnIndex].column.dataField === 'DOCUMENTO') {
      this.keyFila = e.key;
      // const compoApl = { ID_APLICACION: "COM-200",
      //                    TABLA: this.prmUsrAplBarReg.tabla,
      //                    user: this.prmUsrAplBarReg.usuario,
      //                    FILTRO: '{ "ESTRUCTURA": '+
      //                            '[{"CAMPO": "ID_DOCUMENTO", "EXPRESION": "'+e.row.data.ID_DOCUMENTO+'"},'+
      //                            ' {"CAMPO": "CONSECUTIVO", "EXPRESION": "'+e.row.data.CONSECUTIVO+'"}] }'
      //                  }
      // this.ltool.abrirApl(compoApl); 
      
    }

  }

  onExporting(e) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Employees');
​
    exportDataGrid({
      component: e.component,
      worksheet,
      autoFilterEnabled: true,
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'Gestion de compras.xlsx');
      });
    });
  }

  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  updatedRow(e){
    // Si es la cantidad, actualizar directo en la OC
    if (e.data) {
      const prm = { ORDEN_COMPRA: e.data };
      this._sdatos
      .save('actualizar cantidad', prm, "COM-200")
      .subscribe((resp) => {
        const res = JSON.parse(resp.data);
        const ix = this.DOrdenCompra.findIndex(o => o.ITEM == e.data.ITEM);
        if (res[0].ErrMensaje !== ""){
          this.showModal(res[0].ErrMensaje, 'error');

          // Restablece cantidad
          if (ix !== -1)
            this.DOrdenCompra[ix].CANTIDAD = res[0].CANTIDAD;
        } 
        else
        {
          // respuesta
          this.DOrdenCompra[ix].SUB_TOTAL = res[0].SUB_TOTAL;
          showToast("Cantidad actualizada. Revisar orden de compra","success");
        }
      });
  
    }
  }

  updatingRow(e) {
    this.conCambios++;
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = true;
  }

  onSeleccFiltro(e) {
    this.filtroDefecto = e.value;
    this.valoresObjetos('ordenes de compra');
  }

  // Valores de cargue inicial
  valoresDefecto() {
    if(this.especAplicacion) {
      this.especMoneda = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'ID_MONEDA_DEF')?.VALOR_DEFECTO ?? '';
      this.especMonedaFormato = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'FORMATO MONEDA')?.FORMATO ?? '#,##0.00';
      this.especCantidadFormato = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'FORMATO CANTIDAD')?.FORMATO ?? '#,##0.00';
      this.especModificarCantidad = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'MODIFICAR CANTIDAD')?.ACTIVADO ?? false;
      this.especModificarGrav = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'MODIFICAR GRAVAMENES')?.ACTIVADO ?? false;
      this.especRepetirItem = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'REPETIR ITEM')?.ACTIVADO ?? false;
      this.especOrigenPrecio = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'MODIFICAR PRECIO')?.VALOR_DEFECTO ?? '';

      // Cuentas de email usuario
      this.especEmailCompras = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'EMAIL COMPRAS')?.VALOR_DEFECTO ?? '';
      this.especUsuarioEmail = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'EMAIL COMPRAS')?.TITULO ?? '';
      this.especModificarOrden = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'MODIFICAR ORDEN')?.ACTIVADO ?? false;
      if (this.especModificarCantidad)
        this.esEdicion = true;

    }
  }

  onSeleccAcciones(e){
    if (e.addedItems === undefined) return;
    if (e.addedItems.length === 0) return;
    var rowIndex = this.gridOrdenCompra.instance.getRowIndexByKey(this.keyFila);  
    const documento = this.gridOrdenCompra.instance.cellValue(rowIndex, "DOCUMENTO");

    // Ejecuta accion
    this._sdatos.consulta('CAMBIO ESTADO ORDEN COMPRA', 
                          { DOCUMENTO: documento, 
                            ACCION: e.addedItems[0].ACCION, 
                            JUSTIFICACION: e.JUSTIFICACION,
                            USUARIO: this.prmUsrAplBarReg.usuario }, 
                            "COM-200")
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }

        // Valida
        if (res[0].ErrMensaje !== "") {
          this.showModal(res[0].ErrMensaje, "Error cambio de estado");          
        }
        else {
          // Actualiza los datos
          const dord = this.DOrdenCompra.filter(oc => oc.DOCUMENTO === documento);
          if (dord) {
            dord.forEach(ord => {
              ord.ESTADO = res[0].ESTADO;
              ord.COLOR_ESTADO = res[0].COLOR_ESTADO;
            });
          }
          showToast('Cambio a estado '+res[0].ESTADO+' fue realizado!');
          this.gridOrdenCompra.instance.refresh();

          // Permite enviar email
          const rep = this.listaReportes.find(r => r.especificacion.defectoEmail);
          if (rep !== undefined) {
            this.rpt_id_reporte = rep.id_reporte, 
            this.rpt_archivo = rep.archivo, 
            this.rpt_datosrpt = rep;
            this.enviarEmailPDF();
          }

        }
  
      });

  }

  // Pre-visualiza solo pdf
  enviarEmailPDF() {

    // Abre notificacion de envio de correo
    var msg = '';
    var rowIndex = this.gridOrdenCompra.instance.getRowIndexByKey(this.keyFila);  
    const prov = this.gridOrdenCompra.instance.cellValue(rowIndex, "ID_PROVEEDOR");
    const doc = this.gridOrdenCompra.instance.cellValue(rowIndex, "DOCUMENTO");
    const dprov = this.DProveedores.find(p => p.ID_PROVEEDOR === prov);
    if (dprov == undefined || dprov == null) {
      msg = 'No hay datos del proveedor<br>';
    }
    if (dprov.EMAIL === '') {
      msg += 'Falta definir correo de recepción del proveedor<br>';
    }
    if (this.especUsuarioEmail === '') {
      msg += 'Falta definir correo de envio del usuario<br>';
    }
    if (msg !== "")
      showToast(msg);
    
    // Prepara y confirma envio de correo
    let asunto = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'ASUNTO EMAIL')?.VALOR_DEFECTO ?? '';
    let email_sale = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'EMAIL SALIENTE')?.VALOR_DEFECTO ?? '';
    asunto = asunto.replace('%NUMERO_ORDEN%', doc);
    const dataSource =  { ORIGEN: this.especUsuarioEmail,
                          ORIGEN_EMAIL: email_sale,
                          DESTINO: dprov.NOMBRE_COMPLETO,
                          DESTINO_EMAIL: dprov.EMAIL,
                          ASUNTO: asunto,
                          NOTA: ''
                        }
    this.eventsSubjectEnvioCorreo.next({ dataSource, visible: true });
                
  }

  // Respuesta accion del correo
  onRespuestaEnvioCorreo(e: any) {
    
    showToast('Enviando correo. Espere unos segundos...');

    var rowIndex = this.gridOrdenCompra.instance.getRowIndexByKey(this.keyFila);  
    const doc = this.gridOrdenCompra.instance.cellValue(rowIndex, "DOCUMENTO");
    const fecent = this.gridOrdenCompra.instance.cellValue(rowIndex, "FECHA_ENTREGA");
    let template = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'TEMPLATE')?.VALOR_DEFECTO ?? '';
    const ext = this.ltool.makeRandom(30);
    let filtroRep: any = '';
    filtroRep = { FILTRO: " ORDENES_COMPRA.ID_DOCUMENTO = '"+doc.split(' ')[0]+"' " +
                          " AND ORDENES_COMPRA.CONSECUTIVO = '"+doc.split(' ')[1]+"'" };

    const prmRpt = {
      clid: localStorage.getItem('empresa'), 
      usuario: localStorage.getItem('usuario'), 
      idrpt: this.rpt_archivo,
      id_reporte: this.rpt_id_reporte,
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      filtro: JSON.stringify(filtroRep),
      archivo: this.rpt_archivo + "_" + ext + ".pdf",
      prm_email: e,
      template,
      replacements: { NUMERO_ORDEN: doc, 
                      DIA_ENTREGA: this.datepipe.transform(fecent,'MMMM d, y',undefined,'es'),
                      NOTA: e.NOTA
                    }
    };

    // Generar el PDF -- Llamar al generador de reportes para que genere archivo pdf
    this._sgenerales.ExportarPDF(prmRpt).subscribe((data: Blob) => {

      // Abrir reporte en pestaña browser
      /*var file = new Blob([data], { type: 'application/pdf' })
      var fileURL = URL.createObjectURL(file);
      window.open(fileURL); */
      
      /*var a         = document.createElement('a');
      a.href        = fileURL; 
      a.target      = '_blank';
      a.download    = 'bill.pdf';
      document.body.appendChild(a);
      a.click();*/

      this._sgenerales.sendMail('send',{ datos: prmRpt },this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          showToast('Correo enviado a '+e.DESTINO_EMAIL);
        
        // Guarda en el log de envios de correos de la OC
        const prm = { ID_APLICACION : 'COM-200', 
                      ORIGEN: 'documento', 
                      DATOS: this.DOrdenCompra,
                      EVENTO: 'ENVIO EMAIL',
                      DETALLE: e.DESTINO_EMAIL +  ' Status:enviado',
                      USUARIO: this.prmUsrAplBarReg.usuario
                    };
        this._sgenerales
          .log('evento log', prm, "ADM-401")
          .subscribe((data: any) => {
            const res = JSON.parse(data.data);
            if (res[0].ErrMensaje !== '')
              showToast(res[0].ErrMensaje);
        });
  
      });

    });


  }

  // Respuesta seguimiento
  onRespuestaSeg(e: any) {
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

    if (obj == 'ordenes de compra' || obj == 'todos' ) {
      this.loadingVisible = true;
      this._sdatos.consulta('GESTION ORDENES COMPRA', 
                            { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, 
                              USUARIO: this.prmUsrAplBarReg.usuario,
                              FILTRO: this.filtroDefecto
                             }, 
                            "COM-200")
        .subscribe((data: any) => {
          this.loadingVisible = false;
          const res = JSON.parse(data.data);
          if ( (data.token != undefined)){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DOrdenCompra = JSON.parse(JSON.stringify(res));
        });
    }

    if (obj == 'filtros gestion de compras' || obj == 'todos' ) {
      this._sdatos.consulta('FILTROS GESTION ORDENES COMPRA', 
                            { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, USUARIO: this.prmUsrAplBarReg.usuario }, 
                            "COM-200")
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

     // Lista de reportes de la aplicación
     if (obj == 'reportes' || obj == 'todos' ) {
      const prm = { ID_APLICACION: "COM-200" }
      this._sbarreg.listaInformes(prm).subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.listaReportes = [];
        let k = 0;
        res.forEach((rep:any) => {
          this.listaReportes.push({ text: rep.NOMBRE, 
                                    id_reporte: rep.ID_REPORTE, 
                                    archivo: rep.ARCHIVO,
                                    item: k,
                                    especificacion: rep.ESPECIFICACION !== '' ? JSON.parse(rep.ESPECIFICACION) : {} 
                                    })
          k++;
        });
      });
    }

    if (obj == 'proveedores' || obj == 'todos') {
      this._sdatos.consulta('proveedores',{ESTADO: 'ACTIVO', CONSULTA: 'compras'},'CXP-200').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DProveedores = res;
      });
    }

  }

  ngOnInit(): void {
    const user:any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: 'ORDENES_COMPRA',
      aplicacion: 'COM-202',
      usuario: user,
      accion: 'zero',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: {  }
    };
    this.mnuAccion = '';
    this.readOnly = true;
    this.readOnlyUdp = true;
    this.rowNew = false;
    this._sdatos.accion = 'r_ini';

    
  }

  ngAfterViewInit(): void { 
    // Ini datos
    this.DOrdenCompra = []
    setTimeout(() => {
      this.valoresObjetos('todos');
    }, 300);

  }


  ngOnDestroy(){
    // this.subscription.unsubscribe();
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
