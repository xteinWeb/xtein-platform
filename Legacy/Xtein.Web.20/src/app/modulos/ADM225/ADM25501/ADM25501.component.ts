import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxNumberBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { Observable, Subscription, lastValueFrom, of } from 'rxjs';
import { ADM225Service } from 'src/app/services/ADM225/ADM225.service';
import Swal from 'sweetalert2';
import { showToast } from '../../../shared/toast/toastComponent.js';
import { validatorRes } from 'src/app/shared/validator/validator.js';

@Component({
  selector: 'app-ADM25501',
  templateUrl: './ADM25501.component.html',
  styleUrls: ['./ADM25501.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxButtonModule, DxCheckBoxModule, DxTextBoxModule, DxNumberBoxModule, DxDateBoxModule]
})
export class ADM25501Component {

  @ViewChild("gridDetalles", { static: false }) gridDetalles: DxDataGridComponent;
  @Input() events: Observable<any>;
  @Input() CONFIG_DATA: any;
  @Input() ACCION_LOCAL: any;
  // @Output() readOnlyChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();

  private eventsSubscription: Subscription;
  subscription: Subscription;

  DgDetalles:any = [];
  DgDetalles_prev:any = [];
  dataGlobal:any = [];
  USUARIO_LOCAL:any = '';
  // ACCION_LOCAL: string = '';

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  textCheckAll: any = [];
  valueCheckAll: any = [];
  esVisibleSelecc: string = 'none';
  conCambios: number = 0;
  datosValidar: any;
  datosModificables: any;
  configured : boolean = false;
  btnAutorizar : boolean = true;
  detalleKeyExpr: string = 'ROW_UID';

  // Cache para permisos de edición (Opción 4)
  objEditingCache: any[] = [];

  // Detectar si la aplicación tiene campos MODIFICABLE (COM-204/205/206) o no (PRO-019/FIN-016/VEN-001)
  tieneModificable: boolean = false;

  constructor(
    private sData: ADM225Service
  )  {
    this.customizeColumns = this.customizeColumns.bind(this);
    this.onValueChangedCheck = this.onValueChangedCheck.bind(this);
    this.onValueChangedValue = this.onValueChangedValue.bind(this);
    this.validarDatos = this.validarDatos.bind(this);
    this.validarConsultaValor = this.validarConsultaValor.bind(this);
    this.getDataValueCheckHeader = this.getDataValueCheckHeader.bind(this);
  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      this.configured = true;
      switch (datos.accion) {
        case 'init':
          // this.ACCION_LOCAL = datos.accion;
          this.loadDataInit(datos);
          break;

        case 'consulta':
          // this.ACCION_LOCAL = datos.accion;
          this.loadDataInit(datos);
          break;

        default:
          break;
      }
    });
    setTimeout(() => {
      if (!this.configured && this.CONFIG_DATA !== '') {
        // this.ACCION_LOCAL = 'init';
        this.loadDataInit({dataSource: this.CONFIG_DATA.data, accion: this.ACCION_LOCAL});
      }
    }, 300);
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  onContentReadyGridDetalles(e:any) {
    e.component.columnOption("command:edit", "visible", false);
  }

  private loadDetalleRows(items:any[]): any[] {
    const detalles:any[] = [];
    let rowUid:number = 0;

    items.forEach((elem:any) => {
      const rows = Array.isArray(elem?.DATOS) ? elem.DATOS : [];
      rows.forEach((row:any) => {
        const rowData = JSON.parse(JSON.stringify(row));
        rowData.ROW_UID = ++rowUid;
        detalles.push(rowData);
      });
    });

    return detalles;
  }

  loadDataInit(data:any) {
    switch (data.accion) {
      case 'init':
        if (this.CONFIG_DATA.data.CONSECUTIVO === data.dataSource.CONSECUTIVO &&
            this.CONFIG_DATA.data.ID_DOCUMENTO === data.dataSource.ID_DOCUMENTO
        ) {
          this.dataGlobal = JSON.parse(JSON.stringify(data.dataSource));
          const newData = JSON.parse(JSON.stringify(data.dataSource.ITM));
          this.DgDetalles = this.loadDetalleRows(newData);
          this.DgDetalles_prev = JSON.parse(JSON.stringify(this.DgDetalles));

          // Calcular permisos de edición una sola vez (Opción 4)
          this.calcularPermisosEdicion();
        }
      break;

      case 'consulta':
        if (this.CONFIG_DATA.data.CONSECUTIVO === data.dataSource.CONSECUTIVO &&
          this.CONFIG_DATA.data.ID_DOCUMENTO === data.dataSource.ID_DOCUMENTO
      ) {
        this.dataGlobal = JSON.parse(JSON.stringify(data.dataSource));
        const newData = JSON.parse(JSON.stringify(data.dataSource.ITM));
        this.DgDetalles = this.loadDetalleRows(newData);
        // this.DgDetalles_prev = JSON.parse(JSON.stringify(this.DgDetalles));

        // Calcular permisos de edición una sola vez (Opción 4)
        this.calcularPermisosEdicion();
      }
      break;

      default:
        break;
    }
  }

  // Opción 4: Cachear cálculo de permisos de edición
  calcularPermisosEdicion() {
    this.datosModificables = this.dataGlobal.ITM[0].DATOS_AUTORIZ;
    this.datosValidar = this.dataGlobal.ITM[0].DATOS_AUTORIZ.map((obj:any) => Object.keys(obj));
    this.datosValidar = this.datosValidar.flat();

    let data_valid:any = this.datosModificables[0]?.MODIFICABLE?.map((obj:any) => 'AUT_'+obj.CAMPO);

    // Detectar si tiene campos MODIFICABLE
    this.tieneModificable = (data_valid && data_valid.length > 0) ? true : false;

    if(this.ACCION_LOCAL !== 'consulta') {
      if (data_valid) {
        this.objEditingCache = [...this.datosValidar, ...data_valid];
      } else {
        this.objEditingCache = [...this.datosValidar];
      }
    } else {
      this.objEditingCache = [];
    }
  }

  customizeColumns(columns:any) {
    var contColm:number = 0;

    // Validación defensiva: verificar estructura de datos
    if (!this.dataGlobal || !this.dataGlobal.ITM || !this.dataGlobal.ITM[0] || !this.dataGlobal.ITM[0].DATOS || !this.dataGlobal.ITM[0].DATOS[0]) {
      return; // Salir si no hay datos válidos
    }

    columns.forEach((col:any)=> {
      contColm++;
      let columnData:any = this.dataGlobal.ITM[0].DATOS[0];

      // Opción 4: Ya no recalcular, usar valores del cache
      // this.datosModificables y this.datosValidar ya fueron calculados en calcularPermisosEdicion()

      let text:string = col.dataField.replace(/_/g, ' ').toLowerCase().replace(/(?:^|\s)\w/g, function(match:any) {
        return match.toUpperCase();
      });
      if (text.includes("Cantidad")) {
        text = text.replace(/Cantidad/gi, "Cant.");
      }
      col.caption = text;
      if (col.dataField.match('index|ITEM|ROW_UID|readOnly|visible|Err|Mensaje|MODIFICABLE|ESTADO')) {
        col.visible = false;
      };
      col.allowSorting = false;
      if (col.visible) {
        //Valida la accion y los datos para permitir modificar
        if(this.ACCION_LOCAL !== 'consulta') {
          if (this.datosModificables.length > 0) {
            var data_valid:any = this.datosModificables[0].MODIFICABLE?.map((obj:any) => 'AUT_'+obj.CAMPO);
            if (data_valid) {
              data_valid = data_valid.flat();
              col.allowEditing = this.datosValidar.includes(col.dataField) ? true : data_valid.includes(col.dataField) ? true : false;
            } else {
              col.allowEditing = false;
            }
          } else {
            col.allowEditing = false;
          }
        } else {
          col.allowEditing = false;
        }
        if (col.dataField.match('DESCRIPCION|OBSERVACIONES')) {
          col.width = '300px';
        };


        col.visibleIndex = contColm;
        const typeData:any = typeof columnData[col.dataField];
        switch (typeData) {
          case 'boolean':
            col.alignment = "center";
            col.cellTemplate = 'editCkeckBox';
            col.width = '120px';
            if (col.allowEditing) {
              col.editCellTemplate = 'editCkeckBox';
              col.headerCellTemplate = 'headerTemplateCheck';
            }
            break;

          case 'string':
            col.alignment = "left";
            col.cellTemplate = 'editTextBox';
            if (col.allowEditing)
              col.editCellTemplate = 'editTextBox';
            break;

          case 'number':
            col.alignment = "rigth";
            col.cellTemplate = 'editNumberBox';
            col.width = col.caption.match('Cant')? '100px':'130px';
            if (col.dataField.match('total|proteccion|valor'))
              col.format = '$ #,##0.00'
            else if (col.dataField.match('margen|ajuste|Con'))
              col.format = '#0.00%'
            else
              col.format = '#,##0.00'
            if (col.allowEditing)
              col.editCellTemplate = 'editNumberBox';
            break;

          case 'time':
            col.alignment = "rigth";
            col.cellTemplate = 'editTimeBox';
            if (col.allowEditing)
              col.editCellTemplate = 'editTimeBox';
            break;

          case 'date':
            col.alignment = "rigth";
            col.cellTemplate = 'editDateBox';
            if (col.allowEditing)
              col.editCellTemplate = 'editDateBox';
            break;

          case 'object':
            col.visible = false;
            col.allowEditing = false;
            break;

          default:
            break;
        }
      } else {
        col.allowEditing = false;
      }

    });
  }

  getDataValueCheckHeader(cellInfo:any, campo:string) {
    var res:any;
    switch (campo) {
      case 'header':
        const npos:any = this.textCheckAll.findIndex((d:any) => d.DATAFIELD === cellInfo.column.dataField);
        if(npos > -1) {
          // this.valueCheckAll[npos] = this.valueCheckAll[npos] || false;
          // res = this.valueCheckAll[npos];
          this.textCheckAll[npos].VALUE = this.textCheckAll[npos].VALUE || false;
          res = this.textCheckAll[npos].VALUE;
        } else {
          res = false;
        }
        break;

      default:
        res = false;
        break;
    }
    return of(res);
  }

  getDataValue(cellInfo:any, campo:string) {
    // Utilizar of de RxJS para emitir los datos de manera asíncrona
    var res:any;

    // CRÍTICO: Buscar el item real en el datasource usando la key única
    // No usar cellInfo.data porque con virtual scrolling puede tener datos antiguos
    const itemIndex = this.DgDetalles.findIndex((item:any) =>
      item[this.detalleKeyExpr] === cellInfo.key
    );

    // Si no se encuentra el item, usar cellInfo.data como fallback
    const objData:any = itemIndex !== -1
      ? this.DgDetalles[itemIndex]
      : cellInfo.data;

    // Opción 4: Usar el cache de permisos en lugar de recalcular
    const objEditing:any = this.objEditingCache;

    switch (campo) {
      case 'value':
        switch (cellInfo.column.dataType) {
          case 'boolean':
            res = objData[cellInfo.column.dataField] || false;
            break;

          case 'string':
            res = objData[cellInfo.column.dataField] || '';
            break;

          case 'number':
            res = objData[cellInfo.column.dataField] || 0;
            break;

          case 'time':
            res = objData[cellInfo.column.dataField] || null;
            break;

          case 'date':
            res = objData[cellInfo.column.dataField] || null;
            break;

          default:
            break;
        }
        break;

      case 'readOnly':
        switch (cellInfo.column.dataType) {
          case 'boolean':
            res = objEditing.includes(cellInfo.column.dataField) ? false : true;
            break;

          case 'string':
            res = objEditing.includes(cellInfo.column.dataField) ? false : true;
            break;

          case 'number':
            res = objEditing.includes(cellInfo.column.dataField) ? false : true;
            break;

          case 'time':
            res = objEditing.includes(cellInfo.column.dataField) ? false : true;
            break;

          case 'date':
            res = objEditing.includes(cellInfo.column.dataField) ? false : true;
            break;

          default:
            res = true;
            break;
        }
        break;

      case 'format':
        if (cellInfo.column.dataField.match('total|proteccion|valor'))
          res = '$ #,##0.00'
        else if (cellInfo.column.dataField.match('margen|ajuste|Con'))
          res = '#0.00%'
        else
          res = '#,##0.00'
        break;

      default:
        break;
    }

    return of(res);
  }

  onContentReadyCheckAll(e:any, cellInfo:any) {
    // if(!this.textCheckAll.includes(e.element.id)) {
    //   this.textCheckAll.push(cellInfo.column.dataField);
    // }
    if(this.textCheckAll.findIndex((d:any) => d.ID === e.element.id) === -1) {
      this.textCheckAll.push({ID: e.element.id, DATAFIELD: cellInfo.column.dataField, VALUE: false});
    }
  }

  private setHeaderCheckValue(dataField:string, value:boolean) {
    if (this.textCheckAll.length === 0) return;
    const npos:any = this.textCheckAll.findIndex((d:any) => d.DATAFIELD === dataField);
    if (npos > -1) {
      this.textCheckAll[npos].VALUE = value;
    }
  }

  private syncHeaderChecks() {
    const todosAutorizados = this.DgDetalles.length > 0 && this.DgDetalles.every((item:any) => item.AUTORIZADO === true);
    const todosRechazados = this.DgDetalles.length > 0 && this.DgDetalles.every((item:any) => item.RECHAZADO === true);
    this.setHeaderCheckValue('AUTORIZADO', todosAutorizados);
    this.setHeaderCheckValue('RECHAZADO', todosRechazados);
  }

  private applyAutFieldsByStatus(row:any, copyOnlyIfZero:boolean = false) {
    const prefijo = 'AUT_';
    for (let key in row) {
      if (key.startsWith(prefijo)) {
        const sinPrefijo = key.substring(prefijo.length);
        if (row.hasOwnProperty(sinPrefijo)) {
          if (row.AUTORIZADO) {
            if (!copyOnlyIfZero || row[key] === 0) {
              row[key] = row[sinPrefijo];
            }
          } else if (row.RECHAZADO) {
            row[key] = 0;
          }
        }
      }
    }
  }

  private resetAutFields(row:any) {
    const prefijo = 'AUT_';
    for (let key in row) {
      if (key.startsWith(prefijo)) {
        row[key] = 0;
      }
    }
  }

  private shouldResetInvalidAutValueToZero(dataField:string): boolean {
    return dataField.startsWith('AUT_');
  }

  onValueChangedCheck(e:any, cellInfo:any) {
    switch (cellInfo.rowType) {
      case 'header':
        if (e.event) {
          const esAutorizar = cellInfo.column.dataField === 'AUTORIZADO';
          const esRechazar = cellInfo.column.dataField === 'RECHAZADO';
          if (!esAutorizar && !esRechazar) break;

          this.setHeaderCheckValue(cellInfo.column.dataField, e.value);
          this.setHeaderCheckValue(esAutorizar ? 'RECHAZADO' : 'AUTORIZADO', false);

          for (let i = 0; i < this.DgDetalles.length; i++) {
            const element = this.DgDetalles[i];
            if (esAutorizar) {
              element.AUTORIZADO = e.value;
              element.RECHAZADO = false;
            } else {
              element.AUTORIZADO = false;
              element.RECHAZADO = e.value;
            }

            if (!e.value && esAutorizar) {
              this.resetAutFields(element);
            } else {
              this.applyAutFieldsByStatus(element);
            }

            // Actualizar campo ESTADO (consistente con caso 'data')
            if (e.value) {
              element.ESTADO = cellInfo.column.dataField;
            } else {
              element.ESTADO = '';
            }
          }

          // Opción A: Cambios masivos en header requieren re-asignación para virtual scrolling
          // Re-asignar array fuerza Angular change detection
          this.DgDetalles = [...this.DgDetalles];

          // Forzar repintado de todas las filas por key (crítico para virtual scrolling)
          if (this.DgDetalles && this.DgDetalles.length > 0) {
            const allKeys = this.DgDetalles.map(item => item[this.detalleKeyExpr]);
            this.gridDetalles.instance.repaintRows(allKeys);
          }
        }
        break;

      case 'data':
        // Buscar el item correcto en el datasource usando la key
        const itemIndex = this.DgDetalles.findIndex((item:any) => item[this.detalleKeyExpr] === cellInfo.key);
        if (itemIndex === -1) break;

        const targetItem = this.DgDetalles[itemIndex];

        switch (cellInfo.column.dataField) {
          case 'AUTORIZADO':
            targetItem.AUTORIZADO = e.value;
            targetItem.RECHAZADO = false;
            if (e.value) {
              this.applyAutFieldsByStatus(targetItem, true);
            } else {
              this.resetAutFields(targetItem);
            }
            break;

          case 'RECHAZADO':
            targetItem.AUTORIZADO = false;
            targetItem.RECHAZADO = e.value;
            this.applyAutFieldsByStatus(targetItem);
            break;

          default:
            targetItem.AUTORIZADO = false;
            targetItem.RECHAZADO = false;
            break;
        }

        if(e.value)
          targetItem.ESTADO = cellInfo.column.dataField;
        else
          targetItem.ESTADO = '';

        this.syncHeaderChecks();

        // Opción 1: Usar repaintRows para todas las aplicaciones
        // Solo repinta la fila modificada, evita recarga de toda la tabla
        this.gridDetalles.instance.repaintRows([cellInfo.key]);
        break;

      default:
        break;
    }
    if(this.ACCION_LOCAL !== 'consulta') {
      this.conCambios++;
      this.validarItems();
    }
  }

  async onValueChangedValue(e:any, cellInfo:any) {
    if(this.ACCION_LOCAL !== 'consulta') {
      // Buscar el item correcto en el datasource usando la key
      const itemIndex = this.DgDetalles.findIndex((item:any) => item[this.detalleKeyExpr] === cellInfo.key);
      if (itemIndex === -1) return;

      const targetItem = this.DgDetalles[itemIndex];

      let resp:boolean = true;
      targetItem[cellInfo.column.dataField] = e.value;

      // Crear un cellInfo temporal para la validación
      const tempCellInfo = {...cellInfo, data: targetItem};

      if (cellInfo.column.dataField.startsWith('AUT_'))
        resp = await this.validarConsultaValor(tempCellInfo);

      if(!resp) {
        targetItem[cellInfo.column.dataField] = this.shouldResetInvalidAutValueToZero(cellInfo.column.dataField)
          ? 0
          : e.previousValue;
        targetItem.AUTORIZADO = false;
        targetItem.RECHAZADO = false;
        if (this.shouldResetInvalidAutValueToZero(cellInfo.column.dataField)) {
          this.resetAutFields(targetItem);
          targetItem[cellInfo.column.dataField] = 0;
        }
      } else {
        targetItem[cellInfo.column.dataField] = e.value;
        targetItem.AUTORIZADO = true;
        targetItem.RECHAZADO = false;
      }

      if(targetItem.AUTORIZADO)
        targetItem.ESTADO = 'AUTORIZADO';
      else if(targetItem.RECHAZADO)
        targetItem.ESTADO = 'RECHAZADO';
      else
        targetItem.ESTADO = '';

      this.syncHeaderChecks();

      // Opción 1: Usar repaintRows para todas las aplicaciones
      // Solo repinta la fila modificada, evita recarga de toda la tabla
      this.gridDetalles.instance.repaintRows([cellInfo.key]);

      this.conCambios++;
      this.validarItems();
    }
  }

  opPrepararGuardar(e:any) {
		if ( this.conCambios > 0 ) {
      if (this.validarDatos()) {
        var prm:any = [];
        var ITEMS:any [] = []
        for (let i = 0; i < this.DgDetalles.length; i++) {
          const element = this.DgDetalles[i];
          const dataRow = JSON.parse(JSON.stringify(element));
          delete dataRow.ROW_UID;
          var data_aut:any []= [];
          var objEditing:any [] = [];
          var data_valid:any = this.datosModificables[0].MODIFICABLE?.map((obj:any) => 'AUT_'+obj.CAMPO);
          if(this.ACCION_LOCAL !== 'consulta') {
            if (data_valid)
              objEditing = [...this.datosValidar, ...data_valid];
            else
              objEditing = [...this.datosValidar];
          } else {
            objEditing= [];
          }

          for(let key in dataRow) {
            if (objEditing.includes(key)) {
              data_aut.push(key);
            }
          };
          var B:any = {};
          data_aut.forEach(key => {
            B[key] = dataRow[key];
          });
          data_aut = B;
          const item:any = {
            ID_DOCUMENTO: this.dataGlobal.ID_DOCUMENTO,
            CONSECUTIVO: this.dataGlobal.CONSECUTIVO,
            ITEM: dataRow.ITEM,
            ID_APLICACION: this.dataGlobal.ID_APLICACION,
            DATOS: dataRow,
            DATOS_AUTORIZ: [data_aut],
            FECHA_AUTORIZACION: new Date().toISOString().split('T')[0],
            HORA_AUTORIZACION: new Date().toTimeString().split(' ')[0],
            ESTADO: dataRow.ESTADO,
            OBSERVACIONES: dataRow.OBSERVACIONES,
            USUARIO_AUTORIZA: this.USUARIO_LOCAL
          };
          ITEMS.push(item);
        }

        var ENCABEZADO:any = {};
        if (this.DgDetalles[0].ACCION) {
          ENCABEZADO = {
            ACCION: this.DgDetalles[0].ACCION,
            ID_DOCUMENTO: this.dataGlobal.ID_DOCUMENTO,
            CONSECUTIVO: this.dataGlobal.CONSECUTIVO,
            ID_APLICACION: this.dataGlobal.ID_APLICACION,
            FECHA_AUTORIZACION: new Date().toISOString().split('T')[0],
            HORA_AUTORIZACION: new Date().toTimeString().split(' ')[0],
            USUARIO_AUTORIZA: this.USUARIO_LOCAL,
          };
        } else {
          ENCABEZADO = {
            ID_DOCUMENTO: this.dataGlobal.ID_DOCUMENTO,
            CONSECUTIVO: this.dataGlobal.CONSECUTIVO,
            ID_APLICACION: this.dataGlobal.ID_APLICACION,
            FECHA_AUTORIZACION: new Date().toISOString().split('T')[0],
            HORA_AUTORIZACION: new Date().toTimeString().split(' ')[0],
            USUARIO_AUTORIZA: this.USUARIO_LOCAL,
          };
        }

        this.onRespuestaComponent.emit({ ACCION:'guardar datos', DATA: {ENCABEZADO, ITEMS} });
      } else {
        showToast('Se deben Autorizar todos los Items cargados.', 'error');
      }
    } else {
      showToast('No hay cambios por guardar', 'error');
		}

  }

  validarItems() {
    // let datos_true: boolean[] = [];
    // for (let i = 0; i < this.DgDetalles.length; i++) {
    //   const item = this.DgDetalles[i];
    //   let itemValid = false;
    //   for (let key in item) {
    //     if (this.datosValidar.includes(key)) {
    //       const data_prev = [item];
    //       if (data_prev.some((d:any) => d[key] === true)) {
    //         datos_true.push(true);
    //         itemValid = true;
    //         break;
    //       }
    //     }
    //   };
    //   if (!itemValid) {
    //     datos_true.push(false);
    //   }
    // }

    if (this.DgDetalles.every((dato:any) => dato.AUTORIZADO === false && dato.RECHAZADO === false))
      this.btnAutorizar = true;
    if (this.DgDetalles.every((dato:any) => dato.AUTORIZADO === true))
      this.btnAutorizar = false;

    // Opción 2: Eliminado saveEditData() que puede causar bloqueos
    // this.gridDetalles.instance.saveEditData();
  }

  validarDatos() {
    this.gridDetalles.instance.refresh();
    // let datos_true: boolean[] = [];
    // for (let i = 0; i < this.DgDetalles.length; i++) {
    //   const item = this.DgDetalles[i];
    //   let itemValid = false;
    //   // Verificar si algún dato de la fila necesita ser validado
    //   for (let key in item) {
    //     if (this.datosValidar.includes(key)) {
    //       const data_prev = [item];
    //       if (data_prev.some((d:any) => d[key] === true || d[key] > 0)) {
    //         datos_true.push(true);
    //         itemValid = true;
    //         break;
    //       }
    //     }
    //   }
    //   // Si la fila no necesita validación, agregamos false a datos_true
    //   if (!itemValid) {
    //     datos_true.push(false);
    //   }
    // }
    // // Si todos los datos son true, entonces res es true
    // const res = datos_true.every(dato => dato === true);

    const res = this.DgDetalles.some((item:any) => {return item.AUTORIZADO === true || item.RECHAZADO === true ? true : false});

    return res;
  }

  async validarConsultaValor(cellInfo:any) {
    var resValid:boolean = true;

    // Validación defensiva: verificar que exista MODIFICABLE (solo COM-204/205/206)
    if (!this.datosModificables || !this.datosModificables[0] || !this.datosModificables[0].MODIFICABLE) {
      return true; // Apps sin MODIFICABLE (PRO-019/FIN-016/VEN-001) retornan true
    }

    var data_valid:any = this.datosModificables[0].MODIFICABLE.map((obj:any) => 'AUT_'+obj.CAMPO);
    data_valid = data_valid.flat();
    if (data_valid.includes(cellInfo.column.dataField)) {
      const prefijo = "AUT_";
      var ite:any = '';
      ite = cellInfo.column.dataField.substring(prefijo.length);
      const npos:any = this.datosModificables[0].MODIFICABLE.findIndex((d:any) => d.CAMPO === ite);
      const prm = {
        ACCION:this.datosModificables[0].MODIFICABLE[npos].ACCION.ACCION,
        ID_APLICACION:this.datosModificables[0].MODIFICABLE[npos].ACCION.ID_APLICACION,
        DATOS: cellInfo.data
      };
      const apiRest = this.sData.validarDatos(prm.ACCION, prm.DATOS, prm.ID_APLICACION);
      const res = await lastValueFrom(apiRest, { defaultValue: true });
      const newArray = validatorRes(res);
      const mensaje = newArray[0].ErrMensaje;
      if (mensaje !== '') {
        resValid = false;
        showToast(mensaje, 'Error');
      } else {
        resValid = true;
      }
    }
    return resValid;
  }

  showModal(mensaje: any, title: any) {
    const tipo = title;
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo==='Error' ? 'DF3E3E':'#0F4C81 !important',
			title: title,
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
