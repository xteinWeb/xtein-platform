import { Component, Input, OnChanges, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DxPieChartModule, DxTemplateModule } from 'devextreme-angular';
import { XteinPieChartOptions } from './models/xtein-pie-chart.model';
@Component({selector:'xtein-pie-chart',standalone:true,imports:[DxPieChartModule, DxTemplateModule, NgTemplateOutlet],
 templateUrl:'./xtein-pie-chart.component.html',styleUrl:'./xtein-pie-chart.component.scss'})
export class XteinPieChartComponent implements OnChanges {
 @Input() dataSource: unknown[] = [];
 @Input() options: XteinPieChartOptions = {};
 @Input() height: number|undefined;
 @Input() centerTemplate: TemplateRef<unknown>|null = null;
 widgetSize: XteinPieChartOptions['size'];
 
 ngOnChanges():void {
  this.widgetSize = this.height == null ? this.options.size : {...this.options.size,height:this.height};
  
 }
}
