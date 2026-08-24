import {
  Component,
  Input,
  ViewChild,
  AfterViewInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import {
  DxDashboardControlComponent,
  DxDashboardControlModule
} from 'devexpress-dashboard-angular';

import { environment } from 'src/environments/environment';
import { DxPopupModule, DxDataGridModule, DxButtonModule  } from 'devextreme-angular';
import * as Dashboard from 'devexpress-dashboard';

@Component({
  selector: 'app-dashboard-viewer',
  standalone: true,
  imports: [DxDashboardControlModule, DxDataGridModule, DxPopupModule, DxButtonModule ],
  templateUrl: './dashboard-viewer.component.html',
  styleUrls: ['./dashboard-viewer.component.scss']
})
export class DashboardViewerComponent implements AfterViewInit, OnChanges {

  @Input()
  dashboardId!: string;

  @Input()
  dashboardType!: string;

  @Input()
  lastUpdated: Date | null = null;

  @ViewChild('dashboard', { static: false })
  dashboard!: DxDashboardControlComponent;
  private endPoint:any = environment.dashboardDesigner;
  url:any = this.endPoint;    
  public popupVisible = false;
  public popupData: any[] = [];
  private lastCardArgs: any = null;  
  private chartWidget: any = null;

  ngAfterViewInit(): void {

    if (!this.dashboardId) {
      return;
    }

    this.dashboard.instance.option('workingMode', 'ViewerOnly');
    this.dashboard.instance.loadDashboard(this.dashboardId);
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (
      changes['dashboardId'] &&
      !changes['dashboardId'].firstChange &&
      this.dashboard
    ) {
      this.dashboard.instance.loadDashboard(changes['dashboardId'].currentValue);
    }

  }

  onBeforeRender(e: any): void {

    const dashboardControl = e.component;

    const panel = dashboardControl.findExtension('dashboard-panel');
    if (panel) {
        panel.visible(false);
    }
    console.log(this.dashboardType);
    // Applies only to KPIPANEL
    if (this.dashboardType?.toUpperCase() === "KPIPANEL") {
      console.log(this.dashboardType);
      // Add custom button to Card captions
      const viewerApi = dashboardControl.findExtension('viewer-api');    
      viewerApi.on('itemCaptionToolbarUpdated', (args: any) => {         
        if (args.dashboardItem.itemType() !== "Card") {
            return;
        }

        // If no card is selected yet, do not show the button
        if (!this.lastCardArgs) {
            return;
        }
        
        // Only show the button on the selected card
        if (this.lastCardArgs.itemName !== args.itemName) {
            return;
        }    

        args.options.actionItems.push({
            type: "button",          
            icon: "iconInfo",
            hint: "Ver Detalles",
            click: () => {
              if (!this.lastCardArgs) { return; }
                this.lastCardArgs.requestUnderlyingData((data: any) => {
                    this.popupData = data._data.listSource.dataSource;
                    this.popupVisible = true;                  
                });
              }
          });
      }); 

      // Normal Card click behavior
      viewerApi.on('itemClick', (args: any) => {
          if (args.dashboardItem.itemType() !== "Card") {
              return;
          }
          this.lastCardArgs = args;        
          const axisPoint = args.getAxisPoint("Default");
          const dimension = args.getDimensions("Default")[0];
          if (!axisPoint || !dimension) {
              return;
          }
          const concept = axisPoint.getValue();
          const fieldName = dimension.dataMember.toLowerCase();        
          if (this.chartWidget) {
              this.chartWidget.option("title", {
                  text: concept,
                  horizontalAlignment: "center"
              });
          }
          if (this.setDashboardParameter(
              dashboardControl,
              `_${fieldName}`,
              concept
          )) {
              dashboardControl.reloadData();
          }
      });

      viewerApi.on('itemWidgetCreated', (e: any) => {
          if (e.dashboardItem.itemType() === "Chart") {
              this.chartWidget = e.getWidget();
          }
      });
        
    }
    
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

  get lastUpdatedText(): string {
    if (!this.lastUpdated) {
      return '';
    }
    const date = new Date(this.lastUpdated);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

}