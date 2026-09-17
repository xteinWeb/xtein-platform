import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  DxFormModule, 
  DxSelectBoxModule, 
  DxTextBoxModule,
  DxNumberBoxModule
} from 'devextreme-angular';

@Component({
  selector: 'app-adm20701',
  templateUrl: './ADM20701.component.html',
  styleUrls: ['./ADM20701.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    DxFormModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxNumberBoxModule
  ]
})
export class ADM20701Component implements OnInit, OnChanges {
  
  @Input() formData: any = {};
  @Input() readOnly: boolean = true;

  @Output() dataChanged = new EventEmitter<{field: string, value: any}>();

  // Variable para controlar campos de incremento (igual que tenías antes)
  readOnlyIncrement: boolean = false;

  ngOnInit(): void {
    this.updateIncrementFields();
  }

  ngOnChanges(): void {
    this.updateIncrementFields();
  }

  // 🔥 FUNCIÓN PARA MANEJAR CAMBIOS (igual que tenías antes)
  onValueChangedForm(e: any, campo: string): void {
    
    // Emitir el cambio al componente padre
    this.dataChanged.emit({field: campo, value: e.value});

    // 🔥 LÓGICA ESPECIAL PARA INCREMENTO (igual que tenías antes)
    if (campo === 'INCREMENTO') {
      this.updateIncrementFields();
      
      if (e.value === 0) { // Automático
        // Limpiar campos de prefijo, sufijo y separador
        this.dataChanged.emit({field: 'EXPRESION_CONSECUTIVO', value: 'Ninguno'});
        this.dataChanged.emit({field: 'DATO_PREFIJO', value: ''});
        this.dataChanged.emit({field: 'EXPR_CONSEC_SUFIJO', value: 'Ninguno'});
        this.dataChanged.emit({field: 'DATO_SUFIJO', value: ''});
        this.dataChanged.emit({field: 'SEPARADOR', value: ''});
      }
    }
  }

  // 🔥 CONTROL DE CAMPOS DE INCREMENTO (igual que tenías antes)
  private updateIncrementFields(): void {
    this.readOnlyIncrement = this.formData.INCREMENTO === 0; // true si es Automático
  }
}