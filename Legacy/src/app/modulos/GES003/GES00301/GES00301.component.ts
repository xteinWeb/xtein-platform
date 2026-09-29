import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { DxButtonModule, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxSelectBoxModule, DxTagBoxModule, DxTextBoxModule, DxTreeListComponent, DxTreeListModule } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { clsCargos } from '../clsGES003.class';
import { GES003Service } from 'src/app/services/GES003/GES003.service';
import { GES00Service } from 'src/app/shared/Tareas/Service/GES00.service';
import Swal from 'sweetalert2';
import notify from 'devextreme/ui/notify';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { showToast } from '../../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-ges00301',
  templateUrl: './GES00301.component.html',
  styleUrls: ['./GES00301.component.css'],
  standalone: true,
  imports: [MatTabsModule, DxButtonModule, CommonModule, DxTreeListModule, DxSelectBoxModule,
    DxDropDownBoxModule, DxTagBoxModule, DxFormModule, DxTextBoxModule
  ]
})
export class GES00301Component {

  @ViewChild("formCargos", { static: false }) formCargos: DxFormComponent;

  @Input() APLICACION: string;
  @Input() Datos: clsCargos;
  @Input() readOnly: boolean;

  // Variables fijas de la aplicación
  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  subs_tareas: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string;
  VDatosReg: any;
  loadingVisible: boolean = false;

  // Variables de datos
  FCargos: clsCargos;
  treeSecciones: any;
  DCargos: any[];
  DResponsables: any[];
  data_prev: any= [];
  treeBoxCargo: any[] = [];
  gridBoxResponsables: any[] = [];
  DActividadesCargo: any[] = [];
  isTreeBoxOpened: boolean;
  isGridBoxOpened: boolean;
  focusedRowIndex: number;
  conCambios: number = 0;
  focusedRowKey: string;
  colCountByScreen: object;
  QFiltro: any;
  DClaseAtr: any;
  imageAtributo: string = '';
  valItemCargo: number;
  keyItemGrid: number;
  openResponsables: boolean;
  dropDownOptions = { width: 600, 
                      height: 400, 
                      hideOnParentScroll: true,
                      container: '#router-container' };

  // Operaciones de grid
  esVisibleSelecc: string = 'none';
  filaDatosEdit: any;
  filaDatosEditOld: any;
  filaDatosSelecc: any;
  modoImagen: boolean = false;
  altoFilaDatos: string[] = ["10px"];
  seleccDelete: boolean[] = [false];
  modoSeleccDelete: boolean = false;
  responsablesCargos: any;

  targetIdTooltip: string;
  tooltipText: string;
  toolTipVisible: boolean = false;

  // notificaciones
  toaVisible: boolean;
  type = 'info'
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';

  constructor(
    private _sdatos: GES003Service,
    private Ges00Service: GES00Service
  ) {

    // this.subs_tareas= this.Ges00Service.getObsResponsabilidades().subscribe((data:any) => {
    //   switch (data.accion) {
    //     case 'cargar datos':
    //       this.loadData(data.Datos);
    //       break;
      
    //     default:
    //       break;
    //   }
    // });

    this.valoresObjetos = this.valoresObjetos.bind(this)
  }

  ngOnInit(): void {
    // Inicializacion de items
    this.FCargos = {
      ID_CARGO: '',
      CONSECUTIVO: 0,
      NOMBRE: '',
      DESCRIPCION: '',
      ESTADO: '',
      TIPO: '',
      RESPONSABLES: '',
      RESPONSABILIDADES: [],
      CONDICIONES: [],
    };
    this.mnuAccion = '';
    this.valoresObjetos('todos', '');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    // this.subs_tareas.unsubscribe();
  }

  getSizeQualifier(width:any) {
    if (width < 768)  return "xs";
    if (width < 992)  return "sm";
    if (width < 1366) return "md";
    return "lg";
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
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
          text: 'Para copiar este Registro recuerde: debe agregar un nuevo Nombre y Descripción.',
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

      
        case 'r_buscar':
        break;

      case 'r_buscar_ejec':
        break;

      case "r_eliminar":
        break;

        case "r_primero":
        case "r_anterior":
        case "r_siguiente":
        case "r_ultimo":
        case "r_numreg":
        break;

      case "r_cancelar":
        break;

      case "r_vista":
        break;

      case 'r_refrescar':
        this.valoresObjetos('ref');
        break;

      case "r_imprimir":
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
    this.esVisibleSelecc = 'none';
    this.seleccDelete = [false];

    this.opBlanquearForma();
  }
  opBlanquearForma(): void {
    this.DCargos.splice(0,this.DCargos.length)
  }

  opPrepararModificar(): void {
    this.readOnly = false;
    this.esVisibleSelecc = 'none';
  }

  opPrepararGuardar(accion: string): void {
    if (this.conCambios <= 0){
      showToast('No hay cambios por Guardar.', 'error');
    } else {
      // API guardado de datos
      const prm = { CARGO: this.FCargos };  
      this._sdatos
        .save(accion, prm)
        .subscribe((data) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== "") {
            this.showModal(res[0].ErrMensaje);
          } 
          else
          {
            this.readOnly = true;
            showToast('Registro actualizado!', 'success');
            // Inicializacion objetos
            this.esVisibleSelecc = 'none';
            this.seleccDelete = [false];
          }  

        });

    }

  }

  ValidaDatos(Accion: string): boolean {
    if (Accion === "requerido") {

    }
    return true;
  }

  toggleToolTip(item:any, cellInfo:any) {
    this.targetIdTooltip = '#USER-'+item.id+cellInfo.data.ITEM;
    this.toolTipVisible = !this.toolTipVisible;
    this.tooltipText = item.NOMBRE;
  }

  onInitializedFromResponsables(e:any, data:any) {
    for (let i = 0; i < data.length; i++) {
      const npos: any = data[i].NOMBRE.indexOf(" ");
      const name = data[i].NOMBRE.charAt(0).toUpperCase();
      const lastName = data[i].NOMBRE.substring(npos + 1, data[i].NOMBRE.length + 1);
      const Lape = lastName.charAt(0).toUpperCase();
      const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
      data[i].iconNameUser = newName;
    }
  }

  onSelectionCargo(e:any, dataCargo) {
    if(e.selectedRowKeys.length > 0) {
      dataCargo.data.ID_CARGO_SUPERIOR = e.selectedRowKeys[0];
      this.filaDatosEdit.data.ID_CARGO_SUPERIOR = e.selectedRowKeys[0];
      this.isTreeBoxOpened = false;
    }
  }
  onSelectionChangedResponsables(e:any, dataResp:any) {
    if(e.selectedRowKeys.length === 0) {
      this.gridBoxResponsables = [];
    } else {
      dataResp.data.RESPONSABLE = e.selectedRowKeys[0];
      const dat = this.DResponsables.filter(r => r.USUARIO === dataResp.data.RESPONSABLE);
      if (dat) dataResp.data.NOMBRE = dat[0].NOMBRE;
      this.isGridBoxOpened = false;
    }
  }

  onSelectionChangedResponsable(e:any, data:any) {
    if ((e.selectedItem !== null) && (e.selectedItem !== undefined) && (e.selectedItem.length > 0)) {
      if(data.COLABORADORES.length > 0) {
        if(data.COLABORADORES.findIndex((d:any) => d.ID_RESPONSABLE === e.value) === -1) {
          data.RESPONSABLES = e.value;
        } else {
          data.RESPONSABLES = '';
          showToast('El usuario seleccionado no puede ser RESPONSABLE Y COLABORADOR en la misma tarea.', 'error');
          return;
        }
      } else {
        data.RESPONSABLES = e.value;
      };
    };
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, prmObj: any = undefined){
    if (obj == 'responsables' || obj == 'todos' ) {
      const prm = { };
      this._sdatos.getResponsables('responsables',prm).subscribe((data: any)=> {
        const res = validatorRes(data);
        if ( (data.token !== undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if(res[0].RESPONSABLES[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
          return;
        }
        for (let i = 0; i < res[0].RESPONSABLES.length; i++) {
          const element = res[0].RESPONSABLES[i];
          element.ITEM = i;
        };
        for (let i = 0; i < res[0].RESPONSABLES.length; i++) {
          const npos: any = res[0].RESPONSABLES[i].NOMBRE.indexOf(" ");
          const name = res[0].RESPONSABLES[i].NOMBRE.charAt(0).toUpperCase();
          const lastName = res[0].RESPONSABLES[i].NOMBRE.substring(npos + 1, res[0].RESPONSABLES[i].NOMBRE.length + 1);
          const Lape = lastName.charAt(0).toUpperCase();
          const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
          res[0].RESPONSABLES[i].iconNameUser = newName;
        }
        this.DResponsables = res[0].RESPONSABLES;
      });
    }

  }

  showModal(mensaje:any, titulo = '¡Error!', msg_html= '') {
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

  showToast(message:any, type:any, offset:any) {
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
    type, 4500 );
  }

}
