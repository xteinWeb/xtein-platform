import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  DxButtonModule, DxCheckBoxModule, DxDataGridModule, DxDateBoxModule,
  DxDropDownBoxModule, DxFormModule, DxListModule, DxLoadPanelModule, DxNumberBoxModule,
  DxPopupModule, DxSelectBoxModule, DxTabsModule, DxToolbarModule, DxTooltipModule
} from 'devextreme-angular';
import { Observable, Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
// import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';
// import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import Swal from 'sweetalert2';
import { showToast } from '../../shared/toast/toastComponent';
import { validatorRes } from 'src/app/shared/validator/validator';
import { PRO029Service } from 'src/app/services/PRO029/PRO029.service';
import { PRO02901Component } from './PRO02901/PRO02901.component';
import { PRO02902Component } from './PRO02902/PRO02902.component';
import { PRO02903Component } from './PRO02903/PRO02903.component';
import { PRO02904Component } from './PRO02904/PRO02904.component';

@Component({
  selector: 'app-PRO029',
  templateUrl: './PRO029.component.html',
  styleUrls: ['./PRO029.component.css'],
  standalone: true,
  imports: [CommonModule, DxDateBoxModule, DxButtonModule, DxDataGridModule, DxNumberBoxModule, DxTooltipModule, DxPopupModule,
    DxLoadPanelModule, DxToolbarModule, DxCheckBoxModule, DxDropDownBoxModule,
    DxTabsModule, PRO02901Component, PRO02902Component, PRO02903Component, PRO02904Component, DxSelectBoxModule, DxFormModule, DxListModule
  ]
})
export class PRO029Component {

  eventsDatos01: Subject<any> = new Subject<any>();
  eventsDatos02: Subject<any> = new Subject<any>();
  eventsDatos03: Subject<any> = new Subject<any>();

  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  public _unsubscribeAll: Subject<any>;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();
  prmUsrAplBarReg: clsBarraRegistro;
  USUARIO_LOCAL: any = '';
  esVisibleSelecc: string = 'none';

  FFiltro: any;
  DPidos: any[] = [];
  DClientes: any[] = [];
  DProductos: any[] = [];
  DProductos_prev: any[] = [];
  DEstados: any[] = [];
  DAgenda: any[] = [];
  ATRIBUTOS_PMP: any[] = [];
  selectProductos: any[] = [];
  DataPopupProgramacion: any[] = [];
  templateGroup: any = ['PRODUCTO'];
  tituloPopupProgramacion: any = '';
  FECHA_PROGRAMADA: any = '';
  FECHA_ENTREGA: any = '';
  PEDIDO: any = '';
  CLIENTE: any = '';
  PRODUCTO: any = '';
  ESTADO: any = '';

  QFiltro: any;
  VDatosReg: any;
  mnuAccion: string;

  conCambios: number = 0;
  cambiosFiltro: number = 0;
  readOnly: boolean = false;
  popupVisibleProgramacion: boolean = false;
  loadingVisible: boolean = false;
  opendDrop: any = {
    PEDIDO: false,
    PRODUCTOS: false,
    CLIENTE: false
  };

  tabsAgenda: any = [
    { id: 0, text: 'Tabla', icon: 'icon-postit-ol', content: true },
    { ID: 1, text: 'DashBoard', icon: 'icon-matriz', content: false },
    { id: 2, text: 'Diagrama', icon: 'icon-tarea-sl', content: false },
    { id: 3, text: 'Gantt', icon: 'icon-grafico-mnl-ol', content: false }
  ]

  constructor(
    private sData: PRO029Service,
    private _sbarreg: SbarraService,
    private tabService: TabService,
    private _sfiltro: SfiltroService,
    private SVisor: SvisorService
  ) {

    this.subscription = this._sbarreg
      .getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((datreg) => {
        // Valida si la petición es para esta aplicacion
        if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });

    // Respuesta del filtro
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe(resp => {
      // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    });

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex((d: any) => d.ITEM === resp.ITEM);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    })

  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'AGENDA_PRODUCCION',
      aplicacion: 'PRO-029',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_imprimir: true, r_refrescar: true }
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.readOnly = true;
    this.mnuAccion = '';
    this.FFiltro = {
      FECHA_INICIO_PROGRAMADA: '',
      FECHA_FIN_PROGRAMADA: '',
      FECHA_ENTREGA_INICIO: '',
      FECHA_ENTREGA_FINAL: '',
      PEDIDO: [],
      CLIENTE: [],
      PRODUCTOS: [],
      ESTADO: ''
    }
    this.eventsDatos02.next({ accion: 'init', readOnly: this.readOnly, barra: this.prmUsrAplBarReg });
    this.valoresObjetos('todos', '');
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  onTabChanged(e: any) {
    switch (e.itemIndex) {
      case 0:
        this.tabsAgenda[0].content = true;
        this.tabsAgenda[1].content = false;
        this.tabsAgenda[2].content = false;
        this.tabsAgenda[3].content = false;
        if (this.DAgenda.length > 0) {
          setTimeout(() => {
            this.eventsDatos02.next({
              accion: 'Load Data', readOnly: this.readOnly, dataSource: this.DAgenda, consultado: this.DAgenda.length > 0 ? true : false,
              barra: this.prmUsrAplBarReg
            });
          }, 500);
        }
        break;

      case 1:
        this.tabsAgenda[0].content = false;
        this.tabsAgenda[1].content = true;
        this.tabsAgenda[2].content = false;
        this.tabsAgenda[3].content = false;
        if (this.DAgenda.length > 0) {
          setTimeout(() => {
            this.eventsDatos01.next({
              accion: 'Load Data', readOnly: this.readOnly, dataSource: this.DAgenda, consultado: this.DAgenda.length > 0 ? true : false,
              barra: this.prmUsrAplBarReg
            });
          }, 500);
        }
        break;

      case 2:
        this.tabsAgenda[0].content = false;
        this.tabsAgenda[1].content = false;
        this.tabsAgenda[2].content = true;
        this.tabsAgenda[3].content = false;
        setTimeout(() => {
          this.eventsDatos03.next({
            accion: 'Load Data', readOnly: this.readOnly, consultado: this.DAgenda.length > 0 ? true : false,
            barra: this.prmUsrAplBarReg
          });
        }, 500);
        break;
      case 3:
        this.tabsAgenda[0].content = false;
        this.tabsAgenda[1].content = false;
        this.tabsAgenda[3].content = false;
        this.tabsAgenda[3].content = true;
    
        break;

      default:
        break;
    }
  }

  onRespuestaComponent(datos: any, modulo: string) {
    switch (modulo) {
      case 'DASHBOARD':
        // this.valoresObjetos('actividad', e.data);
        break;

      case 'TABLA':
        this.valoresObjetos('consulta filtro', datos.filtro);
        break;

      case 'DIAGRAMA':
        this.filtrarDatosConsulta(datos);
        break;
      case 'GANTT':
        // this.filtrarDatosConsulta(datos);
        break;

      default:
        break;
    }
  }
  templateHtml(columna: any, element: any): any {
    let cad = [{ PRODUCTO: '', NOMBRE_PRODUCTO: '' }];
    let res: any = '';
    this.templateGroup.forEach((col: any) => {
      if (columna.row.data.items !== null) {
        cad[0].PRODUCTO = columna.row.data.items[0].PRODUCTO;
        cad[0].NOMBRE_PRODUCTO = columna.row.data.items[0].NOMBRE_PRODUCTO;
        switch (element) {
          case 'PRODUCTO':
            res = cad[0].PRODUCTO;
            break;
          case 'NOMBRE_PRODUCTO':
            res = cad[0].NOMBRE_PRODUCTO;
            break;
          default:
            break;
        }
      }
      if (columna.row.data.collapsedItems !== undefined) {
        cad[0].PRODUCTO = columna.row.data.collapsedItems[0].PRODUCTO;
        cad[0].NOMBRE_PRODUCTO = columna.row.data.collapsedItems[0].NOMBRE_PRODUCTO;
        switch (element) {
          case 'PRODUCTO':
            res = cad[0].PRODUCTO;
            break;
          case 'NOMBRE_PRODUCTO':
            res = cad[0].NOMBRE_PRODUCTO;
            break;
          default:
            break;
        }
      }
    });
    return res;
  }

  onValueChanged(e: any, dataField: string) {
    switch (dataField) {
      case 'FECHA_ENTREGA_INICIO':
        if (e.value !== null && e.value !== undefined && e.value !== '')
          this.FFiltro.FECHA_ENTREGA_INICIO = e.value;
        else
          this.FFiltro.FECHA_ENTREGA_INICIO = '';
        break;
      case 'FECHA_ENTREGA_FINAL':
        if (e.value !== null && e.value !== undefined && e.value !== '')
          this.FFiltro.FECHA_ENTREGA_FINAL = e.value;
        else
          this.FFiltro.FECHA_ENTREGA_FINAL = '';
        break;
      case 'FECHA_INICIO_PROGRAMADA':
        if (e.value !== null && e.value !== undefined && e.value !== '')
          this.FFiltro.FECHA_INICIO_PROGRAMADA = e.value;
        else
          this.FFiltro.FECHA_INICIO_PROGRAMADA = '';
        break;
      case 'FECHA_FIN_PROGRAMADA':
        if (e.value !== null && e.value !== undefined && e.value !== '')
          this.FFiltro.FECHA_FIN_PROGRAMADA = e.value;
        else
          this.FFiltro.FECHA_FIN_PROGRAMADA = '';
        break;
      case 'PEDIDO':
        if (e.value !== null && e.value !== undefined && e.value.length > 0) {
          var newArray: any = [];
          this.DProductos = [];
          for (let i = 0; i < e.value.length; i++) {
            const id: any = e.value[i];
            const npos: any = this.DPidos.findIndex((e: any) => e.DOCUMENTO_PEDIDO === id);
            const element = this.DPidos[npos].PRODUCTOS;
            element.forEach((ele: any) => {
              const pos: any = newArray.findIndex((e: any) => e.PRODUCTO === ele.PRODUCTO);
              if (pos === -1)
                newArray.push(ele);
            });
          }
          this.DProductos = newArray;
        } else {
          this.FFiltro.PEDIDO = [];
          this.DProductos = this.DProductos_prev;
        }
        break;
      case 'CLIENTE':
        if (e.value !== null && e.value !== undefined && e.value.length > 0)
          this.FFiltro.CLIENTE = e.value;
        else
          this.FFiltro.CLIENTE = [];
        break;
      case 'PRODUCTO':
        if (e.value !== null && e.value !== undefined && e.value.length > 0)
          this.FFiltro.PRODUCTOS = e.value;
        else
          this.FFiltro.PRODUCTOS = [];
        break;
      case 'ESTADO':
        if (e.value !== null && e.value !== undefined && e.value !== '')
          this.FFiltro.ESTADO = e.value;
        else
          this.FFiltro.ESTADO = '';
        break;

      default:
        break;
    }

    this.validarDatosFormulario();
  }

  aceptarBottom(e: any, btn: any) {
    switch (btn) {
      case 'PEDIDO':
        this.opendDrop.PEDIDO = false;
        break;
      case 'PRODUCTO':
        this.opendDrop.PRODUCTOS = false;
        break;
      case 'CLIENTE':
        this.opendDrop.CLIENTE = false;
        break;

      default:
        break;
    }
  }

  validarDatosFormulario() {
    if (((this.FFiltro.FECHA_ENTREGA_INICIO !== null && this.FFiltro.FECHA_ENTREGA_INICIO !== undefined && this.FFiltro.FECHA_ENTREGA_INICIO !== '') &&
      (this.FFiltro.FECHA_ENTREGA_FINAL !== null && this.FFiltro.FECHA_ENTREGA_FINAL !== undefined && this.FFiltro.FECHA_ENTREGA_FINAL !== '')) ||
      ((this.FFiltro.FECHA_INICIO_PROGRAMADA !== null && this.FFiltro.FECHA_INICIO_PROGRAMADA !== undefined && this.FFiltro.FECHA_INICIO_PROGRAMADA !== '') &&
        (this.FFiltro.FECHA_FIN_PROGRAMADA !== null && this.FFiltro.FECHA_FIN_PROGRAMADA !== undefined && this.FFiltro.FECHA_FIN_PROGRAMADA !== '')) ||
      (this.FFiltro.PEDIDO !== null && this.FFiltro.PEDIDO !== undefined && this.FFiltro.PEDIDO.length > 0) ||
      (this.FFiltro.CLIENTE !== null && this.FFiltro.CLIENTE !== undefined && this.FFiltro.CLIENTE.length > 0) ||
      (this.FFiltro.PRODUCTOS !== null && this.FFiltro.PRODUCTOS !== undefined && this.FFiltro.PRODUCTOS.length > 0) ||
      (this.FFiltro.ESTADO !== null && this.FFiltro.ESTADO !== undefined && this.FFiltro.ESTADO !== '')
    ) {
      this.cambiosFiltro++;
    } else {
      this.cambiosFiltro = 0;
    }
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          tabla: 'AGENDA_PRODUCCION',
          aplicacion: 'PRO-029',
          usuario: this.USUARIO_LOCAL,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_refrescar: true }
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.readOnly = false;
        // this.opPrepararNuevo();
        break;

      case "r_modificar":
        // this.opPrepararModificar();
        break;

      case "r_guardar":
        // this.opPrepararGuardar(this.mnuAccion);
        break;

      case "r_buscar":
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (!this._sfiltro.enConsulta)
          this.opPrepararBuscar('filtro');
        else
          showToast('Consulta en proceso, por favor espere.', 'warning');
        break;

      case "r_eliminar":
        // this.opEliminar();
        break;

      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
        this.opIrARegistro(operMenu.accion);
        // this.esVisibleSelecc = 'none';
        break;

      case "r_cancelar":
        var mensaje = '¿Desea cancelar la operación?';
        if (this.conCambios > 0) mensaje = 'Desea cancelar sin guardar cambios?';
        Swal.fire({
          title: '',
          text: mensaje,
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} }
            // this.FCapacidad = JSON.parse(JSON.stringify(this.FCapacidad_prev));
            this.mnuAccion = "";
            this.esVisibleSelecc = 'none';
            this.readOnly = true;
            this.conCambios = 0;
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          }
        });
        break;

      case "r_copiar":
        // if (this.FCapacidad) {
        //   this.mnuAccion = 'new';
        //   this.readOnly = false;
        // } else {
        //   showToast('Seleccione sección a copiar', 'Error');
        // }
        break;

      case "r_vista":
        this.opVista();
        break;

      case 'r_refrescar':
        // if (this.cambiosFiltro > 0) {
        //   this.valoresObjetos('todos', '');
        //   this.crearFiltro();
        // } else {
        //   this.valoresObjetos('todos', '');
        // }
        this.valoresObjetos('todos', '');
        break;

      case "r_imprimir":
        this.sendDataFilter('imprimir', operMenu, '');
        break;

      default:
        break;
    }
  }

  opPrepararBuscar(accion: any): void {
    if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Agenda",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: "AGENDA_PRODUCCION",
        aplicacion: this.prmUsrAplBarReg.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { AGENDA_PRODUCCION: arrFiltro };
      this.loadingVisible = true;
      console.log("this.prmUsrAplBarReg.aplicacion", this.prmUsrAplBarReg.aplicacion)
      // Ejecuta búsqueda API
      this.sData
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          this.loadingVisible = false;
          this._sfiltro.enConsulta = false;
          const res = JSON.parse(data.data);
          if ((data.token != undefined)) {
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje !== '') {
            this.VDatosReg = [];
            // this.opBlanquearForma();
            //notificació
            showToast(datares[0].ErrMensaje, 'error');
            return;
          } else {
            this.VDatosReg = datares;
            this.QFiltro = datares[0].QFILTRO;
            this.DAgenda = JSON.parse(JSON.stringify(this.VDatosReg));
            this.sendDataFilter('Load Data', '', datares);

            // Prepara la barra para navegación
            // this.prmUsrAplBarReg = {...this.prmUsrAplBarReg,
            //   r_totReg: datares.length,
            //   r_numReg: 1,
            //   accion: 'r_navegar',
            //   operacion: {}
            // }
            // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            // Trae los items en los componentes asociados
            // this.opIrARegistro('r_primero');
          }
          // this._sfiltro.enConsulta = false;
        });
    }
    this.readOnly = true;

    // this.readOnly = false;
  }

  opIrARegistro(accion: string): void {
    var newArray: any = {};
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        if (this.VDatosReg.length != 0) {
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this.prmUsrAplBarReg.r_numReg = 1;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.readOnly = true;
          showToast("No se encontraron datos", 'error');
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_numreg":
        if (this.prmUsrAplBarReg.r_numReg !== 0) {
          // Valida si hubo cambio de ordenamiento en el visor
          if (this.SVisor.ColSort.Columna !== "") {
            if (this.SVisor.ColSort.Clase === "asc") {
              this.VDatosReg = this.VDatosReg.sort((a: any, b: any) =>
                a[this.SVisor.ColSort.Columna].toUpperCase() <
                  b[this.SVisor.ColSort.Columna].toUpperCase()
                  ? -1
                  : 1
              );
            } else {
              this.VDatosReg = this.VDatosReg.sort((a: any, b: any) =>
                a[this.SVisor.ColSort.Columna].toUpperCase() >
                  b[this.SVisor.ColSort.Columna].toUpperCase()
                  ? -1
                  : 1
              );
            }
          }
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

        } else {
          // this.opBlanquearForma();
        }
        this.readOnly = true;
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        this.prmUsrAplBarReg.r_totReg = this.VDatosReg.length;
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          newArray =
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        } else {
          // this.opBlanquearForma();
        }
        break;

      default:
        break;
    }

    this.DAgenda = newArray;
    // this.sendDataFilter('Load Data', '', newArray);

  }

  opEliminar(): void {
    Swal.fire({
      title: '',
      text: '',
      html: '¿Eliminar el registro?<br/>' +
        '<b style="color: red;">¡ADVERTENCIA!</b> Se eliminarán los datos asociados!',
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      // Procesa eliminación. Llama a la API para validar referenciación y 
      // eliminación en tabla
      if (result.isConfirmed) {
        this.AccionEliminar();
      }
    });

  }
  // Ejecuta la eliminación
  AccionEliminar(): void {
    const prm = { OPERACION: 'delete', DATOS: '' };
    this.sData
      .save('delete', prm)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (data) => {
          try {
            const res = validatorRes(data);
            if (res[0].ErrMensaje !== '') {
              this.showModal(res[0].ErrMensaje, 'Error');
              return;
            }

            this.opIrARegistro("Eliminado");
            showToast('Turno eliminado', 'success');
            this.readOnly = true;

            // Operaciones de barra
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: this.prmUsrAplBarReg.r_totReg !== 0 ? 'r_navegar' : 'r_ini',
              operacion: {}
            };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          } catch (error) {
            this.showModal('Error respuesta eliminar');
          }
        },
        error: (err => {
          this.showModal('Error al eliminar');
        })
      });
  }

  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: "Agenda de producción",
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: ['FECHA_INICIO|Fecha Inicio', 'FECHA_FIN|Fecha Fin'],
      Filtro: '',
      keyGrid: ['ITEM']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  filtrarDatosConsulta(datos: any) {
    var newArray: any = [];
    for (let i = 0; i < this.DAgenda.length; i++) {
      const element = this.DAgenda[i];
      if (newArray.length === 0)
        newArray = element.DETALLES.filter((d: any) => d.ID_SECCION === datos.DATA.ID_SECCION);
      else
        newArray.push(...element.DETALLES.filter((d: any) => d.ID_SECCION === datos.DATA.ID_SECCION));
    }
    if (newArray.length > 0) {
      this.DataPopupProgramacion = newArray;
      this.tituloPopupProgramacion = 'Programación de la Sección: ' + newArray[0].NOMBRE_SECCION;
      this.popupVisibleProgramacion = true;
    } else {
      this.DataPopupProgramacion = [];
      this.popupVisibleProgramacion = false;
      showToast('No hay programación en esta Sección.', 'warning');
    }
  }

  onHidden(e: any) {
    this.tituloPopupProgramacion = '';
    this.DataPopupProgramacion = [];
  }

  formatDate(dateStr: any) {
    const fecha = new Date(dateStr);
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Meses van de 0 a 11
    const dia = String(fecha.getDate()).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const segundos = String(fecha.getSeconds()).padStart(2, '0');
    const milisegundos = String(fecha.getMilliseconds()).padStart(3, '0');
    // Crear el formato similar al de la base de datos
    const fechaFormateada = `${anio}-${mes}-${dia} ${horas}:${minutos}:${segundos}.${milisegundos}`;
    return fechaFormateada;
  }
  crearFiltro() {
    let FILTRO = "";

    if (this.FFiltro.FECHA_ENTREGA_INICIO && this.FFiltro.FECHA_ENTREGA_FINAL) {
      FILTRO += `AP.FECHA_ENTREGA_INICIO >= '${this.formatDate(this.FFiltro.FECHA_ENTREGA_INICIO)}' AND AP.FECHA_ENTREGA_INICIO <= '${this.formatDate(this.FFiltro.FECHA_ENTREGA_FINAL)}' AND `;
    }
    if (this.FFiltro.FECHA_INICIO_PROGRAMADA && this.FFiltro.FECHA_FIN_PROGRAMADA) {
      FILTRO += `AP.FECHA_INICIO_PROGRAMADA >= '${this.formatDate(this.FFiltro.FECHA_INICIO_PROGRAMADA)}' AND AP.FECHA_INICIO_PROGRAMADA <= '${this.formatDate(this.FFiltro.FECHA_FIN_PROGRAMADA)}' AND `;
    }
    if (this.FFiltro.PEDIDO.length > 0) {
      // FILTRO += PEDIDO IN (${this.FFiltro.PEDIDO.map((p:any) => `'${p}'`).join(",")}) AND `;
      FILTRO += ` ${this.FFiltro.PEDIDO.map((pedido: any) => {
        const [ID_PEDIDO, NC_PEDIDO] = pedido.split('-'); // Divide el valor en ID_PEDIDO y NC_PEDIDO
        return `(AP.ID_PEDIDO = '${ID_PEDIDO}' AND AP.NC_PEDIDO = ${NC_PEDIDO})`;
      }).join(' OR ')} AND `;
    }
    if (this.FFiltro.CLIENTE.length > 0) {
      FILTRO += `PE.ID_CLIENTE IN (${this.FFiltro.CLIENTE.map((c: any) => `'${c}'`).join(",")}) AND `;
    }
    if (this.FFiltro.PRODUCTOS.length > 0) {
      FILTRO += `AP.PRODUCTO IN (${this.FFiltro.PRODUCTOS.map((p: any) => `'${p}'`).join(",")}) AND `;
    }
    if (this.FFiltro.ESTADO) {
      FILTRO += `AP.ESTADO = '${this.FFiltro.ESTADO}'`;
    }
    // Remove the trailing " AND " if it exists
    FILTRO = FILTRO.trim().replace(/AND\s*$/, "");

    // this.valoresObjetos('consulta filtro', FILTRO);
  }

  sendDataFilter(accion: string, prm: any, dataSource: any) {
    if (this.tabsAgenda[0].content) {
      this.eventsDatos02.next({
        accion, readOnly: this.readOnly, dataSource, consultado: true, prm, barra: this.prmUsrAplBarReg
      });
    } else if (this.tabsAgenda[1].content) {
      setTimeout(() => {
        this.eventsDatos01.next({
          accion, readOnly: this.readOnly, dataSource, consultado: true, prm
        });
      }, 300);
    } else if (this.tabsAgenda[2].content) {
      this.eventsDatos03.next({
        accion, readOnly: this.readOnly, dataSource, consultado: true, prm
      });
    } else if (this.tabsAgenda[3].content) {
 
    }

  }


  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, datos: any) {
    console.log("obj", obj)
    console.log("this.prmUsrAplBarReg.aplicacion", this.prmUsrAplBarReg.aplicacion)
    if (obj === 'pedidos' || obj === 'todos') {
      const prm = {};
      this.sData.consulta('PEDIDOS', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        } else {
          this.DPidos = res;
        }
      });
    };
    if (obj == 'secciones' || obj == 'todos') {
      this.sData.consulta('SECCIONES', { }, 'PRO-029')
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '')
          showToast(res[0].ErrMensaje);
        else
          this.sendDataFilter('Load Data Secciones', '', res);
      });
    };
    if (obj === 'clientes' || obj === 'todos') {
      const prm = {};
      this.sData.consulta('CLIENTES', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        } else {
          this.DClientes = res;
        }
      });
    };
    if (obj === 'productos' || obj === 'todos') {
      const prm = {};
      this.sData.consulta('PRODUCTOS', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        } else {
          this.DProductos_prev = res;
          this.DProductos = res;
        }
      });
    };
    if (obj === 'estados' || obj === 'todos') {
      const prm = {};
      this.sData.consulta('ESTADOS', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
        } else {
          this.DEstados = res;
        }
      });
    };
    if (obj === 'consulta filtro' || obj === 'todos') {
      let prm = { CLIENTE: false, PLAN: false, PRODUCTO: false };
      if (datos !== '' && datos !== null && datos !== undefined && datos.length > 0) 
        prm = { CLIENTE: datos[0].VALOR, PLAN: datos[1].VALOR, PRODUCTO: datos[2].VALOR };

      console.log("prmDatos", prm)

      this.loadingVisible = true;
      this.sData.consulta('CONSULTA FILTRO', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
        const res = validatorRes(data);
        this.loadingVisible = false;
        if (res[0].ErrMensaje !== '') {
          showToast(res[0].ErrMensaje, 'error');
          this.sendDataFilter('Limpiar', '', '');
        } else {
          this.ATRIBUTOS_PMP = [];
          for (let i = 0; i < res.length; i++) {
            if (typeof res[i].ATRIBUTOS === "string") {
              const parsed = JSON.parse(res[i].ATRIBUTOS);
              res[i].ATRIBUTOS = Array.isArray(parsed) ? parsed : [parsed];
            }
            res[i].ATRIBUTOS.forEach((attr: any) => {
              if (!this.ATRIBUTOS_PMP.some((a: any) => 
                a.CODIGO === attr.CODIGO && 
                a.NOMBRE_ATRIBUTO === attr.NOMBRE_ATRIBUTO &&
                a.VALOR === attr.VALOR
              )) {
                // this.ATRIBUTOS_PMP.push({...attr, ITEM: i+1 });
                const maxItem = this.ATRIBUTOS_PMP.length > 0
                  ? Math.max(...this.ATRIBUTOS_PMP.map(a => a.ITEM || 0))
                  : 0;
                this.ATRIBUTOS_PMP.push({ ...attr, ITEM: maxItem + 1 });
              }
            });
          }
          this.DAgenda = res;
          this.sendDataFilter('Load Data', '', {PRODUCTOS: res, ATRIBUTOS: this.ATRIBUTOS_PMP});
          // showToast('Datos cargados con exito', 'success');
        }
      });
    };
  }

  // Imprimir reporte de aplicación
  imprimirReporte(operMenu: any) {
    var prmRep = {
      ...operMenu.operacion,
      accion: 'previsualizar',
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      usuario: this.prmUsrAplBarReg.usuario,
      // QFiltro: (operMenu.operacion.registro === 'todos') ? this.QFiltro : " CAPACIDAD_PRODUCCION.ITEM = "+this.FCapacidad.ITEM
    };
    if (operMenu.operacion.modo === 'previsualizar')
      this.eventsSubjectInformes.next(prmRep);
    if (operMenu.operacion.modo === 'pdf') {
      prmRep = { ...prmRep, accion: 'pdf' };
      this.eventsSubjectInformes.next(prmRep);
    }
    if (operMenu.operacion.modo === 'email') {
      let template = '';
      let asunto = '';
      let email_sale = '';
      let nom_usr = '';
      var prmRep = {
        ...operMenu.operacion,
        accion: 'email',
        asunto,
        email_sale,
        especUsuarioEmail: nom_usr,
        // nombre: this.FCapacidad.ITEM,
        email: '',
        template,
        replacements: '',
        // dataSource: this.FCapacidad
      };
      this.eventsSubjectInformes.next(prmRep);
    }

  }

  showModal(mensaje: any, titulo: any = '¡Error!', msg_html: any = '') {
    let iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
    if (titulo !== '¡Error!') iconHtml = "<i class='icon-alert-ol'></i>";
    Swal.fire({
      iconHtml: iconHtml,
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
