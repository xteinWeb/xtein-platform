// generic-tree-list.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { DxTreeListModule } from 'devextreme-angular';

export interface TreeListColumn {
  dataField: string;
  caption?: string;
  dataType?: string;
  width?: number | string;
  visible?: boolean;
  allowSorting?: boolean;
  allowFiltering?: boolean;
}

@Component({
  selector: 'app-generic-tree-list',
  standalone: true,
  imports: [
    CommonModule,
    DxTreeListModule
  ],
  templateUrl: './generic-tree-list.component.html',
  styleUrls: ['./generic-tree-list.component.css']
})
export class GenericTreeListComponent implements OnChanges, OnInit {

  // ============================
  // INPUTS - Todos vienen desde el padre
  // ============================

  @Input() dataSource: any[] = [];

  @Input() columns: TreeListColumn[] = [];

  // Estos deben ser definidos desde la aplicación
  @Input() keyExpr: string = '';
  @Input() parentIdExpr: string = '';

  // Propiedades adicionales de configuración
  @Input() searchEnabled = true;
  @Input() autoExpandAll = false;
  @Input() showBorders = true;
  @Input() selectionMode: 'single' | 'multiple' = 'single';
  @Input() dataStructure: 'plain' | 'tree' = 'plain'; // <-- AGREGAR ESTA LÍNEA
  @Input() rootValue: any = null; // Valor para identificar nodos raíz

  // ============================
  // OUTPUTS
  // ============================

  @Output() onItemClick = new EventEmitter<any>();
  @Output() onSelectionChange = new EventEmitter<any>();
  @Output() onRowExpanded = new EventEmitter<any>();
  @Output() onRowCollapsed = new EventEmitter<any>();

  // ============================
  // VARIABLES
  // ============================

  treeData: any[] = [];

  // ============================
  // CICLO DE VIDA
  // ============================

  ngOnInit(): void {
    this.validateInputs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataSource']) {
      this.treeData = this.dataSource;
    }
  }  

  // ============================
  // MÉTODOS PRIVADOS
  // ============================

  private validateInputs(): void {
    if (!this.keyExpr) {
      console.warn('GenericTreeListComponent: keyExpr no está definido');
    }
    if (!this.parentIdExpr) {
      console.warn('GenericTreeListComponent: parentIdExpr no está definido');
    }
    if (!this.columns || this.columns.length === 0) {
      console.warn('GenericTreeListComponent: No se definieron columnas');
    }
  }

  // ============================
  // EVENTOS
  // ============================

  handleRowClick(e: any): void {
    this.onItemClick.emit({
      node: e.data,
      rowIndex: e.rowIndex,
      originalEvent: e.event
    });
  }

  handleSelectionChanged(e: any): void {
    this.onSelectionChange.emit({
      selectedRowsData: e.selectedRowsData,
      selectedRowKeys: e.selectedRowKeys
    });
  }

  handleRowExpanded(e: any): void {
    this.onRowExpanded.emit(e);
  }

  handleRowCollapsed(e: any): void {
    this.onRowCollapsed.emit(e);
  }

}