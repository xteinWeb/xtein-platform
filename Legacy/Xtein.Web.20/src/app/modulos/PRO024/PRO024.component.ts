import { CommonModule, formatDate } from '@angular/common';
import { Component, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxFormModule, DxLoadPanelModule, DxSelectBoxModule, DxTagBoxModule, DxTextBoxModule, DxValidatorModule } from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { lastValueFrom, Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { PRO024Service } from 'src/app/services/PRO024/pro024.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { validatorRes } from 'src/app/shared/validator/validator';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import Swal from 'sweetalert2';
import { FTurnos } from './clsPRO024.class';
import { showToast } from '../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-PRO024',
  templateUrl: './PRO024.component.html',
  styleUrls: ['./PRO024.component.css'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxTextBoxModule, DxDataGridModule, DxSelectBoxModule, DxDateBoxModule,
            DxValidatorModule, DxTagBoxModule, DxButtonModule, DxLoadPanelModule, VistarapidaComponent
          ]
})
export class PRO024Component implements OnInit {

  @ViewChild("gridTurnos", { static: false }) gridTurnos: DxDataGridComponent;

  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  subs_filtro: Subscription;
  subs_visor: Subscription;

  prmUsrAplBarReg: clsBarraRegistro;
	mnuAccion: string;
	VDatosReg: any [] = [];
  QFiltro: any;

  readOnly: boolean;
  FTurnos: FTurnos;
  Itm_Turnos: any [] = [];
  DiasSemana: any [] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
  DiasSelec: any [] = [];
  selectTurno: any = [];
	data_prev: any = '';
  TOTAL_JORNADA_RECESO: any;
  TOTAL_JORNADA_PRODUCTIVA: any;
  validatorForm: boolean = false;
  validatorData: boolean = false;
  loadingVisible: boolean = false;
  colCountByScreen: object;
  localId: any;

  //notificaciones.
	esVisibleSelecc: string = 'none';
  toaVisible: boolean = false;
	toaTipo = 'info'
  toaMessage = 'Registro actualizado!';
	conCambios: number = 0;
  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];

  constructor(
    private _sdatos: PRO024Service,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private tabService: TabService,
    private SVisor: SvisorService,
    @Inject (LOCALE_ID) localID: string
  ) {
    this.subscription = this._sbarreg
    .getObsRegApl()
    .pipe(takeUntil(this.unSubscribe))
    .subscribe((dempeg) => {
      // Valida si la petición es para esta aplicacion
      if (dempeg.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opMenuRegistro(dempeg);
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
      const nx = this.VDatosReg.findIndex(d => d.PRODUCTO === resp.PRODUCTO);
      if (nx !== -1) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    })

    this.colCountByScreen = {
      xs: 1,
      sm: 1,
      md: 2,
      lg: 2,
    };

    this.localId = localID;

    this.onInitNewRowPro = this.onInitNewRowPro.bind(this);
    this.onValueChangedInicio = this.onValueChangedInicio.bind(this);
    this.onValueChangedFin = this.onValueChangedFin.bind(this);
    this.ValideExistencia = this.ValideExistencia.bind(this);

  }

  ngOnInit(): void {
    const user:any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
			tabla: 'HORARIOS',
			aplicacion: 'PRO-024',
			usuario: user,
			accion: 'r_ini',
			error: '',
			r_numReg: 0,
			r_totReg: 0,
			operacion: { r_modificar: true }
		};
		this.readOnly = true;
    this.FTurnos = { ID_HORARIO:'', DESCRIPCION:'', ESTADO:''};
		this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.valoresObjetos('todos');
  }

  // Llama a Acciones de registro
	opMenuRegistro(operMenu: clsBarraRegistro): void {
		switch (operMenu.accion) {
			case "r_ini":
				const user:any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'HORARIOS',
          aplicacion: 'PRO-024',
          usuario: user,
					accion: "r_ini",
					error: "",
					r_numReg: 0,
					r_totReg: 0,
					operacion: {}
				};
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

      case 'r_nuevo':
        this.mnuAccion = "new";
        this.readOnly = false;
        this._sdatos.accion = 'nuevo';
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = "update";
        this._sdatos.accion = 'modificar';
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        this.opPrepararGuardar(this.mnuAccion);
        break;

			case 'r_buscar':
        this._sdatos.accion = 'consultar';
        this.mnuAccion = "consulta";
				if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
				if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
				break;

			case 'r_buscar_ejec':
        this._sdatos.accion = 'consultar';
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

			case 'r_cancelar':
        var mensaje = '¿Desea cancelar la operación?'; 
        const tipo = 'Error';
				if (this.conCambios != 0) mensaje = 'Desea cancelar sin guardar cambios?';
				Swal.fire({
					title: '',
					text: mensaje,
					iconHtml: "<i class='icon-alert-ol'></i>",
					showCancelButton: true,
          confirmButtonColor: tipo==='Error' ? '#DF3E3E !important':'#0F4C81 !important',
					cancelButtonColor: '#438ef1',
					cancelButtonText: 'No',
					confirmButtonText: 'Sí, cancelar'
					}).then((result) => {
					if (result.isConfirmed) {            
            this.loadingVisible = true;
            this._sdatos.accion = '';
						this.readOnly = true;
						this.conCambios = 0;
            this.loadingVisible = false;
            if ( (this.data_prev === undefined) || (this.data_prev === '') ||
                  (this.data_prev === null) || (this.data_prev.length === 0)
              ){
              this.opBlanquearForma();
            } else {
              this.FTurnos = JSON.parse(JSON.stringify(this.data_prev.TURNO));
              this.Itm_Turnos = JSON.parse(JSON.stringify(this.data_prev.ITM_TURNO));
            }
          }
            this.mnuAccion = "";
            this.esVisibleSelecc = 'none';
						this.prmUsrAplBarReg.accion = 'r_cancelar';
						this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
					
				});
				break;

			case "r_vista":
        this.opVista();
        break;

			case 'r_refrescar':
				this.valoresObjetos('todos');
				break;

			case 'r_imprimir':
				this.imprimirReporte(operMenu.operacion.id_reporte, operMenu.operacion.archivo, operMenu.operacion.data_rpt);
				break;

			case 'r_configurar':
				break;


			default:
				break;
		}
	}

  opPrepararNuevo(): void {
    if(this.VDatosReg.length > 0) {
      this.data_prev = {TURNO: this.FTurnos, ITM_TURNO: this.Itm_Turnos};
    }
		this.FTurnos.ID_HORARIO = '';
		this.FTurnos.DESCRIPCION = '';
		this.FTurnos.ESTADO = 'ACTIVO';
    this.TOTAL_JORNADA_PRODUCTIVA = 0;
    this.TOTAL_JORNADA_RECESO = 0;
    this.Itm_Turnos = [];
    this.DiasSelec = [];
    this.esVisibleSelecc = 'onClick';
	}

  onInitNewRowPro(e: any) {
    e.data.ID_HORARIO = this.FTurnos.ID_HORARIO;
    e.data.TIPO = '';
    e.data.DIAS = '';
    e.data.HORAS = '';
    e.data.MINUTOS = '';
    e.data.SEGUNDOS = '';
    if(this.Itm_Turnos.length > 0) {
      //nueva hora de inicio
      var hora_ant = new Date(this.Itm_Turnos[this.Itm_Turnos.length - 1].FINAL);
      const minu = hora_ant.getMinutes();
      hora_ant.setMinutes(minu);
      e.data.INICIO = new Date(hora_ant);
      //nueva hora de fin
      var hora_ini = new Date(hora_ant);
      const min = hora_ini.getMinutes();
      hora_ini.setMinutes(min + 1);
      e.data.FINAL = new Date(hora_ini);
    } else {
      e.data.INICIO = new Date();
      //nueva hora de fin
      var hora_fin = new Date();
      const minute = hora_fin.getMinutes();
      hora_fin.setMinutes(minute + 1);
      e.data.FINAL = new Date(hora_fin);
    }
	}

  onRowValidating(e:any) {
    if (this.mnuAccion === 'new') {
      if((e.newData.TIPO === '') || (e.newData.DIAS === '') || (e.newData.INICIO === '') || (e.newData.FINAL === '') || (this.DiasSelec.length <= 0)) {
        showToast('Faltan completar datos del turno.', 'error');
        e.isValid = false;
        this.validatorData = false;
        this.rowApplyChanges = true;
        this.rowNew = true;
      } else {
        e.isValid = true;
        this.validatorData = true;
        this.rowApplyChanges = false;
        this.rowEdit = false;
        this.rowNew = true;
      }
    };
    if (this.mnuAccion === 'update') {
      for (let prop in e.newData) {
        if (e.newData.hasOwnProperty(prop) && e.oldData.hasOwnProperty(prop)) {
          e.oldData[prop] = e.newData[prop];
        }
      }
      if((e.oldData.TIPO === '') || (e.oldData.DIAS === '') || (e.oldData.INICIO === '') || (e.oldData.FINAL === '') || (this.DiasSelec.length <= 0)) {
        showToast('Faltan completar datos del turno.', 'error');
        e.isValid = false;
        this.validatorData = false;
        this.rowApplyChanges = true;
        this.rowNew = true;
      } else {
        e.isValid = true;
        this.validatorData = true;
        this.rowApplyChanges = false;
        this.rowEdit = false;
        this.rowNew = true;
      }
    };

  }

  calculateTotalTime() {
    let contHoraProductiva:any = 0;
    let contHoraReceso:any = 0;
    let ele:any = 0;
    this.Itm_Turnos.forEach((element:any) =>{
      if(element.TIPO ==='PRODUCTIVA') {
        const hora_uno:any = new Date(element.INICIO); 
        const hora_dos:any = new Date(element.FINAL); 
        // contHoraProductiva = (hora_dos - hora_uno) + contHoraProductiva;
        var newItem:any = (hora_dos - hora_uno)
        if (newItem < 0)
          newItem = Math.abs(newItem);
        contHoraProductiva = contHoraProductiva + newItem;
      }
      if(element.TIPO ==='RECESO') {
        const hora_uno:any = new Date(element.INICIO); 
        const hora_dos:any = new Date(element.FINAL); 
        // contHoraReceso = (hora_dos - hora_uno) + contHoraReceso;
        var newItem:any = (hora_dos - hora_uno)
        if (newItem < 0)
          newItem = Math.abs(newItem);
          contHoraReceso = contHoraReceso + newItem;
      }
    });
    if (contHoraProductiva > 0) {
      ele = contHoraProductiva;
      var hour = (ele / 1000 / 60);
      if (hour < 0)
        hour = Math.abs(hour);
      hour = Math.floor(hour / 60);
      var hrs = (hour < 10)? '0' + hour : hour;
      var minute = Math.floor((ele / 1000 / 60) % 60);
      if (minute < 0)
          minute = Math.abs(minute);
      var min = (minute < 10)? '0' + minute : minute;
      var second = ele % 60;
      if (second < 0)
          second = Math.abs(second);
      var seg = (second < 10)? '0' + second : second;
      const time = hrs + ':' + min;
      this.TOTAL_JORNADA_PRODUCTIVA = time;
    } else {
      this.TOTAL_JORNADA_PRODUCTIVA = '00:00';
    };
    if (contHoraReceso > 0) {
      ele = contHoraReceso;
      var hour = (ele / 1000 / 60);
      if (hour < 0)
        hour = Math.abs(hour);
      hour = Math.floor(hour / 60);
      var hrs = (hour < 10)? '0' + hour : hour;
      var minute = Math.floor((ele / 1000 / 60) % 60);
      if (minute < 0)
        minute = Math.abs(minute);
      var min = (minute < 10)? '0' + minute : minute;
      var second = ele % 60;
      if (second < 0)
        second = Math.abs(second);
      var seg = (second < 10)? '0' + second : second;
      const time = hrs + ':' + min;
      this.TOTAL_JORNADA_RECESO = time;
    } else {
      this.TOTAL_JORNADA_RECESO = '00:00';
    };
  }

  opPrepararModificar(): void {
    this.loadingVisible = true;
    this.readOnly = false;
    this.esVisibleSelecc = 'onClick';
    this.data_prev = JSON.parse(JSON.stringify({ TURNO: this.FTurnos, ITM_TURNO: this.Itm_Turnos }));
    this.loadingVisible = false;
	}

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  onEditingStart(e:any) {
    this.rowApplyChanges = true;
    this.rowNew = false;
  }

  onRowInserted(e:any) {
    this.calculateTotalTime();
  }

  onRowUpdated(e:any) {
    this.calculateTotalTime();
  }

  opPrepararGuardar(accion: string): void {
		if ( this.conCambios != 0 ) {
      const CABECERA = this.FTurnos;
      const DETALLE = this.Itm_Turnos;
      if((CABECERA.ID_HORARIO === '') || (CABECERA.DESCRIPCION === '') || (CABECERA.ESTADO === '') || (DETALLE.length <= 0) ) {
        showToast('Faltan datos por completar', 'error');
        return;
      } else {
        DETALLE.forEach(element => {
          element.INICIO = formatDate(element.INICIO, 'shortTime', this.localId );
          element.FINAL = formatDate(element.FINAL, 'shortTime', this.localId );
        });
        this.loadingVisible = true;
        const prm = ({ TURNO: CABECERA, ITM_TURNO: DETALLE });
        // API guardado de datos
        this._sdatos.save(accion, prm, this.prmUsrAplBarReg.aplicacion).subscribe((data) => {
          this.loadingVisible = false;
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== '') {
            this.showModal(res[0].ErrMensaje, 'Error');
            return;
          } else {
            // Operaciones de barra
            if(this.VDatosReg.length > 0) {
              const npos:any = this.VDatosReg.findIndex((d:any) => d.ID_HORARIO === this.FTurnos.ID_HORARIO);
              this.VDatosReg[npos].ID_HORARIO = this.FTurnos.ID_HORARIO;
              this.VDatosReg[npos].DESCRIPCION = this.FTurnos.DESCRIPCION;
              this.VDatosReg[npos].ESTADO = this.FTurnos.ESTADO;
              this.VDatosReg[npos].ITM_TURNO = this.Itm_Turnos;
              this.QFiltro = "TURNO='"+this.FTurnos.ID_HORARIO+"'";
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
              this.QFiltro = "TURNO='"+this.FTurnos.ID_HORARIO+"'";
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
            this.esVisibleSelecc = 'none';
            showToast('Registro actualizado', 'success');
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          }
        });
      };

		} else {
      this.loadingVisible = false;
      showToast('No hay cambios por guardar', 'error');
		}
	}

  opPrepararBuscar(accion): void {
		if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para TURNOS",
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
      const prm = {HORARIOS: arrFiltro };
      this.loadingVisible = true;
      // Ejecuta búsqueda API
      this._sdatos
        .consulta_filtro('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
					try {
            this.loadingVisible = false;
						const res = JSON.parse(data.data);
						this._sfiltro.enConsulta = false;
						if ( (data.token != undefined) ){
							const refreshToken = data.token;
							localStorage.setItem("token", refreshToken);
						}
						const datares = res;
						if (datares[0].ErrMensaje === '') {
							// Asocia datos
							if ( datares??'' != '' ) {
                // cabecera
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
                this.readOnly = true;
							}
						} else {
							this.VDatosReg = [];
							//notificación
              showToast(datares[0].ErrMensaje, 'warning');
              this.prmUsrAplBarReg.accion = 'r_cancelar';
              this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
							//this.opBlanquearForma();
						}
					} catch (error) {
            this.loadingVisible = false;
						this.readOnly = true;
            this._sfiltro.enConsulta = false;
						this.showModal(error, 'Error');
					}
      });
    }
	}

  opIrARegistro(accion: string): void {
    let newArray: any;
    this.prmUsrAplBarReg.accion = "r_numreg";

    switch (accion) {
      case "r_primero":
        if (this.VDatosReg.length != 0){
          this.prmUsrAplBarReg.r_numReg = 1;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[0]));
        } else {
          showToast('No se encontraron Datos', 'error');
          this.readOnly = true;
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
        	this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
          ? this.VDatosReg.length
          : this.prmUsrAplBarReg.r_numReg + 1;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        }
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        this.prmUsrAplBarReg.r_totReg--;
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length > 0) {
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        } else {
          this.opBlanquearForma();
        }
        break;

      default:
        break;
    }
    this.FTurnos.ID_HORARIO = newArray.ID_HORARIO;
    this.FTurnos.DESCRIPCION = newArray.DESCRIPCION;
    this.FTurnos.ESTADO = newArray.ESTADO;
    if(newArray.ITM_TURNO.length > 0) {
      newArray.ITM_TURNO.forEach((element:any) => {
        let dias:any = [];
        if(element.LUNES)
          dias.push('LUNES');
        if(element.MARTES)
          dias.push('MARTES');
        if(element.MIERCOLES)
          dias.push('MIERCOLES');
        if(element.JUEVES)
          dias.push('JUEVES');
        if(element.VIERNES)
          dias.push('VIERNES');
        if(element.SABADO)
          dias.push('SABADO');
        if(element.DOMINGO)
          dias.push('DOMINGO');
        element.DIAS = dias;
        this.DiasSelec = dias;
      });
      this.Itm_Turnos = newArray.ITM_TURNO;
    } else {
      this.Itm_Turnos = [''];
    }
    this.calculateTotalTime();
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
  }

  onValueChangedFormID_HORARIO(e:any) {
    if( (e.value === '') || (e.value === undefined) || (e.value === null) ) {
      this.FTurnos.ID_HORARIO = '';
      this.validatorForm = false;
    } else {
      this.FTurnos.ID_HORARIO = e.value;
      if( (this.FTurnos.ID_HORARIO !== '') && (this.FTurnos.DESCRIPCION !== '') && (this.FTurnos.ESTADO !== '') )
        this.validatorForm = true;
      else
        this.validatorForm = false;
      this.conCambios++;
    }
  }

  onValueChangedFormDESCRIPCION(e:any) {
    if( (e.value === '') || (e.value === undefined) || (e.value === null) ) {
      this.FTurnos.DESCRIPCION = '';
      this.validatorForm = false;
    } else {
      this.FTurnos.DESCRIPCION = e.value;
      if( (this.FTurnos.ID_HORARIO !== '') && (this.FTurnos.DESCRIPCION !== '') && (this.FTurnos.ESTADO !== '') )
        this.validatorForm = true;
      else
        this.validatorForm = false;
      this.conCambios++;
    }
  }

  onValueChangedFormESTADO(e:any) {
    if( (e.value === '') || (e.value === undefined) || (e.value === null) ) {
      this.FTurnos.ESTADO = '';
      this.validatorForm = false;
    } else {
      this.FTurnos.ESTADO = e.value;
      if( (this.FTurnos.ID_HORARIO !== '') && (this.FTurnos.DESCRIPCION !== '') && (this.FTurnos.ESTADO !== '') )
        this.validatorForm = true;
      else
        this.validatorForm = false;
      this.conCambios++;
    }
  }

  onValueChangedTipo(e:any, cellInfo:any) {
    if ((e.value !== null) && (e.value !== undefined) && (e.value !== '')) {
      this.gridTurnos.instance.cellValue(cellInfo.rowIndex, 'TIPO', e.value);
      this.conCambios++;
    }
  }

  onValueChangedDias(e:any, cellInfo:any) {
    if ((e.value !== null) && (e.value !== undefined) && (e.value !== '')) {
      this.gridTurnos.instance.cellValue(cellInfo.rowIndex, 'DIAS', e.value);
      this.DiasSelec = e.value;
      this.conCambios++;
    }
  }

  // Valide unicidad de la llave
  async ValideExistencia(e: any) {
    if (this.mnuAccion === 'new') {    
      // Valida la existencia de la llave respectiva
      const prm = { ID_HORARIO: e.value, accion: this.mnuAccion };
      const apiRest = this._sdatos.validellave('EXISTE HORARIO',prm,'PRO024');
      let res = await lastValueFrom(apiRest, {defaultValue: true});
      res = JSON.parse(res.data);
      if (res[0].ErrMensaje === '') {
        this.conCambios++;
        return true;
      } else {
        showToast(res[0].ErrMensaje, 'error');
        return false;
      } 
    } else {
      return true;
    }
  }

  onValueChangedInicio(e:any, cellInfo:any) {
    if ((e.value !== null) && (e.value !== undefined) && (e.value !== '')) {
      if(this.Itm_Turnos.length > 0) {
        const ele:any = this.Itm_Turnos.findIndex((d:any) => (e.value >= d.INICIO) && (e.value < d.FINAL));
        if(ele !== -1) {
          const time:any = new Date(this.Itm_Turnos[this.Itm_Turnos.length-1].FINAL);
          cellInfo.data.INICIO = time;
          this.gridTurnos.instance.cellValue(cellInfo.rowIndex, 'INICIO', time);
          showToast('La hora ya fue asignada a una Jornada de Tipo: '+this.Itm_Turnos[ele].TIPO, 'error');
          return;
        } else {
          cellInfo.data.INICIO = e.value;
          this.gridTurnos.instance.cellValue(cellInfo.rowIndex, 'INICIO', e.value);
          this.conCambios++;
          this.calculateTime(cellInfo);
        };
      } else {
        cellInfo.data.INICIO = e.value;
        this.gridTurnos.instance.cellValue(cellInfo.rowIndex, 'INICIO', e.value);
        this.conCambios++;
        this.calculateTime(cellInfo);
      };
    }
  }

  onValueChangedFin(e:any, cellInfo:any) {
    if ((e.value !== null) && (e.value !== undefined) && (e.value !== '')) {
      if(this.Itm_Turnos.length > 0) {
        const ele:any = this.Itm_Turnos.findIndex((d:any) => (d.INICIO === e.value) || (d.FINAL === e.value));
        if(ele !== -1) {
          const time:any = new Date(cellInfo.data.INICIO);
          cellInfo.data.FINAL = time;
          this.gridTurnos.instance.cellValue(cellInfo.rowIndex, 'FINAL', time);
          showToast('La hora ya fue asignada a una Jornada de Tipo: '+this.Itm_Turnos[ele].TIPO, 'error');
          return;
        } else {
          cellInfo.data.FINAL = e.value;
          this.gridTurnos.instance.cellValue(cellInfo.rowIndex, 'FINAL', e.value);
          this.conCambios++;
          this.calculateTime(cellInfo);
        };          
      } else {
        cellInfo.data.FINAL = e.value;
        this.gridTurnos.instance.cellValue(cellInfo.rowIndex, 'FINAL', e.value);
        this.conCambios++;
        this.calculateTime(cellInfo);
      };
    }
  }

  calculateTime(cellInfo:any) {
    if((cellInfo.data.INICIO !== '') || (cellInfo.data.INICIO !== undefined) || (cellInfo.data.INICIO !== null)
        &&
        (cellInfo.data.FINAL !== '') || (cellInfo.data.FINAL !== undefined) || (cellInfo.data.FINAL !== null)
    ) {
      let hora_inicio:any = new Date(cellInfo.data.INICIO);
      let hora_fin:any = new Date(cellInfo.data.FINAL);
      const ele: any = hora_fin - hora_inicio;
      
      var hour = (ele / 1000 / 60);
      if (hour < 0)
        hour = Math.abs(hour);
      hour = Math.floor(hour / 60);
      var hrs = (hour < 10)? '0' + hour : hour;

      var minute = Math.floor((ele / 1000 / 60) % 60);
      if (minute < 0)
        minute = Math.abs(minute);
      var min = (minute < 10)? '0' + minute : minute;

      var second = ele % 60;
      if (second < 0)
        second = Math.abs(second);
      var seg = (second < 10)? '0' + second : second;
      // if(hora_fin > hora_inicio) {
      const time = hrs + ':' + min + ':' + seg;
      cellInfo.data.HORA = hour;
      cellInfo.data.MIN = min;
      cellInfo.data.SEG = seg;
      this.gridTurnos.instance.cellValue(cellInfo.rowIndex, 'HORAS', cellInfo.data.HORA);
      this.gridTurnos.instance.cellValue(cellInfo.rowIndex, 'MINUTOS', cellInfo.data.MIN);
      this.gridTurnos.instance.cellValue(cellInfo.rowIndex, 'SEGUNDOS', cellInfo.data.SEG);
      // } else {
      //   //nueva hora de fin
      //   var hora_ini = new Date(cellInfo.data.INICIO);
      //   const min = hora_ini.getMinutes();
      //   hora_ini.setMinutes(min + 1);
      //   cellInfo.data.FINAL = new Date(hora_ini);
      //   this.gridTurnos.instance.cellValue(cellInfo.rowIndex, 'FINAL', cellInfo.data.FINAL);
      //   showToast('Hora final no puede ser mayor a la Hora de inicio', 'error');
      // }
    } else {
      showToast('Faltan datos, seleccione Hora Inicio y Hora Fin', 'error');
    }
  }

  opEliminar(): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html: "¿Desea <b class='fw-bold'>eliminar</b> el turno <b class='fw-bold'>" +
            this.FTurnos.ID_HORARIO +
            " -- " +
            this.FTurnos.DESCRIPCION +
            "</b> ?",
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
		const prm = { TURNO: {ID_HORARIO: this.FTurnos.ID_HORARIO}, ITM_TURNO: [] };
    this._sdatos
      .delete('delete',prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
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
        }
        catch (error) {
          this.showModal('Error al eliminar producto: '+error, 'Error');
        }
    });
  }

  opBlanquearForma(): void {
    this.FTurnos.ID_HORARIO = '';
    this.FTurnos.DESCRIPCION = '';
    this.FTurnos.ESTADO = '';
    this.Itm_Turnos = [];
  }

  // Operaciones de grid
  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        if(this.validatorForm) {
          this.gridTurnos.instance.addRow();
          this.rowApplyChanges = true;
          this.rowNew = false;
        } else {
          showToast('Faltan datos del Turno.', 'error');
        }
        break;
      case 'edit':
        this.rowApplyChanges = true;
        this.rowEdit = false;
        break;
      case 'save':
        this.gridTurnos.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.calculateTotalTime();
        break;
      case 'cancel':
        this.gridTurnos.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
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
              const index = this.Itm_Turnos.findIndex(a => a.ITEM === key);
              this.Itm_Turnos.splice(index, 1);
            });
            this.conCambios++;
            this.gridTurnos.instance.refresh();
          }
        });
        break;

      default:
        break;
    }
  }

  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: "Turnos",
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: ['ID_HORARIO|Código','DESCRIPCION|Descripción','ESTADO|Estado'],
      Filtro: '',
      keyGrid: ['ID_HORARIO']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  valoresObjetos(obj: string) {

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

  showModal(mensaje: any, title: any) {
    const tipo = title;
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo==='Error' ? 'DF3E3E':'#0F4C81 !important',
			title: title,
      
			text: mensaje,
			allowOutsideClick: true,
			allowEscapeKey: false,
			allowEnterKey: false,
			backdrop: true,
			position: 'center',
			stopKeydownPropagation: false,
		});
	}
}
