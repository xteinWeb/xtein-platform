import { Component, Input, Output, EventEmitter, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule, DxDataGridComponent, DxButtonModule, DxValidatorModule } from 'devextreme-angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-adm20704',
  templateUrl: './ADM20704.component.html',
  styleUrls: ['./ADM20704.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxButtonModule, DxValidatorModule]
})
export class ADM20704Component implements OnInit {
  
  @Input() dataSource: any[] = [];
  @Input() readOnly: boolean = true;
  @Input() documentoData: any = {};

  @Output() dataChanged = new EventEmitter<any[]>();
  @Output() selectionChanged = new EventEmitter<any>();

  @ViewChild('gridRefRA') gridRefRA!: DxDataGridComponent;

  // Variables de estado (nombres originales)
  rowNewRA: boolean = true;
  rowEditRA: boolean = false;
  rowDeleteRA: boolean = false;
  rowApplyChangesRA: boolean = false;
  
  private filasSelecc: any[] = [];

  ngOnInit(): void {
    this.resetButtonStates();
  }

  // 🔥 FUNCIÓN DE SELECCIÓN ORIGINAL
  selectionGridRA(e: any): void {
    if (!this.gridRefRA?.instance) {
      console.warn("Grid Rangos no está disponible");
      return;
    }

    try {
      if (!this.gridRefRA.instance.hasEditData()) {
        this.filasSelecc = e.selectedRowKeys || [];
        
        if (this.filasSelecc.length > 0) {
          if (this.filasSelecc.length === 1) {
            const rowIndex = e.component.getRowIndexByKey(this.filasSelecc[0]);
            this.filasSelecc = [rowIndex];
            this.rowEditRA = true;
          } else {
            this.rowEditRA = false;
          }
          this.rowDeleteRA = true;
        } else {
          this.rowDeleteRA = false;
          this.rowEditRA = false;
        }
        
        this.selectionChanged.emit(e);
      } else {
        this.rowDeleteRA = false;
        this.rowEditRA = false;
      }
    } catch (error) {
      console.error("Error en selección Rangos:", error);
      this.resetSelection();
    }
  }

  // 🔥 FUNCIÓN DE OPERACIONES ORIGINAL
  operGridRA(event: any, accion: string): void {
    if (!this.gridRefRA?.instance) {
      console.error("Grid Rangos no disponible");
      return;
    }

    const gridInstance = this.gridRefRA.instance;

    try {
      switch (accion) {
        case 'new':
          gridInstance.addRow();
          this.rowNewRA = false;
          this.rowDeleteRA = false;
          this.rowApplyChangesRA = true;
          this.rowEditRA = false;
          break;
          
        case 'edit':
          if (this.filasSelecc?.length === 1) {
            gridInstance.editRow(this.filasSelecc[0]);
            this.rowApplyChangesRA = true;
            this.rowNewRA = false;
            this.rowDeleteRA = false;
            this.rowEditRA = false;
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
    
    // Valores por defecto
    if (!data.ESTADO) {
      data.ESTADO = 'ACTIVO';
    }

    // Fecha actual
    if (!data.FECHA) {
      data.FECHA = new Date();
    }

    this.rowApplyChangesRA = true;
    this.emitDataChange();
    
  }

  private resetButtonStates(): void {
    this.rowApplyChangesRA = false;
    this.rowNewRA = true;
    this.rowEditRA = false;
    this.rowDeleteRA = false;
  }

  private resetSelection(): void {
    this.filasSelecc = [];
    this.rowEditRA = false;
    this.rowDeleteRA = false;
  }

  private updateButtonsBasedOnSelection(): void {
    if (this.filasSelecc.length > 0) {
      this.rowEditRA = this.filasSelecc.length === 1;
      this.rowDeleteRA = true;
    } else {
      this.rowEditRA = false;
      this.rowDeleteRA = false;
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
            const selectedRowsData = this.gridRefRA.instance.getSelectedRowsData();

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
            this.gridRefRA.instance.refresh();
            this.resetButtonStates();
            this.gridRefRA.instance.clearSelection();
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