import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DxButtonModule, DxToolbarModule } from 'devextreme-angular';
import { CXC22001Component } from './CXC22001/CXC22001.component';
import { CXC22002Component } from './CXC22002/CXC22002.component';

@Component({
  selector: 'app-CXC220',
  templateUrl: './CXC220.component.html',
  styleUrls: ['./CXC220.component.scss'],
  standalone: true,
  imports: [ DxToolbarModule, CommonModule, CXC22001Component, CXC22002Component,
             DxButtonModule
   ]
})
export class CXC220Component {
  mostrarConSolicitud = false;
  mostrarSolicitud = true;

  consultaSolicitud() {
    this.mostrarConSolicitud = true;
    this.mostrarSolicitud = false;
  }
  gestionSolicitud() {
    this.mostrarSolicitud = true;
    this.mostrarConSolicitud = false;
  }
  exportarDatos() {
  }

}
