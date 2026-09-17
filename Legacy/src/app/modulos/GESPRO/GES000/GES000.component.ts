import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {
  DxButtonModule,
  DxDataGridModule,
  DxDateBoxModule,
  DxDropDownBoxModule,
  DxDropDownButtonModule,
  DxHtmlEditorModule,
  DxListModule,
  DxLoadPanelModule,
  DxPopupModule,
  DxProgressBarModule,
  DxRadioGroupModule,
  DxSchedulerModule,
  DxScrollViewModule,
  DxSelectBoxModule,
  DxTabsModule,
  DxTagBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxTooltipModule,
  DxTreeListModule,
  DxTreeViewComponent,
  DxValidatorModule,
} from 'devextreme-angular';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { showToast } from '../../../shared/toast/toastComponent.js';
import { Observable, Subject, Subscription, lastValueFrom, of } from 'rxjs';
import Swal from 'sweetalert2';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { GES00Service } from 'src/app/shared/Tareas/Service/GES00.service';
import { FechaplanComponent } from '../../../shared/fechaplan/fechaplan.component';
import { FormsModule } from '@angular/forms';
import { SocketService } from 'src/app/services/socket/socket.service';
import { MatBadgeModule } from '@angular/material/badge';
import { GeneralesService } from 'src/app/services/generales/generales.service';

@Component({
  selector: 'GES000-COMPONENT',
  templateUrl: './GES000.component.html',
  styleUrls: ['./GES000.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    DxTreeListModule,
    DxButtonModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxSelectBoxModule,
    DxDateBoxModule,
    DxSchedulerModule,
    DxTextAreaModule,
    DxTagBoxModule,
    DxLoadPanelModule,
    DxTooltipModule,
    DxPopupModule,
    DxScrollViewModule,
    TimelineModule,
    CardModule,
    DxHtmlEditorModule,
    FechaplanComponent,
    DxListModule,
    DxDropDownBoxModule,
    FormsModule,
    DxDataGridModule,
    MatBadgeModule,
    DxDropDownButtonModule,
    DxProgressBarModule,
    DxTabsModule,
    DxRadioGroupModule
  ],
})
export class GES000Component {
  @ViewChild('TreeListTareas', { static: false })
  TreeListTareas;
  @ViewChild('treeListPrece', { static: false }) treeView: DxTreeViewComponent;
  treeBoxValue: string[] = [];
  openDropFiltroAreas: boolean = false;

  @Input() events: Observable<any>;
  @Input() datosEntrada: any;
  @Input() readOnly: any;

  @Output() datosEntradaChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() readOnlyChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();
  eventsSubjectProg: Subject<any> = new Subject<any>();

  editOnkeyPress = false;
  enterKeyAction: any = 'moveFocus';
  enterKeyDirection: any = 'column';


  dropdownOpen = false;
  selectedType: 'colaboradores' | 'grupos' = 'colaboradores';
  gridColumns = ['ID_RESPONSABLE', 'NOMBRE'];

  private eventsSubscription: Subscription;
  Array = Array;
  dropdownTabIndex = 0;
  currentCell: any;
  dropdownState: { [key: string]: number } = {};

  DTareas: any[] = [];
  DTareas2: any[] = [];
  DAvance: any[] = [
    { ID_AVANCE: 0, NOMBRE: '0%', AVANCE: 0 },
    { ID_AVANCE: 25, NOMBRE: '25%', AVANCE: 25 },
    { ID_AVANCE: 50, NOMBRE: '50%', AVANCE: 50 },
    { ID_AVANCE: 75, NOMBRE: '75%', AVANCE: 75 },
    { ID_AVANCE: 100, NOMBRE: '100%', AVANCE: 100 },
  ];
  DListaTag: any[] = [];
  DGrupos: any[] = [];
  usuarios: any[] = [];
  // selectedUsuarios: any[] = [];
  focusedRowIndex: any = [];
  JsonDataSource: any = [];
  maxValue: number = 100;


  dropDownOptions: any = {
    width: 800,
    height: 500,
    hideOnParentScroll: true,
    container: '#router-container',
    // toolbarItems: [{
    //   location: 'before',
    //   toolbar: 'top',
    //   template: 'tempEncab',
    //   style: 'padding: 0 !important'
    // }]
  };


  idColaboradores: any[];
  DResponsables: any = [];
  tempSelectedUsuarios: any[] = [];

  DataResTareas: any[] = [];
  filasSeleccData: any;
  maxDisplayedTags: number = 1;
  dataTarea_prev: any = {};
  USUARIO_LOCAL: any = '';
  EMPRESA: any = '';
  accionFiltro: string = '';
  templateGroup: any = ['ID_RESPONSABLE'];
  selectedItemColumnChooser: any = [];
  config_obj: any = [];
  nueva_actividad: any;

  targetIdTooltip: string;
  tooltipInfo: any = {};
  toolTipVisible: boolean = false;
  widthTooltip: any = 'auto';
  visibleEditorTexto: boolean = false;
  tituloEditor: any = '';
  valueContentDescripcion: any = '';
  contentDescripcionData: any;

  //Variables de configuracion del componente
  columnas: any = [];
  JsonAcciones: any = {};
  JsonDatosValidar: any = {};
  accionLocal: any = '';
  CLASE_ACTIVA: string = '';
  APLICACION: string = '';
  AREAS_F: any = [];

  //Variables de DRAG
  targetData: any = '';
  sourceData: any = '';

  // Operaciones de grid
  rowNew: boolean = true;

  // Datos del scheduler de apoyo
  dataProg: any = {
    text: '',
    startDate: new Date(),
    endDate: new Date(),
    allDay: false,
    ID_ACTIVIDAD: 0,
    editing: false,
  };
  datProgFila: any;

  // readOnly:boolean;
  treeListConfigured: boolean = false;
  esEdicionFila: boolean = false;
  loadingVisible: boolean = false;
  visibleGesproHistorial: boolean = false;
  tituloHistorial: any;
  DTimeline: any[];
  container: any;
  gridScrollPosition: any;

  conCambios: number = 0;
  subscriptionActividades: Subscription;
  subscriptionMensagesACT: Subscription;
  rangoFecha: any;

  selectPrecedentes: string[] = [];
  openDropPrecedentes: boolean = false;
  noDataPrece: string = 'No hay Data';

  constructor(
    private _sdatos: GES00Service,
    private datepipe: DatePipe,
    public wsocket: SocketService,
    public generalesService: GeneralesService
  ) {
    this.subscriptionMensagesACT = this.wsocket
      .emitMessageACT()
      .subscribe((prm) => {
        this.receiveMessageACT(prm);
      });

    this.subscriptionActividades = this.wsocket
      .emitNtfApl()
      .subscribe((data) => {
        // data.ACTIVIDAD = JSON.parse(data.ACTIVIDAD);
        if (
          (data.USUARIO_REC !== data.USUARIO_ENV.USUARIO &&
            data.USUARIO_REC === this.USUARIO_LOCAL) ||
          data.USUARIO_REC === 'TODOS'
        ) {
          this.DTareas.push(data.ACTIVIDAD.ACTIVIDAD_DATA);
          data.ACTIVIDAD.ACTIVIDAD_DATA.focus_actividad = true;
          data.ACTIVIDAD.ACTIVIDAD_DATA.count_actividad = data.ACTIVIDAD
            .ACTIVIDAD_DATA.count_actividad
            ? data.ACTIVIDAD.ACTIVIDAD_DATA.count_actividad + 1
            : 0 + 1;

          this.TreeListTareas.instance.refresh();
        }
      });

    this.container = document.getElementById('container-body');
    this.configComponent = this.configComponent.bind(this);
    this.customizeColumns = this.customizeColumns.bind(this);
    this.onCellHoverChanged = this.onCellHoverChanged.bind(this);
    this.loadDataInit = this.loadDataInit.bind(this);
    this.opPrepararNuevaFila = this.opPrepararNuevaFila.bind(this);
    this.onDragChange = this.onDragChange.bind(this);
    this.onReorder = this.onReorder.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.getDataSource = this.getDataSource.bind(this);
    this.editValidator = this.editValidator.bind(this);
    // this.saveState = this.saveState.bind(this);
    this.showColumnChooser = this.showColumnChooser.bind(this);
    // this.valoresObjetos = this.valoresObjetos.bind(this);
  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.EMPRESA = localStorage.getItem('empresa')?.toUpperCase();
    this.valoresObjetos('grupos', '', '')

    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.accion) {
        case 'init':
          this.loadDataInit(datos.config);
          break;

        case 'configurar':
          this.configComponent(datos.dataSource);
          break;

        case 'cargar datos':
          this.updateData(datos.config);
          break;

        case 'column chooser':
        case 'config column for user':
          if (datos.filtro === 'config') {
            this.selectedItemColumnChooser = datos.config.dataSource.columns;
          } else if (datos.filtro === 'filtro') {
            this.selectedItemColumnChooser.forEach((ele: any) => {
              ele.visible = false;
            });
            for (let i = 0; i < datos.config.dataSource.length; i++) {
              const ele: any = datos.config.dataSource[i];
              const pos: any = this.selectedItemColumnChooser.findIndex(
                (d: any) => d.dataField === ele
              );
              this.selectedItemColumnChooser[pos].visible = true;
            }
            // this.selectedItemColumnChooser = (datos.config.dataSource.columns !== undefined && datos.config.dataSource.columns !== null) ?
            // datos.config.dataSource.columns : datos.config.dataSource;
          }
          this.showColumnChooser(datos);
          break;

        case 'error':
          this.validateError(datos.config);
          break;

        case 'filtrar datos':
          this.filtrarActividades(datos.textFilter);
          break;

        default:
          break;
      }
    });
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  onSelectionChanged(e: any, templateData: any, campo: any): void {
    var keys = e.selectedRowKeys;
    // templateData.option('value', keys);

    // Guardar histórico
    // if (this.gridSeleccObj.findIndex(s => s.CAMPO === campo) === -1)
    //   this.gridSeleccObj.push({ CAMPO: campo, VALOR: keys });
    // else {
    //   const ix = this.gridSeleccObj.findIndex(s => s.CAMPO === campo);
    //   this.gridSeleccObj[ix].VALOR = keys;
    // }
  }

  loadDataInit(data: any) {
    switch (data.accion) {
      case 'init':
        this.readOnly = data.readOnly;
        this.APLICACION = data.APLICACION;
        break;

      case 'readOnly':
        this.readOnly = data.readOnly;
        this.AREAS_F = data.dataSource ? data.dataSource : [];
        break;

      case 'update data config':
        this.JsonDataSource[data.parametro] = JSON.parse(
          JSON.stringify(data.dataSource)
        );
        break;

      default:
        break;
    }
  }

  configComponent(data: any) {
    var jsonNodo: any = {};
    var jsonColumn: any = {
      ID_ACTIVIDAD: 0,
      ID_ACTIVIDAD_PADRE: -1,
      CLASE: '',
      ITEM: 0,
    };
    var tipo: any = { string: '', date: '', boolean: false, number: 0 };
    var data_column: any = [];

    //Se optiene el estado del componente (edición/lectura);
    const posReadOnly: any = data.findIndex((d: any) =>
      d.hasOwnProperty('readOnly')
    );
    if (posReadOnly > -1) this.readOnly = data[posReadOnly].readOnly;

    //Columnas base del componente
    this.columnas = [
      { dataField: 'ID_ACTIVIDAD', visible: false, dataType: 'string' },
      { dataField: 'ID_ACTIVIDAD_PADRE', visible: false, dataType: 'string' },
      { dataField: 'CLASE', visible: false, dataType: 'string' },
      { dataField: 'ITEM', visible: false, dataType: 'number' },
    ];

    data
      .filter((f: any) => f.CONFIG_PADRE === 'COLUMNAS')
      .forEach((item: any) => {
        var dataField: any = '';
        var dataType: any = '';
        var caption: any = '';
        var dataSource: any = '';
        var visibleIndex: number = -1;
        var visible: boolean = false;
        var width: any = '';
        var editable: boolean = false;

        dataField = item.CONFIG;
        data_column = data.filter((d: any) => d.CONFIG_PADRE === dataField);
        data_column.forEach((data: any) => {
          switch (data.CONFIG) {
            case 'TITULO':
              caption = data.VALOR;
              break;
            case 'TIPO':
              dataType = data.VALOR;
              break;
            case 'INDEX':
              visibleIndex = data.VALOR;
              break;
            case 'DATASOURCE':
              dataSource = data.VALOR;
              break;
            case 'VISIBLE':
              visible = data.VALOR;
              break;
            case 'WIDTH':
              width = data.VALOR;
              break;
            case 'EDITABLE':
              editable = JSON.parse(data.VALOR);
              break;

            default:
              break;
          }
        });
        jsonColumn = { ...jsonColumn, [dataField]: tipo[dataType] };

        if (dataField !== '') {
          this.columnas.push({
            dataField,
            caption,
            dataType,
            dataSource,
            visibleIndex,
            visible,
            width,
            editable,
          });
        }

        //Se configuran los DataSource de las columnas
        if (
          dataSource !== undefined &&
          dataSource !== null &&
          dataSource !== ''
        ) {
          if (!this.JsonDataSource[dataSource])
            this.JsonDataSource[dataSource] = [];
        }
      });

    //Valida y carga los datos a verificar antes de registrar
    data
      .filter((f: any) => f.CONFIG_PADRE === 'VALIDAR DATOS')
      .forEach((item: any) => {
        if (!this.JsonDatosValidar[item.CONFIG])
          this.JsonDatosValidar = {
            ...this.JsonDatosValidar,
            [item.CONFIG]: item.CONFIG,
          };
      });

    //Configura las acciones de la aplicacioón sobre el componente
    data
      .filter((f: any) => f.CONFIG_PADRE === 'ACCIONES')
      .forEach((item: any) => {
        this.JsonAcciones = {
          ...this.JsonAcciones,
          [item.CONFIG]: item.CONFIG,
        };
      });

    if (Object.keys(jsonNodo).length > 0)
      this.DTareas = [...this.DTareas, jsonNodo];
  }

  customizeColumns(columns: any) {
    var dataColumn: any = [];
    var config_col: any[] = [];
    var posCol: number = -1;

    columns.forEach((col: any) => {
      config_col = this.columnas.filter(
        (d: any) => d.dataField === col.dataField
      );

      // Propiedades de las columnas
      if (config_col.length > 0) {
        if (
          this.selectedItemColumnChooser.length > 0 &&
          this.selectedItemColumnChooser[0].dataField !== undefined &&
          this.selectedItemColumnChooser[0].dataField !== null
        ) {
          posCol = this.selectedItemColumnChooser.findIndex(
            (d: any) => d.dataField === col.dataField
          );
          if (posCol > -1) {
            col.visible = this.selectedItemColumnChooser[posCol].visible;
            if (
              this.selectedItemColumnChooser[posCol].width !== undefined &&
              this.selectedItemColumnChooser[posCol].width !== null
            )
              col.width = this.selectedItemColumnChooser[posCol].width;
          } else {
            col.visible = false;
          }
        } else if (
          this.selectedItemColumnChooser.length > 0 &&
          this.selectedItemColumnChooser[0]
        ) {
          posCol = this.selectedItemColumnChooser.indexOf(col.dataField);
          if (posCol > -1) {
            col.visible = true;
          } else {
            col.visible = false;
          }
        } else {
          col.visible = config_col[0].visible === 'true' ? true : false;
        }

        if (col.visible) dataColumn.push(col.dataField);

        if (config_col[0].editable) {
          col.allowEditing = config_col[0].editable['valor'] ? true : false;
          if (config_col[0].editable['display'])
            col.cellTemplate = config_col[0].editable['display']
              ? config_col[0].editable['display']
              : '';
          col.editCellTemplate = config_col[0].editable['edit']
            ? config_col[0].editable['edit']
            : '';
        }
        col.caption = config_col[0].caption ?? config_col[0].dataField;
        col.visibleIndex = parseInt(config_col[0].visibleIndex ?? 0);
        col.allowHeaderFiltering = true;

        if (config_col[0].width) {
          col.width = config_col[0].width;
        }
        if (col.dataField.match('FECHA|PROGRAMACION')) {
          col.alignment = 'center';
          col.allowHeaderFiltering = false;
        }
        if (
          col.dataField.match(
            'ID_|CLASE|ITEM|index|readOnly|visible|Err|Mensaje|Eliminado'
          )
        ) {
          col.visible = false;
          col.allowHeaderFiltering = false;
        }

        if (col.dataField.match('NOMBRE')) {
          let width = col.width;
          if (typeof width === 'string') {
            if (width.includes('%')) {
              col.width = width.replace('%', ''); // Eliminar el símbolo '%' para obtener solo el número
            } else {
              col.width = width; // Mantener el valor original si no contiene '%'
            }
          } else {
            col.width = width; // Mantener el valor original si no contiene '%'
          }
        }
        if (col.dataField.match('DESCRIPCION')) {
          let width = col.width;
          if (typeof width === 'string') {
            if (width.includes('%')) {
              col.width = width.replace('%', ''); // Eliminar el símbolo '%' para obtener solo el número
            } else {
              col.width = width; // Mantener el valor original si no contiene '%'
            }
          } else {
            col.width = width; // Mantener el valor original si no contiene '%'
          }
        }

        if (col.dataField.match('btn')) {
          col.allowEditing = false;
          col.width = 45;
          col.type = 'buttons';
          col.allowHiding = false;
          col.allowHeaderFiltering = false;
        }

        if (col.allowHeaderFiltering) {
          if (col.dataField.match('RESPONSABLE|COLABORADORES')) {
            col.headerFilter = { dataSource: this.getDataSourceFilter(col) };
            if (col.dataField === 'COLABORADORES') col.width = 230;
          }
        }
      } else if (config_col.length === 0) {
        col.visible = false;
      }
    });
    if (dataColumn.length > 0) {
      this.onRespuestaComponent.emit({
        accion: 'column chooser',
        data: dataColumn,
      });
    }
  }

  // Cambio programación
  onRespuestaProg(e: any) {
    if (e.accion == 'aceptar') {
      const data = {
        data: {
          REPETIR: e.datos.REPETIR,
          TODO_DIA: e.datos.TODO_DIA,
          FECHA_INICIO: e.datos.FECHA_INICIO,
          FECHA_FIN: e.datos.FECHA_FIN,
          FRECUENCIA: e.datos.FRECUENCIA,
          ID_ACTIVIDAD: e.datos.ID_ACTIVIDAD,
          PERIODO_FRECUENCIA_DIA: String(e.datos.PERIODO_FRECUENCIA_DIA),
          PERIODO_FRECUENCIA_MES: String(e.datos.PERIODO_FRECUENCIA_MES),
          INTERVALO_FRECUENCIA: e.datos.INTERVALO_FRECUENCIA,
          TIPO_FIN_FRECUENCIA: e.datos.TIPO_FIN_FRECUENCIA,
          FIN_FRECUENCIA:
            e.datos.TIPO_FIN_FRECUENCIA === 'NUNCA'
              ? ''
              : e.datos.FIN_FRECUENCIA,
          RECORDATORIO: e.datos.RECORDATORIO,
          TIPO_RECORDATORIO: e.datos.TIPO_RECORDATORIO,
          INTERVALO_REC: e.datos.INTERVALO_REC,
          INTERVALO_REC_FECHA: e.datos.INTERVALO_REC_FECHA,
        },
      };
      this.conCambios++;
      this.setProgramacion(data);
    }
  }

  getDataSourceFilter(col: any) {
    var res: any = [];
    var dataSource: any = [];
    switch (col.dataField) {
      case 'RESPONSABLE':
      case 'COLABORADORES':
        if (this.JsonDataSource['prev_' + col.dataField]) {
          this.JsonDataSource['prev_' + col.dataField].forEach((ele: any) => {
            dataSource.push({ text: ele.NOMBRE, value: ele.ID_RESPONSABLE });
          });
          res = dataSource;
        }
        break;

      default:
        break;
    }
    return res;
  }

  showColumnChooser(datos: any) {
    this.loadingVisible = true;
    // this.selectedItemColumnChooser = (datos.dataSource.columns !== undefined && datos.dataSource.columns !== null) ? datos.dataSource.columns : datos.dataSource;
    const treeListInstance = this.TreeListTareas.instance;
    this.columnas.forEach((col: any) => {
      const posCol: any = this.selectedItemColumnChooser.findIndex(
        (d: any) => d.dataField === col.dataField
      );
      if (posCol > -1) {
        col.visible = this.selectedItemColumnChooser[posCol].visible;
        treeListInstance.columnOption(
          col.dataField,
          'visible',
          this.selectedItemColumnChooser[posCol].visible
        );
        if (
          this.selectedItemColumnChooser[posCol].width !== undefined &&
          this.selectedItemColumnChooser[posCol].width !== null
        ) {
          col.width = this.selectedItemColumnChooser[posCol].width;
          treeListInstance.columnOption(
            col.dataField,
            'width',
            this.selectedItemColumnChooser[posCol].width
          );
        }
        if (
          this.selectedItemColumnChooser[posCol].visibleIndex !== undefined &&
          this.selectedItemColumnChooser[posCol].visibleIndex !== null
        ) {
          col.visibleIndex =
            this.selectedItemColumnChooser[posCol].visibleIndex;
          treeListInstance.columnOption(
            col.dataField,
            'visibleIndex',
            this.selectedItemColumnChooser[posCol].visibleIndex
          );
        }
      } else {
        col.visible = false;
        treeListInstance.columnOption(col.dataField, 'visible', false);
      }
    });
    this.loadingVisible = false;
    treeListInstance.refresh();
  }

  saveState = (state: any) => {
    if (state.columns) {
      var dataColumn: any = [];
      this.onRespuestaComponent.emit({
        accion: 'save column for user',
        data: { obj: 'TreeListTareas', state },
      });
      state.columns.forEach((col: any) => {
        if (col.visible) dataColumn.push(col.dataField);
      });
      if (dataColumn.length > 0) {
        this.onRespuestaComponent.emit({
          accion: 'column chooser',
          data: dataColumn,
        });
      }
    }
  };

  updateData(data: any) {
    // Si es un Filtro por área
    this.accionFiltro = data.accionFiltro;

    switch (data.accion) {
      case 'update dataSource':
        if (!this.esEdicionFila) {
          this.DTareas = data.dataSource;
          this.DTareas2 = data.dataSource;
          this.rangoFecha = data.rangoFecha;
          this.nueva_actividad = localStorage.getItem('nueva_actividad');
          this.nueva_actividad = JSON.parse(this.nueva_actividad);

          this.DTareas = this.clasificarTareas(this.DTareas);

          for (let i = 0; i < this.DTareas.length; i++) {
            let element = this.DTareas[i];

            if (
              this.nueva_actividad !== null &&
              this.nueva_actividad.ACTIVIDAD.ACCION === 'nueva_actividad'
            ) {
              if (
                element.ID_ACTIVIDAD ===
                this.nueva_actividad.ACTIVIDAD.ACTIVIDAD_DATA.ID_ACTIVIDAD
              ) {
                element.focus_actividad = true;
              }
            }

            // Asegúrate de que `setProgramacion` esté funcionando correctamente.
            this.setProgramacionACTPR({ data: element });
          }
        } else {
          this.TreeListTareas.instance.cancelEditData();
          this.DTareas = data.dataSource;
          for (let i = 0; i < this.DTareas.length; i++) {
            const element = this.DTareas[i];
            this.setProgramacion({ data: element });
          }
          // this.DTareas = data.dataSource.sort(
          //   (a, b) => b.ID_ACTIVIDAD - a.ID_ACTIVIDAD
          // );
        }
        this.TreeListTareas.instance.refresh();
        if (data.readOnly !== null && data.readOnly !== undefined)
          this.readOnly = data.readOnly;
        break;

      case 'update data config':
        this.JsonDataSource[data.parametro] = JSON.parse(
          JSON.stringify(data.dataSource)
        );
        this.JsonDataSource['prev_' + data.parametro] = JSON.parse(
          JSON.stringify(data.dataSource)
        );
        if (data.parametro === 'RESPONSABLE') {
          this.DResponsables = JSON.parse(
            JSON.stringify(data.dataSource)
          );
          this.onTypeChanged('colaboradores');
        }

        break;

      default:
        break;
    }
  }

  clasificarTareas(tareas) {
    let padres = new Set();
    let hijos = new Set();

    tareas.forEach((tarea) => {
      if (tarea.CLASE !== 'NODOS') {
        padres.add(tarea.ID_ACTIVIDAD_PADRE);
        hijos.add(tarea.ID_ACTIVIDAD);
      }
    });

    return tareas.map((tarea) => {
      if (padres.has(tarea.ID_ACTIVIDAD)) {
        return { ...tarea, parent: true };
      } else if (hijos.has(tarea.ID_ACTIVIDAD)) {
        return { ...tarea, parent: false };
      } else {
        return { ...tarea };
      }
    });
  }

  validateError(data: any) {
    switch (data.accion) {
      case 'error de guardado':
        const pos: any = this.DTareas.findIndex(
          (d: any) => d.ID_ACTIVIDAD === data.dataSource.ID_ACTIVIDAD
        );
        this.dataTarea_prev = JSON.parse(JSON.stringify(this.DTareas[pos]));
        this.accionLocal = 'update';
        setTimeout(() => {
          const rowIndex: any = this.TreeListTareas.instance.getRowIndexByKey(
            this.dataTarea_prev.ID_ACTIVIDAD
          );
          this.TreeListTareas.instance.editRow(rowIndex);
        }, 300);
        break;

      default:
        break;
    }
  }

  onCellHoverChanged(e: any) {
    if (!this.readOnly) {
      if (
        e.data !== null &&
        e.data !== undefined &&
        e.data !== '' &&
        !e.data.ANULADO &&
        !this.esEdicionFila
      ) {
        if (this.editValidator(e, 'agregar')) {
          const box1: any = document.getElementById(
            'txtNombre' + e.data.ID_ACTIVIDAD
          );
          const box2: any = document.getElementById(
            'containerBtnNuevoTarea' + e.data.ID_ACTIVIDAD
          );
          if (box1 !== null && box2 !== null) {
            box1.style.transform = 'translateX(0px)';
            box2.style.opacity = '1';
            this.DTareas.forEach((ele: any) => {
              if (ele.ID_ACTIVIDAD !== e.data.ID_ACTIVIDAD) {
                const box1: any = document.getElementById(
                  'txtNombre' + ele.ID_ACTIVIDAD
                );
                const box2: any = document.getElementById(
                  'containerBtnNuevoTarea' + ele.ID_ACTIVIDAD
                );
                if (box1 !== null && box1 !== undefined) {
                  if (box1.style !== null && box1.style !== undefined) {
                    if (box1.style.transform === 'translateX(0px)') {
                      box1.style.transform = 'translateX(-25px)';
                      box2.style.opacity = '0';
                      this.filasSeleccData = e;
                    }
                  }
                }
              }
            });
          }
        } else {
          this.DTareas.forEach((ele: any) => {
            const box1: any = document.getElementById(
              'txtNombre' + ele.ID_ACTIVIDAD
            );
            const box2: any = document.getElementById(
              'containerBtnNuevoTarea' + ele.ID_ACTIVIDAD
            );
            if (box1 !== null && box1 !== undefined) {
              if (box1.style !== null && box1.style !== undefined) {
                if (box1.style.transform === 'translateX(0px)') {
                  box1.style.transform = 'translateX(-25px)';
                  box2.style.opacity = '0';
                }
              }
            }
          });
        }
      } else {
        this.DTareas.forEach((ele: any) => {
          const box1: any = document.getElementById(
            'txtNombre' + ele.ID_ACTIVIDAD
          );
          const box2: any = document.getElementById(
            'containerBtnNuevoTarea' + ele.ID_ACTIVIDAD
          );
          if (box1 !== null && box1 !== undefined) {
            if (box1.style !== null && box1.style !== undefined) {
              if (box1.style.transform === 'translateX(0px)') {
                box1.style.transform = 'translateX(-25px)';
                box2.style.opacity = '0';
              }
            }
          }
        });
      }
    }
    if (
      e.rowType === 'data' &&
      e.column.dataField === 'PROGRAMACION' &&
      e.data.PROGRAMACION !== '' &&
      e.data.CLASE !== 'NODOS'
    ) {
      if (e.eventType === 'mouseover' && !this.esEdicionFila) {
        if (
          e.column.dataField === 'PROGRAMACION' &&
          e.data.ID_AREA_CAUSANTE !== ''
        ) {
          this.targetIdTooltip = e.cellElement;
          //Formateado de fechas:
          const fecha_inicial = new Date(e.data.FECHA_INICIO);
          const fecha_final = new Date(e.data.FECHA_FIN);

          const fecha_ini =
            this.generalesService.getFechaComponents(fecha_inicial);
          const fecha_fin =
            this.generalesService.getFechaComponents(fecha_final);

          let date = new Date(e.data.FECHA_INICIO);
          let dia = String(fecha_ini.dia).padStart(2, '0');
          let mes = String(fecha_ini.mesFromatoNumero).padStart(2, '0');
          let ano = fecha_ini.ano;
          let horas = fecha_ini.horas;
          let minutos = fecha_ini.minutos;
          let formattedFechaIni = '';
          if (horas !== '' && minutos !== '') {
            formattedFechaIni = `${dia}/${mes}/${ano} - ${horas}:${minutos}`;
          } else {
            formattedFechaIni = `${dia}/${mes}/${ano}`;
          }

          date = new Date(e.data.FECHA_FIN);
          dia = String(fecha_fin.dia).padStart(2, '0');
          mes = String(fecha_fin.mesFromatoNumero).padStart(2, '0');
          ano = fecha_fin.ano;
          horas = fecha_fin.horas;
          minutos = fecha_fin.minutos;
          let formattedFechaFin = '';
          if (horas !== '' && minutos !== '') {
            formattedFechaFin = `${dia}/${mes}/${ano} - ${horas}:${minutos}`;
          } else {
            formattedFechaFin = `${dia}/${mes}/${ano}`;
          }
          if (
            e.data.DATA_PROGRAMACION &&
            e.data.DATA_PROGRAMACION !== null &&
            e.data.DATA_PROGRAMACION !== 'null'
          ) {
            let DATA_PROGRAMACION = e.data.DATA_PROGRAMACION;
            if (
              typeof DATA_PROGRAMACION === 'string' &&
              DATA_PROGRAMACION.length > 0
            )
              DATA_PROGRAMACION = JSON.parse(DATA_PROGRAMACION);
            this.widthTooltip = 'auto';
            this.tooltipInfo = {
              TITULO: 'Programación',
              FECHA_INICIO: formattedFechaIni,
              FECHA_FIN: formattedFechaFin,
              REPETIR: DATA_PROGRAMACION.REPETIR,
              TODO_DIA: e.data.TODO_DIA,
              RECORDATORIO: e.data.RECORDATORIO,
              INTERVALO_FRECUENCIA: DATA_PROGRAMACION.INTERVALO_FRECUENCIA,
              PERIODO_FRECUENCIA_DIA: DATA_PROGRAMACION.PERIODO_FRECUENCIA_DIA,
              PERIODO_FRECUENCIA_MES: DATA_PROGRAMACION.PERIODO_FRECUENCIA_MES,
              FRECUENCIA: DATA_PROGRAMACION.FRECUENCIA,
            };
          } else {
            this.widthTooltip = 'auto';
            this.tooltipInfo = {
              TITULO: 'Programación',
              FECHA_INICIO: formattedFechaIni,
              FECHA_FIN: formattedFechaFin,
              REPETIR: e.data.REPETIR,
              TODO_DIA: e.data.TODO_DIA,
              RECORDATORIO: e.data.RECORDATORIO,
            };
          }
        }
        this.toolTipVisible = true;
      } else {
        this.toolTipVisible = false;
      }
    } else if (
      e.rowType === 'data' &&
      e.column.dataField === 'NOMBRE' &&
      e.data.NOMBRE !== '' &&
      e.data.CLASE !== 'NODOS'
    ) {
      if (e.eventType === 'mouseover' && !this.esEdicionFila) {
        if (e.column.dataField === 'NOMBRE' && e.data.ID_AREA_CAUSANTE !== '') {
          this.targetIdTooltip = e.cellElement;
          this.widthTooltip = 'auto';
          this.tooltipInfo = {
            TITULO: 'Actividad',
            NOMBRE: e.data.NOMBRE,
          };
        }
        this.toolTipVisible = true;
      } else {
        this.toolTipVisible = false;
      }
    } else if (
      e.rowType === 'data' &&
      e.column.dataField === 'COLABORADORES' &&
      e.data.COLABORADORES.length > 1 &&
      e.data.CLASE !== 'NODOS'
    ) {
      if (e.eventType === 'mouseover' && !this.esEdicionFila) {
        if (e.column.dataField === 'COLABORADORES') {
          this.targetIdTooltip = e.cellElement;
          this.widthTooltip = '200px';
          var empleados: any[] = [];
          e.data.COLABORADORES.forEach((emple: any) => {
            const dat: any = this.JsonDataSource['prev_COLABORADORES'].filter(
              (d: any) => d.ID_RESPONSABLE === emple
            );
            if (dat[0] !== undefined) {
              empleados.push(dat[0]);
            }
          });
          const nombres = empleados
            .map((empleado) => empleado.NOMBRE)
            .join('\n');
          this.tooltipInfo = {
            TITULO: 'Colaboradores',
            NOMBRE: empleados,
          };
        }
        this.toolTipVisible = true;
      } else {
        this.toolTipVisible = false;
      }
    } else if (
      e.rowType === 'data' &&
      e.column.dataField === 'PRECEDENTES' &&
      e.data.PRECEDENTES.length > 0 &&
      e.data.CLASE !== 'NODOS'
    ) {
      if (e.eventType === 'mouseover' && !this.esEdicionFila) {
        if (e.column.dataField === 'PRECEDENTES') {
          this.targetIdTooltip = e.cellElement;
          // this.widthTooltip = '200px';
          var precedentes: any[] = [];
          if (typeof e.data.PRECEDENTES === 'string') {
            e.data.PRECEDENTES = JSON.parse(e.data.PRECEDENTES);
          }
          e.data.PRECEDENTES.forEach((prec: any) => {
            const dat: any = this.DTareas.filter(
              (d: any) => d.ID_ACTIVIDAD === prec
            );
            if (dat[0] !== undefined) {
              precedentes.push(dat[0]);
            }
          });
          // const nombres = precedentes
          //   .map((precedentes) => precedentes.NOMBRE)
          //   .join('\n');
          this.tooltipInfo = {
            TITULO: 'Precedentes',
            NOMBRE: precedentes,
          };
        }
        this.toolTipVisible = true;
      } else {
        this.toolTipVisible = false;
      }
    }
  }

  onCellPrepared(e: any) {
    if (e.rowType === 'data') {
      if (e.column.dataField === 'COLABORADORES') {
        if (e.value !== null && e.value !== '' && e.value !== undefined) {
          for (let i = 0; i < e.value.length; i++) {
            const pos: any = this.JsonDataSource['COLABORADORES'].findIndex(
              (d: any) => d.ID_RESPONSABLE === e.value[i]
            );
            if (pos !== -1) {
              const user: any = this.JsonDataSource['COLABORADORES'][pos];
              const npos: any = user.NOMBRE.indexOf(' ');
              const name = user.NOMBRE.charAt(0).toUpperCase();
              const lastName = user.NOMBRE.substring(
                npos + 1,
                user.NOMBRE.length + 1
              );
              const Lape = lastName.charAt(0).toUpperCase();
              const newName: string =
                name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
              e.value[i].NOMBRE = user.NOMBRE;
              e.value[i].iconNameUser = newName;
            } else if (e.value[i].FOTO === '' && e.value[i].NOMBRE) {
              const npos: any = e.value[i].NOMBRE.indexOf(' ');
              const name = e.value[i].NOMBRE.charAt(0).toUpperCase();
              const lastName = e.value[i].NOMBRE.substring(
                npos + 1,
                e.value[i].NOMBRE.length + 1
              );
              const Lape = lastName.charAt(0).toUpperCase();
              const newName: string =
                name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
              e.value[i].iconNameUser = newName;
            }
          }
        }
      }
    }
  }

  onRowPrepared(e: any) {
    if (e.rowType === 'data') {
      if (Number(e.data.ID_ACTIVIDAD) < 0 || e.data.CLASE === 'NODOS') {
        const className: string = e.rowElement.className;
        e.rowElement.className = className + ' xt-header-row';
      }
      if (
        [-1, -10, -20, -30, -40, -50].includes(Number(e.data.ID_ACTIVIDAD)) ||
        (e.data.CLASE === 'RESPONSABILIDADES' &&
          this.APLICACION === 'GES-001') ||
        (e.data.CLASE === 'NODOS' && e.data.ID_ACTIVIDAD_PADRE === -20) ||
        e.data.ANULADO
      ) {
        const dragicon = e.rowElement.getElementsByClassName('dx-command-drag');
        if (dragicon.length > 0) dragicon[0].style['visibility'] = 'hidden';
      }
      // if (e.data.isEdit) {
      //   const className:string = e.rowElement.className;
      //   e.rowElement.className = className +' row-modified-focused';
      // }
      //estilo para las Tareas Inactivas
      // if (e.data.ANULADO) {
      //   e.rowElement.style.background = 'rgba(98, 121, 140, 0.75) !important';
      // };
    }
  }

  onEditCanceled(e: any) {
    if (
      this.filasSeleccData !== undefined &&
      this.filasSeleccData !== null &&
      this.filasSeleccData !== ''
    ) {
      this.TreeListTareas.instance.cellValue(
        this.filasSeleccData.rowIndex,
        'heightColaboradores',
        '40px'
      );
      this.TreeListTareas.instance.cellValue(
        this.filasSeleccData.rowIndex,
        'readOnlyResponsables',
        true
      );
      this.TreeListTareas.instance.cellValue(
        this.filasSeleccData.rowIndex,
        'readOnlyColaboradores',
        true
      );
    }
    this.esEdicionFila = false;
    this.filasSeleccData = '';
    this.tituloEditor = '';
    this.valueContentDescripcion = '';
    this.contentDescripcionData = [];
    this.accionLocal = '';
    this.conCambios = 0;
    // this.TreeListTareas.instance.refresh();
  }

  opPrepararNuevaFila(cellInfo: any, accion: string) {
    switch (accion) {
      case 'new':
        if (this.editValidator(cellInfo, 'agregar')) {
          if (!this.esEdicionFila) {
            if (cellInfo !== '') {
              if (cellInfo.data.CLASE === 'NODOS')
                this.CLASE_ACTIVA = cellInfo.data.NOMBRE.toUpperCase();
              else this.CLASE_ACTIVA = cellInfo.data.CLASE;
              this.TreeListTareas.instance.addRow(cellInfo.data.ID_ACTIVIDAD);
            } else {
              this.TreeListTareas.instance.addRow();
            }
            this.accionLocal = 'new';
          } else {
            showToast(
              'No puede Agregar si esta en Edición la anterior.',
              'warning'
            );
          }
        }
        break;

      case 'cancel':
        this.esEdicionFila = false;
        this.CLASE_ACTIVA = '';
        cellInfo.data = JSON.parse(JSON.stringify(this.dataTarea_prev));
        // cellInfo.data.heightColaboradores = '40px';
        cellInfo.data.readOnlyResponsables = true;
        cellInfo.data.readOnlyColaboradores = true;
        this.TreeListTareas.instance.cancelEditData();
        // this.TreeListTareas.instance.refresh();
        break;

      case 'save':
        this.CLASE_ACTIVA = '';
        if (this.conCambios > 0) {
          this.TreeListTareas.instance.saveEditData();
        } else this.TreeListTareas.instance.cancelEditData();
        break;

      default:
        break;
    }
  }

  async initNewRow(e: any) {
    this.columnas.forEach((col: any) => {
      if (
        col.dataField !== undefined &&
        !col.dataField.match('ID_ACTIVIDAD|ID_ACTIVIDAD_PADRE|ITEM|CLASE')
      ) {
        switch (col.dataType) {
          case 'string':
            e.data[col.dataField] = '';
            break;

          case 'date':
            e.data[col.dataField] = new Date();
            break;

          case 'boolean':
            e.data[col.dataField] = false;
            break;

          case 'number':
            e.data[col.dataField] = 0;
            break;

          case 'object':
            e.data[col.dataField] = [];
            break;

          case 'json':
            e.data[col.dataField] = {};
            break;

          default:
            break;
        }
      } else if (col.dataField !== undefined && col.dataField === 'CLASE') {
        // const clase:any = this.DTareas.filter((d:any) => d.CLASE === 'NODOS')[0].NOMBRE;
        // e.data.CLASE = clase;
        e.data.CLASE = this.CLASE_ACTIVA;
      }
    });

    //Datos por defecto
    e.data.readOnlyResponsables = false;
    e.data.readOnlyColaboradores = false;
    e.data.ESTADO = this.editValidator(e, 'dato por defecto');

    if (this.DTareas.length > 0) {
      const item = this.DTareas.reduce((ant, act) => {
        return ant.ITEM > act.ITEM ? ant : act;
      });
      e.data.ITEM = item.ITEM + 1;
    } else {
      e.data.ITEM = 1;
    }

    if (this.DTareas.length > 0) {
      let item = this.DTareas.reduce((ant, act) => {
        return ant.ID_ACTIVIDAD > act.ID_ACTIVIDAD ? ant : act;
      });
      if (item.ID_ACTIVIDAD < 0) e.data.ID_ACTIVIDAD = 1;
      else e.data.ID_ACTIVIDAD = item.ID_ACTIVIDAD + 1;

      const data: any = this.DTareas.filter(
        (item) => item.ID_ACTIVIDAD === e.data.ID_ACTIVIDAD_PADRE
      )[0];
      e.data.TIPO = data.TIPO;
    } else {
      e.data.ID_ACTIVIDAD = 1;
    }

    if (this.accionFiltro === 'areas') {
      const data: any = this.DTareas.filter(
        (d: any) => d.ID_ACTIVIDAD === e.data.ID_ACTIVIDAD_PADRE
      )[0];
      e.data.RESPONSABLE = data.RESPONSABLE;
      e.data.readOnlyResponsables = true;
    }

    this.TreeListTareas.instance.refresh();
    this.esEdicionFila = true;
    this.filasSeleccData = e;
  }

  getDataSourceEstados(cellInfo: any) {
    var res: any = [];
    if (
      cellInfo.data.DATA_PROGRAMACION &&
      cellInfo.data.DATA_PROGRAMACION !== null &&
      cellInfo.data.DATA_PROGRAMACION !== 'null'
    ) {
      if (
        this.filasSeleccData !== undefined &&
        this.filasSeleccData !== null &&
        this.filasSeleccData !== '' &&
        this.filasSeleccData.data.ID_ACTIVIDAD === cellInfo.data.ID_ACTIVIDAD
      ) {
        res = this.JsonDataSource[cellInfo.column.dataField] || [];
      } else {
        res = this.JsonDataSource['prev_' + cellInfo.column.dataField] || [];
      }
    } else {
      let res1;
      if (
        this.filasSeleccData !== undefined &&
        this.filasSeleccData !== null &&
        this.filasSeleccData !== '' &&
        this.filasSeleccData.data.ID_ACTIVIDAD === cellInfo.data.ID_ACTIVIDAD
      ) {
        res1 = this.JsonDataSource[cellInfo.column.dataField] || [];
      } else {
        res1 = this.JsonDataSource['prev_' + cellInfo.column.dataField] || [];
      }
      res1.forEach((element) => {
        if (element.VALOR1 !== 'Completada') {
          res.push(element);
        }
      });
    }
    return of(res);
  }

  getDataSource(cellInfo: any) {
    var res: any = [];
    if (
      this.filasSeleccData !== undefined &&
      this.filasSeleccData !== null &&
      this.filasSeleccData !== '' &&
      this.filasSeleccData.data.ID_ACTIVIDAD === cellInfo.data.ID_ACTIVIDAD
    ) {
      res = this.JsonDataSource[cellInfo.column.dataField] || [];
    } else {
      res = this.JsonDataSource['prev_' + cellInfo.column.dataField] || [];
    }
    return of(res);
  }

  getDataHeight(cellInfo: any, campo: any) {
    var res: any = [];
    if (
      this.filasSeleccData !== undefined &&
      this.filasSeleccData !== null &&
      this.filasSeleccData !== '' &&
      this.filasSeleccData.data.ID_ACTIVIDAD === cellInfo.data.ID_ACTIVIDAD
    ) {
      switch (campo) {
        case 'COLABORADORES':
          if (
            this.esEdicionFila &&
            this.filasSeleccData.data.ID_ACTIVIDAD ===
            cellInfo.data.ID_ACTIVIDAD
          )
            res = '35px';
          else res = 'auto';
          break;
        case 'PRECEDENTES':
          if (
            this.esEdicionFila &&
            this.filasSeleccData.data.ID_ACTIVIDAD ===
            cellInfo.data.ID_ACTIVIDAD
          )
            res = '35px';
          else res = 'auto';
          break;

        default:
          res = 'auto';
          break;
      }
    }
    return of(res);
  }

  getDataReadOnly(cellInfo: any, campo: any) {
    var res: any = [];
    switch (campo) {
      case 'COLABORADORES':
      case 'GRUPOS':
      case 'RESPONSABLE':
      case 'PRECEDENTES':
        if (
          this.esEdicionFila &&
          this.filasSeleccData.data.ID_ACTIVIDAD === cellInfo.data.ID_ACTIVIDAD
        ) {
          res = cellInfo.data.ANULADO ? true : false;
        } else {
          res = true;
        }
        break;

      default:
        res = 'auto';
        break;
    }
    return of(res);
  }

  dynamicMaxDisplayedTags(): number {
    return this.esEdicionFila ? 1 : 6;
  }

  selectAreaFuncional() { }

  onDragStart(e: any) {
    if (e.itemData.CLASE === 'NODOS') {
      showToast('No puede mover este Item.', 'warning');
      e.cancel = true;
      return;
    }
  }

  onDragChange(e: any) {
    const visibleRows = e.component.getVisibleRows();
    const sourceNode = e.component.getNodeByKey(e.itemData.ID_ACTIVIDAD);
    const actPadre = visibleRows.filter(row => row.key === e.itemData.ID_ACTIVIDAD_PADRE);

    let targetNode = visibleRows[e.toIndex].node;
    this.accionLocal = 'update';
    if (sourceNode === undefined) return;

    switch (sourceNode.data.CLASE) {
      case 'RESPONSABILIDADES':
        if (
          targetNode.data.CLASE.match('TAREAS|EVENTOS') ||
          (targetNode.data.CLASE === 'NODOS' &&
            targetNode.data.ID_ACTIVIDAD !== -20)
        ) {
          showToast(
            'Las Responsabilidades solo pueden interactuar entre si.',
            'warning'
          );
          e.cancel = true;
          return;
        }
        break;

      case 'TAREAS':
        if (sourceNode.data.TIPO !== '' && sourceNode.data.TIPO !== null && sourceNode.data.TIPO !== targetNode.data.TIPO) {
          if (targetNode.data.CLASE === 'RESPONSABILIDADES' || targetNode.data.CLASE === 'EVENTOS' || targetNode.data.CLASE === 'TAREAS' || targetNode.data.CLASE === 'NODOS') {
            showToast('La Tarea pertenece a un proyecto o responsabilidad, No se puede arrastrar', 'warning');
            e.cancel = true;
            return;
          }
        }
        // if ((targetNode.data.TIPO === '' && targetNode.data.TIPO === null) || targetNode.data.NOMBRE !== 'Eventos') {
        //   showToast('La Tarea padre no es un Cargo y tampoco es un proyecto', 'warning');
        //   e.cancel = true;
        //   return;
        // }
        break;

      case 'EVENTOS':
        if (
          targetNode.data.CLASE === 'RESPONSABILIDADES' ||
          targetNode.data.CLASE === 'EVENTOS' ||
          targetNode.data.CLASE === 'TAREAS' ||
          targetNode.data.CLASE === 'NODOS'
        ) {
          showToast('Los Eventos solo se pueden mover a Tareas.', 'warning');
          e.cancel = true;
          return;
        }
        break;

      default:
        break;
    }

    while (targetNode && targetNode.data) {
      if (targetNode.data.ID_ACTIVIDAD === sourceNode.data.ID_ACTIVIDAD) {
        e.cancel = true;
        break;
      }
      targetNode = targetNode.parent;
    }
  }

  onReorder(e: any) {
    const visibleRows = e.component.getVisibleRows();
    const sourceNode = e.component.getNodeByKey(e.itemData.ID_ACTIVIDAD);
    let targetNode = visibleRows[e.toIndex].node;
    // showToast('Active la Edición para permitir esta función.', 'error');
    const sourceData = e.itemData;
    const toIndex = e.fromIndex > e.toIndex ? e.toIndex - 1 : e.toIndex;
    let targetData = toIndex >= 0 ? visibleRows[toIndex].node.data : null;
    var hijas: any[] = [];
    var subHijas: any[] = [];

    if (e.dropInsideItem) {
      e.itemData.ID_ACTIVIDAD_PADRE = visibleRows[e.toIndex].key;
      e.itemData.TEMP = e.itemData.ID_ACTIVIDAD_PADRE;
      if (visibleRows[e.toIndex].data.CLASE !== 'NODOS')
        e.itemData.CLASE = visibleRows[e.toIndex].data.CLASE;
      else {
        if (visibleRows[e.toIndex].data.NOMBRE === 'Responsabilidades')
          e.itemData.CLASE = 'RESPONSABILIDADES';
        if (visibleRows[e.toIndex].data.NOMBRE === 'Tareas')
          e.itemData.CLASE = 'TAREAS';
        if (visibleRows[e.toIndex].data.NOMBRE === 'Eventos')
          e.itemData.CLASE = 'EVENTOS';
        if (visibleRows[e.toIndex].data.NOMBRE === 'Comunitarias')
          e.itemData.CLASE = 'COMUNITARIAS';
      }

      //verifica si la actividad tiene hijas
      hijas = this.DTareas.filter(
        (d: any) => d.ID_ACTIVIDAD_PADRE === sourceData.ID_ACTIVIDAD
      );
      hijas.forEach((hija: any) => {
        hija.CLASE = e.itemData.CLASE;
        subHijas = this.DTareas.filter(
          (d: any) => d.ID_ACTIVIDAD_PADRE === hija.ID_ACTIVIDAD
        );
        var cont: any = subHijas.length;
        do {
          subHijas.forEach((subHija: any) => {
            subHija.CLASE = e.itemData.CLASE;
          });
          cont--;
        } while (cont > 0);
      });

      e.component.refresh();
    } else {
      //verifica si la actividad tiene hijas y sus responsables
      hijas = this.DTareas.filter(
        (d: any) => d.ID_ACTIVIDAD_PADRE === sourceData.ID_ACTIVIDAD
      );
      if (hijas.length > 0) {
        hijas.forEach((hija: any) => {
          const user_local: any = localStorage
            .getItem('usuario')
            ?.toUpperCase();
          if (hija.RESPONSABLE !== user_local) {
            e.cancel = true;
          }
        });
        if (e.cancel) {
          Swal.fire({
            title: 'Advertencia',
            text:
              'Esta actividad, tiene una Tarea hija cuyo responsable es otra persona,' +
              ' debe modificar la jerarquía de esa Tarea para poder continuar.',
            iconHtml: "<i class='icon-alert-ol'></i>",
            showCancelButton: false,
            confirmButtonColor: '#DF3E3E',
            cancelButtonColor: '#438ef1',
            cancelButtonText: 'No',
            confirmButtonText: 'Continuar',
          }).then((result) => {
            if (result.isConfirmed) {
              this.TreeListTareas.instance.refresh();
            }
            if (result.isDismissed) {
              this.TreeListTareas.instance.refresh();
            }
          });
          return;
        }
      }

      if (targetData && e.component.isRowExpanded(targetData.ID_ACTIVIDAD)) {
        sourceData.ID_ACTIVIDAD_PADRE = targetData.ID_ACTIVIDAD;
        sourceData.TEMP = sourceData.ID_ACTIVIDAD_PADRE;

        if (targetData.CLASE === 'RESPONSABILIDADES') {
          sourceData.TIPO = 'Permanente';
          sourceData.COLABORADORES = [];
        }
        if (targetData.CLASE !== 'NODOS') sourceData.CLASE = targetData.CLASE;
        else {
          if (targetData.NOMBRE === 'Responsabilidades')
            sourceData.CLASE = 'RESPONSABILIDADES';
          if (targetData.NOMBRE === 'Tareas') sourceData.CLASE = 'TAREAS';
          if (targetData.NOMBRE === 'Eventos') sourceData.CLASE = 'EVENTOS';
          if (targetData.NOMBRE === 'Comunitarias')
            sourceData.CLASE = 'COMUNITARIAS';
        }

        targetData = null;
      } else {
        sourceData.ID_ACTIVIDAD_PADRE = targetData
          ? targetData.ID_ACTIVIDAD_PADRE
          : -1;
        sourceData.TEMP = sourceData.ID_ACTIVIDAD_PADRE;
        if (targetData.CLASE === 'RESPONSABILIDADES') {
          sourceData.TIPO = 'Permanente';
          sourceData.COLABORADORES = [];
        }
        if (targetData.CLASE !== 'NODOS') sourceData.CLASE = targetData.CLASE;
        else {
          if (targetData.NOMBRE === 'Responsabilidades')
            sourceData.CLASE = 'RESPONSABILIDADES';
          if (targetData.NOMBRE === 'Tareas') sourceData.CLASE = 'TAREAS';
          if (targetData.NOMBRE === 'Eventos') sourceData.CLASE = 'EVENTOS';
          if (targetData.NOMBRE === 'Comunitarias')
            sourceData.CLASE = 'COMUNITARIAS';
        }
      }
    }
    this.conCambios++;
    const actPadre = visibleRows.filter(row => row.key === sourceData.ID_ACTIVIDAD_PADRE);
    if (actPadre[0].data.TIPO !== null) {
      sourceData.TIPO = actPadre[0].data.TIPO
    } else {
      sourceData.TIPO = ""
    }
    this.onRespuestaComponent.emit({
      accion: 'update datasource',
      data: sourceData,
      accionLocal: this.accionLocal,
    });
    if (hijas.length > 0) {
      hijas.forEach((hija: any) => {
        this.onRespuestaComponent.emit({
          accion: 'update datasource',
          data: hija,
          accionLocal: this.accionLocal,
        });
      });
    }
    this.TreeListTareas.instance.refresh();
  }

  editValidator(cellInfo: any, accion: string) {
    var res: any = true;
    switch (this.APLICACION) {
      case 'GES-001':
        switch (accion) {
          case 'agregar':
            if (
              cellInfo.data.ID_ACTIVIDAD === -20 ||
              cellInfo.data.ID_ACTIVIDAD_PADRE === -20 ||
              cellInfo.data.ID_ACTIVIDAD_PADRE <= -2000
            )
              res = false;
            else if (cellInfo.data.CLASE === 'RESPONSABILIDADES') res = false;
            else if (
              this.accionFiltro === 'areas' &&
              cellInfo.data.CLASE === 'NODOS'
            )
              res = false;
            else if (
              cellInfo.data.CLASE === 'EVENTOS' &&
              !accion.match('new|editar')
            )
              res = false;
            else if (cellInfo.data.ESTADO === 'Finalizado') res = false;
            break;

          case 'editar':
            if (cellInfo.data.ACT_AREA) res = true;
            else if (cellInfo.data.USUARIO === this.USUARIO_LOCAL) res = true;
            // else if (cellInfo.data.RESPONSABLE !== this.USUARIO_LOCAL) res = false;
            else if (cellInfo.data.CLASE === 'RESPONSABILIDADES') res = false;
            else if (
              cellInfo.data.COLABORADORES.findIndex(
                (ID_COLABORADOR: any) => ID_COLABORADOR === this.USUARIO_LOCAL
              ) !== -1
            )
              res = true;
            else if (cellInfo.data.ESTADO === 'Finalizado') res = false;
            break;
          case 'cambiar_estado':
            if (cellInfo.data.ACT_AREA) res = true;
            else if (cellInfo.data.USUARIO === this.USUARIO_LOCAL) res = true;
            // else if (cellInfo.data.RESPONSABLE !== this.USUARIO_LOCAL) res = false;
            else if (cellInfo.data.CLASE === 'RESPONSABILIDADES') res = false;
            else if (
              cellInfo.data.COLABORADORES.findIndex(
                (ID_COLABORADOR: any) => ID_COLABORADOR === this.USUARIO_LOCAL
              ) !== -1
            )
              res = true;
            else if (cellInfo.data.ESTADO === 'Finalizado') res = false;
            break;

          case 'inactivar':
            if (cellInfo.data.CLASE !== 'RESPONSABILIDADES') {
              if (cellInfo.data.RESPONSABLE === this.USUARIO_LOCAL) res = true;
              else if (cellInfo.data.USUARIO === this.USUARIO_LOCAL) {
                res = true;
              } else {
                if (cellInfo.data.COLABORADORES.length > 0) {
                  if (
                    cellInfo.data.COLABORADORES.findIndex(
                      (a: any) => a.ID_RESPONSABLE === this.USUARIO_LOCAL
                    ) !== -1
                  ) {
                    res = true;
                  } else {
                    res = false;
                  }
                } else {
                  res = false;
                }
              }
            } else {
              res = false;
            }
            break;

          case 'eliminar':
            if (cellInfo.data.CLASE !== 'RESPONSABILIDADES') {
              if (cellInfo.data.RESPONSABLE === this.USUARIO_LOCAL) res = true;
              else if (cellInfo.data.USUARIO === this.USUARIO_LOCAL) {
                res = true;
              } else {
                res = false;
              }
            } else {
              res = false;
            }
            break;

          case 'historial':
            if (
              cellInfo.data.ACT_AREA &&
              cellInfo.data.RESPONSABLE !== this.USUARIO_LOCAL
            )
              res = false;
            else if (cellInfo.data.CLASE === 'RESPONSABILIDADES') res = false;
            else if (
              cellInfo.data.COLABORADORES.findIndex(
                (d: any) => d.ID_RESPONSABLE === this.USUARIO_LOCAL
              ) !== -1
            )
              res = false;
            break;

          case 'fechas':
            res = true;
            break;

          case 'dato por defecto':
            // if (cellInfo.data.CLASE === 'TAREAS') res = 'Sin Iniciar';
            // if (cellInfo.data.CLASE === 'EVENTOS') res = 'Sin Iniciar';
            // if (cellInfo.data.CLASE === 'COMUNITARIAS') res = 'Sin Iniciar';
            res = 'Sin Iniciar';
            break;

          case 'menu':
            if (cellInfo.data.CLASE === 'NODOS') res = false;
            break;

          default:
            // if (cellInfo.data.ANULADO)
            //   res = false;
            if (
              cellInfo.data.ID_ACTIVIDAD === -20 ||
              cellInfo.data.ID_ACTIVIDAD_PADRE === -20 ||
              cellInfo.data.ID_ACTIVIDAD_PADRE <= -2000
            )
              res = false;
            else if (
              cellInfo.data.CLASE === 'RESPONSABILIDADES' ||
              cellInfo.data.CLASE === 'NODOS'
            )
              res = false;
            else if (
              cellInfo.data.CLASE === 'EVENTOS' &&
              !accion.match('new|editar')
            )
              res = false;
            else if (cellInfo.data.ESTADO === 'Finalizado') res = false;
            break;
        }

        break;

      case 'GES-003':
        switch (accion) {
          case 'inactivar':
            res = true;
            break;
          case 'eliminar':
            res = true;
            break;
          case 'editar':
            // if(cellInfo.data.ANULADO)
            //   res = false;
            if (cellInfo.data.ESTADO === 'Finalizado') res = false;
            break;
          case 'fechas':
            res = true;
            break;

          case 'dato por defecto':
            if (cellInfo.data.CLASE === 'RESPONSABILIDADES') res = 'En Proceso';
            break;

          case 'menu':
            if (cellInfo.data.CLASE === 'NODOS') res = false;
            break;

          default:
            if (this.readOnly) res = false;
            else if (cellInfo.data.ESTADO === 'Finalizado') res = false;
            // else if (cellInfo.data.ANULADO)
            //   res = false;
            break;
        }

        break;

      case 'CAL-002':
        switch (accion) {
          // case 'editar':
          //   if(cellInfo.data.ACT_AREA && cellInfo.data.RESPONSABLE !== this.USUARIO_LOCAL)
          //     res = false;
          //   else if (cellInfo.data.CLASE === 'RESPONSABILIDADES')
          //     res = false;
          //   else if(cellInfo.data.COLABORADORES.findIndex((d:any) => d.ID_RESPONSABLE === this.USUARIO_LOCAL) !== -1) {
          //     res = false;
          //   }
          //   break;

          case 'inactivar':
            if (cellInfo.data.CLASE !== 'RESPONSABILIDADES') {
              if (cellInfo.data.USUARIO === this.USUARIO_LOCAL) {
                res = true;
              } else {
                if (cellInfo.data.COLABORADORES.length > 0) {
                  if (
                    cellInfo.data.COLABORADORES.findIndex(
                      (a: any) => a.ID_RESPONSABLE === this.USUARIO_LOCAL
                    ) !== -1
                  ) {
                    res = true;
                  } else {
                    res = false;
                  }
                } else {
                  res = false;
                }
              }
            } else {
              res = false;
            }
            break;

          case 'eliminar':
            if (cellInfo.data.CLASE !== 'RESPONSABILIDADES') {
              if (cellInfo.data.USUARIO === this.USUARIO_LOCAL) {
                res = true;
              } else {
                res = false;
              }
            } else {
              res = false;
            }
            break;

          // case 'historial':
          //   if(cellInfo.data.ACT_AREA && cellInfo.data.RESPONSABLE !== this.USUARIO_LOCAL)
          //     res = false;
          //   else if (cellInfo.data.CLASE === 'RESPONSABILIDADES')
          //     res = false;
          //   else if(cellInfo.data.COLABORADORES.findIndex((d:any) => d.ID_RESPONSABLE === this.USUARIO_LOCAL) !== -1)
          //     res = false;
          //   break;

          case 'fechas':
            res = true;
            break;

          case 'dato por defecto':
            if (cellInfo.data.CLASE === 'PLANES DE ACCION') res = 'Sin Iniciar';
            break;

          case 'menu':
            if (cellInfo.data.CLASE === 'NODOS') res = false;
            break;

          default:
            if (cellInfo.data.ESTADO === 'Finalizado') res = false;
            break;
        }
        break;

      case 'GES-007':
        switch (accion) {
          case 'agregar':
            if (cellInfo.data.ESTADO === 'Finalizado') res = false;
            break;

          case 'editar':
            if (cellInfo.data.ESTADO === 'Finalizado') res = false;
            break;

          case 'inactivar':
            break;

          case 'eliminar':
            break;

          case 'historial':
            break;

          case 'fechas':
            res = true;
            break;

          case 'dato por defecto':
            if (cellInfo.data.CLASE === 'TAREAS') res = 'Sin Iniciar';
            if (cellInfo.data.CLASE === 'EVENTOS') res = 'Sin Iniciar';
            if (cellInfo.data.CLASE === 'COMUNITARIAS') res = 'Sin Iniciar';
            break;

          case 'menu':
            if (cellInfo.data.CLASE === 'NODOS') res = false;
            break;

          default:
            if (cellInfo.data.ESTADO === 'Finalizado') res = false;
            break;
        }

        break;

      default:
        break;
    }

    return res;
  }

  onRowClickChange(e: any) {
    if (
      this.nueva_actividad !== null &&
      this.nueva_actividad.ACTIVIDAD.ACCION === 'nueva_actividad'
    ) {
      for (let i = 0; i < this.DTareas.length; i++) {
        const element = this.DTareas[i];
        if (e.data.ID_ACTIVIDAD !== undefined) {
          if (element.ID_ACTIVIDAD === e.data.ID_ACTIVIDAD) {
            element.focus_actividad = false;
            localStorage.removeItem('nueva_actividad');
          }
        }
      }
    }
  }
  onRowClick(e: any) {
    if (
      e.data.RESPONSABLE === this.USUARIO_LOCAL ||
      e.data.USUARIO === this.USUARIO_LOCAL ||
      e.data.ACT_AREA ||
      e.data.COLABORADORES.includes(this.USUARIO_LOCAL) ||
      this.APLICACION === 'GES-007'
    ) {
      if (
        !(
          e.event.target.parentElement.classList.contains(
            'dx-treelist-expanded'
          ) ||
          e.event.target.parentElement.classList.contains(
            'dx-treelist-collapsed'
          ) ||
          e.event.target.parentElement.classList.contains('dx-button-content')
        )
      ) {
        if (!this.readOnly && !e.data.ANULADO) {
          if (e.data.CLASE !== 'NODOS') {
            if (this.editValidator(e, 'editar')) {
              if (!this.esEdicionFila) {
                this.dataTarea_prev = JSON.parse(JSON.stringify(e.data));
                e.component.editRow(e.rowIndex);
                e.data.readOnlyResponsables = false;
                e.data.readOnlyColaboradores = false;
                this.TreeListTareas.instance.cellValue(
                  e.rowIndex,
                  'readOnlyColaboradores',
                  false
                );
                this.TreeListTareas.instance.cellValue(
                  e.rowIndex,
                  'readOnlyResponsables',
                  false
                );
                this.esEdicionFila = true;
                this.filasSeleccData = e;
                this.accionLocal = 'update';
              } else {
                if (
                  this.filasSeleccData.rowIndex !== null &&
                  this.filasSeleccData.rowIndex !== undefined
                ) {
                  if (this.filasSeleccData.rowIndex !== e.rowIndex) {
                    showToast(
                      'No puede modificar esta Tarea si esta en Edición la tarea anterior.',
                      'warning'
                    );
                    // let rowIndex = this.filasSeleccData.rowIndex;
                    // let row = e.component.getRowElement(rowIndex)[0];
                    // row.classList.add("row-animation");
                    // e.data.heightColaboradores = '40px';
                    // setTimeout(() => {
                    //   row.classList.remove("row-animation");
                    // }, 2000);
                  }
                }
              }
            }
          } else {
            e.cancel = true;
            e.data.heightColaboradores = '40px';
            return;
          }
        }
      }
    } else {
      showToast(
        'No puede modificar esta Tarea si no eres el responsable.',
        'warning'
      );
    }
  }

  showProgramarFechas(e: any, cellInfo: any) {
    if (
      !this.esEdicionFila ||
      this.filasSeleccData.data.ID_ACTIVIDAD === cellInfo.data.ID_ACTIVIDAD
    ) {
      if (this.editValidator(cellInfo, 'fechas')) {
        if (this.esEdicionFila) {
          var startDate: any =
            cellInfo.data.FECHA_INICIO !== null &&
              cellInfo.data.FECHA_INICIO !== undefined &&
              cellInfo.data.FECHA_INICIO !== ''
              ? cellInfo.data.FECHA_INICIO
              : new Date();
          var endDate: any =
            cellInfo.data.FECHA_FIN !== null &&
              cellInfo.data.FECHA_FIN !== undefined &&
              cellInfo.data.FECHA_FIN !== ''
              ? cellInfo.data.FECHA_FIN
              : new Date();
          var allDay: any =
            cellInfo.data.TODO_DIA !== null &&
              cellInfo.data.TODO_DIA !== undefined
              ? cellInfo.data.TODO_DIA
              : false;
          this.filasSeleccData = cellInfo;
          this.datProgFila = cellInfo.rowIndex;
          this.dataProg = {
            rangoFecha: this.rangoFecha,
            accion: 'modificar',
            text: cellInfo.data.NOMBRE,
            startDate: startDate,
            endDate: endDate,
            allDay: allDay,
            ID_ACTIVIDAD: cellInfo.data.ID_ACTIVIDAD,
            editing: true,
            cellData: cellInfo.data,
          };

          this.eventsSubjectProg.next(this.dataProg);
        } else {
          var startDate: any =
            cellInfo.data.FECHA_INICIO !== null &&
              cellInfo.data.FECHA_INICIO !== ''
              ? cellInfo.data.FECHA_INICIO
              : new Date();
          var endDate: any =
            cellInfo.data.FECHA_FIN !== null && cellInfo.data.FECHA_FIN !== ''
              ? cellInfo.data.FECHA_FIN
              : new Date();
          var allDay: any =
            cellInfo.data.TODO_DIA !== null &&
              cellInfo.data.TODO_DIA !== undefined
              ? cellInfo.data.TODO_DIA
              : false;
          this.filasSeleccData = cellInfo;
          this.datProgFila = cellInfo.rowIndex;
          this.dataProg = {
            rangoFecha: this.rangoFecha,
            text: cellInfo.data.NOMBRE,
            startDate: startDate,
            endDate: endDate,
            allDay: allDay,
            ID_ACTIVIDAD: cellInfo.data.ID_ACTIVIDAD,
            editing: false,
          };
          this.eventsSubjectProg.next(this.dataProg);
        }
      }
    } else {
      showToast(
        'No puede visualizar la programación si esta en edición la tarea anterior.',
        'warning'
      );
    }
  }

  getMonthName(monthNumber: any) {
    const date = new Date();
    date.setMonth(monthNumber - 1);

    return date.toLocaleString('en-US', {
      month: 'long',
    });
  }

  // Compone cadena que muestra la programacion escogida
  setProgramacion(data) {
    let respProg: any;
    let compInicial: any;
    let compFinal: any;
    const fecha_inicial = new Date(data.data.FECHA_INICIO);
    const fecha_final = new Date(data.data.FECHA_FIN);

    if (fecha_inicial && fecha_final) {
      compInicial = this.generalesService.getFechaComponents(fecha_inicial);
      compFinal = this.generalesService.getFechaComponents(fecha_final);

      const mismoDia =
        compInicial.dia === compFinal.dia &&
        fecha_inicial.getMonth() === fecha_final.getMonth() &&
        fecha_inicial.getFullYear() === fecha_final.getFullYear();
      const mismoMes =
        fecha_inicial.getMonth() === fecha_final.getMonth() &&
        fecha_inicial.getFullYear() === fecha_final.getFullYear();

      if (data.data.TODO_DIA && !data.data.REPETIR) {
        if (mismoDia) {
          respProg = `El ${compInicial.dia} Todo el día`;
        } else if (mismoMes) {
          respProg = `${compInicial.dia} - ${compFinal.dia} ${compFinal.mes} Todo el día`;
        } else {
          respProg = `${compInicial.dia} ${compInicial.mes} - ${compFinal.dia} ${compFinal.mes} Todo el día`;
        }
      } else if (!data.data.TODO_DIA && data.data.REPETIR) {
        if (mismoDia) {
          respProg = `${compInicial.dia} - ${compInicial.mes}`;
        } else if (mismoMes) {
          respProg = `${compInicial.dia} - ${compFinal.dia} ${compInicial.mes}`;
        } else {
          respProg = `${compInicial.dia} - ${compInicial.mes} ${compInicial.ano} - ${compFinal.dia} - ${compFinal.mes} ${compFinal.ano}`;
        }
      } else if (data.data.TODO_DIA && data.data.REPETIR) {
        if (mismoDia) {
          respProg = `${compInicial.dia} - ${compInicial.mes} Todo el día`;
        } else if (mismoMes) {
          respProg = `${compInicial.dia} - ${compFinal.dia} ${compInicial.mes} Todo el día`;
        } else {
          respProg = `${compInicial.dia} - ${compInicial.mes} ${compInicial.ano} - ${compFinal.dia} - ${compFinal.mes} ${compFinal.ano} Todo el día`;
        }
      } else if (!data.data.TODO_DIA && !data.data.REPETIR) {
        if (mismoDia) {
          respProg = `${compInicial.dia} - ${compInicial.mes}`;
        } else if (mismoMes) {
          respProg = `${compInicial.dia} - ${compFinal.dia} ${compInicial.mes}`;
        } else {
          respProg = `${compInicial.dia} - ${compInicial.mes} ${compInicial.ano} - ${compFinal.dia} - ${compFinal.mes} ${compFinal.ano}`;
        }
      }
      // let fechaHoy = new Date();
      // if (fecha_final.getFullYear() === fechaHoy.getFullYear()) {
      //   respProg = `${compFinal.dia}-${compFinal.mes}`;
      // } else {
      //   respProg = `${compFinal.dia}-${compFinal.mes}-${compFinal.ano}`;
      // }
    }

    // Actualiza valor en el treelist
    data.data.PROGRAMACION = respProg;
    if (data.data.REPETIR) {
      data.data.DATA_PROGRAMACION = {
        TODO_DIA: data.data.TODO_DIA,
        REPETIR: data.data.REPETIR,
        PROGRAMACION: data.data.PROGRAMACION,
        ID_ACTIVIDAD: data.data.ID_ACTIVIDAD,
        FECHA_INICIAL: fecha_inicial,
        FECHA_FINAL: fecha_final,
        TIPO_FIN_FRECUENCIA: data.data.TIPO_FIN_FRECUENCIA,
        FRECUENCIA: data.data.FRECUENCIA,
        INTERVALO_FRECUENCIA: data.data.INTERVALO_FRECUENCIA,
        PERIODO_FRECUENCIA_DIA: data.data.PERIODO_FRECUENCIA_DIA,
        PERIODO_FRECUENCIA_MES: data.data.PERIODO_FRECUENCIA_MES,
        FIN_FRECUENCIA: data.data.FIN_FRECUENCIA,
        FECHA_REGISTRO: this.datepipe.transform(
          new Date(),
          'yyyy/MM/dd'
        ),
      };
      data.data.DATA_PROGRAMACION.RECURRENCERULE =
        this.crearStringRecurrenceRule(data.data.DATA_PROGRAMACION);
    } else {
      data.data.DATA_PROGRAMACION = null;
    }
    if (data.data.RECORDATORIO) {
      let act: any[] = this.DTareas.filter(
        (i: any) => i.ID_ACTIVIDAD === data.data.ID_ACTIVIDAD
      );
      let desc: any = {
        tituloFecha: `Fecha de inicio: `,
        tituloDescripcion: 'No olvides prepararte con antelación.',
        TODO_DIA: data.data.TODO_DIA,
        NOMBRE: act[0].NOMBRE,
        DIA: compInicial.dia,
        MES: compInicial.mesFromatoNumero,
        ANO: compInicial.ano,
        HORAS: compInicial.horas,
        MINUTOS: compInicial.minutos,
      };
      if (act[0].CLASE === 'TAREAS') {
        desc = { tituloName: `Tienes una tarea programada: `, ...desc };
      } else if (act[0].CLASE === 'EVENTOS') {
        desc = { tituloName: `Tienes un evento programado: `, ...desc };
      }
      data.data.DATA_RECORDATORIO = {
        TIPO_RECORDATORIO: data.data.TIPO_RECORDATORIO,
        FECHA_ENVIO: null,
        DESCRIPCION_REC: JSON.stringify(desc),
      };
      if (data.data.TIPO_RECORDATORIO === 'TODO_DIA_R') {
        data.data.DATA_RECORDATORIO = {
          INTERVALO_REC: null,
          INTERVALO_REC_FECHA: data.data.INTERVALO_REC_FECHA
            ? data.data.INTERVALO_REC_FECHA
            : null,
          ...data.data.DATA_RECORDATORIO,
        };
      } else {
        data.data.DATA_RECORDATORIO = {
          INTERVALO_REC: data.data.INTERVALO_REC ? data.data.INTERVALO_REC : 1,
          INTERVALO_REC_FECHA: null,
          ...data.data.DATA_RECORDATORIO,
        };
      }
    } else {
      data.data.DATA_RECORDATORIO = null;
    }

    this.TreeListTareas.instance.cellValue(
      this.filasSeleccData.rowIndex,
      'PROGRAMACION',
      data.data.PROGRAMACION
    );
    this.TreeListTareas.instance.cellValue(
      this.filasSeleccData.rowIndex,
      'DATA_PROGRAMACION',
      JSON.stringify(data.data.DATA_PROGRAMACION)
    );
    this.TreeListTareas.instance.cellValue(
      this.filasSeleccData.rowIndex,
      'REPETIR',
      data.data.REPETIR
    );
    this.TreeListTareas.instance.cellValue(
      this.filasSeleccData.rowIndex,
      'TODO_DIA',
      data.data.TODO_DIA
    );
    this.TreeListTareas.instance.cellValue(
      this.filasSeleccData.rowIndex,
      'FECHA_FIN',
      data.data.FECHA_FIN
    );
    this.TreeListTareas.instance.cellValue(
      this.filasSeleccData.rowIndex,
      'FECHA_INICIO',
      data.data.FECHA_INICIO
    );
    this.TreeListTareas.instance.cellValue(
      this.filasSeleccData.rowIndex,
      'FRECUENCIA',
      data.data.REPETIR === false ? '' : data.data.FRECUENCIA
    );
    this.TreeListTareas.instance.cellValue(
      this.filasSeleccData.rowIndex,
      'PERIODO_FRECUENCIA_DIA',
      data.data.REPETIR === false ? '' : data.data.PERIODO_FRECUENCIA_DIA
    );
    this.TreeListTareas.instance.cellValue(
      this.filasSeleccData.rowIndex,
      'INTERVALO_FRECUENCIA',
      data.data.REPETIR === false ? '' : data.data.INTERVALO_FRECUENCIA
    );
    this.TreeListTareas.instance.cellValue(
      this.filasSeleccData.rowIndex,
      'RECORDATORIO',
      data.data.RECORDATORIO
    );
    this.TreeListTareas.instance.cellValue(
      this.filasSeleccData.rowIndex,
      'DATA_RECORDATORIO',
      JSON.stringify(data.data.DATA_RECORDATORIO)
    );
    this.TreeListTareas.instance.refresh();
  }

  setProgramacionACTPR(data) {
    let respProg = '';

    const fecha_inicial = new Date(data.data.FECHA_INICIO);
    const fecha_final = new Date(data.data.FECHA_FIN);

    if (fecha_inicial && fecha_final) {
      const compInicial =
        this.generalesService.getFechaComponents(fecha_inicial);
      const compFinal = this.generalesService.getFechaComponents(fecha_final);

      const mismoDia =
        compInicial.dia === compFinal.dia &&
        fecha_inicial.getMonth() === fecha_final.getMonth() &&
        fecha_inicial.getFullYear() === fecha_final.getFullYear();
      const mismoMes =
        fecha_inicial.getMonth() === fecha_final.getMonth() &&
        fecha_inicial.getFullYear() === fecha_final.getFullYear();

      if (data.data.TODO_DIA && !data.data.REPETIR) {
        if (mismoDia) {
          respProg = `El ${compInicial.dia} Todo el día`;
        } else if (mismoMes) {
          respProg = `${compInicial.dia} - ${compFinal.dia} ${compFinal.mes} Todo el día`;
        } else {
          respProg = `${compInicial.dia} ${compInicial.mes} - ${compFinal.dia} ${compFinal.mes} Todo el día`;
        }
      } else if (!data.data.TODO_DIA && data.data.REPETIR) {
        if (mismoDia) {
          respProg = `${compInicial.dia} - ${compInicial.mes}`;
        } else if (mismoMes) {
          respProg = `${compInicial.dia} - ${compFinal.dia} ${compInicial.mes}`;
        } else {
          respProg = `${compInicial.dia} - ${compInicial.mes} ${compInicial.ano} - ${compFinal.dia} - ${compFinal.mes} ${compFinal.ano}`;
        }
      } else if (
        (!data.data.TODO_DIA && !data.data.REPETIR) ||
        (data.data.TODO_DIA && data.data.REPETIR)
      ) {
        if (mismoDia) {
          respProg = `${compInicial.dia} - ${compInicial.mes}`;
        } else if (mismoMes) {
          respProg = `${compInicial.dia} - ${compFinal.dia} ${compInicial.mes}`;
        } else {
          respProg = `${compInicial.dia} - ${compInicial.mes} ${compInicial.ano} - ${compFinal.dia} - ${compFinal.mes} ${compFinal.ano}`;
        }
      }

      // let fechaHoy = new Date()
      // if (fecha_final.getFullYear() === fechaHoy.getFullYear()) {
      //   respProg = `${compFinal.dia}-${compFinal.mes}`;
      // } else {
      //   respProg = `${compFinal.dia}-${compFinal.mes}-${compFinal.ano}`;
      // }
    }

    // Actualiza valor en el treelist
    data.data.PROGRAMACION = respProg;
    if (
      data.data.DATA_PROGRAMACION &&
      data.data.DATA_PROGRAMACION !== null &&
      data.data.DATA_PROGRAMACION !== 'null'
    ) {
      let DATA_PROGRAMACION = data.data.DATA_PROGRAMACION;
      data.data.REPETIR = DATA_PROGRAMACION.REPETIR;
      data.data.FECHA_INICIAL = DATA_PROGRAMACION.FECHA_INICIAL;
      data.data.FECHA_FINAL = DATA_PROGRAMACION.FECHA_FINAL;
    }
    if (
      data.data.DATA_RECORDATORIO &&
      data.data.DATA_RECORDATORIO !== null &&
      data.data.DATA_RECORDATORIO !== 'null'
    ) {
      let DATA_RECORDATORIO = data.data.DATA_RECORDATORIO;
      data.data.TIPO_RECORDATORIO = DATA_RECORDATORIO.TIPO_RECORDATORIO;
      data.data.INTERVALO_REC = DATA_RECORDATORIO.INTERVALO_REC;
      data.data.INTERVALO_REC_FECHA = DATA_RECORDATORIO.INTERVALO_REC_FECHA;
    }
  }

  crearStringRecurrenceRule(data) {
    if (data) {
      const frecuencia = data.FRECUENCIA; // 'REPETIR'
      const intervalo = data.INTERVALO_FRECUENCIA; // 'CADA CUANTO'
      const finFrecuencia = data.FIN_FRECUENCIA; // 'FINALIZA DESPUES DE' o 'FINALIZA EN'
      const tipoFinFrecuencia = data.TIPO_FIN_FRECUENCIA; // 'NUNCA', 'UNTIL' o conteo
      const periodoFrecuenciadia = data.PERIODO_FRECUENCIA_DIA; // 'REPETIR EN' días de la semana
      const periodoFrecuenciames = data.PERIODO_FRECUENCIA_MES; // 'REPETIR EN' meses

      const partes: string[] = [];

      // 'REPETIR': FRECUENCIA
      if (frecuencia) {
        partes.push(`FREQ=${frecuencia}`);
      }

      // 'CADA CUANTO': INTERVALO_FRECUENCIA
      if (intervalo) {
        partes.push(`INTERVAL=${intervalo}`);
      }

      // 'FINALIZA DESPUES DE': FIN_FRECUENCIA
      if (tipoFinFrecuencia) {
        if (tipoFinFrecuencia === 'NUNCA') {
          // No se agrega nada si es NUNCA
        } else if (tipoFinFrecuencia === 'UNTIL') {
          partes.push(`UNTIL=${this.convertirFechaYHora(finFrecuencia)}`);
        } else {
          partes.push(`COUNT=${finFrecuencia}`);
        }
      }

      // 'REPETIR EN': PERIODO_FRECUENCIA_DIA
      if (frecuencia === 'WEEKLY' && periodoFrecuenciadia) {
        partes.push(`BYDAY=${periodoFrecuenciadia}`);
      } else if (frecuencia === 'MONTHLY') {
        if (periodoFrecuenciadia) {
          partes.push(`BYMONTHDAY=${periodoFrecuenciadia}`);
        }
      } else if (frecuencia === 'YEARLY') {
        if (periodoFrecuenciadia) {
          partes.push(`BYMONTHDAY=${periodoFrecuenciadia}`);
        }
        if (periodoFrecuenciames) {
          partes.push(`BYMONTH=${periodoFrecuenciames}`);
        }
      }
      return partes.join(';');
    } else {
      return '';
    }
  }

  getIconEstatus(estado: string): string {
    let iconEstado: string = '';

    switch (estado) {
      case 'Sin Iniciar':
        iconEstado = 'icon-disminuir-ol';
        break;
      case 'En Pausa':
        iconEstado = 'icon-alert-ol';
        break;
      case 'En Proceso':
        iconEstado = 'icon-arrow-right-sl';
        break;
      case 'Finalizado':
        iconEstado = 'icon-aceptar-ol';
        break;

      default:
        break;
    }
    return iconEstado
  }

  changeStatus(actividadSelected, estadoNuevo: string) {

    let prm = {
      ID_ACTIVIDAD: actividadSelected.ID_ACTIVIDAD,
      ESTADO: estadoNuevo,
    };

    this._sdatos.changeStatus('update status', prm).subscribe((data: any) => {
      const res = validatorRes(data);
      if (data.token !== undefined) {
        const refreshToken = data.token;
        localStorage.setItem('token', refreshToken);
      }
      if (res[0].ErrMensaje !== '') {
        showToast(res[0].ErrMensaje, 'error');
        return;
      }
      showToast(`Actividad actualizada a ${estadoNuevo}`, 'success');
    });

  }

  onContextMenuPreparing(e: any) {

    if (this.editValidator(e.row, 'menu')) {
      if (e.row.data.CLASE !== 'NODOS' && !this.readOnly) {
        let nextEstado: string = '';
        switch (e.row.data.ESTADO) {
          case 'Sin Iniciar':
            nextEstado = 'En Proceso';
            break;
          case 'En Pausa':
            nextEstado = 'En Proceso';
            break;
          case 'En Proceso':
            nextEstado = 'Finalizado';
            break;

          default:
            break;
        }

        let items: any = [];
        const selectedItems = [e.row.key];
        const hasEditData = e.component.hasEditData();

        const index = this.DTareas.findIndex(
          (a: any) => a.ID_ACTIVIDAD === selectedItems[0]
        );
        // if (this.DTareas[index].ANULADO)
        //   return;

        if (selectedItems.length === 0) {
          items = [
            {
              text: 'No selected rows',
              disabled: true,
            },
          ];
        } else {
          const subItems: any = [];
          const rowData = e.component.getSelectedRowsData();

          selectedItems.forEach((item) => {
            rowData.forEach((data: any) => {
              if (item === data.ID_ACTIVIDAD) {
                subItems.push({
                  text: item,
                  items: [
                    {
                      text: 'Editar',
                      onClick: () => {
                        e.component.editRow(e.component.getRowIndexByKey(item));
                        this.esEdicionFila = true;
                      },
                    },
                    {
                      template: function () {
                        return `<div> Actividad: ${data.ID_ACTIVIDAD} </div>
                                <div> Detalle: ${data.NOMBRE} </div>
                                <div> Padre: ${data.ID_ACTIVIDAD_PADRE} </div>
                                <div> Responsable: ${data.RESPONSABLE} </div>
                                <div> Estado: ${data.ESTADO} </div>
                                `;
                      },
                      onClick: () => {
                        console.log(data);
                      },
                    },
                  ],
                });
              }
            });
          });
        }

        const data_act: any = this.DTareas[index];
        items.push(
          {
            text: 'Editar',
            disabled: this.disabledOption(data_act, e, 'Editar'),
            onClick: () => {
              if (selectedItems.length !== 0) {
                const npos: any = this.DTareas.findIndex(
                  (d: any) => d.ID_ACTIVIDAD === selectedItems[0]
                );
                this.DTareas[npos].readOnlyResponsables = false;
                this.DTareas[npos].readOnlyColaboradores = false;
                e.component.editRow(
                  e.component.getRowIndexByKey(selectedItems[0])
                );
                this.esEdicionFila = true;
                this.accionLocal = 'update';
              }
            },
          },
          {
            text: 'Crear',
            disabled: this.disabledOption(data_act, e, 'Crear'),
            onClick: () => {
              this.opPrepararNuevaFila(e.row, 'new');
              this.esEdicionFila = true;
            },
          },
          {
            text: `Pasar a ${nextEstado}`,
            disabled: this.disabledOption(data_act, e, 'cambiar_estado'),
            onClick: () => {
              this.changeStatus(e.row.data, nextEstado);
              e.row.data.ESTADO = nextEstado;
              if (nextEstado == 'Finalizado') {
                const index = this.DTareas.findIndex(
                  (a: any) => a.ID_ACTIVIDAD === selectedItems[0]
                );

                if (index != -1) {
                  this.DTareas.splice(index, 1)

                }
              }
              this.TreeListTareas.instance.refresh();

              this.envioNotificacion('notificacion', e.row.data, '', 'change_status');

            },
          },
          {
            text: 'Cancelar',
            disabled: this.disabledOption(data_act, e, 'Cancelar'),
            onClick: () => {
              e.component.cancelEditData();
              this.esEdicionFila = false;
            },
          },
          {
            text: 'Activar',
            disabled: this.disabledOption(data_act, e, 'Activar'),
            onClick: () => {
              if (selectedItems.length === 0) {
                showToast('No hay actividad seleccionada', 'error');
                return;
              }
              // Elimina filas seleccionadas
              let nom_act = '';
              let actividades: any = '';
              const index = this.DTareas.findIndex(
                (a: any) => a.ID_ACTIVIDAD === selectedItems[0]
              );
              actividades = this.DTareas.filter(
                (b: any) =>
                  b.ID_ACTIVIDAD_PADRE === this.DTareas[index].ID_ACTIVIDAD
              );
              nom_act = this.DTareas[index].NOMBRE;

              if (this.editValidator(e.row, 'inactivar')) {
                var msj: string;
                if (actividades.length > 0)
                  msj =
                    'La tarea seleccionada tiene tareas hijas registradas, si la Activa, las tareas hijas seran Activadas!';
                else msj = '¿Desea activar esta tarea: ' + nom_act + '?';
                Swal.fire({
                  title: '',
                  text: msj,
                  iconHtml: "<i class='icon-alert-ol'></i>",
                  showCancelButton: true,
                  confirmButtonColor: '#DF3E3E',
                  cancelButtonColor: '#438ef1',
                  cancelButtonText: 'No',
                  confirmButtonText: 'Sí, activar',
                }).then((result) => {
                  if (result.isConfirmed) {
                    this.accionLocal = 'update';
                    selectedItems.forEach((item: any) => {
                      const index = this.DTareas.findIndex(
                        (a) => a.ID_ACTIVIDAD === item
                      );
                      this.DTareas[index].ANULADO = false;
                      this.onRespuestaComponent.emit({
                        accion: 'update datasource',
                        data: this.DTareas[index],
                        accionLocal: this.accionLocal,
                      });
                      actividades.forEach((actividad: any) => {
                        const index = this.DTareas.findIndex(
                          (a) => a.ID_ACTIVIDAD === actividad.ID_ACTIVIDAD
                        );
                        this.DTareas[index].ANULADO = false;
                        this.onRespuestaComponent.emit({
                          accion: 'update datasource',
                          data: this.DTareas[index],
                          accionLocal: this.accionLocal,
                        });
                      });
                      this.TreeListTareas.instance.refresh();
                    });
                  }
                });
                this.accionLocal = '';
              }
            },
          },
          {
            text: 'Inactivar',
            disabled: this.disabledOption(data_act, e, 'Inactivar'),
            onClick: () => {
              if (selectedItems.length === 0) {
                showToast('No hay actividad seleccionada', 'error');
                return;
              }
              // Elimina filas seleccionadas
              let nom_act = '';
              let actividades: any = '';
              const index = this.DTareas.findIndex(
                (a: any) => a.ID_ACTIVIDAD === selectedItems[0]
              );
              actividades = this.DTareas.filter(
                (b: any) =>
                  b.ID_ACTIVIDAD_PADRE === this.DTareas[index].ID_ACTIVIDAD
              );
              nom_act = this.DTareas[index].NOMBRE;

              if (this.editValidator(e.row, 'inactivar')) {
                var msj: string;
                if (actividades.length > 0)
                  msj =
                    'La tarea seleccionada tiene tareas hijas registradas, si la inactiva, las tareas hijas seran inactivadas!';
                else msj = '¿Desea inactivar esta tarea: ' + nom_act + '?';
                Swal.fire({
                  title: '',
                  text: msj,
                  iconHtml: "<i class='icon-alert-ol'></i>",
                  showCancelButton: true,
                  confirmButtonColor: '#DF3E3E',
                  cancelButtonColor: '#438ef1',
                  cancelButtonText: 'No',
                  confirmButtonText: 'Sí, inactivar',
                }).then((result) => {
                  if (result.isConfirmed) {
                    this.accionLocal = 'update';
                    selectedItems.forEach((item: any) => {
                      const index = this.DTareas.findIndex(
                        (a) => a.ID_ACTIVIDAD === item
                      );
                      this.DTareas[index].ANULADO = true;
                      this.onRespuestaComponent.emit({
                        accion: 'update datasource',
                        data: this.DTareas[index],
                        accionLocal: this.accionLocal,
                      });
                      actividades.forEach((actividad: any) => {
                        const index = this.DTareas.findIndex(
                          (a) => a.ID_ACTIVIDAD === actividad.ID_ACTIVIDAD
                        );
                        this.DTareas[index].ANULADO = true;
                        this.onRespuestaComponent.emit({
                          accion: 'update datasource',
                          data: this.DTareas[index],
                          accionLocal: this.accionLocal,
                        });
                      });
                      this.TreeListTareas.instance.refresh();
                    });
                  }
                });
                this.accionLocal = '';
              }
            },
          },
          {
            text: 'Eliminar',
            disabled: this.disabledOption(data_act, e, 'Eliminar'),

            onClick: () => {
              if (selectedItems.length === 0) {
                showToast('No hay actividad seleccionada', 'error');
                return;
              }
              // Elimina filas seleccionadas
              let nom_act = '';
              let actividades: any[] = [];
              const index = this.DTareas.findIndex(
                (a: any) => a.ID_ACTIVIDAD === selectedItems[0]
              );
              actividades = this.DTareas.filter(
                (b: any) =>
                  b.ID_ACTIVIDAD_PADRE === this.DTareas[index].ID_ACTIVIDAD
              );
              nom_act = this.DTareas[index].NOMBRE;
              if (this.editValidator(e.row, 'eliminar')) {
                var msj: string;
                if (actividades.length > 0) {
                  // msj = 'La tarea seleccionada tiene tareas hijas registradas, no se puede eliminar!';
                  showToast(
                    'La tarea seleccionada tiene tareas hijas registradas, no se puede eliminar!',
                    'warning'
                  );
                  return;
                } else {
                  msj = '¿Desea eliminar esta tarea: ' + nom_act + '?';
                  Swal.fire({
                    title: '',
                    text: msj,
                    iconHtml: "<i class='icon-alert-ol'></i>",
                    showCancelButton: true,
                    confirmButtonColor: '#DF3E3E',
                    cancelButtonColor: '#438ef1',
                    cancelButtonText: 'No',
                    confirmButtonText: 'Sí, eliminar',
                  }).then((result) => {
                    if (result.isConfirmed) {
                      this.accionLocal = 'delete';
                      selectedItems.forEach((item: any) => {
                        switch (this.APLICACION) {
                          case 'GES-001':
                            const index = this.DTareas.findIndex(
                              (a) => a.ID_ACTIVIDAD === item
                            );
                            this.DTareas[index].ELIMINADO = true;
                            this.onRespuestaComponent.emit({
                              accion: 'update datasource',
                              data: this.DTareas[index],
                              accionLocal: this.accionLocal,
                            });
                            this.DTareas.splice(index, 1);
                            this.TreeListTareas.instance.refresh();
                            break;

                          default:
                            break;
                        }
                      });
                    }
                  });
                }
                this.accionLocal = '';
              } else {
                showToast('No es responsable de esta Tarea', 'warning');
              }
            },
          },
          {
            text: 'Historial',
            disabled: this.disabledOption(data_act, e, 'Historial'),
            onClick: () => {
              this.valoresObjetos('timeline', data_act.ID_ACTIVIDAD, '');
              this.tituloHistorial = data_act.NOMBRE;
            },
          },
          {
            text: 'Enviar por Email',
            disabled: data_act.ANULADO ? true : false,
            onClick: () => {
              this.onRespuestaComponent.emit({
                accion: 'enviar email',
                data: data_act,
              });
            },
          }
        );

        items.sort(function (a: any, b: any) {
          var nombreA = a.text.toUpperCase();
          var nombreB = b.text.toUpperCase();
          if (nombreA < nombreB) {
            return -1; // Si nombreA es menor que nombreB, se coloca antes en el orden
          }
          if (nombreA > nombreB) {
            return 1; // Si nombreA es mayor que nombreB, se coloca después en el orden
          }
          return 0; // Si los nombres son iguales, no se cambia el orden entre ellos
        });

        e.items = items;
      }
    }
  }

  onFocusedRowChanged(e: any) {
    const rowData = e.row && e.row.data;
    let cellValue: unknown;

    if (rowData) {
      cellValue = e.component.cellValue(e.row.rowIndex, 'Assigned');
    }
  }

  onContentVisibilityChange(visible) {
    if (!visible) {
      this.gridScrollPosition = this.TreeListTareas.instance
        .getScrollable()
        .scrollTop();
    } else if (this.gridScrollPosition > 0) {
      this.TreeListTareas.instance
        .getScrollable()
        .scrollTo({ top: this.gridScrollPosition });
    }
  }

  // Ejecuta la eliminación de una actividad
  AccionEliminar(actividad: any, elemento: any): void {
    const prm = { ID_ACTIVIDAD: actividad, CATEGORIA: elemento };
  }

  onFocusIn(e: any, cellInfo: any) {
    this.tituloEditor = cellInfo.data.NOMBRE;
    this.valueContentDescripcion = cellInfo.data.DESCRIPCION_ESTILO
      ? cellInfo.data.DESCRIPCION_ESTILO
      : cellInfo.data.DESCRIPCION;
    this.contentDescripcionData = cellInfo;
    this.visibleEditorTexto = true;
  }

  onValueChangedEditorText(e: any) {
    this.valueContentDescripcion = e.value;
  }

  aceptarBottom(e: any) {
    if (
      this.filasSeleccData.data.DESCRIPCION_ESTILO !==
      this.valueContentDescripcion
    ) {
      this.filasSeleccData.data.DESCRIPCION_ESTILO =
        this.valueContentDescripcion;
      this.filasSeleccData.data.DESCRIPCION =
        this.valueContentDescripcion.replace(/<\/?[^>]+(>|$)/g, '');
      this.TreeListTareas.instance.cellValue(
        this.contentDescripcionData.rowIndex,
        'DESCRIPCION',
        this.filasSeleccData.data.DESCRIPCION
      );
      this.TreeListTareas.instance.cellValue(
        this.contentDescripcionData.rowIndex,
        'DESCRIPCION_ESTILO',
        this.filasSeleccData.data.DESCRIPCION_ESTILO
      );
      this.conCambios++;
    }
    this.visibleEditorTexto = false;
  }

  closeBottom(e: any) {
    this.tituloEditor = '';
    this.valueContentDescripcion = '';
    this.visibleEditorTexto = false;
  }

  onEditingStart(e: any) {
    this.esEdicionFila = true;
    this.filasSeleccData = e;
    e.data.readOnlyResponsables = false;
    e.data.readOnlyColaboradores = false;

    setTimeout(() => {
      const rowIndex = e.component.getRowIndexByKey(e.key);
      e.component.focus(e.component.getCellElement(rowIndex, 0));
    }, 100);
  }

  onValueChangedNombre(e: any, cellInfo: any) {
    if (e.value.length <= 100) {
      cellInfo.data.NOMBRE = e.value.charAt(0).toUpperCase() + e.value.slice(1);
      this.TreeListTareas.instance.cellValue(
        cellInfo.rowIndex,
        'NOMBRE',
        cellInfo.data.NOMBRE
      );
    } else {
      showToast(
        'El nombre es muy largo, si necesita escribir más puede añadir en Descripción.',
        'error'
      );
    }
    this.conCambios++;
  }

  onSelectionChangedResponsable(e: any, cellInfo: any) {
    if (e.value !== null && e.value !== undefined && e.value !== 0) {
      if (
        cellInfo.data.COLABORADORES !== undefined &&
        cellInfo.data.COLABORADORES.length > 0
      ) {
        const npos: any = cellInfo.data.COLABORADORES.findIndex(
          (d: any) => d === e.value
        );
        if (npos > -1) {
          cellInfo.data.RESPONSABLE = '';
          this.TreeListTareas.instance.cellValue(
            cellInfo.rowIndex,
            'RESPONSABLE',
            cellInfo.data.RESPONSABLE
          );
          showToast(
            'El usuario no puede ser Resonsable y Colaborador de la misma tarea.',
            'error'
          );
        } else {
          cellInfo.data.RESPONSABLE = e.value;
          this.TreeListTareas.instance.cellValue(
            cellInfo.rowIndex,
            'RESPONSABLE',
            cellInfo.data.RESPONSABLE
          );
          const pos: any = this.JsonDataSource['COLABORADORES'].findIndex(
            (d: any) => d.ID_RESPONSABLE === e.value
          );
          this.JsonDataSource['COLABORADORES'].splice(pos, 1);
        }
      } else {
        cellInfo.data.RESPONSABLE = e.value;
        this.TreeListTareas.instance.cellValue(
          cellInfo.rowIndex,
          'RESPONSABLE',
          cellInfo.data.RESPONSABLE
        );
        if (
          cellInfo.data.COLABORADORES !== undefined &&
          cellInfo.data.COLABORADORES !== null
        ) {
          const pos: any = this.JsonDataSource['COLABORADORES'].findIndex(
            (d: any) => d.ID_RESPONSABLE === e.value
          );
          this.JsonDataSource['COLABORADORES'].splice(pos, 1);
        }
      }
    }
    this.conCambios++;
  }

  onInitializedFromResponsables(e: any) {
    for (let i = 0; i < this.JsonDataSource['COLABORADORES'].length; i++) {
      const data: any = this.JsonDataSource['COLABORADORES'][i];
      const npos: any = data.NOMBRE.indexOf(' ');
      const name = data.NOMBRE.charAt(0).toUpperCase();
      const lastName = data.NOMBRE.substring(npos + 1, data.NOMBRE.length + 1);
      const Lape = lastName.charAt(0).toUpperCase();
      const newName: string =
        name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
      data.iconNameUser = newName;
    }
  }

  templateHtmlColb(data: any, element: any): any {
    let cad = [{ ID_RESPONSABLE: '', NOMBRE: '', iconNameUser: '', FOTO: '' }];
    let res: any = '';
    const pos: any = this.JsonDataSource['COLABORADORES'].findIndex(
      (d: any) => d.ID_RESPONSABLE === data
    );
    const USR: any = this.JsonDataSource['COLABORADORES'][pos];
    this.templateGroup.forEach((col: any) => {
      if (USR !== null && USR !== undefined) {
        cad[0].ID_RESPONSABLE = USR.ID_RESPONSABLE;
        cad[0].NOMBRE = USR.NOMBRE;
        cad[0].iconNameUser = USR.iconNameUser;
        cad[0].FOTO = USR.FOTO;
        switch (element) {
          case 'iconNameUser':
            res = cad[0].iconNameUser;
            break;
          case 'NOMBRE':
            res = cad[0].NOMBRE;
            break;
          default:
            break;
        }
      }
    });
    return res;
  }

  onValueChange(e: any, cellInfo: any) {
    if (this.selectedType === 'grupos') {
      this.onValueGrupos(e, cellInfo)
    } else {
      this.onValueColaboradores(e, cellInfo)
    }
  }

  onValueColaboradores(e: any, cellInfo: any) {
    if (this.selectedType === 'grupos' && cellInfo.data.GRUPOS > 0) {
      this.showModal('Ya tienes grupos en esta actividad,', 'Validación.', "<i class='icon-alert-ol'></i>");
      cellInfo.data.GRUPOS = [];
      this.TreeListTareas.instance.cellValue(
        cellInfo.rowIndex,
        'GRUPOS',
        cellInfo.data.GRUPOS
      );
      this.conCambios++;
    } else {
      if (e.selectedRowKeys.length > 0) {
        cellInfo.data.ES_GRUPO = false;
        if (cellInfo.data.RESPONSABLE !== '') {
          if (
            e.selectedRowKeys.findIndex((d: any) => d === cellInfo.data.RESPONSABLE) === -1
          ) {
            // cellInfo.data.COLABORADORES = newCol;
            cellInfo.data.COLABORADORES = e.selectedRowKeys;
            this.TreeListTareas.instance.cellValue(
              cellInfo.rowIndex,
              'COLABORADORES',
              cellInfo.data.COLABORADORES
            );
          } else {
            cellInfo.data.COLABORADORES = e.previousValue;
            this.TreeListTareas.instance.cellValue(
              cellInfo.rowIndex,
              'COLABORADORES',
              cellInfo.data.COLABORADORES
            );
            showToast(
              'El usuario seleccionado no puede ser RESPONSABLE Y COLABORADOR en la misma tarea.',
              'error'
            );
            return;
          }
        } else {
          cellInfo.data.COLABORADORES = e.value;
          this.TreeListTareas.instance.cellValue(
            cellInfo.rowIndex,
            'COLABORADORES',
            cellInfo.data.COLABORADORES
          );
        }
        this.conCambios++;
      } else {
        cellInfo.data.COLABORADORES = e.value;
        this.TreeListTareas.instance.cellValue(
          cellInfo.rowIndex,
          'COLABORADORES',
          cellInfo.data.COLABORADORES
        );
        this.conCambios++;
      }
    }
  }
  onValueGrupos(e: any, cellInfo: any) {
    if (this.selectedType === 'grupos' && cellInfo.data.COLABORADORES > 0) {
      this.showModal('Ya tienes colaboradores en esta actividad,', 'Validación.', "<i class='icon-alert-ol'></i>");
      cellInfo.data.GRUPOS = [];
      this.TreeListTareas.instance.cellValue(
        cellInfo.rowIndex,
        'GRUPOS',
        cellInfo.data.GRUPOS
      );
      this.conCambios++;
    } else {
      if (e.selectedRowKeys.length > 0) {
        cellInfo.data.ES_GRUPO = true;
        cellInfo.data.GRUPOS = e.selectedRowKeys;
        this.TreeListTareas.instance.cellValue(
          cellInfo.rowIndex,
          'GRUPOS',
          cellInfo.data.GRUPOS
        );
        this.conCambios++;
      } else {
        cellInfo.data.GRUPOS = e.previousValue;
        this.TreeListTareas.instance.cellValue(
          cellInfo.rowIndex,
          'GRUPOS',
          cellInfo.data.GRUPOS
        );
        this.conCambios++;
      }
    }
  }

  onValuePrecedentes(e: any, cellInfo: any) {
    if (e.value !== undefined && e.value !== null) {
      if (e.value.length > 0) {
        if (cellInfo.data.ID_ACTIVIDAD !== '') {
          let newPrecedentes = new Set<string>();

          e.value.forEach((ele: any) => {
            newPrecedentes.add(ele);
          });
        }
      }
    } else {
      cellInfo.data.PRECEDENTES = [];
      this.TreeListTareas.instance.cellValue(
        cellInfo.rowIndex,
        'PRECEDENTES',
        cellInfo.data.PRECEDENTES
      );
      this.conCambios++;
    }
  }

  aceptarBottomPrec(cellInfo: any) {
    if (cellInfo.data.PRECEDENTES.length > 0) {
      cellInfo.data.PRECEDENTES = cellInfo.data.PRECEDENTES;
      this.TreeListTareas.instance.cellValue(
        cellInfo.rowIndex,
        'PRECEDENTES',
        cellInfo.data.PRECEDENTES
      );
      this.conCambios++;
    } else {
      cellInfo.data.PRECEDENTES = [];
      this.TreeListTareas.instance.cellValue(
        cellInfo.rowIndex,
        'PRECEDENTES',
        cellInfo.data.PRECEDENTES
      );
      this.conCambios++;
    }
    this.openDropFiltroAreas = false;
  }

  closeBottomPrec() {
    this.openDropFiltroAreas = false;
  }

  agregarHijos(idPadre: string, precedentes: Set<string>) {
    this.DTareas.forEach((tarea: any) => {
      if (
        tarea.ID_ACTIVIDAD_PADRE === idPadre &&
        !precedentes.has(tarea.ID_ACTIVIDAD)
      ) {
        precedentes.add(tarea.ID_ACTIVIDAD);
        this.agregarHijos(tarea.ID_ACTIVIDAD, precedentes);
      }
    });
  }

  async onSelectionEstado(e: any, cellInfo: any) {

    let vPrecedentes: boolean = true;

    if (cellInfo.data.PRECEDENTES.length > 0) {
      vPrecedentes = await this.validarEstadoPrecedentes(cellInfo.data.ID_ACTIVIDAD, cellInfo);
    }
    if (vPrecedentes) {

      if (e.value === 'Finalizado') {
        const Thijas: any[] = this.DTareas.filter(
          (d: any) => d.ID_ACTIVIDAD_PADRE === cellInfo.data.ID_ACTIVIDAD
        );
        if (Thijas.length > 0) {
          Thijas.forEach((tar: any) => {
            if (tar.ESTADO === 'Finalizado') {
              cellInfo.data.ESTADO = e.value;
              this.TreeListTareas.instance.cellValue(
                cellInfo.rowIndex,
                'ESTADO',
                cellInfo.data.ESTADO
              );
              return;
            }
            showToast(
              'Esta ' +
              cellInfo.data.CLASE +
              ', tiene ' +
              cellInfo.data.CLASE.toLowerCase() +
              ' hijas sin finalizar.',
              'warning'
            );

            return;
          });
        } else {
          if (e.previousValue === '' || e.previousValue === 'Sin Iniciar') {
            showToast(
              'No puede Finalizar esta ' +
              cellInfo.data.CLASE +
              ', sin antes estar En Proceso o Pausada.',
              'warning'
            );
            cellInfo.data.ESTADO = e.previousValue;
            this.TreeListTareas.instance.cellValue(
              cellInfo.rowIndex,
              'ESTADO',
              cellInfo.data.ESTADO
            );
            return;
          } else {
            cellInfo.data.ESTADO = e.value;
            this.TreeListTareas.instance.cellValue(
              cellInfo.rowIndex,
              'ESTADO',
              cellInfo.data.ESTADO
            );
            this.conCambios++;

            this.TreeListTareas.instance.cellValue(
              cellInfo.rowIndex,
              'AVANCE',
              (cellInfo.data.AVANCE = 100)
            );
          }
        }
      } else if (e.value === 'En Proceso') {

        cellInfo.data.ESTADO = e.value;
        this.TreeListTareas.instance.cellValue(
          cellInfo.rowIndex,
          'ESTADO',
          cellInfo.data.ESTADO
        );


        this.TreeListTareas.instance.cellValue(
          cellInfo.rowIndex,
          'AVANCE',
          (cellInfo.data.AVANCE = 25)
        );
        this.conCambios++;
      } else if (e.value === 'Sin Iniciar') {
        cellInfo.data.ESTADO = e.value;
        this.TreeListTareas.instance.cellValue(
          cellInfo.rowIndex,
          'ESTADO',
          cellInfo.data.ESTADO
        );
        this.TreeListTareas.instance.cellValue(
          cellInfo.rowIndex,
          'AVANCE',
          (cellInfo.data.AVANCE = 0)
        );
      }
    }
  }
  async onSelectionAvance(e: any, cellInfo: any) {
    let vPrecedentes: boolean = true;

    if (cellInfo.data.PRECEDENTES.length > 0) {
      vPrecedentes = await this.validarPrecedentes(cellInfo.data.ID_ACTIVIDAD, cellInfo, 'avance');
    }
    if (vPrecedentes) {
      cellInfo.data.AVANCE = e.value;

      this.TreeListTareas.instance.cellValue(
        cellInfo.rowIndex,
        'AVANCE',
        cellInfo.data.AVANCE
      );

      if (e.value > 0 && e.value < 100) {
        this.TreeListTareas.instance.cellValue(
          cellInfo.rowIndex,
          'ESTADO',
          (cellInfo.data.ESTADO = 'En Proceso')
        );
      } else if (e.value === 0) {
        this.TreeListTareas.instance.cellValue(
          cellInfo.rowIndex,
          'ESTADO',
          (cellInfo.data.ESTADO = 'Sin Iniciar')
        );
      }

      if (e.value === 100) {
        this.TreeListTareas.instance.cellValue(
          cellInfo.rowIndex,
          'ESTADO',
          (cellInfo.data.ESTADO = 'Finalizado')
        );
      }
      this.conCambios++;
    }
  }

  onValueChangedDescripcion(e: any, cellInfo: any) {
    cellInfo.data.DESCRIPCION =
      e.value.charAt(0).toUpperCase() + e.value.slice(1);
    this.TreeListTareas.instance.cellValue(
      cellInfo.rowIndex,
      'DESCRIPCION',
      cellInfo.data.DESCRIPCION
    );
    this.conCambios++;
  }

  onSelectionPrioridad(e: any, cellInfo: any) {
    cellInfo.data.PRIORIDAD = e.value;
    this.TreeListTareas.instance.cellValue(
      cellInfo.rowIndex,
      'PRIORIDAD',
      cellInfo.data.PRIORIDAD
    );
    this.conCambios++;
  }

  showChatsComentarios(e: any, cellInfo: any) {
    if (!this.esEdicionFila) {
      this.accionLocal = 'historial';
      let editing: boolean = false;
      cellInfo.data.count_actividad = 0;
      cellInfo.data.focus_actividad = false;
      if (this.editValidator(cellInfo, this.accionLocal)) editing = false;
      else editing = true;
      this.onRespuestaComponent.emit({
        accion: 'historial tarea',
        data: cellInfo.data,
        readOnly: editing,
      });
    } else {
      showToast('Estas editando una ACTIVIDAD', 'warning');
    }
  }

  onRowValidating(e: any) {
    var res: boolean = false;
    let mensaje: any = '';
    let propiedadesVacias: any = [];

    switch (this.accionLocal) {
      case 'new':
        for (let key in this.JsonDatosValidar) {
          if (
            !e.newData[key] ||
            e.newData[key] === '' ||
            e.newData[key].length < 0
          ) {
            propiedadesVacias.push(key);
          }
        }
        if (propiedadesVacias.length > 0) {
          mensaje = `Para guardar el registro, debe llenar los siguientes campos: ${propiedadesVacias.join(
            ', '
          )}, complete la información.`;
          e.isValid = false;
          res = false;
        } else {
          e.newData.readOnlyResponsables = true;
          e.newData.readOnlyColaboradores = true;
          e.newData.heightColaboradores = '40px';
          e.isValid = true;
          this.tituloEditor = '';
          this.valueContentDescripcion = '';
          res = true;
        }
        break;

      case 'update':
        for (let prop in e.newData) {
          if (
            e.newData.hasOwnProperty(prop) &&
            e.oldData.hasOwnProperty(prop)
          ) {
            e.oldData[prop] = e.newData[prop];
          }
        }
        for (let key in this.JsonDatosValidar) {
          if (!e.oldData[key] || e.oldData[key] === '') {
            propiedadesVacias.push(key);
          }
        }
        if (propiedadesVacias.length > 0) {
          mensaje = `Para actualizar el registro, debe llenar los siguientes campos: ${propiedadesVacias.join(
            ', '
          )}, complete la información.`;
          e.isValid = false;
          res = false;
        } else {
          e.oldData.readOnlyResponsables = true;
          e.oldData.readOnlyColaboradores = true;
          e.oldData.heightColaboradores = '40px';
          this.tituloEditor = '';
          this.valueContentDescripcion = '';
          e.isValid = true;
          res = true;
        }
        break;

      default:
        e.isValid = false;
        res = false;
        break;
    }

    if (res) {
      this.esEdicionFila = false;
      this.conCambios = 0;
    } else {
      showToast(mensaje, 'error');
    }
    return res;
  }

  onRowUpdated(e: any) {
    this.esEdicionFila = false;
    e.data.isEdit = true;
    this.onRespuestaComponent.emit({
      accion: 'update datasource',
      data: e.data,
      accionLocal: this.accionLocal,
    });
    this.TreeListTareas.instance.refresh();
  }

  onRowInserted(e: any) {
    this.esEdicionFila = false;
    e.data.isEdit = true;
    this.onRespuestaComponent.emit({
      accion: 'update datasource',
      data: e.data,
      accionLocal: this.accionLocal,
    });
    this.accionLocal = '';
    this.TreeListTareas.instance.refresh();
  }

  valoresObjetos(obj: string, datos: any, accion: string) {
    if (obj === 'timeline') {
      const prm: any = { ID_ACTIVIDAD: datos };
      this._sdatos.getEstados('TIMELINE', prm).subscribe((data: any) => {
        const res = validatorRes(data);
        if (data.token !== undefined) {
          const refreshToken = data.token;
          localStorage.setItem('token', refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
          return;
        }
        res.forEach((event: any) => {
          if (event.ARCHIVOS === undefined || event.ARCHIVOS === null)
            event.ARCHIVOS = [];
        });
        this.DTimeline = res.filter((d: any) => d.TIPO === 'AUTOMATICO');
        this.visibleGesproHistorial = true;
      });
    }
    if (obj === 'grupos') {
      this.loadingVisible = true;
      const prm = {};
      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
        .getEstados('GRUPOS', prm, 'GES004', 'consulta')
        .subscribe((data: any) => {
          try {
            this.loadingVisible = false;
            const res = JSON.parse(data.data);
            if (data.token != undefined) {
              const refreshToken = data.token;
              localStorage.setItem('token', refreshToken);
            }
            const datares = res;
            if (datares.length > 0 && datares[0].ErrMensaje === '') {
              if (datares ?? '' != '') {
                for (let i = 0; i < datares.length; i++) {
                  const element = datares[i];
                  element.ID_RESPONSABLE = element.USUARIO;
                }
                this.DGrupos = datares;
              }
            } else {
              if (datares.length !== 0) {
                showToast(datares[0].ErrMensaje, 'warning');
              } else if (datares.length === 0) {
                showToast('No hay grupos', 'warning');
              }

              //this.opBlanquearFormDM();
            }
          } catch (error) {
            this.loadingVisible = false;
          }
        });
    }

  }

  convertirFechaYHora(fechaHoraStr) {
    const partes = fechaHoraStr.split('/'); // ["10", "31", "2024"]
    const mes = parseInt(partes[0]) - 1; // Mes 0-indexado (octubre)
    const dia = parseInt(partes[1]);
    const anio = parseInt(partes[2]);

    // Crear la fecha con horas y minutos en UTC
    const fecha = new Date(Date.UTC(anio, mes, dia)); // 0 segundos

    // Formatear la fecha en el formato "YYYYMMDDTHHMMSSZ"
    const anioFormateado = fecha.getUTCFullYear();
    const mesFormateado = String(fecha.getUTCMonth() + 1).padStart(2, '0'); // Mes 1-indexado
    const diaFormateado = String(fecha.getUTCDate()).padStart(2, '0');

    // Retornar la fecha en el formato deseado
    return `${anioFormateado}${mesFormateado}${diaFormateado}T000000Z`;
  }

  receiveMessageACT(data: any) {
    for (let i = 0; i < this.DTareas.length; i++) {
      const element = this.DTareas[i];
      if (element.ID_ACTIVIDAD === data.ACTIVIDAD_DATA.ID_ACTIVIDAD) {
        element.count_actividad = element.count_actividad
          ? element.count_actividad + 1
          : 0 + 1;
        element.focus_actividad = true;
      }
    }
  }

  disabledOption(data_act, e, accion) {
    let res: boolean = false;
    switch (accion) {
      case 'cambiar_estado':
        if (
          data_act.ESTADO === 'Finalizado' ||
          this.esEdicionFila ||
          !this.editValidator(e.row, 'cambiar_estado') ||
          data_act.ANULADO
        ) {
          res = true;
        } else {
          res = this.esEdicionFila;
        }
        break;
      case 'Eliminar':
        if (
          data_act.ESTADO === 'Finalizado' ||
          this.esEdicionFila ||
          !this.editValidator(e.row, 'eliminar') ||
          data_act.ANULADO
        ) {
          res = true;
        } else {
          res = this.esEdicionFila;
        }
        break;
      case 'Crear':
        if (
          data_act.ESTADO === 'Finalizado' ||
          this.esEdicionFila ||
          data_act.ANULADO
        ) {
          res = true;
        } else {
          res = this.esEdicionFila;
        }
        break;
      case 'Editar':
        if (
          data_act.ESTADO === 'Finalizado' ||
          this.esEdicionFila ||
          !this.editValidator(e.row, 'eliminar') ||
          data_act.ANULADO
        ) {
          res = true;
        } else {
          res = this.esEdicionFila;
        }
        break;
      case 'Inactivar':
        if (
          data_act.ESTADO === 'Finalizado' ||
          this.esEdicionFila ||
          !this.editValidator(e.row, 'eliminar') ||
          data_act.ANULADO
        ) {
          res = true;
        } else {
          res = this.esEdicionFila;
        }
        break;
      case 'Activar':
        if (
          data_act.ESTADO === 'Finalizado' ||
          this.esEdicionFila ||
          !this.editValidator(e.row, 'eliminar') ||
          !data_act.ANULADO
        ) {
          res = true;
        } else {
          res = this.esEdicionFila;
        }
        break;
      case 'Cancelar':
        if (
          data_act.ESTADO === 'Finalizado' ||
          !this.esEdicionFila ||
          data_act.ANULADO
        ) {
          res = true;
        } else {
          res = !this.esEdicionFila;
        }
        break;
      case 'Historial':
        if (data_act.ANULADO) {
          res = true;
        } else {
          res = false;
        }
        break;

      default:
        break;
    }

    return res;
  }

  format(ratio) {
    let value = ratio * 100;
    return `${value > 0 && value < 100 ? value.toFixed(2) : value}%`;
  }

  filtrarActividades(textFilter: string) {
    const data_prev = this.DTareas2;
    const NODOS = this.DTareas2.filter((d) =>
      d.CLASE.toLowerCase().includes('NODOS'.toLowerCase())
    );
    let newArray: any = [];
    if (textFilter.length > 2) {
      const tareas = this.DTareas2.filter(
        (tarea: any) =>
          tarea.CLASE !== 'NODOS' &&
          (tarea.NOMBRE.toLowerCase().includes(textFilter.toLowerCase()) ||
            (tarea.DESCRIPCION !== null && tarea.DESCRIPCION !== undefined && tarea.DESCRIPCION !== '' ? tarea.DESCRIPCION.toLowerCase().includes(textFilter.toLowerCase()) : '') ||
            tarea.ESTADO.toLowerCase().includes(textFilter.toLowerCase()) ||
            tarea.NOMBRE_RESPONSABLE.includes(textFilter))
      );
      if (tareas.length > 0) {
        newArray.push(...NODOS);
        newArray.push(...tareas);
      } else {
        newArray = data_prev;
      }
    } else {
      newArray = data_prev;
    }
    this.DTareas = newArray;
  }
  validarEstadoPrecedentes(ID_ACTIVIDAD: string, cellInfo: any): Promise<boolean> {

    return new Promise<boolean>((resolve) => {
      let prm = { ID_ACTIVIDAD: ID_ACTIVIDAD, "ACCION": "VALIDACION" };

      this.generalesService
        .consulta('CAMBIO ESTADO', prm, 'GES0-07')
        .subscribe((response: any) => {
          let data = validatorRes(response);

          if (data[0].ErrMensaje !== '' && data[0].ErrMensaje !== undefined && data[0].ErrMensaje !== null) {
            let msj = data[0].ErrMensaje;
            this.showModal(msj, 'Validación de precedentes.', "<i class='icon-alert-ol'></i>");
            resolve(false);
          } else {
            resolve(true);
          }
        });
    });
  }
  validarPrecedentes(ID_ACTIVIDAD: string, cellInfo: any, tipo: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let prm = { ID_ACTIVIDAD: ID_ACTIVIDAD };

      this.generalesService
        .consulta('VALIDAR PRECEDENTES', prm, 'GES00')
        .subscribe((response: any) => {
          let data = validatorRes(response);
          let nombres: string = '';
          for (let i = 0; i < data.length; i++) {
            const element = data[i];
            if (data.length > 1) {
              nombres += `${element.NOMBRE}, `
            } else {
              nombres += `${element.NOMBRE}`
            }
          }
          if (data[0].ID_ACTIVIDAD !== '' && data[0].ID_ACTIVIDAD !== undefined && data[0].ID_ACTIVIDAD !== null) {
            let msj = `La actividad <strong>${cellInfo.data.NOMBRE}</strong> no puede cambiar su ${tipo} hasta que las actividades <strong>${nombres}</strong> esten Finalizadas`;
            this.showModal(msj, 'Validación de precedentes.', "<i class='icon-alert-ol'></i>");
            resolve(false);
          } else {
            resolve(true);
          }
        });
    });
  }

  showModal(mensaje: any, title: any, icon: string) {
    const tipo = title;
    Swal.fire({
      iconHtml: icon,
      confirmButtonColor: tipo === 'Error' ? 'DF3E3E' : '#0F4C81 !important',
      title: title,
      html: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      stopKeydownPropagation: false,
    });
  }


  envioNotificacion(fuente: any, prm: any, TIMELINE: any, accion: string) {
    const TIPO_TAREA: any = prm.CLASE;
    const usr_env: any = this.DResponsables.filter(
      (d: any) => d.ID_RESPONSABLE === this.USUARIO_LOCAL
    );

    let nombrePartes = usr_env[0].NOMBRE.split(' ');
    let user_name = nombrePartes.length > 2 ? nombrePartes[0] + ' ' + nombrePartes[2] : nombrePartes[0] + ' ' + nombrePartes[1]

    let usr_rec: String[] = [];
    usr_rec.push(prm.RESPONSABLE);
    usr_rec.push(prm.USUARIO);
    if (prm.COLABORADORES.length > 0 && prm.COLABORADORES != undefined && prm.COLABORADORES != null) {
      prm.COLABORADORES.forEach((user) =>
        usr_rec.push(user))
    }
    const index = usr_rec.indexOf(this.USUARIO_LOCAL);
    if (index !== -1) {
      usr_rec.splice(index, 1); // Elimina ese elemento
    }
    usr_rec = [...new Set(usr_rec)];

    var sendMail: boolean = false;
    var msj: any = '';
    var desc: any = '';

    if (fuente === 'notificacion') {
      sendMail = false;
    } else if (fuente === 'enviar email') {
      sendMail = true;
      msj = 'Envio de Correo';
    }

    if (accion === 'change_status') {
      desc = '';
      if (TIPO_TAREA === 'RESPONSABILIDAD') {
        msj = user_name + ', cambio el estado de la' + 'RESPONSABILIDAD ' + prm.NOMBRE.toUpperCase() + ' a ' + prm.ESTADO;
      }
      if (TIPO_TAREA === 'EVENTOS') {
        msj = user_name + ', cambio el estado del ' + 'EVENTO ' + prm.NOMBRE.toUpperCase() + ' a ' + prm.ESTADO;
      }
      if (TIPO_TAREA === 'COMUNITARIAS') {
        msj = user_name + ', cambio el estado de la ' + 'Tarea ' + prm.NOMBRE.toUpperCase() + ' a ' + prm.ESTADO;
      }
      if (TIPO_TAREA === 'TAREAS') {
        msj = user_name + ', cambio el estado de la ' + 'TAREA ' + prm.NOMBRE.toUpperCase() + ' a ' + prm.ESTADO;
      }

      accion = 'modifico_actividad'
    }

    //Envia el responsable
    const posApl: any = this.generalesService.APLICACIONES.findIndex((d: any) => d.ID_APLICACION === this._sdatos.prmUsrAplBarReg.aplicacion);
    var dataNotificacion: any = {
      APLICACION: this._sdatos.prmUsrAplBarReg.aplicacion,
      ID_APLICACION: this._sdatos.prmUsrAplBarReg.aplicacion,
      NOMBRE_APLICACION: posApl > -1 ? this.generalesService.APLICACIONES[posApl].NOMBRE : null,
      FECHA: this.datepipe.transform(
        new Date(),
        'MM/dd/yyyy HH:mm:ss'
      ),
      USUARIO_ENV: usr_env[0],
      USUARIO_REC: usr_rec,
      DESCRIPCION: msj,
      TIPO: 'AUTOMATICA',
      FECHA_UPDATE: this.datepipe.transform(
        new Date(),
        'MM/dd/yyyy HH:mm:ss'
      ),
      ESTADO: 'Enviado',
      SEND_EMAIL: sendMail,
      EMPRESA: this.EMPRESA,
      ESPEC: 'NOTIFICACION',
      ACCION: accion,
      TIMELINE: TIMELINE,
      CLASE: TIPO_TAREA,
      ACTIVIDAD: JSON.stringify({
        EMPRESA: this.EMPRESA,
        ESPEC: 'NOTIFICACION',
        ACCION: accion,
        TIMELINE: TIMELINE,
        CLASE: TIPO_TAREA,
        ACTIVIDAD_DATA: prm
      })
    };
    // API guardado de datos

    const data1: any = {
      TIPO: 'NOTIFICACION',
      DATOS: dataNotificacion,
    };
    this.wsocket.saveInfo('SAVE NOTIFICACION', data1).subscribe((data) => {
      const res = JSON.parse(data.data);
      if (res[0].ErrMensaje !== '') {
        this.showModal(res[0].ErrMensaje, 'Error al enviar notificación.', "<i class='icon-alert-ol'></i>");
      } else {
        let datos = {
          data: dataNotificacion,
          USUARIO: dataNotificacion.USUARIO_ENV
        }
        this.wsocket.sendSocket('notificaciones', 'get_data_notificaciones', datos);
        if (sendMail === true) {
          showToast('Correo Enviado.', 'success');
        }
      }
    });
  }


  onDropdownTabChanged(event: any, cellInfo: any) {
    const id = cellInfo.data.ID; // usa el campo único que tengas
    cellInfo.data.COLABORADORES = [];
    this.dropdownState[id] = event.component.option('selectedIndex');
  }

  getTabIndex(cellInfo: any): number {
    const id = cellInfo.data.ID;
    return this.dropdownState[id] ?? 0;
  }

  getUsuarioSelected(colaboradores: string[]): any[] {

    let dataUsuarios = [...this.DResponsables, ...this.DGrupos]

    if (dataUsuarios.length > 0) {
      for (let j = 0; j < colaboradores.length; j++) {
        const colaborador = colaboradores[j];

        for (let i = 0; i < dataUsuarios.length; i++) {
          const element = dataUsuarios[i];
          if (colaborador === element.ID_RESPONSABLE) {
            return element;
          }
        }
      }
    } else {
      return [];
    }
    return [];

  }

  onDropdownOpened(cellInfo: any): void {
    this.tempSelectedUsuarios = this.getUsuarioSelected(cellInfo.data.COLABORADORES);
  }

  getInitials(colaborador: string): string {
    let dataUsuarios = [...this.DResponsables, ...this.DGrupos]

    if (dataUsuarios.length > 0) {
      for (let i = 0; i < dataUsuarios.length; i++) {
        const element = dataUsuarios[i];
        if (colaborador === element.ID_RESPONSABLE) {
          const parts = element.NOMBRE.split(' ');
          if (parts.length === 1) return parts[0][0];
          if (parts.length > 2) return (parts[0][0] + parts[2][0]);
          return (parts[0][0] + parts[1][0]);
        }
      }
    } else {
      return '';
    }
    return '';

  }

  getNameComplete(colaborador: string): string {
    let dataUsuarios = [...this.DResponsables, ...this.DGrupos]
    if (dataUsuarios.length > 0) {
      for (let i = 0; i < dataUsuarios.length; i++) {
        const element = dataUsuarios[i];
        if (colaborador === element.ID_RESPONSABLE) {
          return element.NOMBRE;
        }
      }
    } else {
      return '';
    }
    return '';

  }



  onTypeChanged(value: "colaboradores" | "grupos") {
    this.selectedType = value;
    this.usuarios = value === 'colaboradores'
      ? this.DResponsables
      : this.DGrupos;
  }

  confirmSelection(cellInfo: any): void {
    cellInfo.data.COLABORADORES = this.tempSelectedUsuarios.map(u => u.ID_RESPONSABLE);
    this.dropdownOpen = false;
  }


  loadUsuarios(selectedType: 'colaboradores' | 'grupos') {
    // Aquí puedes consumir un servicio o cargar estáticamente
    if (selectedType === 'colaboradores') {
      this.selectedType = selectedType;
      this.usuarios = this.DResponsables;
    } else {
      this.selectedType = selectedType;
      this.usuarios = this.DGrupos;
    }
  }

  selectUsuario(user: any) {
    console.log('Seleccionado:', user);
    // this.closeDropdown();
  }
}
