import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import config from "devextreme/core/config";
import { lastValueFrom, Subject, Subscription, throwError } from "rxjs";

import dxCheckBox from "devextreme/ui/check_box";
import { DxButtonModule, DxDiagramComponent, DxDiagramModule, DxFormComponent, DxFormModule,
         DxListComponent,
         DxListModule, DxLoadPanelModule, DxLookupModule, DxScrollViewModule, DxSelectBoxModule,
         DxTextBoxModule, DxTreeListComponent 
} from "devextreme-angular";
import {
  AppSettings,
  FlowEdge,
  FlowNode,
  MDistriplantas,
  childFlowNode,
  MSecciones,
} from "../../../services/PRO011/interface";
import { SSeccionesdpService } from "../../../services/PRO011/e-seciones.service";
import { LibsvgService, SVisorService } from "../../../services/PRO011/SVisor.service";
import { catchError, takeUntil } from "rxjs/operators";
import { PRO011Service } from "../../../services/PRO011/PRO011.service";
import { PRO008Service } from "../../../services/PRO008/s_PRO008.service";
import { SbarraService } from "src/app/containers/regbarra/_sbarra.service";
import { clsBarraRegistro } from "src/app/containers/regbarra/_clsBarraReg";
import { TabService } from 'src/app/containers/tabs/tab.service';
import Swal from "sweetalert2";
import { SfiltroService } from "src/app/shared/filtro/_sfiltro.service";
import { GlobalVariables } from "src/app/shared/common/global-variables";
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { Tab } from 'src/app/containers/tabs/tab.model';
import notify from 'devextreme/ui/notify';
import { imgtool } from "src/app/shared/classes/imgtools";
import { SvisorRutasService } from "src/app/shared/visor-img/_svisor-img.service";
import { AngularSplitModule } from "angular-split";
import { VisorImgComponent } from "src/app/shared/visor-img/visor-img.component";
import { CommonModule } from "@angular/common";
import { showToast } from '../../../shared/toast/toastComponent.js';
import DataSource from 'devextreme/data/data_source';
import ArrayStore from 'devextreme/data/array_store';
import { Point } from "@angular/cdk/drag-drop";

@Component({
  selector: "PRO-014",
  templateUrl: "./PRO014.component.html",
  styleUrls: ["./PRO014.component.scss"],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxSelectBoxModule, AngularSplitModule, DxLookupModule, DxListModule,
            DxScrollViewModule, DxButtonModule, DxDiagramModule, VisorImgComponent, DxTextBoxModule, DxLoadPanelModule
          ],
  providers: [PRO011Service]
})
export class PRO014Component implements OnInit {
  public _unsubscribeAll: Subject<any>;

  @ViewChild("formRPro", { static: false }) formRPro: DxFormComponent;
  @ViewChild(DxTreeListComponent, { static: false }) treeList: DxTreeListComponent;
  @ViewChild("diagProductos", { static: false }) diagLay: DxDiagramComponent;
  @ViewChild("listaRPartes", { static: false }) listaRPartes: DxListComponent;

  activeDiagrama: boolean = false;
  DRutasProductos: MDistriplantas;
  DRutasSimples: any;
  DataDP_Q: MDistriplantas[] = [];
  DatosSeccRutasDP: MSecciones[];
  DatosSecciones: any;
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;

  colCountByScreen: object;
  stylingMode = "filled";
  editorStylingMode: "filled";
	tipoAutoLayout: string = 'off';
  operCfg: string;
  vecNodosSelecc: any;
  IdRutaAnterior: string;
  OpGuardar: string;
  dSBEstados = [{ ESTADO: "ACTIVO" }, { ESTADO: "INACTIVO" }];
  listaRutaPpal: any;
  rutasPartes: any;
  lisSelRutasSimples: any[] = [];

  datIdRuta: string;
  appsettings: AppSettings;

  // Parámetro de ruta para pasar
  statusSeccDP = "";
  seleccionDP: any[] = [];
  seleccRecur = false;
  seccNodos: FlowNode[] = [];
  seccConec: FlowEdge[] = [];
  seccNodosBak: FlowNode[] = [];
  seccConecBak: FlowEdge[] = [];
  seccNodosLay: FlowNode[] = [];
  seccConecLay: FlowEdge[] = [];
  seccNodosDataSource: any;
  seccConecDataSource: any;
  seccNodosRuta: FlowNode[] = [];
  seccConecRuta: FlowEdge[] = [];
  menuCommSeccion: any[];
  elemNodo: FlowNode;
  elemConecEdit: FlowEdge;
  modelPoint: Point;
  modelDiagrama: any;
  diagReadOnly: boolean = true;
  eliminarNodo: boolean = false;
  GValorRutaParte: any;
  rutaPriSelecc: string;
  noValidar: boolean;

  public contentHeader: object;
  NodosSvg:any = [];

  // Selección de secciones en diagrama
  ModoPopUp: string;
  popupVisible: boolean = false;
  popupMode = "Secciones";
  SelNodoDato: any;
  SelNodoLP: any;
  dialogModal: string;
  errMsg: string;
  errTit: string;
  loadingVisible = false;
	subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  prmUsrAplBarReg: clsBarraRegistro;

  // notificaciones
  toaVisible: boolean;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';

  initDiagrama: boolean = false;
  menuDiagVisible: boolean = false;
  nodoSeccionAccion: any [] = [];
  HIGHLIGHT_CLASS: string = "highlight";
  HIGHLIGHT_ACTIVE_CLASS: string = "highlight-is-active";
  highlightIsActive: boolean = false;

  constructor(
    private _rutasdpservice: PRO011Service,
    private _secciones: PRO008Service,
    private DatosPrmRuta: SSeccionesdpService,
    private SVisor: SVisorService,
    private rutas: ActivatedRoute, 
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private _srutas: SvisorRutasService,
    _slibsvg: LibsvgService,
    private tabService: TabService) 
  {
    this._unsubscribeAll = new Subject();

    // Servicio de barra de registro
    this.subscription = this._sbarreg
      .getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((datreg) => {
        // Valida si la petición es para esta aplicacion
        if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });
    
    _slibsvg.getArchivo().subscribe(() => {
      this.NodosSvg = _slibsvg.custShapes;
    });

    var flowNodes: FlowNode[] = [];
    var flowEdges: FlowEdge[] = [];
    this.elemConecEdit = {
      id: "",
      text: "",
      fromId: "",
      toId: "",
      fromPoint: "-1",
      toPoint: "-1",
    };
    this.seccNodos = flowNodes;
    this.seccConec = flowEdges;
    this.seccNodosDataSource = new ArrayStore({
      key: "id",
      data: flowNodes,
    });
    this.seccConecDataSource = new ArrayStore({
      key: "id",
      data: flowEdges,
    });
    this.seccNodosBak = JSON.parse(JSON.stringify(flowNodes));
    this.seccConecBak = JSON.parse(JSON.stringify(flowEdges));
            this._unsubscribeAll = new Subject();
    this.elemConecEdit = {
      id: "",
      text: "",
      fromId: "",
      toId: "",
      fromPoint: "-1",
      toPoint: "-1",
    };

    // Filtro de búsqueda
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe(resp => {
      // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    })

    this.ValideExistencia = this.ValideExistencia.bind(this);
    this.valueRutaPpal = this.valueRutaPpal.bind(this);
    this.onSelecRutasSimples = this.onSelecRutasSimples.bind(this);

  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        const user:any = localStorage.getItem("usuario")
        this.prmUsrAplBarReg = {
          tabla: "RUTAS_PRODUCCION",
          aplicacion: "PRO-014",
          usuario: user,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
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

      case "r_buscar":
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          this.toaMessage = 'Consulta en proceso, por favor espere.';
          this.toaVisible = true;
          this.toaTipo = 'warning';
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case "r_buscar_ejec":
        this.opBlanquearForma();
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case "r_eliminar":
        this.opEliminar();
        break;

      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
        this.opIrARegistro(operMenu.accion);
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
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, 
                                    operacion: { } 
                                  }
            this.readOnly = true;
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.opIrARegistro('r_numreg');

            // Restituye los valores
            this.mnuAccion = "";
            
          }
        });

        break;

      case "Vista":
        this.opVista();
        break;

      case 'r_refrescar':
				this.valoresObjetos('todos');
				break;

      case "r_imprimir":
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
  // Llama a Acciones de registro
  
  opPrepararNuevo(): void {
    this.IdRutaAnterior = "";
    this.OpGuardar = "new";
    this.opBlanquearForma();
    if(this.mnuAccion.match('new'))
      this.valoresObjetos('consecutivo');
    this.DRutasProductos.ESTADO = 'ACTIVO';
  }
  opBlanquearForma(): void {
    this.DRutasProductos = {
      ID_RUTA: "",
      AUTO_CONSECUTIVO: 0,
      DESCRIPCION: "",
      ESTADO: "",
      TIPO: "",
      PRIORIDAD: "",
      SECCIONES: "{}",
      DIAGRAMA: "{}"
    };
    this.rutaPriSelecc = '';

    this.seccNodos.splice(0, this.seccNodos.length);
    this.seccConec.splice(0, this.seccConec.length);
    this.seccConecBak.splice(0, this.seccConecBak.length);
    const flowNodes: FlowNode[] = [];
    const flowEdges: FlowEdge[] = [];
    this.seccNodosBak = flowNodes;
    this.seccConecBak = flowEdges;
    this.seccNodosRuta = flowNodes;
    this.seccConecRuta = flowEdges;
    this.seccNodosDataSource = new ArrayStore({
      key: "id",
      data: flowNodes,
    });
    this.seccConecDataSource = new ArrayStore({
      key: "id",
      data: flowEdges,
    });
    this.diagLay.pageOrientation = "landscape";
    setTimeout(() => {
      this.diagLay.instance.option("zoomLevel", 1);
    }, 200);

  }

  opPrepararModificar(): void {
    this.readOnly = false;
    this.diagReadOnly = false;
    this.noValidar = true;

    // Ruta principal seleccionada
    let cntRutas = this.seccNodos.filter(n => n.id.toString().match('_pri'));
    if (cntRutas.length > 0) {
      this.rutaPriSelecc = cntRutas[0].id.toString().replace('cnt_','').replace('_pri','');
    }

    this.verRutasSelecionadas();

    // Secundarias
    // this.DRutasSimples = this.rutasPartes.filter((r:any) => r.PRIORIDAD === 'Secundaria');

    // Seleccionadas
    // cntRutas = this.seccNodos.filter(n => n.id.toString().match('_sec'));
    // if (cntRutas.length > 0) {
    //   this.lisSelRutasSimples = [];
    //   cntRutas.forEach((r: any) => {
    //     this.lisSelRutasSimples= [...this.lisSelRutasSimples, r.id.toString().replace('cnt_','').replace('_sec','')];
    //   });
    // }

    setTimeout(() => {
      this.noValidar = false;
    }, 500);

  }

  async opPrepararGuardar(accion: string) {
    this.loadingVisible = true;

    // Acción validación de datos
    if (!this.ValidaDatos("requerido")) {
      this.loadingVisible = false;
      return;
    };

    //valida integridad del Diagrama de la Ruta
    var resInte: boolean = false;
    const prm:any = { NODOS: this.seccNodosDataSource._array.map((n:any) => n.ITEM ), TIPO: 'Rutas Compuestas', ID_RUTA: this.DRutasProductos.ID_RUTA };
    const apiRest = this._rutasdpservice.valideLayoutRuta('INTEGRIDAD LAYOUT', prm, this.prmUsrAplBarReg.aplicacion);
    let res = await lastValueFrom(apiRest, {defaultValue: true});
    console.log(res);
    // res = JSON.parse(res); 
    if (res.ErrMensaje === ''){
      this.readOnly = false;
      resInte = true;
    } else {
      showToast(res.ErrMensaje, 'error');
      resInte = false;
    }
    if(!resInte) return;

    // Valida que las diferentes rutas cargadas se conecten entre si
    var nodErrFin: string[] = [];
    this.seccNodosRuta.forEach((nodr) => {
      const nodCon = this.seccConecRuta.filter( (c) => c.fromId === nodr.id && c.id.match("crp_") );
      if (nodCon.length > 0)
        nodErrFin.push(nodr.text);
    });
    if (nodErrFin.length > 1) {
      for (var k = 0; k < nodErrFin.length; k++)
      this.showModal('', "Guardando ruta", "<b>Debe conectar las ruta entre si.</b>")
      return;
    }

    this.DRutasProductos.TIPO = "Rutas Compuestas";
    const prmDatos = {
      ...this.DRutasProductos,
      ID_RUTA_ANTERIOR: this.IdRutaAnterior,
    };

    // Exporta imagen
    let imgdiagtmp = await new Promise((resolve, reject) => {
      this.diagLay.instance.exportTo('png', (data) => {
        return resolve(data);
      });
    }) 
    let itool = new imgtool(); 
    var imgdiag;
    await itool.removeImageBlanks(imgdiagtmp).then(data => { imgdiag = data });

    const datossencab = { JRUTAS_ENC: prmDatos, IMAGEN: imgdiag };
    const datosdiagrama = {
      JDIAGRAMA: {
        NODOS: JSON.stringify(this.seccNodosDataSource._array),
        CONECTORES: JSON.stringify(this.seccConecDataSource._array),
        NODOS_RUTA: JSON.stringify(this.seccNodosRuta),
        CONECTORES_RUTA: JSON.stringify(this.seccConecRuta),
      },
    };
    const prmDatosGuardar = JSON.parse(
      (JSON.stringify(datossencab) + JSON.stringify(datosdiagrama)).replace(
        /}{/g,
        ","
      )
    );

    // API guardado de datos
    var exito = false;
    this._rutasdpservice
      .save(accion, prmDatosGuardar)
      .pipe(takeUntil(this._unsubscribeAll), 
        catchError((err) =>{
          exito = false;
          return throwError(err.error)
        }))
      .subscribe((data) => {
        console.log('respuesta de guardado');
        console.log(data);  
        this.loadingVisible = false;
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== "") {
          this.showModal(res[0].ErrMensaje);
        } else {
          if (accion.match("new|copy")) {
            this.VDatosReg = [];
            this.VDatosReg.push(this.DRutasProductos);
          } else {
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1] = this.DRutasProductos;
          }
          this.DRutasProductos.DIAGRAMA = JSON.stringify({
            NODOS: this.seccNodosDataSource._array,
            CONECTORES: this.seccConecDataSource._array,
          });
          this.readOnly = true;
          this.diagReadOnly = true;

          // Operaciones de barra
          if (this.mnuAccion === 'new')
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              r_numReg: 1,
              r_totReg: 1,
              operacion: {}
            };
          else
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: "r_navegar",
              operacion: {}
            };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          showToast('Registro actualizado', 'success');
        }  

      });
  }

  async ValidaDatos(Accion: string) {
    var resValidatos:boolean = false;
    if (Accion === "requerido") {
      if (
        ( this.DRutasProductos.ID_RUTA === null ||
          this.DRutasProductos.ID_RUTA === undefined ||
          this.DRutasProductos.ID_RUTA === ""
        ) ||
        ( this.DRutasProductos.DESCRIPCION === null ||
          this.DRutasProductos.DESCRIPCION === undefined ||
          this.DRutasProductos.DESCRIPCION === ""
        ) ||
        ( this.DRutasProductos.ESTADO === null ||
          this.DRutasProductos.ESTADO === undefined ||
          this.DRutasProductos.ESTADO === ""
        )
      ) {
        this.showModal('',"Faltan datos","<b>Hay datos que faltan. Revisar contenido de datos de la ruta!</b>");
        return resValidatos = false;
      } else if (this.seccConecDataSource.length <= 0 || this.seccNodosDataSource.length <= 0) {
        this.showModal('',"Faltan datos","<b>Faltan datos. Revisar contenido de Diagrama de la ruta!</b>");
        return resValidatos = false;
      }
    }
    return resValidatos = true;
  }

  opPrepararBuscar(accion): void {
    if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Rutas Compuestas",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);

    } else {
      this._sfiltro.enConsulta = true;
      this.loadingVisible = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      arrFiltro.push({ CAMPO: "TIPO", EXPRESION: "Rutas Compuestas" });
      const prm = { RUTAS_PRODUCCION: arrFiltro };

      // Ejecuta búsqueda API
      this._rutasdpservice
        .consulta('consulta', prm, 'PRO014')
        .subscribe((resp: any) => {

          this._sfiltro.enConsulta = false;
          this.loadingVisible = false;
          const datares = JSON.parse(resp.data);

          if (datares[0].ErrMensaje !== '') {
            this.VDatosReg = [];
            this.opBlanquearForma();
            showToast(datares[0].ErrMensaje, 'error');
            this.prmUsrAplBarReg = {...this.prmUsrAplBarReg,
              accion: "r_ini",
              error: "",
              r_numReg: 0,
              r_totReg: 0,
              operacion: {}
            };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            return;
          }

          this.VDatosReg = [];
          this.VDatosReg = datares === null ? [] : datares;
          if (this.VDatosReg.length > 0) {
            this.DRutasProductos = this.VDatosReg[0];

            // Diagrama de las rutas asociadas
            try {
              this.modelDiagrama = JSON.parse(this.VDatosReg[0].DIAGRAMA);
            } catch (error) {
              this.modelDiagrama = {
                NODOS: [{}],
                CONECTORES: [{}],
                NODOS_RUTA: [{}],
                CONECTORES_RUTA: [{}],
              };
            }
          } else {
            this.DRutasProductos = {
              ID_RUTA: "",
              AUTO_CONSECUTIVO: 0,
              DESCRIPCION: "",
              ESTADO: "",
              TIPO: "",
              PRIORIDAD: "",
              SECCIONES: "",
              DIAGRAMA: "{}",
            };
            this.modelDiagrama = {
              NODOS: [{}],
              CONECTORES: [{}],
              NODOS_RUTA: [{}],
              CONECTORES_RUTA: [{}],
            };
          }

          // Trae el diagrama
          if (JSON.stringify(this.modelDiagrama.NODOS[0]) === "{}") {
            this.seccNodos = [];
            this.seccConec = [];
            this.seccNodosRuta = [];
            this.seccConecRuta = [];
          }
          else {
            this.seccNodos = this.modelDiagrama.NODOS;
            this.seccConec = this.modelDiagrama.CONECTORES;
          }
          this.seccNodosDataSource = new ArrayStore({
            key: "id",
            data: this.seccNodos,
          });
          this.seccConecDataSource = new ArrayStore({
            key: "id",
            data: this.seccConec,
          });
          this.seccNodosBak = JSON.parse(JSON.stringify(this.seccNodos));
          this.seccConecBak = JSON.parse(JSON.stringify(this.seccConec));
          this.readOnly = true;

          // Prepara la barra para navegación
          this.prmUsrAplBarReg = {...this.prmUsrAplBarReg,
            r_totReg: datares.length,
            r_numReg: 1,
            accion: 'r_navegar',
            operacion: {}
          }
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.opIrARegistro('r_primero');
        });
    }

    // this.readOnly = false;
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        this.prmUsrAplBarReg.r_numReg = 1;
        this.DRutasProductos = JSON.parse(JSON.stringify(this.VDatosReg[0]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.DRutasProductos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
        this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
          ? this.VDatosReg.length
          : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DRutasProductos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DRutasProductos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
          this.DRutasProductos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

        } 
        else {
          this.DRutasProductos = {
            ID_RUTA: "",
            AUTO_CONSECUTIVO: 0,
            DESCRIPCION: "",
            ESTADO: "",
            TIPO: "",
            PRIORIDAD: "",
            SECCIONES: "{}",
            DIAGRAMA: "{}",
          };
        }
        this.readOnly = true;
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        this.prmUsrAplBarReg.r_totReg--;
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length > 0) {
          this.DRutasProductos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        } else {
          this.DRutasProductos = {
            ID_RUTA: "",
            AUTO_CONSECUTIVO: 0,
            DESCRIPCION: "",
            ESTADO: "",
            TIPO: "",
            PRIORIDAD: "",
            SECCIONES: "{}",
            DIAGRAMA: "{}",
          };
        }
        break;

      default:
        break;
    }

    try {
      // Trae secciones asociadas a la ruta
      this.diagReadOnly = true;
      this.tipoAutoLayout = 'off';
      if (this.prmUsrAplBarReg.r_numReg >= 0 && this.VDatosReg.length !== 0)
        this.modelDiagrama = JSON.parse(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].DIAGRAMA);
      else {
        this.modelDiagrama = { NODOS:[],CONECTORES:[],NODOS_RUTA:[],CONECTORES_RUTA:[] };
        this.rutaPriSelecc = '';
      }

      if (JSON.stringify(this.modelDiagrama.NODOS[0]) === "{}") {
        this.seccNodos = [];
        this.seccConec = [];
        this.seccNodosRuta = [];
        this.seccConecRuta = [];
      }
      else {
        this.seccNodos = this.modelDiagrama.NODOS;
        this.seccConec = this.modelDiagrama.CONECTORES;
      }
      this.seccNodosDataSource = new ArrayStore({
        key: "id",
        data: this.seccNodos,
      });
      this.seccConecDataSource = new ArrayStore({
        key: "id",
        data: this.seccConec,
      });
      this.seccNodosBak = JSON.parse(JSON.stringify(this.seccNodos));
      this.seccConecBak = JSON.parse(JSON.stringify(this.seccConec));
      this.readOnly = true;

      // Ruta principal seleccionada
      let cntRutas = this.seccNodos.filter(n => n.id.toString().match('_pri'));
      if (cntRutas.length > 0) {
        const sr = cntRutas[0].id;
        this.rutaPriSelecc = sr.replace('cnt_','').replace('_pri','');
      } else {
        this.rutaPriSelecc = '';
      }

      // Rutas secundarias seleccionada
      // cntRutas = this.seccNodos.filter(n => n.id.toString().match('_sec'));
      // if (cntRutas.length > 0) {
      //   cntRutas.forEach(cnr => {
      //     const sr = cnr.id;
      //     this.lisSelRutasSimples = cntRutas.map(r => sr.replace('cnt_','').replace('_sec',''));
      //   })
      console.log(this.DRutasSimples);
      console.log(this.seccNodos);
      cntRutas = this.seccNodos.filter(n => n.id.toString().match('_sec'));

      
      
      if (cntRutas.length > 0) {
        
        this.verRutasSelecionadas();
        
        
        setTimeout(() => {
          const listGroup:any = this.listaRPartes.instance.option("items");

          console.log(listGroup);
        //   this.lisSelRutasSimples.forEach((ele:any) => {
        //     if (ele.includes("C") && ele !== this.rutaPriSelecc) {
        //       const npos:any = listGroup[0].items.findIndex((d:any) => 
        //         d.ID_RUTA === ele.includes("_") ? ele.split("_")[0] : ele
        //       )
        //       this.listaRPartes.instance.scrollToItem({
        //         group: 0,
        //         item: npos
        //       });
        //       return;
        //     }
        //     else if (ele.includes("S") && ele !== this.rutaPriSelecc) {
        //       const npos:any = listGroup[1].items.findIndex((d:any) => 
        //         d.ID_RUTA === ele.includes("_") ? ele.split("_")[0] : ele
        //       )
        //       this.listaRPartes.instance.scrollToItem({
        //         group: 1,
        //         item: npos
        //       });
        //       return;
        //     }
        //   });
          
        }, 500);

      } else {
        this.lisSelRutasSimples = [];
      }
      this.noValidar = true;


    } catch (err) {
      this.showModal(err);
      // this.vecNodosSelecc = [];
    }

  }

  verRutasSelecionadas(): void {
    let cntRutas = this.seccNodos.filter(n => n.id.toString().match('_sec'));
    this.lisSelRutasSimples = [];
      cntRutas.forEach((r: any) => {
        this.lisSelRutasSimples = [...this.lisSelRutasSimples, r.id.toString().replace('cnt_','').replace('_sec','')];
      });

      console.log(this.lisSelRutasSimples);
      console.log(this.mnuAccion);
      if(this.mnuAccion != 'new' && this.mnuAccion != 'update'){
        // 🚀 OPCIÓN MÁS RÁPIDA: Filtro nativo
        this.DRutasSimples = new DataSource({
          store: new ArrayStore({
            data: this.rutasPartes,
            key: 'ID_RUTA',
          }),
          filter: (item: any) => this.lisSelRutasSimples.includes(item.ID_RUTA),
          group: 'TIPO',
        });
      }else{      
        this.reordenarRutasSimples();
    }
  }

  private reordenarRutasSimples(): void {
  if (!this.rutasPartes || this.lisSelRutasSimples.length === 0) return;

  // Separar rutas seleccionadas y no seleccionadas
  const rutasSeleccionadas = this.rutasPartes.filter((ruta: any) => 
    this.lisSelRutasSimples.includes(ruta.ID_RUTA)
  );
  
  const rutasNoSeleccionadas = this.rutasPartes.filter((ruta: any) => 
    !this.lisSelRutasSimples.includes(ruta.ID_RUTA)
  );

  // Combinar: primero las seleccionadas, luego las no seleccionadas
  const rutasOrdenadas = [...rutasSeleccionadas, ...rutasNoSeleccionadas];

  // Actualizar el DataSource
  this.DRutasSimples = new DataSource({
    store: new ArrayStore({
      data: rutasOrdenadas,
      key: 'ID_RUTA',
    }),
    group: 'TIPO',
  });

  this.readOnly = false;
  console.log('🔄 Rutas reordenadas - Seleccionadas primero:', rutasSeleccionadas.length);
}

  opEliminar(): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html: "¿Desea eliminar la Ruta de producto <i>" +
            this.DRutasProductos.ID_RUTA +
            " " +
            this.DRutasProductos.DESCRIPCION +
            "</i> ?",
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

    // API eliminación de datos
    const prm = { ID_RUTA: this.DRutasProductos.ID_RUTA };
    this._rutasdpservice
      .delete(prm)
      .pipe(takeUntil(this._unsubscribeAll), 
          catchError((err) =>{
            this.showModal(err.error);
            return throwError(() => new Error(err.error))
        }))
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        this.opIrARegistro("Eliminado");
        this.readOnly = true;
        showToast('Ruta eliminada', 'success');

        // Operaciones de barra
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          error: "",
          accion: this.prmUsrAplBarReg.r_totReg !== 0 ? 'r_navegar' : 'r_ini',
          operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    });
  }
  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      Titulo: "Productos",
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: '',
      Filtro: '',
      keyGrid: ['PRODUCTO']
    };
  }

  // Valide unicidad de la llave
  async ValideExistencia(e: any) {
    if (e.value === '' && this.mnuAccion !== '') {
      this.readOnly = true;
      this.diagReadOnly = true;
      return false;
    }
    if (!this.mnuAccion.match('new|update')) {
      this.readOnly = true;
      this.diagReadOnly = true;
      return true;
    }
    if (this.mnuAccion === 'update' && this.DRutasProductos.ID_RUTA === e.value) {
      this.readOnly = true;
      this.diagReadOnly = true;
      return true;
    }

    // Valida la existencia de la llave respectiva
    const prm = { ID_RUTA: e.value, accion: this.mnuAccion };
    const apiRest = this._rutasdpservice.validellave('EXISTE RUTA',prm,'PRO013');
    let res = await lastValueFrom(apiRest, {defaultValue: true});
    res = JSON.parse(res.data); 
    if (res[0].ErrMensaje === ''){
      this.readOnly = false;
      return true;
    } else {
      this.readOnly = true;
      this.diagReadOnly = true;
      showToast(res[0].ErrMensaje, 'error');
      return false;
    }
  
  }

  onSeleccEstado(e: any): void {
    this.DRutasProductos.ESTADO = e.value;
  }

  dragEnd(unit: any, sizes: any): any {
    // const ed = this.diagLay.instance.element();
    // ed.style.width = sizes[1];
    this.diagLay.instance.repaint();
  }
  onIniDiagrama(e: any): any {
    // console.log(e);
    // this.diagLay.instance.repaint();
  }
  itemStyleExpr(obj: any) {
    return { stroke: "#e6e0e0" };
  }
  onContentReady(e: any) {
    e.component.option("autoZoomMode", "fitContent");
    e.component.option("autoZoomMode", "disabled");
  }

  autoSaveTimeout: any = -1;
  onOptionChanged(e: any) {
    this.autoSaveTimeout = setTimeout(() => {
      // console.log(e);
    }, 500);
  }
  // onItemClick(e: any) {
  //   this.highlightIsActive = false;
  //   this.nodoSeccionAccion = e.item.dataItem.id;
  // }
  // onItemDblClick(e: any) {
  //   const seccNueva = e.item.dataItem.id;
  //   this.nodoSeccionAccion = e.dataItem.id;
  // }
  requestLayoutUpdateHandler(e: any) {
    let permitir = true;
    for (var k=0; k < e.changes.length; k++) {
      if(e.changes[k].type === 'insert') {
        // Valida si es un conector
        if (e.changes[k].data.fromId !== undefined && e.changes[k].data.toId !== undefined) {

          // Valida si ya existe un conector inter-rutas
          // let norg = this.seccNodosDataSource._array.findIndex((c:any) => c.id === e.changes[k].data.fromId);
          // let cnt = '';
          // if (norg !== -1) cnt = this.seccNodosDataSource._array[norg].contenedor;
          // const cinter:any [] = this.seccConecDataSource._array.filter((c:any) => c.id.toString().match('int_'));
          // if (cinter !== undefined && cinter !== null && cinter.length > 0) {
          //   cinter.forEach((cn:any) => {
          //     const cnex = this.seccNodosDataSource._array.findIndex((n:any) => n.id === cn.fromId && n.contenedor === cnt);
          //     if (cnex !== -1) {
          //       permitir = false;
          //       const cnex = this.seccConec.findIndex((n:any) => n.id === e.changes[k].data.id);
          //       if (cnex !== -1) {
          //         this.seccConec.splice(cnex,1);
          //         this.seccConecDataSource = new ArrayStore({
          //           key: "id",
          //           data: this.seccConec,
          //         });
          //       }
          //     }
          //   })
          // }

          // Aplica cambio
          if (permitir) {
            e.changes[k].data.conecStyle = {"stroke-linejoin": "miter",
                                            "stroke": "#0ec308",
                                            "stroke-width": "2",
                                            "stroke-miterlimit":"4", 
                                            "stroke-dasharray": "10,2"
            };
            e.changes[k].data.tipoFlecha = 'filledTriangle';
            e.changes[k].data.id = 'int_' + e.changes[k].data.fromId + '_' + e.changes[k].data.toId;
            e.changes[k].data.key = 'int_' + e.changes[k].data.fromId + '_' + e.changes[k].data.toId;
            e.changes[k].key = 'int_' + e.changes[k].data.fromId + '_' + e.changes[k].data.toId;
            e.allowed = true;
          } else {
            e.allowed = false;
          }

          // Refresca cambios
          this.seccConecDataSource = new ArrayStore({
            key: "id",
            data: this.seccConec,
          });
          // this.diagLay.instance.repaint();
        }
      }
    }
  }

  requestEditOperationHandler(e: any) {
    // Valida si ya hay una conexion inter-rutas
    if (e.operation === "changeConnection") {
      if (e.reason === "modelModification") {
        if (e.args.connectorPosition === 'start' && e.args.connectionPointIndex !== -1) {
          let norg = this.seccNodosDataSource._array.findIndex((c:any) => c.id === e.args.newShape.key);

          // Verifica que de una Ruta Primaria no pueden salir conectores para otra ruta
          if (this.seccNodosDataSource._array[norg].contenedor.match('_pri')) {
            e.allowed = false;
            setTimeout(() => {
              showToast('No se permiten conectores de salida desde una ruta primaria!', 'error');
              const cnex = this.seccConec.findIndex((n:any) => n.id === e.args.connector.id);
              if (cnex !== -1) {
                this.seccNodos.splice(cnex,1);
              }
            }, 100);
            return;
          }

          // Valida otro conector inter-rutas
          // let cnt = '';
          // if (norg !== -1) cnt = this.seccNodosDataSource._array[norg].contenedor;
          // const cinter = this.seccConecDataSource._array.filter((c:any) => c.id.toString().match('int_'));
          // if (cinter !== undefined) {
          //   cinter.forEach((cn:any) => {
          //     const cnex = this.seccNodosDataSource._array.findIndex((n:any) => n.id === cn.fromId && n.contenedor === cnt);
          //     if (cnex !== -1) {
          //       showToast('Ya existe un conector de unión entre rutas', 'warning');
          //       e.allowed = false;
          //       const cnex = this.seccConec.findIndex((n:any) => n.id === e.args.connector.id);
          //       if (cnex !== -1) {
          //         this.seccNodos.splice(cnex,1);
          //       }
          //     }
          //   })
          // }
        } else if (e.args.connectorPosition === 'end' && e.args.connectionPointIndex !== -1) {
          //Valida que no conecte las mismas secciones
          const posFromId:any = this.seccNodosDataSource._array.findIndex((n:any) => n.id === e.args.connector.fromKey);
          const posToId:any = this.seccNodosDataSource._array.findIndex((n:any) => n.id === e.args.connector.toKey);
          if(posFromId !== -1 && posToId !== -1) {
            //valida que sean nodos de diferentes contenedores
            if(this.seccNodosDataSource._array[posFromId].contenedor === this.seccNodosDataSource._array[posToId].contenedor) {
              showToast('No puede conectar secciones de la misma ruta', 'warning');
              e.allowed = false;
              // const cnex = this.seccConec.findIndex((n:any) => n.id === e.args.connector.id);
              // if (cnex !== -1) {
              //   this.seccNodos.splice(cnex,1);
              // }
            } else if(this.seccNodosDataSource._array[posFromId].ITEM === this.seccNodosDataSource._array[posToId].ITEM) {
              showToast('No puede conectar la misma sección entre si', 'warning');
              e.allowed = false;
              // const cnex = this.seccConec.findIndex((n:any) => n.id === e.args.connector.id);
              // if (cnex !== -1) {
              //   this.seccNodos.splice(cnex,1);
              // }
            };
          };
        }
      }
    }

    // Si elimina un contenedor, eliminar sus hijos
    if (e.operation === "deleteShape") {
      if (e.args.shape.type.match('horizontalContainer|verticalContainer')) {

        // Confirma eliminación
        Swal.fire({
          title: '',
          text: '¿Desea eliminar ruta principal?',
          icon: 'warning',
          showCancelButton: true,
					confirmButtonColor: '#DF3E3E',
					cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
          if (!result.isConfirmed) {
            e.allowed = false;
            return;
          }
          else {
            this.eliminarContenedor(e.args.shape.key);
            e.allowed = true;
            return;
          }
        });

        e.allowed = false;
      }
    }

  }

  // Eliminar contenedor
  eliminarContenedor(idCnt) {
    // Nodos hijo
    let nodHijo = this.seccNodos.filter(n => n.contenedor === idCnt);
    nodHijo.forEach(nod => {
      // Elimina primero los conectores asociados al nodo
      let connAso = this.seccConec.filter(c => c.fromId === nod.id || c.toId === nod.id);
      connAso.forEach(con => {
        const ic = this.seccConec.findIndex(c => c.id === con.id);
        this.seccConec.splice(ic,1);
      })

      // Elimina el nodo
      const ins = this.seccNodos.findIndex(n => n.id === nod.id);
      this.seccNodos.splice(ins,1);
    })

    // Eliminar contenedor
    const ins = this.seccNodos.findIndex(n => n.id === idCnt);
    this.seccNodos.splice(ins,1);

    // Refresca diagrama
    this.seccNodosDataSource = new ArrayStore({
      key: "id",
      data: this.seccNodos,
    });
    this.seccConecDataSource = new ArrayStore({
      key: "id",
      data: this.seccConec,
    });
    this.diagLay.instance.repaint();
    
  }

  // Busca e identifica el nodo de la seccion de acuerdo el click
  // ubicarNodoSeccion(): boolean {
  //   var ret: boolean = true;
  //   try {
  //     var elemDiag: any;
  //     var nodoDiag: any;
  //     elemDiag = document.elementFromPoint(this.modelPoint.x, this.modelPoint.y) as HTMLElement;
  //     if (!elemDiag.matches('path')) {
  //       elemDiag = document.elementFromPoint(this.modelPoint.x-10, this.modelPoint.y-10) as HTMLElement;
  //       nodoDiag = elemDiag.parentElement;
  //       var nodoHtml = nodoDiag.outerHTML;
  //       var doc = new DOMParser().parseFromString(nodoHtml, "text/xml");
  //       const textNodo = doc.getElementsByTagName("text")[0].getAttribute("appliedText");
  //       const nodoSelecc = this.seccNodosRuta.find((f) => f.text == textNodo);
  //       if (nodoSelecc) {
  //         this.nodoSeccionAccion = nodoSelecc.id;
  //         if(nodoSelecc.bloqSeccion)
  //           this.menuCommSeccion = [true, false];
  //         else if(!nodoSelecc.bloqSeccion)
  //           this.menuCommSeccion = [false, true];
  //       } else {
  //         const nodoSelecc = this.seccNodos.find((f) => f.text == textNodo);
  //         if (nodoSelecc) {
  //           if (!nodoSelecc.id.toString().match("cnt_")) {
  //             this.nodoSeccionAccion = nodoSelecc.id;
  //             if(nodoSelecc.bloqSeccion)
  //               this.menuCommSeccion = [true, false];
  //             else if(!nodoSelecc.bloqSeccion)
  //               this.menuCommSeccion = [true, false];
  //           }
  //           else
  //             ret = false;
  //         }
  //         if (!ret) {
  //           this.nodoSeccionAccion = "";
  //           this.menuCommSeccion = [false, false];
  //         }
  //       }
  //     } else {
  //       const itemConn = this.diagLay.instance.getSelectedItems();
  //       const conecSelecc = this.seccConecRuta.find((f) => f.id == itemConn[0].dataItem.id);
  //       if (conecSelecc) {
  //         // this.conecSeccionAccion = conecSelecc.id;
  //         if(conecSelecc.bloqConn)
  //           this.menuCommSeccion = [false, false];
  //         else if(!conecSelecc.bloqConn)
  //           this.menuCommSeccion = [false, false];
  //       } else {
  //         const conecSelecc = this.seccConec.find((f) => f.id == itemConn[0].dataItem.id);
  //         if (conecSelecc) {
  //           // if (conecSelecc.id.toString().match("clp_")) {
  //             // this.conecSeccionAccion = conecSelecc.id;
  //             if(conecSelecc.bloqConn)
  //               this.menuCommSeccion = [false, false];
  //             else if(!conecSelecc.bloqConn)
  //               this.menuCommSeccion = [false, false];
  //           // }
  //           // else
  //           //   ret = false;
  //         }
  //         if (!ret) {
  //           this.nodoSeccionAccion = "";
  //           this.menuCommSeccion = [false, false];
  //         }
  //       }
  //     }
  //     return ret;

  //   } catch (error) {
  //     this.nodoSeccionAccion = "";
  //     this.menuCommSeccion = [false, false];
  //     return false;
  //   }

  // }

  selectionChangedHandler(e:any) {
    this.nodoSeccionAccion = e.items.filter((item) => item.itemType === 'shape');
  }

  onCustomMenuDiag(e: any) {
    if (this.nodoSeccionAccion.length > 0) {
      switch (e.name) {
        case "bloquear_secc":
        case "desbloquear_secc":
          for (let i = 0; i < this.nodoSeccionAccion.length; i++) {
            // const element = this.nodoSeccionAccion[i];
            this.bloquearNodo(this.nodoSeccionAccion[i].key, e.name);
          }
          this.nodoSeccionAccion = [];
          break;
        case "desbloquear_con":
          // this.bloquearConn(this.conecSeccionAccion, e.name);
          break;
        default:
          break;
      } 
    } else {
      showToast('Seleccione una sección.', 'error');
    }
  }

  bloquearNodo(nodo:any, name:string) {
    if(name === 'bloquear_secc') {
      // Aplica cambios al diagrama
      const npos:any = this.seccNodos.findIndex((d:any) => d.id === nodo);
      if(npos !== -1)
        this.seccNodos[npos].bloqSeccion = true;

      this.seccNodosDataSource = new ArrayStore({
        key: "id",
        data: this.seccNodos,
      });
      // this.diagLay.instance.repaint();
    } else if(name === 'desbloquear_secc') {
      // Aplica cambios al diagrama
      const npos:any = this.seccNodos.findIndex((d:any) => d.id === nodo);
      if(npos !== -1)
        this.seccNodos[npos].bloqSeccion = false;

      this.seccNodosDataSource = new ArrayStore({
        key: "id",
        data: this.seccNodos,
      });
      // this.diagLay.instance.repaint();
    }
  }

  // Agrega ruta de parte al diagrama
  onSelecRutasSimples(e: any, opcion = 'secundaria'): any {
    console.log(e.addedItems);
    if(this.mnuAccion.match('new|update')) {

      //si marca una ruta segundaria
      if ((e.addedItems !== null) && (e.addedItems !== undefined) && (e.addedItems.length > 0)) {
        const keys = e.addedItems;
    
        if (opcion !== 'principal') {
          keys.forEach((elr: any) => {
            this.lisSelRutasSimples = [...this.lisSelRutasSimples, elr.ID_RUTA];
          });
          const remkeys = e.removedItems;
          remkeys.forEach((elr: any) => {
            if (this.lisSelRutasSimples.length !== 0) {
              const ix = this.lisSelRutasSimples.findIndex(elr.ID_RUTA);
              this.lisSelRutasSimples.splice(ix, 1);
            }
          });
        }
  
        // Valida que no haya sido agregada
        const cntRutas = this.seccNodos.filter(n => n.id.toString().match('cnt_'+keys[keys.length - 1].ID_RUTA+'_'));
        if (cntRutas.length > 0) {
          this.showModal('Ya fue añadida esta ruta!');
          for(var k=0; k < this.lisSelRutasSimples.length; k++) {
            if (this.lisSelRutasSimples[k] === keys[keys.length - 1].ID_RUTA)
              this.lisSelRutasSimples.splice(k,1);
          }
          return
        }
        
        // Carga el diagrama
        this._rutasdpservice
        .consulta("diagrama ruta parte", {
          accion: "diagrama ruta parte",
          ID_RUTA: keys[keys.length - 1].ID_RUTA,
        }, 'PRO014')
        .subscribe((resp) => {
          this.modelDiagrama = JSON.parse(resp.data);
    
          // Agrega layout al diagrama
          this.agregarLayout(
            keys[keys.length - 1].ID_RUTA,
            keys[keys.length - 1].DESCRIPCION,
            opcion,
            keys[keys.length - 1]
          );
        });
        
      };
  
      //si desmarca una ruta segundaria
      if ((e.removedItems !== null) && (e.removedItems !== undefined) && (e.removedItems.length > 0)) {
        const remkeys = e.removedItems;
        remkeys.forEach((elr: any) => {
          if (this.lisSelRutasSimples.length !== 0) {
            const ix = this.lisSelRutasSimples.indexOf(elr.ID_RUTA);
            this.lisSelRutasSimples.splice(ix, 1);
          }
        });
        e.removedItems.forEach((ruta:any) => {
  
          //verifica el id del layout de la ruta para eliminar
          const idRutaBusq:any = "cnt_" + ruta.ID_RUTA + (opcion === 'principal' ? '_pri' : '_sec');
          const rutaBusq:any [] = this.seccNodos.filter((s:any) => s.id === idRutaBusq || s.contenedor === idRutaBusq);
  
          // Carga las secciones(Nodos) de ese contenedor para eliminarlas
          rutaBusq.forEach((seccNodo:any) => {

            // Carga los conectores de la ruta para eliminarlos
            const conecBusq:any [] = this.seccConec.filter((s:any) => s.fromId === seccNodo.id || s.toId === seccNodo.id);

            //elimina los conectores
            conecBusq.forEach((conec:any) => {
              const npos:any = this.seccConec.findIndex((s:any) => s.id === conec.id);
              if(npos !== -1)
                this.seccConec.splice(npos, 1);
            });

            //elimina los nodos
            const nod:any [] = this.seccNodos.filter((s:any) => s.id === seccNodo.id || s.contenedor === seccNodo.id);
            nod.forEach((ele:any) => {
              const posNodo:any = this.seccNodos.findIndex((s:any) => s.id === ele.id || s.contenedor === ele.id);
              if(posNodo !== -1)
                this.seccNodos.splice(posNodo, 1);

              // Carga los conectores de la ruta para eliminarlos
              const conecBusq:any [] = this.seccConec.filter((s:any) => s.fromId === ele.id || s.toId === ele.id);

              //elimina los conectores
              conecBusq.forEach((conec:any) => {
                const npos:any = this.seccConec.findIndex((s:any) => s.id === conec.id);
                if(npos !== -1)
                  this.seccConec.splice(npos, 1);
              });

            });
          });

          // Elimina container
          const posConta:any = this.seccNodos.findIndex((s:any) => s.id === idRutaBusq);
          if(posConta !== -1)
            this.seccNodos.splice(posConta, 1);
  
          // Refresca diagrama
          this.seccNodosDataSource = new ArrayStore({
            key: "id",
            data: this.seccNodos,
          });
          this.seccConecDataSource = new ArrayStore({
            key: "id",
            data: this.seccConec,
          });
          this.tipoAutoLayout = 'off';
            
          this.seccNodosBak = JSON.parse(JSON.stringify(this.seccNodos));
          this.seccConecBak = JSON.parse(JSON.stringify(this.seccConec));
          
        });
      }

    };
  }

  // Agrega layout como un container
  childCnt: childFlowNode[] = [];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  iniX: number = 50;
  iniY: number = 50;
  agregarLayout(IdRuta: string, NomRuta: string, opcion: string, selRuta: any) {
    let nodoCnt = this.seccNodos.filter(
      (s) => s.type === "horizontalContainer"
    );
    const numCnt = nodoCnt !== undefined ? nodoCnt.length : 0;

    // Valida si tiene nodos
    if (this.modelDiagrama.NODOS_PARTE.length === 0) {
      this.showModal('Esta ruta no tiene secciones asociadas!');
      for(var k=0; k < this.lisSelRutasSimples.length; k++) {
        if (this.lisSelRutasSimples[k] === IdRuta)
          this.lisSelRutasSimples.splice(k,1);
      }
      return;
    }

    // Valida que ho existan secciones repetidas en el mismo contenedor
    let msg_rep = '';
    this.modelDiagrama.NODOS_PARTE.forEach((nodo:any) => {
      const exis = this.seccNodos.find(r => r.id === nodo.id && r.contenedor === nodo.contenedor);
      if (exis !== undefined) {
        msg_rep += '<tr><td style="width: 30%;">' + nodo.id + '</td><td>' + nodo.text + '</td></tr>'
      }
    });
    if (msg_rep !== '') {
      msg_rep = '<head>'+
                '<style>'+
                'tr:nth-child(even) {background: #e4f3fa}'+
                'tr:nth-child(odd) {background: white}'+
                'tr:first-child {'+
                '  background-color: #b4ddf2;'+
                '}'+
                '</style>'+
                '</head><table style="text-align: left; width: 100%;"><tr><th>Id. Ruta</th><th>Nombre</th></tr>' +  msg_rep + '</table>';
      this.showModal('','Se intenta asignar una ruta de parte con secciones que ya existen en la ruta del producto:',msg_rep);
      for(var k=0; k < this.lisSelRutasSimples.length; k++) {
          if (this.lisSelRutasSimples[k] === IdRuta)
            this.lisSelRutasSimples.splice(k,1);
        }
      return;
    }
    // Valida los conectores por secciones de la ruta
    var newConn:any = [];
    this.modelDiagrama.NODOS_PARTE.forEach((nodo:any) => {
      var conecToID:any = this.modelDiagrama.CONECTORES_PARTE.filter((d:any) => d.toId === nodo.id);
      var conecFromID:any = this.modelDiagrama.CONECTORES_PARTE.filter((d:any) => d.fromId === nodo.id);
      conecToID.forEach((con:any) => {
        const npos:any = this.modelDiagrama.CONECTORES_PARTE.findIndex((c:any) => c.id === con.id);
        if(npos !== -1) {
          //modifica el toID y el id del conector
          this.modelDiagrama.CONECTORES_PARTE[npos].toId = IdRuta + '_' + nodo.id;
          this.modelDiagrama.CONECTORES_PARTE[npos].id = 'crp_' + this.modelDiagrama.CONECTORES_PARTE[npos].toId + '_' + this.modelDiagrama.CONECTORES_PARTE[npos].fromId;
        }
      });
      conecFromID.forEach((cone:any) => {
        const npo:any = this.modelDiagrama.CONECTORES_PARTE.findIndex((c:any) => c.id === cone.id);
        if(npo !== -1) {
          //modifica el toID y el id del conector
          this.modelDiagrama.CONECTORES_PARTE[npo].fromId = IdRuta + '_' + nodo.id;
          this.modelDiagrama.CONECTORES_PARTE[npo].id = 'crp_' + this.modelDiagrama.CONECTORES_PARTE[npo].toId + '_' + this.modelDiagrama.CONECTORES_PARTE[npo].fromId;
        }
      });
      
      //se tienen los nodos internos del contenedor para actualizar el id
      const nodos:any = this.modelDiagrama.NODOS_PARTE.filter((d:any) => d.contenedor === nodo.id);

      //valida si ya existe una ruta principal agregada y segun eso asigna el id solo en las compuestas
      if (IdRuta.match('RC')) {
        const ctnPrincipal:any [] = this.seccNodos.filter((d:any) => d.type === 'horizontalContainer');
        var existCtnPrin:boolean = false;
        if (ctnPrincipal.length > 0) {
          ctnPrincipal.forEach((ele:any) => {
            if (ele.id.match('_pri'))
              existCtnPrin = true;
          });
        }
        if (existCtnPrin) {
          nodo.id = IdRuta + '_' + nodo.id.replace('_pri', '_sec');
          nodo.itemStyleExpr = { stroke: '#e6e0e0' };
        } else {
          nodo.id = IdRuta + '_' + nodo.id;
        }
      } else {
        nodo.id = IdRuta + '_' + nodo.id;
      }
      nodo.ITEM = nodo.id;

      //se actuliza el id del contenedor en los nodos internos
      nodos.forEach((nod:any) => {
        const pos:any = this.modelDiagrama.NODOS_PARTE.findIndex((d:any) => d.id === nod.id);
        this.modelDiagrama.NODOS_PARTE[pos].contenedor = nodo.id;
      });
    });
    //valida que cada conector tenga su seccion de inicio y fin
    this.modelDiagrama.CONECTORES_PARTE.forEach((conector:any) => {
      const posFromId = this.modelDiagrama.NODOS_PARTE.findIndex((n:any) => n.id === conector.fromId);
      const posToId = this.modelDiagrama.NODOS_PARTE.findIndex((n:any) => n.id === conector.toId);
      if(posFromId !== -1 && posToId !== -1) {
        if(newConn.findIndex((c:any) => c.id === conector.id) === -1)
          newConn.push(JSON.parse(JSON.stringify(conector)));
      }
    });
    // Reasigna los conectores con nuevos id
    this.modelDiagrama.CONECTORES_PARTE = newConn;

    // Nodos y conectores del diagrama
    this.seccNodosLay =
      JSON.stringify(this.modelDiagrama.NODOS_PARTE[0]) === "{}"
        ? []
        : this.modelDiagrama.NODOS_PARTE;
    this.seccConecLay =
      JSON.stringify(this.modelDiagrama.CONECTORES_PARTE[0]) === "{}"
        ? []
        : this.modelDiagrama.CONECTORES_PARTE;
    this.seccNodosLay.forEach((nod) => {
      this.seccNodosBak = [
        ...this.seccNodosBak,
        JSON.parse(JSON.stringify(nod)),
      ];
    });

    // Crea container y agrega los nodos si la ruta es simple
    // if (IdRuta.match('RS|S')) {
      this.seccNodosLay.forEach((nod) => {
        nod.contenedor = "cnt_" + IdRuta + (opcion === 'principal' ? '_pri' : '_sec');
      });
    // }

    // Contenedor --> Ruta de partes -- Coordenadas y tamaño
    this.minX = Number(
      this.seccNodosLay.reduce((ant, act) => {
        return Number(ant.x) < Number(act.x) ? ant : act;
      }).x
    );
    this.minY = Number(
      this.seccNodosLay.reduce((ant, act) => {
        return Number(ant.y) < Number(act.y) ? ant : act;
      }).y
    );
    let obj = this.seccNodosLay.reduce((ant, act) => {
      return Number(ant.x) + Number(ant.width) >
        Number(act.x) + Number(act.width)
        ? ant
        : act;
    });
    this.maxX = Number(obj.x) + Number(obj.width);
    obj = this.seccNodosLay.reduce((ant, act) => {
      return Number(ant.y) + Number(ant.height) >
        Number(act.y) + Number(act.height)
        ? ant
        : act;
    });
    this.maxY = Number(obj.y) + Number(obj.height) - Number(this.minY) + 40;
    this.elemNodo = {
      id: "cnt_" + IdRuta + (opcion === 'principal' ? '_pri' : '_sec'),
      text: NomRuta,
      type: "horizontalContainer",
      x: this.iniX.toString(),
      y: (this.minY - 10).toString(),
      width: (this.maxX + 10).toString(),
      height: (this.maxY + 50).toString(),
      itemStyleExpr: opcion === 'principal' ? { stroke: '#bf49eb' } : { stroke: '#e6e0e0' }
    };

    // Si hay mas de un contenedor ubicar el siguiente
    if (numCnt !== 0) {
      let obj = nodoCnt.reduce((ant, act) => {
        return Number(ant.y) + Number(ant.height) >
          Number(act.y) + Number(act.height)
          ? ant
          : act;
      });
      this.maxY = Number(obj.y) + Number(obj.height) + 30;
    } else {
      this.maxY = this.iniY;
    }

    // Define posición y tamaño nuevo container
    this.elemNodo.y = (this.maxY).toString();

    // Reasigna coordenadas de los nodos en el nuevo container
    this.seccNodosLay.forEach((nod) => {
      nod.y = ((Number(nod.y) - this.minY + 20) + this.maxY).toString();
      nod.x = (Number(nod.x) - this.minX + 100).toString();
    });

    // Agrega los nodos al contenedor nuevo si la ruta es compuesta
    if (IdRuta.match('RC')) {
      this.seccNodosLay.forEach((nod) => {
        if (nod.type === 'horizontalContainer')
          nod.contenedor = this.elemNodo.id;
      });
    }

    // Agrega secciones - nodos
    this.seccNodos = [...this.seccNodos, this.elemNodo];
    this.seccNodosLay.forEach((nod) => {
      this.seccNodos = [...this.seccNodos, nod];
    });
    this.seccNodosDataSource = new ArrayStore({
      key: "id",
      data: this.seccNodos,
    });

    this.seccConecLay.forEach((conn) => {
      if(opcion === 'principal')
        conn.conecStyle = "stroke: #0ec308; stroke-width: 1";
      else
        conn.conecStyle = "stroke: rgba(18,94,220,.75); stroke-width: 1";
      conn.bloqConn = true;
      conn.tipoFlecha = 'filledTriangle';
      conn.pointsConec?.forEach(punto => {
        punto.x = Number(punto.x) - this.minX + 100;
        punto.y = Number(punto.y) - this.minY + 20 + this.maxY;
      });
      this.seccConec = [...this.seccConec, conn];
    });
    this.seccConecDataSource = new ArrayStore({
      key: "id",
      data: this.seccConec,
    });
    // this.diagLay.instance.repaint();
    this.tipoAutoLayout = 'off';

    setTimeout(() => {
      this.diagLay.instance.option("zoomLevel", 1);
    }, 200);

  }

  // Ruta parte principal, muestra las demás como secundarias en la lista
  valueRutaPpal(e: any) {
    if(this.mnuAccion.match('new|update')) {
      console.log("---------- this.seccNodos -----------");
      console.log(this.seccNodos);
      if ((e.value === '') || (e.value === null) || (e.value === undefined) || (e.value.length <= 0)) {
        this.seccNodos.splice(0, this.seccNodos.length);
        this.seccConec.splice(0, this.seccConec.length);
        this.seccConecBak.splice(0, this.seccConecBak.length);
        const flowNodes: FlowNode[] = [];
        const flowEdges: FlowEdge[] = [];
        this.seccNodosBak = flowNodes;
        this.seccConecBak = flowEdges;
        this.seccNodosRuta = flowNodes;
        this.seccConecRuta = flowEdges;
        this.seccNodosDataSource = new ArrayStore({
          key: "id",
          data: flowNodes,
        });
        this.seccConecDataSource = new ArrayStore({
          key: "id",
          data: flowEdges,
        });

        console.log("---------- this.seccNodosDataSource despues de limpiar -----------");
        console.log(this.seccNodosDataSource);
        // Filtra solo las secundarias
        // this.DRutasSimples = this.rutasPartes.filter((r:any) => r.PRIORIDAD === 'Secundaria');
        this.lisSelRutasSimples = [];
        this.diagReadOnly = true;
        return;
      }

      // Valida que no haya sido agregada
      let cntRutas = this.seccNodos.filter(n => n.id.toString().match('_pri'));
      if (cntRutas.length > 0) {
        this.showModal('Ya existe una Ruta principal asignada! ['+cntRutas[0].text+']');
        return
      }
  
      // Valida que no haya sido agregada
      cntRutas = this.seccNodos.filter(n => n.id.toString().match('cnt_'+e.value.ID_RUTA+'_'));
      if (cntRutas.length > 0) {
        this.showModal('Ya fue añadida esta ruta!');
        return
      } else {
        // Filtra solo las secundarias
        const newArray:any = this.rutasPartes.filter((r:any) => r.ID_RUTA !== e.value);
        this.DRutasSimples = new DataSource({
          store: new ArrayStore({
            data: newArray,
            key: 'ID_RUTA',
          }),
          group: 'TIPO',
        });

        // Adiciona al diagrama
        const nx = this.rutasPartes.findIndex((r:any) => r.ID_RUTA === e.value);
        this.onSelecRutasSimples({ addedItems: [{ ID_RUTA: e.value, DESCRIPCION: this.rutasPartes[nx].NOMBRE}] }, 'principal' );
        this.diagReadOnly = false;
        setTimeout(() => {
          this.tipoAutoLayout = 'tree';
        }, 300);
      }

    }


  }
 
  showVistaRutas(e:any, cellInfoRuta:any) {
    this._srutas.setObs_VisorRutas({ TITULO: 'Vista de Ruta',
                                      VISIBLE: true,
                                      DATO: cellInfoRuta,
                                      ID_APLICACION: this.prmUsrAplBarReg.aplicacion
                                    });
  }
  
  ngOnInit() {
    // Respuesta del visor de datos
    this.SVisor.setObsVisor
    .pipe(takeUntil(this._unsubscribeAll))
    .subscribe((resp) => {
      this.prmUsrAplBarReg.r_numReg = resp;
      this.opIrARegistro("IrA");
    });
    this.DRutasProductos = {
      ID_RUTA: '',
      AUTO_CONSECUTIVO: 0,
      DESCRIPCION: '',
      ESTADO: '',
      TIPO: '',
      PRIORIDAD: '',
      SECCIONES: '',
      DIAGRAMA: '',
      ID_LAYOUT: '',
    }
    const user:any = localStorage.getItem("usuario")
    this.prmUsrAplBarReg = {
      tabla: "RUTAS_PRODUCCION",
      aplicacion: "PRO-014",
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
    this.VDatosReg = [];
    this.menuCommSeccion = [true, false];

    // Trae datos de rutas simples
    this.valoresObjetos('rutas simples');

  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string){
    if (obj == 'rutas simples' || obj == 'todos') {
      this._rutasdpservice
      .consulta("rutas simples", { accion: "rutas simples", ID_RUTA: "" }, 'PRO014')
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const rutasActivas = res.filter((ruta: any) => ruta.ESTADO === 'ACTIVO');
        this.rutasPartes = rutasActivas;
        this.DRutasSimples = new DataSource({
          store: new ArrayStore({
            data: rutasActivas,
            key: 'ID_RUTA',
          }),
          group: 'TIPO',
        });
        this.listaRutaPpal = new DataSource({
          store: new ArrayStore({
            data: rutasActivas,
            key: 'ID_RUTA',
          }),
          group: 'TIPO',
        });

        console.log('Rutas DRutasSimples cargadas', this.DRutasSimples);
      });
    };
    if (obj === 'consecutivo') {
      const prm = {ID_APLICACION: this.prmUsrAplBarReg.aplicacion, CLASE: 'Rutas Compuestas' };
      this._rutasdpservice.getConsecutivo('CONSECUTIVO',prm,this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if (res.ErrMensaje !== '') {
          this.showModal(res.ErrMensaje);
        } else {
          if(res.CONSECUTIVO !== 0) {
            this.DRutasProductos.ID_RUTA = res.VAR_CONSECUTIVO;
            this.DRutasProductos.AUTO_CONSECUTIVO = res.CONSECUTIVO;
          } else {
            this.DRutasProductos.ID_RUTA = 'xxxxxxxx';
          }
        }
      });
    };
  }

  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte:any, archivo:any, datosrpt:any) {

    let filtroRep = {ID_RUTA: (this.DRutasProductos == undefined ? '' : this.DRutasProductos.ID_RUTA), TIPO: (this.DRutasProductos == undefined ? 'Rutas Compuestas' : this.DRutasProductos.TIPO)};
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

  ngAfterViewInit(): void {
    // const x = setTimeout(() => {
    //   this.initDiagrama = true;
    //   this.diagReadOnly = true;
    //   this.diagLay.instance.repaint();
    // }, 1000);
    // //this.ddLayout.instance.option("dropDownOptions.width", 800);
    // let diagram = (this.diagLay.instance as any)._diagramInstance;
    // var apiController = diagram.apiController;
    // var that = this;
    // var contextMenuHandler = diagram.eventManager.contextMenuHandler;
    // diagram.eventManager.onContextMenu =  function(e){
    //   that.modelPoint = { x: e.eventPoint.x, y: e.eventPoint.y }; //apiController.convertPoint(arguments[0].modelPoint);
    //   // Click derecho activa menú si cumple que está sobre un nodo
    //   if (that.ubicarNodoSeccion() && that.mnuAccion.match('new|update'))
    //     contextMenuHandler.onContextMenu(e);
    // }
    
    // if (this.nodoSeccionAccion.length <= 0) {
    //   showToast('Seleccione una sección.', 'error');
    //   return;
    // }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.unsubscribe();
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
  }

  showModal(mensaje:any, titulo = '¡Error!', msg_html = '') {
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