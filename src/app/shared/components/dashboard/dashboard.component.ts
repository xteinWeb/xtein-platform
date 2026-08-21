import { Component, ViewChild, Input, SimpleChanges } from '@angular/core';
import { DxDashboardControlComponent, DxDashboardControlModule } from 'devexpress-dashboard-angular';
import { DashboardPanelExtension } from 'devexpress-dashboard';
import { ChartScaleBreaksExtension } from './extensions/chart-scale-breaks-extension';
import { ChartLineOptionsExtension } from './extensions/chart-line-options-extension';
import { ChartAxisMaxValueExtension } from './extensions/chart-axis-max-value-extension';
import { ChartConstantLinesExtension } from './extensions/chart-constant-lines-extension';
import { ItemDescriptionExtension } from './extensions/item-description-extension';
import { DashboardDescriptionExtension } from './extensions/dashboard-description-extension';
import { GridHeaderFilterExtension } from './extensions/grid-header-filter-extension';
import { CardSetKpiExtension } from './extensions/card-setkpi-extension';
import { Subject, Subscription } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { SubmenuOptionsComponent } from './submenu-options/submenu-options.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DxDashboardControlModule, SubmenuOptionsComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private endPoint:any = environment.dashboardDesigner;
  url:any = this.endPoint;

   @Input()
    dashboardId: string = '';

  @ViewChild("dashboard", { static: false }) dashboard: DxDashboardControlComponent;

  subscription: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  eventsSubjectLista: Subject<any> = new Subject<any>();
  visibleLista: boolean = false;
  DDashboards: any;

  constructor(    
    private sData: DashboardService
  )
  {
    this.adminDashboards = this.adminDashboards.bind(this);
  }

  onBeforeRender(args: any) {
    var dashboardControl = args.component;    
    (window as any).db = dashboardControl;
    console.log("DashboardControl", dashboardControl);
    var panelExtension = new DashboardPanelExtension(dashboardControl);
    panelExtension.visible(false);
    const toolbox = dashboardControl.findExtension("toolbox");
    toolbox.removeMenuItem("create-dashboard");
    toolbox.removeMenuItem("open-dashboard");
    //toolbox.removeMenuItem("save");
    //toolbox.removeMenuItem("data-source-browser");
    toolbox.removeMenuItem("dashboard-title-editor");
    toolbox.removeMenuItem("dashboard-currency-editor");
    //toolbox.removeMenuItem("dashboard-parameter-editor");
    toolbox.removeMenuItem("dashboard-color-scheme-editor");
    dashboardControl.unregisterExtension('createDashboard');
    dashboardControl.unregisterExtension("dxdde-data-source-wizard");
    dashboardControl.registerExtension(new ChartScaleBreaksExtension(dashboardControl));
    dashboardControl.registerExtension(new ChartLineOptionsExtension(dashboardControl));
    dashboardControl.registerExtension(new ChartAxisMaxValueExtension(dashboardControl));
    dashboardControl.registerExtension(new ChartConstantLinesExtension(dashboardControl));
    dashboardControl.registerExtension(new ItemDescriptionExtension(dashboardControl));
    dashboardControl.registerExtension(new DashboardDescriptionExtension(dashboardControl, this.adminDashboards));
    dashboardControl.registerExtension(new GridHeaderFilterExtension(dashboardControl));
    dashboardControl.registerExtension(new CardSetKpiExtension(dashboardControl, this.sData));

    // Filter by h_concepto
    const viewerApi = dashboardControl.findExtension('viewer-api');
    viewerApi.on('itemClick', (args: any) => {     
      if (args.dashboardItem.itemType() !== "Card") {
          return;
      }
      const axisPoint = args.getAxisPoint("Default");
      const dimension = args.getDimensions("Default")[0];
      const concept = axisPoint.getValue();         
      const fieldName = dimension.dataMember.toLowerCase();            
      //const displayName = dimension.name;
      if (this.setDashboardParameter(dashboardControl, `_${fieldName}`, concept)) {
          dashboardControl.reloadData();
      }      
    });
  }

  adminDashboards() {
    this.eventsSubjectLista.next({ dataSource: this.DDashboards,
                                   visible: true });
  }  

  ngOnInit(): void {
    const user:any = localStorage.getItem('usuario');    
  }

  ngAfterViewInit(): void {
    this.dashboard.instance.option('automaticUpdatesEnabled', false);
    this.dashboard.instance.loadDashboard(this.dashboardId);    
  }

  ngOnDestroy(){
     if (this.subscription) {
      this.subscription.unsubscribe();
    }   
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['dashboardId'] &&
      changes['dashboardId'].currentValue &&
      this.dashboard
    ) {
      this.dashboard.instance.loadDashboard(changes['dashboardId'].currentValue);
    }
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

  onSeleccLista(e){
    if (e.addedItems === undefined) return;   

  }

  private setDashboardParameter(
      dashboardControl: any,
      parameterName: string,
      parameterValue: any
  ): boolean {

      const parameter = dashboardControl
          ._dataSourceBrowser
          .parameters()
          .find((p: any) =>
              !p.parameterVisible() &&
              p.name().toLowerCase() === parameterName.toLowerCase());

      if (!parameter) {
          return false;
      }
      parameter._value(parameterValue);      
      return true;
  }  
}