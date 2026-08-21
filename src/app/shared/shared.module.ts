import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxTreeViewModule } from 'devextreme-angular';
import { GenericTreeComponent } from './components/generic-tree/generic-tree.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DataSourceParametersComponent } from './components/data-source-parameters/data-source-parameters.component';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DashboardViewerComponent } from './components/dashboard-viewer/dashboard-viewer.component';

@NgModule({
  declarations: [
    GenericTreeComponent,
    DataSourceParametersComponent,
    DashboardComponent,
    DashboardViewerComponent
  ],
  imports: [
    CommonModule,
    DxTreeViewModule,
    ReactiveFormsModule,
    DxSelectBoxModule
  ],
  exports: [
    GenericTreeComponent,
    DxTreeViewModule,
    DataSourceParametersComponent
  ]
})
export class SharedModule { }