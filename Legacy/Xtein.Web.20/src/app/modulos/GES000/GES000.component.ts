import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDateBoxModule, DxHtmlEditorModule, DxLoadPanelModule, DxPopupModule, DxSchedulerComponent, DxSchedulerModule, DxScrollViewModule, DxSelectBoxModule, DxTagBoxComponent, DxTagBoxModule, DxTextAreaModule, DxTextBoxModule, DxTooltipModule, DxTreeListComponent, DxTreeListModule, DxValidatorModule } from 'devextreme-angular';
import { clsGesActividades } from '../GES000/Clase/clsGES000.class';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { showToast } from '../../shared/toast/toastComponent.js';
import { Observable, Subject, Subscription, lastValueFrom, of } from 'rxjs';
import Swal from 'sweetalert2';
import { TimelineModule } from "primeng/timeline";
import { CardModule } from "primeng/card";
import { GES001Service } from 'src/app/services/GES001/GES001.service';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { GES00Service } from 'src/app/shared/Tareas/Service/GES00.service';
import { FechaplanComponent } from './fechaplan/fechaplan.component';

@Component({
  selector: 'GES000-COMPONENT',
  templateUrl: './GES000.component.html',
  styleUrls: ['./GES000.component.css'],
  standalone: true,
  imports: [CommonModule, DxTreeListModule, DxButtonModule, DxTextBoxModule, DxValidatorModule,
            DxSelectBoxModule, DxDateBoxModule, DxSchedulerModule, DxTextAreaModule, DxTagBoxModule,
            DxLoadPanelModule, DxTooltipModule, DxPopupModule, DxScrollViewModule,TimelineModule, CardModule,
            DxHtmlEditorModule, FechaplanComponent
          ]
})
export class GES000Component {

  @ViewChild("TreeListTareas", { static: false }) TreeListTareas: DxTreeListComponent;
  @ViewChild("schedulerProg", { static: false }) schedulerProg!: DxSchedulerComponent;
  @ViewChild("tagBoxColaboradores", { static: false }) tagBoxColaboradores!: DxTagBoxComponent;
  

  @Input() events: Observable<any>;
  @Input() datosEntrada: any;
  @Input() readOnly: any;

  @Output() datosEntradaChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() readOnlyChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();
  eventsSubjectProg: Subject<any> = new Subject<any>();

  private eventsSubscription: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;

  DTareas: any [] = [];
  DTareas3: any [] = [];
  DListaTag: any [] = [];
  focusedRowIndex: any = [];
  JsonDataSource: any = [];
  filasSeleccTareas: any = [];
  DResponsables: any = [];
  DataResTareas: any [] = [];
  filasSeleccData: any;
  dataTarea_prev:any = {};
  USUARIO_LOCAL: any = '';
  accionFiltro: string = '';
  templateGroup: any = ['ID_RESPONSABLE'];
  selectedItemColumnChooser: any = [];
  config_obj: any = [];
  
  targetIdTooltip: string;
  tooltipInfo: any = {};
  toolTipVisible: boolean = false;
  widthTooltip: any = 'auto';
  visibleEditorTexto: boolean = false;
  tituloEditor:any = '';
  valueContentDescripcion:any = '';
  contentDescripcionData:any;

  //Variables de configuracion del componente
  columnas:any = [];
  JsonAcciones:any = {};
  JsonDatosValidar:any ={}
  accionLocal:any = '';
  CLASE_ACTIVA:string = '';
  APLICACION:string = '';
  AREAS_F: any = [];

  //Variables de DRAG
  targetData:any = '';
  sourceData:any = '';

  // Operaciones de grid
  rowNew: boolean = true;

  // Datos del scheduler de apoyo
  dataProg: any = {
    text: '',
    startDate: new Date(),
    endDate: new Date(),
    allDay: false,
    ID_ACTIVIDAD: 0,
    editing: false
  };
  datProgFila: any;

  // readOnly:boolean;
  treeListConfigured:boolean = false;
  esEdicionFila: boolean = false;
  loadingVisible: boolean = false;
  visibleGesproHistorial: boolean = false;
  tituloHistorial:any;
  DTimeline: any[];
  container: any;

  conCambios: number = 0;

  constructor ( private _sdatos: GES00Service ) {
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
    this.saveState = this.saveState.bind(this);
    this.showColumnChooser = this.showColumnChooser.bind(this);
    // this.valoresObjetos = this.valoresObjetos.bind(this);
  }
  
  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
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
            this.selectedItemColumnChooser.forEach((ele:any) => {
              ele.visible = false;
            });
            for (let i = 0; i < datos.config.dataSource.length; i++) {
              const ele:any = datos.config.dataSource[i];
              const pos:any = this.selectedItemColumnChooser.findIndex((d:any) => d.dataField === ele);
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

        default:
          break;
      }
    });
    setTimeout(() => {
      // this.schedulerProg.instance._refresh();

      this.DTareas3 = [
        { ID: 1, PADRE:-1, NOMBRE: "uno", COLAB: ''},
        { ID: 3, PADRE:1, NOMBRE: "uno-tres", COLAB: ''},
        { ID: 4, PADRE:1, NOMBRE: "uno-cuatro", COLAB: ''},
        { ID: 2, PADRE:-1, NOMBRE: "dos", COLAB: ''},
        { ID: 5, PADRE:2, NOMBRE: "dos-cinco", COLAB: ''},
        { ID: 6, PADRE:2, NOMBRE: "dos-seis", COLAB: ''},
      ]
      this.DListaTag = [
        { id: 1, nombre: "uno"},
        { id: 2, nombre: "dos"},
        { id: 3, nombre: "tres"},
        { id: 4, nombre: "cuatro"},
        { id: 5, nombre: "cinco"},
      ]
  

    }, 400);
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  loadDataInit(data:any) {
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
        this.JsonDataSource[data.parametro] = JSON.parse(JSON.stringify(data.dataSource));
      break;
    
      default:
        break;
    }
  }

  configComponent(data:any) {
    var jsonNodo:any = {};
    var jsonColumn:any = { ID_ACTIVIDAD: 0, ID_ACTIVIDAD_PADRE: -1, CLASE: '', ITEM: 0};
    var tipo:any = { string: '', date: '', boolean: false, number: 0 };
    var data_column:any = [];

    //Se optiene el estado del componente (edición/lectura);
    const posReadOnly:any = data.findIndex((d:any) => d.hasOwnProperty('readOnly'));
    if (posReadOnly > -1)
      this.readOnly = data[posReadOnly].readOnly;

    //Columnas base del componente
    this.columnas = [
      {dataField: 'ID_ACTIVIDAD', visible: false, dataType: 'string'},
      {dataField: 'ID_ACTIVIDAD_PADRE', visible: false, dataType: 'string'},
      {dataField: 'CLASE', visible: false, dataType: 'string'},
      {dataField: 'ITEM', visible: false, dataType: 'number'}
    ];

    data.filter((f:any) => f.CONFIG_PADRE === 'COLUMNAS').forEach((item: any)=> {

      var dataField:any = '';
      var dataType:any = '';
      var caption:any = '';
      var dataSource:any = '';
      var visibleIndex:number = -1;
      var visible:boolean = false;
      var width:any = '';
      var editable:boolean = false;
      
      dataField = item.CONFIG;
      data_column = data.filter((d:any) => d.CONFIG_PADRE === dataField );
      data_column.forEach((data:any) => {
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
      jsonColumn = {...jsonColumn, [dataField]: tipo[dataType]};

      if (dataField !== '') {
        this.columnas.push({ dataField, caption, dataType, dataSource, visibleIndex, visible, width, editable });
      }

      //Se configuran los DataSource de las columnas
      if (dataSource !== undefined && dataSource !== null && dataSource !== '') {
        if (!this.JsonDataSource[dataSource])
          this.JsonDataSource[dataSource] = [];
      }

    });
      
    //Valida y carga los datos a verificar antes de registrar
    data.filter((f:any) => f.CONFIG_PADRE === 'VALIDAR DATOS').forEach((item: any)=> {
      if (!this.JsonDatosValidar[item.CONFIG])
        this.JsonDatosValidar = {...this.JsonDatosValidar, [item.CONFIG]: item.CONFIG};
    });
    
    //Configura las acciones de la aplicacioón sobre el componente
    data.filter((f:any) => f.CONFIG_PADRE === 'ACCIONES').forEach((item: any)=> {
      this.JsonAcciones = {...this.JsonAcciones, [item.CONFIG] : item.CONFIG};
    });

    if (Object.keys(jsonNodo).length > 0)
      this.DTareas = [...this.DTareas, jsonNodo];
    
  }

  customizeColumns(columns:any) {
    var dataColumn:any = [];
    var config_col:any [] = [];
    var posCol:number = -1;

    columns.forEach((col:any)=> {
      config_col = this.columnas.filter((d:any) => d.dataField === col.dataField );
      
      // Propiedades de las columnas
      if (config_col.length > 0) {
        if (this.selectedItemColumnChooser.length > 0 && (this.selectedItemColumnChooser[0].dataField !== undefined && this.selectedItemColumnChooser[0].dataField !== null)) {
          posCol = this.selectedItemColumnChooser.findIndex((d:any) => d.dataField === col.dataField);
          if (posCol > -1) {
            col.visible = this.selectedItemColumnChooser[posCol].visible;
            if (this.selectedItemColumnChooser[posCol].width !== undefined && this.selectedItemColumnChooser[posCol].width !== null)
              col.width = this.selectedItemColumnChooser[posCol].width;
          } else {
            col.visible = false;
          }
        } else if (this.selectedItemColumnChooser.length > 0 && this.selectedItemColumnChooser[0]) {
          posCol = this.selectedItemColumnChooser.indexOf(col.dataField);
          if (posCol > -1) {
            col.visible = true;
          } else {
            col.visible = false;
          }
        } else {
          col.visible = config_col[0].visible === 'true' ? true : false;
        }

        if (col.visible)
          dataColumn.push(col.dataField);

        if (config_col[0].editable) {
          col.allowEditing = config_col[0].editable['valor'] ? true : false;
          if (config_col[0].editable['display'])
            col.cellTemplate = config_col[0].editable['display'] ? config_col[0].editable['display'] : '';
          col.editCellTemplate = config_col[0].editable['edit'] ? config_col[0].editable['edit'] : '';
        }
        col.caption = config_col[0].caption ?? config_col[0].dataField;
        col.visibleIndex = parseInt(config_col[0].visibleIndex ?? 0);
        col.allowHeaderFiltering = true;
        
        if (config_col[0].width) {
          col.width = config_col[0].width;
        };
        if (col.dataField.match('FECHA|PROGRAMACION')) {
          col.alignment = "center";
          col.allowHeaderFiltering = false;
        };
        if (col.dataField.match('ID_|CLASE|ITEM|index|readOnly|visible|Err|Mensaje|Eliminado')) {
          col.visible = false;
          col.allowHeaderFiltering = false;
        };
        if (col.dataField.match('btn')) {
          col.allowEditing = false;
          col.width = 45;
          col.type = 'buttons';
          col.allowHiding = false;
          col.allowHeaderFiltering = false;
        };
        if (col.allowHeaderFiltering) {
          if (col.dataField.match('RESPONSABLE|COLABORADORES')) {
            col.headerFilter = { dataSource: this.getDataSourceFilter(col) };
            if (col.dataField === 'COLABORADORES')
              col.width = 230;
          }
        }
        
      } else if (config_col.length === 0){
        col.visible = false;
      }
    });
    if(dataColumn.length > 0) {
      this.onRespuestaComponent.emit({ accion:'column chooser', data: dataColumn });
    }
  }
  
  onRespuestaGesInfo(datos:any) {
    switch (datos.accion) {
      case 'update datasource':
        // this.prmUsrAplBarReg.accion = datos.accionLocal;
        // this.opPrepararGuardar(datos, 'web');
        break;
    
      default:
        break;
    }
  }

  // Cambio programación
  onRespuestaProg(e: any) {
    if (e.accion == 'aceptar') {
      let frec = "";
      let periodo = "";
      switch (e.datos.REPETIR_MODO) {
        case "Cada hora":
          frec = "Horas"
          break;
        case "Diario":
          frec = "Diario"
          break;
        case "Semanal":
          frec = "Semanal";
          periodo = e.datos.REPETIR_DIA_SEMANA;
          break;
        case "Mensual":
          frec = "Mensual"
          break;
        case "Anual":
          frec = "Anual"
          break;
        default:
          break;
      }
      const data = { data : {
          FECHA_INICIO: e.datos.FECHA_DESDE,
          FECHA_FIN: e.datos.FECHA_HASTA,
          TODO_DIA: e.datos.TODO_DIA,
          REPETIR: e.datos.REPETIR,
          PERIODO_FRECUENCIA: e.datos.REPETIR_MODO,
          FRECUENCIA: e.datos.REPETIR_FRECUENCIA,
          INTERVALO_FRECUENCIA: frec
        }
      }
      this.setProgramacion(data);
    }
  }

  getDataSourceFilter(col:any) {
    var res:any = [];
    var dataSource:any = [];
    switch (col.dataField) {
      case 'RESPONSABLE':
      case 'COLABORADORES':
        if (this.JsonDataSource['prev_'+col.dataField]) {
          this.JsonDataSource['prev_'+col.dataField].forEach((ele:any) => {
            dataSource.push({text: ele.NOMBRE, value: ele.ID_RESPONSABLE});
          });
          res = dataSource;
        }
        break;
    
      default:
        break;
    }
    return res;
  }

  showColumnChooser(datos:any) {
    // this.selectedItemColumnChooser = (datos.dataSource.columns !== undefined && datos.dataSource.columns !== null) ? datos.dataSource.columns : datos.dataSource;
    const treeListInstance = this.TreeListTareas.instance;
    this.columnas.forEach((col:any) => {
      var posCol:any = -1;
      // if (datos.filtro !== undefined && datos.filtro !== null && datos.filtro === 'config') {
        posCol = this.selectedItemColumnChooser.findIndex((d:any) => d.dataField === col.dataField);
        if (posCol > -1) {
          col.visible = this.selectedItemColumnChooser[posCol].visible;
          treeListInstance.columnOption(col.dataField, 'visible', this.selectedItemColumnChooser[posCol].visible);
          if (this.selectedItemColumnChooser[posCol].width !== undefined && this.selectedItemColumnChooser[posCol].width !== null) {
            col.width = this.selectedItemColumnChooser[posCol].width;
            treeListInstance.columnOption(col.dataField, 'width', this.selectedItemColumnChooser[posCol].width);
          }
        } else {
          col.visible = false;
          treeListInstance.columnOption(col.dataField, 'visible', false);
        }
      // } else {
      //   posCol = this.selectedItemColumnChooser.indexOf(col.dataField);
      //   if (posCol > -1) {
      //     col.visible = true;
      //     treeListInstance.columnOption(col.dataField, 'visible', true);
      //   } else {
      //     col.visible = false;
      //     treeListInstance.columnOption(col.dataField, 'visible', false);
      //   }
      // }
    });
  }

  saveState = (state:any) => {
    if (state.columns) {
      var dataColumn:any = [];
      this.onRespuestaComponent.emit({ accion:'save column for user', data: {obj:'TreeListTareas', state} });
      state.columns.forEach((col:any) => {
        if (col.visible)
          dataColumn.push(col.dataField);
      });
      if(dataColumn.length > 0) {
        this.onRespuestaComponent.emit({ accion:'column chooser', data: dataColumn });
      }
    }
  }

  updateData(data:any) {
    // Si es un Filtro por área
    this.accionFiltro = data.accionFiltro;

    switch (data.accion) {
      case 'update dataSource':
        if (!this.esEdicionFila) {
          this.DTareas = data.dataSource;
          this.TreeListTareas.instance.refresh();
        } else {
          this.TreeListTareas.instance.cancelEditData();
          this.DTareas = data.dataSource;
          this.TreeListTareas.instance.refresh();
        }
        if (data.readOnly !== null && data.readOnly !== undefined)
          this.readOnly = data.readOnly;

      // this.showColumnChooser('config');
      break;
        
      case 'update data config':
        this.JsonDataSource[data.parametro] = JSON.parse(JSON.stringify((data.dataSource)));
        this.JsonDataSource['prev_'+data.parametro] = JSON.parse(JSON.stringify((data.dataSource)));
      break;
    
      default:
        break;
    }
  }

  validateError(data:any) {
    switch (data.accion) {
      case 'error de guardado':
        const pos:any = this.DTareas.findIndex((d:any) => d.ID_ACTIVIDAD === data.dataSource.ID_ACTIVIDAD);
        this.dataTarea_prev = JSON.parse(JSON.stringify(this.DTareas[pos]));
        this.accionLocal = 'update';
        setTimeout(() => {
          const rowIndex:any = this.TreeListTareas.instance.getRowIndexByKey(this.dataTarea_prev.ID_ACTIVIDAD);
          this.TreeListTareas.instance.editRow(rowIndex);
        }, 300);
        break;
    
      default:
        break;
    }
  }

  onCellHoverChanged(e:any) {
    if(!this.readOnly) {
      if(e.data !== null && e.data !== undefined && e.data !== '' && !e.data.ANULADO && !this.esEdicionFila) {
        if (this.editValidator(e, 'agregar')) {
          const box1:any = document.getElementById('txtNombre'+e.data.ID_ACTIVIDAD);
          const box2:any = document.getElementById('containerBtnNuevoTarea'+e.data.ID_ACTIVIDAD);
          if (box1 !== null && box2 !== null) {
            box1.style.transform = 'translateX(0px)';
            box2.style.opacity = '1';
            this.DTareas.forEach((ele:any) => {
              if (ele.ID_ACTIVIDAD !== e.data.ID_ACTIVIDAD) {
                const box1:any = document.getElementById('txtNombre'+ele.ID_ACTIVIDAD);
                const box2:any = document.getElementById('containerBtnNuevoTarea'+ele.ID_ACTIVIDAD);
                if(box1 !== null && box1 !== undefined) {
                  if(box1.style !== null && box1.style !== undefined) {
                    if(box1.style.transform === 'translateX(0px)') {
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
          this.DTareas.forEach((ele:any) => {
            const box1:any = document.getElementById('txtNombre'+ele.ID_ACTIVIDAD);
            const box2:any = document.getElementById('containerBtnNuevoTarea'+ele.ID_ACTIVIDAD);
            if(box1 !== null && box1 !== undefined) {
              if(box1.style !== null && box1.style !== undefined) {
                if(box1.style.transform === 'translateX(0px)') {
                  box1.style.transform = 'translateX(-25px)';
                  box2.style.opacity = '0';
                }
              }
            }
          });
        }
      } else {
        this.DTareas.forEach((ele:any) => {
          const box1:any = document.getElementById('txtNombre'+ele.ID_ACTIVIDAD);
          const box2:any = document.getElementById('containerBtnNuevoTarea'+ele.ID_ACTIVIDAD);
          if(box1 !== null && box1 !== undefined) {
            if(box1.style !== null && box1.style !== undefined) {
              if(box1.style.transform === 'translateX(0px)') {
                box1.style.transform = 'translateX(-25px)';
                box2.style.opacity = '0';
              }
            }
          }
        });
      }
    }
    if (e.rowType === "data" && e.column.dataField === "PROGRAMACION" && e.data.PROGRAMACION !== '' && e.data.CLASE !== 'NODOS') {
      if (e.eventType === "mouseover" && !this.esEdicionFila) {
        if (e.column.dataField === 'PROGRAMACION' && e.data.ID_AREA_CAUSANTE !== '' ) {
          this.targetIdTooltip = e.cellElement;
          //Formateado de fechas:
          const fecha_ini = e.data.FECHA_INICIO;
          let date = new Date(fecha_ini);
          let day = String(date.getDate()).padStart(2, '0');
          let month = String(date.getMonth() + 1).padStart(2, '0');
          let year = date.getFullYear();
          const formattedFechaIni = `${day}/${month}/${year}`;

          const fecha_fin = e.data.FECHA_INICIO;
          date = new Date(fecha_fin);
          day = String(date.getDate()).padStart(2, '0');
          month = String(date.getMonth() + 1).padStart(2, '0');
          year = date.getFullYear();
          const formattedFechaFin = `${day}/${month}/${year}`;

          this.widthTooltip = 'auto';
          this.tooltipInfo = { 
            TITULO: 'Programación', 
            FECHA_INICIO: formattedFechaIni,
            FECHA_FIN: formattedFechaFin,
            TODO_DIA_DES: e.data.TODO_DIA? 'Activo':'Inactivo',
            TODO_DIA: e.data.TODO_DIA? 'Activo':'Inactivo',
            REPETIR_DES: e.data.REPETIR? 'Activo':'Inactivo',
            REPETIR: e.data.REPETIR,
            INTERVALO_FRECUENCIA: e.data.INTERVALO_FRECUENCIA,
            PERIODO_FRECUENCIA: e.data.PERIODO_FRECUENCIA,
            FRECUENCIA: e.data.FRECUENCIA
          };
        };
        this.toolTipVisible = true;
      } else {
        this.toolTipVisible = false;
      }
    } else if (e.rowType === "data" && e.column.dataField === "NOMBRE" && e.data.NOMBRE !== '' && e.data.CLASE !== 'NODOS') {
      if (e.eventType === "mouseover" && !this.esEdicionFila) {
        if (e.column.dataField === 'NOMBRE' && e.data.ID_AREA_CAUSANTE !== '' ) {
          this.targetIdTooltip = e.cellElement;
          this.widthTooltip = 'auto';
          this.tooltipInfo = {
            TITULO: 'Actividad',
            NOMBRE: e.data.NOMBRE
          };
        };
        this.toolTipVisible = true;
      } else {
        this.toolTipVisible = false;
      }
    } else if (e.rowType === "data" && e.column.dataField === "COLABORADORES" && e.data.COLABORADORES.length > 1 && e.data.CLASE !== 'NODOS') {
      if (e.eventType === "mouseover" && !this.esEdicionFila) {
        if (e.column.dataField === 'COLABORADORES') {
          this.targetIdTooltip = e.cellElement;
          this.widthTooltip = '200px';
          var empleados:any [] = [];
          e.data.COLABORADORES.forEach((emple:any) => {
            const dat:any = this.JsonDataSource['prev_COLABORADORES'].filter((d:any) => d.ID_RESPONSABLE === emple);
            empleados.push(dat[0]);
          });
          const nombres = empleados.map(empleado => empleado.NOMBRE).join('\n');
          this.tooltipInfo = {
            TITULO: 'Colaboradores',
            NOMBRE: empleados
          };
        };
        this.toolTipVisible = true;
      } else {
        this.toolTipVisible = false;
      }
    };
  }

  onCellPrepared(e:any) {
    if(e.rowType === 'data') {
      if (e.column.dataField === 'COLABORADORES') {
        if(e.value !== null && e.value !== '' && e.value !== undefined) {
          for (let i = 0; i < e.value.length; i++) {
            const pos:any = this.JsonDataSource['COLABORADORES'].findIndex((d:any) => d.ID_RESPONSABLE === e.value[i]);
            if(pos !== -1) {
              const user:any = this.JsonDataSource['COLABORADORES'][pos];
              const npos: any = user.NOMBRE.indexOf(" ");
              const name = user.NOMBRE.charAt(0).toUpperCase();
              const lastName = user.NOMBRE.substring(npos + 1, user.NOMBRE.length + 1);
              const Lape = lastName.charAt(0).toUpperCase();
              const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
              e.value[i].NOMBRE = user.NOMBRE;
              e.value[i].iconNameUser = newName;
            } else if(e.value[i].FOTO === '' && e.value[i].NOMBRE) {
              const npos: any = e.value[i].NOMBRE.indexOf(" ");
              const name = e.value[i].NOMBRE.charAt(0).toUpperCase();
              const lastName = e.value[i].NOMBRE.substring(npos + 1, e.value[i].NOMBRE.length + 1);
              const Lape = lastName.charAt(0).toUpperCase();
              const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
              e.value[i].iconNameUser = newName;
            }
          };
        }
      };
    };
  }

  onRowPrepared(e: any) {
    if(e.rowType === "data") {
      if ( (Number(e.data.ID_ACTIVIDAD) < 0) || (e.data.CLASE === 'NODOS')) {
        const className:string = e.rowElement.className;
        e.rowElement.className = className +' xt-header-row';
      };
      if( [-1,-10,-20,-30,-40,-50].includes(Number(e.data.ID_ACTIVIDAD)) || 
          (e.data.CLASE === 'RESPONSABILIDADES' && this.APLICACION === 'GES-001' ) || 
          (e.data.CLASE === 'NODOS' && e.data.ID_ACTIVIDAD_PADRE === -20 ) ||
          (e.data.ANULADO)
      ) {
        const dragicon = e.rowElement.getElementsByClassName("dx-command-drag");
        if (dragicon.length > 0)
          dragicon[0].style["visibility"] = "hidden";
      }
      // if (e.data.isEdit) {
      //   const className:string = e.rowElement.className;
      //   e.rowElement.className = className +' row-modified-focused';
      // }
      //estilo para las Tareas Inactivas
      // if (e.data.ANULADO) {
      //   e.rowElement.style.background = 'rgba(98, 121, 140, 0.75) !important';
      // };
    };
  }

  onEditCanceled(e:any) {
    if(this.filasSeleccData !== undefined && this.filasSeleccData !== null && this.filasSeleccData !== '') {
      // this.TreeListTareas.instance.cellValue(this.filasSeleccData.rowIndex, 'heightColaboradores', '40px');
      this.TreeListTareas.instance.cellValue(this.filasSeleccData.rowIndex, 'readOnlyResponsables', true);
      this.TreeListTareas.instance.cellValue(this.filasSeleccData.rowIndex, 'readOnlyColaboradores', true);
    }
    this.esEdicionFila = false;
    this.filasSeleccData = '';
    this.tituloEditor = '';
    this.valueContentDescripcion = '';
    this.contentDescripcionData = [];
    this.accionLocal = '';
    this.conCambios = 0;
    this.TreeListTareas.instance.refresh();
  }

  opPrepararNuevaFila(cellInfo:any, accion:string) {
  
    switch (accion) {
      case 'new':
        if(this.editValidator(cellInfo, 'agregar')) {
          if (!this.esEdicionFila) {
            if (cellInfo !== '') {
              if (cellInfo.data.CLASE === 'NODOS')
                this.CLASE_ACTIVA = cellInfo.data.NOMBRE.toUpperCase();
              else
                this.CLASE_ACTIVA = cellInfo.data.CLASE;
    
              this.TreeListTareas.instance.addRow(cellInfo.data.ID_ACTIVIDAD);
            } else {
              this.TreeListTareas.instance.addRow();
            }
            this.accionLocal = 'new';
          } else {
            showToast('No puede Agregar si esta en Edición la anterior.', 'warning');
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
        this.TreeListTareas.instance.refresh();
        break;

      case 'save':
        this.CLASE_ACTIVA = '';
        if( this.conCambios > 0)
          this.TreeListTareas.instance.saveEditData();
        else
          this.TreeListTareas.instance.cancelEditData();
        break;
    
      default:
        break;
    }
  }

  async initNewRow(e:any) {
    // const column:any = this.TreeListTareas.instance.getVisibleColumns();
    this.columnas.forEach((col:any) => {
      if ( col.dataField !== undefined && !col.dataField.match('ID_ACTIVIDAD|ID_ACTIVIDAD_PADRE|ITEM|CLASE')) {
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
        };
      } else if (col.dataField !== undefined && col.dataField === 'CLASE') {
        // const clase:any = this.DTareas.filter((d:any) => d.CLASE === 'NODOS')[0].NOMBRE;
        // e.data.CLASE = clase;
        e.data.CLASE = this.CLASE_ACTIVA;
      }
      // e.data.heightColaboradores = '75px';
    });
    
    //Datos por defecto
    e.data.readOnlyResponsables = false;
    e.data.readOnlyColaboradores = false;
    e.data.ESTADO = this.editValidator(e, 'dato por defecto');

    if (this.DTareas.length > 0) {
      const item = this.DTareas.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act});
      e.data.ITEM = item.ITEM + 1;
    } else {
      e.data.ITEM = 1;
    };
    
    if (this.DTareas.length > 0) {
      let item = this.DTareas.reduce((ant, act)=>{return (ant.ID_ACTIVIDAD > act.ID_ACTIVIDAD) ? ant : act}) 
      if (item.ID_ACTIVIDAD < 0) 
        e.data.ID_ACTIVIDAD = 1;
      else
        e.data.ID_ACTIVIDAD = item.ID_ACTIVIDAD + 1;
    } else {
      e.data.ID_ACTIVIDAD = 1;
    }
    
    if (this.accionFiltro === 'areas') {
      const data:any = this.DTareas.filter((d:any) => d.ID_ACTIVIDAD === e.data.ID_ACTIVIDAD_PADRE)[0];
      e.data.RESPONSABLE = data.RESPONSABLE;
      e.data.readOnlyResponsables = true;
    } else {
      // if (this.AREAS_F.length === 1)
      //   e.data.TIPO = this.AREAS_F[0].ID_AREA;
      // else if (this.AREAS_F.length > 1)
      //   e.data.TIPO = await this.selectAreaFuncional();
    }

    this.TreeListTareas.instance.refresh();
    this.esEdicionFila = true;
    this.filasSeleccData = e;

    // setTimeout(() => {
    //   const rowIndex = e.component.getRowIndexByKey(e.key);
    //   e.component.focus(e.component.getCellElement(rowIndex, 0));
    // }, 100);
  }

  getDataSource(cellInfo:any) {
    var res:any = [];
    if((this.filasSeleccData !== undefined && this.filasSeleccData !== null && this.filasSeleccData !== '') && 
      (this.filasSeleccData.data.ID_ACTIVIDAD === cellInfo.data.ID_ACTIVIDAD)
    )
      res = this.JsonDataSource[cellInfo.column.dataField] || [];
    else
      res = this.JsonDataSource['prev_'+cellInfo.column.dataField] || [];
    return of(res);
  }

  getDataHieght(cellInfo:any, campo:any) {
    var res:any = [];
    if((this.filasSeleccData !== undefined && this.filasSeleccData !== null && this.filasSeleccData !== '') && 
      (this.filasSeleccData.data.ID_ACTIVIDAD === cellInfo.data.ID_ACTIVIDAD)
    ) {
      switch (campo) {
        case 'COLABORADORES':
          if(this.esEdicionFila && (this.filasSeleccData.data.ID_ACTIVIDAD === cellInfo.data.ID_ACTIVIDAD))
            res = '75px';
          else
            res = 'auto';
          break;
      
        default:
          res = 'auto';
          break;
      }
    }
    return of(res);
  }

  getDataReadOnly(cellInfo:any, campo:any) {
    var res:any = [];
    switch (campo) {
      case 'COLABORADORES':
      case 'RESPONSABLE':
        if(this.esEdicionFila && (this.filasSeleccData.data.ID_ACTIVIDAD === cellInfo.data.ID_ACTIVIDAD))
          res = cellInfo.data.ANULADO ? true : false;
        else
          res = true;
        break;
    
      default:
        res = 'auto';
        break;
    }
    return of(res);
  }

  selectAreaFuncional() {
    
  }

  onDragStart(e:any) {
    if(e.itemData.CLASE === 'NODOS') {
      showToast('No puede mover este Item.', 'warning');
      e.cancel = true;
      return;
    }
  }

  onDragChange(e: any) {
    const visibleRows = e.component.getVisibleRows();
    const sourceNode = e.component.getNodeByKey(e.itemData.ID_ACTIVIDAD);
    let targetNode = visibleRows[e.toIndex].node;
    this.accionLocal = 'update';
    if (sourceNode === undefined) return;

    switch (sourceNode.data.CLASE) {
      case 'RESPONSABILIDADES':
        if( (targetNode.data.CLASE.match('TAREAS|EVENTOS')) || (targetNode.data.CLASE === 'NODOS' && targetNode.data.ID_ACTIVIDAD !== -20) ) {
          showToast('Las Responsabilidades solo pueden interactuar entre si.', 'warning');
          e.cancel = true;
          return;
        }
        break;

      case 'TAREAS':
        // if(targetNode.data.CLASE === 'EVENTOS') {
        //   showToast('Las Tareas no pueden moverse a Eventos', 'error');
        //   e.cancel = true;
        //   return;
        // }
        break;

      case 'EVENTOS':
        if( (targetNode.data.CLASE === 'RESPONSABILIDADES') || (targetNode.data.CLASE === 'EVENTOS') || (targetNode.data.CLASE === 'NODOS') ) {
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
    var hijas:any[] = [];
    var subHijas:any[] = [];

    if (e.dropInsideItem) {
      e.itemData.ID_ACTIVIDAD_PADRE = visibleRows[e.toIndex].key;
      e.itemData.TEMP = e.itemData.ID_ACTIVIDAD_PADRE;
      if(visibleRows[e.toIndex].data.CLASE !== 'NODOS')
        e.itemData.CLASE = visibleRows[e.toIndex].data.CLASE;
      else {
        if(visibleRows[e.toIndex].data.NOMBRE === 'Responsabilidades')
          e.itemData.CLASE = 'RESPONSABILIDADES';
        if(visibleRows[e.toIndex].data.NOMBRE === 'Tareas')
          e.itemData.CLASE = 'TAREAS';
        if(visibleRows[e.toIndex].data.NOMBRE === 'Eventos')
          e.itemData.CLASE = 'EVENTOS';
        if(visibleRows[e.toIndex].data.NOMBRE === 'Comunitarias')
          e.itemData.CLASE = 'COMUNITARIAS';
      }

      //verifica si la actividad tiene hijas
      hijas = this.DTareas.filter((d:any) => d.ID_ACTIVIDAD_PADRE === sourceData.ID_ACTIVIDAD);
      hijas.forEach((hija:any) => {
        hija.CLASE = e.itemData.CLASE;
        subHijas = this.DTareas.filter((d:any) => d.ID_ACTIVIDAD_PADRE === hija.ID_ACTIVIDAD);
        var cont:any = subHijas.length;
        do {
          subHijas.forEach((subHija:any) => {
            subHija.CLASE = e.itemData.CLASE;
          });
          cont--;
        } while (cont > 0);
      });

      e.component.refresh();
    } else {

      //verifica si la actividad tiene hijas y sus responsables
      hijas = this.DTareas.filter((d:any) => d.ID_ACTIVIDAD_PADRE === sourceData.ID_ACTIVIDAD);
      if (hijas.length > 0) {
        hijas.forEach((hija:any) => {
          const user_local:any = localStorage.getItem('usuario')?.toUpperCase();
          if (hija.RESPONSABLE !== user_local) {
            e.cancel = true;
          }
        });
        if (e.cancel) {
          Swal.fire({
            title: 'Advertencia',
            text: 'Esta actividad, tiene una Tarea hija cuyo responsable es otra persona,' +
                  ' debe modificar la jerarquía de esa Tarea para poder continuar.',
            iconHtml: "<i class='icon-alert-ol'></i>",
            showCancelButton: false,
            confirmButtonColor: '#DF3E3E',
            cancelButtonColor: '#438ef1',
            cancelButtonText: 'No',
            confirmButtonText: 'Continuar'
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
        
        if(targetData.CLASE === 'RESPONSABILIDADES') {
          sourceData.TIPO = 'Permanente';
          sourceData.COLABORADORES = [];
        }
        if(targetData.CLASE !== 'NODOS')
          sourceData.CLASE = targetData.CLASE;
        else {
          if(targetData.NOMBRE === 'Responsabilidades')
            sourceData.CLASE = 'RESPONSABILIDADES';
          if(targetData.NOMBRE === 'Tareas')
            sourceData.CLASE = 'TAREAS';
          if(targetData.NOMBRE === 'Eventos')
            sourceData.CLASE = 'EVENTOS';
          if(targetData.NOMBRE === 'Comunitarias')
            sourceData.CLASE = 'COMUNITARIAS';
        }

        targetData = null;
      } else {
        sourceData.ID_ACTIVIDAD_PADRE = targetData ? targetData.ID_ACTIVIDAD_PADRE : -1;
        sourceData.TEMP = sourceData.ID_ACTIVIDAD_PADRE;
        if(targetData.CLASE === 'RESPONSABILIDADES') {
          sourceData.TIPO = 'Permanente';
          sourceData.COLABORADORES = [];
        }
        if(targetData.CLASE !== 'NODOS')
          sourceData.CLASE = targetData.CLASE;
        else {
          if(targetData.NOMBRE === 'Responsabilidades')
            sourceData.CLASE = 'RESPONSABILIDADES';
          if(targetData.NOMBRE === 'Tareas')
            sourceData.CLASE = 'TAREAS';
          if(targetData.NOMBRE === 'Eventos')
            sourceData.CLASE = 'EVENTOS';
          if(targetData.NOMBRE === 'Comunitarias')
            sourceData.CLASE = 'COMUNITARIAS';
        }
      }

    }
    this.conCambios++;
    this.onRespuestaComponent.emit({ accion:'update datasource', data: sourceData, accionLocal: this.accionLocal });
    if (hijas.length > 0) {
      hijas.forEach((hija:any) => {
        this.onRespuestaComponent.emit({ accion:'update datasource', data: hija, accionLocal: this.accionLocal });
      });
    }
    this.TreeListTareas.instance.refresh();
  }

  editValidator(cellInfo:any, accion:string) {
    var res:any = true;
    const esResponsable: boolean = cellInfo.data.RESPONSABLE === this.USUARIO_LOCAL ? true : false;
    const esUsuarioCreador: boolean = cellInfo.data.USUARIO === this.USUARIO_LOCAL ? true : false;
    const esColaborador: boolean = cellInfo.data.COLABORADORES.any((d:any) => d === this.USUARIO_LOCAL) ? true : false;

    const esFinalizada:boolean = cellInfo.data.ESTADO === 'Finalizado' ? true : false;
    const esAnulada:boolean = cellInfo.data.ANULADO ? true : false;

    switch (this.APLICACION) {
      case 'GES-001':
        switch (accion) {
          case 'agregar':
            if (cellInfo.data.ID_ACTIVIDAD === -20 || cellInfo.data.ID_ACTIVIDAD_PADRE === -20 || cellInfo.data.ID_ACTIVIDAD_PADRE <= -2000)
              res = false;
            else if (cellInfo.data.CLASE === 'RESPONSABILIDADES')
              res = false;
            else if (this.accionFiltro === 'areas' && cellInfo.data.CLASE === 'NODOS')
              res = false;
            else if (cellInfo.data.CLASE === 'EVENTOS' && !accion.match('new|editar'))
              res = false;
            else if (cellInfo.data.ESTADO === 'Finalizado')
              res = false;


            // if (esColaborador) return false;
            // if ((esUsuarioCreador || esResponsable) && !esFinalizada) return true;
            // if ((esUsuarioCreador || esResponsable) && esFinalizada) return false;
            break;

          case 'editar':
            // if(cellInfo.data.ANULADO)
            //   res = false;
            if(cellInfo.data.ACT_AREA && cellInfo.data.RESPONSABLE !== this.USUARIO_LOCAL)
              res = false;
            else if (cellInfo.data.CLASE === 'RESPONSABILIDADES')
              res = false;
            else if(cellInfo.data.COLABORADORES.findIndex((d:any) => d.ID_RESPONSABLE === this.USUARIO_LOCAL) !== -1) {
              res = false;
              // showToast('No puede modificar esta Tarea al ser Colaborador.', 'warning');
            }
            else if (cellInfo.data.ESTADO === 'Finalizado')
              res = false;
            break;

          case 'inactivar':
            if(cellInfo.data.CLASE !== 'RESPONSABILIDADES') {
              if (cellInfo.data.RESPONSABLE === this.USUARIO_LOCAL)
                res = true;
              else if (cellInfo.data.USUARIO === this.USUARIO_LOCAL) {
                res = true;
              } else {
                if (cellInfo.data.COLABORADORES.length > 0) {
                  if (cellInfo.data.COLABORADORES.findIndex((a:any) => a.ID_RESPONSABLE === this.USUARIO_LOCAL) !== -1) {
                    res = true;
                  } else {
                    res = false;
                  }
                } else {
                  res = false;
                }
              };
            } else {
              res = false;
            }
            break;

          case 'eliminar':
            if(cellInfo.data.CLASE !== 'RESPONSABILIDADES') {
              if (cellInfo.data.RESPONSABLE === this.USUARIO_LOCAL)
                res = true;
              else if (cellInfo.data.USUARIO === this.USUARIO_LOCAL) {
                res = true;
              } else {
                res = false;
              };
            } else {
              res = false;
            }
            break;

          case 'historial':
            if(cellInfo.data.ACT_AREA && cellInfo.data.RESPONSABLE !== this.USUARIO_LOCAL)
              res = false;
            else if (cellInfo.data.CLASE === 'RESPONSABILIDADES')
              res = false;
            else if(cellInfo.data.COLABORADORES.findIndex((d:any) => d.ID_RESPONSABLE === this.USUARIO_LOCAL) !== -1)
              res = false;
            break;

          case 'fechas':
            res = true;
            break;

          case 'dato por defecto':
            // if (cellInfo.data.CLASE === 'TAREAS')
            //   res = 'Sin Iniciar';
            // if (cellInfo.data.CLASE === 'EVENTOS')
            //   res = 'Sin Iniciar';
            // if (cellInfo.data.CLASE === 'COMUNITARIAS')
              res = 'Sin Iniciar';
            break;

          case 'menu':
            if (cellInfo.data.CLASE === 'NODOS')
              res = false;
            break;
        
          default:
            // if (cellInfo.data.ANULADO)
            //   res = false; 
            if (cellInfo.data.ID_ACTIVIDAD === -20 || cellInfo.data.ID_ACTIVIDAD_PADRE === -20 || cellInfo.data.ID_ACTIVIDAD_PADRE <= -2000)
              res = false;
            else if (cellInfo.data.CLASE === 'RESPONSABILIDADES' || cellInfo.data.CLASE === 'NODOS')
              res = false;
            else if (cellInfo.data.CLASE === 'EVENTOS' && !accion.match('new|editar'))
              res = false;
            else if (cellInfo.data.ESTADO === 'Finalizado')
              res = false;
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
            if (cellInfo.data.ESTADO === 'Finalizado')
              res = false;
            break;
          case 'fechas':
            res = true;
            break;
        
          case 'dato por defecto':
            if (cellInfo.data.CLASE === 'RESPONSABILIDADES')
              res = 'En Proceso';
            break;

          case 'menu':
            if (cellInfo.data.CLASE === 'NODOS')
              res = false;
            break;

          default:
            if (this.readOnly)
              res = false;
            else if (cellInfo.data.ESTADO === 'Finalizado')
              res = false;
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
            if(cellInfo.data.CLASE !== 'RESPONSABILIDADES') {
              if (cellInfo.data.USUARIO === this.USUARIO_LOCAL) {
                res = true;
              } else {
                if (cellInfo.data.COLABORADORES.length > 0) {
                  if (cellInfo.data.COLABORADORES.findIndex((a:any) => a.ID_RESPONSABLE === this.USUARIO_LOCAL) !== -1) {
                    res = true;
                  } else {
                    res = false;
                  }
                } else {
                  res = false;
                }
              };
            } else {
              res = false;
            }
            break;

          case 'eliminar':
            if(cellInfo.data.CLASE !== 'RESPONSABILIDADES') {
              if (cellInfo.data.USUARIO === this.USUARIO_LOCAL) {
                res = true;
              } else {
                res = false;
              };
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
            if (cellInfo.data.CLASE === 'PLANES DE ACCION')
              res = 'Sin Iniciar';
            break;

          case 'menu':
            if (cellInfo.data.CLASE === 'NODOS')
              res = false;
            break;
        
          default:
            if (cellInfo.data.ESTADO === 'Finalizado')
              res = false;
            break;
        }
        break;
    
      default:
        break;
    }

    return res;
  }

  onRowClick(e:any) {
    if( !(e.event.target.parentElement.classList.contains("dx-treelist-expanded") ||
        e.event.target.parentElement.classList.contains("dx-treelist-collapsed") ||
        e.event.target.parentElement.classList.contains("dx-button-content") ) 
    ) {
      if (!this.readOnly && !e.data.ANULADO) {
        if(e.data.CLASE !== 'NODOS') {
          if (this.editValidator(e, 'editar')) {
            if (!this.esEdicionFila) {
              this.dataTarea_prev = JSON.parse(JSON.stringify(e.data));
              e.component.editRow(e.rowIndex);
              e.data.readOnlyResponsables = false;
              e.data.readOnlyColaboradores = false;
              // e.data.heightColaboradores = '75px';
              this.TreeListTareas.instance.cellValue(e.rowIndex, 'readOnlyColaboradores', false);
              this.TreeListTareas.instance.cellValue(e.rowIndex, 'readOnlyResponsables', false);
              this.esEdicionFila = true;
              this.filasSeleccData = e;
              this.accionLocal = 'update';
            } else {
              if(this.filasSeleccData.rowIndex !== null && this.filasSeleccData.rowIndex !== undefined) {
                if (this.filasSeleccData.rowIndex !== e.rowIndex) {
                  showToast('No puede modificar esta Tarea si esta en Edición la tarea anterior.', 'warning');
                  // let rowIndex = this.filasSeleccData.rowIndex;
                  // let row = e.component.getRowElement(rowIndex)[0];
                  // row.classList.add("row-animation");
                  // this.focusedRowIndex = [rowIndex];
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
          // e.data.heightColaboradores = '40px';
          return;
        }
      }
    }
  }

  
  showProgramarFechas(e:any, cellInfo:any) {
    if (!this.esEdicionFila || this.filasSeleccData.data.ID_ACTIVIDAD === cellInfo.data.ID_ACTIVIDAD) {
      if (this.editValidator(cellInfo, 'fechas')) {
        if (this.esEdicionFila) {
          var startDate:any = cellInfo.data.FECHA_INICIO !== null && cellInfo.data.FECHA_INICIO !== '' ? cellInfo.data.FECHA_INICIO : new Date();
          var endDate:any = cellInfo.data.FECHA_FIN !== null && cellInfo.data.FECHA_FIN !== '' ? cellInfo.data.FECHA_FIN : new Date();
          var allDay:any = cellInfo.data.TODO_DIA !== null && cellInfo.data.TODO_DIA !== undefined ? cellInfo.data.TODO_DIA : false;
          this.filasSeleccData = cellInfo;
          this.datProgFila = cellInfo.rowIndex;
          this.dataProg = {
            accion: 'modificar',
            text: cellInfo.data.NOMBRE,
            startDate: startDate,
            endDate: endDate,
            allDay: allDay,
            ID_ACTIVIDAD: cellInfo.data.ID_ACTIVIDAD,
            editing: true
          };
          
          // this.schedulerProg.instance.showAppointmentPopup(this.dataProg, false);
          this.eventsSubjectProg.next(this.dataProg);


        } else {
          var startDate:any = cellInfo.data.FECHA_INICIO !== null && cellInfo.data.FECHA_INICIO !== '' ? cellInfo.data.FECHA_INICIO : new Date();
          var endDate:any = cellInfo.data.FECHA_FIN !== null && cellInfo.data.FECHA_FIN !== '' ? cellInfo.data.FECHA_FIN : new Date();
          var allDay:any = cellInfo.data.TODO_DIA !== null && cellInfo.data.TODO_DIA !== undefined ? cellInfo.data.TODO_DIA : false;
          this.filasSeleccData = cellInfo;
          this.datProgFila = cellInfo.rowIndex;
          this.dataProg = {
            accion: 'modificar',
            text: cellInfo.data.NOMBRE,
            startDate: startDate,
            endDate: endDate,
            allDay: allDay,
            ID_ACTIVIDAD: cellInfo.data.ID_ACTIVIDAD,
            editing: false
          };
          // this.schedulerProg.instance.showAppointmentPopup(this.dataProg, false);
          this.eventsSubjectProg.next(this.dataProg);

        }
        // this.eventsGesInfo.next({
        //   accion: 'cargar fechas',
        //   config: { accion: 'update dataSource', dataSource: cellInfo, visible: true }
        // });
      }
    } else {
      showToast('No puede visualizar la programación si esta en edición la tarea anterior.', 'warning');
    }
  }

  // Actualiza programación
  onAppointmentUpdated(e:any) {

    // Datos estructurados del scheduler para la proramacion
    this.TreeListTareas.instance.cellValue(this.filasSeleccData.rowIndex, 'DATOS_PROG', e.appointmentData);

    // Datos estructurados para la treelist de tareas
    let tmprecRes = e.appointmentData.recurrenceRule;
    let cnvPer: any[] = [];
    let recRes = { REPETIR: false, FRECUENCIA: '', PERIODO_FRECUENCIA: cnvPer, INTERVALO_FRECUENCIA: ''};
    if (tmprecRes !== undefined) {
      if (tmprecRes !== "") {
        const freq = {DAILY:'Diario',WEEKLY:'Semanal',HOURLY:'Horas',MONTHLY:'Mensual',YEARLY:'Anual'};
        let cnvRes = "{\"" + tmprecRes.replace(/,/g,"|").replace(/;/g,"\",\"").replace(/=/g,"\":\"") + "\"}";
        cnvRes = JSON.parse(cnvRes);
        cnvRes['FREQ'] = cnvRes['FREQ'].replace(cnvRes['FREQ'],freq[cnvRes['FREQ']]);
        if (cnvRes['BYDAY']) cnvPer = cnvRes['BYDAY'].split('|');
        if (cnvRes['BYMONTHDAY'] && !cnvRes['BYMONTH']) cnvPer = cnvRes['BYMONTHDAY'].split(',');
        if (cnvRes['BYMONTHDAY'] && cnvRes['BYMONTH']) cnvPer = [ this.getMonthName(cnvRes['BYMONTH']), cnvRes['BYMONTHDAY'] ];
        recRes = { REPETIR: true, 
                    FRECUENCIA: (cnvRes['FREQ'] ?? ''), 
                    PERIODO_FRECUENCIA: cnvPer, 
                    INTERVALO_FRECUENCIA: (cnvRes['INTERVAL'] ?? '1')
                  }
      }
    }

    this.filasSeleccData.data.FECHA_INICIO = e.appointmentData.startDate !== null && e.appointmentData.startDate !== undefined ? e.appointmentData.startDate : '';
    this.filasSeleccData.data.FECHA_FIN = e.appointmentData.endDate !== null && e.appointmentData.endDate !== undefined ? e.appointmentData.endDate : '';
    this.filasSeleccData.data.TODO_DIA = e.appointmentData.allDay !== null && e.appointmentData.allDay !== undefined ? e.appointmentData.allDay : false;
    this.filasSeleccData.data.REPETIR = recRes.REPETIR !== null && recRes.REPETIR !== undefined ? recRes.REPETIR : false;
    this.filasSeleccData.data.FRECUENCIA = recRes.FRECUENCIA !== null && recRes.FRECUENCIA !== undefined ? recRes.FRECUENCIA : '';
    this.filasSeleccData.data.PERIODO_FRECUENCIA = recRes.PERIODO_FRECUENCIA !== null && recRes.PERIODO_FRECUENCIA !== undefined ? recRes.PERIODO_FRECUENCIA : [];
    this.filasSeleccData.data.INTERVALO_FRECUENCIA = recRes.INTERVALO_FRECUENCIA !== null && recRes.INTERVALO_FRECUENCIA !== undefined ? recRes.INTERVALO_FRECUENCIA : 0;
    this.setProgramacion(this.filasSeleccData);

  }

  getMonthName(monthNumber:any) {
    const date = new Date();
    date.setMonth(monthNumber - 1);

    return date.toLocaleString('en-US', {
      month: 'long',
    });
  }

  // Compone cadena que muestra la programacion escogida
  setProgramacion(data:any) {
    var respProg = '';
    
    if( (data.data.FECHA_INICIO !== null && data.data.FECHA_INICIO !== undefined && data.data.FECHA_INICIO !== '') &&
        (data.data.FECHA_FIN !== null && data.data.FECHA_FIN !== undefined && data.data.FECHA_FIN !== '')
    ) {
      const fecha_inicial:any = new Date(data.data.FECHA_INICIO);
      const fecha_final:any = new Date(data.data.FECHA_FIN);

      const diaUno = fecha_inicial.getDate();
      const mesActualUno = fecha_inicial.getMonth() + 1;
      const añoActualUno = fecha_inicial.getFullYear();

      const diaDos = fecha_final.getDate();
      const mesActualDos = fecha_final.getMonth() + 1;
      const añoActualDos = fecha_final.getFullYear();

      if ( (data.data.TODO_DIA) && (data.data.TODO_DIA !== null) ) {
        if(fecha_inicial !== fecha_final) {
          if (fecha_inicial.getFullYear() === fecha_final.getFullYear()) {
            if( fecha_inicial.getMonth() === fecha_final.getMonth() ) {
              respProg = 'El ' + diaUno + ' Todo el día';
            } else {
              respProg = diaUno + ' ' + fecha_inicial.toLocaleString('default', { month: 'short' }) + ' - ' +
                        diaDos + ' ' + fecha_final.toLocaleString('default', { month: 'short' }) + ' Todo el día';
            }
          } else {
              respProg = diaUno + ' ' + fecha_inicial.toLocaleString('default', { month: 'short' }) + ' ' + fecha_inicial.getFullYear()
                        ' - ' +
                        diaDos + ' ' + fecha_final.toLocaleString('default', { month: 'short' }) + ' ' + fecha_final.getFullYear()
                        + ' Todo el día'
          }
        } else {
          respProg = 'El' + diaUno + ' todo el dia';
        }
      }
      if ( (!data.data.TODO_DIA && !data.data.REPETIR) && (data.data.TODO_DIA !== null && data.data.REPETIR !== null) ) {
        if(fecha_inicial !== fecha_final) {
          if (fecha_inicial.getFullYear() === fecha_final.getFullYear()) {
            if( fecha_inicial.getMonth() === fecha_final.getMonth() ) {
              respProg = diaUno + ' ' + fecha_inicial.toLocaleString('default', { month: 'short' });
            } else {
              respProg = diaUno + ' ' + fecha_inicial.toLocaleString('default', { month: 'short' }) + ' - ' +
                        diaDos + ' ' + fecha_final.toLocaleString('default', { month: 'short' });
            }
          } else {
              respProg = diaUno + ' ' + fecha_inicial.toLocaleString('default', { month: 'short' }) + ' ' + fecha_inicial.getFullYear()
                        ' - ' +
                        diaDos + ' ' + fecha_final.toLocaleString('default', { month: 'short' }) + ' ' + fecha_final.getFullYear()
                        + ' Todo el día'
          }
        } else {
          respProg = diaUno + ' ' + fecha_inicial.toLocaleString('default', { month: 'short' });
        }
      }
      if (data.data.REPETIR && data.data.REPETIR !== null) {
        var titfrec = '';
        switch (data.data.FRECUENCIA) {
          case 'Horas':
            if(data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              if(data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
                respProg = 'Siempre a las ' + data.data.PERIODO_FRECUENCIA + 'cada ' + data.data.INTERVALO_FRECUENCIA;
              } else {
                respProg = 'Siempre a las ' + data.data.PERIODO_FRECUENCIA;
              }
            } else {
              respProg = 'Siempre cada Hora';
            }
            break;
    
          case 'Diario':
            if(data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
              respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' días ';
            } else {
              respProg = 'Cada día';
            }
            break;
    
          case 'Semanal':
            if(data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              var frec = '';
              if(data.data.PERIODO_FRECUENCIA.length > 1) {
                data.data.PERIODO_FRECUENCIA.forEach((item:any) => {
                  frec = frec +', '+ item;
                });
              } else if(data.data.PERIODO_FRECUENCIA.length > 1) {
                frec = data.data.PERIODO_FRECUENCIA[0];
              }
              if(data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
                if(data.data.PERIODO_FRECUENCIA.length > 1)
                  respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' semanas, los ' + frec;
                else
                  respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' semanas, el ' + frec;
              } else {
                if(data.data.PERIODO_FRECUENCIA.length > 1)
                  respProg = 'Cada semana, los ' + frec;
                else
                  respProg = 'Cada semana, el ' + frec;
              }
            } else {
              respProg = 'Cada semana';
            }
            break;
    
          case 'Mensual':
            if(data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              titfrec = data.data.PERIODO_FRECUENCIA.join(',');
              respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' meses, el ' + titfrec;
            } else {
              respProg = 'Cada mes';
            }
            break;
    
          case 'Anual':
            if(data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              titfrec = data.data.PERIODO_FRECUENCIA.join(',');
              respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' años, en ' + titfrec;
            } else {
              respProg = 'Cada año';
            }
            break;
          
          default:
            break;
        }
      }
    } else {
      if ( (data.data.TODO_DIA && !data.data.REPETIR) && (data.data.TODO_DIA !== null && data.data.REPETIR !== null) ) {
        respProg = 'El todo el dia';
      }
      if ( (data.data.TODO_DIA && data.data.REPETIR) && (data.data.TODO_DIA !== null && data.data.REPETIR !== null) ) {
        respProg = 'Repetir todo el dia';
      }
      if (data.data.REPETIR && data.data.REPETIR !== null) {
        var titfrec = '';
        switch (data.data.FRECUENCIA) {
          case 'Horas':
            if(data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              if(data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
                respProg = 'Siempre a las ' + data.data.PERIODO_FRECUENCIA + 'cada ' + data.data.INTERVALO_FRECUENCIA;
              } else {
                respProg = 'Siempre a las ' + data.data.PERIODO_FRECUENCIA;
              }
            } else {
              respProg = 'Siempre cada Hora';
            }
            break;
    
          case 'Diario':
            if(data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
              respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' días ';
            } else {
              respProg = 'Cada día';
            }
            break;
    
          case 'Semanal':
            if(data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              var frec = '';
              if(data.data.PERIODO_FRECUENCIA.length > 1) {
                data.data.PERIODO_FRECUENCIA.forEach((item:any) => {
                  frec = frec +', '+ item;
                });
              } else if(data.data.PERIODO_FRECUENCIA.length > 1) {
                frec = data.data.PERIODO_FRECUENCIA[0];
              }
              if(data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
                if(data.data.PERIODO_FRECUENCIA.length > 1)
                  respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' semanas, los ' + frec;
                else
                  respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' semanas, el ' + frec;
              } else {
                if(data.data.PERIODO_FRECUENCIA.length > 1)
                  respProg = 'Cada semana, los ' + frec;
                else
                  respProg = 'Cada semana, el ' + frec;
              }
            } else {
              respProg = 'Cada semana';
            }
            break;
    
          case 'Mensual':
            if(data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              titfrec = data.data.PERIODO_FRECUENCIA.join(',');
              if(data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
                respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' meses, el ' + titfrec;
              } else {
                respProg = 'Cada mes, el ' + titfrec;
              }
            } else {
              respProg = 'Cada mes';
            }
            break;
    
          case 'Anual':
            if(data.data.PERIODO_FRECUENCIA !== null && data.data.PERIODO_FRECUENCIA !== undefined && data.data.PERIODO_FRECUENCIA !== '') {
              titfrec = data.data.PERIODO_FRECUENCIA.join(',');
              if(data.data.INTERVALO_FRECUENCIA !== null && data.data.INTERVALO_FRECUENCIA !== undefined && data.data.INTERVALO_FRECUENCIA > 0) {
                respProg = 'Cada ' + data.data.INTERVALO_FRECUENCIA + ' años, en ' + titfrec;
              } else {
                respProg = 'Cada año, en ' + titfrec;
              }
            } else {
              respProg = 'Cada año';
            }
            break;
          
          default:
            break;
        }
      }
    }
    // Actualiza valor en el treelist
    data.data.PROGRAMACION = respProg;
    // this.TreeListTareas.instance.cellValue(data.data.ID_ACTIVIDAD, 'PROGRAMACION', data.data.PROGRAMACION);
    // const rowIndex:any = data.component.getRowIndexByKey(data.data.ID_ACTIVIDAD);
    this.TreeListTareas.instance.cellValue(data.rowIndex, 'PROGRAMACION', data.data.PROGRAMACION);
    this.TreeListTareas.instance.refresh();
    
  }

  onContextMenuPreparing(e:any) {
    if( this.editValidator(e.row, 'menu') ) {
      if(e.row.data.CLASE !== 'NODOS' && !this.readOnly) {
        let items: any = [];
        const selectedItems = [e.row.key];
        const hasEditData = e.component.hasEditData();
        
        const index = this.DTareas.findIndex((a:any) => a.ID_ACTIVIDAD === selectedItems[0]);
        // if (this.DTareas[index].ANULADO)
        //   return;

        if (selectedItems.length === 0) {
          items = [
            {
              text: "No selected rows",
              disabled: true
            }
          ];
        } else {
          const subItems: any = [];
          const rowData = e.component.getSelectedRowsData();
    
          selectedItems.forEach(item => {
            rowData.forEach((data:any) => {
              if (item === data.ID_ACTIVIDAD) {
                subItems.push({
                  text: item,
                  items: [
                    {
                      text: "Editar",
                      onClick: () => {
                        e.component.editRow(e.component.getRowIndexByKey(item));
                        this.esEdicionFila = true;
                      }
                    },
                    {
                      template: function() {
                        return `<div> Actividad: ${data.ID_ACTIVIDAD} </div>
                                <div> Detalle: ${data.NOMBRE} </div>
                                <div> Padre: ${data.ID_ACTIVIDAD_PADRE} </div>
                                <div> Responsable: ${data.RESPONSABLE} </div>
                                <div> Estado: ${data.ESTADO} </div>
                                `;
                      },
                      onClick: () => {
                      }
                    }
                  ]
                });
              }
            });
          });
        }

        const data_act:any = this.DTareas[index];
        items.push(
          {
            text: "Editar",
            disabled: (data_act.ANULADO || data_act.ESTADO === 'Finalizado') ? true : this.esEdicionFila,
            onClick: () => {
              if (selectedItems.length !== 0) {
                const npos:any = this.DTareas.findIndex((d:any) => d.ID_ACTIVIDAD === selectedItems[0]);
                this.DTareas[npos].readOnlyResponsables = false;
                this.DTareas[npos].readOnlyColaboradores = false;
                e.component.editRow(e.component.getRowIndexByKey(selectedItems[0]));
                this.esEdicionFila = true;
              }
            }
          },
          {
            text: "Crear",
            disabled: (data_act.ANULADO || data_act.ESTADO === 'Finalizado') ? true : this.esEdicionFila,
            onClick: () => {
              this.TreeListTareas.instance.addRow(index);
              this.esEdicionFila = true;
            }
          },
          {
            text: "Cancelar",
            disabled: (data_act.ANULADO || data_act.ESTADO === 'Finalizado') ? true : !this.esEdicionFila,
            onClick: () => {
              e.component.cancelEditData();
              this.esEdicionFila = false;
            }
          },
          {
            text: "Activar",
            disabled: (!data_act.ANULADO || data_act.ESTADO === 'Finalizado') ? true : false,
            onClick: () => {
              if (selectedItems.length === 0) {
                showToast('No hay actividad seleccionada', 'error');
                return;
              }
              // Elimina filas seleccionadas
              let nom_act = "";
              let actividades:any = '';
              const index = this.DTareas.findIndex((a:any) => a.ID_ACTIVIDAD === selectedItems[0]);
              actividades = this.DTareas.filter((b:any) => b.ID_ACTIVIDAD_PADRE === this.DTareas[index].ID_ACTIVIDAD);
              nom_act = this.DTareas[index].NOMBRE;

              if (this.editValidator(e.row, 'inactivar')) {
                var msj:string;
                if(actividades.length > 0)
                  msj = 'La tarea seleccionada tiene tareas hijas registradas, si la Activa, las tareas hijas seran Activadas!';
                else 
                  msj = '¿Desea activar esta tarea: '+nom_act+'?';
                Swal.fire({
                  title: '',
                  text: msj,
                  iconHtml: "<i class='icon-alert-ol'></i>",
                  showCancelButton: true,
                  confirmButtonColor: '#DF3E3E',
                  cancelButtonColor: '#438ef1',
                  cancelButtonText: 'No',
                  confirmButtonText: 'Sí, activar'
                }).then((result) => {
                  if (result.isConfirmed) {
                    this.accionLocal = 'update';
                    selectedItems.forEach((item:any) => {
                      const index = this.DTareas.findIndex(a => a.ID_ACTIVIDAD === item);
                      this.DTareas[index].ANULADO = false;
                      this.onRespuestaComponent.emit({ accion:'update datasource', data: this.DTareas[index], accionLocal: this.accionLocal });
                      actividades.forEach((actividad:any) => {
                        const index = this.DTareas.findIndex(a => a.ID_ACTIVIDAD === actividad.ID_ACTIVIDAD);
                        this.DTareas[index].ANULADO = false;
                        this.onRespuestaComponent.emit({ accion:'update datasource', data: this.DTareas[index], accionLocal: this.accionLocal });
                      });
                      this.TreeListTareas.instance.refresh();
                    });
                  }
                });
                this.accionLocal = '';
              }

            }
          },
          {
            text: "Inactivar",
            disabled: (data_act.ANULADO || data_act.ESTADO === 'Finalizado') ? true : false,
            onClick: () => {
              if (selectedItems.length === 0) {
                showToast('No hay actividad seleccionada', 'error');
                return;
              }
              // Elimina filas seleccionadas
              let nom_act = "";
              let actividades:any = '';
              const index = this.DTareas.findIndex((a:any) => a.ID_ACTIVIDAD === selectedItems[0]);
              actividades = this.DTareas.filter((b:any) => b.ID_ACTIVIDAD_PADRE === this.DTareas[index].ID_ACTIVIDAD);
              nom_act = this.DTareas[index].NOMBRE;

              if (this.editValidator(e.row, 'inactivar')) {
                var msj:string;
                if(actividades.length > 0)
                  msj = 'La tarea seleccionada tiene tareas hijas registradas, si la inactiva, las tareas hijas seran inactivadas!';
                else 
                  msj = '¿Desea inactivar esta tarea: '+nom_act+'?';
                Swal.fire({
                  title: '',
                  text: msj,
                  iconHtml: "<i class='icon-alert-ol'></i>",
                  showCancelButton: true,
                  confirmButtonColor: '#DF3E3E',
                  cancelButtonColor: '#438ef1',
                  cancelButtonText: 'No',
                  confirmButtonText: 'Sí, inactivar'
                }).then((result) => {
                  if (result.isConfirmed) {
                    this.accionLocal = 'update';
                    selectedItems.forEach((item:any) => {
                      const index = this.DTareas.findIndex(a => a.ID_ACTIVIDAD === item);
                      this.DTareas[index].ANULADO = true;
                      this.onRespuestaComponent.emit({ accion:'update datasource', data: this.DTareas[index], accionLocal: this.accionLocal });
                      actividades.forEach((actividad:any) => {
                        const index = this.DTareas.findIndex(a => a.ID_ACTIVIDAD === actividad.ID_ACTIVIDAD);
                        this.DTareas[index].ANULADO = true;
                        this.onRespuestaComponent.emit({ accion:'update datasource', data: this.DTareas[index], accionLocal: this.accionLocal });
                      });
                      this.TreeListTareas.instance.refresh();
                    });
                  }
                });
                this.accionLocal = '';
              }

            }
          },
          {
            text: "Eliminar", 
            disabled: data_act.ESTADO === 'Finalizado' ? true : this.esEdicionFila,
            onClick: () => {
              if (selectedItems.length === 0) {
                showToast('No hay actividad seleccionada', 'error');
                return;
              }
              // Elimina filas seleccionadas
              let nom_act = "";
              let actividades:any [] = [];
              const index = this.DTareas.findIndex((a:any) => a.ID_ACTIVIDAD === selectedItems[0]);
              actividades = this.DTareas.filter((b:any) => b.ID_ACTIVIDAD_PADRE === this.DTareas[index].ID_ACTIVIDAD);
              nom_act = this.DTareas[index].NOMBRE;

              if (this.editValidator(e.row, 'eliminar')) {
                var msj:string;
                if(actividades.length > 0) {
                  // msj = 'La tarea seleccionada tiene tareas hijas registradas, no se puede eliminar!';
                  showToast('La tarea seleccionada tiene tareas hijas registradas, no se puede eliminar!', 'warning');
                  return;
                } else {
                  msj = '¿Desea eliminar esta tarea: '+nom_act+'?';
                  Swal.fire({
                    title: '',
                    text: msj,
                    iconHtml: "<i class='icon-alert-ol'></i>",
                    showCancelButton: true,
                    confirmButtonColor: '#DF3E3E',
                    cancelButtonColor: '#438ef1',
                    cancelButtonText: 'No',
                    confirmButtonText: 'Sí, eliminar'
                  }).then((result) => {
                    if (result.isConfirmed) {
                      this.accionLocal = 'delete';
                      selectedItems.forEach((item:any) => {
                        switch (this.APLICACION) {
                          case 'GES-001':
                            const index = this.DTareas.findIndex(a => a.ID_ACTIVIDAD === item);
                            this.DTareas[index].ELIMINADO = true;
                            this.onRespuestaComponent.emit({ accion:'update datasource', data: this.DTareas[index], accionLocal: this.accionLocal });
                            this.DTareas.splice(index, 1);
                            // actividades.forEach((actividad:any) => {
                            //   const index = this.DTareas.findIndex(a => a.ID_ACTIVIDAD === actividad.ID_ACTIVIDAD);
                            //   this.onRespuestaComponent.emit({ accion:'update datasource', data: this.DTareas[index], accionLocal: this.accionLocal });
                            //   this.DTareas.splice(index, 1);
                            // });
                            this.TreeListTareas.instance.refresh();                          
                            break;
  
                          case 'GES-003':
                            const pos = this.DTareas.findIndex(a => a.ID_ACTIVIDAD === item);
                            this.DTareas[pos].ELIMINADO = true;
                            this.onRespuestaComponent.emit({ accion:'update datasource', data: this.DTareas[pos], accionLocal: this.accionLocal });
                            this.DTareas.splice(pos, 1);
                            // actividades.forEach((actividad:any) => {
                            //   const index = this.DTareas.findIndex(a => a.ID_ACTIVIDAD === actividad.ID_ACTIVIDAD);
                            //   this.onRespuestaComponent.emit({ accion:'update datasource', data: this.DTareas[index], accionLocal: this.accionLocal });
                            //   this.DTareas.splice(index, 1);
                            // });
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

            }
          },
          {
            text: "Historial",
            disabled: data_act.ANULADO ? true : false,
            onClick: () => {
              this.valoresObjetos('timeline', data_act.ID_ACTIVIDAD, '');
              this.tituloHistorial = data_act.NOMBRE;
            }
          },
          {
            text: "Enviar por Email",
            disabled: data_act.ANULADO ? true : false,
            onClick: () => {
              this.onRespuestaComponent.emit({ accion:'enviar email', data: data_act });
            }
          }
        );

        items.sort(function(a:any, b:any) {
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

  // Ejecuta la eliminación de una actividad
  AccionEliminar(actividad:any, elemento:any): void {
    const prm = { ID_ACTIVIDAD: actividad, CATEGORIA: elemento };
  }

  onFocusIn(e:any, cellInfo:any) {
    this.tituloEditor = cellInfo.data.NOMBRE;
    this.valueContentDescripcion = cellInfo.data.DESCRIPCION_ESTILO ? cellInfo.data.DESCRIPCION_ESTILO : cellInfo.data.DESCRIPCION;
    this.contentDescripcionData = cellInfo;
    this.visibleEditorTexto = true;
  }

  onValueChangedEditorText(e:any) {
    this.valueContentDescripcion = e.value;
  }

  aceptarBottom(e:any) {
    if (this.filasSeleccData.data.DESCRIPCION_ESTILO !== this.valueContentDescripcion) {
      this.filasSeleccData.data.DESCRIPCION_ESTILO = this.valueContentDescripcion;
      this.filasSeleccData.data.DESCRIPCION = this.valueContentDescripcion.replace(/<\/?[^>]+(>|$)/g, "");
      this.TreeListTareas.instance.cellValue(this.contentDescripcionData.rowIndex, 'DESCRIPCION', this.filasSeleccData.data.DESCRIPCION);
      this.TreeListTareas.instance.cellValue(this.contentDescripcionData.rowIndex, 'DESCRIPCION_ESTILO', this.filasSeleccData.data.DESCRIPCION_ESTILO);
      this.conCambios++;
    }
    this.visibleEditorTexto = false;
  }

  closeBottom(e:any) {
    this.tituloEditor = '';
    this.valueContentDescripcion = '';
    this.visibleEditorTexto = false;
  }

  onEditingStart(e:any) {
    this.esEdicionFila = true;
    this.filasSeleccData = e;
    e.data.readOnlyResponsables = false;
    e.data.readOnlyColaboradores = false;
    // e.data.heightColaboradores = '75px';

    setTimeout(() => {
      const rowIndex = e.component.getRowIndexByKey(e.key);
      e.component.focus(e.component.getCellElement(rowIndex, 0));
    }, 100);
  }

  onValueChangedNombre(e:any, cellInfo:any) {
    if(e.value.length <= 100) {
      cellInfo.data.NOMBRE = e.value.charAt(0).toUpperCase() + e.value.slice(1);
      this.TreeListTareas.instance.cellValue(cellInfo.rowIndex, 'NOMBRE', cellInfo.data.NOMBRE);
    } else {
      showToast('El nombre es muy largo, si necesita escribir más puede añadir en Descripción.', 'error');
    }
    this.conCambios++;
  }

  onSelectionChangedResponsable(e:any, cellInfo:any) {
    if ((e.value !== null) && (e.value !== undefined) && (e.value !== 0)) {
      if(cellInfo.data.COLABORADORES !== undefined && cellInfo.data.COLABORADORES.length > 0) {
        const npos:any = cellInfo.data.COLABORADORES.findIndex((d:any) => d === e.value);
        if(npos > -1) {
          cellInfo.data.RESPONSABLE = '';
          this.TreeListTareas.instance.cellValue(cellInfo.rowIndex, 'RESPONSABLE', cellInfo.data.RESPONSABLE);
          showToast('El usuario no puede ser Resonsable y Colaborador de la misma tarea.', 'error');
        } else {
          cellInfo.data.RESPONSABLE = e.value;
          this.TreeListTareas.instance.cellValue(cellInfo.rowIndex, 'RESPONSABLE', cellInfo.data.RESPONSABLE);
          const pos:any = this.JsonDataSource['COLABORADORES'].findIndex((d:any) => d.ID_RESPONSABLE === e.value);
          this.JsonDataSource['COLABORADORES'].splice(pos,1);
        }
      } else {
        cellInfo.data.RESPONSABLE = e.value;
        this.TreeListTareas.instance.cellValue(cellInfo.rowIndex, 'RESPONSABLE', cellInfo.data.RESPONSABLE);
        if(cellInfo.data.COLABORADORES !== undefined && cellInfo.data.COLABORADORES !== null) {
          const pos:any = this.JsonDataSource['COLABORADORES'].findIndex((d:any) => d.ID_RESPONSABLE === e.value);
          this.JsonDataSource['COLABORADORES'].splice(pos,1);
        }
      }
    }
    this.conCambios++;
  }

  onInitializedFromResponsables(e:any) {
    for (let i = 0; i < this.JsonDataSource['COLABORADORES'].length; i++) {
      const data:any = this.JsonDataSource['COLABORADORES'][i];
      const npos: any = data.NOMBRE.indexOf(" ");
      const name = data.NOMBRE.charAt(0).toUpperCase();
      const lastName = data.NOMBRE.substring(npos + 1, data.NOMBRE.length + 1);
      const Lape = lastName.charAt(0).toUpperCase();
      const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
      data.iconNameUser = newName;
    }
  }

  templateHtmlColb(data:any, element:any): any {
    let cad = [{ ID_RESPONSABLE: '', NOMBRE: '', iconNameUser: '', FOTO:'' }];
    let res:any='';
    const pos:any = this.JsonDataSource['COLABORADORES'].findIndex((d:any) => d.ID_RESPONSABLE === data);
    const USR:any = this.JsonDataSource['COLABORADORES'][pos];    
    this.templateGroup.forEach((col:any) => {
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

  onValueColaboradores(e:any, cellInfo:any) {
    var newItem:any = {};
    if(e.value.length > 0) {

      if(cellInfo.data.RESPONSABLE !== '') {
        if(e.value.findIndex((d:any) => d === cellInfo.data.RESPONSABLE) === -1) {
          var newCol:any = [];
          e.value.forEach((ele:any) => {
            const npos:any = this.JsonDataSource['COLABORADORES'].findIndex((d:any) => d.ID_RESPONSABLE === ele);
            if (npos !== -1) {
              newItem.ID_RESPONSABLE = ele;
              newItem.NOMBRE = this.JsonDataSource['COLABORADORES'][npos].NOMBRE;
              newItem.TIPO = 'COLABORADOR';
              newItem.iconNameUser = this.JsonDataSource['COLABORADORES'][npos].iconNameUser;
            }
            newCol.push(JSON.parse(JSON.stringify(newItem)));
          });
          // cellInfo.data.COLABORADORES = newCol;
          cellInfo.data.COLABORADORES = e.value;
          this.TreeListTareas.instance.cellValue(cellInfo.rowIndex, 'COLABORADORES', cellInfo.data.COLABORADORES);
        } else {
          cellInfo.data.COLABORADORES = e.previousValue;
          this.TreeListTareas.instance.cellValue(cellInfo.rowIndex, 'COLABORADORES', cellInfo.data.COLABORADORES);
          showToast('El usuario seleccionado no puede ser RESPONSABLE Y COLABORADOR en la misma tarea.', 'error');
          return;
        }
      } else {
        var newCol:any = [];
        e.value.forEach((ele:any) => {
          const npos:any = this.JsonDataSource['COLABORADORES'].findIndex((d:any) => d.ID_RESPONSABLE === ele);
          if (npos !== -1) {
            newItem.ID_RESPONSABLE = ele;
            newItem.NOMBRE = this.JsonDataSource['COLABORADORES'][npos].NOMBRE;
            newItem.TIPO = 'COLABORADOR';
            newItem.iconNameUser = this.JsonDataSource['COLABORADORES'][npos].iconNameUser;
          }
          newCol.push(JSON.parse(JSON.stringify(newItem)));
        });
        // cellInfo.data.COLABORADORES = newCol;
        cellInfo.data.COLABORADORES = e.value;
        this.TreeListTareas.instance.cellValue(cellInfo.rowIndex, 'COLABORADORES', cellInfo.data.COLABORADORES);
      };
      this.conCambios++;
      
    } else {
      cellInfo.data.COLABORADORES = e.value;
      this.TreeListTareas.instance.cellValue(cellInfo.rowIndex, 'COLABORADORES', cellInfo.data.COLABORADORES);
      this.conCambios++;
    }
  }

  onSelectionEstado(e:any, cellInfo:any) {
    if(e.value === 'Finalizado') {
      const Thijas:any [] = this.DTareas.filter((d:any) => d.ID_ACTIVIDAD_PADRE === cellInfo.data.ID_ACTIVIDAD)
      if (Thijas.length > 0) {
        Thijas.forEach((tar:any) => {
          if(tar.ESTADO !== 'Finalizado') {
            showToast(
              'Esta '+cellInfo.data.CLASE+', tiene '+cellInfo.data.CLASE.toLowerCase()+' hijas sin finalizar.',
              'warning'
            );
          }
          cellInfo.data.ESTADO = e.previousValue;
          this.TreeListTareas.instance.cellValue(cellInfo.rowIndex, 'ESTADO', cellInfo.data.ESTADO);
          return;
        });
      } else {
        if (e.previousValue === '' || e.previousValue === 'Sin Iniciar') {
          showToast(
            'No puede Finalizar esta '+cellInfo.data.CLASE+', sin antes estar En Proceso o Pausada.',
            'warning'
          );
          cellInfo.data.ESTADO = e.previousValue;
          this.TreeListTareas.instance.cellValue(cellInfo.rowIndex, 'ESTADO', cellInfo.data.ESTADO);
          return;
        } else {
          cellInfo.data.ESTADO = e.value;
          this.TreeListTareas.instance.cellValue(cellInfo.rowIndex, 'ESTADO', cellInfo.data.ESTADO);
          this.conCambios++;
        }
      }
    } else {
      cellInfo.data.ESTADO = e.value;
      this.TreeListTareas.instance.cellValue(cellInfo.rowIndex, 'ESTADO', cellInfo.data.ESTADO);
      this.conCambios++;
    }
  }

  onValueChangedDescripcion(e:any, cellInfo:any) {
    cellInfo.data.DESCRIPCION = e.value.charAt(0).toUpperCase() + e.value.slice(1);
    this.TreeListTareas.instance.cellValue(cellInfo.rowIndex, 'DESCRIPCION', cellInfo.data.DESCRIPCION);
    this.conCambios++;
  }

  onSelectionPrioridad(e:any, cellInfo:any) {
    cellInfo.data.PRIORIDAD = e.value;
    this.TreeListTareas.instance.cellValue(cellInfo.rowIndex, 'PRIORIDAD', cellInfo.data.PRIORIDAD);
    this.conCambios++;
  }

  showChatsComentarios(e:any, cellInfo:any) {
    if (!this.esEdicionFila) {
      this.accionLocal = 'historial';
      let editing:boolean = false;
      if (this.editValidator(cellInfo, this.accionLocal))
        editing = false;
      else
        editing = true;
      this.onRespuestaComponent.emit({ accion:'historial tarea', data: cellInfo.data, readOnly: editing });
    }
  }

  onRowValidating(e:any) {
    var res:boolean = false;
    let mensaje:any='';
    let propiedadesVacias:any = [];

    switch (this.accionLocal) {
      case 'new':
        for (let key in this.JsonDatosValidar) {
          if (!e.newData[key] || e.newData[key] === '' || e.newData[key].length < 0) {
            propiedadesVacias.push(key);
          }
        }
        if (propiedadesVacias.length > 0) {
          mensaje = `Para guardar el registro, debe llenar los siguientes campos: ${propiedadesVacias.join(", ")}, complete la información.`;
          e.isValid = false;
          res = false;
        } else {
          e.newData.readOnlyResponsables = true;
          e.newData.readOnlyColaboradores = true;
          // e.newData.heightColaboradores = '40px';
          e.isValid = true;
          this.tituloEditor = '';
          this.valueContentDescripcion = '';
          res = true;
        }
        break;

      case 'update':
        for (let prop in e.newData) {
					if (e.newData.hasOwnProperty(prop) && e.oldData.hasOwnProperty(prop)) {
						e.oldData[prop] = e.newData[prop];
					}
				}
        for (let key in this.JsonDatosValidar) {
          if (!e.oldData[key] || e.oldData[key] === '') {
            propiedadesVacias.push(key);
          }
        }
        if (propiedadesVacias.length > 0) {
          mensaje = `Para actualizar el registro, debe llenar los siguientes campos: ${propiedadesVacias.join(", ")}, complete la información.`;
          e.isValid = false;
          res = false;
        } else {
          e.oldData.readOnlyResponsables = true;
          e.oldData.readOnlyColaboradores = true;
          // e.oldData.heightColaboradores = '40px';
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
      // this.accionLocal = '';
      this.conCambios = 0;
    } else {
      showToast(mensaje, 'error');
    }
    return res;

  }

  onRowUpdated(e:any) {
    this.esEdicionFila = false;
		e.data.isEdit = true;
    this.onRespuestaComponent.emit({ accion:'update datasource', data: e.data, accionLocal: this.accionLocal });
    this.TreeListTareas.instance.refresh();
    // this.accionLocal = '';
  }

  onRowInserted(e:any) {
    this.esEdicionFila = false;
		e.data.isEdit = true;
    this.onRespuestaComponent.emit({ accion:'update datasource', data: e.data, accionLocal: this.accionLocal });
    this.TreeListTareas.instance.refresh();
    // this.accionLocal = '';
  }

  valoresObjetos(obj: string, datos:any, accion:string) {
    if (obj === 'timeline'){
      const prm:any = {ID_ACTIVIDAD: datos};
      this._sdatos.getEstados('TIMELINE', prm).subscribe((data: any)=> {
        const res = validatorRes(data);
        if ( (data.token !== undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if(res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
          return;
        }
        res.forEach((event:any) => {
          if(event.ARCHIVOS === undefined || event.ARCHIVOS === null) event.ARCHIVOS = [];
        });
        this.DTimeline = res.filter((d:any) => d.TIPO === 'AUTOMATICO');
        this.visibleGesproHistorial = true;
      });
    };
  }

}
