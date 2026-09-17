import { Component, OnInit } from '@angular/core';
import { DxDataGridModule } from 'devextreme-angular';

@Component({
  selector: 'app-ordenar',
  templateUrl: './ordenar.component.html',
  styleUrls: ['./ordenar.component.css'],
  standalone: true,
  imports: [DxDataGridModule]
})
export class OrdenarComponent implements OnInit {

  DOrdenamiento = [{CAMPO: 'Campo1', VALOR: 'Valor1'},{CAMPO: 'Campo2', VALOR: 'Valor2'}]

  constructor() { }

  ngOnInit(): void {
  }

}
