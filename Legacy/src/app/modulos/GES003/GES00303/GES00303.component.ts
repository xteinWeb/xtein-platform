import { Component, Input, ViewChild } from '@angular/core';
import { clsCargos } from '../clsGES003.class';
import { CommonModule } from '@angular/common';
import { DxDataGridComponent, DxDataGridModule } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { GES003Service } from 'src/app/services/GES003/GES003.service';
import { GES00Service } from 'src/app/shared/Tareas/Service/GES00.service';

@Component({
  selector: 'app-ges00303',
  templateUrl: './GES00303.component.html',
  styleUrls: ['./GES00303.component.css'],
  standalone: true,
  imports: [ CommonModule, DxDataGridModule ]
})
export class GES00303Component {

  @ViewChild("gridCondicionesCargo", { static: false }) gridCondicionesCargo: DxDataGridComponent;
  
  @Input() APLICACION: string;
  @Input() Datos: clsCargos;
  @Input() readOnly: boolean;

  subscription: Subscription;
  DCondicionesCargo: any;

  constructor(
    private _sdatos: GES003Service,
    private Ges00Service: GES00Service
  ) {

    this.subscription = this.Ges00Service.getObsActividades().subscribe((data:any) => {
      switch (data.accion) {
        case 'cargar datos':
          this.loadData(data.Datos);
          break;
      
        default:
          break;
      }
    });
  }

  ngOnInit(): void {
    // this.valoresObjetos('todos');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadData(data:any) {
    this.DCondicionesCargo = data.CONDICIONES;
    this.gridCondicionesCargo.instance.refresh();
  }
}
