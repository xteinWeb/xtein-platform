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

  loadDataInit(data:any) {
    switch (data.accion) {
      case 'init':
        if (this.CONFIG_DATA.data.CONSECUTIVO === data.dataSource.CONSECUTIVO &&
            this.CONFIG_DATA.data.ID_DOCUMENTO === data.dataSource.ID_DOCUMENTO
        ) {
          this.dataGlobal = JSON.parse(JSON.stringify(data.dataSource));
          this.DgDetalles = [];
          const newData = JSON.parse(JSON.stringify(data.dataSource.ITM));
          newData.forEach((elem:any) => {
            this.DgDetalles.push(elem.DATOS[0]);
          });
          this.DgDetalles_prev = JSON.parse(JSON.stringify(this.DgDetalles));
        }
      break;
        
      case 'consulta':
        if (this.CONFIG_DATA.data.CONSECUTIVO === data.dataSource.CONSECUTIVO &&
          this.CONFIG_DATA.data.ID_DOCUMENTO === data.dataSource.ID_DOCUMENTO
      ) {
        this.dataGlobal = JSON.parse(JSON.stringify(data.dataSource));
        this.DgDetalles = [];
        const newData = JSON.parse(JSON.stringify(data.dataSource.ITM));
        newData.forEach((elem:any) => {
          this.DgDetalles.push(elem.DATOS[0]);
        });
        // this.DgDetalles_prev = JSON.parse(JSON.stringify(this.DgDetalles));
      }
      break;
    
      default:
        break;
    }
  }

  customizeColumns(columns:any) {
    var contColm:number = 0;
    columns.forEach((col:any)=> {
      contColm++;
      let columnData:any = this.dataGlobal.ITM[0].DATOS[0];
      this.datosModificables = this.dataGlobal.ITM[0].DATOS_AUTORIZ;
      this.datosValidar = this.dataGlobal.ITM[0].DATOS_AUTORIZ.map((obj:any) => Object.keys(obj));
      this.datosValidar = this.datosValidar.flat();
      
      let text:string = col.dataField.replace(/_/g, ' ').toLowerCase().replace(/(?:^|\s)\w/g, function(match:any) {
        return match.toUpperCase();
      });
      if (text.includes("Cantidad")) {
        text = text.replace(/Cantidad/gi, "Cant.");
      }
      col.caption = text;
      if (col.dataField.match('index|ITEM|readOnly|visible|Err|Mensaje|MODIFICABLE')) {
        col.visible = false;
      };
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
    // const data:any = this.DgDetalles.filter((d:any) => d.ITEM === cellInfo.data.ITEM)
    // const objData:any = JSON.parse(JSON.stringify(data[0]));
    const objData:any = JSON.parse(JSON.stringify(cellInfo.data));
    var objEditing:any = [];
    var data_valid:any = this.datosModificables[0].MODIFICABLE?.map((obj:any) => 'AUT_'+obj.CAMPO);
    if(this.ACCION_LOCAL !== 'consulta')
      if (data_valid)
        objEditing = [...this.datosValidar, ...data_valid];
      else
        objEditing = [...this.datosValidar];
    else
      objEditing= [];

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

  onValueChangedCheck(e:any, cellInfo:any) {
    switch (cellInfo.rowType) {
      case 'header':
        if (e.event) {
          for (let j = 0; j < this.textCheckAll.length; j++) {
            if(this.textCheckAll[j].DATAFIELD === cellInfo.column.dataField)
              this.textCheckAll[j].VALUE = e.value;
            else
              this.textCheckAll[j].VALUE = false;
          }
          //Autoriza/Rechaza todos los items.
          for (let i = 0; i < this.DgDetalles.length; i++) {
            var element = this.DgDetalles[i];
            switch (cellInfo.column.dataField) {
              case 'AUTORIZADO':
                element.AUTORIZADO = e.value;
                element.RECHAZADO = false;
                break;
        
              case 'RECHAZADO':
                element.AUTORIZADO = false;
                element.RECHAZADO = e.value;
                break;
            
              default:
                break;
            }

            let prefijo = 'AUT_';
            let conPrefijo:any = '';
            let sinPrefijo:any = '';
            for (let key in element) {
              if (key.startsWith(prefijo)) {
                conPrefijo = key;
                sinPrefijo = key.substring(prefijo.length);
                if (element.hasOwnProperty(sinPrefijo)) {
                  if (element.AUTORIZADO)
                    element[conPrefijo] = element[sinPrefijo];
                  else if (element.RECHAZADO)
                    element[conPrefijo] = 0;
                }
              }
            }

            this.gridDetalles.instance.cellValue(i, 'AUTORIZADO', element.AUTORIZADO);
            this.gridDetalles.instance.cellValue(i, 'RECHAZADO', element.RECHAZADO);
          }
          // for (let i = 0; i < this.DgDetalles.length; i++) {
          //   //Busca todos los campos AUTORIZAR y los igual con los datos Solicitados.
          //   var element = this.DgDetalles[i];
          //   let prefijo = 'AUT_';
          //   let conPrefijo:any = '';
          //   let sinPrefijo:any = '';
          //   for (let key in element) {
          //     if (key.startsWith(prefijo)) {
          //       conPrefijo = key;
          //       sinPrefijo = key.substring(prefijo.length);
          //       if (element.hasOwnProperty(sinPrefijo)) {
          //         if (element.AUTORIZADO)
          //           element[conPrefijo] = element[sinPrefijo];
          //         else if (element.RECHAZADO)
          //           element[conPrefijo] = 0;
          //       }
          //     }
          //   }
          // }
          // this.conCambios++;
          // this.gridDetalles.instance.refresh();
        }
        break;

      case 'data':
        let prefijo = 'AUT_';
        let conPrefijo:any = '';
        let sinPrefijo:any = '';
        let allChek:any = [];

        switch (cellInfo.column.dataField) {
          case 'AUTORIZADO':
            cellInfo.data.AUTORIZADO = e.value;
            cellInfo.data.RECHAZADO = false;
            //Busca el campo AUTORIZADO y los igual con los datos Solicitados.
            for (let key in cellInfo.data) {
              if (key.startsWith(prefijo)) {
                conPrefijo = key;
                sinPrefijo = key.substring(prefijo.length);
                if (cellInfo.data.hasOwnProperty(sinPrefijo)) {
                  if (e.value && cellInfo.data[conPrefijo] === 0) {
                    cellInfo.data[conPrefijo] = cellInfo.data[sinPrefijo];
                    this.gridDetalles.instance.cellValue(cellInfo.rowIndex, conPrefijo, cellInfo.data[conPrefijo]);
                  }
                }
              }
            }

            for (let i = 0; i < this.DgDetalles.length; i++) {
              const element = this.DgDetalles[i];
              if (element.AUTORIZADO)
                allChek[i] = true;
              else
                allChek[i] = false;
            }
            if(allChek.every((valor:any) => valor === true)) {
              if (this.textCheckAll.length > 0) {
                let npos:any = this.textCheckAll.findIndex((d:any) => d.DATAFIELD === 'AUTORIZADO');
                this.textCheckAll[npos].VALUE = true;
              }
            } else {
              for (let i = 0; i < this.textCheckAll.length; i++) {
                this.textCheckAll[i].VALUE = false;
              }
            }
            break;
    
          case 'RECHAZADO':
            cellInfo.data.AUTORIZADO = false;
            cellInfo.data.RECHAZADO = e.value;
            //Busca el campo AUTORIZADO y los igual con los datos Solicitados.
            for (let key in cellInfo.data) {
              if (key.startsWith(prefijo)) {
                conPrefijo = key;
                sinPrefijo = key.substring(prefijo.length);
                if (cellInfo.data.hasOwnProperty(sinPrefijo)) {
                  if (e.value) {
                    cellInfo.data[conPrefijo] = 0;
                    this.gridDetalles.instance.cellValue(cellInfo.rowIndex, conPrefijo, cellInfo.data[conPrefijo]);
                  }
                }
              }
            }
            for (let i = 0; i < this.DgDetalles.length; i++) {
              const element = this.DgDetalles[i];
              if (element.RECHAZADO)
                allChek[i] = true;
              else
                allChek[i] = false;
            }
            if(allChek.every((valor:any) => valor === true)) {
              if (this.textCheckAll.length > 0) {
                let npos:any = this.textCheckAll.findIndex((d:any) => d.DATAFIELD === 'RECHAZADO')
                this.textCheckAll[npos].VALUE = true;
              }
              
              for (let j = 0; j < this.DgDetalles.length; j++) {
                const ele = this.DgDetalles[j];
                for (let key in ele) {
                  if (key.startsWith(prefijo)) {
                    conPrefijo = key;
                    sinPrefijo = key.substring(prefijo.length);
                    if (ele.hasOwnProperty(sinPrefijo)) {
                      if (e.value) {
                        ele[conPrefijo] = 0;
                        this.gridDetalles.instance.cellValue(j, conPrefijo, ele[conPrefijo]);
                      }
                    }
                  }
                }
              }
            } else {
              for (let i = 0; i < this.textCheckAll.length; i++) {
                this.textCheckAll[i].VALUE = false;
              }
            }
            break;
        
          default:
            cellInfo.data.AUTORIZADO = false;
            cellInfo.data.RECHAZADO = false;
            break;
        }
    
        if(e.value)
          cellInfo.data.ESTADO = cellInfo.column.dataField;
        else
          cellInfo.data.ESTADO = '';
    
        const autorizados = this.DgDetalles.map((item:any) => item.AUTORIZADO); // Obtener todos los valores de AUTORIZADO
        const rechazados = this.DgDetalles.map((item:any) => item.RECHAZADO); // Obtener todos los valores de RECHAZADO
        // Validar si todos los elementos en AUTORIZADO son true
        const todosAutorizados = autorizados.every((valor:any) => valor === true);
        if (this.textCheckAll.length > 0) {
          if (todosAutorizados) {
            let npos:any = this.textCheckAll.findIndex((d:any) => d.DATAFIELD === 'AUTORIZADO')
            this.textCheckAll[npos].VALUE = true;
          } else {
            let npos:any = this.textCheckAll.findIndex((d:any) => d.DATAFIELD === 'AUTORIZADO')
            this.textCheckAll[npos].VALUE = false;
          }
          // Validar si todos los elementos en RECHAZADO son true
          const todosRechazados = rechazados.every((valor:any) => valor === true);
          if (todosRechazados) {
            let npos:any = this.textCheckAll.findIndex((d:any) => d.DATAFIELD === 'RECHAZADO')
            this.textCheckAll[npos].VALUE = true;
          } else {
            let npos:any = this.textCheckAll.findIndex((d:any) => d.DATAFIELD === 'RECHAZADO')
            this.textCheckAll[npos].VALUE = false;
          }
        }

        this.gridDetalles.instance.cellValue(cellInfo.rowIndex, 'AUTORIZADO', cellInfo.data.AUTORIZADO);
        this.gridDetalles.instance.cellValue(cellInfo.rowIndex, 'RECHAZADO', cellInfo.data.RECHAZADO);
        this.gridDetalles.instance.cellValue(cellInfo.rowIndex, 'ESTADO', cellInfo.data.ESTADO);
        break;
    
      default:
        break;
    }
    if(this.ACCION_LOCAL !== 'consulta') {
      this.conCambios++;
      this.validarItmes();
    }
  }

  async onValueChangedValue(e:any, cellInfo:any) {
    if(this.ACCION_LOCAL !== 'consulta') {
      let resp:boolean = true;
      cellInfo.data[cellInfo.column.dataField] = e.value;
      if (cellInfo.column.dataField.startsWith('AUT_'))
        resp = await this.validarConsultaValor(cellInfo);

      if(!resp) {
        cellInfo.data[cellInfo.column.dataField] = e.previousValue;
        cellInfo.data.AUTORIZADO = false;
        cellInfo.data.RECHAZADO = false;
      } else {
        cellInfo.data[cellInfo.column.dataField] = e.value;
        cellInfo.data.AUTORIZADO = true;
        cellInfo.data.RECHAZADO = false;
      }
      if(cellInfo.data.AUTORIZADO)
        cellInfo.data.ESTADO = 'AUTORIZADO';
      else if(cellInfo.data.RECHAZADO)
        cellInfo.data.ESTADO = 'RECHAZADO';

      const autorizados = this.DgDetalles.map((item:any) => item.AUTORIZADO); // Obtener todos los valores de AUTORIZADO
      const rechazados = this.DgDetalles.map((item:any) => item.RECHAZADO); // Obtener todos los valores de RECHAZADO
      // Validar si todos los elementos en AUTORIZADO son true
      const todosAutorizados = autorizados.every((valor:any) => valor === true);
      if (todosAutorizados) {
        let npos:any = this.textCheckAll.findIndex((d:any) => d.DATAFIELD === 'AUTORIZADO')
        this.textCheckAll[npos].VALUE = true;
      } else {
        let npos:any = this.textCheckAll.findIndex((d:any) => d.DATAFIELD === 'AUTORIZADO')
        this.textCheckAll[npos].VALUE = false;
      }
      // Validar si todos los elementos en RECHAZADO son true
      const todosRechazados = rechazados.every((valor:any) => valor === true);
      if (todosRechazados) {
        let npos:any = this.textCheckAll.findIndex((d:any) => d.DATAFIELD === 'RECHAZADO')
        this.textCheckAll[npos].VALUE = true;
      } else {
        let npos:any = this.textCheckAll.findIndex((d:any) => d.DATAFIELD === 'RECHAZADO')
        this.textCheckAll[npos].VALUE = false;
      }
      
      this.gridDetalles.instance.cellValue(cellInfo.rowIndex, cellInfo.column.dataField, cellInfo.data[cellInfo.column.dataField]);
      this.gridDetalles.instance.cellValue(cellInfo.rowIndex, 'AUTORIZADO', cellInfo.data.AUTORIZADO);
      this.gridDetalles.instance.cellValue(cellInfo.rowIndex, 'RECHAZADO', cellInfo.data.RECHAZADO);
      this.gridDetalles.instance.cellValue(cellInfo.rowIndex, 'ESTADO', cellInfo.data.ESTADO);
      this.conCambios++;
      this.validarItmes();
    }
  }

  opPrepararGuardar(e:any) {
		if ( this.conCambios > 0 ) {
      if (this.validarDatos()) {
        var prm:any = [];
        var ITEMS:any [] = []
        for (let i = 0; i < this.DgDetalles.length; i++) {
          const element = this.DgDetalles[i];
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
          
          for(let key in element) {
            if (objEditing.includes(key)) {
              data_aut.push(key);
            }
          };
          var B:any = {};
          data_aut.forEach(key => {
            B[key] = element[key];
          });
          data_aut = B;
          const item:any = {
            ID_DOCUMENTO: this.dataGlobal.ID_DOCUMENTO,
            CONSECUTIVO: this.dataGlobal.CONSECUTIVO,
            ITEM: element.ITEM,
            ID_APLICACION: this.dataGlobal.ID_APLICACION,
            DATOS: element,
            DATOS_AUTORIZ: [data_aut],
            FECHA_AUTORIZACION: new Date().toISOString().split('T')[0],
            HORA_AUTORIZACION: new Date().toTimeString().split(' ')[0],
            ESTADO: element.ESTADO,
            OBSERVACIONES: element.OBSERVACIONES,
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

  validarItmes() {
    let datos_true: boolean[] = [];
    for (let i = 0; i < this.DgDetalles.length; i++) {
      const item = this.DgDetalles[i];
      let itemValid = false;
      for (let key in item) {
        if (this.datosValidar.includes(key)) {
          const data_prev = [item];
          if (data_prev.some((d:any) => d[key] === true)) {
            datos_true.push(true);
            itemValid = true;
            break;
          }
        }
      };
      if (!itemValid) {
        datos_true.push(false);
      }
    }
    if(datos_true.every(dato => dato === true))
      this.btnAutorizar = false;
    else
      this.btnAutorizar = true;
      
    this.gridDetalles.instance.saveEditData();
  }

  validarDatos() {
    this.gridDetalles.instance.refresh();
    let datos_true: boolean[] = [];
    for (let i = 0; i < this.DgDetalles.length; i++) {
      const item = this.DgDetalles[i];
      let itemValid = false;
      // Verificar si algún dato de la fila necesita ser validado
      for (let key in item) {
        if (this.datosValidar.includes(key)) {
          const data_prev = [item];
          if (data_prev.some((d:any) => d[key] === true || d[key] > 0)) {
            datos_true.push(true);
            itemValid = true;
            break;
          }
        }
      }
      // Si la fila no necesita validación, agregamos false a datos_true
      if (!itemValid) {
        datos_true.push(false);
      }
    }
    // Si todos los datos son true, entonces res es true
    const res = datos_true.every(dato => dato === true);

    return res;
  }

  async validarConsultaValor(cellInfo:any) {
    var resValid:boolean = true;
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
