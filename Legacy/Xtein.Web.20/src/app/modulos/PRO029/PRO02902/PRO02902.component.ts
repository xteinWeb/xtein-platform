import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxDropDownButtonModule, DxLoadPanelModule, DxNumberBoxModule, DxPopupModule, DxToolbarModule, DxTooltipComponent, DxTooltipModule, DxTreeListComponent, DxTreeListModule } from 'devextreme-angular';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { PRO029Service } from 'src/app/services/PRO029/PRO029.service';
import { PRO0290201Component } from "./PRO0290201/PRO0290201.component";
import { validatorRes } from 'src/app/shared/validator/validator';
import { showToast } from 'src/app/shared/toast/toastComponent';
import dxCheckBox from 'devextreme/ui/check_box';
import { FemailComponent } from 'src/app/shared/femail/femail.component';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { SocketService } from 'src/app/services/socket/socket.service';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { libtools } from 'src/app/shared/common/libtools';
import { on } from 'devextreme/events';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-PRO02902',
  templateUrl: './PRO02902.component.html',
  styleUrls: ['./PRO02902.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxTreeListModule, DxToolbarModule, DxCheckBoxModule, DxButtonModule, DxLoadPanelModule,
    PRO0290201Component, FemailComponent, DxDropDownButtonModule, DxTooltipModule, DxPopupModule, DxDropDownBoxModule,
    MatDividerModule, DxDateBoxModule, DxNumberBoxModule
  ]
})
export class PRO02902Component {

  @ViewChild("gridTablaAgenda", { static: false }) gridTablaAgenda: DxDataGridComponent;
  @ViewChild("treeListAgenda", { static: false }) treeListAgenda: DxTreeListComponent;
  @ViewChild("tooltipInfoDetalles", { static: false }) tooltipInfoDetalles: DxTooltipComponent;

  @Input() events: Observable<any>;
  @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();
  datosPass: Subject<any> = new Subject<any>();

  eventsSubjectEnvioCorreo: Subject<any> = new Subject<any>();
  private eventsSubscription: Subscription;

  prmUsrAplBarReg: clsBarraRegistro;
  // Datos reporte
  rpt_id_reporte: string;
  rpt_archivo: string;
  rpt_datosrpt: any;
  rpt_registro: string;
  listaReportes: any[] = [];

  DGAgenda: any[] = [];
  DGAgenda_prev: any[] = [];
  DGsecciones: any[] = [];
  ATRIBUTOS_PMP: any[] = [];
  columnVisibles: any = [];
  selectedRowKeysGrid: any = [];

  ORDEN_PRODUCCION: any = {};
  USUARIO_LOCAL: any = '';
  especAplicacion: any;
  ltool: any;

  readOnly: boolean = true;
  visibleSelectGrid: boolean = false;
  loadingVisible: boolean = true;

  openDropFiltro: boolean = false;
  filtroMaestro: any = [
    { ID: 1, DESCRIPCION: 'Cliente', VALOR: false },
    { ID: 2, DESCRIPCION: 'Plan', VALOR: false },
    { ID: 3, DESCRIPCION: 'Producto', VALOR: false }
  ];


  targetIdTooltip: string;
  tooltipInfo: any = [];
  wrapperAttr = { class: "cls-tooltip-reg" };
  popupTitulo: string = '';
  popupContenido: string = '';
  popupAccion: string = '';
  popupAccionGrid: string = '';
  popupData: any = null;
  selectPlanPopup: any = [];
  openPlanPopup: boolean = false;
  NOW: any = null;
  FECHA_INICIO_POPUP: any = null;
  FECHA_FIN_POPUP: any = null;
  FECHA_DIA_POPUP: any = null;
  DGplanes: any[] = [];
  selectPlanes: any[] = [];
  openPlanes: boolean = false;

  popupReprogramarVisible = false;
  popupFiltroAtrVisible = false;

  popupVisibleSeccion: boolean = false;
  fechaInicioSeccion: Date | string | number | null = null;
  fechaFinSeccion: Date | string | number | null = null;

  // El objeto que almacena los datos de la fila/sección actual para el popup
  popupDataSeccion: any = {};
  popupAccionSeccion: string = ''; // 'finalizar' | 'reprogramar' | 'cancelar' | 'disponible'
  popupTituloSeccion: string = '';
  popupSeccionVisible: boolean = false;

  elementosHijosSeccion: any[] = [];
  elementoPadreActual: any = null;
  seccionActual: any = null;
  todoSeleccionado: boolean = false;

  constructor(
    private sData: PRO029Service,
    private _sgenerales: GeneralesService,
    public socket: SocketService,
    private _sbarreg: SbarraService,
    private tabService: TabService,
    private datePipe: DatePipe,
  ) {
    this.ltool = new libtools(this._sbarreg, this.tabService);

    this.selectCellTemplate = this.selectCellTemplate.bind(this);
  }

  ngOnInit(): void {
    this.loadingVisible = true;
    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase();
    this.NOW = new Date();
    // this.valoresObjetos('secciones', '');
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.accion) {
        case 'init':
          // this.ACCION_LOCAL = datos.accion;
          // this.loadDataInit(datos);
          this.readOnly = datos.readOnly;
          break;

        case 'consulta':
          // this.ACCION_LOCAL = datos.accion;
          // this.loadDataInit(datos);
          break;

        case 'Load Data Secciones':
          // this.addColumn(data.dataSource);
          this.DGsecciones = datos.dataSource;
          break;

        case 'Load Data':
          this.readOnly = datos.readOnly;
          // this.ACCION_LOCAL = datos.accion;
          this.loadDataInit(datos);
          break;

        case 'imprimir':
          switch (datos.prm.operacion.modo) {
            case 'previsualizar':
              this.imprimirReporte(datos.prm.operacion);
              break;
            case 'pdf':
              this.generarPDF(datos.prm.operacion);
              break;
            case 'email':
              this.rpt_id_reporte = datos.prm.operacion.id_reporte,
                this.rpt_archivo = datos.prm.operacion.archivo,
                this.rpt_datosrpt = datos.prm.operacion.data_rpt;
              this.enviarEmailPDF();
              break;

            default:
              break;
          }
          break;

        default:
          break;
      }
      this.valoresObjetos('todos', '');
    });
  }

  ngOnDestroy() {
    // this.subscription.unsubscribe();
  }


  loadDataInit(data: any) {
    switch (data.accion) {
      case 'init':

        break;

      case 'consulta':

        break;

      case 'Load Data':
        // this.addColumn(data.dataSource);
        this.loadData(data.dataSource);
        if (data.barra)
          this.prmUsrAplBarReg = data.barra;
        break;

      case 'Limpiar':
        if (data.barra)
          this.prmUsrAplBarReg = data.barra;

        this.opBlanquearForma()
        break;

      default:
        break;
    }
  }

  loadData(dataSource: any) {
    console.log(dataSource);
    this.loadingVisible = true;
    this.DGAgenda_prev = dataSource.PRODUCTOS;
    // this.DGAgenda = dataSource;
    this.ATRIBUTOS_PMP = [];
    for (let i = 0; i < dataSource.ATRIBUTOS.length; i++) {
      // res[i].ITEM = i;
      if (typeof dataSource.ATRIBUTOS === "string") {
        const parsed = JSON.parse(dataSource.ATRIBUTOS);
        dataSource.ATRIBUTOS.ATRIBUTOS = Array.isArray(parsed) ? parsed : [parsed];
      }
      dataSource.ATRIBUTOS.forEach((attr: any) => {
        if (!this.ATRIBUTOS_PMP.some((a: any) =>
          a.CODIGO === attr.CODIGO &&
          a.NOMBRE_ATRIBUTO === attr.NOMBRE_ATRIBUTO &&
          a.VALOR === attr.VALOR
        )) {
          this.ATRIBUTOS_PMP.push(attr);
        }
      });
    }
    this.addColumn(dataSource.PRODUCTOS);
    // this.gridTablaAgenda.instance.refresh();
    this.treeListAgenda.instance.refresh();
  }

  opBlanquearForma() {
    this.DGAgenda = [];
    this.DGAgenda_prev = [];
    this.treeListAgenda.instance.refresh();
  }

  maxSections: number = 0;
  addColumn(data: any) {
    const processedData: any[] = [];

    for (const element of data) {
      let newElement = { ...element };

      if (newElement.SECCIONES && Array.isArray(newElement.SECCIONES)) {
        newElement.SECCIONES.sort((a: any, b: any) => a.ORDEN_SECC - b.ORDEN_SECC);
      }
      processedData.push(newElement);
    }

    this.DGAgenda = processedData;
  }
  public getArrayOfSize(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  getSectionIndex(dataField: string): string {
    const match = dataField.match(/SECCION_(\d+)_ESTADO/);
    return match ? match[1] : '';
  }

  getSectionColor(status: string, type: 'background' | 'color'): string {
    if (!status) return '';

    const estado = status.toUpperCase();

    // Mapeo de colores de fondo (background-color)
    const backgroundMap: { [key: string]: string } = {

      'REGISTRADO': 'rgba(255,255,255)',
      'PROYECTADO': 'rgba(128, 178, 200, .1)',
      'COMPROMETIDO': 'rgba(128, 178, 200, .1)',
      'PROGRAMADO': 'rgba(255,255,255)',
      'EN PROCESO': 'rgba(255,115,232,.2)',
      'ANULADO': 'rgba(200,78,224,.2)',
      'FINALIZADO': 'rgba(53,204,172,.2)',
    };

    // Mapeo de colores de texto (color)
    const colorMap: { [key: string]: string } = {
      'REGISTRADO': 'rgba(98,121,140,.9)',
      'PROYECTADO': 'rgba(100, 150, 170, 0.8)',
      'COMPROMETIDO': 'rgba(100, 150, 170, 0.8)',
      'PROGRAMADO': 'rgba(98,121,140,.75)',
      'EN PROCESO': 'rgba(26,115,232,1)',
      'ANULADO': 'rgba(200,78,224,1)',
      'FINALIZADO': 'rgba(53,204,172,1)',
    };

    if (type === 'background') {
      return backgroundMap[estado] || '';
    } else if (type === 'color') {
      return colorMap[estado] || '';
    }

    return '';
  }

  formatDates(rowData: any, dataField: string): string {
    // 1. Obtener el índice de la sección
    const index = this.getSectionIndex(dataField);
    if (!index) return '';

    const iniProdField = `SECCION_${index}_INI_PROD`;
    const finProdField = `SECCION_${index}_FIN_PROD`;
    const iniProgField = `SECCION_${index}_INI_PROG`;
    const finProgField = `SECCION_${index}_FIN_PROG`;


    const format = (dateValue: string | null): string => {
      if (!dateValue) return 'N/A';

      const date = new Date(dateValue);

      return date.toLocaleDateString('es-ES', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    let output = '';
    const hasRealData = rowData[iniProdField] || rowData[finProdField];
    const hasProgData = rowData[iniProgField] || rowData[finProgField];

    //  Fechas de Producción (Real)
    if (hasRealData) {
      const iniProd = format(rowData[iniProdField]);
      const finProd = format(rowData[finProdField]);
      output += `${iniProd} — ${finProd}`;
    }

    // Fechas Programadas
    if (hasProgData) {
      const iniProg = format(rowData[iniProgField]);
      const finProg = format(rowData[finProgField]);

      if (output) output += ' | '; // Agrega separador si ya hay datos reales
      output += `${iniProg} — ${finProg}`;
    }

    return output;
  }

  formatSingleSectionDates(seccion: any): string {
    const format = (dateValue: string | null): string => {
      if (!dateValue) return 'N/A';
      const date = new Date(dateValue);
      return date.toLocaleDateString('es-ES', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    let output = '';

    // Fechas de Producción (Real)
    const iniProd = format(seccion.FECHA_INICIO_PRODUCCION);
    const finProd = format(seccion.FECHA_FIN_PRODUCCION);
    const hasRealData = iniProd !== 'N/A' || finProd !== 'N/A';

    if (hasRealData) {
      output += `REAL: ${iniProd} — ${finProd}`;
    }

    // Fechas Programadas
    const iniProg = format(seccion.FECHA_INICIO_PROGRAMADA);
    const finProg = format(seccion.FECHA_FIN_PROGRAMADA);
    const hasProgData = iniProg !== 'N/A' || finProg !== 'N/A';

    if (hasProgData) {
      if (output) output += ' | ';
      output += `PROG: ${iniProg} — ${finProg}`;
    }

    return output;
  }

  nameSeccion: string = "";

  finalizarSeccion(data: any, cellInfo?: any) {
    console.log('Finalizar sección:', data);
    this.nameSeccion = data.NOMBRE_SECCION;
    this.seccionActual = data;
    console.log(cellInfo)
    // Si tenemos información del elemento padre
    if (cellInfo) {
      this.elementoPadreActual = cellInfo;
      this.cargarElementosHijos(cellInfo);
    }

    this.popupVisibleSeccion = true;
  }

  cargarElementosHijos(elementoPadre: any): void {
    // Buscar todos los elementos hijos que coincidan con el nombre del elemento padre
    this.elementosHijosSeccion = this.DGAgenda.filter((elemento: any) =>
      elemento.PRODUCTO === elementoPadre.ID_PARTE &&
      elemento.PRODUCTO !== 'RAIZ' &&
      elemento.SECCIONES &&
      elemento.SECCIONES.some((seccion: any) =>
        seccion.NOMBRE_SECCION === this.nameSeccion
      )
    ).map((elemento: any) => ({
      ...elemento,
      SELECCIONADO: false // Por defecto no seleccionado
    }));

    console.log('Elementos hijos encontrados:', this.elementosHijosSeccion);
    console.log('Elemento padre:', elementoPadre);
    console.log('Nombre sección buscada:', this.nameSeccion);
  }

  onSeleccionarHijo(event: any, hijo: any): void {
    hijo.SELECCIONADO = event.value;
    console.log('Hijo seleccionado/deseleccionado:', hijo);
  }

  onSeleccionarTodo(event: any): void {
    const valorSeleccion = event.value;
    this.todoSeleccionado = valorSeleccion;

    // Actualizar todos los elementos hijos
    this.elementosHijosSeccion.forEach((hijo: any) => {
      hijo.SELECCIONADO = valorSeleccion;
    });

    console.log('Seleccionar todo:', valorSeleccion);
  }

  guardarFechas(): void {
    if (this.fechaInicioSeccion && this.fechaFinSeccion) {
      // Obtener elementos seleccionados
      const elementosSeleccionados = this.elementosHijosSeccion.filter(
        elemento => elemento.SELECCIONADO
      );

      console.log('Fecha y hora de inicio:', this.fechaInicioSeccion);
      console.log('Fecha y hora de finalización:', this.fechaFinSeccion);
      console.log('Elementos seleccionados:', elementosSeleccionados);

      // Aquí puedes procesar los datos como necesites
      const datosGuardar = {
        seccion: this.seccionActual,
        fechaInicio: this.fechaInicioSeccion,
        fechaFin: this.fechaFinSeccion,
        elementosSeleccionados: elementosSeleccionados,
        elementoPadre: this.elementoPadreActual
      };

      console.log('Datos a guardar:', datosGuardar);

      // Limpiar y cerrar popup
      this.limpiarDatosPopup();
      this.popupVisibleSeccion = true;
    } else {
      showToast('Por favor, selecciona ambas fechas y horas.', 'warning');
    }
  }

  cancelar(): void {
    this.limpiarDatosPopup();
    this.popupVisibleSeccion = false;
  }

  limpiarDatosPopup(): void {
    this.fechaInicioSeccion = null;
    this.fechaFinSeccion = null;
    this.elementosHijosSeccion = [];
    this.elementoPadreActual = null;
    this.seccionActual = null;
    this.nameSeccion = "";
  }


  onCellPrepared(e: any) {

    if (
      e.rowType == "data" &&
      e.cellElement.querySelector(".dx-select-checkbox")
    ) {
      const check = e.cellElement.querySelectorAll(".dx-select-checkbox");
      check.forEach((ele: any, ixfila: any) => {
        const inst = dxCheckBox.getInstance(ele);
        if (e.data.ORDEN_PRODUCCION === '' && e.data.PRODUCTO === 'RAIZ')
          inst.option("visible", true);
        else
          inst.option("visible", false);
      });
    };
    if (e.rowType === "data") {
      const dataField = e.column?.dataField;
      e.cellElement.style.overflowWrap = 'break-word';
      if (!e.data.SECCIONES || !dataField) return;
      const seccion = e.data.SECCIONES.find((s: any) => s.ID_SECCION === dataField);
      if (!seccion) return;

      on(e.cellElement, "mouseover", (arg: any) => {
        const temData: any[] = e.data.SECCIONES.filter((d: any) => d.ID_SECCION === e.column.dataField);
        if (temData.length > 0)
          this.tooltipInfo = [{ ...temData[0], ORDEN_PRO: e.data.ORDEN_PRO }];
        if (this.tooltipInfo.length === 0) {
          this.tooltipInfo = [{ ErrMesaje: 'La sección no pertence a la ruta del producto.' }];
        }
        this.tooltipInfoDetalles.instance.show(arg.target);
      });
      on(e.cellElement, "mouseout", (arg: any) => {
        this.tooltipInfoDetalles.instance.hide();
        this.tooltipInfo = [];
        this.tooltipInfo = [{ ErrMesaje: '...' }];
      });

    }
    if (e.rowType === "group") {

      if (e.rowType === "group") {

        if (e.rowElement) {
          e.rowElement.classList.add('custom-group-row');
        }
      }
    }
    // if (e.rowType === "data" && e.column.command === "expand") {
    //   if ((!e.data.ORDEN_PRODUCCION || e.data.ORDEN_PRODUCCION === "") || (e.data.ESTADO !== 'REGISTRADO' || e.data.ESTADO !== 'PROGRAMADO')) {
    //     e.cellElement.innerHTML = "";
    //   }
    // }
  }

  onContentReady(e: any) {
    const gridInstance = e.component;
    const commandColumn = gridInstance.columnOption(0);

    // Si la primera columna es de tipo 'select' o 'comando'
    if (commandColumn && (commandColumn.type === 'select' || commandColumn.command === 'select')) {
      // Asignar un ancho fijo de 40px (suele ser suficiente)
      gridInstance.columnOption(0, 'width', 40);

      // También puedes forzar que esté fija si no lo está implícitamente
      gridInstance.columnOption(0, 'fixed', true);
      gridInstance.columnOption(0, 'fixedPosition', 'left');
    }

    // 2. Si las columnas ya están fijas, forzar un refresh para corregir el bug (como vimos antes)
  }

  onContextMenuPreparing(e: any) {
    if (e.row.rowType === "data" && e.row.data.PRODUCTO === 'RAIZ') {
      let items: any = [];
      const selectedItems = [e.row.key];

      if (selectedItems.length === 0) {
        items = [
          {
            text: "No hay filas seleccionadas.",
            disabled: true
          }
        ];
      } else {
        items.push(
          {
            text: "Cancelar",
            desabled: false,
            onClick: () => {
              this.popupTitulo = 'Cancelar ' + (e.row.data.PRODUCTO === 'RAIZ' ? '' : e.row.data.PRODUCTO + ' - ') + e.row.data.NOMBRE_PRODUCTO;
              // this.popupAccionGrid = grid;
              this.popupAccion = 'cancelar';
              this.popupData = { ...e.row.data, FECHA_ANTERIOR: e.row.data.FECHA_ENTREGA };
              this.selectPlanPopup = [e.row.data.ID_PLAN];
              this.popupReprogramarVisible = true;
            }
          },
          {
            text: "Reprogramar",
            desabled: false,
            onClick: () => {
              this.popupTitulo = (e.row.data.PRODUCTO === 'RAIZ' ? '' : e.row.data.PRODUCTO + ' - ') + e.row.data.NOMBRE_PRODUCTO;
              this.popupAccion = 'reprogramar';
              // this.popupAccionGrid = grid;
              this.popupData = { ...e.row.data, FECHA_ANTERIOR: e.row.data.FECHA_ENTREGA };
              this.selectPlanPopup = [e.row.data.ID_PLAN];
              const npos: any = this.DGplanes.findIndex((d: any) => d.CONSECUTIVO === e.row.data.ID_PLAN);
              this.FECHA_INICIO_POPUP = this.DGplanes[npos].FECHA_INICIO;
              this.FECHA_FIN_POPUP = this.DGplanes[npos].FECHA_FINAL;
              this.FECHA_DIA_POPUP = e.row.data.FECHA_ENTREGA;
              this.popupReprogramarVisible = true;
              // showToast('Reprogramar Registro', 'warning');
            }
          }
        );
      }
      e.items = items;
    }
  }

  onValuechangedFiltro(e: any, check: any) {
    switch (check) {
      case 'Cliente':
        this.filtroMaestro[0].VALOR = e.value;
        this.onRespuestaComponent.emit({ accion: 'filtro', filtro: this.filtroMaestro });
        break;
      case 'Plan':
        this.filtroMaestro[1].VALOR = e.value;
        this.onRespuestaComponent.emit({ accion: 'filtro', filtro: this.filtroMaestro });
        break;
      case 'Producto':
        this.filtroMaestro[2].VALOR = e.value;
        this.onRespuestaComponent.emit({ accion: 'filtro', filtro: this.filtroMaestro });
        break;

      default:
        break;
    }
  }

  templateGroup: any = ['ID_PLAN', 'NOMBRE_PLAN', 'NOMBRE_CLIENTE', 'PRODUCTO', 'NOMBRE_PRODUCTO'];
  templateHtml(columna: any, element: string): any {
    // Si es grupo, busca el valor agrupado
    if (columna.row?.data?.key !== undefined && columna.row?.data?.dataField) {
      // Si el campo agrupado coincide con el solicitado, muestra el valor agrupado
      if (columna.row.data.dataField === element) {
        return columna.row.data.key;
      }
    }
    // Si hay items, muestra el valor del primer elemento
    const item = columna.row?.data?.items?.[0] || columna.row?.data?.collapsedItems?.[0];
    if (!item) return '';
    return item[element] ?? '';
  }

  templateHtmlRepro(data: any, element: any, component: string): any {
    if (data !== undefined && data !== null && data !== '') {
      let res: any = '';
      switch (element) {
        case 'POPUP_FECHA_ENTREGA':
        case 'FECHA_INICIO_POPUP':
        case 'FECHA_FIN_POPUP':
          res = data ? this.datePipe.transform(new Date(data), 'dd/MM/yyyy') : null;
          break;
        default:
          break;
      }
      return res;
    }
  }

  onSelectionChangedPlan(e: any, component: any) {
    if (component === 'GRID_POPUP') {
      if (e.selectedRowKeys.length > 0) {
        this.openPlanPopup = false;
        this.FECHA_INICIO_POPUP = new Date(e.selectedRowsData[0].FECHA_INICIO);
        this.FECHA_FIN_POPUP = new Date(e.selectedRowsData[0].FECHA_FINAL);
        this.FECHA_DIA_POPUP = null;
      } else {
        this.openPlanPopup = false;
        this.FECHA_INICIO_POPUP = null;
        this.FECHA_FIN_POPUP = null;
        this.FECHA_DIA_POPUP = null;
      }
    }
    if (component === 'DROP_POPUP' && (e.value === null || e.value === undefined || e.value === undefined)) {
      this.openPlanPopup = false;
      this.FECHA_INICIO_POPUP = null;
      this.FECHA_FIN_POPUP = null;
      this.FECHA_DIA_POPUP = null;
    }

  }

  onValueChangedFecha(e: any, tipo: any) {
    switch (tipo) {
      case 'POPUP':
        this.FECHA_DIA_POPUP = this.datePipe.transform(e.value, 'yyyy-MM-dd');
        this.popupData.FECHA_ENTREGA = new Date(e.value);
        break;

      default:
        break;
    }

  }

  onValueChangedCP(e: any, cellInfo: any, grid: string) {
    if (e.value > 0 && e.value <= cellInfo.data.CANTIDAD)
      cellInfo.data.COMPROMETIDO = cellInfo.data.COMPROMETIDO > 0 ? cellInfo.data.COMPROMETIDO - e.value : cellInfo.data.CANTIDAD - e.value;
    else
      cellInfo.data.CANTIDAD_PENDIENTE = cellInfo.data.CANTIDAD;

    this.popupData.CANTIDAD_PROGRAMADA = e.value;
    this.popupData.CANTIDAD_PENDIENTE = cellInfo.data.CANTIDAD_PENDIENTE ? cellInfo.data.CANTIDAD_PENDIENTE : 0;
  }

  openPopup() {
    // Generar lista única de ATRIBUTO/VALOR
    const set = new Map<string, any>();
    this.ATRIBUTOS_PMP.forEach((row: any) => {
      try {
        const arr = JSON.parse(row.ATRIBUTOS);
        arr.forEach((x: any) => {
          const key = `${x.ATRIBUTO}|${x.VALOR}`;
          if (!set.has(key)) {
            set.set(key, x);
          }
        });
      } catch { }
    });
    this.ATRIBUTOS_PMP = Array.from(set.values());
    this.popupFiltroAtrVisible = true;
  }

  applyFilter(mainGrid: any, filterGrid: any) {
    const selected = filterGrid.instance.getSelectedRowsData();
    if (selected.length > 0) {
      // construir filtro dinámico
      const filters = selected.map((s: any) =>
        ['ATRIBUTOS', 'contains', s.VALOR]  // aquí puedes ser más estricto: ATRIBUTO + VALOR
      );

      // combinar con OR
      const finalFilter = filters.reduce((acc, f) => acc ? [acc, 'or', f] : f, null);

      mainGrid.instance.filter(finalFilter);
    } else {
      mainGrid.instance.clearFilter();
    }
    this.popupFiltroAtrVisible = false;
  }

  templatefiltroAtr(group: any) {
    // return group.value + " - " + group.data?.items[0]?.NOMBRE_ATRIBUTO;
    let cad = "";
    if (group.row.data.items !== null) {
      if (group.row.data.items.length !== 0)
        cad = cad + (cad !== "" ? " " : "") + group.value + " - " + group.row.data.items[0].NOMBRE_ATRIBUTO;
    }
    if (group.row.data.collapsedItems !== undefined) {
      if (group.row.data.collapsedItems.length !== 0)
        cad = cad + (cad !== "" ? " " : "") + group.value + " - " + group.row.data.collapsedItems[0].NOMBRE_ATRIBUTO;
    }
    return cad;

  }

  selectCellTemplate(cellInfo: any, template: any) {
    let res: boolean = false;
    const dataField = cellInfo.column.dataField;
    // const res: boolean = cellInfo.data.hasOwnProperty(dataField);
    const npos: any = cellInfo.data.SECCIONES.findIndex((d: any) => d.ID_SECCION === dataField);
    switch (template) {
      case 'No Contenido':
        // res = !cellInfo.data.hasOwnProperty(dataField);
        if (npos <= -1)
          res = true;
        break;
      case 'Start Seccion':
        // res = cellInfo.data.hasOwnProperty(dataField);
        if (npos > -1)
          res = true;
        break;
      case 'Process Seccion':
        // res = (cellInfo.data.hasOwnProperty(dataField) && (cellInfo.data.ESTADO === 'PROCESADO' && cellInfo.data.ESTADO === 'CANCELADO'));
        if (npos > -1) {
          if (cellInfo.data.SECCIONES[npos].ESTADO === 'PROCESADO')
            res = true;
        }
        break;
      default:
        res = false;
        break;
    }
    return of(res);
  }

  getSeccionEstadoColor(cellInfo: any, component: any) {
    // Obtén el dataField de la columna actual
    let res: any = 'transparent';
    const dataField = cellInfo.column?.dataField;
    if (!cellInfo.data.SECCIONES || !dataField) return res = 'transparent';

    // Busca la sección correspondiente
    const seccion = cellInfo.data.SECCIONES.find((s: any) => s.ID_SECCION === dataField);

    switch (component) {
      case 'Container':
        if (!seccion) return res = 'rgb(198 202 201 / 50%)';
        if (!seccion.ESTADO) return res = 'transparent';
        switch (seccion.ESTADO) {
          case 'PROGRAMADO':
          case 'COMPROMETIDO':
          case 'EN PROCESO':
            res = 'rgb(180, 216, 168)';
            break;
          case 'PROCESADO':
            res = 'rgb(166, 194, 242)';
            break;
          default:
            res = 'transparent';
        }
        break;

      case 'Template':
        if (!seccion) return res = 'transparent';
        if (!seccion.ESTADO) return res = 'transparent';
        switch (seccion.ESTADO) {
          case 'EN PROCESO':
            res = 'rgb(254, 153, 0)';
            break
          case 'FLUJO':
            res = '#00fe00';
            break;
          case 'BUFFER':
            res = '#69a84f';
            break;
          case 'ESPERA':
            res = '#9b00fe';
            break;
          default:
            res = 'transparent';
        }
        break;

      case 'Valor':
        if (!seccion) return res = 0;
        res = (seccion.CANTIDAD_PRODUCIDA > 0 && (seccion.ESTADO.match('EN PROCESO|FLUJO|BUFFER|ESPERA'))) ? seccion.CANTIDAD_PRODUCIDA : 0;
        break;

      default:
        res = 'transparent';
        break;
    }

    return res;
  }

  async onConfirmarAccionPopup(accion: string, datos: any) {
    if (accion === 'cancelar' || accion === 'reprogramar') {
      // this.conCambios++;
      try {
        // this.onRespuestaComponent.emit({ accion:'filtro', filtro: this.filtroMaestro });
        const newData: any = await this.opPrepararGuardar(
          accion.toUpperCase(),
          { ...this.popupData, PRODUCTO: this.popupData.PRODUCTO === 'RAIZ' ? this.popupData.ID_PARTE : this.popupData.PRODUCTO }
        );


        if (newData[0].FECHA_PROGRAMADA) {
          //   var pos:any = this.DGproductos.findIndex((d: any) => {
          //     const fechaA = d.FECHA_PROGRAMADA ? new Date(d.FECHA_PROGRAMADA) : null;
          //     const fechaB = newData[0].FECHA_PROGRAMADA ? new Date(newData[0].FECHA_PROGRAMADA) : null;
          //     return (
          //       d.ID_DOCUMENTO === newData[0].ID_DOCUMENTO &&
          //       d.CONSECUTIVO === newData[0].CONSECUTIVO &&
          //       d.PRODUCTO === newData[0].PRODUCTO &&
          //       fechaA &&
          //       fechaB &&
          //       fechaA.getFullYear() === fechaB.getFullYear() &&
          //       fechaA.getMonth() === fechaB.getMonth() &&
          //       fechaA.getDate() === fechaB.getDate()
          //     );
          // });

          //   if (pos !== -1) {
          //     this.DGproductos[pos].CANTIDAD_PROGRAMADA = newData[0].CANTIDAD_PROGRAMADA;
          //     this.DGproductos[pos].CANTIDAD_PENDIENTE = newData[0].CANTIDAD_PENDIENTE;
          //     this.DGproductos[pos].TOTAL = newData[0].TOTAL;
          //     this.gridProductosPMP.instance.refresh();
          //   } else {
          //     this.DGproductos.push(newData[0]);
          //     this.gridProductosPMP.instance.clearSelection();
          //     this.gridProductosPMP.instance.refresh();
          //     this.TOTAL_PENDIENTE = this.DGproductos.reduce((acc: number, item: any) => acc + (item.TOTAL || 0), 0);
          //   }

          // } else {
          //   const pos2:any = this.DGproductos.findIndex((d: any) => 
          //     d.ID_DOCUMENTO === this.popupData.ID_DOCUMENTO &&
          //     d.CONSECUTIVO === this.popupData.CONSECUTIVO &&
          //     d.PRODUCTO === this.popupData.PRODUCTO &&
          //     d.FECHA_PROGRAMADA === this.popupData.FECHA_ANTERIOR
          //   );
          //   if (pos2 !== -1) {
          //     this.DGproductos.splice(pos2, 1);
          //   }
        }


      } catch (err) {
        showToast('Error al guardar los cambios', 'error');
      }
    }
    if (accion === 'salir') {
      this.popupAccionGrid = '';
      this.popupTitulo = '';
      this.popupAccion = '';
      this.popupData = null;
    }
    this.popupReprogramarVisible = false;
  }


  async opPrepararGuardar(accion: string, datos: any): Promise<any> {
    const prm = { PRODUCTOS: datos, USUARIO: this.USUARIO_LOCAL };
    this.loadingVisible = true;
    return new Promise((resolve, reject) => {
      this.sData.save(accion, prm).subscribe({
        next: (data) => {
          // this.loadingVisible = false;
          const res = JSON.parse(data.data);
          if ((data.token !== undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== '') {
            showToast(res[0].ErrMensaje, 'Error');
            reject(res[0]);
          } else {
            showToast('Registro actualizado', 'success');
            resolve(res);
          }
        },
        error: (err) => {
          // this.loadingVisible = false;
          showToast('Error al guardar', 'Error');
          reject(err);
        }
      });
    });
  }

  onSelectionExpand(e: any) {
    if (e.key !== undefined) {
      const datos: any[] = this.DGAgenda_prev.filter((d: any) => d.ITEM === e.key);
      setTimeout(() => {
        this.datosPass.next({
          accion: 'Load Data',
          dataSource: JSON.parse(JSON.stringify(datos[0]))
        });
      }, 100);
    }
  }

  onSelectionChanged(e: any) {
    if (e.selectedRowKeys.length === 1) {
      this.prmUsrAplBarReg.r_numReg = 1;
      this.prmUsrAplBarReg.r_totReg = 1;
      this.prmUsrAplBarReg.accion = 'r_navegar';
      this.prmUsrAplBarReg.error = '';
      this.prmUsrAplBarReg.operacion = {};
      this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    } else {
      this.prmUsrAplBarReg.accion = 'r_ini';
      this.prmUsrAplBarReg.error = '';
      this.prmUsrAplBarReg.r_numReg = 0;
      this.prmUsrAplBarReg.r_totReg = 0;
      this.prmUsrAplBarReg.operacion = { r_imprimir: true, r_refrescar: true };
      this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    }
  }

  generarOrdenOP(e: any) {
    //organiza los datos para generar
    var prm: any[] = [];
    this.selectedRowKeysGrid.forEach((ele: any) => {
      var temp: any = this.DGAgenda.filter((d: any) => d.PRODUCTO === ele);
      prm.push({ DOCUMENTO_PEDIDO: temp[0].DOCUMENTO_PEDIDO, PRODUCTO: temp[0].PRODUCTO });
    });
    this.loadingVisible = true;
    this.sData.consulta('GENERAR ORDEN PRO', { PEDIDOS: prm, USUARIO: this.USUARIO_LOCAL }, 'PRO-029').subscribe((data: any) => {
      const res = validatorRes(data);
      // this.loadingVisible = false;
      if (res[0].ErrMensaje !== '') {
        showToast(res[0].ErrMensaje, 'error');
      } else {
        this.ORDEN_PRODUCCION = res[0];
        this.selectedRowKeysGrid.forEach((ele: any) => {
          var PROD: any[] = this.DGAgenda.filter((d: any) => d.PRODUCTO === ele || (d.PRODUCTO === 'RAIZ' && d.ID_PARTE === ele));
          PROD.forEach((pro: any) => {
            var npos: any = this.DGAgenda.findIndex((d: any) => d.PRODUCTO === pro.PRODUCTO &&
              d.DOCUMENTO_PEDIDO === pro.DOCUMENTO_PEDIDO &&
              d.ID_PARTE === pro.ID_PARTE
            );
            this.DGAgenda[npos].ORDEN_PRODUCCION = res[0].ORDEN_PRO;
            this.DGAgenda[npos].ESTADO = res[0].ESTADO;
          });
        });
        // this.gridTablaAgenda.instance.refresh();
        // this.gridTablaAgenda.instance.clearSelection();
        this.treeListAgenda.instance.clearSelection();
        // this.enviarEmailPDF();
      }
    });
  }

  // previsualizar el reporte
  imprimirReporte(operimp: any) {
    let filtroRep: any = '';
    if (this.ORDEN_PRODUCCION.ORDEN_PRO && this.ORDEN_PRODUCCION.CONSECUTIVO)
      filtroRep = {
        FILTRO: " ORDENES_PRODUCCION.ID_DOCUMENTO = '" + this.ORDEN_PRODUCCION.ID_DOCUMENTO + "' " +
          " AND ORDENES_PRODUCCION.CONSECUTIVO = '" + this.ORDEN_PRODUCCION.CONSECUTIVO + "'"
      };
    else if (this.selectedRowKeysGrid.length === 1) {
      const pos: any = this.DGAgenda.findIndex((d: any) => d.ITEM === this.selectedRowKeysGrid[0]);
      let [DOC, CON] = this.DGAgenda[pos].ORDEN_PRODUCCION.split('-');
      filtroRep = {
        FILTRO: " ORDENES_PRODUCCION.ID_DOCUMENTO = '" + DOC + "' " +
          " AND ORDENES_PRODUCCION.CONSECUTIVO = '" + CON + "'"
      };
    }

    const prmLiq = {
      clid: localStorage.getItem('empresa'),
      usuario: localStorage.getItem('usuario'),
      idrpt: operimp.archivo,
      id_reporte: operimp.id_reporte,
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: 'ORDENES_PRODUCCION',
      filtro: filtroRep
    };

    // Si no existe, no está abierta entonces agrega Tab
    const listaTab = this.tabService.tabs.find(c => c.aplicacion === operimp.id_reporte);
    if (listaTab === undefined)
      GlobalVariables.listaAplicaciones.unshift({ aplicacion: operimp.id_reporte, barra: undefined, statusEdicion: '' });

    // Abre pestaña con nuevo reporte
    this.tabService.addTab(
      new Tab(
        VisorrepComponent,  // visor
        operimp.data_rpt.text,  // título
        { parent: "PrincipalComponent", args: prmLiq },  // parámetro: reporte,filtro
        operimp.id_reporte,  // código del reporte
        '',
        'reporte',
        true
      ));

  }

  // Genera solo pdf
  generarPDF(operimp) {

    showToast('Se generará el reporte en formato PDF. Espere unos segundos...');

    let filtroRep: any = '';
    if (this.ORDEN_PRODUCCION.ORDEN_PRO && this.ORDEN_PRODUCCION.CONSECUTIVO)
      filtroRep = {
        FILTRO: " ORDENES_PRODUCCION.ID_DOCUMENTO = '" + this.ORDEN_PRODUCCION.ID_DOCUMENTO + "' " +
          " AND ORDENES_PRODUCCION.CONSECUTIVO = '" + this.ORDEN_PRODUCCION.CONSECUTIVO + "'"
      };
    else if (this.selectedRowKeysGrid.length === 1) {
      const pos: any = this.DGAgenda.findIndex((d: any) => d.ITEM === this.selectedRowKeysGrid[0]);
      let [DOC, CON] = this.DGAgenda[pos].ORDEN_PRODUCCION.split('-');
      filtroRep = {
        FILTRO: " ORDENES_PRODUCCION.ID_DOCUMENTO = '" + DOC + "' " +
          " AND ORDENES_PRODUCCION.CONSECUTIVO = '" + CON + "'"
      };
    }

    const ext = this.ltool.makeRandom(30);
    const prmRpt = {
      clid: localStorage.getItem('empresa'),
      usuario: localStorage.getItem('usuario'),
      idrpt: operimp.archivo,
      id_reporte: operimp.id_reporte,
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      filtro: JSON.stringify(filtroRep),
      archivo: operimp.archivo + "_" + ext + ".pdf",
    };

    // Generar el PDF -- Llamar al generador de reportes para que genere archivo pdf
    this._sgenerales.ExportarPDF(prmRpt).subscribe((data: Blob) => {
      // Abrir reporte en pestaña browser
      var file = new Blob([data], { type: 'application/pdf' })
      var fileURL = URL.createObjectURL(file);
      window.open(fileURL);
    });

  }
  // Pre-visualiza solo pdf
  enviarEmailPDF() {
    // Prepara y confirma envio de correo
    let asunto = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'ASUNTO EMAIL')?.VALOR_DEFECTO ?? '';
    let email_sale = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'EMAIL SALIENTE')?.VALOR_DEFECTO ?? '';
    if (this.ORDEN_PRODUCCION.ORDEN_PRO)
      asunto = asunto.replace('%ORDEN_PRODUCCION%', this.ORDEN_PRODUCCION.ORDEN_PRO);
    else if (this.selectedRowKeysGrid.length === 1) {
      const pos: any = this.DGAgenda.findIndex((d: any) => d.ITEM === this.selectedRowKeysGrid[0]);
      asunto = asunto.replace('%ORDEN_PRODUCCION%', this.DGAgenda[pos].ORDEN_PRODUCCION);
    }

    const dataSource = {
      ORIGEN: email_sale,
      ORIGEN_EMAIL: email_sale,
      DESTINO: '',
      DESTINO_EMAIL: '',
      ASUNTO: asunto,
      NOTA: ''
    }
    this.eventsSubjectEnvioCorreo.next({ dataSource, visible: true });
  }
  // Respuesta accion del correo
  onRespuestaEnvioCorreo(e: any) {

    showToast('Enviando correo. Espere unos segundos...');

    let template = this.especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'TEMPLATE')?.VALOR_DEFECTO ?? '';
    const ext = this.ltool.makeRandom(30);
    let filtroRep: any = '';
    if (this.ORDEN_PRODUCCION.ORDEN_PRO && this.ORDEN_PRODUCCION.CONSECUTIVO)
      filtroRep = {
        FILTRO: " ORDENES_PRODUCCION.ID_DOCUMENTO = '" + this.ORDEN_PRODUCCION.ID_DOCUMENTO + "' " +
          " AND ORDENES_PRODUCCION.CONSECUTIVO = '" + this.ORDEN_PRODUCCION.CONSECUTIVO + "'"
      };
    else if (this.selectedRowKeysGrid.length === 1) {
      const pos: any = this.DGAgenda.findIndex((d: any) => d.ITEM === this.selectedRowKeysGrid[0]);
      let [DOC, CON] = this.DGAgenda[pos].ORDEN_PRODUCCION.split('-');
      filtroRep = {
        FILTRO: " ORDENES_PRODUCCION.ID_DOCUMENTO = '" + DOC + "' " +
          " AND ORDENES_PRODUCCION.CONSECUTIVO = '" + CON + "'"
      };
    }

    let OP: any = ''
    if (this.ORDEN_PRODUCCION.ORDEN_PRO)
      OP = this.ORDEN_PRODUCCION.ID_DOCUMENTO;
    else if (this.selectedRowKeysGrid.length === 1) {
      const pos: any = this.DGAgenda.findIndex((d: any) => d.ITEM === this.selectedRowKeysGrid[0]);
      OP = this.DGAgenda[pos].ORDEN_PRODUCCION;
    }

    const prmRpt = {
      clid: localStorage.getItem('empresa'),
      usuario: localStorage.getItem('usuario'),
      idrpt: this.rpt_archivo,
      id_reporte: this.rpt_id_reporte,
      aplicacion: 'PRO-029',
      tabla: this.prmUsrAplBarReg.tabla,
      filtro: JSON.stringify(filtroRep),
      archivo: this.rpt_archivo + "_" + ext + ".pdf",
      prm_email: e,
      template,
      replacements: {
        ORDEN_PRO: OP,
        NOTA: e.NOTA
      }
    };

    // Generar el PDF -- Llamar al generador de reportes para que genere archivo pdf
    this._sgenerales.ExportarPDF(prmRpt).subscribe((data: Blob) => {
      // Guarda en el log el evento de preparación para envio (antes de enviar)
      // En caso de que NO se logre enviar, éste registro será
      // la evidencia NO fue enviado
      const prm = {
        ID_APLICACION: 'PRO-029',
        ORIGEN: 'documento',
        DATOS: this.ORDEN_PRODUCCION,
        EVENTO: 'PREPARACION ENVIO EMAIL',
        DETALLE: e.DESTINO_EMAIL + ' Status:por enviar',
        USUARIO: this.prmUsrAplBarReg.usuario
      };
      this._sgenerales
        .log('evento log', prm, "ADM-401")
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (res[0].ErrMensaje !== '')
            showToast(res[0].ErrMensaje);
        });
      let datos = {
        data: {
          datos:
            prmRpt
        },
        USUARIO: this.prmUsrAplBarReg.usuario
      }
      this.socket.sendSocket('email', 'get_data_email', datos);
      showToast('Correo enviado.', 'success');
    });
  }



  valoresObjetos(obj: string, datos: any) {
    if (obj == 'especificaciones' || obj == 'todos') {
      this.sData.consulta('ESPECIFICACIONES', { ID_APLICACION: 'PRO-029', USUARIO: this.USUARIO_LOCAL }, 'ADM-011')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== '')
            showToast(res[0].ErrMensaje);
          else
            this.especAplicacion = res;
        });
    };
    if (obj === 'planes produccion' || obj === 'todos') {
      const prm = {};
      this.sData.consulta('PLANES PROD', prm, 'PRO-023')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== '') {
            showToast(res[0].ErrMensaje);
          } else {
            this.DGplanes = res;
          }
        });
    };
  }

}
