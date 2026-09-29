import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxDataGridModule, DxDateBoxModule, DxFormModule, DxPopupModule, DxScrollViewModule, DxSelectBoxComponent, DxSelectBoxModule, DxTextAreaModule, DxTextBoxModule, DxValidatorModule } from 'devextreme-angular';
import { Observable, Subject, Subscription } from 'rxjs';
import { clsGestionCompra } from '../clsCOM202.class';
import { CommonModule, DatePipe } from '@angular/common';
import { COM200Service } from 'src/app/services/COM200/COM200.service';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import Swal from 'sweetalert2';
import { showToast } from '../../../shared/toast/toastComponent.js';

@Component({
  selector: 'app-COM20205',
  templateUrl: './COM20205.component.html',
  styleUrls: ['./COM20205.component.css'],
  imports: [ DxPopupModule, DxTextAreaModule, DxFormModule, DxDateBoxModule,
             DxValidatorModule, DxTextBoxModule, CommonModule, DxSelectBoxModule,
             DxDataGridModule, DxScrollViewModule
   ],
  standalone: true
})
export class COM20205Component {
  @ViewChild("dxEmail", { static: false }) dxEmail: DxSelectBoxComponent;

  visiblePopup: boolean = false;
  listaValores: any[] = [];
  ivaDefecto: any;
  seleccionValor: any[] = [];
  DListaAccion: any[] = [];
  DListaEmail: any[] = [];
  DSeguimiento: clsGestionCompra;
  DItemsGestionCompra: any;
  configBotonAceptar: any;
  configBotonCancelar: any;
  indInicio: boolean = true;
  descJustificacion: string = "";
  seleccAccionOC: any;
  perfilButton: any;
  perfilEmail: any;
  prmUsrAplBarReg: clsBarraRegistro;

  private eventsSubscription: Subscription;
  eventsSubjectSbox: Subject<any> = new Subject<any>();
  popupVisible: boolean = false;
  popUpGrid: any;
  componentSbox: any;
  documento: string;

  @Input() events: Observable<any>;

  @Input() visible: boolean;

  @Output() onRespuestaSeg = new EventEmitter<any>;

  constructor(private datepipe: DatePipe, 
              private _sdatos: COM200Service) 
  { 
    this.configBotonAceptar = {
      icon: 'todo',
      text: 'Aceptar',
      onClick: this.accionPopUp.bind(this, 'aceptar')
    };
    this.configBotonCancelar = {
      icon: 'close',
      text: 'Cancelar',
      onClick: this.accionPopUp.bind(this, 'cancelar')
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
  onValueChangedObs(e) {
  }
  onValueChangedProg(e) {
    this.DSeguimiento.PROGRAMAR = !this.DSeguimiento.PROGRAMAR;
  }
  onValueChangedGes(e) {
    this.DSeguimiento.GESTIONAR = !this.DSeguimiento.GESTIONAR;
  }
  onValueChangedCerrar(e) {
    this.DSeguimiento.CERRAR = !this.DSeguimiento.CERRAR;
  }
  
  disableDates(args: any) {
    const today = new Date();
    const fhoy = this.datepipe.transform(today, 'MM/dd/yyyy');
    const fcal = this.datepipe.transform(args.date, 'MM/dd/yyyy');
    const ford = this.datepipe.transform(this.DSeguimiento.FECHA_SOLICITUD, 'MM/dd/yyyy');
    const dfhoy = new Date(fhoy!);
    const dfcal = new Date(fcal!);
    const dford = new Date(ford!);
    return dfcal < (dford == undefined ? dfhoy : dford);
  }

  accionPopUp(accion) {

    if (accion === 'aceptar' && this.DSeguimiento.ULT_ESTADO != "CERRADA") {
      this.aceptarAccion();
    }
    else {
      this.visiblePopup = false;
    }

  }
  aceptarAccion() {
    this.indInicio = true;

    // Valida datos completos
    var cMsg = "";
    if (this.DSeguimiento.OBSERVACIONES == "")
      cMsg += "Faltan registrar observaciones!";
    if (this.DSeguimiento.PROGRAMAR && this.DSeguimiento.ACCION == "")
      cMsg += "Debe definir una accion programada!";
    if (cMsg != "")
    {
      showToast(cMsg, 'error');
      return;
    }

    // Ejecuta accion
    this._sdatos.consulta('GUARDAR SEGUIMIENTO', 
                          { SEGUIMIENTO: this.DSeguimiento, 
                            USUARIO: this.prmUsrAplBarReg.usuario
                           }, 
                            "COM-200")
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }

        // Valida
        if (res[0].ErrMensaje !== "") {
          this.showModal(res[0].ErrMensaje, "Error al guardar seguimiento");          
        }
        else {
          // Actualiza los datos de respuesta
          showToast('Seguimiento registrado!', 'success');
          this.onRespuestaSeg.emit(res);
          this.visiblePopup = false;
        }
  
      });

  }

  // Llama api de envio email
  enviarEmail() {

  }
  // Lista de emails del proveedor
  listaEmail() {

  }

  // Movimiento principal
  onSeleccAccion(e: any): void {
    if (e.value == '') return;
    this.DSeguimiento.ACCION = e.value;
  }
  
  // Selección email
  onSeleccEmail(e: any): void {
    if (e.value == '') return;
    this.DSeguimiento.ACCION = e.value;
  }
  // email custom
  addCustomItem(e: any): void {
    var newItem = e.text;  
    this.DListaEmail.push({ EMAIL: newItem })  
    this.dxEmail.instance.option("text", e.text);  
    this.DSeguimiento.EMAIL = e.text;
    // return newItem;  
  }  


  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined){

    if (obj == 'acciones' || obj == 'todos' ) {
      this._sdatos.consulta('ACCIONES SEGUIMIENTO COMPRA', 
                            { ID_APLICACION: this.prmUsrAplBarReg.aplicacion, USUARIO: this.prmUsrAplBarReg.usuario }, 
                              'COM-200')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined)){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DListaAccion = res;
        });
    }

    if (obj == 'email proveedor' || obj == 'todos' ) {
      this._sdatos.consulta('LISTA EMAIL PROVEEDOR', 
                            { ID_PROVEEDOR: this.DSeguimiento.ID_PROVEEDOR, USUARIO: this.prmUsrAplBarReg.usuario }, 
                              'COM-200')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined)){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if(res.length != 0)
            this.DListaEmail = res.map(e => e.EMAIL);
          else
            this.DListaEmail = [];
        });
    }
    
    if (obj == 'seguimiento' || obj == 'todos' ) {
      this._sdatos.consulta('SEGUIMIENTO', 
                            { ID_DOCUMENTO: this.DSeguimiento.ID_DOCUMENTO, 
                              CONSECUTIVO: this.DSeguimiento.CONSECUTIVO, 
                              USUARIO: this.prmUsrAplBarReg.usuario }, 
                              'COM-200')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined)){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DItemsGestionCompra = res;

          // Analiza Ultimo estado
          if (this.DItemsGestionCompra.length != 0) {
            if (this.DItemsGestionCompra[0].ULT_ESTADO == "CERRADA") this.DSeguimiento.ULT_ESTADO = "CERRADA"
          }
        });
    }

  }

  ngOnInit(): void { 
    const user:any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: 'ORDENES_COMPRA',
      aplicacion: 'COM-202',
      usuario: user,
      accion: 'zero',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: {  }
    };
    
    this.indInicio = true;
    var that = this;
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      this.visiblePopup = true;
      that.DSeguimiento = datos.DATOS;
      that.DSeguimiento.PROVEEDOR = that.DSeguimiento.ID_PROVEEDOR + " - " + that.DSeguimiento.NOMBRE_PROVEEDOR;
      that.DSeguimiento.FECHA_GESTION = new Date();
      that.DSeguimiento.FECHA_PROGRAMADA = new Date();
      that.DSeguimiento.FECHA_REGISTRO = new Date();
      that.DSeguimiento.GESTIONAR = false;
      that.DSeguimiento.PROGRAMAR = false;
      that.DSeguimiento.CERRAR = false;
      that.DSeguimiento.EMAIL = '';
      that.DSeguimiento.ACCION = '';
      that.DSeguimiento.OBSERVACIONES = '';
      that.DSeguimiento.ULT_ESTADO = '';

      setTimeout(() => {
        this.indInicio = false;
        this.valoresObjetos('todos');
      }, 300);
    });


  }
  ngAfterViewInit() {
  }
  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  showModal(mensaje:any, titulo = '¡Error!', msg_html= '') {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
      title: titulo,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: "center",
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }

}
