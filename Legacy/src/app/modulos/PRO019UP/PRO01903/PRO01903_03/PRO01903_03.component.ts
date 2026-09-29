import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxLoadPanelModule, DxNumberBoxModule, DxTextBoxModule } from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { Subscription } from 'rxjs';
import { PRO019Service } from 'src/app/services/PRO019/PRO019.service';
import Swal from 'sweetalert2';
import { PRO019DataService } from '../../SERVICE/pro019.service';
import { showToast } from '../../../../shared/toast/toastComponent.js';
import dxCheckBox from "devextreme/ui/check_box";

@Component({
  selector: 'app-PRO01903_03',
  templateUrl: './PRO01903_03.component.html',
  styleUrls: ['./PRO01903_03.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxDropDownBoxModule, DxTextBoxModule, DxNumberBoxModule, DxButtonModule, DxLoadPanelModule, DxDateBoxModule]
})
export class PRO01903_03Component implements OnInit {

  @ViewChild("gridDetalleManoObra", { static: false }) gridDetalleManoObra: DxDataGridComponent;
  @Input() getData: any;
  @Output() send_totalSeccion: EventEmitter<any> = new EventEmitter();

  subscription: Subscription;
  subscriptionConCambios: Subscription;
  // conCambios: number = 0;
  modoGrid: string;

  DGDetalleManoObra: any = [];
  DGDetalleManoObra_prev: any = [];
  DGManoObra: any = [];
  selectManoObra: any = [];
  dataCell: any;
  rules: any;
  readOnly: boolean;
  esVisibleSelecc: string = 'none';
  openManoObra: boolean = false;
  loadingVisible: boolean = false;

  // Operaciones de grid
  accion: string = '';
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

    this.rules = {
      H: (char:any) => char >= 0 && char <= 9,
      h: (char:any) => char >= 0 && char <= 9,
      M: (char:any) => char >= 0 && char <= 5,
      m: (char:any, index:any, fullStr:any) => {
        if (fullStr[3] === '5')
          return [0,1,2,3,4,5,6,7,8,9].includes(parseInt(char));
        else
          return [0,1,2,3,4,5,6,7,8,9].includes(parseInt(char));
      },
      S: (char:any) => char >= 0 && char <= 5,
      s: (char:any, index:any, fullStr:any) => {
        if (fullStr[6] === '5')
          return [0,1,2,3,4,5,6,7,8,9].includes(parseInt(char));
        else
          return [0,1,2,3,4,5,6,7,8,9].includes(parseInt(char));
      },
  }

    this.onCalculateSubTotal = this.onCalculateSubTotal.bind(this);
    this.onCalculateTotalSeccion = this.onCalculateTotalSeccion.bind(this);
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
    if ( this._sdatos.MATRIZ_DETALLE_MANO_OBRA.length > 0 ){
      this.activeModoGrid(this._sdatos.modoGrid);
    }
    this.DGManoObra = this._sdatos.DGManoObra.length > 0  ? this._sdatos.DGManoObra : [];
    if (this.DGManoObra.length <= 0)
      this.valoresObjetos('MANO DE OBRA');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    // this.subscriptionConCambios.unsubscribe();
  }

  onCellPrepared(e:any) {
    // Verificar si la celda está bloqueada
    if (e.column.dataField !== 'CODIGO' && e.column.dataField !== 'CANTIDAD') {
      // e.cellElement.classList.add('disabled-cell');
      e.cellElement.setAttribute('tabindex', '-1');
    }
  }

  onContentReady(e:any) {
    e.component.columnOption("command:edit", "visible", false);
  }

  startEdit(e:any) {
    this.gridDetalleManoObra.instance.clearSelection();
		if(e.data !== undefined && e.data !== null) {
      if (!this.readOnly) {
        this.dataCell = e.data;
				// e.component.cancelEditData(this.numFila);
				e.component.editRow(e.rowIndex);
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
    this.DGDetalleManoObra_prev = JSON.parse(JSON.stringify(this.DGDetalleManoObra));
  };

  onEditCanceled(e:any) {
    this.DGDetalleManoObra = JSON.parse(JSON.stringify(this.DGDetalleManoObra_prev));
  };

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
      if (e.data.TIPO === 'Tiempo') {
        e.data.CANTIDAD = String(e.data.CANTIDAD);
        e.data.maskCantidad = 'Hh:Mm:Ss';
        // if (e.data.UNIDAD_MEDIDA === 'Hora') {
        //   e.data.maskCantidad = 'Hh:Mm:Ss';
        // }
        // if (e.data.UNIDAD_MEDIDA === 'Min') {
        //   e.data.maskCantidad = 'Mm:Ss';
        // }
        // if (e.data.UNIDAD_MEDIDA === 'Sg') {
        //   e.data.maskCantidad = 'Ss';
        // }
      }
      if(!this._sdatos.readonly) {
        e.data.readOnlyCantidad = false;
      } else {
        e.data.readOnlyCantidad = true;
      };
    }
  };

  activeModoGrid(e: any) {
    this.modoGrid = e;

    // if ( this._sdatos.D_MATRIZ.CLASE.match('Producto simple|Parte simple')) {
      const pos = this._sdatos.MATRIZ_DETALLE_MANO_OBRA.findIndex((d:any) => d.ID_SECCION === this.getData.ID_SECCION);
      if ( pos != -1 )
        this.DGDetalleManoObra = JSON.parse(JSON.stringify(this._sdatos.MATRIZ_DETALLE_MANO_OBRA[pos].DATA_SOURCE));
    // }
    // if ( this._sdatos.D_MATRIZ.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
    //   if ( this.modoGrid === 'Por Partes' ) {
    //     if(this.getData.TIPO === 'PARTE') {
    //       const id = this._sdatos.MATRIZ_DETALLE_MANO_OBRA.findIndex((d:any) => d.ID_SECCION === this.getData.ID_SECCION );
    //       if ( id !== -1 ) {
    //         var parte = this._sdatos.MATRIZ_DETALLE_MANO_OBRA[id].DATA_SOURCE.findIndex((d:any) => d.ID_PARTE === this.getData.ID_PARTE);        
    //         if ( parte !== -1 )
    //           this.DGDetalleManoObra.push(JSON.parse(JSON.stringify(this._sdatos.MATRIZ_DETALLE_MANO_OBRA[id].DATA_SOURCE[parte]))); 
    //       }
    //     };
    //     if(this.getData.TIPO === 'PRODUCTO') {
    //       const id = this._sdatos.MATRIZ_DETALLE_MANO_OBRA.findIndex((d:any) => d.ID_SECCION === this.getData.ID_SECCION );
    //       if ( id !== -1 ) {
    //         var parte = this._sdatos.MATRIZ_DETALLE_MANO_OBRA[id].DATA_SOURCE.findIndex((d:any) => d.ID_PARTE === this.getData.ID_PARTE);        
    //         if ( parte !== -1 )
    //           this.DGDetalleManoObra.push(JSON.parse(JSON.stringify(this._sdatos.MATRIZ_DETALLE_MANO_OBRA[id].DATA_SOURCE[parte]))); 
    //       } else {
    //         this.DGDetalleManoObra = [];
    //       }
    //     }
    //   }
    //   if ( this.modoGrid === 'Por Secciones' ) {
    //     const element = this._sdatos.MATRIZ_DETALLE_MANO_OBRA.filter((d:any) => d.ID_SECCION === this.getData.ID_SECCION);
    //     this.DGDetalleManoObra = element[0].DATA_SOURCE;
    //   }
    // };
    this.DGDetalleManoObra_prev = JSON.parse(JSON.stringify(this.DGDetalleManoObra));
  };

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  onSelectionManoObra(e: any, cellInfo: any) {
    this.openManoObra = false;
    if ( e.selectedRowKeys.length > 0 ) {
      if (this.DGDetalleManoObra.findIndex((d:any) => d.CODIGO === e.selectedRowsData[0].CODIGO) === -1 ) {
        this.selectManoObra = e.selectedRowKeys;
        cellInfo.data.CODIGO = e.selectedRowsData[0].CODIGO;
        cellInfo.data.DESCRIPCION = e.selectedRowsData[0].DESCRIPCION;
        cellInfo.data.VALOR = e.selectedRowsData[0].VALOR;
        cellInfo.data.UNIDAD_MEDIDA = e.selectedRowsData[0].UNIDAD_MEDIDA;
        cellInfo.data.TIPO = e.selectedRowsData[0].TIPO;
        if (cellInfo.data.TIPO === 'Tiempo') {
          cellInfo.data.CANTIDAD = '00:00:00';
          cellInfo.data.TIEMPO = '00:00:00';
          switch (cellInfo.data.UNIDAD_MEDIDA) {
            case 'Hora':
              cellInfo.data.maskCantidad = 'Hh:Mm:Ss';
              break;
  
            case 'Min':
              cellInfo.data.maskCantidad = 'Mm:Ss';
              break;
  
            case 'Sg':
              cellInfo.data.maskCantidad = 'Ss';
              break;
          
            default:
              break;
          }
        } else if (cellInfo.data.TIPO === 'Dinero') {
          cellInfo.data.CANTIDAD = 0;
          cellInfo.data.TIEMPO = '00:00:00';
        }
        cellInfo.data.FACTOR_MOD = this.getData.FACTOR_MOD;
        cellInfo.data.SUB_TOTAL = 0;
        cellInfo.data.PROTECCION = 0;
        cellInfo.data.TOTAL = 0;

        this.gridDetalleManoObra.instance.cellValue(cellInfo.rowIndex, "DESCRIPCION", cellInfo.data.DESCRIPCION);
        this.gridDetalleManoObra.instance.cellValue(cellInfo.rowIndex, "FACTOR_MOD", cellInfo.data.FACTOR_MOD);
        this.gridDetalleManoObra.instance.cellValue(cellInfo.rowIndex, "UNIDAD_MEDIDA", cellInfo.data.UNIDAD_MEDIDA);
        this.gridDetalleManoObra.instance.cellValue(cellInfo.rowIndex, "VALOR", cellInfo.data.VALOR);
        this.gridDetalleManoObra.instance.editCell(cellInfo.rowIndex, "CANTIDAD");
      }  else {
        cellInfo.data.DESCRIPCION = '';
        cellInfo.data.VALOR = '';
        cellInfo.data.UNIDAD_MEDIDA = '';
        cellInfo.data.TIPO = '';
        cellInfo.data.CANTIDAD = '00:00:00';
        cellInfo.data.SUB_TOTAL = 0;
        cellInfo.data.PROTECCION = 0;
        cellInfo.data.TOTAL = 0;
        this.selectManoObra = [];
        this.gridDetalleManoObra.instance.cellValue(cellInfo.rowIndex, "DESCRIPCION", cellInfo.data.DESCRIPCION);
        showToast('No puede repetir la Mano de Obra en la misma sección.', 'error');
      }
    } else {
      cellInfo.data.DESCRIPCION = '';
      cellInfo.data.VALOR = '';
      cellInfo.data.UNIDAD_MEDIDA = '';
      cellInfo.data.TIPO = '';
      cellInfo.data.CANTIDAD = '00:00:00';
      cellInfo.data.SUB_TOTAL = 0;
      cellInfo.data.PROTECCION = 0;
      cellInfo.data.TOTAL = 0;
      this.selectManoObra = [];
      this.gridDetalleManoObra.instance.cellValue(cellInfo.rowIndex, "DESCRIPCION", cellInfo.data.DESCRIPCION);
    }
  }

  onOpenedMO(e:any) {
    if (this.DGManoObra.length <= 0)
      this.valoresObjetos('MANO DE OBRA');
  }

  onClosedMO(e:any) {
    this.loadingVisible = false;
  }

  onCalculateSubTotal(e:any, cellInfo:any) {
    switch (cellInfo.data.TIPO) {
      case 'Tiempo':
        var value:any = String(e.value);
        var proteccion:any = 0;
        var total_mo:any = 0;
        if (value.length < 6) {
          for (let i = 0; value.length < 6; i++) {
            value = value + '0'; 
          }
        }

        const cantidad:any = value.match(/.{1,2}/g);
        var hora:any = cantidad[0];
        var min:any = cantidad[1];
        var seg:any = cantidad[2];
        var TH:any; //Total Hora
        var TM:any; //Total Minuto
        var TS:any; //Total Segundo
        
        switch (cellInfo.data.UNIDAD_MEDIDA) {
          case 'Hora':
            TH = hora * cellInfo.data.VALOR;
            var Vm:any = cellInfo.data.VALOR / 60;
            TM = Vm * min;
            var Vs:any = Vm / 60;
            TS = Vs * seg;
            cellInfo.data.SUB_TOTAL = TH + TM + TS;
            break;
  
          case 'Min':
            TH = hora * (cellInfo.data.VALOR*60);
            TM = min * cellInfo.data.VALOR;
            var Vs:any = cellInfo.data.VALOR / 60;
            TS = Vs * seg;
            cellInfo.data.SUB_TOTAL = TH + TM + TS;
            break;
  
          case 'Sg':
            TH = hora * (cellInfo.data.VALOR*3600);
            TM = min * (cellInfo.data.VALOR*60);
            TS = seg * cellInfo.data.VALOR;
            cellInfo.data.SUB_TOTAL = TH + TM + TS;
            break;
        
          default:
            break;
        }
  
        cellInfo.data.CANTIDAD = value;
        cellInfo.data.TIEMPO = value;
        proteccion = (cellInfo.data.SUB_TOTAL * cellInfo.data.FACTOR_MOD) / 100;
        total_mo = cellInfo.data.SUB_TOTAL + proteccion;
        cellInfo.data.PROTECCION = proteccion;
        cellInfo.data.TOTAL = total_mo;
        break;

      case 'Dinero':
        cellInfo.data.CANTIDAD = e.value;
        cellInfo.data.SUB_TOTAL = cellInfo.data.CANTIDAD * cellInfo.data.VALOR;
        proteccion = (cellInfo.data.SUB_TOTAL * cellInfo.data.FACTOR_MOD) / 100;
        total_mo = cellInfo.data.SUB_TOTAL + proteccion;
        cellInfo.data.PROTECCION = proteccion;
        cellInfo.data.TOTAL = total_mo;
        break;
    
      default:
        break;
    };
    
    this.gridDetalleManoObra.instance.cellValue(cellInfo.rowIndex, 'CANTIDAD', cellInfo.data.CANTIDAD);
    this.gridDetalleManoObra.instance.cellValue(cellInfo.rowIndex, 'TIEMPO', cellInfo.data.TIEMPO);
    this.gridDetalleManoObra.instance.cellValue(cellInfo.rowIndex, 'SUB_TOTAL', cellInfo.data.SUB_TOTAL);
    this.gridDetalleManoObra.instance.cellValue(cellInfo.rowIndex, 'PROTECCION', cellInfo.data.PROTECCION);
    this.gridDetalleManoObra.instance.cellValue(cellInfo.rowIndex, 'TOTAL', cellInfo.data.TOTAL);

    this.dataCell = cellInfo.data;
    this._sdatos.conCambios++;
    this._sdatos.setConCambios(this._sdatos.conCambios);
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

  onCalculateTotalSeccion(e: any) {
    const totalSecciones = this.DGDetalleManoObra.reduce( (acc:any, item:any) => {
      return acc += item.SUB_TOTAL;
    }, 0);
    const proteccion = this.DGDetalleManoObra.reduce( (acc:any, item:any) => {
      return acc += item.PROTECCION;
    }, 0);

    this.send_totalSeccion.emit({ 
      ID_SECCION: this.getData.ID_SECCION,
      PROTECCION: proteccion,
      SUB_TOTAL: totalSecciones
    });

    const pos = this._sdatos.MATRIZ_DETALLE_MANO_OBRA.findIndex((d:any) => d.ID_SECCION === this.getData.ID_SECCION);
    if ( pos !== -1 )
      this._sdatos.MATRIZ_DETALLE_MANO_OBRA[pos] = { ID_SECCION: this.getData.ID_SECCION, DATA_SOURCE: this.DGDetalleManoObra };
    else
      this._sdatos.MATRIZ_DETALLE_MANO_OBRA.push({ ID_SECCION: this.getData.ID_SECCION, DATA_SOURCE: this.DGDetalleManoObra });

    this.DGDetalleManoObra_prev = JSON.parse(JSON.stringify(this.DGDetalleManoObra));
  };

  // Operaciones de grid
  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'new':
        this.gridDetalleManoObra.instance.clearSelection();
        this.gridDetalleManoObra.instance.addRow();
        this.filasSelecc = [];
				this.accion = 'new';
        this.rowApplyChanges = true;
				this.rowNew = false;
				this.rowDelete = false;
				// this.esVisibleSelecc = 'none';
        break;
      case 'edit':
        this.gridDetalleManoObra.instance.clearSelection();
				this.accion = 'update';
        this.rowApplyChanges = true;
				this.rowNew = false;
				this.rowDelete = false;
				// this.esVisibleSelecc = 'none';
        break;
      case 'save':
        this.gridDetalleManoObra.instance.saveEditData();
        // this.rowApplyChanges = false;
        // this.rowNew = true;
        break;
      case 'cancel':
        this.accion = 'cancelar';
        this.gridDetalleManoObra.instance.cancelEditData();
        this.accion = '';
        this.rowApplyChanges = false;
        this.rowNew = true;
				if(this.filasSelecc.length > 0) {
					this.rowDelete = true;
				} else {
					this.rowDelete = false;
				}
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
            this.filasSelecc.forEach((key) => {
              const index = this.DGDetalleManoObra.findIndex((a:any) => a.ITEM === key);
              this.DGDetalleManoObra.splice(index, 1);
            });
            this.gridDetalleManoObra.instance.refresh();
            this.onCalculateTotalSeccion(e);
            // this._sdatos.MATRIZ_DETALLE_MANO_OBRA = this.DGDetalleManoObra;
            const pos = this._sdatos.MATRIZ_DETALLE_MANO_OBRA.findIndex((d:any) => d.ID_SECCION === this.getData.ID_SECCION);
            if ( pos != -1 ) {
              this._sdatos.MATRIZ_DETALLE_MANO_OBRA[pos] = { ID_SECCION: this.getData.ID_SECCION, DATA_SOURCE: this.DGDetalleManoObra };
            } else {
              this._sdatos.MATRIZ_DETALLE_MANO_OBRA.push({ ID_SECCION: this.getData.ID_SECCION, DATA_SOURCE: this.DGDetalleManoObra });
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
        this.gridDetalleManoObra.instance.refresh();
        break;

      default:
        break;
    }
  }

  onInitNewRowPro(e: any) {
		this.gridDetalleManoObra.instance.clearSelection();
    e.data.ID_SECCION = this.getData.ID_SECCION;
    e.data.CODIGO = '';
		e.data.DESCRIPCION = '';
		e.data.VALOR = 0;
		e.data.UNIDAD_MEDIDA = '';
		e.data.TIPO = '';
    e.data.ESTADO = 'ACTIVO';
    e.data.ORDEN = this.getData.ITEM;
    e.data.SUB_TOTAL = 0;
    e.data.FACTOR_MOD = this.getData.FACTOR_MOD;
    e.data.PROTECCION = 0;
		e.data.TOTAL = 0;
		e.data.TIEMPO = '00:00:00';
    this.selectManoObra = [];
    e.data.maskCantidad = '';
    e.data.readOnlyCantidad = false;
		e.data.CANTIDAD = '00:00:00';
    if(this.DGDetalleManoObra.length > 0)
      this.DGDetalleManoObra_prev = JSON.parse(JSON.stringify(this.DGDetalleManoObra));
	}

  onRowValidating(e: any) {
		let mensaje:any='';
		let propiedadesVacias:any = [];
		const propiedadesVerificar = ["CODIGO", "DESCRIPCION", "CANTIDAD", "VALOR", "UNIDAD_MEDIDA", "TIPO", "TOTAL"];

    if ( this.accion === 'new' ) {
      if( ((e.newData.CODIGO === '') || (e.newData.CODIGO === null)) ||
          ((e.newData.DESCRIPCION === '') || (e.newData.DESCRIPCION === null)) ||
          ((e.newData.CANTIDAD === '') || (e.newData.CANTIDAD <= 0)) ||
          ((e.newData.VALOR === '') || (e.newData.VALOR <= 0)) ||
          ((e.newData.UNIDAD_MEDIDA === '') || (e.newData.UNIDAD_MEDIDA === null)) ||
          ((e.newData.TIPO === '') || (e.newData.TIPO === null)) ||
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
      if( ((e.oldData.CODIGO === '') || (e.oldData.CODIGO === null)) ||
          ((e.oldData.DESCRIPCION === '') || (e.oldData.DESCRIPCION === null)) ||
          ((e.oldData.CANTIDAD === '') || (e.oldData.CANTIDAD <= 0)) ||
          ((e.oldData.VALOR === '') || (e.oldData.VALOR <= 0)) ||
          ((e.oldData.UNIDAD_MEDIDA === '') || (e.oldData.UNIDAD_MEDIDA === null)) ||
          ((e.oldData.TIPO === '') || (e.oldData.TIPO === null)) ||
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
    this.gridDetalleManoObra.instance.clearSelection();
	}
  
  valoresObjetos(obj:string) {
    if(obj === 'MANO DE OBRA' || obj === 'todos') {
      const prm = { };
      this.sData.getItemConceptos('MANO DE OBRA', prm).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( data.token != undefined ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje != '') {
          this.showModal(mensaje);
        } else {
          this.DGManoObra = newArray;
        };
      },
        (err => {
          this.showModal(err.message);
        })
      );
    }
  }

  showModal(mensaje) {
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
			title: '¡Error!',
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
