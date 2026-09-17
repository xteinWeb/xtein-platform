import { CommonModule, provideImageKitLoader } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxDropDownBoxComponent, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxPopupComponent, DxPopupModule, DxSelectBoxModule, DxSwitchModule, DxTabPanelModule, DxTabsModule, DxTagBoxModule, DxTextBoxModule } from 'devextreme-angular';

import notify from 'devextreme/ui/notify';
import { lastValueFrom, Subject, Subscription } from 'rxjs';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { CXC220Service } from 'src/app/services/CXC220/CXC220.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { ImageFile, ImgManagerComponent } from 'src/app/shared/img-manager/img-manager.component';
import { PdfFile, PdfManagerComponent } from 'src/app/shared/pdf-manager/pdf-manager.component';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { libtools } from 'src/app/shared/common/libtools';
import DataSource from 'devextreme/data/data_source';
import CustomStore from 'devextreme/data/custom_store';
import { showToast } from '../../../shared/toast/toastComponent.js';
import { CXC22003Component } from '../CXC22003/CXC22003.component';
import Swal from 'sweetalert2';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { environment } from 'src/environments/environment';

interface SolicitudCredito {
  CONSECUTIVO?: string;
  ID_DOCUMENTO?: string;
  DOCUMENTO?: string;
  ESTADO?: string;
  FECHA_SOLICITUD?: Date;
  ID_UN_ITEM?: string;
  FECHA_REGISTRO?: Date;
  CALIDAD?: string;
  NOMBRE1?: string;
  NOMBRE2?: string;
  APELLIDO1?: string;
  APELLIDO2?: string;
  ID_ADC?: string;
  ID_CONDICION?: string;
  PLAZO?: number;
  CUOTA_INICIAL?: number;
  VALOR_BASE?: number;
  VALOR_FIN?: number;
  VALOR_IVA?: number;
  TOTAL?: number;
  VALOR_CUOTA?: number;
  FECHA_PRIMER_VENC?: Date;
  SALDO?: number;
  VALOR_DPPP?: number;
  USUARIO?: string;
  OTROS_GASTOS?: number;
  OFICINA_PAGO?: string;
  REQUISITOS?: string;
}
interface ItemSolicitudCredito {
  ITEM: number;
  CALIDAD?: string;
  ID_CLIENTE?: string;
  ID_UBICACION?: string;
  NOMBRE1?: string;
  NOMBRE2?: string;
  APELLIDO1?: string;
  APELLIDO2?: string;
  DIR_RESIDENCIA?: string;
  TEL_RESIDENCIA?: string;
  ID_UBICACION_RES?: string;
  BARRIO?: string;
  ZONA?: string;
  EDAD?: number;
  ESTADO_CIVIL?: number;
  PERSONAS_CARGO?: number;
  ENTIDAD_LABORA?: string;
  DIR_LABORA?: string;
  CARGO_TRABAJA?: string;
  CORREO_LABORA?: string;
  TEL_LABORA?: string;
  TIEMPO_LABORA?: string;
  UM_TIEMPO?: number;
  SUELDO_LABORA?: number;
  NOMBRE_CONYUGUE?: string;
  ID_CONYUGUE?: string;
  ID_UBICACION_CONY?: string;
  EDAD_CONYUGUE?: number;
  OCUPACION_CONY?: string;
  SUELDO_CONY?: number;
  DIR_LABORA_CONY?: string;
  TEL_LABORA_CONY?: string;
  TIPO_CASA?: number;
  NOMBRE_ARRENDADOR?: string;
  TEL_ARRENDADOR?: string;
  NOMBRE_REF1?: string;
  CLASE_REF1?: string;
  DIR_REF1?: string;
  TEL_REF1?: string;
  NOMBRE_REF2?: string;
  CLASE_REF2?: string;
  DIR_REF2?: string;
  TEL_REF2?: string;
  NOMBRE_REF3?: string;
  CLASE_REF3?: string;
  DIR_REF3?: string;
  TEL_REF3?: string;
  NOMBRE_CIU_RES?: string;
  NOMBRE_BARRIO?: string;
  NOMBRE_ZONA?: string; 
  NOMBRE_BARRIO_RES?: string;
}

interface Producto {
  CANTIDAD: number;
  PRODUCTO: string;
  NOMBRE: string;
  VALOR: number;
  SERIAL: string;
}

interface DescuentoCargo {
  CONCEPTO?: string;
  TIPO?: string;
  VALOR: number;
}

interface Tag {
  id: number;
  name: string;
  asociado: string;
}

@Component({
  selector: 'app-CXC22002',
  templateUrl: './CXC22002.component.html',
  styleUrls: ['./CXC22002.component.scss'],
  standalone: true,
  imports: [ CommonModule, DxDataGridModule, DxTabsModule, DxTabPanelModule, DxButtonModule,
             DxLoadPanelModule, DxSelectBoxModule, DxTextBoxModule, DxFormModule,
             DxNumberBoxModule, DxPopupModule, DxTagBoxModule, DxDateBoxModule,
             ImgManagerComponent, PdfManagerComponent, DxDropDownBoxModule,
             CXC22003Component, DxSwitchModule
  ]
})
export class CXC22002Component {
  @ViewChild('formDatosBasicos', { static: false }) formDatosBasicos: DxFormComponent;
  @ViewChild('formDatosCliente', { static: false }) formDatosCliente: DxFormComponent;
  @ViewChild('gridProductos', { static: false }) gridProductos: DxDataGridComponent;
  @ViewChild('gridDescuentos', { static: false }) gridDescuentos: DxDataGridComponent;
  @ViewChild('popupAutorizacion', { static: false }) popupAutorizacion: DxPopupComponent;
  @ViewChild("gridProLista", { static: false }) gridProLista: DxDataGridComponent;
  @ViewChild("ddProductos", { static: false }) ddProductos: DxDropDownBoxComponent;
  @ViewChild("gridFinanciacion", { static: false }) gridFinanciacion: DxDataGridComponent;
  @ViewChild("gridFianzas", { static: false }) gridFianzas: DxDataGridComponent;

  nItemSolicitud: number = 0;
  solicitud: SolicitudCredito = {};
  itemSolicitud: ItemSolicitudCredito[] = [];
  productos: Producto[] = [];
  descuentosCargos: DescuentoCargo[] = [];
  fianzasSeguros: any[] = [];
  asociadoSeleccionado: any;
  listaAsociados: Tag[] = [];
  botonesAsociados: any[] = [];
  DClientes: any;
  subscription: Subscription;
  ltool: any;  
  readOnly: boolean = true;
  mnuAccion: string;
  empresa: string;
  usuario: string;
  nombreTitular: string = '';
  modoConsulta: boolean = false;
  modoEdicion: boolean = false;

  // Datasources
  DSolicitudes: any;
  DLSolicitud: any;
  DListaSolicitudes: any[] = [];
  clientesDataSource: any[] = [];
  unidadesNegocioDataSource: any[] = [];
  ciudadesDataSource: any[] = [];
  barriosDataSource: any[] = [];
  zonasDataSource: any[] = [];
  vendedoresDataSource: any[] = [];
  condicionesDataSource: any[] = [];
  productosDataSource: any[] = [];
  tiposReferenciaDataSource: any[] = [];
  DUnidadesNegocios: any[] = [];
  DCiudades: any[] = [];
  DBarrios: any[] = [];
  DZonas: any[] = [];
  DPlazos: any[] = [];
  DOficinasPago: any[] = [];
  DEntidades: any[] = [];
  private endPointArchivos = environment.files;
  
  // Liquidación
  valueUN: any;
  valueCiudadId: any;
  valueCiudadRes: any;
  valueBarrio: any;
  valueZona: any;
  valorLista: number = 0;
  otrosGastos: number = 0;
  valorFinanciacion: number = 0;
  valorIVA: number = 0;
  valorTotal: number = 0;
  cuotaInicial: number = 0;
  plazo: number = 0;
  valorCuota: number = 0;
  fechaPrimerVencimiento: Date;
  oficinaPago: string = '';
  cuotaBruto: number = 0;
  dctoProntoPago: number = 0;
  cuotaNeto: number = 0;
  datosFinanciacion: any[] = [];
  tablaCuotas: any[] = [];
  customValue: boolean = false;
  
  // Otros
  vendedorSeleccionado: string = '';
  condicionSeleccionada: string = '';
  mostrarAnotaciones: boolean = false;
  requisitos: string[] = [];
  eventsSubjectAsociados: Subject<any> = new Subject<any>();

  // Popup autorización
  usuarioAutorizacion: string = '';
  claveAutorizacion: string = '';
  usuariosAutorizacionDataSource: any[] = [];
  dropDownOptions = { width: 700, height: 400, hideOnParentScroll: true, container: '#router-container'};

  // Estado civil options
  estadoCivilOptions = [
    { text: 'Soltero(a)', value: 0 },
    { text: 'Casado(a)', value: 1 },
    { text: 'Unión Libre', value: 2 },
    { text: 'Concubinato', value: 3 }
  ];

  // Tipo casa options
  tipoCasaOptions = [
    { text: 'Propia', value: 0 },
    { text: 'Arrendada', value: 1 },
    { text: 'Familiar', value: 2 }
  ];

  // Tiempo options
  tiempoOptions = [
    { text: 'Días', value: 0 },
    { text: 'Meses', value: 1 },
    { text: 'Años', value: 2 }
  ];

  // Requisitos options
  requisitosOptions = [
    '1 Codeudor',
    '2 Codeudores',
    '3 Codeudores',
    '4 Codeudores',
    '5 Codeudores'
  ];

  minColWidth = 300;
  tabPanelElement: any;

  // Imágenes
  documentosImg: ImageFile[] = [];
  mockupImages: ImageFile[] = [];
  // PDFs
  documentosPdf: PdfFile[] = [];

  constructor(
    private _sdatos: CXC220Service,
    private _generales: GeneralesService,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private tabService: TabService
  ) 
    {

    this.ltool = new libtools(this._sbarreg, this.tabService);
    this.onChangeCantidad = this.onChangeCantidad.bind(this);
    this.customizeColumnsFin = this.customizeColumnsFin.bind(this);

  }


  cargarDatos(): void {
    // Implementar carga de datos desde servicios
    this.cargarClientes();
    this.cargarUnidadesNegocio();
    this.cargarCiudades();
    this.cargarVendedores();
    this.cargarProductos();
    this.cargarTiposReferencia();
  }

  cargarClientes(): void {
    
  }

  cargarUnidadesNegocio(): void {
    // TODO: Implementar servicio
  }

  cargarCiudades(): void {
    // TODO: Implementar servicio
  }

  cargarVendedores(): void {
    // TODO: Implementar servicio
  }

  cargarProductos(): void {
    // TODO: Implementar servicio
  }

  cargarTiposReferencia(): void {
    // TODO: Implementar servicio
  }

  onSolicitudSeleccionada(e: any): void {
    if (e.selectedItem) {
      this.modoConsulta = true;
      const docSol = { DOCUMENTO: e.selectedItem.DOCUMENTO, 
                       ID_CLIENTE: e.selectedItem.CLIENTE.split(' ')[0], 
                       CALIDAD: e.selectedItem.CALIDAD };
      this.valoresObjetos('cargar solicitud', docSol);
      this.refrescarCombos();
      this.customValue = true;
      setTimeout(() => {
        this.modoConsulta = false;
      }, 300);
    }
  }

  onAsociadoSeleccionado(e: any): void {
    const nuevoValor = e.value;
    const valorAnterior = e.previousValue;

    if (e.value === 0) {
      this.nItemSolicitud = 0;
    } else if (e.value === 10) {
      
      // Valida completitud de datos del titular antes de agregar nuevo codeudor
      const titular = this.itemSolicitud[0];
      if (!titular.ID_CLIENTE || !titular.NOMBRE1 || !titular.APELLIDO1 || !titular.ID_UBICACION_RES) {
        showToast('Por favor complete los datos del titular antes de agregar un codeudor', 'warning');
        setTimeout(() => { e.component.option("value", valorAnterior); }, 100);
        return;
      }

      // Valida completitud de datos actuales del codeudor antes de agregar nuevo codeudor
      const codeudor = this.itemSolicitud[this.nItemSolicitud];
      if (!codeudor.ID_CLIENTE || !codeudor.NOMBRE1 || !codeudor.APELLIDO1 || !codeudor.ID_UBICACION_RES) {
        showToast('Por favor complete los datos del codeudor antes de agregar un nuevo codeudor', 'warning');
        setTimeout(() => { e.component.option("value", valorAnterior); }, 100);
        return;
      }

      // Valida resto de datos
      if (!this.validarDatos()) {
        showToast('Por favor complete todos los datos requeridos !', 'warning');
        setTimeout(() => { e.component.option("value", valorAnterior); }, 100);
        return;
      } 

      // Agrega nuevo codeudor a la lista
      const nuevoItem: Tag = { id: this.itemSolicitud.length - 1, name: `Codeudor ${this.itemSolicitud.length - 1}`, asociado: `Codeudor ${this.itemSolicitud.length - 1}` };
      const nuevoItems = [
          ...this.listaAsociados.slice(0, this.listaAsociados.length - 1),
          nuevoItem,
          ...this.listaAsociados.slice(this.listaAsociados.length - 1)
      ];
      this.listaAsociados = nuevoItems; // reasignamos el arreglo
      
      // Inicialice
      this.nItemSolicitud++;
      this.inicializaItemSolicitud('CODEUDOR');
      this.modoEdicion = true;

    } else {
      const index = this.listaAsociados.findIndex(a => a.id === e.value);
      if (index >= 0) {
        this.nItemSolicitud = index;
      }
    }
  }

  agregarAsociadoBoton(): void {
    // Valida completitud de datos del titular antes de agregar nuevo codeudor
    const titular = this.itemSolicitud[0];
    if (!titular.ID_CLIENTE || !titular.NOMBRE1 || !titular.APELLIDO1 || !titular.ID_UBICACION_RES) {
      showToast('Por favor complete los datos del titular antes de agregar un codeudor', 'warning');
      return;
    }
    // Agregar nuevo codeudor a la lista de botones asociados
    const nuevoItem: Tag = { id: this.itemSolicitud.length - 1, name: `Codeudor ${this.itemSolicitud.length - 1}`, asociado: `Codeudor ${this.itemSolicitud.length - 1}` };
    this.botonesAsociados.push(nuevoItem);

  }
  cargarAsociado(item: any): void {
    // Implementar lógica para cargar asociado
  }

  validarDatos(): boolean {
    const item = this.itemSolicitud[this.nItemSolicitud];
    let validoTodo: boolean = true;
    validoTodo = validoTodo && (item.ID_CLIENTE && item.NOMBRE1 && item.APELLIDO1 && item.ID_UBICACION_RES) ? true : false;
    validoTodo = validoTodo && (item.ID_UBICACION && item.DIR_RESIDENCIA && item.TEL_RESIDENCIA) ? true : false;
 
    const result = this.formDatosCliente.instance.validate();
    validoTodo = validoTodo && (result.isValid ?? false);
    return validoTodo;
  }

  onDatosCambio(): void {
    const item = this.itemSolicitud[this.nItemSolicitud];
    const calidad = this.nItemSolicitud === 0 ? 'Titular' : 'Codeudor';
    if (`${item.NOMBRE1 || ''} ${item.NOMBRE2 || ''} ${item.APELLIDO1 || ''} ${item.APELLIDO2 || ''}`.trim() !== '') {
      this.listaAsociados[this.nItemSolicitud].name = `${item.NOMBRE1 || ''} ${item.NOMBRE2 || ''} ${item.APELLIDO1 || ''} ${item.APELLIDO2 || ''}`.trim();
      this.listaAsociados = [...this.listaAsociados];
      this.eventsSubjectAsociados.next(this.listaAsociados);
    }
  }

  onUNSelecc(e: any): void {
  }
  onCiudadResSelecc(e: any): void {
    this.itemSolicitud[this.nItemSolicitud].ID_UBICACION_RES = e.selectedItem ? e.selectedItem.ID_UBICACION : '';
    this.valoresObjetos('barrios');
  }
  onBarrioSelecc(e: any): void {
    this.valoresObjetos('zonas');
  }
  onZonaSelecc(e: any): void {
  }
  onOficinaPagoSelecc(e: any): void {
    this.solicitud.OFICINA_PAGO = e.selectedItem ? e.selectedItem.ID_CLIENTE : '';
  }

  cargarSolicitud(consecutivo: string): void {
    // TODO: Implementar carga de solicitud
    // this.solicitudService.getSolicitud(consecutivo).subscribe(data => {
    //   this.solicitud = data;
    //   this.productos = data.productos;
    //   this.descuentosCargos = data.descuentosCargos;
    //   this.calcularLiquidacion();
    // });
  }
  onClienteSelecc(e: any): void {
    const cliente = e.selectedItem;
    this.itemSolicitud[this.nItemSolicitud].ID_CLIENTE = e.selectedItem ? e.selectedItem.ID_CLIENTE : '';
    if (cliente.ID_CLIENTE) {
      this.valoresObjetos('existe cliente', cliente.ID_CLIENTE?? cliente);
    }
  }

  onCustomItemCreating(e: any): void {
    // 1. Obtener el texto ingresado
    const newValue = e.text;
    
    // 2. Crear el nuevo objeto (debe seguir la estructura de tu lista)
    const newItem = { 
        CLIENTE: newValue, 
        ID_CLIENTE: newValue 
    };

    // 3. (Opcional) Agregarlo a tu fuente de datos local
    // this.DClientes.push(newItem);
    this.DClientes.store().insert(newItem);

    // 4. ASIGNAR el nuevo objeto al componente para que lo reconozca
    e.customItem = newItem;

  }

  refrescarCombos(): void {
    setTimeout(() => {
      const ciudad = this.itemSolicitud[this.nItemSolicitud].ID_UBICACION_RES;
      if (ciudad) {
        this.cargarBarrios(ciudad);
        this.cargarZonas(ciudad);
      }
    }, 1000);
  }

  cargarBarrios(ciudad: string): void {
    // TODO: Implementar servicio
    // this.ubicacionService.getBarrios(ciudad).subscribe(data => {
    //   this.barriosDataSource = data;
    // });
  }

  cargarZonas(ciudad: string): void {
    // TODO: Implementar servicio
    // this.ubicacionService.getZonas(ciudad).subscribe(data => {
    //   this.zonasDataSource = data;
    // });
  }

  onCiudadChanged(e: any): void {
    if (e.value) {
      this.cargarBarrios(e.value);
    }
  }

  onBarrioChanged(e: any): void {
    if (e.value) {
      this.cargarZonas(e.value);
    }
  }

  onVendedorChanged(e: any): void {
    if (e.value) {
      this.vendedorSeleccionado = e.value;
      this.valoresObjetos('condiciones');
    }
  }
  onCondicionChanged(e: any): void {
    if (e.value) {
      this.condicionSeleccionada = e.value;
      this.valoresObjetos('productos');
      this.DPlazos = JSON.parse(this.condicionesDataSource.find(cond => cond.CODIGO === e.value).PLAZOS);
      if (this.DPlazos.length == 1) {
        this.plazo = this.DPlazos[0].PLAZO;
        this.solicitud.PLAZO = this.plazo;
      }
    }
  }

  nuevaSolicitud(): void {
    this.modoEdicion = true;
    this.solicitud = {};
    this.productos = [];
    this.descuentosCargos = [];
    this.limpiarLiquidacion();
    this.customValue = true;
    this.readOnly = false;
    this.itemSolicitud = [];
    this.listaAsociados = [{ id: 0, name: "<Titular>", asociado: "<Titular>" }];
    this.asociadoSeleccionado = "TITULAR";

    // Inicializa array de titulares y codeudores
    this.nItemSolicitud = 0;
    this.gridProductos.instance.refresh();
    this.inicializaItemSolicitud('TITULAR');
    setTimeout(() => {
      this.eventsSubjectAsociados.next(this.listaAsociados);
    }, 100);
  }

  cancelarSolicitud(): void {
    this.modoEdicion = false;
    this.solicitud = {};
    this.productos = [];
    this.descuentosCargos = [];
    this.itemSolicitud = [];
    this.productosDataSource = [];
    this.barriosDataSource = [];
    this.zonasDataSource = [];
    this.DPlazos = [];
    this.condicionesDataSource = [];
    this.datosFinanciacion = [];
    this.customValue = false;
    this.readOnly = false;
    this.listaAsociados = [{ id: 0, name: "<Titular>", asociado: "<Titular>" }];
    this.asociadoSeleccionado = "<Titular>";
    // Inicializa array de titulares y codeudores
    this.nItemSolicitud = 0;
    this.inicializaItemSolicitud('ZERO');
  }

  eliminarAsociado(): void {
    if (this.nItemSolicitud === 0) {
      showToast('No se puede eliminar el titular de la solicitud', 'error');
      return;
    }
    const index = this.listaAsociados.findIndex(a => a.id === this.nItemSolicitud);
    if (index >= 0) {
      this.listaAsociados.splice(index, 1);
      this.listaAsociados = [...this.listaAsociados];
      this.itemSolicitud.splice(this.nItemSolicitud, 1);
      this.nItemSolicitud = 0;
      this.asociadoSeleccionado = 0;
      this.eventsSubjectAsociados.next(this.listaAsociados);
    }
  }
  

  cargarTitular(): void {
    // Implementar lógica para cargar titular
  }

  cargarCodeudor(numero: number): void {
    // Implementar lógica para cargar codeudor
  }

  initNewRow(e: any): void {
      e.data.CANTIDAD = 0;
      e.data.PRODUCTO = "";
      e.data.NOMBRE = "";
      e.data.VALOR = 0;
      e.data.SERIAL = "";
  }

  onChangeCantidad(rowData: any, value: any, currentRowData: any): void {
    rowData.CANTIDAD = value;
    this.calcularLiquidacion();
  }

  onProductoInserted(e: any): void {
    this.calcularLiquidacion();
  }

  onProductoInserting(e: any): void {
      if (e.data.PRODUCTO === '' || e.data.CANTIDAD <= 0 || e.data.VALOR <= 0) {
      showToast('Faltan completar datos del Producto, por favor complete todos los campos', 'warning');
      e.cancel = true;
    }
  }

  onProductoUpdated(e: any): void {
    this.calcularLiquidacion();
  }

  onProductoUpdating(e: any): void {
      if (e.data.PRODUCTO === '' || e.data.CANTIDAD <= 0 || e.data.VALOR <= 0) {
      showToast('Faltan completar datos del Producto, por favor complete todos los campos', 'warning');
      e.cancel = true;
    }
  }

  onProductoDeleted(e: any): void {
    this.calcularLiquidacion();
  }

  onDescuentoUpdated(e: any): void {
    this.calcularLiquidacion();
  }
  onDescuentoUpdating(e: any): void {
    if (e.data.VALOR <= 0 || !e.data.CONCEPTO || !e.data.TIPO) {
      showToast('El valor del descuento/cargo debe ser mayor a cero o no se ha seleccionado un concepto/tipo', 'warning'); 
      e.cancel = true;
    }
  }
  onDescuentoInserted(e: any): void {
    this.calcularLiquidacion();
  }
  onDescuentoInserting(e: any): void {
    if (e.data.VALOR <= 0 || !e.data.CONCEPTO || !e.data.TIPO) {
      showToast('El valor del descuento/cargo debe ser mayor a cero o no se ha seleccionado un concepto/tipo', 'warning');
      e.cancel = true;
    }   
  }
  onDescuentoDeleting(e: any): void {
      
  }
  onDescuentoDeleted(e: any): void {
    this.calcularLiquidacion();
  }

  reliquidar(): void {
    this.calcularLiquidacion();
    notify('Liquidación actualizada', 'success', 2000);
  }

  onFianzaUpdated(e: any): void {
  }
  onFianzaUpdating(e: any): void {
  }
  onEditorPreparing(e: any) {
    // Verificamos si la columna es una de las que queremos condicionar
    if (e.dataField === "PORCENTAJE" || e.dataField === "VALOR" || e.dataField === "ID_PROVEEDOR") {
        
        // Accedemos al valor de 'Activo' en la fila actual
        const isActivo = e.row.data.APLICAR;

        // Si no está activo, deshabilitamos el editor
        if (!isActivo) {
            e.editorOptions.disabled = true;
            // Opcional: puedes agregar un mensaje o tooltip
            e.editorOptions.placeholder = "Active la fila para editar";
        }
    }
}

  onActivarChanged(e: any, cellInfo: any): void {
    cellInfo.data.APLICAR = e.value;
    // cellInfo.component.repaintRows([cellInfo.rowIndex]);
    // cellInfo.setValue(0, "PORCENTAJE");
    // cellInfo.setValue(0, "VALOR");
    // cellInfo.setValue("", "ID_PROVEEDOR");
    this.gridFianzas.instance.cellValue(cellInfo.rowIndex, "PORCENTAJE", 0);
    this.gridFianzas.instance.cellValue(cellInfo.rowIndex, "VALOR", 0);
    this.gridFianzas.instance.cellValue(cellInfo.rowIndex, "ID_PROVEEDOR", "");
  }
  onEntidadSelecc(e: any, cellInfo: any): void {
    // cellInfo.setValue(e.selectedItem.ID_PROVEEDOR); // Asociado
    this.gridFianzas.instance.cellValue(cellInfo.rowIndex, "ID_PROVEEDOR", e.value);
  }

  calcularLiquidacion(): void {
    if (this.modoConsulta) return;
    // // Calcular valor lista
    // this.valorLista = this.productos.reduce((sum, p) => sum + (p.CANTIDAD * p.VALOR), 0);
    
    // // Calcular valor financiación
    // this.valorFinanciacion = this.valorLista + this.otrosGastos;
    
    // // Aplicar descuentos y cargos
    // this.descuentosCargos.forEach(dc => {
    //   if (dc.TIPO === 'Descuento') {
    //     this.valorFinanciacion -= dc.VALOR;
    //   } else {
    //     this.valorFinanciacion += dc.VALOR;
    //   }
    // });
    
    // // Calcular IVA (ejemplo: 19%)
    // this.valorIVA = this.valorFinanciacion * 0.19;
    
    // // Calcular valor total
    // this.valorTotal = this.valorFinanciacion + this.valorIVA;
    
    // // Calcular cuota
    // if (this.plazo > 0) {
    //   const saldoFinanciar = this.valorTotal - this.cuotaInicial;
    //   this.valorCuota = saldoFinanciar / this.plazo;
      
    //   // Calcular cuota bruto, descuento pronto pago y neto
    //   this.cuotaBruto = this.valorCuota;
    //   this.dctoProntoPago = this.cuotaBruto * 0.05; // Ejemplo: 5%
    //   this.cuotaNeto = this.cuotaBruto - this.dctoProntoPago;
    // }

    // Servicio para traer datos de financiación (ejemplo)
    this._sdatos.consulta('datos financiacion', 
                          { PRODUCTOS: this.productos,
                            ID_CONDICION: this.condicionSeleccionada,
                            CUOTA_INICIAL: this.cuotaInicial,
                            PLAZO: this.plazo,
                            FECHA: this.fechaPrimerVencimiento,
                            CARGOSYDESCUENTOS: this.descuentosCargos
                          }, 
                          'CXC-220').subscribe((data: any) => {
      const res = JSON.parse(data.data);
      this.solicitud.TOTAL = res[0].TOTAL;
      this.solicitud.VALOR_BASE = res[0].VALOR_BASE;
      this.solicitud.VALOR_IVA = res[0].VALOR_IVA;
      this.solicitud.VALOR_CUOTA = res[0].VALOR_CUOTA;
      this.solicitud.FECHA_PRIMER_VENC = res[0].FECHA_PRIMER_VENC;
      this.solicitud.VALOR_FIN = res[0].VALOR_FIN;
      this.datosFinanciacion = res[0].TABLA_FIN;
      this.tablaCuotas = res[0].TABLA_CUOTAS;

      // Si viene tabla productos, actualizar datasource del grid productos
      if (res[0].TABLA_PRO) {
        this.productosDataSource = res[0].TABLA_PRO;
        this.gridProductos.instance.refresh();
      }
    });

  }

  customizeColumnsFin(columns) {
    if (!this.gridFinanciacion) return;
    var items = this.gridFinanciacion.instance.getDataSource().items();  
    columns.forEach((col: any)=> {
      col.alignment = "center";
      if (items && items.length != 0) {
        if (typeof items[0][col.dataField] === "number") {
          col.dataType = "number";
          col.format = "#,###";
        }
        if (col.dataField === "Vencimiento") {
          col.dataType = "date";
          col.format = "yyyy-MM-dd";
        }
      }
    })  

  }

  onOtrosGastosChanged(e: any): void {
    this.otrosGastos = e.value || 0;
    this.calcularLiquidacion();
  }

  onCuotaInicialChanged(e: any): void {
    this.cuotaInicial = e.value || 0;
    this.calcularLiquidacion();
  }

  onPlazoChanged(e: any): void {
    this.plazo = e.value || 0;
    this.calcularLiquidacion();
  }

  limpiarLiquidacion(): void {
    this.valorLista = 0;
    this.otrosGastos = 0;
    this.valorFinanciacion = 0;
    this.valorIVA = 0;
    this.valorTotal = 0;
    this.cuotaInicial = 0;
    this.plazo = 0;
    this.valorCuota = 0;
    this.cuotaBruto = 0;
    this.dctoProntoPago = 0;
    this.cuotaNeto = 0;

    // Traer ultimo consecutivo de la solicitud
    this.valoresObjetos('consecutivo');
    
    // Datos por defecto solicitud
    this.fechaPrimerVencimiento = new Date();
    this.oficinaPago = '';

    // Inicializa solicitud 
    this.solicitud = {
      FECHA_SOLICITUD: new Date(),
      ESTADO: 'REGISTRADO',
      CALIDAD: 'TITULAR',
      ID_ADC: "",
      ID_CONDICION: "",
      NOMBRE1: "",
      APELLIDO1: "",
      NOMBRE2: "",
      APELLIDO2: "",
      FECHA_REGISTRO: new Date(),
      TOTAL: 0,
      VALOR_BASE: 0,
      VALOR_IVA: 0,
      VALOR_CUOTA: 0,
      FECHA_PRIMER_VENC: new Date(),
      VALOR_FIN: 0
    };
    this.nombreTitular = '';

    // Inicializa array de productos y descuentos/cargos
    this.productos = [];
    this.descuentosCargos = [];
    this.datosFinanciacion = [];

  }

  // Inicializa un nuevo item de solicitud con datos por defecto
  inicializaItemSolicitud(calidad): void {
    const itemNuevo = {
      ITEM: this.nItemSolicitud,
      CALIDAD: calidad == 'ZERO' ? '' : calidad,
      NOMBRE1: '',
      APELLIDO1: '',
      NOMBRE2: '',
      APELLIDO2: '',
      ID_CLIENTE: '',
      ID_UBICACION: '',
      DIR_RESIDENCIA: '',
      TEL_RESIDENCIA: '',
      ID_UBICACION_RES: '',
      BARRIO: '',
      ZONA: '',
      EDAD: 0,
      ESTADO_CIVIL: 0,
      PERSONAS_CARGO: 0,
      ENTIDAD_LABORA: '',
      DIR_LABORA: '',
      CARGO_TRABAJA: '',
      CORREO_LABORA: '',
      TEL_LABORA: '',
      TIEMPO_LABORA: '',
      UM_TIEMPO: 0,
      SUELDO_LABORA: 0,
      NOMBRE_CONYUGUE: '',
      ID_CONYUGUE: '',
      ID_UBICACION_CONY: '',
      EDAD_CONYUGUE: 0,
      OCUPACION_CONY: '',
      SUELDO_CONY: 0,
      DIR_LABORA_CONY: '',
      TEL_LABORA_CONY: '',
      TIPO_CASA: 0,
      NOMBRE_ARRENDADOR: '',
      TEL_ARRENDADOR: '', 
      NOMBRE_REF1: '',
      CLASE_REF1: '',
      DIR_REF1: '',
      TEL_REF1: '',
      NOMBRE_REF2: '',
      CLASE_REF2: '',
      DIR_REF2: '',
      TEL_REF2: '',
      NOMBRE_REF3: '',
      CLASE_REF3: '',
      DIR_REF3: '',
      TEL_REF3: '',
      NOMBRE_CIU_RES: '',
      NOMBRE_BARRIO: '',
      NOMBRE_ZONA: '',
      NOMBRE_BARRIO_RES: ''
    };
    this.itemSolicitud = [...this.itemSolicitud, itemNuevo];

  }

  async actualizarDatos(): Promise<void> {
    // Validar formulario
    const valid = this.formDatosCliente?.instance.validate().isValid;
    
    // Guarda imagenes primero
    const imgGuardadas: ImageFile[]  = this.documentosImg;
    if (imgGuardadas.length !== 0) {
      const apiRest = this._generales.uploadImages("CXC-220", imgGuardadas, "CXC-220");
      await lastValueFrom(apiRest, { defaultValue: true })
        .then(res => {
          const msg = "ok";
        })
        .catch(err => {
          notify('Error al guardar las imágenes. No se ha guardado la aplicación.','error', 2000);
          return;
        });
    }

    // Guarda PDFs primero
    const pdfGuardados: PdfFile[]  = this.documentosPdf;
    if (pdfGuardados.length !== 0) {
      const apiRest = this._generales.uploadPdfs("CXC-220", pdfGuardados, "CXC-220");
      await lastValueFrom(apiRest, { defaultValue: true })
        .then(res => {
          const msg = "ok";
        })
        .catch(err => {
          notify('Error al guardar los PDFs. No se ha guardado la aplicación.','error', 2000);
          return;
        });
    }

    // Guardar info de los adjuntos en la aplicación y requerimientos
    let archivosAdjuntosImg: any = imgGuardadas.map(img => 
      ({ NombreArch: img.name, Contenedor: img.item, AplContenedor: img.app, TipoArchivo: img.type  }));
    let archivosAdjuntosPdf: any = pdfGuardados.map(pdf => 
      ({ NombreArch: pdf.name, Contenedor: pdf.item, AplContenedor: pdf.app, TipoArchivo: pdf.type  }));
    

    if (valid) {
      // Implementar servicio de guardado
      const prmData = {
        SOLICITUD: this.solicitud,
        ITM_SOLICITUD: this.itemSolicitud,
        PRODUCTOS: this.productos,
        DESCUENTOS_CARGOS: this.descuentosCargos,
        FIANZAS: this.fianzasSeguros,
        DOCUMENTOS_IMG: archivosAdjuntosImg,
        DOCUMENTOS_PDF: archivosAdjuntosPdf,
        USUARIO: localStorage.getItem('usuario'),
        FINANCIACION: this.datosFinanciacion,
        TABLA_CUOTAS: this.tablaCuotas,
      };

      this._sdatos.save('new', prmData, "CXC-220").subscribe({
        next: (data: any) => {
          const res = JSON.parse(data.data);
          if (res[0].ErrMensaje === '') {
            notify('Datos actualizados correctamente', 'success', 2000);
            this.readOnly = true;
            this.modoEdicion = false;
          } else {
            const errMsg = '<table style="display: flex; justify-content: center;text-align: left; border-collapse: collapse;">'+
                           '<tr><td>' + 
                           res[0].ErrMensaje.split('|').join('</td></tr><tr><td>') + 
                           '</td></tr></table>';
            this.showModal('','Error al actualizar datos',errMsg);
          }
        },
        error: (err: any) => {
          notify('Error al actualizar datos: '+err.message, 'error', 2000);
        }
      });
    } else {
      notify('Por favor complete los campos requeridos', 'warning', 2000);
    }
  }

  mostrarPopupAcciones(): void {
    this.popupAutorizacion.instance.show();
  }

  aceptarAutorizacion(): void {
    if (this.usuarioAutorizacion && this.claveAutorizacion) {
      // TODO: Validar credenciales
      // this.authService.validarUsuario(this.usuarioAutorizacion, this.claveAutorizacion)
      //   .subscribe(valid => {
      //     if (valid) {
      //       this.popupAutorizacion.instance.hide();
      //       // Ejecutar acción autorizada
      //     } else {
      //       notify('Credenciales inválidas', 'error', 2000);
      //     }
      //   });

      this.popupAutorizacion.instance.hide();
      notify('Autorización exitosa', 'success', 2000);
    } else {
      notify('Complete todos los campos', 'warning', 2000);
    }
  }

  cancelarAutorizacion(): void {
    this.popupAutorizacion.instance.hide();
    this.usuarioAutorizacion = '';
    this.claveAutorizacion = '';
  }

  onSelectionChangedPanel(e) {
    const tabPanelElement = e.component.element();
    const items = e.component.option("items");
    const selectedIndex = e.component.option("selectedIndex");

    const tabElements = tabPanelElement.querySelectorAll(".dx-tab");
    tabElements.forEach((tabElement: HTMLElement, index: number) => {
      tabElement.style.backgroundColor = ""; // Reset to default
    });

    if (tabElements[selectedIndex]) {
      const selectedTabElement = tabElements[selectedIndex];
      const selectedColor = items[selectedIndex].color;
      selectedTabElement.style.backgroundColor = "#74b8eb";
    }
  }
  onInitializedPanel(e) {
    this.tabPanelElement = e.component.element();
  }

  onImagenChanged(images: ImageFile[]): void {
    this.documentosImg = images;
    console.log('Imagenes actualizados:', images);
  }

  onDocumentosPdfChanged(pdfs: PdfFile[]): void {
    this.documentosPdf = pdfs;
    console.log('Documentos PDF actualizados:', pdfs);
  }

  onSeleccRowProducto(e, cellInfo, datacompo) {

    if (e.selectedRowKeys[0]){
      // Producto seleccionado
      const proSelecc = e.selectedRowKeys[0];
      const precio = this.productosDataSource.find( (prod:any) => prod.PRODUCTO === proSelecc )?.PRECIO || 0;
      this.gridProductos.instance.cellValue(cellInfo.rowIndex, "VALOR", precio);
      cellInfo.data.VALOR = precio;
      cellInfo.data.PRODUCTO = proSelecc;
      const nompro = this.productosDataSource.find( (prod:any) => prod.PRODUCTO === proSelecc )?.NOMBRE_PRODUCTO || "";
      this.gridProductos.instance.cellValue(cellInfo.rowIndex, "PRODUCTO", proSelecc);
      cellInfo.data.NOMBRE = nompro;
      this.gridProductos.instance.cellValue(cellInfo.rowIndex, "NOMBRE", nompro);
    }

  }
  
  refreshClick(objeto) {
    // this.checkProSoloPrecio.instance.option("value", false);
    // this.checkProProveedor.instance.option("value", false);
    this.valoresObjetos('productos');
  }

  /** Carga objetos */
  valoresObjetos(obj: string, opcion: any = undefined) {
    
    if (obj === 'consecutivo' || obj === 'ref') {
      const prm = { ID_APLICACION : 'CXC-220', 
                    USUARIO: localStorage.getItem('usuario')
                  };
      this._sdatos
        .consulta('consecutivo', prm, 'CXC-220')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.solicitud.ID_DOCUMENTO = res[0].ID_DOCUMENTO;
          this.solicitud.CONSECUTIVO = res[0].CONSECUTIVO;
          this.solicitud.DOCUMENTO = res[0].DOCUMENTO;
          this.solicitud.ID_UN_ITEM = res[0].ID_UN_ITEM;
        });
    }

    if (obj === 'solicitudes' || obj === 'todos') {
      const prm = { ID_APLICACION : 'CXC-220', 
                USUARIO: localStorage.getItem('usuario')};
      this._sdatos.consulta('solicitudes', prm, 'CXC-220').subscribe(data => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DListaSolicitudes = res;
        this.DSolicitudes = new DataSource({
          store: res,  
          paginate: true,
          pageSize: 20
        });
      });
    }

    if (obj === 'productos' || obj === 'ref') {
      const prm = {ID_LISTA: this.solicitud.ID_CONDICION, 
                   TIPO: "CONDICION",
                   PLAZO: 1,
                   CON_EXIS: "NO",
                   ID_UN_BODEGA: ''
                  };
      const accion = 'PRODUCTOS LISTA PRECIOS';
      this._sdatos.consulta(accion, prm, 'PRO-022').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.productosDataSource = res;
      });
    }

    if (obj === 'oficinas pago' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('CLIENTES',{CLASE: 'Pagaduria'},'VEN-001').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DOficinasPago = res;
      });
    }

    if (obj === 'entidades fianzas' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('PROVEEDORES',{CONSULTA:'basica',CLASE: 'Afianzadora'},'CXP-200').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DEntidades = res.map(ent => ({ ID_PROVEEDOR: ent.ID_PROVEEDOR, PROVEEDOR: ent.ID_PROVEEDOR+'; '+ent.NOMBRE_COMPLETO }));
      });
    }

    if (obj === 'cargar solicitud' || obj === 'ref') {
      const prm = opcion;
      this._sdatos.consulta('solicitud credito',prm,'CXC-220').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.solicitud = res.SOLICITUD;
        this.solicitud.ID_UN_ITEM = this.solicitud.ID_UN_ITEM;
        this.itemSolicitud = res.ITEMS_SOLICITUD;
        this.listaAsociados = res.LISTA_ASOCIADOS;
        this.listaAsociados.push({ id: 10, name: "<Nuevo Codeudor>", asociado: "<Nuevo Codeudor>" }); 
        this.tablaCuotas = res.TABLA_CUOTAS;
        this.datosFinanciacion = (res.TABLA_FIN.PARAMETROS ? JSON.parse(res.TABLA_FIN.PARAMETROS) : []);
        this.nombreTitular = this.itemSolicitud.find(item => item.CALIDAD === 'TITULAR')?.NOMBRE1 + ' ' + this.itemSolicitud.find(item => item.CALIDAD === 'TITULAR')?.APELLIDO1;
        // Datos del titular/codeudor
        this.itemSolicitud = res.ITEMS_SOLICITUD;
        this.valueCiudadId = this.itemSolicitud[this.nItemSolicitud].ID_UBICACION;
        this.valueCiudadRes = this.itemSolicitud[this.nItemSolicitud].ID_UBICACION_RES;
        this.valueBarrio = this.itemSolicitud[this.nItemSolicitud].BARRIO;
        this.valueZona = this.itemSolicitud[this.nItemSolicitud].ZONA;
        this.customValue = true;
        // Datos del productos
        this.productos = res.ITEMS_PRO;
        this.descuentosCargos = res.ITEMS_DYC;
        this.readOnly = false;
        this.asociadoSeleccionado = "TITULAR";
        this.nItemSolicitud = 0;
        // Documentos imagenes y PDFs
        const docsImg = res.ITEMS_IMG ?? [];
        const docsPdf = res.ITEMS_PDF ?? [];

        // Carga las imagenes y pdfs adjuntos
        this.documentosPdf = [];
        this.documentosImg = [];
        if (docsImg && docsImg.length > 0) {
          const adjuntosArch = docsImg;
          adjuntosArch.forEach((adj: any) => {
            // convertir imagen de data url a imagebase64
            this.documentosImg.push({
              id: this.generateId(),
              name: adj.name,
              url: this.endPointArchivos+'/img/CXC-220/'+
                    'CXC-220'+'/'+
                    this.solicitud.DOCUMENTO+'__'+this.nItemSolicitud+'__'+adj.name, 
              file: adj.name,
              size: 0,
              type: adj.type || 'image/png',
              app: adj.app || 'image',
              item: this.solicitud.DOCUMENTO+'__'+this.nItemSolicitud
            });

            });
        }
        if (docsPdf && docsPdf.length > 0) {
          const adjuntosArch = docsPdf;
          adjuntosArch.forEach((adj: any) => {
            this.documentosPdf.push({
              id: this.generateId(),
              name: adj.name,
              url: this.endPointArchivos+'/img/CXC-220/'+
                    'CXC-220'+'/'+
                    this.solicitud.DOCUMENTO+'__'+this.nItemSolicitud+'__'+adj.name, 
              file: adj.name,
              size: 0,
              type: adj.type || 'application/pdf',
              app: adj.app || 'pdf',
              item: this.solicitud.DOCUMENTO+'__'+this.nItemSolicitud
            });
          });
        }


      });
    }

    if (obj === 'clientes'  || obj === 'todos' || obj === 'ref') {
      const prm = {ID_CLIENTE: opcion}
      this._sdatos.consulta('CLIENTES',prm,'VEN-001').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }

        this.DClientes = new DataSource({
          store: res,
          paginate: true,
          pageSize: 20
        });

      });
    }

    if (obj === 'existe cliente' || obj === 'ref') {
      const prm = {ID_CLIENTE: opcion}
      this._sdatos.consulta('existe cliente',prm,'CXC-220').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje === '') {
          this.itemSolicitud[this.nItemSolicitud].NOMBRE1 = res[0].NOMBRE1;
          this.itemSolicitud[this.nItemSolicitud].APELLIDO1 = res[0].APELLIDO1;
          this.itemSolicitud[this.nItemSolicitud].NOMBRE2 = res[0].NOMBRE2;
          this.itemSolicitud[this.nItemSolicitud].APELLIDO2 = res[0].APELLIDO2;
          this.itemSolicitud[this.nItemSolicitud].DIR_RESIDENCIA = res[0].DIR_RESIDENCIA;
          this.itemSolicitud[this.nItemSolicitud].TEL_RESIDENCIA = res[0].TEL_RESIDENCIA;
          this.itemSolicitud[this.nItemSolicitud].ID_UBICACION = res[0].ID_UBICACION;
          this.itemSolicitud[this.nItemSolicitud].ID_UBICACION_RES = res[0].ID_UBICACION_RES;
          this.itemSolicitud[this.nItemSolicitud].BARRIO = res[0].BARRIO;
          this.itemSolicitud[this.nItemSolicitud].ZONA = res[0].ZONA;
          this.itemSolicitud[this.nItemSolicitud].CORREO_LABORA = res[0].CORREO_LABORA;
          this.valueCiudadId = res[0].ID_UBICACION;
          this.valueCiudadRes = res[0].ID_UBICACION_RES;
          this.valueBarrio = res[0].BARRIO;
          this.valueZona = res[0].ZONA;
        }
        else {
          this.itemSolicitud[this.nItemSolicitud].NOMBRE1 = '';
          this.itemSolicitud[this.nItemSolicitud].APELLIDO1 = '';
          this.itemSolicitud[this.nItemSolicitud].NOMBRE2 = '';
          this.itemSolicitud[this.nItemSolicitud].APELLIDO2 = '';
          this.itemSolicitud[this.nItemSolicitud].DIR_RESIDENCIA = '';
          this.itemSolicitud[this.nItemSolicitud].TEL_RESIDENCIA = '';
          this.itemSolicitud[this.nItemSolicitud].ID_UBICACION = '';
          this.itemSolicitud[this.nItemSolicitud].ID_UBICACION_RES = '';
          this.itemSolicitud[this.nItemSolicitud].BARRIO = '';
          this.itemSolicitud[this.nItemSolicitud].ZONA = '';
          this.itemSolicitud[this.nItemSolicitud].CORREO_LABORA = '';
          this.valueCiudadId = '';
          this.valueCiudadRes = '';
          this.valueBarrio = '';
          this.valueZona = '';
        } 
      });
    }

    if (obj === 'adc' || obj === 'todos' || obj === 'ref') {
      const prm = {ESTADO:'ACTIVO'}
      this._sdatos.consulta('ADC',prm,'VEN-006').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.vendedoresDataSource = res;
      });
    }

    if (obj === 'fianza seguros' || obj === 'todos' || obj === 'ref'){
      const prm = {ID_DOMINIO: 'CREDITO', ID_GRUPO_DOMINIO: 'FIANZAS'};
      this._sdatos
        .consulta('ITM_DOMINIOS', prm, 'ADM012')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.fianzasSeguros = res.map((item: any) => ({ CONCEPTO: item.VALOR1, APLICAR: false, PORCENTAJE: 0, VALOR: 0 }));
        });
    }

    /*
    if (obj === 'gravamenes' || obj === 'ref'){
      var prm = {};
      if (opcion !== 'original')
        prm = { FACTURA: this.DFactura, 
                ITEMS: this.DFacturaItems, APL_GRAV: opcion};
      else
        prm = { FACTURA: this.DFactura, 
                ITEMS: this.DFacturaItems, OPCION_GRAV: opcion};
      this._sdatos
        .consulta('GRAVAMENES', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          // this.DFacturaGrav = res.ITEMSGRAV;
          // if(this.DFacturaGrav !== undefined && this.DFacturaGrav.length > 0){
          //   this.DFacturaGravAux = this.DFacturaGrav.filter(e => e.APLICACION === 1);
          //   this.TOT_GRAV = this.DFacturaGravAux.reduce((n, {VALOR}) => n + VALOR, 0);
          // }else{
          //   this.DFacturaGravAux = [];
          // }
          this.DFacturaGrav = res[0].ENCAB ? res[0].ENCAB : [];
          this.DFacturaGravAux = res[0].ITEMS ? res[0].ITEMS : [];
          this.TOT_GRAV = this.DFacturaGrav.reduce((sum: any, item: any) => sum + item.VALOR, 0);
          this.calcularValores();
          // this.setDFacturaItemsValues(res.ITEMS);

          // Aplica a los items
          if (opcion !== undefined) {
            this.DFacturaItems.forEach(item => {
              const nx = this.DFacturaGravAux.findIndex(gi => gi.ITEM == item.ITEM);
              if (nx > -1) {
                item.VALOR_IVA = this.DFacturaGravAux[nx].VALOR_IVA;
                item.SUB_TOTAL = this.DFacturaGravAux[nx].SUB_TOTAL;
                item.TOTAL = this.DFacturaGravAux[nx].TOTAL;
                item.GRAVAMENES = this.DFacturaGravAux[nx].GRAV_TOTAL;
                item.GRAV_TOTAL = this.DFacturaGravAux[nx].GRAV_TOTAL;
              }
            });
          }

        });
    }

    if (obj === 'direcciones' || obj === 'ref') {
      this._sdatos.consulta('DIRECCIONES CLIENTE',{ID_CLIENTE: this.DFactura.ID_CLIENTE},'VEN-001').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DDirecciones = res;
        if (this.DDirecciones.length == 1 ){
          this.DFactura.DIRECCION = this.DDirecciones[0].DIRECCION;
          this.sbIdDireccion = this.DFactura.DIRECCION;
        }          
      });
    }
      */

    if (obj === 'un' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('UNIDADES NEGOCIOS',
                            { ESTADO: 'ACTIVO', 
                              USUARIO: this.usuario,
                              ID_APLICACION: 'CXC-220'
                            },'ADM-002').
                            subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DUnidadesNegocios = res;
      });
    }

    if (obj == 'ciudades' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('ubicaciones', 
                            { TIPO_UBICACION: 'Ciudad'
                            }, 
                            'ADM-006').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DCiudades = res;

      });
    }

    if (obj == 'barrios' || obj === 'ref') {
      this._sdatos.consulta('ubicaciones', 
                            { TIPO_UBICACION: 'Barrio',
                              CIUDAD: this.itemSolicitud[this.nItemSolicitud].ID_UBICACION_RES
                            }, 
                            'ADM-006').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DBarrios = res;

      });
    }

    if (obj == 'zonas' || obj === 'ref') {
      this._sdatos.consulta('ubicaciones', 
                            { TIPO_UBICACION: 'Dependiente',
                              BARRIO: this.itemSolicitud[this.nItemSolicitud].BARRIO,
                            }, 
                            'ADM-006').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DZonas = res;

      });
    }

    /*
    if (obj === 'monedas' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('MONEDAS',{ESTADO: 'ACTIVO'},'ADM-004').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DMonedas = res;
      });
    }

    if (obj == 'especificaciones' || obj == 'todos') {
      this._sdatos.consulta('ESPECIFICACIONES',
        {
          ID_APLICACION: this.prmUsrAplBarReg.aplicacion,
          USUARIO: this.prmUsrAplBarReg.usuario,
          ID_APLICACION_BASE: ''
        },
        'ADM-011')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.especAplicacion = res;
          this.valoresDefecto();

        });
    }
        */

    if (obj === 'condiciones' || obj === 'ref') {
      this._sdatos.consulta('CONDICIONES LISTAS',
                             {ID_ADC: this.solicitud.ID_ADC, 
                              TIPO_VENTA: "CREDITO", 
                              ESTADO: 'ACTIVO'},
                              'VEN-212').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.condicionesDataSource = res;
        if(this.condicionesDataSource[0].CODIGO === null){
          showToast('El Vendedor seleccionado no tiene Condiciones de Venta asociadas', 'warning');
        }
        if(this._sdatos.accion === 'r_buscar'){
          this.DPlazos = JSON.parse(this.condicionesDataSource.find(e => e.CODIGO === this.solicitud.ID_CONDICION).PLAZOS);
        }
      });
    }

    /*
    if (obj === 'moneda def' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('ESPECIFICACIONES',{ID_ESPECIFICACION: 'OBJETOS', ID_APLICACION: 'GENERAL', NOMBRE_OBJETO: 'DEF_MONEDA'}, 'ADM-011').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DMonedaDef = res;
        if(this.DMonedaDef != null){
          this.MONEDA_DEF = this.DMonedaDef[0].VALOR_DEFECTO
          this.gridBoxMoneda = [this.MONEDA_DEF];
          this.DFactura.ID_MONEDA = this.MONEDA_DEF;
        }
      });
    }

    if (obj === 'un def' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('UN DEFECTO',{USUARIO: this.prmUsrAplBarReg.usuario}, 'ADM-015').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if(res != null && res.length > 0){
          this.UN_DEF = res[0].ID_UN;
          this.gridBoxUN = [this.UN_DEF];
          this.DFactura.ID_UN_ITEM = this.UN_DEF;
        }
      });
    }

    if (obj === 'formato moneda' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('ESPECIFICACIONES',{ID_ESPECIFICACION: 'OBJETOS', ID_APLICACION: 'GENERAL', NOMBRE_OBJETO: 'FORMATO MONEDA'}, 'ADM-011').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.MONEDA_FORMATO = res[0].FORMATO;
      });
    }

    if (obj === 'formato cantidad' || obj === 'todos' || obj === 'ref') {
      this._sdatos.consulta('ESPECIFICACIONES',{ID_ESPECIFICACION: 'OBJETOS', ID_APLICACION: 'GENERAL', NOMBRE_OBJETO: 'FORMATO CANTIDAD'}, 'ADM-011').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined)){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.CANTIDAD_FORMATO = res[0].FORMATO;
      });
    }
      */
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  ngOnInit(): void {
    this.usuario = localStorage.getItem('usuario')??'';
    this.empresa = localStorage.getItem('empresa')??'';
    this.mnuAccion = '';
    this.readOnly = true;
    
    // this.accordionExpand = [false,false,false];
    this.valoresObjetos('todos');
    this.cargarDatos();

    this.DLSolicitud = new CustomStore({
      key: 'DOCUMENTO',
      
      load: (loadOptions: any) => {
        const skip = loadOptions.skip || 0;
        const take = loadOptions.take || 20;
        const searchValue = loadOptions.searchValue || '';
        const prm = { ID_APLICACION : 'CXC-220', 
                      USUARIO: localStorage.getItem('usuario'),
                      SKIP: skip,
                      TAKE: take,
                      SEARCH: searchValue
                    };

        return lastValueFrom(
          this._sdatos.consulta('lista solicitudes', prm, 'CXC-220')
        ).then((result) => {
          return {
            data: JSON.parse(result.data),
            totalCount: JSON.parse(result.data)[0].totalCount
          };
        }).catch(error => {
          console.error('Error loading data:', error);
          throw error;
        });
      },

      byKey: (key: any) => {
        // Cargar un item específico por su clave
        return lastValueFrom(
          this._sdatos.consulta('lista solicitudes', 1, key)
        ).then(result => result.data[0]);
      }
    });

  }

  ngOnDestroy(){
    this.subscription.unsubscribe();
  }

  // Adición de un nuevo asociado
  onTagAdded(tagData: any): void {      
    
    if (tagData.accion === 'add') {
      if (this.listaAsociados.length > 0 && this.listaAsociados[this.listaAsociados.length - 1].name.match("<Titular>|<Nuevo Codeudor>")) {
        this.showModal('Debe completar los datos del asociado antes de agregar uno nuevo.');
        return;
      }
      else {
        if (this.validarDatos()) {
          this.nItemSolicitud++;
          this.listaAsociados.push({ id: this.nItemSolicitud, name: '<Nuevo Codeudor>', asociado: '<Nuevo Codeudor>' });
          this.listaAsociados = [...this.listaAsociados]; // Crear una nueva referencia para detectar el cambio
          this.eventsSubjectAsociados.next(this.listaAsociados);          
          this.inicializaItemSolicitud('CODEUDOR');
          this.asociadoSeleccionado = "CODEUDOR "+this.nItemSolicitud;
          // this.formDatosCliente.instance.resetValues();
        }
        else
          this.showModal('Faltan datos del asociado o el asociado ya existe, por favor revise la información ingresada');
      }
    }

    if (tagData.accion === 'remove') {
      if (this.nItemSolicitud === 0) {
        showToast('No se puede eliminar el titular de la solicitud', 'error');
        return;
      }
      const index = this.listaAsociados.findIndex(a => a.id === this.nItemSolicitud);
      if (index >= 0) {

        // Eliminar el asociado de la lista de asociados según su id
        const ix = this.listaAsociados.findIndex(a => a.id == tagData.dato.id);
        let nuevoItems: any = [];
        let nuevoItemsSol: any = [];
        if (ix > 0 && ix < this.listaAsociados.length - 1) {
          nuevoItems = [
            ...this.listaAsociados.slice(0, ix - 1),
            ...this.listaAsociados.slice(ix + 1)
          ]
          nuevoItemsSol = [
            ...this.itemSolicitud.slice(0, ix - 1),
            ...this.itemSolicitud.slice(ix + 1)
          ]
        }
        if (ix > 0 && ix == this.listaAsociados.length - 1) {
          nuevoItems = [
            ...this.listaAsociados.slice(0, ix)
          ]
          nuevoItemsSol = [
            ...this.itemSolicitud.slice(0, ix)
          ]
        }
        this.listaAsociados = nuevoItems;
        this.itemSolicitud = nuevoItemsSol;
        this.nItemSolicitud = this.listaAsociados.length > 0 ? this.nItemSolicitud - 1 : 0;
        this.eventsSubjectAsociados.next(this.listaAsociados);
      }
    }

  }

  showModal(mensaje, titulo = '', html = '') {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
      title: titulo || '¡Error!',
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      html,
      stopKeydownPropagation: false,
    });
  }
  

}
