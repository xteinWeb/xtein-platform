import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxComponent, DxDateBoxModule, DxLoadPanelModule, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { PRO003Service } from 'src/app/services/PRO003/s_PRO003.service';
import Swal from 'sweetalert2';
import { showToast } from '../../../shared/toast/toastComponent.js';
import { Subscription } from 'rxjs';
import dxCheckBox from "devextreme/ui/check_box";

@Component({
  selector: 'app-PRO00601',
  templateUrl: './PRO00601.component.html',
  styleUrls: ['./PRO00601.component.css'],
	standalone: true,
	imports: [CommonModule, DxDataGridModule, DxDateBoxModule, DxButtonModule, DxLoadPanelModule, DxSelectBoxModule, DxTextBoxModule]
})
export class PRO00601Component {
	@ViewChild ('fechaDesde', { static: false }) dFechaDesde : DxDateBoxComponent;
	@ViewChild ('fechaHasta', { static: false }) dFechaHasta : DxDateBoxComponent;
	@ViewChild ("gridManoObraDetalle", { static: false }) gridManoObraDetalle: DxDataGridComponent;

  @Input() dataMO:any;
  @Input() dataFila:any;
  @Output() send_MO: EventEmitter<any> = new EventEmitter();

	subscriptionReadOnly: Subscription;

  esEdicion: boolean = false;
	enEdicion: boolean = false;
	esVisibleSelecc: string = 'none';
	accion: string = '';

	GDManoObraDetalle: any = [];
	DLMedidasArray: any = [];
	GDManoObraDetalle_prev: any = [];
	newArray: any = [];
	filaData: any = [];
	allMode: string;
	UNTiempo:any = [
		{ID_UDM:'Hora', NOMBRE: 'Horas', DESCRIPCION: "Hora - Horas" },
		{ID_UDM:'Min', NOMBRE: 'Minutos', DESCRIPCION: "Min - Minutos" },
		{ID_UDM:'Sg', NOMBRE: 'Segundos', DESCRIPCION: "Sg - Segundos" }
	];
	UNDinero:any = [{ID_UDM:'COP', NOMBRE: 'Dinero', DESCRIPCION: "COP - Peso Colombiano" }];

	fechaDesde:any = '';
	fechaHasta:any = '';
	codigo = '';

	maxValor: number = 0;
	minValor: number = 0;
	numFila: number = 0;

	toaVisible: boolean = false;
	toaTipo = 'info'
  toaMessage = 'Registro actualizado!';
	loadingVisible: boolean = false;

	// Operaciones de grid
	rowNew: boolean = true;
	rowEdit: boolean = false;
	rowDelete: boolean = false;
	rowSave: boolean = false;
	rowApplyChanges: boolean = false;
	filasSelecc: any[] = [];

	constructor(
    private sData: PRO003Service,
    private datePipe: DatePipe
  ) {
		this.subscriptionReadOnly = this.sData
			.getReadOnly()
			.subscribe((datprm) => {
				this.getReadOnly(datprm);
			}
		);
		this.onTipo = this.onTipo.bind(this);
		this.onCodigo = this.onCodigo.bind(this);
		this.setCellvalor = this.setCellvalor.bind(this);
	}

	ngOnInit(): void {
    this.esEdicion = this.sData.PRO006_enEdicion;
    if ( this.dataMO !== '' && this.dataMO !== null ) {
      this.GDManoObraDetalle = JSON.parse(JSON.stringify(this.dataMO.ITEMS));
    } else {
      this.GDManoObraDetalle = [];
    };
    if (this.esEdicion) {
			this.esVisibleSelecc = 'onClick';
			this.GDManoObraDetalle_prev = JSON.parse(JSON.stringify(this.GDManoObraDetalle));
    };
    if (!this.esEdicion) {
			this.esVisibleSelecc = 'none';
    };
	}

	ngOnDestroy() {
    this.subscriptionReadOnly.unsubscribe();
  }

	getReadOnly(datprm:any) {
    if (datprm.readOnly) {
    	this.esEdicion = datprm.readOnly;
		this.esVisibleSelecc = 'onClick';
		this.sData.PRO006_enEdicion = this.esEdicion;
		this.GDManoObraDetalle_prev = JSON.parse(JSON.stringify(this.GDManoObraDetalle));
    };
    if (!datprm.readOnly) {
		this.esEdicion = datprm.readOnly;
		this.esVisibleSelecc = 'none';
		this.sData.PRO006_enEdicion = this.esEdicion;
    }
		if(datprm.data !== '') {
			const data:any = JSON.parse(JSON.stringify(datprm.data)).filter((d:any) => d.TIPO === this.dataFila.DESC);
			this.GDManoObraDetalle = JSON.parse(JSON.stringify(data));
			this.GDManoObraDetalle_prev = JSON.parse(JSON.stringify(this.GDManoObraDetalle));
			this.gridManoObraDetalle.instance.refresh();
		}

  }

  onContentReady(e:any) {  
		e.component.columnOption("command:edit", "visible", false);  
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
	onInitNewRowPro(e:any) {
		e.data.DESCRIPCION = '';
		e.data.FECHA_DESDE = '';
		e.data.FECHA_HASTA = '';
		e.data.VALOR = 0;
		e.data.UNIDAD_MEDIDA = 'COP';
		e.data.ESTADO = 'ACTIVO';
		e.data.HORAS_TURNO = 0;
		e.data.TIPO = this.dataFila.DESC;
		this.fechaDesde = '';
		this.fechaHasta = '';
		if (this.GDManoObraDetalle.length > 0) {
			const item = this.GDManoObraDetalle.reduce((ant:any, act:any)=>{return (ant.ITEM > act.ITEM) ? ant : act});
			e.data.ITEM = item.ITEM + 1;
		} else {
			e.data.ITEM = 1;
		}
		if(e.data.TIPO === 'DINERO') {
			this.minValor = 0;
			this.maxValor = 1e10;
		}
		if(e.data.TIPO === 'TIEMPO') {
			this.minValor = 0;
			this.maxValor = 100;
		}
		e.data.readOnly_UNIDAD_MEDIDA = false;
		this.numFila = e.data.ITEM;
		this.filaData = e.data;
	}

  onRowInserting(e:any) {
		this.sData.conCambiosPro006 = this.sData.conCambiosPro006 + 1;
		e.data.isEdit = true;
		if (e.data !== undefined)
			this.rowApplyChanges = false;
	}

	updatingRow(e:any) {
		this.sData.conCambiosPro006 = this.sData.conCambiosPro006 + 1;
		if (e.oldData === undefined)
			return;
		e.oldData.isEdit = true;
	}

	onRowInserted(e:any) {
		this.sData.conCambiosPro006 = this.sData.conCambiosPro006 + 1;
		this.send_MO.emit({ 
			conCambios: this.sData.conCambiosPro006,
			TIPO: this.dataFila.DESC,
			DATA_UPDATE: this.GDManoObraDetalle
		});
		// this.esVisibleSelecc = 'onClick';
	}

	onRowUpdated(e:any) {
		this.sData.conCambiosPro006 = this.sData.conCambiosPro006 + 1;
		this.send_MO.emit({ 
			conCambios: this.sData.conCambiosPro006,
			TIPO: this.dataFila.DESC,
			DATA_UPDATE: this.GDManoObraDetalle
		});
		// this.esVisibleSelecc = 'onClick';
	}

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    this.numFila = this.GDManoObraDetalle.findIndex( (d:any) => d.ITEM === e.selectedRowKeys[0]);
    if (this.filasSelecc.length !== 0) {
      this.rowDelete = true;
		} else {
			this.rowDelete = false;
		}
  }

  onEditingStart(e:any) {
		e.data.readOnly_UNIDAD_MEDIDA = false;
		this.numFila = e.data.ITEM;
		this.filaData = e.data;
		this.accion = 'update';
		this.rowNew = false;
		this.rowApplyChanges = true;
		this.rowDelete = false;
		// this.esVisibleSelecc = 'none';
  }

  onCodigo(rowData:any, value:any, currentData:any) {
		if( this.GDManoObraDetalle_prev.findIndex((m:any) => (m.CODIGO === value) && (m.ITEM != this.numFila) ) != -1) {
			showToast('El Codigo de Mano de Obra ya existe!', 'error');
			rowData.CODIGO = this.filaData.CODIGO;
			return false;
		} else {
			rowData.CODIGO = value;
			return true;
		}
	}

  onFechaDesde(e:any, cellInfo:any) {
		if((e.value === null) || (e.value === '')){
			cellInfo.setValue('');
			return;
		}
		this.gridManoObraDetalle.instance.cellValue(cellInfo.rowIndex, "FECHA_DESDE", e.value);
		this.fechaDesde = this.datePipe.transform(e.value, 'MM/dd/yyyy');
		if ( (cellInfo.data.FECHA_HASTA != null) && (cellInfo.data.FECHA_HASTA != '') && (cellInfo.data.FECHA_HASTA != undefined) ) {
			this.fechaHasta = this.datePipe.transform(cellInfo.data.FECHA_HASTA, 'MM/dd/yyyy');
			this.validarFechas( this.fechaDesde, this.fechaHasta );
		}
	}

	onFechaHasta(e:any, cellInfo:any) {
		if((e.value === null) || (e.value === '')){
			cellInfo.setValue('');
			return;
		}
		this.gridManoObraDetalle.instance.cellValue(cellInfo.rowIndex, "FECHA_HASTA", e.value);
		this.fechaHasta = this.datePipe.transform(e.value, 'MM/dd/yyyy');
		if ( (cellInfo.data.FECHA_DESDE != null) && (cellInfo.data.FECHA_DESDE != '') && (cellInfo.data.FECHA_DESDE != undefined) ) {
			this.fechaDesde = this.datePipe.transform(cellInfo.data.FECHA_DESDE, 'MM/dd/yyyy');
		}
		this.validarFechas( this.fechaDesde, this.fechaHasta );
	}

	validarFechas(a:any, b:any) {
		if((a === null) || (a === '') || (a === undefined)){
			showToast('Seleccione fecha inicial', 'error');
		} else {
			if((b === null) || (b === '') || (b === undefined)){
				showToast('Seleccione fecha final', 'error');
			} else {
				var f1 = new Date(a);
				var f2 = new Date(b); 
				if (f1 > f2){
					showToast('Fecha inicial no puede ser mayor a la Fecha final, modifique la fecha final', 'error');
				}
			}
		}
	}

	validarCamposFechas(a:any, b:any, c:any) {
		var f1 = new Date(a);
		var f2 = new Date(b);
		if (f1 > f2){
			if ( c !== '' ){
				showToast('Fecha inical no puede ser mayor a la Fecha final, modifique la fecha final! del Código: '+c, 'error');
				return false;
			} else {
				showToast('Fecha inicial no puede ser mayor a la Fecha final, modifique la fecha final', 'error');
				return false;
			}
		}
		return true;
	}

  setCellvalor(rowData:any, value:any, currentRowData:any){
		rowData.VALOR = value;
		this.sData.conCambiosPro006 = this.sData.conCambiosPro006 + 1;
	}

	onValueChangedUnidadMedida(e:any, cellInfo:any) {
		cellInfo.data.UNIDAD_MEDIDA = e.value;
		this.gridManoObraDetalle.instance.cellValue(cellInfo.rowIndex, 'UNIDAD_MEDIDA', e.value);
		this.sData.conCambiosPro006 = this.sData.conCambiosPro006 + 1;
	}

	onTipo(rowData:any, value:any, currentData:any) {
		rowData.TIPO = value;
		if(value === 'Dinero') {
			this.minValor = 0;
			this.maxValor = 1e10;
		}
		if(value === 'Tiempo') {
			this.minValor = 0;
			this.maxValor = 100;
		}
		this.sData.conCambiosPro006 = this.sData.conCambiosPro006 + 1;
	}

	onKeyDownFechaDesde(event:any) {
    if (event.event.key === 'Enter') {
      this.dFechaDesde.instance.open();
    }
  }

	onKeyDownFechaHasta(event:any) {
    if (event.event.key === 'Enter') {
      this.dFechaHasta.instance.open();
    }
  }

	startEdit(e:any) {
		if (this.accion !== 'new') {
			this.gridManoObraDetalle.instance.clearSelection();
			if(e.data !== undefined && e.data !== null) {
			if (this.esEdicion) {
			this.GDManoObraDetalle.forEach((ele:any) => {
			  ele.readOnly_UNIDAD_MEDIDA = true;
			});
			const isEditing = this.gridManoObraDetalle.instance.hasEditData();
			if (isEditing)
			  e.component.cancelEditData(this.numFila);
			// e.component.editRow(e.key);
			this.accion = 'update';
			e.isEditing = true;
			e.data.readOnly_UNIDAD_MEDIDA = false;
			if(e.data.TIPO === 'Dinero') {
			  this.minValor = 0;
			  this.maxValor = 1e10;
			}
			if(e.data.TIPO === 'Tiempo') {
			  this.minValor = 0;
			  this.maxValor = 100;
			}
			this.numFila = e.key;
			this.filaData = e.data;
			this.rowNew = false;
			this.rowApplyChanges = true;
			this.rowDelete = false;
			this.sData.readonly = true;
		  };
		}
    };
  }

  // Operaciones de grid
  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'new':
		    this.gridManoObraDetalle.instance.clearSelection();
        this.gridManoObraDetalle.instance.addRow();
		    this.accion = 'new';
        this.rowApplyChanges = true;
        this.rowNew = false;
        this.rowDelete = false;
        this.sData.readonly = true;
        // this.esVisibleSelecc = 'none';
        break;
      case 'edit':
		    this.gridManoObraDetalle.instance.clearSelection();
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowNew = false;
        this.rowDelete = false;
        this.sData.readonly = true;
        this.gridManoObraDetalle.instance.editRow(this.numFila);
        this.accion = 'update';
        // this.esVisibleSelecc = 'none';
        break;
      case 'save':
        this.gridManoObraDetalle.instance.saveEditData();
        break;
      case 'cancel':
        this.gridManoObraDetalle.instance.cancelEditData();
		    this.accion = '';
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.sData.readonly = false;
        if(this.filasSelecc.length > 0) {
          this.rowDelete = true;
        } else {
          this.rowDelete = false;
        }
        this.GDManoObraDetalle.forEach((ele:any) => {
          ele.readOnly_UNIDAD_MEDIDA = true;
        });
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
              const index = this.GDManoObraDetalle.findIndex((a:any) => a.ITEM === key);
              this.GDManoObraDetalle.splice(index, 1);
            });
            this.gridManoObraDetalle.instance.refresh();
						this.sData.conCambiosPro006 = this.sData.conCambiosPro006 + 1;
						this.accion = '';
						this.rowApplyChanges = false;
						this.rowNew = true;
						if(this.filasSelecc.length > 0) {
							this.rowDelete = true;
						} else {
							this.rowDelete = false;
						}
						this.sData.readonly = false;
						this.send_MO.emit({ 
							conCambios: this.sData.conCambiosPro006,
							TIPO: this.dataFila.DESC,
							DATA_UPDATE: this.GDManoObraDetalle
						});
          }
        });
        break;

      default:
        break;
    }
  }

  onRowValidating(e: any) {
		let mensaje:any='';
		let propiedadesVacias:any = [];
		const propiedadesVerificar = ["CODIGO", "DESCRIPCION", "FECHA_DESDE", "FECHA_HASTA", "TIPO", "VALOR", "UNIDAD_MEDIDA", "ESTADO"];
		
		if ( this.accion === 'new' ) {
			if( (e.newData.FECHA_DESDE !== '') && (e.newData.FECHA_DESDE !== null) && (e.newData.FECHA_DESDE !== undefined)) {
				const f1 = e.newData.FECHA_DESDE;
				const f2 = e.newData.FECHA_HASTA;
				const codigo = e.newData.CODIGO;
				if ( this.validarCamposFechas(f1, f2, codigo) ) {
					if( ((e.newData.CODIGO === '') || (e.newData.CODIGO === null)) ||
							((e.newData.DESCRIPCION === '') || (e.newData.DESCRIPCION === null)) || 
							((e.newData.FECHA_DESDE === '') || (e.newData.FECHA_DESDE === null)) ||
							((e.newData.FECHA_HASTA === '') || (e.newData.FECHA_HASTA === null)) ||
							((e.newData.TIPO === '') || (e.newData.TIPO === null)) ||
							((e.newData.VALOR === '') || (e.newData.VALOR <= 0)) ||
							((e.newData.UNIDAD_MEDIDA === '') || (e.newData.UNIDAD_MEDIDA === null)) ||
							((e.newData.ESTADO === '') || (e.newData.ESTADO === null)) 
						) {
							for (let key in e.newData) {
								if (propiedadesVerificar.includes(key) && !e.newData[key]) {
									propiedadesVacias.push(key);
								}
							}
							if (propiedadesVacias.length > 0)
								mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;
	
							e.isValid = false;
							showToast(mensaje, 'error');
					} else {
						e.isValid = true;
            e.newData.readOnly_UNIDAD_MEDIDA = true;
						this.rowApplyChanges = false;
						this.rowNew = true;
						this.rowDelete = false;
						this.sData.readonly = false;
						this.accion = '';
						// this.esVisibleSelecc = 'onClick';
					};
				} else {
					e.isValid = false;
				}
			} else {
				e.isValid = false;
				showToast('Hay datos nulos, seleccione un rango de fechas. ', 'error');
			}
			return e.isValid;
		};
		if ( this.accion === 'update' ) {
			const f1 = e.newData.FECHA_DESDE !== undefined ? e.newData.FECHA_DESDE : e.oldData.FECHA_DESDE;
			const f2 = e.newData.FECHA_HASTA !== undefined ? e.newData.FECHA_HASTA : e.oldData.FECHA_HASTA;
			const codigo = e.newData.CODIGO !== undefined ? e.newData.CODIGO : e.oldData.CODIGO;

			if (this.validarCamposFechas(f1, f2, codigo)) {
				for (let prop in e.newData) {
					if (e.newData.hasOwnProperty(prop) && e.oldData.hasOwnProperty(prop)) {
						e.oldData[prop] = e.newData[prop];
					}
				}
				if( ((e.oldData.CODIGO === '') || (e.oldData.CODIGO === null)) ||
						((e.oldData.DESCRIPCION === '') || (e.oldData.DESCRIPCION === null)) || 
						((e.oldData.FECHA_DESDE === '') || (e.oldData.FECHA_DESDE === null)) ||
						((e.oldData.FECHA_HASTA === '') || (e.oldData.FECHA_HASTA === null)) ||
						((e.oldData.TIPO === '') || (e.oldData.TIPO === null)) ||
						((e.oldData.VALOR === '') || (e.oldData.VALOR <= 0)) ||
						((e.oldData.UNIDAD_MEDIDA === '') || (e.oldData.UNIDAD_MEDIDA === null)) ||
						((e.oldData.ESTADO === '') || (e.oldData.ESTADO === null)) 
					) {
						for (let key in e.newData) {
							if (propiedadesVerificar.includes(key) && !e.newData[key]) {
								propiedadesVacias.push(key);
							}
						}
						if (propiedadesVacias.length > 0)
							mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;
	
						e.isValid = false;
						showToast(mensaje, 'error');
				} else {
					e.isValid = true;
          e.oldData.readOnly_UNIDAD_MEDIDA = true;
					this.rowApplyChanges = false;
					this.rowNew = true;
					this.rowDelete = false;
					this.sData.readonly = false;
					this.accion = '';
					// this.esVisibleSelecc = 'onClick';
				};
			} else {
				e.isValid = false;
			}
			return e.isValid;
		}
	
	}



}
