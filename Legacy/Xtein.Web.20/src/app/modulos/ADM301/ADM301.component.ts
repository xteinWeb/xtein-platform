import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
import { lastValueFrom, Subject, Subscription} from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import Swal from 'sweetalert2';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { DxButtonModule, DxDataGridModule, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLookupModule, DxNumberBoxModule, DxSelectBoxModule, DxTextBoxModule, DxSchedulerModule, DxLoadPanelModule, DxSchedulerComponent } from 'devextreme-angular';
import { clsCalendario, clsCalendarioItem } from './clsADM301.class';
import notify from 'devextreme/ui/notify';
import { CommonModule } from '@angular/common';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { ADM301Service } from 'src/app/services/ADM301/ADM301.service';
import { showToast } from '../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-ADM301',
  templateUrl: './ADM301.component.html',
  styleUrls: ['./ADM301.component.css'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxDropDownBoxModule, DxDataGridModule, DxButtonModule, DxLookupModule, DxSelectBoxModule, DxTextBoxModule, DxNumberBoxModule, DxSchedulerModule, DxLoadPanelModule],
  providers: [ADM301Service]
})
export class ADM301Component implements OnInit {
  @ViewChild('formCalendario', { static: false }) formCalendario: DxFormComponent;
  @ViewChild('schedulerEventos', { static: false }) schedulerEventos: DxSchedulerComponent;

  //Variables fijas de la Aplicación
  subscription: Subscription;
  subscriptionCalendario: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  subs_filtro: Subscription;
  subs_visor: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  VDatosReg: any;
  QFiltro: any;
  readOnly: boolean;
  readOnlyUdp: boolean;
  objReadOnlyGrid: any = {};
  mnuAccion: string;
  esEdicion: boolean = false;
  esCreacion: boolean = false;
  iniEdicion: boolean = false;
  conCambios: number = 0;
  focusedRowIndex: number;
  focusedRowKey: string;
  type: string;
  gridBoxAplicacion: string[] = [];
  isGridBoxAplicacionOpened: boolean;
  isValidRowGrid: boolean;
  isCreatingRow: boolean;
  ID_APLICACION: any = 'ADM-301';
  stylingMode = 'filled';
  dropDownOptions = { width: 700, height: 400, hideOnParentScroll: true};
  dropDownOptionsListBox = { hideOnParentScroll: true, container: '#router-container' };
  dSBEstados = ["ACTIVO","INACTIVO"];
  USUARIO_LOCAL: any = '';
  currentDate: Date = new Date();

  //Notificaciones
  toaVisible: boolean;
  toaMessage: string = 'Registro actualizado!';
  toaTipo: string = 'success';
  loadingVisible: boolean = false;

  //Variables de datos
  DCalendario : clsCalendario;
  DCalendarioItem: clsCalendarioItem[];
  DCalendario_prev : any;
  DCalendarioItem_prev: any;
  DEventosCalendario: any = [];

  constructor(
    private _sdatos: ADM301Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private tabService: TabService)
  {
    this.subscription = this._sbarreg.getObsRegApl().subscribe((datreg) => {
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
      const nx = this.VDatosReg.findIndex(d => d.ID_CALENDARIO === resp.ID_CALENDARIO);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx+1;
        this.opIrARegistro('r_numreg');
      }
    })

    // Servicio comunicacion entre pestañas
    this.subscriptionCalendario = this._sdatos.getObs_Calendario().subscribe((datreg) => {});

  this.valoresObjetos = this.valoresObjetos.bind(this);
  this.resetValidaciones = this.resetValidaciones.bind(this);
  this.loadDiasEventos = this.loadDiasEventos.bind(this);
  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes
    this._sdatos.accion = operMenu.accion;
    switch (operMenu.accion){
      case 'r_ini':
        const user:any = localStorage.getItem('usuario');
        this.prmUsrAplBarReg = {
          tabla: 'CALENDARIOS',
          aplicacion: 'ADM-301',
          usuario: user,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: {},
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_nuevo':
        this.mnuAccion = 'new';
        this.readOnly = false;
        this.readOnlyUdp = false;
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.readOnly = false;
        this.readOnlyUdp = true;
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case 'r_buscar':
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_buscar_ejec':
        this.opBlanquearForma();
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_eliminar':
        this.opEliminar();
        break;

      case 'r_primero':
      case 'r_anterior':
      case 'r_siguiente':
      case 'r_ultimo':
      case 'r_numreg':
        this.opIrARegistro(operMenu.accion);
        break;

      case 'r_cancelar':
        Swal.fire({
          title: '',
          text: 'Desea cancelar la operación?',
          iconHtml: "<i class='icon-alert-outline'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar',
        }).then((result) => {
          if (result.isConfirmed){
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this.readOnly = true;
            this.readOnlyUdp = true;
            this.esEdicion = false;
            this.esCreacion = false;
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.opIrARegistro('r_numreg');

            // Restituye los valores
            this.mnuAccion = '';
          }
        });

        break;

      case 'r_vista':
        this.opVista();
        break;

      case 'r_refrescar':
        this.valoresObjetos('ref');
        break;

      case 'r_imprimir':
        this.imprimirReporte(
          operMenu.operacion.id_reporte,
          operMenu.operacion.archivo,
          operMenu.operacion.data_rpt
        );
        break;

      default:
        break;
    }
  }

  opPrepararBuscar(accion): void {
    if (accion === 'filtro'){
      this._sfiltro.PrmFiltro = {
        Titulo: 'Datos de filtro para Calendario',
        accion: 'PREPARAR FILTRO',
        Filtro: '',
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { CALENDARIOS: arrFiltro };
      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined){
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje === ''){
            this.VDatosReg = datares;
            this.DCalendario = datares[0];
            this.DCalendarioItem = datares[0].ITM_CALENDARIO
            // Prepara la barra para navegación
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              r_totReg: datares.length,
              r_numReg: 1,
              accion: 'r_navegar',
              operacion: {},
            };
          } else {
            this.VDatosReg = [];
            showToast(datares[0].ErrMensaje, 'warning');
            this.opBlanquearForma();
            // Prepara la barra para navegación
            const user:any = localStorage.getItem('usuario');
            this.prmUsrAplBarReg = {
              tabla: 'CALENDARIOS',
              aplicacion: 'ADM-301',
              usuario: user,
              accion: 'r_ini',
              error: '',
              r_numReg: 0,
              r_totReg: 0,
              operacion: { r_modificar: false }
            };
        
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.mnuAccion = '';
            this.readOnly = true;
            this.readOnlyUdp = true;
            this._sdatos.accion = 'r_ini';
          }

          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

          // Trae los items en los componentes asociados
          this.opIrARegistro('r_primero');
          this.loadingVisible = false;
          this._sfiltro.enConsulta = false;
        });
    }

    this.readOnly = true;
    this.readOnlyUdp = true;
    this.resetValidaciones();
  }

  opBlanquearForma(): void {
    var now = new Date();
    this.DCalendario = {
      ID_CALENDARIO: '',
      NOMBRE: '',
      ESTADO: 'ACTIVO'
    };
    this.DCalendarioItem = [];
    this.DEventosCalendario = [];
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = 'r_numreg';
    switch (accion){
      case 'r_primero':
        this.prmUsrAplBarReg.r_numReg = 1;
        if(this.VDatosReg.length != 0){
          this.DCalendario = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this.DCalendarioItem = JSON.parse(JSON.stringify(this.VDatosReg[0].ITM_CALENDARIO));
          this.loadDiasEventos();
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }else{
          showToast('No se encontraron datos', 'error');
          this.readOnly = true;
          this.readOnlyUdp = true;
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.DCalendario = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DCalendarioItem = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_CALENDARIO));
          this.loadDiasEventos();
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length ? this.VDatosReg.length : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DCalendario = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1]));
        this.DCalendarioItem = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg -1].ITM_CALENDARIO));
          this.loadDiasEventos();
        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DCalendario = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DCalendarioItem = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_CALENDARIO));
        this.loadDiasEventos();
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_numreg':
        if (this.prmUsrAplBarReg.r_numReg !== 0){
          // Valida si hubo cambio de ordenamiento en el visor
          if (this.SVisor.ColSort.Columna !== ''){
            if (this.SVisor.ColSort.Clase === 'asc'){
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
          this.DCalendario = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this.DCalendarioItem = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_CALENDARIO));
          this.loadDiasEventos();
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearForma();
          this.resetValidaciones();
          setTimeout(() => {
            this.formCalendario.instance.resetValues();
          }, 100);
        }
        this.readOnly = true;
        this.readOnlyUdp = true;
        break;
      case 'Eliminado':
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg){
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0){
          this.DCalendario = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
          this.DCalendarioItem = this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_CALENDARIO;
          this.loadDiasEventos();
        } else {
          this.opBlanquearForma();
        }
        break;
      default:
        break;
    }
  }

  opPrepararNuevo(): void {
    this.readOnly = false;
    this.readOnlyUdp = false;
    this.esEdicion = true;
    this.esCreacion = false;
    this.iniEdicion = true;
    this.opBlanquearForma();
  }

  opPrepararGuardar(accion: string): void {
    if (!this.ValidaDatos('requerido')){
      return;
    }

    const prmDatosGuardar = JSON.parse(
      (JSON.stringify({ CALENDARIO: this.DCalendario, ITM_CALENDARIO: this.DEventosCalendario})).replace(/}{/g,",")
    );

    // API guardado de datos
    var exito = false;
    this._sdatos
      .save(accion, prmDatosGuardar, this.prmUsrAplBarReg.aplicacion)
      .subscribe((resp) => {
        const res = JSON.parse(resp.data);
        if (res[0].ErrMensaje !== ""){
          this.showModal(res[0].ErrMensaje);
        } 
        else
        {
          this.readOnly = true;
          this.readOnlyUdp = true;
          this.esEdicion = false;
          this.esCreacion = false;
          // Operaciones de barra
          if (this.mnuAccion === 'new'){
            this.QFiltro = "CALENDARIO='"+this.DCalendario.ID_CALENDARIO+"'";
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              r_numReg: 1,
              r_totReg: 1,
              operacion: {}
            };
          }
          else
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              operacion: {}
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          showToast("Registro actualizado", 'success');
        }
      });
  }

  async opPrepararModificar(){
    this.readOnly = false;
    this.readOnlyUdp = true;
    this.esEdicion = true;
    this.esCreacion = false;
    this.iniEdicion = true;
  }

  opEliminar(): void {
    Swal.fire({
      title: '',
      text: '',
      html:
        'Desea eliminar el Calendario <i>' +
        this.DCalendario.NOMBRE+
        '</i> ?',
      iconHtml: "<i class='icon-alert-outline'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar',
    }).then((result) => {
      // Procesa eliminación. Llama a la API para validar referenciación y eliminación en tabla
      if (result.isConfirmed){
        this.AccionEliminar();
      }
    });
  }

  opVista(): void {
    const VDatosRegAux = this.VDatosReg.map(({ID_CALEDARIO, NOMBRE, ESTADO}) => ({ID_CALEDARIO, NOMBRE, ESTADO}));
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(VDatosRegAux));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'Calendario',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: '',
      Filtro: '',
      keyGrid: ['ID_CALENDARIO'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  onAppointmentAdding(e:any) {
    this.validaFechas(e.appointmentData.startDate, e.appointmentData.endDate);
  }

  onAppointmentAdded(e:any) {
    showToast('Agregado: '+e.appointmentData.text, 'success');
  }

  onAppointmentUpdated(e:any) {
    showToast('Actualizado: '+e.appointmentData.text, 'success');
  }

  onAppointmentDeleted(e:any) {
    showToast('Eliminado: '+e.appointmentData.text, 'warning');
  }

  onAppointmentDblClick(e:any) {
    e;
  }

  onSelectCalendario(e:any) {}

  AccionEliminar(): void {
    // API eliminación de datos
    const prm = { ID_CALENDARIO: this.DCalendario.ID_CALENDARIO };
    this._sdatos
      .delete('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== ''){
          this.showModal(res[0].ErrMensaje);
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        this.opIrARegistro('Eliminado');
        showToast('Calendario eliminada', this.toaTipo);
        this.readOnly = true;
        this.readOnlyUdp = true;

        // Operaciones de barra
        this.prmUsrAplBarReg.r_totReg--;
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          error: '',
          accion: 'r_navegar',
          operacion: {},
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      });
  }

  dragEnd(unit: any, sizes: any): any {}

  imprimirReporte(id_reporte, archivo, datosrpt) {
    let filtroRep = {FILTRO: ''};
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
    this.tabService.addTab(
      new Tab(
        VisorrepComponent,  // visor
        datosrpt.text,  // título
        { parent: "PrincipalComponent", args: prmLiq },  // parámetro: reporte,filtro
        id_reporte,  // código del reporte
        '',
        'reporte',
        true
    ));
  }

  loadDiasEventos(){
    this.DEventosCalendario = [];
    if (this.DCalendarioItem != null){
      var item:any;
      this.DCalendarioItem.forEach((element:any) => {
        item = {
          startDate: new Date(element.startDate),
          endDate: new Date(element.endDate),
          text: element.text,
          description: element.description,
          recurrenceRule: element.recurrenceRule,
          allDay: element.allDay,
        }
        this.DEventosCalendario.push(item);
      });
    }

    if (this.DCalendario.ID_CALENDARIO === 'FESTIVOS'){
      this.loadFestivos();
    }
    this.schedulerEventos.instance._refresh();
  }

  loadFestivos(){
    this.valoresObjetos('festivos');
  }

  resetValidaciones(){
    if (this.formCalendario != null){
      this.formCalendario.instance.resetValues();
    }
  }

  showModal(mensaje, titulo = '¡Error!', msg_html = ''){
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-circle'></i>",
      title: titulo,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
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

  validaFechas(startDate: Date, endDate: Date){
    const res = this.DEventosCalendario.filter(item => ((startDate >= item.startDate && startDate <= item.endDate) && (endDate >= item.startDate && endDate <= item.endDate)));
    if(res.length > 0){
      showToast('Ya existe un Evento para las fechas seleccionadas','error','0 0');
      throw new Error();
    }
  }

  ValidaDatos(Accion: string): boolean {
    if (Accion === "requerido"){
      if (this.DCalendario.ID_CALENDARIO === '' || this.DCalendario.ID_CALENDARIO === undefined){
        this.showModal('Error al guardar',"Faltan datos","El Código del Calendario es obligatorio!");
        return false;
      }
      if (this.DCalendario.NOMBRE === '' || this.DCalendario.NOMBRE === undefined){
        this.showModal('Error al guardar',"Faltan datos","La Descripción del Calendario es obligatoria!");
        return false;
      }
    }
    return true;
  }

  valoresObjetos(obj:string) {
    if (obj === 'festivos') {
      try {
        this.DEventosCalendario = [];
        this.loadingVisible = true;
        this._sdatos.getCalendarioApi().subscribe((data: any) => {
          this.loadingVisible = false;
          const res = data;
          var item:any;
          res.forEach((element:any) => {
            item = { 
              text: element.name,
              startDate: new Date(element.start),
              endDate: new Date(element.start),
              allDay: true,
              disabled: true,
              type: 'Dia Festivo'
            }
          this.DEventosCalendario.push(item);
          });
          this.schedulerEventos.instance._refresh();
        });
      } catch (error) {
      }
    };
  }

  ngOnInit(): void {
    const user:any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: 'CALENDARIOS',
      aplicacion: 'ADM-301',
      usuario: user,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_modificar: true }
    };

    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this.readOnly = true;
    this.readOnlyUdp = true;
    this._sdatos.accion = 'r_ini';

    this.valoresObjetos('todos');
    this.opBlanquearForma();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subscriptionCalendario.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }
}
