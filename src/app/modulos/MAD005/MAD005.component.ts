
import { Component, ViewChild, Input } from '@angular/core';
import { DxCheckBoxModule, DxDateBoxModule, DxFileUploaderModule, DxFormModule, DxSelectBoxModule, DxTextAreaModule, DxTextBoxModule, DxLoadPanelModule } from 'devextreme-angular';
import { Subject, Subscription, takeUntil, lastValueFrom } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { MAD005Service } from 'src/app/services/MAD005/MAD005.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { showToast } from '../../shared/toast/toastComponent.js';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import Swal from 'sweetalert2';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';
import { DxTreeViewModule } from 'devextreme-angular';
import { DxButtonModule } from 'devextreme-angular';
import { DxFormComponent } from 'devextreme-angular';
import { DxDataGridModule } from 'devextreme-angular';
import { GridsEditMode } from 'devextreme/ui/data_grid';
import { DxTabPanelModule } from 'devextreme-angular';
import { DataSourceParametersComponent } from 'src/app/shared/components/data-source-parameters/data-source-parameters.component';
import { CommonModule } from '@angular/common';
import { ConfigOrigenDato } from './clsMAD005.class';

@Component({
    selector: 'app-MAD005',
    imports: [
    DxFormModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxCheckBoxModule,
    DxDateBoxModule,
    DxFileUploaderModule,
    DxButtonModule,
    DxTextAreaModule,
    DxTreeViewModule,
    VistarapidaComponent,
    GeninformesComponent,    
    DxDataGridModule,
    DxTabPanelModule,
    DataSourceParametersComponent,
    CommonModule, 
    DxLoadPanelModule,       
],
    templateUrl: './MAD005.component.html',
    styleUrls: ['./MAD005.component.css']
})
export class MAD005Component {  
  @ViewChild('form') form!: DxFormComponent;
  @ViewChild('dataSourceParams') dataSourceParams!: DataSourceParametersComponent;
  dataAppModel: ConfigOrigenDato;
  dataAppModel_prev: any;    
  origenDatosItems: any;    
  estadoItems = [
    { text: 'ACTIVO', value: true },
    { text: 'INACTIVO', value: false }
  ];
  defectoItems = [
    { text: 'Sí', value: true },
    { text: 'No', value: false }
  ];  
  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subs_visor: Subscription;
  subs_filtro: Subscription;
  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();
  prmUsrAplBarReg: clsBarraRegistro;
  USUARIO: any;
  VDatosReg: any;
  QFiltro: any;
  mnuAccion: string;
  readOnly: boolean = true;
  readOnlyId: boolean = true;    
  conCambios: number = 0;
  loadingVisible: boolean = false;
  @Input()
  aplicacion!: string;

  constructor(
    private sData: MAD005Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService
  ) {
    this._unsubscribeAll = new Subject();

    this.subscription = this._sbarreg
      .getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((datreg) => {
        // Valida si la petición es para esta aplicacion
        if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });

    // Respuesta del filtro
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe((resp) => {
      // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    });
    this.subs_visor = this.SVisor.getObs_Apl().subscribe((resp) => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion)
        return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex(
        (d) => d.ID_ORIGEN_DATO === resp.ID_ORIGEN_DATO
      );
      if (nx !== -1) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    });

    this.onValueChangedApl = this.onValueChangedApl.bind(this);
    this.ValideExistencia = this.ValideExistencia.bind(this);
  }

  ngOnInit(): void {
    this.dataAppModel = {
      ID_ORIGEN_DATO: -1,
      NOMBRE: '',
      ORIGEN_DATO: '',
      PARAMETROS: '',
      DEFECTO: false,
      ACTIVO: true,
      COMENTARIOS: null
    };
    this.USUARIO = localStorage.getItem('usuario')?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'CONFIG_ORIGEN_DATO',
      aplicacion: 'MAD-005',
      usuario: this.USUARIO,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_refrescar: true },
    };
    this.mnuAccion = '';
    this.readOnly = true;
    this.readOnlyId = true;    
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.valoresObjetos('todos');          
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  valoresObjetos(obj: string) {
    if (obj === 'todos') 
    {      
      // Cargar listas de la aplicación
      this.sData
        .consulta('datalists',{}, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          if (res[0].ErrMensaje === '') {            
            this.origenDatosItems = res[0].origenDatos;                
          } else {
            this.showModal(res[0].ErrMensaje, 'Error');
          }
        });
    }
  }

  opMenuRegistro(operMenu: clsBarraRegistro) {
    switch (operMenu.accion) {
      case 'r_ini':
        this.prmUsrAplBarReg = {
          tabla: 'CONFIG_ORIGEN_DATO',
          aplicacion: 'MAD-005',
          usuario: this.USUARIO,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_refrescar: true },
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_nuevo':
        this.mnuAccion = 'new';
        this.readOnly = false;
        this.readOnlyId = false;        
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        if (!this.ValidaDatos('requerido')) {
          return;
        } else {
          this.opPrepararGuardar(this.mnuAccion);
        }        
        break;

      case 'r_buscar':
        if (
          GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion
        )
          return;
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_buscar_ejec':
        this.opBlanquearFormGP();
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_eliminar':
        this.opEliminar();        
        break;

      case 'r_primero':
      case 'r_anterior':
      case 'r_siguiente':
      case 'r_ultimo':
      case 'r_numreg':
        this.opIrARegistro(operMenu.accion);
        break;

      case 'r_cancelar':
        var mensaje = '¿Desea cancelar la operación?';
        if (this.conCambios != 0)
          mensaje = 'Desea cancelar sin guardar cambios?';
        Swal.fire({
          title: '',
          text: mensaje,
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar',
        }).then((result) => {
          if (result.isConfirmed) {
            this.readOnly = true;
            this.readOnlyId = true;            
            this.conCambios = 0;
            this.mnuAccion = '';
            this.prmUsrAplBarReg.accion =
            this.VDatosReg?.length > 0 ? 'r_navegar' : 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            if (
              this.dataAppModel_prev === undefined ||
              this.dataAppModel_prev === '' ||
              this.dataAppModel_prev === null ||
              this.dataAppModel_prev.length === 0
            ) {
              this.opBlanquearFormGP();
            } else {
              this.dataAppModel = JSON.parse(
                JSON.stringify(this.dataAppModel_prev)
              );
            }            
          }
        });
        break;

      case 'r_copiar':       
        break;

      case 'r_vista':
        this.opVista();
        break;

      case 'r_refrescar':
        this.valoresObjetos('todos');        
        break;

      case 'r_imprimir':
        this.imprimirReporte(operMenu);
        break;

      default:
        break;
    }
  }

  opPrepararNuevo(): void {
    this.opBlanquearFormGP();        
  }

  opBlanquearFormGP(): void {
    this.dataAppModel_prev = JSON.parse(JSON.stringify(this.dataAppModel)); // Guardar datos previos antes de blanquear
    this.dataAppModel = {
      ID_ORIGEN_DATO: -1,
      NOMBRE: '',
      ORIGEN_DATO: '',
      PARAMETROS: '',
      DEFECTO: false,
      ACTIVO: true,
      COMENTARIOS: null
    };
  }

  async opPrepararModificar() {
    this.dataAppModel_prev = JSON.parse(JSON.stringify(this.dataAppModel));
    this.readOnly = false;
    this.readOnlyId = this.dataAppModel.ID_ORIGEN_DATO != null &&
                      this.dataAppModel.ID_ORIGEN_DATO !==  -1;         
  }

  opPrepararBuscar(accion: any): void {
    if (accion === 'filtro') {
      this._sfiltro.PrmFiltro = {
        Titulo: 'Datos de filtro para Orígenes de datos',
        accion: 'PREPARAR FILTRO',
        Filtro: '',
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { CONFIG_ORIGEN_DATO: arrFiltro };
      this.loadingVisible = true;
      this.sData
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          try {
            this.loadingVisible = false;
            const res = JSON.parse(data.data);
            this._sfiltro.enConsulta = false;
            if (data.token != undefined) {
              const refreshToken = data.token;
              localStorage.setItem('token', refreshToken);
            }
            const datares = res;
            if (datares[0].ErrMensaje === '') {
              this.VDatosReg = datares;
              this.dataAppModel = datares[0];
              this.QFiltro = datares[0].QFILTRO;

              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                r_totReg: datares.length,
                r_numReg: 1,
                accion: 'r_navegar',
                operacion: {},
              };
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
              this.opIrARegistro('r_primero');
              this.readOnly = true;                            
            } else {
              this.VDatosReg = [];
              this.opBlanquearFormGP();
              showToast(datares[0].ErrMensaje, 'warning');
              this.prmUsrAplBarReg.accion = 'r_ini';
              this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);              
            }
          } catch (error) {
            this.loadingVisible = false;
            this.readOnly = true;
            this._sfiltro.enConsulta = false;
            this.showModal(error, 'Error');                        
          }
        });
    }
    this.readOnly = true;    
  }

  imprimirReporte(operMenu: any) {
    var prmRep = {
      ...operMenu.operacion,
      accion: 'previsualizar',
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      usuario: this.prmUsrAplBarReg.usuario,
      QFiltro:
        operMenu.operacion.registro === 'todos'
          ? this.QFiltro
          : " CONFIG_ORIGEN_DATO.ID_ORIGEN_DATO = '" +
            this.dataAppModel.ID_ORIGEN_DATO +
            "'",
    };
    if (operMenu.operacion.modo === 'previsualizar')
      this.eventsSubjectInformes.next(prmRep);

    if (operMenu.operacion.modo === 'pdf') {
      prmRep = { ...prmRep, accion: 'pdf' };
      this.eventsSubjectInformes.next(prmRep);
    }
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = 'r_numreg';
    switch (accion) {
      case 'r_primero':
        if (this.VDatosReg.length != 0) {
          this.dataAppModel = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this.prmUsrAplBarReg.r_numReg = 1;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.readOnly = true;          
          showToast('No se encontraron Datos', 'error');
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1
            ? 1
            : this.prmUsrAplBarReg.r_numReg - 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.dataAppModel = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.dataAppModel = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.dataAppModel = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_numreg':
        if (this.prmUsrAplBarReg.r_numReg !== 0) {
          if (this.SVisor.ColSort.Columna !== '') {
            if (this.SVisor.ColSort.Clase === 'asc') {
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
          this.dataAppModel = JSON.parse(
            JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
          );
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearFormGP();
        }
        this.readOnly = true;        
        break;
      case 'Eliminado':
        this.opBlanquearFormGP();
        break;
      default:
        break;
    }
  }

  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'ORÍGENES DATOS',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: [
        'ID_ORIGEN_DATO|ORIGEN',
        'NOMBRE|NOMBRE',
        'ORIGEN_DATO|ORIGEN_DATO',
        'ACTIVO|ACTIVO',
      ],
      Filtro: '',
      keyGrid: ['ID_ORIGEN_DATO'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  async ValideExistencia(e: any) {
    let aprob: boolean = false;
    if (
      this.mnuAccion === undefined ||
      this.readOnly ||
      !this.mnuAccion.match('new|update') ||
      (this.mnuAccion === 'update' &&
        this.dataAppModel_prev.NOMBRE === e.value)
    ) {
      aprob = true;
    }
    
    if (!aprob) {
      const prm = { NOMBRE: e.value };
      const apiRest = this.sData.validellave(
        'existe',
        prm,
        this.prmUsrAplBarReg.aplicacion
      );
      let res = await lastValueFrom(apiRest, { defaultValue: true });
      res = JSON.parse(res.data);
      if (res[0].ErrMensaje !== '') {
        aprob = true;
      } else {
        this.showModal('Origen de datos ' + e.value + ' ya existe', '¡IMPORTANTE!');
        aprob = false;
      }
    }
    return aprob;
  }

  async opPrepararGuardar(accion: string): Promise<void> {
    if (this.ValidaDatos('requerido') === false) {
      return;
    }
    if (!await this.ValideExistencia({ value: this.dataAppModel.ID_ORIGEN_DATO })) {
      return;
    }
    const sendData = {
      ID_ORIGEN_DATO: this.dataAppModel.ID_ORIGEN_DATO,
      NOMBRE: this.dataAppModel.NOMBRE,
      ORIGEN_DATO: this.dataAppModel.ORIGEN_DATO,
      PARAMETROS: this.dataAppModel.PARAMETROS,
      DEFECTO: this.dataAppModel.DEFECTO,
      ACTIVO: this.dataAppModel.ACTIVO,
      COMENTARIOS: this.dataAppModel.COMENTARIOS
    };
    var prm: any = { CONFIG_ORIGEN_DATO: this.dataAppModel };
    this.sData
      .save(accion, prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem('token', refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else {
          if (this.mnuAccion === 'new') {
            this.QFiltro =
              "ID_ORIGEN_DATO='" + this.dataAppModel.ID_ORIGEN_DATO + "'";
          }
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: '',
            accion: 'r_ini',
            operacion: {},
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          showToast('Registro actualizado', 'success');
          this.mnuAccion = '';
          this.readOnly = true;
          this.readOnlyId = true;          
          this.conCambios = 0;          
        }
      });
  }

  async opEliminar() {
    Swal.fire({
      title: '',
      text: '',
      html:
        '¿Desea Eliminar el orígen de datos <i>' +
        this.dataAppModel.NOMBRE +
        '</i>?',
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.AccionEliminar();
      }
    });
  }

  AccionEliminar() {
    const prm = { ID_ORIGEN_DATO: this.dataAppModel.ID_ORIGEN_DATO };
    this.sData
      .delete('delete', prm)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((data) => {
        try {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          if (res[0].ErrMensaje !== '') {
            this.showModal(res[0].ErrMensaje);
            return;
          }
          this.readOnly = true;          
          this.dataAppModel_prev = [];
          showToast('Orígen de datos eliminado', 'success');
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: '',
            operacion: {},
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.opBlanquearFormGP();
        } catch (error) {
          this.showModal(
            'Error respuesta eliminar orígen de datos: ' +
              error +
              ' Rta:' +
              data.data
          );
        }
      });
  }

  showModal(mensaje: any, 
            titulo: any = '¡Error!', 
            msg_html: any = '', 
            tipo: 'error' | 'warning' | 'success' | 'default' = 'default') {
    let iconHtml = '';
    switch (tipo) {
        case 'success':
            iconHtml = "<i class='icon-check-circle success-color'></i>";
            break;

        case 'warning':
            iconHtml = "<i class='icon-alert-ol warning-color'></i>";
            break;

        case 'error':
            iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
            break;

        default:
            iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
            if (titulo !== '¡Error!') iconHtml = "<i class='icon-alert-ol'></i>";            
    }    
    Swal.fire({
      iconHtml: iconHtml,
      confirmButtonColor: '#0F4C81',
      title: titulo,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }

  ValidaDatos(Accion: string): boolean {
    try {

      if (Accion === 'requerido') {

        if (!this.form?.instance) {
          throw new Error('No se encontró la instancia del formulario.');
        }

        const result = this.form.instance.validate();

        if (!result.isValid) {
          this.showModal(
            'Error al guardar',
            'Faltan datos',
            'Hay datos incompletos. Llena todos los items.'
          );
          return false;
        }

        // Validar componentes de parámetros de conexión
        if (this.dataSourceParams) {
          const isValidChild = this.dataSourceParams.validate();                                   
          if (!isValidChild) {
            const errors = this.dataSourceParams.getValidationErrors();
            const errorMessage = errors.length > 0 
              ? errors.join('<br>') 
              : 'Complete todos los campos requeridos en los parámetros de conexión.';
            
            this.showModal(
              'Error al guardar',
              'Faltan datos en los parámetros de conexión',
              errorMessage
            );
            return false;
          }
        }
      }
      return true;

    } catch (error: any) {
      this.showModal(
        'Error',
        'Validación',
        error?.message || 'Ocurrió un error al validar el formulario.'
      );
      return false;
    }
  }

  onValueChangedApl(e: any) {
    if (e.value !== '') {
      if (this.mnuAccion === 'new') {
        this.ValideExistencia(e);
      }
    }
  }

  onActivoChanged = (e: any) => {
    const defecto = this.dataAppModel.DEFECTO;
    if (e.value === false && defecto === true) {
        this.showModal('Advertencia','Validación','No se puede desactivar la conexión por defecto.','warning');        
        e.component.option('value', true);
        this.dataAppModel.ACTIVO = true;
    }
  };

  onDefectoChanged = (e: any) => {
    if (e.value === true) {

        // Cargar listas de la aplicación
      this.sData
        .consulta('validatedefault',{ID_ORIGEN_DATO: this.dataAppModel.ID_ORIGEN_DATO}, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          if (res[0].ErrMensaje === 'exists') {            
            this.showModal(
                'Advertencia',
                'Validación',
                'Ya existe una conexión configurada como defecto.',
                'warning'
            );
            e.component.option('value', false);
            this.dataAppModel.DEFECTO = false;            
          }
          else if (res[0].ErrMensaje !== '') { 
            this.showModal(
                'Error',
                'Validación',
                res[0].ErrMensaje,
                'error'
            );
          }
        });       
    }
  };
}