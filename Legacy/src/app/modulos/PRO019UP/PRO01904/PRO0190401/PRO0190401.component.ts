import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxLoadPanelModule, DxNumberBoxModule, DxPopupModule, DxSelectBoxModule, DxTextBoxModule, DxToolbarModule } from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { PRO019Service } from 'src/app/services/PRO019/PRO019.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { showToast } from '../../../../shared/toast/toastComponent'
import { PRO019DataService } from '../../SERVICE/pro019.service';

@Component({
  selector: 'app-PRO0190401',
  templateUrl: './PRO0190401.component.html',
  styleUrls: ['./PRO0190401.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxDropDownBoxModule, DxTextBoxModule,
    DxButtonModule, DxNumberBoxModule, DxPopupModule, DxSelectBoxModule, DxToolbarModule,
    DxLoadPanelModule
  ]
})
export class PRO0190401Component {

  @ViewChild("gridCifDetalles", { static: false }) gridCifDetalles: DxDataGridComponent;
  @Input() getData: any;
  @Output() totalCIF: EventEmitter<any> = new EventEmitter();
  
  subscription: Subscription;
  subscriptionRefresh: Subscription;
  subscriptionRead: Subscription;
  subscriptionConCambios: Subscription;

  DGcif: any = [];
  DGcif_prev: any = [];
  DGDetalleCif: any = [];
  selectCIF: any = [];
  selectNewTipoCIF: any = [];

  modoGrid: string;
  readOnly: boolean;
  esVisibleSelecc: string = 'none';
  btnContraer: string = 'Expandir Todo';
  dropDownCif: any = {width:400, hideOnParentScroll: true, container:'#gridCifMatriz'};
  widthSerchCif: any = 250;
  tipoCIF: string = '';
  openCIF: boolean = false;
  expandGridCif: boolean = false;
  loadingVisible: boolean = false;
  // conCambios: number = 0;
  totalVariable: number = 0;
  totalFijo: number = 0;

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  maxValor: number = 0.0;
  VALOR_TCD: number;

  constructor(
		private sData: PRO019Service,
    private _sdatos: PRO019DataService
  ) {
    // Recibe de principal
    this.subscription = this._sdatos
      .getTotalTCDCIF()
      .subscribe((datprm) => {
        this.VALOR_TCD = datprm;
        this.checkup(this.DGDetalleCif);
    });    
    this.subscriptionRead = this._sdatos
      .getReadOnly()
      .subscribe((datprm) => {
        this.getReadOnly(datprm);
      }
    );
    // this.subscriptionConCambios = this._sdatos
    //   .getConCambios()
    //   .subscribe((datprm) => {
    //     this._sdatos.conCambios = this._sdatos.conCambios + datprm;
    //   }
    // );
    this.subscriptionRefresh = this._sdatos
      .getRefresh()
      .subscribe((datprm) => {
        if (datprm === true)
          this.refresComponent();
      }
    );
    this.onCalculateSubTotal = this.onCalculateSubTotal.bind(this);
    this.onCalculateTotalCIF = this.onCalculateTotalCIF.bind(this);
    this.refresComponent = this.refresComponent.bind(this);
  }

  ngOnInit(): void {
    if(!this._sdatos.readonly) {
      this.readOnly = this._sdatos.readonly;
      this.esVisibleSelecc = 'onClick';
    } else {
      this.readOnly = this._sdatos.readonly;
      this.esVisibleSelecc = 'none';
    };
    this.tipoCIF = this.getData.DESC;
    if ( this._sdatos.MATRIZ_DETALLE_CIF.length > 0 )
      this.activeModoGrid(this._sdatos.modoGrid);
    else
      this.valoresObjetos('cif');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subscriptionRead.unsubscribe();
    // this.subscriptionConCambios.unsubscribe();
    this.subscriptionRefresh.unsubscribe();
  }

  activeModoGrid(e: any) {
    this.modoGrid = e;

    if ( this._sdatos.D_MATRIZ.CLASE.match('Producto simple|Parte simple')) {
      const pos = this._sdatos.MATRIZ_DETALLE_CIF.findIndex((d:any) => d.ID_PARTE === this._sdatos.D_MATRIZ.PRODUCTO);
      if ( pos !== -1 ) {
        this.DGDetalleCif = JSON.parse(JSON.stringify(this._sdatos.MATRIZ_DETALLE_CIF[pos].DATA_SOURCE.filter((d:any) => d.TIPO === this.getData.DESC)));
        if( this.DGDetalleCif.length === 0)
          this.valoresObjetos('cif');
      } else {
        this.DGDetalleCif = [];
        this.valoresObjetos('cif');
      }
    }
    if ( this._sdatos.D_MATRIZ.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
      // if ( this.modoGrid === 'Por Partes' ) {
        if(this.getData.TIPO === 'CIF VARIABLE') {
          const id = this._sdatos.MATRIZ_DETALLE_CIF.findIndex((d:any) => d.ID_PARTE === this.getData.ID_PARTE );
          if ( id !== -1 ) {
            const dataCif:any = this._sdatos.MATRIZ_DETALLE_CIF[id].DATA_SOURCE.filter((d:any) => d.ID_PARTE === this.getData.ID_PARTE && d.TIPO === this.getData.DESC);
            this.DGDetalleCif = JSON.parse(JSON.stringify(dataCif));
            if( this.DGDetalleCif.length === 0)
              this.valoresObjetos('cif');
          } else {
            this.DGDetalleCif = [];
            this.valoresObjetos('cif');
          }
        };
        if(this.getData.TIPO === 'CIF FIJO') {
          const id = this._sdatos.MATRIZ_DETALLE_CIF.findIndex((d:any) => d.ID_SECCION === this.getData.ID_SECCION );
          if ( id !== -1 ) {
            const dataCif:any = this._sdatos.MATRIZ_DETALLE_CIF[id].DATA_SOURCE.filter((d:any) => d.ID_PARTE === this.getData.ID_PARTE && d.TIPO === this.getData.DESC);
            this.DGDetalleCif = JSON.parse(JSON.stringify(dataCif));
            if( this.DGDetalleCif.length === 0)
              this.valoresObjetos('cif');
          } else {
            this.DGDetalleCif = [];
            this.valoresObjetos('cif');
          }
        }
      // }
      // if ( this.modoGrid === 'Por Secciones' ) {
      //   const element = this._sdatos.MATRIZ_DETALLE_CIF.filter((d:any) => d.ID_SECCION === this.getData.ID_SECCION);
      //   this.DGDetalleCif = element[0].DATA_SOURCE;
      // }
    }
    this.DGDetalleCif.forEach((data:any) => {
      if(data.TIPO == 'Fijo') {
        data.formatValor = '#,##0.0';
        this.maxValor = 1e10;
      }
      if(data.TIPO == 'Variable') {
        data.formatValor = '#,##0,00%';
        this.maxValor = 100;
      }
    });
  }

  refresComponent() {
    this.gridCifDetalles.instance.refresh();
    this.valoresObjetos('cif');
  }

  getReadOnly(datprm:any) {
    if (datprm) {
      this.readOnly = datprm;
      this.esVisibleSelecc = 'none';
    };
    if (!datprm) {
      this.readOnly = datprm;
      this.esVisibleSelecc = 'onClick';
    }

  }

  checkup(data:any) {
    for (let i = 0; i < data.length; i++) {
      if (data[i].TIPO === 'Variable') {
        data[i].formatValor = '#,##0,00%';
        // data[i].CANTIDAD = '';
        if ( data[i].VALOR > 0 && data[i].BASE === 'PRECIO DE VENTA') {
          const tcd = this._sdatos.TOTAL_COSTO_DIRECTO;
          const cifVariables:any = data.filter((d:any) => d.TIPO === 'Variable');
          
          const totalCifVariables = cifVariables.reduce((acc:any, item:any) => {
            return acc += (item.VALOR)/100;
          }, 0);

          data[i].TOTAL = (data[i].VALOR/100) * (tcd / (1-(totalCifVariables + (this._sdatos.D_MATRIZ.MARGEN_RENTABILIDAD/100)) ));
        }
        
        if ( data[i].VALOR > 0 && data[i].BASE === 'COSTO DIRECTO') {
          const tcd = this._sdatos.TOTAL_COSTO_DIRECTO;
          const subTotal = (data[i].VALOR * tcd)/100;
          data[i].TOTAL = subTotal;
        };
      };
      if (data[i].TIPO === 'Fijo') {
        if (data[i].CANTIDAD === undefined || data[i].CANTIDAD === null)
          data[i].CANTIDAD = 0;
        data[i].formatValor = '#,##0.0';
        data[i].TOTAL = data[i].VALOR * data[i].CANTIDAD;
        data[i].BASE = '';
      }
      
      // if (accion !== 'new')
      //   this.DGDetalleCif = data;
    }
    this.DGDetalleCif = data;
    // this._sdatos.MATRIZ_DETALLE_CIF = data;
    this.onCalculateTotalCIF();
  }

  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  
  onOpenedCif(e:any) {
    const width:number = this.dropDownCif.width;
    this.widthSerchCif = width - 40;
    if (this.DGcif.length <= 0)
      this.valoresObjetos('cif');
  }

  onClosedCif(e:any) {
    this.loadingVisible = false;
  }

  onEditingStart(e:any) {
		if(e.data.TIPO == 'Fijo') {
			this.maxValor = 1e10;
		}
		if(e.data.TIPO == 'Variable') {
			this.maxValor = 100;
		}
    
    this.gridCifDetalles.instance.clearSelection();
    this.DGcif_prev = JSON.parse(JSON.stringify(this.DGDetalleCif));
  }

  onInitNewRowPro(e: any) {
    e.data.CODIGO = '';
		e.data.DESCRIPCION = '';
		e.data.CANTIDAD = 0;
		e.data.VALOR = 0;
		e.data.BASE = '';
		e.data.TOTAL = 0;
		e.data.ESTADO = 'ACTIVO';
    if(this.tipoCIF === 'Variable') {
		  e.data.TIPO = 'Variable';
    }
    if(this.tipoCIF === 'Fijo') {
      e.data.TIPO = 'Fijo';
    }
    if (this._sdatos.MATRIZ_DETALLE_CIF.length > 0) {
			const item = this._sdatos.MATRIZ_DETALLE_CIF.reduce((ant:any, act:any)=>{return (ant.ITEM > act.ITEM) ? ant : act});
			e.data.ITEM = item.ITEM + 1;
		} else {
			e.data.ITEM = 1;
		}
    this.selectCIF = [];
	}

  onCalculateSubTotal(rowData: any, value: any, currentRowData: any, pos: any) {
    if (currentRowData.TIPO === 'Fijo') {
      rowData.CANTIDAD = value;
      rowData.TOTAL = rowData.CANTIDAD * currentRowData.VALOR;
      rowData.BASE = '';
      rowData.formatValor = '#,##0.0';
    };
    this._sdatos.conCambios++;
    this._sdatos.setConCambios(this._sdatos.conCambios);
    this.onCalculateTotalCIF();
  }
  
  onCalculateTotalCIF() {
    var totalCIF = this.DGDetalleCif.reduce( (acc:any, item:any) => {
      return acc += item.TOTAL;
    }, 0);
    
    this.totalCIF.emit( {TOTAL_CIF:  totalCIF, TIPO: this.tipoCIF } );
    let npos:any;
    npos = this._sdatos.MATRIZ_DETALLE_CIF.findIndex((d:any) => d.ID_PARTE === this._sdatos.D_MATRIZ.PRODUCTO);

    if ( npos !== -1 ) {
      let dataTipo:any[] = JSON.parse(JSON.stringify(this._sdatos.MATRIZ_DETALLE_CIF[npos].DATA_SOURCE.filter((d:any) => d.TIPO !== this.getData.DESC)));
      this.DGDetalleCif.forEach((cif:any) => {
        cif.ID_PARTE = this.getData.ID_PARTE;
        dataTipo.push(cif);
      });
      this._sdatos.MATRIZ_DETALLE_CIF[npos] = { ID_PARTE: this._sdatos.D_MATRIZ.PRODUCTO, DATA_SOURCE: dataTipo };

    } else {
      this._sdatos.MATRIZ_DETALLE_CIF.push({ ID_PARTE: this._sdatos.D_MATRIZ.PRODUCTO, DATA_SOURCE: this.DGDetalleCif });
    }

    this.DGcif_prev = JSON.parse(JSON.stringify(this.DGDetalleCif));
  }

  onSelectionCIF(e: any, cellInfo: any) {
    if ( e.selectedRowKeys.length > 0 ) {
      if ( this.DGDetalleCif.findIndex( (d:any) => d.CODIGO === e.selectedRowKeys[0]) === -1 ) {
        cellInfo.data.CODIGO = e.selectedRowsData[0].CODIGO;
        cellInfo.data.DESCRIPCION = e.selectedRowsData[0].DESCRIPCION;
        cellInfo.data.TIPO = e.selectedRowsData[0].TIPO;
        cellInfo.data.VALOR = e.selectedRowsData[0].VALOR;
        cellInfo.data.BASE = e.selectedRowsData[0].BASE;
        cellInfo.data.VALOR_BASE = e.selectedRowsData[0].VALOR_BASE;
        cellInfo.data.TOTAL = e.selectedRowsData[0].TOTAL;
        cellInfo.data.ESTADO = e.selectedRowsData[0].ESTADO;
        if ( cellInfo.data.TIPO === 'Fijo')
          cellInfo.data.formatValor = '#,##0.0';
        if ( cellInfo.data.TIPO === 'Variable') {
          cellInfo.data.formatValor = '#,##0,00%';
          cellInfo.data.CANTIDAD = 0;
          cellInfo.data.TOTAL = 0;
          if (cellInfo.data.BASE === 'PRECIO DE VENTA') {
            const tcd = this._sdatos.TOTAL_COSTO_DIRECTO;
            var cifVariables:any = this.DGDetalleCif.filter((d:any) => d.TIPO === 'Variable');
            cifVariables.push(cellInfo.data);
            const totalCifVariables = cifVariables.reduce((acc:any, item:any) => {
              return acc += (item.VALOR)/100;
            }, 0);
            cellInfo.data.TOTAL = (cellInfo.data.VALOR/100) * (tcd / (1-(totalCifVariables + (this._sdatos.D_MATRIZ.MARGEN_RENTABILIDAD/100)) ));
    
          }
          if (cellInfo.data.BASE === 'COSTO DIRECTO') {
            const tcd = this._sdatos.TOTAL_COSTO_DIRECTO;
            const subTotal = (cellInfo.data.VALOR * tcd)/100;
            cellInfo.data.TOTAL = subTotal;
          }
        }
        this.gridCifDetalles.instance.cellValue(cellInfo.rowIndex, "CODIGO", cellInfo.data.CODIGO);
        this.gridCifDetalles.instance.cellValue(cellInfo.rowIndex, "DESCRIPCION", cellInfo.data.DESCRIPCION);
        this.gridCifDetalles.instance.cellValue(cellInfo.rowIndex, "TIPO", cellInfo.data.TIPO);
        this.gridCifDetalles.instance.cellValue(cellInfo.rowIndex, "VALOR", cellInfo.data.VALOR);
        this.gridCifDetalles.instance.cellValue(cellInfo.rowIndex, "BASE", cellInfo.data.BASE);
        this.gridCifDetalles.instance.cellValue(cellInfo.rowIndex, "VALOR_BASE", cellInfo.data.VALOR_BASE);
        this.gridCifDetalles.instance.cellValue(cellInfo.rowIndex, "TOTAL", cellInfo.data.TOTAL);
      } else {
        this.selectCIF = [];
        showToast('Este CIF ya esta asignado!', 'error');
      }
    } else {
      cellInfo.data.DESCRIPCION = '';
      cellInfo.data.TIPO = '';
      cellInfo.data.VALOR = '';
      cellInfo.data.BASE = '';
    }
    this.openCIF = false;
  }

  onRowValidating(e: any) {
		let mensaje:any='';
		let propiedadesVacias:any = [];
		const propiedadesVerificar = ["CODIGO", "DESCRIPCION", "TIPO", "VALOR", "TOTAL"];

    if( this.getData.DESC === 'Fijo' ) {
      if( ((e.newData.CODIGO === '') || (e.newData.CODIGO === null)) ||
          ((e.newData.DESCRIPCION === '') || (e.newData.DESCRIPCION === null)) ||
          ((e.newData.TIPO === '') || (e.newData.TIPO === null)) ||
          ((e.newData.VALOR === '') || (e.newData.VALOR <= 0)) ||
          ((e.newData.TOTAL === '') || (e.newData.TOTAL <= 0))
        )
      {
        for (let key in e.newData) {
          if (propiedadesVerificar.includes(key) && !e.newData[key]) {
            propiedadesVacias.push(key);
          }
        }
        if (propiedadesVacias.length > 0)
          mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;
        else if (e.newData.VALOR <= 0)
          mensaje = 'El valor debe ser mayor a cero(0).';

        this.rowApplyChanges = true;
        e.isValid = false;
        showToast(mensaje, 'error');
      } else {
        e.isValid = true;
        this.rowApplyChanges = false;
      };
    };
    if( this.getData.DESC === 'Variable' ) {
      if( this._sdatos.TOTAL_COSTO_DIRECTO <= 0) {
        if( ((e.newData.CODIGO === '') || (e.newData.CODIGO === null)) ||
            ((e.newData.DESCRIPCION === '') || (e.newData.DESCRIPCION === null)) ||
            ((e.newData.TIPO === '') || (e.newData.TIPO === null)) ||
            ((e.newData.VALOR === '') || (e.newData.VALOR === null)) ||
            ((e.newData.TOTAL === '') || (e.newData.TOTAL === null))
          )
        {
          for (let key in e.newData) {
            if (propiedadesVerificar.includes(key) && !e.newData[key]) {
              propiedadesVacias.push(key);
            }
          }
          if (propiedadesVacias.length > 0)
            mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;
  
          this.rowApplyChanges = true;
          e.isValid = false;
          showToast(mensaje, 'error');
        } else {
          e.isValid = true;
          showToast('La información se agregó, pero debe asignar Costos Directos para calcular el total de los Costos Indirectos.', 'warning');
          this.rowApplyChanges = false;
        };
      } else {
        if( ((e.newData.CODIGO === '') || (e.newData.CODIGO === null)) ||
            ((e.newData.DESCRIPCION === '') || (e.newData.DESCRIPCION === null)) ||
            ((e.newData.TIPO === '') || (e.newData.TIPO === null)) ||
            ((e.newData.VALOR === '') || (e.newData.VALOR <= 0)) ||
            ((e.newData.TOTAL === '') || (e.newData.TOTAL <= 0))
          )
        {
          for (let key in e.newData) {
            if (propiedadesVerificar.includes(key) && !e.newData[key]) {
              propiedadesVacias.push(key);
            }
          }
          if (propiedadesVacias.length > 0)
            mensaje = `Los campos ${propiedadesVacias.join(", ")} están vacíos, complete la información.`;
          else if (e.newData.VALOR <= 0)
            mensaje = 'El valor debe ser mayor a cero(0).';
  
          this.rowApplyChanges = true;
          e.isValid = false;
          showToast(mensaje, 'error');
        } else {
          e.isValid = true;
          this.rowApplyChanges = false;
        };
      };
    }
    return e.isValid;
	}

  // Operaciones de grid
  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'new':
        if ( this.DGcif.length > 0) {
          this.gridCifDetalles.instance.addRow();
          this.rowApplyChanges = true;
          this.rowNew = false;
          this.rowDelete = false;
        } else
          showToast('No hay items posibles por agregar de Cif '+this.getData.DESC, 'error');
        
        break;
      case 'edit':
        this.rowApplyChanges = true;
				this.rowNew = false;
				this.rowDelete = false;
        break;
      case 'save':
        this.gridCifDetalles.instance.saveEditData();
        break;
      case 'cancel':
        this.gridCifDetalles.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
				if(this.filasSelecc.length > 0) {
					this.rowDelete = true;
				} else {
					this.rowDelete = false;
				}
        this.selectNewTipoCIF = [];
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
              const index = this.DGDetalleCif.findIndex((a:any) => a.CODIGO === key);
              this.DGDetalleCif.splice(index, 1);
            });
            this.gridCifDetalles.instance.refresh();
            this.onCalculateTotalCIF();

            const pos = this._sdatos.MATRIZ_DETALLE_CIF.findIndex((d:any) => d.ID_SECCION === this._sdatos.D_MATRIZ.PRODUCTO);
            if ( pos !== -1 ) {
              this._sdatos.MATRIZ_DETALLE_CIF[pos] = { ID_SECCION: this._sdatos.D_MATRIZ.PRODUCTO, DATA_SOURCE: this.DGDetalleCif };
            } else {
              this._sdatos.MATRIZ_DETALLE_CIF.push({ ID_SECCION: this._sdatos.D_MATRIZ.PRODUCTO, DATA_SOURCE: this.DGDetalleCif });
            }

            this.filasSelecc = [];
            this._sdatos.conCambios++;
						this.rowApplyChanges = false;
						this.rowNew = true;
						if(this.filasSelecc.length > 0) {
							this.rowDelete = true;
						} else {
							this.rowDelete = false;
						}
            this._sdatos.setConCambios(this._sdatos.conCambios);
          }
        });
        break;

      case 'refrescar':
        this.gridCifDetalles.instance.refresh();
        break;

      default:
        break;
    }
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string) {
		if (obj === 'cif' || obj === 'todos') {
      this.loadingVisible = true;
			const prm = { PRODUCTO: this._sdatos.D_MATRIZ.PRODUCTO };
      this.sData.getValorBase('CIF', prm).subscribe((data: any) => {
        this.loadingVisible = false;
				const res = JSON.parse(data.data);
				if ( (data.token != undefined) ){
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				const mensaje = res[0].ErrMensaje;
				if (mensaje !== '') {
					this.showModal(mensaje);
				} else {
          const data:any[] = JSON.parse(JSON.stringify(res.filter((d:any) => d.TIPO === this.getData.DESC && d.DEFECTO === true)));
					this.DGcif = JSON.parse(JSON.stringify(res.filter((d:any) => d.TIPO === this.getData.DESC && d.DEFECTO === false)));
					this.DGcif_prev = res;
          if (this._sdatos.accion === 'nuevo' && data.length > 0)
            this.checkup(data);
				};
			},
				((err:any) => {
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
