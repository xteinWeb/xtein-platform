import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { PRO003Service } from '../../services/PRO003/s_PRO003.service';
import Swal from 'sweetalert2';
import { SbarraService } from '../../containers/regbarra/_sbarra.service';
import { Subject, Subscription } from 'rxjs';
import { clsBarraRegistro } from '../../containers/regbarra/_clsBarraReg';
import { takeUntil } from 'rxjs/operators';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { Tab } from 'src/app/containers/tabs/tab.model';
import notify from 'devextreme/ui/notify';
import { DxRadioGroupModule } from 'devextreme-angular';
import { CommonModule } from '@angular/common';
import { showToast } from '../../shared/toast/toastComponent.js'

@Component({
	selector: 'PRO004-component',
	styleUrls: ['PRO004.component.scss'],
	templateUrl: 'PRO004.component.html',
	standalone: true,
	imports: [CommonModule, DxRadioGroupModule]
})

export class PRO004Component implements OnInit {

	@Output() addPerson = new EventEmitter<any>();

	// Variables fijas de la aplicación
	subscription: Subscription;
	unSubscribe: Subject<boolean> = new Subject<boolean>();
	prmUsrAplBarReg: clsBarraRegistro;
	mnuAccion: string;
	VDatosReg: any;
	readOnly: boolean = true;

	itemList: any = [];
	itemTipoSeccion: any = [];
	itemFactor: any = [];
	DAsignacionCostos: any = [];
	newArray: any = [];
	desc: any = [];
	descItem: string;
	descTipoSeccion: string;
	descFactorMO: string;
	currentData: any = [];
	valorDef: string;
	valorTipoSeccion: string;
	valorFactor: string;
	DESCRIPCION: any;
	inicia: boolean = true;
	valorAntes:any;

	conCambios: number = 0;

	toaVisible: boolean = false;
	toaTipo = 'info';
	toaMessage = 'Registro actualizado!';

	constructor(
		private sData: PRO003Service,
		private _sbarreg: SbarraService,
    private tabService: TabService
		) {

		this.subscription = this._sbarreg
		.getObsRegApl()
		.pipe(takeUntil(this.unSubscribe))
		.subscribe((datreg) => {
			// Valida si la petición es para esta aplicacion
			if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
				this.opMenuRegistro(datreg);
		});
	}

	ngOnInit(): void {
		const user:any = localStorage.getItem('usuario');
		this.prmUsrAplBarReg = {
			tabla: 'ESPECIFICACIONES_PRODUCCION',
			aplicacion: 'PRO-004',
			usuario: user,
			accion: 'operacion',
			error: '',
			r_numReg: 0,
			r_totReg: 0,
			operacion: { r_modificar: true }
		};
		this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
		this.valoresObjetos('todos');
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
					aplicacion: 'PRO-004',
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
				this.opBlanquearForma();
				this.opPrepararBuscar();
				break;

			case 'r_buscar_ejec':
				this.opBlanquearForma();
				this.opPrepararBuscar();
				break;

			case 'Eliminar':
				this.opEliminar();
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
						this.readOnly = true;
						this.conCambios = 0;
            this.prmUsrAplBarReg.accion = 'r_cancelar';
						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
						this.valorDefecto(this.currentData);
					}
				});
				break;

			case 'Vista':
				this.opVista();
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
		this.readOnly = false;
	}
	opPrepararGuardar(accion: string): void {
		if ( this.conCambios > 0 ) {
			// Muestra la descripción actualizada
			this.descItem = this.newArray.filter((el:any) => el.CONCEPTO === this.valorDef).map((r:any) => r.DESCRIPCION)[0];

			// Asociación de las secciones solo escogidas
			const prm = { PARAMETROS: [ {CODIGO: this.valorDef, DESCRIPCION: this.descItem, CLASE: 'BASES COSTO'},
																	{CODIGO: this.valorTipoSeccion, DESCRIPCION: this.descTipoSeccion, CLASE: 'ASIGNACION DE COSTOS'},
																	{CODIGO: this.valorFactor, DESCRIPCION: this.descFactorMO, CLASE: 'FACTOR PROTECCION MANO DE OBRA'}
																]
									};

			// API guardado de datos
			this.sData.updatePRO004(accion, prm).subscribe((data) => {
				const res = JSON.parse(data.data);
				if ( (data.token != undefined) ){
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				if (res[0].ErrMensaje !== '' && res[0].ErrMensaje !== 'VALIDO') {
					this.showModal(res[0].ErrMensaje);
				}
				else {
					this.prmUsrAplBarReg = {
						...this.prmUsrAplBarReg,
						error: '',
						accion: 'r_guardar',
						r_numReg: 0,
						r_totReg: 0,
						operacion: { r_modificar: true }
					};
					showToast('Registro actualizado', 'success');
					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				}
			});
			this.readOnly = true;
			this.conCambios = 0;
		} else {
			showToast('No hay cambios por guardar', 'error');
		}
	}

	opPrepararBuscar(): void {
		if (this.prmUsrAplBarReg.accion === 'r_buscar') {
			this.readOnly = true;
		} else {

			this.prmUsrAplBarReg = {
				...this.prmUsrAplBarReg,
				error: '',
				r_numReg: this.VDatosReg.length > 0 ? 1 : 0,
				r_totReg: this.VDatosReg.length,
				accion: 'r_buscar_ejec'
			};
			// ...mas operaciones
			this.readOnly = true;
			this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
		};

		this.readOnly = false;
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
				this.readOnly = true;
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
		this.readOnly = true;


	}
	opEliminar(): void {
	}
	// Ejecuta la eliminación
	AccionEliminar(): void {
	}
	// Vista/Zoom de los datos consultados
	opVista(): void {
	}

	// Cargue de datos de la aplicacion
  valoresObjetos(obj: string) {
		if (obj === 'item' || obj === 'todos') {
			const prm = { DATOS: '' };
			this.sData.itemBasesDelCosto('BASES COSTO', prm).subscribe((data: any) => {
				const res = JSON.parse(data.data);
				if ( (data.token != undefined) ){
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				this.newArray = res;
				const mensaje = this.newArray[0].ErrMensaje;
				if (mensaje != '') {
					this.showModal(mensaje);
				} else {
					this.itemList = this.newArray.filter((r:any) => r.ID_DOMINIO === 'BASES DEL COSTO').map((r:any) => r.CONCEPTO);
					this.itemTipoSeccion = this.newArray.filter((r:any) => r.ID_DOMINIO === 'ASIGNACION DE COSTOS').map((r:any) => r.CONCEPTO);
					this.itemFactor = this.newArray.filter((r:any) => r.ID_DOMINIO === 'FACTOR PROTECCION MANO DE OBRA').map((r:any) => r.CONCEPTO);
				}
			},
				(err => {
					this.showModal(err.message);
				})
			);
		};
		if (obj === 'descripcion' || obj === 'todos') {
			const prm = { DATOS: '' };
			this.sData.descripcionBasesDelCosto('VALOR BASE', prm).subscribe((data: any) => {				
				const res = JSON.parse(data.data);
				if ( (data.token != undefined) ){
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				this.currentData = res;
				res.forEach((ele:any) => {
					if(ele.CLASE === 'BASES COSTO')
						this.valorDef = ele.CODIGO;
					if(ele.CLASE === 'ASIGNACION DE COSTOS')
						this.valorTipoSeccion = ele.CODIGO;
					if(ele.CLASE === 'FACTOR PROTECCION MANO DE OBRA')
						this.valorFactor = ele.CODIGO;
				});
				const mensaje = res[0].ErrMensaje;
				if (mensaje != '') {
					this.showModal(mensaje);
				} else {
					this.descItem = this.newArray.filter((el:any) => el.CONCEPTO === this.valorDef).map((r:any) => r.DESCRIPCION)[0];
					this.descTipoSeccion = this.newArray.filter((el:any) => el.CONCEPTO === this.valorTipoSeccion).map((r:any) => r.DESCRIPCION)[0];
					this.descFactorMO = this.newArray.filter((el:any) => el.CONCEPTO === this.valorFactor).map((r:any) => r.DESCRIPCION)[0];
				}
			},
				(err => {
					this.showModal(err.message);
				})
			);
		};
	}

	valorDefecto(Data:any) {
		const res = Data;
		for (let i = 0; i < this.newArray.length; i++) {
			if (res[0].CODIGO === this.newArray[i].CONCEPTO) {
				this.valorDef = this.newArray[i].CONCEPTO;
			};
		};
	}

	descItems(ite:any) {
		const descripcion = this.newArray.filter((el:any) => el.CONCEPTO === ite).map((r:any) => r.DESCRIPCION)[0];
		return descripcion;
	}

	descCostos(ite:any) {
		const descripcion = this.newArray.filter((el:any) => el.CONCEPTO === ite).map((r:any) => r.DESCRIPCION)[0];
		return descripcion;
	}

	descFactor(ite:any) {
		const descripcion = this.newArray.filter((el:any) => el.CONCEPTO === ite).map((r:any) => r.DESCRIPCION)[0];
		return descripcion;
	}

	onValueChanged(e:any) {
		this.descItem = this.newArray.filter((el:any) => el.CONCEPTO === this.valorDef).map((r:any) => r.DESCRIPCION)[0];
		this.conCambios++;
	}

	onValueChangedTipoSeccion(e:any) {
		this.descTipoSeccion = this.newArray.filter((el:any) => el.CONCEPTO === this.valorTipoSeccion).map((r:any) => r.DESCRIPCION)[0];
		this.conCambios++;
	}

	onValueChangedFactor(e:any) {
		this.descFactorMO = this.newArray.filter((el:any) => el.CONCEPTO === this.valorFactor).map((r:any) => r.DESCRIPCION)[0];
		this.conCambios++;
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

	showModal(mensaje) {
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

	showToast(message:any, type:any, offset:any) {
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
    type, 4500 );
  }

}