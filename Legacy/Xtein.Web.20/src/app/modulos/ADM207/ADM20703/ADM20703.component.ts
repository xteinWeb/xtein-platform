import { Component, Input, Output, EventEmitter, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule, DxDataGridComponent, DxButtonModule, DxValidatorModule } from 'devextreme-angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-adm20703',
  templateUrl: './ADM20703.component.html',
  styleUrls: ['./ADM20703.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxButtonModule, DxValidatorModule]
})
export class ADM20703Component implements OnInit {
  
  @Input() dataSource: any[] = [];
  @Input() readOnly: boolean = true;
  

  @Output() dataChanged = new EventEmitter<any[]>();
  @Output() selectionChanged = new EventEmitter<any>();
  @Input() documentoData: any = {}; 
  @ViewChild('gridRefAU') gridRefAU!: DxDataGridComponent;

  // Variables de estado (nombres originales)
  rowNewAU: boolean = true;
  rowEditAU: boolean = false;
  rowDeleteAU: boolean = false;
  rowApplyChangesAU: boolean = false;
  
  private filasSelecc: any[] = [];

  ngOnInit(): void {
    this.resetButtonStates();
  }

  // 🔥 VALIDADORES ORIGINALES (nombres exactos)
  validarFechaExpedicionGrid = (options: any) => {
    const fechaExpedicion = options.value;
    if (fechaExpedicion) {
      const fechaExpedicionDate = new Date(fechaExpedicion);
      const fechaActual = new Date();
      fechaActual.setHours(23, 59, 59, 999);
      return fechaExpedicionDate <= fechaActual;
    }
    return true;
  };

  validarFechaVencimientoGrid = (options: any) => {
    const data = options.data;
    const fechaExpedicion = data.FECHA_EXPEDICION;
    const fechaVencimiento = options.value;

    if (fechaExpedicion && fechaVencimiento) {
      const fechaExpedicionDate = new Date(fechaExpedicion);
      const fechaVencimientoDate = new Date(fechaVencimiento);
      return fechaVencimientoDate > fechaExpedicionDate;
    }
    return true;
  };

  validarRangoInicioGrid = (options: any) => {
    const rangoInicio = options.value;
    if (rangoInicio !== null && rangoInicio !== undefined) {
      return rangoInicio > 0;
    }
    return true;
  };

  validarRangoFinalGrid = (options: any) => {
    const data = options.data;
    const rangoInicio = data.RANGO_INICIO;
    const rangoFinal = options.value;

    if (rangoInicio && rangoFinal) {
      return rangoFinal > rangoInicio;
    }
    return true;
  };


  selectionGrid(e: any): void {
    if (!this.gridRefAU?.instance) {
      console.warn("Grid Autorizaciones no está disponible");
      return;
    }

    try {
      if (!this.gridRefAU.instance.hasEditData()) {
        this.filasSelecc = e.selectedRowKeys || [];
        
        if (this.filasSelecc.length > 0) {
          if (this.filasSelecc.length === 1) {
            const rowIndex = e.component.getRowIndexByKey(this.filasSelecc[0]);
            this.filasSelecc = [rowIndex];
            this.rowEditAU = true;
          } else {
            this.rowEditAU = false;
          }
          this.rowDeleteAU = true;
        } else {
          this.rowDeleteAU = false;
          this.rowEditAU = false;
        }
        
        this.selectionChanged.emit(e);
      } else {
        this.rowDeleteAU = false;
        this.rowEditAU = false;
      }
    } catch (error) {
      console.error("Error en selección Autorizaciones:", error);
      this.resetSelection();
    }
  }


  operGrid(event: any, accion: string): void {
    if (!this.gridRefAU?.instance) {
      console.error("Grid Autorizaciones no disponible");
      return;
    }

    const gridInstance = this.gridRefAU.instance;

    try {
      switch (accion) {
        case 'new':
          gridInstance.addRow();
          this.rowNewAU = false;
          this.rowDeleteAU = false;
          this.rowApplyChangesAU = true;
          this.rowEditAU = false;
          break;
          
        case 'edit':
          if (this.filasSelecc?.length === 1) {
            gridInstance.editRow(this.filasSelecc[0]);
            this.rowApplyChangesAU = true;
            this.rowNewAU = false;
            this.rowDeleteAU = false;
            this.rowEditAU = false;
            gridInstance.clearSelection();
          }
          break;
          
        case 'save':
          gridInstance.saveEditData().then(() => {
            this.resetButtonStates();
            this.emitDataChange();
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
      console.error("Error en operación Autorizaciones:", error);
    }
  }

  // 🔥 FUNCIÓN DE INSERCIÓN ORIGINAL
  onRowInserting(e: any): void {
    const data = e.data;
    
    
    if (!data.ID) {
      data.ID = this.generateUniqueId();
    }

    
    if (!data.ESTADO) {
      data.ESTADO = 'ACTIVO';
    }

    this.rowApplyChangesAU = true;
    this.emitDataChange();
    
   
  }

  
  private resetButtonStates(): void {
    this.rowApplyChangesAU = false;
    this.rowNewAU = true;
    this.rowEditAU = false;
    this.rowDeleteAU = false;
  }

  private resetSelection(): void {
    this.filasSelecc = [];
    this.rowEditAU = false;
    this.rowDeleteAU = false;
  }

  private updateButtonsBasedOnSelection(): void {
    if (this.filasSelecc.length > 0) {
      this.rowEditAU = this.filasSelecc.length === 1;
      this.rowDeleteAU = true;
    } else {
      this.rowEditAU = false;
      this.rowDeleteAU = false;
    }
  }

  private generateUniqueId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
            const selectedRowsData = this.gridRefAU.instance.getSelectedRowsData();
    
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
    
           
            this.gridRefAU.instance.refresh();
            this.resetButtonStates();
            this.gridRefAU.instance.clearSelection();
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