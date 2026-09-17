import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDiagramComponent, DxDiagramModule, DxDropDownBoxModule, DxFormModule, DxLoadPanelModule, DxPopupModule, DxSelectBoxModule, DxTextAreaModule, DxTextBoxModule, DxTreeListModule } from 'devextreme-angular';
import ArrayStore from 'devextreme/data/array_store';
import notify from 'devextreme/ui/notify';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { GES002Service } from 'src/app/services/GES002/GES002.service';
import { FlowEdge, FlowNode } from 'src/app/services/PRO011/interface';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import Swal from 'sweetalert2';
import { clsOrganigrama, clsRol } from './clsGES002.class';
import { DiagramCommand } from "devexpress-diagram";
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { MAreas } from '../GES005/clsGES005.class';
import { GES005Service } from 'src/app/services/GES005/s_GES005.service';
import { showToast } from '../../shared/toast/toastComponent.js'

@Component({
	selector: 'app-GES002',
	templateUrl: './GES002.component.html',
	styleUrls: ['./GES002.component.scss'],
	standalone: true,
	imports: [CommonModule, DxLoadPanelModule, DxFormModule, DxSelectBoxModule,
		DxDiagramModule, DxPopupModule, DxTextBoxModule, DxButtonModule,
		DxDataGridModule, DxDropDownBoxModule, DxTextAreaModule, DxTreeListModule
	]
})
export class GES002Component {

	@ViewChild("organigrama", { static: false }) diagOrgan: DxDiagramComponent;
	@ViewChild("gridFuncionesRol", { static: false }) gridFuncionesRol: DxDataGridComponent;
	@ViewChild("popupRol", { static: false }) popupRol: DxDataGridComponent;

	subscription: Subscription;
	subs_filtro: Subscription;
	unSubscribe: Subject<boolean> = new Subject<boolean>();
	prmUsrAplBarReg: clsBarraRegistro;
	mnuAccion: string;
	conCambios: number = 0;
	readOnly: boolean = true;
	diagReadOnly: boolean = true;
	loadingVisible: boolean = false;
	activeNuevoRol: boolean = false;
	VDatosReg: any;
	data_prev: any;
	isGridBoxOpened: boolean;
	dropDownOptions = { width: 600, 
		height: '75%', 
		hideOnParentScroll: true,
		container:'#formRol'
	};
	gridBoxCargos: any[] = [];
	shapeCargoAdd: any;
	NOMBRE_CARGO: string = '';
	RESPONSABLE: string = '';

	FOrganigrama: clsOrganigrama;
	FCargo: clsRol;
	DCargos: clsRol[] = [];
	FArea: MAreas;
	DAreas: MAreas[] = [];
	NodosSvg: any = [];
	LAreas: any[] = [];

	orgNodosDataSource: any;
	orgConecDataSource: any;
	itemCustomDataExpr: any;
	tipoAutoLayout: string = 'off';
	rolPopup: any;
	
	tituloRol: string = '';
	popupVisible: boolean = false;
	FrecuanciaRol: any;
	tittleBtnRol: string = 'Nuevo Rol';

	// Operaciones de grid
	rowNew: boolean = true;
	rowEdit: boolean = false;
	rowDelete: boolean = false;
	rowSave: boolean = false;
	rowApplyChanges: boolean = false;
	filasSelecc: any[] = [];
	seleccSeccArea: any[] = new Array();
	focusedRowKeyArea: string = '';
	isGridBoxOpenedArea: boolean;

	constructor(
		private _sdatos: GES002Service,
		private _sbarreg: SbarraService,
		private tabService: TabService,
		private _sfiltro: SfiltroService,
		private _sareas: GES005Service
	) {

		// Datos de la aplicación
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
			})
			  
		const flowNodes: FlowNode[] = [];
		const flowEdges: FlowEdge[] = [];
		this.orgNodosDataSource = new ArrayStore({
			key: "id",
			data: flowNodes,
		});
		this.orgConecDataSource = new ArrayStore({
			key: "id",
			data: flowEdges,
		});
		this.NodosSvg = [
			{ svg: "assets/svg/org-1.svg", id: "org-1" },
			{ svg: "assets/svg/org-2.svg", id: "org-2" },
			{ svg: "assets/svg/org-3.svg", id: "org-3" },
			{ svg: "assets/svg/org-4.svg", id: "org-4" },
			{ svg: "assets/svg/org-5.svg", id: "org-5" },
			{ svg: "assets/svg/org-6.svg", id: "org-6" },
			{ svg: "assets/svg/org-7.svg", id: "org-7" },
			{ svg: "assets/svg/org-8.svg", id: "org-8" },
			{ svg: "assets/svg/org-9.svg", id: "org-9" },
			{ svg: "assets/svg/org-10.svg", id: "org-10" },
			{ svg: "assets/svg/org-11.svg", id: "org-11" },
		  ];
	  
		this.onCustomCommand = this.onCustomCommand.bind(this);
		this.onItemDblClick = this.onItemDblClick.bind(this);
	  
	}

	autoSaveTimeout: any = -1;
	diagramCambios(e: any): any {
		return;
		// Valida si hubo cambios de un nodo
		if (
			this.diagReadOnly ||
			this.popupVisible ||
			this.readOnly || 
			this.orgNodosDataSource._array.length === 0
		)
			return;

		// ** Valida ADICIÓN ** //
		if (e.name === 'hasChanges') {
			this.popupVisible = true;
			// this.showPopup("Areas", "");
		}
		e.component.option("hasChanges", false);

	}
	requestEditOperationHandler(e: any) {

		if (e.operation === "addShape") {
		  // Invalidar copiar y pegar
		  if (e.args.shape) {
			e.allowed = false;
			this.popupVisible = true;
			this.shapeCargoAdd = e.args.shape;
		  }
		} 
	  }
	
	ngOnInit(): void {
		const user: any = localStorage.getItem('usuario');
		this.prmUsrAplBarReg = {
			tabla: 'ORGANIGRAMA',
			aplicacion: 'GES-002',
			usuario: user,
			accion: 'r_ini',
			error: '',
			r_numReg: 0,
			r_totReg: 0,
			operacion: { }
		};
		this.FOrganigrama = { ID_ORG: -1, NOMBRE: '', DESCRIPCION: '', ESTADO: '', DATOS_CARGOS: {} };
		this.FCargo = {
			ITEM: 0,
			ITEM_PADRE: 0,
			ID_CARGO: '',
			NOMBRE: '',
			DESCRIPCION: '',
			ESTADO: '',
			RESPONSABLE: '',
			FUNCIONES: []
		};
		this.FArea = {
			ID_UN: '',
			ITEM: 0,
			ID_AREA: '',
			ID_AREA_SUPERIOR: '',
			DESCRIPCION: '',
			ID_CARGO: '',
			ESTADO: '',
			RESPONSABLE: '',
			ID_UN_ITEM: '',
			TIPO: '',
			IsActive: false
		};
		this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
		this.valoresObjetos('cargos');
		this.valoresObjetos('areas');

	}

	ngAfterViewInit(): void {
		const x = setTimeout(() => {
			this.diagOrgan.instance.repaint();
		}, 400);
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
		this.subs_filtro.unsubscribe();
	}

	// Llama a Acciones de registro
	opMenuRegistro(operMenu: clsBarraRegistro): void {
		switch (operMenu.accion) {
			case "r_ini":
				const user: any = localStorage.getItem('usuario');
				this.prmUsrAplBarReg = {
					tabla: 'ORGANIGRAMA',
					aplicacion: 'GES-002',
					usuario: user,
					accion: 'r_ini',
					error: '',
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
				if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
				if (this._sfiltro.enConsulta === false) {
				  this.opPrepararBuscar('filtro');
				} else {
				  showToast('Consulta en proceso, por favor espere.', 'warning');
				}
				break;

			case 'r_buscar_ejec':
				this.opBlanquearForma();
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
				if (this.conCambios != 0) mensaje = 'Desea cancelar sin guardar cambios?';
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
						this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} }
						// Restituye los valores
						// this.GDCif = JSON.parse(JSON.stringify(this.GDCif_prev));
						this.mnuAccion = "";
						this.readOnly = true;
						this.conCambios = 0;
						this.diagReadOnly = true;
						this.prmUsrAplBarReg.accion = 'r_cancelar';
						this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: { } }
						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
						this.opIrARegistro('r_numreg');
					}
				});
				break;

			case 'r_refrescar':
				this.valoresObjetos('ref');
				break;

			case 'r_imprimir':
				this.imprimirReporte(operMenu.operacion.id_reporte, operMenu.operacion.archivo, operMenu.operacion.data_rpt);
				break;

			default:
				break;
		}
	}


	opPrepararNuevo(): void {
		this.readOnly = false;
		this.diagReadOnly = false;
		this.FOrganigrama = { ID_ORG: -1, NOMBRE: '', DESCRIPCION: '', ESTADO: 'ACTIVO', DATOS_CARGOS: {} };
		const flowNodes: FlowNode[] = [];
		const flowEdges: FlowEdge[] = [];
		this.orgNodosDataSource = new ArrayStore({
			key: "id",
			data: flowNodes,
		});
		this.orgConecDataSource = new ArrayStore({
			key: "id",
			data: flowEdges,
		});
	}
	opBlanquearForma(): void {
		this.FOrganigrama = { ID_ORG: -1, NOMBRE: '', DESCRIPCION: '', ESTADO: '', DATOS_CARGOS: {} };
		const flowNodes: FlowNode[] = [];
		const flowEdges: FlowEdge[] = [];
		this.orgNodosDataSource = new ArrayStore({
			key: "id",
			data: flowNodes,
		});
		this.orgConecDataSource = new ArrayStore({
			key: "id",
			data: flowEdges,
		});
	}
	opPrepararModificar(): void {
		this.readOnly = false;
		this.diagReadOnly = false;
		this.data_prev = { ENCABEZADO: JSON.parse(JSON.stringify(this.FOrganigrama)), ITEMS: '' };
	}
	opPrepararGuardar(accion: string): void {
		//verificar si hay cambios en los datos
		if (this.conCambios != 0) {
			var datosdiagrama = {
				ORGANIGRAMA: {
					NODOS: JSON.stringify(this.orgNodosDataSource._array),
					CONECTORES: JSON.stringify(this.orgConecDataSource._array)
				},
			};
			if (this.FOrganigrama.NOMBRE === '' || this.FOrganigrama.DESCRIPCION === '' || this.FOrganigrama.ESTADO === '') {
				this.showModal('Faltan datos basicos como nombre, descripción o estado!');
				return;
			}
			const prm = { ...this.FOrganigrama, ORGANIGRAMA: datosdiagrama.ORGANIGRAMA };
			this.loadingVisible = true;

			// API guardado de datos
			this._sdatos.saveGES002(accion, prm).subscribe((data) => {
				this.loadingVisible = false;
				const res = JSON.parse(data.data);
				if ((data.token != undefined)) {
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				if (res[0].ErrMensaje !== '' ) {
					this.showModal(res[0].ErrMensaje);
				} else {
					if (this.mnuAccion === 'new')
						this.prmUsrAplBarReg = {
						...this.prmUsrAplBarReg,
						error: "",
						accion: "r_navegar",
						r_numReg: 1,
						r_totReg: 1,
						operacion: {}
						};
					else
						this.prmUsrAplBarReg = {
						...this.prmUsrAplBarReg,
						error: "",
						accion: "r_navegar",
						operacion: {}
						};

					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
					this.readOnly = true;
					this.conCambios = 0;
					this.diagReadOnly = true;
					showToast('Registro actualizado', 'success');
				}
			});
		} else {
			this.loadingVisible = false;
			showToast('No hay cambios por guardar!', 'error');
		}

	}

	opPrepararBuscar(accion): void {
		if (accion === "filtro") {
		  this._sfiltro.PrmFiltro = {
			Titulo: "Datos de filtro para Organigrama",
			accion: "PREPARAR FILTRO",
			Filtro: "",
			TablaBase: this.prmUsrAplBarReg.tabla,
			aplicacion: this.prmUsrAplBarReg.aplicacion
		  };
		  this._sfiltro.getObsFiltro.emit(true);
		} else {
      this.loadingVisible = true;
		  this._sfiltro.enConsulta = true;

		  // Extrae la estructura del filtro
		  const prmDatosBuscar = JSON.parse(accion);
		  let arrFiltro = prmDatosBuscar.ESTRUCTURA;
		  const prm = { ORGANIGRAMA: arrFiltro };
		  this._sdatos
			.consulta('consulta', prm)
			.subscribe((data: any) => {
	
			  this._sfiltro.enConsulta = false;
			  const res = JSON.parse(data.data);
			  if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
			  }
			  const datares = res;
	
			  if (datares[0].ErrMensaje.includes('ADVERTENCIA')) {
				  this.showModal('',datares[0].ErrMensaje.replace('|','<br >'));
				  datares[0].ErrMensaje = '';
			  }
			  if (datares[0].ErrMensaje !== '') {
				  this.VDatosReg = [];
			  } else {
				  this.VDatosReg = datares === null ? [] : datares;
			  }
	
			  let diagorg = { NODOS: '[]', CONECTORES: '[]' }; 
			  if (this.VDatosReg.length > 0) {
          this.FOrganigrama = JSON.parse(JSON.stringify(this.VDatosReg[0]));
    
          // Selecciona las secciones asociadas
          try {
            diagorg = JSON.parse(this.VDatosReg[0].LAYOUT);
          } catch (error) {
            diagorg = { NODOS: '[]', CONECTORES: '[]' };
          }
			  } else {
          this.FOrganigrama = {
            ID_ORG: -1,
            NOMBRE: "",
            DESCRIPCION: "",
            ESTADO: "",
            DATOS_CARGOS: {}
          }
          diagorg = { NODOS: '[]', CONECTORES: '[]' };
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
			  if (this.VDatosReg.length > 0) {
				  this.opIrARegistro('r_primero');
			  }
			  this.loadingVisible = false;
			});
		}
	
		// this.readOnly = false;
	}
	
	
	opIrARegistro(accion: string): void {
		let diagOrgan = { NODOS: '[]', CONECTORES: '[]' }; 
		this.prmUsrAplBarReg.accion = 'r_numreg';
		switch (accion) {
			case 'r_primero':
				this.prmUsrAplBarReg.r_numReg = 1;
				this.FOrganigrama = JSON.parse(JSON.stringify(this.VDatosReg[0]));
				diagOrgan = JSON.parse(this.VDatosReg[0].LAYOUT);
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

			case 'r_anterior':
				this.prmUsrAplBarReg.r_numReg =
					this.prmUsrAplBarReg.r_numReg === 1
						? 1
						: this.prmUsrAplBarReg.r_numReg - 1;
				this.FOrganigrama = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
				diagOrgan = JSON.parse(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].LAYOUT);
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

			case 'r_siguiente':
				this.prmUsrAplBarReg.r_numReg =
					this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
						? this.VDatosReg.length
						: this.prmUsrAplBarReg.r_numReg + 1;
				this.FOrganigrama = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
				diagOrgan = JSON.parse(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].LAYOUT);
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

			case 'r_ultimo':
				this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
				this.FOrganigrama = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
				diagOrgan = JSON.parse(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].LAYOUT);
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

			case 'r_numreg':
				if (this.prmUsrAplBarReg.r_numReg !== 0) {
					this.FOrganigrama = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
					diagOrgan = JSON.parse(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].LAYOUT);
					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				} else {
					this.opBlanquearForma();
					diagOrgan = { NODOS: '[]', CONECTORES: '[]' };
				}
				// this.readOnly = false;
				break;

			case 'Eliminado':
				this.VDatosReg.splice(this.prmUsrAplBarReg.r_totReg - 1, 1);
				this.prmUsrAplBarReg.r_totReg--;
				if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
					this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
				}
				if (this.VDatosReg.length > 0) {
					this.FOrganigrama = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
					diagOrgan = JSON.parse(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].LAYOUT);
				} 
				else {
					this.opBlanquearForma();
				}
				break;

			default:
				break;
		}

		// Render diagrama
		const nodos: any = diagOrgan.NODOS;
		this.orgNodosDataSource = new ArrayStore({
			key: "id",
			data: nodos
		  });
		const conec: any = diagOrgan.CONECTORES;
		this.orgConecDataSource = new ArrayStore({
			key: "id",
			data: conec
		});

		// Trae secciones asociadas a la ruta
		this.tipoAutoLayout = 'off';
		// this.readOnly = false;
	}

	opEliminar(): void {
		// Confirma...
		Swal.fire({
		title: '',
		text: '',
		html: "¿Desea eliminar el organigrama <i>" +
				this.FOrganigrama.NOMBRE +
				" " +
				this.FOrganigrama.DESCRIPCION +
				"</i> ?",
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
		const prm = { ID_ORG: this.FOrganigrama.ID_ORG };
		this._sdatos
		.delete('delete', prm)
		.subscribe((data) => {
			const res = JSON.parse(data.data);
			try {
				if (res[0].ErrMensaje !== '') {
					this.showModal(res[0].ErrMensaje);
					return;
				}

				// Elimina y posiciona en el Array de Consulta
				this.opIrARegistro("Eliminado");
				showToast('Organigrama eliminado', 'success');
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
				this.showModal('Error al eliminar organigrama: '+error);
			}
		});
	}

	onItemDblClick(e: any) {
		this.popupVisible = true;
		// this.FCargo.NOMBRE = e.item.dataItem.text;
		// const datcar = this.orgNodosDataSource._array.find(c => c.id === e.item.dataItem.id);
		// this.FCargo.ITEM = datcar.ITEM;
		// this.FCargo.ID_CARGO = datcar.ID_CARGO;
		// this.FCargo.DESCRIPCION = datcar.text;
		// this.FCargo.ESTADO = datcar.ESTADO;
		// this.FCargo.RESPONSABLE = datcar.RESPONSABLE;

		this.FArea.DESCRIPCION = e.item.dataItem.text;
		const datcar = this.orgNodosDataSource._array.find(c => c.id === e.item.dataItem.id);
		this.FArea.ITEM = datcar.ITEM;
		this.FArea.ID_AREA = datcar.ID_AREA;
		this.FArea.DESCRIPCION = datcar.text;
		this.FArea.ID_CARGO = datcar.ID_CARGO;
		this.NOMBRE_CARGO = datcar.NOMBRE_CARGO;
		this.FArea.ESTADO = datcar.ESTADO;
		this.FArea.RESPONSABLE = datcar.RESPONSABLE;
        this.RESPONSABLE = "";
        for (var k=0; k < datcar.RESPONSABLES.length; k++) {
          this.RESPONSABLE += (this.RESPONSABLE != '' ? ', ' : '') + 
		  					  datcar.RESPONSABLES[k].ID_RESPONSABLE+'-'+datcar.RESPONSABLES[k].NOMBRE;
        }

	}

	onInitialized(e: any) {
		this.rolPopup = e.component;
	}
	onResizeEnd(e: any) {
		let popupHeight = Number(this.popupRol.instance.option("height"))?? 400;
		this.rolPopup.option("height",popupHeight-100);
	}

	onShown(e: any) {
		this.FArea.ID_AREA = '';
		this.FArea.DESCRIPCION = '';
		this.FArea.ID_CARGO = '';
		this.FArea.ESTADO = '';
		this.NOMBRE_CARGO = '';
		this.RESPONSABLE = '';
	}

	onValueChangedDescripcion(e: any) {
		this.FOrganigrama.NOMBRE = e.value;
		this.conCambios++;
	}

	onValueChangedNombre(e: any) {
		this.FOrganigrama.DESCRIPCION = e.value;
		this.conCambios++;
	}


	onSeleccEstado(e: any): void {
		this.FOrganigrama.ESTADO = e.value;
		this.conCambios++;
	}

	onSeleccFrecuencia(e: any, cellInfo: any): void {
		this.conCambios++;
	}

	onKeyDownCargo(e) {
		e.component.open();
	}
	onSelectionChangedCargos(e:any, dataResp:any) {
		if(e.selectedRowKeys.length === 0) {
		  this.gridBoxCargos = [];
		} else {
		  this.FCargo.ID_CARGO = e.selectedRowKeys[0];
		  const dat = this.DCargos.filter(r => r.ID_CARGO === this.FCargo.ID_CARGO);
		  if (dat) {
			this.FCargo.ITEM = dat[0].ITEM;
			this.FCargo.NOMBRE = dat[0].DESCRIPCION;
			this.FCargo.RESPONSABLE = dat[0].RESPONSABLE;
			this.FCargo.ESTADO = dat[0].ESTADO;
		  }
		  this.isGridBoxOpened = false;
		}
	  }
	
	onInitNewRowFunciones(e: any) {
		e.data.NOMBRE = '';
		e.data.DESCRIPCION = '';
		e.data.PERIODO = '';
		if (this.FCargo.FUNCIONES.length > 0) {
			const item = this.FCargo.FUNCIONES.reduce((ant: any, act: any) => {
				return (ant.ITEM > act.ITEM) ? ant : act
			});
			e.data.ITEM = item.ITEM + 1;
		}
		else {
			e.data.ITEM = 1;
		}
	}

	aceptarCambios(e: any) {
		this.popupVisible = false;
		if(this.FArea.ID_AREA !== '' && this.FArea.ID_AREA !== null) {
			let orgNodos = this.orgNodosDataSource._array;
			const elemNodo = {
				id: this.FArea.ITEM,
				text: this.FArea.DESCRIPCION,
				type: this.shapeCargoAdd.type, 
				x: this.shapeCargoAdd.position.x,
				y: this.shapeCargoAdd.position.y,
				width: this.shapeCargoAdd.size.width,
				height: this.shapeCargoAdd.size.height,
				ITEM: this.FArea.ITEM,
				ID_AREA: this.FArea.ID_AREA,
				ESTADO: this.FArea.ESTADO,
				ID_AREA_SUPERIOR: this.FArea.ID_AREA_SUPERIOR,
				ID_CARGO: this.FArea.ID_CARGO,
				NOMBRE_CARGO: this.NOMBRE_CARGO,
				RESPONSABLES: this.FArea.RESPONSABLE
			  };
			orgNodos = [...orgNodos, elemNodo];
			this.orgNodosDataSource = new ArrayStore({
				key: "id",
				data: orgNodos
			});
		} else {
			this.activeNuevoRol = false;
			this.tittleBtnRol = 'Nuevo Rol';
			this.FCargo = { ITEM: 0, ITEM_PADRE: 0, ID_CARGO: '', NOMBRE: '', DESCRIPCION: '', ESTADO: '', RESPONSABLE: '', FUNCIONES: [] }
		}
	}

	cancelarCambios(e: any) {
		this.popupVisible = false;
		this.activeNuevoRol = false;
		this.tittleBtnRol = 'Nuevo Rol';
		this.FCargo = { ITEM: 0, ITEM_PADRE: 0, ID_CARGO: '', NOMBRE: '', DESCRIPCION: '', ESTADO: '', RESPONSABLE: '', FUNCIONES: [] }
	}

	onCustomCommand(e: any) {
		if (e.name === 'areas') 
		{
			let nodDiag = this.orgNodosDataSource._array;
			if (nodDiag.length !== 0) {
				Swal.fire({
					title: '',
					text: 'Existe un organigrama ya generado. Desea reemplazarlo?',
					iconHtml: "<i class='icon-alert-ol'></i>",
					showCancelButton: true,
					confirmButtonColor: '#DF3E3E',
					cancelButtonColor: '#438ef1',
					cancelButtonText: 'No',
					confirmButtonText: 'Sí, reemplazar'
				}).then((result) => {
					if (result.isConfirmed) {
						this.valoresObjetos('generar areas');
						// e.component._executeDiagramCommand(DiagramCommand.AutoLayoutLayeredVertical);
					}
				});
			}
			else {
				this.valoresObjetos('generar areas');
				// e.component._executeDiagramCommand(DiagramCommand.AutoLayoutLayeredVertical);
			}
		}
		if (e.name === 'refrescar') {
			this.valoresObjetos('refrescar areas');
			// e.component._executeDiagramCommand(DiagramCommand.AutoLayoutLayeredVertical);
		}
	}
	onContentReady(e) {
		if (!e.component.__rtlLayout) {
			e.component.__rtlLayout = true;
			// e.component._executeDiagramCommand(DiagramCommand.AutoLayoutLayeredVertical);
		}
	}

	onSeleccRowSeccionArea(e:any, dataArea) {
		if( this.seleccSeccArea.length > 0 ) {
		  this.FArea.ID_AREA = this.seleccSeccArea[0];
		  const child = this.LAreas.filter(s => s.ID_AREA === this.FArea.ID_AREA);
		  if (child !== undefined && child.length !== 0) {
			this.FArea.DESCRIPCION = child[0].DESCRIPCION;
			this.FArea.ID_CARGO = child[0].ID_CARGO;
			this.FArea.ESTADO = child[0].ESTADO;
			this.FArea.ID_AREA_SUPERIOR = child[0].ID_AREA_SUPERIOR;
			this.FArea.RESPONSABLE = child[0].RESPONSABLES;
			this.NOMBRE_CARGO = child[0].NOMBRE_CARGO;
			this.RESPONSABLE = "";
			for (var k=0; k < child[0].RESPONSABLES.length; k++) {
			  this.RESPONSABLE += (this.RESPONSABLE != '' ? ', ' : '') + 
								  child[0].RESPONSABLES[k].ID_RESPONSABLE+'-'+child[0].RESPONSABLES[k].NOMBRE;
			}
		  }
		  else {
			this.FArea.DESCRIPCION = '';
			this.FArea.ID_CARGO = '';
			this.FArea.ESTADO = '';
			this.NOMBRE_CARGO = '';
			this.RESPONSABLE = '';
		  }
		  this.isGridBoxOpened = false;
		}
	  }

	  // Operaciones de grid
	operGrid(e, operacion) {
		switch (operacion) {
			case 'new':
				this.gridFuncionesRol.instance.addRow();
				this.rowApplyChanges = true;
				break;
			case 'edit':
				this.rowApplyChanges = true;
				this.rowEdit = false;
				break;
			case 'save':
				if (this.onRowValidating(e)) {
					this.gridFuncionesRol.instance.saveEditData();
					this.rowApplyChanges = false;
					this.rowNew = true;
				}
				break;
			case 'cancel':
				this.gridFuncionesRol.instance.cancelEditData();
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
							const index = this.FCargo.FUNCIONES.findIndex((a: any) => a.ITEM === key);
							this.FCargo.FUNCIONES.splice(index, 1);
						});
						this.gridFuncionesRol.instance.refresh();
						this.conCambios++;
					}
				});
				break;

			default:
				break;
		}
	}

	onRowValidating(e: any) {
		if (((e.newData.NOMBRE === '') || (e.newData.NOMBRE === null)) ||
			((e.newData.DESCRIPCION === '') || (e.newData.DESCRIPCION === null)) ||
			((e.newData.PERIODO === '') || (e.newData.PERIODO === null))
		) {
			e.isValid = false;
			showToast('Hay datos nulos, complete toda la información!', 'error');
			return false;
		} else {
			e.isValid = true;
			return true;
		};
	}

	// Cargue de datos de la aplicacion
	valoresObjetos(obj: string) {
		if (obj === 'activo' || obj === 'todos') {
			const prm = { DATOS: '' };
			this._sdatos.itemsGES002('ACTIVO', prm).subscribe((data: any) => {
				const res = JSON.parse(data.data);
				if ((data.token != undefined)) {
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				const mensaje = res[0].ErrMensaje;
				if (mensaje != '') {
					this.showModal(mensaje);
				}
				else {
					// this.GDCif = res;
					// this.GDCif_prev = res;					
				};
			},
				((err: any) => {
					this.showModal(err.message);
				})
			);
		};
		if (obj === 'frecuencia' || obj === 'todos') {
			const prm = { ID_DOMINIO: 'FUNCIONES ROL', ID_GRUPO_DOMINIO: 'TIPO FRECUENCIA' };
			this._sdatos.getfrecuenciaRoles('ITM_DOMINIOS', prm).subscribe((data: any) => {
				const res = JSON.parse(data.data);
				if ((data.token != undefined)) {
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				const mensaje = res[0].ErrMensaje;
				if (mensaje != '') {
					this.showModal(mensaje);
				}
				else {
					this.FrecuanciaRol = res;
				};
			},
				((err: any) => {
					this.showModal(err.message);
				})
			);
		};
		if (obj === 'generar cargos' || obj === 'todos') {
			const prm = { ID_ORGANIGRAMA: '' };
			this._sdatos.consulta('generar cargos', prm).subscribe((data: any) => {
				const res = JSON.parse(data.data);
				if ((data.token != undefined)) {
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				const mensaje = res[0].ErrMensaje;
				if (mensaje != '') {
					this.showModal(mensaje);
				}
				else {
					// this.itemCustomDataExpr = res[0].DATOS_CARGOS;
					const orgNodos = res[0].NODOS;
					this.orgNodosDataSource = new ArrayStore({
						key: "id",
						data: orgNodos
					});
					const orgConec = res[0].CONECTORES;
					this.orgConecDataSource = new ArrayStore({
						key: "id",
						data: orgConec
					});
					this.tipoAutoLayout = 'tree';
					setTimeout(() => {
						this.diagOrgan.instance.repaint();
						// this.tipoAutoLayout = 'off';
					}, 300);
					// this.diagOrgan.instance._refresh();
					};
			},
				((err: any) => {
					this.showModal(err.message);
				})
			);
		};
		if (obj === 'generar areas' || obj === 'todos') {
			this.loadingVisible = true;
			const prm = { ID_ORGANIGRAMA: '' };
			this._sdatos.consulta('generar areas', prm).subscribe((data: any) => {
				this.loadingVisible = false;
				const res = JSON.parse(data.data);
				if ((data.token != undefined)) {
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				const mensaje = res[0].ErrMensaje;
				if (mensaje != '') {
					this.showModal(mensaje);
				}
				else {
					// this.itemCustomDataExpr = res[0].DATOS_CARGOS;
					const orgNodos = res[0].NODOS;
					this.orgNodosDataSource = new ArrayStore({
						key: "id",
						data: orgNodos
					});
					const orgConec = res[0].CONECTORES;
					this.orgConecDataSource = new ArrayStore({
						key: "id",
						data: orgConec
					});
					this.tipoAutoLayout = 'tree';
					setTimeout(() => {
						// this.diagOrgan.instance.repaint();
						// this.tipoAutoLayout = 'off';
					}, 300);
					// this.diagOrgan.instance._refresh();
					};
			},
				((err: any) => {
					this.showModal(err.message);
				})
			);
		};
		if (obj === 'refrescar areas' || obj === 'todos') {
			this.loadingVisible = true;
			const prm = { ID_ORGANIGRAMA: '' };
			this._sdatos.consulta('generar areas', prm).subscribe((data: any) => {
				this.loadingVisible = false;
				const res = JSON.parse(data.data);
				if ((data.token != undefined)) {
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				const mensaje = res[0].ErrMensaje;
				if (mensaje != '') {
					this.showModal(mensaje);
				}
				else {
					// Toma los datos y los compara con el actual diagrama
					const orgNodos = JSON.parse(JSON.stringify(res[0].NODOS));
					const orgConec = JSON.parse(JSON.stringify(res[0].CONECTORES));
					let nodDiag = JSON.parse(JSON.stringify(this.orgNodosDataSource._array));
					let conDiag = JSON.parse(JSON.stringify(this.orgConecDataSource._array));
					orgNodos.forEach(orgnod => {
						
						// Obtiene el maximo id del nodo actual para re-asignar a los nuevos
						let maxId = Number(
							nodDiag.length !== 0 
								?  nodDiag.reduce((ant, act) => {
									return Number(ant.id) > Number(act.id) ? ant : act;
									}).id
								: 0
							);
						if (nodDiag.findIndex(n => n.ID_AREA == orgnod.ID_AREA) === -1) {
							const elemNodo = {
								id: maxId + 1,
								text: orgnod.text,
								type: orgnod.type, 
								x: 100,
								y: 100,
								width: 100,
								height: 60,
								ITEM: orgnod.ITEM,
								ID_AREA: orgnod.ID_AREA,
								ESTADO: orgnod.ESTADO,
								ID_AREA_SUPERIOR: orgnod.ID_AREA_SUPERIOR,
								ID_CARGO: orgnod.ID_CARGO,
								NOMBRE_CARGO: orgnod.NOMBRE_CARGO,
								RESPONSABLES: orgnod.RESPONSABLES
							  };
							  const apadre = nodDiag.find(n => n.ID_AREA == orgnod.ID_AREA_SUPERIOR)
							  if (apadre !== undefined) {
								const hijos = nodDiag.filter(n => n.ID_AREA_SUPERIOR == apadre.ID_AREA);
								if (hijos !== undefined) {
									const ult = hijos.length;
									if (ult !== 0) {
										elemNodo.x = Number(hijos[ult-1].x);
										elemNodo.y = Number(hijos[ult-1].y) + Number(hijos[ult-1].height) + 50;
									}
									else {
										elemNodo.x = Number(apadre.x) + Number(apadre.width) + 50;
										elemNodo.y = Number(apadre.y);
									}
								}
								else {
									elemNodo.x = Number(apadre.x) + Number(apadre.width) + 50;
									elemNodo.y = apadre.y;
								}
							  }
							  nodDiag = [...nodDiag, elemNodo];
						}
					});
					orgConec.forEach(conec => {
						const areafromId = nodDiag.find(n => n.ID_AREA === conec.ID_AREA_SUPERIOR).id;
						const areatoId = nodDiag.find(n => n.ID_AREA === conec.ID_AREA).id;
						// if (conDiag.findIndex(c => c.fromId == conec.fromId && c.toId == conec.toId) === -1) {
						if (conDiag.findIndex(c => c.fromId == areafromId && c.toId == areatoId) === -1) {
							const elemConec = {
								id: 'org_'+areatoId,  //conec.id,
								fromId: areafromId, //conec.fromId,
								toId: areatoId,  //conec.toId,
								conecStyle: conec.conecStyle,
								text: conec.text,
								tipoFlecha: conec.tipoFlecha
							}				
							conDiag = [...conDiag, elemConec];
						}
					});

					this.orgNodosDataSource = new ArrayStore({
						key: "id",
						data: nodDiag
					});
					this.orgConecDataSource = new ArrayStore({
						key: "id",
						data: conDiag
					});
					this.tipoAutoLayout = 'off';
					setTimeout(() => {
						// this.diagOrgan.instance.repaint();
						// this.tipoAutoLayout = 'off';
					}, 300);
					// this.diagOrgan.instance._refresh();
					};
			},
				((err: any) => {
					this.showModal(err.message);
				})
			);
		};
		if (obj === 'cargos' || obj === 'todos') {
			const prm = { DATOS: '' };
			this._sdatos.consulta('cargos', prm).subscribe((data: any) => {
				const res = JSON.parse(data.data);
				if ((data.token != undefined)) {
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				const mensaje = res[0].ErrMensaje;
				if (mensaje != '') {
					this.showModal(mensaje);
				}
				else {
					this.DCargos = res;
				};
			},
				((err: any) => {
					this.showModal(err.message);
				})
			);
		};

		if (obj === 'areas' || obj === 'todos') {
			const prm = { FILTRO: '' };
			this._sareas.consulta('areas cargos responsables', prm, 'GES005').subscribe((data: any) => {
				const res = JSON.parse(data.data);
				if ((data.token != undefined)) {
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				const mensaje = res[0].ErrMensaje;
				if (mensaje != '') {
					this.showModal(mensaje);
				}
				else {
					this.LAreas = res;
				};
			},
				((err: any) => {
					this.showModal(err.message);
				})
			);
		};

	}


	// Imprimir reporte de aplicación
	imprimirReporte(id_reporte: any, archivo: any, datosrpt: any) {

		let filtroRep = { FILTRO: '' };
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

	showModal(mensaje: any, html ='') {
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
			confirmButtonColor: '#0F4C81',
			title: '¡Error!',
			text: mensaje,
			allowOutsideClick: true,
			allowEscapeKey: false,
			allowEnterKey: false,
			backdrop: true,
			html,
			position: 'center',
			stopKeydownPropagation: false,
		});
	}

	showToast(message: any, type: any, offset: any) {
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
			type, 4500);
	}



}
