
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxCheckBoxModule, DxDataGridComponent, DxDataGridModule } from 'devextreme-angular';
import { Observable, Subscription } from 'rxjs';

@Component({
    selector: 'app-xc-grid',
    templateUrl: './xc-grid.component.html',
    styleUrls: ['./xc-grid.component.css'],
    imports: [DxDataGridModule, DxCheckBoxModule]
})
export class XcGridComponent {

  @ViewChild('gridDatos', { static: false }) gridDatos: DxDataGridComponent;

  @Input() DDatosGrid: any;
  @Input() colsConfig: any;
  @Input() readOnly: boolean;
  @Input() dropDownInstance: any;
  @Input() modoSelection;

  eventsSubscription: Subscription;
  @Input() events: Observable<any>;
  @Output() onSeleccRows = new EventEmitter<any>;
  selectedRowKeys: any = [];
  templateGroup: any;
  keyExpr: any;
  groupExpr: any;
  that: any;
  esEdicion: boolean = false;
  iniGrid: boolean = false;
  groupCheckboxModel: any = {};
  checkGrupos: boolean = false;
  datosSelecc: any[] = [];
  readonly allowedPageSizes = [5, 10, 20, 50, 100, 'all'];
  
  constructor() {

    this.customizeColumns = this.customizeColumns.bind(this);    

  }

  templateHtml(columna): string {
    let cad = "";
    this.templateGroup.forEach(col => {
      if (columna.row.data.items !== null) {
        if (columna.row.data.items.length !== 0)
          cad = cad + (cad !== "" ? " " : "") + columna.row.data.items[0][col];
      }
      if (columna.row.data.collapsedItems !== undefined) {
        if (columna.row.data.collapsedItems.length !== 0)
          cad = cad + (cad !== "" ? " " : "") + columna.row.data.collapsedItems[0][col];
      }
    });
    return cad;
  }
  
  customizeColumns(columns: any) {
    // var items = this.gridDatos.instance.getDataSource().items();  
    if (this.colsConfig !== undefined ) {
      columns.forEach((col: any)=> {  
        var colcfg = this.colsConfig.filter((colcfg:any) => colcfg.dataField === col.dataField);
        if(colcfg !== undefined && colcfg.length !== 0) {  
          col.visible = true;
          col.caption = colcfg[0].caption;
          if (colcfg[0].width) col.width = colcfg[0].width;
          if (colcfg[0].alignment) col.alignment = colcfg[0].alignment;
          if (colcfg[0].format) col.format = colcfg[0].format;
          if (colcfg[0].groupIndex) col.groupIndex = colcfg[0].groupIndex;
          if (colcfg[0].dataType) col.dataType = colcfg[0].dataType;
          if (colcfg[0].templateGroup) {
            try {
              const vecGrupo = colcfg[0].templateGroup.replace(/'/g, '"');
              this.templateGroup = JSON.parse(vecGrupo);
            } catch (e) {
              this.templateGroup =  colcfg[0].templateGroup;
            }
            col.groupCellTemplate = 'grupoColumna';
          } 
          if (colcfg[0].editable) {
            this.esEdicion = colcfg[0].editable;
            col.allowEditing = colcfg[0].editable;
          }
          else {
            col.allowEditing = false;
          }
          if (colcfg[0].validationRules) {
            col.validationRules = [{
                    type: "custom",
                    message: `${colcfg[0].msgError}`,
                    validationCallback: function(e) {
                      // construir una función que reciba valores del objeto e
                      const fn = new Function("e", `return ${colcfg[0].validationRules};`);
                      return fn(e);
                    }
                  }];
          }
        }
        else
          col.visible = false;
      })  
    }
  }

  onSelectionChanged(e) {
    const keys = e.selectedRowKeys;
    this.datosSelecc = e.selectedRowsData;
    this.onSeleccRows.emit(e.selectedRowsData);
    // this._sdatos.conCambios = this._sdatos.conCambios + 1;
    //templateData.option('value', keys);
    if (keys) {
      keys.forEach(k => {
        const ix = this.DDatosGrid.findIndex(b => b[this.keyExpr[0]] === k[this.keyExpr[0]]);
        if (ix !== -1) {
          this.DDatosGrid[ix].IsActive = true;
          this.DDatosGrid[ix].checked = true;
          this.checkParent(this.DDatosGrid[ix][this.groupExpr])
        }
      });
      if (e.currentDeselectedRowKeys.length !== 0) {
        e.currentDeselectedRowKeys.forEach(k => {
          const ix = this.DDatosGrid.findIndex(b => b[this.keyExpr[0]] === k[this.keyExpr[0]]);
          if (ix !== -1) {
            this.DDatosGrid[ix].checked = false;
            this.checkParent(this.DDatosGrid[ix][this.groupExpr])
          }
        });
      }
      this.gridDatos.instance.cancelEditData();
    }
  }

  onParentChecked(e, d) {
    if (e.event) {
      var selRows:any = this.gridDatos.instance.getSelectedRowKeys();
      var storeGrid:any = this.gridDatos.instance.getDataSource().store();
      var rowsPadre:any = storeGrid._array.filter(r => r.DOCUMENTO === d.value);

      // d.data.items.forEach(element => {
      rowsPadre.forEach(element => {
        element.checked = e.value;
        if (e.value) {
          selRows.push({[this.keyExpr[0]]: element[this.keyExpr[0]]});
        }
        else {
          const ix = selRows.findIndex(r => r[this.keyExpr[0]] == element[this.keyExpr[0]]);
          if (ix !== -1) selRows.splice(ix,1);
        }
      });
      this.gridDatos.instance.selectRows(selRows,false);
    }
  }
  onChildChecked(e, d) {
      if (e.event) {
          d.data.checked = e.value;
          this.checkParent(d.data.State)
      }
  }
  checkParent(grupoValor) {
      this.gridDatos.instance.byKey([grupoValor]).then(group => {
          const everyChecked = group.items.every(e => e.checked);
          const someChecked = group.items.some(e => e.checked);
          if (everyChecked) {
              this.groupCheckboxModel[grupoValor] = true;
          } else if (someChecked) {
              this.groupCheckboxModel[grupoValor] = undefined;
          } else {
              this.groupCheckboxModel[grupoValor] = false;
          }
      })
  }

  onEditingStart(e) {
    // No permitir editar si no está seleccionada
    if (!this.iniGrid) return;
    const seleccRows = e.component.getSelectedRowKeys();
    if (seleccRows.findIndex(t => t[this.keyExpr[0]] === e.key[this.keyExpr[0]]) === -1) {
      e.cancel = true;
      // this.gridDatos.instance.cancelEditData();
    }
  }
  updatedRow(e) {
    if (e.data) {
      const ix = this.datosSelecc.findIndex(b => b[this.keyExpr[0]] === e.data[this.keyExpr[0]]);
      if (ix !== -1) {
        this.datosSelecc[ix] = { ...this.datosSelecc[ix], ...e.data };
      }
    }
    this.onSeleccRows.emit(this.datosSelecc);
  }

  ngOnInit(): void { 
    this.iniGrid = false;
  }
  ngAfterViewInit(): void {
    this.that = this;
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      if (datos.dataSource) {
        this.DDatosGrid = datos.dataSource;
        this.DDatosGrid.forEach(eledat => {
          eledat.IsActive = false;
          eledat.checked = false;

          // Control de check del grupo
          if (datos.colsConfig) {
            if (datos.modoSelection && datos.modoSelection == 'multiple-grupo') {
              this.checkGrupos = true;
              var colcfg = datos.colsConfig.filter((colcfg:any) => colcfg.groupIndex??"" != "");
              if(colcfg !== undefined && colcfg.length !== 0) {  
                this.groupCheckboxModel[eledat[colcfg[0].dataField]] = false;
                this.groupExpr = colcfg[0].dataField;
              }
            }
          }
        });
      }
      if (datos.height) {
        // this.gridDatos.height = datos.height;
        this.gridDatos.instance.option("height", datos.height-100); 
      }
      if (datos.style) {
        if (datos.style.height) {
          this.gridDatos.instance.option("height", Number(datos.style.height)-100); 
        }
      }
      if (datos.heightPopUp) {
        this.that.gridDatos.instance.option("height",datos.heightPopUp);
      }
      if (datos.soloSelecc !== undefined) {
        if (this.DDatosGrid) {
          /*this.DDatosGrid.forEach(fdata => {
            fdata.IsActive = true;
            if (!this.gridDatos.instance.isRowSelected(fdata.ID_TASA)) {
              fdata.IsActive = !datos.soloSelecc;
            }
          });*/
          // this.gridDatos.instance.option("filter", ["IsActive", "=", datos.soloSelecc]);
          if (datos.soloSelecc)
            this.gridDatos.instance.filter(["IsActive"]);
          else
            this.gridDatos.instance.clearFilter();
          // this.gridDatos.instance.repaint();
        }
      }
      if (datos.colsConfig) {
        this.colsConfig = datos.colsConfig;
      }
      if (datos.keyExpr) {
        this.keyExpr = datos.keyExpr;
      }
      if (datos.rowsSelected) {
        this.selectedRowKeys = datos.rowsSelected;
        this.datosSelecc = [];
        this.selectedRowKeys.forEach(k => {
          const ix = this.DDatosGrid.findIndex(b => b[this.keyExpr[0]] === k[this.keyExpr[0]]);
          if (ix !== -1) {
            this.DDatosGrid[ix].IsActive = ix !== -1 ? true : false;
            this.datosSelecc = [...this.datosSelecc, this.DDatosGrid[ix]];
          }
        });
        // setTimeout(() => {
        //   this.gridDatos.instance.filter(["IsActive"]);
        // }, 800);
      }
      if (datos.modoSelection) {
        if (datos.modoSelection == 'multiple-grupo') datos.modoSelection = 'multiple'
        this.modoSelection = datos.modoSelection;
      }

      this.iniGrid = true;
    });
  }
  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

}
