import { CommonModule, formatNumber } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxCheckBoxComponent, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxComponent, DxDropDownBoxModule, DxSelectBoxComponent, DxSelectBoxModule, DxTextBoxModule, DxTooltipComponent, DxTooltipModule } from 'devextreme-angular';
import { clsMovimientos, clsMovimientosGrav, clsMovimientosGravItems, clsMovimientosItems } from '../clsCOM203.class';
import { COM203Service } from 'src/app/services/COM203/COM203.service';
import { libtools } from 'src/app/shared/common/libtools';
import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';
import { showToast } from '../../../shared/toast/toastComponent.js';
import Swal from 'sweetalert2';
import { on } from 'devextreme/events';
import { Observable, Subject, Subscription, lastValueFrom } from 'rxjs';
import DataSource from 'devextreme/data/data_source';
import { validatorRes } from 'src/app/shared/validator/validator';
import { COM20304Component } from '../COM20304/COM20304.component';
import { XcComboGridComponent } from 'src/app/shared/xc-combo-grid/xc-combo-grid.component';
import { COM20303Component } from '../COM20303/COM20303.component';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';

@Component({
  selector: 'app-COM20301',
  templateUrl: './COM20301.component.html',
  styleUrls: ['./COM20301.component.css'],
  standalone: true,
  imports: [ CommonModule, DxDataGridModule, DxSelectBoxModule, DxCheckBoxModule, 
             DxButtonModule, XcComboGridComponent, DxTooltipModule, COM20303Component,
             DxTextBoxModule, DxDropDownBoxModule
           ]
})
export class COM20301Component {

  @ViewChild("gridMovimientosItems", { static: false }) gridMovimientosItems: DxDataGridComponent;
  @ViewChild("ddProductos", { static: false }) ddProductos: DxDropDownBoxComponent;
  @ViewChild("gridProLista", { static: false }) gridProLista: DxDataGridComponent;
  @ViewChild("checkProSoloPrecio", { static: false }) checkProSoloPrecio: DxCheckBoxComponent;
  @ViewChild("checkProProveedor", { static: false }) checkProProveedor: DxCheckBoxComponent;
  @ViewChild("xs_PRODUCTOS", { static: false }) sboxProductos: DxSelectBoxComponent;
  @ViewChild("tipIva", { static: false }) tooltipIva: DxTooltipComponent;  
  @ViewChild("tipKit", { static: false }) tooltipKit: DxTooltipComponent;  
  @ViewChild("tipExis", { static: false }) tooltipExis: DxTooltipComponent;  
  @Input() DMovimientosItems: any[] = [];
  // DMovimientosItems: clsMovimientosItems[] = [];
  DItemsAux:any = [];
  DAccionesMov:any = [];
  esEdicion: boolean = false;
  esInicioDatos: boolean = false;
  esCreacion: boolean = false;
  verAcciones: boolean = false;
  DProductos: any;
  DProductosLista: any;
  DProveedores: any;
  DDocumentos: any;
  DUnidadMedida: any;
  DTiposVenta: any;
  DListasPrecios: any;
  DGravamenes: any;
  DListaUMCompra: any;
  DADC: any;
  DAtributos: any;
  DTiposInv: any = [{TIPO_INVENTARIO:'NUEVO'},{TIPO_INVENTARIO:'DEPOSITO'}];
  DDirecciones: any;
  DBodegas: any;
  DMonedas: any;
  DCondiciones: any;
  DPlazos: any;
  DTipoInv: any;
  DMonedaDef: any;
  especAplicacion: any;
  gridBoxProducto: string[] = [];
  infoIva: any;
  infoKit: any;
  infoExis: any;
  productoExis: string;
  movIdProveedor: any;
  setValueHandler: any;
  accionesItems: string;
  user: any;
  rowsSelected: any[] = [];
  TOT_GRAV: number;
  cumpleReqItems: string;
  codigoBarrasPro: string;
  GRAV_FIJOS: any;
  
  // Eventos componentes asociados
  eventsSubjectIvas: Subject<any> = new Subject<any>();
  eventsSubjectGridTasas: Subject<any> = new Subject<any>();
  eventsSubjectSeriales: Subject<any> = new Subject<any>();
  eventsSubjectFiltro: Subject<any> = new Subject<any>();
  eventsSubjectPopUpGrid: Subject<any> = new Subject<any>();
  eventsSubjectGrid: Subject<any> = new Subject<any>();
  visibleIvas: boolean = false;
  keyFila: any;

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esNuevaFila: boolean = false;
  esVisibleSelecc: string = 'none';
  ltool: any;
  rulesMask = { '#': /[0-9]/ };

  // Especirficaciones y valores defecto
  especMonedaFormato: string = "#,##0.00";
  especCantidadFormato: string = "#,##0.00";
  especModificarPrecio: boolean = true;
  especModificarGrav: boolean = true;
  especModificarSoporte: boolean = true;
  especModificarProducto: boolean = true;
  especModificarUMPres: boolean = true;
  especModificarProducto_org: boolean = true;
  especModificarUMPres_org: boolean = true;
  especRepetirItem: boolean = true; 
  especOrigenPrecio: string = ''; 
  especEmailCompras: string = ''; 
  especUsuarioEmail: string = ''; 
  especModoEnvioEmail: string = ''; 
  especModificarOrden: boolean = false; 

  //Notificaciones
  toaVisible: boolean;
  toaMessage: string = 'Registro actualizado!';
  toaTipo: string = 'success';
  loadingVisible: boolean = false;

  dropDownOptions: any =  { 
    width: 800, 
    height: 500, 
    hideOnParentScroll: true, 
    container: '#router-container',
    // toolbarItems: [{
    //   location: 'before', 
    //   toolbar: 'top',
    //   template: 'tempEncab',
    // }]
  };
  dropDownOptionsListBox = { hideOnParentScroll: true, container: '#router-container' };
  dSBEstados = ["REGISTRADO","ANULADO","COMPLETADO","EN PROCESO"];
  visibleCols: any = { SOPORTE: true, 
                       UDM_PRESENTACION: true, 
                       VALOR_UNITARIO: true, 
                       SUB_TOTAL: true, 
                       VALOR_IVA: true, 
                       TOTAL: true };

  // tooltips
  TooltipTarget: any;
  ToolTipText: string;

  private eventsSubscription: Subscription;
  eventsSubjectSbox: Subject<any> = new Subject<any>();
  popupVisible: boolean = false;
  popUpGrid: any;
  componentSbox: any;

  @Input() events: Observable<any>;

  @Input() visible: boolean;

  @Output() onRespuestaItems = new EventEmitter<any>;

  @Input() DMovimientos: clsMovimientos;
  @Input() DMovimientosGrav: clsMovimientosGrav[] = [];
  @Input() DMovimientosGravItems: clsMovimientosGravItems[] = [];
  @Output() DMovimientosChange: EventEmitter<clsMovimientos> = new EventEmitter<clsMovimientos>();
  @Output() DMovimientosGravChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() DMovimientosGravItemsChange: EventEmitter<any> = new EventEmitter<any>();
  
  constructor(
    private _sdatos: COM203Service,
    private tabService: TabService,
    private _sbarreg: SbarraService
  ) 
    {
    // this.ltool = new libtools(this._sbarreg, this.tabService);
    this.ltool = new libtools(this._sbarreg, this.tabService);
    this.onScroll = this.onScroll.bind(this);
    this.valoresDefecto = this.valoresDefecto.bind(this);
    this.onSeleccRowProducto = this.onSeleccRowProducto.bind(this);
    this.onChangeProducto = this.onChangeProducto.bind(this);
    this.onChangeCantidad = this.onChangeCantidad.bind(this);
    this.onCellPrepared = this.onCellPrepared.bind(this);
    this.onSoloProPrecio = this.onSoloProPrecio.bind(this);
    this.onSoloProProveedor = this.onSoloProProveedor.bind(this);
    this.validarRequisitosMov =this.validarRequisitosMov.bind(this);
    this.initNewRow =this.initNewRow.bind(this);
    this.valoresObjetos =this.valoresObjetos.bind(this);
    this.insertedRow =this.insertedRow.bind(this);
    this.customizeColumnsSearch = this.customizeColumnsSearch.bind(this);

  }

  // Si está desplegado objetos, cerrar
  onScroll(e: Event): void {
    const elem = e.target as HTMLElement;
    if (elem.className !== "dx-scrollable-container") {
    }
  }
  
  
  setItemValues(){
    this.setDItemsAux();
    this.valoresObjetos('gravamenes', this.GRAV_FIJOS);
    this.calcularValores();
  }
  setDItemsAux(){
    this.DItemsAux = this.DMovimientosItems;
    for(const item of this.DItemsAux){
      item.APLICACION = 2
    }
  }

  calcularValores() {
    this.DMovimientos.SUB_TOTAL = this.DMovimientosItems.reduce((n, {SUB_TOTAL}) => n + SUB_TOTAL, 0);
    if (this.DMovimientosGrav !== undefined) {
      this.TOT_GRAV = this.DMovimientosGrav.reduce((n, {VALOR}) => n + VALOR, 0);
    }
    this.DMovimientos.TOTAL = this.DMovimientos.SUB_TOTAL + this.TOT_GRAV;
  }

  initNewRow(e){
    e.data.ID_UN = '';
    e.data.ITEM = 0;
    e.data.PRODUCTO = '';
    e.data.ATRIBUTO = 'SIN';
    e.data.CANTIDAD = 0;
    e.data.CANTIDAD_AUTORIZADA = 0;
    e.data.CANTIDAD_PENDIENTE = 0;
    e.data.VALOR_BASE = 0;
    e.data.VALOR_UNITARIO = 0;
    e.data.VALOR_DESCUENTO = 0;
    e.data.SUB_TOTAL = 0;
    e.data.VALOR_DESCUENTO = 0;
    e.data.VALOR_COSTOS = 0;
    e.data.GRAVAMENES = [];
    e.data.GRAV_ORG = [];
    e.data.GRAV_TOTAL = [];
    e.data.TOTAL = 0;
    e.data.PORC_IVA = 0;
    e.data.VALOR_IVA = 0;
    e.data.REFERENCIA = "";
    e.data.DETALLE = "";
    e.data.UDM_COMPRA = '';
    e.data.UDM_PRES = '';
    e.data.UDM_PRESENTACION = '';
    e.data.CANTIDAD_PRES = 0;
    e.data.UDM_EQUIV = '';
    e.data.CANTIDAD_EQUIV = 0;
    e.data.CANTIDAD_REAL = 0;
    e.data.SOPORTE = "";
    e.data.DOCUMENTO = "";
    e.data.PRODUCTO_KIT = "";
    e.data.TIPO_INVENTARIO = "NUEVO";
    if (this.DMovimientosItems.length > 0) {
      const item = this.DMovimientosItems.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    e.data.isEdit = false;
  }

  insertedRow(e){
    this.setItemValues();
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
    this.gridMovimientosItems.instance.deselectAll();
    this.activarEdicionCols(false);
    e.component.navigateToRow(e.key);
    e.component.addRow();
  }

  insertingRow(e) {
    e.data.isEdit = true;
    // Valida datos
    if (e.data.PRODUCTO === ''){
      showToast('Faltan completar datos del Producto', 'warning');
      e.cancel = true;
    }
  }

  removedRow(e) {
    this.setItemValues();
    this.rowApplyChanges = false;
  }

  showModal(mensaje: any, titulo = '¡Error!', msg_html= '') {
    const tipo = titulo;
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo==='Error' ? 'DF3E3E':'#0F4C81 !important',
			title: titulo,
			text: mensaje,
			allowOutsideClick: true,
			allowEscapeKey: false,
			allowEnterKey: false,
			backdrop: true,
			position: 'center',
      html: msg_html,
			stopKeydownPropagation: false,
		});
	}

  updatedRow(e){
    this.setItemValues();
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
    this.gridMovimientosItems.instance.deselectAll();    
    this.activarEdicionCols(false);
  }

  updatingRow(e) {
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = true;
    this.setItemValues();
  }

  ValidaDatos(Accion: string): boolean {
    var msg = '';
    if (Accion === "requerido"){
      if(this.DMovimientosItems === undefined || this.DMovimientosItems.length === 0) msg += 'Productos: No se ha asociado ningÃºn Producto a la Orden de compra.';
      if (msg !== '') {
        this.showModal("Hay datos incompletos de la Orden de compra. Revisar contenido de los items: "+msg,"Faltan datos",'');
        return false;
      }
    }
    return true;
  }
  onEditingStart(e) {
    this.gridBoxProducto = [e.data.PRODUCTO];
    this.esVisibleSelecc = 'none';
    this.rowApplyChanges = true;
    e.data.isEdit = true;

    // Valida edición
    if (e.data.SOPORTE == '') {
      this.activarEdicionCols(true);
    }
  }
  onEditorPreparing(e) {
    // Validación Descuento por % o por valor
    if (e.parentType === "dataRow" && e.dataField === "VALOR_DESCUENTO") {
      e.editorOptions.onKeyPress = (args) => {  
        // if (args.event.key === "%") {  
        let vdesc = args.component.option("text") + args.event.key;
        if (vdesc == "") vdesc = args.event.key;
        if (!/^[0-9]+(\.[0-9]{0,2})?%?$/.test(vdesc)) {
          args.event.preventDefault();  
        }  
      }  
    }
    
  }
  onCellPrepared(e) {

    // Iva asociado al producto
    if (e.rowType === "data" && e.column.dataField === "VALOR_IVA") {
        on(e.cellElement, "mouseover", arg => {
          this.infoIva = e.data.GRAVAMENES;
          this.tooltipIva.instance.show(arg.target);
        });

        on(e.cellElement, "mouseout", arg => {
          this.tooltipIva.instance.hide();
        });
    }

    // Productos del combo
    if (e.rowType === "data" && e.column.dataField === "PRODUCTO_KIT") {
      on(e.cellElement, "mouseover", arg => {
        if ( ('' + e.data.PRODUCTO_KIT).includes('{')) {
          this.infoKit = e.data.PRODUCTO_KIT;
        }
        else {
          this.infoKit = [];
          if (e.data.PRODUCTO_KIT.includes('|')) {
            const varkit = e.data.PRODUCTO_KIT.split('|');
            varkit.forEach(elkit => {
              let nompro = this.DProductosLista.find(p => p.PRODUCTO === elkit.PRODUCTO_KIT);
              nompro = nompro ? nompro.NOMBRE : '';
              this.infoKit = [ ...this.infoKit, { PRODUCTO_KIT: elkit.split('^')[0], NOMBRE: nompro, CANTIDAD: elkit.split('^')[1] } ];
            });
          }
        }
        this.tooltipKit.instance.show(arg.target);
      });

      on(e.cellElement, "mouseout", arg => {
        this.tooltipKit.instance.hide();
      });
    }

    // Existencias en Bodega del Producto
    if (e.rowType === "data" && e.column.dataField === "PRODUCTO") {
      on(e.cellElement, "mouseover", arg => {
          this.infoExis = [];
          this.productoExis = e.data.PRODUCTO + ' ' + e.data.NOMBRE_PRODUCTO;
          const prm = { PRODUCTO: e.data.PRODUCTO, PRESENTACION: 'SI' };
          this._sdatos
          .consulta('EXISTENCIAS PRODUCTOS', prm, "PRO-022")
          .subscribe((resp) => {
            const res = JSON.parse(resp.data);
            if (res[0].ErrMensaje == ""){
              this.infoExis = res;
            }
          });
        this.tooltipExis.instance.show(arg.target);
      });

      on(e.cellElement, "mouseout", arg => {
        this.tooltipExis.instance.hide();
      });
    }

  }

  onEditorEnterKey(e){
    // e.event.preventDefault();
    // var itemsgru:any = this.formOrdenCompra.instance.option('items');
    // itemsgru.forEach((g) => {
    //   var items = g['items'];
    //   var index = items.findIndex((item) => item.dataField === e.dataField);
    //   if (index !== -1){
    //     var fNextEditor = this.formOrdenCompra.instance.getEditor(
    //       items[++index < items.length ? index : 0].dataField
    //     );
    //     if (fNextEditor) fNextEditor.focus();
    //     return;
    //   }
    // });
  }

  onFocusedRowChanged(e){
    const rowData = e.row && e.row.data;
    if (rowData) {
      this.gridBoxProducto = [rowData.PRODUCTO]
      this.valoresObjetos('atributos');
    }
  }

  onEditCanceled(e) {
    this.esVisibleSelecc = 'always';
    this.gridMovimientosItems.instance.deselectAll();    
    this.rowApplyChanges = false;
    this.activarEdicionCols(false);
  }
  onCellHoverChanged(e) {
    if (e.rowType === "data" && e.column.dataField.match("PRODUCTO|NOMBRE_PRODUCTO")) {
      if (e.eventType === "mouseover") {
          this.TooltipTarget = e.cellElement;
          this.ToolTipText = e.data.NOMBRE_PRODUCTO;
          // this.toolTip.instance.show(this.TooltipTarget);
      } else {
          // this.toolTip.instance.hide();
      }
    }
  }

  onCellClick(e) {
    if (e.row === undefined) return;

    // Valida si es posible la edición
    if (this.esEdicion && e.data.SOPORTE == '') {
      this.activarEdicionCols(true);
    }

    if (e.row.cells[e.columnIndex].column.dataField === 'VALOR_IVA') {

      // Extrae ivas del producto
      const dnompro = this.DProductosLista.find(p => p.PRODUCTO == e.data.PRODUCTO);
      if (dnompro) {
        if (dnompro.IVAS.length > 1) {
          // Iva asociado al item
          var ivaAso = '';
          if (e.data.GRAVAMENES) {
            if (e.data.GRAVAMENES.ID_TASA)
              ivaAso = e.data.GRAVAMENES.ID_TASA;
          }
          this.keyFila = e.key;
          this.eventsSubjectIvas.next({ 
            dataSource: dnompro.IVAS, 
            visible: true,
            iva: ivaAso
          });
        }
      }
    }

    // Productos serializados
    if (e.row.cells[e.columnIndex].column.dataField === 'SERIALES') {
      this.eventsSubjectSeriales.next({ operacion: 'nuevo' });
    }

  }

  onToolbarPreparingGrid(e: any) {
    let toolbarItems = e.toolbarOptions.items;
    e.toolbarOptions.items.unshift(
      {
        location: 'before'
      }
    );
  }

  onRowPrepared(e) {
    if (e.rowType === "data") {
      if (e.data.isEdit) {
				// e.rowElement.style.backgroundColor = 'lightyellow';
				const className:string = e.rowElement.className;
				e.rowElement.className = className +' row-modified-focused';
			}
      if (!e.isEditing && e.data.isEdit) 
        {
          this.esVisibleSelecc = 'always';
          e.data.isEdit = false;
        }
      }
    if (e.rowType === "header" && e.rowIndex === 2 && !this.esEdicion) {
      e.rowElement.style.display = "none";
    }
  }

  onRowValidating(e: any) {
    // Valida completitud
    var errMsg = '';
    if (e.newData.PRODUCTO !== undefined && e.newData.PRODUCTO == '') 
      errMsg = 'Falta seleccionar producto';
    if (e.newData.VALOR_UNITARIO !== undefined && e.newData.VALOR_UNITARIO <= 0) 
      errMsg = 'Valor unitario no puede ser cero';
    if (e.newData.CANTIDAD !== undefined && e.newData.CANTIDAD <= 0) 
      errMsg = 'Cantidad no puede ser cero';
    if (e.newData.UDM_PRESENTACION !== undefined && e.newData.UDM_PRESENTACION == "") 
      errMsg = 'Debe seleccionar una unidad de presentación';
    if (errMsg !== '') {
      e.isValid = false;
      showToast(errMsg, 'warning');
      return;
    }
  }

  onSeleccDocumento(e: any): void {
  }

  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  // Activa condiciones de edición dependiendo de la operación
  activarEdicionCols (accion: boolean) {
    if (accion) {
      this.especModificarProducto = accion;
      this.especModificarUMPres = accion;
    }
    else {
      this.especModificarProducto = this.especModificarProducto_org;
      this.especModificarUMPres = this.especModificarUMPres_org;
    }
  }

  // Valida datos necesarios para operar los items o al guardar
  async validarRequisitosMov()  {

    // Dependiendo del movimiento y el tipo, validar datos completos
    this.cumpleReqItems = "";
    const resValid = await new Promise((resolve, reject) => {

      // Valida completitud
      switch (this.DMovimientos.MOVIMIENTO) {
        case "ENTRADA":
          switch (this.DMovimientos.TIPO) {
            case "ORDEN DE COMPRA":
              if (this.DMovimientos.ID_PROVEEDOR === "") this.cumpleReqItems += (this.cumpleReqItems !== "" ? "|" : "") + "Debe seleccionar proveedor";
              if (this.DMovimientos.ID_UN_DESTINO === "") this.cumpleReqItems += (this.cumpleReqItems !== "" ? "|" : "") + "Debe seleccionar bodega destino";
              if (this.DMovimientos.TIPO_COMPRA === "") this.cumpleReqItems += (this.cumpleReqItems !== "" ? "|" : "") + "Debe seleccionar condicion de compra";
              if (this.DMovimientos.FECHA_VENCIMIENTO === "" || this.DMovimientos.FECHA_VENCIMIENTO === null) 
                this.cumpleReqItems += (this.cumpleReqItems !== "" ? "|" : "") + "Debe seleccionar fecha de vencimiento";
              break;
            case "TRASLADO":
              if (this.DMovimientos.ID_UN_ORIGEN === "") this.cumpleReqItems += (this.cumpleReqItems !== "" ? "|" : "") + "Debe seleccionar bodega origen";
              if (this.DMovimientos.ID_UN_DESTINO === "") this.cumpleReqItems += (this.cumpleReqItems !== "" ? "|" : "") + "Debe seleccionar bodega destino";
              break;
            case "DEPOSITO":
              if (this.DMovimientos.ID_UN_ORIGEN === "") this.cumpleReqItems += (this.cumpleReqItems !== "" ? "|" : "") + "Debe seleccionar cliente";
              if (this.DMovimientos.ID_UN_DESTINO === "") this.cumpleReqItems += (this.cumpleReqItems !== "" ? "|" : "") + "Debe seleccionar bodega destino";
              break;
            default:
              // Valida otra posible combinaciÃ³n de datos
              const prm = { MOVIMIENTOS: this.DMovimientos };
              const apiRest = this._sdatos.consulta('validar requisitos items', prm, "COM-203");
              let res = lastValueFrom(apiRest, {defaultValue: true});
              res = JSON.parse(res["data"]); 
              if (res[0].ErrMensaje === '') {
                this.cumpleReqItems = res[0].ErrMensaje;
              }
              break;
          }        
          break;
      
        default:
          break;
      }

      // Resuelve
      if (this.cumpleReqItems !== "") {
        resolve (false);
      }
      else {
        resolve (true);
      };
    });

    // Responda
    if (resValid)
      return (true);
    else
      return (false);

  }

  // Operaciones sobre la grid
  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        this.gridBoxProducto = [];

        // Valida requisitos
        let valido = this.validarRequisitosMov();
        if (this.cumpleReqItems === "") {
        this.gridMovimientosItems.instance.addRow();
        this.rowApplyChanges = true;
        this.esVisibleSelecc = 'none';
        this.activarEdicionCols(true);
}
        else {
          this.cumpleReqItems = this.cumpleReqItems.replace(/[|]/g,"<br>");
          this.showModal("","Faltan datos",this.cumpleReqItems);
        }
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this.esVisibleSelecc = 'none';
        break;
      case 'save':
        this.gridMovimientosItems.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        this.gridMovimientosItems.instance.deselectAll();    
        this.activarEdicionCols(false);
        break;
      case 'cancel':
        this.gridMovimientosItems.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.esVisibleSelecc = 'always';
        this.gridMovimientosItems.instance.deselectAll();    
        this.activarEdicionCols(false);
        break;
      case 'delete':
        // Elimina filas seleccionadas
        Swal.fire({
          title: '',
          text: 'Desea eliminar los items seleccionados?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.filasSelecc.forEach((key) => {
              const index = this.DMovimientosItems.findIndex(a => a.ITEM === key);
              this.DMovimientosItems.splice(index, 1);
            });
            this.gridMovimientosItems.instance.refresh();
            this.setItemValues();
          }
        });
        break;

      default:
        break;
    }
  }

  async onChangeCantidad(rowData: any, value: any, currentRowData: any){

    // Valida cantidad dependiendo del soporte
    let prmItems = { ...currentRowData, CANTIDAD: value, CANTIDAD_PREV: currentRowData.CANTIDAD };
    prmItems = { ...prmItems, ...rowData };
    const prm = { MOVIMIENTO: this.DMovimientos, ITEMS: prmItems };
    const apiRest = this._sdatos.consulta('actualizar cantidad', prm, "COM-203");
    const res = await lastValueFrom(apiRest, {defaultValue: true});
    const datRes = JSON.parse(res.data);
    const ix = this.DMovimientosItems.findIndex(o => o.ITEM == currentRowData.ITEM);

    var rowIndex = this.gridMovimientosItems.instance.getRowIndexByKey(this.keyFila);  
    if (datRes[0].ErrMensaje !== "") {
      this.showModal(datRes[0].ErrMensaje, 'error');

      // Restablece cantidad
      // var rowIndex = this.gridMovimientosItems.instance.getRowIndexByKey(this.keyFila);  
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD", 0);
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD_REAL", 0);
      rowData.CANTIDAD = 0;
      rowData.CANTIDAD_REAL = 0;
      if (ix !== -1) {
        this.DMovimientosItems[ix].CANTIDAD = 0;
        this.DMovimientosItems[ix].CANTIDAD_REAL = 0;
      }

    } 
    else {
      rowData.CANTIDAD = value;
      if (this.DMovimientos.TIPO.match('ORDEN DE COMPRA|DEVOLUCION')) {
        rowData.CANTIDAD_REAL = value * currentRowData.CANTIDAD_EQUIV  * currentRowData.CANTIDAD_PRES;
      }
      else {
        rowData.CANTIDAD_REAL = value;
      }
      rowData.SUB_TOTAL = rowData.CANTIDAD * currentRowData.VALOR_UNITARIO;
      const porIva = currentRowData.GRAVAMENES.PORCENTAJE !== undefined ? currentRowData.GRAVAMENES.PORCENTAJE : 0;
      rowData.VALOR_IVA = rowData.SUB_TOTAL * porIva / 100;
      rowData.TOTAL = rowData.SUB_TOTAL + rowData.VALOR_IVA;
 
      // Asigna valores al item
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD", rowData.CANTIDAD);
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD_REAL", rowData.CANTIDAD_REAL);
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "SUB_TOTAL", rowData.SUB_TOTAL);
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "VALOR_IVA", rowData.VALOR_IVA);
      // this.gridMovimientosItems.instance.cellValue(rowIndex, "TOTAL", rowData.TOTAL);

      // Recalcular el movimiento
      this.valoresObjetos('gravamenes', this.GRAV_FIJOS);
    }

    // Valida cantidad dependiendo del soporte
    /*
    let prmItems = { ...currentRowData, CANTIDAD: value, CANTIDAD_PREV: currentRowData.CANTIDAD };
    prmItems = { ...prmItems, ...rowData };
    const prm = { MOVIMIENTO: this.DMovimientos, ITEMS: prmItems };
    this._sdatos
    .consulta('actualizar cantidad', prm, "COM-203")
    .subscribe((resp) => {
      const res = JSON.parse(resp.data);
      const ix = this.DMovimientosItems.findIndex(o => o.ITEM == currentRowData.ITEM);

      var rowIndex = this.gridMovimientosItems.instance.getRowIndexByKey(this.keyFila);  
      if (res[0].ErrMensaje !== ""){
        this.showModal(res[0].ErrMensaje, 'error');

        // Restablece cantidad
        this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD", 0);
        this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD_REAL", 0);
        rowData.CANTIDAD = 0;
        rowData.CANTIDAD_REAL = 0;
        if (ix !== -1) {
          this.DMovimientosItems[ix].CANTIDAD = res[0].CANTIDAD;
          this.DMovimientosItems[ix].CANTIDAD_REAL = res[0].CANTIDAD_REAL;
        }

      } 
      else {
        rowData.CANTIDAD = value;
        if (this.DMovimientos.TIPO.match('ORDEN DE COMPRA|DEVOLUCION')) {
          rowData.CANTIDAD_REAL = value * currentRowData.CANTIDAD_EQUIV  * currentRowData.CANTIDAD_PRES;
        }
        else {
          rowData.CANTIDAD_REAL = value;
        }
        rowData.SUB_TOTAL = rowData.CANTIDAD * currentRowData.VALOR_UNITARIO;
        const porIva = currentRowData.GRAVAMENES.PORCENTAJE !== undefined ? currentRowData.GRAVAMENES.PORCENTAJE : 0;
        rowData.VALOR_IVA = rowData.SUB_TOTAL * porIva / 100;
        rowData.TOTAL = rowData.SUB_TOTAL + rowData.VALOR_IVA;
   
        // Asigna valores al item
        this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD", rowData.CANTIDAD);
        this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD_REAL", rowData.CANTIDAD_REAL);
        this.gridMovimientosItems.instance.cellValue(rowIndex, "SUB_TOTAL", rowData.SUB_TOTAL);
        this.gridMovimientosItems.instance.cellValue(rowIndex, "VALOR_IVA", rowData.VALOR_IVA);
        this.gridMovimientosItems.instance.cellValue(rowIndex, "TOTAL", rowData.TOTAL);

        // Recalcular el movimiento
        this.valoresObjetos('gravamenes', this.GRAV_FIJOS);
      }

    });
    */

  }

  onChangeValorUnitario(rowData: any, value: any, currentRowData: any){
    rowData.VALOR_UNITARIO = value;
    rowData.SUB_TOTAL = currentRowData.CANTIDAD * rowData.VALOR_UNITARIO;
    const porIva = currentRowData.GRAVAMENES.PORCENTAJE !== undefined ? currentRowData.GRAVAMENES.PORCENTAJE : 0;
    rowData.VALOR_IVA = rowData.SUB_TOTAL * porIva / 100;
    rowData.TOTAL = rowData.SUB_TOTAL + rowData.VALOR_IVA;
  }

  onChangeValorDescuento(rowData: any, value: any, currentRowData: any){
    // rowData.VALOR_DESCUENTO = value;
    if (value.includes('%')) {
      const valdesc = Number(value.replace('%',''));
      rowData.VALOR_DESCUENTO = currentRowData.CANTIDAD * currentRowData.VALOR_UNITARIO * (valdesc / 100);
    }
    else {
      rowData.VALOR_DESCUENTO = value;
    }
    rowData.SUB_TOTAL = currentRowData.CANTIDAD * currentRowData.VALOR_UNITARIO - rowData.VALOR_DESCUENTO;
    const porIva = currentRowData.GRAVAMENES.PORCENTAJE !== undefined ? currentRowData.GRAVAMENES.PORCENTAJE : 0;
    rowData.VALOR_IVA = rowData.SUB_TOTAL * porIva / 100;
    rowData.TOTAL = rowData.SUB_TOTAL + rowData.VALOR_IVA;
  }
  onValueChangedDesc(e) {
  }

  maskDescuento(cellInfo) {
    if (cellInfo.value != null) {
      return cellInfo.value.toString().endsWith('%') 
        ? cellInfo.value 
        : `${cellInfo.value}%`;
    }
    return '';
  }

  onChangeProducto(rowData: any, value: any, currentRowData: any){
    rowData.PRODUCTO = value;
  }

  onOpenedProducto(e) {
    // if (this.esInicioObj.sboxIniProducto) {
    //   this.checkProSoloPrecio.instance.option("value", false);
    //   this.checkProProveedor.instance.option("value", false);
    //   this.esInicioObj.sboxIniProducto = false;
    // }
  }

  refreshClick(objeto) {
    // this.checkProSoloPrecio.instance.option("value", false);
    // this.checkProProveedor.instance.option("value", false);
    this.valoresObjetos('productos');
    this.sboxProductos.instance._refresh();
    this.sboxProductos.instance.close();
  }
  onSoloProPrecio(e) {
    const chkprov = this.checkProProveedor.instance.option("value");
    var datPro: any = [];
    if (e.value) {
      datPro = !chkprov ? 
                this.DProductosLista.filter(p => p.PRECIO != 0) : 
                this.DProductosLista.filter(p => p.PRECIO != 0 && p.PROVEEDOR.match(this.DMovimientos.ID_PROVEEDOR));  
    }
    else {
      datPro = !chkprov ? 
                this.DProductosLista : 
                this.DProductosLista.filter(p => p.PROVEEDOR.match(this.DMovimientos.ID_PROVEEDOR));  
    }
    this.DProductos = new DataSource({
      store: datPro,  
      paginate: true,
      pageSize: 20
    });
    setTimeout(() => {
      this.DProductos.reload();
    }, 300);
  }

  onSoloProProveedor(e) {
    const chkprecio = this.checkProSoloPrecio.instance.option("value");
    var datPro: any = [];
    if (e.value) {
      datPro = !chkprecio ? 
                this.DProductosLista.filter(p => p.PROVEEDOR.match(this.DMovimientos.ID_PROVEEDOR)) :
                this.DProductosLista.filter(p => p.PROVEEDOR.match(this.DMovimientos.ID_PROVEEDOR) && p.PRECIO !== 0);
    }              
    else {
      datPro = !chkprecio ? 
                this.DProductosLista :
                this.DProductosLista.filter(p => p.PRECIO !== 0);
    }
    this.DProductos = new DataSource({
      store: datPro,
      paginate: true,
      pageSize: 20
    });
    setTimeout(() => {
      this.DProductos.reload();
    }, 300);
  }

  onSeleccIvas(e){
    if (e.addedItems === undefined) return;
    if (e.addedItems.length === 0) return;
    var rowIndex = this.gridMovimientosItems.instance.getRowIndexByKey(this.keyFila);  
    const canPro = this.gridMovimientosItems.instance.cellValue(rowIndex, "CANTIDAD");
    const valUnit = this.gridMovimientosItems.instance.cellValue(rowIndex, "VALOR_UNITARIO");
    const valIva = e.addedItems[0].PORCENTAJE / 100 * canPro * valUnit;
    this.gridMovimientosItems.instance.cellValue(rowIndex, "VALOR_IVA", valIva);
    this.gridMovimientosItems.instance.cellValue(rowIndex, "TOTAL", canPro * valUnit + valIva);
    this.gridMovimientosItems.instance.cellValue(rowIndex, "GRAVAMENES", e.addedItems[0]);
    this.gridMovimientosItems.instance.cellValue(rowIndex, "GRAV_ORG", e.addedItems[0]);

    // Actualiza el data source
    const nx = this.DMovimientosItems.findIndex(it => it.ITEM == this.gridMovimientosItems.instance.cellValue(rowIndex, "ITEM") );
    if (nx !== -1) {
      this.DMovimientosItems[nx].VALOR_IVA = valIva;
      this.DMovimientosItems[nx].TOTAL = canPro * valUnit + valIva;
      this.DMovimientosItems[nx].GRAVAMENES = e.addedItems[0];
      this.DMovimientosItems[nx].GRAV_ORG = e.addedItems[0];
    }

    this.valoresObjetos('gravamenes');
  }

  // Selección de acción sobre los items
  onSeleccAccion(e) {

    this.accionesItems = e.itemData.FILTRO;
    const prm = { ACCION: e.itemData.FILTRO };
    this._sdatos.consulta('configuracion acciones', prm, 'COM-203').subscribe((data: any) => {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }

      // Ejecuta la accion
      if (res[0].tipo === 'popup') {
        // this.eventsSubjectPopUpGrid.next({ operacion: 'ver', 
        //                                     config: res[0], 
        //                                     prmDatos: this.DMovimientos  })
        this.valoresObjetos('ventana acciones', { operacion: 'ver', 
                                                  config: res[0], 
                                                  prmDatos: this.DMovimientos  })
      }
      else {
        this.DMovimientosItems = res;
      }

    });

  }

  // Lee codigo de barras y busca en productos / presentaciones
  onValueChangedCBarras(e) {
    const prm = { CODIGO_BARRAS: e.value, 
                  ENCAB: this.DMovimientos,
                  ITEMS: this.DMovimientosItems };
    this._sdatos.consulta('consulta codigo barras', prm, 'COM-203').subscribe((data: any) => {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      if (res[0].ErrMensaje !== '') {
        showToast(res[0].ErrMensaje);
      } 
      else {
        // Busca y si existe, adiciona a la cantidad
        this.DMovimientosItems = res;
        // this.GRAV_FIJOS = res[0].APL_GRAV;
        this.valoresObjetos('gravamenes', this.GRAV_FIJOS);
      }

    });

  
  }
  
  // Acciones sobre Selección producto
  // Nombre, precios, especificaciones de producto
  async onSeleccRowProducto(e:any, cellInfo:any) {
    if (e.selectedRowKeys[0]){
      if ( this.DMovimientosItems.findIndex((d:any) => d.PRODUCTO === e.selectedRowKeys[0]) === -1 ) {
        
        // Producto seleccionado
        const proSelecc = e.selectedRowKeys[0];

        //Valida si el producto esta asignado a la bodega de Destino y tiene existencias.
        const UN_DES:any = this.DMovimientos.ID_UN_DESTINO;
        const prm:any = { PRODUCTO: proSelecc, 
                          PRESENTACION: 'SI', 
                          MOVIMIENTO: this.DMovimientos.MOVIMIENTO,
                          TIPO: this.DMovimientos.TIPO ,
                          ID_UN_ORIGEN: this.DMovimientos.ID_UN_ORIGEN,
                          ID_UN_DESTINO: this.DMovimientos.ID_UN_DESTINO
                        };
        const apiRest = this._sdatos.consulta('EXISTENCIAS PRODUCTO', prm, "COM-203");
        let res = await lastValueFrom(apiRest, {defaultValue: true});
        res = JSON.parse(res.data);
        if (res[0].ErrMensaje !== ''){
          cellInfo.data.PRODUCTO = '';
          showToast(res[0].ErrMensaje, 'error');
          // return;
          // } else if (res.findIndex((d:any) => d.ID_UN_BODEGA === UN_DES) === -1) {
          // cellInfo.data.PRODUCTO = '';
          // showToast('El producto no esta asignado a la Bodega de Destino.', 'error');
          return;
        }

        cellInfo.data.PRODUCTO = proSelecc;
        const dnompro = res[0];
        this.DProductosLista = res;
        // const dnompro = this.DProductosLista.find((p:any) => p.PRODUCTO === proSelecc);
        if (dnompro) {
          cellInfo.data.NOMBRE_PRODUCTO = dnompro.NOMBRE;
          cellInfo.data.REFERENCIA = dnompro.REFERENCIA;
          cellInfo.data.PRODUCTO_KIT = dnompro.PRODUCTO_KIT;

          // Nombre/kit del producto
          this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "NOMBRE_PRODUCTO", cellInfo.data.NOMBRE);
          this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "PRODUCTO_KIT", cellInfo.data.PRODUCTO_KIT);
          
          // Valorización
          cellInfo.data.VALOR_UNITARIO = dnompro.PRECIO;
          this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "VALOR_UNITARIO", cellInfo.data.VALOR_UNITARIO);
          cellInfo.data.PORC_IVA = dnompro.PORC_IVA;

          // Atributos
          this.DAtributos = dnompro.ATRIBUTOS;
          if (dnompro.ATRIBUTOS) {
            if (dnompro.ATRIBUTOS.length == 1) {
              cellInfo.data.ATRIBUTO = dnompro.ATRIBUTOS[0].ATRIBUTO;
              this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "ATRIBUTO", cellInfo.data.ATRIBUTO);
            }
          }
          
          // Presentación
          if (dnompro.PRESENTACION) {
            const dpres = dnompro.PRESENTACION;
            this.DListaUMCompra = dpres;
            if (dpres.length === 1) {
              this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "UDM_PRESENTACION", dpres[0].UDM_COMPRA);
              this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "UDM_PRES", dpres[0].UDM_COMPRA);
              this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", dpres[0].CANTIDAD_PRES);
              this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", dpres[0].UDM_EQUIV);
              this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", dpres[0].CANTIDAD_EQUIV);
              var dcanreal = 0;
              if (this.DMovimientos.TIPO.match('ORDEN DE COMPRA|DEVOLUCION')) 
                dcanreal = dpres[0].CANTIDAD_PRES * dpres[0].CANTIDAD_EQUIV;
              else
                dcanreal = cellInfo.data.CANTIDAD;
              this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", dcanreal);
              cellInfo.data.UDM_PRES = dpres[0].UDM_COMPRA;
              cellInfo.data.CANTIDAD_PRES = dpres[0].CANTIDAD_PRES;
              cellInfo.data.CANTIDAD_EQUIV = dpres[0].CANTIDAD_EQUIV;
            }
            else {
              this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "UDM_COMPRA", "");
              this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_PRES", "");
              this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", "");
              this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_EQUIV", "");
              this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "CANTIDAD_REAL", 0);
            }
          }
          this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "PORC_IVA", cellInfo.data.PORC_IVA);
          // this.valoresObjetos('atributos');
          setTimeout(() => {
            var rowIndex = cellInfo.component.getRowIndexByKey(cellInfo.key);  
            // cellInfo.component.editCell(rowIndex, 'PRODUCTO');
            // e.component.focus();
            cellInfo.component.focus(this.gridMovimientosItems.instance.getCellElement(rowIndex, "PRODUCTO"));
          }, 300);
  
          // Análisis de varios Ivas
          this.keyFila = cellInfo.key;
          if (dnompro.IVAS.length > 1) {
            this.setValueHandler = cellInfo;
            this.eventsSubjectIvas.next({ 
                  dataSource: dnompro.IVAS, 
                  visible: true,
                  iva: ''
                  });
          }
          else {
            this.onSeleccIvas({ addedItems: dnompro.IVAS });
          }
        }

      } else {
        cellInfo.data.PRODUCTO = '';
        showToast('El producto ya fue seleccionado.', 'error');
      }
    }
  }

  // Activa auto-busqueda multiple (por palabras)
  customizeColumnsSearch(columns: Array<any>) {
    columns.forEach((column: any) => {
      column.calculateFilterExpression = this.ltool.customCalculateFilterExpression.bind(column);
      column.cellTemplate = this.ltool.customCellTemplate.bind(this);
    })
  }  
  // Asigna string de palabras de búsqueda
  onSearchChanged(e: any): void {
    if (e.fullName === 'searchPanel.text') {
      const grid = e.component;
      const searcWords = e.value?.trim().toLowerCase();
      this.ltool.searchText = searcWords;
    }
  }
  onDropdownOpenedPro(e) {
    setTimeout(() => {
      if (this.gridProLista?.instance) {
          const gridElement = this.gridProLista.instance.element();
          
          // Use querySelector instead of find()
          const searchInput = gridElement.querySelector('.dx-datagrid-search-panel input') ||
                            gridElement.querySelector('.dx-texteditor-input');
          
          if (searchInput) {
            (searchInput as HTMLInputElement).focus();
          }
        }
    }, 100);  
  }
  onKeyDownListaPro(e, cellInfo:any) {
    this.ddProductos.instance.open();
    setTimeout(() => {
      // this.gridProLista.instance.searchByText(cellInfo.data.PRODUCTO);
    }, 100);
  }
  onInputListaPro(e, cellInfo:any) {
    setTimeout(() => {
      this.gridProLista.instance.searchByText(e.event.target.value);
    }, 100);
  }

  // Atributos para el producto
  onSeleccRowAtributo(e:any, cellInfo:any) {
    cellInfo.setValue(e.value);
  }

  // Tipos de Inventario para el producto
  onSeleccRowTipoInv(e:any, cellInfo:any) {
    cellInfo.setValue(e.value);
  }

  onValueChangedUMCompra(e, cellInfo) {
    cellInfo.setValue(e.value);
    const dum = this.DListaUMCompra.find(u => u.UDM_COMPRA == e.value);
    if (dum) {
      // cellInfo.data.UDM_EQUIV = dum.UDM_EQUIV;
      // cellInfo.data.CAN_EQUIV = dum.CAN_EQUIV;
      this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "UDM_PRESENTACION", dum.UDM_COMPRA);
      this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "UDM_PRES", dum.UDM_COMPRA);
      this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "UDM_EQUIV", dum.UDM_EQUIV);
      this.gridMovimientosItems.instance.cellValue(cellInfo.rowIndex, "CAN_EQUIV", dum.CANTIDAD_EQUIV);
    }
  }

  // Valores de cargue inicial
  valoresDefecto() {
    if(this.especAplicacion) {
      this.especMonedaFormato = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'FORMATO MONEDA' && e.ID_APLICACION == this.DMovimientos.ID_APLICACION)?.FORMATO ?? '#,##0.00';
      this.especCantidadFormato = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'FORMATO CANTIDAD' && e.ID_APLICACION == this.DMovimientos.ID_APLICACION)?.FORMATO ?? '#,##0.00';
      this.especModificarPrecio = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'MODIFICAR PRECIO' && e.ID_APLICACION == this.DMovimientos.ID_APLICACION)?.ACTIVADO ?? false;
      const modifPrecioTipo = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'MODIFICAR PRECIO '+this.DMovimientos.MOVIMIENTO + ' ' + this.DMovimientos.TIPO && e.ID_APLICACION == this.DMovimientos.ID_APLICACION);
      if (modifPrecioTipo) this.especModificarPrecio = modifPrecioTipo.ACTIVADO ?? false;
      this.especModificarGrav = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'MODIFICAR GRAVAMENES' && e.ID_APLICACION == this.DMovimientos.ID_APLICACION)?.ACTIVADO ?? false;
      this.especRepetirItem = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'REPETIR ITEM' && e.ID_APLICACION == this.DMovimientos.ID_APLICACION)?.ACTIVADO ?? false;
      this.especOrigenPrecio = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'MODIFICAR PRECIO' && e.ID_APLICACION == this.DMovimientos.ID_APLICACION)?.VALOR_DEFECTO ?? '';
      this.especModificarProducto = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'MODIFICAR PRODUCTO' && e.ID_APLICACION == this.DMovimientos.ID_APLICACION)?.ACTIVADO ?? false;
      this.especModificarSoporte = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'MODIFICAR SOPORTE' && e.ID_APLICACION == this.DMovimientos.ID_APLICACION)?.ACTIVADO ?? false;
      this.especModificarUMPres = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'MODIFICAR UM PRES' && e.ID_APLICACION == this.DMovimientos.ID_APLICACION)?.ACTIVADO ?? false;
      this.especModificarProducto_org = this.especModificarProducto;
      this.especModificarUMPres_org = this.especModificarUMPres;

      // Activación de columnas
      const visDef = { SOPORTE: true, UDM_PRESENTACION: true, VALOR_UNITARIO: true, SUB_TOTAL: true, VALOR_IVA: true, TOTAL: true };
      this.visibleCols = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'VISIBLE COLS' && 
                                                        e.TITULO === this.DMovimientos.MOVIMIENTO + ' ' + this.DMovimientos.TIPO &&
                                                        e.ID_APLICACION == this.DMovimientos.ID_APLICACION)?.VALOR_JSON ?? visDef;

      // Cuentas de email usuario
      this.especEmailCompras = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'EMAIL COMPRAS')?.VALOR_DEFECTO ?? '';
      this.especUsuarioEmail = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'EMAIL COMPRAS')?.TITULO ?? '';
      this.especModificarOrden = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'MODIFICAR ORDEN')?.ACTIVADO ?? false;
      this.especModoEnvioEmail = this.especAplicacion.find(e => e.NOMBRE_OBJETO === 'MODO ENVIO EMAIL')?.VALOR_DEFECTO ?? '';

    }
  }
  
  // Retorna respuesta del PopUp Grid
  onRespuestaPopUpGrid(e: any) {
    if (e.operacion == 'datos') {
      // Confirma reemplazo de datos
      if (this.DMovimientosItems.length > 0) {
        Swal.fire({
          title: '',
          text: "Hay items ya registrados. ¿ Desea reemplazarlos ?",
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar'
          }).then((result) => {
          if (result.isConfirmed) {

            // Sustituye items
            this.DMovimientosItems = e.datos;

          }
        });
      }

    }
  }

  // Recibe los datos la ventana de acciones
  onRespuestaGrid(e: any) {

    if (e.accion !== 'cancelar') {

      // Trae toda la info seleccionada según la acción
      const prm = { DATOS: e.rowsSelected };
      this._sdatos.consulta('accion:'+this.accionesItems, prm, 'COM-203').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } 
        else {
          this.DMovimientosItems = res;
          this.GRAV_FIJOS = res[0].APL_GRAV;
          this.valoresObjetos('gravamenes', this.GRAV_FIJOS);
        }

      });
  
    }
  }

  // Respuesta seriales
  onRespuestaSeriales(e: any) {
  }
  

  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined){

    if (this.DMovimientos == undefined) return;

    if (obj == 'productos' &&
      this.DMovimientos.MOVIMIENTO !== '' &&
      this.DMovimientos.TIPO !== '' &&
      (this.DMovimientos.ID_UN_ORIGEN !== '' || this.DMovimientos.ID_UN_DESTINO !== '') 
    ) {
      const prm = { ID_CONDICION: this.DMovimientos.ID_CONDICION, 
                    ID_PROVEEDOR: this.DMovimientos.ID_PROVEEDOR,
                    ID_UN_ORIGEN: this.DMovimientos.ID_UN_ORIGEN,
                    ID_UN_DESTINO: this.DMovimientos.ID_UN_DESTINO,
                    MOVIMIENTO: this.DMovimientos.MOVIMIENTO,
                    TIPO: this.DMovimientos.TIPO
                  };
      const accion = 'PRODUCTOS COMPRAS';
      this._sdatos.consulta(accion, prm, 'PRO-022').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        // this.DProductos = res;
        // this.DProductosLista = JSON.parse(JSON.stringify(res));  
        // this.DProductos = new DataSource({
        //   store: res,  
        //   paginate: true,
        //   pageSize: 20
        // });
        this.DProductos = JSON.parse(JSON.stringify(res));  
        /*this.eventsSubjectSboxProducto.next({ dataSource: this.DProductos, 
                                              valueExpr: "PRODUCTO",
                                              displayExpr: "PRODUCTO",
                                              columnData: ["PRODUCTO","NOMBRE"],
                                              valueData: "" });
          */
      });
    }

    if (obj == 'gravamenes' || obj == 'ref'){
      var prm = {};
      if (opcion !== 'original')
        prm = { ORDEN_COMPRA: this.DMovimientos, 
                ITEMS: this.DMovimientosItems, APL_GRAV: opcion};
      else
        prm = { ORDEN_COMPRA: this.DMovimientos, 
                ITEMS: this.DMovimientosItems, OPCION_GRAV: opcion};
      this._sdatos
        .consulta('GRAVAMENES', prm, "COM-200")
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if ( res[0].ErrMensaje !== '' ){
            this.showModal(res[0].ErrMensaje, 'Error cálculo gravamenes');
          }
          else {
            this.DMovimientosGrav = res[0].ENCAB ? res[0].ENCAB : [];
            this.DMovimientosGravItems = res[0].ITEMS ? res[0].ITEMS : [];
            this.calcularValores();

            // Muestra totales
            this.onRespuestaItems.emit({ data: this.DMovimientosItems, totales: res[0].TOTALES });
            this.DMovimientosGravChange.emit(this.DMovimientosGrav);
            this.DMovimientosGravItemsChange.emit(this.DMovimientosGravItems);

            // Aplica a los items
            if (opcion !== undefined) {
              this.DMovimientosItems.forEach(item => {
                const nx = this.DMovimientosGravItems.findIndex(gi => gi.ITEM == item.ITEM);
                if (nx > -1) {
                  item.VALOR_IVA = this.DMovimientosGravItems[nx].VALOR_IVA;
                  item.SUB_TOTAL = this.DMovimientosGravItems[nx].SUB_TOTAL;
                  item.TOTAL = this.DMovimientosGravItems[nx].TOTAL;
                  item.GRAVAMENES = this.DMovimientosGravItems[nx].GRAVAMENES;
                  item.GRAV_TOTAL = this.DMovimientosGravItems[nx].GRAV_TOTAL;
                }
              });
            }
          }
        });
    }

    if (obj === 'tasas legales' || obj === 'todos') {
      const prm = { };
      this._sdatos.consulta('LISTA GRAVAMENES', prm, 'generales').subscribe((data: any)=> {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else
          this.DGravamenes = res;
          this.DGravamenes.forEach(eleg => {
            eleg.PORCENTAJE = (eleg.PORCENTAJE < 0 ? "(" : "" ) + 
                              formatNumber((eleg.PORCENTAJE < 0 ? -1 : 1 ) * eleg.PORCENTAJE * 100, 'en-US', '1.2-2') +
                              (eleg.PORCENTAJE < 0 ? ")" : "" );
            eleg.VALOR_BASE = formatNumber(eleg.VALOR_BASE, 'en-US', '1.2-2');
          });
      });
    }

    if (obj == 'tipo inventario' || obj == 'todos' ) {
      this._sdatos.consulta('TIPO INVENTARIO',{ESTADO: 'ACTIVO'}, "COM-203").subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DTipoInv = res;

      });
    }

    if (obj == 'acciones' || obj == 'todos' ) {
      const prm = { MOVIMIENTO: this.DMovimientos.MOVIMIENTO,
                    TIPO: this.DMovimientos.TIPO,
                    USUARO: this.user
                  }
      this._sdatos.consulta('ACCIONES', prm, "COM-203").subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DAccionesMov = res;
        this.verAcciones = res[0].visible;
      });
    }
 
    if (obj == 'ventana acciones') {
      const prm = { CONFIG: opcion,  DATOS: opcion.prmDatos }
      this._sdatos.consulta(opcion.config.accionDatos, prm, 'COM-203').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }

        // Valida si hay datos...
        if (res[0].ErrMensaje !== "") {
          this.showModal(res[0].ErrMensaje);
        }
        else {
          this.eventsSubjectGrid.next({ 
            dataSource: res, 
            rowsSelected: this.rowsSelected,
            keyExpr: opcion.config.keyExpr,   //["ITEM"],
            titGrid: opcion.config.titulo, 
            modoSelection: opcion.config.modoSelection,
            colsConfig: opcion.config.dataConfig, 
            style: { height: opcion.config.height, width: opcion.config.width },
            container: 'popup'
           });
        }
        
      });
    }

  }

  // Activa campos de la forma para edición 
  // dependiendo de la acción a realizar
  activarEdicion(accion) {
    switch (accion) {
      case 'consulta':
      case 'inactivo':
        this.esVisibleSelecc = 'none';
        this.esEdicion = false;
        break;
      case 'activo':
      case 'nuevo':
        this.esVisibleSelecc = 'always';
        this.esEdicion = true;
        break;
    
      default:
        break;
    }
  }

  // Procesa los datos de recepción y los convierte en items para la grid
  procesarDatosRecepcion(datosRecepcion: any[], movimiento: any) {
    try {
      console.log('Procesando datos de recepción:', datosRecepcion);
      
      // Convertir los datos de recepción a formato de items del grid
      const nuevosItems: any[] = datosRecepcion.map((item, index) => {
        // Calcular VALOR_IVA basado en gravámenes
        let valorIva = 0;
        if (item.GRAVAMENES && item.GRAVAMENES.PORCENTAJE) {
          valorIva = (item.SUB_TOTAL * item.GRAVAMENES.PORCENTAJE) / 100;
        } else if (item.VALOR_IVA !== null && item.VALOR_IVA !== undefined) {
          valorIva = item.VALOR_IVA;
        }

        return {
          ITEM: item.ITEM || index + 1,
          SOPORTE: item.SOPORTE || '',
          PRODUCTO: item.PRODUCTO || '',
          NOMBRE_PRODUCTO: item.NOMBRE_PRODUCTO || '',
          ATRIBUTO: item.ATRIBUTO || 'SIN',
          TIPO_INVENTARIO: item.TIPO_INVENTARIO || 'NUEVO',
          PRODUCTO_KIT: item.PRODUCTO_KIT || '',
          UDM_PRESENTACION: item.UDM_PRESENTACION || item.UDM_PRES || 'UND',
          UDM_PRES: item.UDM_PRES || 'UND',
          CANTIDAD_PRES: item.CANTIDAD_PRES || 1,
          UBICACION: item.UBICACION || '',
          CANTIDAD: item.CANTIDAD || 0,
          UDM_EQUIV: item.UDM_EQUIV || item.UDM || 'UND',
          CANTIDAD_EQUIV: item.CANTIDAD_EQUIV || 1,
          CANTIDAD_REAL: item.CANTIDAD_REAL || item.CANTIDAD || 0,
          SERIALES: '',
          GRAVAMENES: item.GRAVAMENES || '',
          GRAV_ORG: item.GRAV_ORG || '',
          VALOR_UNITARIO: item.VALOR_UNITARIO || 0,
          VALOR_DESCUENTO: item.VALOR_DESCUENTO || 0,
          SUB_TOTAL: item.SUB_TOTAL || 0,
          VALOR_IVA: valorIva,
          TOTAL: item.TOTAL || 0,
          REFERENCIA: item.REFERENCIA || '',
          DETALLE: item.DETALLE || ''
        };
      });

      // Actualizar la grid con los nuevos items
      this.DMovimientosItems = nuevosItems;
      
      // Recalcular valores totales
      this.calcularValores();
      
      // Notificar al componente padre de los cambios
      this.onRespuestaItems.emit({
        accion: 'datos_cargados',
        data: this.DMovimientosItems
      });
      
      showToast('Datos de recepción cargados exitosamente', 'success');
      
    } catch (error) {
      console.error('Error al procesar datos de recepción:', error);
      showToast('Error al procesar los datos de recepción', 'error');
    }
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void { 

    this.user = localStorage.getItem("usuario");
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.operacion) {
        case 'nuevo':
          this.DMovimientosItems = [];
          this.DMovimientos = datos.DMovimientos;
          this.especAplicacion = datos.espec;
          this.GRAV_FIJOS = [];
          this.valoresDefecto();
          this.valoresObjetos('productos');
          break;

        case 'productos':
          this.valoresObjetos('productos');
          break;
      
        case 'consulta':
          // this.valoresObjetos('consulta', datos.documento);
          this.DMovimientosItems = datos.dataSource;
          this.especAplicacion = datos.espec;
          this.valoresDefecto();
          this.valoresObjetos('productos');
          break;

        case 'ini':
          this.especAplicacion = datos.espec;
          this.valoresDefecto();
          // Inicializa datos
          this.valoresObjetos('todos');
          break;

        case 'cargar_datos_recepcion':
          // Procesar datos de recepción y cargar en la grid
          if (datos.datos && datos.datos.length > 0) {
            this.procesarDatosRecepcion(datos.datos, datos.movimiento);
          }
          break;

        default:
          break;
      }
      this.activarEdicion(datos.operacion);

    });

  }

  ngOnDestroy(){
    if (this.eventsSubscription) this.eventsSubscription.unsubscribe();
  }

}
