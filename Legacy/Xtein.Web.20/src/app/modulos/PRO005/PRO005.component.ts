import { Component, OnInit, ViewChild } from '@angular/core';
import Swal from 'sweetalert2';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { PRO003Service } from 'src/app/services/PRO003/s_PRO003.service';
import themes from 'devextreme/ui/themes';
import { clsBarraRegistro } from '../../containers/regbarra/_clsBarraReg';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxComponent, DxDateBoxModule, DxLoadPanelModule, DxNumberBoxModule, DxSelectBoxModule, DxSwitchModule } from 'devextreme-angular';
import { CommonModule, DatePipe } from '@angular/common';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import notify from 'devextreme/ui/notify';
import { showToast } from '../../shared/toast/toastComponent.js'
import { PRO00501Component } from './PRO00501/PRO00501.component';

@Component({
  selector: 'PRO005-component',
  templateUrl: './PRO005.component.html',
  styleUrls: ['./PRO005.component.css'],
	standalone: true,
	imports: [CommonModule, DxDataGridModule, DxDateBoxModule, DxSwitchModule, DxButtonModule, DxLoadPanelModule, DxNumberBoxModule, DxSelectBoxModule, PRO00501Component]
})
export class PRO005Component implements OnInit {
	@ViewChild("gridCif", { static: false }) gridCif: DxDataGridComponent;

  subscription: Subscription;
	unSubscribe: Subject<boolean> = new Subject<boolean>();
	prmUsrAplBarReg: clsBarraRegistro;
	mnuAccion: string;
	VDatosReg: any;
	esEdicion: boolean = false;
	enEdicion: boolean = false;
	esVisibleSelecc: string = 'none';

	GDCif: any = [];
	send_dataCIF: any = [];
	tiposCif: any = [ 
		{ITEM: 1, TIPO: 'CIF FIJOS', DESC: 'Fijo'},
		{ITEM: 2, TIPO: 'CIF VARIABLES', DESC: 'Variable'}
	];
	DLMedidasArray: any = [];
	GDCif_prev: any = [];
	newArray: any = [];
	DBaseCif: any = [];
	filaData: any = [];
	allMode: string;
	checkBoxesMode: string;
	BaseCIFValue: any = [];
	readOnlyBaseCif: boolean = false;

	fechaDesde: any;
	fechaHasta: any;
	codigo = '';

	formatValor: string = '#,##0.00';
	maxValor: number = 0.0;
	minValor: number = 0.0;
	temp: number = 0;
	numFila: number = 0;
	changes: any[] = [];
	editRowKey: any = null;

	isChecked = true;
	Vdefecto: boolean [] = [];
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
  }

  ngOnInit(): void {
		const user:any = localStorage.getItem('usuario');
	    this.prmUsrAplBarReg = {
			tabla: 'ESPECIFICACIONES_PRODUCCION',
			aplicacion: 'PRO-005',
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
		this.sData.PRO005_enEdicion = this.esEdicion;
		this.sData.setEsEdicion({readOnly: this.esEdicion, data:''});
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
					aplicacion: 'PRO-005',
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
				this.mnuAccion = "updatePRO005";
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
				var mensaje = '¿Desea cancelar la operación?';
				if (this.sData.conCambiosPro005 !== 0) mensaje = 'Desea cancelar sin guardar cambios?';
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
						// Restituye los valores
						this.GDCif = JSON.parse(JSON.stringify(this.GDCif_prev));
						this.mnuAccion = "";
						this.esEdicion = false;
						this.sData.PRO005_enEdicion = this.esEdicion;
						this.sData.setEsEdicion({readOnly: this.esEdicion, data: this.GDCif});
						this.esVisibleSelecc = 'none';
						this.sData.conCambiosPro005 = 0;
						this.prmUsrAplBarReg.accion = 'r_cancelar';
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
		this.esVisibleSelecc = 'onClick';
		this.opBlanquearForma();
	}
	opBlanquearForma(): void {
	}
	opPrepararModificar(): void {
		this.esEdicion = true;
		this.sData.PRO005_enEdicion = this.esEdicion;
		this.sData.setEsEdicion({readOnly: this.esEdicion, data:''});
	}
	opPrepararGuardar(accion: string): void {			
		//verificar si hay cambios en los datos
		if (!this.sData.esEdicion) {
			if ( this.sData.conCambiosPro005 !== 0 ) {
				const prm = this.GDCif;
				this.loadingVisible = true;
				// API guardado de datos
				this.sData.updatePRO005(accion, prm).subscribe((data) => {
					this.loadingVisible = false;
					const res = JSON.parse(data.data);
					if ( (data.token != undefined) ){
						const refreshToken = data.token;
						localStorage.setItem("token", refreshToken);
					}
					if (res[0].ErrMensaje !== '' && res[0].ErrMensaje !== 'VALIDO') {
						this.sData.conCambiosPro005 = 0;
						this.esVisibleSelecc = 'none';
						// this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
						this.showModal(res[0].ErrMensaje);
						this.esEdicion = false;
						this.sData.PRO005_enEdicion = this.esEdicion;
						this.sData.setEsEdicion({readOnly: this.esEdicion, data: this.GDCif_prev });
					} else {
						this.prmUsrAplBarReg = {
							...this.prmUsrAplBarReg,
							accion: "r_ini",
							error: "",
							r_numReg: 0,
							r_totReg: 0,
							operacion: {r_modificar: true}
						};
						showToast('Registro actualizado', 'success');
						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
						this.valoresObjetos('cif');
						this.esVisibleSelecc = 'none';
						this.esEdicion = false;
						this.sData.PRO005_enEdicion = this.esEdicion;
						this.sData.setEsEdicion({readOnly: this.esEdicion, data:''});
						this.sData.conCambiosPro005 = 0;
					}
				});
			} else {
				this.loadingVisible = false;
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
				this.sData.PRO005_enEdicion = this.esEdicion;
				this.sData.setEsEdicion({readOnly: this.esEdicion, data:''});
				this.sData.conCambiosPro005 = 0;
			}
		} else {
			showToast('Hay cambios sin guardar, por favor, Guarde los datos en la tabla antes de Enviar la información.', 'error');
		}

	}

	opPrepararBuscar(): void {
		if (this.prmUsrAplBarReg.accion === 'r_buscar') {
			this.esEdicion = false;
			this.sData.PRO005_enEdicion = this.esEdicion;
			this.sData.setEsEdicion({readOnly: this.esEdicion, data:''});
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
			this.sData.PRO005_enEdicion = this.esEdicion;
			this.sData.setEsEdicion({readOnly: this.esEdicion, data:''});
			this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
		};

		this.esEdicion = false;
		this.sData.PRO005_enEdicion = this.esEdicion;
		this.sData.setEsEdicion({readOnly: this.esEdicion, data:''});
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
				this.sData.PRO005_enEdicion = this.esEdicion;
				this.sData.setEsEdicion({readOnly: this.esEdicion, data:''});
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

		this.esEdicion = false;
		this.sData.PRO005_enEdicion = this.esEdicion;
		this.sData.setEsEdicion({readOnly: this.esEdicion, data:''});
	}

	selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  onRowExpandingDetalles(e:any) {
    const tipo:any = this.tiposCif.filter((d:any) => d.ITEM === e.key);
		const itemsCIF:any = this.GDCif.filter((d:any) => d.TIPO === tipo[0].DESC);
    this.send_dataCIF = { TIPO: tipo[0].DESC, ITEMS: itemsCIF};
  }

	updateDadaInfo(e:any) {
		this.sData.conCambiosPro005 = this.sData.conCambiosPro005;
		this.GDCif = JSON.parse(JSON.stringify( this.GDCif.filter((d:any) => d.TIPO !== e.TIPO) ));
		e.DATA_UPDATE.forEach((ele:any) => {
			if (this.GDCif.length > 0) {
				const item = this.GDCif.reduce((ant:any, act:any)=>{return (ant.ITEM > act.ITEM) ? ant : act});
				ele.ITEM = item.ITEM + 1;
			} else {
				ele.ITEM = 1;
			}
			this.GDCif.push(ele);
		});
	}

	// Cargue de datos de la aplicacion
	valoresObjetos(obj: string) {
		if (obj === 'cif' || obj === 'todos' || obj === 'ref') {
			const prm = { DATOS: '' };
			this.loadingVisible = true;
			this.sData.itemPRO005('CIF', prm).subscribe((data: any) => {

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
						if(element.TIPO === 'Fijo') {
							element.formatValor = '#,##0.0';
							element.minValor = 0;
							element.maxValor = 1e10;
							element.BASE = '';
						}
						if(element.TIPO === 'Variable') {
							element.formatValor = '#,##0,00%';
							element.minValor = 0;
							element.maxValor = 100.00;
						}
						element.readOnlyDefecto = true;
						element.readOnlyBaseCif = true;
					});
					this.GDCif = this.newArray;
					this.GDCif_prev = this.GDCif;
					for (let i = 0; i < this.GDCif.length; i++) {
						this.Vdefecto.push(this.GDCif[i].DEFECTO);
						this.temp = this.temp+1;
					}
					
				};
				this.loadingVisible = false;
			},
				(err => {
					this.showModal(err.message);
				})
			);
		};
		if (obj === 'bases cif' || obj === 'todos' || obj === 'ref'){
			const prm = { DATOS: '' };
			this.loadingVisible = true;
			this.sData.getBaseCif('BASES CIF', prm).subscribe((data: any) => {
	
				const res = JSON.parse(data.data);
				if ( (data.token != undefined) ){
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				const mensaje = res[0].ErrMensaje;
				if (mensaje != '') {
					this.showModal(mensaje);
				}
				else {
					for (let i = 0; i < res.length; i++) {
						this.DBaseCif[i] = res[i].BASE;					
					}
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
