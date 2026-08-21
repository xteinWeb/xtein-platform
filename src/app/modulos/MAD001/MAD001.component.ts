
import { Component, ViewChild, Input } from '@angular/core';
import { DxCheckBoxModule, DxDateBoxModule, DxFileUploaderModule, DxFormModule, DxSelectBoxModule, DxTextAreaModule, DxTextBoxModule, DxLoadPanelModule } from 'devextreme-angular';
import { Subject, Subscription, takeUntil, lastValueFrom } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { MAD001Service } from 'src/app/services/MAD001/MAD001.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { showToast } from '../../shared/toast/toastComponent.js';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import Swal from 'sweetalert2';
import { Aplicaciones } from './clsMAD001.class';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';
import { DxTreeViewModule } from 'devextreme-angular';
import { GenericTreeComponent } from 'src/app/shared/components/generic-tree/generic-tree.component';
import { DxButtonModule } from 'devextreme-angular';
import { DxFormComponent } from 'devextreme-angular';

@Component({
    selector: 'app-MAD001',
    imports: [
    DxFormModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxCheckBoxModule,
    DxDateBoxModule,
    DxFileUploaderModule,
    DxButtonModule,
    DxTextAreaModule,
    DxTreeViewModule,
    VistarapidaComponent,
    GeninformesComponent,
    GenericTreeComponent,    
    DxLoadPanelModule   
],
    templateUrl: './MAD001.component.html',
    styleUrls: ['./MAD001.component.css']
})
export class MAD001Component {
  @ViewChild('arbolAplicaciones') arbolAplicaciones!: GenericTreeComponent;
  @ViewChild('form') form!: DxFormComponent;
  dataAppModel: Aplicaciones;
  dataAppModel_prev: any;
  idAppPadreItems: any;
  tipoItems: any;
  estadoItems: any;
  tipoSistemaItems: any ;
  accionItems: any;
  udmItems: any;
  nivelItems: any;
  aplicacionesTree: Aplicaciones[] = []; 
  mostrarArbol = true;   // Controlado por el formulario
  arbolVisible = true;   // Estado local del árbol
  @Input()
  aplicacion!: string;
  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subs_visor: Subscription;
  subs_filtro: Subscription;
  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();
  prmUsrAplBarReg: clsBarraRegistro;
  USUARIO: any;
  VDatosReg: any;
  QFiltro: any;
  mnuAccion: string;
  readOnly: boolean = true;
  expandGrupos: boolean = true;
  readOnlyEstado: boolean = true;
  integridadReferencial: boolean = false;
  conCambios: number = 0;
  loadingVisible: boolean = false;

  constructor(
    private sData: MAD001Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService
  ) {
    this._unsubscribeAll = new Subject();

    this.subscription = this._sbarreg
      .getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((datreg) => {
        // Valida si la petición es para esta aplicacion
        if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });

    // Respuesta del filtro
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe((resp) => {
      // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    });
    this.subs_visor = this.SVisor.getObs_Apl().subscribe((resp) => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion)
        return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex(
        (d) => d.ID_APLICACION === resp.ID_APLICACION
      );
      if (nx !== -1) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    });

    this.onValueChangedApl = this.onValueChangedApl.bind(this);
    this.ValideExistencia = this.ValideExistencia.bind(this);
  }

  ngOnInit(): void {    
    this.dataAppModel = {
      ID_APLICACION: '',
      ID_APLICACION_PADRE: '',
      NOMBRE: '',
      TIPO: '',  
      COMENTARIOS: null,
      ESTADO: 'ACTIVO', 
      ACCION: '',
      META_INFERIOR:0,
      META_SUPERIOR: 0,       
      UDM: '',
      NIVEL: ''
    };
    this.USUARIO = localStorage.getItem('usuario')?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'APLICACIONES_ASOCIADAS',
      aplicacion: 'MAD-001',
      usuario: this.USUARIO,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_refrescar: true },
    };
    this.mnuAccion = '';
    this.readOnly = true;
    this.readOnlyEstado = true;
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.valoresObjetos('todos');
    this.cargarArbolAplicaciones();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  cargarArbolAplicaciones(): void {
    this.sData.consulta('ARBOL_APLICACIONES', {}, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (data.token != undefined) {
          localStorage.setItem('token', data.token);
        }
        if (res[0]?.ErrMensaje === '') {
          this.aplicacionesTree = res;          
        }
      });
  }

  onAplicacionTreeClick(event: any): void {
    const aplicacion = event.node;    
    // Buscar en VDatosReg o cargar los datos
    const index = this.VDatosReg?.findIndex(
      (d: any) => d.ID_APLICACION === aplicacion.ID_APLICACION
    );
    
    if (index !== -1 && index !== undefined) {
      this.prmUsrAplBarReg.r_numReg = index + 1;
      this.opIrARegistro('r_numreg');
    } else {
      // Si no está en VDatosReg, cargar directamente
      this.dataAppModel = { ...aplicacion };
    }    
    this.readOnly = true;
    this.readOnlyEstado = true;
    this.mnuAccion = '';
  }
   
  filtrarArbol(event: any): void {
    // La búsqueda se maneja internamente en el componente genérico
    // Este método está aquí por si necesitas lógica adicional
    console.log('Buscando:', event.value);
  }

  valoresObjetos(obj: string) {
    if (obj === 'todos' || obj === 'ID_APLICACION_PADRE') 
    {
      // Cargar lista de Aplicaciones para ID_APLICACION_PADRE
      this.sData
        .consulta(
          'APLICACIONES',
          { TIPO: 'MODULO' },
          this.prmUsrAplBarReg.aplicacion
        )
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }          
          if (res[0].ErrMensaje === '') {
            this.idAppPadreItems = res;
          } else {
            this.showModal(res[0].ErrMensaje, 'Error');
          }
        });

      // Cargar listas de la aplicación
      this.sData
        .consulta('datalists',{}, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          if (res[0].ErrMensaje === '') {
            this.udmItems = res[0].udm;
            this.tipoItems = res[0].tipo;
            this.estadoItems = res[0].estado;
            this.tipoSistemaItems = res[0].tipoSistema;
            this.accionItems = res[0].accion;            
            this.nivelItems = res[0].nivel;            
          } else {
            this.showModal(res[0].ErrMensaje, 'Error');
          }
        });
    }
  }

  opMenuRegistro(operMenu: clsBarraRegistro) {
    switch (operMenu.accion) {
      case 'r_ini':
        this.prmUsrAplBarReg = {
          tabla: 'APLICACIONES_ASOCIADAS',
          aplicacion: 'MAD-001',
          usuario: this.USUARIO,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_refrescar: true },
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_nuevo':
        this.mnuAccion = 'new';
        this.readOnly = false;
        this.readOnlyEstado = false;
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        if (!this.ValidaDatos('requerido')) {
          return;
        } else {
          this.opPrepararGuardar(this.mnuAccion);
        }
        // showToast('No hay cambios a guardar', 'warning');
        break;

      case 'r_buscar':
        if (
          GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion
        )
          return;
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_buscar_ejec':
        this.opBlanquearFormGP();
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_eliminar':
        this.opEliminar();
        this.cargarArbolAplicaciones();
        break;

      case 'r_primero':
      case 'r_anterior':
      case 'r_siguiente':
      case 'r_ultimo':
      case 'r_numreg':
        this.opIrARegistro(operMenu.accion);
        break;

      case 'r_cancelar':
        var mensaje = '¿Desea cancelar la operación?';
        if (this.conCambios != 0)
          mensaje = 'Desea cancelar sin guardar cambios?';
        Swal.fire({
          title: '',
          text: mensaje,
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar',
        }).then((result) => {
          if (result.isConfirmed) {
            this.readOnly = true;
            this.readOnlyEstado = true;
            this.conCambios = 0;
            this.mnuAccion = '';
            this.prmUsrAplBarReg.accion =
              this.VDatosReg?.length > 0 ? 'r_navegar' : 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            if (
              this.dataAppModel_prev === undefined ||
              this.dataAppModel_prev === '' ||
              this.dataAppModel_prev === null ||
              this.dataAppModel_prev.length === 0
            ) {
              this.opBlanquearFormGP();
            } else {
              this.dataAppModel = JSON.parse(
                JSON.stringify(this.dataAppModel_prev)
              );
            }
            console.log(this.prmUsrAplBarReg.r_numReg);
            if (this.prmUsrAplBarReg.r_numReg === 0 || 
                this.prmUsrAplBarReg.accion === 'r_ini' ) 
                {this.mostrarArbol = true;}
          }
        });
        break;

      case 'r_copiar':       
        break;

      case 'r_vista':
        this.opVista();
        break;

      case 'r_refrescar':
        this.valoresObjetos('todos');
        this.cargarArbolAplicaciones();
        break;

      case 'r_imprimir':
        this.imprimirReporte(operMenu);
        break;

      default:
        break;
    }
  }

  opPrepararNuevo(): void {
    this.opBlanquearFormGP();
    this.dataAppModel.ESTADO = 'ACTIVO';
    this.mostrarArbol = false;
  }

  opBlanquearFormGP(): void {
    this.dataAppModel_prev = JSON.parse(JSON.stringify(this.dataAppModel)); // Guardar datos previos antes de blanquear
    this.dataAppModel = {
       ID_APLICACION: '',
       ID_APLICACION_PADRE: '',
       NOMBRE: '',
       TIPO: '',  
       COMENTARIOS: null,
       ESTADO: 'ACTIVO', 
       ACCION: '',
       META_INFERIOR:0,
       META_SUPERIOR: 0,       
       UDM: '',
       NIVEL: ''
    };
  }

  async opPrepararModificar() {
    this.dataAppModel_prev = JSON.parse(JSON.stringify(this.dataAppModel));
    this.readOnly = false;
    this.readOnlyEstado = true;
    this.mostrarArbol = false;
  }

  opPrepararBuscar(accion: any): void {
    if (accion === 'filtro') {
      this._sfiltro.PrmFiltro = {
        Titulo: 'Datos de filtro para Mentor Maestro',
        accion: 'PREPARAR FILTRO',
        Filtro: '',
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { APLICACIONES_ASOCIADAS: arrFiltro };

      this.loadingVisible = true;
      this.sData
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          try {
            this.loadingVisible = false;
            const res = JSON.parse(data.data);
            this._sfiltro.enConsulta = false;
            if (data.token != undefined) {
              const refreshToken = data.token;
              localStorage.setItem('token', refreshToken);
            }
            const datares = res;
            if (datares[0].ErrMensaje === '') {
              this.VDatosReg = datares;
              this.dataAppModel = datares[0];
              this.QFiltro = datares[0].QFILTRO;

              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                r_totReg: datares.length,
                r_numReg: 1,
                accion: 'r_navegar',
                operacion: {},
              };
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
              this.opIrARegistro('r_primero');
              this.readOnly = true;
              this.mostrarArbol = false;
            } else {
              this.VDatosReg = [];
              this.opBlanquearFormGP();
              showToast(datares[0].ErrMensaje, 'warning');
              this.prmUsrAplBarReg.accion = 'r_ini';
              this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
              this.mostrarArbol = true;              
            }
          } catch (error) {
            this.loadingVisible = false;
            this.readOnly = true;
            this._sfiltro.enConsulta = false;
            this.showModal(error, 'Error');
            this.mostrarArbol = true;
          }
        });
    }
    this.readOnly = true;
  }

  imprimirReporte(operMenu: any) {
    var prmRep = {
      ...operMenu.operacion,
      accion: 'previsualizar',
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      usuario: this.prmUsrAplBarReg.usuario,
      QFiltro:
        operMenu.operacion.registro === 'todos'
          ? this.QFiltro
          : " APLICACIONES_ASOCIADAS.ID_APLICACION = '" +
            this.dataAppModel.ID_APLICACION +
            "'",
    };
    if (operMenu.operacion.modo === 'previsualizar')
      this.eventsSubjectInformes.next(prmRep);

    if (operMenu.operacion.modo === 'pdf') {
      prmRep = { ...prmRep, accion: 'pdf' };
      this.eventsSubjectInformes.next(prmRep);
    }
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = 'r_numreg';
    switch (accion) {
      case 'r_primero':
        if (this.VDatosReg.length != 0) {
          this.dataAppModel = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this.prmUsrAplBarReg.r_numReg = 1;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.readOnly = true;
          showToast('No se encontraron Datos', 'error');
        }
        break;
      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1
            ? 1
            : this.prmUsrAplBarReg.r_numReg - 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.dataAppModel = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        break;
      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.dataAppModel = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        break;
      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.dataAppModel = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_numreg':
        if (this.prmUsrAplBarReg.r_numReg !== 0) {
          if (this.SVisor.ColSort.Columna !== '') {
            if (this.SVisor.ColSort.Clase === 'asc') {
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
          this.dataAppModel = JSON.parse(
            JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
          );
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.opBlanquearFormGP();
        }
        this.readOnly = true;
        break;
      case 'Eliminado':
        this.opBlanquearFormGP();
        break;
      default:
        break;
    }
  }

  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'MENTOR MAESTRO',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: [
        'ID_APLICACION|APLICACIÓN',
        'NOMBRE|NOMBRE',
        'TIPO|TIPO',
        'ESTADO|ESTADO',
      ],
      Filtro: '',
      keyGrid: ['ID_APLICACION'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  async ValideExistencia(e: any) {
    let aprob: boolean = false;
    if (
      this.mnuAccion === undefined ||
      this.readOnly ||
      !this.mnuAccion.match('new|update') ||
      (this.mnuAccion === 'update' &&
        this.dataAppModel_prev.ID_APLICACION === e.value)
    ) {
      aprob = true;
    }
    if (!aprob) {
      const prm = { ID_APLICACION: e.value };
      const apiRest = this.sData.validellave(
        'existe',
        prm,
        this.prmUsrAplBarReg.aplicacion
      );
      let res = await lastValueFrom(apiRest, { defaultValue: true });
      res = JSON.parse(res.data);
      if (res[0].ErrMensaje !== '') {
        aprob = true;
      } else {
        this.showModal('Aplicación ' + e.value + ' ya existe', '¡IMPORTANTE!');
        aprob = false;
      }
    }
    return aprob;
  }

  async opPrepararGuardar(accion: string): Promise<void> {
    if (this.ValidaDatos('requerido') === false) {
      return;
    }
    if (!await this.ValideExistencia({ value: this.dataAppModel.ID_APLICACION })) {
      return;
    }
    const sendData = {
      ID_APLICACION: this.dataAppModel.ID_APLICACION,
      ID_APLICACION_PADRE: this.dataAppModel.ID_APLICACION_PADRE,
      NOMBRE: this.dataAppModel.NOMBRE,
      TIPO: this.dataAppModel.TIPO,  
      COMENTARIOS: this.dataAppModel.COMENTARIOS,
      ESTADO: this.dataAppModel.ESTADO,      
      ACCION: this.dataAppModel.ACCION,
      META_INFERIOR:  this.dataAppModel.META_INFERIOR,
      META_SUPERIOR:  this.dataAppModel.META_SUPERIOR,
      UDM: this.dataAppModel.UDM,
      NIVEL: this.dataAppModel.NIVEL,
    };
    var prm: any = { APLICACIONES_ASOCIADAS: this.dataAppModel };
    this.sData
      .save(accion, prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem('token', refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
        } else {
          if (this.mnuAccion === 'new') {
            this.QFiltro =
              "ID_APLICACION='" + this.dataAppModel.ID_APLICACION + "'";
          }
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: '',
            accion: 'r_ini',
            operacion: {},
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.cargarArbolAplicaciones();
          console.log('Paso1'); 
          showToast('Registro actualizado', 'success');
          console.log('Paso2'); 
          this.mnuAccion = '';
          this.readOnly = true;
          this.readOnlyEstado = true;
          this.conCambios = 0;
          this.mostrarArbol = true;          
        }
      });
  }

  async opEliminar() {
    Swal.fire({
      title: '',
      text: '',
      html:
        '¿Desea Eliminar la Aplicación <i>' +
        this.dataAppModel.ID_APLICACION +
        '</i>?',
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.AccionEliminar();
      }
    });
  }

  AccionEliminar() {
    const prm = { ID_APLICACION: this.dataAppModel.ID_APLICACION };
    this.sData
      .delete('delete', prm)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((data) => {
        try {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          if (res[0].ErrMensaje !== '') {
            this.showModal(res[0].ErrMensaje);
            return;
          }
          this.readOnly = true;
          this.dataAppModel_prev = [];
          showToast('Aplicación eliminada', 'success');
          this.prmUsrAplBarReg = {
            ...this.prmUsrAplBarReg,
            error: '',
            operacion: {},
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.opBlanquearFormGP();
        } catch (error) {
          this.showModal(
            'Error respuesta eliminar aplicación: ' +
              error +
              ' Rta:' +
              data.data
          );
        }
      });
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
      position: 'center',
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }

  ValidaDatos(Accion: string): boolean {

  try {

    if (Accion === 'requerido') {

      if (!this.form?.instance) {
        throw new Error('No se encontró la instancia del formulario.');
      }

      const result = this.form.instance.validate();

      if (!result.isValid) {
        this.showModal(
          'Error al guardar',
          'Faltan datos',
          'Hay datos incompletos. Llena todos los items.'
        );
        return false;
      }
    }

    return true;

  } catch (error: any) {

    console.error('Error al validar formulario:', error);

    this.showModal(
      'Error',
      'Validación',
      error?.message || 'Ocurrió un error al validar el formulario.'
    );

    return false;
  }
}

  onValueChanged(e: any) {    
    this.dataAppModel.ID_APLICACION_PADRE = e.value;    
  }

  onValueChangedApl(e: any) {
    if (e.value !== '') {
      if (this.mnuAccion === 'new') {
        this.ValideExistencia(e);
      }
    }
  }

  toggleArbol(): void {
    if (this.mostrarArbol) {
      this.arbolVisible = !this.arbolVisible;
    }
  }

  validarNivel(e: any): boolean {
    // Si NO es KPI, no es obligatorio
    if (this.dataAppModel.TIPO !== 'KPI') {
      return true;
    }

    // Si es KPI, debe tener un valor
    return e.value !== null && e.value !== undefined && e.value !== '';
  }
}