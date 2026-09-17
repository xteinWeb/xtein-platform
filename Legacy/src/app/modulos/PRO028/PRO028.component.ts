import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { AngularSplitModule } from 'angular-split';
import { DxButtonModule, DxDataGridModule, DxDateBoxComponent, DxDateBoxModule, DxDropDownBoxModule, DxFormModule, DxListComponent, DxListModule, DxLoadPanelModule, DxNumberBoxModule, DxSelectBoxModule, DxTextBoxModule, DxTooltipModule, DxTreeListComponent, DxTreeListModule } from 'devextreme-angular';
import { showToast } from '../../shared/toast/toastComponent';
import { CCapacidad, DSecciones } from "./clsPRO028.class";
import { PRO028Service } from 'src/app/services/PRO028/s_PRO028.service';
import { lastValueFrom, of, Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { validatorRes } from 'src/app/shared/validator/validator';
import Swal from 'sweetalert2';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';

@Component({
  selector: 'app-PRO028',
  templateUrl: './PRO028.component.html',
  styleUrls: ['./PRO028.component.css'],
  standalone: true,
  imports: [CommonModule, AngularSplitModule, DxTreeListModule, DxDataGridModule,
            DxFormModule, DxSelectBoxModule, DxDateBoxModule, VistarapidaComponent,
            DxLoadPanelModule, DxNumberBoxModule, DxTextBoxModule, DxDropDownBoxModule,
            DxButtonModule, DxListModule, GeninformesComponent, DxTooltipModule
  ]
})
export class PRO028Component {

  @ViewChild("treeListSecciones", { static: false }) treeListSecciones: DxTreeListComponent;
	@ViewChild ('fechaDesde', { static: false }) dFechaDesde : DxDateBoxComponent;
	@ViewChild ('fechaHasta', { static: false }) dFechaHasta : DxDateBoxComponent;
	@ViewChild ('listPlantas', { static: false }) listPlantas : DxListComponent;

  public _unsubscribeAll: Subject<any>;
  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string;
  VDatosReg: any;

  FCapacidad: CCapacidad;
  FCapacidad_prev: any;
  DSecciones: any[];
  DSecciones_prev: any[];
  DTurnos: any [] = [];
	selectSeccion: any = [];
  DPlantas: any [] = [];
	selectPlantas: any = [];
	selectHorarios: any = [];

  QFiltro: any;
  fechaDesde:any = '';
	fechaHasta:any = '';
	USUARIO_LOCAL:any = '';
  rules: any;
  filasSeleccData: any;
  filasSeleccData_prev:any;

  activeListaSeccion: boolean = false;
  autoExpandAll: boolean = false;
  readOnly: boolean = true;
  validandoDatos: boolean = false;
  loadingVisible: boolean = false;
  esEdicionFila: boolean = false;
  openIdHorarios: boolean = false;
  openIdPlantas: boolean = false;

	rowNew: boolean = true;
	rowEdit: boolean = false;
	rowDelete: boolean = false;
	rowSave: boolean = false;
	rowApplyChanges: boolean = false;
	filasSelecc: any[] = [];
	acciongrid: string = '';

  conCambios: number = 0;
  
  toolTipVisible: boolean = false;
  targetIdTooltip: string;
  tooltipInfo: any = [];
  wrapperAttr = { class: "cls-tooltip-reg" };

  constructor(
    private sData: PRO028Service,
    private datePipe: DatePipe,
    private _sbarreg: SbarraService,
    private tabService: TabService,
    private _sfiltro: SfiltroService,
    private SVisor: SvisorService
  ) {
    this._unsubscribeAll = new Subject();

		this.subscription = this._sbarreg
    .getObsRegApl()
    .pipe(takeUntil(this.unSubscribe))
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
    });

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex((d:any) => d.ITEM === resp.ITEM);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx+1;
        this.opIrARegistro('r_numreg');
      }
    })

    this.rules = {
      H: (char:any) => char >= 0 && char <= 9,
      h: (char:any) => char >= 0 && char <= 9,
      M: (char:any) => char >= 0 && char <= 5,
      m: (char:any, index:any, fullStr:any) => {
        if (fullStr[3] === '5')
          return [0,1,2,3,4,5,6,7,8,9].includes(parseInt(char));
        else
          return [0,1,2,3,4,5,6,7,8,9].includes(parseInt(char));
      }
    }

    this.aceptarBottom = this.aceptarBottom.bind(this);
    this.getCapacidadHorario = this.getCapacidadHorario.bind(this);
    this.opPrepararGuardar = this.opPrepararGuardar.bind(this);
	}

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem("usuario");
    this.prmUsrAplBarReg = {
      tabla: "CAPACIDAD_PRODUCCION",
      aplicacion: "PRO-028",
      usuario: this.USUARIO_LOCAL,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: {r_refrescar: true}
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

    this.mnuAccion = '';
    this.FCapacidad = {
      FECHA_INICIO: new Date(),
      FECHA_FIN: new Date(),
      CAPACIDAD: '',
      HORARIOS: [],
      PLANTAS: [],
      FECHA_REGISTRO: new Date(),
      FECHA_UPDATE: new Date(),
      USUARIO: '',
      ITEM: 0
    }
    this.valoresObjetos('todos');
	}

	ngOnDestroy() {
    this.subscription.unsubscribe();
		this.subs_filtro.unsubscribe();
		this.subs_visor.unsubscribe();
  }

  getRadOnly(cellInfo:any) {
    var res:any = true;
    if (cellInfo.data.readOnly[cellInfo.column.dataField] !== undefined && 
      cellInfo.data.readOnly[cellInfo.column.dataField] !== null && 
      cellInfo.data.readOnly[cellInfo.column.dataField] !== ''
    )
      res = cellInfo.data.readOnly[cellInfo.column.dataField];
    else
      res = true;
    return of(res);
  }

  getFormat(cellInfo:any) {
    var res:any = '';
    res = cellInfo.column.dataField === 'EFECTIVIDAD_AJUSTADA' ? '#0%' : '#0';
    return of(res);
  }

  getValue(cellInfo:any) {
    var res:any = '';
    res = cellInfo.data[cellInfo.column.dataField];
    return of(res);
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          tabla: "CAPACIDAD_PRODUCCION",
          aplicacion: "PRO-028",
          usuario: this.USUARIO_LOCAL,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: {r_refrescar: true}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.readOnly = false;
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.opPrepararModificar();
        break;

      case "r_guardar":
        var msj:any = '';
        if (this.FCapacidad.FECHA_INICIO === this.FCapacidad.FECHA_FIN)
          showToast('Las fechas no deben ser iguales, selecciones una FECHA FINAL MAYOR','error');
        else if (this.DSecciones.length === 0)
          showToast('No se han cargado las Secciones y su Capacidad.','error');
        else
          this.opPrepararGuardar(this.mnuAccion);
        break;

      case "r_buscar":
				if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
				if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case "r_buscar_ejec":
        this.opBlanquearForma();
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
				if (this.conCambios > 0) mensaje = 'Desea cancelar sin guardar cambios?';
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
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
            this.FCapacidad = JSON.parse(JSON.stringify(this.FCapacidad_prev));
            this.selectHorarios = this.FCapacidad.HORARIOS;
            this.selectPlantas = this.FCapacidad.PLANTAS;
            this.DSecciones = [];
            for (let secc of this.DSecciones_prev) {
              switch (secc.TIPO) {
                case 'Planta':
                  // Si la sección es de tipo Planta y su ID_SECCION está en el array PLANTAS
                  if (this.FCapacidad.PLANTAS.includes(secc.ID_SECCION)) {
                    this.DSecciones.push(secc);
                  }
                  break;
            
                case 'PROCESO':
                  // Si la sección es de tipo PROCESO y su ANTERIOR coincide con un ITEM de una sección en plantas
                  if (this.DSecciones.findIndex((d:any) => d.ITEM === secc.ANTERIOR) > -1)
                    this.DSecciones.push(secc);
                  break;
            
                case 'OPERATIVA':
                  // Si la sección es de tipo OPERATIVA y su ANTERIOR pertenece a una sección en plantas
                  if (this.DSecciones.findIndex((d:any) => d.ITEM === secc.ANTERIOR) > -1 && secc.MANO_OBRA) {
                    const infoCap:any = this.FCapacidad_prev.ITEMS.findIndex((d:any) => d.ID_SECCION === secc.ID_SECCION);
                    if (infoCap > -1) {
                      secc.HORAS_HORARIO = this.FCapacidad_prev.ITEMS[infoCap].HR_PRODUCTIVA ? this.FCapacidad_prev.ITEMS[infoCap].HR_PRODUCTIVA : '00:00';
                      secc.N_TRABAJADORES_INSTALADA = this.FCapacidad_prev.ITEMS[infoCap].N_TRABAJADORES_INSTALADA ? this.FCapacidad_prev.ITEMS[infoCap].N_TRABAJADORES_INSTALADA : 0;
                      secc.HORAS_INSTALADA = this.FCapacidad_prev.ITEMS[infoCap].HORAS_INSTALADA ? this.FCapacidad_prev.ITEMS[infoCap].HORAS_INSTALADA : '00:00';
                      secc.N_TRABAJADORES_DISPONIBLE = this.FCapacidad_prev.ITEMS[infoCap].N_TRABAJADORES_DISPONIBLE ? this.FCapacidad_prev.ITEMS[infoCap].N_TRABAJADORES_DISPONIBLE : 0;
                      secc.HORAS_DISPONIBLE = this.FCapacidad_prev.ITEMS[infoCap].HORAS_DISPONIBLE ? this.FCapacidad_prev.ITEMS[infoCap].HORAS_DISPONIBLE : '00:00';
                      secc.EFECTIVIDAD_AJUSTADA = this.FCapacidad_prev.ITEMS[infoCap].EFECTIVIDAD_AJUSTADA ? this.FCapacidad_prev.ITEMS[infoCap].EFECTIVIDAD_AJUSTADA : 0;
                      secc.HORAS_AJUSTADA = this.FCapacidad_prev.ITEMS[infoCap].HORAS_AJUSTADA ? this.FCapacidad_prev.ITEMS[infoCap].HORAS_AJUSTADA : '00:00';
                      this.DSecciones.push(secc);
                    }
                  }
                  break;
            
                default:
                  break;
              }
            };
            if (this.DSecciones.length > 0)
              this.activeListaSeccion = true;
            else
              this.activeListaSeccion = false;
            this.mnuAccion = "";
            this.readOnly = true;
            this.conCambios = 0;
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          }
        });
        break;

      case "r_copiar":
        if (this.FCapacidad) {
          this.mnuAccion = 'new';
          this.readOnly = false;
        } else {
          showToast('Seleccione sección a copiar', 'Error');
        }
        break;

      case "r_vista":
        this.opVista();
        break;

      case 'r_refrescar':
				this.valoresObjetos('todos');
				break;

      case "r_imprimir":
				this.imprimirReporte(operMenu);
        break;

      default:
        break;
    }
  }

  async clickMO(e:any, datos:any) {
    
    const prm = {ID_SECCION: datos.ID_SECCION, ID_HORARIO: this.selectHorarios[0] };
    const apiRest = this.sData.valideCapacidad('VALIDAR EMPELADOS', prm, 'PRO028');
    const res = await lastValueFrom(apiRest, { defaultValue: true });
    const newArray:any = JSON.parse(res.data);
    if (newArray[0].ErrMensaje !== '') {
      showToast(newArray[0].ErrMensaje, 'error');
    } else {
      this.tooltipInfo = newArray;
      this.targetIdTooltip = '#iconMoSeccion'+datos.ID_SECCION;
      // this.targetIdTooltip = '#treeListSecciones';
      this.toolTipVisible = true;
    }
  }

  opPrepararBuscar(accion: any): void {
    if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Capacidad",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: 'CAPACIDAD_PRODUCCION',
        aplicacion: this.prmUsrAplBarReg.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { CAPACIDAD_PRODUCCION: arrFiltro };
      this.loadingVisible = true;

      // Ejecuta búsqueda API
      this.sData
        .consulta('consulta', prm,this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          this._sfiltro.enConsulta = false;
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje !== '') {
            this.VDatosReg = [];
            this.opBlanquearForma();
            //notificació
            showToast(datares[0].ErrMensaje, 'error');
            this.loadingVisible = false;
            return;
          } else {
            this.VDatosReg = datares;
            this.QFiltro = datares[0].QFILTRO;
            
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
          }
          // this.loadingVisible = false;
          // this._sfiltro.enConsulta = false;
        });
    }
      this.readOnly = true;

    // this.readOnly = false;
  }

  opIrARegistro(accion: string): void {
    var newArray:any = {};
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        if ( this.VDatosReg.length != 0 ) {
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this.prmUsrAplBarReg.r_numReg = 1;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.readOnly = true;
          showToast("No se encontraron datos", 'error');
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
        this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
          ? this.VDatosReg.length
          : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

        } else {
          this.opBlanquearForma();
        }
        this.readOnly = true;
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        this.prmUsrAplBarReg.r_totReg = this.VDatosReg.length;
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          newArray =
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        } else {
          this.opBlanquearForma();
        }
        break;

      default:
        break;
    }

    this.FCapacidad = newArray;
    this.FCapacidad.HORARIOS = this.mnuAccion.match('new|update') ? this.FCapacidad.HORARIOS : JSON.parse(this.FCapacidad.HORARIOS);
    this.FCapacidad.PLANTAS = this.mnuAccion.match('new|update') ? this.FCapacidad.PLANTAS : JSON.parse(this.FCapacidad.PLANTAS);
    this.selectHorarios = this.FCapacidad.HORARIOS;
    this.selectPlantas = this.FCapacidad.PLANTAS;
    this.validandoDatos = true;
    this.loadingVisible = true;
    //Asocia ITEMS SECCIONES
    this.DSecciones = [];
    for (let secc of this.DSecciones_prev) {
      switch (secc.TIPO) {
        case 'Planta':
          // Si la sección es de tipo Planta y su ID_SECCION está en el array PLANTAS
          if (this.FCapacidad.PLANTAS.includes(secc.ID_SECCION)) {
            this.DSecciones.push(secc);
          }
          break;
    
        case 'PROCESO':
          // Si la sección es de tipo PROCESO y su ANTERIOR coincide con un ITEM de una sección en plantas
          if (this.DSecciones.findIndex((d:any) => d.ITEM === secc.ANTERIOR) > -1)
            this.DSecciones.push(secc);
          break;
    
        case 'OPERATIVA':
          // Si la sección es de tipo OPERATIVA y su ANTERIOR pertenece a una sección en plantas
          if (this.DSecciones.findIndex((d:any) => d.ITEM === secc.ANTERIOR) > -1 && secc.MANO_OBRA) {
            const infoCap:any = newArray.ITEMS.findIndex((d:any) => d.ID_SECCION === secc.ID_SECCION);
            if (infoCap > -1) {
              secc.HORAS_HORARIO = newArray.ITEMS[infoCap].HR_PRODUCTIVA ? newArray.ITEMS[infoCap].HR_PRODUCTIVA : '00:00';
              secc.N_TRABAJADORES_INSTALADA = newArray.ITEMS[infoCap].N_TRABAJADORES_INSTALADA ? newArray.ITEMS[infoCap].N_TRABAJADORES_INSTALADA : 0;
              secc.HORAS_INSTALADA = newArray.ITEMS[infoCap].HORAS_INSTALADA ? newArray.ITEMS[infoCap].HORAS_INSTALADA : '00:00';
              secc.N_TRABAJADORES_DISPONIBLE = newArray.ITEMS[infoCap].N_TRABAJADORES_DISPONIBLE ? newArray.ITEMS[infoCap].N_TRABAJADORES_DISPONIBLE : 0;
              secc.HORAS_DISPONIBLE = newArray.ITEMS[infoCap].HORAS_DISPONIBLE ? newArray.ITEMS[infoCap].HORAS_DISPONIBLE : '00:00';
              secc.EFECTIVIDAD_AJUSTADA = newArray.ITEMS[infoCap].EFECTIVIDAD_AJUSTADA ? newArray.ITEMS[infoCap].EFECTIVIDAD_AJUSTADA : 0;
              secc.HORAS_AJUSTADA = newArray.ITEMS[infoCap].HORAS_AJUSTADA ? newArray.ITEMS[infoCap].HORAS_AJUSTADA : '00:00';
              this.DSecciones.push(secc);
            }
          }
          break;
    
        default:
          break;
      }
    };
    if (this.DSecciones.length > 0) {
      this.activeListaSeccion = true;
      this.validandoDatos = false;
    }
    else {
      this.activeListaSeccion = false;
      this.validandoDatos = false;
      showToast('Error al cargar las secciones.', 'error');
    }
  }

  opEliminar(): void {
    Swal.fire({
      title: '',
      text: '',
      html: '¿Eliminar el registro?<br/>'+
            '<b style="color: red;">¡ADVERTENCIA!</b> Se eliminarán los datos asociados!',
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
    const prm = { OPERACION: 'delete', DATOS: this.FCapacidad };
    this.sData
			.save('delete', prm)
      .pipe(takeUntil(this._unsubscribeAll))
			.subscribe({ 
        next: (data) => {
          try {
            const res = validatorRes(data);
            if (res[0].ErrMensaje !== '') {
              this.showModal(res[0].ErrMensaje, 'Error');
              return;
            }
  
            this.opIrARegistro("Eliminado");
            showToast('Turno eliminado', 'success');
            this.readOnly = true;
  
            // Operaciones de barra
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: this.prmUsrAplBarReg.r_totReg !== 0 ? 'r_navegar' : 'r_ini',
              operacion: {}
            };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          } catch (error) {
            this.showModal('Error respuesta eliminar');
          }
        },
        error: (err => {
          this.showModal('Error al eliminar');
        })
      });
  }

  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: "Capacidad de producción",
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: ['FECHA_INICIO|Fecha Inicio','FECHA_FIN|Fecha Fin','CAPACIDAD|Capacidad','HORARIOS|Horarios','PLANTAS|Plantas'],
      Filtro: '',
      keyGrid: ['ITEM']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }
  
  opPrepararNuevo(): void {
    this.opBlanquearForma();    
    this.FCapacidad.CAPACIDAD = 'ESTANDAR';
    this.FCapacidad.FECHA_FIN.setDate(this.FCapacidad.FECHA_INICIO.getDate() + 30);
    this.activeListaSeccion = false;
    this.conCambios++;
  }

  opPrepararModificar(): void {
    this.mnuAccion = "update";
    this.FCapacidad_prev = JSON.parse(JSON.stringify({...this.FCapacidad, ITEMS: this.DSecciones}));
    this.readOnly = false;
    this.FCapacidad.CAPACIDAD = 'BALANCEADA';
  }

  opBlanquearForma(): void {
    this.FCapacidad_prev = JSON.parse(JSON.stringify({...this.FCapacidad, ITEMS: this.DSecciones}));
    this.FCapacidad = {
      FECHA_INICIO: new Date(),
      FECHA_FIN: new Date(),
      CAPACIDAD: '',
      HORARIOS: [],
      PLANTAS: [],
      FECHA_REGISTRO: new Date(),
      FECHA_UPDATE: new Date(),
      USUARIO: this.USUARIO_LOCAL,
      ITEM: 0
    };
    this.selectHorarios = [];
    this.selectPlantas = [];
    this.DSecciones = [];
  }

  onContentReady(e:any) {
    if (!this.validandoDatos)
      this.loadingVisible = false;
  }
  onRowPreparedTreeListSeccion(e:any) {
		if (e.rowType === "data") {
			if (e.data) {
				if (e.data.TIPO === 'Planta') {
					e.rowElement.style.fontWeight = '700';
				}
			}
    }
	}

  onFechaDesde(e:any) {
    if(this.mnuAccion.match('new|update')) {
      if((e.value === null) || (e.value === '') || (e.value === undefined)){
        showToast('Seleccione fecha', 'error');
        return;
      }
      this.FCapacidad.FECHA_INICIO = e.value;
      this.fechaDesde = this.datePipe.transform(e.value, 'MM/dd/yyyy');
      if ( (this.FCapacidad.FECHA_FIN !== null) && (this.FCapacidad.FECHA_FIN !== undefined) && (this.fechaHasta !== '') ) {
        const fechaValidada:any = this.validarFechas(this.fechaDesde, this.fechaHasta);
        if (fechaValidada)
          this.validarCargarDatos();
      }
    }
	}

	onFechaHasta(e:any) {
    if(this.mnuAccion.match('new|update')) {
      if((e.value === null) || (e.value === '') || (e.value === undefined)){
        showToast('Seleccione fecha', 'error');
        return;
      }
      this.FCapacidad.FECHA_FIN = e.value;
      this.fechaHasta = this.datePipe.transform(e.value, 'MM/dd/yyyy');
      const fechaValidada:any = this.validarFechas(this.fechaDesde, this.fechaHasta);
      if (fechaValidada)
        this.validarCargarDatos();
    }
	}

	async validarFechas(a:any, b:any) {
		if((a === null) || (a === '') || (a === undefined)){
			showToast('Seleccione fecha inicial', 'error');
      return false;
		}
    if((b === null) || (b === '') || (b === undefined)){
      showToast('Seleccione fecha final', 'error');
      return false;
    } 
    var f1 = new Date(a);
    var f2 = new Date(b); 
    if (f1 > f2){
      showToast('Fecha inicial no puede ser mayor a la Fecha final, modifique la fecha final', 'error');
      return false;
    } else {
      const prm = {FECHA_INICIO: this.FCapacidad.FECHA_INICIO, FECHA_FIN: this.FCapacidad.FECHA_FIN };
      const apiRest = this.sData.consulta('VALIDAR FECHAS', prm, 'PRO028');
      const res = await lastValueFrom(apiRest, { defaultValue: true });
      const msg = JSON.parse(res.data);
      if (msg[0].ErrMensaje !== ''){
        this.showModal(msg[0].ErrMensaje);
        return false;
      } else {
        return true;
      }
    }
	}

  onSelecCapacidad(e:any) { 
    if(this.mnuAccion.match('new|update')) {
      this.FCapacidad.CAPACIDAD = e.value;
      this.conCambios++;
      this.validarCargarDatos();
    }
  }

  convertirTiempoADecimal(hora:any) {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas + minutos / 60;
  }

  onValueChanged(e:any, campo:any) {
    if( this.mnuAccion.match('new|update') && (e.value === undefined || e.value === null || e.value.length === 0) ) {
      switch (campo) {
        case 'PLANTA':
          this.openIdPlantas = false;
          this.activeListaSeccion = false;
          this.FCapacidad.PLANTAS = [];
          break;
          
          case 'HORARIO':
            this.openIdHorarios = false;
            this.activeListaSeccion = false;
            this.FCapacidad.HORARIOS = [];
          break;
      
        default:
          break;
      }
      this.conCambios++;
      this.openIdHorarios = false;
    }
  }
  onValueChangedPlanta(e:any) {
    if( this.mnuAccion.match('new|update') && (e.value.length <= 0 || e.value[0] === undefined || e.value[0] === null) ) {
      this.FCapacidad.PLANTAS = e.value;
      this.conCambios++;
      this.openIdPlantas = false;
    }
  }
  onSelectionChangedPlanta(e:any) {
    if(this.mnuAccion.match('new|update')) {
      this.FCapacidad.PLANTAS = this.selectPlantas;
      this.conCambios++;
    }
  }

  aceptarBottom(e:any, btn:any) {
    switch (btn) {
      case 'PLANTA':
        this.openIdPlantas = false;
        if(this.mnuAccion.match('new|update'))
          this.validarCargarDatos();
        break;

      case 'HORARIO':
        this.openIdHorarios = false;
        if(this.mnuAccion.match('new|update'))
          this.validarCargarDatos();
        break;
    
      default:
        break;
    }
  }

  async validarCargarDatos() {
    if ( (this.FCapacidad.FECHA_FIN > this.FCapacidad.FECHA_INICIO) && 
        (this.FCapacidad.CAPACIDAD !== '') &&
        (this.FCapacidad.HORARIOS.length > 0) &&
        (this.FCapacidad.PLANTAS.length > 0)
    ) {
      this.validandoDatos = true;
      this.loadingVisible = true;
      this.DSecciones = [];
      for (let secc of this.DSecciones_prev) {
        switch (secc.TIPO) {
          case 'Planta':
            // Si la sección es de tipo Planta y su ID_SECCION está en el array PLANTAS
            if (this.FCapacidad.PLANTAS.includes(secc.ID_SECCION)) {
              this.DSecciones.push(secc);
            }
            break;
      
          case 'PROCESO':
            // Si la sección es de tipo PROCESO y su ANTERIOR coincide con un ITEM de una sección en plantas
            if (this.DSecciones.findIndex((d:any) => d.ITEM === secc.ANTERIOR) > -1)
              this.DSecciones.push(secc);
            break;
      
          case 'OPERATIVA':
            // Si la sección es de tipo OPERATIVA y su ANTERIOR pertenece a una sección en plantas
            if (this.DSecciones.findIndex((d:any) => d.ITEM === secc.ANTERIOR) > -1 && secc.MANO_OBRA) {
              const infoCap:any = await this.getCapacidadHorario(secc);
              if (infoCap) {
                secc.HORAS_HORARIO = infoCap.HR_PRODUCTIVA ? infoCap.HR_PRODUCTIVA : '00:00';
                secc.N_TRABAJADORES_INSTALADA = infoCap.N_TRABAJADORES_INSTALADA ? infoCap.N_TRABAJADORES_INSTALADA : 0;
                secc.HORAS_INSTALADA = infoCap.HORAS_INSTALADA ? infoCap.HORAS_INSTALADA : '00:00';
                secc.N_TRABAJADORES_DISPONIBLE = infoCap.N_TRABAJADORES_DISPONIBLE ? infoCap.N_TRABAJADORES_DISPONIBLE : 0;
                secc.HORAS_DISPONIBLE = infoCap.HORAS_DISPONIBLE ? infoCap.HORAS_DISPONIBLE : '00:00';
                secc.EFECTIVIDAD_AJUSTADA = infoCap.EFECTIVIDAD_AJUSTADA ? infoCap.EFECTIVIDAD_AJUSTADA : 0;
                secc.HORAS_AJUSTADA = infoCap.HORAS_AJUSTADA ? infoCap.HORAS_AJUSTADA : '00:00';
                this.DSecciones.push(secc);
              }
            }
            break;
      
          default:
            break;
        }
      };
      //Asocia empleados con turno para calculo
      this.activeListaSeccion = true;
      this.validandoDatos = false;
    } else {
      this.activeListaSeccion = false;
    }
  }

  onSelectionTurno(e:any) {
    if( this.mnuAccion.match('new|update') && e.selectedRowKeys.length > 0) {
      this.FCapacidad.HORARIOS = e.selectedRowKeys;
      this.conCambios++;
      // this.openIdHorarios = false;
    }
  }
  async getCapacidadHorario(secc:any) {
    var contHorasPro:any = 0;
    var contHorasFor:any[] = [];
    // var horasDecimales:any = 0;
    
    this.FCapacidad.HORARIOS.forEach((ele:any) => {
      const Hrio:any = this.DTurnos.filter((d:any) => d.ID_HORARIO === ele);
      contHorasPro = contHorasPro + this.convertirTiempoADecimal(Hrio[0].HR_PRODUCTIVA);
      contHorasFor.push(Hrio[0].HR_PRODUCTIVA);
    });

    //seecion padre para sacar capacidad
    const padre:any = this.DSecciones_prev.filter((d:any) => d.ITEM === secc.ANTERIOR);
    const prm = {SECCION_H: secc.ID_SECCION, SECCION_P: padre[0].ID_SECCION, HORARIOS: this.FCapacidad.HORARIOS, C_HORAS: contHorasPro };
    const apiRest = this.sData.valideCapacidad('VAL CAPACIDAD', prm, 'PRO028');
    const res = await lastValueFrom(apiRest, { defaultValue: true });
    const msg = JSON.parse(res.data);
    if (msg[0].ErrMensaje !== ''){
      this.showModal(msg[0].ErrMensaje);
      return {
        HR_PRODUCTIVA: this.formatearHora(0),
        N_TRABAJADORES_INSTALADA: 0,
        HORAS_INSTALADA: this.formatearHora(0),
        N_TRABAJADORES_DISPONIBLE: 0,
        HORAS_DISPONIBLE: this.formatearHora(0)
      };
    } else {
      return {
        HR_PRODUCTIVA: this.formatearHora(msg[0].C_HORAS),
        N_TRABAJADORES_INSTALADA: msg[0].N_CAPACIDAD,
        HORAS_INSTALADA: this.formatearHora(msg[0].HrProyectadas),
        N_TRABAJADORES_DISPONIBLE: msg[0].N_EMPLEADOS,
        HORAS_DISPONIBLE: this.formatearHora(msg[0].HrDisponible)
      };
    }
  }
  
  formatearHora(valor:any) {
    // Separa la parte entera (horas) y la parte decimal (minutos)
    const horas = Math.floor(valor);
    const minutosDecimales = valor - horas;
    // Convierte la parte decimal en minutos
    const minutos = Math.round(minutosDecimales * 60);
    // Formatea el resultado para mostrarlo como "HH:MM"
    const horasFormateadas = horas.toString().padStart(horas.toString().length, '0');
    const minutosFormateados = minutos.toString().padStart(2, '0');

    return `${horasFormateadas}:${minutosFormateados}`;
  }
  
  //-------------------------------------------------------------
  onValueChangedValor(e:any, cellInfo:any) {
    if( this.mnuAccion.match('new|update')) {
      switch (cellInfo.column.dataField) {
        case 'EFECTIVIDAD_AJUSTADA':
          const hor:any = parseInt(cellInfo.data.HORAS_DISPONIBLE);
          const sub:any = hor * e.value;
          const newH:any = String(sub);
          var hFormat:any = '';
          if (newH.length < 4) {
            for (let i = 0; i < newH.length; i++) {
              hFormat = newH + '0';
            }
          } else {
            hFormat = newH;
          }
          this.treeListSecciones.instance.cellValue(cellInfo.rowIndex, 'EFECTIVIDAD_AJUSTADA', e.value);
          this.treeListSecciones.instance.cellValue(cellInfo.rowIndex, 'HORAS_AJUSTADA', hFormat);
          this.conCambios++;
          break;
      
        default:
          break;
      }
    }    
  }

  onCellDblClick(e:any) { 
    if( !(e.event.target.parentElement.classList.contains("dx-treelist-expanded") ||
        e.event.target.parentElement.classList.contains("dx-treelist-collapsed") ||
        e.event.target.parentElement.classList.contains("dx-button-content") ) 
    ) {
      if (!this.readOnly) {
        if((e.data.TIPO === 'PROCESO' && e.data.INVENTARIO) || (e.data.TIPO === 'OPERATIVA')) {
          if (!this.esEdicionFila) {
            this.filasSeleccData_prev = JSON.parse(JSON.stringify(e.data));
            e.component.editRow(e.rowIndex);
            e.data.readOnly = { 
              ID_HORARIO: false, HORAS_HORARIO: true, 
              N_TRABAJADORES_INSTALADA: true,  HORAS_INSTALADA: true, 
              N_TRABAJADORES_DISPONIBLE: true, HORAS_DISPONIBLE: true,
              EFECTIVIDAD_AJUSTADA: false, HORAS_AJUSTADA: true
            };
            this.esEdicionFila = true;
            this.filasSeleccData = e;
            this.rowApplyChanges = true;
          } else {
            if(this.filasSeleccData.rowIndex !== null && this.filasSeleccData.rowIndex !== undefined) {
              if (this.filasSeleccData.rowIndex !== e.rowIndex) {
                showToast('No puede modificar esta Sección si esta en Edición la anterior.', 'warning');
                let rowIndex = this.filasSeleccData.rowIndex;
                let row = e.component.getRowElement(rowIndex)[0];
                row.classList.add("row-animation");
                e.data.readOnly = { 
                  ID_HORARIO: true, HORAS_HORARIO: true, 
                  N_TRABAJADORES_INSTALADA: true,  HORAS_INSTALADA: true, 
                  N_TRABAJADORES_DISPONIBLE: true, HORAS_DISPONIBLE: true,
                  EFECTIVIDAD_AJUSTADA: true, HORAS_AJUSTADA: true
                };
                setTimeout(() => {
                  row.classList.remove("row-animation");
                }, 2000);
              }
            }
          }
        } else {
          e.cancel = true;
          e.data.readOnly = { 
            ID_HORARIO: true, HORAS_HORARIO: true, 
            N_TRABAJADORES_INSTALADA: true,  HORAS_INSTALADA: true, 
            N_TRABAJADORES_DISPONIBLE: true, HORAS_DISPONIBLE: true,
            EFECTIVIDAD_AJUSTADA: true, HORAS_AJUSTADA: true
          };
          return;
        }
      } else {
        this.showModal('Active la edición en la barra para modificar los datos.', 'Alerta', '');
      }
    }
  }
  onEditingStart(e:any) {
    this.esEdicionFila = true;
    this.filasSeleccData = e;
    e.data.readOnly = { 
      ID_HORARIO: false, HORAS_HORARIO: true, 
      N_TRABAJADORES_INSTALADA: true,  HORAS_INSTALADA: true, 
      N_TRABAJADORES_DISPONIBLE: true, HORAS_DISPONIBLE: true,
      EFECTIVIDAD_AJUSTADA: false, HORAS_AJUSTADA: true
    };
  }
  onEditCanceled(e:any) {
    if(this.filasSeleccData !== undefined && this.filasSeleccData !== null && this.filasSeleccData !== '') {
      // const npos:any = this.DSecciones.findIndex((d:any) => d.ITEM === this.filasSeleccData.data.ITEM);
      // this.DSecciones[npos] = this.filasSeleccData_prev;
      this.filasSeleccData.data.ID_HORARIO = '';
      this.filasSeleccData.data.HORARIO = [];
      this.filasSeleccData.data.readOnly = { 
        ID_HORARIO: true, HORAS_HORARIO: true, 
        N_TRABAJADORES_INSTALADA: true,  HORAS_INSTALADA: true, 
        N_TRABAJADORES_DISPONIBLE: true, HORAS_DISPONIBLE: true,
        EFECTIVIDAD_AJUSTADA: true, HORAS_AJUSTADA: true
      };
      this.treeListSecciones.instance.refresh();
    }
    this.esEdicionFila = false;
    this.filasSeleccData = '';
    this.conCambios = 0;
    this.treeListSecciones.instance.refresh();
  }
  onRowUpdated(e:any) { }
  onRowInserted(e:any) { }

  // Operaciones de grid
  operGrid(e:any, operacion:any, tipo:any) {
		switch (operacion) {
			case 'new':
        this.treeListSecciones.instance.addRow();
        this.rowApplyChanges = true;
        this.rowNew = false;
        this.acciongrid = operacion;
				break;
			case 'edit':
				const key:any = this.treeListSecciones.instance.getRowIndexByKey(this.selectSeccion[0]);
				this.treeListSecciones.instance.editRow(key);
				this.rowApplyChanges = true;
				this.rowEdit = false;
				this.rowNew = false;
				this.rowDelete = false;
				this.acciongrid = operacion;
				break;
			case 'save':
				this.treeListSecciones.instance.saveEditData();
				break;
			case 'cancel':
				this.treeListSecciones.instance.cancelEditData();
				this.rowApplyChanges = false;
				this.rowNew = true;
				this.acciongrid = '';
				if (this.filasSelecc.length > 0)
					this.rowDelete = true;
				if (this.filasSelecc.length === 1)
					this.rowEdit = true;
				if (this.filasSelecc.length > 1)
					this.rowEdit = false;
				if (this.filasSelecc.length === 0) {
					this.rowDelete = false;
					this.rowEdit = false;
				}
				break;
			case 'delete':
				// Elimina filas seleccionadas
				// Swal.fire({
				// 	title: '',
				// 	text: '¿Desea eliminar los items seleccionados?',
				// 	iconHtml: "<i class='icon-alert-ol'></i>",
				// 	showCancelButton: true,
				// 	confirmButtonColor: '#DF3E3E',
				// 	cancelButtonColor: '#438ef1',
				// 	cancelButtonText: 'No',
				// 	confirmButtonText: 'Sí, eliminar'
				// }).then((result) => {
				// 	if (result.isConfirmed) {
				// 		this.filasSelecc.forEach((key:any) => {
				// 			const index = this.DSecciones.findIndex((a:any) => a.ITEM === key);
				// 			this.DSecciones.splice(index, 1);
				// 		});
				// 		this.treeListSecciones.instance.refresh();
				// 		this.conCambios++;
				// 		this.acciongrid = '';
				// 	}
				// });
				break;

			default:
				break;
		}
  }

  onRowValidating(e:any) {
		let mensaje:any='';
		let propiedadesVacias:any = [];
		const propiedadesVerificar = [
      "ID_HORARIO", "HORAS_HORARIO",
      "N_TRABAJADORES_INSTALADA", "HORAS_INSTALADA",
      "N_TRABAJADORES_DISPONIBLE", "HORAS_DISPONIBLE",
      "EFECTIVIDAD_AJUSTADA", "HORAS_AJUSTADA"
    ];
    
    // if (this.acciongrid === 'edit') {
			for (let prop in e.newData) {
				if (e.newData.hasOwnProperty(prop) && e.oldData.hasOwnProperty(prop)) {
					e.oldData[prop] = e.newData[prop];
				}
			}
			if( ((e.oldData.ID_HORARIO === '') || (e.oldData.ID_HORARIO === null)) || ((e.oldData.HORAS_HORARIO === '') || (e.oldData.HORAS_HORARIO === null)) ||
					((e.oldData.N_TRABAJADORES_INSTALADA < 0) || (e.oldData.N_TRABAJADORES_INSTALADA === null)) || ((e.oldData.HORAS_INSTALADA === '') || (e.oldData.HORAS_INSTALADA === null)) ||
					((e.oldData.N_TRABAJADORES_DISPONIBLE < 0) || (e.oldData.N_TRABAJADORES_DISPONIBLE === null)) || ((e.oldData.HORAS_DISPONIBLE === '') || (e.oldData.HORAS_DISPONIBLE === null)) ||
					((e.oldData.EFECTIVIDAD_AJUSTADA < 0) || (e.oldData.EFECTIVIDAD_AJUSTADA === null)) || ((e.oldData.HORAS_AJUSTADA === '') || (e.oldData.HORAS_AJUSTADA === null))
				) {
				for (let key in e.oldData) {
					if (propiedadesVerificar.includes(key) && !e.oldData[key]) {
						propiedadesVacias.push(key);
					}
				}
				if (propiedadesVacias.length > 0)
					mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;

				e.isValid = false;
				this.rowApplyChanges = true;
				this.rowNew = false;
				this.rowEdit = false;
				showToast(mensaje, 'error');
			} else {
				e.isValid = true;
				this.rowApplyChanges = false;
				this.rowDelete = false
				this.rowNew = true;
				this.rowEdit = false;
				this.acciongrid = '';
			};

		// }
	}
  
  // Función para agregar un cero delante de los números menores a 10
  agregarCeroDelante(numero:any) {
    return numero < 10 ? `0${numero}` : numero;
  }

  // Función para calcular la diferencia de tiempo en horas y minutos
  calcularDiferenciaMinutos(horaInicio:any, horaFin:any) {
    const [inicioHoras, inicioMinutos] = horaInicio.split(':').map(Number);
    const [finHoras, finMinutos] = horaFin.split(':').map(Number);

    const fechaInicio:any = new Date();
    fechaInicio.setHours(inicioHoras, inicioMinutos, 0, 0);

    const fechaFin:any = new Date();
    fechaFin.setHours(finHoras, finMinutos, 0, 0);

    // Calcular la diferencia en milisegundos
    const diferenciaMs = fechaFin - fechaInicio;

    // Convertir la diferencia a minutos
    const diferenciaMinutos = diferenciaMs / (1000 * 60);

    return diferenciaMinutos;
  }

  opPrepararGuardar(accion: string): void {
		if ( this.conCambios != 0 ) {
			const prm = ({ ENCABEZADO: this.FCapacidad, ITEMS: this.DSecciones.filter((d:any) => d.TIPO === 'OPERATIVA' && d.MANO_OBRA === true) });
			// API guardado de datos
      this.loadingVisible = true;
			this.sData.save(accion, prm).subscribe((data) => {
        this.loadingVisible = false;
				const res = JSON.parse(data.data);
				if ( (data.token != undefined) ){
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				if (res[0].ErrMensaje !== '') {
					this.prmUsrAplBarReg.error = 'Error';
					this.prmUsrAplBarReg.accion = 'r_guardar';
					this.showModal(res[0].ErrMensaje, 'Error');
				} else {
					// Operaciones de barra
          if(this.VDatosReg !== undefined && this.VDatosReg !== null && this.VDatosReg.length > 0) {
            this.QFiltro = "CAPACIDAD_PRODUCCION='"+this.FCapacidad.ITEM+"'";
            const npos:any = this.VDatosReg.findIndex((d:any) => d.ITEM === this.FCapacidad.ITEM);
            if (npos > -1) {
              this.VDatosReg[npos] = this.FCapacidad;
              this.VDatosReg[npos].ITEMS = this.DSecciones;
            } else {
              this.VDatosReg.push({...this.FCapacidad, ITEMS: this.DSecciones});
            }
            if(this.mnuAccion === 'new') {
              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                error: "",
                accion: "r_navegar",
                r_numReg: this.prmUsrAplBarReg.r_numReg + 1,
                r_totReg: this.prmUsrAplBarReg.r_totReg + 1,
                operacion: {}
              };
            } else {
              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                error: "",
                accion: "r_navegar",
                r_numReg: this.prmUsrAplBarReg.r_numReg,
                r_totReg: this.prmUsrAplBarReg.r_totReg,
                operacion: {}
              };
            }
          } else {
            this.QFiltro = "CAPACIDAD_PRODUCCION='"+this.FCapacidad.ITEM+"'";
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              r_numReg: 1,
              r_totReg: 1,
              operacion: {}
            };
          }
          this.readOnly = true;
          showToast('Registro actualizado', 'success');
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.opIrARegistro('r_numreg');
				}
			});
		} else {
      showToast('No hay cambios por guardar', 'error');
      this.readOnly = true;
      this.prmUsrAplBarReg = {
        ...this.prmUsrAplBarReg,
        accion: "r_ini",
        error: "",
        r_numReg: 0,
        r_totReg: 0,
        operacion: {r_refrescar: true}
      };
      this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
		}
	}

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string){
    if (obj === 'secciones' || obj === 'todos') {
      // Carga las secciones registradas
      this.sData.consulta('qsecciones', { FILTRO: "" }, this.prmUsrAplBarReg.aplicacion).subscribe((data) => {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'Error');
          return;
        }
        for (let i = 0; i < res.length; i++) {
          res[i].COD = i;
        }
        this.DSecciones = [];
        const newArray:any = JSON.parse(JSON.stringify(res));
        this.DPlantas = newArray.filter((d:any) => d.TIPO === 'Planta');
        this.DSecciones_prev = newArray;
      },
        (err => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    if (obj === 'turnos' || obj === 'todos') {
      const prm = { };
      this.sData.consulta('TURNOS', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'Error');
          return;
        } else {
          const newArray = res;
          // Variables para almacenar el total de minutos por tipo
          var horasProductiva = 0;
          var minutosProductiva = 0;
          var horasReceso = 0;
          var minutosReceso = 0;
          let totalMinutosProductiva = 0;
          let totalMinutosReceso = 0;
          newArray.forEach((turno:any) => {
            turno.ITM_TURNOS.forEach((jornada:any) => {
              var fecha:any;
              for (let i = 0; i <= 1; i++) {
                if (i === 0)
                  fecha = new Date(jornada.INICIO);
                else if (i === 1)
                  fecha = new Date(jornada.FINAL);
                // Obtener las partes de la hora
                const horas = fecha.getHours();
                const minutos = fecha.getMinutes();
    
                // Formatear la hora como cadena
                const horaFormateada = `${this.agregarCeroDelante(horas)}:${this.agregarCeroDelante(minutos)}`;
                if (i === 0)
                  jornada.INICIO = horaFormateada;
                else if (i === 1)
                  jornada.FINAL = horaFormateada;
              }
              
              const minutos = this.calcularDiferenciaMinutos(jornada.INICIO, jornada.FINAL);
              if (jornada.TIPO === 'PRODUCTIVA')
                totalMinutosProductiva += minutos;
              else if (jornada.TIPO === 'RECESO')
                totalMinutosReceso += minutos;
            });

            // Convertir los minutos totales a horas y minutos
            horasProductiva = Math.floor(totalMinutosProductiva / 60);
            minutosProductiva = totalMinutosProductiva % 60;
            horasReceso = Math.floor(totalMinutosReceso / 60);
            minutosReceso = totalMinutosReceso % 60;
            
            turno.HR_PRODUCTIVA = this.agregarCeroDelante(horasProductiva)+':'+this.agregarCeroDelante(minutosProductiva);
            turno.HR_RECESO = this.agregarCeroDelante(horasReceso)+':'+this.agregarCeroDelante(minutosReceso);
          });
          this.DTurnos = newArray;
        };
      },
        (err => {
          this.showModal(err.message, 'Error');
        })
      );
    };
  }

  // Imprimir reporte de aplicación
  imprimirReporte(operMenu:any) {
		var prmRep = {
      ...operMenu.operacion, 
      accion: 'previsualizar',
      aplicacion: this.prmUsrAplBarReg.aplicacion, 
      tabla: this.prmUsrAplBarReg.tabla,
      usuario: this.prmUsrAplBarReg.usuario,
      QFiltro: (operMenu.operacion.registro === 'todos') ? this.QFiltro : " CAPACIDAD_PRODUCCION.ITEM = "+this.FCapacidad.ITEM
    };
    if (operMenu.operacion.modo === 'previsualizar')
      this.eventsSubjectInformes.next(prmRep);
    if (operMenu.operacion.modo === 'pdf') {
      prmRep = { ...prmRep, accion: 'pdf' };
      this.eventsSubjectInformes.next(prmRep);
    }
    if (operMenu.operacion.modo === 'email') {
      let template = '';
      let asunto = '';
      let email_sale = '';
      let nom_usr = '';
      var prmRep = { ...operMenu.operacion, 
          accion: 'email',
          asunto,
          email_sale,
          especUsuarioEmail: nom_usr,
          nombre: this.FCapacidad.ITEM,
          email:  '',
          template,
          replacements: '',
          dataSource: this.FCapacidad
        };
      this.eventsSubjectInformes.next(prmRep);
    }

	}

  getSizeQualifier(width:any) {
    if (width < 768)  return "xs";
    if (width < 992)  return "sm";
    if (width < 1366) return "md";
    return "lg";
  }

  showModal(mensaje:any, titulo:any='¡Error!', msg_html:any= '') {
    let iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
    if (titulo !== '¡Error!') iconHtml = "<i class='icon-alert-ol'></i>";
    Swal.fire({
      iconHtml: iconHtml,
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
