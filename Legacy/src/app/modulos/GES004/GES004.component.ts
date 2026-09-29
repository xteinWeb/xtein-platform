import { Component, ViewChild } from '@angular/core';
import {
  DxButtonModule, DxDataGridComponent, DxDataGridModule, DxTabsModule
} from 'devextreme-angular';
import { Subject, Subscription } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import Swal from 'sweetalert2';
import notify from 'devextreme/ui/notify';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { CommonModule } from '@angular/common';
import { GES004Service } from 'src/app/services/GES004/GES004.service';
import { BarraimgComponent } from 'src/app/shared/barraimg/barraimg.component';
import { showToast } from '../../shared/toast/toastComponent.js'
import { MatTabsModule } from '@angular/material/tabs';
import { GES00401Component } from './GES00401/GES00401.component';

@Component({
  selector: 'app-GES004',
  templateUrl: './GES004.component.html',
  styleUrls: ['./GES004.component.css'],
  standalone: true,
  imports: [DxDataGridModule, DxButtonModule, CommonModule, BarraimgComponent, MatTabsModule, DxTabsModule, GES00401Component]
})
export class GES004Component {
  @ViewChild("gusu_gestor", { static: false }) gridUsuGestor: DxDataGridComponent;

  // Variables fijas de la aplicación
  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  eventsBarraImg: Subject<any> = new Subject<any>();
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = true;
  esEdicion: boolean = false;
  esEdicionFila: boolean = false;
  indAsoArchImg: boolean = false;

  // Variables de datos
  treeSecciones: any;
  DUsuariosGestor: any[];
  data_prev: any = [];
  colCountByScreen: object;
  DClaseAtr: any;
  imageAtributo: string = '';
  valItemCargo: number;
  keyItemGrid: number;

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esVisibleSelecc: string = 'none';
  filaDatosEdit: any;
  filaDatosEditOld: any;
  modoImagen: boolean = false;
  altoFilaDatos: string[] = ["10px"];
  seleccDelete: boolean[] = [false];
  modoSeleccDelete: boolean = false;
  usuarioEdicion: string;
  usuarioImg: string;

  // notificaciones
  toaVisible: boolean;
  type = 'info'
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';


  tabsUsuarioGestor: any = [
    {
      ID: 0,
      text: 'Usuarios',
      icon: 'user',
      content: true,
    },
    {
      id: 1,
      text: 'Grupos',
      icon: 'group',
      content: false,
    },
  ];
  constructor(
    private _sdatos: GES004Service,
    private _sbarreg: SbarraService,
    private tabService: TabService
  ) {

    // Servicio de barra de registro
    this.subscription = this._sbarreg
      .getObsRegApl()
      .subscribe((datreg) => {
        // Valida si la petición es para esta aplicacion
        if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });

  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        const user: any = localStorage.getItem("usuario");
        this.prmUsrAplBarReg = {
          tabla: "USUARIOS_GESTOR",
          aplicacion: "GES-004",
          usuario: user,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_nuevo: false, r_modificar: true, r_buscar: false }
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.readOnly = false;
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.mnuAccion = "update";
        this.readOnly = false;
        this.opPrepararModificar();
        break;

      case "r_guardar":
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case "r_copiar":
        Swal.fire({
          title: '',
          text: 'Para copiar este Registro recuerde: debe agregar un nuevo Código y Nombre.',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: false,
          confirmButtonColor: '#DF3E3E',
          confirmButtonText: 'Aceptar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.mnuAccion = "new";
            this.readOnly = false;
            this.opPrepararModificar();
          }
        });
        break;

      case "r_buscar":
        break;

      case "r_buscar_ejec":
        break;

      case "r_eliminar":
        break;

      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
        this.esVisibleSelecc = 'none';
        break;

      case "r_cancelar":
        Swal.fire({
          title: '',
          text: '¿Desea cancelar la operación?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              accion: 'r_cancelar',
              operacion: { r_nuevo: false, r_modificar: true, r_buscar: false }
            }
            this.readOnly = true;
            this.esEdicion = false;
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.esVisibleSelecc = 'none';
            this.DUsuariosGestor.forEach(a => { a.modoEdicion = false; });
            this.seleccDelete = [false];
            this.esEdicionFila = false;
            this.rowApplyChanges = false;
            this.rowDelete = false;
            this.rowNew = false;
            this.rowSave = false;
            this.rowEdit = false;

            // Restituye los valores
            this.mnuAccion = "";
          }
        });

        break;

      case "r_vista":
        break;

      case 'r_refrescar':
        this.valoresObjetos('ref');
        break;

      case "r_imprimir":
        this.imprimirReporte(operMenu.operacion.id_reporte, operMenu.operacion.archivo, operMenu.operacion.data_rpt);
        break;

      case "r_configurar":
        break;

      default:
        break;
    }
  }

  // Llama a Acciones de registro

  opPrepararNuevo(): void {
    this.readOnly = false;
    this.esEdicion = true;
    this.esVisibleSelecc = 'none';
    this.seleccDelete = [false];
    this.esEdicionFila = false;
    this.rowApplyChanges = false;
    this.rowDelete = false;
    this.rowNew = true;
    this.rowSave = false;
    this.rowEdit = false;

    this.opBlanquearForma();
  }
  opBlanquearForma(): void {
    this.DUsuariosGestor.splice(0, this.DUsuariosGestor.length)
  }

  opPrepararModificar(): void {
    this.readOnly = false;
    this.esEdicion = true;
    this.esVisibleSelecc = 'none';
    this.rowApplyChanges = false;
    this.rowDelete = false;
    this.rowNew = true;
    this.rowSave = false;
    this.rowEdit = false;
    this.esEdicionFila = false;
    this.unseleccBorrar('edit');

  }
  opPrepararGuardar(accion: string): void {
    if (this.esEdicionFila) {
      showToast('Hay cambios en datos de Usuarios responsables que no se han actualizado', 'error');
    } else {

      // Acción validación de datos
      if (!this.ValidaDatos("requerido")) {
        return;
      }
      const prmDatosGuardar = this.DUsuariosGestor;

      // API guardado de datos
      this._sdatos
        .save(accion, prmDatosGuardar)
        .subscribe(
          {
            next: (data) => {
              const res = JSON.parse(data.data);
              if ((data.token != undefined)) {
                const refreshToken = data.token;
                localStorage.setItem("token", refreshToken);
              }
              if (res[0].ErrMensaje !== "") {
                this.showModal(res[0].ErrMensaje);
              }
              else {
                this.readOnly = true;

                // Operaciones de barra
                this.prmUsrAplBarReg = {
                  ...this.prmUsrAplBarReg,
                  error: "",
                  accion: "r_ini",
                  operacion: { r_nuevo: false, r_modificar: true, r_buscar: false }
                };
                this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
                showToast('Registro actualizado', 'success');

                // Inicializacion objetos
                this.esEdicion = false;
                this.esVisibleSelecc = 'none';
                this.seleccDelete = [false];
                this.esEdicionFila = false;
                this.rowApplyChanges = false;
                this.rowDelete = false;
                this.rowNew = false;
                this.rowSave = false;
                this.rowEdit = false;
                this.DUsuariosGestor.forEach(a => { a.modoEdicion = false; });

              }

            },
            error: (e) => {
              this.showModal('Error al guardar Usuario de gestión: ' + e.error.message);
            }
          });

    }

  }

  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte, archivo, datosrpt) {

    let filtroRep = { FILTRO: '' };
    const prmLiq = {
      clid: localStorage.getItem('empresa'),
      usuario: localStorage.getItem('usuario'),
      idrpt: archivo,
      id_reporte,
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      filtro: filtroRep
    };

    // Si no existe, no está abierta entonces agrega Tab
    const listaTab = this.tabService.tabs.find(c => c.aplicacion === id_reporte);
    if (listaTab === undefined)
      GlobalVariables.listaAplicaciones.unshift({ aplicacion: id_reporte, barra: undefined, statusEdicion: '' });

    // Abre pestaña con nuevo reporte
    this.tabService.addTab(new Tab(VisorrepComponent,    // visor
      datosrpt.text,        // título
      { parent: "PrincipalComponent", args: prmLiq }, // parámetro: reporte,filtro
      id_reporte,           // código del reporte
      '',
      'reporte',
      true
    ));
  }

  ValidaDatos(Accion: string): boolean {
    if (Accion === "requerido") {

    }
    return true;
  }

  onInitNewRowPro(e: any) {
    if (this.DUsuariosGestor.length > 0) {
      const item = this.DUsuariosGestor.reduce((ant, act) => { return (ant.ITEM > act.ITEM) ? ant : act })
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    this.valItemCargo = e.data.ITEM;
    e.data.USUARIO = "";
    e.data.NOMBRE = "";
    e.data.PERFIL = "";
    e.data.PERMISOS = "";
    e.data.ESTADO = "ACTIVO";
    e.data.IMAGEN = '/assets/no-image.jpg';
    e.data.modoEdicion = true;
    e.data.verZoom = false;
    this.esEdicionFila = true;
    this.filaDatosEdit = undefined;
    this.esVisibleSelecc = 'none';
    this.unseleccBorrar('new');
    this.rowDelete = false;
    this.usuarioImg = '/assets/no-image.jpg';

    setTimeout(() => {
      this.eventsBarraImg.next({ accion: 'activar', docElem: document, target: 'imgUsuario', active: [true, true, false] });
    }, 300);

  }
  insertingRow(e: any) {
    if (e.data.USUARIO === '' || e.data.NOMBRE === '') {
      showToast('Falta completar datos de cargo o descripción', 'error');
    }
    else {
      if (!this.itemRepetido(e.data.USUARIO, this.valItemCargo)) {
        e.data.IMAGEN = this.usuarioImg;
        e.data.modoEdicion = false;
        this.esEdicionFila = false;
      }
      else {
        e.cancel = true;
      }
    }
  }
  insertedRow(e: any) {
    this.esVisibleSelecc = 'always';
    this.esEdicionFila = false;
    this.unseleccBorrar('update');
  }
  updatingRow(e: any) {
    if (e.newData) {
      if (e.newData.USUARIO) {
        if (this.itemRepetido(e.newData.USUARIO, e.oldData.ITEM)) {
          e.cancel = true;
        }
        else {
          e.newData.IMAGEN = this.usuarioImg;
          e.newData.esEdicion = false;
        }
      }
    }
    if (e.newData.IMAGEN) {
      e.newData.IMAGEN = this.usuarioImg;
      e.newData.esEdicion = false;
    }
  }
  updateRowPro(e: any) {
    this.esVisibleSelecc = 'always';
    this.esEdicionFila = false;
    this.unseleccBorrar('update');
  }
  onEditingStart(e: any) {
    this.eventsBarraImg.next({ accion: 'activar', docElem: document, target: 'imgUsuario', active: [true, true, false] });
  }
  onContentReady(e) {
    e.component.columnOption("command:edit", "visible", false);
  }
  startEdit(e) {
    if (this.esEdicion) {
      // Valida que haya informacion de producto principal
      if (e.rowType === "data" && !this.esEdicionFila) {
        e.component.editRow(e.rowIndex);
        e.data.modoEdicion = true;
        this.filaDatosEdit = e;
        this.esEdicionFila = true;
        this.usuarioImg = e.data.IMAGEN;
        this.rowApplyChanges = true;
        setTimeout(() => {
          this.eventsBarraImg.next({ accion: 'activar', docElem: document, target: 'imgUsuario', active: [true, true, false] });
        }, 300);

      }
    }
  }
  onSaving(e: any) {
    const rowIndex = this.filaDatosEdit.rowIndex;
    this.gridUsuGestor.instance.cellValue(rowIndex, 'IMAGEN', this.usuarioImg);
  }
  deleteRowPro(e: any) { }
  onRowValidating(e: any) { }

  // Valida si el atributo está repetido
  itemRepetido(dato, item): boolean {
    if (this.DUsuariosGestor.findIndex(a => a.USUARIO === dato && a.ITEM !== item) !== -1) {
      this.showModal('Atributo repetido!');
      return true;
    }
    else
      return false;
  }

  // Desmarcar para borrado
  unseleccBorrar(oper: any) {
    for (var k = 0; k <= this.DUsuariosGestor.length; k++) {
      if (oper !== 'new')
        if (this.DUsuariosGestor.length !== 0)
          this.seleccDelete[this.DUsuariosGestor[k === this.DUsuariosGestor.length ? k - 1 : k].ITEM] = false;
        else
          this.seleccDelete[k] = false;
    }
  }

  // Operaciones de actualización de fila
  actualizarFila(operacion, e) {
    this.rowApplyChanges = false;
    this.rowEdit = false;
    this.rowNew = true;
    this.esVisibleSelecc = 'always';
    this.esEdicionFila = false;

  }

  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  // Operaciones sobre la grid
  btnGuardar(e, datos, modo = '') {
    // Valida si no hay datos
    if (datos === undefined) {
      this.showModal('Valores nulos de usuario o nombre');
      return;
    }

    // Datos digitados
    let rowIndex = datos.rowIndex;
    const v_llave = datos.USUARIO;

    // Valida repetido
    if (this.itemRepetido(v_llave, this.keyItemGrid)) return;

    // Valida...
    if (v_llave === '') {
      this.showModal('Valor nulo en usuarios');
      return;
    }
    this.esEdicionFila = false;
    this.rowApplyChanges = false;
    if (modo === '')
      this.gridUsuGestor.instance.saveEditData();
  }

  // Operaciones de grid
  operGrid(e, operacion) {

    // Operaciones de barra
    switch (operacion) {
      case 'new':
        if (this.ValidaDatos('requerido')) {
          if (this.esEdicionFila) this.btnGuardar(e, this.keyItemGrid)
          setTimeout(() => {
            this.gridUsuGestor.instance.addRow();
          }, 100);
        }
        this.rowApplyChanges = true;
        this.esVisibleSelecc = 'none';
        this.esEdicionFila = true;
        this.rowDelete = false;
        this.gridUsuGestor.instance.deselectAll();
        this.filasSelecc = [];
        break;
      case 'edit':
        const rowindex = this.gridUsuGestor.instance.getSelectedRowKeys()[0];
        this.gridUsuGestor.instance.editRow(rowindex);
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this.rowNew = false;
        this.esVisibleSelecc = 'none';
        this.esEdicionFila = true;
        this.gridUsuGestor.instance.deselectAll();
        this.filasSelecc = [];
        break;
      case 'save':
        // this.gridUsuGestor.instance.cellValue(this.filaDatosEdit.rowIndex, 'IMAGEN', this.usuarioImg);
        this.gridUsuGestor.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowEdit = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        this.esEdicionFila = false;
        // this.eventsBarraImg.next({ accion: 'inactivar', docElem: document });
        break;
      case 'cancel':
        this.gridUsuGestor.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.rowEdit = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        this.esEdicionFila = false;
        // this.eventsBarraImg.next({ accion: 'inactivar', docElem: document });
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
              const index = this.DUsuariosGestor.findIndex(a => a.ITEM === key);
              this.DUsuariosGestor.splice(index, 1);
            });
            this.gridUsuGestor.instance.refresh();
            this.esVisibleSelecc = 'always';
            this.actualizarFila('delete', this.DUsuariosGestor);
            this.gridUsuGestor.instance.deselectAll();
            this.filasSelecc = [];
            // this.eventsBarraImg.next({ accion: 'inactivar', docElem: document });
          }
        });
        break;

      default:
        break;
    }
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string) {
    if (obj == 'consulta' || obj == 'todos') {
      const prm = {};
      this._sdatos.consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DUsuariosGestor = res;
      });
    }

  }

  ngOnInit(): void {
    const user: any = localStorage.getItem("usuario");
    this.prmUsrAplBarReg = {
      tabla: "USUARIOS_GESTOR",
      aplicacion: "GES-004",
      usuario: user,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: {}
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this.readOnly = true;

    // Inicializacion de items
    this.DUsuariosGestor = [];

    // Ini
    this.valoresObjetos('consulta');

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  showModal(mensaje, titulo = '¡Error!', msg_html = '') {
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

  showToast(message: any, type: any, offset: any) {
    const container: any = document.getElementById('router-container');
    notify({
      message: message,
      width: 300,
      position: {
        at: 'top right',
        my: 'top right',
        of: container,
        offset: offset
      },
      animation: {
        show: { type: 'fade', duration: 400, from: 0, to: 1 },
        hide: { type: 'fade', duration: 40, to: 0 }
      },
    },
      type, 4500);
  }

  // Cargar imagenes
  imagenClick(operacion, codUsuario) {
    // Valida si hay producto 
    if (codUsuario === '') {
      this.showModal('Debe tener asignado un usuario!', 'Código inválido');
    }
    else {
      switch (operacion) {
        case 'icon-upload-file-sl':
          this.operArcImg(operacion, codUsuario);
          break;

        case 'icon-eliminar-sl':
          if (this.usuarioImg === '/assets/no-image.jpg') {
            this.showModal('No hay imagenes para eliminar', 'Sin imagenes');
            return;
          }
          Swal.fire({
            title: '',
            text: '¿Desea eliminar la imagen actual?',
            iconHtml: "<i class='icon-alert-ol'></i>",
            showCancelButton: true,
            confirmButtonColor: '#DF3E3E',
            cancelButtonColor: '#438ef1',
            cancelButtonText: 'No',
            confirmButtonText: 'Sí, eliminar'
          }).then((result) => {
            if (result.isConfirmed) {
              this.usuarioImg === '/assets/no-image.jpg';
            }
          });
          break;

        default:
          break;
      }

    }
  }

  // Llama al cargue del archivo
  datAtr: any;
  operArcImg(operArch, usuario) {
    // Operación de cargue de archivo
    if (operArch.match('cargar|icon-upload-file-sl')) {
      let input = document.createElement('input');
      input.type = 'file';
      input.accept = "image/*";
      /*input.onchange = (e) => {
        this.fileChangeEvent(e, producto);    
      }*/
      this.indAsoArchImg = false;
      input.addEventListener("change", (e) => {
        if (!this.indAsoArchImg) this.fileChangeEvent(e, usuario);
      });
      if (!this.indAsoArchImg) input.click();
    }
    //Elimina archivo
    else {
      this.imageAtributo = "/assets/no-image.jpg";
    }
  }

  imageError: string = '';
  tamArchivoImg: any;
  imgBase64zip: any;
  async fileChangeEvent(fileInput: any, usuario: any) {
    this.imageError = '';
    this.indAsoArchImg = true;
    const larch = fileInput.target.files[0].name;
    if (fileInput.target.files && fileInput.target.files[0]) {
      // Size Filter Bytes
      const max_size = 100000;
      const allowed_types = ['image/png', 'image/jpeg'];
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
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const image = new Image();
        image.src = e.target.result;
        image.onload = async (rs: any) => {
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
            const ext = larch.substring(larch.lastIndexOf(".") + 1);
            var imgBase64Path = e.target.result;

            // Redimensionar tamaño si supera determinado tamaño
            if (this.tamArchivoImg > 10000) {
              await this.compressImage(imgBase64Path, 200, 200, img_width, img_height).then(compressed => {
                imgBase64Path = compressed;
              })
            }

            this.usuarioImg = imgBase64Path;

            return true;
          }
        };
      };

      if (this.imageError === '')
        reader.readAsDataURL(fileInput.target.files[0]);
      return true;
    } else {
      return false;
    }
  }
  compressImage(src: any, newX: any, newY: any, src_w: any, src_h: any) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.src = src;
      img.onload = rs => {
        const elem = document.createElement('canvas');
        var ratio = Math.min(newX / src_w, newY / src_h);
        elem.width = src_w * ratio;  // newX
        elem.height = src_h * ratio;  // newY
        const ctx: any = elem.getContext('2d');
        ctx.drawImage(img, 0, 0, src_w * ratio, src_h * ratio);   //, newX, newY);
        const data = elem.toDataURL();
        res(data);
      }
      img.onerror = error => rej(error);
    })
  }

  onTabChanged(e: any) {
    switch (e.itemIndex) {
      case 0:
        this.tabsUsuarioGestor[0].content = true;
        this.tabsUsuarioGestor[1].content = false;
        
        break;
        case 1:
          this.tabsUsuarioGestor[0].content = false;
          this.tabsUsuarioGestor[1].content = true;
        break;
      default:
        break;
    }
  }

}
