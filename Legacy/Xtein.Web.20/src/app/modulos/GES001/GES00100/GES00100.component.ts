import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DxButtonModule, DxDataGridModule, DxDropDownBoxModule, DxTooltipModule } from 'devextreme-angular';
import { Subscription, takeUntil } from 'rxjs';
import { GES001Service } from 'src/app/services/GES001/GES001.service';
import { validatorRes } from 'src/app/shared/validator/validator';
import {MatTooltipModule} from '@angular/material/tooltip';

@Component({
  selector: 'app-GES00100',
  templateUrl: './GES00100.component.html',
  styleUrls: ['./GES00100.component.css'],
  standalone: true,
  imports: [CommonModule, DxDropDownBoxModule, DxDataGridModule, DxButtonModule, DxTooltipModule, MatTooltipModule]
})
export class GES00100Component implements OnInit {

  subscription: Subscription;
  subscriptionProyecto: Subscription;

  DProyectos: any [] = [];
  openProyecto: boolean = false;
  selectProyecto: any = [];
  DProyectos_new: any [] = [];
  openProyecto_new: boolean = false;
  selectProyecto_new: any = [];
  tipo_proyect: any;
  new_tipo_proyect: boolean = false;
  nameActividad: string;

  toolTipVisible: boolean = false;
  targetIdTooltip: string;
  tooltipText: string;

  constructor(private _sdatos: GES001Service) {    
    this.DProyectos_new = [{
      ID: 1,
      Name: 'Por Procesos',
      Icon: 'icon-crear-sl'
    }, {
      ID: 2,
      Name: 'TI',
      Icon: 'icon-editar-sl'
    }, {
      ID: 3,
      Name: 'Ventas',
      Icon: 'icon-cancelar-sl'
    }, {
      ID: 4,
      Name: 'Manufactura',
      Icon: 'icon-crear-sl'
    }, {
      ID: 5,
      Name: 'Personalizado',
      Icon: 'icon-editar-sl'
    }];

    this.subscriptionProyecto = this._sdatos
    .getObsProyecto().subscribe((data) => {
      if (data.accion === 'r_refrescar', data.dato === 'proyecto') {
        this.valoresObjetos('proyectos', data.nombre);
      }
    });

  }

  ngOnInit(): void {
    this.nameActividad = '';
    this.valoresObjetos('proyectos', '');
  }

  ngOnDestroy() {
    this.subscriptionProyecto.unsubscribe();
  }

  onToolbarPreparing(e:any) {
    let toolbarItems = e.toolbarOptions.items;
    toolbarItems.forEach(function(item) {
      if (item.name === "searchPanel") {
        item.location = "before";
      }
    });
  }

  onCellPrepared(e:any) {
    if(e.rowType === 'data' && e.column.dataField === 'RESPONSABLE') {
      for (let i = 0; i < e.value.length; i++) {
        const npos: any = e.value[i].NOMBRE.indexOf(" ");
        const name = e.value[i].NOMBRE.charAt(0).toUpperCase();
        const lastName = e.value[i].NOMBRE.substring(npos + 1, e.value[i].NOMBRE.length + 1);
        const Lape = lastName.charAt(0).toUpperCase();
        const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
        e.value[i].iconNameUser = newName;
      };      
    };
  }

  toggleToolTip(item:any, cellInfo:any) {
    this.targetIdTooltip = '#USER-'+item.ID_RESPONSABLE;
    this.toolTipVisible = !this.toolTipVisible;
    this.tooltipText = item.NOMBRE;
  }

  valueChanged(e:any) {
    if (e.value === '') {
      this.tipo_proyect = '';
      this.new_tipo_proyect = false;
    }
  }

  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'refrescar':
        this.valoresObjetos('proyectos', '');
        break;

      default:
        break;
    }
  }

  valoresObjetos(obj: string, dato:any){
    if (obj === 'proyectos' || obj === 'todos'){
      // const prm:any = {"ID_RESPONSABLE": localStorage.getItem('usuario')?.toUpperCase()};
      // this._sdatos.getProyectos('PROYECTOS', prm).subscribe((data: any)=> {
      //   const res = validatorRes(data);
      //   if ( (data.token != undefined) ){
      //     const refreshToken = data.token;
      //     localStorage.setItem("token", refreshToken);
      //   };
      //   for (let i = 0; i < res.length; i++) {
      //     let element = res[i];
      //     element.ITEM = i;
      //   }
      //   this.DProyectos = res;
      //   if( (dato !== undefined) && (dato !== null) && (dato !== '') ) {
      //     const npos = this.DProyectos.findIndex((d:any) => d.NOMBRE === dato);
      //     if(npos > -1) {
      //       this.selectProyecto = [this.DProyectos[npos].ID_GESTION];
      //     }
      //   }
      // });
    };
  }

}
