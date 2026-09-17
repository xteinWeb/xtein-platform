import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DxDataGridComponent, DxDataGridModule, DxLoadPanelModule } from 'devextreme-angular';
import { ADM225Service } from 'src/app/services/ADM225/ADM225.service';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { ADM25501Component } from './ADM25501/ADM25501.component';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { showToast } from '../../shared/toast/toastComponent.js';
import Swal from 'sweetalert2';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorImgComponent } from 'src/app/shared/visor-img/visor-img.component';
import { validatorRes } from 'src/app/shared/validator/validator.js';

@Component({
  selector: 'app-ADM225',
  templateUrl: './ADM225.component.html',
  styleUrls: ['./ADM225.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, VistarapidaComponent, DxLoadPanelModule, ADM25501Component,
            VisorImgComponent
  ],
})
export class ADM225Component {

  @ViewChild("gridAutorizaciones", { static: false }) gridAutorizaciones: DxDataGridComponent;

  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  subs_filtro: Subscription;
  subs_visor: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;

  eventsDatos: Subject<any> = new Subject<any>();

  DgAutorizaciones: any = [];
  DgAutorizaciones_prev: any = [];
  readOnly: boolean = true;
  templateGroup: any = ['ID_APLICACION'];
  conCambios: number = 0;
  accion: string = '';
  USUARIO_LOCAL: any = '';
  ID_UN_USUARIO: any = '';
  
  VDatosReg: any;
  QFiltro: any;
  mnuAccion: string;
  
  loadingVisible:boolean = false;
  

  constructor(
    private sData: ADM225Service,
		private _sbarreg: SbarraService,
    private SVisor: SvisorService,
    private tabService: TabService,
    private _sfiltro: SfiltroService,
    private _sgenerales: GeneralesService,
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
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion) {
        this.opPrepararBuscar(resp);
        this.mnuAccion = "consulta";
      }
    });

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex((d:any) => d.PRODUCTO === resp.PRODUCTO);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx+1;
        this.opIrARegistro('r_numreg');
      }
    });

    this.valoresObjetos = this.valoresObjetos.bind(this);
    
  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.ID_UN_USUARIO = localStorage.getItem('empresa')?.toUpperCase();
    this.mnuAccion = "init";
    this.prmUsrAplBarReg = {
      tabla: 'AUTORIZACION_WEB',
      aplicacion: 'ADM-225',
      usuario: this.USUARIO_LOCAL,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: {r_nuevo: false, r_modificar: false, r_refrescar: true}
    };
		this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    setTimeout(() => {
      this.valoresObjetos('autorizaciones', '');
    }, 300);
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
        this.mnuAccion = "init";
        this.prmUsrAplBarReg = {
          tabla: 'AUTORIZACION_WEB',
          aplicacion: 'ADM-225',
          usuario: this.USUARIO_LOCAL,
					accion: "r_ini",
					error: "",
					r_numReg: 0,
					r_totReg: 0,
					operacion: {r_nuevo: false, r_modificar: false, r_refrescar: true}
				};
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

			case 'r_nuevo':
				// this.mnuAccion = "new";
        this.readOnly = false;
				this.opPrepararNuevo();
				break;

			case 'r_modificar':
				// this.mnuAccion = "update";
				this.opPrepararModificar();
				break;

			case 'r_guardar':
				// this.opPrepararGuardar(this.mnuAccion);
				break;

			case 'r_buscar':
        // this._sdatos.accion = 'consultar';
				if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
				if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
				break;

			case 'r_buscar_ejec':
        // this._sdatos.accion = 'consultar';
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
					}).then((result:any) => {
					if (result.isConfirmed) {
						this.readOnly = true;
						this.conCambios = 0;

            this.mnuAccion = "";

						this.prmUsrAplBarReg.accion = 'r_cancelar';
						this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
					}
          
				});
				break;

			case "r_vista":
        this.opVista();
        break;

      case 'r_refrescar':
        this.mnuAccion = "init";
        this.valoresObjetos('autorizaciones', '');
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

  opPrepararGuardar(e:any) {
    this.loadingVisible = true;
		const prmDatos:any = e.DATA;
    this.sData
    .save('UPDATE AUTORIZACION', prmDatos)
    .subscribe((resp) => {
      this.loadingVisible = false;
      const res = JSON.parse(resp.data);
      if (res[0].ErrMensaje !== ""){
        this.showModal(res[0].ErrMensaje, 'Error');
      }  else {
        this.valoresObjetos('autorizaciones', '');
        showToast("Registro actualizado", 'success');
      }
    });

  }

  opPrepararNuevo(): void {

	}

  opBlanquearForma(): void {
    
  }

  opPrepararModificar(): void {
    this.readOnly = false;
	}

  opPrepararBuscar(accion:any): void {
		if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Autorizaciones",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      this.mnuAccion = "consulta";
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      const arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { AUTORIZACION_WEB: arrFiltro };
      this.loadingVisible = true;
      // Ejecuta búsqueda API
      this.sData
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
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
								this.QFiltro = datares[0].QFILTRO;
                datares.forEach((item:any) => {
                  item.ITM.forEach((ite:any) => {
                    ite.DATOS = JSON.parse(ite.DATOS);
                    ite.DATOS_AUTORIZ = JSON.parse(ite.DATOS_AUTORIZ);
                    for (let i = 0; i < ite.DATOS.length; i++) {
                      ite.DATOS[i].ITEM = ite.ITEM;
                      const newData:any [] = {...ite.DATOS[i], ...ite.DATOS_AUTORIZ[0], OBSERVACIONES: ite.OBSERVACIONES};
                      ite.DATOS[i] = newData;
                    }
                  });
                });
                //Itera las Autorizaciones por aplicación
                // Paso 1: Obtener todos los valores únicos del campo 'ID_APLICACION'
                const valoresUnicos = [...new Set(datares.map((objeto:any) => objeto.ID_APLICACION))];
                // Paso 2: Iterar sobre cada valor único y filtrar los datos correspondientes
                const datosFiltrados = valoresUnicos.map(valor => {
                  return {
                    ID_APLICACION: valor,
                    DATOS: datares.filter((objeto:any) => objeto.ID_APLICACION === valor)
                  };
                });
								this.VDatosReg = datosFiltrados;
                // Prepara la barra para navegación
                this.prmUsrAplBarReg = {...this.prmUsrAplBarReg,
                  r_totReg: datosFiltrados.length,
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
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        }
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length > 0) {
          newArray = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        } else {
          this.opBlanquearForma();
        }
        break;

      default:
        break;
    }

    this.DgAutorizaciones = JSON.parse(JSON.stringify(newArray.DATOS));
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
  }

  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: "Autorizaciones",
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: ['AUTORIZACION|Autorizacion','ID_APLICACION|Aplicacion','FECHA|Fecha de Registro','ESTADO|Estado'],
      Filtro: '',
      keyGrid: ['ID_APLICACION']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opEliminar(): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html: "¿Desea <b class='fw-bold'>eliminar</b> la Autorización <b class='fw-bold'>" +
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
  AccionEliminar(): void { }

  onRespuestaComponent(datos:any) {
    switch (datos.ACCION) {
      case 'guardar datos':
        this.opPrepararGuardar(datos);
        break;
      case 'validar datos':
        // this.valoresObjetos(datos.ACCION, datos.PRM);
        break;
    
      default:
        break;
    }
  }

  onSelectionExpand(e:any) {
    if (e.key !== undefined){
      // e.component.expandRow(e.key.ID_DOCUMENTO, e.key.CONSECUTIVO);
      const datos:any [] = this.DgAutorizaciones.filter((d:any) => d.CONSECUTIVO === e.key);
      if (datos.length > 0) {
        setTimeout(() => {
          this.eventsDatos.next({
            accion: this.mnuAccion,
            dataSource: JSON.parse(JSON.stringify(datos[0]))
          });
        }, 100);
      }
    }
  }

  onContextMenuPreparing(e:any) {
    if (e.row.rowType === "data") {
      let items: any = [];
      const selectedItems = [e.row.key];

      if (selectedItems.length === 0) {
        items = [
          {
            text: "No hay filas seleccionadas.",
            disabled: true
          }
        ];
      } else {
        items.push(
          {
            text: "Imprimir",
            onClick: () => {
              this.valoresObjetos('reportes', e.row.data.ID_APLICACION);
            }
          }
        );
      }
      e.items = items;
    }
  }

  templateHtml(columna:any, element:any): any {
    let cad = [{ ID_APLICACION: '', NOMBRE_APLICACION: ''}];
    let res:any='';
    this.templateGroup.forEach((col:any) => {
      if (columna.row.data.items !== null) {
        cad[0].ID_APLICACION = columna.row.data.items[0].ID_APLICACION;
        cad[0].NOMBRE_APLICACION = columna.row.data.items[0].NOMBRE_APLICACION;
        switch (element) {
          case 'ID_APLICACION':
            res = cad[0].ID_APLICACION;
            break;
          case 'NOMBRE_APLICACION':
            res = cad[0].NOMBRE_APLICACION;
            break;
          default:
            break;
        }
      }
      if (columna.row.data.collapsedItems !== undefined) {
        cad[0].ID_APLICACION = columna.row.data.collapsedItems[0].ID_APLICACION;
        cad[0].NOMBRE_APLICACION = columna.row.data.collapsedItems[0].NOMBRE_APLICACION;
        switch (element) {
          case 'ID_APLICACION':
            res = cad[0].ID_APLICACION;
            break;
          case 'NOMBRE_APLICACION':
            res = cad[0].NOMBRE_APLICACION;
            break;
          default:
            break;
        }
      }
    });
    return res;
  }

  valoresObjetos(obj:string, data:any) {
    if (obj === 'autorizaciones') {
      this.loadingVisible = true;
      const prm = { USUARIO : this.USUARIO_LOCAL};
      this.sData.consulta('AUTORIZACIONES PENDIENTES', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        this.loadingVisible = false;
        const res = validatorRes(data);
        if ( (data.token !== undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.showModal(mensaje, 'Error');
          this.DgAutorizaciones = [];
        } else {
          newArray.forEach((item:any) => {
            item.ITM.forEach((ite:any) => {
              for (let i = 0; i < ite.DATOS.length; i++) {
                ite.DATOS[i].ITEM = ite.ITEM;
                if (ite.DATOS_AUTORIZ !== undefined && ite.DATOS_AUTORIZ !== null && ite.DATOS_AUTORIZ.length > 0) {
                  if (ite.DATOS_AUTORIZ[0].MODIFICABLE) {
                    if (ite.DATOS_AUTORIZ[0].MODIFICABLE.length > 0) {
                      for (let j = 0; j < ite.DATOS_AUTORIZ[0].MODIFICABLE.length; j++) {
                        const ele = ite.DATOS_AUTORIZ[0].MODIFICABLE[j];
                        ite.DATOS[i] = {...ite.DATOS[i], ['AUT_'+ele.CAMPO]:ele.VALOR_DEFECTO};
                      }
                    }
                  }
                  const newData:any [] = {...ite.DATOS[i], ...ite.DATOS_AUTORIZ[0]};
                  ite.DATOS[i] = newData;
                } else {
                  const newData:any [] = {...ite.DATOS[i]};
                  ite.DATOS[i] = newData;
                }
              }
            });
          });
          this.DgAutorizaciones_prev = newArray;
          this.DgAutorizaciones = JSON.parse(JSON.stringify(this.DgAutorizaciones_prev));
          this.gridAutorizaciones.instance.refresh();
        }
      },
        ((err:any) => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    if (obj === 'reportes' || obj === 'todos') {
      const prm = { ID_APLICACION: 'COM-203' }
      this.sData.listaInformes(prm).subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const datosrpt = res.filter((d:any) => d.ID_REPORTE === 'COM-206-001');
        if (datosrpt.length > 0) {
          this.imprimirReporte(datosrpt[0].ID_REPORTE, datosrpt[0].ARCHIVO, datosrpt[0]);
        } else {
          showToast('No se encontró el reporte solicitado.', 'warning');
        }
      },
        ((err:any) => {
          this.showModal(err.message, 'Error');
        })
      );
    }
    
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
