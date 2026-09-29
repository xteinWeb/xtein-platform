import { Component, Input, OnChanges } from '@angular/core';

import { DxBarGaugeModule } from 'devextreme-angular';
import { XteinBarGaugeOptions } from './models/xtein-bar-gauge.model';
@Component({selector:'xtein-bar-gauge',standalone:true,imports:[DxBarGaugeModule],
 templateUrl:'./xtein-bar-gauge.component.html',styleUrl:'./xtein-bar-gauge.component.scss'})
export class XteinBarGaugeComponent implements OnChanges {
 @Input() dataSource: unknown[] = [];
 @Input() options: XteinBarGaugeOptions = {};
 @Input() height: number|undefined;
 
 widgetSize: XteinBarGaugeOptions['size'];
 
 ngOnChanges():void {
  this.widgetSize = this.height == null ? this.options.size : {...this.options.size,height:this.height};
  
 }
}
