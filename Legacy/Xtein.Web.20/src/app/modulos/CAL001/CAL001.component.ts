import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridModule, DxDateBoxModule, DxDropDownBoxComponent, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxSelectBoxComponent, DxSelectBoxModule, DxTextAreaModule, DxTextBoxModule, DxToolbarModule, DxTooltipModule, DxTreeListModule, DxValidatorModule } from 'devextreme-angular';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { CAL001Service } from './Service/CAL001.service'
import Swal from 'sweetalert2';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { showToast } from '../../shared/toast/toastComponent.js';
import { MCalidad, MNoConformidad } from 'src/app/modulos/CAL001/clsCAL001.class';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { exportDataGrid as pdfexport } from 'devextreme/pdf_exporter';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-CAL001',
  templateUrl: './CAL001.component.html',
  styleUrls: ['./CAL001.component.css'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxDropDownBoxModule, DxValidatorModule,
    DxDataGridModule, DxButtonModule, DxTextBoxModule,
    DxDateBoxModule, DxTextAreaModule, DxNumberBoxModule, DxLoadPanelModule,
    DxToolbarModule, DxSelectBoxModule, DxTooltipModule, DxTreeListModule
  ],
})
export class CAL001Component {

  @ViewChild("formCalidad", { static: false }) formCalidad: DxFormComponent;
  @ViewChild("formNoConformidad", { static: false }) formNoConformidad: DxFormComponent;
  @ViewChild("dropSelectCliente", { static: false }) dropSelectCliente: DxDropDownBoxComponent;
  @ViewChild("dropSelectIdGestor", { static: false }) dropSelectIdGestor: DxSelectBoxComponent;

  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  subs_filtro: Subscription;
  subs_visor: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string = '';

  FCalidad: any = MCalidad;
  FNoConformidad: any = MNoConformidad;
  DGEmpleados: any[] = [];
  DGAreas: any[] = [];
  DGProductos: any = [];
  DGCausas: any = [];
  DGCausasNormativa: any = [];
  DGConformidades: any = [];
  DGClientes: any = [];
  DGCausasClientes: any = [];
  DGseccion: any = [];
  DGseccion_prev: any = [];
  tiposNoConformidades: any = [];
  selectNoConformidad: any = [];
  selectCausaCliente: any = [];
  selectIdGestor: any = [];
  selectCausante: any = [];
  selectCausa: any = [];
  selectAreaDeteccion: any = [];
  selectAreaAsociada: any = [];
  selectProducto: any = [];
  selectArea: any = [];
  selectTipoForm: any = [];
  selectCliente: any = [];
  selectPieza: any = [];
  tipoForm: any[] = [];
  tipoDatos: any[] = [];
  tipoDatos_prev: any[] = [];
  tipoDatosAreas: any[] = [];
  piezas: any[] = [];
  DidGestores: any[] = [];
  valoresDefecto: any[] = [];
  tipoDatosFuente: any[] = [{ VALOR1: 'LOGISTICA Y TRANSPORTE' }, { VALOR1: 'PROCESO DE FABRICACIÓN' }, { VALOR1: 'NO APLICA' }];
  readOnlyNoConformidad: boolean = true;
  readOnlyAreaDeteccion: boolean = true;
  readOnly: boolean = true;
  readOnlyTipoForm: boolean = true;
  readOnlyIdGestor: boolean = true;
  openSelectSeccion: boolean = false;
  datosDeGestor: boolean = false;
  openDropFuente: boolean = false;
  openDropAreaDeteccion: boolean = false;
  openDropNoConformidad: boolean = false;
  openDropCliente: boolean = false;
  openDropCausaCliente: boolean = false;
  userAdmin: boolean = false;
  openDropCausante: boolean = false;
  openDropCausa: boolean = false;
  openDropPieza: boolean = false;
  openDropAreaAsociada: boolean = false;
  openDropTipoForm: boolean = false;
  openProductos: boolean = false;
  openPieza: boolean = false;
  openDropIdGestor: boolean = false;
  activeFormNormativa: boolean = false;
  activeFormCalidad: boolean = false;
  loadingVisible: boolean = false;
  data_prev: any = '';
  VDatosReg: any;
  QFiltro: any;
  conCambios: number = 0;
  labelLocation: string = 'left';
  targetIdTooltip: string;
  tooltipInfo: string;
  toolTipVisible: boolean = false;

  constructor(
    private sData: CAL001Service,
    private _sbarreg: SbarraService,
    private SVisor: SvisorService,
    private tabService: TabService,
    private _sfiltro: SfiltroService,
    private datepipe: DatePipe
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
      // if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
      // this.opPrepararBuscar(resp);
    });

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex(d => d.PRODUCTO === resp.PRODUCTO);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        // this.opIrARegistro('r_numreg');
      }
    });

    this.getSizeQualifier = this.getSizeQualifier.bind(this);
    this.onSelectionChangedIdGestor = this.onSelectionChangedIdGestor.bind(this);
    this.onSelectionChangedTipoForm = this.onSelectionChangedTipoForm.bind(this);
  }

  ngOnInit(): void {
    const user: any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: 'CALIDAD',
      aplicacion: 'CAL-001',
      usuario: user,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_copiar: true, r_buscar: false }
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.FCalidad = {
      TIPO_FROM: '',
      ID_GESTOR: '',
      AREA_DETECCION: '',
      FECHA: '',
      FECHA_REGISTRO: '',
      FECHA_RECLAMO: '',
      ID_CAUSANTE: '',
      NOMBRE_CAUSANTE: '',
      AREA_ASOCIADA: '',
      PRODUCTO: '',
      NOMBRE_PRODUCTO: '',
      ID_CAUSA_INTERNA: '',
      NOMBRE_CAUSA: '',
      PIEZA_AFECTADA: '',
      CANT_DETALLES: 0,
      DESCRIPCION: ''
    };
    this.FNoConformidad = {
      FECHA: '',
      ID_GESTOR: '',
      ID_CAUSANTE: '',
      NOMBRE_CAUSANTE: '',
      AREA_ASOCIADA: '',
      NOMBRE_AREA_ASOCIADA: '',
      ID_CAUSA: '',
      NOMBRE_CAUSA: '',
      DESCRIPCION: ''
    };
    this.readOnly = true;
    // this.readOnlyNoConformidad = true;
    this.valoresObjetos('todos');

  }

  getSizeQualifier(width: any) {
    if (width < 768) {
      this.labelLocation = 'top';
      return "xs"
    } else if (width < 992) {
      this.labelLocation = 'top';
      return "sm";
    } else if (width < 1366) {
      this.labelLocation = 'left';
      return "md";
    } else {
      this.labelLocation = 'left';
      return "lg";
    }
  }

  onValueChangedFecha(e: any) {
    if (this.mnuAccion.match('new|update')) {
      this.FCalidad.FECHA = e.value;
      this.conCambios++;
    }
  }

  onValueChangedFechaReclamo(e: any) {
    if (this.mnuAccion.match('new|update')) {
      this.FCalidad.FECHA_RECLAMO = e.value;
      this.conCambios++;
    }
  }

  onSelectionCausaCliente(e: any) {
    if (this.mnuAccion.match('new|update')) {
      if (this.activeFormCalidad) {
        this.FCalidad.ID_CAUSA_CLIENTE = e.selectedRowsData[0].ID_CAUSA;
        this.conCambios++;
      }
      this.openDropCausaCliente = false;
    }
  };

  onValueChangedCausante(e: any) {
    if (this.mnuAccion.match('new|update')) {
      if (e.value === undefined || e.value === null || e.value === '') {
        this.FCalidad.ID_CAUSANTE = '';
        this.FCalidad.NOMBRE_CAUSANTE = '';
        this.DGseccion = this.DGseccion_prev;
        this.selectArea = [];
        this.openDropCausante = false;
        this.conCambios++;
      }
    }
  }

  onSelectionCausante(e: any) {
    if (this.mnuAccion.match('new|update')) {
      if (this.activeFormCalidad) {
        if (e.selectedRowsData.length > 0) {
          this.FCalidad.ID_CAUSANTE = e.selectedRowsData[0].ID_EMPLEADO;
          this.FCalidad.NOMBRE_CAUSANTE = e.selectedRowsData[0].NOMBRE_COMPLETO;
          if (e.selectedRowsData[0].SECCIONES.length === 1) {
            this.DGseccion = [{ ITEM: 1, DESCRIPCION: e.selectedRowsData[0].SECCIONES[0].NOMBRE_SECCION, ...e.selectedRowsData[0].SECCIONES[0] }];
            this.FCalidad.AREA_ASOCIADA = e.selectedRowsData[0].SECCIONES[0].ID_SECCION;
            this.FCalidad.NOMBRE_AREA_ASOCIADA = e.selectedRowsData[0].SECCIONES[0].NOMBRE_SECCION;
            this.selectArea = [e.selectedRowsData[0].SECCIONES[0].ID_SECCION];
          } else if (e.selectedRowsData[0].SECCIONES.length > 1) {
            this.FCalidad.AREA_ASOCIADA = '';
            this.FCalidad.NOMBRE_AREA_ASOCIADA = '';
            this.selectArea = [];
            for (let i = 0; i < e.selectedRowsData[0].SECCIONES.length; i++) {
              e.selectedRowsData[0].SECCIONES[i].ITEM = i;
              e.selectedRowsData[0].SECCIONES[i].DESCRIPCION = e.selectedRowsData[0].SECCIONES[i].NOMBRE_SECCION;
            }
            this.DGseccion = e.selectedRowsData[0].SECCIONES;
          } else {
            this.FCalidad.AREA_ASOCIADA = '';
            this.FCalidad.NOMBRE_AREA_ASOCIADA = '';
            this.selectArea = [];
            this.DGseccion = this.DGseccion_prev;
            showToast('El empleado no tiene area asociada.', 'error');
          }
        } else {
          this.FCalidad.ID_CAUSANTE = [];
          this.FCalidad.NOMBRE_CAUSANTE = [];
          this.DGseccion = this.DGseccion_prev;
        }
      } else if (this.activeFormNormativa) {
        this.FNoConformidad.ID_CAUSANTE = e.selectedRowsData[0].ID_EMPLEADO;
        this.FNoConformidad.NOMBRE_CAUSANTE = e.selectedRowsData[0].NOMBRE_COMPLETO;
        this.FNoConformidad.AREA_ASOCIADA = e.selectedRowsData[0].ID_SECCION;
        this.FNoConformidad.NOMBRE_AREA_ASOCIADA = e.selectedRowsData[0].NOMBRE_SECCION;
      }
      this.openDropCausante = false;
      this.conCambios++;
    }
  }
  onSelectionCliente(e: any) {
    if (this.mnuAccion.match('new|update')) {
      this.conCambios++;
      this.FCalidad.ID_CLIENTE = e.selectedRowsData[0].ID_CLIENTE;
      this.openDropCliente = false;
    }
  }

  onValueChangedSeccion(e: any) {
    if (this.mnuAccion.match('new|update')) {
      if (e.value === undefined || e.value === null || e.value === '') {
        this.FCalidad.AREA_ASOCIADA = '';
        this.FCalidad.NOMBRE_AREA_ASOCIADA = '';
        this.openSelectSeccion = false;
        this.conCambios++;
      }
    }
  }

  onValueSeleccionSeccion(e: any) {
    if (this.mnuAccion.match('new|update')) {
      if (e.value) {
        const dArea: any = this.DGseccion.filter((d: any) => d.ID_SECCION === e.value);
        this.FCalidad.AREA_ASOCIADA = dArea[0].ID_SECCION;
        this.FCalidad.NOMBRE_AREA_ASOCIADA = dArea[0].NOMBRE_SECCION;
      } else if (e.values) {
        this.FCalidad.AREA_ASOCIADA = e.values[0];
        this.FCalidad.NOMBRE_AREA_ASOCIADA = e.values[1];
        this.selectArea = [e.values[0]];
      }
      this.openSelectSeccion = false;
      this.conCambios++;
    }
  }

  onSelectionProducto(e: any) {
    if (this.mnuAccion.match('new|update')) {
      this.conCambios++;
      this.FCalidad.PRODUCTO = e.selectedRowsData[0].PRODUCTO;
      this.FCalidad.NOMBRE_PRODUCTO = e.selectedRowsData[0].NOMBRE;
      this.openProductos = false;
    }
  }
  onSelectionCausa(e: any) {
    if (this.mnuAccion.match('new|update')) {
      if (this.activeFormCalidad) {
        this.FCalidad.ID_CAUSA_INTERNA = e.selectedRowsData[0].ID_CAUSA;
        this.FCalidad.NOMBRE_CAUSA = e.selectedRowsData[0].NOMBRE;
      } else if (this.activeFormNormativa) {
        this.FNoConformidad.ID_CAUSA = e.selectedRowsData[0].ID_CAUSA;
        this.FNoConformidad.NOMBRE_CAUSA = e.selectedRowsData[0].NOMBRE;
      }
      this.openDropCausa = false;
      this.conCambios++;
    }
  }
  onValueChangedDescripcion(e: any) {
    if (this.mnuAccion.match('new|update')) {
      if (this.activeFormCalidad)
        this.FCalidad.DESCRIPCION = e.value;
      else if (this.activeFormNormativa)
        this.FNoConformidad.DESCRIPCION = e.value;

      this.conCambios++;
    }
  }
  onValueChangedPieza(e: any) {
    if (this.mnuAccion.match('new|update')) {
      this.conCambios++;
      this.FCalidad.PIEZA_AFECTADA = e.value;
    }
  }
  onValueChangedCantidadDetalle(e: any) {
    if (this.mnuAccion.match('new|update')) {
      this.conCambios++;
      this.FCalidad.CANT_DETALLES = e.value;
    }
  }

  onSelectionChangedTipoNoConformidad(e: any) {
    switch (e.value) {
      case 'CALIDAD':
        this.activeFormCalidad = true;
        this.activeFormNormativa = false;
        this.readOnlyTipoForm = true;
        this.valoresObjetos('historial');
        break;

      case 'NORMAS':
        this.activeFormCalidad = false;
        this.activeFormNormativa = true;
        this.readOnlyTipoForm = true;
        this.valoresObjetos('historial');
        break;

      default:
        this.opBlanquearForma();
        this.activeFormCalidad = false;
        this.activeFormNormativa = false;
        break;
    }
    this.openDropNoConformidad = false;
  }

  onSelectionChangedTipoForm(e: any) {
    if (this.mnuAccion.match('new|update')) {
      this.openDropTipoForm = false;
      this.conCambios++;
      switch (e.value) {
        case 'PRODUCCION':
          this.readOnlyIdGestor = true;
          this.datosDeGestor = false;
          this.readOnlyAreaDeteccion = true;
          this.FCalidad.TIPO_FROM = e.value;
          break;

        case 'CLIENTE':
          this.readOnlyAreaDeteccion = false;
          this.datosDeGestor = true;
          this.readOnlyIdGestor = false;
          this.DidGestores = JSON.parse(JSON.stringify(this.tipoDatos_prev.filter((d: any) => d.ID_GRUPO_DOMINIO === 'GESTORES')));
          this.tipoDatosAreas = JSON.parse(JSON.stringify(this.tipoDatos_prev.filter((d: any) => d.ID_GRUPO_DOMINIO === 'AREAS_DETECCION')));
          this.FCalidad.TIPO_FROM = e.value;
          this.FCalidad.ID_GESTOR = '';
          this.FCalidad.AREA_DETECCION = '';
          break;

        case 'MATERIALES':
          this.readOnlyIdGestor = true;
          this.datosDeGestor = false;
          this.readOnlyAreaDeteccion = true;
          this.FCalidad.TIPO_FROM = e.value;
          break;

        default:
          this.readOnly = true;
          this.readOnlyIdGestor = true;
          this.readOnlyAreaDeteccion = true;
          this.datosDeGestor = false;
          break;
      }
      this.readOnly = false;
      this.valoresObjetos('productos');
    }
  }

  onSelectionChangedIdGestor(e: any) {
    if (this.mnuAccion.match('new|update')) {
      switch (e.value) {
        case 'CONSUMIDOR':
          const ele: any = this.tipoDatos_prev.filter((d: any) => d.VALOR1 === 'CONSUMIDOR');
          this.FCalidad.ID_GESTOR = ele[0].VALOR1;
          this.tipoDatosAreas = JSON.parse(JSON.stringify(this.tipoDatos_prev.filter((d: any) => d.ID_GRUPO_DOMINIO === 'AREAS_DETECCION' && d.VALOR1 === 'PLATAFORMA')));
          const area: any = this.tipoDatos_prev.filter((d: any) => d.ID_GRUPO_DOMINIO === 'AREAS_DETECCION' && d.VALOR1 === 'PLATAFORMA');
          this.FCalidad.AREA_DETECCION = area[0].VALOR1;
          this.selectIdGestor = [this.FCalidad.ID_GESTOR];
          this.readOnlyAreaDeteccion = true;
          break;

        case 'RECIBO':
          this.readOnlyAreaDeteccion = false;
          this.tipoDatosAreas = JSON.parse(JSON.stringify(this.tipoDatos_prev.filter((d: any) => d.ID_GRUPO_DOMINIO === 'AREAS_DETECCION' && d.VALOR1 !== 'PLATAFORMA')));
          this.FCalidad.ID_GESTOR = e.value;
          this.selectIdGestor = [this.FCalidad.ID_GESTOR];
          break;

        default:
          break;
      }
      this.openDropIdGestor = false;
      this.conCambios++;
    }
  }

  onSelectionChangedNservicio(e: any) {
    if (this.mnuAccion.match('new|update')) {
      this.FCalidad.N_SERVICIO = e.value;
      this.conCambios++;
    }
  }

  onSelectionChangedAreaDeteccion(e: any) {
    if (this.mnuAccion.match('new|update')) {
      this.FCalidad.AREA_DETECCION = e.value;
      // if (e.value === 'CONSUMIDOR')
      // this.DGseccion = this.DGseccion_prev;
      // else
      //   this.DGseccion = [];

      this.conCambios++;
    }
  }

  onSelectionChangedFuente(e: any) {
    this.openDropFuente = false;
    if (this.mnuAccion.match('new|update')) {
      this.FCalidad.FUENTE = e.value;
      this.conCambios++;
    }
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        const user: any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'CALIDAD',
          aplicacion: 'CAL-001',
          usuario: user,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_copiar: true, r_buscar: false }
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_nuevo':
        if (this.selectNoConformidad.length > 0) {
          this.mnuAccion = "new";
          this.readOnly = false;
          this.opPrepararNuevo();
        } else {
          this.showModal('Debe seleccionar un Tipo de No Conformidad.', 'error');
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            accion: "r_ini",
            error: "",
            r_numReg: 0,
            r_totReg: 0,
            operacion: { r_copiar: true, r_buscar: false }
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }
        break;

      case 'r_modificar':
        if (this.selectNoConformidad.length > 0) {
          this.mnuAccion = "update";
          this.readOnly = false;
          this.opPrepararModificar();
        } else {
          this.showModal('Debe seleccionar un Tipo de No Conformidad.', 'error');
        }
        break;

      case 'r_guardar':
        if (this.validarDatos())
          this.opPrepararGuardar(this.mnuAccion);
        break;

      case 'r_buscar':
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (this._sfiltro.enConsulta === false) {
          // this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_buscar_ejec':
        if (this._sfiltro.enConsulta === false) {
          // this.opPrepararBuscar('');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case "r_eliminar":
        this.opEliminar();
        break;

      // case "r_primero":
      // case "r_anterior":
      // case "r_siguiente":
      // case "r_ultimo":
      // case "r_numreg":
      // this.opIrARegistro(operMenu.accion);
      // break;

      case 'r_cancelar':
        var mensaje = '¿Desea cancelar la operación?';
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
            this.readOnly = true;
            this.readOnlyTipoForm = true;
            this.readOnlyAreaDeteccion = true;
            this.readOnlyIdGestor = true;
            this.datosDeGestor = false;
            this.mnuAccion = "";
            if (this.data_prev !== '') {
              if (this.activeFormCalidad) {
                this.FCalidad = JSON.parse(JSON.stringify(this.data_prev));
                this.data_prev = { ...this.data_prev, ...this.selectProducto, ...this.selectCausa, ...this.selectCausante, ...this.selectArea };
                this.selectProducto = this.data_prev.PRODUCTO;
                this.selectArea = this.data_prev.AREA_ASOCIADA;
                this.selectCausa = this.data_prev.ID_CAUSA_INTERNA;
                this.selectCausante = this.data_prev.ID_CAUSANTE;
              } else if (this.activeFormNormativa) {
                this.FNoConformidad = JSON.parse(JSON.stringify(this.data_prev));
                this.data_prev = { ...this.data_prev, ...this.selectCausa, ...this.selectCausante };
                this.selectCausa = this.data_prev.ID_CAUSA;
                this.selectCausante = this.data_prev.ID_CAUSANTE;
              }
            } else {
              this.opBlanquearForma();
            }
            this.conCambios = 0;
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} }
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          }
        });
        break;

      case "r_vista":
        // this.opVista('vista');
        break;

      case 'r_copiar':
        if (this.activeFormCalidad) {
          if (this.FCalidad.ID_CAUSANTE !== '' && this.FCalidad.PRODUCTO !== '' && this.FCalidad.ID_CAUSA_INTERNA !== '') {
            this.mnuAccion = "new";
            this.readOnly = false;
            if (this.userAdmin) {
              this.readOnlyTipoForm = false;
              this.readOnlyIdGestor = false;
            }
            this.data_prev = JSON.parse(JSON.stringify(this.FCalidad));
            this.data_prev = { ...this.data_prev, ...this.selectProducto, ...this.selectCausa, ...this.selectCausante, ...this.selectArea };
            this.conCambios = 0;
          }
        } else if (this.activeFormNormativa) {
          if (this.FNoConformidad.ID_CAUSANTE !== '' && this.FNoConformidad.ID_CAUSA !== '') {
            this.mnuAccion = "new";
            this.readOnly = false;
            if (this.userAdmin) {
              this.readOnlyTipoForm = false;
              this.readOnlyIdGestor = false;
            }
            this.data_prev = JSON.parse(JSON.stringify(this.FNoConformidad));
            this.data_prev = { ...this.data_prev, ...this.selectProducto, ...this.selectCausa, ...this.selectCausante, ...this.selectArea };
            this.conCambios = 0;
          }
        }
        break;

      case 'r_refrescar':
        this.valoresObjetos('todos');
        if (this.selectNoConformidad.length > 0)
          this.valoresObjetos('historial');
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
    if (this.activeFormCalidad) {
      if (this.userAdmin) {
        this.FCalidad = {
          TIPO_FROM: '',
          ID_GESTOR: '',
          AREA_DETECCION: '',
          ID_CAUSA_CLIENTE: '',
          FECHA: new Date(),
          FECHA_REGISTRO: new Date(),
          FECHA_RECLAMO: '',
          ID_CAUSANTE: '',
          NOMBRE_CAUSANTE: '',
          AREA_ASOCIADA: '',
          PRODUCTO: '',
          NOMBRE_PRODUCTO: '',
          ID_CAUSA_INTERNA: '',
          NOMBRE_CAUSA: '',
          PIEZA_AFECTADA: '',
          CANT_DETALLES: 0,
          DESCRIPCION: ''
        };
        this.selectTipoForm = [];
        this.readOnlyTipoForm = false;
      } else {
        this.FCalidad = {
          TIPO_FROM: 'PRODUCCION',
          ID_GESTOR: '',
          AREA_DETECCION: '',
          FECHA_REGISTRO: new Date(),
          ID_CAUSANTE: '',
          NOMBRE_CAUSANTE: '',
          AREA_ASOCIADA: '',
          PRODUCTO: '',
          NOMBRE_PRODUCTO: '',
          ID_CAUSA_INTERNA: '',
          NOMBRE_CAUSA: '',
          PIEZA_AFECTADA: '',
          CANT_DETALLES: 0,
          DESCRIPCION: ''
        };
        this.selectTipoForm = this.FCalidad.TIPO_FROM;
        this.readOnlyTipoForm = true;
        this.onSelectionChangedTipoForm({ value: this.FCalidad.TIPO_FROM });
      }
      this.selectProducto = [];
      this.selectArea = [];
      this.selectCausa = [];
      this.selectCausaCliente = [];
      this.selectCausante = [];
      this.selectIdGestor = [];
      this.selectCliente = [];
      this.datosDeGestor = false;
      setTimeout(() => {
        this.formCalidad.instance._refresh();
      }, 400);

    } else if (this.activeFormNormativa) {
      const user: any = localStorage.getItem('usuario');
      this.FNoConformidad = {
        FECHA: new Date(),
        ID_GESTOR: user,
        ID_CAUSANTE: '',
        NOMBRE_CAUSANTE: '',
        AREA_ASOCIADA: '',
        NOMBRE_AREA_ASOCIADA: '',
        ID_CAUSA: '',
        NOMBRE_CAUSA: '',
        DESCRIPCION: ''
      };
      this.selectCausa = [];
      this.selectCausante = [];
      setTimeout(() => {
        this.formNoConformidad.instance._refresh();
      }, 400);
    }
    this.conCambios = 0;
  }

  opBlanquearForma(): void {
    if (this.activeFormCalidad) {
      this.FCalidad = {
        TIPO_FROM: '',
        ID_GESTOR: '',
        ID_CAUSA_CLIENTE: '',
        N_SERVICIO: '',
        AREA_DETECCION: '',
        FECHA: '',
        FECHA_RECLAMO: '',
        FECHA_REGISTRO: '',
        ID_CAUSANTE: '',
        NOMBRE_CAUSANTE: '',
        AREA_ASOCIADA: '',
        PRODUCTO: '',
        NOMBRE_PRODUCTO: '',
        ID_CAUSA_INTERNA: '',
        NOMBRE_CAUSA: '',
        PIEZA_AFECTADA: '',
        CANT_DETALLES: 0,
        DESCRIPCION: ''
      };
      this.selectProducto = [];
      this.selectArea = [];
      this.selectCausa = [];
      this.selectCausaCliente = [];
      this.selectCausante = [];
      this.selectIdGestor = [];
      this.selectCliente = [];
      this.selectTipoForm = [];
      this.formCalidad.instance._refresh();

    } else if (this.activeFormNormativa) {
      this.FNoConformidad = {
        FECHA: '',
        ID_GESTOR: '',
        ID_CAUSANTE: '',
        NOMBRE_CAUSANTE: '',
        AREA_ASOCIADA: '',
        NOMBRE_AREA_ASOCIADA: '',
        ID_CAUSA: '',
        NOMBRE_CAUSA: '',
        DESCRIPCION: ''
      };
      this.selectCausa = [];
      this.selectCausante = [];
      this.formNoConformidad.instance._refresh();
    }

  }

  opEliminar(): void { }

  // Ejecuta la eliminación
  AccionEliminar(): void { }

  opPrepararModificar(): void {
    if (this.activeFormCalidad)
      this.data_prev = this.FCalidad;
    else if (this.FNoConformidad)
      this.data_prev = this.FCalidad;
  }

  onCellHoverChangedCelda(e: any) {
    if (e.rowType === "data" && e.column.dataField.match("ID_AREA_CAUSANTE|ID_SECCION|ID_CAUSA|ID_CAUSA_INTERNA|ID_CAUSA_CLIENTE")) {
      if (e.eventType === "mouseover") {
        if (e.column.dataField === 'ID_AREA_CAUSANTE' && e.data.ID_AREA_CAUSANTE !== '' && e.data.ID_AREA_CAUSANTE !== null && e.data.ID_AREA_CAUSANTE !== undefined) {
          this.targetIdTooltip = e.cellElement;
          this.tooltipInfo = e.data.NOMBRE_AREA_CAUSANTE;
          this.toolTipVisible = true;
        };
        if (e.column.dataField === 'ID_SECCION' && e.data.ID_SECCION !== '' && e.data.ID_SECCION !== null && e.data.ID_SECCION !== undefined) {
          this.targetIdTooltip = e.cellElement;
          this.tooltipInfo = e.data.NOMBRE_SECCION;
          this.toolTipVisible = true;
        };
        if (e.column.dataField === 'ID_CAUSA' && e.data.ID_CAUSA !== '' && e.data.ID_CAUSA !== null && e.data.ID_CAUSA !== undefined) {
          this.targetIdTooltip = e.cellElement;
          this.tooltipInfo = e.data.NOMBRE_CAUSA;
          this.toolTipVisible = true;
        };
        if (e.column.dataField === 'ID_CAUSA_INTERNA' && e.data.ID_CAUSA_INTERNA !== '' && e.data.ID_CAUSA_INTERNA !== null && e.data.ID_CAUSA_INTERNA !== undefined) {
          this.targetIdTooltip = e.cellElement;
          this.tooltipInfo = e.data.NOMBRE_CAUSA_INTERNA;
          this.toolTipVisible = true;
        };
        if (e.column.dataField === 'ID_CAUSA_CLIENTE' && e.data.ID_CAUSA_CLIENTE !== '' && e.data.ID_CAUSA_CLIENTE !== null && e.data.ID_CAUSA_CLIENTE !== undefined) {
          this.targetIdTooltip = e.cellElement;
          this.tooltipInfo = e.data.NOMBRE_CAUSA_CLIENTE;
          this.toolTipVisible = true;
        };
        // this.toolTip.instance.show(this.TooltipTarget);
      } else {
        this.toolTipVisible = false;
      }
    } else {
      this.toolTipVisible = false;
    }
  }

  onSelectionChangedGrid(e: any) {
    if (this.readOnly) {
      if (this.activeFormCalidad) {
        this.FCalidad = {
          FECHA: e.selectedRowsData[0].FECHA,
          FECHA_REGISTRO: e.selectedRowsData[0].FECHA_REGISTRO,
          ID_CAUSANTE: e.selectedRowsData[0].ID_RESPONSABLE,
          NOMBRE_CAUSANTE: e.selectedRowsData[0].NOMBRE_CAUSANTE,
          PRODUCTO: e.selectedRowsData[0].PRODUCTO,
          NOMBRE_PRODUCTO: e.selectedRowsData[0].NOMBRE_PRODUCTO,
          ID_CAUSA_INTERNA: e.selectedRowsData[0].ID_CAUSA_INTERNA,
          PIEZA_AFECTADA: e.selectedRowsData[0].PARTE,
          CANT_DETALLES: e.selectedRowsData[0].CANT_DETALLES,
          DESCRIPCION: e.selectedRowsData[0].DESCRIPCION,
          ITEM: e.selectedRowsData[0].ITEM
        };
        //Info de empleado causante
        const dEmple: any = this.DGEmpleados.filter((d: any) => d.ID_EMPLEADO === e.selectedRowsData[0].ID_RESPONSABLE);
        this.DGseccion = this.DGseccion_prev;
        this.FCalidad.AREA_ASOCIADA = e.selectedRowsData[0].ID_SECCION;
        this.FCalidad.NOMBRE_AREA_ASOCIADA = e.selectedRowsData[0].NOMBRE_SECCION;
        if ((e.selectedRowsData[0].N_SERVICIO !== '' && e.selectedRowsData[0].N_SERVICIO !== undefined && e.selectedRowsData[0].N_SERVICIO !== null) ||
          (e.selectedRowsData[0].ID_CLIENTE === '' && e.selectedRowsData[0].ID_CLIENTE === undefined && e.selectedRowsData[0].ID_CLIENTE === null)
        ) {
          if (this.userAdmin) {
            this.datosDeGestor = true;
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              accion: "r_numreg",
              error: "",
              r_numReg: 1,
              r_totReg: 1,
              operacion: { r_copiar: true, r_buscar: false }
            };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          } else {
            this.datosDeGestor = false;
          }
          this.selectTipoForm = 'CLIENTE';
          this.FCalidad.TIPO_FROM = 'CLIENTE';
          this.FCalidad.ID_GESTOR = e.selectedRowsData[0].ID_GESTOR;
          this.FCalidad.N_SERVICIO = e.selectedRowsData[0].N_SERVICIO;
          this.FCalidad.FECHA_RECLAMO = e.selectedRowsData[0].FECHA_RECLAMO,
            this.FCalidad.ID_CAUSA_CLIENTE = e.selectedRowsData[0].ID_CAUSA_CLIENTE,
            this.FCalidad.AREA_DETECCION = e.selectedRowsData[0].ID_AREA_DETECCION;
          this.FCalidad.FUENTE = e.selectedRowsData[0].FUENTE;
          this.FCalidad.ID_CLIENTE = e.selectedRowsData[0].ID_CLIENTE;
          this.FCalidad.ITEM = e.selectedRowsData[0].ITEM
          this.selectIdGestor = [this.FCalidad.ID_GESTOR];
          this.selectCliente = [this.FCalidad.ID_CLIENTE];
          this.selectCausaCliente = [this.FCalidad.ID_CAUSA_CLIENTE];
        } else {
          this.selectTipoForm = 'PRODUCCION';
          this.FCalidad.TIPO_FROM = 'PRODUCCION';
          this.datosDeGestor = false;
        }
        this.selectProducto = e.selectedRowsData[0].PRODUCTO;
        this.selectArea = [e.selectedRowsData[0].AREA_ASOCIADA ? e.selectedRowsData[0].AREA_ASOCIADA : e.selectedRowsData[0].ID_SECCION];
        this.selectCausa = e.selectedRowsData[0].ID_CAUSA_INTERNA;
        this.selectCausante = e.selectedRowsData[0].ID_RESPONSABLE;
        this.data_prev = JSON.parse(JSON.stringify(this.FCalidad));
        this.data_prev = { ...this.data_prev, ...this.selectProducto, ...this.selectCausa, ...this.selectCausante, ...this.selectArea };

      } else if (this.activeFormNormativa) {
        this.FNoConformidad = {
          FECHA: e.selectedRowsData[0].FECHA,
          ID_GESTOR: e.selectedRowsData[0].USUARIO,
          ID_CAUSANTE: e.selectedRowsData[0].ID_RESPONSABLE,
          NOMBRE_CAUSANTE: e.selectedRowsData[0].NOMBRE_CAUSANTE,
          AREA_ASOCIADA: e.selectedRowsData[0].ID_AREA_CAUSANTE,
          NOMBRE_AREA_ASOCIADA: e.selectedRowsData[0].NOMBRE_AREA_CAUSANTE,
          ID_CAUSA: e.selectedRowsData[0].ID_CAUSA,
          DESCRIPCION: e.selectedRowsData[0].DESCRIPCION
        };
        this.selectCausa = e.selectedRowsData[0].ID_CAUSA;
        this.selectCausante = e.selectedRowsData[0].ID_RESPONSABLE;
        this.data_prev = JSON.parse(JSON.stringify(this.FCalidad));
        this.data_prev = { ...this.data_prev, ...this.selectProducto, ...this.selectCausa, ...this.selectCausante, ...this.selectArea };
      }
      if (this.userAdmin) {
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          accion: "r_numreg",
          error: "",
          r_numReg: 1,
          r_totReg: 1,
          operacion: { r_buscar: false }
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      } else {
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_buscar: false, r_modificar: false, r_copiar: true, r_refrescar: true }
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      }
    } else {
      showToast('No puede moverse si esta en modo edición.', 'warning');
    }
  }

  onExporting(e: any) {
    if (this.DGConformidades.length > 0) {
      var name: string = '';
      let fecha: Date = new Date();
      const newFecha = this.datepipe.transform(fecha, 'MM/dd/yyyy');
      if (this.activeFormCalidad) {
        name = 'Informe no Conformidades ' + newFecha;
      } else if (this.activeFormNormativa) {
        name = 'Informe Normativas ' + newFecha;
      }

      if (e.format == 'xls') {
        const exportFile = new Workbook();
        const dataExport: any = this.DGConformidades;
        const worksheet = exportFile.addWorksheet('dataExport');
        exportDataGrid({
          component: e.component,
          worksheet,
          autoFilterEnabled: true,
        }).then(() => {
          exportFile.xlsx.writeBuffer().then((buffer) => {
            saveAs(new Blob([buffer], { type: 'application/octet-stream' }), name + '.xlsx');
          });
        });
      } else {
        const doc = new jsPDF();
        pdfexport({
          jsPDFDocument: doc,
          component: e.component,
          indent: 5,
        }).then(() => {
          doc.save(name + '.pdf');
        });
      }

    } else {
      showToast('No hay datos para exportar.', 'error');
    }
  }

  validarDatos() {
    let mensaje: any = '';
    var res: boolean = false;
    let propiedadesVacias: any = [];

    if (this.activeFormCalidad) {
      const propiedadesVerificar = ["FECHA_REGISTRO", "NOMBRE_AREA_ASOCIADA", "PRODUCTO", "NOMBRE_PRODUCTO", "ID_CAUSA_INTERNA", "PIEZA_AFECTADA"];

      if ((this.FCalidad.FECHA_REGISTRO !== '' && this.FCalidad.FECHA_REGISTRO !== null && this.FCalidad.FECHA_REGISTRO !== undefined) &&
        (this.FCalidad.NOMBRE_AREA_ASOCIADA !== '' && this.FCalidad.NOMBRE_AREA_ASOCIADA !== null && this.FCalidad.NOMBRE_AREA_ASOCIADA !== undefined) &&
        (this.FCalidad.PRODUCTO !== '' && this.FCalidad.PRODUCTO !== null && this.FCalidad.PRODUCTO !== undefined) &&
        (this.FCalidad.ID_CAUSA_INTERNA !== '' && this.FCalidad.ID_CAUSA_INTERNA !== null && this.FCalidad.ID_CAUSA_INTERNA !== undefined) &&
        (this.FCalidad.PIEZA_AFECTADA !== '' && this.FCalidad.PIEZA_AFECTADA !== null && this.FCalidad.PIEZA_AFECTADA !== undefined)
      ) {
        // if (this.FCalidad.AREA_DETECCION !== 'CONSUMIDOR' &&
        //   (this.FCalidad.ID_CAUSANTE !== '' && this.FCalidad.ID_CAUSANTE !== null && this.FCalidad.ID_CAUSANTE !== undefined)
        // ) {
        if ((this.FCalidad.CANT_DETALLES > 0)) {
          if (this.userAdmin) {
            if (this.FCalidad.TIPO_FROM === 'CLIENTE') {
              if ((this.FCalidad.N_SERVICIO !== '' && this.FCalidad.N_SERVICIO !== null && this.FCalidad.N_SERVICIO !== undefined) &&
                (this.FCalidad.ID_CLIENTE !== '' && this.FCalidad.ID_CLIENTE !== null && this.FCalidad.ID_CLIENTE !== undefined) &&
                (this.FCalidad.AREA_DETECCION !== '' && this.FCalidad.AREA_DETECCION !== null && this.FCalidad.AREA_DETECCION !== undefined)) {

                res = true;
              } else {
                showToast('Los campos Gestor ó Área Detección ó Cliente están vacíos, complete la información.', 'error');
                res = false;
              };
            } else {
              res = true;
            }
          } else {
            res = true;
          }
        } else {
          showToast('La Cantidad de detalles encontrados en la pieza debe ser mayor a CERO(0).', 'error');
          res = false;
        };
        // } else if (this.FCalidad.AREA_DETECCION === 'CONSUMIDOR') {
        if ((this.FCalidad.CANT_DETALLES > 0)) {
          if (this.userAdmin) {
            if (this.FCalidad.TIPO_FROM === 'CLIENTE') {
              if ((this.FCalidad.N_SERVICIO !== '' && this.FCalidad.N_SERVICIO !== null && this.FCalidad.N_SERVICIO !== undefined) &&
                (this.FCalidad.ID_CLIENTE !== '' && this.FCalidad.ID_CLIENTE !== null && this.FCalidad.ID_CLIENTE !== undefined) &&
                (this.FCalidad.AREA_DETECCION !== '' && this.FCalidad.AREA_DETECCION !== null && this.FCalidad.AREA_DETECCION !== undefined)) {

                res = true;
              } else {
                showToast('Los campos Gestor ó Área Detección ó Cliente están vacíos, complete la información.', 'error');
                res = false;
              };
            } else {
              res = true;
            }
          } else {
            res = true;
          }
        } else {
          showToast('La Cantidad de detalles encontrados en la pieza debe ser mayor a CERO(0).', 'error');
          res = false;
        };
        // } else {
        //   showToast('Debe seleccionar un Causante (Empleado responsable).', 'error');
        //   res = false;
        // };
      } else {
        for (let key in this.FCalidad) {
          if (propiedadesVerificar.includes(key) && !this.FCalidad[key]) {
            propiedadesVacias.push(key);
          }
        }
        if (propiedadesVacias.length > 0)
          mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;

        showToast(mensaje, 'error');
        res = false;
      };

    } else if (this.activeFormNormativa) {
      const propiedadesVerificar = ["FECHA", "ID_CAUSANTE", "NOMBRE_CAUSANTE", "NOMBRE_AREA_ASOCIADA", "ID_CAUSA"];

      if ((this.FNoConformidad.FECHA !== '' && this.FNoConformidad.FECHA !== null && this.FNoConformidad.FECHA !== undefined) &&
        (this.FNoConformidad.ID_CAUSANTE !== '' && this.FNoConformidad.ID_CAUSANTE !== null && this.FNoConformidad.ID_CAUSANTE !== undefined) &&
        (this.FNoConformidad.NOMBRE_AREA_ASOCIADA !== '' && this.FNoConformidad.NOMBRE_AREA_ASOCIADA !== null && this.FNoConformidad.NOMBRE_AREA_ASOCIADA !== undefined) &&
        (this.FNoConformidad.ID_CAUSA !== '' && this.FNoConformidad.ID_CAUSA !== null && this.FNoConformidad.ID_CAUSA !== undefined)
      ) {
        res = true;
      } else {
        for (let key in this.FNoConformidad) {
          if (propiedadesVerificar.includes(key) && !this.FNoConformidad[key]) {
            propiedadesVacias.push(key);
          }
        }
        if (propiedadesVacias.length > 0)
          mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;

        showToast(mensaje, 'error');
        res = false;
      };
    }
    return res;
  }

  opPrepararGuardar(accion: string): void {
    if (this.conCambios != 0) {
      const user: any = localStorage.getItem('usuario');
      var prm: any = {};
      if (this.activeFormCalidad)
        prm = { TIPO: this.selectNoConformidad, NOCONFORMIDAD: this.FCalidad, USUARIO: user };
      else if (this.activeFormNormativa)
        prm = { TIPO: this.selectNoConformidad, NOCONFORMIDAD: this.FNoConformidad, USUARIO: user };

      this.loadingVisible = true;
      // API guardado de datos
      this.sData.save(accion, prm).subscribe((data) => {
        this.loadingVisible = false;
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.prmUsrAplBarReg.error = 'Error';
          this.prmUsrAplBarReg.accion = 'r_guardar';
          this.showModal(res[0].ErrMensaje, 'Error al guardar');
        } else {
          this.mnuAccion = '';
          this.readOnly = true;
          this.readOnlyIdGestor = true;
          this.readOnlyTipoForm = true;
          this.readOnlyAreaDeteccion = true;

          if (accion === 'new') {
            if (this.activeFormCalidad)
              this.FCalidad.ITEM = res[0].ITEM;
            else if (this.activeFormNormativa)
              this.FNoConformidad.ITEM = res[0].ITEM;
          }

          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            accion: "r_numreg",
            error: "",
            r_numReg: 0,
            r_totReg: 0,
            operacion: { r_copiar: true, r_buscar: false }
          };
          this.conCambios = 0;
          showToast('Registro actualizado', 'success');
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.valoresObjetos('historial');
        }
      });

    } else {
      showToast('No hay cambios por guardar', 'error');
    }
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string) {
    if (obj === 'historial') {
      const user: any = localStorage.getItem('usuario');
      var prm: any = {};
      if (this.activeFormCalidad)
        prm = { TIPO: this.selectNoConformidad, USUARIO: user };
      else if (this.activeFormNormativa)
        prm = { TIPO: this.selectNoConformidad, USUARIO: user };

      this.loadingVisible = true;
      this.sData.getHistorial('HISTORICO', prm).subscribe((data: any) => {
        this.loadingVisible = false;
        const res = validatorRes(data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          // this.showModal(mensaje, 'Error');
        } else {
          for (let i = 0; i < newArray.length; i++) {
            newArray[i].INDEX = i;
          };
          this.DGConformidades = newArray;
        };
      },
        ((err: any) => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    if (obj === 'productos' || obj === 'todos') {
      const prm = {};
      this.sData.getProductos('PRODUCTOS', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje != '') {
          this.showModal(mensaje, 'Error');
        } else {
          newArray.forEach((ele: any) => {
            ele.DESC = ele.PRODUCTO + ' - ' + ele.NOMBRE;
          });
          this.DGProductos = newArray;
        };
      },
        ((err: any) => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    if (obj === 'empleados' || obj === 'todos') {
      const prm: any = {};
      this.sData.getEmpleados('EMPLEADOS', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.showModal(mensaje, 'Error');
        } else {
          newArray.forEach((ele: any) => {
            ele.DESC = ele.ID_EMPLEADO + ' - ' + ele.NOMBRE_COMPLETO;
          });
          this.DGEmpleados = newArray;
        };
      });
    };
    if (obj === 'secciones' || obj === 'todos') {
      // Carga las secciones registradas
      this.sData.getSecciones({ FILTRO: "" }).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        for (let i = 0; i < res.length; i++) {
          res[i].COD = i;
        }
        this.DGseccion_prev = res;
        this.DGseccion = res;
      });
    };
    if (obj === 'causas' || obj === 'todos') {
      const prm: any = {};
      this.sData.getCausas('CAUSAS', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.showModal(mensaje, 'Error');
        } else {
          this.DGCausas = newArray.filter((d: any) => d.TIPO === 'PRODUCCION' && d.ID_CAUSA.match('NC'));
          this.DGCausasNormativa = newArray.filter((d: any) => d.TIPO === 'PRODUCCION' && d.ID_CAUSA.match('CN'));
          this.DGCausasClientes = newArray.filter((d: any) => d.TIPO === 'CLIENTE');
        };
      });
    };
    if (obj === 'permisos usuario' || obj === 'todos') {
      const user: any = localStorage.getItem('usuario');
      const prm = { USUARIO: user.toUpperCase() };
      this.sData.getPermisos('PERMISOS USUARIO', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.showModal(mensaje, 'Error');
        } else {
          if (newArray[0].ELIMINAR && newArray[0].MODIFICAR)
            this.userAdmin = true;
          else
            this.userAdmin = false;
        };
      });
    };
    if (obj === 'clientes' || obj === 'todos') {
      const prm: any = {};
      this.sData.getClientes('CLIENTES', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.showModal(mensaje, 'Error');
        } else {
          this.DGClientes = newArray;
        };
      });
    };
    if (obj === 'dominios' || obj === 'todos') {
      const prm: any = {};
      this.sData.getDominios('DOMINIOS', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token !== undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.showModal(mensaje, 'Error');
        } else {
          this.tiposNoConformidades = JSON.parse(JSON.stringify(newArray.filter((d: any) => d.ID_GRUPO_DOMINIO === 'TIPO_NO_CONFORMIDAD')));
          this.tipoForm = JSON.parse(JSON.stringify(newArray.filter((d: any) => d.ID_GRUPO_DOMINIO === 'TIPO_FORM')));
          this.tipoDatos_prev = JSON.parse(JSON.stringify(newArray.filter((d: any) => d.ID_GRUPO_DOMINIO !== 'TIPO_FORM')));
          this.DidGestores = JSON.parse(JSON.stringify(newArray.filter((d: any) => d.ID_GRUPO_DOMINIO === 'GESTORES')));
          this.tipoDatosAreas = JSON.parse(JSON.stringify(newArray.filter((d: any) => d.ID_GRUPO_DOMINIO === 'AREAS_DETECCION')));
          this.piezas = JSON.parse(JSON.stringify(newArray.filter((d: any) => d.ID_GRUPO_DOMINIO === 'PIEZA_AFECTADA')));
        };
      });
    };
  }


  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte: any, archivo: any, datosrpt: any) {

    let filtroRep = { FILTRO: this.FCalidad };
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

  showModal(mensaje: any, title: any) {
    const tipo = title;
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo === 'Error' ? 'DF3E3E' : '#0F4C81 !important',
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
