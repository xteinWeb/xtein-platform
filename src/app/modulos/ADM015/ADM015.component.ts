import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
import { lastValueFrom, Subject, Subscription } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { ADM015Service } from 'src/app/services/ADM015/ADM015.service';
import Swal from 'sweetalert2';
import { clsUsuarios } from './clsADM015.class';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { DxButtonModule, DxDataGridModule, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLoadPanelModule, DxPopupModule, DxRadioGroupModule, DxSelectBoxModule, DxTabPanelModule, DxTextBoxModule, DxToolbarModule, DxValidatorModule } from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { validatorRes } from 'src/app/shared/validator/validator';
import { ADM01501Component } from './ADM01501/ADM01501.component';
import { ADM01502Component } from './ADM01502/ADM01502.component';
import { ADM01503Component } from './ADM01503/ADM01503.component';
import { ADM01504Component } from './ADM01504/ADM01504.component';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';

import { showToast } from '../../shared/toast/toastComponent.js'
import { ADM01505Component } from './ADM01505/ADM01505.component';

@Component({
    selector: 'app-ADM015',
    templateUrl: './ADM015.component.html',
    styleUrls: ['./ADM015.component.css'],
    standalone: true,
    imports: [DxFormModule, DxValidatorModule, DxDropDownBoxModule, DxDataGridModule, DxSelectBoxModule, DxTabPanelModule, DxRadioGroupModule, DxButtonModule, DxPopupModule, DxTextBoxModule, ADM01501Component, ADM01502Component, ADM01503Component, ADM01504Component, ADM01505Component, VistarapidaComponent, DxLoadPanelModule, DxToolbarModule]
})
export class ADM015Component implements OnInit {
  @ViewChild('formUsuarios', { static: false }) formUser: DxFormComponent;

  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subscription: Subscription;
  subscriptionUser: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string;
  readOnly: boolean = false;
  readOnlyExp: boolean = false;
  esEdicion: boolean = false;
  iniEdicion: boolean = false;
  readOnlyUsuario: boolean = false;
  isGridBoxOpened: boolean;
  visiblePopupPassword: boolean = false;
  VDatosReg: any;
  EXPIRARstr: string;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  gridBoxRol: any[] = [];
  esVisibleSelecc: string = 'none';
  emailPatt: string = "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$";

  // Notificaciones
  toaVisible: boolean;
  toaMessage: string = 'Registro actualizado!';
  toaTipo: string = 'success';
  loadingVisible: boolean = false;
  ErrMensaje: any = '';

  // Variables de datos
  DUsuarios: clsUsuarios;
  DUsuarios_prev: any;
  DRoles: any;
  QFiltro: any;
  colCountByScreen: object;
  rbExpirarPass = ['No Expirar', 'Expirar cada'];
  tabsInfoUser: string[] = [
    'Contraseñas',
    'Aplicaciones',
    'Permisos Especiales',
    'UN Asociadas',
    'Conexiones',
    'Configuraciones Avanzadas',
  ];
  DIntervalo: any = [
    { INTERVALO: 0, DESCRIPCION: 'Dias' },
    { INTERVALO: 1, DESCRIPCION: 'Semanas' },
  ];
  FClave: any = {
    USUARIO: '',
    TIPO: '',
    CLAVE_NUEVA: '',
    CLAVE_NUEVA_CONFIRMAR: ''
  };

  constructor(
    private _sdatos: ADM015Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private tabService: TabService
  ) {

    // Servicio de barra de registro
    this.subscription = this._sbarreg.getObsRegApl().subscribe((datreg) => {
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

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex((d: any) => d.USUARIO === resp.USUARIO);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    })

    // Servicio comunicacion entre pestañas
    this.subscriptionUser = this._sdatos
      .getObs_Usuarios()
      .subscribe((datreg) => {
        // Ejecuta de acuerdo al componente hijo
        switch (datreg.componente) {
          case 'atributos':
            break;

          default:
            break;
        }
      });

    this.opPrepararModificar = this.opPrepararModificar.bind(this);
    this.usuariosValor = this.usuariosValor.bind(this);
    this.ValideExistencia = this.ValideExistencia.bind(this);
    this.setFixedValues = this.setFixedValues.bind(this);
    this.getFixedValues = this.getFixedValues.bind(this);
  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes
    this._sdatos.accion = operMenu.accion;
    switch (operMenu.accion) {
      case 'r_ini':
        const user: any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'USUARIOS',
          aplicacion: 'ADM-015',
          usuario: user,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: {},
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_nuevo':
        this.mnuAccion = 'new';
        this.readOnly = false;
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.readOnly = false;
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        // Acción validación de datos
        this.getFixedValues();
        if (!this.ValidaDatos('requerido')) {
          return;
        } else {
          this.opPrepararGuardar(this.mnuAccion);
        }
        break;

      case 'r_buscar':
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          this.toaVisible = true;
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_buscar_ejec':
        this.opBlanquearForma();
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('');
        } else {
          this.toaVisible = true;
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
        Swal.fire({
          title: '',
          text: 'Desea cancelar la operación?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar',
        }).then((result) => {
          if (result.isConfirmed) {
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this.readOnly = true;
            this.esEdicion = false;
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.DUsuarios = JSON.parse(JSON.stringify(this.DUsuarios_prev));
            this.opIrARegistro('r_numreg');

            // Cancela acciones en los demás componentes
            this.setObsToService('r_cancelar');

            // Restituye los valores
            this.mnuAccion = '';
          }
        });

        break;

      case 'r_vista':
        this.opVista();
        break;

      case 'r_imprimir':
        this.imprimirReporte(
          operMenu.operacion.id_reporte,
          operMenu.operacion.archivo,
          operMenu.operacion.data_rpt
        );
        break;

      case 'r_configurar':
        if (this.DUsuarios.USUARIO !== '') {
          this.FClave.USUARIO = this.DUsuarios.USUARIO;
          this.FClave.TIPO = 'USUARIO';
        } else {
          this.FClave.USUARIO = 'TODOS';
          this.FClave.TIPO = 'ADMINISTRADOR';
        }
        this.visiblePopupPassword = true;
        break;

      default:
        break;
    }
  }

  opPrepararNuevo(): void {
    this.loadingVisible = true;
    this.readOnly = false;
    this.esEdicion = true;
    this.iniEdicion = true;
    this.readOnlyUsuario = false;
    this.opBlanquearForma();
    this.resetValidaciones();

    this.DUsuarios.ESTADO = 'ACTIVO';
    this.DUsuarios.EXPIRARstr = 'No Expirar';

    // Activa componentes
    this._sdatos.accion = 'r_nuevo';
    this.setObsToService(this._sdatos.accion);
    this.loadingVisible = false;
  }

  async opPrepararModificar() {
    this.loadingVisible = true;
    this.readOnly = false;
    this.esEdicion = true;
    this.iniEdicion = true;

    // Activa componentes
    this.setObsToService('r_modificar');

    if (this._sdatos.USUARIO_prev != this.DUsuarios.USUARIO) {
      // Activa modificación si hay integridad a validar
      const prm = { USUARIO: this.DUsuarios.USUARIO, accion: 'integridad' };
      const apiRest = this._sdatos.validellave('EXISTE USUARIO', prm, 'ADM015');
      const res = await lastValueFrom(apiRest, { defaultValue: true });
      const msg = JSON.parse(res.data);
      if (msg[0].EXISTE === true && this._sdatos.accion === 'r_nuevo') {
        var fNextEditor: any = this.formUser.instance.getEditor('USUARIO');
        showToast(msg[0].ErrMensaje, 'error');
        fNextEditor.option('readOnly', false);
      }
      else {
        var fNextEditor: any = this.formUser.instance.getEditor('USUARIO');
        fNextEditor.option('readOnly', false);
      }
    }
    this.loadingVisible = false;
  }

  opPrepararGuardar(accion: string): void {

    this.setObsToService('r_guardar');

    // if(this._sdatos.D_UNAsociadas.length < 1){
    //   this.showModal('Error al guardar',"Faltan datos","Debe asociar al menos una Unidad de Negocio al Usuario!");
    //   return;
    // }
    // if(this._sdatos.D_Conexiones.length < 1){
    //   this.showModal('Error al guardar',"Faltan datos","Debe asociar al menos una Conexión al Usuario!");
    //   return;
    // }

    // Valida si hay una acción pendiente de actualización de datos
    let msg_edc = '';
    if (this._sdatos.M_esEdicionAutorizaciones) msg_edc = (msg_edc !== '' ? msg_edc + ', ' : 'Hay una actualización pendiente de datos en: ') + 'Aplicaciones';

    if (this._sdatos.M_esEdicionPermisosEspeciales) msg_edc = (msg_edc !== '' ? msg_edc + ', ' : 'Hay una actualización pendiente de datos en: ') + 'Permisos Especiales';

    if (this._sdatos.M_esEdicionUNAsociadas) msg_edc = (msg_edc !== '' ? msg_edc + ', ' : 'Hay una actualización pendiente de datos en: ') + 'Unidades de Negocios Asociadas';

    if (typeof this._sdatos.D_PermisosEspeciales != "undefined") {
      var permisosEspeciales = this._sdatos.D_PermisosEspeciales.map(({
        TRANSACCION, PERMISO, APROBACION }: any) => ({ TRANSACCION, PERMISO, APROBACION }))
    }

    const prmDatosGuardar = JSON.parse(
      (JSON.stringify({ USUARIOS: this.DUsuarios }) +
        JSON.stringify({ AUTORIZACIONES: this._sdatos.D_Autorizaciones ??= [] }) +
        JSON.stringify({ PERMISOS_ESPECIALES: permisosEspeciales ??= [] }) +
        JSON.stringify({ UN_ASOCIADAS: this._sdatos.D_UNAsociadas ??= [] }) +
        JSON.stringify({ CONEXIONES: this._sdatos.D_Conexiones ??= [] }) +
        JSON.stringify({ SETTINGS: this._sdatos.D_Aplicaciones ??= [] })
      ).replace(/}{/g, ",")
    );

    this.loadingVisible = true;
    // API guardado de datos
    var exito = false;
    this._sdatos
      .save(accion, prmDatosGuardar, this.prmUsrAplBarReg.aplicacion)
      .subscribe((resp) => {
        this.loadingVisible = false;
        const res = JSON.parse(resp.data);
        if (res[0].ErrMensaje !== "") {
          this.showModal(res[0].ErrMensaje);
        }
        else {
          this.readOnly = true;
          this.esEdicion = false;
          // Operaciones de barra
          if (this.mnuAccion === 'new') {
            this.QFiltro = "USUARIO='" + this.DUsuarios.USUARIO + "'";
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              r_numReg: 1,
              r_totReg: 1,
              operacion: {}
            };
          }
          else
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              operacion: {}
            };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.toaVisible = true;
          showToast('Registro actualizado', 'success');

          // Inactiva cambios
          const objControl = ['__obj__ddAutorizaciones', '__obj__ddPermisosEspeciales', '__obj__ddUnidadNegocio', '__obj__ddConexiones'];
          objControl.forEach(c => {
            this.cambiosItemForma({ dataField: c }, 'inactivar');
          })
        }
      });
  }

  opEliminar(): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html:
        'Desea eliminar el Usuario <i>' +
        this.DUsuarios.USUARIO +
        ' ' +
        this.DUsuarios.NOMBRE +
        '</i> ?',
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar',
    }).then((result) => {
      // Procesa eliminación. Llama a la API para validar referenciación y eliminación en tabla
      if (result.isConfirmed) {
        this.AccionEliminar();
      }
    });
  }

  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Usuarios',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: '',
      Filtro: '',
      keyGrid: ['USUARIO'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  opPrepararBuscar(accion: any): void {
    if (accion === 'filtro') {
      this._sfiltro.PrmFiltro = {
        Titulo: 'Datos de filtro para Usuarios',
        accion: 'PREPARAR FILTRO',
        Filtro: '',
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { USUARIOS: arrFiltro };
      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje === '') {
            this.VDatosReg = datares;
            this.DUsuarios = datares[0];
            this._sdatos.USUARIO = this.DUsuarios.USUARIO;
            this._sdatos.USUARIO_prev = this.DUsuarios.USUARIO;
            this._sdatos.ROL = this.DUsuarios.ID_ROL;
            this.QFiltro = datares[0].QFILTRO;
            this.setFixedValues();
          } else {
            this.VDatosReg = [];
            showToast(datares[0].ErrMensaje, 'warning');
            this.opBlanquearForma();
          }

          // Prepara la barra para navegación
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            r_totReg: datares.length,
            r_numReg: 1,
            accion: 'r_navegar',
            operacion: {},
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

          // Trae los items en los componentes asociados
          this.opIrARegistro('r_primero');
          this.loadingVisible = false;
          this._sfiltro.enConsulta = false;
        });
    }

    this.readOnly = true;
    this.resetValidaciones();
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = 'r_numreg';
    switch (accion) {
      case 'r_primero':
        this.prmUsrAplBarReg.r_numReg = 1;
        if (this.VDatosReg.length != 0) {
          this.DUsuarios = JSON.parse(JSON.stringify(this.VDatosReg[0]));
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
        this.DUsuarios = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DUsuarios = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DUsuarios = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_numreg':
        if (this.prmUsrAplBarReg.r_numReg !== 0) {
          // Valida si hubo cambio de ordenamiento en el visor
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
          this.DUsuarios = JSON.parse(
            JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
          );
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearForma();
          this.resetValidaciones();
          setTimeout(() => {
            this.formUser.instance.reset();
          }, 100);
        }
        this.readOnly = true;
        break;
      case 'Eliminado':
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          this.DUsuarios = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        } else {
          this.opBlanquearForma();
        }
        break;
      default:
        break;
    }

    this.DUsuarios.USUARIO = this.DUsuarios == null ? "" : this.DUsuarios.USUARIO;
    this._sdatos.USUARIO = this.DUsuarios.USUARIO;

    // Navega  los componentes items
    this._sdatos.accion = 'r_numreg';
    this._sdatos.setObs_UsuarioAutorizaciones({ accion: 'r_numreg', USUARIO: this.DUsuarios.USUARIO });
    this._sdatos.setObs_UsuarioPermisosEspeciales({ accion: 'r_numreg', USUARIO: this.DUsuarios.USUARIO });
    this._sdatos.setObs_UsuarioUNAsociadas({ accion: 'r_numreg', USUARIO: this.DUsuarios.USUARIO });
    this._sdatos.setObs_UsuarioConexiones({ accion: 'r_numreg', USUARIO: this.DUsuarios.USUARIO });

    this.setFixedValues();
  }

  opBlanquearForma(): void {
    this.DUsuarios = {
      USUARIO: '',
      NOMBRE: '',
      ID_ROL: '',
      FECHA_CREACION: '',
      CLAVE_PRIMARIA: '',
      CLAVE_SECUNDARIA: '',
      CLAVE_TERCIARIA: '',
      EXPIRARstr: '',
      EXPIRAR: false,
      TIEMPO_INTERVALO: 0,
      INTERVALO: 0,
      CAMBIAR_CLAVE: true,
      ESTADO: '',
      FECHA_CONFIGURACION: '',
      IMAGEN: '',
      EMAIL: '',
      TIEMPO_SESION: 0
    };
    this._sdatos.USUARIO = '';
    this._sdatos.USUARIO_prev = '';
    this._sdatos.D_Autorizaciones = [];
    this._sdatos.D_Conexiones = [];
    this._sdatos.D_Aplicaciones = [];
    this._sdatos.D_PermisosEspeciales = [];
    this._sdatos.D_UNAsociadas = [];
    this.DUsuarios_prev = JSON.parse(JSON.stringify(this.DUsuarios));
  }

  onItemClickTab(e: any) {
    if (e.itemData === 'Aplicaciones') {
      this._sdatos.setObs_UsuarioAutorizaciones({ accion: 'r_refrescar' });
    }
    if (e.itemData === 'Permisos Especiales') {
      this._sdatos.setObs_UsuarioPermisosEspeciales({ accion: 'r_refrescar' });
    }

    if (e.itemData === 'UN Asociadas') {
      this._sdatos.setObs_UsuarioUNAsociadas({ accion: 'r_refrescar' });
    }

    if (e.itemData === 'Conexiones') {
      this._sdatos.setObs_UsuarioConexiones({ accion: 'r_refrescar' });
    }

    // Valida datos completados
    if (this.mnuAccion.match('new|update')) {
      var result = this.formUser.instance.validate();
      if (!result.isValid) {
        showToast('Faltan completar datos del Usuario', 'warning');
      }
    }
  }

  onSeleccTipoClave(e: any) {

  }

  verificarClave = () => this.FClave.CLAVE_NUEVA;

  cerrar() {
    this.FClave = { USUARIO: '', TIPO: '', CLAVE_NUEVA: '', CLAVE_NUEVA_CONFIRMAR: '' };
    this.visiblePopupPassword = false;
  }

  cambiarPassword(e: any) {
    if (this.validarPassword(e)) {
      this.sendDataPassword(e);
    } else {
      showToast(this.ErrMensaje, 'error');
    }
  }

  validarPassword(e: any) {
    const user = e.USUARIO;
    const pass1: any = e.CLAVE_NUEVA;
    const pass2: any = e.CLAVE_NUEVA_CONFIRMAR;

    if ((user !== '') || (pass1 !== '') || (pass2 !== '') || (e.TIPO !== '')) {
      if ((pass1.length >= 6) || (pass2.length >= 6)) {
        if (pass1 === pass2) {
          this.ErrMensaje = 'OK';
          return true;
        } else {
          this.ErrMensaje = 'Las contraseñas no coinciden!';
          return false;
        }
      } else {
        this.ErrMensaje = 'La contraseña debe tener mínimo 6 caracteres.';
        return false;
      }
    } else {
      this.ErrMensaje = 'ERROR: Llene el formulario.';
      return false;
    }
  }

  sendDataPassword(e: any) {
    const prm = { USUARIO: e.USUARIO, PASSWORD: e.CLAVE_NUEVA, TIPO: e.TIPO };
    this._sdatos.changePassword('GENERAR PASSWORD', prm, 'ADM-015').subscribe((data: any) => {
      const res = JSON.parse(data.data);
      const mensaje = res[0].ErrMensaje;
      if (mensaje !== '') {
        this.showModal(mensaje);
      } else {
        showToast('Contraseña Actualizada', 'success');
      }
      this.visiblePopupPassword = false;
      this.FClave = {
        USUARIO: '',
        TIPO: '',
        CLAVE_NUEVA: '',
        CLAVE_NUEVA_CONFIRMAR: ''
      };
    });
  }

  // onEditorEnterKey(e:any){
  //   e.event.preventDefault();
  //   var itemsgru:any = this.formUser.instance.option('items');
  //   itemsgru.forEach((g:any) => {
  //     var items = g['items'];
  //     var index = items.findIndex((item:any) => item.dataField === e.dataField);
  //     if (index !== -1){
  //       var fNextEditor = this.formUser.instance.getEditor(
  //         items[++index < items.length ? index : 0].dataField
  //       );
  //       if (fNextEditor) fNextEditor.focus();
  //       return;
  //     }
  //   });
  // }

  onSelectionChangedRol(e: any) {
    this.gridBoxRol = e.selectedRowKeys;
    this.isGridBoxOpened = false;
    this._sdatos.ROL = e.selectedRowKeys[0];
    this._sdatos.setObs_AppsRol(this._sdatos.ROL);
  }

  onSeleccEstado(e: any): void {
    if (e.value != null) {
      this.DUsuarios.ESTADO = e.value;
    }
  }

  onSeleccIntervalo(e: any): void {
    if (e.value != null) {
      this.DUsuarios.INTERVALO = e.value;
    }
  }

  onSeleccExpirar(e: any): void {
    if (e.value != null) {
      this.DUsuarios.EXPIRAR = e.value === this.rbExpirarPass[1] ? true : false;
    }
  }

  usuariosValor(e: any) {
    if (e.value != null && this.DUsuarios != null) {
      this.DUsuarios.USUARIO = e.value;
      this._sdatos.USUARIO = this.DUsuarios.USUARIO;
      this._sdatos.USUARIO_prev = this.DUsuarios.USUARIO;
    }
  }

  async ValideExistencia(e: any) {
    if (this.readOnly || !this.mnuAccion.match('new|update')) {
      return true;
    }
    if (
      this.mnuAccion === 'update' &&
      this._sdatos.USUARIO_prev === e.value
    ) {
      return true;
    }

    // Valida la existencia de la llave respectiva
    const prm = { USUARIO: e.value, accion: this.mnuAccion };
    const apiRest = this._sdatos.validellave('EXISTE USUARIO', prm, 'ADM015');
    const res = await lastValueFrom(apiRest, { defaultValue: true });
    const msg = JSON.parse(res.data);
    if (msg[0].EXISTE === true) {
      showToast(msg[0].ErrMensaje, 'error');
      var fNextEditor: any = this.formUser.instance.getEditor('USUARIO');
      fNextEditor.focus();
      return false;
    }
    else {
      return true;
    }
  }

  getFixedValues() {
    this.getExpirarStr();
    this.DUsuarios.ID_ROL = this.gridBoxRol === null ? '' : this.gridBoxRol[0];
  }

  setFixedValues() {
    this.setExpirarStr();
    this.gridBoxRol = [this.DUsuarios.ID_ROL];
  }

  getExpirarStr() {
    if (this.DUsuarios.EXPIRARstr === this.rbExpirarPass[1]) {
      this.DUsuarios.EXPIRAR === true;
    } else {
      this.DUsuarios.EXPIRAR === false;
    }
  }

  setExpirarStr() {
    if (this.DUsuarios.EXPIRAR === true) {
      this.DUsuarios.EXPIRARstr = this.rbExpirarPass[1];
    } else {
      this.DUsuarios.EXPIRARstr = this.rbExpirarPass[0];
    }
  }

  AccionEliminar(): void {
    // API eliminación de datos
    const prm = { USUARIO: this.DUsuarios.USUARIO };
    this._sdatos
      .delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        this.opIrARegistro('Eliminado');
        this.readOnly = true;
        showToast('Usuario eliminado', 'success');

        // Operaciones de barra
        this.prmUsrAplBarReg.r_totReg--;
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          error: '',
          accion: 'r_navegar',
          operacion: {},
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      });
  }

  ValidaDatos(Accion: string): boolean {
    // Valida datos completados de pestaña <Generales>
    var result = this.formUser.instance.validate();

    if (Accion === "requerido") {
      if (this.DUsuarios.USUARIO === "" ||
        this.DUsuarios.NOMBRE === "" ||
        this.DUsuarios.ID_ROL === "" ||
        this.DUsuarios.EMAIL === "" ||
        (this.DUsuarios.EXPIRAR === true && this.DUsuarios.TIEMPO_INTERVALO === 0)
      ) {
        this.showModal('Error al guardar', "Faltan datos", "Hay datos incompletos del Usuario. Revisar contenido de los items marcados!");
        return false;
      }
    }
    return true;
  }

  valoresObjetos(obj: string) {
    if (obj == 'roles' || obj == 'todos') {
      const prm = {};
      this._sdatos
        .consulta('ROLES', prm, 'generales')
        .subscribe((data: any) => {
          const res: any = validatorRes(data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DRoles = res;
        });
    }
    if (obj == 'settings aplicacion' || obj == 'todos') {
      const prm = {};
      this._sdatos.consulta('settings_aplicacion', prm, 'ADM015').subscribe((data: any) => {
        const res = validatorRes(data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje === "") {
          if (res[0].ID_APLICACION !== null && res[0].ID_APLICACION !== undefined) {
            this._sdatos.DSAplicaciones = res
          } else {
            let newArray: any[] = [];
            this._sdatos.DSAplicaciones.forEach((newData: any) => {
              newData.ASIGNAR = false;
              newArray.push(newData);
            })
            this._sdatos.DSAplicaciones = newArray;
          }
        } else {
          showToast(res[0].ErrMensaje, 'warning');
        }
      });
    }
  }

  cambiosItemForma(e: any, accion = 'activar') {
    if (accion === 'activar') {
      if (!this.iniEdicion && !this.readOnly) {
        if (!e.dataField.match('__obj__')) {
          var dataField = e.dataField;
          document.getElementsByName(dataField)[0].classList.add('is-dirty');
        } else {
          var dataField = e.dataField.replace('__obj__', '');
          document.getElementById(dataField)?.classList.add('is-dirty');
        }
      }
    } else {
      if (!e.dataField.match('__obj__')) {
        var dataField = e.dataField;
        document.getElementsByName(dataField)[0].classList.remove('is-dirty');
      } else {
        var dataField = e.dataField.replace('__obj__', '');
        if (document.getElementById(dataField))
          document.getElementById(dataField)?.classList.remove('is-dirty');
      }
    }
  }

  resetValidaciones() {
    this.formUser.instance.reset();
  }

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

  ngOnInit(): void {
    const user: any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: 'USUARIOS',
      aplicacion: 'ADM-015',
      usuario: user,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: {},
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this.readOnly = true;
    this._sdatos.accion = 'r_ini';

    this.valoresObjetos('todos');
    this.opBlanquearForma();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subscriptionUser.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  setObsToService(accion: any) {
    this._sdatos.setObs_UsuarioAutorizaciones({ accion: accion });
    this._sdatos.setObs_UsuarioPermisosEspeciales({ accion: accion });
    this._sdatos.setObs_UsuarioUNAsociadas({ accion: accion });
    this._sdatos.setObs_UsuarioConexiones({ accion: accion });
  }

  showModal(mensaje: any, titulo = '¡Error!', msg_html = '') {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
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

@NgModule({
  imports: [
    DxToolbarModule,
    DxPopupModule,
    DxButtonModule
  ]
})
export class AppModule { }
