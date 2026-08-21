import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DxButtonModule, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxSelectBoxModule,
         DxTextAreaModule,
         DxTextBoxModule, 
         DxTooltipModule, 
         DxTreeListComponent, 
         DxTreeListModule
} from 'devextreme-angular';
import { of, Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { showToast } from '../../shared/toast/toastComponent';
import Swal from 'sweetalert2';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { clsInventarios } from './clsINV210.class';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { INV210Service } from 'src/app/services/INV210/inv210.service';

@Component({
    selector: 'app-INV210',
    templateUrl: './INV210.component.html',
    styleUrls: ['./INV210.component.css'],
    imports: [CommonModule, DxFormModule, DxTextBoxModule, DxDataGridModule, DxSelectBoxModule, DxDropDownBoxModule,
        DxNumberBoxModule, DxCheckBoxModule, VistarapidaComponent, DxLoadPanelModule, DxDateBoxModule,
        DxTreeListModule, DxTextAreaModule, DxButtonModule, DxTooltipModule
    ]
})
export class INV210Component {

  @ViewChild('treeLisGrupos', { static: false }) treeLisGrupos: DxTreeListComponent;
  @ViewChild("GProductos", { static: false }) GProductos: DxDataGridComponent;

  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  subs_filtro: Subscription;
  subs_visor: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
	mnuAccion: string;
  QFiltro: any;

  FInventario: clsInventarios;
  FInventario_prev: any = '';
  DBodegas:any = [];
  DDocumentos:any = [];
  DProductos:any [] = [];
  DGrupos: any = [];
  DObservaciones: any = [];
  datosModificables:any [];
  textCheckAll: any = [];
  permisosUsuario: any = {};
  templateGroup: any = ['ID_GRUPO'];

  // data_prev: any;
  VDatosReg: any;
  USUARIO_LOCAL: any = '';
  objReadOnly:any = {
    readOnly: false,
    readOnlyEstado: false,
    readOnlyGrid: false
  }
  datosValidar:any;
	openDropGrupos: boolean = false;
	activeGreedProductos: boolean = false;
	loadingVisible: boolean = false;
  conCambios: number = 0;

  targetIdTooltip: string;
  tooltipInfo: any = {};
  toolTipVisible: boolean = false;
  widthTooltip: any = 'auto';

  constructor(
    private sData: INV210Service,
    private tabService: TabService,
    private SVisor: SvisorService,
    private _sfiltro: SfiltroService,
		private _sbarreg: SbarraService
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
    
    this.customizeColumns = this.customizeColumns.bind(this);
    this.hoverStateEnabledChange = this.hoverStateEnabledChange.bind(this);
    this.operGrid = this.operGrid.bind(this);

  }

  ngOnInit(): void {
    this.objReadOnly = {
      readOnly: true,
      readOnlyEstado: true,
      readOnlyGrid: true
    }
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.prmUsrAplBarReg = {
			tabla: 'INVENTARIO_FISICO',
      aplicacion: 'INV-210',
			usuario: this.USUARIO_LOCAL,
			accion: 'r_ini',
			error: '',
			r_numReg: 0,
			r_totReg: 0,
			operacion: { r_refrescar: true }
		};
		this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.FInventario = {
      ID_UN: '',
      ID_DOCUMENTO: '',
      DOCUMENTO: [],
      CONSECUTIVO: 0,
      N_CONTEOS: 0,
      TIPO: '',
      ID_UN_BODEGA: '',
      GRUPOS: [],
      ESTADO: '',
      HORA: '',
      FECHA: '',
      OBSERVACION: '',
      PRODUCTOS: [],
      USUARIO: '',
      HORA_AUT: '',
      FECHA_AUT: '',
      USUARIO_AUT: ''
    };
    this.valoresObjetos('grupo productos', '');
    this.valoresObjetos('todos', '');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
		this.subs_filtro.unsubscribe();
		this.subs_visor.unsubscribe();
  }

  customizeColumns(columns:any) {
    var contColm:number = 0;
    let columnData:any = this.FInventario.PRODUCTOS[0];
    this.datosModificables = ['AUTORIZADO', 'RECHAZADO', 'RECONTAR', 'OBSERVACION'];
    // this.datosValidar = this.dataGlobal.ITM[0].DATOS_AUTORIZ.map((obj:any) => Object.keys(obj));
    if (!this.permisosUsuario.APROBAR) {
      this.datosValidar = [];
    } else if (this.permisosUsuario.APROBAR) {
      this.datosValidar = this.datosModificables.flat();
    }
    const reConteo:any = this.FInventario.PRODUCTOS.findIndex((d:any) => d.RECONTAR === true);
    columns.forEach((col:any)=> {
      contColm++;
      
      col.allowHeaderFiltering = true;
      let text:string = col.dataField.replace(/_/g, ' ').toLowerCase().replace(/(?:^|\s)\w/g, function(match:any) {
        return match.toUpperCase();
      });
      if (text.includes("Conteo")) {
        text = text.replace(/Conteo/gi, "Cont-");
        this.datosModificables.push(col.dataField);
        this.datosValidar.push(col.dataField);
        col.allowHeaderFiltering = false;
      };
      if (col.dataField === 'CANTIDAD_RECONTEO') {
        text = 'Reconteo';
        this.datosModificables.push(col.dataField);
        this.datosValidar.push(col.dataField);
        col.allowHeaderFiltering = false;
      }
      col.caption = text;

      if(this.mnuAccion !== 'consulta') {
        if (this.datosModificables.length > 0)
          col.allowEditing = this.datosValidar.includes(col.dataField) ? true : false;
        else
          col.allowEditing = false;
      } else {
        col.allowEditing = false;
      }
      col.visibleIndex = contColm;
      const dataField:string = col.dataField.match('EXIST|CONTEO|TOTAL|VARIACION|CANTIDAD_') ? 'NUMERICO' : col.dataField
      switch (dataField) {
        case 'index':
        case 'ITEM':
        case 'readOnly':
        case 'visible':
        case 'Err_Mensaje':
        case 'ID_UN':
        case 'ID_DOCUMENTO':
        case 'CONSECUTIVO':
        case 'PREFIJO':
        case 'SUFIJO':
        case 'TIPO_INVENTARIO':
          col.visible = false;
          col.allowHeaderFiltering = false;
          break;

        case 'ID_GRUPO':
          col.visible = false;
          // Configurar agrupamiento automático para la columna ID_GRUPO
          col.groupIndex = 0;
          col.groupCellTemplate = "grpTemplateGrupo";
          console.log('Configurando agrupamiento - DGrupos disponibles:', this.DGrupos?.length || 0);
          break;

        case 'PRODUCTO':
        case 'ATRIBUTO':
          col.width = '130px';
          col.visible = true;
          break;

        case 'NOMBRE':
          col.width = '230px';
          col.visible = true;
          break;

        case 'UDM_COMPRA':
          col.width = '80px';
          col.visible = true;
          break;

        case 'NUMERICO':
          col.alignment = "left";
          col.cellTemplate = 'editNumberBox';
          col.width = '130px';
          col.allowHeaderFiltering = false;
          if (col.allowEditing) col.editCellTemplate = 'editNumberBox';
          if (col.dataField.match('EXIST|VARIACION')) {
            if (!this.permisosUsuario.APROBAR) {
              col.visible = false;
            } else if (this.permisosUsuario.APROBAR) {
              col.visible = true;
            }
          } else {
            col.visible = true;
          }
          if (col.dataField === 'CANTIDAD_RECONTEO') {
            if (this.permisosUsuario.APROBAR && reConteo > -1)
              col.visible = true;
            else
              col.visible = false;
          }
          break;

        case 'AUTORIZADO':
        case 'RECHAZADO':
        case 'RECONTAR':
          col.alignment = "center";
          col.cellTemplate = 'editCkeckBox';
          col.width = '120px';
          col.allowHeaderFiltering = false;
          if (col.allowEditing) {
            col.editCellTemplate = 'editCkeckBox';
            col.headerCellTemplate = 'headerTemplateCheck';
          }
          if (!this.permisosUsuario.APROBAR) {
            col.visible = false;
          } else if (this.permisosUsuario.APROBAR) {
            col.visible = true;
          }
          break;
        
        case 'DESCRIPCION':
        case 'OBSERVACION':
          if (!this.permisosUsuario.APROBAR) {
            col.visible = false;
          } else if (this.permisosUsuario.APROBAR) {
            col.visible = true;
          }
          col.width = 'auto';
          col.cellTemplate = 'editSelectBox';
          col.editCellTemplate = 'editSelectBox';
          break;

        case 'ESTADO':
          col.cellTemplate = 'cellTempEstado';
          col.width = '130px';
          if (!this.permisosUsuario.APROBAR) {
            col.visible = false;
          } else if (this.permisosUsuario.APROBAR) {
            col.visible = true;
          }
          break;
      
        default:
          break;
      }

    });
  }

  onRowPrepared(e:any) {
    e.rowElement.style.height = "30px";
    e.rowElement.style.padding = "7px !important";
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          tabla: 'INVENTARIO_FISICO',
          aplicacion: 'INV-210',
          usuario: this.USUARIO_LOCAL,
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
        this.conCambios = 0;
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        if (this.FInventario.ESTADO === 'REGISTRADO' && (this.USUARIO_LOCAL === this.FInventario.USUARIO || this.permisosUsuario.APROBAR)) {
          this.mnuAccion = "update";
          this.conCambios = 0;
          this.opPrepararModificar();
        } else {
          if (this.FInventario.ESTADO === 'AUTORIZADO') showToast('El inventario ha sido AUTORIZADO y no puede modificarce', 'warning');
          if (this.FInventario.ESTADO === 'ANULADO') showToast('El inventario ha sido ANULADO, no puede modificarce', 'warning');
          if (this.USUARIO_LOCAL !== this.FInventario.USUARIO || !this.permisosUsuario.APROBAR) showToast('No tiene permisos para modificar este inventario', 'warning');
          
          this.prmUsrAplBarReg.accion = 'r_cancelar';
          this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }
        break;

      case 'r_guardar':
        this.opPrepararGuardar();
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
            this.mnuAccion = '';
						this.objReadOnly = {
              readOnly: true,
              readOnlyEstado: true,
              readOnlyGrid: true
            };
						this.conCambios = 0;
						// Restituye los valores
            if ( (this.FInventario_prev.ID_DOCUMENTO === '') ) {
              this.opBlanquearForma();
            } else {
              this.FInventario = JSON.parse(JSON.stringify(this.FInventario_prev));
            }
						this.prmUsrAplBarReg.accion = 'r_cancelar';
						this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
					}
				});
        break;

      case "r_vista":
        this.opVista('vista');
        break;

      case 'r_refrescar':
        this.valoresObjetos('todos', '');
        if (this.FInventario.PRODUCTOS.length === 0 && (this.FInventario.ID_UN_BODEGA !== '' && this.FInventario.GRUPOS.length > 0))
          this.valoresObjetos('productos', '');
        else if (this.FInventario.PRODUCTOS.length > 0)
          this.validarTabla(this.FInventario.PRODUCTOS, '');
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
    this.objReadOnly = {
      readOnly: false,
      readOnlyEstado: true,
      readOnlyGrid: false
    }
    this.FInventario_prev = JSON.parse(JSON.stringify(this.FInventario));
    this.FInventario = {
      ID_UN: '',
      ID_DOCUMENTO: '',
      DOCUMENTO: [],
      CONSECUTIVO: 0,
      N_CONTEOS: 0,
      TIPO: 'CONTEO',
      ID_UN_BODEGA: '',
      GRUPOS: [],
      ESTADO: 'REGISTRADO',
      HORA: new Date(),
      FECHA: new Date(),
      OBSERVACION: '',
      PRODUCTOS: [],
      USUARIO: this.USUARIO_LOCAL,
      HORA_AUT: '',
      FECHA_AUT: '',
      USUARIO_AUT: ''
    };
    this.valoresObjetos('documento', '');
	}

	opBlanquearForma(): void {
    this.FInventario = {
      ID_UN: '',
      ID_DOCUMENTO: '',
      DOCUMENTO: [],
      CONSECUTIVO: 0,
      N_CONTEOS: 0,
      TIPO: '',
      ID_UN_BODEGA: '',
      GRUPOS: [],
      ESTADO: '',
      HORA: '',
      FECHA: '',
      OBSERVACION: '',
      PRODUCTOS: [],
      USUARIO: '',
      HORA_AUT: '',
      FECHA_AUT: '',
      USUARIO_AUT: ''
    }
  }

	opEliminar(): void {
    if (this.FInventario.ESTADO === 'REGISTRADO') {
      // Confirma...
      Swal.fire({
        title: '',
        text: '',
        html: "¿Desea <b class='fw-bold'>Anular</b> el Inventario <b class='fw-bold'>" +
              "</b> ?",
        iconHtml: "<i class='icon-alert-ol'></i>",
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#438ef1',
        cancelButtonText: 'No',
        confirmButtonText: 'Sí, anular'
      }).then((result) => {
        // Procesa eliminación. Llama a la API para validar referenciación y 
        // eliminación en tabla
        if (result.isConfirmed) {
          this.AccionEliminar();
        }
      });
    } else {
      Swal.fire({
        title: '',
        text: '',
        html: "¿El inventario fue <b class='fw-bold'> "+this.FInventario.ESTADO+"</b> y no puede Anularce.<b class='fw-bold'>" +
              "</b> ?",
        iconHtml: "<i class='icon-alert-ol'></i>",
        showCancelButton: false,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#438ef1',
        cancelButtonText: 'No',
        confirmButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          // this.AccionEliminar();
        }
      });
    }
   }

	// Ejecuta la eliminación
  AccionEliminar(): void {
    this.FInventario.ESTADO = 'ANULADO';
    this.conCambios++;
    this.mnuAccion = 'update';
    this.opPrepararGuardar();
  }

  opPrepararModificar(): void {
    this.objReadOnly = {
      readOnly: true,
      readOnlyEstado: true,
      readOnlyGrid: false
    }
    this.FInventario_prev = JSON.parse(JSON.stringify(this.FInventario));
	}

  opVista(e: any): void {
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: '',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: ['ID_EMPLEADO|Id Empleado','NOMBRE_COMPLETO|Nombre','ESTADO|Estado'],
      Filtro: '',
      keyGrid: ['ID_EMPLEADO']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opPrepararBuscar(accion:any): void {
		if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Inventario Fisico",
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
      const prm = { INVENTARIO_FISICO: arrFiltro };
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
								this.VDatosReg = datares;
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
                this.objReadOnly = {
                  readOnly: true,
                  readOnlyEstado: true,
                  readOnlyGrid: true
                };
							}
						} else {
							this.VDatosReg = [];
							//notificación
              showToast(datares[0].ErrMensaje, 'warning');
              this.prmUsrAplBarReg.accion = 'r_cancelar';
              this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
							this.opBlanquearForma();
						}
					} catch (error) {
            this.mnuAccion = "";
            this.objReadOnly = {
              readOnly: true,
              readOnlyEstado: true,
              readOnlyGrid: true
            };
            this.loadingVisible = false;
            this._sfiltro.enConsulta = false;
						this.showModal(error, 'Error');
					}
      });
    }
	}

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = "r_numreg";
    let newArray: any;
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
        // this.objReadOnly = {
        //   readOnly: true,
        //   readOnlyEstado: true,
        //   readOnlyGrid: false
        // };
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          newArray =
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        }
				this.opBlanquearForma();
        break;

      default:
        break;
    }

    // this.FInventario = newArray;
    this.FInventario = {
      ID_UN: newArray.ID_UN,
      ID_DOCUMENTO: newArray.ID_DOCUMENTO,
      DOCUMENTO: newArray.ID_DOCUMENTO+'-'+newArray.CONSECUTIVO,
      CONSECUTIVO: newArray.CONSECUTIVO,
      N_CONTEOS: newArray.N_CONTEOS,
      TIPO: newArray.TIPO,
      ID_UN_BODEGA: newArray.ID_UN_BODEGA,
      GRUPOS: JSON.parse(newArray.GRUPOS),
      ESTADO: newArray.ESTADO,
      HORA: newArray.HORA,
      FECHA: new Date(newArray.FECHA),
      OBSERVACION: newArray.DETALLE,
      PRODUCTOS: [],
      USUARIO: newArray.USUARIO,
      HORA_AUT: new Date(newArray.HORA_AUT),
      FECHA_AUT: new Date(newArray.FECHA_AUT),
      USUARIO_AUT: newArray.USUARIO_AUT
    };
    this.valoresObjetos('consulta items', '');
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

  }

  onValueChanged(e:any, campo:string) {
    if (this.mnuAccion.match('new|update')) {
      switch (campo) {
        case 'DOCUMENTO':
          this.FInventario.ID_DOCUMENTO = e;
          this.FInventario.CONSECUTIVO = e;
          this.FInventario.DOCUMENTO = e;
          break;

        case 'ESTADO':
          this.FInventario.ESTADO = e.value;
          break;

        case 'ID_UN_BODEGA':
          this.FInventario.ID_UN_BODEGA = e.value;
          this.validarDatosConsulta();
          break;

        case 'SELECT GRUPOS':
          if (e.value === null || e.value === undefined) {
            this.FInventario.GRUPOS = [];
            this.validarDatosConsulta();
          }
          break;

        case 'GRUPOS':
          const row =  this.treeLisGrupos.instance.getSelectedRowKeys("true");
          this.FInventario.GRUPOS = row;
          break;

        // case 'N_CONTEOS':
        //   if (e.value > 0) {
        //     this.FInventario.N_CONTEOS = e.value;
        //     this.validarDatosConsulta();
        //     // this.validarTabla();
        //   } else {
        //     this.FInventario.N_CONTEOS = e.value;
        //     // this.validarTabla();
        //   }
        //   break;

        case 'OBSERVACION':
          this.FInventario.OBSERVACION = e.value;
          break;
      
        default:
          break;
      }
      this.conCambios++;

    }
  }

  aceptarBottom(e:any) {
    this.openDropGrupos = false;
    if(this.FInventario.GRUPOS.length > 0)
      this.validarDatosConsulta();
    else
      this.FInventario.GRUPOS = [];
  }

  closeBottom(e:any) {
    this.openDropGrupos = false;
    this.FInventario.GRUPOS = [];
  }

  // Operaciones de grid
  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'AGREGAR COLUMNA':
        if (this.FInventario.PRODUCTOS.length > 0 )
          this.validarTabla(this.FInventario.PRODUCTOS, operacion);
        else
          this.validarTabla(this.DProductos, operacion);
        break;

      case 'ELIMINAR COLUMNA':
        var n_cont:any = this.FInventario.N_CONTEOS;
        const productos:any = JSON.parse(JSON.stringify(this.FInventario.PRODUCTOS));
        this.FInventario.PRODUCTOS = productos.map((prod:any) => {
          delete prod[`CONTEO${n_cont}`];
          return prod;
        });
        n_cont--;
        this.FInventario.N_CONTEOS = n_cont;
        // this.GProductos.instance.refresh();
        break;

      default:
        break;
    }
  }

  hoverStateEnabledChange(e:any) {
    if (e.eventType === "mouseover") {
      this.targetIdTooltip = e.cellElement;
      this.widthTooltip = 'auto';
      this.tooltipInfo = { 
        INFO: 'Agregar Columna'
      };
      this.toolTipVisible = true;
    } else {
      this.toolTipVisible = false;
    }
  }

  templateHtml(columna:any, element:any): any {
    let res:any = '';
    
    try {
      // Obtener el ID del grupo desde la clave de agrupamiento
      const grupoId = columna.row.data.key;
      
      // Buscar la información del grupo
      const infoGrupo = this.DGrupos.find((d:any) => d.ID_GRUPO === grupoId);
      
      if (infoGrupo) {
        switch (element) {
          case 'ID_GRUPO':
            res = infoGrupo.ID_GRUPO || grupoId;
            break;
          case 'NOMBRE':
            res = infoGrupo.NOMBRE || '';
            break;
          default:
            res = '';
            break;
        }
      } else {
        // Si no se encuentra el grupo, mostrar el ID directamente
        switch (element) {
          case 'ID_GRUPO':
            res = grupoId || 'Sin Grupo';
            break;
          case 'NOMBRE':
            res = '';
            break;
          default:
            res = '';
            break;
        }
      }
    } catch (error) {
      console.warn('Error en templateHtml:', error);
      res = element === 'ID_GRUPO' ? 'Sin Grupo' : '';
    }
    
    return res;
  }


  getDataValueCheckHeader(cellInfo:any, campo:string) {
    var res:any;
    switch (campo) {
      case 'header':
        const npos:any = this.textCheckAll.findIndex((d:any) => d.DATAFIELD === cellInfo.column.dataField);
        if(npos > -1) {
          this.textCheckAll[npos].VALUE = this.textCheckAll[npos].VALUE || false;
          res = this.textCheckAll[npos].VALUE;
        } else {
          res = false;
        }
        break;

      default:
        res = false;
        break;
    }
    return of(res);
  }

  onValueChangedValue(e:any, cellInfo:any) {
    if(this.mnuAccion !== 'consulta') {
      const dato:any = cellInfo.column.dataField.match('CONTEO') ? 'CONTEO' : cellInfo.column.dataField;
      switch (dato) {
        case 'CONTEO':
          cellInfo.data[cellInfo.column.dataField] = e.value;
          this.GProductos.instance.cellValue(cellInfo.rowIndex, cellInfo.column.dataField, cellInfo.data[cellInfo.column.dataField]);

          //VERIFICA CONTEOS Y CALCULA TOTALES
          var DCont:any = [];
          for (let key in cellInfo.data) {
            if (key.match('CONTEO')) {
              DCont.push({Cont: cellInfo.data[key]});
            }
          }
          //Total Conteos
          if (DCont.length > 0) {
            const subTotal: number = DCont.reduce( (acc:any, item:any) => {
              return acc += item.Cont;
            }, 0);
            cellInfo.data.TOTAL_CONT = subTotal;
          } else {
            cellInfo.data.TOTAL_CONT = 0;
          }
          //Variación
          cellInfo.data.VARIACION = (cellInfo.data.EXISTENCIAS - cellInfo.data.TOTAL_CONT);
          //Estado
          if (cellInfo.data.VARIACION === 0)
            cellInfo.data.ESTADO = 'CONFIABLE';
          else if (cellInfo.data.VARIACION > 0)
            cellInfo.data.ESTADO = 'SOBRANTE';
          else if (cellInfo.data.VARIACION < 0)
            cellInfo.data.ESTADO = 'FALTANTE';


          this.GProductos.instance.cellValue(cellInfo.rowIndex, 'TOTAL_CONT', cellInfo.data.TOTAL_CONT);
          this.GProductos.instance.cellValue(cellInfo.rowIndex, 'VARIACION', cellInfo.data.VARIACION);
          this.GProductos.instance.cellValue(cellInfo.rowIndex, 'ESTADO', cellInfo.data.ESTADO);

          break;
          
        case 'OBSERVACION':
          cellInfo.data[cellInfo.column.dataField] = e.value;
          break;

        case 'AUTORIZADO':
        case 'RECHAZADO':
        case 'RECONTAR':
          cellInfo.data[cellInfo.column.dataField] = e.value;
          break;
      
        default:
          break;
      }
      
      // this.GProductos.instance.cellValue(cellInfo.rowIndex, cellInfo.column.dataField, cellInfo.data[cellInfo.column.dataField]);
      // this.GProductos.instance.cellValue(cellInfo.rowIndex, 'AUTORIZADO', cellInfo.data.AUTORIZADO);
      // this.GProductos.instance.cellValue(cellInfo.rowIndex, 'RECHAZADO', cellInfo.data.RECHAZADO);
      // this.GProductos.instance.cellValue(cellInfo.rowIndex, 'ESTADO', cellInfo.data.ESTADO);
      this.conCambios++;
    }
  }

  onValueChangedCheck(e:any, cellInfo:any) {
    switch (cellInfo.rowType) {
      case 'header':
        if (e.event) {
          for (let j = 0; j < this.textCheckAll.length; j++) {
            if(this.textCheckAll[j].DATAFIELD === cellInfo.column.dataField)
              this.textCheckAll[j].VALUE = e.value;
            else
              this.textCheckAll[j].VALUE = false;
          }
          //Autoriza/Rechaza todos los items.
          for (let i = 0; i < this.FInventario.PRODUCTOS.length; i++) {
            var element = this.FInventario.PRODUCTOS[i];
            switch (cellInfo.column.dataField) {
              case 'AUTORIZADO':
                element.AUTORIZADO = e.value;
                element.RECHAZADO = false;
                element.RECONTAR = false;
                break;
        
              case 'RECHAZADO':
                element.AUTORIZADO = false;
                element.RECHAZADO = e.value;
                element.RECONTAR = false;
                break;

              case 'RECONTAR':
                element.AUTORIZADO = false;
                element.RECHAZADO = false;
                element.RECONTAR = e.value;
                break;
            
              default:
                break;
            }
            this.GProductos.instance.cellValue(i, 'AUTORIZADO', element.AUTORIZADO);
            this.GProductos.instance.cellValue(i, 'RECHAZADO', element.RECHAZADO);
            this.GProductos.instance.cellValue(i, 'RECONTAR', element.RECONTAR);
          }
        }
        break;
    
      default:
        break;
    }
    if(this.mnuAccion !== 'consulta') {
      this.conCambios++;
      // this.validarItmes();
    }
  }


  getDataValue(cellInfo:any, campo:string) {
    var res:any;
    const objData:any = JSON.parse(JSON.stringify(cellInfo.data));
    var objEditing:any = [];
    var data_valid:any = JSON.parse(JSON.stringify(this.datosModificables));
    if(this.mnuAccion !== 'consulta')
      objEditing = data_valid;
    else
      objEditing= [];

    switch (campo) {
      case 'value':
        switch (cellInfo.column.dataType) {
          case 'boolean':
            res = objData[cellInfo.column.dataField] || false;
            break;
    
          case 'string':
            res = objData[cellInfo.column.dataField] || '';
            break;
    
          case 'number':
            res = objData[cellInfo.column.dataField] || 0;
            break;
    
          case 'time':
            res = objData[cellInfo.column.dataField] || null;
            break;
    
          case 'date':
            res = objData[cellInfo.column.dataField] || null;
            break;
        
          default:
            break;
        }
        break;

      case 'readOnly':
        switch (cellInfo.column.dataType) {
          case 'boolean':
            res = objEditing.includes(cellInfo.column.dataField) ? false : true;
            break;
    
          case 'string':
            res = objEditing.includes(cellInfo.column.dataField) ? false : true;
            break;
    
          case 'number':
            res = objEditing.includes(cellInfo.column.dataField) ? false : true;
            break;
    
          case 'time':
            res = objEditing.includes(cellInfo.column.dataField) ? false : true;
            break;
    
          case 'date':
            res = objEditing.includes(cellInfo.column.dataField) ? false : true;
            break;
        
          default:
            res = true;
            break;
        }
        break;
    
      default:
        break;
    }

    return of(res);
  }

  validarDatosConsulta() {
    if (this.FInventario.ID_UN_BODEGA !== '' && this.FInventario.GRUPOS.length > 0 ) {
      this.activeGreedProductos = true;
      this.valoresObjetos('productos', '');
    } else {
      // this.FInventario.GRUPOS = [];
      this.activeGreedProductos = false;
    }
  }

  validarTabla(productos:any, accion:string) {
    // Validar que productos sea un array válido
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      this.FInventario.PRODUCTOS = [];
      this.activeGreedProductos = false;
      return;
    }
    
    try {
      this.FInventario.PRODUCTOS = productos.map((pro:any) => {
        let nuevoProducto:any = {
          ID_GRUPO: (pro.ID_GRUPO !== null && pro.ID_GRUPO !== undefined && pro.ID_GRUPO !== '') ? pro.ID_GRUPO : '',
          PRODUCTO: (pro.PRODUCTO !== null && pro.PRODUCTO !== undefined) ? pro.PRODUCTO : '',
          NOMBRE: (pro.NOMBRE !== null && pro.NOMBRE !== undefined) ? pro.NOMBRE : '',
          ATRIBUTO: (pro.ATRIBUTO !== null && pro.ATRIBUTO !== undefined) ? pro.ATRIBUTO : '',
          UDM_COMPRA: (pro.UDM_COMPRA !== null && pro.UDM_COMPRA !== undefined) ? pro.UDM_COMPRA : '',
          EXISTENCIAS: (pro.EXISTENCIAS !== null && pro.EXISTENCIAS !== undefined) ? pro.EXISTENCIAS : 0,
        };
        //conteo por defecto
        nuevoProducto.CONTEO1 = (pro.CONTEO1 !== null && pro.CONTEO1 !== undefined) ? pro.CONTEO1 : 0;
    
        // Añadir los campos de conteo por el usuario
        if (accion === 'AGREGAR COLUMNA') {
          var n_cont:any = Object.keys(this.FInventario.PRODUCTOS[0]).filter(key => key.startsWith("CONTEO")).length;
          n_cont++;
          for (let i = 1; i <= n_cont; i++) {
            nuevoProducto[`CONTEO${i}`] = pro[`CONTEO${i}`] || 0;
          }
          this.FInventario.N_CONTEOS = n_cont;
        };
        if (accion === 'CONSULTA') {
          var n_cont:any = Object.keys(pro).filter(key => key.startsWith("CONTEO")).length;
          for (let i = 1; i <= n_cont; i++) {
            nuevoProducto[`CONTEO${i}`] = pro[`CONTEO${i}`] || 0;
          }
          this.FInventario.N_CONTEOS = n_cont;
        };
    
        // Añadir el resto de las propiedades en el orden deseado
        nuevoProducto.TOTAL_CONT = (pro.TOTAL_CONT !== null && pro.TOTAL_CONT !== undefined) ? pro.TOTAL_CONT : 0;
        nuevoProducto.CANTIDAD_RECONTEO = (pro.CANTIDAD_RECONTEO !== null && pro.CANTIDAD_RECONTEO !== undefined) ? pro.CANTIDAD_RECONTEO : 0;
        nuevoProducto.VARIACION = (pro.VARIACION !== null && pro.VARIACION !== undefined) ? pro.VARIACION : 0;
        nuevoProducto.AUTORIZADO = (pro.AUTORIZADO !== null && pro.AUTORIZADO !== undefined) ? pro.AUTORIZADO : false;
        nuevoProducto.RECHAZADO = (pro.RECHAZADO !== null && pro.RECHAZADO !== undefined) ? pro.RECHAZADO : false;
        nuevoProducto.RECONTAR = (pro.RECONTAR !== null && pro.RECONTAR !== undefined) ? pro.RECONTAR : false;
        nuevoProducto.OBSERVACION = (pro.OBSERVACION !== null && pro.OBSERVACION !== undefined) ? pro.OBSERVACION : '';
        nuevoProducto.ITEM = (pro.ITEM !== null && pro.ITEM !== undefined) ? pro.ITEM : (this.FInventario.PRODUCTOS.length + 1);
        
        if (nuevoProducto.VARIACION === 0)
          nuevoProducto.ESTADO = (pro.ESTADO !== null && pro.ESTADO !== undefined) ? pro.ESTADO : 'CONFIABLE';
        else if (nuevoProducto.VARIACION > 0)
          nuevoProducto.ESTADO = (pro.ESTADO !== null && pro.ESTADO !== undefined) ? pro.ESTADO : 'SOBRANTE';
        else if (nuevoProducto.VARIACION < 0)
          nuevoProducto.ESTADO = (pro.ESTADO !== null && pro.ESTADO !== undefined) ? pro.ESTADO : 'FALTANTE';
          
        return nuevoProducto;
      });
      
      this.activeGreedProductos = true;
      this.loadingVisible = false;
      
      // Refrescar la grilla para aplicar el agrupamiento
      setTimeout(() => {
        if (this.GProductos) {
          // Solo refrescar si tenemos grupos disponibles
          if (this.DGrupos && this.DGrupos.length > 0) {
            this.GProductos.instance.refresh();
          }
        }
      }, 100);
    } catch (error) {
      console.error('Error en validarTabla:', error);
      this.FInventario.PRODUCTOS = [];
      this.activeGreedProductos = false;
      this.loadingVisible = false;
      showToast('Error al procesar los datos de productos', 'error');
    }
  }

  validarDatos() {
    let datos_true: boolean[] = [];
    for (let i = 0; i < this.FInventario.PRODUCTOS.length; i++) {
      const item = this.FInventario.PRODUCTOS[i];
      let itemValid = false;
      // Verificar si algún dato de la fila necesita ser validado
      for (let key in item) {
        if (this.datosValidar.includes(key)) {
          const data_prev = [item];
          if (data_prev.some((d:any) => d[key] === true || d[key] > 0)) {
            datos_true.push(true);
            itemValid = true;
            break;
          }
        }
      }
      // Si la fila no necesita validación, agregamos false a datos_true
      if (!itemValid) {
        datos_true.push(false);
      }
    }
    // Si todos los datos son true, entonces res es true
    const res = datos_true.every(dato => dato === true);

    return res;
  }

  opPrepararGuardar() {
		if ( this.conCambios > 0 ) {
      var ENCA:any = {}
      // if (this.validarDatos()) {
        this.loadingVisible = true;
        if (this.mnuAccion === 'new') {
          ENCA = {
            ID_UN: this.FInventario.ID_UN,
            ID_DOCUMENTO: this.FInventario.ID_DOCUMENTO,
            DOCUMENTO: this.FInventario.DOCUMENTO,
            CONSECUTIVO: this.FInventario.CONSECUTIVO,
            N_CONTEOS: this.FInventario.N_CONTEOS,
            TIPO: this.FInventario.TIPO,
            ID_UN_BODEGA: this.FInventario.ID_UN_BODEGA,
            GRUPOS: this.FInventario.GRUPOS,
            ESTADO: this.FInventario.ESTADO,
            HORA: this.FInventario.HORA,
            FECHA: this.FInventario.FECHA,
            OBSERVACION: this.FInventario.OBSERVACION,
            USUARIO: this.FInventario.USUARIO,
            HORA_AUT: '',
            FECHA_AUT: '',
            USUARIO_AUT: ''
          };
        } else if (this.mnuAccion === 'update') {
          const aut:any = this.FInventario.PRODUCTOS.findIndex((d:any) => d.AUTORIZADO === true);
          const rech:any = this.FInventario.PRODUCTOS.findIndex((d:any) => d.RECHAZADO === true);
          const reCont:any = this.FInventario.PRODUCTOS.findIndex((d:any) => d.RECONTAR === true);
          if ( this.FInventario.ESTADO === 'REGISTRADO' && ( aut > -1 || rech > -1) && reCont < -1 ) {
            this.FInventario.ESTADO = 'AUTORIZADO';
          } else if ( this.FInventario.ESTADO === 'REGISTRADO' && reCont > -1 ) {
            this.FInventario.ESTADO = 'RECONTEO';
          };
          ENCA = {
            ID_UN: this.FInventario.ID_UN,
            ID_DOCUMENTO: this.FInventario.ID_DOCUMENTO,
            DOCUMENTO: this.FInventario.DOCUMENTO,
            CONSECUTIVO: this.FInventario.CONSECUTIVO,
            N_CONTEOS: this.FInventario.N_CONTEOS,
            TIPO: this.FInventario.TIPO,
            ID_UN_BODEGA: this.FInventario.ID_UN_BODEGA,
            GRUPOS: this.FInventario.GRUPOS,
            ESTADO: this.FInventario.ESTADO,
            HORA: this.FInventario.HORA,
            FECHA: this.FInventario.FECHA,
            OBSERVACION: this.FInventario.OBSERVACION,
            USUARIO: this.FInventario.USUARIO,
            HORA_AUT: new Date(),
            FECHA_AUT: new Date(),
            USUARIO_AUT: this.USUARIO_LOCAL
          };
        }
        
        const prmDatos:any = {ENCABEZADO: ENCA, ITEMS: this.FInventario.PRODUCTOS };
        this.sData.save(this.mnuAccion, prmDatos).subscribe((resp) => {
          this.loadingVisible = false;
          const res = JSON.parse(resp.data);
          if ( (resp.token != undefined) ){
            const refreshToken = resp.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== ""){
            this.showModal(res[0].ErrMensaje, 'Error');
          }  else {
            // Operaciones de barra
            if (this.mnuAccion === 'new') {
              this.QFiltro = "DOCUMENTO='"+this.FInventario.DOCUMENTO+"'";
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
            this.objReadOnly = {
              readOnly: true,
              readOnlyEstado: true,
              readOnlyGrid: true
            };
            showToast('Registro actualizado', 'success');
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          }
        });
      // } else {
      //   showToast('No se han validado todos los Items cargados. Hay Conteos en Cero(0).', 'error');
      // }
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
      this.objReadOnly = {
        readOnly: true,
        readOnlyEstado: true,
        readOnlyGrid: true
      };
      this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
		}

  }
  
  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, data:any){
    if (obj === 'todos') {
      const prm = { ID_APLICACION : this.prmUsrAplBarReg.aplicacion, USUARIO: this.USUARIO_LOCAL};
      this.sData.consulta('PERMISOS USUARIO', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        } else {
          this.permisosUsuario = res[0];
        }
      });
    };
    if (obj === 'documento') {
      const prm = { ID_APLICACION : this.prmUsrAplBarReg.aplicacion, USUARIO: this.USUARIO_LOCAL};
      this.sData
      .consulta('DOCUMENTOS CONSECUTIVO', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        } else {
          // this.DDocumentos = res;
          if(res !== null && res.length === 1 && !this.objReadOnly.readOnly){
            this.FInventario.DOCUMENTO = res[0].DOCUMENTO;
            this.FInventario.ID_DOCUMENTO = res[0].ID_DOCUMENTO;
            this.FInventario.CONSECUTIVO = res[0].CONSECUTIVO;
            this.conCambios++;
          }
        }
      });
    };
    if (obj === 'bodegas' || obj === 'todos') {
      const prm = { USUARIO: localStorage.getItem('usuario')};
      this.sData
      .consulta('BODEGAS USUARIO', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        } else {
          this.DBodegas = res;
        }
      });
    };
    if (obj === 'grupo productos' || obj === 'todos') {
      //CONSULTA GRUPOS PRODUCTOS
      const prm:any = {ESTADO: 'ACTIVO'};
      this.sData.consulta('GRUPOS', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        } else {
          res.push({ ID_GRUPO:"RAIZ", NOMBRE: "Raíz" });
          res.push({ ID_GRUPO:"SIN_GRUPO", NOMBRE: "Sin Grupo" });
          this.DGrupos = res;
          console.log('Grupos cargados:', this.DGrupos.length);
          
          // Refrescar la grilla si ya tiene datos para aplicar el agrupamiento
          if (this.GProductos && this.FInventario.PRODUCTOS && this.FInventario.PRODUCTOS.length > 0) {
            console.log('Refrescando grilla después de cargar grupos');
            setTimeout(() => {
              this.GProductos.instance.refresh();
            }, 100);
          }
        }
      });
    };
    if (obj === 'dominios' || obj === 'todos') {
      const prm:any = { };
      this.sData.consulta('DOMINIOS', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        } else {
          this.DObservaciones = res;
        }
      });
    };
    if (obj === 'productos') {
      const prm = { BODEGA: this.FInventario.ID_UN_BODEGA, GRUPOS: this.FInventario.GRUPOS.join() };
      this.sData
      .consulta('PRODUCTOS BODEGAS', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        this.loadingVisible = true;
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
          this.loadingVisible = false;
        } else {
          for (let i = 0; i < res.length; i++) {
            res[i].ITEM = i;
          }
          this.DProductos = res;
          this.validarTabla(this.DProductos, '');
        }
      });
    };
    if (obj === 'consulta items') {
      const prm:any = { ID_DOCUMENTO: this.FInventario.ID_DOCUMENTO, CONSECUTIVO: this.FInventario.CONSECUTIVO };
      this.sData.consulta('consulta items', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        } else {
          // Asegurar que los grupos estén cargados antes de procesar los productos
          if (this.DGrupos.length === 0) {
            this.valoresObjetos('grupo productos', '');
          }
          this.validarTabla(res, 'CONSULTA');
        }
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
