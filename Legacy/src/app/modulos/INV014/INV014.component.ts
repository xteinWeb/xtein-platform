import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
import { lastValueFrom, Subject, Subscription} from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { INV014Service } from 'src/app/services/INV014/INV014.service';
import Swal from 'sweetalert2';
import { clsEntradas } from './clsINV014.class';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { DxButtonModule, DxDataGridModule, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxPopupModule, DxSelectBoxModule, DxToolbarModule} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { showToast } from '../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-INV014',
  templateUrl: './INV014.component.html',
  styleUrls: ['./INV014.component.css'],
  standalone: true,
  imports: [DxFormModule, DxDropDownBoxModule, DxDataGridModule, DxSelectBoxModule]
})
export class INV014Component implements OnInit {
  @ViewChild('formEntradas', { static: false }) formEntradas: DxFormComponent;

  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subscription: Subscription;
  subscriptionEntrada: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string;
  readOnly: boolean = false;
  readOnlyExp: boolean = false;
  esEdicion: boolean = false;
  iniEdicion: boolean = false;
  readOnlyUsuario: boolean = false;
  isGridBoxOpened: boolean;
  VDatosReg: any;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  editSoloTipoTran: boolean = false;
  gridBoxValue: string[] = [];
  dSBEstados = ["REGISTRADO","ANULADO"];
  dropDownOptions = { width: 700, height: 400 };
  gridBoxProductos: any[] = [];
  ID_APLICACION: string = 'INV-014';
  gridBoxDocumento: any[] = [];
  focusedRowIndex: number;
  focusedRowKey: string;
  stylingMode = 'filled';
  dropDownOptionsListBox = { hideOnParentScroll: true, container: '#router-container' };

  // Notificaciones
  toaVisible: boolean;
  toaMessage: string = 'Registro actualizado!';
  toaTipo: string = 'success';
  loadingVisible: boolean = false;

  // Variables de datos
  DEntradas: clsEntradas;
  DEntradasItems: any;
  DEntradas_prev: any;
  DProductos: any;
  DProveedores: any;
  DBodegas: any;
  DGravamenes: any;
  DDocumentos: any;
  DTipoMovimiento: any;
  DTipoInventario: any;
  QFiltro: any;
  colCountByScreen: object;

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esVisibleSelecc: string = 'none';

  constructor(
    private _sdatos: INV014Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private tabService: TabService
  ) {

    // Servicio de barra de registro
    this.subscription = this._sbarreg.getObsRegApl().subscribe((datreg) => {
      // Valida si la petición es para esta aplicacion
      if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opMenuRegistro(datreg);
    });

    // Respuesta del filtro
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe((resp) => {
      // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    });

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex(d => d.USUARIO === resp.USUARIO);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx+1;
        this.opIrARegistro('r_numreg');
      }
    })

    // Servicio comunicacion entre pestañas
    this.subscriptionEntrada = this._sdatos
      .getObs_Entrada()
      .subscribe((datreg) => {
        // Ejecuta de acuerdo al componente hijo
        switch (datreg.componente){
          case 'atributos':
            break;

          default:
            break;
        }
      });

    this.ValideExistencia = this.ValideExistencia.bind(this);
    this.clickTipo = this.clickTipo.bind(this);
  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes
    this._sdatos.accion = operMenu.accion;
    switch (operMenu.accion){
      case 'r_ini':
        const user:any = localStorage.getItem('entrada');
        this.prmUsrAplBarReg = {
          tabla: 'ENTRADAS',
          aplicacion: this.ID_APLICACION,
          usuario: user,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: {},
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_nuevo':
        this.mnuAccion = 'new';
        this.readOnly = false;
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.readOnly = false;
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case 'r_buscar':
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_buscar_ejec':
        this.opBlanquearForma();
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_eliminar':
        this.opEliminar();
        break;

      case 'r_primero':
      case 'r_anterior':
      case 'r_siguiente':
      case 'r_ultimo':
      case 'r_numreg':
        this.opIrARegistro(operMenu.accion);
        break;

      case 'r_cancelar':
        Swal.fire({
          title: '',
          text: '¿Desea cancelar la operación?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: 'rgb(161 200 237)',
          cancelButtonColor: '#03a9f4',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar',
        }).then((result) => {
          if (result.isConfirmed){
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this.readOnly = true;
            this.esEdicion = false;
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.DEntradas = JSON.parse(JSON.stringify(this.DEntradas_prev));
            this.opIrARegistro('r_numreg');

            // Restituye los valores
            this.mnuAccion = '';
          }
        });

        break;

      case 'r_vista':
        this.opVista();
        break;

      case 'r_imprimir':
        this.imprimirReporte(
          operMenu.operacion.id_reporte,
          operMenu.operacion.archivo,
          operMenu.operacion.data_rpt
        );
        break;

      default:
        break;
    }
  }

  opPrepararNuevo(): void {
    this.readOnly = false;
    this.esEdicion = true;
    this.iniEdicion = true;
    this.readOnlyUsuario = false;
    this.opBlanquearForma();
    this.resetValidaciones();

    this.DEntradas.ESTADO = 'ACTIVO';

    // Activa componentes
    this._sdatos.accion = 'r_nuevo';
  }

  async opPrepararModificar(){
    this.readOnly = false;
    this.esEdicion = true;
    this.iniEdicion = true;

    // Activa componentes
    this._sdatos.setObs_Entrada({ accion: 'r_modificar' });

    if(this._sdatos.ID_DOCUMENTO_prev != this.DEntradas.ID_DOCUMENTO && this._sdatos.CONSECUTIVO_prev != this.DEntradas.CONSECUTIVO){
      // Activa modificación si hay integridad a validar
      const prm = { ID_DOCUMENTO: this.DEntradas.ID_DOCUMENTO, CONSECUTIVO: this.DEntradas.CONSECUTIVO, accion: 'integridad' };
      const apiRest = this._sdatos.validellave('EXISTE ENTRADA',prm,'INV014');
      const res = await lastValueFrom(apiRest, {defaultValue: true});
      const msg = JSON.parse(res.data);
      if (msg[0].EXISTE === true && this._sdatos.accion === 'r_nuevo'){
        this.toaMessage = msg[0].ErrMensaje;
        this.toaVisible = true;
        this.toaTipo = 'error';
        showToast(msg[0].ErrMensaje, 'error');
        var fNextEditor:any = this.formEntradas.instance.getEditor('');
        fNextEditor.option('readOnly', false);
      }
      else {
        var fNextEditor:any = this.formEntradas.instance.getEditor('USUARIO');
        fNextEditor.option('readOnly', false);
      }
    }
  }

  opPrepararGuardar(accion: string): void {
    // Acción validación de datos
    if (!this.ValidaDatos('requerido')){
      return;
    }

    const prmDatosGuardar = JSON.parse((JSON.stringify({ ENTRADAS: this.DEntradas})));

    // API guardado de datos
    var exito = false;
    this._sdatos
      .save(accion, prmDatosGuardar, this.prmUsrAplBarReg.aplicacion)
      .subscribe((resp) => {
        const res = JSON.parse(resp.data);
        if (res[0].ErrMensaje !== ""){
          this.showModal(res[0].ErrMensaje);
        } 
        else
        {
          this.readOnly = true;
          this.esEdicion = false;
          // Operaciones de barra
          if (this.mnuAccion === 'new'){
            this.QFiltro = "ID_DOCUMENTO='"+this.DEntradas.ID_DOCUMENTO+"' AND CONSECUTIVO='"+this.DEntradas.CONSECUTIVO+"'";
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              r_numReg: 1,
              r_totReg: 1,
              operacion: {}
            };
          }
          else
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              operacion: {}
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          showToast('Registro actualizado', 'success');
        }
      });
  }

  opEliminar(): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html:
        '¿Desea eliminar la Entrada <i>' +
        this.DEntradas.ID_DOCUMENTO +
        ' ' +
        this.DEntradas.CONSECUTIVO +
        '</i> ?',
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: 'rgb(161 200 237)',
      cancelButtonColor: '#03a9f4',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar',
    }).then((result) => {
      // Procesa eliminación. Llama a la API para validar referenciación y eliminación en tabla
      if (result.isConfirmed){
        this.AccionEliminar();
      }
    });
  }

  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Entradas',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: '',
      Filtro: '',
      keyGrid: ['ID_DOCUMENTO, CONSECUTIVO'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opPrepararBuscar(accion): void {
    if (accion === 'filtro'){
      this._sfiltro.PrmFiltro = {
        Titulo: 'Datos de filtro para Entradas',
        accion: 'PREPARAR FILTRO',
        Filtro: '',
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { ENTRADAS: arrFiltro };
      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined){
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje === ''){
            this.VDatosReg = datares;
            this.DEntradas = datares[0];
            this._sdatos.ID_DOCUMENTO = this.DEntradas.ID_DOCUMENTO;
            this._sdatos.CONSECUTIVO = this.DEntradas.CONSECUTIVO;
            this._sdatos.ID_DOCUMENTO_prev = this.DEntradas.ID_DOCUMENTO;
            this._sdatos.CONSECUTIVO_prev = this.DEntradas.CONSECUTIVO;
            this.QFiltro = datares[0].QFILTRO;
          } else {
            this.VDatosReg = [];
            showToast(datares[0].ErrMensaje, 'warning');
          }

          // Prepara la barra para navegación
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            r_totReg: datares.length,
            r_numReg: 1,
            accion: 'r_navegar',
            operacion: {},
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

          // Trae los items en los componentes asociados
          this.opIrARegistro('r_primero');
          this.loadingVisible = false;
          this._sfiltro.enConsulta = false;
        });
    }
    this.readOnly = true;
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = 'r_numreg';
    switch (accion){
      case 'r_primero':
        this.prmUsrAplBarReg.r_numReg = 1;
        if(this.VDatosReg.length != 0){
          this.DEntradas = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }else{
          this.toaVisible = true;
          this.readOnly = true;
          showToast('No se encontraron Datos', 'error');
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1
            ? 1
            : this.prmUsrAplBarReg.r_numReg - 1;
        this.DEntradas = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DEntradas = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1])
        );
        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DEntradas = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_numreg':
        if (this.prmUsrAplBarReg.r_numReg !== 0){
          // Valida si hubo cambio de ordenamiento en el visor
          if (this.SVisor.ColSort.Columna !== ''){
            if (this.SVisor.ColSort.Clase === 'asc'){
              this.VDatosReg = this.VDatosReg.sort((a: any, b: any) =>
                a[this.SVisor.ColSort.Columna].toUpperCase() <
                b[this.SVisor.ColSort.Columna].toUpperCase()
                  ? -1
                  : 1
              );
            } else {
              this.VDatosReg = this.VDatosReg.sort((a: any, b: any) =>
                a[this.SVisor.ColSort.Columna].toUpperCase() >
                b[this.SVisor.ColSort.Columna].toUpperCase()
                  ? -1
                  : 1
              );
            }
          }
          this.DEntradas = JSON.parse(
            JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
          );
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearForma();
          this.resetValidaciones();
          setTimeout(() => {
            this.formEntradas.instance.resetValues();
          }, 100);
        }
        this.readOnly = true;
        break;
      case 'Eliminado':
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg){
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0){
          this.DEntradas = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        } else {
          this.opBlanquearForma();
        }
        break;
      default:
        break;
    }

    this._sdatos.ID_DOCUMENTO = this.DEntradas.ID_DOCUMENTO;
    this._sdatos.CONSECUTIVO = this.DEntradas.CONSECUTIVO;

    // Navega  los componentes items
    this._sdatos.accion = 'r_numreg';
  }

  opBlanquearForma(): void {
    const nullDate = null;

    this.DEntradas = {
      ID_UN: '',
      ID_DOCUMENTO: '',
      NOMBRE_DOCUMENTO: '',
      PREFIJO: '',
      CONSECUTIVO: 0,
      SUFIJO: '',
      ID_SOPORTE: '',
      NC_SOPORTE: '',
      FECHA: '',
      HORA: nullDate,
      TIPO: '',
      ID_CAUSA: '',
      MOVIMIENTO: '',
      TIPO_INVENTARIO: '',
      ID_UN_ORIGEN: '',
      ID_UN_DESTINO: '',
      DETALLE: '',
      ID_CONDICION: '',
      PLAZO: 0,
      USUARIO: '',
      ESTADO: '',
      FECHA_REGISTRO: nullDate,
      FECHA_VENCIMIENTO: nullDate,
      CONTROL: '',
      TIPO_COMPRA: ''
    };

    this._sdatos.ID_DOCUMENTO = '';
    this._sdatos.CONSECUTIVO = '';
    this._sdatos.ID_DOCUMENTO_prev = '';
    this._sdatos.CONSECUTIVO_prev = '';
    this.DEntradas_prev = JSON.parse(JSON.stringify(this.DEntradas));
  }

  onEditorEnterKey(e){
    e.event.preventDefault();
    var itemsgru:any = this.formEntradas.instance.option('items');
    itemsgru.forEach((g:any) => {
      var items = g['items'];
      var index = items.findIndex((item) => item.dataField === e.dataField);
      if (index !== -1){
        var fNextEditor = this.formEntradas.instance.getEditor(
          items[++index < items.length ? index : 0].dataField
        );
        if (fNextEditor) fNextEditor.focus();
        return;
      }
    });
  }

  onBodegaSelecc(e: any){
    this.DEntradas.ID_UN_DESTINO = e.value;
  }

  onInitNewRow(e){
    e.data.ID_UN = '';
    if (this.DEntradasItems.length > 0) {
      const item = this.DEntradasItems.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    e.data.isEdit = false;
  }

  onInsertingRow(e) {
    e.data.isEdit = true;
    // Valida datos
    if (e.data.PRODUCTO === ''){
      this.toaMessage = 'Faltan completar datos del Producto';
      this.toaVisible = true;
      this.toaTipo = 'warning';
      e.cancel = true;
      showToast('Faltan completar datos del Producto', 'warning');
    }
  }

  onInsertedRow(e){
    // this._sdatos.D_Autorizaciones= this.DAutorizaciones;
  }

  onUpdatingRow(e) {
    // e.data.isEdit = true;
  }

  onRemovedRow(e) {
    // this._sdatos.D_Autorizaciones= this.DAutorizaciones;
  }

  onEditingStart(e) {
    this.gridBoxProductos = [e.data.ID_APLICACION];
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
    }
    if (e.rowType === "header" && e.rowIndex === 2 && !this.esEdicion) {
      e.rowElement.style.display = "none";
    }
  }

  onRowValidating(e: any) {
    // Valida completitud
    if (e.newData.ID_PRODUCTO === '') {
      e.isValid = false;
      showToast('Faltan completar datos de la Entrada del Producto', 'warning');
    }
  }

  onFocusOutDocumentos(e, cellInfo) {
    if (cellInfo.data){
      cellInfo.data.ID_DOCUMENTO = Array.isArray(e.component.option("value")) ? '' : e.component.option("value");
    }
  }

  onSelectionDocumento(e) {
    if (e.name === 'value') {
      this.isGridBoxOpened = false;
    }
  }

  onValueChangedDocumento(e, cellInfo) {
    cellInfo.setValue(e.value);
  }

  onSeleccTipo(e: any): void {
    this.DEntradas.TIPO = e.value;
    this.cambiosItemForma({ dataField: '__obj__ddTipo'});
  }

  onSelectionChangedDocumento(e){
    this.gridBoxDocumento = e.selectedRowKeys;
    this.isGridBoxOpened = false;
    this._sdatos.ID_DOCUMENTO = e.selectedRowKeys[0];
    if (e.data){
      this.DEntradas.NOMBRE_DOCUMENTO = this.DDocumentos.find(p => p.ID_DOCUMENTO === e.data.ID_DOCUMENTO).DESCRIPCION;
      this.isGridBoxOpened = false;
    }
  }

  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  imprimirReporte(id_reporte, archivo, datosrpt) {

    let filtroRep = {FILTRO: ''};
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
    this.tabService.addTab(new Tab(VisorrepComponent,    // visor
                                    datosrpt.text,        // título
                                    { parent: "PrincipalComponent", args: prmLiq }, // parámetro: reporte,filtro
                                    id_reporte,           // código del reporte
                                    '',
                                    'reporte',
                                    true
                          ));
  }

  AccionEliminar(): void {
    // API eliminación de datos
    const prm = { ID_DOCUMENTO: this.DEntradas.ID_DOCUMENTO, CONSECUTIVO: this.DEntradas.CONSECUTIVO };
    this._sdatos
      .delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== ''){
          this.showModal(res[0].ErrMensaje);
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        this.opIrARegistro('Eliminado');
        this.readOnly = true;
        showToast('Entrada eliminado', 'Eliminado');

        // Operaciones de barra
        this.prmUsrAplBarReg.r_totReg--;
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          error: '',
          accion: 'r_navegar',
          operacion: {},
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      });
  }

  ValidaDatos(Accion: string): boolean {
    // Valida datos completados de pestaña <Generales>
    var result = this.formEntradas.instance.validate();

    if (Accion === "requerido"){
      if (this.DEntradas.ID_DOCUMENTO === ""){
        this.showModal('Error al guardar',"Faltan datos","Hay datos incompletos de la Entrada. Revisar contenido de los items marcados!");
        return false;
      }
    }
    return true;
  }

  resetValidaciones(){
    this.formEntradas.instance.resetValues();
  }

  cambiosItemForma(e, accion = 'activar'){
    if (accion === 'activar'){
      if (!this.iniEdicion && !this.readOnly){
        if (!e.dataField.match('__obj__')){
          var dataField = e.dataField;
          document.getElementsByName(dataField)[0].classList.add('is-dirty');
        } else {
          var dataField = e.dataField.replace('__obj__', '');
          document.getElementById(dataField)?.classList.add('is-dirty');
        }
      }
    } else {
      if (!e.dataField.match('__obj__')){
        var dataField = e.dataField;
        document.getElementsByName(dataField)[0].classList.remove('is-dirty');
      } else {
        var dataField = e.dataField.replace('__obj__', '');
        if (document.getElementById(dataField))
          document.getElementById(dataField)?.classList.remove('is-dirty');
      }
    }
  }

  clickTipo(e) {
    // Selecciona el consecutivo
    this.DEntradas.TIPO = e.itemData;
    if (this.DEntradas.TIPO === 'ORDEN DE COMPRA')
      this.editSoloTipoTran = false;
    else
      this.editSoloTipoTran = true;
  }

  async ValideExistencia(e: any){
    if (this.readOnly || !this.mnuAccion.match('new|update')){
      return true;
    }
    if (
      this.mnuAccion === 'update' &&
      this._sdatos.ENTRADA_prev === e.value
    ){
      return true;
    }

    // Valida la existencia de la llave respectiva
    const prm = { };
    const apiRest = this._sdatos.validellave('EXISTE ENTRADA', prm, 'INV014');
    const res = await lastValueFrom(apiRest, { defaultValue: true });
    const msg = JSON.parse(res.data);
    if (msg[0].EXISTE === true){
      showToast(msg[0].ErrMensaje, 'error');
      var fNextEditor:any = this.formEntradas.instance.getEditor('USUARIO');
      fNextEditor.focus();
      return false;
    }
    else {
      return true;
    }
  }

  valoresObjetos(obj: string){
    if (obj == 'documentos' || obj == 'todos'){
      const prm = {ID_APLICACION: this.ID_APLICACION, ESTADO: 'ACTIVO'};
      this._sdatos
        .consulta('DOCUMENTOS', prm, 'ADM007')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DDocumentos = res;
        });
    }

    if (obj == 'tipo movimiento' || obj == 'todos'){
      const prm = {ID_DOMINIO: 'MOVIMIENTOS', ID_GRUPO_DOMINIO: 'TIPOS DE MOVIMIENTO', VALOR2: 'ENTRADA'};
      this._sdatos
        .consulta('ITM_DOMINIOS', prm, 'ADM012')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DTipoMovimiento = res;
        });
    }

    if (obj == 'tipo inventario' || obj == 'todos'){
      const prm = {ID_DOMINIO: 'INVENTARIOS', ID_GRUPO_DOMINIO: 'TIPOS DE INVENTARIO', VALOR2: this.DEntradas.TIPO};
      this._sdatos
        .consulta('ITM_DOMINIOS', prm, 'ADM012')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DTipoMovimiento = res;
        });
    }

    if (obj == 'productos' || obj == 'todos'){
      const prm = {FILTRO: "ACTIVO"};
      this._sdatos
        .consulta('PRODUCTOS', prm, 'PRO022')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DProductos = res;
        });
    }

    if (obj == 'proveedores' || obj == 'todos'){
      const prm = {FILTRO: "ACTIVO"};
      this._sdatos
        .consulta('PROVEEDORES', prm, 'CXP001')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DProveedores = res;
        });
    }
    
    if (obj == 'bodegas' || obj == 'todos'){
      const prm = {};
      this._sdatos
        .consulta('BODEGAS', prm, 'INV002')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DBodegas = res;
        });
    }

    if (obj == 'gravamenes' || obj == 'todos'){
      const prm = {};
      this._sdatos
        .consulta('GRAVAMENES', prm, 'generales')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DBodegas = res;
        });
    }
  }

  ngOnInit(): void {
    const user:any = localStorage.getItem('entrada');
    this.prmUsrAplBarReg = {
      tabla: 'ENTRADAS',
      aplicacion: this.ID_APLICACION,
      usuario: user,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: {},
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this.readOnly = true;
    this._sdatos.accion = 'r_ini';

    this.valoresObjetos('todos');
    this.opBlanquearForma();
  }

  ngOnDestroy(){
    this.subscription.unsubscribe();
    this.subscriptionEntrada.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  showModal(mensaje, titulo = '¡Error!', msg_html = ''){
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
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

  showToast(message:any, type:any, offset:any) {
    const container: any = document.getElementById('router-container');
    notify({
      message: message,
      width: 300,
      position: {
				at: 'top right',
				my: 'top right',
        of: container,
        offset: offset
      },
      animation: {
        show: { type: 'fade', duration: 400, from: 0, to: 1 },
        hide: { type: 'fade', duration: 40, to: 0 }
      },
    },
    type, 4500 );
  }
  
}

@NgModule({
  imports:[
    DxToolbarModule,
    DxPopupModule,
    DxButtonModule
  ]
})
export class AppModule { }