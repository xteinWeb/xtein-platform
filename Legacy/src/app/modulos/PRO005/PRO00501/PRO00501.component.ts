import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxComponent, DxDateBoxModule, DxLoadPanelModule, DxNumberBoxModule, DxSelectBoxModule, DxSwitchModule } from 'devextreme-angular';
import { PRO003Service } from 'src/app/services/PRO003/s_PRO003.service';
import { showToast } from '../../../shared/toast/toastComponent.js'
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import dxCheckBox from "devextreme/ui/check_box";

@Component({
  selector: 'app-PRO00501',
  templateUrl: './PRO00501.component.html',
  styleUrls: ['./PRO00501.component.css'],
	standalone: true,
	imports: [CommonModule, DxDataGridModule, DxDateBoxModule, DxSwitchModule, DxButtonModule, DxLoadPanelModule, DxNumberBoxModule, DxSelectBoxModule]
})
export class PRO00501Component {
  @ViewChild ('fechaDesde', { static: false }) dFechaDesde : DxDateBoxComponent;
	@ViewChild ('fechaHasta', { static: false }) dFechaHasta : DxDateBoxComponent;
	@ViewChild ("gridCifDetalle", { static: false }) gridCifDetalle: DxDataGridComponent;

  @Input() dataCif:any = [];
  @Input() dataFila:any;
  @Output() send_MO: EventEmitter<any> = new EventEmitter();

	subscriptionReadOnly: Subscription;

  esEdicion: boolean;
	esVisibleSelecc: string = 'none';

	GDCifDetalle: any = [];
	DLMedidasArray: any = [];
	GDCif_prev: any = [];
	newArray: any = [];
	DBaseCif: any = [];
	filaData: any = [];
	allMode: string;
	checkBoxesMode: string;
	BaseCIFValue: any = [];

	fechaDesde: any;
	fechaHasta: any;
	codigo = '';
	accion: string = '';

	formatValor: string = '';
  focusedData: number = 0;
	maxValor: number = 0.0;
	minValor: number = 0.0;
	temp: number = 0;
	numFila: number = 0;

	toaVisible: boolean = false;
	isChecked = true;
	toaTipo = 'info'
	toaMessage = 'Registro actualizado!';
	loadingVisible: boolean = false;

	// Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any [] = [];

  constructor(
		private sData: PRO003Service,
		private datePipe: DatePipe
	) {
		this.subscriptionReadOnly = this.sData
      .getEsEdicion()
      .subscribe((datprm) => {
        this.getReadOnly(datprm);
      }
    );

		this.onCodigo = this.onCodigo.bind(this);
	}

  ngOnInit(): void {
    this.esEdicion = this.sData.PRO005_enEdicion;
    if (this.dataCif !== '' && this.dataCif !== null) {
      this.GDCifDetalle = JSON.parse(JSON.stringify(this.dataCif.ITEMS));
			this.GDCifDetalle.forEach((ele:any) => {
				ele.readOnlyValor = true;
				ele.readOnlyDefecto = true;
				ele.readOnlyBaseCif = true;
			});
    } else {
      this.GDCifDetalle = [];
    };
    if (this.esEdicion) {
			this.esVisibleSelecc = 'onClick';
			this.GDCif_prev = JSON.parse(JSON.stringify(this.GDCifDetalle));
    };
    if (!this.esEdicion) {
			this.esVisibleSelecc = 'none';
    };
		this.valoresObjetos('bases cif');
  }

	ngOnDestroy() {
    this.subscriptionReadOnly.unsubscribe();
  }

	getReadOnly(datprm:any) {
    if (datprm.readOnly) {
      this.esEdicion = datprm.readOnly;
			this.sData.PRO005_enEdicion = this.esEdicion;
			this.esVisibleSelecc = 'onClick';
			this.GDCif_prev = JSON.parse(JSON.stringify(this.GDCifDetalle));
    };
    if (!datprm.readOnly) {
			this.esEdicion = datprm.readOnly;
			this.esVisibleSelecc = 'none';
			this.sData.PRO005_enEdicion = this.esEdicion;
    }
		if(datprm.data !== '') {
			const data:any = JSON.parse(JSON.stringify(datprm.data)).filter((d:any) => d.TIPO === this.dataFila.DESC);
			this.GDCifDetalle = JSON.parse(JSON.stringify(data));
			this.GDCif_prev = JSON.parse(JSON.stringify(this.GDCifDetalle));
			this.gridCifDetalle.instance.refresh();
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

  onRowInserting(e:any) {
		this.sData.conCambiosPro005++;
		e.data.isEdit = true;
		if (e.data !== undefined) {
			this.rowApplyChanges = false;
		}
	}

  onRowUpdating(e:any) {
		this.sData.conCambiosPro005++;
		if (e.oldData === undefined)
			return;
		e.oldData.isEdit = true;
	}

  onInitNewRowPro(e:any) {
    e.data.DEFECTO = true;
		e.data.CODIGO = '';
		e.data.DESCRIPCION = '';
		e.data.FECHA_DESDE = '';
		e.data.FECHA_HASTA = '';
		e.data.TIPO = this.dataFila.DESC;
		e.data.VALOR = 0;
		e.data.UNIDAD_MEDIDA = '';
		e.data.ESTADO = 'ACTIVO';
		e.data.BASE = '';
		e.data.readOnlyDefecto = false;
		e.data.readOnlyBaseCif = false;
		e.data.readOnlyValor = false;
		this.fechaDesde = null;
		this.fechaHasta = null;
		if (this.GDCifDetalle.length > 0) {
			const item = this.GDCifDetalle.reduce((ant:any, act:any)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
			e.data.ITEM = item.ITEM + 1;
		} else {
			e.data.ITEM = 1;
		}
		if(e.data.TIPO === 'Variable') {
			e.data.formatValor = '#,##0,00%';
			e.data.minValor = 0;
			e.data.maxValor = 100.00;
		}
		if(e.data === 'Fijo') {
			e.data.formatValor = '#,##0.00';
			e.data.minValor = 0;
			e.data.maxValor = 1e10;
		}
		this.numFila = e.data.ITEM;
		this.filaData = e.data;

	}

  selectionGrid(e:any) {
		this.filasSelecc = e.selectedRowKeys;
		this.numFila = this.GDCifDetalle.findIndex( (d:any) => d.ITEM === e.selectedRowKeys[0]);
		if (this.filasSelecc.length > 0) {
			if (this.gridCifDetalle.instance.hasEditData()) {
				this.rowDelete = false;
			} else {
				this.rowDelete = true;
			}
		} else {
			this.rowDelete = false;
		}
	}

	onRowInserted(e:any) {
		this.sData.conCambiosPro005++;
		this.send_MO.emit({
			conCambios: this.sData.conCambiosPro005,
			TIPO: this.dataFila.DESC,
			DATA_UPDATE: this.GDCifDetalle
		});
	}

	onRowUpdated(e:any) {
		this.sData.conCambiosPro005++;
		this.send_MO.emit({
			conCambios: this.sData.conCambiosPro005,
			TIPO: this.dataFila.DESC,
			DATA_UPDATE: this.GDCifDetalle
		});
	}

  onEditingStart(e:any) {
		this.numFila = e.data.ITEM;
		this.filaData = e.data;
		if(e.data.TIPO === 'Fijo') {
			e.data.minValor = 0;
			e.data.maxValor = 1e10;
			e.data.readOnlyBaseCif = true;
			e.data.readOnlyValor = false;
		}
		if(e.data.TIPO === 'Variable') {
			e.data.minValor = 0;
			e.data.maxValor = 100;
			e.data.readOnlyBaseCif = false;
			e.data.readOnlyValor = false;
		}
		e.data.readOnlyDefecto = false;
		this.accion = 'update';
		this.rowNew = false;
		this.rowApplyChanges = true;
		this.rowDelete = false;
		// this.esVisibleSelecc = 'none';
	}

  onTipo(rowData:any, value:any, currentData:any) {
		rowData.TIPO = value;
		if(value === 'Fijo') {
			rowData.formatValor = '#,##0.00';
			rowData.minValor = 0;
			rowData.maxValor = 1e10;
			rowData.readOnlyBaseCif = true;
			rowData.BASE = '';
		}
		if(value === 'Variable') {
			rowData.formatValor = '#,##0,00%';
			rowData.minValor = 0;
			rowData.maxValor = 100.00;
			rowData.readOnlyBaseCif = false;
		}
		this.sData.conCambiosPro005++;
	}

  onCodigo(rowData:any, value:any, currentData:any) {
		if( this.GDCifDetalle.findIndex((m:any) => (m.CODIGO === value) && (m.ITEM != this.numFila) ) != -1) {
			rowData.CODIGO = this.filaData.CODIGO;
			showToast('El Código CIF ya existe', 'error');
			return false;
		} else {
			rowData.CODIGO = value;
			this.sData.conCambiosPro005++;
			return true;
		}
	}

  onFechaDesde(e:any, cellInfo:any) {
		if((e.value === null) || (e.value === '')){
			cellInfo.setValue('');
			return;
		}
		this.gridCifDetalle.instance.cellValue(cellInfo.rowIndex, "FECHA_DESDE", e.value);
		this.fechaDesde = this.datePipe.transform(e.value, 'MM/dd/yyyy');
		if ( (cellInfo.data.FECHA_HASTA !== null) && (cellInfo.data.FECHA_HASTA !== '') && (cellInfo.data.FECHA_HASTA !== undefined) ) {
			this.fechaHasta = this.datePipe.transform(cellInfo.data.FECHA_HASTA, 'MM/dd/yyyy');
			this.validarFechas( this.fechaDesde, this.fechaHasta );
		}
	}

	onFechaHasta(e:any, cellInfo:any) {
		if((e.value === null) || (e.value === '')){
			cellInfo.setValue('');
			return;
		}
		this.gridCifDetalle.instance.cellValue(cellInfo.rowIndex, "FECHA_HASTA", e.value);
		this.fechaHasta = this.datePipe.transform(e.value, 'MM/dd/yyyy');
		if ( (cellInfo.data.FECHA_DESDE !== null) && (cellInfo.data.FECHA_DESDE !== '') && (cellInfo.data.FECHA_DESDE !== undefined) ) {
			this.fechaDesde = this.datePipe.transform(cellInfo.data.FECHA_DESDE, 'MM/dd/yyyy');
		}
		this.validarFechas( this.fechaDesde, this.fechaHasta );
	}

	validarFechas(a: any, b: any) {
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
			};
		};
	}

	validarCamposFechas(a: any, b: any, c: any) {
		var f1 = new Date(a);
		var f2 = new Date(b);
		let res: boolean = true;
		if (f1 > f2){
			if ( c !== '' ){
				showToast('Fecha inicial no puede ser mayor a la Fecha final, modifique la fecha final del Código: '+c, 'error');
				res = false;
			} else {
				showToast('Fecha inicial no puede ser mayor a la Fecha final, modifique la fecha final', 'error');
				res = false;
			}
		}
		// this.sData.conCambiosPro005++;
		return res;
	}

  setCellvalor(e:any, cellInfo:any) {
		if (e.value !== null) {
			cellInfo.data.VALOR = e.value;
			this.gridCifDetalle.instance.cellValue(cellInfo.rowIndex, "VALOR", e.value);
			this.sData.conCambiosPro005++;
		}
	}

	onValueChangedDefecto(e:any, cellInfo:any) {
		if (e.value !== null){
			cellInfo.data.DEFECTO = e.value;
			this.gridCifDetalle.instance.cellValue(cellInfo.rowIndex, "DEFECTO", cellInfo.data.DEFECTO);
			this.sData.conCambiosPro005++;
		}
	}

	onValueChangedBaseCif(e:any, cellInfo:any) {
		if (e.value !== null){
			cellInfo.data.BASE = e.value;
			this.gridCifDetalle.instance.cellValue(cellInfo.rowIndex, "BASE", cellInfo.data.BASE);
			this.sData.conCambiosPro005++;
		}
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
      this.gridCifDetalle.instance.clearSelection();
      if(e.data !== undefined && e.data !== null) {
        if (this.esEdicion) {
          this.GDCifDetalle.forEach((ele:any) => {
            ele.readOnlyDefecto = true;
            ele.readOnlyBaseCif = true;
            ele.readOnlyValor = true;	
          });
          e.component.cancelEditData(this.numFila);
          e.component.editRow(e.rowIndex);
          this.accion = 'update';
          e.isEditing = true;
          if(e.data.TIPO === 'Fijo') {
            e.data.maxValor = 1e10;
            e.data.readOnlyBaseCif = true;
          }
          if(e.data.TIPO === 'Variable') {
            e.data.maxValor = 100;
            e.data.readOnlyBaseCif = false;
          }
          e.data.minValor = 0;
          e.data.readOnlyDefecto = false;
          e.data.readOnlyValor = false;
          this.numFila = e.rowIndex;
          this.filaData = e.data;
          this.rowNew = false;
          this.rowApplyChanges = true;
          this.rowDelete = false;
          this.sData.esEdicion = true;
        };
      };
    }
  }

  onRowValidating(e: any) {
		let mensaje:any='';
		let propiedadesVacias:any = [];
		const propiedadesVerificar = ["CODIGO", "DESCRIPCION", "FECHA_DESDE", "FECHA_HASTA", "TIPO", "BASE", "ESTADO"];

		if ( this.accion === 'new' ) {
			if( (e.newData.FECHA_DESDE !== '') && (e.newData.FECHA_DESDE !== null) && (e.newData.FECHA_DESDE !== undefined)) {
				const f1 = e.newData.FECHA_DESDE;
				const f2 = e.newData.FECHA_HASTA;
				const codigo = e.newData.CODIGO;
				if ( this.validarCamposFechas(f1, f2, codigo) ) {
					if( e.newData.TIPO === 'Variable' ) {
						if( ((e.newData.CODIGO === '') || (e.newData.CODIGO === null)) ||
								((e.newData.DESCRIPCION === '') || (e.newData.DESCRIPCION === null)) || 
								((e.newData.FECHA_DESDE === '') || (e.newData.FECHA_DESDE === null)) ||
								((e.newData.FECHA_HASTA === '') || (e.newData.FECHA_HASTA === null)) ||
								((e.newData.TIPO === '') || (e.newData.TIPO === null)) ||
								((e.newData.VALOR === '') || (e.newData.VALOR <= 0)) ||
								((e.newData.BASE === '') || (e.newData.BASE === null)) ||
								((e.newData.ESTADO === '') || (e.newData.ESTADO === null)) 
							) {
							for (let key in e.newData) {
								if (propiedadesVerificar.includes(key) && !e.newData[key]) {
									propiedadesVacias.push(key);
								}
							}
							if (propiedadesVacias.length > 0)
								mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;
							else if (e.newData.VALOR <= 0)
								mensaje = 'El valor debe ser mayor a cero(0).';
	
							e.isValid = false;
							showToast(mensaje, 'error');
						} else {
              e.newData.readOnlyValor = true;
							e.isValid = true;
							this.rowApplyChanges = false;
							this.rowNew = true;
							this.rowDelete = false;
							this.sData.esEdicion = false;
							this.accion = '';
							// this.esVisibleSelecc = 'onClick';
						};
					} else if( e.newData.TIPO === 'Fijo' ) {
						if( ((e.newData.CODIGO === '') || (e.newData.CODIGO === null)) ||
								((e.newData.DESCRIPCION === '') || (e.newData.DESCRIPCION === null)) || 
								((e.newData.FECHA_DESDE === '') || (e.newData.FECHA_DESDE === null)) ||
								((e.newData.FECHA_HASTA === '') || (e.newData.FECHA_HASTA === null)) ||
								((e.newData.TIPO === '') || (e.newData.TIPO === null)) ||
								((e.newData.VALOR === '') || (e.newData.VALOR <= 0)) ||
								((e.newData.ESTADO === '') || (e.newData.ESTADO === null)) 
							) {
		
								for (let key in e.newData) {
									if (propiedadesVerificar.includes(key) && !e.newData[key]) {
										propiedadesVacias.push(key);
									}
								}
								if (propiedadesVacias.length > 0)
									mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;
								else if (e.newData.VALOR <= 0)
									mensaje = 'El valor debe ser mayor a cero(0).';
		
								e.isValid = false;
								showToast(mensaje, 'error');
						} else {
              e.newData.readOnlyValor = true;
							e.isValid = true;
							this.rowApplyChanges = false;
							this.rowNew = true;
							this.rowDelete = false;
							this.sData.esEdicion = false;
							this.accion = '';
							// this.esVisibleSelecc = 'onClick';
						};
					};
				} else {
					e.isValid = false;	
				}
			} else {
				e.isValid = false;
				showToast('Hay datos nulos, seleccione un rango de fechas. ', 'error');
			}
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
	
				if( e.oldData.TIPO === 'Variable' ) {
					if( ((e.oldData.CODIGO === '') || (e.oldData.CODIGO === null)) ||
							((e.oldData.DESCRIPCION === '') || (e.oldData.DESCRIPCION === null)) || 
							((e.oldData.FECHA_DESDE === '') || (e.oldData.FECHA_DESDE === null)) ||
							((e.oldData.FECHA_HASTA === '') || (e.oldData.FECHA_HASTA === null)) ||
							((e.oldData.TIPO === '') || (e.oldData.TIPO === null)) ||
							((e.oldData.VALOR === '') || (e.oldData.VALOR <= 0)) ||
							((e.oldData.BASE === '') || (e.oldData.BASE === null)) ||
							((e.oldData.ESTADO === '') || (e.oldData.ESTADO === null)) 
						) {
	
							for (let key in e.oldData) {
								if (propiedadesVerificar.includes(key) && !e.oldData[key]) {
									propiedadesVacias.push(key);
								}
							}
							if (propiedadesVacias.length > 0)
								mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;
	
							e.isValid = false;
							showToast(mensaje, 'error');
					} else {
            e.oldData.readOnlyValor = true;
						e.isValid = true;
						this.rowApplyChanges = false;
						this.rowNew = true;
						this.rowDelete = false;
						this.sData.esEdicion = false;
						this.accion = '';
						// this.esVisibleSelecc = 'onClick';
					};
				};
				if( e.oldData.TIPO === 'Fijo' ) {
					if( ((e.oldData.CODIGO === '') || (e.oldData.CODIGO === null)) ||
							((e.oldData.DESCRIPCION === '') || (e.oldData.DESCRIPCION === null)) || 
							((e.oldData.FECHA_DESDE === '') || (e.oldData.FECHA_DESDE === null)) ||
							((e.oldData.FECHA_HASTA === '') || (e.oldData.FECHA_HASTA === null)) ||
							((e.oldData.TIPO === '') || (e.oldData.TIPO === null)) ||
							((e.oldData.VALOR === '') || (e.oldData.VALOR <= 0)) ||
							((e.oldData.ESTADO === '') || (e.oldData.ESTADO === null)) 
						) {
	
							for (let key in e.oldData) {
								if (propiedadesVerificar.includes(key) && !e.oldData[key]) {
									propiedadesVacias.push(key);
								}
							}
							if (propiedadesVacias.length > 0)
								mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;
	
							e.isValid = false;
							showToast(mensaje, 'error');
					} else {
            e.oldData.readOnlyValor = true;
						e.isValid = true;
						this.rowApplyChanges = false;
						this.rowNew = true;
						this.rowDelete = false;
						this.sData.esEdicion = false;
						this.accion = '';
						// this.esVisibleSelecc = 'onClick';
					};
				};
			} else {
				e.isValid = false;
			}
			
		}
		return e.isValid;
	
	}
  
  // Operaciones de grid
  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'new':
				this.gridCifDetalle.instance.clearSelection();
        this.gridCifDetalle.instance.addRow();
				this.accion = 'new';
        this.rowApplyChanges = true;
				this.rowNew = false;
				this.rowDelete = false;
				this.sData.esEdicion = true;
				// this.esVisibleSelecc = 'onClick';
				// this.SelectAllDG = false;
        break;
      case 'edit':
				this.gridCifDetalle.instance.clearSelection();
        this.esEdicion = true;
        this.rowApplyChanges = true;
				this.rowNew = false;
				this.rowDelete = false;
				this.sData.esEdicion = true;
        this.gridCifDetalle.instance.editRow(this.numFila);
				this.accion = 'update';
				// this.esVisibleSelecc = 'none';
        break;
      case 'save':
				this.gridCifDetalle.instance.saveEditData();
        break;
      case 'cancel':
        this.gridCifDetalle.instance.cancelEditData();
				this.accion = '';
        this.rowApplyChanges = false;
        this.rowNew = true;
				this.sData.esEdicion = false;
				if(this.filasSelecc.length > 0) {
					this.rowDelete = true;
				} else {
					this.rowDelete = false;
				}
				this.GDCifDetalle.forEach((ele:any) => {
					ele.readOnlyDefecto = true;
					ele.readOnlyBaseCif = true;
					ele.readOnlyValor = true;	
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
            this.filasSelecc.forEach((key:any) => {
              const index = this.GDCifDetalle.findIndex((a:any) => a.ITEM === key);
              this.GDCifDetalle.splice(index, 1);
            });
            this.gridCifDetalle.instance.refresh();
						this.sData.conCambiosPro005++;
						this.accion = '';
						this.rowApplyChanges = false;
						this.rowNew = true;
						if(this.filasSelecc.length > 0) {
							this.rowDelete = true;
						} else {
							this.rowDelete = false;
						}
						this.sData.esEdicion = false;
						this.send_MO.emit({
							conCambios: this.sData.conCambiosPro005,
							TIPO: this.dataFila.DESC,
							DATA_UPDATE: this.GDCifDetalle
						});
          }
        });
        break;

      default:
        break;
    }
  }

	// Cargue de datos de la aplicacion
  valoresObjetos(obj: string) {
		if (obj === 'bases cif' || obj === 'todos' || obj === 'ref'){
			const prm = { DATOS: '' };
			this.loadingVisible = true;
			this.sData.getBaseCif('BASES CIF', prm).subscribe((data: any) => {
	
				const res = JSON.parse(data.data);
				if ( (data.token != undefined) ){
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				const mensaje = res[0].ErrMensaje;
				if (mensaje != '') {
					this.showModal(mensaje);
				}
				else {
					for (let i = 0; i < res.length; i++) {
						this.DBaseCif[i] = res[i].BASE;					
					}
				};
			},
				(err => {
					this.showModal(err.message);
				})
			);
		};
	}

	showModal(mensaje:any) {
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
