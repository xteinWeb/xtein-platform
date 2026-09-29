import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule } from 'devextreme-angular';
import { Observable, Subject, Subscription } from 'rxjs';
import { PRO007Service } from 'src/app/services/PRO007/PRO007.service';
import Swal from 'sweetalert2';
import { clsBodegas, clsDocumentacion } from '../clsPRO022.class';
import notify from 'devextreme/ui/notify';
import dxCheckBox from 'devextreme/ui/check_box';
import { CommonModule } from '@angular/common';
import { XcComboGridComponent } from 'src/app/shared/xc-combo-grid/xc-combo-grid.component';
import { RouterLink } from '@angular/router';
import { showToast } from '../../../../shared/toast/toastComponent.js'
import { BarraimgComponent } from 'src/app/shared/barraimg/barraimg.component';

@Component({
  selector: 'app-PRO02209',
  templateUrl: './PRO02209.component.html',
  styleUrls: ['./PRO02209.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxDropDownBoxModule, 
            DxButtonModule, XcComboGridComponent, RouterLink, BarraimgComponent]
})
export class PRO02209Component implements OnInit {

  @ViewChild("gridDoc", { static: false }) griDDocumentacion: DxDataGridComponent;

  // Variables fijas de la aplicación
  subscription: Subscription;
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  editorProducto: any;
  
  private eventsSubscription: Subscription;
  eventsSubjectGrid: Subject<any> = new Subject<any>();
  
  // Variables de datos
  DDocumentacion: clsDocumentacion[] = [];
  DListaTipoDoc: any[] = [];
  data_prev: any [] = [];

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  filasSelectData: any[] = [];
  esVisibleSelecc: string = 'none';  
  visibleGrupoUN: boolean = true;
  archivoDoc: any;
  base64DataFile: any;

  gridBoxProKit: any[] = [];
  isGridBoxOpenedProKit: boolean;
  focusedRowIndex: number;
  focusedRowKey: string;
  dropDownOptions = { width: 700, height: 400 };
  lblItem: string;
  indAsoArchivo: boolean = false;
  filaDatosEdit: any;

  @Input() events: Observable<any>;

  @Output() retDocumentacion = new EventEmitter<any>;

  // notificaciones
  toaVisible: boolean;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';

  constructor(private _sdatos: PRO007Service) {

    // Recibe de productos
    this.editorProducto = {
      itemTemplate: "lookupCodAtr",
      fieldTemplate: "lookupCodAtrField"
    };

    this.onRowValidating = this.onRowValidating.bind(this);
    this.fileChangeEvent = this.fileChangeEvent.bind(this);
    this.insertedRow = this.insertedRow.bind(this);
    
  }

  // Llama a Acciones del componente
  operCompo(operMenu: any): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.opBlanquearForma();
        if (operMenu.esEdicion !== '' || operMenu.esEdicion !== null || operMenu.esEdicion !== undefined ) this.esEdicion = operMenu.esEdicion;
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.esEdicion = true;
        this.esVisibleSelecc = 'always';
        this.rowNew = true;
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.mnuAccion = "update";
        this.esEdicion = true;
        this.esVisibleSelecc = 'always';
        this.opPrepararModificar();
        break;

      case "r_guardar":
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case "r_buscar":
        this.opPrepararBuscar('');
        break;

      case "r_buscar_ejec":
        this.opBlanquearForma();
        this.opPrepararBuscar('');
        break;

      case "r_eliminar":
        this.opEliminar();
        break;

      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
        if (operMenu.datos) // Si es solo referescar, no recarga datos
          this.DDocumentacion = operMenu.datos;
        else
          this.opIrARegistro(operMenu.accion);
        this.esVisibleSelecc = 'none';
        this.esEdicion = false;
        // this.griDDocumentacion.instance.repaint();
        break;

      case "r_refrescar":
        this.valoresObjetos('bodegas');
        break;

      case "r_cancelar":
        this.esEdicion = false;
        this._sdatos.M_esEdicionDocum = false;
        break;

      default:
        break;
    }
  }

  opPrepararNuevo() {
    this.esEdicion = true;
    this.opBlanquearForma();
  }
  opPrepararModificar() {
    this.data_prev = this.DDocumentacion;
  }
  opPrepararGuardar(accion) {}
  opBlanquearForma() {
    this.DDocumentacion = [];
    this._sdatos.D_Documentacion = [];
    this._sdatos.M_esEdicionDocum = false;
  }
  opPrepararBuscar(oper) {}
  opEliminar() {}

  opIrARegistro(acc) {
    this.valoresObjetos('consulta documentacion')
  }
  opVista() {}

  onInitNewRow(e) {
    e.data.DOCUMENTO = '';
    e.data.PDF = '';
    e.data.FECHA = new Date();
    e.data.base64Data = '';
    this.filaDatosEdit = undefined;
    if (this.DDocumentacion.length > 0) {
      const item = this.DDocumentacion.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    this.archivoDoc = '';
    e.data.isEdit = false;
    this._sdatos.M_esEdicionDocum = true;

  }
  insertedRow(e) {
    // Copia al servicio
    this._sdatos.D_Documentacion = this.DDocumentacion;
    this._sdatos.M_esEdicionDocum = true;
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
  }
  insertingRow(e) {
    e.data.isEdit = true;
    e.data.base64Data = this.filaDatosEdit.data.base64Data;
    e.data.ARCHIVO = this.filaDatosEdit.data.ARCHIVO;
  }
  updatedRow(e) {
    // Copia al servicio
    this._sdatos.D_Documentacion = this.DDocumentacion;
    this._sdatos.M_esEdicionDocum = true;
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
  }
  updatingRow(e:any) {
    e.data.isEdit = true;
    e.data.base64Data = this.filaDatosEdit.data.base64Data;
    e.data.ARCHIVO = this.filaDatosEdit.data.ARCHIVO;
  }
  onRowPrepared(e:any) {
    if (e.rowType === "data") {
      if (e.data.isEdit) {
				// e.rowElement.style.backgroundColor = 'lightyellow';
				const className:string = e.rowElement.className;
				e.rowElement.className = className +' row-modified-focused';
			}
    }
  }
  onCellPrepared(e:any) {
    if (e.rowType == "data") {
      if (e.data.DOCUMENTO) {
        // const checkBox = e.cellElement.querySelector(".dx-select-checkbox");
        // if((checkBox !== null) && (checkBox !== undefined) && (checkBox !== '')) {
        //   checkBox.style.display = "none";
        // }
      }
    }
  }
  onContentReady(e) {  
		e.component.columnOption("command:edit", "visible", false);  
	}

  removedRow(e:any) {
    // Copia al servicio
  }
  onRowValidating(e: any) {
    // Valida completitud
    if (e.newData.DOCUMENTO === '') {
      e.isValid = false;
      showToast('Faltan completar datos del documento', 'warning');
      return;
    }
  }

  onToolbarPreparingGrid(e: any) {
    let toolbarItems = e.toolbarOptions.items;  
    e.toolbarOptions.items.unshift(
      {
        location: 'before',
        template: 'titGrid'
      }
    );
  }

  // Dropdown 
  onSelectionChangedBod(e:any, cellInfo:any, datacompo:any) {
    if (e.data){
      cellInfo.data.DOCUMENTO = e.data.DOCUMENTO;
      cellInfo.data.PDF = e.data.PDF;
      cellInfo.row.data.ID_UN_ASOCIADA = e.data.ID_UN_ASOCIADA;
      cellInfo.row.data.NOMBRE_UN = e.data.NOMBRE_UN;
      this.griDDocumentacion.instance.cellValue(cellInfo.rowIndex, "DESCRIPCION", cellInfo.data.PDF);
      datacompo.close();
    }
  } 

  // Recibe los datos de la grid
  onRespuestaSelecc(e: any) {
    if (e.accion === 'aceptar') {
      this.DDocumentacion = e.rowsSelected;
      for (var i = 0; i < e.rowsSelected.length; i++) {
        this.DDocumentacion[i].ITEM = i+1;
        // this.DDocumentacion[i].FECHA = '';
      }
      this._sdatos.D_Documentacion = this.DDocumentacion;
      this._sdatos.conCambios = this._sdatos.conCambios + 1;
    }
  }
  
  
  // Operaciones de grid
  operGrid(e, operacion) {
    // Valida que haya informacion de producto principal
    if (this._sdatos.PRODUCTO === '') {
      this.showModal('No se ha introducido ningún código de producto principal!');
      return;
    }

    switch (operacion) {
      case 'new':
        this.griDDocumentacion.instance.addRow();
        this._sdatos.M_esEdicionDocum = true;
        this.rowApplyChanges = true;
        break;

      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        break;

      case 'save':
        this.griDDocumentacion.instance.saveEditData();
        this.rowApplyChanges = false;
        this._sdatos.M_esEdicionDocum = false;
        this.rowNew = true;
        this._sdatos.conCambios = this._sdatos.conCambios + 1;
        this.esVisibleSelecc = 'always';
        break;

      case 'cancel':
        this.griDDocumentacion.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        this._sdatos.M_esEdicionDocum = false;
        this._sdatos.conCambios = this._sdatos.conCambios - 1;
        this.esVisibleSelecc = 'always';
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
            this.filasSelectData.forEach((ele:any) => {
              if (ele.DOCUMENTO) {
                const index = this.DDocumentacion.findIndex(a => a.ITEM === ele.ITEM);
                this.DDocumentacion.splice(index, 1);
              }
            });
            this.griDDocumentacion.instance.refresh();
            this.filasSelecc = [];
            this.filasSelectData = [];
            this.rowDelete = false;
            this._sdatos.D_Documentacion = this.DDocumentacion;
            this._sdatos.conCambios = this._sdatos.conCambios + 1;
          }
        });
        this._sdatos.M_esEdicionDocum = false;
        break;

      default:
        break;
    }
  }

  onEditingStart(e:any) {
    this.esVisibleSelecc = 'none';
    this.filaDatosEdit = e;
    this.rowApplyChanges = true;
  }
  onSeleccValAtr(e:any) {
  }
  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
    this.filasSelectData = e.selectedRowsData;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  // Abrir archivo
  onClickAbrir(archPDF, cellInfo) {
    // Si está en modo visualizacion, asigna fila de datos
    if (cellInfo !== undefined)
      this.filaDatosEdit = cellInfo;

    // Tipos de archivos
    const signatures = {
      JVBERi0: "application/pdf",
      R0lGODdh: "image/gif",
      R0lGODlh: "image/gif",
      iVBORw0KGgo: "image/png",
      TU0AK: "image/tiff",
      "/9j/": "image/jpg",
      UEs: "application/vnd.openxmlformats-officedocument.",
      PK: "application/zip",
    };
    var fileType = '';
    for (var s in signatures) {
      if (this.filaDatosEdit.data.base64Data.indexOf(s) !== -1) {
        fileType = signatures[s];
        // return
        break;
      }
    }
    if (fileType.match('image')) {
      var image = new Image();
      image.src = this.filaDatosEdit.data.base64Data;
      var w = window.open("");
      w?.document.write("<style>img{max-width: 75%;}</style>", image.outerHTML);
    }
    if (fileType.match('pdf')) {
      let pdfWindow = window.open("");
      pdfWindow?.document.write("<iframe width='100%' height='100%' src='" + this.filaDatosEdit.data.base64Data +"#view=FitH'></iframe>");
    }

  }

  // Cargar archivo
  onClickCargar(archPDF) {
    this.operArcImg('cargar', archPDF);
  }

  // Llama al cargue del archivo
  datArchivo: any;
  operArcImg(operArch, archivo) {

    // Operación de cargue de archivo
    if(operArch.match('cargar|icon-upload-file-sl')) {
      let input = document.createElement('input');
      this.datArchivo = archivo;
      input.type = 'file';
      input.accept="image/*,video/*,.pdf,.csv";
      /*input.onchange = (e) => {
        this.fileChangeEvent(e, producto);    
      }*/
      this.indAsoArchivo = false;
      input.addEventListener("change", (e) => {
        if (!this.indAsoArchivo) this.fileChangeEvent(e, this.datArchivo);
      });
      if (!this.indAsoArchivo) input.click();
    }
  }

  imageError: string = '';
  tamArchivoImg: any;
  imgBase64zip: any;
  fileChangeEvent(fileInput: any, archivo: any) {
    const signatures = {
      JVBERi0: "application/pdf",
      R0lGODdh: "image/gif",
      R0lGODlh: "image/gif",
      iVBORw0KGgo: "image/png",
      TU0AK: "image/tiff",
      "/9j/": "image/jpg",
      UEs: "application/vnd.openxmlformats-officedocument.",
      PK: "application/zip",
    };
    this.imageError = '';
    this.indAsoArchivo = true;
    const larch = fileInput.target.files[0].name;
    archivo.data.ARCHIVO = larch;
    this.archivoDoc = larch;
    if (fileInput.target.files && fileInput.target.files[0]) {
      // Size Filter Bytes
      const max_size = 100000;
      const allowed_types = ['image/png', 'image/jpeg', 'image/jpeg', 'application/pdf'];
      const max_height = 15200;
      const max_width = 25600;

      /*if (fileInput.target.files[0].size > max_size) {
        this.imageError = 'El máximo tamaño no debe supearar los 1.000.000 Kbytes ó ' + max_size / 1000000 + 'Mb';
        this.showModal(this.imageError);
        return false;
      }*/
      this.tamArchivoImg = fileInput.target.files[0].size;

      /*if (!_.includes(allowed_types, fileInput.target.files[0].type)) {
        this.imageError = 'Only Images are allowed ( JPG | PNG )';
        return false;
      }*/
      var fileType = '';
      const reader = new FileReader();
      reader.onload = (e: any) => {
        for (var s in signatures) {
          if (e.target.result.indexOf(s) !== 0) {
            var fileType = signatures[s];
            // return
            break;
          }
        }
        this.base64DataFile = e.target.result;
        archivo.data.base64Data = e.target.result;
        this.filaDatosEdit = archivo;
        if (fileType.match('image')) {
          const image = new Image();
          image.src = e.target.result;
          image.onload = async (rs:any) => {
            const img_height = rs.currentTarget['height'];
            const img_width = rs.currentTarget['width'];

            if (img_height > max_height && img_width > max_width) {
              this.imageError =
                'Máximas dimensiones permitidas: ' +
                max_height +
                '*' +
                max_width +
                'px';
              this.showModal(this.imageError);
              return false;
            } else {
              // Guarda archivo en la url
              const ext = larch.substring(larch.lastIndexOf(".")+1);
              var imgBase64Path = e.target.result;

              // Redimensionar tamaño si supera determinado tamaño
              if (this.tamArchivoImg > 10000) {
                // await this.compressImage(imgBase64Path, 200, 200, img_width, img_height).then(compressed => {
                //   imgBase64Path = compressed;
                // })
              }

              // this.usuarioImg = imgBase64Path;

              return true;
            }
          };
        }
      };

      if (this.imageError === '')
        reader.readAsDataURL(fileInput.target.files[0]);
      return true;
    } else {
      return false;
    }
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, operacion = ''){
    if (obj === 'tipos documentos' || obj === 'todos') {
      const prm = { FILTRO: '' };
      this._sdatos.consulta('TIPOS DOCUMENTOS',prm,'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        const mensaje = res[0].ErrMensaje;
				if (mensaje !== '') {
          showToast(mensaje, 'error');
          this.DListaTipoDoc = [];
        } else {
          for (let i = 0; i < res.length; i++) {
            res[i].ITEM = i;
          }
          this.DListaTipoDoc = res;
        }
      });
    }
    if (obj === 'consulta documentacion') {
      const prm = { PRODUCTO: this._sdatos.PRODUCTO };
      this._sdatos.consulta('consulta documentacion',prm,'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        };
        const mensaje = res[0].ErrMensaje;
        if(mensaje !== '') {
				  if (!mensaje.match('No hay documentos para el Producto'))
            showToast(mensaje, 'error');
          this.DDocumentacion = [];
          this._sdatos.D_Documentacion = this.DDocumentacion;
        } else {
          this.DDocumentacion = res;
          this._sdatos.D_Documentacion = this.DDocumentacion;
        }
      });
    }
  }

  ngOnInit(): void {
    this.valoresObjetos('tipos documentos');
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      if (datos.accion) {
        this.operCompo(datos);
      }
      // setTimeout(() => {
      //   this.eventsSubjectGrid.next(datos);
      // }, 300);
    });

  }
  ngAfterViewInit() {
	}
  ngOnDestroy() {
  }

  showModal(mensaje, titulo = '¡Error!', msg_html= '') {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
      title: titulo,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: "center",
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }
}
