import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridModule, DxDateBoxModule, DxDropDownBoxComponent, DxDropDownBoxModule, DxFormModule, DxHtmlEditorModule, DxListComponent, DxListModule, DxLoadPanelModule, DxNumberBoxModule, DxRadioGroupModule, DxScrollViewModule, DxSelectBoxModule, DxSwitchModule, DxTextAreaModule, DxTextBoxModule } from 'devextreme-angular';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { showToast } from '../../shared/toast/toastComponent.js';
import Swal from 'sweetalert2';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ADM410Service } from 'src/app/services/ADM410/ADM410.service';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';

@Component({
  selector: 'app-ADM410',
  templateUrl: './ADM410.component.html',
  styleUrls: ['./ADM410.component.css'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxDropDownBoxModule, DxDataGridModule, DxTextBoxModule, DxSelectBoxModule,
            DxSwitchModule, DxDateBoxModule, MatDividerModule, DxNumberBoxModule, MatChipsModule, MatButtonToggleModule,
            MatTooltipModule, DxRadioGroupModule, DxTextAreaModule, DxListModule, DxButtonModule, DxHtmlEditorModule,
            DxScrollViewModule, DxLoadPanelModule, VistarapidaComponent
          ]
})
export class ADM410Component {

  @ViewChild("dropSelectUsuarioRec", { static: false }) dropSelectUsuarioRec: DxDropDownBoxComponent;
  @ViewChild("dropSelectUsuarioEnv", { static: false }) dropSelectUsuarioEnv: DxDropDownBoxComponent;
  @ViewChild("listUsuarios", { static: false }) listUsuarios: DxListComponent;


  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();

  prmUsrAplBarReg: clsBarraRegistro;
	mnuAccion: string = '';
  FConfigurador: any = {};

  readOnly: boolean;
  QFiltro: any;
  data_prev: any;
  VDatosReg: any;
  DGAplicacion:any [] = [];
  selectAplicacion:any [] = [];
  DGUsuarios:any [] = [];
  selectUsuarioEnv:any [] = [];
  selectUsuarioRec:any [] = [];
  openAplicacion: boolean = false;
  openUsuarioRec: boolean = false;
  openUsuarioEnv: boolean = false;
  loadingVisible: boolean = false;
  indAsoArchivo: boolean = false;
  readOnlyBtnCada: boolean = false;
  mostrarSubirArchivos: boolean = false;

  USUARIO_LOCAL: any = '';
  base64DataFile: any;
  dropDownOptions: any;
  archivoDoc: any;
  conCambios: number = 0;
  minDateValue: Date;
  typeDateTime: string = 'datetime';
  periodoSeleccionado: string = '';
  numDiasMes: any[] = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];
  mesAno: any[] = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  DTiposMensaje: any = [ "Template HTML", "Reporte", "Texto", "Archivo Adjunto"  ]

  constructor(
    private SVisor: SvisorService,
    private _sfiltro: SfiltroService,
		private _sbarreg: SbarraService,
    private tabService: TabService,
    private _sdatos: ADM410Service
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
    });

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex(d => d.ITEM === resp.ITEM);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx+1;
        this.opIrARegistro('r_numreg');
      }
    })

    this.aceptarCambios = this.aceptarCambios.bind(this);
    this.validarDatos = this.validarDatos.bind(this);
  }

  ngOnInit(): void {
    this.archivoDoc = '';
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    const user:any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
			tabla: 'CONFIG_NOTIF',
      aplicacion: 'ADM-410',
			usuario: user,
			accion: 'r_ini',
			error: '',
			r_numReg: 0,
			r_totReg: 0,
			operacion: { r_refrescar: true }
		};
		this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.readOnly = true;
    this.FConfigurador = {
      ID_APLICACION: '',
      ESTADO: '',
      NOMBRE: '',
      DESCRIPCION: '',
      EVENTO: '',
      REGLA: '',
      USUARIO_ENV: '',
      USUARIO_REC: '',
      TIPO_NOTIFICADOR: '',
      SIEMPRE: false,
      TODO_DIA: false,
      REPETIR: false,
      FECHA_INICIO: '',
      FECHA_FIN: '',
      FRECUENCIA: '',
      INTERVALO_FRECUENCIA: 0,
      PERIODO_FRECUENCIA: '',
      TIPO_MENSAJE: '',
      MENSAJE: ''
    }
    this.valoresObjetos('todos', '');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
		this.subs_filtro.unsubscribe();
		this.subs_visor.unsubscribe();
  }

  // Llama a Acciones de registro
	opMenuRegistro(operMenu: clsBarraRegistro): void {
		switch (operMenu.accion) {
			case "r_ini":
				const user:any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'CONFIG_NOTIF',
          aplicacion: 'ADM-410',
          usuario: user,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_refrescar: true }
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

			case 'r_nuevo':
				this.mnuAccion = "new";
        this.readOnly = false;
				this.opPrepararNuevo();
				break;

			case 'r_modificar':
				this.mnuAccion = "update";
				this.opPrepararModificar();
				break;

			case 'r_guardar':
        if ( this.conCambios > 0 ) {
          if(this.validarDatos())
            this.opPrepararGuardar(this.mnuAccion);
        } else {
          showToast('No hay cambios por guardar', 'error');
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: "",
            accion: "r_navegar",
            r_numReg: 1,
            r_totReg: 1,
            operacion: {}
          };
          this.readOnly = true;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }
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
						this.readOnly = true;
						this.mnuAccion = "";
            this.FConfigurador = JSON.stringify(this.data_prev);
						if ( this.VDatosReg??'' != '' )
            	this.opIrARegistro('r_numreg');
            else
              this.opBlanquearForma();

            this.prmUsrAplBarReg.accion = 'r_cancelar';
						this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} };
						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
					}
				});
				break;

			case "r_vista":
				this.opVista();
        break;

			case 'r_refrescar':
        this.valoresObjetos('todos', '');
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
    this.data_prev = JSON.parse(JSON.stringify(this.FConfigurador));
    this.FConfigurador = {
      ID_APLICACION: '',
      NOMBRE: '',
      DESCRIPCION: '',
      ESTADO: 'ACTIVO',
      EVENTO: '',
      REGLA: '',
      USUARIO_ENV: '',
      USUARIO_REC: '',
      TIPO_NOTIFICADOR: '',
      SIEMPRE: false,
      TODO_DIA: false,
      REPETIR: false,
      FECHA_INICIO: new Date(),
      FECHA_FIN: new Date(),
      FRECUENCIA: '',
      INTERVALO_FRECUENCIA: 0,
      PERIODO_FRECUENCIA: '',
      TIPO_MENSAJE: '',
      MENSAJE: ''
    }
    this.selectAplicacion = [];
    this.selectUsuarioRec = [];
    this.selectUsuarioEnv = [];
	}

	opBlanquearForma(): void {
    this.FConfigurador = {
      ID_APLICACION: '',
      NOMBRE: '',
      DESCRIPCION: '',
      ESTADO: '',
      EVENTO: '',
      REGLA: '',
      USUARIO_ENV: '',
      USUARIO_REC: '',
      TIPO_NOTIFICADOR: '',
      SIEMPRE: false,
      TODO_DIA: false,
      REPETIR: false,
      FECHA_INICIO: '',
      FECHA_FIN: '',
      FRECUENCIA: '',
      INTERVALO_FRECUENCIA: 0,
      PERIODO_FRECUENCIA: '',
      TIPO_MENSAJE: '',
      MENSAJE: ''
    }
    this.selectAplicacion = [];
    this.selectUsuarioRec = [];
    this.selectUsuarioEnv = [];
  }

	opEliminar(): void { 
    Swal.fire({
      title: '',
      text: '',
      html: "¿Desea <b class='fw-bold'>eliminar</b> la configuración <b class='fw-bold'>" +
            this.FConfigurador.NOMBRE +
            "</b> ?",
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
				this.AccionEliminar();
      }
    });
  }

	// Ejecuta la eliminación
  AccionEliminar(): void {
    // API eliminación de datos
		const prm = { NOTIFICACION: this.FConfigurador };
    this._sdatos
      .delete('delete',prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        try {
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'Error');
          return;
        }

        //descuenta el indice de registros
        this.prmUsrAplBarReg.r_totReg--;
        this.opIrARegistro("Eliminado");
        showToast('Configuración eliminada', 'success');
        this.readOnly = true;

        // Operaciones de barra
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          error: "",
          accion: this.prmUsrAplBarReg.r_totReg !== 0 ? 'r_navegar' : 'r_ini',
          operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.opIrARegistro('r_numreg');
      } catch (error) {
        this.showModal(error, 'Error al eliminar: ');
      }
    });
  }

  opPrepararModificar(): void {
		this.readOnly = false;
    this.data_prev = JSON.parse(JSON.stringify(this.FConfigurador));
	}

  onValueChangedNombre(e:any) {
    if( this.mnuAccion.match('new|update')) {
      this.FConfigurador.NOMBRE = e.value;
      this.conCambios += 1;
    } else {
      this.FConfigurador.NOMBRE = e.value;
    }
  }

  onValueChangedDescripcion(e:any) {
    if( this.mnuAccion.match('new|update')) {
      this.FConfigurador.DESCRIPCION = e.value;
      this.conCambios += 1;
    } else {
      this.FConfigurador.DESCRIPCION = e.value;
    }
  }

  onSelectionAplicacion(e:any) {
    if( this.mnuAccion.match('new|update')) {
      this.FConfigurador.ID_APLICACION = e.selectedRowKeys[0];
      this.openAplicacion = false;
      this.conCambios += 1;
    } else {
      this.FConfigurador.ID_APLICACION = e.selectedRowKeys[0];
      this.openAplicacion = false;
    }
  }

  onSeleccEstado(e:any) {
    if( this.mnuAccion.match('new|update')) {
      this.FConfigurador.ESTADO = e.value;
      this.conCambios += 1;
    } else {
      this.FConfigurador.ESTADO = e.value;
    }
  }

  onSeleccEvento(e:any) {
    if( this.mnuAccion.match('new|update')) {
      this.FConfigurador.EVENTO = e.value;
      this.conCambios += 1;
    } else {
      this.FConfigurador.EVENTO = e.value;
    }
  }

  onValueChangedMensaje(e:any) {
    if( this.mnuAccion.match('new|update')) {
      this.FConfigurador.MENSAJE = e.value;
      this.conCambios += 1;
    } else {
      this.FConfigurador.MENSAJE = e.value;
    }
  }

  opPrepararGuardar(accion: string): void {
		// this.FConfigurador.USUARIO_REC = JSON.stringify(this.FConfigurador.USUARIO_REC);
    const prm = ({ NOTIFICACION: this.FConfigurador });
    // API guardado de datos
    this.loadingVisible = true;
    this._sdatos.save(accion, prm, this.prmUsrAplBarReg.aplicacion).subscribe((data) => {
      this.loadingVisible = false;
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      if (res[0].ErrMensaje !== '' && res[0].ErrMensaje !== 'VALIDO') {
        this.prmUsrAplBarReg.error = 'Error';
        this.prmUsrAplBarReg.accion = 'r_guardar';
        this.showModal(res[0].ErrMensaje, 'Error');
      }
      else {
        this.readOnly = true;

        // Operaciones de barra
        if (this.mnuAccion === 'new') {
          this.QFiltro = "NOTIFICACION='"+this.FConfigurador.NOMBRE+"'";
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
        this.readOnly = true;
        showToast('Registro actualizado', 'success');
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      }
    });
  }

  onValueChangedTodoElDia(e:any, tipo:any) {
    if( this.mnuAccion.match('new|update')) {
      if (tipo === 'SIEMPRE') {
        this.FConfigurador.SIEMPRE = e.value;
        if (!e.value) {
          this.FConfigurador.REPETIR = false;
          this.FConfigurador.TODO_DIA = false;
          this.FConfigurador.FRECUENCIA = '';
          this.FConfigurador.PERIODO_FRECUENCIA = '';
          this.FConfigurador.INTERVALO_FRECUENCIA = 0;
          this.periodoSeleccionado = '';
        }
      }
      if (tipo === 'TODO_DIA') {
        this.FConfigurador.TODO_DIA = e.value;
        if(e.value) {
          this.typeDateTime = 'date';
        } else {
          this.typeDateTime = 'datetime';
        }
      } else if (tipo === 'REPETIR') {
        this.FConfigurador.REPETIR = e.value;
        if(!e.value) {
          this.periodoSeleccionado = '';
          this.FConfigurador.FRECUENCIA = '';
          this.FConfigurador.PERIODO_FRECUENCIA = '';
          this.FConfigurador.INTERVALO_FRECUENCIA = 0;
          this.readOnlyBtnCada = false;
        }
      }
      this.conCambios += 1;
    } else {
      if (tipo === 'SIEMPRE') {
        this.FConfigurador.SIEMPRE = e.value;
      }
      if (tipo === 'TODO_DIA') {
        this.FConfigurador.TODO_DIA = e.value;
        if(e.value) {
          this.typeDateTime = 'date';
        } else {
          this.typeDateTime = 'datetime';
        }
      } else if (tipo === 'REPETIR') {
        this.FConfigurador.REPETIR = e.value;
      }
    }
  }

  getCalculateDuracion(e:any, data:any) {
    if( this.mnuAccion.match('new|update')) {
      if(data === 'fecha inicio')
        this.FConfigurador.FECHA_INICIO = e.value;
      if(data === 'fecha fin')
        this.FConfigurador.FECHA_FIN = e.value;
      this.validarFechas(this.FConfigurador.FECHA_INICIO, this.FConfigurador.FECHA_FIN)
    } else {
      if(data === 'fecha inicio')
        this.FConfigurador.FECHA_INICIO = e.value;
      if(data === 'fecha fin')
        this.FConfigurador.FECHA_FIN = e.value;
    }
  }

	validarFechas(a:any, b:any) {
		if((a === null) || (a === '') || (a === undefined)){
			showToast('Seleccione fecha inicial', 'error');
		} else {
			if((b === null) || (b === '') || (b === undefined)){
				showToast('Seleccione fecha final', 'error');
			} else {
				var f1 = new Date(a);
				var f2 = new Date(b); 
				if (f1 > f2){
					showToast('Fecha inicial no puede ser mayor a la Fecha final, modifique la fecha final', 'error');
				}
			};
		};
	}

  onSeleccFrecuencia(e:any) {
    switch (e.value) {
      case 'Horas':
        this.periodoSeleccionado = 'Hora(s)';
        this.FConfigurador.FRECUENCIA = e.value;
        this.readOnlyBtnCada = false;
        break;

      case 'Diario':
        this.periodoSeleccionado = 'Día(s)';
        this.FConfigurador.FRECUENCIA = e.value;
        this.readOnlyBtnCada = false;
        break;

      case 'Semanal':
        this.periodoSeleccionado = 'Semana(s)'
        this.FConfigurador.FRECUENCIA = e.value;
        this.readOnlyBtnCada = false;
        break;

      case 'Mensual':
        this.periodoSeleccionado = 'Mes(es)';
        this.FConfigurador.FRECUENCIA = e.value;
        this.readOnlyBtnCada = false;
        break;

      case 'Anual':
        this.periodoSeleccionado = 'Año(s)';
        this.FConfigurador.FRECUENCIA = e.value;
        this.readOnlyBtnCada = false;
        break;
    
      default:
        break;
    }
    if( this.mnuAccion.match('new|update')) {
      this.conCambios += 1;
    }
  }

  onSeleccTipoNotificador(e:any) {
    if( this.mnuAccion.match('new|update')) {
      this.FConfigurador.TIPO_NOTIFICADOR = e.value;
      this.conCambios += 1;
      switch (e.value) {
        case 'Email':
          this.DTiposMensaje = [ "Template HTML", "Reporte", "Texto", "Archivo Adjunto" ];
          this.FConfigurador.TIPO_MENSAJE = '';
          this.FConfigurador.MENSAJE = '';
          break;
          
        case 'Notificacion':
        case 'Mensaje de Texto':
          this.DTiposMensaje = [ "Texto" ];
          this.FConfigurador.TIPO_MENSAJE = 'Texto';
          this.FConfigurador.MENSAJE = '';
          break;

        case 'Mensaje a Chat':
          this.DTiposMensaje = [ "Texto", "Archivo Adjunto" ];
          this.FConfigurador.TIPO_MENSAJE = '';
          this.FConfigurador.MENSAJE = '';
          break;

      
        default:
          this.DTiposMensaje = [ "Template HTML", "Reporte", "Texto", "Archivo Adjunto" ];
          this.FConfigurador.TIPO_MENSAJE = '';
          this.FConfigurador.MENSAJE = '';
          break;
      }
    } else {
      this.FConfigurador.TIPO_NOTIFICADOR = e.value;
      switch (e.value) {
        case 'Email':
          this.DTiposMensaje = [ "Template HTML", "Reporte", "Texto", "Archivo Adjunto" ];
          break;
          
        case 'Notificacion':
        case 'Mensaje de Texto':
          this.DTiposMensaje = [ "Texto" ];
          break;

        case 'Mensaje a Chat':
          this.DTiposMensaje = [ "Texto", "Archivo Adjunto" ];
          break;

      
        default:
          this.DTiposMensaje = [ "Template HTML", "Reporte", "Texto", "Archivo Adjunto" ];
          break;
      }
    }
  }

  async onSeleccTipoMensaje(e:any) {
    if( this.mnuAccion.match('new|update')) {
      if (this.FConfigurador.MENSAJE !== '' || this.FConfigurador.MENSAJE.length > 0) {
        var mensaje = 'Se perdera el contenido del mensaje cargado. ¿Desea continuar?';
				await Swal.fire({
					title: '',
					text: mensaje,
					iconHtml: "<i class='icon-alert-ol'></i>",
					showCancelButton: true,
					confirmButtonColor: '#DF3E3E',
					cancelButtonColor: '#438ef1',
					cancelButtonText: 'Cancelar',
					confirmButtonText: 'Continuar'
					}).then((result) => {
					if (result.isConfirmed) {
            this.FConfigurador.TIPO_MENSAJE = e.value;
            this.FConfigurador.MENSAJE = '';
					}
				});
      } else {
        this.FConfigurador.TIPO_MENSAJE = e.value;
      }
      this.conCambios += 1;
    } else {
      this.FConfigurador.TIPO_MENSAJE = e.value;
    }
  }

  onSeleccIntervaloFrecuencia(e:any) {
    if( this.mnuAccion.match('new|update')) {
      this.FConfigurador.INTERVALO_FRECUENCIA = e.value;
      this.conCambios += 1;
    } else {
      this.FConfigurador.INTERVALO_FRECUENCIA = e.value;
    }
  }

  onValueChangedPeriodoFrecuencia(e:any, tipo:any){
    if( this.mnuAccion.match('new|update')) {
      if(tipo === 'semana')
        this.FConfigurador.PERIODO_FRECUENCIA = e.value;
      if(tipo === 'fecha')
        this.FConfigurador.PERIODO_FRECUENCIA = [e.value];
      if(tipo !== 'fecha' && tipo !== 'semana')
        this.FConfigurador.PERIODO_FRECUENCIA = e.value;

      this.conCambios += 1;
    } else {
      if(tipo === 'semana')
        this.FConfigurador.PERIODO_FRECUENCIA = e.value;
      if(tipo === 'fecha')
        this.FConfigurador.PERIODO_FRECUENCIA = [e.value];
      if(tipo !== 'fecha' && tipo !== 'semana')
        this.FConfigurador.PERIODO_FRECUENCIA = e.value;
    }
  }

  onSelectionUsuario(e:any, usuario:any, dropDown:any) {
    if( this.mnuAccion.match('new|update')) {
      if (usuario === 'USUARIO_ENV') {
        this.FConfigurador.USUARIO_ENV = e.selectedRowKeys[0];
        this.openUsuarioEnv = false;
      } else if (usuario === 'USUARIO_REC') {
        this.FConfigurador.USUARIO_REC = e.selectedRowKeys[0];
        this.openUsuarioRec = false;
      }
  
      this.conCambios += 1;
    }
  }

  aceptarCambios(e:any) {
    if( this.mnuAccion.match('new|update')) {
      if (this.selectUsuarioRec.length === this.DGUsuarios.length) {
        const npos:any = this.selectUsuarioRec.findIndex((d:any) => d === 'ONLINE');
        if(npos !== -1)
          this.selectUsuarioRec.splice(npos, 1);
      };
      this.FConfigurador.USUARIO_REC = this.selectUsuarioRec;
      this.openUsuarioRec = false;
      this.conCambios += 1;
    }
  }

  cancelarCambios(e:any) {
    this.openUsuarioRec = false;
    this.FConfigurador.USUARIO_REC = this.data_prev.USUARIO_REC;
  }

  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Notificaciones',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: ['ID_APLICACION|Id Aplicacion','NOMBRE|Nombre','ESTADO|Estado'],
      Filtro: '',
      keyGrid: ['ITEM']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opPrepararBuscar(accion:any): void {
		if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para NOTIFICACIONES",
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
      const prm = { CONFIG_NOTIF: arrFiltro };
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
            if(res[0].ErrMensaje !== '') {
              showToast(res[0].ErrMensaje, 'error');
              return;
            };
						const datares = res;

            datares.forEach((ele:any) => {
              ele.USUARIO_REC = JSON.parse(ele.USUARIO_REC);
            });

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
        this.prmUsrAplBarReg.r_numReg = 1;
        if (this.VDatosReg.length != 0){
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[0]));
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
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1]));

        }
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          newArray = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        } else {
          this.opBlanquearForma();
        }
        break;

      default:
        break;
    }

    // newArray.USUARIO_REC = newArray.USUARIO_REC.replace(/\\/g, '');
    // newArray.USUARIO_REC = JSON.parse(newArray.USUARIO_REC);
    this.FConfigurador = newArray;
    this.selectAplicacion = newArray.ID_APLICACION;
    this.selectUsuarioEnv = newArray.USUARIO_ENV;
    this.selectUsuarioRec = newArray.USUARIO_REC;
    this.data_prev = JSON.parse(JSON.stringify(this.FConfigurador));
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
  }

  // Abrir archivo
  onClickAbrir(data:any) {
    // Si está en modo visualizacion, asigna fila de datos
    if (data !== undefined)
      this.FConfigurador.MENSAJE = data;

    // Tipos de archivos
    const signatures = {
      JVBERi0: "application/pdf",
      R0lGODdh: "image/gif",
      R0lGODlh: "image/gif",
      iVBORw0KGgo: "image/png",
      TU0AK: "image/tiff",
      "/9j/": "image/jpg",
      UEs: "application/vnd.openxmlformats-officedocument.",
      PK: "application/zip",
    };
    var fileType = '';
    for (var s in signatures) {
      if (this.FConfigurador.MENSAJE.IMAGEN.indexOf(s) !== -1) {
        fileType = signatures[s];
        // return
        break;
      }
    }
    if (fileType.match('image')) {
      var image = new Image();
      image.src = this.FConfigurador.MENSAJE.IMAGEN;
      var w = window.open("");
      w?.document.write("<style>img{max-width: 75%;}</style>", image.outerHTML);
    }
    if (fileType.match('pdf')) {
      let pdfWindow = window.open("");
      pdfWindow?.document.write("<iframe width='100%' height='100%' src='" + this.FConfigurador.MENSAJE.IMAGEN +"#view=FitH'></iframe>");
    }

  }

  onClickEliminarArchivo(e:any, archivo:any) {
    const npos:any = this.FConfigurador.MENSAJE.findIndex((d:any) => d.ITEM === archivo.ITEM && d.ARCHIVO === archivo.ARCHIVO);
    this.FConfigurador.MENSAJE.splice(npos, 1);
  }

  onClickCargar(archPDF:any) {
    this.operArcImg('cargar', archPDF);
  }

  // Llama al cargue del archivo
  datArchivo: any;
  operArcImg(operArch:any, archivo:any) {

    // Operación de cargue de archivo
    if(operArch.match('cargar|icon-upload-file-sl')) {
      let input = document.createElement('input');
      this.datArchivo = archivo;
      input.type = 'file';
      input.multiple = true;
      input.accept="image/*,video/*,.pdf,.csv";
      this.indAsoArchivo = false;
      input.addEventListener("change", (e) => {
        if (!this.indAsoArchivo) this.fileChangeEvent(e, this.datArchivo);
      });
      if (!this.indAsoArchivo) input.click();
    }
  }

  imageError: string = '';
  tamArchivoImg: any;
  imgBase64zip: any;
  fileChangeEvent(fileInput:any, tarea:any) {
    var res: boolean = false;
    const signatures = {
      JVBERi0: "application/pdf",
      R0lGODdh: "image/gif",
      R0lGODlh: "image/gif",
      iVBORw0KGgo: "image/png",
      TU0AK: "image/tiff",
      "/9j/": "image/jpg",
      UEs: "application/vnd.openxmlformats-officedocument.",
      PK: "application/zip",
    };
    this.imageError = '';
    this.indAsoArchivo = true;
    for (let i = 0; i < fileInput.target.files.length; i++) {
      const file = fileInput.target.files[i];
      const larch = file.name;
      const tipoArchivo:any = file.type;
      var icon:any = '';
    
      // Icono segun tipo de archivo
      if (tipoArchivo.includes('image')) {
        icon = 'icon-image-ol';
      } else if (tipoArchivo.includes('pdf')) {
        icon = 'icon-pdf-doc-sl';
      } else if (tipoArchivo.includes('excel') || tipoArchivo.includes('spreadsheetml') || tipoArchivo.includes('word')) {
        icon = 'icon-doc-ol';
      } else { //otros
        icon = 'icon-link-ol';
      }
  
      if(this.FConfigurador.MENSAJE.length === 0) {
        this.FConfigurador.MENSAJE = [{
          USUARIO: this.USUARIO_LOCAL,
          ITEM: 1,
          ARCHIVO: larch,
          ID_ACTIVIDAD: tarea.ID_ACTIVIDAD,
          IMAGEN: '',
          icon: icon
        }];
      } else {
        const item = this.FConfigurador.MENSAJE.reduce((ant:any, act:any)=>{return (ant.ITEM > act.ITEM) ? ant : act});
        this.FConfigurador.MENSAJE.push({
          USUARIO: this.USUARIO_LOCAL,
          ITEM: item.ITEM + 1,
          ARCHIVO: larch,
          ID_ACTIVIDAD: tarea.ID_ACTIVIDAD,
          IMAGEN: '',
          icon: icon
        });
      }
      this.archivoDoc = larch;
      if (fileInput.target.files && file) {
        // Size Filter Bytes
        const max_size = 100000;
        const allowed_types = ['image/png', 'image/jpeg', 'image/jpeg', 'application/pdf'];
        const max_height = 15200;
        const max_width = 25600;
        this.tamArchivoImg = file.size;
        var fileType = '';
        const reader = new FileReader();
        reader.onload = (e: any) => {
          for (var s in signatures) {
            if (e.target.result.indexOf(s) !== 0) {
              var fileType = signatures[s];
              break;
            }
          }
          this.base64DataFile = e.target.result;
          const npos:any = this.FConfigurador.MENSAJE.findIndex((d:any) => d.ARCHIVO === larch)
          this.FConfigurador.MENSAJE[npos].IMAGEN = e.target.result;
          this.mostrarSubirArchivos = true;
          if (fileType.match('image')) {
            const image = new Image();
            image.src = e.target.result;
            image.onload = async (rs:any) => {
              const img_height = rs.currentTarget['height'];
              const img_width = rs.currentTarget['width'];
  
              if (img_height > max_height && img_width > max_width) {
                this.imageError =
                  'Máximas dimensiones permitidas: ' +
                  max_height +
                  '*' +
                  max_width +
                  'px';
                this.showModal(this.imageError, 'error');
                res = false;
              } else {
                // Guarda archivo en la url
                const ext = larch.substring(larch.lastIndexOf(".")+1);
                var imgBase64Path = e.target.result;
                res = true;
              }
            };
          }
        };
  
        if (this.imageError === '') reader.readAsDataURL(file);

        res = true;
      } else {
        res = false;
      }
    };
    return res;
  }

  validarCamposFechas(a:any, b:any) {
		var f1 = new Date(a);
		var f2 = new Date(b);
		let res: boolean = true;
		if (f1 > f2){
      showToast('Fecha inicial no puede ser mayor a la Fecha final, modifique la fecha final', 'error');
      res = false;
		}
		return res;
	}

  validarDatos() {
    let mensaje:any='';
		let propiedadesVacias:any = [];
		const propiedadesVerificar = ["ID_APLICACION", "NOMBRE", "USUARIO_ENV", "USUARIO_REC", "TIPO_NOTIFICADOR", "TIPO_MENSAJE", "MENSAJE"];

    if( (this.FConfigurador.ID_APLICACION !== '' && this.FConfigurador.ID_APLICACION !== null) &&
        (this.FConfigurador.NOMBRE !== '' && this.FConfigurador.NOMBRE !== null) && 
        (this.FConfigurador.USUARIO_ENV !== '' && this.FConfigurador.USUARIO_ENV !== null) &&
        (this.FConfigurador.USUARIO_REC.length > 0 && this.FConfigurador.USUARIO_REC !== null) &&
        (this.FConfigurador.TIPO_NOTIFICADOR !== '' && this.FConfigurador.TIPO_NOTIFICADOR !== null) &&
        (this.FConfigurador.TIPO_MENSAJE !== '' && this.FConfigurador.TIPO_MENSAJE !== null) &&
        (this.FConfigurador.MENSAJE !== '' && this.FConfigurador.MENSAJE !== null)
    ) {

      if( !this.FConfigurador.SIEMPRE ) {
        if( this.FConfigurador.FECHA_INICIO !== null && this.FConfigurador.FECHA_FIN !== '' ) {
          if( this.validarCamposFechas(this.FConfigurador.FECHA_INICIO, this.FConfigurador.FECHA_FIN) ) {
            if( this.FConfigurador.REPETIR ) {
              if( (this.FConfigurador.FRECUENCIA !== '' && this.FConfigurador.FRECUENCIA !== null) &&
                  (this.FConfigurador.INTERVALO_FRECUENCIA !== '' && this.FConfigurador.INTERVALO_FRECUENCIA !== null) &&
                  (this.FConfigurador.PERIODO_FRECUENCIA !== '' && this.FConfigurador.PERIODO_FRECUENCIA !== null)
              ) {
                return true;
              } else {
                showToast('Debe definir la Frecuencia, el Intervalo de Frecuencia y el periodo de la frecuencia.', 'error');
                return false;
              }
            } else {
              return true;
            }
          } else {
            showToast('Debe definir la Fecha', 'error');
            return false;
          }
        } else {
          showToast('Debe definir la Fecha', 'error');
          return false;
        }
      } else {
        return true;
      };
    } else {
      for (let key in this.FConfigurador) {
        if (propiedadesVerificar.includes(key) && !this.FConfigurador[key]) {
          propiedadesVacias.push(key);
        }
      }
      if (propiedadesVacias.length > 0)
        mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;
  
      showToast(mensaje, 'error');
      return false;
    };
	}

  valoresObjetos(obj:any, condicion:any) {
    if (obj === 'aplicaciones' || obj === 'todos'){
      this._sdatos.getAplicaciones('APLICACIONES', {}).subscribe((data: any)=> {
        const res = validatorRes(data);
        if(res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        };
        this.DGAplicacion = res;
      });
    };
    if (obj === 'usuarios' || obj === 'todos'){
      this._sdatos.getUsuarios('USUARIOS', {}).subscribe((data: any)=> {
        const res = validatorRes(data);
        if(res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        };
        var user_default:any = {ID_EMPLEADO: 'ONLINE', PRIMER_NOMBRE: 'USUARIO EN LINEA', NOMBRE_COMPLETO: 'USUARIO EN LINEA', ESTADO: 'ACTIVO', ErrMensaje: ''};;
        this.DGUsuarios = [user_default, ...res];
      });
    };
  }

  
  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte:any, archivo:any, datosrpt:any) {
		
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
