
import { Component } from '@angular/core';
import { DxCheckBoxModule, DxDateBoxModule, DxFileUploaderModule, DxFormModule, DxSelectBoxModule, DxTextAreaModule, DxTextBoxModule } from 'devextreme-angular';
import { Subject, Subscription, takeUntil, lastValueFrom } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { ADM201Service } from 'src/app/services/ADM201/ADM201.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { showToast } from '../../shared/toast/toastComponent.js';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import Swal from 'sweetalert2';
import { Aplicaciones } from './clsADM201.class';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';

@Component({
    selector: 'app-ADM201',
    imports: [
    DxFormModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxCheckBoxModule,
    DxDateBoxModule,
    DxFileUploaderModule,
    DxTextAreaModule,
    VistarapidaComponent,
    GeninformesComponent
],
    templateUrl: './ADM201.component.html',
    styleUrls: ['./ADM201.component.css']
})
export class ADM201Component {
  DAplicaciones: Aplicaciones;
  DAplicaciones_prev: any;
  idAppPadreItems: any;
  tipoItems: any = ['MODULO', 'APLICACION', 'MENU', 'GRUPO'];
  estadoItems: any = ['ACTIVO', 'INACTIVO'];
  tipoSistemaItems: any = ['WEB', 'MOVIL', 'ESCRITORIO'];

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
  expandGrupos: boolean = true;
  readOnlyEstado: boolean = true;
  integridadReferencial: boolean = false;
  conCambios: number = 0;
  loadingVisible: boolean = false;

  constructor(
    private sData: ADM201Service,
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
        (d) => d.ID_APLICACION === resp.ID_APLICACION
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
    this.DAplicaciones = {
      ID_APLICACION: '',
      ID_APLICACION_PADRE: '',
      NOMBRE: '',
      TIPO: '',
      NOMBRE_PROGRAMA: '',
      TABLA_APLICACION: '',
      DIRECTORIO: '',
      PARAMETROS: '',
      TIPO_SISTEMA: '',
      FECHA_VIGENCIA: new Date(),
      GENERA_CONTABILIDAD: false,
      URL_IMAGEN: '',
      ESTADO: 'ACTIVO',
      COMENTARIOS: '',
    };
    this.USUARIO = localStorage.getItem('usuario')?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'APLICACIONES',
      aplicacion: 'ADM-201',
      usuario: this.USUARIO,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_refrescar: true },
    };
    this.mnuAccion = '';
    this.readOnly = true;
    this.readOnlyEstado = true;
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

    this.valoresObjetos('todos');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  valoresObjetos(obj: string) {
    if (obj === 'todos' || obj === 'ID_APLICACION_PADRE') {
      // Cargar lista de Aplicaciones para ID_APLICACION_PADRE
      this.sData
        .consulta(
          'APLICACIONES',
          { TIPO: 'MODULO' },
          this.prmUsrAplBarReg.aplicacion
        )
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          if (res[0].ErrMensaje === '') {
            this.idAppPadreItems = res;
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
          tabla: 'APLICACIONES',
          aplicacion: 'ADM-201',
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
        this.readOnlyEstado = false;
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
        // showToast('No hay cambios a guardar', 'warning');
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
            this.readOnlyEstado = true;
            this.conCambios = 0;
            this.mnuAccion = '';
            this.prmUsrAplBarReg.accion =
              this.VDatosReg?.length > 0 ? 'r_navegar' : 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            if (
              this.DAplicaciones_prev === undefined ||
              this.DAplicaciones_prev === '' ||
              this.DAplicaciones_prev === null ||
              this.DAplicaciones_prev.length === 0
            ) {
              this.opBlanquearFormGP();
            } else {
              this.DAplicaciones = JSON.parse(
                JSON.stringify(this.DAplicaciones_prev)
              );
            }
          }
        });
        break;

      case 'r_copiar':
        // if (this.FGrupos.ID_GRUPO !== '') {
        //   this.mnuAccion = 'new';
        //   this.readOnly = false;

        //   this.conCambios = 0;
        //   Swal.fire({
        //     title: '',
        //     text: 'Para copiar este Registro recuerde: Se agregara un nuevo Código.',
        //     iconHtml: "<i class='icon-alert-ol'></i>",
        //     showCancelButton: false,
        //     confirmButtonColor: '#DF3E3E',
        //     confirmButtonText: 'Aceptar',
        //   }).then((result) => {
        //     if (result.isConfirmed) {
        //       this.mnuAccion = 'copiar';
        //       this.opPrepararModificar();
        //       this.copiarSeccion();
        //       this.formGrupos.instance._refresh();
        //     }
        //   });
        // } else {
        //   this.mnuAccion = '';
        //   showToast('Seleccione sección a copiar', 'Error');
        // }
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
    this.DAplicaciones.ESTADO = 'ACTIVO';
  }

  opBlanquearFormGP(): void {
    this.DAplicaciones_prev = JSON.parse(JSON.stringify(this.DAplicaciones)); // Guardar datos previos antes de blanquear
    this.DAplicaciones = {
      ID_APLICACION: '',
      ID_APLICACION_PADRE: '',
      NOMBRE: '',
      TIPO: '',
      NOMBRE_PROGRAMA: '',
      TABLA_APLICACION: '',
      DIRECTORIO: '',
      PARAMETROS: '',
      TIPO_SISTEMA: '',
      FECHA_VIGENCIA: new Date(),
      GENERA_CONTABILIDAD: false,
      URL_IMAGEN: '',
      ESTADO: 'ACTIVO',
      COMENTARIOS: '',
    };
  }

  async opPrepararModificar() {
    this.DAplicaciones_prev = JSON.parse(JSON.stringify(this.DAplicaciones));
    this.readOnly = false;
    this.readOnlyEstado = true;
  }

  opPrepararBuscar(accion: any): void {
    if (accion === 'filtro') {
      this._sfiltro.PrmFiltro = {
        Titulo: 'Datos de filtro para Aplicaciones',
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
      const prm = { APLICACIONES: arrFiltro };

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
              this.DAplicaciones = datares[0];
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
              this.prmUsrAplBarReg.accion = 'r_cancelar';
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
          : " APLICACIONES.ID_APLICACION = '" +
            this.DAplicaciones.ID_APLICACION +
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
          this.DAplicaciones = JSON.parse(JSON.stringify(this.VDatosReg[0]));
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
        this.DAplicaciones = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DAplicaciones = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DAplicaciones = JSON.parse(
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
          this.DAplicaciones = JSON.parse(
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
      Titulo: 'APLICACIONES',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: [
        'ID_APLICACION|APLICACIÓN',
        'NOMBRE|NOMBRE',
        'TIPO|TIPO',
        'ESTADO|ESTADO',
      ],
      Filtro: '',
      keyGrid: ['ID_APLICACION'],
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
        this.DAplicaciones_prev.ID_APLICACION === e.value)
    ) {
      aprob = true;
    }
    if (!aprob) {
      const prm = { ID_APLICACION: e.value };
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
        this.showModal('Aplicación ' + e.value + ' ya existe', '¡IMPORTANTE!');
        aprob = false;
      }
    }
    return aprob;
  }

  async opPrepararGuardar(accion: string): Promise<void> {
    if (this.ValidaDatos('requerido') === false) {
      return;
    }
    if (!await this.ValideExistencia({ value: this.DAplicaciones.ID_APLICACION })) {
      return;
    }
    const sendData = {
      ID_APLICACION: this.DAplicaciones.ID_APLICACION,
      ID_APLICACION_PADRE: this.DAplicaciones.ID_APLICACION_PADRE,
      NOMBRE: this.DAplicaciones.NOMBRE,
      TIPO: this.DAplicaciones.TIPO,
      NOMBRE_PROGRAMA: this.DAplicaciones.NOMBRE_PROGRAMA,
      TABLA_APLICACION: this.DAplicaciones.TABLA_APLICACION,
      DIRECTORIO: this.DAplicaciones.DIRECTORIO,
      PARAMETROS: this.DAplicaciones.PARAMETROS,
      TIPO_SISTEMA: this.DAplicaciones.TIPO_SISTEMA,
      FECHA_VIGENCIA: this.DAplicaciones.FECHA_VIGENCIA,
      GENERA_CONTABILIDAD: this.DAplicaciones.GENERA_CONTABILIDAD,
      URL_IMAGEN: this.DAplicaciones.URL_IMAGEN,
      ESTADO: this.DAplicaciones.ESTADO,
      COMENTARIOS: this.DAplicaciones.COMENTARIOS,
    };

    var prm: any = { APLICACIONES: this.DAplicaciones };
    // console.log(this.DAplicaciones);

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
              "ID_APLICACION='" + this.DAplicaciones.ID_APLICACION + "'";
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
          this.readOnlyEstado = true;
          this.conCambios = 0;
        }
      });
  }

  async opEliminar() {
    Swal.fire({
      title: '',
      text: '',
      html:
        '¿Desea Eliminar la Aplicación <i>' +
        this.DAplicaciones.ID_APLICACION +
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
    const prm = { ID_APLICACION: this.DAplicaciones.ID_APLICACION };
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
          this.DAplicaciones_prev = [];
          showToast('Aplicación eliminada', 'success');
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: '',
            operacion: {},
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.opBlanquearFormGP();
        } catch (error) {
          this.showModal(
            'Error respuesta eliminar aplicación: ' +
              error +
              ' Rta:' +
              data.data
          );
        }
      });
  }

  showModal(mensaje: any, titulo: any = '¡Error!', msg_html: any = '') {
    let iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
    if (titulo !== '¡Error!') iconHtml = "<i class='icon-alert-ol'></i>";
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
    if (Accion === 'requerido') {
      if (
        this.DAplicaciones.ID_APLICACION === '' ||
        this.DAplicaciones.NOMBRE === '' ||
        this.DAplicaciones.ESTADO === ''
      ) {
        this.showModal(
          'Error al guardar',
          'Faltan datos',
          'Hay datos incompletos. Llena todos los items!'
        );
        return false;
      }
    }
    return true;
  }

  onValueChanged(e: any) {
    // console.log(e.value);
    this.DAplicaciones.ID_APLICACION_PADRE = e.value;
    // if (e.value !== null || e.value !== undefined || e.value !== '') {
    //   this.conCambios++;
    // }
  }

  onValueChangedApl(e: any) {
    if (e.value !== '') {
      if (this.mnuAccion === 'new') {
        this.ValideExistencia(e);
      }
    }
  }

  // getAplicacionPadreNombre(idAppPadre: string): string {
  //   const appPadre = this.idAppPadreItems.find((app: any) => app.ID_APLICACION === idAppPadre);
  //   return appPadre ? appPadre.NOMBRE : '';
  // }
}
