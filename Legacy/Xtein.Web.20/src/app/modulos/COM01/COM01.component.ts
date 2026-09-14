import { Component, OnInit, ViewChild } from '@angular/core';
import {
  DxButtonModule,
  DxCheckBoxModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDropDownBoxModule,
  DxLoadPanelModule,
  DxTreeListComponent,
  DxTreeListModule,
} from 'devextreme-angular';
import { HttpClient } from '@angular/common/http';
import { COMO1Service } from '../../services/COM01/s_COM01.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';
import notify from 'devextreme/ui/notify';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-com01',
  templateUrl: './COM01.component.html',
  styleUrls: ['./COM01.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    DxLoadPanelModule,
    DxCheckBoxModule,
    DxDropDownBoxModule,
    DxTreeListModule,
    DxDataGridModule,
    DxButtonModule,
  ],
})
export class COM01Component implements OnInit {
  @ViewChild('grupos', { static: false }) treeGrupos: DxTreeListComponent;
  @ViewChild('gridCompras', { static: false }) gridCompras: DxDataGridComponent;

  subscription: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  mnuAccion: string;
  readOnly: boolean = false;
  esEdicion: boolean = true;
  visible: boolean = false;
  openDrop: boolean = false;
  filterEmpleado: any = '';
  conCambios: number = 0;

  treeBoxValue: string[] = [];
  treeDataProdcutos: string[] = [];
  treeDataProdcutos_prev: string[] = [];
  treeProductosValue: string[] = [];
  gridBoxValue: string[] = [];
  bodegaBoxValue: string[] = [];
  DProveedor: string[] = [];
  provResValue: string[] = [];
  comprasBoxValue: boolean = false;
  GDMaxMin: any[] = [];
  dataProv: any = [];
  esVisibleSelecc: string = 'onClick';
  activeGrid: boolean = false;
  activeButton: boolean = true;

  treeDataSource: any;
  provDataSource: any;
  bodegaDataSource: any;
  DProveedores: any;
  selectProv: any;
  nomProv: any;
  btnOrdenCompras: string = 'Orden de Compra';
  btnExport: string = 'Exportar';
  selectedRows: number[] = [];
  selectionChangedBySelectbox: boolean;

  grupoproductos: string[] = [];
  grupoproveedores: string[] = [];
  grupobodega: string[] = [];
  grupocomprar: number;

  toaVisible: boolean = false;
  type = 'info';
  toaMessage = 'Registro actualizado!';
  loadingVisible: boolean = false;

  // Operaciones de grid
  rowDelete: boolean = false;
  rowSend: boolean = false;
  filasSelecc: any[] = [];

  constructor(
    private http: HttpClient,
    private s_COM01: COMO1Service,
    private tabService: TabService,
    private _sbarreg: SbarraService,
    private datePipe: DatePipe
  ) {
    this.subscription = this._sbarreg
      .getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((datreg) => {
        // Valida si la petición es para esta aplicacion
        if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });
  }

  ngOnInit(): void {
    const user: any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: 'RS_EXISTENCIAS',
      aplicacion: 'COM-001',
      usuario: user,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_modificar: true },
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.valoresObjetos('todos');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case 'r_ini':
        const user: any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'RS_EXISTENCIAS',
          aplicacion: 'COM-001',
          usuario: user,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: {},
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_nuevo':
        break;

      case 'r_modificar':
        this.readOnly = false;
        break;

      case 'r_guardar':
        break;

      case 'r_buscar':
        break;

      case 'r_buscar_ejec':
        break;

      case 'r_eliminar':
        break;

      case 'r_primero':
      case 'r_anterior':
      case 'r_siguiente':
      case 'r_ultimo':
      case 'r_numreg':
        break;

      case 'r_cancelar':
        Swal.fire({
          title: '',
          text: '¿Desea cancelar la operación?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar',
        }).then((result) => {
          if (result.isConfirmed) {
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this.readOnly = true;
            this.conCambios = 0;
            this.visible = false;
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          }
        });

        break;

      case 'Vista':
        break;

      case 'r_refrescar':
        this.valoresObjetos('todos');
        break;

      case 'r_imprimir':
        this.imprimirReporte(
          operMenu.operacion.id_reporte,
          operMenu.operacion.archivo,
          operMenu.operacion.data_rpt,
          'INFORME'
        );
        break;

      default:
        break;
    }
  }

  onCellPrepared(e) {
    if (e.rowType === 'data' && e.column.dataField === 'CANT_COMPRAR') {
      if (e.data.CANT_COMPRAR > 0) {
        e.cellElement.style.backgroundColor = 'lightsalmon';
        e.cellElement.style.fontWeight = 'bold';
      }
    }
  }

  updateRowPro($event) {}
  onSaving($event) {}
  deleteRowPro($event) {}
  onRowValidating(e: any) {}

  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    //this.rowCancel = true;
    if (this.filasSelecc.length != 0) {
      this.rowDelete = true;
      this.rowSend = true;
    } else {
      this.rowDelete = false;
      this.rowSend = false;
    }
  }

  onDropDownBoxValueChanged(e: any) {
    this.updateSelection(this.treeGrupos && this.treeGrupos.instance);
  }
  ontreeGruposReady(e: any) {
    this.updateSelection(e.component);
  }
  updateSelection(treeGrupos: any) {
    if (!treeGrupos) return;
    if (!this.treeBoxValue) {
      treeGrupos.unselectAll();
    }
    if (this.treeBoxValue) {
      this.treeBoxValue.forEach((value) => {
        treeGrupos.selectItem(value);
      });
    }
  }

  
  onValueChanged(e:any, campo:any) {
    if (e.value === null || e.value === undefined || e.value.length <= 0 || e.value === '') {
      switch (campo) {
        case 'GRUPO_PRODUCTOS':
          this.treeBoxValue = [];
          break;
  
        case 'PRODUCTOS':
          this.treeProductosValue = [];
          break;
          
        case 'PROVEEDORES':
          this.gridBoxValue = [];
          break;
  
        
        case 'BODEGAS':
          this.bodegaBoxValue = [];
          break;
      
        default:
          break;
      }
    }
  }

  ontreeGruposSelectionChanged(e: any) {
    this.treeBoxValue = e.component.getSelectedNodeKeys();
  }
  onSelectionChanged(e: any) {
    const row = this.treeGrupos.instance.getSelectedRowKeys('true');
    this.treeBoxValue = row;
    if (this.treeBoxValue.length > 0) {
      this.activeButton = false;
      this.treeDataProdcutos = [];
      for (let i = 0; i < this.treeBoxValue.length; i++) {
        const pList: any[] = this.treeDataProdcutos_prev.filter(
          (d: any) => d.ID_GRUPO === this.treeBoxValue[i]
        );
        pList.forEach((ele: any) => {
          const pos: any = this.treeDataProdcutos.findIndex(
            (p: any) => p.PRODUCTO === ele.PRODUCTO
          );
          if (pos === -1) this.treeDataProdcutos.push(ele);
        });
      }
    } else {
      this.treeDataProdcutos = this.treeDataProdcutos_prev;
    }

    if (
      this.treeBoxValue.length < 1 &&
      this.treeProductosValue.length < 1 &&
      this.gridBoxValue.length < 1 &&
      this.bodegaBoxValue.length < 1 &&
      this.comprasBoxValue === false
    ) {
      this.activeButton = true;
    }
  }

  onSelectionChangedProducto(e: any) {
    if (
      e.selectedRowKeys.length > 0 ||
      this.treeBoxValue.length > 0 ||
      this.gridBoxValue.length > 0 ||
      this.bodegaBoxValue.length > 0 ||
      this.comprasBoxValue === true
    ) {
      this.treeProductosValue = e.selectedRowKeys;
      this.activeButton = false;
    } else {
      this.activeButton = true;
    }
  }
  onSelectionChangedProveedor(e: any) {
    if (
      e.selectedRowKeys.length > 0 ||
      this.treeBoxValue.length > 0 ||
      this.treeProductosValue.length > 0 ||
      this.bodegaBoxValue.length > 0 ||
      this.comprasBoxValue === true
    ) {
      this.gridBoxValue = e.selectedRowKeys;
      this.activeButton = false;
    } else {
      this.activeButton = true;
    }
  }
  onSelectionChangedBodega(e: any) {
    if (
      e.selectedRowKeys.length > 0 ||
      this.treeBoxValue.length > 0 ||
      this.treeProductosValue.length > 0 ||
      this.gridBoxValue.length > 0 ||
      this.comprasBoxValue === true
    ) {
      this.bodegaBoxValue = e.selectedRowKeys;
      this.activeButton = false;
    } else {
      this.activeButton = true;
    }
  }

  filterSelected(event: any) {
    this.selectionChangedBySelectbox = true;
    const prefix = event.value;
  }
  selectionChangedHandler() {
    if (!this.selectionChangedBySelectbox) {
    }
    this.selectionChangedBySelectbox = false;
  }

  checked = (e: any) => {
    if (
      e.value === true ||
      this.treeBoxValue.length > 0 ||
      this.treeProductosValue.length > 0 ||
      this.gridBoxValue.length > 0 ||
      this.bodegaBoxValue.length > 0
    ) {
      this.comprasBoxValue = e.value;
      this.activeButton = false;
    } else {
      this.activeButton = true;
    }
  };

  onSelectProveedor(e) {}

  onProveedor(rowData) {}

  onSeleccProv(e: any, cellInfo): void {
    //this.selectProv = e.selectedRowKeys;
    //const prov = this.DProveedores.filter( d => d.ID_PROVEEDOR === this.selectProv[0]);

    this.openDrop = false;
    if (e.data) {
      cellInfo.data.ID_PROVEEDOR = e.data.ID_PROVEEDOR;
      cellInfo.data.NOMBRE_PROVEEDOR = e.data.NOMBRE;
    }
  }

  onValueChangedProv(e: any, cellInfo: any) {
    cellInfo.setValue(e.value);
  }

  setCellvalor(rowData: any, value: any, currentRowData: any) {
    rowData.VALOR = value;
  }

  generarOrdenCompra(e) {
    alert('GENERAR ORDEN DE COMPRA');
  }

  generar() {
    this.GDMaxMin = [];
    let prm = {
      TIPO: 'JSON',
      COMPRAS: this.comprasBoxValue,
      GRUPOS: this.treeBoxValue.join(),
      PRODUCTOS: this.treeProductosValue.join(),
      PROVEEDORES: this.gridBoxValue.join(),
      BODEGAS: this.bodegaBoxValue.join(),
    };
    if (
      this.bodegaBoxValue.length > 0 ||
      this.comprasBoxValue === true ||
      this.treeBoxValue.length > 0 ||
      this.treeProductosValue.length > 0 ||
      this.gridBoxValue.length > 0
    ) {
      this.loadingVisible = true;
      this.activeButton = false;
      this.s_COM01.getGenerar('consulta', prm).subscribe(
        (data: any) => {
          this.loadingVisible = false;
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const mensaje = res[0].ErrMensaje;
          if (mensaje != '') {
            if (mensaje != 'No hay registros en la base de datos')
              this.showModal(mensaje);
          } else {
            this.activeGrid = true;
            this.GDMaxMin = res;
            for (let i = 0; i < this.GDMaxMin.length; i++) {
              this.GDMaxMin[i].ITEM = i + 1;
              this.filterEmpleado = this.GDMaxMin[i].ID_PROVEEDOR;
            }
          }
        },
        (err) => {
          this.loadingVisible = false;
          this.activeGrid = false;
          this.showModal(err.message);
        }
      );
      this.visible = true;
    }

    // Ejecuta búsqueda API
  }

  /*declare (property) DxoExportComponent.texts: {
    exportAll?: string;
    exportSelectedRows?: string;
    exportTo?: string;
  }*/

  onExporting(e: any) {
    const exportFile = new Workbook();
    const worksheet = exportFile.addWorksheet('GDMaxMin');
    let fecha: Date = new Date();
    const newFecha = this.datePipe.transform(fecha, 'MM/dd/yyyy');
    const name: string = 'Informe compras ' + newFecha;
    exportDataGrid({
      component: e.component,
      worksheet,
      autoFilterEnabled: true,
    }).then(() => {
      exportFile.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: 'application/octet-stream' }),
          name + '.xlsx'
        );
      });
    });
    e.cancel = true;
  }

  valoresObjetos(obj: string) {
    if (obj === 'GRUPOS PRODUCTOS' || obj === 'todos') {
      //CONSULTA GRUPOS PRODUCTOS
      const prm: any = { ESTADO: 'ACTIVO' };
      this.s_COM01.getGrupoProductos('GRUPOS', prm).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem('token', refreshToken);
        }
        res.push({ ID_GRUPO: 'RAIZ' });
        this.treeDataSource = res;
      });
    }
    if (obj === 'PRODUCTOS' || obj === 'todos') {
      //CONSULTA PRODUCTOS
      const prm: any = { ESTADO: 'ACTIVO' };
      this.s_COM01.getGenerar('PRODUCTOS', prm).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem('token', refreshToken);
        }
        this.treeDataProdcutos_prev = res;
        this.treeDataProdcutos = res;
      });
    }
    if (obj === 'GRUPOS PROVEEDORES' || obj === 'todos') {
      //CONSULTA PROVEEDORES
      const prm: any = { ESTADO: 'ACTIVO' };
      this.s_COM01.getProveedores('PROVEEDORES', prm).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem('token', refreshToken);
        }
        this.provDataSource = res;
      });
    }
    if (obj === 'BODEGAS' || obj === 'todos') {
      //CONSULTA BODEGAS
      const prm: any = { ESTADO: 'ACTIVO' };
      this.s_COM01.getBodegas('BODEGAS', prm).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem('token', refreshToken);
        }
        this.bodegaDataSource = res;
      });
    }
  }

  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte, archivo, datosrpt, tipo) {
    let filtroRep = {
      GRUPOS: this.treeBoxValue.join(),
      PROVEEDORES: this.gridBoxValue.join(),
      COMPRAS: this.comprasBoxValue,
      BODEGAS: this.bodegaBoxValue.join(),
      TIPO: tipo,
    };
    const prmLiq = {
      clid: localStorage.getItem('empresa'),
      usuario: localStorage.getItem('usuario'),
      idrpt: archivo,
      id_reporte,
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      filtro: filtroRep,
    };

    // Si no existe, no está abierta entonces agrega Tab
    const listaTab = this.tabService.tabs.find(
      (c) => c.aplicacion === id_reporte
    );
    if (listaTab === undefined)
      GlobalVariables.listaAplicaciones.unshift({
        aplicacion: id_reporte,
        barra: undefined,
        statusEdicion: '',
      });

    // Abre pestaña con nuevo reporte
    this.tabService.addTab(
      new Tab(
        VisorrepComponent, // visor
        datosrpt.text, // título
        { parent: 'PrincipalComponent', args: prmLiq }, // parámetro: reporte,filtro
        id_reporte, // código del reporte
        '',
        'reporte',
        true
      )
    );
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

  showToast(message: any, type: any, offset: any) {
    const container: any = document.getElementById('router-container');
    notify(
      {
        message: message,
        width: 300,
        position: {
          at: 'top right',
          my: 'top right',
          of: container,
          offset: offset,
        },
        animation: {
          show: { type: 'fade', duration: 400, from: 0, to: 1 },
          hide: { type: 'fade', duration: 40, to: 0 },
        },
      },
      type,
      4500
    );
  }
}
