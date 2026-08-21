import { Component, ViewChild } from '@angular/core';
import { DxDashboardControlComponent, DxDashboardControlModule } from 'devexpress-dashboard-angular';
import { DashboardControl, DashboardControlArgs, DashboardPanelExtension } from 'devexpress-dashboard';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { Subject, Subscription } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { DashboardService } from 'src/app/services/MEN/dashboard.service';
import Swal from 'sweetalert2';
import { DB00101Component } from './DB00101/DB00101.component';
import DevExpress from 'devextreme';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-DBCOM001',
    templateUrl: './DBCOM001.component.html',
    styleUrls: ['./DBCOM001.component.css'],
    imports: [DxDashboardControlModule, DB00101Component]
})
export class DBCOM001Component {

  private endPoint:any = environment.dashboard;
  url:any = this.endPoint+'/api/dashboard'


  @ViewChild("dashboard", { static: false }) dashboard: DxDashboardControlComponent;

  subscription: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;

  eventsSubjectLista: Subject<any> = new Subject<any>();
  visibleLista: boolean = false;
  DDashboards: any;

  constructor(
    private _sbarreg: SbarraService,
    private _sdatos: DashboardService
  )
    {
    // Servicio de barra de registro
    this.subscription = this._sbarreg.getObsRegApl().subscribe((datreg) => {
      // Valida si la petición es para esta aplicacion
      if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion) {
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        if (datreg.accion === "r_apl_hija") {
          this.valoresObjetos("abrirDashboard", datreg);
        }
      }
    });

    this.adminDashboards = this.adminDashboards.bind(this);

  }

  onBeforeRender(args: any) {
    var dashboardControl = args.component;
    // dashboardControl.registerExtension(new DashboardPanelExtension(dashboardControl));
    var panelExtension = new DashboardPanelExtension(dashboardControl);
    panelExtension.visible(false);
    dashboardControl.unregisterExtension("dxdde-data-source-wizard");

    // dashboardControl.unregisterExtension('toolbox');
    // dashboardControl.loadDashboard('3');

    

  }

  adminDashboards() {
    this.eventsSubjectLista.next({ dataSource: this.DDashboards,
                                   visible: true });
  }
  onSeleccLista(e){
    if (e.addedItems === undefined) return;
    this.valoresObjetos("abrirDashboard",
                        {
                          aplicacion: "MEN000",
                          usuario: this.prmUsrAplBarReg.usuario,
                          accion: "r_apl_hija",
                          errr: "",
                          operacion:{
                              apl_hija: e.addedItems[0].ID_APLICACION
                         }
                        });

  }

  valoresObjetos(obj: string, opcion: any = undefined){

    if (obj == 'abrirDashboard' || obj == 'todos') {
      this._sdatos.consulta('consulta',
                            { ID_APLICACION: this.prmUsrAplBarReg.aplicacion,
                              USUARIO: this.prmUsrAplBarReg.usuario,
                              DASHBOARD: opcion.operacion.apl_hija
                            },
                            this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined)){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== "") {
            this.showModal(res[0].ErrMensaje, "Error al cargar dashboard!");
          }
          else {
            const id = res[0].ID;
            this.dashboard.instance.option('dataRequestOptions', {
              processingMode: 'batch',  // Enable batch processing
              batchSize: 1000,         // Number of records per batch
              enableRequestQueueing: true,
              // Optional: Configure retry attempts for failed requests
              maxRetryCount: 3,
              retryTimeout: 1000
            });
            this.dashboard.instance.option('automaticUpdatesEnabled', false);
            this.dashboard.instance.loadDashboard(id);
          }
        });
    }

    if (obj == 'dashboards' || obj == 'todos') {
      this._sdatos.consulta('dashboards',
                            { ID_APLICACION: this.prmUsrAplBarReg.aplicacion,
                              USUARIO: this.prmUsrAplBarReg.usuario,
                            },
                            this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined)){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== "") {
            this.showModal(res[0].ErrMensaje, "Error al cargar dashboard!");
          }
          else {
            this.DDashboards = res;
          }
        });
    }

  }

  ngOnInit(): void {
    const user:any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: 'Dashboards',
      aplicacion: 'MEN-000',
      usuario: user,
      accion: 'zero',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { }
    };

    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.valoresObjetos('dashboards');

  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(){
    this.subscription.unsubscribe();
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
