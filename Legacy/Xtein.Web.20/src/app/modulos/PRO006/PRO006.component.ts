import { Component, OnInit, ViewChild } from '@angular/core';
import Swal from 'sweetalert2';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { PRO003Service } from 'src/app/services/PRO003/s_PRO003.service';
import themes from 'devextreme/ui/themes';
import { clsBarraRegistro } from '../../containers/regbarra/_clsBarraReg';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxComponent, DxDateBoxModule, DxLoadPanelModule, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { CommonModule, DatePipe } from '@angular/common';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import notify from 'devextreme/ui/notify';
import { showToast } from '../../shared/toast/toastComponent.js'
import { PRO00601Component } from './PRO00601/PRO00601.component';

@Component({
	selector: 'PRO006-component',
	templateUrl: './PRO006.component.html',
	styleUrls: ['./PRO006.component.css'],
	standalone: true,
	imports: [CommonModule, DxDataGridModule, DxDateBoxModule, DxButtonModule, DxLoadPanelModule, DxSelectBoxModule, DxTextBoxModule, PRO00601Component]
})
export class PRO006Component implements OnInit {
	@ViewChild ('fechaDesde', { static: false }) dFechaDesde : DxDateBoxComponent;
	@ViewChild ('fechaHasta', { static: false }) dFechaHasta : DxDateBoxComponent;
	@ViewChild("gridManoObra", { static: false }) gridManoObra: DxDataGridComponent;

	subscription: Subscription;
	unSubscribe: Subject<boolean> = new Subject<boolean>();
	prmUsrAplBarReg: clsBarraRegistro;
	mnuAccion: string;
	VDatosReg: any;
	esEdicion: boolean = false;
	esVisibleSelecc: string = 'none';

	tipoMO: any = [
		{ ITEM: 1, TIPO: 'DINERO', DESC: 'Dinero'},
		{ ITEM: 2, TIPO: 'TIEMPO', DESC: 'Tiempo'}
	];
	GDManoObra: any = [];
	send_dataMO: any = [];
	DLMedidasArray: any = [];
	GDManoObra_prev: any = [];
	newArray: any = [];
	filaData: any = [];
	allMode: string;
	checkBoxesMode: string;
	UNTiempo:any = [
		{ID_UDM:'Hora', NOMBRE: 'Horas', DESCRIPCION: "Hora - Horas" },
		{ID_UDM:'Min', NOMBRE: 'Minutos', DESCRIPCION: "Min - Minutos" },
		{ID_UDM:'Sg', NOMBRE: 'Segundos', DESCRIPCION: "Sg - Segundos" }
	];
	UNDinero:any = [{ID_UDM:'COP', NOMBRE: 'Dinero', DESCRIPCION: "COP - Peso Colombiano" }];

	fechaDesde:any = '';
	fechaHasta:any = '';
	codigo = '';

	maxValor: number = 0;
	minValor: number = 0;
	numFila: number = 0;

	toaVisible: boolean = false;
	toaTipo = 'info'
  toaMessage = 'Registro actualizado!';
	loadingVisible: boolean = false;

	// Operaciones de grid
	rowNew: boolean = true;
	rowEdit: boolean = false;
	rowDelete: boolean = false;
	rowSave: boolean = false;
	rowApplyChanges: boolean = false;
	filasSelecc: any[] = [];

	constructor(
		private sData: PRO003Service,
		private _sbarreg: SbarraService,
    private tabService: TabService,
		private datePipe: DatePipe
		) {

		this.subscription = this._sbarreg
		.getObsRegApl()
		.pipe(takeUntil(this.unSubscribe))
		.subscribe((datreg) => {
			// Valida si la petición es para esta aplicacion
			if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
				this.opMenuRegistro(datreg);
		});
		this.allMode = 'allPages';
		this.selectionGrid = this.selectionGrid.bind(this);
	}

	ngOnInit(): void {
		const user:any = localStorage.getItem('usuario');
		this.prmUsrAplBarReg = {
			tabla: 'ESPECIFICACIONES_PRODUCCION',
			aplicacion: 'PRO-006',
			usuario: user,
			accion: 'operacion',
			error: '',
			r_numReg: 0,
			r_totReg: 0,
			operacion: { r_modificar: true }
		};
		this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
		this.valoresObjetos('todos');
		this.esEdicion = false;
		this.sData.PRO006_enEdicion = this.esEdicion;
	}

	ngOnDestroy() {
    this.subscription.unsubscribe();
  }

	// Llama a Acciones de registro
	opMenuRegistro(operMenu: clsBarraRegistro): void {
		switch (operMenu.accion) {
			case "r_ini":
				const user:any = localStorage.getItem('usuario');
				this.prmUsrAplBarReg = {
					tabla: 'ESPECIFICACIONES_PRODUCCION',
					aplicacion: 'PRO-006',
					usuario: user,
					accion: "r_ini",
					error: "",
					r_numReg: 0,
					r_totReg: 0,
					operacion: { r_modificar: true }
				};
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

			case 'r_nuevo':
				this.mnuAccion = "nuevo";
				this.opPrepararNuevo();
				break;

			case 'r_modificar':
				this.mnuAccion = "updatePRO006";
				this.opPrepararModificar();
				break;

			case 'r_guardar':
				this.opPrepararGuardar(this.mnuAccion);
				break;

			case 'r_buscar':
				this.opBlanquearForma();
				this.opPrepararBuscar();
				break;

			case 'r_buscar_ejec':
				this.opBlanquearForma();
				this.opPrepararBuscar();
				break;

			case 'Primero':
			case 'Anterior':
			case 'Siguiente':
			case 'Ultimo':
			case 'IrA':
				this.opIrARegistro(operMenu.accion);
				break;

			case 'r_cancelar':
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
						// Restituye los valores
					  this.GDManoObra = JSON.parse(JSON.stringify(this.GDManoObra_prev));
					  this.mnuAccion = "";
					  this.esEdicion = false;
						this.sData.readonly = this.esEdicion;
						this.sData.PRO006_enEdicion = this.esEdicion;
            this.sData.setReadOnly({ readOnly: this.esEdicion, data:this.GDManoObra });
						this.esVisibleSelecc = 'none';
						this.sData.conCambiosPro006 = 0;
						this.prmUsrAplBarReg.accion = 'r_cancelar';
						this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
					  this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
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
		this.opBlanquearForma();
	}
	opBlanquearForma(): void {
	}
	opPrepararModificar(): void {
		this.esEdicion = true;
		this.sData.readonly = this.esEdicion;
		this.sData.PRO006_enEdicion = this.esEdicion;
		this.sData.setReadOnly({ readOnly: this.esEdicion, data:''});
		this.esVisibleSelecc = 'onClick';
		this.GDManoObra_prev = JSON.parse(JSON.stringify(this.GDManoObra));
	}
	opPrepararGuardar(accion: string): void {			
		//verificar si hay cambios en los datos
		if (!this.sData.readonly) {
			if ( this.sData.conCambiosPro006 !== 0 ) {
				const prm = this.GDManoObra;
				this.loadingVisible = true;
				// API guardado de datos
				this.sData.updatePRO006(accion, prm).subscribe((data) => {
					this.loadingVisible = false;
					const res = JSON.parse(data.data);
					if ( (data.token != undefined) ){
						const refreshToken = data.token;
						localStorage.setItem("token", refreshToken);
					}
					if (res[0].ErrMensaje !== '' && res[0].ErrMensaje !== 'VALIDO') {
						this.showModal(res[0].ErrMensaje);
					} else {
						this.prmUsrAplBarReg = {
							...this.prmUsrAplBarReg,
							accion: "r_ini",
							error: "",
							r_numReg: 0,
							r_totReg: 0,
							operacion: {r_modificar: true}
						};
						this.esVisibleSelecc = 'none';
						showToast('Registro actualizado','success');
						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
						this.sData.setReadOnly({ readOnly: this.esEdicion, data:''});
						this.sData.conCambiosPro006 = 0;
					}
				});
				this.valoresObjetos('mano obra');
				this.esEdicion = false;
				this.sData.readonly = this.esEdicion;
				this.sData.PRO006_enEdicion = this.esEdicion;
			} else {
				showToast('No hay cambios por guardar', 'error');
				this.prmUsrAplBarReg = {
					...this.prmUsrAplBarReg,
					accion: "r_ini",
					error: "",
					r_numReg: 0,
					r_totReg: 0,
					operacion: {r_modificar: true}
				};
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				this.esEdicion = false;
				this.sData.PRO006_enEdicion = this.esEdicion;
				this.sData.setReadOnly({ readOnly: this.esEdicion, data:''});
				this.sData.conCambiosPro006 = 0;
			}
			
		} else {
			showToast('Hay cambios sin guardar, por favor, Guarde los datos en la tabla antes de Enviar la información.', 'error');
		}
	}

	opPrepararBuscar(): void {
		if (this.prmUsrAplBarReg.accion === 'r_buscar') {
			this.esEdicion = false;
			this.sData.PRO006_enEdicion = this.esEdicion;
			this.sData.readonly = this.esEdicion;
			this.sData.setReadOnly({ readOnly: this.esEdicion, data:''});
		} else {

			this.prmUsrAplBarReg = {
				...this.prmUsrAplBarReg,
				error: '',
				r_numReg: this.VDatosReg.length > 0 ? 1 : 0,
				r_totReg: this.VDatosReg.length,
				accion: 'r_buscar_ejec'
			};
			// ...mas operaciones
			this.esEdicion = false;
			this.sData.readonly = this.esEdicion;
			this.sData.PRO006_enEdicion = this.esEdicion;
			this.sData.setReadOnly({ readOnly: this.esEdicion, data:''});
			this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
		};

		this.esEdicion = false;
		this.sData.readonly = this.esEdicion;
		this.sData.PRO006_enEdicion = this.esEdicion;
		this.sData.setReadOnly({ readOnly: this.esEdicion, data:''});
	}

	setCellvalor(rowData: any, value: any, currentRowData: any){
		rowData.VALOR = value;
	}

	onEditingStart(e:any) {
		e.data.readOnly_UNIDAD_MEDIDA = false;
		this.numFila = e.data.ITEM;
		this.filaData = e.data;
  }

	opIrARegistro(accion: string): void {
		this.prmUsrAplBarReg.accion =
			'pos_' + this.prmUsrAplBarReg.accion;
		switch (accion) {
			case 'Primero':
				this.prmUsrAplBarReg.r_totReg = 1;
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

			case 'Anterior':
				this.prmUsrAplBarReg.r_totReg =
					this.prmUsrAplBarReg.r_totReg === 1
						? 1
						: this.prmUsrAplBarReg.r_totReg - 1;
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

			case 'Siguiente':
				this.prmUsrAplBarReg.r_totReg =
					this.prmUsrAplBarReg.r_totReg === this.VDatosReg.length
						? this.VDatosReg.length
						: this.prmUsrAplBarReg.r_totReg + 1;
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

			case 'Ultimo':
				this.prmUsrAplBarReg.r_totReg = this.VDatosReg.length;
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

			case 'IrA':
				if (this.prmUsrAplBarReg.r_totReg !== 0) {
					// Valida si hubo cambio de ordenamiento en el visor
					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

				} else {
				}
				this.esEdicion = false;
				this.sData.readonly = this.esEdicion;
				this.sData.PRO006_enEdicion = this.esEdicion;
				this.sData.setReadOnly({ readOnly: this.esEdicion, data:''});
				break;

			case 'Eliminado':
				this.VDatosReg.splice(this.prmUsrAplBarReg.r_totReg - 1, 1);
				this.prmUsrAplBarReg.r_totReg--;
				if (this.prmUsrAplBarReg.r_totReg > this.prmUsrAplBarReg.r_totReg) {
					this.prmUsrAplBarReg.r_totReg = this.prmUsrAplBarReg.r_totReg;
				}
				if (this.VDatosReg.length > 0) {
					//
				} else {
				}
				// Status
				this.prmUsrAplBarReg.error = '';
				this.prmUsrAplBarReg.accion = 'r_eliminar_pos';
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

			default:
				break;
		}

		// Trae secciones asociadas a la ruta
		this.esEdicion = false;
		this.sData.readonly = this.esEdicion;
		this.sData.PRO006_enEdicion = this.esEdicion;
		this.sData.setReadOnly({ readOnly: this.esEdicion, data:''});
	}

	updateDadaInfo(e:any) {
		this.sData.conCambiosPro006 = this.sData.conCambiosPro006 + 1;
		this.GDManoObra = this.GDManoObra.filter((d:any) => d.TIPO !== e.TIPO);
		e.DATA_UPDATE.forEach((ele:any) => {
			if (this.GDManoObra.length > 0) {
				const item = this.GDManoObra.reduce((ant:any, act:any)=>{return (ant.ITEM > act.ITEM) ? ant : act});
				ele.ITEM = item.ITEM + 1;
			} else {
				ele.ITEM = 1;
			}
			this.GDManoObra.push(ele);
		});
	}

	selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

	onRowExpandingDetalles(e:any) {
    const tipo:any = this.tipoMO.filter((d:any) => d.ITEM === e.key);
		const itemsMO:any = this.GDManoObra.filter((d:any) => d.TIPO === tipo[0].DESC);
    this.send_dataMO = { TIPO: tipo[0].DESC, ITEMS: itemsMO };
  }

	valoresObjetos(obj: string) {
		if (obj === 'mano obra' || obj === 'todos' || obj === 'ref') {
			const prm = { DATOS: '' };
			this.loadingVisible = true;
			this.sData.itemPRO006('MANO DE OBRA', prm).subscribe((data: any) => {

				const res = JSON.parse(data.data);
				if ( (data.token != undefined) ){
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				this.newArray = res;
				const mensaje = this.newArray[0].ErrMensaje;
				if (mensaje != '') {
					this.showModal(mensaje);
				}
				else {
					this.newArray.forEach((element:any) => {
						element.readOnly_UNIDAD_MEDIDA = true;
					});
					this.GDManoObra = this.newArray;
					this.GDManoObra_prev = this.newArray;
				};
				this.loadingVisible = false;
			},
				(err => {
					this.showModal(err.message);
				})
			);
		};
		if (obj === 'unidades medidas' || obj === 'todos' || obj === 'ref') {
			const prm = { TIPO: 'TIEMPO' };
			this.sData.DLMedidasPRO006('UNIDADES MEDIDA', prm).subscribe((data: any) => {
	
				const res = JSON.parse(data.data);
				if ( (data.token != undefined) ){
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				this.newArray = res;
				const mensaje = this.newArray[0].ErrMensaje;
				if (mensaje != '') {
					this.showModal(mensaje);
				}
				else {
					// this.DLMedidasArray = this.newArray.map((el:any) => el.ID_UDM);
					this.newArray.forEach((element:any) => {
						element.DESCRIPCION = element.ID_UDM+' - '+element.NOMBRE;
					});
					const values:any = this.newArray.filter((d:any) => (d.ID_UDM === 'Hora') || (d.ID_UDM === 'Min') || (d.ID_UDM === 'Sg') );
					this.DLMedidasArray = values;
				};
			},
				(err => {
					this.showModal(err.message);
				})
			);
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

	showModal(mensaje:any) {
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
			stopKeydownPropagation: false,
		});
	}

}
