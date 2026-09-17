import { Component, Input } from '@angular/core';

import { DxSchedulerModule } from 'devextreme-angular';
import { XteinSchedulerOptions } from './models/xtein-scheduler.model';
@Component({selector:'xtein-scheduler',standalone:true,imports:[DxSchedulerModule],
 templateUrl:'./xtein-scheduler.component.html',styleUrl:'./xtein-scheduler.component.scss'})
export class XteinSchedulerComponent {
 @Input() dataSource: unknown[] = [];
 @Input() options: XteinSchedulerOptions = {};
 @Input() height: number|string|undefined;
 
}
