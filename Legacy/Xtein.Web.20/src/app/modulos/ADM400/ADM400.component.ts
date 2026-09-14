import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
import { lastValueFrom, Subject, Subscription} from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import Swal from 'sweetalert2';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLookupModule, DxNumberBoxModule, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { ADM400Service } from 'src/app/services/ADM400/ADM400.service';
import { clsConfigCodigos, clsConfigCodigosItems } from './clsADM400.class';
import notify from 'devextreme/ui/notify';
import { CommonModule } from '@angular/common';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { showToast } from '../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-ADM400',
  templateUrl: './ADM400.component.html',
  styleUrls: ['./ADM400.component.css'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxDropDownBoxModule, DxDataGridModule, DxButtonModule, DxLookupModule, DxSelectBoxModule, DxTextBoxModule, DxNumberBoxModule, VistarapidaComponent]
})
export class ADM400Component implements OnInit {
  @ViewChild('formConfigCodigos', { static: false }) formConfigCodigos: DxFormComponent;
  @ViewChild("gridConfigCodigosItems", { static: false }) gridConfigCodigosItems: DxDataGridComponent;

  //Variables fijas de la Aplicación
  subscription: Subscription;
  subscriptionConfigCodigos: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  subs_filtro: Subscription;
  subs_visor: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  VDatosReg: any;
  QFiltro: any;
  readOnly: boolean;
  readOnlyUdp: boolean;
  objReadOnlyGrid: any = { TIPO: true, CONDICION: true, PREFIJO: true, CANTIDAD_CONSECUTIVO: true, INICIO_CONSECUTIVO: true, INCREMENTO_CONSECUTIVO: true};
  mnuAccion: string;
  esEdicion: boolean = false;
  esCreacion: boolean = false;
  iniEdicion: boolean = false;
  conCambios: number = 0;
  focusedRowIndex: number;
  focusedRowKey: string;
  type: string;
  gridBoxAplicacion: string[] = [];
  isGridBoxAplicacionOpened: boolean;
  isValidRowGrid: boolean;
  isCreatingRow: boolean;
  ID_APLICACION: any = 'ADM-400';
  stylingMode = 'filled';
  dropDownOptions = { width: 700, height: 400, hideOnParentScroll: true};
  dropDownOptionsListBox = { hideOnParentScroll: true, container: '#router-container' };
  dSBEstados = ["ACTIVO","INACTIVO"];
  dSBModos = ["MANUAL","AUTOMATICO"];
  MODOS_CODIFICACION = [{ ITEM:"MANUAL" }, { ITEM:"AUTOMATICO" }];

  //Notificaciones
  toaVisible: boolean;
  toaMessage: string = 'Registro actualizado!';
  toaTipo: string = 'success';
  loadingVisible: boolean = false;

  //Variables de datos
  DConfigCodigos: clsConfigCodigos;
  DConfigCodigosItems: clsConfigCodigosItems[];
  DConfigCodigos_prev: any;
  DConfigCodigosItems_prev: any;
  DAplicaciones: any;

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esVisibleSelecc: string = 'none';

  constructor(
    private _sdatos: ADM400Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private tabService: TabService)
  {
    // Servicio de barra de registro
    this.subscription = this._sbarreg.getObsRegApl().subscribe((datreg) => {
      // Valida si la petición es para esta aplicacion
      if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opMenuRegistro(datreg);
    });

    // Respuesta del filtro
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe(resp => {
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
      const nx = this.VDatosReg.findIndex(d => d.ID_DOCUMENTO === resp.ID_DOCUMENTO && d.CONSECUTIVO === resp.CONSECUTIVO);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx+1;
        this.opIrARegistro('r_numreg');
      }
    })

    // Servicio comunicacion entre pestañas
    this.subscriptionConfigCodigos = this._sdatos
    .getObs_ConfigCodigos()
    .subscribe((datreg) => {
      // Ejecuta de acuerdo al componente hijo
      switch (datreg.componente){
        case 'atributos':
          break;

        default:
          break;
      }
    });
  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes
    this._sdatos.accion = operMenu.accion;
    switch (operMenu.accion){
      case 'r_ini':
        const user:any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'CONFIG_CODIGOS',
          aplicacion: 'ADM-400',
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
        this.readOnlyUdp = false;
        this.objReadOnlyGrid = { TIPO: false, CONDICION: false, PREFIJO: false, CANTIDAD_CONSECUTIVO: false, INICIO_CONSECUTIVO: false, INCREMENTO_CONSECUTIVO: false};
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.readOnly = false;
        this.readOnlyUdp = true;
        this.objReadOnlyGrid = { TIPO: false, CONDICION: false, PREFIJO: false, CANTIDAD_CONSECUTIVO: false, INICIO_CONSECUTIVO: false, INCREMENTO_CONSECUTIVO: false};
        this.esVisibleSelecc = 'always';
        this.rowNew = true;
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        this.esVisibleSelecc = 'none';
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
          text: 'Desea cancelar la operación?',
          iconHtml: "<i class='icon-alert-outline'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar',
        }).then((result) => {
          if (result.isConfirmed){
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this.readOnly = true;
            this.readOnlyUdp = true;
            this.objReadOnlyGrid = { TIPO: true, CONDICION: true, PREFIJO: true, CANTIDAD_CONSECUTIVO: true, INICIO_CONSECUTIVO: true, INCREMENTO_CONSECUTIVO: true};
            this.esEdicion = false;
            this.esCreacion = false;
            this.esVisibleSelecc = 'none';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            // this.DConfigCodigos = JSON.parse(JSON.stringify(this.DConfigCodigos_prev));
            // this.DConfigCodigosItems = JSON.parse(JSON.stringify(this.DConfigCodigosItems_prev));
            this.getPrevData();
            this.opIrARegistro('r_numreg');

            // Restituye los valores
            this.mnuAccion = '';
          }
        });

        break;

      case 'r_vista':
        this.opVista();
        break;

      case 'r_refrescar':
        this.valoresObjetos('ref');
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
    this.readOnlyUdp = false;
    this.objReadOnlyGrid = { TIPO: false, CONDICION: false, PREFIJO: false, CANTIDAD_CONSECUTIVO: false, INICIO_CONSECUTIVO: false, INCREMENTO_CONSECUTIVO: false};
    this.esEdicion = true;
    this.esCreacion = false;
    this.iniEdicion = true;
    this.opBlanquearForma();
  }

  async opPrepararModificar(){
    this.readOnly = false;
    this.readOnlyUdp = true;
    this.objReadOnlyGrid = { TIPO: false, CONDICION: false, PREFIJO: false, CANTIDAD_CONSECUTIVO: false, INICIO_CONSECUTIVO: false, INCREMENTO_CONSECUTIVO: false};
    this.esEdicion = true;
    this.esCreacion = false;
    this.iniEdicion = true;
  }

  opPrepararGuardar(accion: string): void {
    // this.validarCambios();
    // if ( this.conCambios != 0 ) {
      // Acción validación de datos
      if (!this.ValidaDatos('requerido')){
        return;
      }

      const prmDatosGuardar = JSON.parse(
        (JSON.stringify({ CONFIG_CODIGOS: this.DConfigCodigos, ITM_CONFIG_CODIGOS: this.DConfigCodigosItems})).replace(/}{/g,",")
      );

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
            this.readOnlyUdp = true;
            this.objReadOnlyGrid = { TIPO: true, CONDICION: true, PREFIJO: true, CANTIDAD_CONSECUTIVO: true, INICIO_CONSECUTIVO: true, INCREMENTO_CONSECUTIVO: true};
            this.esEdicion = false;
            this.esCreacion = false;
            this.esVisibleSelecc = 'none';
            // Operaciones de barra
            if (this.mnuAccion === 'new'){
              this.QFiltro = "CONFIG_CODIGOS='"+this.DConfigCodigos.ID_APLICACION+"'";
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
    Swal.fire({
      title: '',
      text: '',
      html:
        'Desea eliminar la Configuración de Código para la Aplicación <i>' +
        this.DConfigCodigos.ID_APLICACION+
        '</i> ?',
      iconHtml: "<i class='icon-alert-outline'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar',
    }).then((result) => {
      // Procesa eliminación. Llama a la API para validar referenciación y eliminación en tabla
      if (result.isConfirmed){
        this.AccionEliminar();
      }
    });
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = 'r_numreg';
    switch (accion){
      case 'r_primero':
        this.prmUsrAplBarReg.r_numReg = 1;
        if(this.VDatosReg.length != 0){
          this.DConfigCodigos = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this.DConfigCodigosItems = JSON.parse(JSON.stringify(this.VDatosReg[0].ITM_CONFIG_CODIGOS));
          this.loadData();
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }else{
          showToast('No se encontraron datos', 'error');
          this.readOnly = true;
          this.readOnlyUdp = true;
          this.objReadOnlyGrid = { TIPO: true, CONDICION: true, PREFIJO: true, CANTIDAD_CONSECUTIVO: true, INICIO_CONSECUTIVO: true, INCREMENTO_CONSECUTIVO: true};
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.DConfigCodigos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DConfigCodigosItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_CONFIG_CODIGOS));
        this.loadData();
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length ? this.VDatosReg.length : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DConfigCodigos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1]));
        this.DConfigCodigosItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1].ITM_CONFIG_CODIGOS));
        this.loadData();
        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DConfigCodigos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DConfigCodigosItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_CONFIG_CODIGOS));
        this.loadData();
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
          this.DConfigCodigos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this.DConfigCodigosItems = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_CONFIG_CODIGOS));
          this.loadData();
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearForma();
          this.resetValidaciones();
          setTimeout(() => {
            this.formConfigCodigos.instance.resetValues();
          }, 100);
        }
        this.readOnly = true;
        this.readOnlyUdp = true;
        this.objReadOnlyGrid = { TIPO: true, CONDICION: true, PREFIJO: true, CANTIDAD_CONSECUTIVO: true, INICIO_CONSECUTIVO: true, INCREMENTO_CONSECUTIVO: true};
        break;
      case 'Eliminado':
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg){
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0){
          this.DConfigCodigos = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
          this.DConfigCodigosItems = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_CONFIG_CODIGOS;
          this.loadData();
        } else {
          this.opBlanquearForma();
        }
        break;
      default:
        break;
    }
  }

  opBlanquearForma(): void {
    var now = new Date();
    this.DConfigCodigos = {
      ID_UN: '',
      ID_APLICACION: '',
      MODO: '',
      ESTADO: 'ACTIVO'
    };
    this.DConfigCodigosItems = [];
    this.gridBoxAplicacion = [];
  }

  opVista(): void {
    const VDatosRegAux = this.VDatosReg.map(({ID_APLICACION, MODO, ESTADO}) => ({ID_APLICACION, MODO, ESTADO}));
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(VDatosRegAux));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Configuración de Códigos',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: '',
      Filtro: '',
      keyGrid: ['ID_APLICACION'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opPrepararBuscar(accion): void {
    if (accion === 'filtro'){
      this._sfiltro.PrmFiltro = {
        Titulo: 'Datos de filtro para Configuración de Códigos',
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
      const prm = { CONFIG_CODIGOS: arrFiltro };
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
            this.DConfigCodigos = datares[0];
            this.DConfigCodigosItems = datares[0].ITM_CONFIG_CODIGOS;
            this.loadData();
            // Prepara la barra para navegación
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              r_totReg: datares.length,
              r_numReg: 1,
              accion: 'r_navegar',
              operacion: {},
            };
          } else {
            this.VDatosReg = [];
            showToast(datares[0].ErrMensaje, 'warning');
            this.opBlanquearForma();
            // Prepara la barra para navegación
            const user:any = localStorage.getItem('usuario');
            this.prmUsrAplBarReg = {
              tabla: 'CONFIG_CODIGOS',
              aplicacion: 'ADM-400',
              usuario: user,
              accion: 'r_ini',
              error: '',
              r_numReg: 0,
              r_totReg: 0,
              operacion: { r_modificar: false }
            };
        
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.mnuAccion = '';
            this.readOnly = true;
            this.readOnlyUdp = true;
            this.objReadOnlyGrid = { TIPO: true, CONDICION: true, PREFIJO: true, CANTIDAD_CONSECUTIVO: true, INICIO_CONSECUTIVO: true, INCREMENTO_CONSECUTIVO: true};
            this._sdatos.accion = 'r_ini';
          }

          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

          // Trae los items en los componentes asociados
          this.opIrARegistro('r_primero');
          this.loadingVisible = false;
          this._sfiltro.enConsulta = false;
        });
    }

    this.readOnly = true;
    this.readOnlyUdp = true;
    this.objReadOnlyGrid = { TIPO: true, CONDICION: true, PREFIJO: true, CANTIDAD_CONSECUTIVO: true, INICIO_CONSECUTIVO: true, INCREMENTO_CONSECUTIVO: true};
    this.resetValidaciones();
  }

  onValueChangedModo(e:any, cellInfo:any) {
    if(e.value === 'MANUAL') {
      const item:any = this.DConfigCodigosItems.find((p:any) => p.MODO === 'MANUAL')?.ITEM;
      if(item > 0){
        e.isValid = false;
        showToast('No pueden existir dos configuraciones en Modo Manual', 'warning');
        return;
      }
      cellInfo.data.MODO = e.value;
      cellInfo.data.TIPO = 'SIMPLE';
      cellInfo.data.CONDICION = '';
      cellInfo.data.PREFIJO = '';
      cellInfo.data.CANTIDAD_CONSECUTIVO = 0;
      cellInfo.data.INICIO_CONSECUTIVO = 0;
      cellInfo.data.INCREMENTO_CONSECUTIVO = 0;
      this.objReadOnlyGrid = {
        TIPO: true,
        CONDICION: false,
        PREFIJO: true,
        CANTIDAD_CONSECUTIVO: true,
        INICIO_CONSECUTIVO: true,
        INCREMENTO_CONSECUTIVO: true
      };
      this.gridConfigCodigosItems.instance.cellValue(cellInfo.rowIndex, "MODO", cellInfo.data.MODO);
      this.gridConfigCodigosItems.instance.cellValue(cellInfo.rowIndex, "TIPO", cellInfo.data.TIPO);
    };
    if(e.value === 'AUTOMATICO') {
      cellInfo.data.MODO = e.value;
      cellInfo.data.TIPO = '';
      this.objReadOnlyGrid = { 
        TIPO: false,
        CONDICION: false,
        PREFIJO: false,
        CANTIDAD_CONSECUTIVO: false,
        INICIO_CONSECUTIVO: false,
        INCREMENTO_CONSECUTIVO: false
      };
      this.gridConfigCodigosItems.instance.cellValue(cellInfo.rowIndex, "MODO", cellInfo.data.MODO);
      this.gridConfigCodigosItems.instance.cellValue(cellInfo.rowIndex, "TIPO", cellInfo.data.TIPO);
    };
    this.conCambios++;
  }

  onValueChangedTipo(e:any, cellInfo:any) {
    if(e.value === 'SIMPLE') {
      cellInfo.data.TIPO = e.value;
      this.gridConfigCodigosItems.instance.cellValue(cellInfo.rowIndex, "TIPO", cellInfo.data.TIPO);
    };
    if(e.value === 'COMPUESTO') {
      cellInfo.data.TIPO = e.value;
      this.gridConfigCodigosItems.instance.cellValue(cellInfo.rowIndex, "TIPO", cellInfo.data.TIPO);
    };
    this.conCambios++;
  }

  onValueChangedCondicion(e:any, cellInfo:any) {
    cellInfo.data.CONDICION = e.value;
    this.gridConfigCodigosItems.instance.cellValue(cellInfo.rowIndex, "CONDICION", cellInfo.data.CONDICION);
    this.conCambios++;
  }

  onValueChangedPrefijo(e:any, cellInfo:any) {
    cellInfo.data.PREFIJO = e.value;
    this.gridConfigCodigosItems.instance.cellValue(cellInfo.rowIndex, "PREFIJO", cellInfo.data.PREFIJO);
    this.conCambios++;
  }

  onValueChangedCanidadCon(e:any, cellInfo:any) {
    cellInfo.data.CANTIDAD_CONSECUTIVO = e.value;
    this.gridConfigCodigosItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_CONSECUTIVO", cellInfo.data.CANTIDAD_CONSECUTIVO);
    this.conCambios++;
  }

  onValueChangedInicioCon(e:any, cellInfo:any) {
    cellInfo.data.INICIO_CONSECUTIVO = e.value;
    this.gridConfigCodigosItems.instance.cellValue(cellInfo.rowIndex, "INICIO_CONSECUTIVO", cellInfo.data.INICIO_CONSECUTIVO);
    this.conCambios++;
  }

  onValueChangedIncrementoCon(e:any, cellInfo:any) {
    cellInfo.data.INCREMENTO_CONSECUTIVO = e.value;
    this.gridConfigCodigosItems.instance.cellValue(cellInfo.rowIndex, "INCREMENTO_CONSECUTIVO", cellInfo.data.INCREMENTO_CONSECUTIVO);
    this.conCambios++;
  }

  onValueChangedEstado(e:any, cellInfo:any) {
    cellInfo.data.ESTADO = e.value;
    this.gridConfigCodigosItems.instance.cellValue(cellInfo.rowIndex, "ESTADO", cellInfo.data.ESTADO);
    this.conCambios++;
  }

  onEditingStart(e:any) {
    // this.gridBoxAplicacion = [e.data.PRODUCTO];
  }

  onEditorEnterKey(e){
    e.event.preventDefault();
    var itemsgru:any = this.formConfigCodigos.instance.option('items');
    itemsgru.forEach((g:any) => {
      var items = g['items'];
      var index = items.findIndex((item:any) => item.dataField === e.dataField);
      if (index !== -1){
        var fNextEditor = this.formConfigCodigos.instance.getEditor(
          items[++index < items.length ? index : 0].dataField
        );
        if (fNextEditor) fNextEditor.focus();
        return;
      }
    });
  }

  onFocusedRowChanged(e){
    const rowData = e.row && e.row.data;
    if (rowData) {
      // this.gridBoxProducto = [rowData.PRODUCTO]
      // this.valoresObjetos('atributos');
    }
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
    if (this.isCreatingRow) {
      if (e.newData.MODO == '' || e.newData.TIPO == '') {
        e.isValid = false;
        this.isValidRowGrid = false;
        showToast('Faltan completar datos de la Configuración', 'warning');
        return;
      }
      if ((e.newData.MODO == 'AUTOMATICO') && (e.newData.CONDICION === '' || e.newData.INICIO_CONSECUTIVO <= 0 || e.newData.INCREMENTO_CONSECUTIVO <= 0)) {
        e.isValid = false;
        this.isValidRowGrid = false;
        showToast('Para la Configuración en Modo Automatico se debe contar con una Condición, con un Número de Inicio y Número de Incrementos', 'warning');
        return;
      }
      if (e.newData.MODO === 'AUTOMATICO' && e.newData.TIPO === 'COMPUESTO' && e.newData.PREFIJO === '') {
        e.isValid = false;
        this.isValidRowGrid = false;
        showToast('Para la Configuración en modo Automatico y de Tipo Compuesto, debe contar con un Prefijo', 'warning');
        return;
      }
    }
      this.isValidRowGrid = true;
  }

  onSelectionAplicacion(e:any){
    if (e.name === 'value') {
      this.isGridBoxAplicacionOpened = false;
    }
    if (e.selectedRowsData != null && e.selectedRowsData.length > 0){
      this.DConfigCodigos.ID_APLICACION = e.selectedRowsData[0].ID_APLICACION;
      this.isGridBoxAplicacionOpened = false;
    }
  }

  onToolbarPreparingGrid(e: any) {
    let toolbarItems = e.toolbarOptions.items;
    e.toolbarOptions.items.unshift(
      {
        location: 'before'
      }
    );
  }

  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        if (this.DConfigCodigos.ID_APLICACION !== '' &&
            this.DConfigCodigos.ID_APLICACION !== undefined &&
            this.DConfigCodigos.ID_APLICACION !== null
        ) {
          this.gridConfigCodigosItems.instance.addRow();
          this.rowApplyChanges = true;
          this.isCreatingRow = true;
        } else {
          showToast('Seleccione aplicación', 'error');
          return;
        }
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        break;
      case 'save':
        this.gridConfigCodigosItems.instance.saveEditData();
        if (!this.isValidRowGrid){
          this.rowApplyChanges = true;
          this.rowNew = true;
        }else{
          this.rowApplyChanges = false;
          this.rowNew = true;
          this.isCreatingRow = false;
        }
        break;
      case 'cancel':
        this.gridConfigCodigosItems.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.isCreatingRow = false;
        break;
      case 'delete':
        // Elimina filas seleccionadas
        Swal.fire({
          title: '',
          text: 'Desea eliminar los items seleccionados?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.filasSelecc.forEach((key) => {
              const index = this.DConfigCodigosItems.findIndex(a => a.ITEM === key);
              this.DConfigCodigosItems.splice(index, 1);
            });
            this.gridConfigCodigosItems.instance.refresh();
            this.conCambios++;
          }
        });
        break;

      default:
        break;
    }
  }

  AccionEliminar(): void {
    // API eliminación de datos
    const prm = { CONFIG_CODIGOS: { ID_APLICACION: this.DConfigCodigos.ID_APLICACION} };
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
        showToast('Configuración eliminada', 'success');
        this.readOnly = true;
        this.readOnlyUdp = true;
        this.objReadOnlyGrid = { TIPO: true, CONDICION: true, PREFIJO: true, CANTIDAD_CONSECUTIVO: true, INICIO_CONSECUTIVO: true, INCREMENTO_CONSECUTIVO: true};

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

  getPrevData(){
    this.DConfigCodigos = this.DConfigCodigos_prev;
    this.DConfigCodigosItems = this.DConfigCodigosItems_prev;
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

  initNewRow(e:any){
    this.objReadOnlyGrid = { TIPO: false, CONDICION: false, PREFIJO: false, CANTIDAD_CONSECUTIVO: false, INICIO_CONSECUTIVO: false, INCREMENTO_CONSECUTIVO: false};

    e.data.ID_UN = this.DConfigCodigos.ID_UN;
    e.data.ID_APLICACION = this.DConfigCodigos.ID_APLICACION;
    e.data.MODO = '';
    e.data.TIPO = '';
    e.data.CONDICION = '';
    e.data.PREFIJO = '';
    e.data.CANTIDAD_CONSECUTIVO = 0;
    e.data.INICIO_CONSECUTIVO = 0;
    e.data.INCREMENTO_CONSECUTIVO = 0;
    e.data.ESTADO = 'ACTIVO';
    if (this.DConfigCodigosItems.length > 0) {
      const item = this.DConfigCodigosItems.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    e.data.isEdit = false;
  }

  insertedRow(e){
    this.rowApplyChanges = false;
  }

  insertingRow(e) {
    this.conCambios++;
    e.data.isEdit = true;
    // Valida datos
    if (e.data.PRODUCTO === ''){
      showToast('Faltan completar datos del Producto', 'warning');
      e.cancel = true;
    }
  }

  loadDataToVariables(){
    this.gridBoxAplicacion = [this.DConfigCodigos.ID_APLICACION];
  }

  loadData(){
    this.loadDataToVariables();
    this.setPrevData();
  }

  removedRow(e) {
    this.rowApplyChanges = false;
  }

  resetValidaciones(){
    //this.formConfigCodigosCodigos.instance.resetValues();
  }

  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  setPrevData(){
    this.DConfigCodigos_prev = this.DConfigCodigos;
    this.DConfigCodigosItems_prev = this.DConfigCodigosItems;
  }

  showModal(mensaje, titulo = '¡Error!', msg_html = ''){
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-circle'></i>",
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

  updatedRow(e){
    this.rowApplyChanges = false;
  }

  updatingRow(e) {
    this.conCambios++;
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = true;
  }

  ValidaDatos(Accion: string): boolean {
    var msg = '';
    if (Accion === "requerido"){
      if (this.DConfigCodigos.ID_APLICACION == null || this.DConfigCodigos.ID_APLICACION == ''){
        this.showModal('Error al guardar',"Faltan datos","Debe especificar la Aplicación asociada a la Configuración");
        return false;
      }
      if(this.DConfigCodigosItems === undefined || this.DConfigCodigosItems.length == 0){
        this.showModal('Error al guardar',"Faltan datos","No se ha asociado ningún Configuración de Código a la Aplicación "+this.DConfigCodigos.ID_APLICACION);
        return false;
      }
    }
    return true;
  }

  valoresObjetos(obj: string){
    if (obj == 'aplicaciones' || obj == 'todos' || obj == 'ref') {
      this._sdatos.consulta('APLICACIONES',{ESTADO: 'ACTIVO', TIPO: 'APLICACION'},'ADM-001').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DAplicaciones = res;
      });
    }
  }

  ngOnInit(): void {
    const user:any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: 'CONFIG_CODIGOS',
      aplicacion: 'ADM-400',
      usuario: user,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_modificar: true }
    };

    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this.readOnly = true;
    this.readOnlyUdp = true;
    this.objReadOnlyGrid = { TIPO: true, CONDICION: true, PREFIJO: true, CANTIDAD_CONSECUTIVO: true, INICIO_CONSECUTIVO: true, INCREMENTO_CONSECUTIVO: true};
    this.rowNew = false;
    this._sdatos.accion = 'r_ini';

    this.valoresObjetos('todos');
    this.opBlanquearForma();
  }

  ngOnDestroy(){
    this.subscription.unsubscribe();
    this.subscriptionConfigCodigos.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }
}
