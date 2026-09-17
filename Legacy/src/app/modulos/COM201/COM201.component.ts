import { Component, HostListener, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxComponent, DxDateBoxModule, DxDropDownBoxComponent, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxSelectBoxModule, DxTagBoxModule, DxTextBoxModule, DxToolbarModule, DxTreeListComponent, DxTreeListModule } from 'devextreme-angular';
import { lastValueFrom, Subject, Subscription } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import Swal from 'sweetalert2';
import notify from 'devextreme/ui/notify';
import { GES003Service } from 'src/app/services/GES003/GES003.service';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { CommonModule, DatePipe } from '@angular/common';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { MatTabsModule } from '@angular/material/tabs';
import { showToast } from '../../shared/toast/toastComponent.js'
import { clsListas } from './clsCOM0201.class.js';
import { AngularSplitModule } from 'angular-split';
import { COM201Service } from 'src/app/services/COM201/s_COM201.service';
import { MenufloatComponent } from 'src/app/shared/menufloat/menufloat.component';
import DataSource from 'devextreme/data/data_source';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';
import { libtools } from 'src/app/shared/common/libtools';


@Component({
  selector: 'app-COM201',
  templateUrl: './COM201.component.html',
  styleUrls: ['./COM201.component.css'],
  standalone: true,
  imports: [DxDataGridModule, DxButtonModule, CommonModule, DxTreeListModule, DxSelectBoxModule,
            DxDropDownBoxModule, DxTagBoxModule, DxFormModule, DxTextBoxModule, 
            VistarapidaComponent, DxLoadPanelModule, MatTabsModule, AngularSplitModule, DxToolbarModule, 
            MenufloatComponent, DxNumberBoxModule, DxDateBoxModule, MenufloatComponent,
            GeninformesComponent
          ]
})
export class COM201Component {

  @ViewChild("formListas", { static: false }) formListas: DxFormComponent;
  @ViewChild("treeListGrupos", { static: false }) treeListGrupos: DxTreeListComponent;
  @ViewChild("gridItemLista", { static: false }) gridItemLista: DxDataGridComponent;
  @ViewChild("xs_FECHA_FINAL", { static: false }) fechaFinal: DxDateBoxComponent;
  @ViewChild("gridProLista", { static: false }) gridProLista: DxDataGridComponent;
  @ViewChild("ddProductos", { static: false }) ddProductos: DxDropDownBoxComponent;

  // Variables fijas de la aplicación
  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  subs_tareas: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string;
	VDatosReg: any [] = [];
  readOnly: boolean = true;
  readOnlyEdicion: boolean = true;
  esEdicion: boolean = false;
  esEdicionGenerada: boolean = false;
  loadingVisible: boolean = false;

  // Variables de datos
  FListas: clsListas;
  DItemsLista: any = [];
  DItemsListaTmp: any = [];
  expandGrupos: boolean = true;
  autoExpandAll: boolean = false;
  btnContraer: string = 'Expandir';
  focusedGrupo: number = 0;
  editarItems: any = { PRODUCTO: false, PRECIO_BASE: false, PRECIO: false };
  readonly allowedPageSizes = [5, 10, 20, 50, 100, 'all'];

  // Variables de datos
  treeGrupos: any;
  DListaGrupos: any = [];
  data_prev: any= [];
  treeBoxCargo: any[] = [];
  isTreeBoxOpened: boolean;
  isGridBoxOpened: boolean;
  focusedRowIndex: number;
  conCambios: number = 0;
  focusedRowKey: string;
  colCountByScreen: object;
  QFiltro: any;
  DClaseAtr: any;
  imageAtributo: string = '';
  valItemCargo: number;
  keyItemGrid: number;
  DlEstados: any = ["ACTIVO","INACTIVO"];
  DlTipo: any = ["VENTAS","PROVEEDOR","COSTOS"];
  DlBasePrecio: any = ["Ultima Compra","Ultimo Costo C/P","Precio Mercado","Kardex"];
  DlListaBase: any = [];
  DListaProv: any = [];
  DProveedores: any = [];
  DlAplPrecio: any = ["Producto","Atributo"];
  DlAprox: any = [0,1,10,100,1000];
  DlActualizacion: any = ["Manual","Generada","Automática"];
  DListaProductos: any = [];
  DAtributos: any = [];
  DUDM_PRES: any = [];
  openResponsables: boolean;
  dropDownOptions = { width: 600, 
                      height: 400, 
                      hideOnParentScroll: true,
                      container: '#router-container' };

  // Operaciones de grid
  filaDatosEdit: any;
  filaDatosEditOld: any;
  filaDatosSelecc: any;
  esEdicionFila: boolean;
  rowIndex: any;
  grupoSelecc: any;
  grupoNomSelecc: any;
  modoImagen: boolean = false;
  altoFilaDatos: string[] = ["10px"];
  seleccDelete: boolean[] = [false];
  modoSeleccDelete: boolean = false;
  responsablesCargos: any;
  tabSeleccIndex: number = 0;
  eventsGestor: Subject<any> = new Subject<any>();
  
  ID_LISTA_prev: string;
  targetIdTooltip: string;
  tooltipText: string;
  toolTipVisible: boolean = false;
  ltool: any;
  
  // Operaciones de grid  
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esVisibleSelecc: string = 'none';

  // notificaciones
  toaVisible: boolean;
	type = 'info'
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';
  captionUDM: string = 'UM. Pres';
  USUARIO_LOCAL: any = '';

  activaMenuFloat: boolean;
  targetMenuFloat: string = '';
  dataMenuFloat: any;
  eventsSubjectFloat: Subject<void> = new Subject<void>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();
  especAplicacion: any;
    
	constructor(
    private _sdatos: COM201Service,
    private _sbarreg: SbarraService,
    private tabService: TabService,
    private _sfiltro: SfiltroService,
    private SVisor: SvisorService,
    private datepipe: DatePipe,
	) 
  {

    // Servicio de barra de registro
    this.subscription = this._sbarreg
    .getObsRegApl()
    .subscribe((datreg) => {
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
      const nx = this.VDatosReg.findIndex(d => d.ID_LISTA === resp.ID_LISTA);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx+1;
        this.opIrARegistro('r_numreg');
      }
    });

    this.ValideExistencia = this.ValideExistencia.bind(this);
    this.setCellPrecioBase = this.setCellPrecioBase.bind(this);
    this.setCellPrecio = this.setCellPrecio.bind(this);
    this.disableDates = this.disableDates.bind(this);
    this.onValueChangedValores = this.onValueChangedValores.bind(this);
    this.ltool = new libtools(this._sbarreg, this.tabService);

  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    const user:any = localStorage.getItem("usuario");
    this.prmUsrAplBarReg = {
      tabla: "LISTAS_PRECIOS",
      aplicacion: "COM-201",
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
    this.readOnlyEdicion = true; 
    this.grupoSelecc = '';
    this.grupoNomSelecc = '';
    this.valoresObjetos('todos');

    // Inicializacion de items
    this.FListas = {
      ID_LISTA : "",
      DESCRIPCION : "",
      TIPO : "",
      BASE_PRECIO : "",
      LISTA_BASE : "",
      ID_PROVEEDOR : "",
      APLICACION_PRECIO : "",
      MARGEN : 0,
      ACTUALIZACION : "",
      FECHA_INICIO : new Date(),
      FECHA_FINAL : new Date(),
      INCLUYE_IVA : false,
      ESTADO : "",
      PRINCIPAL : false,
      APROXIMACION: 1
    };

    window.addEventListener('scroll', this.onScroll, true);

  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, prmObj: any = ''){  
    if (obj == 'proveedores' || obj == 'todos') {
      const prm = { };
      this._sdatos.consulta('PROVEEDORES',prm,'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DProveedores = JSON.parse(JSON.stringify(res));  
        this.DListaProv = new DataSource({
          store: res,  //res.map(({ ID_PROVEEDOR, NOMBRE}) => ({ ID_PROVEEDOR: ID_PROVEEDOR+"; "+NOMBRE})),
          paginate: true,
          pageSize: 20
        });
      });
    }
    if (obj == 'grupos' || obj == 'todos') {
      const prm = { };
      this._sdatos.consulta('GRUPOS',prm,'PRO022').subscribe((data: any)=> {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else {
          this.DListaGrupos = res;
        }
      });
    }
    
    if (obj == 'productos') {
      const prm = { FILTRO: this.FListas.TIPO === 'VENTAS' ? 'ventas' : 'materiales', MODO: 'simple' };
      this._sdatos.consulta('PRODUCTOS',prm,'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else {
          // this.DListaProductos = new DataSource({
          //   store: res,  
          //   paginate: true,
          //   pageSize: 20
          // });
          this.DListaProductos = res;
        }
      });
    }
    if (obj == 'atributos') {
      const prm = { PRODUCTO: prmObj.PRODUCTO };
      this._sdatos.consulta('atributos simples',prm,'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje); 
        } else {
          this.DAtributos = new DataSource({
            store: res,  
            paginate: true,
            pageSize: 20
          });
  
          // Valor x defecto si hay 1 solo
          if (res.length == 1)
            this.gridItemLista.instance.cellValue(prmObj.rowIndex, "ATRIBUTO", res[0].VALOR);
        }

      });
    }
    if (obj == 'UDM_PRES') {
      const prm = { PRODUCTO: prmObj.PRODUCTO };
      this._sdatos.consulta('UDM PRES', prm, 'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else {

          if (this.FListas.TIPO === 'COSTOS') {
            this.DUDM_PRES = new DataSource({
              store: [res[0]],  
              paginate: true,
              pageSize: 20
            });
            
            this.gridItemLista.instance.cellValue(prmObj.rowIndex, "UDM_PRES", res[0].UDM_EQUIV);

          } else {
            this.DUDM_PRES = new DataSource({
              store: res,  
              paginate: true,
              pageSize: 20
            });

            // Valor x defecto si hay 1 solo
            if (res.length === 1)
              this.gridItemLista.instance.cellValue(prmObj.rowIndex, "UDM_PRES", res[0].UDM_PRES);
          }  
          
        }

      });
    }
    if (obj == 'lista base') {
      const prm = { TIPO: prmObj.TIPO, BASE_PRECIO: prmObj.BASE_PRECIO, ACTUALIZACION: prmObj.ACTUALIZACION, ID_LISTA: prmObj.ID_LISTA };
      this._sdatos.consulta('LISTA BASE', prm, 'COM201').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else {
          this.DlListaBase = res;
        }

      });
    }

  }
  
  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  getSizeQualifier(width:any) {
    if (width < 768)  return "xs";
    if (width < 992)  return "sm";
    if (width < 1366) return "md";
    return "lg";
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        const user:any = localStorage.getItem("usuario");
        this.prmUsrAplBarReg = {
          tabla: "LISTAS_PRECIOS",
          aplicacion: "COM-201",
          usuario: user,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.readOnly = false;
        this.readOnlyEdicion = false; 
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.mnuAccion = "update";
        this.readOnly = false;
        this.readOnlyEdicion = false; 
        this.opPrepararModificar();
        break;

      case "r_guardar":
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case "r_copiar":
        Swal.fire({
          title: '',
          text: 'Para copiar este Registro recuerde: debe agregar un nuevo Código.',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: false,
					confirmButtonColor: '#DF3E3E',
          confirmButtonText: 'Aceptar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.mnuAccion = "new";
            this.readOnly = false;
            this.readOnlyEdicion = false; 
            this.FListas.ID_LISTA = '';
            this.formListas.instance._refresh();
            this.opPrepararModificar();
            this.prmUsrAplBarReg.accion = 'r_nuevo';
            this.prmUsrAplBarReg.operacion = { r_configurar: true };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          }
        });
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
				if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('');
        } else {
					showToast('Consulta en proceso, por favor espere.', 'warning');
        }
				break;

			case "r_eliminar":
				this.opEliminar();
				break;

				case "r_primero":
				case "r_anterior":
				case "r_siguiente":
				case "r_ultimo":
				case "r_numreg":
				this.opIrARegistro(operMenu.accion);
				break;

      case "r_cancelar":
        var mensaje = '¿Desea cancelar la operación?';
				if (this.conCambios != 0) mensaje = 'Desea cancelar sin guardar cambios?';
        Swal.fire({
          title: '',
          text: '¿Desea cancelar la operación?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
					confirmButtonColor: '#DF3E3E',
					cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.readOnly = true;
            this.readOnlyEdicion = true; 
						this.prmUsrAplBarReg.accion = 'r_cancelar';
						this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            // Restituye los valores
            this.mnuAccion = "";
            if ( this.VDatosReg.length > 0 )
              this.opIrARegistro('r_numreg');
            else {
              this.FListas = {
                ID_LISTA : "",
                DESCRIPCION : "",
                TIPO : "",
                BASE_PRECIO : "",
                LISTA_BASE : "",
                ID_PROVEEDOR : "",
                APLICACION_PRECIO : "",
                MARGEN : 0,
                ACTUALIZACION : "",
                FECHA_INICIO : new Date(),
                FECHA_FINAL : new Date(),
                INCLUYE_IVA : false,
                ESTADO : "",
                PRINCIPAL : false,
                APROXIMACION: 1
              };
              this.formListas.instance._refresh();
            }

          }
        });

        break;

      case "r_vista":
        this.opVista();
        break;

      case 'r_refrescar':
				break;

      case "r_imprimir":
        var prmRep = { ...operMenu.operacion, 
                         accion: 'previsualizar',
                         aplicacion: this.prmUsrAplBarReg.aplicacion, 
                         tabla: this.prmUsrAplBarReg.tabla,
                         usuario: this.prmUsrAplBarReg.usuario,
                         QFiltro: (operMenu.operacion.registro === 'todos') 
                                   ? this.QFiltro 
                                   : " LISTAS_PRECIOS.ID_LISTA = '"+this.FListas.ID_LISTA+"'" 
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
                        nombre: this.FListas.DESCRIPCION,
                        email: '',
                        template,
                        replacements: '',
                        dataSource: this.FListas
                      };
          this.eventsSubjectInformes.next(prmRep);
        }
        break;

      case 'r_configurar':
        switch (operMenu.operacion.data_config.data.VALOR) {
          case 'Generar precio grupo':
            this.operacionesLista('generar precios grupo');
            break;

          case 'Actualizar Precios':
            this.operacionesLista('lista precios');
            break;

          case 'Actualizar Matrices':
            this.abrirApl({ ID_APLICACION: 'MA-019', FILTRO: 'Actualizar por Lista de Precio' })
            break;
        
          default:
            break;
        }
        break;


      default:
        break;
    }
  }

  // Operaciones sobre la lista
  operacionesLista(obj) {
    if (obj == 'generar precios grupo') {
      this.loadingVisible = true;
      const prm = { DATOS: this.FListas, ID_GRUPO: this.grupoSelecc, operacion: this.mnuAccion };
      this._sdatos.consulta('generar precios grupo',prm,this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        this.loadingVisible = false;
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else {
          // Actualiza lista general
          res.forEach(lis => {
            const ix = this.DItemsLista.findIndex(l => l.PRODUCTO === lis.PRODUCTO);
            if (ix !== -1) {
              this.DItemsLista.splice(ix, 1);
            }
          });
          this.DItemsLista = [ ...this.DItemsLista, ...res ];
          // this.DItemsListaTmp = JSON.parse(JSON.stringify(res));
        }
      });
    }
  }

  
  abrirApl(item: any) {
    item.ID_APLICACION = 'MA-019';
    item.title = 'Matriz Avanzada';
    item.icon = 'icon web-ol';
    item.TABLA = 'MATRIZ';
    item.accion = 'r_ini';
    this.ltool.abrirApl(item, 'consulta');
  }

  // Valide unicidad de la llave
  async ValideExistencia(e: any) {
    if (this.readOnly || !this.mnuAccion.match('new|update')) {
      return (true);
    }

    // Valida la existencia de la llave respectiva
    const prm = { ID_LISTA: e.value };
    const apiRest = this._sdatos.consulta('EXISTE LISTA',prm,this.prmUsrAplBarReg.aplicacion);
    const res = await lastValueFrom(apiRest, {defaultValue: true});
    const msg = JSON.parse(res.data.toString());
    if (msg[0].ErrMensaje === '')
      return (true);
    else {
      showToast(msg[0].ErrMensaje, 'error');
      var fNextEditor:any = this.formListas.instance.getEditor('ID_LISTA');
      fNextEditor.focus();
      return (false);
    }
  
  }

  // Activa auto-busqueda multiple (por palabras)
  customizeColumnsSearch(columns: Array<any>) {
    columns.forEach((column: any) => {
      column.calculateFilterExpression = this.ltool.customCalculateFilterExpression.bind(column);
      column.cellTemplate = this.ltool.customCellTemplate.bind(this);
    })
  }  
  // Asigna string de palabras de búsqueda
  onSearchChanged(e: any): void {
    if (e.fullName === 'searchPanel.text') {
      const grid = e.component;
      const searcWords = e.value?.trim().toLowerCase();
      this.ltool.searchText = searcWords;
    }
  }

  // Asigna cambios de valores de la forma
  onValueChangedValores(e:any, campo: string, cellInfo: any = undefined) {

    // Solo se procesa si es en modo edición
    // if (this.readOnly) return;

    this.FListas[campo] = e.value;
    this.conCambios++;

    // Valores especiales proveedor
    if (campo === 'TIPO') {
      if (e.value === 'PROVEEDOR') {
        this.valoresObjetos('proveedores');
      }
      if (e.value === 'COSTOS') {
        this.captionUDM = 'UN Equi'
        this.esEdicionGenerada = true;
        this.editarItems.PRODUCTO = false;
        this.editarItems.PRECIO_BASE = true;
        this.editarItems.PRECIO = false;
        this.esVisibleSelecc = 'always';
      } else {
        this.captionUDM = 'UM. Pres'
      }
    }
    if (campo === 'ID_PROVEEDOR') {
      const dnomprov = this.DProveedores.find(p => p.ID_PROVEEDOR == e.value);
      if (dnomprov)
        this.FListas.NOMBRE_PROVEEDOR = dnomprov.NOMBRE;
    }
    if (campo === 'ACTUALIZACION') {
      if (e.value === 'Manual') {
        this.valoresObjetos('productos');
        this.editarItems.PRODUCTO = true;
        this.editarItems.PRECIO_BASE = false;
        this.editarItems.PRECIO = true;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
      }
      if (e.value === 'Generada') {
        this.editarItems.PRODUCTO = false;
        this.editarItems.PRECIO_BASE = true;
        this.editarItems.PRECIO = false;
        this.rowNew = false;
        this.esVisibleSelecc = 'always';
      }
      if (e.value === 'Automática') {
        this.editarItems.PRODUCTO = false;
        this.editarItems.PRECIO_BASE = false;
        this.editarItems.PRECIO = false;
        this.rowNew = false;
        this.esVisibleSelecc = 'none';
      }
    }
    if (campo === 'PRODUCTO') {
      // cellInfo.data.PRODUCTO = e.value;
      const proSelecc = e.selectedRowsData[0].PRODUCTO;
      cellInfo.data.PRODUCTO = proSelecc;
      const dnompro = this.DListaProductos.find(p => p.PRODUCTO == proSelecc);
      if (dnompro) {
        cellInfo.data.NOMBRE = dnompro.NOMBRE;
        cellInfo.data.ID_GRUPO = dnompro.ID_GRUPO;
        this.gridItemLista.instance.cellValue(cellInfo.rowIndex, "NOMBRE", dnompro.NOMBRE);
        this.valoresObjetos('atributos', { PRODUCTO: proSelecc, rowIndex: cellInfo.rowIndex });
        this.valoresObjetos('UDM_PRES', { PRODUCTO: proSelecc, rowIndex: cellInfo.rowIndex });
      }
    }
    if (campo === 'FECHA_INICIO') {
      this.fechaFinal.instance._refresh();
    }
    if (campo === 'FECHA_FINAL') {
      this.fechaFinal.instance._refresh();
    }

    if(this.FListas.TIPO === 'VENTAS' && this.FListas.ACTUALIZACION === 'Generada' && this.FListas.BASE_PRECIO === 'Precio Mercado') {
      this.valoresObjetos('lista base', this.FListas);
    }

    if (campo === 'APLICACION_PRECIO') {
      // No visibiliza la columna ATRIBUTO
      if (e.value == "Producto")
        this.gridItemLista.instance.columnOption("ATRIBUTO","visible",false);
      else
        this.gridItemLista.instance.columnOption("ATRIBUTO","visible",true);
    }
  
  }

  onKeyDownListaPro(e, cellInfo:any) {
    this.ddProductos.instance.open();
  }
  onInputListaPro(e, cellInfo:any) {
    setTimeout(() => {
      this.gridProLista.instance.searchByText(e.event.target.value);
    }, 100);
  }

  onValueChangedUdmPres(e:any, campo: string, cellInfo: any = undefined) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;
    this.FListas[campo] = e.value;
    this.conCambios++;
    this.gridItemLista.instance.cellValue(cellInfo.rowIndex, "UDM_PRES", e.value);
  }

  disableDates(args: any) {
    const today = new Date();
    const fhoy = this.datepipe.transform(today, 'MM/dd/yyyy');
    const fcal = this.datepipe.transform(args.date, 'MM/dd/yyyy');
    const ford = this.datepipe.transform(this.FListas.FECHA_INICIO, 'MM/dd/yyyy');
    const dfhoy = new Date(fhoy!);
    const dfcal = new Date(fcal!);
    const dford = new Date(ford!);
    return dfcal < (dford == undefined ? dfhoy : dford) ;
  }

  // Llama a Acciones de registro
  
  opPrepararNuevo(): void {
    this.readOnly = false;
    this.readOnlyEdicion = false; 
    this.grupoSelecc = "";
    this.grupoNomSelecc = "";
    this.ID_LISTA_prev = "";
    this.seleccDelete = [false];
    this.esEdicion = true;
    this.esEdicionGenerada = true;
    this.esEdicionFila = false;
    this.rowApplyChanges = false;
    this.rowDelete = false;
    this.rowNew = false;
    this.rowSave = false;
    this.rowEdit = false;

    this.FListas = {
      ID_LISTA : "",
      DESCRIPCION : "",
      TIPO : "COSTOS",
      BASE_PRECIO : "",
      LISTA_BASE : "",
      ID_PROVEEDOR : "",
      APLICACION_PRECIO : "Producto",
      MARGEN : 0,
      ACTUALIZACION : "Generada",
      FECHA_INICIO : new Date(),
      FECHA_FINAL : new Date(),
      INCLUYE_IVA : false,
      ESTADO : "ACTIVO",
      PRINCIPAL : false,
      APROXIMACION: 1
    };
    this.DItemsLista = [];
    this.DItemsListaTmp = [];

    if(this.FListas.TIPO === '')
      this.captionUDM = 'UN Equi';
    else
      this.captionUDM = 'UM. Pres';
    this.prmUsrAplBarReg.accion = 'r_nuevo';
    this.prmUsrAplBarReg.operacion = { r_configurar: true };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.gridItemLista.instance.refresh();
  }

  opBlanquearForma(): void {
    this.FListas = {
      ID_LISTA : "",
      DESCRIPCION : "",
      TIPO : "",
      BASE_PRECIO : "",
      LISTA_BASE : "",
      ID_PROVEEDOR : "",
      APLICACION_PRECIO : "",
      MARGEN : 0,
      ACTUALIZACION : "",
      FECHA_INICIO : new Date(),
      FECHA_FINAL : new Date(),
      INCLUYE_IVA : false,
      ESTADO : "",
      PRINCIPAL : false,
      APROXIMACION: 1
    };
  }

  opPrepararModificar(): void {
    this.esEdicion = true;
    this.esEdicionGenerada = true;
    this.readOnly = false;
    this.readOnlyEdicion = false; 
    this.esVisibleSelecc = 'always';
    this.rowApplyChanges = false;
    this.rowDelete = false;
    this.rowNew = true;
    this.rowSave = false;
    this.rowEdit = false;
    this.esEdicionFila = false;
    this.ID_LISTA_prev = this.FListas.ID_LISTA;

    // Aplica y activa restricciones
    switch (this.FListas.ACTUALIZACION) {
      case 'Manual':
        this.valoresObjetos('productos');
        this.editarItems.PRODUCTO = true;
        this.editarItems.PRECIO_BASE = false;
        this.editarItems.PRECIO = true;
        break;
    
      case 'Generada':
        this.editarItems.PRODUCTO = false;
        this.editarItems.PRECIO_BASE = true;
        this.editarItems.PRECIO = false;
        this.rowNew = false;
        this.esEdicionGenerada = true;
        break;
    
      case 'Automática':
        this.editarItems.PRODUCTO = false;
        this.editarItems.PRECIO_BASE = false;
        this.editarItems.PRECIO = false;
        this.esEdicion = false;
        this.esEdicionGenerada = false;
        break;
    
      default:
        break;
    }

    this.prmUsrAplBarReg.accion = 'r_modificar';
    this.prmUsrAplBarReg.operacion = { r_configurar: true };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

    // Inactivar campos ya que tienen datos
    if (this.DItemsLista.length != 0) 
      this.readOnly = true;
    else
      this.readOnly = false;

  }

  opPrepararBuscar(accion): void {
		if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para listas de precios",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);

    } else {
			this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { LISTAS_PRECIOS: arrFiltro };

      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
        .consulta('consulta', prm,this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
					try {
						const res = JSON.parse(data.data);
						this._sfiltro.enConsulta = false;
						if ( (data.token != undefined) ){
							const refreshToken = data.token;
							localStorage.setItem("token", refreshToken);
						}
            const datares = res;
						if (datares[0].ErrMensaje === '') {
								this.VDatosReg = datares;
								this.QFiltro = datares[0].QFILTRO;
						} else {
							this.VDatosReg = [];
							this.loadingVisible = false;
							showToast(res[0].ErrMensaje, 'warning');
							return;
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
						this.readOnly = true;			
            this.readOnlyEdicion = true; 			
    
          } 
          
          catch (error) {
						this.loadingVisible = false;
						this.readOnly = true;
            this.readOnlyEdicion = true; 
						this._sfiltro.enConsulta = false;
						this.showModal(error);
					}
      });
    }
	}

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        this.prmUsrAplBarReg.r_numReg = 1;
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        if (this.VDatosReg.length != 0){
          this.FListas = JSON.parse(JSON.stringify(this.VDatosReg[0]));
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
					this.prmUsrAplBarReg.r_numReg === 1
						? 1
						: this.prmUsrAplBarReg.r_numReg - 1;
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FListas = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
					this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
						? this.VDatosReg.length
						: this.prmUsrAplBarReg.r_numReg + 1;
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				this.FListas = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
				this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.FListas = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.FListas = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1]));

        }
        this.readOnly = true;
        this.readOnlyEdicion = true; 
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          this.FListas =
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        }
				this.opBlanquearForma();
        break;

      default:
        break;
    }

    // Consulta items de la lista
    try {
      this.grupoSelecc = "";
      this.grupoNomSelecc = "";
      this.esEdicion = false;
      this.esEdicionGenerada = false;
      this.esVisibleSelecc = 'none';
      this.editarItems = { PRODUCTO: false, PRECIO_BASE: false, PRECIO: false };
      if (this.FListas.TIPO === 'COSTOS') {
        this.captionUDM = 'UN Equi'
        this.esVisibleSelecc = 'always';
      } else {
        this.captionUDM = 'UM. Pres'
      }

      // Proveedor
      const dnomprov = this.DProveedores.find(p => p.ID_PROVEEDOR == this.FListas.ID_PROVEEDOR);
      if (dnomprov)
        this.FListas.NOMBRE_PROVEEDOR = dnomprov.NOMBRE;

      const prm = { ID_LISTA: this.FListas.ID_LISTA };
      this._sdatos.consulta('consulta items lista', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe(
          { next: (data: any) => {
            const res = JSON.parse(data.data);
            if ( (data.token != undefined) ){
              const refreshToken = data.token;
              localStorage.setItem("token", refreshToken);
            }
            if (res[0].ErrMensaje !== "") {
              this.showModal(res[0].ErrMensaje);
            } else {
              this.DItemsLista = res;
              this.DItemsListaTmp = JSON.parse(JSON.stringify(res));
            }

          },
          error: (e:any) => {
            this.showModal('Error consulta items Lista de precios: '+e.error.message);
          }
        });

    } catch (error) {
      
    }

  }

  opCargarResponsabilidades(data:any) {
    switch (data.accion) {
      case 'cargar':
        this.conCambios++;    
        break;

      case 'eliminar':
        this.conCambios++;
        break;
    
      default:
        break;
    }
    this.formListas.instance._refresh();
  }


  // Vista/Zoom de los datos consultados
  opVista(): void {
    const VDatosRegAux = this.VDatosReg.map(({ID_LISTA, DESCRIPCION, RESPONSABLES}) => ({ID_LISTA, DESCRIPCION, RESPONSABLES}));
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(VDatosRegAux));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Listas de precios',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: ['ID_LISTA|Nombre','DESCRIPCION|Descripción','TIPO|Tipo','BASE_PRECIO|Base precio'],
      Filtro: '',
      keyGrid: ['ID_LISTA'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opEliminar(): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html: "¿Desea eliminar el Cargo <i>" +
            this.FListas.ID_LISTA +
            "</i> ? Al eliminarlo, se eliminaran " +
            " los items de la lista asignados.",
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      // Procesa eliminación. Llama a la API para validar referenciación y 
      // eliminación en tabla
      if (result.isConfirmed) {
				this.AccionEliminar();
      }
    });

  }

	// Ejecuta la eliminación
  AccionEliminar(): void {

    // API eliminación de datos
		const prm = { ID_LISTA: this.FListas.ID_LISTA };
    this._sdatos
      .delete('delete',prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data:any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        this.opIrARegistro("Eliminado");
        this.readOnly = true;
        this.readOnlyEdicion = true; 
				showToast('Lista de precios eliminada!', 'success');

        // Operaciones de barra
        this.prmUsrAplBarReg.r_totReg--;
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          error: "",
          accion: 'r_navegar',
          operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.opIrARegistro('r_numreg');
    });
  }

  validatingData() {
    if( this.FListas.ID_LISTA === '' ) {
      showToast('Debe asignar un Código de lista.', 'error');
      return false;
    } else {
      if( this.FListas.DESCRIPCION === '' ) {
        showToast('Debe asignar un Nombre de lista.', 'error');
        return false;
      } else {
          return true;
      }
    }
  }

  opPrepararGuardar(accion: string): void {
    if (this.esEdicionFila){
      showToast('No hay cambios por Guardar en los items de la lista', 'error');
      return;
		} else {
      if(this.validatingData()) {
        var prm:any;

        // API guardado de lista de precios
        prm = { LISTA_PRECIOS: this.FListas, ITM_LISTA_PRECIOS: this.DItemsLista, ID_LISTA_PREV: this.ID_LISTA_prev };
        this._sdatos
        .save(accion, prm)
        .subscribe(
          { next: (data) => {
              const res = JSON.parse(data.data);
            if ( (data.token != undefined) ){
              const refreshToken = data.token;
              localStorage.setItem("token", refreshToken);
            }
            if (res[0].ErrMensaje !== "") {
              this.showModal(res[0].ErrMensaje);
            }else {
              this.readOnly = true;
              this.readOnlyEdicion = true; 
              // Operaciones de barra
              if (this.mnuAccion === 'new') {
                this.QFiltro = "ID_LISTA='"+this.FListas.ID_LISTA+"'";
                this.prmUsrAplBarReg = {
                  ...this.prmUsrAplBarReg,
                  error: "",
                  accion: "r_navegar",
                  r_numReg: 1,
                  r_totReg: 1,
                  operacion: {}
                };
              } else {
                this.prmUsrAplBarReg = {
                  ...this.prmUsrAplBarReg,
                  error: "",
                  accion: "r_navegar",
                  operacion: {}
                };
              }
              if(this.VDatosReg.length > 0) {
                const npos:any = this.VDatosReg.findIndex((d:any) => d.ID_LISTA === this.FListas.ID_LISTA);
                if( npos === -1 ) {
                  this.VDatosReg.push(this.FListas);
                } else {
                  this.VDatosReg[npos] = this.FListas;
                }
              } 

              this.mnuAccion = this.prmUsrAplBarReg.accion;
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
              showToast('Registro actualizado', 'success');
    
              // Inicializacion objetos
              this.seleccDelete = [false];
              this.esVisibleSelecc = 'none';
              this.esEdicionFila = false;
              this.esEdicion = false;
              this.esEdicionGenerada = false;
              this.rowApplyChanges = false;
              this.rowDelete = false;
              this.rowNew = false;
              this.rowSave = false;
              this.rowEdit = false;
    
            }  
    
        },
        error: (e:any) => {
          this.showModal('Error al guardar Lista de precios: '+e.error.message);
          }
        });

      }
    }

  }

  switchIva(e:any) {
    if (e.value) {
      // this.DProductos.BODEGA = true;
    }
  }
  switchPrincipal(e:any) {
    if (e.value) {
      // this.DProductos.BODEGA = true;
    }
  }

  dragEnd(unit: any, sizes: any): any {
    // const ed = this.diagLay.instance.element();
    // ed.style.width = sizes[1];
  }

  onResized(event: any) {
    const width:number = event.newRect.width;
    const height:number = event.newRect.height;
    const constainer_expandir:any = document.getElementById('constainer-expandir');
    if(constainer_expandir !== undefined && constainer_expandir!== null) {
      if(width < 330) {
        constainer_expandir.style.width = '100%';
        constainer_expandir.style.position = 'relative';
        constainer_expandir.style.padding = '5px';
      } else {
        constainer_expandir.style.width = '110px';
        constainer_expandir.style.position = 'absolute';
        constainer_expandir.style.padding = '0 5px';
      };
    }
  }

  onExpanding(e:any) {
    if (this.expandGrupos) {
      this.autoExpandAll = true;
      this.btnContraer = 'Contraer';
      this.expandGrupos = !this.expandGrupos;
      return;
    }
    if (!this.expandGrupos) {
      this.autoExpandAll = false;
      this.btnContraer = 'Expandir';
      this.expandGrupos = !this.expandGrupos;
      const newArray:any = this.DListaGrupos.filter((d:any) => d.ID_GRUPO_PADRE === "RAIZ");
      newArray.forEach((ele:any) => {
          this.treeListGrupos.instance.collapseRow(ele.ID_GRUPO);
      });
      return;
    }
	};

  onToolbarPreparing(e: any) {}
  
  onRowClickGrupo(e: any) {
    // const rowd = { row: { data: e.data } };

    // // Valida si está en modo edición de fila
    // if (this.esEdicionFila)
    //   showToast('No se puede filtrar por grupo mientras haya una edición de precio!','Error de datos', 'error');
    // else
    //   this.selectGrupo(rowd);
  }

  // Selecciona grupo para mosrtar y generar
  filtroGrupo: any = [];
  selectGrupo(e: any) {
    if (e.row === undefined) return;

    if (this.esEdicionFila) {
      showToast('No se puede filtrar por grupo mientras haya una edición de precio!','Error de datos', 'error');
      return;
    }

    // Grupo seleccionado para filtrar/procesar
    this.grupoSelecc = e.row.data.ID_GRUPO;
    this.grupoNomSelecc = e.row.data.NOMBRE;

    // Filtra los grupos de los items ya generados
    this.filtroGrupo = [];
    this.listaGruposRecur(this.grupoSelecc);
    // const lista = this.DItemsLista.filter(lpg => this.filtroGrupo.includes(lpg.ID_GRUPO));
    // this.DItemsListaTmp = JSON.parse(JSON.stringify(lista));

    // const filter = this.filtroGrupo.map(val => ['ID_GRUPO', '=', val]);
    // const joinedFilter = filter.reduce((acc, item, index) => {
    //   if (index === 0) return item;
    //   return [acc, 'or', item];
    // });
    this.gridItemLista.instance.filter((rowData) => {
      return this.filtroGrupo.includes(rowData.ID_GRUPO);
    });
  }

  // Trae lista de grupos
  listaGruposRecur(grupo) {
    this.filtroGrupo.push(grupo);
    const lgru = this.DListaGrupos.filter(g => g.ID_GRUPO_PADRE === grupo);
    lgru.forEach(eleg => {
      this.filtroGrupo.push(eleg.ID_GRUPO);
      this.listaGruposRecur(eleg.ID_GRUPO);
    });
  }

  onInitNewRow(e:any) {
    e.data.PRODUCTO = '';
    e.data.ATRIBUTO = 'SIN';
    e.data.NOMBRE = '';
    e.data.PRECIO_BASE = 0;
    e.data.PRECIO = 0;
    e.data.PRECIO_IVA = 0;
    e.data.ID_GRUPO = '';
    if (this.DItemsLista.length > 0) {
      const item = this.DItemsLista.reduce((ant:any, act:any) => {return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    } else {
      e.data.ITEM = 1;
    }
    e.data.isEdit = false;
    this.esEdicionFila = true;
    this.filaDatosEdit = undefined;
    this.esVisibleSelecc = 'none';
    this.rowDelete = false;

  }
  insertedRow(e:any) {
    // después de insertar
    this.esVisibleSelecc = 'always';
    this.esEdicionFila = false;
    this.readOnly = true;
    this.readOnlyEdicion = true; 

    // Agrega a la principal
    const ix = this.DItemsLista.findIndex((lpro:any) => lpro.PRODUCTO === e.data.PRODUCTO && lpro.UDM_PRES === e.data.UDM_PRES);
    if (ix === -1)
      this.DItemsLista = [...this.DItemsLista, e.data ];

  }
  insertingRow(e:any) {
    // Validar al insertar
    // var err_msg = '';
    // if (e.data.PRODUCTO === '') err_msg = 'Producto,';
    // if (e.data.PRECIO_BASE === null) err_msg += 'Precio base';
    // if (e.data.PRECIO === null) err_msg += 'Precio producto';
    // if (err_msg !== '' ) {
    //   this.esEdicionFila = false;
    //   e.cancel = true;
    //   showToast('Falta completar datos de '+err_msg,'Error de datos', 'error');
    // }

    // // Valida si hay duplicidad
    // const nx = this.DItemsLista.findIndex(p => p.PRODUCTO === e.data.PRODUCTO);
    // if (nx !== -1) {
    //   e.cancel = true;
    //   showToast('Producto repetido!','Repetido', 'error');
    // }

  }
  updatedRow(e:any) {
    // Copia al servicio
    this.esEdicionFila = false;
    this.esVisibleSelecc = 'always';
    this.readOnly = true;
    this.readOnlyEdicion = true; 

    // Agrega a la principal
    const ix = this.DItemsLista.findIndex((lpro:any) => lpro.PRODUCTO === e.data.PRODUCTO && lpro.UDM_PRES === e.data.UDM_PRES);
    if (ix !== -1)
      this.DItemsLista[ix] = e.data;
    else
    {
      this.showModal("Este producto no se encontró en los items: revise la unidad de medida, atributo o codigo del producto!","Error");
    }
  }
  updatingRow(e:any) {
    
  }
  removedRow(e:any) {
    // Copia al servicio
  }
  onRowValidating(e: any) {
  
    e.promise = new Promise((resolve, reject) => {
      // Valida completitud
      if (e.newData.PRODUCTO === '' || 
          e.newData.NOMBRE === '' || 
          Number(e.newData.PRECIO) === 0 || 
          e.newData.ATRIBUTO === '' ||
          e.newData.UDM_PRES === ''
          ) 
        {
        this.rowApplyChanges = true;
        e.isValid = false;
        e.errorText = 'Falta completar datos del producto: Producto, Precio, Atributo ó Unidad de Medida';
        resolve(false);
        return;
      }

      // Valida si hay duplicidad
      const nx = this.DItemsLista.findIndex((p:any) => p.PRODUCTO === e.newData.PRODUCTO);
      if (nx !== -1) {
        if (this.DItemsLista[nx].UDM_PRES === e.newData.UDM_PRES) {
          this.rowApplyChanges = true;
          e.isValid = false;
          resolve(false);
          e.errorText = 'Producto repetido, modifiqué la Unidad de Medida!';
          return;
        } else {
          this.rowApplyChanges = false;
          this.rowEdit = false;
          this.rowNew = true;
          this.esVisibleSelecc = 'always';
          this.esEdicionFila = false;
          e.isValid = true;
          resolve(true);
          return;
        }
      } else {
        this.rowApplyChanges = false;
        this.rowEdit = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        this.esEdicionFila = false;
        e.isValid = true;
        resolve(true);
        return;
      }
    }).then((result) => { 
      showToast('Producto repetido!','Repetido', 'error');
    })  

  }
  onEditingStart(e:any) {
    this.rowApplyChanges = true;
    this.rowEdit = false;
    this.esVisibleSelecc = 'none';
    this.esEdicionFila = true;
    this.gridItemLista.instance.deselectAll();
    this.filasSelecc = [];
    // Carga los atributos para el producto
    this.valoresObjetos('atributos', { PRODUCTO: e.data.PRODUCTO, rowIndex: this.rowIndex });
    this.valoresObjetos('UDM_PRES', { PRODUCTO: e.data.PRODUCTO, rowIndex: this.rowIndex });
  }

  onRowPrepared(e:any) {
    if (e.rowType === "data") {
      if (e.data.isEdit) {
				// e.rowElement.style.backgroundColor = 'lightyellow';
				const className:string = e.rowElement.className;
				e.rowElement.className = className +' row-modified-focused';
			}
    }
  }
  onToolbarPreparingGrid(e: any) {
    let toolbarItems = e.toolbarOptions.items;
  
    // Valida datos de encabezado antes de crear
    // toolbarItems.forEach((el:any) => {
    //   if (el.name === "addRowButton") {  
    //     el.options.onClick = (args: any) => {  
    //         if (this.DEntradas.ID_PROVEEDOR != "" && this.DEntradas.ID_UN_DESTINO != "")  
    //             e.component.addRow();  
    //         else
    //             {
    //               this.displayModal = true;
    //               this.errMsg = 'Faltan datos por completar en el encabezado de la entrada: Revise Fecha, proveedor, bodega!';
    //               this.errTit = "Valores nulos";
    //               e.cancel = true;
    //             }
    //     };  
    //   }  
    // });
    
    e.toolbarOptions.items.unshift({
      location: 'before',
      template: 'titItems'
    });
  }

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.esEdicion) {
      if (this.filasSelecc.length != 0)
        this.rowDelete = true;
      else
        this.rowDelete = false;
    }
  }
  onContentReady(e:any) {  
    e.component.columnOption("command:edit", "visible", false);  
  }
  startEdit(e:any) {
    if (this.esEdicion) {
      // Valida que haya informacion
      if(e.rowType === "data" && !this.esEdicionFila) {
        e.component.editRow(e.rowIndex);
        e.data.modoEdicion = true;
        this.filaDatosEdit = e;
        this.esEdicionFila = true;
        this.rowApplyChanges = true;
        this.rowDelete = false;
        this.rowNew = false;
      }
    }
  }
  onFocusedRowChanged(e:any) {
    this.rowIndex = e.rowIndex;
  }

  // Cálculo modificacion precio base
  async setCellPrecioBase(rowData: any, value: any, currentRowData: any) {
    rowData.PRECIO_BASE = value;

    // Efectúa cálculo precio base
    const prm = { LISTA_PRECIOS: this.FListas, PRECIO_BASE: value, ITEM_LISTA: currentRowData };
    const apiRest = this._sdatos.consulta('calcular precio',prm,this.prmUsrAplBarReg.aplicacion);
    var res = await lastValueFrom(apiRest, {defaultValue: true});
    res = JSON.parse(res.data); 
    if (res[0].ErrMensaje !== '') {
      showToast(res[0].ErrMensaje, 'error');
      return;
    }

    // Asigna valores
    rowData.PRECIO = res[0].PRECIO;
    rowData.PRECIO_IVA = res[0].PRECIO_IVA;
  }

  // Cálculo modificacion precio lista
  async setCellPrecio(rowData: any, value: any, currentRowData: any) {
    rowData.PRECIO = value;

    // Efectúa cálculo precio base
    const prm = { LISTA_PRECIOS: this.FListas, PRECIO: value, ITEM_LISTA: currentRowData };
    const apiRest = this._sdatos.consulta('calcular precio',prm,this.prmUsrAplBarReg.aplicacion);
    var res = await lastValueFrom(apiRest, {defaultValue: true});
    res = JSON.parse(res.data); 
    if (res[0].ErrMensaje !== '') {
      showToast(res[0].ErrMensaje, 'error');
      return;
    }

    // Asigna valores
    rowData.PRECIO_BASE = res[0].PRECIO_BASE;
    rowData.PRECIO_IVA = res[0].PRECIO_IVA;
  }

  // Cálculo modificacion precio base
  setCellProducto(rowData: any, value: any, currentRowData: any) {
    rowData.PRODUCTO = value;

    // Efectúa cálculo precio base
    const dnompro = this.DListaProductos._items.find(p => p.PRODUCTO == value);
    if (dnompro) {
      rowData.NOMBRE = dnompro.NOMBRE;
      rowData.ID_GRUPO = dnompro.ID_GRUPO;
    }

  }

  // Heredar objeto Listas
  onInitialized(e: any) {
    this.treeGrupos = e.component;
  }


  toggleToolTip(item:any, cellInfo:any) {
    this.targetIdTooltip = '#USER-'+item.id+cellInfo.data.ITEM;
    this.toolTipVisible = !this.toolTipVisible;
    this.tooltipText = item.DESCRIPCION;
  }

  // Imprimir reporte de aplicación
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

  // Operaciones de grid
  operGrid(e, operacion) {
    // Valida que haya informacion de producto principal
    if (this.FListas.ID_LISTA === '') {
      this.showModal('No se ha introducido ningún código de lista de precios!');
      return;
    }
    switch (operacion) {
      case 'new':
        this.gridItemLista.instance.addRow();
        this.rowApplyChanges = true;
        this.esVisibleSelecc = 'none';
        this.esEdicionFila = true;
        this.rowDelete = false;
        this.gridItemLista.instance.deselectAll();
        this.filasSelecc = [];
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this.esVisibleSelecc = 'none';
        this.esEdicionFila = true;
        this.gridItemLista.instance.deselectAll();
        this.filasSelecc = [];
        break;
      case 'save':
        this.gridItemLista.instance.saveEditData();
        // this.rowApplyChanges = false;
        // this.rowEdit = false;
        // this.rowNew = true;
        // this.esVisibleSelecc = 'always';
        // this.esEdicionFila = false;
        break;
      case 'cancel':
        this.gridItemLista.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.rowEdit = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        this.esEdicionFila = false;
        break;
      case 'delete':
        // Elimina filas seleccionadas
        Swal.fire({
          title: '',
          text: '¿Desea eliminar los items seleccionados?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
					confirmButtonColor: '#DF3E3E',
					cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.filasSelecc.forEach((key) => {
              // let index = this.DItemsListaTmp.findIndex(a => a.ITEM === key);
              // this.DItemsListaTmp.splice(index, 1);
              let index = this.DItemsLista.findIndex(a => a.ITEM === key);
              this.DItemsLista.splice(index, 1);
            });
            this.gridItemLista.instance.refresh();
            this.esVisibleSelecc = 'always';
            this.rowApplyChanges = false;
            this.gridItemLista.instance.deselectAll();
            this.filasSelecc = [];

            // Inactivar campos ya que tienen datos
            if (this.DItemsLista.length != 0) 
              this.readOnly = true;
            else
              this.readOnly = false;

          }
        });
        break;

      default:
        break;
    }
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

  // Eventos del menu float
  // Si está desplegado el menu float de apoyo, ocultarlo
  onScroll(e: Event): void {
    if (this.eventsSubjectFloat)
      this.eventsSubjectFloat.next();
  }
  // Mostrar el menu float de apoyo, con Control+click-derecho
  @HostListener("document:contextmenu", ["$event"])
  clickout(e: any) {
    if (!e.ctrlKey) return;
    if (e.srcElement.id !== undefined && e.srcElement.id !== '') {
      this.targetMenuFloat = '#'+e.srcElement.id;
      var objDOM = this.targetMenuFloat;
      if (objDOM.match("__")) objDOM = objDOM.split('__')[0];
      const filtro = this.filtroFloat(objDOM);
      this.dataMenuFloat = { prmApl: this.prmUsrAplBarReg, 
                             objeto: objDOM.replace("#",""), 
                             objRegistro: this._sbarreg, 
                             objTab: this.tabService, 
                             filtro: filtro.FILTRO,
                             aplicacion: filtro.ID_APLICACION };
      this.activaMenuFloat = true;
    }
    else {
      if (e.srcElement.name !== undefined && e.srcElement.name !== '') {
        this.targetMenuFloat = '#xs__'+e.srcElement.name;  //e.srcElement.name;
        const filtro = this.filtroFloat(this.targetMenuFloat);
        this.dataMenuFloat = { prmApl: this.prmUsrAplBarReg, 
                               objeto: e.srcElement.name??e.srcElement.id, 
                               objRegistro: this._sbarreg, 
                               objTab: this.tabService, 
                               filtro: filtro.FILTRO,
                               aplicacion: filtro.ID_APLICACION };
          this.activaMenuFloat = true;
      }
    }
    e.preventDefault();
  }
  // Ocultar el menu float de apoyo, con click-fuera
  onClickMe() {
    this.activaMenuFloat = false;
  }
  onCellClick(e:any) {
    if (e.row === undefined) return;
  }

  // Filtro asociado al dato donde se da click de link
  filtroFloat(campo:any): any {
    var valorDato:any;
    var retDato:any;
    switch (campo) {
      case "#PRODUCTO":
      case "#xs__PRODUCTO":
        valorDato = this.gridItemLista.instance.cellValue(this.rowIndex, "PRODUCTO");
        retDato = { ID_APLICACION: 'PRO-022', FILTRO: '{ "ESTRUCTURA": '+
                    '[{"CAMPO": "PRODUCTO", "EXPRESION": "'+valorDato+'"}] }' }
        break;
    
      default:
        break;
    }
    return retDato
  }

}
