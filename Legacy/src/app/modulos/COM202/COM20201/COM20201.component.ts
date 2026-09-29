import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxListComponent, DxListModule, DxPopupModule, DxTextAreaModule } from 'devextreme-angular';
import { Observable, Subject, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { showToast } from '../../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-COM20201',
  templateUrl: './COM20201.component.html',
  styleUrls: ['./COM20201.component.css'],
  standalone: true,
  imports: [ DxListModule, DxPopupModule, DxTextAreaModule ]
})
export class COM20201Component {
  @ViewChild("listaAccionesOrdenes", { static: false }) listaAccionesOrdenes: DxListComponent;

  visiblePopup: boolean = false;
  listaValores: any[] = [];
  ivaDefecto: any;
  seleccionValor: any[] = [];
  configBotonAceptar: any;
  configBotonCancelar: any;
  indInicio: boolean = true;
  descJustificacion: string = "";
  seleccAccionOC: any;

  private eventsSubscription: Subscription;
  eventsSubjectSbox: Subject<any> = new Subject<any>();
  popupVisible: boolean = false;
  popUpGrid: any;
  componentSbox: any;
  documento: string;

  @Input() events: Observable<any>;

  @Input() visible: boolean;

  @Output() onRespuestaSelecc = new EventEmitter<any>;

  constructor() 
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
  }

  onInitialized(e) {
    this.listaAccionesOrdenes = e.component;
  }
  onSelectionChanged(e) {
    this.seleccAccionOC = e;
    // if (!this.indInicio) {
    //   this.indInicio = true;

    // // Confirma cambio
    // Swal.fire({
    //   title: '',
    //   html: '¿Desea confirmar cambio de estado de la Orden de compra '+
    //         this.documento+' a <br/><b>'+e.addedItems[0].ACCION+'</b>?',
    //   iconHtml: "<i class='icon-alert-ol'></i>",
    //   showCancelButton: true,
    //   confirmButtonColor: '#DF3E3E',
    //   cancelButtonColor: '#438ef1',
    //   cancelButtonText: 'No',
    //   confirmButtonText: 'Sí, Confirmar'
    // }).then((result) => {
    //   if (result.isConfirmed) {
    //     // envia respuesta
    //     this.onRespuestaSelecc.emit(e);
    //   }
    //   else {
    //     showToast('No se registró ningún cambio de estado', 'info');
    //   }
    // });

    // }
  }

  accionPopUp(accion) {

    this.visiblePopup = false;
    if (accion === 'aceptar') {
      this.aceptarAccion();
    }

  }
  aceptarAccion() {
    this.indInicio = true;
    this.visiblePopup = false;

    // Agrega justificacion
    this.seleccAccionOC = { ...this.seleccAccionOC, JUSTIFICACION: this.descJustificacion };

    // Confirma cambio
    Swal.fire({
      title: '',
      html: '¿Desea confirmar cambio de estado de la Orden de compra '+
            this.documento+' a <br/><b>'+this.seleccAccionOC.addedItems[0].ACCION+'</b>?',
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, Confirmar'
    }).then((result) => {
      if (result.isConfirmed) {
        // envia respuesta
        this.onRespuestaSelecc.emit(this.seleccAccionOC);
      }
      else {
        showToast('No se registró ningún cambio de estado', 'info');
      }
    });

  }

  onValueChangedJust(e) {
    this.descJustificacion = e.value;
  }

  ngOnInit(): void { 
    this.indInicio = true;
    var that = this;
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      that.listaValores = datos.dataSource;
      that.visiblePopup = datos.visible;
      that.documento = datos.documento;
      that.seleccionValor = [];

      setTimeout(() => {
        this.indInicio = false;
      }, 1000);
    });
  }
  ngAfterViewInit() {
  }
  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

}
