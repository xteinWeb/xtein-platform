import {
  Component,
  HostListener,
  Inject,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
  AppSettings,
  childFlowNode,
  custShapesDiagrama,
  FlowEdge,
  FlowNode,
  MRutasPartes,
  MSecciones,
} from "../../../services/PRO011/interface";
import dxCheckBox from "devextreme/ui/check_box";
import { LibsvgService } from "../../../services/PRO011/SVisor.service";
import { DxContextMenuComponent, DxContextMenuModule, DxDataGridComponent, DxDataGridModule, DxDiagramComponent, DxDiagramModule, DxDropDownBoxComponent, DxDropDownBoxModule, DxFormComponent, DxFormModule, DxLoadPanelModule, DxSelectBoxModule, DxTextBoxModule, DxValidatorModule } from "devextreme-angular";
import config from "devextreme/core/config";
import ArrayStore from "devextreme/data/array_store";
import { TabService } from 'src/app/containers/tabs/tab.service';
import { lastValueFrom, Subject, Subscription, throwError } from "rxjs";
import { catchError, takeUntil } from "rxjs/operators";
import { PRO011Service } from "../../../services/PRO011/PRO011.service";
import { clsBarraRegistro } from "src/app/containers/regbarra/_clsBarraReg";
import Swal from "sweetalert2";
import { SbarraService } from "src/app/containers/regbarra/_sbarra.service";
import { SfiltroService } from "src/app/shared/filtro/_sfiltro.service";
import { GlobalVariables } from "src/app/shared/common/global-variables";
import { SvisorService } from "src/app/shared/vistarapida/_svisor.service";
import notify from 'devextreme/ui/notify';
import { Point } from "@angular/cdk/drag-drop";
import { imgtool } from "src/app/shared/classes/imgtools";
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { VistarapidaComponent } from "src/app/shared/vistarapida/vistarapida.component";
import { CommonModule } from "@angular/common";
import { showToast } from '../../../shared/toast/toastComponent.js'
declare let alertify: any;

@Component({
  selector: "PRO-013",
  templateUrl: "./PRO013.component.html",
  styleUrls: ["./PRO013.component.scss", "./dx-diagram.min.css"],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxSelectBoxModule, DxDropDownBoxModule,
            DxDataGridModule, DxDiagramModule, DxContextMenuModule, VistarapidaComponent,
            DxTextBoxModule, DxValidatorModule, DxLoadPanelModule
          ],
  providers: [PRO011Service]
})
export class PRO013Component implements OnInit {
  public contentHeader: object;
  private _unsubscribeAll: Subject<any>;

  @ViewChild("FRutasPartes", { static: false }) FRutasPartes: DxFormComponent;
  @ViewChild("FRutasPartes", { static: false }) formPartes: DxFormComponent;
  @ViewChild("diagPartes", { static: false }) diagLay: DxDiagramComponent;
  @ViewChild("ddBoxLay", { static: false }) ddLayout: DxDropDownBoxComponent;
  @ViewChild("GDatosDP", { static: false }) gridLP: DxDataGridComponent;
  @ViewChild("contextMnuSeccion", { static: false }) contextMenuSeccion: DxContextMenuComponent;
  

  DataRutasPartes: MRutasPartes;
  VDatosReg: MRutasPartes[] = [];
  DatosSeccRutasDP: MSecciones[];
  DatosSecciones: any;
  mnuAccion: string;
  readOnly: boolean = false;

  colCountByScreen: object;
  stylingMode = "outlined";
  editorStylingMode: "outlined";
  ReadOnlyEncabRP = true;
  ReadOnlyEncabRP_ID_RUTA = true;
  vecNodosSelecc: any;
  IdRutaAnterior: string;
  OpGuardar: string;
  GDatosLayoutDP: any;
  GValorLayout: string[] = [];
  MsgValidacion: string;
  operCfg: string;
	subscription: Subscription;
  subs_visor: Subscription;
  subs_filtro: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  prmUsrAplBarReg: clsBarraRegistro;
  modelPoint: Point;
  menuCommSeccion: any[];

  // Parámetro de ruta para pasar
  datIdRuta: string;
  appsettings: AppSettings;

  seccNodos: FlowNode[] = [];
  seccNodosRuta: FlowNode[] = [];
  seccNodosLay: FlowNode[] = [];
  seccConec: FlowEdge[] = [];
  seccConecRuta: FlowEdge[] = [];
  seccConecLay: FlowEdge[] = [];
  seccNodosBak: FlowNode[] = [];
  seccConecBak: FlowEdge[] = [];
  seccNodosDataSource: any;
  seccConecDataSource: any;
  elemNodo: FlowNode;
  elemConecEdit: FlowEdge;
  modelDiagrama: any;
  diagReadOnly: boolean = false;
  itemsMenuDiag: any;
  dropDownOptions: any; 
  itemSelecc: any = { id: '', tipo: ''};

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
  initDiagrama: boolean = false;
  menuDiagVisible: boolean = false;
  nodoSeccionAccion: string;
  conecSeccionAccion: string;
  HIGHLIGHT_CLASS: string = "highlight";
  HIGHLIGHT_ACTIVE_CLASS: string = "highlight-is-active";
  highlightIsActive: boolean = false;
  elemDiagramaActivo: boolean = false;
  diagramRutas: any;
  ultimoFinalIndex: number = -1;

  NodosSvg2 = [
    { svg: "assets/pro-rojo.svg", id: "pro-rojo" },
    { svg: "assets/pro-azul.svg", id: "pro-azul" },
    { svg: "assets/pro-naranja.svg", id: "pro-naranja" },
    { svg: "assets/pro-verde.svg", id: "pro-verde" },
    { svg: "assets/pro-indigo.svg", id: "pro-indigo" },
    { svg: "assets/pro-amarillo.svg", id: "pro-amarillo" },
    { svg: "assets/pro-marino.svg", id: "pro-marino" },
    { svg: "assets/pro-celeste.svg", id: "pro-celeste" },
    {
      svg: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMTYgMTYiPg0KPHBhdGggZD0iTTE1LjAyNSwxNS4yMDE3OTcyIEwxMC44NjY1ODQyLDExLjA0MzM4MTQgQzEyLjkwNzA0OTEsOC42MTU0ODY0NCAxMi44MDM3MzQ0LDQuOTk5NDcyNjYgMTAuNTMwODExNSwyLjcyNjU0OTcyIEM4LjEyODc0NTE2LDAuMzI0NDgzNDI3IDQuMjI4NjE2MDEsMC4zMjQ0ODM0MjcgMS44MjY1NDk3MiwyLjcyNjU0OTcyIEMtMC41NzU1MTY1NzMsNS4xMjg2MTYwMSAtMC41NzU1MTY1NzMsOS4wMjg3NDUxNiAxLjgyNjU0OTcyLDExLjQzMDgxMTUgQzMuMDE0NjY4NTMsMTIuNjE4OTMwMyA0LjYxNjA0NjA2LDEzLjIzODgxODMgNi4xOTE1OTQ5MiwxMy4yMzg4MTgzIEM3LjYxMjE3MTc2LDEzLjIzODgxODMgOS4wMDY5MTk5MywxMi43NDgwNzM2IDEwLjE2OTIxMDEsMTEuNzkyNDEyOCBMMTQuMzI3NjI1OSwxNS45NTA4Mjg3IEwxNS4wMjUsMTUuMjAxNzk3MiBaIE0yLjU0OTc1MjQ4LDEwLjcwNzYwODcgQzAuNTYwOTQ0ODk5LDguNzE4ODAxMTIgMC41NjA5NDQ4OTksNS40NjQzODg3MiAyLjU0OTc1MjQ4LDMuNDc1NTgxMTUgQzMuNTU3MDcwNiwyLjQ2ODI2MzAyIDQuODQ4NTA0MDksMS45Nzc1MTgzIDYuMTY1NzY2MjUsMS45Nzc1MTgzIEM3LjQ4MzAyODQxLDEuOTc3NTE4MyA4LjgwMDI5MDU3LDIuNDY4MjYzMDIgOS43ODE3ODAwMywzLjQ3NTU4MTE1IEMxMS43NzA1ODc2LDUuNDY0Mzg4NzIgMTEuNzcwNTg3Niw4LjcxODgwMTEyIDkuNzgxNzgwMDMsMTAuNzA3NjA4NyBDNy43OTI5NzI0NSwxMi42OTY0MTYzIDQuNTM4NTYwMDUsMTIuNjk2NDE2MyAyLjU0OTc1MjQ4LDEwLjcwNzYwODcgWiIvPg0KPC9zdmc+DQo=",
      id: "png-celeste",
    },
  ];

  // notificaciones
  // toaVisible: boolean;
  // toaMessage: string = "Registro actualizado!";
  // toaTipo: string = 'success';

  NodosSvg: custShapesDiagrama[] = [];
  colorOver: string;

  constructor(
    _slibsvg: LibsvgService,
    private _rutasdpservice: PRO011Service,
    private SVisor: SvisorService,
    private rutas: ActivatedRoute,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private tabService: TabService
  ) {
    this._unsubscribeAll = new Subject();

    // Servicio de barra de registro
    this.subscription = this._sbarreg
    .getObsRegApl()
    .subscribe((datreg) => {
      // Valida si la petición es para esta aplicacion
      if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opMenuRegistro(datreg);
    });
    
    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex(d => d.ID_RUTA === resp.ID_RUTA);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx+1;
        this.opIrARegistro('r_numreg');
      }
    })

    _slibsvg.getArchivo().subscribe(() => {
      this.NodosSvg = _slibsvg.custShapes;
    });

    // Respuesta del filtro
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe(resp => {
      // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    })

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

    this.valoresObjetos = this.valoresObjetos.bind(this);
    this.ValideExistencia = this.ValideExistencia.bind(this);
    this.confirmClick = this.confirmClick.bind(this);
    this.cancelClick = this.cancelClick.bind(this);
    this.onSelectionChanged = this.onSelectionChanged.bind(this);
    // this.clickout = this.clickout.bind(this);
    this.onMostrarMenuDiag = this.onMostrarMenuDiag.bind(this);
    this.agregarNodoRuta = this.agregarNodoRuta.bind(this);
    this.requestEditOperationHandler = this.requestEditOperationHandler.bind(this);
    this.opPrepararBuscar = this.opPrepararBuscar.bind(this);
    this.eliminarNodoLayout = this.eliminarNodoLayout.bind(this);
    this.onInitializedMenu = this.onInitializedMenu.bind(this);
    this.onInitialized = this.onInitialized.bind(this);
    this.onCustomMenuDiag = this.onCustomMenuDiag.bind(this);

  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        const user:any = localStorage.getItem("usuario");
        this.prmUsrAplBarReg = {
          tabla: "RUTAS_PRODUCCION",
          aplicacion: "PRO-013",
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
      case "r_copiar":
        this.mnuAccion = "new";
        this.readOnly = false;
        if (operMenu.accion === 'r_nuevo')
          this.opPrepararNuevo();
        else
          this.opPrepararModificar();
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
            this.mnuAccion = "";

            this.readOnly = true;
            this.ReadOnlyEncabRP = true;
            this.ReadOnlyEncabRP_ID_RUTA = true;
            this.diagReadOnly = true;
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            if(this.VDatosReg.length > 0)
              this.opIrARegistro('r_numreg');
            else
              this.opBlanquearForma();
            this.FRutasPartes.instance.resetValues();
          }
        });

        break;

      case "r_vista":
        this.opVista();
        break;

      case 'r_refrescar':
        if (this.mnuAccion.match('new|update'))
				  this.valoresObjetos('todos', 'r_refrescar');
        else
				  this.valoresObjetos('todos', '');
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
    // this.ReadOnlyEncabRP = false;
    this.ReadOnlyEncabRP_ID_RUTA = false;
    // this.diagReadOnly = false;
    this.opBlanquearForma();
    if(this.mnuAccion.match('new'))
      this.valoresObjetos('consecutivo', '');
    this.DataRutasPartes.ESTADO = 'ACTIVO';
  }
  opBlanquearForma(): void {
    this.DataRutasPartes = {
      ID_RUTA: "",
      AUTO_CONSECUTIVO: 0,
      DESCRIPCION: "",
      ESTADO: "",
      TIPO: "",
      PRIORIDAD: "",
      SECCIONES: "{}",
      NODOS: [],
      CONECTORES: [],
      LAYOUT_DP: [],
      DIAG_LAYOUT: []
    };

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
  }

  opPrepararModificar(): void {
    this.IdRutaAnterior = this.DataRutasPartes.ID_RUTA;
    this.ReadOnlyEncabRP = false;
    this.ReadOnlyEncabRP_ID_RUTA = false;
    this.diagReadOnly = false;
    setTimeout(() => {
      this.diagramRutas.option("autoZoomMode", "fitWidth");
      this.diagramRutas.option("autoZoomMode", "disabled");
    }, 300);
  }

  async opPrepararGuardar(accion: string) {
    
    // Acción validación de datos
    if (!this.ValidaDatos("requerido")) {
      return;
    }

    //valida integridad del Diagrama de la Ruta
    var resInte: boolean = false;
    const prm:any = { NODOS: this.seccNodosRuta.map((n:any) => n.id ), TIPO: 'Rutas Simples', ID_RUTA: this.DataRutasPartes.ID_RUTA };
    const apiRest = this._rutasdpservice.valideLayoutRuta('INTEGRIDAD LAYOUT', prm, this.prmUsrAplBarReg.aplicacion);
    let res = await lastValueFrom(apiRest, {defaultValue: true});
    res = JSON.parse(res.data); 
    if (res[0].ErrMensaje === ''){
      this.readOnly = false;
      resInte = true;
    } else {
      showToast(res[0].ErrMensaje, 'error');
      resInte = false;
    }
    if(!resInte) return;
    
    // Valida que no haya mas de una seccion como final
    var nodErrFin: string[] = [];
    this.seccNodosRuta.forEach((nodr) => {
      const nodCon = this.seccConecRuta.filter( (c) => c.fromId === nodr.id && c.id.match("crp_") );
      if (nodCon.length > 0)
        nodErrFin.push(nodr.text);
    });
    if (nodErrFin.length > 1) {
      for (var k = 0; k < nodErrFin.length; k++)
        this.activateHighlight(nodErrFin[k]);
      this.showModal('', "Guardando ruta", 
                     "<b>Debe existir solamente una sección que finaliza la ruta. Hay más de una: <br ><strong>" + 
                     nodErrFin.join('],[') + "</strong><br ></b>")
      return;
    }

    // Exporta imagen
    let imgdiagtmp = await new Promise((resolve, reject) => {
      this.diagLay.instance.exportTo('png', (data) => {
        return resolve(data);
      });
    });
    let itool = new imgtool(); 
    var imgdiag;
    await itool.removeImageBlanks(imgdiagtmp).then(data => { imgdiag = data });

    this.DataRutasPartes.TIPO = "Rutas Simples";
    const prmDatos = {
      ...this.DataRutasPartes,
      ID_RUTA_ANTERIOR: this.IdRutaAnterior,
    };
    const datossencab = { JRUTAS_ENC: prmDatos, IMAGEN: imgdiag };
    const datosdiagrama = {
      JDIAGRAMA: {
        NODOS: JSON.stringify(this.seccNodosDataSource._array),
        CONECTORES: JSON.stringify(this.seccConecDataSource._array),
        NODOS_RUTA: JSON.stringify(this.seccNodosRuta),
        CONECTORES_RUTA: JSON.stringify(this.seccConecRuta)
      },
    };
    const prmDatosGuardar = JSON.parse(
      (JSON.stringify(datossencab) + JSON.stringify(datosdiagrama)).replace(
        /}{/g,
        ","
      )
    );
    this.loadingVisible = true;
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
            this.VDatosReg.push(this.DataRutasPartes);
          } else {
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1] = this.DataRutasPartes;
          }
          this.DataRutasPartes.NODOS = this.seccNodosDataSource._array;
          this.DataRutasPartes.CONECTORES = this.seccConecDataSource._array;
          this.ReadOnlyEncabRP = true;
          this.ReadOnlyEncabRP_ID_RUTA = true;
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

          this.diagLay.instance._refresh();
          setTimeout(() => {
            this.diagramRutas.option("autoZoomMode", "fitWidth");
            this.diagramRutas.option("autoZoomMode", "disabled");
          }, 300);
          
        }  

      });
  }

  ValidaDatos(Accion: string): boolean {
    if (Accion === "requerido") {
      if (
        ( this.DataRutasPartes.ID_RUTA === null ||
          this.DataRutasPartes.ID_RUTA === undefined ||
          this.DataRutasPartes.ID_RUTA === ""
        ) ||
        ( this.DataRutasPartes.DESCRIPCION === null ||
          this.DataRutasPartes.DESCRIPCION === undefined ||
          this.DataRutasPartes.DESCRIPCION === ""
        ) ||
        ( this.DataRutasPartes.ESTADO === null ||
          this.DataRutasPartes.ESTADO === undefined ||
          this.DataRutasPartes.ESTADO === ""
        ) ||
        ( this.DataRutasPartes.PRIORIDAD === null ||
          this.DataRutasPartes.PRIORIDAD === undefined ||
          this.DataRutasPartes.PRIORIDAD === ""
        ) ||
        ( this.DataRutasPartes.LAYOUT_DP === null ||
          this.DataRutasPartes.LAYOUT_DP === undefined ||
          this.DataRutasPartes.LAYOUT_DP === "" ||
          this.DataRutasPartes.LAYOUT_DP.length <= 0
        )
      ) { 
        this.showModal('',"Faltan datos","<b>Hay datos que faltan. Revisar contenido de datos de la ruta!</b>");
        return false;
      } else if (this.seccConecDataSource.length <= 0 || this.seccNodosDataSource.length <= 0) {
        this.showModal('',"Faltan datos","<b>Faltan datos. Revisar contenido de Diagrama de la ruta!</b>");
        return false;
      }
    }
    return true;
  }

  opPrepararBuscar(accion): void {
    if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Rutas Simples",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      arrFiltro.push({ CAMPO: "TIPO", EXPRESION: "Rutas Simples", TABLA: 'RUTAS_PRODUCCION' });
      const prm = { RUTAS_PRODUCCION: arrFiltro };
      this.loadingVisible= true;

      // Ejecuta búsqueda API
      this._rutasdpservice
      .consulta('consulta', prm, 'PRO013')
      .pipe(takeUntil(this._unsubscribeAll), 
        catchError((err) =>{
          this.showModal(err.error);
          return throwError(err.error)
        }))
      .subscribe((resp: any) => {
        this.loadingVisible= false;
        this._sfiltro.enConsulta = false;
        const datares = JSON.parse(resp.data);
        if (datares[0].ErrMensaje !== '') {
          this.loadingVisible = false;
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
          this.VDatosReg.forEach((dato:any) => {
            dato.LAYOUT_DP = dato.LAYOUT_DP.split('|');
          });
          this.DataRutasPartes = this.VDatosReg[0];
          // Diagrama de las rutas asociadas
          try {
            this.modelDiagrama = { NODOS_RUTA: [], CONECTORES_RUTA: [] };
            this.modelDiagrama.NODOS_RUTA = this.VDatosReg[0].NODOS;
            this.modelDiagrama.CONECTORES_RUTA = this.VDatosReg[0].CONECTORES;
          } catch (error) {
            this.modelDiagrama = {
              NODOS_RUTA: [{}],
              CONECTORES_RUTA: [{}],
            };
          }
        } else {
          this.DataRutasPartes = {
            ID_RUTA: "",
            AUTO_CONSECUTIVO: 0,
            DESCRIPCION: "",
            ESTADO: "",
            TIPO: "",
            PRIORIDAD: "",
            SECCIONES: "",
            LAYOUT_DP: [],
            NODOS: [],
            CONECTORES: [],
            DIAG_LAYOUT: []
          };
          this.modelDiagrama = {
            NODOS_RUTA: [{}],
            CONECTORES_RUTA: [{}],
          };
        }

        // Trae el diagrama
        if (JSON.stringify(this.modelDiagrama.NODOS_RUTA[0]) === "{}") {
          this.seccNodos = [];
          this.seccConec = [];
          this.seccNodosRuta = [];
          this.seccConecRuta = [];
        } else {
          this.seccNodos = this.modelDiagrama.NODOS_RUTA;
          this.seccConec = this.modelDiagrama.CONECTORES_RUTA;
          if (this.modelDiagrama.NODOS_RUTA)
            this.seccNodosRuta = JSON.parse(JSON.stringify(this.modelDiagrama.NODOS_RUTA));
          if (this.modelDiagrama.CONECTORES_RUTA)
            this.seccConecRuta = JSON.parse(JSON.stringify(this.modelDiagrama.CONECTORES_RUTA));
        }
        this.ReadOnlyEncabRP = true;
        this.ReadOnlyEncabRP_ID_RUTA = true;

        // Prepara la barra para navegación
        this.prmUsrAplBarReg = {...this.prmUsrAplBarReg,
          r_totReg: datares.length,
          r_numReg: 1,
          accion: 'r_navegar',
          operacion: {}
        }
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

        // Trae los items en los componentes asociados
        this.opIrARegistro('r_primero');
      });
    }

    // this.ReadOnlyEncabRP = false;
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        this.prmUsrAplBarReg.r_numReg = 1;
        this.DataRutasPartes = JSON.parse(JSON.stringify(this.VDatosReg[0]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.DataRutasPartes = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
        this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
          ? this.VDatosReg.length
          : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DataRutasPartes = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DataRutasPartes = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
          this.DataRutasPartes = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

        } 
        else {
          this.DataRutasPartes = {
            ID_RUTA: "",
            AUTO_CONSECUTIVO: 0,
            DESCRIPCION: "",
            ESTADO: "",
            TIPO: "",
            PRIORIDAD: "",
            SECCIONES: "{}",
            LAYOUT_DP: [],
            NODOS: [],
            CONECTORES: [],
            DIAG_LAYOUT: []
          };
        }
        // this.ReadOnlyEncabRP = true;
        // this.ReadOnlyEncabRP_ID_RUTA = true;
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        this.prmUsrAplBarReg.r_totReg--;
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length > 0) {
          this.DataRutasPartes = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        } else {
          this.DataRutasPartes = {
            ID_RUTA: "",
            AUTO_CONSECUTIVO: 0,
            DESCRIPCION: "",
            ESTADO: "",
            TIPO: "",
            PRIORIDAD: "",
            SECCIONES: "{}",
            LAYOUT_DP: [],
            NODOS: [],
            CONECTORES: [],
            DIAG_LAYOUT: []
          };
        }
        break;

      default:
        break;
    }

    try {
      // Trae secciones asociadas a la ruta
      this.mnuAccion = "";
      this.diagReadOnly = true;
      if (this.prmUsrAplBarReg.r_numReg !== 0) {
        this.modelDiagrama.NODOS_RUTA = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].NODOS));
        this.modelDiagrama.CONECTORES_RUTA = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].CONECTORES));
      } else {
        this.modelDiagrama.NODOS_RUTA = [];
        this.modelDiagrama.CONECTORES_RUTA = [];
        this.modelDiagrama.NODOS_RUTA_RUTA = [];
        this.modelDiagrama.CONECTORES_RUTA_RUTA = [];
      }

      //verificar si los svg del diagrama estan en el json principal
      this.modelDiagrama.NODOS_RUTA.forEach((nodo:any) => {
        if ( !this.NodosSvg.includes(nodo['type']) ) {
          let valoresDisponibles = this.NodosSvg.filter((d:any) => d.id !== 'pro-base-layout');
          const newType:any = Math.floor(Math.random() * valoresDisponibles.length);
          nodo.type = this.NodosSvg[newType].id;
        }
      });

      if (JSON.stringify(this.modelDiagrama.NODOS_RUTA[0]) === "{}") {
        this.seccNodos = [];
        this.seccConec = [];
        this.seccNodosRuta = [];
        this.seccConecRuta = [];
      } else {
        this.seccNodos = this.modelDiagrama.NODOS_RUTA;
        this.seccConec = this.modelDiagrama.CONECTORES_RUTA;
        this.seccNodosRuta = JSON.parse(
          JSON.stringify(this.modelDiagrama.NODOS_RUTA)
        );
        this.seccConecRuta = JSON.parse(
          JSON.stringify(this.modelDiagrama.CONECTORES_RUTA)
        );
      }
      this.seccNodosBak = JSON.parse(JSON.stringify(this.seccNodosRuta));
      this.seccConecBak = JSON.parse(JSON.stringify(this.seccConecRuta));

      // Agrega layout asociado
      if (this.DataRutasPartes.DIAG_LAYOUT) {
        this.agregarLayoutAsociado();
      } else {
        this.seccNodosDataSource = new ArrayStore({
          key: "id",
          data: this.seccNodos,
        });
        this.seccConecDataSource = new ArrayStore({
          key: "id",
          data: this.seccConec,
        });
      }

      // Refresca
      setTimeout(() => {
        this.diagramRutas.option("autoZoomMode", "fitWidth");
        this.diagramRutas.option("autoZoomMode", "disabled");
      }, 300);

      // Ubica el el layout asociado
      if (this.DataRutasPartes.LAYOUT_DP) {
        // this.DataRutasPartes.LAYOUT_DP = this.DataRutasPartes.LAYOUT_DP.split(',');
        this.GValorLayout = this.DataRutasPartes.LAYOUT_DP;
      }
      else
        this.GValorLayout = [];

      this.ReadOnlyEncabRP = true;
      this.ReadOnlyEncabRP_ID_RUTA = true;

    } catch (err) {
      this.showModal(err);
    }

  }

  opEliminar(): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html: "¿Desea eliminar la Ruta de partes <i>" +
            this.DataRutasPartes.ID_RUTA +
            " " +
            this.DataRutasPartes.DESCRIPCION +
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
    this.loadingVisible = true;
    const prm = { ID_RUTA: this.DataRutasPartes.ID_RUTA };
    this._rutasdpservice
    .delete(prm)
    .pipe(takeUntil(this._unsubscribeAll), 
        catchError((err) =>{
          if (err.error)
            this.showModal(err.error.errors);
          else
            this.showModal(err.statusError);
          return throwError(() => new Error('Error'))
      }))
    .subscribe((data) => {
      this.loadingVisible = false;
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
      showToast('Ruta Eliminada con Exito.', 'success');
      this.ReadOnlyEncabRP = true;
      this.ReadOnlyEncabRP_ID_RUTA = true;

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
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: "Rutas Simples",
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: '',
      Filtro: '',
      keyGrid: ['ID_RUTA']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  // Debe haber digitado un codigo previamente
  onOpenedLayout(e:any) {
    if (this.DataRutasPartes.ID_RUTA === '') {
      this.showModal('Debe existir un valor asignado en el codigo de ruta!');
      this.ddLayout.instance.close();
    }
  }
  onSelectionChanged(e: any, dropDownBoxInstance: any): void {
    const keys = e.selectedRowKeys;
  }

  onValueChangedLayout(e:any) {
    if ((e.value === '') || (e.value === null) || (e.value === undefined) || (e.value.length <= 0)) {
      this.GValorLayout = [];
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
    }
  }

  // Agrega layout como un container
  childCnt: childFlowNode[] = [];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  agregarLayout(IdRuta: string, NomRuta: string) {
    let nodoCnt = this.seccNodos.filter((s:any) => s.type === "horizontalContainer");
    const numCnt = nodoCnt !== undefined ? nodoCnt.length : 0;

    // Nodos y conectores del diagrama
    this.seccNodosLay =
      JSON.stringify(this.modelDiagrama.NODOS[0]) === "{}"
        ? []
        : this.modelDiagrama.NODOS;
    this.seccConecLay =
      JSON.stringify(this.modelDiagrama.CONECTORES[0]) === "{}"
        ? []
        : this.modelDiagrama.CONECTORES;

    this.seccNodosLay.forEach((nod) => {
      if ( this.seccNodosBak.findIndex((d:any) => d.id === nod.id) === -1 ) {
        this.seccNodosBak = [
          ...this.seccNodosBak,
          JSON.parse(JSON.stringify(nod)),
        ];
      }
    });
    this.seccConecLay.forEach((nod) => {
      if ( this.seccConecBak.findIndex((d:any) => d.id === nod.id) === -1 ) {
        this.seccConecBak = [
          ...this.seccConecBak,
          JSON.parse(JSON.stringify(nod)),
        ];
      }
    });

    // Crea container y agrega los nodos
    this.seccNodosLay.forEach((nod) => {
      nod.contenedor = "cnt_" + IdRuta;
      nod.width = "100";
      nod.height = "60";
      nod.bloqSeccion = true;
      nod.textStyle = "fill:#8C8989";
      nod.type = "pro-base-layout";
      nod.text = nod.text;
    });

    // Contenedor --> Layout de planta -- Coordenadas y tamaño
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
    this.maxY = Number(obj.y) + Number(obj.height);
    this.elemNodo = {
      id: "cnt_" + IdRuta,
      text: NomRuta,
      type: "horizontalContainer",
      x: (this.minX - 40).toString(),
      y: (this.minY - 10).toString(),
      width: (this.maxX + 10).toString(),
      height: this.maxY.toString(),
      itemStyleExpr: { stroke: '#7ed3f1' }
    };

    // Si hay mas de un contenedor ubicar el siguiente
    if (numCnt !== 0) {
      let obj = nodoCnt.reduce((ant, act) => {
        return Number(ant.x) + Number(ant.width) >
          Number(act.x) + Number(act.width)
          ? ant
          : act;
      });
      this.maxX = Number(obj.x) + Number(obj.width);

      // Define posición y tamaño nuevo container
      this.elemNodo.x = (this.maxX + 50).toString();

      this.seccNodosLay.forEach((nod) => {
        nod.x = (Number(nod.x) + this.maxX + 50).toString();
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
      conn.bloqConn = true;
      conn.conecStyle = "stroke: #8C8989";
      this.seccConec = [...this.seccConec, conn];
    });
    this.seccConecDataSource = new ArrayStore({
      key: "id",
      data: this.seccConec,
    });
    // this.diagLay.instance.repaint();
  }

  // Agrega layouts asociados
  seccNodosRutaLayout: FlowNode[];
  seccConecRutaLayout: FlowEdge[];
  agregarLayoutAsociado() {

    // Primero: Toma los layouts asociados y los diagrama
    this.seccNodos = [];
    this.seccConec = [];
    const layoutRuta:any = this.DataRutasPartes.DIAG_LAYOUT;

    layoutRuta.forEach((elay:any) => {
      let nodoCnt = this.seccNodos.filter(
        (s) => s.type === "horizontalContainer"
      );
      const numCnt = nodoCnt !== undefined ? nodoCnt.length : 0;

      // Layout asociado a la ruta
      this.seccNodosRutaLayout = JSON.parse(elay.NODOS_LAYOUT);
      this.seccConecRutaLayout = JSON.parse(elay.CONEC_LAYOUT);
      // this.seccNodosBak = JSON.parse(JSON.stringify(this.seccNodosRutaLayout));
      // this.seccConecBak = JSON.parse(JSON.stringify(this.seccConecRutaLayout));
      this.seccNodosLay.forEach((nod) => {
        if ( this.seccNodosBak.findIndex((d:any) => d.id === nod.id) === -1 ) {
          this.seccNodosBak = [
            ...this.seccNodosBak,
            JSON.parse(JSON.stringify(nod)),
          ];
        }
      });
      this.seccConecLay.forEach((nod) => {
        if ( this.seccConecBak.findIndex((d:any) => d.id === nod.id) === -1 ) {
          this.seccConecBak = [
            ...this.seccConecBak,
            JSON.parse(JSON.stringify(nod)),
          ];
        }
      });

      // Crea container y agrega los nodos
      this.seccNodosRutaLayout.forEach((nod) => {
        if(this.seccNodosRuta.findIndex((d:any) => d.id === nod.id) === -1) {
          nod.contenedor = "cnt_" + elay.ID_RUTA_LAYOUT;
          nod.width = "100";
          nod.height = "60";
          nod.bloqSeccion = true;
          nod.textStyle = "fill:#8C8989";
          nod.type = "pro-base-layout";
          nod.text = nod.text;
        }
      });

      // Contenedor --> Layout de planta -- Coordenadas y tamaño
      this.minX = Number(
        this.seccNodosRutaLayout.reduce((ant, act) => {
          return Number(ant.x) < Number(act.x) ? ant : act;
        }).x
      );
      this.minY = Number(
        this.seccNodosRutaLayout.reduce((ant, act) => {
          return Number(ant.y) < Number(act.y) ? ant : act;
        }).y
      );
      let obj = this.seccNodosRutaLayout.reduce((ant, act) => {
        return Number(ant.x) + Number(ant.width) >
          Number(act.x) + Number(act.width)
          ? ant
          : act;
      });
      this.maxX = Number(obj.x) - this.minX + 50 + Number(obj.width);
      obj = this.seccNodosRutaLayout.reduce((ant, act) => {
        return Number(ant.y) + Number(ant.height) >
          Number(act.y) + Number(act.height)
          ? ant
          : act;
      });
      this.maxY = Number(obj.y) - this.minY + 50 + Number(obj.height);
      this.elemNodo = {
        id: "cnt_" + elay.ID_RUTA_LAYOUT,
        text: elay.NOMBRE_LAYOUT,
        type: "horizontalContainer",
        x: (this.minX - 40).toString(),
        y: (this.minY - 10).toString(),
        width: (this.maxX + 10).toString(),
        height: this.maxY.toString(),
        itemStyleExpr: { stroke: '#7ed3f1' }
      };

      // Si hay mas de un contenedor ubicar el siguiente
      if (numCnt !== 0) {
        let obj = nodoCnt.reduce((ant, act) => {
          return Number(ant.x) + Number(ant.width) >
            Number(act.x) + Number(act.width)
            ? ant
            : act;
        });
        this.maxX = Number(obj.x) + Number(obj.width);

        // Define posición y tamaño nuevo container
        this.elemNodo.x = (this.maxX + 50).toString();

        this.seccNodosRutaLayout.forEach((nod) => {
          nod.x = (Number(nod.x) + this.maxX + 50).toString();
        });
      }

      // Agrega secciones - nodos
      this.seccNodos = [...this.seccNodos, this.elemNodo];
      this.seccNodosRutaLayout.forEach((nod) => {
        this.seccNodos = [...this.seccNodos, nod];
      });
      this.seccConecRutaLayout.forEach((conn) => {
        conn.bloqConn = true;
        conn.conecStyle = "stroke: #8C8989";
        this.seccConec = [...this.seccConec, conn];
      });

    });

    // Siguiente: Marcar las secciones/nodos de la ruta
    this.modelDiagrama.NODOS_RUTA.forEach((elnod:any) => {
      // Busca si el nodo está en el layout
      const exnr = this.seccNodos.findIndex(n => n.id === elnod.id);
      if (exnr !== -1 && elnod.type !== 'horizontalContainer') {
        this.agregarNodoRuta(elnod, 'consulta');
      }
    });

    //verificar si los svg del diagrama estan en el json principal
    this.seccNodos.forEach((nodo:any) => {
      //verifica si el nodo no esta en ruta y asigna svg
      const npos:any = this.modelDiagrama.NODOS_RUTA.findIndex((d:any) => d.id === nodo.id && d.type !== 'horizontalContainer');
      if( npos === -1) {
        if (nodo.type !== 'horizontalContainer') {
          let valoresDisponibles = this.NodosSvg.filter((d:any) => d.id === 'pro-base-layout');
          nodo.type = valoresDisponibles[0].id;
        }
      } else {
        if (nodo.type !== 'horizontalContainer') {
          let valoresDisponibles = this.NodosSvg.filter((d:any) => d.id !== 'pro-base-layout');
          const newType:any = Math.floor(Math.random() * valoresDisponibles.length);
          nodo.type = this.NodosSvg[newType].id;
          nodo.contenedor = this.modelDiagrama.NODOS_RUTA[npos].contenedor;
        }
      }
    });

    // Siguiente: Agregar conectores al diagrama ppal
    this.modelDiagrama.CONECTORES_RUTA.forEach(elcon => {
      this.seccConec = [...this.seccConec, elcon];
    });

    // Aplica cambios al diagrama
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

  // Selección opción Menu contextual del diagrama - acciones
  contextMenuItemClick(e: any) {
    if (e.itemData.name === "inicio") {
      this.agregarNodoRuta({id: this.nodoSeccionAccion}, 'inicio');
    }
    if (e.itemData.name === "vincular") {
      this.agregarNodoRuta({id: this.nodoSeccionAccion}, '');
    }
    if (e.itemData.name === "desvincular") {
      this.eliminarNodoRuta(this.nodoSeccionAccion);
    }
  }
  onCustomMenuDiag(e: any) {
    switch (e.name) {
      case "inicio":
        this.agregarNodoRuta({id: this.nodoSeccionAccion}, 'inicio');
        break;
      case "vincular":
        this.agregarNodoRuta({id: this.nodoSeccionAccion}, '');
        break;
      case "desvincular":
        this.eliminarNodoRuta(this.nodoSeccionAccion);
        break;
      case "bloquear_secc":
      case "desbloquear_secc":
        this.bloquearNodo(this.nodoSeccionAccion, e.name);
        break;
      case "vincular_con":
      case "desvincular_con":
        this.agregarConecRuta(this.conecSeccionAccion, e.name);
        break;
      case "desbloquear_con":
        this.bloquearConn(this.conecSeccionAccion, e.name);
        break;
      case "zoomin":
        let zoomlevel = e.component.option("zoomLevel");
        e.component.option("zoomLevel", zoomlevel + 0.05);
        break;
      case "zoomout":
        let zoomlevelo = e.component.option("zoomLevel");
        e.component.option("zoomLevel", zoomlevelo + 0.05);
        break;
      default:
        break;
    }
  }

  bloquearConn(nodo:any, name:string) {
    if(name === 'bloquear_con') {
      // Aplica cambios al diagrama
      const npos:any = this.seccConec.findIndex((d:any) => d.id === this.nodoSeccionAccion);
      if(npos !== -1)
        this.seccConec[npos].bloqConn = true;

      this.seccConecDataSource = new ArrayStore({
        key: "id",
        data: this.seccConec,
      });
      // this.diagLay.instance.repaint();
    } else if(name === 'desbloquear_con') {
      // Aplica cambios al diagrama
      const npos:any = this.seccConec.findIndex((d:any) => d.id === this.conecSeccionAccion);
      if(npos !== -1)
        this.seccConec[npos].bloqConn = false;

      this.seccConecDataSource = new ArrayStore({
        key: "id",
        data: this.seccConec,
      });
      // this.diagLay.instance.repaint();
    }
  }

  bloquearNodo(con:any, name:string) {
    if(name === 'bloquear_secc') {
      // Aplica cambios al diagrama
      const npos:any = this.seccNodos.findIndex((d:any) => d.id === this.nodoSeccionAccion);
      if(npos !== -1)
        this.seccNodos[npos].bloqSeccion = true;

      this.seccNodosDataSource = new ArrayStore({
        key: "id",
        data: this.seccNodos,
      });
      // this.diagLay.instance.repaint();
    } else if(name === 'desbloquear_secc') {
      // Aplica cambios al diagrama
      const npos:any = this.seccNodos.findIndex((d:any) => d.id === this.nodoSeccionAccion);
      if(npos !== -1)
        this.seccNodos[npos].bloqSeccion = false;

      this.seccNodosDataSource = new ArrayStore({
        key: "id",
        data: this.seccNodos,
      });
      // this.diagLay.instance.repaint();
    }
  }

  // Busca e identifica el nodo de la seccion de acuerdo el click
  ubicarNodoSeccion(): boolean {
    var ret: boolean = true;
    try {
      var elemDiag: any;
      var nodoDiag: any;
      elemDiag = document.elementFromPoint(this.modelPoint.x, this.modelPoint.y) as HTMLElement;
      if (!elemDiag.matches('path')) {
        elemDiag = document.elementFromPoint(this.modelPoint.x-10, this.modelPoint.y-10) as HTMLElement;
        nodoDiag = elemDiag.parentElement;
        var nodoHtml = nodoDiag.outerHTML;
        var doc = new DOMParser().parseFromString(nodoHtml, "text/xml");
        const textNodo = doc.getElementsByTagName("text")[0].getAttribute("appliedText");
        const nodoSelecc = this.seccNodosRuta.find((f) => f.text == textNodo);
        if (nodoSelecc) {
          this.nodoSeccionAccion = nodoSelecc.id;
          if(nodoSelecc.bloqSeccion)
            this.menuCommSeccion = [false, true, false, false, false, false, true, false, false];
          else if(!nodoSelecc.bloqSeccion)
            this.menuCommSeccion = [false, true, false, false, false, true, false, false, false];
        } else {
          const nodoSelecc = this.seccNodos.find((f) => f.text == textNodo);
          if (nodoSelecc) {
            if (!nodoSelecc.id.toString().match("cnt_")) {
              this.nodoSeccionAccion = nodoSelecc.id;
              if(nodoSelecc.bloqSeccion)
                this.menuCommSeccion = [true, false, true, false, false, false, true, false, false];
              else if(!nodoSelecc.bloqSeccion)
                this.menuCommSeccion = [true, false, true, false, false, true, false, false, false];
            }
            else
              ret = false;
          }
          if (!ret) {
            this.nodoSeccionAccion = "";
            this.menuCommSeccion = [false, false, false, false, false, false, false, false, false];
          }
        }
      } 
      else {
        const itemConn = this.diagLay.instance.getSelectedItems();
        const conecSelecc = this.seccConecRuta.find((f) => f.id == itemConn[0].dataItem.id);
        if (conecSelecc) {
          this.conecSeccionAccion = conecSelecc.id;
          if(conecSelecc.bloqConn)
            this.menuCommSeccion = [false, false, false, false, true, false, false, false, true];
          else if(!conecSelecc.bloqConn)
            this.menuCommSeccion = [false, false, false, false, true, false, false, true, false];
        } else {
          const conecSelecc = this.seccConec.find((f) => f.id == itemConn[0].dataItem.id);
          if (conecSelecc) {
            // if (conecSelecc.id.toString().match("clp_")) {
              this.conecSeccionAccion = conecSelecc.id;
              if(conecSelecc.bloqConn)
                this.menuCommSeccion = [false, false, false, true, false, false, false, false, true];
              else if(!conecSelecc.bloqConn)
                this.menuCommSeccion = [false, false, false, true, false, false, false, true, false];
            // }
            // else
            //   ret = false;
          }
          if (!ret) {
            this.nodoSeccionAccion = "";
            this.menuCommSeccion = [false, false, false, false, false, false, false, false, false];
          }
        }
      }
      return ret;

    } catch (error) {
      this.nodoSeccionAccion = "";
      this.menuCommSeccion = [false, false, false, false, false, false, false, false, false];
      return false;
    }

  }

  // Evento al abrir Menú contextual sobre el shape de sección
  onMostrarMenuDiag(e: any) {
    // Nodo sobre el que actúa el menú
    // console.log('click...........',e);
    if (e.jQEvent === undefined) return;

    var nodoHtml = e.jQEvent.currentTarget.outerHTML;
    var doc = new DOMParser().parseFromString(nodoHtml, "text/xml");
    const coordX = doc.getElementsByTagName("rect")[0].getAttribute("x");
    const coordY = doc.getElementsByTagName("rect")[0].getAttribute("y");
    const textNodo = doc.getElementsByTagName("text")[0].getAttribute("appliedText");
    //const nodoSelecc = this.seccNodosRuta.find((f) => f.x == coordX && f.y == coordY && f.text == textNodo);
    const nodoSelecc = this.seccNodosRuta.find((f) => f.text == textNodo);
    if (nodoSelecc) {
      this.nodoSeccionAccion = nodoSelecc.id;
      this.itemsMenuDiag = [
        { text: "Des-vincular de ruta", name: "desvincular" }
      ];
    } else {
      const nodoSelecc = this.seccNodos.find((f) => f.text == textNodo);
      if (nodoSelecc) {
        this.nodoSeccionAccion = nodoSelecc.id;
        this.itemsMenuDiag = [
          { text: "Definir como sección inicio", name: "inicio" },
          { text: "Vincular a ruta", name: "vincular" }
        ];
      }
    }

    if (e.jQEvent.currentTarget.classList.value === "shape container") {
      e.cancel = true;
    } else {
      if (e.jQEvent.currentTarget.classList.value !== "shape locked") {
        e.cancel = true;
      }
    }
  }

  
  @HostListener('document:contextmenu', ['$event'])
  preventContextMenu(e: any) {
    //this.menuDiagVisible = true;
    // console.log(e);
    //this.contextMenuSeccion.instance.show();
    e.preventDefault();
  }
  
  @HostListener("document:click", ["$event"])
  clickout(e: any) {
    this.menuDiagVisible = false;
    if (!this.highlightIsActive) this.deactivateHighlight(null);
    if (!this.elemDiagramaActivo) {
      this.itemSelecc = { id: "", tipo: "" };
    } 
    else 
      this.elemDiagramaActivo = false;
  }

  // *** Restricciones de edición nodos
  indMovCnt: boolean = false;
  requestLayoutUpdateHandler(e: any) {
    // console.log("uh",e);
    this.indMovCnt = false;
    for(var i = 0; i < e.changes.length; i++) {
      if(e.changes[i].type === 'insert') {
        e.changes[i].data.itemStyleExpr = "black";
        e.changes[i].data.bloqSeccion = false;
        e.allowed = true;
      }
      else 
        e.allowed = false;
    }
  }

  async requestEditOperationHandler(e: any) {

    // Valida eliminacion del layout
    // console.log("rop",e);
    if (e.operation === "deleteShape" && e.reason === 'modelModification') {
      // Confirmar operación de elminación
      e.allowed = false;
      const esEliminar = await new Promise((resolve, reject) => {
        Swal.fire({
        title: '',
        html: "Desea eliminar el Layout: <br ><i>" + e.args.shape.text + "</i><br >" +
              "Se eliminarán también las secciones asociadas a dicho Layout",
        iconHtml: "<i class='icon-alert-ol'></i>",
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#438ef1',
        cancelButtonText: 'No',
        confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
          if (result.isConfirmed) {
            resolve (true);
          } else {
            resolve (false);
          }
        });
      });

      // Inicializa vectores
      if (esEliminar)
        this.eliminarNodoLayout(e.args.shape);
      else 
        e.allowed = false;
    }

    if (e.operation === "addShape") {
      // console.log("oh", e);
      // Invalidar copiar y pegar
      if (this.itemSelecc.tipo === 'shape') {
        e.allowed = false;
        return;
      }
    } else if (e.operation === "deleteConnector") {
        // eliminar de los nodos de Ruta
        let conecElim = this.seccConecRuta.findIndex((f) => f.id == e.args.connector.dataItem.id);
        if (conecElim != 0) {
          this.seccConecRuta.splice(conecElim, 1);
        }
      } else if (e.operation === "changeConnection") {
        // Invalidar copiar y pegar
        if (this.itemSelecc.tipo === 'connector') {
          e.allowed = false;
          return;
        }
        // Si está agregando conector
        var shapeType = e.args.newShape && e.args.newShape.type;
        if (e.args.connectorPosition === "start") {
          if (shapeType) {
            if (shapeType.match("pro-") && e.args.connectionPointIndex !== -1) {
              this.elemConecEdit.fromPoint = e.args.connectionPointIndex;
            }
          }
        }
        if (e.args.connectorPosition === "end") {
          if (shapeType) {
            if (shapeType.match("pro-") && e.args.connectionPointIndex !== -1) {
              this.elemConecEdit.toPoint = e.args.connectionPointIndex;
              this.elemConecEdit.conecStyle = "stroke-width: 1";
            }
          }
        }
        if (e.operation === "changeConnectorPoints") {
          let conecInfo = this.seccConecRuta.findIndex((f) => f.id === e.args.connector.id);
          if (conecInfo === -1) {
            this.seccConecRuta[conecInfo].pointsConec = e.newPoints;
          }
        }
      }
    if (e.operation === "moveShape") {
      if (e.args.shape.type !== "horizontalContainer") {
        e.allowed = this.indMovCnt;
      } else {
        this.indMovCnt = true;
        e.allowed = true;
      }
    } else {
      e.allowed = true;
    }
  }

  // Eliminar seccion validando
  async eliminarNodoLayout(nodo) {
    // Busca seccion y elimina
    const nodBusq = this.seccNodosDataSource._array.findIndex((s: any) => s.id === nodo.key);
    if (nodBusq !== -1 && this.mnuAccion === 'update') {

      // Valida la existencia de la llave respectiva
      const prm = { ID_SECCION: nodo.key, 
                    accion: this.mnuAccion, 
                    ID_RUTA: this.DataRutasPartes.ID_RUTA };
      const apiRest = this._rutasdpservice.consulta('validar seccion rutas', prm, 'PRO013');
      let res = await lastValueFrom(apiRest, {defaultValue: true});
      res = JSON.parse(res.data); 
      if (res[0].ErrMensaje !== '') {
        this.showModal(res[0].ErrMensaje);
        return;
      }
    }

    // Toma los elementos internos y los elimina 
    const elimNodos = JSON.parse(JSON.stringify(this.seccNodosDataSource._array));
    elimNodos.forEach(elay => {
      // Busca conectores a y desde la seccion y los elimina
      if (elay.type !== 'horizontalContainer') {
        if (elay.contenedor === nodo.key) {
          var connBusq = this.seccConec.findIndex((s: any) => s.fromId === elay.id);
          if (connBusq !== -1) this.seccConec.splice(connBusq, 1);
          connBusq = this.seccConec.findIndex((s: any) => s.toId === elay.id);
          if (connBusq !== -1) this.seccConec.splice(connBusq, 1);

          // Elimina nodo-seccion
          const nodint = this.seccNodos.findIndex((s: any) => s.id === elay.id);
          this.seccNodos.splice(nodint, 1);
        }
      }
    });
    // Elimina container
    this.seccNodos.splice(nodBusq, 1);

    // Des-selecciona de la grid de layouts (encabezado)
    const nodint = this.GValorLayout.indexOf(nodo.key.replace('cnt_',''));
    if (nodint !== -1) this.GValorLayout.splice(nodint, 1);
    this.DataRutasPartes.LAYOUT_DP = this.GValorLayout;
    this.ddLayout.instance.option("value", this.GValorLayout);

    // Refresca diagrama
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
  }

  onContentReady(e: any) {
    e.component.option("autoZoomMode", "fitContent");
    e.component.option("autoZoomMode", "disabled");
  }

  autoSaveTimeout: any = -1;
  onOptionChanged(e: any) {
    //var pnodo = this.render.selectRootElement('shape locked');
    //console.log(e);

    this.autoSaveTimeout = setTimeout(() => {
      // Verfica si hubo cambios en conectores
      if (
        Number(this.elemConecEdit.fromPoint) != -1 &&
        Number(this.elemConecEdit.toPoint) != -1
      ) {
        this.seccConec.forEach((cn) => {
          const frId = this.seccNodos.filter((f) => f.id == cn.fromId);
          const toId = this.seccNodos.filter((f) => f.id == cn.toId);
          const cnIgual = this.seccConec.filter(
            (f) => f.id == cn.toId && f.id == cn.fromId && f.id.match("crp_")
          );

          // 1. cambia el id de conectores agregados manualmente
          // 2. agrega a los conectores de las rutas
          if (
            frId[0].type.match("pro-") &&
            toId[0].type.match("pro-") &&
            !cn.id.match("crp_") &&
            !cn.id.match("clp_") &&
            cnIgual.length === 0
          ) {
            // re-asigna codigo id
            cn.id = "crp_" + cn.fromId + "_" + cn.toId;
            let conecInfo = this.seccConecRuta.findIndex((f) => f.id == cn.id);
            if (conecInfo === -1) {
              const elemConect = {
                id: cn.id,
                fromId: cn.fromId,
                toId: cn.toId,
                text: "",
                fromPoint: cn.fromPoint,
                toPoint: cn.toPoint,
                conecStyle: cn.conecStyle,
                pointsConec: cn.pointsConec
              };
              this.seccConecRuta = [...this.seccConecRuta, elemConect];
            }
          }
        });
        this.elemConecEdit = {
          id: "",
          text: "",
          fromId: "",
          toId: "",
          fromPoint: "-1",
          toPoint: "-1",
        };
      }

      var pnodo = document.getElementsByClassName("shape locked");
      if (pnodo === undefined) return;
      e.component.option("hasChanges", false);
    }, 500);
  }

  handleMouseOver(e: any) {
    this.colorOver = "red";
  }

  itemStyleExpr___(obj: any) {
    return { stroke: "#8C8989" };
  }
  textStyleExpr(obj: any) {
    return { fill: "#8C8989" };
  }
  onItemDblClick(e: any) {
    const seccNueva = e.item.dataItem;
    this.agregarNodoRuta(seccNueva, '');
  }
  onItemClick(e: any) {
    // console.log('click nodo....',e);
    this.highlightIsActive = false;
    this.elemDiagramaActivo = true;
    this.itemSelecc = { id: e.item.dataItem.id, tipo: e.item.itemType };
  }

  // **** Agregar nodo de ruta ****
  cntUnico: any = {}
  agregarNodoRuta(seccNueva:any, modo:any) {
    //valida que no sea un contenedor Layout
    if(seccNueva.type !== "horizontalContainer") {

      // Nodo inicio, asocia nodo
      if (modo === 'inicio') {
        seccNueva = this.seccNodos.find((f) => f.id === seccNueva.id);
      }

      // Si ya existe en la ruta, no adicionar de nuevo
      let NodoSeccAgg = this.seccNodosRuta.findIndex((f) => f.id == seccNueva.id);
      if (modo === 'consulta') return;
      if (NodoSeccAgg !== -1) return;

      // Busca si hay sección previa de la seleccionada en la ruta trazada
      const connPrev = this.seccConec.filter(c => c.toId === seccNueva.id); 
      let seccPrev = this.seccNodosRuta.findIndex(s => connPrev.findIndex(cnn => cnn.fromId === s.id) !== -1);
      let seccUlt = this.seccNodosRuta[this.seccNodosRuta.length - 1];
      if (seccUlt == undefined) seccUlt = seccNueva;
      if (modo == '') {
        if (this.seccNodosRuta.length != 0 && seccPrev == -1) {
          if (seccUlt.contenedor === seccNueva.contenedor) {
            this.showModal('', '', "Esta sección no tiene una precedente de la ruta señalada. " +
              "<br >Revise secciones precedentes a esta sección en la ruta.");
            return;
          }
        }
      }
      seccPrev = this.seccNodos.findIndex(s => s.id == seccUlt.id); 

      // Si está en el mismo contenedor
      if(seccUlt.contenedor === seccNueva.contenedor) {
  
        //verificar si los svg del diagrama estan en el json principal
        this.seccNodosBak.forEach((nodo:any) => {
          if ( !this.NodosSvg.includes(nodo['type']) ) {
            let valoresDisponibles = this.NodosSvg.filter((d:any) => d.id !== 'pro-base-layout');
            const newType:any = Math.floor(Math.random() * valoresDisponibles.length);
            nodo.type = this.NodosSvg[newType].id;
          }
        });
  
        // ** Agregar nodo -- asignar propiedades de nodo producción
        // Tipo de nodo produccion
        let NodoSecc = this.seccNodos.findIndex((f) => f.id === seccNueva.id);
        const nodOrg = this.seccNodosBak.findIndex((f) => f.id == seccNueva.id);
        this.seccNodos[NodoSecc].type = this.seccNodosBak[nodOrg] ? this.seccNodosBak[nodOrg].type : this.seccNodos[NodoSecc].type;
        this.seccNodos[NodoSecc].textStyle = "fill: black";
        this.seccNodos[NodoSecc].tipoNodo = '';
        if (modo === 'inicio' || this.seccNodosRuta.length === 0) {
          this.seccNodos[NodoSecc].tipoNodo = 'inicio';
        }
        let nodoRuta = JSON.parse(JSON.stringify(this.seccNodos[NodoSecc]));
  
        // Refresca nodos
        this.seccNodosRuta = [...this.seccNodosRuta, nodoRuta];
        this.seccNodosDataSource = new ArrayStore({
          key: "id",
          data: this.seccNodos,
        });
  
        // Valida si tiene secciones precedentes en la ruta seleccionada
        let cntLay: FlowEdge[] = this.seccConec.filter(c => c.toId === seccNueva.id);
        cntLay.forEach(conec => {
          this.cntUnico = conec;
          let seccEnRuta = this.seccNodosRuta.findIndex(n => n.id === conec.fromId);
          if (seccEnRuta !== -1) {
            const conecOrg:any = JSON.parse(JSON.stringify(this.seccConecBak.filter((f) => f.id == conec.id)[0]));
            conecOrg.conecStyle = 'stroke: #0ec308; stroke-width: 2; z-index: 20';
            conecOrg.id = "crs_" + conecOrg.fromId + "_" + seccNueva.id;
            conecOrg.id = conecOrg.fromId !== seccNueva.id ? "crs_" + conecOrg.fromId + "_" + seccNueva.id : "crs_" + conecOrg.fromId + "_" + conecOrg.toId;
            conecOrg.bloqConn = true;
            this.seccConec = [...this.seccConec, conecOrg];
            // Conectores de la ruta
            this.seccConecRuta = [...this.seccConecRuta, conecOrg];
          }
        });

        // Valida si tiene secciones siguientes en la ruta seleccionada
        cntLay = this.seccConec.filter(c => c.fromId === seccNueva.id);
        cntLay.forEach(conec => {
          const seccEnRuta = this.seccNodosRuta.findIndex(n => n.id === conec.toId);
          if (seccEnRuta !== -1) {
            const conecOrg:any = JSON.parse(JSON.stringify(this.seccConecBak.filter((f) => f.id == conec.id)[0]));
            conecOrg.conecStyle = 'stroke: #0ec308; stroke-width: 2; z-index: 20';
            // conecOrg.id = "crs_" + conecOrg.fromId + "_" + seccNueva.id;
            conecOrg.id = conecOrg.fromId !== seccNueva.id ? "crs_" + conecOrg.fromId + "_" + seccNueva.id : "crs_" + conecOrg.fromId + "_" + conecOrg.toId;
            conecOrg.bloqConn = true;
            this.seccConec = [...this.seccConec, conecOrg];
            // Conectores de la ruta
            this.seccConecRuta = [...this.seccConecRuta, conecOrg];
          }
        });

        // Refresca conectores
        this.seccConecDataSource = new ArrayStore({
          key: "id",
          data: this.seccConec,
        });
      }

      // Si es entre contenedores, marcar la ruta
      else {
        // ** Agregar nodo -- asignar propiedades de nodo producción
        // Tipo de nodo produccion
        let NodoSecc = this.seccNodos.findIndex((f) => f.id === seccNueva.id);
        const nodOrg = this.seccNodosBak.findIndex((f) => f.id == seccNueva.id);
        this.seccNodos[NodoSecc].type = this.seccNodosBak[nodOrg] ? this.seccNodosBak[nodOrg].type : this.seccNodos[NodoSecc].type;
        this.seccNodos[NodoSecc].textStyle = "fill: black";
        this.seccNodos[NodoSecc].tipoNodo = '';
        if (modo === 'inicio' || this.seccNodosRuta.length === 0) {
          this.seccNodos[NodoSecc].tipoNodo = 'inicio';
        }
        let nodoRuta = JSON.parse(JSON.stringify(this.seccNodos[NodoSecc]));

        // Refresca nodos
        this.seccNodosRuta = [...this.seccNodosRuta, nodoRuta];
        this.seccNodosDataSource = new ArrayStore({
          key: "id",
          data: this.seccNodos,
        });
  
        // const seccUlt = this.seccNodosRuta[this.seccNodosRuta.length - 1].id;
        const elemConect = {
          id: "crs_" + seccUlt.id + "_" + seccNueva.id,
          fromId: seccUlt.id,
          toId: seccNueva.id,
          text: "",
          fromPoint: "4",
          toPoint: "10",
          conecStyle: 'stroke: #0ec308; stroke-width: 2; z-index: 20',
          bloqConn: false
        };

        // Conectores de la ruta
        this.seccConec = [...this.seccConec, elemConect];
        this.seccConecRuta = [...this.seccConecRuta, elemConect];
        this.seccConecDataSource = new ArrayStore({
          key: "id",
          data: this.seccConec,
        });
      }

      // this.ultimoFinalIndex = -1; // Variable para rastrear el índice del último "final" encontrado
      if (this.seccNodosRuta.length > 0) {
        for (let i = 0; i < this.seccNodosRuta.length; i++) {
          if (this.seccNodosRuta[i].tipoNodo === 'final') {
            if (this.ultimoFinalIndex !== -1)
              this.seccNodosRuta[this.ultimoFinalIndex].tipoNodo = '';
            this.ultimoFinalIndex = i; // Actualiza el índice del último "final" encontrado
          }
          if (this.seccNodosRuta[i].tipoNodo !== 'inicio') {
            if (i === this.seccNodosRuta.length - 1) {
              this.seccNodosRuta[i].tipoNodo = 'final';
              this.ultimoFinalIndex = i; // Marca como "final" y actualiza el índice del último "final"
            } else if (i !== this.ultimoFinalIndex) {
              this.seccNodosRuta[i].tipoNodo = '';
            }
          }
        }
      }

    }
  }

  // **** Agregar conector de ruta ****
  agregarConecRuta(conecNuevo: string, modo = '') {
    let ConecSecc = this.seccConec.findIndex((f) => f.id == conecNuevo);
    if (ConecSecc >= 0) {

      // Valida si conecta nodos de la ruta
      if (this.seccNodosRuta.length !== 0 ) {
        const nodFrom = this.seccNodosRuta.findIndex(s => s.id === this.seccConec[ConecSecc].fromId);
        const nodTo = this.seccNodosRuta.findIndex(s => s.id === this.seccConec[ConecSecc].toId);
        if (nodFrom === -1 || nodTo === -1 && modo === 'vincular_con') {
          this.showModal('', '', "Este conector no enlaza secciones de origen o destino que pertenezcan a la ruta.");
          return;
        }

      }

      // Adiciona a conectores de la ruta
      if (modo === 'vincular_con') {
        const elemConect = this.seccConecBak.find(c => c.id === conecNuevo);
        const conecAdic = JSON.parse(JSON.stringify(elemConect));
        conecAdic.id = 'crp_' + conecAdic.fromId;
        this.seccConec = [...this.seccConec, conecAdic];
        this.seccConecRuta = [...this.seccConecRuta, conecAdic];
      }
      else {
        this.seccConec.splice(ConecSecc,1);
        ConecSecc = this.seccConecRuta.findIndex((f) => f.id == conecNuevo);
        this.seccConecRuta.splice(ConecSecc,1);
      }
      this.seccConecDataSource = new ArrayStore({
        key: "id",
        data: this.seccConec,
      });
      // this.diagLay.instance.repaint();
    }

  }

  // **** Eliminar nodo de ruta ****
  async eliminarNodoRuta(seccEliminar: string) {
  
    // Valida la existencia de la seccion en la ruta
    const prm = { ID_SECCION: seccEliminar };
    const apiRest = this._rutasdpservice.consulta('seccion ruta referencial', prm, 'PRO013');
    let res = await lastValueFrom(apiRest, {defaultValue: true});
    res = JSON.parse(res.data); 
    if (res[0].ErrMensaje !== '') {
      this.showModal(res[0].ErrMensaje);
      return;
    }

    // Valida que no tenga secciones hacia adelante
    if (this.seccConecRuta.findIndex(c => c.fromId == seccEliminar) != -1) {
      
    }

    let NodoSecc = this.seccNodos.findIndex((f) => f.id == seccEliminar);
    if (NodoSecc >= 0) {
      // Tipo de nodo produccion
      this.seccNodos[NodoSecc].type = "pro-base-layout";
      this.seccNodos[NodoSecc].textStyle = "fill:#8C8989";
      this.seccNodos[NodoSecc].bloqSeccion = true;
      this.seccNodos[NodoSecc].width = "100";
      this.seccNodos[NodoSecc].height = "60";
      this.seccNodosDataSource = new ArrayStore({
        key: "id",
        data: this.seccNodos,
      });

      // Eliminar de los nodos de la ruta
      NodoSecc = this.seccNodosRuta.findIndex((f) => f.id == seccEliminar);
      this.seccNodosRuta.splice(NodoSecc, 1);

      // Eliminar los conectores relacionados con la ruta
      // ** De los nodos origen
      let conecElim = this.seccConecRuta.filter(
        (f) => f.fromId == seccEliminar
      );
      conecElim.forEach((nod, index) => {
        var ix = this.seccConecRuta.findIndex((f) => f.id == nod.id);
        this.seccConecRuta.splice(ix, 1);
        ix = this.seccConec.findIndex((f) => f.id == nod.id);
        this.seccConec.splice(ix, 1);
      });
      // ** A los nodos destino
      conecElim = this.seccConecRuta.filter(
        (f) => f.toId == seccEliminar
      );
      conecElim.forEach((nod, index) => {
        var ix = this.seccConecRuta.findIndex((f) => f.id == nod.id && f.toId === nod.toId);
        this.seccConecRuta.splice(ix, 1);
        ix = this.seccConec.findIndex((f) => f.id == nod.id && f.toId === nod.toId);
        this.seccConec.splice(ix, 1);
      });
      this.seccConecDataSource = new ArrayStore({
        key: "id",
        data: this.seccConec,
      });
    }
  }

  // HIGHLIGHT HELPERS
  activateHighlight(nodoSinConec: any) {
    const diagSombra = document.getElementById("diagPartes") as HTMLElement;
    const htmlNodo = document.querySelector(
      '[appliedText="' + nodoSinConec + '"]'
    ) as HTMLElement;
    if (htmlNodo === null) return;
    const highlightedElement = htmlNodo.parentElement as HTMLElement;
    this.highlightIsActive = true;

    diagSombra.classList.add(this.HIGHLIGHT_ACTIVE_CLASS);
    highlightedElement.classList.add(this.HIGHLIGHT_CLASS);
  }
  deactivateHighlight(nodoSinConec: any) {
    if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;

    const diagSombra = document.getElementById("diagPartes") as HTMLElement;
    const highlightedElement = document.getElementsByClassName(
      this.HIGHLIGHT_CLASS
    );
    if (highlightedElement === null) return;
    this.highlightIsActive = false;
  }

  clickLay(opcion: string) {
    switch (opcion) {
      case "original":
        this.seccNodosDataSource = new ArrayStore({
          key: "id",
          data: this.seccNodosBak,
        });
        this.seccConecDataSource = new ArrayStore({
          key: "id",
          data: this.seccConecBak,
        });
        break;

      case "nuevo":
        this.seccNodosDataSource = new ArrayStore({
          key: "id",
          data: this.seccNodos,
        });
        this.seccConecDataSource = new ArrayStore({
          key: "id",
          data: this.seccConec,
        });
        break;

      case "ruta":
        this.activateHighlight(undefined);
        break;

      default:
        break;
    }
  }

  // Valide unicidad de la llave
  async ValideExistencia(e: any) {
    if (e.value === '' && this.mnuAccion !== '') {
      this.diagReadOnly = true;
      this.ReadOnlyEncabRP = true;
      return false;
    }
    if (this.ReadOnlyEncabRP_ID_RUTA || !this.mnuAccion.match('new|update')) {
      this.diagReadOnly = true;
      this.ReadOnlyEncabRP = true;
      return true;
    }
    if (this.mnuAccion === 'update' && this.DataRutasPartes.ID_RUTA === e.value) {
      this.diagReadOnly = true;
      this.ReadOnlyEncabRP = true;
      return true;
    }

    // Valida la existencia de la llave respectiva
    const prm = { ID_RUTA: e.value, accion: this.mnuAccion };
    const apiRest = this._rutasdpservice.validellave('EXISTE RUTA',prm,'PRO013');
    let res = await lastValueFrom(apiRest, {defaultValue: true});
    res = JSON.parse(res.data); 
    if (res[0].ErrMensaje === '') {
      // this.diagReadOnly = false;
      this.ReadOnlyEncabRP = false;
      return true;
    } else {
      this.diagReadOnly = true;
      this.ReadOnlyEncabRP = true;
      showToast(res[0].ErrMensaje, 'error');
      return false;
    }
  
  }

  onSeleccEstado(e: any): void {
    this.DataRutasPartes.ESTADO = e.value;
  }

  onSeleccPrioridad(e: any): void {
    this.DataRutasPartes.PRIORIDAD = e.value;
  }

  CambioDatosForma(e: any): void {
    //this.DatosPrmRuta.DatosRutaParte = this.DataRutasPartes;
  }

  confirmClick(e: any): void {
    // Agregar nodo y expandir
    if (this.ModoPopUp === "treelist") {
      // Busca si existe nodo de secciones
    }
    this.popupVisible = false;
  }
  cancelClick(e: any): void {
    this.popupVisible = false;
  }

  // Permitir solo las operativas
  onCellPreparedLP(e: any) {
    // Solo deja seleccionables las operativas
    if (
      e.rowType == "data" &&
      e.cellElement.querySelector(".dx-select-checkbox")
    ) {
      let check = e.cellElement.querySelectorAll(".dx-select-checkbox");
      check.forEach((ele: any, ixfila: any) => {
        const inst = dxCheckBox.getInstance(ele);
        if (e.data.TIPO !== "OPERATIVA") inst.option("visible", false);
      });
    }
  }
  // Permitir solo una seleccion
  onSeleccNodo(e: any): void {
    this.SelNodoLP = e.currentSelectedRowKeys;
  }

  // Aceptar cambios del layout
  async cerrarListaDP(e:any, accion:any, ddBoxLay:any) {
    this.ddLayout.instance.close();
    
    if (accion === 'aceptar') {
      let addNodos: boolean = false;
      if(this.seccNodosRuta.length > 0) {
        addNodos = await new Promise((resolve, reject) => {
          Swal.fire({
            title: '',
            text: 'Hay una Ruta ya trazada, ¿Desea eliminarla y cargar el nuevo Layout?',
            iconHtml: "<i class='icon-alert-ol'></i>",
            showCancelButton: true,
            confirmButtonColor: '#DF3E3E',
            cancelButtonColor: '#438ef1',
            cancelButtonText: 'No, cancelar',
            confirmButtonText: 'Sí, continuar'
          }).then((result) => {
            if (result.isConfirmed) {
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
              resolve (addNodos = true);
            }
            if(result.isDismissed) {
              resolve (addNodos = false);
            }
          });
        });
      } else {
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
        addNodos = true;
      }

      if(addNodos) {
        ddBoxLay.option('value', this.GValorLayout);
        const selectedRowsLP = this.gridLP.instance.getSelectedRowsData();
        // Carga el diagrama por cada Layout
        selectedRowsLP.forEach((elay:any) => {
          const id:any = 'cnt_'+elay.ID_RUTA;
          //verifica si el layout ya esta cargado en el diagrama
          const npos:any = this.seccNodos.findIndex((s:any) => s.id === id);
          //si no esta lo agrega; si esta, lo omite
          if ( npos === -1 ) {
            const prm:any = {accion: "diagrama layout planta", ID_RUTA: elay.ID_RUTA};
            this._rutasdpservice
            .consulta("diagrama layout planta", prm, 'PRO013')
            .subscribe((resp) => {
              this.modelDiagrama = JSON.parse(resp.data);
              //verificar las secciones por agregar para no repetirlas en los layout
              let agregar: boolean = false;
              this.modelDiagrama.NODOS.forEach((nodo:any) => {
                if ( this.seccNodosBak.findIndex((d:any) => d.id_seccion === nodo.id_seccion) === -1 ) {
                  agregar = true;
                } else {
                  agregar = false;
                }
              });
              if (agregar) {
                // Agrega layout al diagrama
                this.agregarLayout( elay.ID_RUTA, elay.DESCRIPCION );
              } else {
                showToast('Hay secciones repetidas en '+elay.ID_RUTA+' -- '+elay.DESCRIPCION, 'error');
                this.gridLP.instance.deselectRows(elay.ID_RUTA);
                ddBoxLay.option('value', this.GValorLayout);
              }
            });
          }
  
        });

      }

    } else {
      this.GValorLayout = this.DataRutasPartes.LAYOUT_DP === '' ? [] : this.DataRutasPartes.LAYOUT_DP;
    }
    // Verifica si selecciono o no un Laoyout para cargar en el Diagrama
    const selectedRowsLP:any [] = this.gridLP.instance.getSelectedRowsData();
    if ( selectedRowsLP.length > 0)
      this.diagReadOnly = false;
    else {
      this.diagReadOnly = true;
      this.gridLP.instance.clearSelection();
    }
  }

  Vista_rapida() {
    this.opVista();
  }
  ExportPDF() {
    console.log("ExportPDF");
  }
  ExportExcel() {
    console.log("ExportExcel");
  }

  ngOnInit(): void {
    
    this.DataRutasPartes = {
      ID_RUTA: "",
      AUTO_CONSECUTIVO: 0,
      DESCRIPCION: "",
      ESTADO: "",
      TIPO: "",
      PRIORIDAD: "",
      SECCIONES: "",
      LAYOUT_DP: [],
      NODOS: [],
      CONECTORES: [],
      DIAG_LAYOUT: []
    };

    // Respuesta del visor de datos
    this.SVisor.getObs_Visor()
    .subscribe((resp) => {
      this.prmUsrAplBarReg.r_numReg = resp;
      this.opIrARegistro("IrA");
    });

    this.rutas.queryParams.pipe(takeUntil(this._unsubscribeAll)).subscribe((params) => {});

    const user:any = localStorage.getItem("usuario");
    this.prmUsrAplBarReg = {
      tabla: "RUTAS_PRODUCCION",
      aplicacion: "PRO-013",
      usuario: user,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: {}
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';

    // Trae datos de Layouts de planta
    this.valoresObjetos('layouts de planta', '');

    // Items menú contextual diagrama
    this.itemsMenuDiag = [
      { text: "Vincular a ruta", name: "vincular" },
      { text: "Des-vincular de ruta", name: "desvincular" },
    ];
    this.menuCommSeccion = [true, false, true, false, false, false, false];

  }

  onInitialized(e: { component: any; element: any }){
    var this_ = this;
    let diagram = (this.diagLay.instance as any)._diagramInstance;
    this.diagramRutas = e.component;
  }
  onInitializedMenu(e) {
    //this.contextMenuSeccion = e.component;
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj:string, accion:string){
    if (obj == 'layouts de planta' || obj == 'todos') {
      this._rutasdpservice
      .consulta("qlistadp", { accion: "qlistadp", ID_RUTA: "" }, 'PRO013')
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.GDatosLayoutDP = res;
        if(this.gridLP !== undefined && this.gridLP !== null)
          this.gridLP.instance.refresh();
        // if (accion === 'r_refrescar') {
        //   const POS:any = this.GDatosLayoutDP.findIndex((d:any) => d.ID_RUTA === this.DataRutasPartes.LAYOUT_DP[0]);
        //   if (POS > -1) {

        //     const prm:any = {accion: "refresh layout planta", ID_RUTA: this.GDatosLayoutDP[POS].ID_RUTA};
        //     this._rutasdpservice
        //     .consulta("refresh layout planta", prm, 'PRO013')
        //     .subscribe((resp) => {
        //       this.modelDiagrama = JSON.parse(resp.data);
              
        //       // Nodos y conectores del diagrama
        //       const container:any = this.seccNodos.filter((s:any) => s.type === "horizontalContainer");
        //       const connect:any = this.seccConec.filter((s:any) => s.id.match('clp_'));
        //       this.modelDiagrama.NODOS = JSON.parse(JSON.stringify(this.modelDiagrama.NODOS));
        //       this.modelDiagrama.CONECTORES = JSON.parse(JSON.stringify(this.modelDiagrama.CONECTORES));
        
        //       //verificar si los svg del diagrama estan en el json principal
        //       this.modelDiagrama.NODOS.forEach((nodo:any) => {
        //         if ( !this.NodosSvg.includes(nodo['type']) ) {
        //           let valoresDisponibles = this.NodosSvg.filter((d:any) => d.id !== 'pro-base-layout');
        //           const newType:any = Math.floor(Math.random() * valoresDisponibles.length);
        //           nodo.type = this.NodosSvg[newType].id;
        //         }
        //       });
        
        //       this.seccNodos = this.modelDiagrama.NODOS;
        //       this.seccNodos.push(container[0]);
        //       this.seccConec = this.modelDiagrama.CONECTORES;
        //       this.seccConec.push(connect[0]);

        //       this.seccNodosRuta = JSON.parse(
        //         JSON.stringify(this.modelDiagrama.NODOS)
        //       );
        //       this.seccConecRuta = JSON.parse(
        //         JSON.stringify(this.modelDiagrama.CONECTORES)
        //       );
        //       this.seccNodosBak = JSON.parse(JSON.stringify(this.seccNodosRuta));
        //       this.seccConecBak = JSON.parse(JSON.stringify(this.seccConecRuta));
        
        //       this.seccNodosDataSource = new ArrayStore({
        //         key: "id",
        //         data: this.seccNodos,
        //       });
        //       this.seccConecDataSource = new ArrayStore({
        //         key: "id",
        //         data: this.seccConec,
        //       });
        
        //       // Refresca
        //       setTimeout(() => {
        //         this.diagramRutas.option("autoZoomMode", "fitWidth");
        //         this.diagramRutas.option("autoZoomMode", "disabled");
        //       }, 300);
        //       this.diagLay.instance.repaint();
        //     });
            

        //   } else {
        //     this.showModal('¡No se encontro la ruta seleccionada!');
        //   }
        // }
      });
    };
    if (obj === 'consecutivo') {
      const prm = {ID_APLICACION: this.prmUsrAplBarReg.aplicacion, CLASE: 'Rutas Simples' };
      this._rutasdpservice.getConsecutivo('CONSECUTIVO',prm,this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if (res.ErrMensaje !== '') {
          this.showModal(res.ErrMensaje);
        } else {
          if(res.CONSECUTIVO !== 0) {
            this.DataRutasPartes.ID_RUTA = res.VAR_CONSECUTIVO;
            this.DataRutasPartes.AUTO_CONSECUTIVO = res.CONSECUTIVO;
          } else {
            this.DataRutasPartes.ID_RUTA = 'xxxxxxxx';
          }
        }
      });
    };

  }

  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte:any, archivo:any, datosrpt:any) {
    let filtroRep = {ID_RUTA: this.DataRutasPartes.ID_RUTA, TIPO: (this.DataRutasPartes == undefined ? 'Rutas Simples' : this.DataRutasPartes.TIPO)};
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
    const x = setTimeout(() => {
      this.initDiagrama = true;
      this.diagReadOnly = true;
      this.diagLay.instance.repaint();
    }, 400);
    //this.ddLayout.instance.option("dropDownOptions.width", 800);

    let diagram = (this.diagLay.instance as any)._diagramInstance;
    var apiController = diagram.apiController;
    var that = this;
    var contextMenuHandler = diagram.eventManager.contextMenuHandler;
    diagram.eventManager.onContextMenu =  function(e){
      that.modelPoint = { x: e.eventPoint.x, y: e.eventPoint.y }; //apiController.convertPoint(arguments[0].modelPoint);
      // Click derecho activa menú si cumple que está sobre un nodo
      if (that.ubicarNodoSeccion() && that.mnuAccion.match('new|update'))
        contextMenuHandler.onContextMenu(e);
    }

    // Opciones de botones para la selección del layout
    var that = this;
    this.dropDownOptions = { 
      width: 400,
      toolbarItems: [{
          toolbar: 'bottom',
          location: 'before',
          widget: "dxButton", 
          options: {
            id: "btnAceptarLDP",
            stylingMode: "contained",
            text: "Aceptar",
            type: "default",
            width: "120",
            onClick: function(e:any) { that.cerrarListaDP(e, 'aceptar', that.ddLayout.instance) }
          }
        }, 
        {
        toolbar: 'bottom',
        location: 'before',
        widget: "dxButton", 
        options: {
          id: "btnCerrarLDP",
          text: "Cancelar",
          type: "cancel",
          onClick: function(e:any) { that.cerrarListaDP(e, 'cancelar', that.ddLayout.instance) }
        }
      }] 
    }; 

  }

  ngOnDestroy(): void {
    this._unsubscribeAll.unsubscribe();
    this.subscription.unsubscribe();
    this.subs_visor.unsubscribe();
    this.subs_filtro.unsubscribe();
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

}
