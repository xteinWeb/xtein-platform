import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxFormModule, DxListModule, DxLoadPanelModule, DxSelectBoxModule, DxTextBoxModule, DxValidatorModule } from 'devextreme-angular';
import { Subject, Subscription, lastValueFrom, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import Swal from 'sweetalert2';
import { showToast } from '../../shared/toast/toastComponent.js';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { ADM401Service } from 'src/app/services/ADM401/ADM401.service';
import { validatorRes } from 'src/app/shared/validator/validator';

@Component({
  selector: 'app-ADM401',
  templateUrl: './ADM401.component.html',
  styleUrls: ['./ADM401.component.css'],
  standalone: true,
  imports: [CommonModule, DxLoadPanelModule, DxFormModule,
            DxDropDownBoxModule, DxDataGridModule, DxTextBoxModule,
            DxSelectBoxModule, DxListModule, DxButtonModule, DxDataGridModule,
            DxValidatorModule
          ],
})
export class ADM401Component {

	@ViewChild ("gridFiltros", { static: false }) gridFiltros: DxDataGridComponent;

  
  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  
  prmUsrAplBarReg: clsBarraRegistro;
	mnuAccion: string = '';

  FConfigurador: any = {};
  DGAplicacion:any [] = [];
  DGUsuarios:any [] = [];

  selectAplicacion:any [] = [];
  selectAplicacionPadre:any [] = [];
  selectUsuarios:any [] = [];
  selectUsuariosFiltro:any [] = [];
  
  openAplicacion: boolean = false;
  openAplicacionPadre: boolean = false;
  openUsuarios: boolean = false;
  openUsuariosFiltro: boolean = false;
  loadingVisible: boolean = false;
  activeAplicacion: boolean = false;
  readOnlyAplicacionPadre: boolean = true;

  readOnly: boolean;
  QFiltro: any;
  data_prev: any;
  VDatosReg: any;
  conCambios: number = 0;
  USUARIO_LOCAL: any = '';
  esVisibleSelecc: string = '';
  accion:any = '';
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any [] = [];

  constructor(
    private SVisor: SvisorService,
    private _sfiltro: SfiltroService,
		private _sbarreg: SbarraService,
    private tabService: TabService,
    private _sdatos: ADM401Service
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
        // this.opIrARegistro('r_numreg');
      }
    })

  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.esVisibleSelecc = 'none';
    const user:any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
			tabla: 'CONFIG_CONSULTAS',
      aplicacion: 'ADM-401',
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
      ID_APLICACION_PADRE: '',
      USUARIOS: [],
      NOMBRE: '',
      FILTROS: [],
      ESTADO: ''
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
          tabla: 'CONFIG_CONSULTAS',
          aplicacion: 'ADM-401',
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
            this.readOnlyAplicacionPadre = true;
						this.mnuAccion = "";
            this.esVisibleSelecc = 'none';
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

  opPrepararModificar(): void {
		this.readOnly = false;
    this.data_prev = JSON.parse(JSON.stringify(this.FConfigurador));
    this.esVisibleSelecc = 'onClick'
	}

  onSeleccClase(e:any) {
    if( this.mnuAccion.match('new|update')) {
      if (e.value === 'APLICACION') {
        this.activeAplicacion = true;
        this.readOnlyAplicacionPadre = true;
      } else if (e.value === 'MULTIFUNCIONAL'){
        this.activeAplicacion = false;
        this.readOnlyAplicacionPadre = false;
        this.valoresObjetos('consecutivo', '');
      }
      this.FConfigurador.CLASE = e.value;
      this.conCambios += 1;
    } else {
      this.FConfigurador.CLASE = e.value;
    }
  }

  onSelectionAplicacion(e:any) {
    if( this.mnuAccion.match('new|update')) {
      this.FConfigurador.ID_APLICACION = e.selectedRowsData[0].ID_APLICACION;
      this.FConfigurador.NOMBRE = e.selectedRowsData[0].NOMBRE;
      this.FConfigurador.ID_APLICACION_PADRE = e.selectedRowsData[0].ID_APLICACION_PADRE;
      this.selectAplicacionPadre = [e.selectedRowsData[0].ID_APLICACION_PADRE];
      this.FConfigurador.AUTO_CONSECUTIVO = 'NULL';
      this.conCambios += 1;
      this.openAplicacion = false;
    } else {
      this.FConfigurador.ID_APLICACION = e.selectedRowsData[0].ID_APLICACION;
      this.FConfigurador.NOMBRE = e.selectedRowsData[0].NOMBRE;
      this.FConfigurador.ID_APLICACION_PADRE = e.selectedRowsData[0].ID_APLICACION_PADRE;
    }
  }

  onValueChangedCodigo(e:any) {
    if( this.mnuAccion.match('new|update')) {
      this.FConfigurador.ID_APLICACION = e.value;
      this.conCambios += 1;
    } else {
      this.FConfigurador.ID_APLICACION = e.value;
    }
  }

  onSelectionAplicacionPadre(e:any) {
    if( this.mnuAccion.match('new|update')) {
      this.FConfigurador.ID_APLICACION_PADRE = e.selectedRowKeys[0];
      this.openAplicacionPadre = false;
      this.conCambios += 1;
    } else {
      this.FConfigurador.ID_APLICACION_PADRE = e.selectedRowKeys[0];
      this.openAplicacionPadre = false;
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

  onValueChangedNombre(e:any) {
    if( this.mnuAccion.match('new|update')) {
      this.FConfigurador.NOMBRE = e.value;
      this.conCambios += 1;
    } else {
      this.FConfigurador.NOMBRE = e.value;
    }
  }

  aceptarCambios(e:any, tipo:any, data:any) {
    if( this.mnuAccion.match('new|update')) {
      if (tipo === 'USUARIOS ACCESO') {
        this.FConfigurador.USUARIOS = this.selectUsuarios;
        this.openUsuarios = false;
      }
      if (tipo === 'USUARIOS FILTRO') {
        this.gridFiltros.instance.cellValue(data.rowIndex, "USUARIOS", this.selectUsuariosFiltro);
        this.openUsuariosFiltro = false;
      }
      this.conCambios += 1;
    }
  }

  cancelarCambios(e:any, tipo:any) {
    this.openUsuarios = false;
    this.FConfigurador.USUARIOS = this.data_prev.USUARIOS;
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
		const prm = { CONFIGURACION: this.FConfigurador };
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

  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Configuraciones',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: ['ID_APLICACION_PADRE|Id Aplicacion','NOMBRE|Nombre','ESTADO|Estado'],
      Filtro: '',
      keyGrid: ['ITEM']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opPrepararBuscar(accion:any): void {
		if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para EL CONFIGURADOR",
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
      const prm = { CONFIG_CONSULTAS: arrFiltro };
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

  
  opPrepararNuevo(): void {
    this.data_prev = JSON.parse(JSON.stringify(this.FConfigurador));
    this.FConfigurador = {
      ID_APLICACION: '',
      NOMBRE: '',
      ID_APLICACION_PADRE: '',
      USUARIOS: [],
      FILTROS: [],
      ESTADO: 'ACTIVO'
    }
    this.selectAplicacion = [];
    this.selectAplicacionPadre = [];
    this.selectUsuarios= [];
    this.selectUsuariosFiltro = [];
	}

	opBlanquearForma(): void {
    this.FConfigurador = {
      ID_APLICACION: '',
      NOMBRE: '',
      ID_APLICACION_PADRE: '',
      USUARIOS: [],
      FILTROS: [],
      ESTADO: ''
    }
    this.selectAplicacion = [];
    this.selectAplicacionPadre = [];
    this.selectUsuarios= [];
    this.selectUsuariosFiltro = [];
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

    this.FConfigurador = newArray;
    this.selectAplicacion = newArray.ID_APLICACION;
    this.selectAplicacionPadre = newArray.ID_APLICACION_PADRE;
    this.selectUsuarios = newArray.USUARIOS;
    this.data_prev = JSON.parse(JSON.stringify(this.FConfigurador));
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
  }

  onInitNewRowPro(e:any) {
    e.data.NOMBRE = '';
		e.data.DESCRIPCION = '';
		e.data.CONDICION = '';
		e.data.USUARIOS = [];
		if (this.FConfigurador.FILTROS.length > 0) {
			const item = this.FConfigurador.FILTROS.reduce((ant:any, act:any)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
			e.data.ITEM = item.ITEM + 1;
		} else {
			e.data.ITEM = 1;
		}
    this.selectUsuariosFiltro = [];
	}

  selectionGrid(e:any) {
    if (!this.gridFiltros.instance.hasEditData()) {
      this.filasSelecc = e.selectedRowKeys;
		  if (this.filasSelecc.length > 0) {
        if (this.filasSelecc.length === 1) {
          this.filasSelecc = [e.component.getRowIndexByKey(e.selectedRowKeys[0])];
          this.rowEdit = true;
        } else {
          this.rowEdit = false;
        }
        this.rowDelete = true;
      } else {
        this.rowDelete = false;
        this.rowEdit = false;
			}
		} else {
			this.rowDelete = false;
      this.rowEdit = false;
		}
	}

  onRowInserting(e:any) {
		this.conCambios += 1;
		if (e.data !== undefined)
			this.rowApplyChanges = false;
	}

  onRowUpdating(e:any) {
		this.conCambios += 1;
		if (e.oldData === undefined)
			return;
	}

  onRowValidating(e: any) {
		let mensaje:any='';
		let propiedadesVacias:any = [];
		const propiedadesVerificar = ["ITEM", "NOMBRE", "DESCRIPCION", "CONDICION"];
    
		if ( this.accion === 'new' ) {
      if( ((e.newData.ITEM === '') || (e.newData.ITEM === null)) ||
          ((e.newData.NOMBRE === '') || (e.newData.NOMBRE === null)) ||
          ((e.newData.DESCRIPCION === '') || (e.newData.DESCRIPCION === null)) ||
          ((e.newData.CONDICION === '') || (e.newData.CONDICION === null)) ||
          ((e.newData.USUARIOS.length <= 0))
        ) {
        for (let key in e.newData) {
          if (propiedadesVerificar.includes(key) && !e.newData[key]) {
            propiedadesVacias.push(key);
          }
        }
        if (propiedadesVacias.length > 0)
          mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;
        else if (e.newData.USUARIOS.length <= 0)
          mensaje = 'Seleccione los usuarios con permisos para los filtros.';
  
        e.isValid = false;
        showToast(mensaje, 'error');
      } else {
        e.isValid = true;
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.rowDelete = false;
        this.accion = '';
        this.esVisibleSelecc = 'onClick';
      };

		};
		if ( this.accion === 'update' ) {
      for (let prop in e.newData) {
        if (e.newData.hasOwnProperty(prop) && e.oldData.hasOwnProperty(prop)) {
          e.oldData[prop] = e.newData[prop];
        }
      }

      if( ((e.oldData.ITEM === '') || (e.oldData.ITEM === null)) ||
          ((e.oldData.NOMBRE === '') || (e.oldData.NOMBRE === null)) ||
          ((e.oldData.DESCRIPCION === '') || (e.oldData.DESCRIPCION === null)) ||
          ((e.oldData.CONDICION === '') || (e.oldData.CONDICION === null)) ||
          ((e.oldData.USUARIOS.length <= 0))
        ) {

          for (let key in e.oldData) {
            if (propiedadesVerificar.includes(key) && !e.oldData[key]) {
              propiedadesVacias.push(key);
            }
          }
          if (propiedadesVacias.length > 0)
            mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;
          else if (e.newData.USUARIOS.length <= 0)
            mensaje = 'Seleccione los usuarios con permisos para los filtros.';

          e.isValid = false;
          showToast(mensaje, 'error');
      } else {
        e.oldData.readOnlyValor = true;
        e.isValid = true;
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.rowDelete = false;
        this.accion = '';
        this.esVisibleSelecc = 'onClick';
      };
			
		}
		return e.isValid;
	}

  onContentReady(e:any) {
		e.component.columnOption("command:edit", "visible", false);  
	}

  // Operaciones de grid
  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'new':
				this.gridFiltros.instance.clearSelection();
        this.gridFiltros.instance.addRow();
				this.accion = 'new';
        this.rowApplyChanges = true;
				this.rowNew = false;
				this.rowDelete = false;
				this.esVisibleSelecc = 'none';
        break;
      case 'edit':
        this.gridFiltros.instance.editRow(this.filasSelecc[0]);
        this.rowApplyChanges = true;
				this.rowNew = false;
				this.rowDelete = false;
        this.rowEdit = false;
				this.gridFiltros.instance.clearSelection();
				this.accion = 'update';
				this.esVisibleSelecc = 'none';
        break;
      case 'save':
				this.gridFiltros.instance.saveEditData();
        break;
      case 'cancel':
        this.gridFiltros.instance.cancelEditData();
				this.accion = '';
        this.rowApplyChanges = false;
        this.rowNew = true;
				if(this.filasSelecc.length > 0) {
          if (this.filasSelecc.length === 1)
            this.rowEdit = true;
          else
            this.rowEdit = false;
					this.rowDelete = true;
				} else {
					this.rowDelete = false;
				}
        this.esVisibleSelecc = 'onClick';
				this.accion = '';
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
            this.filasSelecc.forEach((key:any) => {
              const index = this.FConfigurador.FILTROS.findIndex((a:any) => a.ITEM === key);
              this.FConfigurador.FILTROS.splice(index, 1);
            });
            this.gridFiltros.instance.refresh();
						this.conCambios += 1;
						this.accion = '';
						this.rowApplyChanges = false;
						this.rowNew = true;
						if(this.filasSelecc.length > 0) {
              if (this.filasSelecc.length === 1)
                this.rowEdit = true;
              else
                this.rowEdit = false;
							this.rowDelete = true;
						} else {
							this.rowDelete = false;
						}
          }
        });
        break;

      default:
        break;
    }
  }

  opPrepararGuardar(accion: string): void {
    const prm = ({ CONFIGURACION: this.FConfigurador });
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
        this.readOnlyAplicacionPadre = true;

        // Operaciones de barra
        if (this.mnuAccion === 'new') {
          this.QFiltro = "CONFIGURACION='"+this.FConfigurador.NOMBRE+"'";
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
        this.mnuAccion = '';
        showToast('Registro actualizado', 'success');
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      }
    });
  }

  validarDatos() {
    let mensaje:any='';
		let propiedadesVacias:any = [];
		const propiedadesVerificar = ["ID_APLICACION", "ID_APLICACION_PADRE", "NOMBRE", "USUARIOS", "ESTADO"];

    if( (this.FConfigurador.ID_APLICACION !== '' && this.FConfigurador.ID_APLICACION !== null) && 
        (this.FConfigurador.ID_APLICACION_PADRE !== '' && this.FConfigurador.ID_APLICACION_PADRE !== null) &&
        (this.FConfigurador.NOMBRE !== '' && this.FConfigurador.NOMBRE !== null) && 
        (this.FConfigurador.ESTADO !== '' && this.FConfigurador.ESTADO !== null) &&
        (this.FConfigurador.USUARIOS.length > 0) &&
        (this.FConfigurador.FILTROS.length > 0)
    ) {
        return true;
    } else {
      for (let key in this.FConfigurador) {
        if (propiedadesVerificar.includes(key) && !this.FConfigurador[key]) {
          propiedadesVacias.push(key);
        }
      }
      if (propiedadesVacias.length > 0)
        mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;
      else if (this.FConfigurador.FILTROS.length <= 0)
        mensaje = 'Debe registrar los filtros en la Tabla.'
  
      showToast(mensaje, 'error');
      return false;
    };
	}

  valoresObjetos(obj:any, condicion:any) {
    if (obj === 'consecutivo') {
      const prm = {ID_APLICACION: this.prmUsrAplBarReg.aplicacion, CLASE: 'CONFIG_CONSULTA' };
      this._sdatos.getConsecutivo('CONSECUTIVO', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if (res.ErrMensaje !== '') {
          this.showModal(res.ErrMensaje, 'Error');
        } else {
          if(res.CONSECUTIVO !== 0) {
            this.FConfigurador.ID_APLICACION = res.VAR_CONSECUTIVO;
            this.FConfigurador.AUTO_CONSECUTIVO = res.CONSECUTIVO;
          } else {
            this.FConfigurador.ID_APLICACION = '';
            this.FConfigurador.AUTO_CONSECUTIVO = 'NULL';
          }
        }
      });
    }
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
        this.DGUsuarios = res;
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
