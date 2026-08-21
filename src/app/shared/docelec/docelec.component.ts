import { DatePipe } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { DxDataGridModule, DxFormModule, DxPopupModule, DxTextBoxModule, DxToolbarModule } from 'devextreme-angular';
import { lastValueFrom, Observable, Subject, Subscription } from 'rxjs';
import { SDocElecService } from 'src/app/services/docelec/s_docelec.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { clsDocumentoElectronico } from './docelec.class';
import { showToast } from '../../shared/toast/toastComponent.js'

@Component({
    selector: 'app-docelec',
    templateUrl: './docelec.component.html',
    styleUrls: ['./docelec.component.scss'],
    imports: [DxPopupModule, DxFormModule, DxTextBoxModule, DxToolbarModule, DxDataGridModule, ProgressSpinnerModule]
})
export class DocelecComponent implements OnInit, OnDestroy {

  private eventsSubscription: Subscription;
  eventsSubjectSbox: Subject<any> = new Subject<any>();
  popupVisible: boolean = false;
  popUpVisor: any;
  DocElectronico: any;
  DEventosElec: any;
  showSpinner: boolean = false;
  inactivarBotones: boolean = false;
  msgProceso: string = '';

  // Documento Electrónico
  tipoDocumentoElec: any;
  datosDocumentoElec: clsDocumentoElectronico;

  isFormReadOnly = false

  enviarButtonOptions = {
    icon: 'runner',
    type: "default",
    stylingMode: "contained",
    text: 'Enviar DIAN',
    onClick: () => {
        this.envioDian();
    }
  }  
  pdfButtonOptions = {
    icon: 'pdffile',
    text: 'Pdf',
    stylingMode: "contained",
    type: "success",
    onClick: () => {
        this.bajarPdf();
    }
  }  
  emailButtonOptions = {
    icon: 'email',
    text: 'Envio Email',
    stylingMode: "contained",
    type: "warning",
    onClick: () => {
        this.envioEmail();
    }
  }  

  @Input() events: Observable<any>;

  @Input() titDocumentoElec: any;
  
  @Output() onRespuestaDocelec = new EventEmitter<any>;

  constructor(private apielec: SDocElecService,
              private renderer: Renderer2,
              private datepipe: DatePipe
  ) {
    this.onInitializedPopUp =this.onInitializedPopUp.bind(this);
    this.envioDian = this.envioDian.bind(this);
    this.bajarPdf = this.bajarPdf.bind(this);
    this.envioEmail = this.envioEmail.bind(this); 

  }

  onShown(e: any) {
  }
  onHidden(e:any) {
    this.popupVisible = false;
  }
  onInitializedPopUp(e: any) {
    this.popUpVisor = e.component;
  }

  async envioDian() {

    // Activar spinner
    this.activarSpinner(true, "Enviando documento a la DIAN...");

    try {
      const apiRest = this.apielec.servElectronica('enviar', this.datosDocumentoElec, this.tipoDocumentoElec);
      let res = await lastValueFrom(apiRest, {defaultValue: true});
      res = res.data; 
      if (res[0].ErrMensaje != '') {
        
        // Error de aplicacion
        if (res[0].ErrMensaje.includes('ERR99')) {
          const match = res[0].ErrMensaje.match(/^ERR99:.*$/m);
          const lineaError = match ? match[0] : '';
          showToast('Advertencia: ' + lineaError);
          this.errorDocElectronico(lineaError);
        }

        // Error de validacion
        if (!res[0].ErrMensaje.includes('00:')) {
          showToast('Error: ' + res[0].ErrMensaje);
          this.errorDocElectronico(res[0].ErrMensaje);
        }

        this.activarSpinner(false);

      }
    } catch (err: any) {
      this.activarSpinner(false);
      console.error('Error al llamar al servicio:', err.message);
      showToast('Error al enviar el documento electrónico: ' + err.message, 'error');
      this.errorDocElectronico(err.message);
    }

  }
  async bajarPdf() {
    // Activar spinner
    this.activarSpinner(true, "Generando PDF...");

    try {
      const apiRest = this.apielec.archivoElec('pdf', this.datosDocumentoElec, this.tipoDocumentoElec);
      let res = await lastValueFrom(apiRest, {defaultValue: true});
      var file = new Blob([res], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(file);
      window.open(url, '_blank'); // 👈 abre el PDF en nueva pestaña
      this.activarSpinner(false);

      // res = res.data; 
      // if (res[0].ErrMensaje != '') {
        
      //   // Error de aplicacion
      //   if (res[0].ErrMensaje.includes('ERR99')) {
      //     const match = res[0].ErrMensaje.match(/^ERR99:.*$/m);
      //     const lineaError = match ? match[0] : '';
      //     showToast('Advertencia: ' + lineaError);
      //     this.errorDocElectronico(lineaError);
      //   }

      //   // Error de validacion
      //   if (!res[0].ErrMensaje.includes('00:')) {
      //     showToast('Error: ' + res[0].ErrMensaje);
      //     this.errorDocElectronico(res[0].ErrMensaje);
      //   }
      // }
    } catch (err: any) {
      console.error('Error al llamar al servicio:', err.message);
      showToast('Error al enviar el documento electrónico: ' + err.message, 'error');
      this.activarSpinner(false);
      this.errorDocElectronico(err.message);
    }

  }
  envioEmail() {

  }

  activarSpinner(accion: boolean, msg: string = '') {
    this.showSpinner = accion;
    this.inactivarBotones = accion;
    if (!accion) return;
    setTimeout(() => {
      this.msgProceso = msg !== '' ? msg : 'Procesando...';
      const spinnerCircle = document.querySelector('.p-progress-spinner-circle');
      if (spinnerCircle) {
        this.renderer.setAttribute(spinnerCircle, 'r', '6'); // Cambia el radio a 6
      }
    }, 100);
  }

  errorDocElectronico(errMensaje: string) {
    // Registrar evento error documento electrónico
    this.DEventosElec.push({
      ITEM: this.DEventosElec.length + 1,
      ID_DOCUMENTO: this.datosDocumentoElec.ID_DOCUMENTO,
      NC_DOCUMENTO: this.datosDocumentoElec.NC_DOCUMENTO,
      FECHA: this.datepipe.transform(new Date(), 'yyyy-MM-dd'),
      HORA: this.datepipe.transform(new Date(), 'HH:mm:ss'),
      STATUS: errMensaje
    });
  }

  ngOnInit(): void { 
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      if (datos !== 'cerrar') {
        if (datos.dataSource) 
          this.DocElectronico = datos.dataSource;
        if (datos.visible) 
          this.popupVisible = datos.visible;
        this.titDocumentoElec = datos.titulo;
        this.DEventosElec = datos.dataElecStatus;

        // Preparar datos documento electrónico
        this.datosDocumentoElec = {
          tipoDocElectronico: this.DocElectronico.tipoDocElectronico,
          ID_DOCUMENTO: this.DocElectronico.ID_DOCUMENTO,
          NC_DOCUMENTO: this.DocElectronico.NC_DOCUMENTO,
          ID_EMPRESA: this.DocElectronico.ID_EMPRESA,
          EMISOR_NIT: this.DocElectronico.NIT_EMPRESA
        };
        this.tipoDocumentoElec = this.DocElectronico.tipoDocElectronico;

      }
      else {
        this.popUpVisor.close();
      }
    });

  }

  ngAfterViewInit(): void {   
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

}
