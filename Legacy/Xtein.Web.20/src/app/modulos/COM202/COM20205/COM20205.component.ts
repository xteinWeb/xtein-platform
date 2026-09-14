import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxDataGridModule, DxDateBoxModule, DxFormModule, DxPopupModule, DxScrollViewModule, DxSelectBoxComponent, DxSelectBoxModule, DxTagBoxComponent, DxTagBoxModule, DxTextAreaModule, DxTextBoxModule, DxValidatorModule } from 'devextreme-angular';
import { elementAt, Observable, Subject, Subscription } from 'rxjs';
import { clsGestionCompra } from '../clsCOM202.class';
import { CommonModule, DatePipe } from '@angular/common';
import { COM200Service } from 'src/app/services/COM200/COM200.service';
import { environment } from 'src/environments/environment';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import Swal from 'sweetalert2';
import { showToast } from '../../../shared/toast/toastComponent.js';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { SocketService } from 'src/app/services/socket/socket.service';

const hoy: Date = new Date();
hoy.setHours(0, 0, 0, 0);

interface configFechaentrega {
  readOnly: boolean;
  displayFormat: string;
  type: string;
  value: Date;
  min: Date;
  useMaskBehavior: boolean;
}

interface listaPrueba {
  ID: number;
  NombreVisual: string;
}

interface ResponsesListaCausal {
  data: DListaCausal[];
  token: string;
}

interface DListaCausal {
  ID_DOMINIO: IDDominio;
  ID_GRUPO_DOMINIO: IDGrupoDominio;
  ITEM: number;
  VALOR1: string;
  VALOR2: string;
  VALOR3: string;
  VALOR4: string;
  ErrMensaje: string;
}

enum IDDominio {
  Compras = "COMPRAS",
}

enum IDGrupoDominio {
  CausasReprogramacion = "CAUSAS REPROGRAMACION",
}

interface configCausal {
  dataSource: DListaCausal[] | Observable<DListaCausal[]>;
  displayExpr: string;
  valueExpr: string;
  searchEnabled: boolean;
  noDataText: string;
}


@Component({
  selector: 'app-COM20205',
  templateUrl: './COM20205.component.html',
  styleUrls: ['./COM20205.component.css'],
  imports: [
    DxPopupModule,
    DxTextAreaModule,
    DxFormModule,
    DxDateBoxModule,
    DxValidatorModule,
    DxTextBoxModule,
    CommonModule,
    DxSelectBoxModule,
    DxTagBoxModule,
    DxDataGridModule,
    DxScrollViewModule,
  ],
  standalone: true,
})
export class COM20205Component {
  @ViewChild('dxEmail', { static: false }) dxEmail: DxTagBoxComponent;

  visiblePopup: boolean = false;
  listaValores: any[] = [];
  ivaDefecto: any;
  seleccionValor: any[] = [];
  DListaAccion: any[] = [];
  DListaEmail: any[] = [];
  DListaCausales: DListaCausal[] = [];
  DSeguimiento: clsGestionCompra;
  DItemsGestionCompra: any;
  configBotonAceptar: any;
  configBotonCancelar: any;
  configFechaEntrega: configFechaentrega;
  configCausal: configCausal;
  indInicio: boolean = true;
  descJustificacion: string = '';
  seleccAccionOC: any;
  perfilButton: any;
  perfilEmail: any;
  prmUsrAplBarReg: clsBarraRegistro;
  fechaEntregaOriginal: Date | null;
  nombreUsuario: string = ''; // Nombre completo del usuario
  protected listaOpcionesPrueba: listaPrueba[] = [
    { ID: 1, NombreVisual: 'Opción 1' },
    { ID: 2, NombreVisual: 'Opción 2' },
    { ID: 3, NombreVisual: 'Opción 3' },
  ];

  private eventsSubscription: Subscription;
  eventsSubjectSbox: Subject<any> = new Subject<any>();
  popupVisible: boolean = false;
  popUpGrid: any;
  componentSbox: any;
  documento: string;

  @Input() events: Observable<any>;

  @Input() visible: boolean;

  @Output() onRespuestaSeg = new EventEmitter<any>();

  constructor(
    private datepipe: DatePipe,
    private _sdatos: COM200Service,
    private _sgenerales: GeneralesService,
    private socket: SocketService,
  ) {
    this.configBotonAceptar = {
      icon: 'todo',
      text: 'Aceptar',
      elementAttr: { class: 'btnAceptar' },
      onClick: this.accionPopUp.bind(this, 'aceptar'),
    };
    this.configBotonCancelar = {
      icon: 'close',
      text: 'Cancelar',
      elementAttr: { class: 'btnCancelar' },
      onClick: this.accionPopUp.bind(this, 'cancelar'),
    };

    this.perfilButton = {
      icon: 'spinnext',
      type: 'default',
      onClick: (e) => {
        this.enviarEmail();
      },
    };
    this.perfilEmail = {
      icon: 'email',
      type: 'default',
      onClick: (e) => {
        this.listaEmail();
      },
    };

    this.disableDates = this.disableDates.bind(this);
  }

  onChangeFechaGes(e) {
    this.DSeguimiento.FECHA_GESTION = e.value;
    // this.fechaEntrega.instance._refresh();
  }
  onChangeFechaProg(e) {
    this.DSeguimiento.FECHA_PROGRAMADA = e.value;
    // this.fechaEntrega.instance._refresh();
  }
  onValueChangedObs(e) { }
  onValueChangedProg(e) {
    this.DSeguimiento.PROGRAMAR = !this.DSeguimiento.PROGRAMAR;
  }
  onValueChangedGes(e) {
    this.DSeguimiento.GESTIONAR = !this.DSeguimiento.GESTIONAR;
  }
  onValueChangedCerrar(e) {
    this.DSeguimiento.CERRAR = !this.DSeguimiento.CERRAR;
  }
  onValueChangedEnviarEmail(e) {
    this.DSeguimiento.ENVIAR_EMAIL = !this.DSeguimiento.ENVIAR_EMAIL;
  }

  disableDates(args: any) {
    const today = new Date();
    const fhoy = this.datepipe.transform(today, 'MM/dd/yyyy');
    const fcal = this.datepipe.transform(args.date, 'MM/dd/yyyy');
    const ford = this.datepipe.transform(
      this.DSeguimiento.FECHA_SOLICITUD,
      'MM/dd/yyyy',
    );
    const dfhoy = new Date(fhoy!);
    const dfcal = new Date(fcal!);
    const dford = new Date(ford!);
    return dfcal < (dford == undefined ? dfhoy : dford);
  }

  accionPopUp(accion) {
    if (accion === 'aceptar' && this.DSeguimiento.ULT_ESTADO != 'CERRADA') {
      this.aceptarAccion();
    } else {
      // Al cerrar el modal, resetear valores a false
      this.DSeguimiento.GESTIONAR = false;
      this.DSeguimiento.REPROGRAMAR = false;
      this.visiblePopup = false;
    }
  }
  aceptarAccion() {
    this.indInicio = true;

    // --- LÓGICA DE DETECCIÓN DE CAMBIO REAL (UNIFICADA) ---
    let fechaModificada = false;

    // Validamos que ambas existan antes de usar setSeconds
    if (this.DSeguimiento.FECHA_REPROGRAMADA && this.fechaEntregaOriginal) {
      const d1 = new Date(this.DSeguimiento.FECHA_REPROGRAMADA).setSeconds(0, 0);
      const d2 = new Date(this.fechaEntregaOriginal).setSeconds(0, 0);
      fechaModificada = d1 !== d2;
    }
    // Si no había original pero el usuario eligió una fecha (o viceversa)
    else if (this.DSeguimiento.FECHA_REPROGRAMADA !== this.fechaEntregaOriginal) {
      fechaModificada = true;
    }

    if (fechaModificada && (!this.DSeguimiento.VALOR_CAUSAL || this.DSeguimiento.VALOR_CAUSAL.trim() === '')) {
      showToast('Debe seleccionar una causal al reprogramar!', 'error');
      return;
    }

    this.DSeguimiento.REPROGRAMAR = fechaModificada;
    this.DSeguimiento.GESTIONAR = !fechaModificada;

    // Valida datos completos
    let cMsg = '';
    if (this.DSeguimiento.OBSERVACIONES == '')
      cMsg += 'Faltan registrar observaciones!\n';
    // if (this.DSeguimiento.PROGRAMAR && this.DSeguimiento.ACCION == '')
    //   cMsg += 'Debe definir una accion programada!\n';

    // Valida que si la fecha de entrega fue modificada, debe tener causal
    if ((!this.fechaEntregaOriginal && this.DSeguimiento.FECHA_REPROGRAMADA) || (this.fechaEntregaOriginal && this.DSeguimiento.FECHA_REPROGRAMADA &&
      new Date(this.DSeguimiento.FECHA_REPROGRAMADA).getTime() !== new Date(this.fechaEntregaOriginal).getTime())) {
      fechaModificada = true;
    }

    if (fechaModificada && (!this.DSeguimiento.VALOR_CAUSAL || this.DSeguimiento.VALOR_CAUSAL.trim() === '')) {
      cMsg += 'Debe seleccionar una causal al reprogramar la fecha de entrega!\n';
    }

    if (cMsg != '') {
      showToast(cMsg, 'error');
      return;
    }

    // Establece REPROGRAMAR y GESTIONAR según si la fecha fue modificada
    // if (fechaModificada) {
    //   this.DSeguimiento.REPROGRAMAR = true;
    //   this.DSeguimiento.GESTIONAR = false;
    // } else {
    //   this.DSeguimiento.REPROGRAMAR = false;
    //   this.DSeguimiento.GESTIONAR = true;
    // }

    // Establece estados
    this.DSeguimiento.REPROGRAMAR = fechaModificada;
    this.DSeguimiento.GESTIONAR = !fechaModificada;

    // console.log('Datos a enviar: ', this.DSeguimiento);

    // Ejecuta accion
    this._sdatos
      .consulta(
        'GUARDAR SEGUIMIENTO',
        {
          SEGUIMIENTO: this.DSeguimiento,
          USUARIO: this.prmUsrAplBarReg.usuario,
        },
        'COM-200',
      )
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem('token', refreshToken);
        }

        // Valida
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'Error al guardar seguimiento');
        } else {
          // Actualiza los datos de respuesta
          showToast('Seguimiento registrado!', 'success');

          // Enviar email si la fecha fue modificada y el envío de email está activado
          if (fechaModificada && this.DSeguimiento.ENVIAR_EMAIL && this.DSeguimiento.EMAIL && this.DSeguimiento.EMAIL.length > 0) {
            // console.log('entro a validacion');
            this.enviarEmailAutomatico();
          }
          // else {
          //   console.log('No se envía email. Razón:', {
          //     fechaModificada,
          //     tieneEmails: this.DSeguimiento.EMAIL && this.DSeguimiento.EMAIL.length > 0,
          //     emails: this.DSeguimiento.EMAIL
          //   });
          // }

          this.onRespuestaSeg.emit(res);
          this.visiblePopup = false;
        }
      });
  }

  // Llama api de envio email (desde el botón)
  enviarEmail() {
    // Valida que haya al menos un email
    if (!this.DSeguimiento.EMAIL || this.DSeguimiento.EMAIL.length === 0) {
      showToast('Debe ingresar al menos un correo electrónico', 'warning');
      return;
    }

    // Valida que la fecha fue modificada
    const fechaModificada = (!this.fechaEntregaOriginal && this.DSeguimiento.FECHA_REPROGRAMADA) || (this.fechaEntregaOriginal && this.DSeguimiento.FECHA_REPROGRAMADA &&
      new Date(this.DSeguimiento.FECHA_REPROGRAMADA).getTime() !== new Date(this.fechaEntregaOriginal).getTime());

    if (!fechaModificada) {
      showToast('La fecha de reprogramación no ha sido modificada', 'info');
      return;
    }

    // Valida que tenga causal
    if (!this.DSeguimiento.VALOR_CAUSAL || this.DSeguimiento.VALOR_CAUSAL.trim() === '') {
      showToast('Debe seleccionar una causal', 'warning');
      return;
    }

    // console.log('entro y paso todas las validaciones de enviarEmail()');

    this.enviarEmailAutomatico();
  }

  enviarEmailAutomatico() {
    showToast('Enviando correo. Espere unos segundos...');

    // Debug: Mostrar emails que se van a enviar
    // console.log('Emails a enviar:', this.DSeguimiento.EMAIL);

    // Preparar los datos para el email
    const numeroOrdenCompleto = this.DSeguimiento.DOCUMENTO ||
      `${this.DSeguimiento.ID_DOCUMENTO}-${this.DSeguimiento.CONSECUTIVO}`;

    const fechaReprogramadaFormateada = this.datepipe.transform(
      this.DSeguimiento.FECHA_REPROGRAMADA,
      'MMMM d, y',
      undefined,
      'es'
    );
    const asunto = `Reprogramación de Orden de Compra ${numeroOrdenCompleto}`;

    const emailsValidos = this.DSeguimiento.EMAIL.filter(
      (email) => email && email.trim() !== '',
    );
    // Convertir array de emails a string separado por comas
    const emailsString = emailsValidos.join(', ');
    // console.log('String de emails para backend:', emailsString);

    // 2. Estructura idéntica a COM200 que espera el backend
    const prmRpt = {
      clid: localStorage.getItem('empresa'),
      usuario: localStorage.getItem('usuario'),
      idrpt: '',
      id_reporte: '',
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: 'ORDENES_COMPRA',
      filtro: '',
      archivo: '',
      prm_email: {
        ORIGEN: localStorage.getItem('usuario'),
        ORIGEN_EMAIL: environment.correo_compra, // El backend requiere este campo para extraer el dominio
        DESTINO: this.DSeguimiento.PROVEEDOR || '',
        DESTINO_EMAIL: emailsString,
        ASUNTO: asunto,
      },
      template: 'compras/fecha-reprogramacion-compras.html',
      replacements: {
        NUMERO_ORDEN_COMPRA: numeroOrdenCompleto,
        FECHA_REPROGRAMADA: fechaReprogramadaFormateada,
        CAUSAL: this.DSeguimiento.VALOR_CAUSAL,
        OBSERVACIONES: this.DSeguimiento.OBSERVACIONES || 'Sin observaciones',
      },
    };

    let datos = {
      data: {
        datos: prmRpt,
      },
      USUARIO: this.prmUsrAplBarReg.usuario,
    };

    console.log('Datos email a enviar (Socket):', datos);
    this.socket.sendSocket('email', 'get_data_email', datos);
    showToast('Correo enviado a: ' + emailsString, 'success');
  }

  // Lista de emails del proveedor
  listaEmail() { }

  // Movimiento principal
  onSeleccAccion(e: any): void {
    if (e.value == '') return;
    this.DSeguimiento.ACCION = e.value;
  }

  // Selección email
  onSeleccEmail(e: any): void {
    if (!e.value) return;
    // El valor ya es un array, solo actualizamos
    this.DSeguimiento.EMAIL = e.value;
  }

  // email custom - Validación de email antes de agregar
  addCustomItem(e: any): void {
    const newEmail = e.text.trim();

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      showToast('Email inválido: ' + newEmail, 'error');
      e.customItem = null;
      return;
    }

    // Agregar a la lista si no existe
    if (!this.DListaEmail.find(item => item.EMAIL === newEmail)) {
      this.DListaEmail.push({ EMAIL: newEmail });
    }

    // Retornar el email válido
    e.customItem = newEmail;
  }

  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined) {
    if (obj == 'acciones' || obj == 'todos') {
      this._sdatos
        .consulta(
          'ACCIONES SEGUIMIENTO COMPRA',
          {
            ID_APLICACION: this.prmUsrAplBarReg.aplicacion,
            USUARIO: this.prmUsrAplBarReg.usuario,
          },
          'COM-200',
        )
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          this.DListaAccion = res;
        });
    }

    if (obj == 'causales' || obj == 'todos') {
      const prm = { ID_DOMINIO: 'COMPRAS', ID_GRUPO_DOMINIO: 'CAUSAS REPROGRAMACION' };
      this._sdatos
        .consulta('ITM_DOMINIOS', prm, 'ADM012')
        .subscribe((data: any) => {
          // console.log('Respuesta Causales ' + JSON.parse(data.data));
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          this.DListaCausales = res;
          this.configCausal.dataSource = this.DListaCausales;
          // console.log('Guardado ', this.DListaCausales);
        });
    }

    if (obj == 'email proveedor' || obj == 'todos') {
      // console.log('ID_PROVEEDOR ' + this.DSeguimiento.ID_PROVEEDOR);
      // console.log('USUARIO ' + this.prmUsrAplBarReg.usuario);
      this._sdatos
        .consulta(
          'LISTA EMAIL PROVEEDOR',
          {
            ID_PROVEEDOR: this.DSeguimiento.ID_PROVEEDOR,
            USUARIO: this.prmUsrAplBarReg.usuario,
          },
          'COM-200',
        )
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          // console.log('res email proveedor', res);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          if (res.length != 0) {
            this.DListaEmail = res.map((e) => ({ EMAIL: e.EMAIL }));

            // Auto-seleccionar emails si DSeguimiento.EMAIL está vacío
            if (!this.DSeguimiento.EMAIL || this.DSeguimiento.EMAIL.length === 0) {
              // Usar setTimeout para asegurar que el componente dx-tag-box esté listo
              setTimeout(() => {
                // Auto-seleccionar todos los emails que vienen de la BD
                this.DSeguimiento.EMAIL = this.DListaEmail.map(item => item.EMAIL);

                // Forzar la actualización del componente si existe
                if (this.dxEmail && this.dxEmail.instance) {
                  this.dxEmail.instance.option('value', this.DSeguimiento.EMAIL);
                }
              }, 100);
            }
          } else {
            this.DListaEmail = [];
          }
        });
    }

    if (obj == 'seguimiento' || obj == 'todos') {
      this._sdatos
        .consulta(
          'SEGUIMIENTO',
          {
            ID_DOCUMENTO: this.DSeguimiento.ID_DOCUMENTO,
            CONSECUTIVO: this.DSeguimiento.CONSECUTIVO,
            USUARIO: this.prmUsrAplBarReg.usuario,
          },
          'COM-200',
        )
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          this.DItemsGestionCompra = res;

          // Analiza Ultimo estado
          if (this.DItemsGestionCompra.length != 0) {
            const ultimoEstado = this.DItemsGestionCompra[0];

            // SI HAY UNA REPROGRAMACIÓN PREVIA
            if (ultimoEstado.ULTIMA_FECHA_REPROGRAMADA) {
              const fechaRef = new Date(ultimoEstado.ULTIMA_FECHA_REPROGRAMADA);

              this.DSeguimiento.FECHA_REPROGRAMADA = fechaRef;
              this.fechaEntregaOriginal = fechaRef; // Sincronizamos para que no pida causal si no se mueve
              this.DSeguimiento.VALOR_CAUSAL = ultimoEstado.ULTIMA_OBSERVACION_REPROGRAMADA;

              // El mínimo ahora es HOY (desde las 00:00)
              const minHoy = new Date();
              minHoy.setHours(0, 0, 0, 0);
              this.configFechaEntrega.min = minHoy;
              this.configFechaEntrega.value = fechaRef;
            }
             // SI HAY SEGUIMIENTOS PERO NINGUNO FUE REPROGRAMACIÓN (ULTIMA_FECHA_REPROGRAMADA == null)
             else {
               const hoyRef = new Date();
               const minHoy = new Date(hoyRef);
               minHoy.setHours(0, 0, 0, 0);
               this.DSeguimiento.FECHA_REPROGRAMADA = hoyRef;
               this.fechaEntregaOriginal = hoyRef;
               this.configFechaEntrega.min = minHoy;
             }

            // 2. Manejo de Causal (ULTIMA_OBSERVACION_REPROGRAMADA)
            if (ultimoEstado.ULTIMA_OBSERVACION_REPROGRAMADA) {
              this.DSeguimiento.VALOR_CAUSAL =
                ultimoEstado.ULTIMA_OBSERVACION_REPROGRAMADA;
            }

            // Forzamos actualizacion de las referencias de configuracion para que DevExtreme refresuqe el UI
            this.configFechaEntrega = { ...this.configFechaEntrega };
            this.configCausal = { ...this.configCausal };

            if (ultimoEstado.ULT_ESTADO == 'CERRADA')
              this.DSeguimiento.ULT_ESTADO = 'CERRADA';
          }
        });
    }
  }

  ngOnInit(): void {
    const user: any = localStorage.getItem('usuario');
    this.nombreUsuario = localStorage.getItem('user_name') || '';
    this.prmUsrAplBarReg = {
      tabla: 'ORDENES_COMPRA',
      aplicacion: 'COM-202',
      usuario: user,
      accion: 'zero',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: {},
    };

    this.indInicio = true;
    var that = this;
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      this.visiblePopup = true;
      that.DSeguimiento = datos.DATOS;
      const d = datos.DATOS;
      const hoyBase = new Date();

      that.DSeguimiento.PROVEEDOR =
        that.DSeguimiento.ID_PROVEEDOR +
        ' - ' +
        that.DSeguimiento.NOMBRE_PROVEEDOR;
      that.DSeguimiento.FECHA_GESTION = new Date();
      that.DSeguimiento.FECHA_PROGRAMADA = new Date();
      that.DSeguimiento.FECHA_REGISTRO = new Date();
      that.DSeguimiento.GESTIONAR = false; // Por defecto false al abrir el modal
      that.DSeguimiento.PROGRAMAR = false;
      that.DSeguimiento.REPROGRAMAR = false; // Por defecto false al abrir el modal
      that.DSeguimiento.CERRAR = false;
      that.DSeguimiento.ENVIAR_EMAIL = true; // Por defecto activado al abrir el modal
      that.DSeguimiento.EMAIL = d.EMAIL ? (Array.isArray(d.EMAIL) ? d.EMAIL : [d.EMAIL]) : [];
      that.DSeguimiento.ACCION = '';
      that.DSeguimiento.OBSERVACIONES = '';
      that.DSeguimiento.ULT_ESTADO = '';
      that.DSeguimiento.ID_USUARIO = that.nombreUsuario; // Asignar nombre completo del usuario
      this.DSeguimiento.VALOR_CAUSAL = '';

      this.DSeguimiento.FECHA_REPROGRAMADA = hoyBase;
      this.fechaEntregaOriginal = hoyBase;

      // Configuraciones iniciales del DateBox
      const minHoy = new Date(hoyBase);
      minHoy.setHours(0, 0, 0, 0);
      this.configFechaEntrega.value = hoyBase;
      this.configFechaEntrega.min = minHoy;

      // Guarda la fecha de reprogramación original para validación posterior
      // that.fechaEntregaOriginal = that.DSeguimiento.FECHA_REPROGRAMADA ? new Date(that.DSeguimiento.FECHA_REPROGRAMADA) : null;

      setTimeout(() => {
        this.indInicio = false;
        this.valoresObjetos('todos');
      }, 300);
    });

    this.configFechaEntrega = {
      readOnly: false,
      displayFormat: 'yyyy/MM/dd HH:mm',
      type: 'datetime', // Importante para que coincida con tu formato
      value: hoy, // Fecha por defecto: HOY
      min: hoy, // No permite seleccionar antes de HOY
      useMaskBehavior: true,
    };

    this.configCausal = {
      dataSource: this.DListaCausales, // Datos de la BD
      displayExpr: 'VALOR1', // Lo que el usuario ve
      valueExpr: 'VALOR1', // Lo que se guarda en la DB (cambiado de ITEM a VALOR1)
      searchEnabled: true, // Opcional: para que puedan buscar
      noDataText: 'Cargando datos...',
    };
  }
  ngAfterViewInit() { }
  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
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
}
