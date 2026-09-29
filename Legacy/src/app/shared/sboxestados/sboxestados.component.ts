import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { listaEstadosBas } from '../classes/estados';
import { EstadoComponent } from '../estado/estado.component';

@Component({
  selector: 'app-sboxestados',
  templateUrl: './sboxestados.component.html',
  styleUrls: ['./sboxestados.component.scss'],
  standalone: true,
  imports: [CommonModule, DxSelectBoxModule, DxTextBoxModule, EstadoComponent]
})
export class SboxestadosComponent implements OnInit {

  @Input() data: any;
  @Input() value: any;
  @Input() modo: string;
  @Output() setValueEstado = new EventEmitter<any>();

  esEdicion: boolean = false;
  stylingMode = 'underlined';
  listaEstados = listaEstadosBas;

  constructor() { 
  }

  onSetValueEstado(e) {
    this.setValueEstado.emit(e);
  }

  ngOnInit(): void {
    if (!this.data)
      this.esEdicion = false;
    else {
      if (this.data.editorOptions)
        this.esEdicion = false;
      else
        this.esEdicion = this.data.data.esEdit;
    }
  }
  ngAfterViewInit(): void {
  }

}
