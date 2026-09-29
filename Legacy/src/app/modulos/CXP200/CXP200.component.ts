import { Component, ViewChild } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { DxButtonModule, DxDataGridModule, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLoadPanelModule, 
         DxSelectBoxModule, 
         DxTabsModule, 
         DxTagBoxModule, 
         DxTextBoxModule, 
         DxTreeListModule,
         DxValidatorModule} from 'devextreme-angular';
import { clsAcreedores } from './clsCXP200.class';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { Subject, Subscription, lastValueFrom, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import Swal from 'sweetalert2';
import { showToast } from '../../shared/toast/toastComponent.js';
import notify from 'devextreme/ui/notify';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { validatorRes } from 'src/app/shared/validator/validator';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { XcSelectboxComponent } from 'src/app/shared/xc-selectbox/xc-selectbox.component';
import { CXP200Service } from 'src/app/services/CXP200/s_CXP200.service';
import { XcComboGridComponent } from 'src/app/shared/xc-combo-grid/xc-combo-grid.component';
import { DirtelinfoComponent } from 'src/app/shared/dirtelinfo/dirtelinfo.component';
import { CXP20001Component } from './CXP20001/CXP20001.component';
import { FiltrobusqComponent } from 'src/app/shared/filtrobusq/filtrobusq.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';
import { deltaMapActualValue } from 'devexpress-dashboard/model/index.metadata';

@Component({
  selector: 'app-CXP200',
  templateUrl: './CXP200.component.html',
  styleUrls: ['./CXP200.component.css'],
  standalone: true,
  imports: [MatTabsModule, DxLoadPanelModule, DxFormModule, DxSelectBoxModule,
            DxDropDownBoxModule, DxDataGridModule, DxTreeListModule, DxButtonModule,
            XcSelectboxComponent, XcComboGridComponent, DxTextBoxModule,
            DxTagBoxModule, DirtelinfoComponent, CXP20001Component, DxValidatorModule,
            DxTabsModule, FiltrobusqComponent, GeninformesComponent
    ]
})
export class CXP200Component {

  @ViewChild("formAcreedores", { static: false }) formAcree: DxFormComponent;
  @ViewChild('validIdLegal', { static: false }) myValidator;  

  send_dataUbicaciones: any;
  send_dataCondiciones: any;

  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  colCountByScreen: object;

  prmUsrAplBarReg: clsBarraRegistro;
	conCambios: number = 0;
  mnuAccion: string;
	VDatosReg: any;

  tabsInfoAcreedores: string[] = ['Identificación','Ubicaciones','Financieros', 'Histórico'];

  FAcreedores: clsAcreedores;
  readOnly: boolean = false;
  readOnlyLlave: boolean = false;
  readOnlyForm: boolean = false;
  openIdLegal: boolean = false;
  openGrupo: boolean = false;
  openContacto: boolean = false;
  openActividad: boolean = false;
  openRepresentante: boolean = false;
  idTributariasVisible: boolean = false;
  esEdicion: boolean = false;
  esInicioDatos: boolean = false;
  esCreacion: boolean = false;
  esInicioObj: any;
  iniEdicion: boolean = false;
  especAplicacion: any;
  especUsuarioEmail: string = ''; 
  especModoEnvioEmail: string = ''; 

  focusedRowIndex: number;
  focusedRowKeyGrupos: string;
  focusedRowKeyContactos: string;
  focusedRowKeyRepresentante: string;
  aceptarButtonOptions: any;
  closeButtonOptions: any;
  FAcreedores_prev: any;
  rowsSelectedPerfil: any;
  rowsSelectedRT: any;

  DIdLegal: any = [];
  DGrupos: any = [];
  DContactos: any = [];
  DRepresentante: any = [];
  DPerfilTributario: any = [];
  DRT: any = [];
  DActividad: any = [];
  DidTributaria: any = [];
  DidPerfilesTributarios: any = [];
  DEstados: any[] = ['ACTIVO','INACTIVO'];
  DTipoIdLegal: any = [];
  DPersona: any = [];
  selectIdLegal: any[] = [];
  selectGrupo: any[] = [];
  selectContactos: any[] = [];
  selectRepresentante: any[] = [];
  selectPerfilTributario: any[] = [];
  selectTributario: any[] = [];
  selectActividad: any[] = [];
  treeBoxGrupo: any[] = [];
  perfilButton: any;
  isTreeBoxOpened: boolean;
  focusedRowKey: string;
  dropDownOptions = { width: 600, 
    height: 400, 
    hideOnParentScroll: true,
    container: '#router-container' };
  tabVisible: any[] = ["block","none","none","none"];

  QFiltro: any;
  filterIdLegal: any ='';
  
  customValueSboxIdLegal: boolean = false;
  eventsSubjectSboxIdLegal: Subject<any> = new Subject<any>();
  eventsSubjectPerfilTrib: Subject<any> = new Subject<any>();
  eventsSubjectDirTelInfo: Subject<any> = new Subject<any>();
  eventsSubjectCondProv: Subject<any> = new Subject<any>();
  eventsSubjectSboxContacto: Subject<any> = new Subject<any>();
  eventsSubjectContacto: Subject<any> = new Subject<any>();
  eventsSubjectFiltro: Subject<any> = new Subject<any>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();
  customValueSboxContacto: boolean = false;
  DEmail: any;
  DDirecciones: any;
  DTelefonos: any;
  DCondiciones: any;
  DContactoAdic: any;
  DProveedoresPro: any;
  DBancos: any;

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

  // notificaciones
	type = 'info'
  toaVisible: boolean;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';
  loadingVisible: boolean = false;
  positionOf: string;

  callbacks = [];
  borderStyle: string = "none";
  adapterConfig = {
    getValue: () => {
      return this.FAcreedores.ID_LEGAL;
    },
    applyValidationResults: (e) => {
      this.borderStyle = e.isValid ? "none" : "1px solid red";
    },
    validationRequestsCallbacks: this.callbacks
  };
  
  constructor(
    private _sdatos: CXP200Service,
		private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private SVisor: SvisorService,
    private tabService: TabService
  ) { 
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
    })

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex(d => d.ID_PROVEEDOR === resp.ID_PROVEEDOR);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx+1;
        this.opIrARegistro('r_numreg');
      }
    })

    this.colCountByScreen = {
      xs: 1,
      sm: 2,
      md: 2,
      lg: 2,
    };

    this.perfilButton = {
      icon: 'arrowup',
      type: 'default',
      onClick: (e) => {
        this.popupPerfilTributario();
      },
    };

    this.ValideExistencia = this.ValideExistencia.bind(this);

  }

  // Valores de cargue inicial
  valoresDefecto() {
    if(this.especAplicacion) {
      // Cuentas de email usuario
      this.especUsuarioEmail = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'EMAIL USUARIO')?.TITULO ?? '';
      this.especModoEnvioEmail = this.especAplicacion.find((e:any) => e.NOMBRE_OBJETO === 'MODO ENVIO EMAIL')?.VALOR_DEFECTO ?? '';

    }
  }

  ngOnInit(): void {
    const user:any = localStorage.getItem("usuario");
    this.prmUsrAplBarReg = {
      tabla: "PROVEEDORES",
      aplicacion: "CXP-200",
      usuario: user,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: {}
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this._sdatos.accion = 'r_ini';
    this.FAcreedores = new clsAcreedores;

    // Inicializa datos
    this.valoresObjetos('todos');

  }

  ngAfterViewInit(): void {
    this.activarEdicion('ini');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  // Recibe los datos del selectbox idlegal
  onSeleccIdLegal(e: any) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;
    if (isNaN(e.value) || e.value === '') {
      showToast('Identificación legal debe ser tipo numérico');
      e.component.focus();
      this.borderStyle = "1px solid red"
      this.FAcreedores.ID_LEGAL = "";
      this.eventsSubjectSboxIdLegal.next('reset');
      return;
    }
    else {
      this.borderStyle = "none";
    }

    if (e !== 'refrescar') {
      this.FAcreedores.ID_LEGAL = e.value;
      this.FAcreedores.CONTACTO = e.value;
      this.conCambios++;
      const dnomprov = this.DIdLegal.find(p => p.ID_LEGAL == e.value);
      if (dnomprov) {
        this.FAcreedores.NOMBRE = dnomprov.NOMBRE;
        this.FAcreedores.NOMBRE2 = dnomprov.NOMBRE2;
        this.FAcreedores.APELLIDO = dnomprov.APELLIDO;
        this.FAcreedores.APELLIDO2 = dnomprov.APELLIDO2;
        this.FAcreedores.TIPO = dnomprov.TIPO_ID;
        this.FAcreedores.PERSONA = dnomprov.PERSONA;
      }
    }
  }

  // Llama al popUp de perfiles tributarios / tasas
  popupPerfilTributario() {

    // Ubica el item, construyendo uno concatenado en la lista general de PT
    const cols = JSON.parse(this.DPerfilTributario[0].PERFIL_TRIBUTARIO[0].COLUMNAS);
    var perfilArray: any = [];
    var elemperf = "";
    this.DPerfilTributario[0].PERFIL_TRIBUTARIO.forEach(elpt => {
      elemperf = "";
      cols.forEach(elept => {
        elemperf += (elemperf !== "" ? "|" : "") + [elept.dataField] + ':' + elpt[elept.dataField];
      });
      perfilArray.push(elemperf);
    });
    const seleccPerfil = this.FAcreedores.PERFIL_TRIBUTARIO.split('~')[0];
    this.rowsSelectedPerfil = [{ ITEM: perfilArray.indexOf(seleccPerfil) }];

    const dataConfig = JSON.parse(this.DPerfilTributario[0].PERFIL_TRIBUTARIO[0].COLUMNAS);
    const dataConfigAlt = [{ dataField : "ID_TASA", caption: "Id Tasa", width: "200" },
                           { dataField : "DESCRIPCION", caption: "Nombre" },
                           { dataField : "PORCENTAJE", caption: "%", alignment: "right", format: "0.00" },
                           { dataField : "VALOR_BASE", caption: "Base", alignment: "right", format: "#,##0" },
                           { dataField : "APLICA_BASE", caption: "Aplica Base", alignment: "left", editable: "true" },
                           { dataField : "CLASE", caption: "Clase", groupIndex: "0", 
                              templateGroup: ["CLASE"] },
                          ];
    var seleccTasas: any = [];
    this.DPerfilTributario[0].LISTA_TASAS.forEach(eletasa => {
      eletasa.PORCENTAJE = eletasa.PORCENTAJE * 100;
      eletasa.APLICA_BASE = false;
      if (this.FAcreedores.PERFIL_TASAS) {
        const ix = this.FAcreedores.PERFIL_TASAS.findIndex(t => t.ID_TASA === eletasa.ID_TASA);
        if (ix !== -1) {
          eletasa.APLICA_BASE = this.FAcreedores.PERFIL_TASAS[ix].APLICA_BASE;
          seleccTasas.push({ ID_TASA: this.FAcreedores.PERFIL_TASAS[ix].ID_TASA });
        };
      }
    });
    this.eventsSubjectPerfilTrib.next({ 
      dataSource: this.DPerfilTributario[0].PERFIL_TRIBUTARIO, 
      rowsSelected: this.rowsSelectedPerfil,
      keyExpr: ["ITEM"],
      titGrid: "Asociación de Perfiles Tributarios", 
      modoSelection: 'single',
      colsConfig: dataConfig, 
      container: 'tab',
      style: { height: 400, width: 800 },
      datosAlt: { dataSource: this.DPerfilTributario[0].LISTA_TASAS, 
                  rowsSelected: seleccTasas,
                  keyExpr: ["ID_TASA"],
                  titGrid: "Asociación de Tasas", 
                  colsConfig: dataConfigAlt,
                  modoSelection: 'multiple'
                }
     });

  }

  // Recibe los datos del selectbox perfil tributario
  onRespuestaPerfilTrib(e: any) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;

    if (e !== 'refrescar') {
      // Perfil tributario
      const cols = JSON.parse(e.rowsSelected[0].COLUMNAS);
      var perfil: any = [];
      var busqperf: string = "";
      cols.forEach(elept => {
        perfil.push({ [elept.dataField]: e.rowsSelected[0][elept.dataField] });
        busqperf += (busqperf !== "" ? "|" : "") + [elept.dataField] + ':' + e.rowsSelected[0][elept.dataField];
      });

      // Tasas 
      if (e.rowsSelectedAlt)
        this.FAcreedores.PERFIL_TASAS = e.rowsSelectedAlt.map(({ID_TASA,APLICA_BASE}) => ({ID_TASA,APLICA_BASE}));
      else
        this.FAcreedores.PERFIL_TASAS = [];
      this.FAcreedores.PERFIL_TRIBUTARIO = busqperf + (this.FAcreedores.PERFIL_TASAS.length !== 0 ? '~'+e.rowsSelectedAlt.map(t => t.ID_TASA+'^'+(t.APLICA_BASE ? 1 : 0)).join('|') : '');
      this.conCambios++;

    }
  }

  // Recibe los datos del componente de direcciones
  onRespuestaDirTelInfo(e: any) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;

    if (e !== 'refrescar') {
      // Manejar los datos normalmente
      if (e.EMAIL) this.DEmail = e.EMAIL;
      if (e.DIRECCIONES) this.DDirecciones = e.DIRECCIONES;
      if (e.TELEFONOS) this.DTelefonos = e.TELEFONOS;
    }
  }

  // Recibe los datos del componente de direcciones
  onRespuestaCondProv(e: any) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;

    if (e !== 'refrescar') {
    }
  }

  onRespuestaFiltro(e: any) {
  }

  onKeyDownPerfil(e: any) {
    e.event.preventDefault();
    return false;
  }

  // Cambios en la Rep Tributaria
  onValueRT(e:any) {
    if ((e.value !== null) && (e.value !== undefined) && (e.value !== '')) {
      
    }
  }

  onSeleccEstado(e: any): void {
    this.FAcreedores.ESTADO = e.value;
  }

  onSeleccClase(e: any): void {
    this.FAcreedores.CLASE = e.value;
  }

  // Llama a Acciones de registro
	opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes

		switch (operMenu.accion) {
			case "r_ini":
				const user:any = localStorage.getItem("usuario");
        this.prmUsrAplBarReg = {
          tabla: "PROVEEDORES",
          aplicacion: "CXP-200",
          usuario: user,
					accion: "r_ini",
					error: "",
					r_numReg: 0,
					r_totReg: 0,
					operacion: { }
				};
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

			case 'r_nuevo':
				this.mnuAccion = "new";
				this.opPrepararNuevo();
				break;

			case 'r_modificar':
				this.mnuAccion = "update";
				this.opPrepararModificar();
				break;

			case 'r_guardar':
				this.opPrepararGuardar(this.mnuAccion);
				break;

			case 'r_buscar':
				if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          this.toaMessage = 'Consulta en proceso, por favor espere.';
          this.toaVisible = true;
          this.toaTipo = 'warning';
        }
				break;

			case 'r_buscar_ejec':
        this.opBlanquearForma();
        if (operMenu.operacion.filtro_arg) {
          this.opPrepararBuscar(operMenu.operacion.filtro_arg)
        }
        else {
          if (this._sfiltro.enConsulta === false) {
            this.opPrepararBuscar('');
          } else {
            showToast('Consulta en proceso, por favor espere.', 'warning');
          }
        }
				break;

			case 'r_eliminar':
				this.opEliminar();
				break;

      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
        this.opIrARegistro(operMenu.accion);
        break;

			case 'r_cancelar':
				var mensaje = '¿Desea cancelar la operación?';
				if (this.conCambios != 0) mensaje = '¿Desea cancelar sin guardar cambios?';
        Swal.fire({
          title: '',
          text: mensaje,
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar'
          }).then((result) => {
          if (result.isConfirmed) {
            this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
            // Restituye los valores
            this.readOnly = true;
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.mnuAccion = "";
            this.opIrARegistro('r_numreg');
          }
        });
				break;

			case 'r_vista':
				this.opVista();
				break;

			case 'r_imprimir':
        var prmRep = { ...operMenu.operacion, 
                         accion: 'previsualizar',
                         aplicacion: this.prmUsrAplBarReg.aplicacion, 
                         tabla: this.prmUsrAplBarReg.tabla,
                         usuario: this.prmUsrAplBarReg.usuario,
                         QFiltro: (operMenu.operacion.registro === 'todos') 
                                   ? this.QFiltro 
                                   : " PROVEEDORES.ID_PROVEEDOR = '"+this.FAcreedores.ID_PROVEEDOR+"'" 
                        };
        if (operMenu.operacion.modo === 'previsualizar')
          this.eventsSubjectInformes.next(prmRep);
        if (operMenu.operacion.modo === 'pdf') {
          prmRep = { ...prmRep, accion: 'pdf' };
          this.eventsSubjectInformes.next(prmRep);
        }
        if (operMenu.operacion.modo === 'email') {
          let template = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'TEMPLATE')?.VALOR_DEFECTO ?? '';
          let asunto = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'ASUNTO EMAIL')?.VALOR_DEFECTO ?? '';
          let email_sale = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'EMAIL USUARIO')?.VALOR_DEFECTO ?? '';
          let nom_usr = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'EMAIL USUARIO')?.TITULO ?? '';
          var prmRep = { ...operMenu.operacion, 
                        accion: 'email',
                        asunto,
                        email_sale,
                        especUsuarioEmail: nom_usr,
                        nombre: this.FAcreedores.NOMBRE_COMPLETO,
                        email: this.DEmail.length !== 0 ? this.DEmail[0].EMAIL : '',
                        template,
                        replacements: '',
                        dataSource: this.FAcreedores
                      };
          this.eventsSubjectInformes.next(prmRep);
        }
				break;

			default:
				break;
		}
	}

  opPrepararNuevo(): void {
    // Activa componentes
    this.opBlanquearForma();
    this.FAcreedores.ESTADO = 'ACTIVO';
    this.FAcreedores.FECHA_REGISTRO = new Date();
    this.customValueSboxIdLegal = true;
    this.customValueSboxContacto = true;
    this.eventsSubjectSboxIdLegal.next('reset');
    this.treeBoxGrupo = [];
    this.activarEdicion('llave');
  }

  async opPrepararModificar()  {
		this.readOnly = false;

    // Valida la existencia
    this.activarEdicion('activo');
    const prm = { ID_PROVEEDOR: this.FAcreedores.ID_PROVEEDOR, accion: 'integridad referencial' };
    const apiRest = this._sdatos.validar('EXISTE PROVEEDOR',prm,this.prmUsrAplBarReg.aplicacion);
    let res = await lastValueFrom(apiRest, {defaultValue: true});
    res = JSON.parse(res.data); 
    if (res[0].ErrMensaje !== '') {
      showToast(res[0].ErrMensaje, 'error');
      this.readOnlyLlave = true;
    }
    this.eventsSubjectSboxIdLegal.next({valorDefecto: String(this.FAcreedores.ID_LEGAL)});

  }

  ValidaDatos(Accion: string): boolean {
    var msg = '';
    if (Accion === "requerido"){
      if(this.FAcreedores.ID_PROVEEDOR === '') msg += 'Id Acreedor ,';
      if(this.FAcreedores.ID_LEGAL == null) msg += 'Id Legal,';
      if(this.FAcreedores.NOMBRE === null || this.FAcreedores.NOMBRE === '') msg += 'Nombre proveedor,';
      if(this.FAcreedores.TIPO === '') msg += 'Tipo Proveedor ,';
      if(this.FAcreedores.ID_GRUPO === '') msg += 'Grupo Proveedor ,';
      if(this.FAcreedores.PERFIL_TRIBUTARIO === '') msg += 'Perfil Tributario ,';
      if(this.FAcreedores.RT === '') msg += 'Representación tributaria ,';
      if(this.FAcreedores.CLASE === '') msg += 'Clase proveedor ,';
      if(this.DEmail === undefined || this.DEmail.length === 0) msg += 'Correos: No se ha asociado ningún correo.';
      // Validar que todos los emails estén completos
      if(this.DEmail && this.DEmail.length > 0) {
        const emailsIncompletos = this.DEmail.filter((email: any) => !email.EMAIL || email.EMAIL.trim() === '');
        if(emailsIncompletos.length > 0) {
          msg += `Correos: Faltan completar los siguientes emails: ${emailsIncompletos.map((e: any) => e.ETIQUETA).join(', ')}. `;
        }
      }
      if(this.DDirecciones === undefined || this.DDirecciones.length === 0) msg += 'Direcciones: No se ha asociado ninguna dirección.';
      if (msg !== '') {
        this.showModal("Hay datos incompletos en los datos del proveedor: "+msg,"Faltan datos",'');
        return false;
      }
    }
    return true;
  }

  opPrepararGuardar(accion: string): void {
    // Acción validación de datos
    if (!this.ValidaDatos('requerido')){
      return;
    }

    const prmDatosGuardar = { ACREEDOR: this.FAcreedores, 
                              ADIC_ACREEDORES: this.DContactoAdic, 
                              EMAIL: this.DEmail,
                              DIRECCIONES: this.DDirecciones,
                              TELEFONOS: this.DTelefonos,
                              CONDICIONES: this.DCondiciones,
                              PROVEEDORES_EVAL: this.DProveedoresPro,
                              BANCOS: this.DBancos,
                              USUARIO: this.prmUsrAplBarReg.usuario
                             }

    // API guardado de datos
    var exito = false;
    this.loadingVisible = true;

    console.log(prmDatosGuardar)
    this._sdatos
    .save(accion, prmDatosGuardar, this.prmUsrAplBarReg.aplicacion)
    .subscribe((resp) => {
      this.loadingVisible = false;
      const res = JSON.parse(resp.data);
      if (res[0].ErrMensaje !== ""){
        this.showModal(res[0].ErrMensaje, 'error');
      } 
      else
      {
        this.readOnly = true;
        this.esEdicion = false;
        this.esCreacion = false;
        this.esVisibleSelecc = 'none';

        // Operaciones de barra
        if (this.mnuAccion === 'new'){
          this.QFiltro = " PROVEEDORES.ID_PROVEEDOR = '"+this.FAcreedores.ID_PROVEEDOR+"'"
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

  opPrepararBuscar(accion): void {
		if (accion === "filtro") 
    {

      // this._sfiltro.PrmFiltro = {
      //   Titulo: "Datos de filtro para Acreedores",
      //   accion: "PREPARAR FILTRO",
      //   Filtro: "",
      //   TablaBase: this.prmUsrAplBarReg.tabla,
      //   aplicacion: this.prmUsrAplBarReg.aplicacion
      // };
      // this._sfiltro.getObsFiltro.emit(true);

      const prmFiltro = {
        Titulo: "Datos de filtro para Acreedores",
        accion: "activar",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
        objRegistro: this._sbarreg, 
        objTab: this.tabService,
        usuario: this.prmUsrAplBarReg.usuario,
        title: 'Proveedores'
      };
      this.eventsSubjectFiltro.next(prmFiltro);

    } 
    else 
    {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { PROVEEDORES: arrFiltro };

      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
        .consulta('consulta', prm,this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje === '') {
            // Asocia datos
            if ( datares??'' != '' ) {
              this.VDatosReg = datares;
              this.FAcreedores = datares[0];
              this.QFiltro = datares[0].QFILTRO;
              
              this.selectRepresentante = [this.FAcreedores.REPRESENTANTE];
              this.selectIdLegal = [this.FAcreedores.ID_LEGAL];
              this.selectGrupo = [this.FAcreedores.ID_GRUPO];
              
              // Acondiciona peril tributario
              // if (this.FAcreedores.PERFIL_TRIBUTARIO??'' !== '') {
              //   this.FAcreedores.PERFIL_TRIBUTARIO = this.FAcreedores.PERFIL_TRIBUTARIO.split('|');
              // }

            }

          } else {
            this.VDatosReg = [];
            this.loadingVisible = false;
            //notificació
            showToast(datares[0].ErrMensaje, 'warning');
            //this.opBlanquearForma();
          }
          // Prepara la barra para navegación
          this.prmUsrAplBarReg = {...this.prmUsrAplBarReg,
            r_totReg: datares.length,
            r_numReg: 1,
            accion: 'r_navegar',
            operacion: {}
          }
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

          // Trae los items en los componentes asociados
          this.opIrARegistro('r_primero');
          this.loadingVisible = false;
          this._sfiltro.enConsulta = false;
      });
    }
	}

  opEliminar(): void {
    Swal.fire({
      title: '',
      text: '',
      html:
        'Desea eliminar el proveedor <i>' +
        this.FAcreedores.ID_PROVEEDOR +
        '</i> ?',
      iconHtml: "<i class='icon-alert-ol'></i>",
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
  AccionEliminar(): void {
    // API eliminación de datos
    const prm = { ACREEDORES: { ID_PROVEEDOR: this.FAcreedores.ID_PROVEEDOR } };
    this._sdatos
      .delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== ''){
          this.showModal(res[0].ErrMensaje, 'error');
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        showToast('Proveedor eliminado!', 'success');
        this.readOnly = true;

        // Operaciones de barra
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          error: '',
          accion: 'r_navegar',
          operacion: {},
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.opIrARegistro("Eliminado");
      });
  }


  // Navegación de registro
  opIrARegistro(accion: string): void {
    this.borderStyle = "none";
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        this.prmUsrAplBarReg.r_numReg = 1;
        if (this.VDatosReg.length != 0){
          this.FAcreedores = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.FAcreedores = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
        this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
          ? this.VDatosReg.length
          : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FAcreedores = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.FAcreedores = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_numreg":
        if (this.prmUsrAplBarReg.r_numReg !== 0) {
          // Valida si hubo cambio de ordenamiento en el visor
          if (this.SVisor.ColSort.Columna !== "") {
            if (this.SVisor.ColSort.Clase === "asc") {
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
        }
        else {
          this.opBlanquearForma();
          setTimeout(() => {  
            this.formAcree.instance.resetValues();  
          }, 100);  
        }
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          this.FAcreedores =
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        }
        break;

      default:
        break;
    }

    // activa/inactiva propiedades
    try {
      this._sdatos.accion = 'r_numreg';
      this.treeBoxGrupo = [this.FAcreedores.ID_GRUPO];
      this.readOnly = true;
      this.readOnlyForm = true;
      this.readOnlyLlave = true;
      if (this.FAcreedores.PERFIL_TRIBUTARIO == null) this.FAcreedores.PERFIL_TRIBUTARIO = '';
      if (this.FAcreedores.FECHA_REGISTRO == null) this.FAcreedores.FECHA_REGISTRO = new Date();

      // Valores de sbox
      this.eventsSubjectSboxIdLegal.next({ valorDefecto: String(this.FAcreedores.ID_LEGAL) });      
      this.customValueSboxIdLegal = true;
      this.customValueSboxContacto = true;
      this.customValueSboxContacto = true;

      // DataSource's asociados
      this.DDirecciones = this.FAcreedores["DIRECCIONES"];
      this.DTelefonos = this.FAcreedores["TELEFONOS"];
      this.DEmail = this.FAcreedores["ITM_EMAIL"];
      this.DContactoAdic = this.FAcreedores["ADIC_ACREEDORES"];
      this.DCondiciones = { CONDICIONES: this.FAcreedores["CONDICIONES"], ADICIONALES: this.FAcreedores["CONDICIONES_ADIC"] };
      this.DProveedoresPro = this.FAcreedores["PROVEEDORES_PRO"];
      this.DBancos = this.FAcreedores["BANCOS"];
  
      // Navega  los componentes items
      this.eventsSubjectDirTelInfo.next({ operacion: 'consulta',
                                          Dir: { dataSource: this.DDirecciones?? [] },
                                          Tel: { dataSource: this.DTelefonos?? [] },
                                          Email: { dataSource: this.DEmail?? [] },
                                          Contacto: { dataSource: this.DContactoAdic?? {} }
                                       });
      this.eventsSubjectCondProv.next({ operacion: 'consulta', 
                                        dataSource: { ADICIONALES: this.DCondiciones.ADICIONALES?? {},
                                                      CONDICIONES: this.DCondiciones.CONDICIONES?? [],
                                                      PROVEEDORES_PRO: this.DProveedoresPro?? [],
                                                      BANCOS: this.DBancos?? []
                                                    }
                                      });
      
    } catch (error) {
      this.showModal(error);
    }

  }

  opBlanquearForma(): void {
    this.FAcreedores = {
      ID_PROVEEDOR: '',
      ESTADO: '',
      ID_LEGAL: '',
      NOMBRE: '',
      NOMBRE2: '',
      NOMBRE_COMPLETO: '',
      APELLIDO: '',
      APELLIDO2: '',
      APELLIDO_COMPLETO: '',
      TIPO: '',
      PERFIL_TRIBUTARIO: '',
      PERFIL_TASAS: '',
      ID_GRUPO: '',
      CONTACTO: '',
      NOMBRE_CONTACTO: '',
      REPRESENTANTE: '',
      CLASE: '',
      COMENTARIOS: '',
      FECHA_REGISTRO: new Date(),
      RT: '',
      TIPO_ID: '',
      PERSONA: ''
    };
    
    this.DContactoAdic = [];
    this.DEmail = [];
    this.DDirecciones = [];
    this.DTelefonos = [];
    this.DCondiciones = [];
    this.DProveedoresPro = [];
    this.DBancos = [];
    this.FAcreedores_prev = JSON.parse(JSON.stringify(this.FAcreedores));
    this.borderStyle = "none";

    // Inicializa adicionales
    this.eventsSubjectDirTelInfo.next({ operacion: 'nuevo'});
    this.eventsSubjectCondProv.next({ operacion: 'nuevo'});

  }

  opVista(): void {
		/*this.prmUsrAplBarReg.error = '';
		this.prmUsrAplBarReg.accion = 'pos_Visor';
		this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
		this.SVisor.PrmVisor = {
			Titulo: 'Productos',
			Columnas: [
				{ Nombre: 'PRODUCTO', Titulo: 'Producto' },
				{ Nombre: 'NOMBRE', Titulo: 'Descripción' },
				{ Nombre: 'ESTADO', Titulo: 'Estado' },
				{ Nombre: 'ID_GRUPO', Titulo: 'Grupo' },
				{ Nombre: 'INVENTARIO', Titulo: 'Inventario' },
			],
			PrmApl: this.prmUsrAplBarReg,
		};
		this.SVisor.setObsVisor.emit();*/
	}

  // Valide proveedores
  async ValideExistencia(e: any) {
    if (this.readOnlyForm || !this.mnuAccion.match('new|update')) {
      return (true);
    }
    if (this.mnuAccion === 'update' && this.FAcreedores_prev.ID_PROVEEDOR === e.value) {
      return (true);
    }

    // Valida la existencia
    const prm = { ID_PROVEEDOR: e.value, accion: this.mnuAccion };
    const apiRest = this._sdatos.validar('EXISTE PROVEEDOR',prm,this.prmUsrAplBarReg.aplicacion);
    let res = await lastValueFrom(apiRest, {defaultValue: true});
    res = JSON.parse(res.data); 
    if (res[0].ErrMensaje === '') {
      this.activarEdicion('activo');
      return (true);
    }
    else {
      showToast(res[0].ErrMensaje, 'error');
      var fNextEditor:any = this.formAcree.instance.getEditor('ID_PROVEEDOR');
      fNextEditor.focus();
      this.activarEdicion('inactivo');
      return (false);
    }
  
  }

  // Valide Id Legal
  ValideIdLegal(e: any) {
    if (this.readOnlyForm || !this.mnuAccion.match('new|update')) {
      return (true);
    }

    // Valida la existencia
    if (isNaN(e.value)) {
      return (false);
    }
    else {
      return (true);
    }
  
  }

  // Activa campos de la forma para edición 
  // dependiendo de la acción a realizar
  activarEdicion(accion) {
    switch (accion) {
      case 'llave':
        this.readOnly = true;
        this.readOnlyForm = false;
        this.readOnlyLlave = false;
        this.eventsSubjectDirTelInfo.next({ operacion: 'inactivo' });
        this.eventsSubjectCondProv.next({ operacion: 'inactivo' });
        break;
      case 'activo':
        this.readOnly = false;
        this.readOnlyForm = false;
        this.readOnlyLlave = false;
        this.eventsSubjectDirTelInfo.next({ operacion: 'activo' });
        this.eventsSubjectCondProv.next({ operacion: 'activo' });
        break;
      case 'consulta':
      case 'ini':
        this.readOnly = true;
        this.readOnlyForm = true;
        this.readOnlyLlave = true;
        this.eventsSubjectDirTelInfo.next({ operacion: 'inactivo' });
        this.eventsSubjectCondProv.next({ operacion: 'inactivo' });
        break;
    
      default:
        break;
    }
  }

  getGrupos() {
    const prm = { ID_GRUPO: 'PROVEEDORES' };
    this._sdatos.consulta('GRUPOS',prm,this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
      const res = JSON.parse(data);
      this.DGrupos = res;
    });
  }

  getIdLegal() {
    const prm = { };
    this._sdatos.consulta('ID LEGALES', prm, "ADM-205").subscribe((data: any)=> {
      const res = JSON.parse(data);
      this.DIdLegal = res;
    });
  }

  showIdTributarias() {
    this.idTributariasVisible = true;
    this.aceptarButtonOptions = {
      icon: 'fi fi-br-checkbox',
      text: 'Aceptar',
      onClick(e) {
        const message = `OK!!!`;
        notify({
          message,
          with: '300px',
          position: {
            my: 'center bottom',
            at: 'center bottom',
          },
        }, 'success', 3000);
      },
    };
    this.closeButtonOptions = {
      icon: 'fi fi-br-cross-circle',
      text: 'Cancelar',
      onClick(e) {
        this.idTributariasVisible = false;
      },
    };
  }

  getTributarias(){
    const prm = { };
    this._sdatos.consulta('LISTA GRAVAMENES', prm, 'generales').subscribe((data: any)=> {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      this.DidTributaria = res;
    });
  }

  getPerfilesTributarios(){
    const prm = { };
    this._sdatos.consulta('PIV PERFIL TRIBUTARIO', prm, 'generales').subscribe((data: any)=> {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      this.DidPerfilesTributarios = res;
    });
  }

  onKeyDownGrupo(e) {
    e.component.open();
  }

  onSeleccTipoIdLegal(e) {
    this.FAcreedores.TIPO = e.value;
  }
  onSeleccPersona(e) {
    this.FAcreedores.PERSONA = e.value;
  }
  onSeleccContacto(e) {
    this.FAcreedores.CONTACTO = e.value;
  }

  onContentReadyGrupo(e:any) {
    if(e.rowType === 'data') {
      if(!e.data.ASIGNABLE) {
        e.cellElement.style.opacity = '.5'
      }
    }
  }
  onSelectionGrupo(e:any) {
    if(e.selectedRowKeys.length > 0) {
      if(e.selectedRowsData[0].ASIGNABLE) {
        this.isTreeBoxOpened = false;
        this.FAcreedores.ID_GRUPO = e.selectedRowKeys[0];
      } else {
        this.FAcreedores.ID_GRUPO = '';
        this.treeBoxGrupo = [];
        this.isTreeBoxOpened = true;
      }
    } else {
      this.FAcreedores.ID_GRUPO = '';
      this.treeBoxGrupo = [];
    }
  }
  
  onKeyDownContactos(e) {
    e.component.open();
  }

  onValueChangedPerfilTributario(e: any) {
    
  }
  onSelectionChangedPerfilTributario(e) {
    this.selectPerfilTributario = e.selectedRowKeys;
  }
  
  onSelectionChangedTributario(e) {
    this.selectTributario = e.selectedRowKeys;
  }

  onTabChanged(e:any){
    switch (e.itemIndex) {
      case 0:
        this.tabVisible = ["block","none","none","none"];
        break;
      case 1:
        this.tabVisible = ["none","block","none","none"];
        break;
      case 2:
        this.tabVisible = ["none","none","block","none"];
        break;
      case 3:
        this.tabVisible = ["none","none","none","block"];
        break;
      default:
        break;
    }
  }

  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined){

    if (obj == 'id_legal' || obj == 'todos') {
      const prm = { };
      this._sdatos.consulta('ID LEGALES', prm, "ADM-205").subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DIdLegal = res[0].ID_LEGALES;
        this.DTipoIdLegal = res[0].TIPOS_ID;
        this.DPersona = res[0].PERSONA;
        this.eventsSubjectSboxIdLegal.next({ dataSource: this.DIdLegal, 
                                          valueExpr: "ID_LEGAL",
                                          displayExpr: "ID_LEGAL",
                                          columnData: ["ID_LEGAL","NOMBRE_COMPLETO"],
                                          valueData: this.FAcreedores.ID_LEGAL });
      });
    }

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

    if (obj == 'perfiles tributarios' || obj == 'todos'  ) {
      const prm = { };
      this._sdatos.consulta('PIV PERFIL TRIBUTARIO', prm, 'generales').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }

        // Envia datos al perfil
        this.DPerfilTributario = res;
      });
    }

    if (obj == 'representacion tributaria' || obj == 'todos'  ) {
      const prm = { };
      this._sdatos.consulta('REPRESENTACION TRIBUTARIA', prm, 'generales').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }

        // Envia datos al perfil
        this.DRT = res;
      });
    }

    if (obj === 'grupos' || obj === 'todos') {
      const prm = { ID_GRUPO_PADRE: 'PROVEEDORES' };
      this._sdatos.consulta('ARBOL GRUPOS', prm, "ADM-203").subscribe((data: any)=> {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else {
          this.DGrupos = res;
        }
        // Refresca también el de partes
        this.DGrupos = res;
      });
    }

  }

  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte, archivo, datosrpt) {
		
    let filtroRep = {FILTRO: ''};
    const prmLiq = {  clid: localStorage.getItem('empresa'), 
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
    this.tabService.addTab( new Tab(VisorrepComponent,    // visor
                                    datosrpt.text,        // título
                                    { parent: "PrincipalComponent", args: prmLiq }, // parámetro: reporte,filtro
                                    id_reporte,           // código del reporte
                                    '',
                                    'reporte',
                                    true
                          ));

	}

  showModal(mensaje, titulo = '', html = '') {
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
			title: '¡Error!',
			text: mensaje,
			allowOutsideClick: true,
			allowEscapeKey: false,
			allowEnterKey: false,
			backdrop: true,
			position: 'center',
      html,
			stopKeydownPropagation: false,
		});
	}


}
