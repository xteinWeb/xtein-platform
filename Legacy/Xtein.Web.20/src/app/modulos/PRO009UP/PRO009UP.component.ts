import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import Swal from 'sweetalert2';
import { lastValueFrom, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { PRO009Service } from 'src/app/services/PRO009/s_PRO009.service';
import { clsBarraRegistro } from '../../containers/regbarra/_clsBarraReg';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLoadPanelModule, DxSelectBoxModule, DxTextBoxModule, getElement } from 'devextreme-angular';
import { ThisReceiver } from '@angular/compiler';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { MEmpleados } from '../PRO009/clsPRO009.class';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import notify from 'devextreme/ui/notify';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { BarraimgComponent } from 'src/app/shared/barraimg/barraimg.component';
import { CommonModule } from '@angular/common';
import { showToast } from '../../shared/toast/toastComponent.js';

@Component({
	selector: 'PRO009UP.component',
	templateUrl: './PRO009UP.component.html',
	styleUrls: ['./PRO009UP.component.css'],
	standalone: true,
	imports: [CommonModule, DxFormModule, DxTextBoxModule, DxDropDownBoxModule, DxDataGridModule,
		DxSelectBoxModule, DxButtonModule, DxLoadPanelModule, VistarapidaComponent, BarraimgComponent
	]
})
export class PRO009UPComponent implements OnInit {

	@ViewChild("formEmpleados", { static: false }) formEmp: DxFormComponent;
	@ViewChild("dataGridTurnos", { static: false }) dataGridTurnos: DxDataGridComponent;
	@ViewChild("DSecciones", { static: false }) DSecciones: DxDataGridComponent;

	subscription: Subscription;
	subscriptionDet: Subscription;

	subs_filtro: Subscription;
	subs_visor: Subscription;
	unSubscribe: Subject<boolean> = new Subject<boolean>();
	eventsBarraImg: Subject<any> = new Subject<any>();
	colCountByScreen: object;

	prmUsrAplBarReg: clsBarraRegistro;
	mnuAccion: string;
	VDatosReg: any;
	readOnly: boolean;
	openDrop: boolean = false;
	openSeccion: boolean = false;
	esVisibleSelecc: string = 'none';
	esVisibleSeleccTurnos: string = 'none';
	filaDatosEdit: any;
	modoImagen: boolean = false;
	desdeGuardado: boolean = false;

	toaVisible: boolean = false;
	toaTipo = 'info'
	toaMessage = 'Registro actualizado!';
	loadingVisible: boolean = false;
	item: any = '';
	srcFotoEmp: any = '../../../assets/img/fotoEmpleadoCargando.svg';
	visible: boolean = false;
	isEdit: boolean = false;
	esEdicionFila: boolean = false;
	conCambios: number = 0;
	DESCRIPCION: any;
	DGTurnos: any[] = [];
	DTurnos: any[] = [];
	selectTurnos: any = [];
	openTurnos: boolean = false;
	selectTurno: any = [];
	openIdHorarios: boolean = false;

	DEmpleados: any = [];
	FEmpleados: MEmpleados;
	DSeccion: any = [];
	DGEmpleados: any = [];
	DatosEnv: any = [];
	selectEmpleado: any[] = [];
	selectSeccion: any = [];
	newArray: any = [];
	arraySeccion: any = [];
	DESSeccion: any = [];
	arrayEmpleados: any = [];
	DGSecciones: any = [];
	selectDataTurnos: any = [];
	data_prev: any;
	seleccDelete: boolean[] = [false];
	altoFilaDatos: string[] = ["10px"];
	modoSeleccDelete: boolean = false;

	QFiltro: any;
	// Operaciones de grid
	rowNewTurnos: boolean = true;
	rowEditTurnos: boolean = false;
	rowDeleteTurnos: boolean = false;
	rowSaveTurnos: boolean = false;
	rowApplyChangesTurnos: boolean = false;

	rowNew: boolean = true;
	rowEdit: boolean = false;
	rowDelete: boolean = false;
	rowSave: boolean = false;
	rowApplyChanges: boolean = false;
	filasSelecc: any[] = [];
	acciongrid: string = '';

	constructor(
		private sData: PRO009Service,
		private _sbarreg: SbarraService,
		private SVisor: SvisorService,
		private tabService: TabService,
		private _sfiltro: SfiltroService,
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
			const nx = this.VDatosReg.findIndex(d => d.ID_EMPLEADO === resp.ID_EMPLEADO);
			if (nx !== 0) {
				this.prmUsrAplBarReg.r_numReg = nx + 1;
				this.opIrARegistro('r_numreg');
			}
		})

		this.colCountByScreen = {
			xs: 1,
			sm: 2,
			md: 2,
			lg: 2,
		};

		this.imagenClick = this.imagenClick.bind(this);
		this.operArcImg = this.operArcImg.bind(this);
	}

	ngOnInit(): void {
		const user: any = localStorage.getItem('usuario');
		this.prmUsrAplBarReg = {
			tabla: 'ITM_EMPLEADOS_SECCIONES',
			aplicacion: 'PRO-009',
			usuario: user,
			accion: 'r_ini',
			error: '',
			r_numReg: 0,
			r_totReg: 0,
			operacion: { r_modificar: true }
		};
		this.FEmpleados = { ID_EMPLEADO: '', NOMBRE_COMPLETO: '', ESTADO: '', ID_HORARIO: '' };
		this.readOnly = true;
		this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
		// this.getEmpleados();
		this.valoresObjetos('todos');
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
		this.subs_filtro.unsubscribe();
		this.subs_visor.unsubscribe();
	}

	onContentReady(e: any) {
		e.component.columnOption("command:edit", "visible", false);
	}

	getSizeQualifier(width: any) {
		if (width < 768) return "xs";
		if (width < 992) return "sm";
		if (width < 1366) return "md";
		return "lg";
	}

	// Llama a Acciones de registro
	opMenuRegistro(operMenu: clsBarraRegistro): void {
		switch (operMenu.accion) {
			case "r_ini":
				const user: any = localStorage.getItem('usuario');
				this.prmUsrAplBarReg = {
					tabla: 'ITM_EMPLEADOS_SECCIONES',
					aplicacion: 'PRO-009',
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
						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
						this.eventsBarraImg.next({ accion: 'inactivar', docElem: document, target: 'fotoEmpleado' });
						this.esVisibleSelecc = 'none';
						this.srcFotoEmp = '../../../assets/img/fotoEmpleadoCargando.svg';
						this.readOnly = true;
						this.conCambios = 0;
						this.mnuAccion = "";
						// Restituye los valores
						if (this.VDatosReg ?? '' !== '')
							this.opIrARegistro('r_numreg');
						else
							this.opBlanquearForma();
					}
				});
				break;

			case "r_vista":
				this.opVista('vista');
				break;

			case 'r_refrescar':
				this.valoresObjetos('todos');
				break;

			case 'r_imprimir':
				this.imprimirReporte(operMenu.operacion.id_reporte, operMenu.operacion.archivo, operMenu.operacion.data_rpt);
				break;

			case 'r_configurar':
				if (this.VDatosReg != undefined) {
					this.getEmpleadosSinSeccion();
				} else {
					showToast('Consulte listado de empleados', 'error');
				}
				break;


			default:
				break;
		}
	}

	// Operaciones de grid
	operGrid(e: any, operacion: any, tipo: any) {
		switch (operacion) {
			case 'new':
				if (this.selectEmpleado.length !== 0) {
					this.DSecciones.instance.addRow();
					this.rowApplyChanges = true;
					this.rowNew = false;
					this.esVisibleSelecc = 'none';
					this.isEdit = true;
					this.acciongrid = operacion;
				} else {
					this.rowApplyChanges = false;
					this.rowNew = true;
					this.isEdit = false;
					showToast('Seleccione empleado', 'error');
				}
				break;
			case 'edit':
				const key: any = this.DSecciones.instance.getRowIndexByKey(this.selectSeccion[0]);
				this.DSecciones.instance.editRow(key);
				this.rowApplyChanges = true;
				this.rowEdit = false;
				this.rowNew = false;
				this.rowDelete = false;
				this.isEdit = true;
				this.esVisibleSelecc = 'none';
				this.acciongrid = operacion;
				break;
			case 'save':
				this.DSecciones.instance.saveEditData();
				break;
			case 'cancel':
				this.DSecciones.instance.cancelEditData();
				this.esVisibleSelecc = 'onClick';
				this.rowApplyChanges = false;
				this.rowNew = true;
				this.isEdit = false;
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
						this.filasSelecc.forEach((key: any) => {
							const index = this.DGSecciones.findIndex((a: any) => a.ITEM === key);
							this.DGSecciones.splice(index, 1);
						});
						this.DSecciones.instance.refresh();
						this.conCambios++;
						this.acciongrid = '';
					}
				});
				break;

			default:
				break;
		}
	}

	getEmpleadosSinSeccion(): void {
		const prm = {};
		this.sData.getEmpleadosSinSeccion('EMPLEADOS SIN SECCION', prm).subscribe((data: any) => {

			const res = JSON.parse(data.data);
			if ((data.token != undefined)) {
				const refreshToken = data.token;
				localStorage.setItem("token", refreshToken);
			}
			const newArray = res;
			const mensaje = newArray[0].ErrMensaje;
			if (mensaje != '') {
				this.showModal(mensaje);
			}
			else {
				this.DESSeccion = newArray;
				this.opVista('sin seccion');
			};
		},
			(err => {
				this.showModal(err.message);
			})
		);
	}

	// Vista/Zoom de los datos consultados
	opVista(e: any): void {
		let Titulo: any;
		if (e === 'sin seccion') {
			this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.DESSeccion));
			Titulo = 'Empleados sin secciones asociadas';
		} else {
			this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
			Titulo = 'Empleados';
		}
		this.SVisor.PrmVisor = {
			aplicacion: this.prmUsrAplBarReg.aplicacion,
			Titulo: Titulo,
			accion: '',
			opciones: '|',
			Grupo: [],
			cols: ['ID_EMPLEADO|Id Empleado', 'NOMBRE_COMPLETO|Nombre', 'ESTADO|Estado'],
			Filtro: '',
			keyGrid: ['ID_EMPLEADO']
		};
		this.SVisor.setObs_Visor({ accion: 'abrir' });
	}

	onRowInserting(e: any, tipo: string) {
		e;
	}

	onRowValidatingSecciones(e: any, tipo: string) {
		let mensaje: any = '';
		let propiedadesVacias: any = [];
		const propiedadesVerificar = ["ID_SECCION", "DESCRIPCION", "TIPO", "ID_ACTIVIDAD"];

		if (this.acciongrid === 'new') {
			if (((e.newData.ID_SECCION === '') || (e.newData.ID_SECCION === null)) ||
				((e.newData.DESCRIPCION === '') || (e.newData.DESCRIPCION === null)) ||
				((e.newData.TIPO === '') || (e.newData.TIPO === null)) ||
				((e.newData.ID_ACTIVIDAD === '') || (e.newData.ID_ACTIVIDAD === null))
			) {
				e.isValid = false;
				this.isEdit = true;
				this.rowApplyChanges = true;
				this.rowNew = false;
				this.rowEdit = false;
				this.esVisibleSelecc = 'none';
				showToast('Hay datos nulos, complete toda la información de la sección', 'error');
			} else {
				e.isValid = true;
				this.isEdit = false;
				this.rowApplyChanges = false;
				this.rowDelete = false
				this.rowNew = true;
				this.rowEdit = false;
				this.esVisibleSelecc = 'allways';
				this.acciongrid = '';
				if (this.desdeGuardado) {
					setTimeout(() => {
						this.opPrepararGuardar(this.mnuAccion);
					}, 2000);
				}
			};

		} else if (this.acciongrid === 'edit') {
			for (let prop in e.newData) {
				if (e.newData.hasOwnProperty(prop) && e.oldData.hasOwnProperty(prop)) {
					e.oldData[prop] = e.newData[prop];
				}
			}
			if (((e.oldData.ID_SECCION === '') || (e.oldData.ID_SECCION === null)) ||
				((e.oldData.DESCRIPCION === '') || (e.oldData.DESCRIPCION === null)) ||
				((e.oldData.TIPO === '') || (e.oldData.TIPO === null)) ||
				((e.oldData.ID_ACTIVIDAD === '') || (e.oldData.ID_ACTIVIDAD === null))
			) {
				for (let key in e.oldData) {
					if (propiedadesVerificar.includes(key) && !e.oldData[key]) {
						propiedadesVacias.push(key);
					}
				}
				if (propiedadesVacias.length > 0)
					mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;

				e.isValid = false;
				this.isEdit = true;
				this.rowApplyChanges = true;
				this.rowNew = false;
				this.rowEdit = false;
				this.esVisibleSelecc = 'none';
				showToast(mensaje, 'error');
			} else {
				e.isValid = true;
				this.isEdit = false;
				this.rowApplyChanges = false;
				this.rowDelete = false
				this.rowNew = true;
				this.rowEdit = false;
				this.esVisibleSelecc = 'allways';
				this.acciongrid = '';
				if (this.desdeGuardado) {
					setTimeout(() => {
						this.opPrepararGuardar(this.mnuAccion);
					}, 2000);
				}
			};

		}
	}

	onRowPrepared(e: any, tipo: string) {
		if (e.rowType === "data") {
			if (e.data.isEdit)
				// e.rowElement.style.backgroundColor = 'lightyellow';
				e.rowElement.className = 'row-modified-focused';
		}
	}

	selectionGrid(e: any, tipo: string) {
		if (!this.isEdit) {
			if (tipo === 'TURNOS') {
				this.selectDataTurnos = e.selectedRowKeys;
				if (this.selectDataTurnos.length !== 0)
					this.rowDeleteTurnos = true;
				else
					this.rowDeleteTurnos = false;
			};
			if (tipo === 'SECCIONES') {
				this.filasSelecc = e.selectedRowKeys;
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
			};
		}
	}

	opPrepararNuevo(): void {
		this.esVisibleSelecc = 'onClick';
		this.eventsBarraImg.next({ accion: 'activar', docElem: document, target: 'fotoEmpleado', active: [true, true, false] });
		this.opBlanquearForma();
	}

	opBlanquearForma(): void {
		this.FEmpleados = {
			ID_EMPLEADO: '',
			NOMBRE_COMPLETO: '',
			ESTADO: '',
			ID_HORARIO: ''
		};
		this.selectEmpleado = [];
		this.selectSeccion = [];
		this.DGSecciones = [];
		this.srcFotoEmp = '../../../assets/img/fotoEmpleadoCargando.svg';
	}

	opEliminar(): void {
		// Confirma...
		Swal.fire({
			title: '',
			text: '',
			html: "¿Desea eliminar el Empleado <i>" +
				this.FEmpleados.ID_EMPLEADO +
				" " +
				this.FEmpleados.NOMBRE_COMPLETO +
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
		const dataEmpleado = { ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO };
		const prm = { EMPLEADO: dataEmpleado };
		this.sData
			.delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
			.subscribe((data) => {
				const res = JSON.parse(data.data);
				if ((data.token != undefined)) {
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
				showToast('Empleado eliminado', 'success');

				// Operaciones de barra
				this.prmUsrAplBarReg.r_totReg--;
				this.prmUsrAplBarReg = {
					...this.prmUsrAplBarReg,
					error: "",
					accion: 'r_navegar',
					operacion: {}
				};
				this.opBlanquearForma();
				this.prmUsrAplBarReg.accion = 'r_cancelar';
				this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} }
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
			});
	}

	opPrepararModificar(): void {
		if (this.FEmpleados.ESTADO === 'ACTIVO') {
			this.visible = true;
			this.readOnly = false;
			this.esVisibleSelecc = 'onClick';
			if (this.DGSecciones === null) {
				this.DGSecciones = [];
			}
			// Valores previos
			this.data_prev = JSON.parse(JSON.stringify(this.FEmpleados));
			this.data_prev.SECCIONES = JSON.parse(JSON.stringify(this.DGSecciones));
			this.eventsBarraImg.next({ accion: 'activar', docElem: document, target: 'fotoEmpleado', active: [true, true, false] });
		} else {
			this.prmUsrAplBarReg.accion = 'r_cancelar';
			this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} }
			this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
			showToast('No puede asociar un turno o secciones, si el empleado esta INACTIVO.', 'error');
		}
	}

	opPrepararGuardar(accion: string): void {
		if (this.conCambios != 0) {
			if (this.isEdit) {
				this.desdeGuardado = true;
				return;
			} else {
				this.desdeGuardado = false;
				if (this.srcFotoEmp === '../../../assets/img/fotoEmpleadoCargando.svg')
					this.srcFotoEmp = '';
				if ((this.FEmpleados.ID_HORARIO === undefined) || (this.FEmpleados.ID_HORARIO === null))
					this.FEmpleados.ID_HORARIO = '';

				const empleado = ({ ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO, FOTO: this.srcFotoEmp });
				const prm = ({
					EMPLEADO: empleado,
					SECCIONES: this.DGSecciones,
					TURNO: this.FEmpleados.ID_HORARIO
				});
				this.loadingVisible = true;
				// API guardado de datos
				this.sData.savePRO009(accion, prm).subscribe((data) => {
					this.loadingVisible = false;
					const res = JSON.parse(data.data);
					if ((data.token != undefined)) {
						const refreshToken = data.token;
						localStorage.setItem("token", refreshToken);
					}
					if (res[0].ErrMensaje !== '' && res[0].ErrMensaje !== 'VALIDO') {
						this.prmUsrAplBarReg.error = 'Error';
						this.prmUsrAplBarReg.accion = 'r_guardar';
						this.esVisibleSelecc = 'onClick';
						this.showModal(res[0].ErrMensaje);
					} else {
						this.readOnly = true;

						// Operaciones de barra
						if (this.mnuAccion === 'new') {
							this.QFiltro = "EMPLEADO='" + this.FEmpleados.ID_EMPLEADO + "'";
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
						this.esVisibleSelecc = 'none';
						showToast('Registro actualizado', 'success');
						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
						const npos = this.VDatosReg.findIndex((d: any) => d.ID_EMPLEADO === empleado.ID_EMPLEADO);
						if (this.srcFotoEmp === '')
							this.srcFotoEmp = '../../../assets/img/fotoEmpleadoCargando.svg';

						this.VDatosReg[npos].FOTO = this.srcFotoEmp;
						this.VDatosReg[npos].ESTADO = this.FEmpleados.ESTADO;
						this.VDatosReg[npos].SECCIONES = this.DGSecciones;
						const turno: any = this.DTurnos.filter((d: any) => d.ID_HORARIO === this.selectTurno[0]);
						if (turno !== undefined && turno !== null && turno !== '')
							this.VDatosReg[npos].TURNOS = turno;
						else
							this.VDatosReg[npos].TURNOS = [];
						this.DSecciones.instance.refresh();
						this.eventsBarraImg.next({ accion: 'inactivar', docElem: document, target: 'fotoEmpleado' });
					}
				});
				if (this.VDatosReg.length === 0)
					this.srcFotoEmp = '../../../assets/img/fotoEmpleadoCargando.svg';
			};
		} else {
			showToast('No hay cambios por guardar', 'error');
			this.eventsBarraImg.next({ accion: 'inactivar', docElem: document, target: 'fotoEmpleado' });
			this.esVisibleSelecc = 'always';
		}
	}

	opPrepararBuscar(accion): void {
		if (accion === "filtro") {
			this._sfiltro.PrmFiltro = {
				Titulo: "Datos de filtro para Empleados",
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
			const prm = { RS_EMPLEADOS_ID: arrFiltro };

			// Ejecuta búsqueda API
			this.loadingVisible = true;
			this.sData
				.consulta_filtro('consulta', prm, this.prmUsrAplBarReg.aplicacion)
				.subscribe((data: any) => {
					try {
						const res = JSON.parse(data.data);
						this._sfiltro.enConsulta = false;
						if ((data.token != undefined)) {
							const refreshToken = data.token;
							localStorage.setItem("token", refreshToken);
						}
						const datares = res;
						if (datares[0].ErrMensaje === '') {
							// Asocia datos
							if (datares ?? '' != '') {
								this.VDatosReg = datares;
								this.FEmpleados.ID_EMPLEADO = datares[0].ID_EMPLEADO;
								this.FEmpleados.NOMBRE_COMPLETO = datares[0].NOMBRE_COMPLETO;
								this.FEmpleados.ESTADO = datares[0].ESTADO;
								this.QFiltro = datares[0].QFILTRO;
							}
						} else {
							this.VDatosReg = [];
							this.loadingVisible = false;
							//notificación
							showToast(datares[0].ErrMensaje, 'warning');
							return;
						}
						// Prepara la barra para navegación
						this.prmUsrAplBarReg = {
							...this.prmUsrAplBarReg,
							r_totReg: datares.length,
							r_numReg: 1,
							accion: 'r_navegar',
							operacion: {}
						}
						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
						this.eventsBarraImg.next({ accion: 'activar', docElem: document, target: 'fotoEmpleado', active: [true, true, false] });

						// Trae los items en los componentes asociados
						this.opIrARegistro('r_primero');
						this.loadingVisible = false;
						this.readOnly = true;
					} catch (error) {
						this.loadingVisible = false;
						this.readOnly = true;
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
				if (this.VDatosReg.length != 0) {
					this.FEmpleados = JSON.parse(JSON.stringify(this.VDatosReg[0]));
				}
				if (this.FEmpleados.ESTADO === 'INACTIVO') {
					this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: false, r_eliminar: false } };
					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				} else {
					this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: true, r_eliminar: true } };
					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				}
				break;

			case "r_anterior":
				this.prmUsrAplBarReg.r_numReg =
					this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
				this.FEmpleados = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
				if (this.FEmpleados.ESTADO === 'INACTIVO') {
					this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: false, r_eliminar: false } };
					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				} else {
					this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: true, r_eliminar: true } };
					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				}
				break;

			case "r_siguiente":
				this.prmUsrAplBarReg.r_numReg =
					this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
						? this.VDatosReg.length
						: this.prmUsrAplBarReg.r_numReg + 1;
				this.FEmpleados = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
				if (this.FEmpleados.ESTADO === 'INACTIVO') {
					this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: false, r_eliminar: false } };
					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				} else {
					this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: true, r_eliminar: true } };
					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				}
				break;

			case "r_ultimo":
				this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
				this.FEmpleados = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
				if (this.FEmpleados.ESTADO === 'INACTIVO') {
					this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: false, r_eliminar: false } };
					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				} else {
					this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: true, r_eliminar: true } };
					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				}
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
					this.FEmpleados = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
					if (this.FEmpleados.ESTADO === 'INACTIVO') {
						this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: false, r_eliminar: false } };
						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
					} else {
						this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: { r_modificar: true, r_eliminar: true } };
						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
					}

				}
				this.readOnly = true;
				break;

			case "Eliminado":
				this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
				if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
					this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
				}
				if (this.VDatosReg.length >= 0) {
					this.FEmpleados =
						this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
				}
				this.opBlanquearForma();
				break;

			default:
				break;
		}

		const idEMPLEADO = this.VDatosReg.filter((d: any) => d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO);
		this.selectEmpleado = idEMPLEADO[0].ID_EMPLEADO;
		if (idEMPLEADO[0].TURNOS !== null && idEMPLEADO[0].TURNOS !== undefined && idEMPLEADO[0].TURNOS !== '' && idEMPLEADO[0].TURNOS.length > 0) {
			this.selectTurno = JSON.parse(JSON.stringify([idEMPLEADO[0].TURNOS[0].ID_HORARIO]));
			this.FEmpleados.ID_HORARIO = this.selectTurno[0];
		} else {
			this.selectTurno = [];
			this.FEmpleados.ID_HORARIO = '';
		}
		if ((idEMPLEADO[0].SECCIONES !== null) && (idEMPLEADO[0].SECCIONES !== undefined) && (idEMPLEADO[0].SECCIONES !== ''))
			this.DGSecciones = JSON.parse(JSON.stringify(idEMPLEADO[0].SECCIONES));
		else
			this.DGSecciones = [];
		if ((idEMPLEADO[0].TURNOS !== null) && (idEMPLEADO[0].TURNOS !== undefined) && (idEMPLEADO[0].TURNOS !== ''))
			this.DGTurnos = JSON.parse(JSON.stringify(idEMPLEADO[0].TURNOS));
		else
			this.DGTurnos = [];
		this.valoresObjetos('foto empleado');
	}

	initNewRow(e: any, tipo: string) {
		if (tipo === 'TURNOS') {
			e.data.ID_HORARIO = "";
			e.data.DESCRIPCION = "";
			if (this.DGTurnos.length > 0) {
				//nueva fecha de inicio
				var fecha_ant = new Date(this.DGTurnos[this.DGTurnos.length - 1].FECHA_FINAL);
				const dia = fecha_ant.getDate();
				fecha_ant.setDate(dia + 1);
				e.data.FECHA_INICIO = new Date(fecha_ant);
				e.data.FECHA_FINAL = new Date(fecha_ant);
			} else {
				e.data.FECHA_INICIO = new Date();
				e.data.FECHA_FINAL = new Date();
			}
			this.selectTurnos = [];
			this.selectDataTurnos = [];
			if (this.DGTurnos.length > 0) {
				const item = this.DGTurnos.reduce((ant, act) => { return (ant.ITEM > act.ITEM) ? ant : act })
				e.data.ITEM = item.ITEM + 1;
			}
			else {
				e.data.ITEM = 1;
			}
		};
		if (tipo === 'SECCIONES') {
			e.data.ID_SECCION = "";
			e.data.DESCRIPCION = "";
			e.data.TIPO = "";
			e.data.ID_ACTIVIDAD = "";
			e.data.ESTADO = "ACTIVO";
			this.selectSeccion = [];
			if (this.DGSecciones.length > 0) {
				const item = this.DGSecciones.reduce((ant, act) => { return (ant.ITEM > act.ITEM) ? ant : act })
				e.data.ITEM = item.ITEM + 1;
			}
			else {
				e.data.ITEM = 1;
			}
		};
	}

	onSelectHorario(e: any, cellInfo: any) {
		if (e.selectedRowKeys.length > 0) {
			this.selectTurno = e.selectedRowKeys;
			this.FEmpleados.ID_HORARIO = e.selectedRowKeys[0];
		} else {
			this.selectTurno = [];
			this.FEmpleados.ID_HORARIO = '';
		}
		this.conCambios++;
		this.openIdHorarios = false;
	}

	async onSelectionSeccion(e: any, cellInfo: any) {
		this.openSeccion = false;
		if (this.selectEmpleado.length === 0) {
			e.isValid = false;
			cellInfo.data.SECCION = [];
			showToast('Seleccione un Empleado', 'error');
			// this.selectSeccion = [];
			return;
		}
		if (this.FEmpleados.ID_HORARIO === null || this.FEmpleados.ID_HORARIO === undefined || this.FEmpleados.ID_HORARIO === '') {
			e.isValid = false;
			cellInfo.data.SECCION = [];
			showToast('Seleccione un horario para el empleado', 'error');
			return;
		}
		if (cellInfo.data.ID_ACTIVIDAD === '') {
			e.isValid = false;
			cellInfo.data.SECCION = [];
			showToast('Seleccione actividad del empleado', 'error');
			return;
		}
		//Verifica que no exceda la capacidad instalada de empleados
		if (e.data.TIPO === "OPERATIVA") {
			// Valida la Capacidad
			const padre: any = this.arraySeccion.filter((d: any) => d.ITEM === e.data.ANTERIOR);
			const prm = { SECCION_H: e.data.ID_SECCION, SECCION_P: padre[0].ID_SECCION, HORARIO: this.FEmpleados.ID_HORARIO };
			const apiRest = this.sData.valideCapcidad('VAL CAPACIDAD', prm, 'PRO009');
			const res = await lastValueFrom(apiRest, { defaultValue: true });
			const msg = JSON.parse(res.data);
			if (msg[0].ErrMensaje !== '') {
				cellInfo.data.SECCION = [];
				this.showModal(msg[0].ErrMensaje);
				return;
			}

		}

		if (this.DGSecciones.length <= 0) {
			if (e.data) {
				this.item = e.data.ITEM;
				cellInfo.data.ID_SECCION = e.data.ID_SECCION;
				cellInfo.data.DESCRIPCION = e.data.DESCRIPCION;
			}
			this.DSecciones.instance.cellValue(cellInfo.rowIndex, "DESCRIPCION", cellInfo.data.DESCRIPCION);
			this.conCambios++;
		} else {
			const npos: any = this.DGSecciones.findIndex((d: any) => d.ID_SECCION === e.data.ID_SECCION);
			if (npos !== -1) {
				e.isValid = false;
				// this.selectSeccion = [];
				this.item = '';
				cellInfo.data.ID_SECCION = '';
				cellInfo.data.DESCRIPCION = '';
				showToast('La sección ya fue asignada al empleado.', 'error');
			} else {
				if (e.data) {
					this.item = e.data.ITEM;
					cellInfo.data.ID_SECCION = e.data.ID_SECCION;
					cellInfo.data.DESCRIPCION = e.data.DESCRIPCION;
				}
				this.DSecciones.instance.cellValue(cellInfo.rowIndex, "DESCRIPCION", cellInfo.data.DESCRIPCION);
				this.conCambios++;
			}
		}

	}

	onSeleccActividad(e: any, cellInfo: any): void {
		cellInfo.data.ID_ACTIVIDAD = e.value;
		cellInfo.data.ID_SECCION = '';
		cellInfo.data.DESCRIPCION = '';
		// this.selectSeccion = [];

		if (e.value.match('LIDER|FACILITADOR'))
			this.DSeccion = this.arraySeccion.filter((d: any) => d.TIPO === 'PROCESO' || d.TIPO === 'Planta');
		if (e.value === 'OPERARIO')
			this.DSeccion = this.arraySeccion.filter((d: any) => d.TIPO === 'OPERATIVA' && d.MANO_OBRA === true);

		// this.DSecciones.instance.cellValue(cellInfo.rowIndex, "ID_ACTIVIDAD", cellInfo.data.ID_ACTIVIDAD);
		// this.DSecciones.instance.cellValue(cellInfo.rowIndex, "ID_SECCION", cellInfo.data.ID_SECCION);
		// this.DSecciones.instance.cellValue(cellInfo.rowIndex, "DESCRIPCION", cellInfo.data.DESCRIPCION);
		this.conCambios++;
	}

	onValueChangedSeccion(e: any, cellInfo: any) {
		if (this.mnuAccion === 'update' && (e.value === undefined || e.value === null || e.value.length === 0)) {
			cellInfo.data.ID_SECCION = '';
			cellInfo.data.DESCRIPCION = '';
			this.conCambios++;
		}
	}

	onSeleccTipo(e: any, cellInfo: any): void {
		if (e.value === 'PRINCIPAL') {
			const npos = this.DGSecciones.findIndex((d: any) => d.TIPO === e.value)
			if (npos === -1) {
				cellInfo.data.TIPO = e.value;
				this.conCambios++;
				this.DSecciones.instance.cellValue(cellInfo.rowIndex, "TIPO", cellInfo.data.TIPO);
			} else {
				showToast('El empleado ya es de TIPO PRINCIPAL en una sección', 'error');
				cellInfo.data.TIPO = '';
			}
		} else {
			cellInfo.data.TIPO = e.value;
			this.conCambios++;
			this.DSecciones.instance.cellValue(cellInfo.rowIndex, "TIPO", cellInfo.data.TIPO);
		}
	}

	onSeleccEstado(e: any, cellInfo: any): void {
		cellInfo.data.ESTADO = e.value;
		this.DSecciones.instance.cellValue(cellInfo.rowIndex, "ESTADO", cellInfo.data.ESTADO);
		this.conCambios++;
	}

	onValueChangedTurno(e: any, cellInfo: any) {
		if ((e.value === '') || (e.value === null) || (e.value === undefined)) {
			this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'ID_HORARIO', '');
			this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'DESCRIPCION', '');
			this.conCambios++;
		}
	}

	onSelectionTurnos(e: any, cellInfo: any) {
		if (this.selectEmpleado.length === 0) {
			e.isValid = false;
			showToast('Seleccione un Empleado', 'error');
			this.selectTurnos = [];
			return;
		}
		if (e.key !== '') {
			if (this.DGTurnos.length > 0) {
				const npos = this.DGTurnos.findIndex((d: any) => (d.ID_HORARIO === e.key) && (d.FECHA_FINAL === cellInfo.data.FECHA_INICIO));
				if (npos !== -1) {
					showToast('Este horario ya esta asignado al empleado.', 'error');
					this.openTurnos = false;
					this.selectTurnos = [];
					this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'ID_HORARIO', '');
					this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'DESCRIPCION', '');
					return;
				} else {
					this.openTurnos = false;
					this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'ID_HORARIO', e.data.ID_HORARIO);
					this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'DESCRIPCION', e.data.DESCRIPCION);
					this.conCambios++;
				}
			} else {
				this.openTurnos = false;
				this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'ID_HORARIO', e.data.ID_HORARIO);
				this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'DESCRIPCION', e.data.DESCRIPCION);
				this.conCambios++;
			}
		} else {
			this.selectTurnos = [];
			this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'ID_HORARIO', '');
			this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'DESCRIPCION', '');
			this.openTurnos = false;
		}
	}

	onValueChangedFechaInicio(e: any, cellInfo: any) {
		if ((e.value !== null) && (e.value !== undefined) && (e.value !== '')) {
			if (this.DGTurnos.length > 0) {
				this.DGTurnos.forEach((element: any) => {
					if ((element.ID_HORARIO === cellInfo.data.ID_HORARIO)) {
						if ((element.FECHA_INICIO >= e.value)
							&&
							(element.FECHA_FINAL <= e.value)
						) {
							cellInfo.data.INICIO = '';
							this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'FECHA_INICIO', cellInfo.data.INICIO);
							showToast('La fecha fue asiganda a otro horario.', 'error');
							return;
						} else {
							cellInfo.data.INICIO = e.value;
							this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'FECHA_INICIO', cellInfo.data.INICIO);
							this.conCambios++;
						}
					} else {
						cellInfo.data.INICIO = e.value;
						this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'FECHA_INICIO', cellInfo.data.INICIO);
						this.conCambios++;
					}
				});
			} else {
				cellInfo.data.INICIO = e.value;
				this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'FECHA_INICIO', cellInfo.data.INICIO);
				this.conCambios++;
			}
		}
	}

	onValueChangedFechaFinal(e: any, cellInfo: any) {
		if ((e.value !== null) && (e.value !== undefined) && (e.value !== '')) {
			if (this.DGTurnos.length > 0) {
				this.DGTurnos.forEach((element: any) => {
					if ((element.ID_HORARIO === cellInfo.data.ID_HORARIO)) {
						if ((element.FECHA_INICIO >= e.value)
							&&
							(element.FECHA_FINAL <= e.value)
						) {
							cellInfo.data.FINAL = '';
							this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'FECHA_FINAL', cellInfo.data.FINAL);
							showToast('La fecha fue asiganda a otro horario.', 'error');
							return;
						} else {
							cellInfo.data.FINAL = e.value;
							this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'FECHA_FINAL', cellInfo.data.FINAL);
							this.conCambios++;
						}
					} else {
						cellInfo.data.FINAL = e.value;
						this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'FECHA_FINAL', cellInfo.data.FINAL);
						this.conCambios++;
					}
				});
			} else {
				cellInfo.data.FINAL = e.value;
				this.dataGridTurnos.instance.cellValue(cellInfo.rowIndex, 'FECHA_FINAL', cellInfo.data.FINAL);
				this.conCambios++;
			}
		}
	}

	// Cargar imagenes
	imagenClick(operacion, empleado) {
		// Valida si hay empleado 
		if (empleado === null || empleado === undefined || empleado === '') {
			this.showModal('Debe seleccionar un de empleado!');
		}
		else {
			switch (operacion) {
				case 'cargar':
				case 'icon-upload-file-sl':
					this.operArcImg('cargar', empleado);
					break;

				case 'eliminar':
				case 'icon-eliminar-sl':
					if (this.readOnly === false) {
						if (this.srcFotoEmp === '../../../assets/img/fotoEmpleadoCargando.svg') {
							this.showModal('No hay imagen para eliminar');
							return;
						}
						Swal.fire({
							title: '',
							text: '¿Desea eliminar la imagen actual?',
							iconHtml: "<i class='icon-alert-ol'></i>",
							showCancelButton: true,
							confirmButtonColor: '#DF3E3E',
							cancelButtonColor: '#438ef1',
							cancelButtonText: 'No',
							confirmButtonText: 'Sí, eliminar'
						}).then((result) => {
							if (result.isConfirmed) {
								this.srcFotoEmp = '../../../assets/img/fotoEmpleadoCargando.svg'
							}
						});
					} else {
						showToast('Presione Editar', 'error');
					}
					break;

				default:
					break;
			}

		}
	}

	// Llama al cargue del archivo
	datEmp: any;
	operArcImg(operArch, emp) {
		if (this.readOnly === false) {
			if (emp ?? '' != '') {
				// Operación de cargue de archivo
				const empData = JSON.parse(JSON.stringify(this.VDatosReg.filter((d: any) => d.ID_EMPLEADO === emp)));
				if (operArch.match('cargar|cargar prev')) {
					this.datEmp = empData;
					let input = document.createElement('input');
					input.type = 'file';
					input.accept = "image/*";
					input.onchange = (e) => {
						this.fileChangeEvent(e, this.datEmp);
					}
					input.click();
					this.conCambios++;
				}
				//Elimina archivo
				else {
					empData[0].FOTO = "";
					this.srcFotoEmp = "../../../assets/img/fotoEmpleadoCargando.svg";
					this.conCambios++;
				}
			} else {
				showToast('Seleccione empleado', 'error');
			}
		} else {
			showToast('Presione editar', 'error');
		}
	}

	imageError: string = '';
	fileChangeEvent(fileInput: any, emp: any) {
		this.imageError = '';
		if (emp.length != 0) {

			if (fileInput.target.files && fileInput.target.files[0]) {
				// Size Filter Bytes
				const max_size = 120000;
				const allowed_types = ['image/png', 'image/jpeg'];
				const max_height = 210;
				const max_width = 200;

				const reader = new FileReader();
				reader.onload = (e: any) => {
					const image = new Image();
					image.src = e.target.result;
					image.onload = rs => {
						const imgBase64Path = e.target.result;
						emp[0].FOTO = imgBase64Path;
						const base64 = imgBase64Path;
						this.filaDatosEdit = emp;
						this.modoImagen = true;

						if (e.total > max_size) {
							this.imageError =
								'El máximo tamaño no debe supearar los 120 Kbytes ó ' + max_size / 1000000 + 'Mb, la imagen fue modificada!';
							// this.showModal(this.imageError);
							this.resizeBase64Img(base64, max_width, max_height).then((result) => {
								this.srcFotoEmp = result;
								// this.sendPhoto(emp, this.srcFotoEmp);
							});
							return true;
						}
						this.srcFotoEmp = base64;
						// this.sendPhoto(emp, this.srcFotoEmp);
						return true;
					};
				};

				if (this.imageError === '')
					reader.readAsDataURL(fileInput.target.files[0]);
				return true;
			}
			else
				return false;
		} else {
			showToast('Seleccione empleado', 'error');
			return false;
		}
	}

	resizeBase64Img = (base64, newWidth, newHeight) => {
		return new Promise((res, rej) => {
			const img = new Image();
			img.src = base64;
			img.onload = rs => {
				const elem = document.createElement('canvas');
				var ratio = Math.min(newWidth / img.width, newHeight / img.height);
				elem.width = img.width * ratio;  // newX
				elem.height = img.height * ratio;  // newY
				const ctx: any = elem.getContext('2d');
				ctx.drawImage(img, 0, 0, img.width * ratio, img.height * ratio);   //, newX, newY);
				const data = elem.toDataURL();
				res(data);
			}
			img.onerror = error => rej(error);
		})

	};

	onValidarCampos() {
		if ((this.FEmpleados.ID_EMPLEADO === '') || (this.FEmpleados.NOMBRE_COMPLETO === '') || (this.FEmpleados.ESTADO === '')) {
			return true;
		} else {
			return false;
		};
	}

	// Cargue de datos de la aplicacion
	valoresObjetos(obj: string) {
		if (obj === 'secciones' || obj == 'todos') {
			const prm = { FILTRO: 'ACTIVAS' };
			this.sData.itemSecciones('secciones', prm).subscribe((data: any) => {
				const res = JSON.parse(data.data);
				if ((data.token != undefined)) {
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				this.arraySeccion = res;
				const mensaje = this.arraySeccion[0].ErrMensaje;
				if (mensaje != '') {
					this.showModal(mensaje);
				} else {
					for (let i = 0; i < this.arraySeccion.length; i++) {
						const element = this.arraySeccion[i];
						// var con_emple:number = 0;
						// var cap_hor:number = 0;
						// if (element.TIPO === 'PROCESO' && element.INVENTARIO === true){
						// 	const hijas:any [] = this.arraySeccion.filter((d:any) => d.ANTERIOR === element.ITEM);
						// 	hijas.forEach((hija:any) => {
						// 		const cant = hija.EMPLEADOS.length > 0 ? hija.EMPLEADOS.filter((d:any) => d.ID_HORARIO === hija) : 0;
						// 		con_emple = con_emple + hija.EMPLEADOS.length;
						// 	});

						// } else {
						// 	element.CONT_EMPLE = con_emple;
						// }
						element.SECCION = element.ID_SECCION;
					}
					this.DSeccion = this.arraySeccion;
				};
			},
				(err => {
					this.showModal(err.message);
				})
			);
		};
		if (obj === 'turno' || obj === 'todos') {
			const prm = { HORARIOS: [] };
			this.sData.getTurnos('TURNOS', prm).subscribe((data: any) => {
				const res = JSON.parse(data.data);
				if ((data.token != undefined)) {
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				if (res[0].ErrMensaje != '') {
					showToast(res[0].ErrMensaje, 'error');
				} else {
					res.forEach((element: any) => {
						element.INFO = element.ID_HORARIO + ' | ' + element.DESCRIPCION;
					});
					const newArray: any = res.filter((d: any) => d.ESTADO === 'ACTIVO');
					this.DTurnos = newArray;
				};
			},
				(err => {
					this.showModal(err.message);
				})
			);
		};
		if (obj === 'filtro') {
			if (this.VDatosReg.length !== 0) {
				if (this._sfiltro.enConsulta === false) {
					this.opPrepararBuscar('');
				} else {
					showToast('Consulta en proceso, por favor espere.', 'warning');
				}
			}
		};
		if (obj === 'foto empleado') {
			const prm = { ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO };
			this.sData.getFotoEmpleado('FOTO EMPLEADO', prm).subscribe((data: any) => {
				const res = JSON.parse(data.data);
				if ((data.token != undefined)) {
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				const mensaje = res.ErrMensaje;
				if (mensaje != '') {
					this.srcFotoEmp = '../../../assets/img/fotoEmpleadoCargando.svg';
				} else {
					this.srcFotoEmp = res.FOTO;
				};
			},
				(err => {
					this.showModal(err.message);
				})
			);
		}
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

	showModal(mensaje: any) {
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
			confirmButtonColor: '#0F4C81',
			title: 'Error!',
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
