import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DashboardControlArgs, DashboardPanelExtension } from 'devexpress-dashboard';
import { DxDashboardControlComponent, DxDashboardControlModule } from 'devexpress-dashboard-angular';
import { ChartScaleBreaksExtension } from 'src/app/modulos/MEN/COM/DBCOM001/extensions/chart-scale-breaks-extension';
import { ChartLineOptionsExtension } from 'src/app/modulos/MEN/COM/DBCOM001/extensions/chart-line-options-extension';
import { ChartAxisMaxValueExtension } from 'src/app/modulos/MEN/COM/DBCOM001/extensions/chart-axis-max-value-extension';
import { ChartConstantLinesExtension } from 'src/app/modulos/MEN/COM/DBCOM001/extensions/chart-constant-lines-extension';
import { ItemDescriptionExtension } from 'src/app/modulos/MEN/COM/DBCOM001/extensions/item-description-extension';
import { DashboardDescriptionExtension } from 'src/app/modulos/MEN/COM/DBCOM001/extensions/dashboard-description-extension';
import { GridHeaderFilterExtension } from 'src/app/modulos/MEN/COM/DBCOM001/extensions/grid-header-filter-extension';
import { Observable } from 'rxjs';
import { PRO029Service } from 'src/app/services/PRO029/PRO029.service';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-PRO02901',
  templateUrl: './PRO02901.component.html',
  styleUrls: ['./PRO02901.component.css'],
  standalone: true,
  imports: [DxDashboardControlModule]
})
export class PRO02901Component {

  private endPoint:any = environment.dashboard;
  url:any = this.endPoint+'/api/dashboard'
  
  @ViewChild("dashboardAgenda", { static: false }) dashboardAgenda: DxDashboardControlComponent;
  @Input() events: Observable<any>;
  @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();
  
  
  USUARIO_LOCAL:any = '';

  constructor(private sData: PRO029Service) { }

  
  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase();
    setTimeout(() => {
      this.dashboardAgenda.instance.loadDashboard('1014');
    }, 300);
    
    // this.valoresObjetos('dashboards');
  }
  ngOnDestroy(){
  }

  onBeforeRender(args: DashboardControlArgs) {
    var dashboardControl = args.component;
    // dashboardControl.registerExtension(new DashboardPanelExtension(dashboardControl));
    var panelExtension = new DashboardPanelExtension(dashboardControl);
    panelExtension.visible(false);
    dashboardControl.unregisterExtension("dxdde-data-source-wizard");  

    // dashboardControl.unregisterExtension('toolbox');
    // dashboardControl.loadDashboard('3');

    dashboardControl.registerExtension(new ChartScaleBreaksExtension(dashboardControl));
    dashboardControl.registerExtension(new ChartLineOptionsExtension(dashboardControl));
    dashboardControl.registerExtension(new ChartAxisMaxValueExtension(dashboardControl));
    dashboardControl.registerExtension(new ChartConstantLinesExtension(dashboardControl));
    dashboardControl.registerExtension(new ItemDescriptionExtension(dashboardControl));
    dashboardControl.registerExtension(new DashboardDescriptionExtension(dashboardControl, this.adminDashboards));
    dashboardControl.registerExtension(new GridHeaderFilterExtension(dashboardControl));

  }
  
  adminDashboards() {
    // this.eventsSubjectLista.next({ dataSource: this.DDashboards, 
    //                                visible: true });
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string){
    if (obj == 'dashboards' || obj == 'todos') {
      const prm:any = { ID_APLICACION: 'PRO-029', USUARIO: this.USUARIO_LOCAL }
      this.sData.consulta('dashboards', prm, 'PRO-029')
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== "") {
          this.showModal(res[0].ErrMensaje, "Error al cargar dashboard!");
        } else {
          const id = res[0].ID;
          this.dashboardAgenda.instance.loadDashboard(id);
        }
      });
    };
  }

  showModal(mensaje:any, titulo:any='¡Error!', msg_html:any= '') {
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
      position: "center",
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }

}
