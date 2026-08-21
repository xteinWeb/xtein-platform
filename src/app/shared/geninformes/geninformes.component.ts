import { Component, Input } from '@angular/core';
import { FemailComponent } from '../femail/femail.component';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { showToast } from '../../shared/toast/toastComponent.js';
import { VisorrepComponent } from '../visorrep/visorrep.component';
import { GlobalVariables } from '../common/global-variables';
import { libtools } from 'src/app/shared/common/libtools';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { Observable, Subject, Subscription } from 'rxjs';

@Component({
    selector: 'app-geninformes',
    templateUrl: './geninformes.component.html',
    styleUrls: ['./geninformes.component.css'],
    imports: [FemailComponent]
})
export class GeninformesComponent {

  ltool: any;
  dataInforme: any;
  eventsSubjectEnvioCorreo: Subject<any> = new Subject<any>();

  private eventsSubscription: Subscription;
  eventsSubject: Subject<any> = new Subject<any>();

  @Input() events: Observable<any>;

  constructor(
    private _sgenerales: GeneralesService,
    private _sbarreg: SbarraService,
    private tabService: TabService
  ) 
    {
      this.ltool = new libtools(this._sbarreg, this.tabService);
    }

  // previsualizar el reporte
  imprimirReporte(operimp) {
    const filtroRep = { FILTRO: operimp.QFiltro };

    const prmLiq = {
      clid: localStorage.getItem('empresa'), 
      usuario: localStorage.getItem('usuario'), 
      idrpt: operimp.archivo,
      id_reporte: operimp.id_reporte,
      aplicacion: operimp.aplicacion,
      tabla: operimp.tabla,
      filtro: filtroRep,
      parametros: operimp.parametros ? operimp.parametros : {}
    };

    // Si no existe, no está abierta entonces agrega Tab
    const listaTab = this.tabService.tabs.find(c => c.aplicacion === operimp.id_reporte);
    if (listaTab === undefined) 
      GlobalVariables.listaAplicaciones.unshift({ aplicacion: operimp.id_reporte, barra: undefined, statusEdicion: '' });

    // Abre pestaña con nuevo reporte
    this.tabService.addTab(
      new Tab(
        VisorrepComponent,  // visor
        operimp.data_rpt.text,  // título
        { parent: "PrincipalComponent", args: prmLiq },  // parámetro: reporte,filtro
        operimp.id_reporte,  // código del reporte
        '',
        'reporte',
        true
    ));

  }
  
  // Genera solo pdf
  generarPDF(operimp) {

    showToast('Se generará el reporte en formato PDF. Espere unos segundos...');

    const filtroRep = { FILTRO: operimp.QFiltro };
    const ext = this.ltool.makeRandom(30);
    const prmRpt = {
      clid: localStorage.getItem('empresa'), 
      usuario: localStorage.getItem('usuario'), 
      idrpt: operimp.archivo,
      id_reporte: operimp.id_reporte,
      aplicacion: operimp.aplicacion,
      tabla: operimp.tabla,
      filtro: JSON.stringify(filtroRep),
      archivo: operimp.archivo + "_" + ext + ".pdf"
    };

    // Generar el PDF -- Llamar al generador de reportes para que genere archivo pdf
    this._sgenerales.ExportarPDF(prmRpt).subscribe((data: Blob) => {

      // Abrir reporte en pestaña browser
      var file = new Blob([data], { type: 'application/pdf' })
      var fileURL = URL.createObjectURL(file);
      window.open(fileURL); 
      
      /*var a         = document.createElement('a');
      a.href        = fileURL; 
      a.target      = '_blank';
      a.download    = 'bill.pdf';
      document.body.appendChild(a);
      a.click();*/

    });

  }
  
  // Pre-visualiza solo pdf
  enviarEmailPDF(operimp) {

    // Prepara y confirma envio de correo
    let asunto = operimp.asunto;
    let email_sale = operimp.email_sale;
    const dataSource =  { ORIGEN: operimp.especUsuarioEmail,
                          ORIGEN_EMAIL: email_sale,
                          DESTINO: operimp.nombre,
                          DESTINO_EMAIL: operimp.email,
                          ASUNTO: asunto,
                          NOTA: ''
                        }
    this.eventsSubjectEnvioCorreo.next({ dataSource, visible: true });
                
  }
  
  // Respuesta accion del correo
  onRespuestaEnvioCorreo(e: any) {
    
    showToast('Enviando correo. Espere unos segundos...');

    let template = this.dataInforme.template;
    const ext = this.ltool.makeRandom(30);
    const filtroRep = { FILTRO: this.dataInforme.QFiltro };

    const prmRpt = {
      clid: localStorage.getItem('empresa'), 
      usuario: localStorage.getItem('usuario'), 
      idrpt: this.dataInforme.rpt_archivo,
      id_reporte: this.dataInforme.rpt_id_reporte,
      aplicacion: this.dataInforme.aplicacion,
      tabla: this.dataInforme.tabla,
      filtro: JSON.stringify(filtroRep),
      archivo: this.dataInforme.rpt_archivo + "_" + ext + ".pdf",
      prm_email: e,
      template,
      replacements: this.dataInforme.replacements
    };

    // Generar el PDF -- Llamar al generador de reportes para que genere archivo pdf
    this._sgenerales.ExportarPDF(prmRpt).subscribe((data: Blob) => {

      // Abrir reporte en pestaña browser
      /*var file = new Blob([data], { type: 'application/pdf' })
      var fileURL = URL.createObjectURL(file);
      window.open(fileURL); */
      
      /*var a         = document.createElement('a');
      a.href        = fileURL; 
      a.target      = '_blank';
      a.download    = 'bill.pdf';
      document.body.appendChild(a);
      a.click();*/

      this._sgenerales.sendMail('send',{ datos: prmRpt },this.dataInforme.aplicacion)
        .subscribe((data: any) => {
          showToast('Correo enviado a '+e.DESTINO_EMAIL);
        
        // Guarda en el log de envios de correos de la OC
        const prm = { ID_APLICACION : this.dataInforme.aplicacion, 
                      ORIGEN: 'documento', 
                      DATOS: this.dataInforme.dataSource,
                      EVENTO: 'ENVIO EMAIL',
                      DETALLE: e.DESTINO_EMAIL +  ' Status:enviado',
                      USUARIO: this.dataInforme.usuario
                    };
        this._sgenerales
          .log('evento log', prm, "ADM-401")
          .subscribe((data: any) => {
            const res = JSON.parse(data.data);
            if (res[0].ErrMensaje !== '')
              showToast(res[0].ErrMensaje);
        });
  
      });

    });

  }

  ngOnInit(): void { 
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      this.dataInforme = datos;
      switch (datos.accion) {
        case 'previsualizar':
          this.imprimirReporte(datos);
          break;
      
        case 'pdf':
          this.generarPDF(datos);
          break;

        case 'email':
          this.enviarEmailPDF(datos);
          break;

        default:
          break;
      }
    });


  }
  ngAfterViewInit(): void {   
  }
  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

}
