import { Component, OnInit } from '@angular/core';
import { DxDataGridModule } from 'devextreme-angular';

@Component({
  selector: 'app-PRO02501',
  templateUrl: './PRO02501.component.html',
  styleUrls: ['./PRO02501.component.css'],
  standalone: true,
  imports: [ DxDataGridModule ]
})
export class PRO02501Component implements OnInit {

  DPedidos: any;

  ngOnInit(): void {
    this.DPedidos = [
      {ID_CLIENTE: '1234', CONSECUTIVO: 200, FECHA: new Date() },
      {ID_CLIENTE: '567', CONSECUTIVO: 202, FECHA: new Date() }
    ]
  }

}
