import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxValidatorModule } from 'devextreme-angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-adm20705',
  templateUrl: './ADM20705.component.html',
  styleUrls: ['./ADM20705.component.css'],
  standalone: true,
  imports:[
    CommonModule, DxDataGridModule, DxButtonModule, DxValidatorModule
  ]
})
export class ADM20705Component implements OnInit {

  @Input() dataSource: any[] = [];
  @Input() readOnly: boolean = true;
  @Input() documentoData: any = {};

  @Output() dataChanged = new EventEmitter<any[]>();
  @Output() selectionChanged = new EventEmitter<any>();

  @ViewChild('gridRefUSU') gridRefUSU!: DxDataGridComponent;
  private filasSelecc: any[] = [];

  
  // Variables de estado (nombres originales)
  rowNewUSU: boolean = true;
  rowEditUSU: boolean = false;
  rowDeleteUSU: boolean = false;
  rowApplyChangesUSU: boolean = false;
  constructor() { }

  ngOnInit(): void {
      this.resetButtonStates();
    }
  
    // 🔥 FUNCIÓN DE SELECCIÓN ORIGINAL
    selectionGridRA(e: any): void {
      if (!this.gridRefUSU?.instance) {
        console.warn("Grid Rangos no está disponible");
        return;
      }
  
      try {
        if (!this.gridRefUSU.instance.hasEditData()) {
          this.filasSelecc = e.selectedRowKeys || [];
          
          if (this.filasSelecc.length > 0) {
            if (this.filasSelecc.length === 1) {
              const rowIndex = e.component.getRowIndexByKey(this.filasSelecc[0]);
              this.filasSelecc = [rowIndex];
              this.rowEditUSU = true;
            } else {
              this.rowEditUSU = false;
            }
            this.rowDeleteUSU = true;
          } else {
            this.rowDeleteUSU = false;
            this.rowEditUSU = false;
          }
          
          this.selectionChanged.emit(e);
        } else {
          this.rowDeleteUSU = false;
          this.rowEditUSU = false;
        }
      } catch (error) {
        console.error("Error en selección Rangos:", error);
        this.resetSelection();
      }
    }
  
    // 🔥 FUNCIÓN DE OPERACIONES ORIGINAL
    operGridRA(event: any, accion: string): void {
      if (!this.gridRefUSU?.instance) {
        console.error("Grid Rangos no disponible");
        return;
      }
  
      const gridInstance = this.gridRefUSU.instance;
  
      try {
        switch (accion) {
          case 'new':
            gridInstance.addRow();
            this.rowNewUSU = false;
            this.rowDeleteUSU = false;
            this.rowApplyChangesUSU = true;
            this.rowEditUSU = false;
            break;
            
          case 'edit':
            if (this.filasSelecc?.length === 1) {
              gridInstance.editRow(this.filasSelecc[0]);
              this.rowApplyChangesUSU = true;
              this.rowNewUSU = false;
              this.rowDeleteUSU = false;
              this.rowEditUSU = false;
              gridInstance.clearSelection();
            }
            break;
            
          case 'save':
            gridInstance.saveEditData().then(() => {
              this.resetButtonStates();
              this.emitDataChange();
              console.log('Datos guardados correctamente');
            }).catch((error) => {
              console.error("Error al guardar:", error);
            });
            break;
            
          case 'cancel':
            gridInstance.cancelEditData();
            this.resetButtonStates();
            this.updateButtonsBasedOnSelection();
            break;
            
          case 'delete':
            this.deleteSelectedRows();
            break;
        }
      } catch (error) {
        console.error("Error en operación Rangos:", error);
      }
    }
  
    // 🔥 FUNCIÓN DE INSERCIÓN ORIGINAL
    onGridRowInsertingRA(e: any): void {
      const data = e.data;
      
      // Agregar datos del documento padre
      data.ID_UN = this.documentoData.ID_UN || '';
      data.ID_DOCUMENTO = this.documentoData.ID_DOCUMENTO || '';
      
      this.rowApplyChangesUSU = true;
      this.emitDataChange();
      
    }
  
    private resetButtonStates(): void {
      this.rowApplyChangesUSU = false;
      this.rowNewUSU = true;
      this.rowEditUSU = false;
      this.rowDeleteUSU = false;
    }
  
    private resetSelection(): void {
      this.filasSelecc = [];
      this.rowEditUSU = false;
      this.rowDeleteUSU = false;
    }
  
    private updateButtonsBasedOnSelection(): void {
      if (this.filasSelecc.length > 0) {
        this.rowEditUSU = this.filasSelecc.length === 1;
        this.rowDeleteUSU = true;
      } else {
        this.rowEditUSU = false;
        this.rowDeleteUSU = false;
      }
    }
  
    private emitDataChange(): void {
      this.dataChanged.emit(this.dataSource);
    }
  
    private deleteSelectedRows(): void {
      if (!this.filasSelecc || this.filasSelecc.length === 0) {
        console.log('Seleccione al menos una fila para eliminar.');
        return;
      }
  
  
          Swal.fire({
          title: '',
          text: '¿Desea eliminar los items seleccionados?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
          if (result.isConfirmed) {
            try {
              const selectedRowsData = this.gridRefUSU.instance.getSelectedRowsData();
      
              for (let i = selectedRowsData.length - 1; i >= 0; i--) {
                const rowToDelete = selectedRowsData[i];
                
                // Buscar por referencia exacta en memoria
                const index = this.dataSource.indexOf(rowToDelete);
                
                if (index !== -1) {
                  this.dataSource.splice(index, 1);
                } else {
                  // Si no encuentra por referencia, buscar por contenido
                  const contentIndex = this.dataSource.findIndex((item: any) => 
                    JSON.stringify(item) === JSON.stringify(rowToDelete)
                  );
                  
                  if (contentIndex !== -1) {
                    this.dataSource.splice(contentIndex, 1);
                  }
                }
              }
              this.gridRefUSU.instance.refresh();
              this.resetButtonStates();
              this.gridRefUSU.instance.clearSelection();
              this.filasSelecc = [];
              
              // Emitir cambios al componente padre
              this.emitDataChange();
            } catch (error) {
              console.error("Error al eliminar registros de UN:", error);
              
            }
          }
        });
      }
}
