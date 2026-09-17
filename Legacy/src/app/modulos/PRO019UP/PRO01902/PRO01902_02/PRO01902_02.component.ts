import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxLoadPanelModule, DxNumberBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { Subscription, lastValueFrom } from 'rxjs';
import { PRO019Service } from 'src/app/services/PRO019/PRO019.service';
import Swal from 'sweetalert2';
import { PRO019DataService } from '../../SERVICE/pro019.service';
import notify from 'devextreme/ui/notify';
import { CommonModule } from '@angular/common';
import { showToast } from '../../../../shared/toast/toastComponent.js';
import dxCheckBox from "devextreme/ui/check_box";

@Component({
  selector: 'app-PRO01902_02',
  templateUrl: './PRO01902_02.component.html',
  styleUrls: ['./PRO01902_02.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxDropDownBoxModule, DxTextBoxModule, DxNumberBoxModule, DxButtonModule, DxLoadPanelModule]
})
export class PRO01902_02Component implements OnInit {

  @ViewChild("gridMaterialesDetalles", { static: false }) gridMaterialesDetalles: DxDataGridComponent;
  @Input() getData: any;
  @Output() send_totalSeccionMateriales: EventEmitter<any> = new EventEmitter();

  subscription: Subscription;
  subscriptionConCambios: Subscription;
  subscriptionRefrescarTotales: Subscription;
  // conCambios: number = 0;
  modoGrid: string;

  DGDetalleMateriales: any = [];
  DGDetalleMateriales_prev: any = [];
  DGMateriales: any = [];
  selectMaterial: any = [];
  consultaBaseCosto: any;
  
  NOMBRE: any = '';
  VALOR_UNITARIO: any = '';
  ID_UDM: any = '';
  TOTAL: any = '';
  accion: string = '';
  dataCell: any;
  dropDownMateriales: any = {width:500, hideOnParentScroll: true, container:'#gridMateriales'};
  widthSerchMateriales: any = 250;

  readOnly: boolean = true;
  esVisibleSelecc: string = 'none';
  openMateriales: boolean = false;
  loadingVisible: boolean = false;
  TOTAL_GRAVAMENES: number = 0;
  conExcluidos: number = 0;
  conGravados: number = 0;

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];

  // Notificaciones
  toaVisible: boolean = false;
	isChecked = true;
	toaTipo = 'info'
  toaMessage = 'Registro actualizado!';
  BASE_COSTO: string = '';

  constructor(
    private sData: PRO019Service,
    private _sdatos: PRO019DataService
  ) {
    this.subscription = this._sdatos
      .getReadOnly()
      .subscribe((datprm) => {
        if(datprm === false) {
          if(this._sdatos.D_MATRIZ.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
            if(this.getData.ID_PARTE === this._sdatos.D_MATRIZ.PRODUCTO) {
              this.readOnly = datprm;
              this.esVisibleSelecc = 'none';
            } else {
              this.readOnly = !datprm;
              this.esVisibleSelecc = 'onClick';
            }
          } else if(this._sdatos.D_MATRIZ.CLASE.match('Producto simple|Parte simple')) {
            this.readOnly = datprm;
            this.esVisibleSelecc = 'onClick';
          }
        } else {
          this.readOnly = datprm;
          this.esVisibleSelecc = 'none';
        }
      }
    );
    // this.subscriptionConCambios = this._sdatos
    //   .getConCambios()
    //   .subscribe((datprm) => {
    //     this._sdatos.conCambios = this._sdatos.conCambios + datprm;
    //   }
    // );

    this.onRowValidating = this.onRowValidating.bind(this);
    this.onCalculateSubTotal = this.onCalculateSubTotal.bind(this);
    this.onCalculateTotalSeccion = this.onCalculateTotalSeccion.bind(this);
    // this.getTotalGravamenes = this.getTotalGravamenes.bind(this);
    this.ngOnInit = this.ngOnInit.bind(this);
  }

  ngOnInit(): void {
    if(!this._sdatos.readonly) {
      this.readOnly = this._sdatos.readonly;
      this.esVisibleSelecc = 'onClick';
    } else {
      this.readOnly = this._sdatos.readonly;
      this.esVisibleSelecc = 'none';
    };
    if ( this._sdatos.MATRIZ_DETALLE_MATERIALES.length !== 0 ){
      this.activeModoGrid(this._sdatos.modoGrid);
    }
    this.BASE_COSTO = this._sdatos.D_MATRIZ.BASES_COSTOS;
    this.DGMateriales = this._sdatos.DGMateriales.length > 0  ? this._sdatos.DGMateriales : [];
    if (this.DGMateriales.length <= 0)
      this.valoresObjetos('PRODUCTOS MATERIALES');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    // this.subscriptionConCambios.unsubscribe();
    // this.subscriptionRefrescarTotales.unsubscribe();
  }

  onCellPrepared(e:any) {
    // Verificar si la celda está bloqueada
    if (e.column.dataField !== 'ID_COMPONENTE' && e.column.dataField !== 'CANTIDAD') {
      // e.cellElement.classList.add('disabled-cell');
      e.cellElement.setAttribute('tabindex', '-1');
    }
  }

  onContentReady(e:any) {
    e.component.columnOption("command:edit", "visible", false);
    // this.gridMaterialesDetalles.instance.updateDimensions();
  }

  onRowPrepared(e:any) {
		if (e.rowType === "data") {
			if (e.data) {
				if (e.data.isEdit) {
					const className:string = e.rowElement.className;
					e.rowElement.className = className +' row-modified-focused';
				}
			}
			if (e.isEditing) {
				const check = e.element.querySelectorAll(".dx-select-checkbox");
				check.forEach((ele:any) => {
					const inst = dxCheckBox.getInstance(ele);
					inst.option("visible", false);
				});
			}
    }
	}

  activeModoGrid(e: any) {
    this.modoGrid = e;
    // if ( this._sdatos.D_MATRIZ.CLASE.match('Producto simple|Parte simple')) {
      const pos = this._sdatos.MATRIZ_DETALLE_MATERIALES.findIndex((d:any) => d.ID_SECCION === this.getData.ID_SECCION);
      if ( pos !== -1 ) {
        this.DGDetalleMateriales = JSON.parse(JSON.stringify(this._sdatos.MATRIZ_DETALLE_MATERIALES[pos].DATA_SOURCE));
        if(this.DGDetalleMateriales.length > 0) {
          const subtotalSecciones: number = this.DGDetalleMateriales.reduce( (acc:any, item:any) => {
            return acc += item.SUB_TOTAL;
          }, 0);
          const proteccion: number = this.DGDetalleMateriales.reduce( (acc:any, item:any) => {
            return acc += item.PROTECCION;
          }, 0);
          const factor_pro: number = (proteccion/subtotalSecciones)*100;      
          this.send_totalSeccionMateriales.emit({
            SUB_TOTAL: subtotalSecciones,
            ID_SECCION: this.getData.ID_SECCION,
            TOTAL_GRAVADOS: this.conGravados,
            TOTAL_SIN_IVA: this.conExcluidos,
            FACTOR_MA: factor_pro,
            PROTECCION: proteccion
          });
        }
      }
    // }
    // if ( this._sdatos.D_MATRIZ.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
    //   if ( this.modoGrid === 'Por Partes' ) {
    //     if(this.getData.TIPO === 'PARTE') {
    //       const id = this._sdatos.MATRIZ_DETALLE_MATERIALES.findIndex((d:any) => d.ID_SECCION === this.getData.ID_SECCION );
    //       if ( id !== -1 ) {
    //         var parte = this._sdatos.MATRIZ_DETALLE_MATERIALES[id].DATA_SOURCE.findIndex((d:any) => d.ID_PARTE === this.getData.ID_PARTE);        
    //         if ( parte !== -1 )
    //           this.DGDetalleMateriales.push(JSON.parse(JSON.stringify(this._sdatos.MATRIZ_DETALLE_MATERIALES[id].DATA_SOURCE[parte]))); 
    //       }
    //     };
    //     if(this.getData.TIPO === 'PRODUCTO') {
    //       const id = this._sdatos.MATRIZ_DETALLE_MATERIALES.findIndex((d:any) => d.ID_SECCION === this.getData.ID_SECCION );
    //       if ( id !== -1 ) {
    //         var parte = this._sdatos.MATRIZ_DETALLE_MATERIALES[id].DATA_SOURCE.filter((d:any) => d.ID_PARTE === this.getData.ID_PARTE);        
    //         this.DGDetalleMateriales = JSON.parse(JSON.stringify(parte)); 
    //         // if ( parte !== -1 )
    //         //   this.DGDetalleMateriales.push(JSON.parse(JSON.stringify(this._sdatos.MATRIZ_DETALLE_MATERIALES[id].DATA_SOURCE[parte]))); 
    //       } else {
    //         this.DGDetalleMateriales = [];
    //       }
    //     }
    //   }
    //   if ( this.modoGrid === 'Por Secciones' ) {
    //     const element = this._sdatos.MATRIZ_DETALLE_MATERIALES.filter((d:any) => d.ID_SECCION === this.getData.ID_SECCION);
    //     this.DGDetalleMateriales = element[0].DATA_SOURCE;
    //   }
    // };
    this.DGDetalleMateriales_prev = JSON.parse(JSON.stringify(this.DGDetalleMateriales));
  }

  onSelectionMaterial(e: any, cellInfo: any) {
    this.openMateriales = false;
    if ( e.selectedRowKeys.length > 0 ) {
      if (this.DGDetalleMateriales.findIndex((d:any) => d.ID_COMPONENTE === e.selectedRowsData[0].ID_COMPONENTE) === -1 ) {

        if (e.selectedRowsData[0].VALOR_UNITARIO <= 0) {
          cellInfo.data.NOMBRE = '';
          cellInfo.data.VALOR_UNITARIO = '';
          cellInfo.data.ID_UDM = '';
          // this.selectMaterial = [];
          showToast('El máterial seleccionado tiene Valor de cero(0), seleccione otro Material.', 'error');
        } else {
          cellInfo.data.ID_COMPONENTE = e.selectedRowsData[0].ID_COMPONENTE;
          cellInfo.data.NOMBRE = e.selectedRowsData[0].NOMBRE;
          cellInfo.data.VALOR_UNITARIO = e.selectedRowsData[0].VALOR_UNITARIO;
          cellInfo.data.FACTOR_MA = e.selectedRowsData[0].FACTOR_MA;
          cellInfo.data.PROTECCION = e.selectedRowsData[0].PROTECCION;
          cellInfo.data.ID_UDM = e.selectedRowsData[0].ID_UDM;
          cellInfo.data.PORCENTAJE = e.selectedRowsData[0].PORCENTAJE;
          cellInfo.data.CANTIDAD = 0;
          cellInfo.data.SUB_TOTAL = 0;
          cellInfo.data.TOTAL = 0;
          this.gridMaterialesDetalles.instance.cellValue(cellInfo.rowIndex, "NOMBRE", cellInfo.data.NOMBRE);
          this.gridMaterialesDetalles.instance.editCell(cellInfo.rowIndex, "CANTIDAD");
        }

      } else {
        cellInfo.data.NOMBRE = '';
        cellInfo.data.VALOR_UNITARIO = '';
        cellInfo.data.ID_UDM = '';
        cellInfo.data.CANTIDAD = 0;
        cellInfo.data.TOTAL = 0;
        // this.selectMaterial = [];
        this.gridMaterialesDetalles.instance.cellValue(cellInfo.rowIndex, "NOMBRE", cellInfo.data.NOMBRE);
        showToast('No puede repetir el máterial en la misma sección.', 'error');
      }
    } else {
      cellInfo.data.NOMBRE = '';
      cellInfo.data.VALOR_UNITARIO = '';
      cellInfo.data.ID_UDM = '';
      cellInfo.data.CANTIDAD = 0;
      cellInfo.data.TOTAL = 0;
      // this.selectMaterial = [];
      this.gridMaterialesDetalles.instance.cellValue(cellInfo.rowIndex, "NOMBRE", cellInfo.data.NOMBRE);
    }
  }

  onCalculateSubTotal(newData: any, value: any, currentRowData: any) {
    this._sdatos.conCambios++;
    this._sdatos.setConCambios(this._sdatos.conCambios);
    if ( value !== 0 ) {
      let proteccion:any = 0;
      let total_ma:any = 0;
      newData.CANTIDAD = value;
      newData.SUB_TOTAL = newData.CANTIDAD * currentRowData.VALOR_UNITARIO;
      //Valida la Base de Costo para calcular el total protección:::
      switch (this._sdatos.D_MATRIZ.BASES_COSTOS) {
        case 'Ultima Compra':
          proteccion = newData.SUB_TOTAL * (currentRowData.FACTOR_MA / 100);
          newData.PROTECCION = proteccion;
          total_ma = newData.SUB_TOTAL + newData.PROTECCION;
          newData.TOTAL = total_ma;
          break;

        case 'Lista de Precio Tipo Costos':
          newData.TOTAL = newData.SUB_TOTAL / ( 1 - (currentRowData.FACTOR_MA / 100));
          proteccion = newData.TOTAL - newData.SUB_TOTAL;
          newData.PROTECCION = proteccion;
          break;

        case 'Promedio Kardex':
          newData.PROTECCION = 0;
          newData.TOTAL = newData.SUB_TOTAL;
          break;
      
        default:
          newData.CANTIDAD = 0;
          newData.SUB_TOTAL = 0;
          newData.PROTECCION = 0;
          newData.TOTAL = 0;
          break;
      }

      // this.getTotalGravamenes(currentRowData.PORCENTAJE, newData.TOTAL);
      this.getTotalesExcGra(currentRowData.PORCENTAJE, newData.TOTAL, 'new');

      this.gridMaterialesDetalles.instance.cellValue(currentRowData.rowIndex, 'CANTIDAD', currentRowData.CANTIDAD);
      this.gridMaterialesDetalles.instance.cellValue(currentRowData.rowIndex, 'SUB_TOTAL', currentRowData.SUB_TOTAL);
      this.gridMaterialesDetalles.instance.cellValue(currentRowData.rowIndex, 'PROTECCION', currentRowData.PROTECCION);
      this.gridMaterialesDetalles.instance.cellValue(currentRowData.rowIndex, 'TOTAL', currentRowData.TOTAL);

    } else {
      newData.TOTAL = 0;
    }
  }

  // getTotalGravamenes(porcentaje: any, total: any) {
    // this.TOTAL_GRAVAMENES = total * porcentaje;
    // this._sdatos.TOTAL_GRAVAMENES = this._sdatos.TOTAL_GRAVAMENES + this.TOTAL_GRAVAMENES;
  // }

  getTotalesExcGra(porcentaje: any, total: any, accion: any) {
    switch (accion) {
      case 'new':
        if (porcentaje === 0) {
          const subT = porcentaje * total;
          this.conExcluidos = this.conExcluidos + subT;
        } else {
          const subT = porcentaje * total;
          this.conGravados = this.conGravados + subT;
        }
        break;
    
      case 'delete':
        if (porcentaje === 0) {
          const subT = porcentaje * total;
          this.conExcluidos = this.conExcluidos - subT;
        } else {
          const subT = porcentaje * total;
          this.conGravados = this.conGravados - subT;
        }
        break;
    
      default:
        break;
    }
  }
  onRowInserting(e:any) {
		e.data.isEdit = true;
		if (e.data !== undefined) {
			this.rowApplyChanges = false;
		}
	}

  onRowUpdating(e:any) {
		if (e.oldData === undefined)
			return;
		e.oldData.isEdit = true;
	}

  onCalculateTotalSeccion(e:any) {
    const subtotalSecciones: number = this.DGDetalleMateriales.reduce( (acc:any, item:any) => {
      return acc += item.SUB_TOTAL;
    }, 0);
    const proteccion: number = this.DGDetalleMateriales.reduce( (acc:any, item:any) => {
      return acc += item.PROTECCION;
    }, 0);
    const factor_pro: number = (subtotalSecciones > 0) ? (proteccion / subtotalSecciones) * 100 : 0;

    this.send_totalSeccionMateriales.emit({
      ID_SECCION: this.getData.ID_SECCION,
      SUB_TOTAL: subtotalSecciones,
      TOTAL_GRAVADOS: this.conGravados,
      TOTAL_SIN_IVA: this.conExcluidos,
      FACTOR_MA: factor_pro,
      PROTECCION: proteccion
    });

    const pos = this._sdatos.MATRIZ_DETALLE_MATERIALES.findIndex((d:any) => d.ID_SECCION === this.getData.ID_SECCION);
    if ( pos !== -1 )
      this._sdatos.MATRIZ_DETALLE_MATERIALES[pos] = { ID_SECCION: this.getData.ID_SECCION, DATA_SOURCE: this.DGDetalleMateriales };
    else
      this._sdatos.MATRIZ_DETALLE_MATERIALES.push({ ID_SECCION: this.getData.ID_SECCION, DATA_SOURCE: this.DGDetalleMateriales });
    
    this.DGDetalleMateriales_prev = JSON.parse(JSON.stringify(this.DGDetalleMateriales));
  }

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowsData;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  onOpenedProductos(e:any) {
    const width:number = this.dropDownMateriales.width;
    this.widthSerchMateriales = width - 40;
    if (this.DGMateriales.length <= 0)
      this.valoresObjetos('PRODUCTOS MATERIALES');
  }

  onClosedProductos(e:any) {
    this.loadingVisible = false;
  }

  // Operaciones de grid
  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'new':
        this.gridMaterialesDetalles.instance.clearSelection();
        this.gridMaterialesDetalles.instance.addRow();
        this.filasSelecc = [];
				this.accion = 'new';
        this.rowApplyChanges = true;
				this.rowNew = false;
				this.rowDelete = false;
				// this.esVisibleSelecc = 'none';
        break;
      case 'edit':
        this.gridMaterialesDetalles.instance.clearSelection();
				this.accion = 'update';
        this.rowApplyChanges = true;
				this.rowNew = false;
				this.rowDelete = false;
				// this.esVisibleSelecc = 'none';
        break;
      case 'save':
        this.gridMaterialesDetalles.instance.saveEditData();
        // this.rowApplyChanges = false;
        // this.rowNew = true;
        // this._sdatos.MATRIZ_DETALLE_MATERIALES = this.DGDetalleMateriales;
        break;
      case 'cancel':
        this.gridMaterialesDetalles.instance.cancelEditData();
        this.accion = '';
        this.rowApplyChanges = false;
        this.rowNew = true;
				if(this.filasSelecc.length > 0) {
					this.rowDelete = true;
				} else {
					this.rowDelete = false;
				}
        this.DGDetalleMateriales_prev = JSON.parse(JSON.stringify(this.DGDetalleMateriales));
        this.gridMaterialesDetalles.instance.refresh();
        break;
      case 'delete':
        // Elimina filas seleccionadas
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
            this.filasSelecc.forEach((data:any) => {
              const index = this.DGDetalleMateriales.findIndex((a:any) => a.ID_COMPONENTE === data.ID_COMPONENTE);
              this.DGDetalleMateriales.splice(index, 1);
            });
            this.gridMaterialesDetalles.instance.refresh();
            this.getTotalesExcGra(this.filasSelecc[0].PORCENTAJE, this.filasSelecc[0].TOTAL, 'delete');
            this.onCalculateTotalSeccion(e);
            // this._sdatos.MATRIZ_DETALLE_MATERIALES = this.DGDetalleMateriales;
            const pos = this._sdatos.MATRIZ_DETALLE_MATERIALES.findIndex((d:any) => d.ID_SECCION === this.getData.ID_SECCION);
            if ( pos !== -1 ) {
              this._sdatos.MATRIZ_DETALLE_MATERIALES[pos] = { ID_SECCION: this.getData.ID_SECCION, DATA_SOURCE: this.DGDetalleMateriales };
            } else {
              this._sdatos.MATRIZ_DETALLE_MATERIALES.push({ ID_SECCION: this.getData.ID_SECCION, DATA_SOURCE: this.DGDetalleMateriales });
            }
            this.accion = '';
						this.rowApplyChanges = false;
						this.rowNew = true;
						if(this.filasSelecc.length > 0) {
							this.rowDelete = true;
						} else {
							this.rowDelete = false;
						}
            this._sdatos.conCambios++;
          }
        });
        break;

      case 'refrescar':
        this.gridMaterialesDetalles.instance.refresh();
        break;

      default:
        break;
    }
  }

  onInitNewRowPro(e: any) {
    this.gridMaterialesDetalles.instance.clearSelection();
    e.data.ID_SECCION = this.getData.ID_SECCION;
    e.data.ID_COMPONENTE = '';
		e.data.NOMBRE = '';
		e.data.CANTIDAD = 0;
    e.data.PROTECCION = 0;
		e.data.VALOR_UNITARIO = 0;
		e.data.ID_UDM = '';
		e.data.SUB_TOTAL = 0;
		e.data.TOTAL = 0;
    e.data.ESTADO = 'ACTIVO';
    e.data.FACTOR_MA = 0;
    e.data.ORDEN = this.getData.ITEM;
    this.selectMaterial = [];
    if(this.DGDetalleMateriales.length > 0)
      this.DGDetalleMateriales_prev = JSON.parse(JSON.stringify(this.DGDetalleMateriales));
	}

  onEditingStart(e:any) {
    this.filasSelecc = [];
		this.accion = 'update';
		this.rowNew = false;
		this.rowApplyChanges = true;
		this.rowDelete = false;
		// this.esVisibleSelecc = 'none';
  }

  startEdit(e:any) {
    this.gridMaterialesDetalles.instance.clearSelection();
		if(e.data !== undefined && e.data !== null) {
    	if (!this.readOnly) {
				// e.component.cancelEditData(this.numFila);
				e.component.editRow(e.rowIndex);
        this.dataCell = e.data;
				this.accion = 'update';
				e.isEditing = true;
				e.data.minValor = 0;
				e.data.readOnlyDefecto = false;
				e.data.readOnlyValor = false;
				this.rowNew = false;
				this.rowApplyChanges = true;
				this.rowDelete = false;
      };
    };
    this.DGDetalleMateriales_prev = JSON.parse(JSON.stringify(this.DGDetalleMateriales));
    
  };

  onEditCanceled(e:any) {
    this.DGDetalleMateriales = JSON.parse(JSON.stringify(this.DGDetalleMateriales_prev));
  };

  onRowValidating(e: any) {
		let mensaje:any='';
		let propiedadesVacias:any = [];
		const propiedadesVerificar = ["ID_SECCION", "ID_COMPONENTE", "NOMBRE", "CANTIDAD", "VALOR_UNITARIO", "ID_UDM", "TOTAL"];

    if ( this.accion === 'new' ) {
      if( ((e.newData.ID_SECCION === '') || (e.newData.ID_SECCION === null)) ||
          ((e.newData.ID_COMPONENTE === '') || (e.newData.ID_COMPONENTE === null)) ||
          ((e.newData.NOMBRE === '') || (e.newData.NOMBRE === null)) ||
          ((e.newData.CANTIDAD === '') || (e.newData.CANTIDAD <= 0)) ||
          ((e.newData.VALOR_UNITARIO === '') || (e.newData.VALOR_UNITARIO <= 0)) ||
          ((e.newData.ID_UDM === '') || (e.newData.ID_UDM === null)) ||
          ((e.newData.TOTAL === '') || (e.newData.TOTAL <= 0))
        )
      {
        for (let key in e.newData) {
          if (propiedadesVerificar.includes(key) && !e.newData[key]) {
            propiedadesVacias.push(key);
          }
        }
        if (propiedadesVacias.length > 0) {
          mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;
          if (e.newData.VALOR <= 0)
            mensaje = mensaje+' El valor debe ser mayor a cero(0).';
        } else if (e.newData.VALOR <= 0) {
          mensaje = 'El valor debe ser mayor a cero(0).';
        }
  
        e.isValid = false;
        showToast(mensaje, 'error');
        
      } else {
        e.isValid = true;
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.rowDelete = false;
        this.accion = '';
        this.esVisibleSelecc = 'onClick';
      }	
    };
    if ( this.accion === 'update' ) {
      for (let prop in e.newData) {
        if (e.newData.hasOwnProperty(prop) && e.oldData.hasOwnProperty(prop)) {
          e.oldData[prop] = e.newData[prop];
        }
      }
      if( ((e.oldData.ID_SECCION === '') || (e.oldData.ID_SECCION === null)) ||
          ((e.oldData.ID_COMPONENTE === '') || (e.oldData.ID_COMPONENTE === null)) ||
          ((e.oldData.NOMBRE === '') || (e.oldData.NOMBRE === null)) ||
          ((e.oldData.CANTIDAD === '') || (e.oldData.CANTIDAD <= 0)) ||
          ((e.oldData.VALOR_UNITARIO === '') || (e.oldData.VALOR_UNITARIO <= 0)) ||
          ((e.oldData.ID_UDM === '') || (e.oldData.ID_UDM === null)) ||
          ((e.oldData.TOTAL === '') || (e.oldData.TOTAL <= 0))
        )
      {
        for (let key in e.oldData) {
          if (propiedadesVerificar.includes(key) && !e.oldData[key]) {
            propiedadesVacias.push(key);
          }
        }
        if (propiedadesVacias.length > 0) {
          mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;
          if (e.newData.VALOR <= 0)
            mensaje = mensaje+' El valor debe ser mayor a cero(0).';
        } else if (e.newData.VALOR <= 0) {
          mensaje = 'El valor debe ser mayor a cero(0).';
        }
  
        e.isValid = false;
        showToast(mensaje, 'error');
        
      } else {
        e.isValid = true;
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.rowDelete = false;
        this.accion = '';
        this.esVisibleSelecc = 'onClick';
      }	
    }
    this.gridMaterialesDetalles.instance.clearSelection();
		return e.isValid;

	}
  
  valoresObjetos(obj:string) {
    if (obj === 'PRODUCTOS MATERIALES' || obj === 'todos') {
      const prm = { BASE_COSTO: this._sdatos.D_MATRIZ.BASES_COSTOS };
      this.loadingVisible = true;
      this.sData.getItemProductos('PRODUCTOS MATERIALES', prm).subscribe((data: any) => {
        this.loadingVisible = false;
        const res = JSON.parse(data.data);
        if ( data.token != undefined ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.showModal(mensaje, '');
        } else {
          this.DGMateriales = newArray;
          this._sdatos.DGMateriales = newArray;
        };
      },
        (err => {
          this.loadingVisible = false;
          this.showModal(err.message, '');
        })
      );
    }
  }

  showModal(mensaje: any, title: any) {
    const tipo = title;
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo==='Error' ? 'DF3E3E':'#0F4C81 !important',
			title: title,
			text: mensaje,
			allowOutsideClick: true,
			allowEscapeKey: false,
			allowEnterKey: false,
			backdrop: true,
			position: 'center',
			stopKeydownPropagation: false,
		});
	}
}
