import { Component, OnInit } from '@angular/core';
import { DxTextBoxModule } from 'devextreme-angular';

@Component({
  selector: 'app-agrupar',
  templateUrl: './agrupar.component.html',
  styleUrls: ['./agrupar.component.css'],
  standalone: true,
  imports: [DxTextBoxModule]
})
export class AgruparComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
