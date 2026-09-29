import { Component, Input, OnChanges, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DxChartModule, DxTemplateModule } from 'devextreme-angular';
import { XteinChartOptions } from './models/xtein-chart.model';
@Component({selector:'xtein-chart',standalone:true,imports:[DxChartModule, DxTemplateModule, NgTemplateOutlet],
 templateUrl:'./xtein-chart.component.html',styleUrl:'./xtein-chart.component.scss'})
export class XteinChartComponent implements OnChanges {
 @Input() dataSource: unknown[] = [];
 @Input() options: XteinChartOptions = {};
 @Input() height: number|undefined;
 @Input() annotationTemplate: TemplateRef<unknown>|null = null;

 widgetSize: XteinChartOptions['size'];
 annotationSettings: XteinChartOptions['commonAnnotationSettings'];
 ngOnChanges():void {
  this.widgetSize = this.height == null ? this.options.size : {...this.options.size,height:this.height};
  this.annotationSettings = this.annotationTemplate ? {...this.options.commonAnnotationSettings,template:'xteinAnnotation'} : this.options.commonAnnotationSettings;
 }
}
