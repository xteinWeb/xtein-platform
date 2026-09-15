import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
  DxButtonModule,
  DxDateBoxModule,
  DxDropDownBoxModule,
  DxListModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxSwitchModule,
  DxTagBoxModule,
  DxTextAreaModule,
} from 'devextreme-angular';
import { CommonModule, DatePipe } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { COM200Service } from 'src/app/services/COM200/COM200.service';
import { SocketService } from 'src/app/services/socket/socket.service';
import { environment } from 'src/environments/environment';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { showToast } from '../../../shared/toast/toastComponent.js';

interface DListaCausal {
  VALOR1: string;
}

interface ItemAgenda {
  PRODUCTO: string;
  NOMBRE_PRODUCTO: string;
  CANTIDAD_PENDIENTE: number;
}

@Component({
  selector: 'app-COM20206',
  templateUrl: './COM20206.component.html',
  styleUrls: ['./COM20206.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    DxPopupModule,
    DxDateBoxModule,
    DxSelectBoxModule,
    DxSwitchModule,
    DxTagBoxModule,
    DxTextAreaModule,
    DxButtonModule,
    DxDropDownBoxModule,
    DxListModule,
  ],
})
export class COM20206Component implements OnInit, OnDestroy {
  visiblePopup: boolean = false;
  itemData: any;

  fechaReprogramada: Date | string | number;
  fechaMinima: Date | string | number;
  valorCausal: string = '';
  observaciones: string = '';
  enviarEmail: boolean = true;
  emailSeleccionado: string[] = [];
  itemsAgenda: ItemAgenda[] = [];
  itemsSeleccionadosKeys: string[] = [];
  itemsSeleccionados: ItemAgenda[] = [];

  DListaCausales: DListaCausal[] = [];
  DListaEmail: any[] = [];

  configCausal: any = {
    dataSource: [],
    displayExpr: 'VALOR1',
    valueExpr: 'VALOR1',
    searchEnabled: true,
    noDataText: 'Cargando datos...',
  };

  prmUsrAplBarReg: clsBarraRegistro;

  private eventsSubscription: Subscription;
  @Input() events: Observable<any>;
  @Output() onRespuestaSeg = new EventEmitter<any>();

  constructor(
    private datepipe: DatePipe,
    private _sdatos: COM200Service,
    private socket: SocketService,
  ) {}

  ngOnInit(): void {
    const user: any = localStorage.getItem('usuario');
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

    this.eventsSubscription = this.events.subscribe((datos: any) => {
      this.itemData = datos.DATOS;

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      this.fechaMinima = hoy;
      this.fechaReprogramada = this.itemData.FECHA_REPROGRAMADA
        ? new Date(this.itemData.FECHA_REPROGRAMADA)
        : this.itemData.FECHA_ENTREGA
        ? new Date(this.itemData.FECHA_ENTREGA)
        : new Date();

      this.valorCausal = '';
      this.observaciones = '';
      this.enviarEmail = true;
      this.emailSeleccionado = [];

      const listaItems = this.itemData.ITEMS ? JSON.parse(this.itemData.ITEMS) : [];
      this.itemsAgenda = listaItems.map((it: any) => ({
        PRODUCTO: it.PRODUCTO,
        NOMBRE_PRODUCTO: it.NOMBRE_PRODUCTO,
        CANTIDAD_PENDIENTE: it.CANTIDAD_PENDIENTE,
      }));
      this.itemsSeleccionadosKeys = this.itemData.PRODUCTO ? [this.itemData.PRODUCTO] : [];

      this.visiblePopup = true;
      this.cargarCausales();
      this.cargarEmailsProveedor();
    });
  }

  cargarCausales() {
    const prm = { ID_DOMINIO: 'COMPRAS', ID_GRUPO_DOMINIO: 'CAUSAS REPROGRAMACION' };
    this._sdatos.consulta('ITM_DOMINIOS', prm, 'ADM012').subscribe((data: any) => {
      const res = JSON.parse(data.data);
      if (data.token != undefined) localStorage.setItem('token', data.token);
      this.DListaCausales = res;
      this.configCausal = { ...this.configCausal, dataSource: this.DListaCausales };
    });
  }

  cargarEmailsProveedor() {
    if (!this.itemData?.ID_PROVEEDOR) return;
    this._sdatos
      .consulta(
        'LISTA EMAIL PROVEEDOR',
        { ID_PROVEEDOR: this.itemData.ID_PROVEEDOR, USUARIO: this.prmUsrAplBarReg.usuario },
        'COM-200',
      )
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (data.token != undefined) localStorage.setItem('token', data.token);
        this.DListaEmail = (res || []).map((e: any) => ({ EMAIL: e.EMAIL }));
        this.emailSeleccionado = this.DListaEmail.map((e) => e.EMAIL);
      });
  }

  // Validación de email antes de agregarlo como valor personalizado en el tag-box
  addCustomItem(e: any): void {
    const newEmail = (e.text || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      showToast('Email inválido: ' + newEmail, 'error');
      e.customItem = null;
      return;
    }
    if (!this.DListaEmail.find((item) => item.EMAIL === newEmail)) {
      this.DListaEmail.push({ EMAIL: newEmail });
    }
    e.customItem = newEmail;
  }

  cancelar() {
    this.visiblePopup = false;
  }

  guardar() {
    if (!this.fechaReprogramada) {
      showToast('Debe escoger la nueva fecha de reprogramación', 'warning');
      return;
    }
    if (!this.valorCausal || this.valorCausal.trim() === '') {
      showToast('Debe seleccionar una causal de reprogramación', 'warning');
      return;
    }
    if (this.enviarEmail && (!this.emailSeleccionado || this.emailSeleccionado.length === 0)) {
      showToast('Debe seleccionar al menos un correo o desactivar el envío de email', 'warning');
      return;
    }
    if (this.itemsAgenda.length > 0 && this.itemsSeleccionadosKeys.length === 0) {
      showToast('Debe seleccionar al menos un item a reprogramar', 'warning');
      return;
    }

    this.itemsSeleccionados = this.itemsAgenda.filter((it) =>
      this.itemsSeleccionadosKeys.includes(it.PRODUCTO),
    );

    const seguimiento = {
      ...this.itemData,
      FECHA_REPROGRAMADA: this.fechaReprogramada,
      VALOR_CAUSAL: this.valorCausal,
      OBSERVACIONES: this.observaciones,
      EMAIL: this.enviarEmail ? this.emailSeleccionado : [],
      REPROGRAMAR: true,
      GESTIONAR: false,
      CERRAR: false,
      PROGRAMAR: false,
      ID_USUARIO: this.prmUsrAplBarReg.usuario,
    };

    const prm = {
      SEGUIMIENTO: seguimiento,
      ITEMS: this.itemsSeleccionados,
      USUARIO: this.prmUsrAplBarReg.usuario,
    };

    this._sdatos.consulta('GUARDAR SEGUIMIENTO', prm, 'COM-200').subscribe((data: any) => {
      const res = JSON.parse(data.data);
      if (data.token != undefined) localStorage.setItem('token', data.token);

      if (res[0].ErrMensaje !== '') {
        showToast(res[0].ErrMensaje, 'error');
        return;
      }

      showToast('Fecha reprogramada actualizada!', 'success');

      if (this.enviarEmail && this.emailSeleccionado.length > 0) {
        this.enviarEmailReprogramacion();
      }

      this.onRespuestaSeg.emit(res);
      this.visiblePopup = false;
    });
  }

  enviarEmailReprogramacion() {
    showToast('Enviando correo. Espere unos segundos...');

    const numeroOrdenCompleto =
      this.itemData.DOCUMENTO || `${this.itemData.ID_DOCUMENTO}-${this.itemData.CONSECUTIVO}`;

    const fechaReprogramadaFormateada = this.datepipe.transform(
      this.fechaReprogramada,
      'MMMM d, y',
      undefined,
      'es',
    );
    const asunto = `Reprogramación de Orden de Compra ${numeroOrdenCompleto}`;
    const emailsString = this.emailSeleccionado
      .filter((email) => email && email.trim() !== '')
      .join(', ');
    const itemsReprogramadosHtml = this.itemsSeleccionados
      .map((it) => {
        const cantidad =
          it.CANTIDAD_PENDIENTE != null ? ` (Cantidad pendiente: ${it.CANTIDAD_PENDIENTE})` : '';
        return `<li>${it.PRODUCTO} - ${it.NOMBRE_PRODUCTO}${cantidad}</li>`;
      })
      .join('');

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
        ORIGEN_EMAIL: environment.correo_compra,
        DESTINO: this.itemData.NOMBRE_PROVEEDOR || '',
        DESTINO_EMAIL: emailsString,
        ASUNTO: asunto,
      },
      template: 'compras/fecha-reprogramacion-compras.html',
      replacements: {
        NUMERO_ORDEN_COMPRA: numeroOrdenCompleto,
        FECHA_REPROGRAMADA: fechaReprogramadaFormateada,
        CAUSAL: this.valorCausal,
        OBSERVACIONES: this.observaciones || 'Sin observaciones',
        ITEMS_REPROGRAMADOS: itemsReprogramadosHtml
          ? `<ul style="margin:0;padding-left:20px;">${itemsReprogramadosHtml}</ul>`
          : '',
      },
    };

    const datos = {
      data: { datos: prmRpt },
      USUARIO: this.prmUsrAplBarReg.usuario,
    };

    this.socket.sendSocket('email', 'get_data_email', datos);
    showToast('Correo enviado a: ' + emailsString, 'success');
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }
}
