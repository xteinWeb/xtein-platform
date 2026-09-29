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
import { DxButtonModule, DxDataGridModule, DxDiagramComponent, DxDiagramModule, DxFormComponent, DxFormModule, DxLoadPanelModule, DxPopoverModule, DxPopupComponent, DxPopupModule, DxScrollViewModule, DxSelectBoxModule, DxTextBoxModule, DxTreeListComponent, DxTreeListModule } from "devextreme-angular";
import {
  AppSettings,
  FlowEdge,
  FlowNode,
  MDistriplantas,
  MSecciones,
} from "../../../services/PRO011/interface";
import { SSeccionesdpService } from "../../../services/PRO011/e-seciones.service";
import ArrayStore from "devextreme/data/array_store";
import { catchError, max, takeUntil } from "rxjs/operators";
import { PRO011Service } from "../../../services/PRO011/PRO011.service";
import { PRO008Service } from "../../../services/PRO008/s_PRO008.service";
import { SbarraService } from "src/app/containers/regbarra/_sbarra.service";
import { clsBarraRegistro } from "src/app/containers/regbarra/_clsBarraReg";
import Swal from "sweetalert2";
import { SfiltroService } from "src/app/shared/filtro/_sfiltro.service";
import { GlobalVariables } from "src/app/shared/common/global-variables";
import { SvisorService } from "src/app/shared/vistarapida/_svisor.service";
import notify from 'devextreme/ui/notify';
import { imgtool } from 'src/app/shared/classes/imgtools';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { AngularSplitModule } from "angular-split";
import { CommonModule } from "@angular/common";
import { VistarapidaComponent } from "src/app/shared/vistarapida/vistarapida.component";
import { AngularResizeEventModule } from "angular-resize-event";
import { showToast } from '../../../shared/toast/toastComponent.js';
import { LibsvgService } from "../../../services/PRO011/SVisor.service";


declare let alertify: any;
@Component({
  selector: "PRO-012",
  templateUrl: "./PRO012.component.html",
  styleUrls: ["./PRO012.component.scss",
  "../../../../../node_modules/devexpress-diagram/dist/dx-diagram.min.css",
  "../../../../../node_modules/devextreme/dist/css/dx.common.css"],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxSelectBoxModule, DxTreeListModule, AngularSplitModule, DxDataGridModule,
            DxScrollViewModule, DxDiagramModule, DxPopupModule, VistarapidaComponent,
            DxPopoverModule, DxButtonModule, DxTextBoxModule, DxLoadPanelModule
          ],
  providers: [PRO011Service, AngularResizeEventModule]
})
export class PRO012Component implements OnInit, OnDestroy {
  public _unsubscribeAll: Subject<any>;

  @ViewChild("formLayout", { static: false }) formLayout: DxFormComponent;
  @ViewChild(DxTreeListComponent, { static: false }) treeList: DxTreeListComponent;
  @ViewChild("diagram", { static: false }) diagLay: DxDiagramComponent;
  @ViewChild("secciones", { static: false }) treeListLP: DxTreeListComponent;
  @ViewChild("popUpAddSecciones", { static: false }) popUpAddSecciones: DxPopupComponent;

  activeDiagrama: boolean = false;
  DataDistriPlanta: MDistriplantas;
  DataDistriPlanta_prev: MDistriplantas;
  DataDP_Q: MDistriplantas[] = [];
  DatosSeccRutasDP: MSecciones[];
  DatosSeccRutasDP_prev: MSecciones[] = [];
  selectedRowKeysSecciones: any[] = [];
  DatosSecciones: any;
  mnuAccion: string;
  VDatosReg: any[] = [];
  readOnly: boolean = false;
  readOnlySecciones: boolean = true;
  targetIdTooltip: string;
  infoSeccionTooltip: any[] = [];

  colCountByScreen: object;
  stylingMode = "filled";
  editorStylingMode: "filled";
  operCfg: string;
  ReadOnlyEncabDP = true;
  ReadOnlyEncabDPEstado = true;
  ReadOnlyEncabDPDescripcion = true;
  vecNodosSelecc: any;
  IdRutaAnterior: string;
  OpGuardar: string;
  dSBEstados = [{ ESTADO: "ACTIVO" }, { ESTADO: "INACTIVO" }];

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
  seccNodosDataSource: any;
  seccConecDataSource: any;
  elemNodo: FlowNode;
  elemConecEdit: FlowEdge;
  modelDiagrama: any;
  diagReadOnly: boolean = true;
  eliminarNodo: boolean = false;
  PopupTreeList: any;

  public contentHeader: object;
  NodosSvg:any = [];
  selectedNodos:any = [];
  selectedConn:any = [];


  // Selección de secciones en diagrama
  ModoPopUp: string;
  popupVisible: boolean = false;
  popupMode = "Secciones";
  SelNodoDato: any;
  SelNodoLP: any;
  dialogModal: string;
  errMsg: string;
  errTit: string;
  valorBaseCosto: string = '';
  loadingVisible = false;
	subscription: Subscription;
  subs_visor: Subscription;
  subs_filtro: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  prmUsrAplBarReg: clsBarraRegistro;

  // notificaciones
  toaVisible: boolean;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';
 
  constructor(
    private _rutasdpservice: PRO011Service,
    private _secciones: PRO008Service,
    private DatosPrmRuta: SSeccionesdpService,
    private SVisor: SvisorService,
    private rutas: ActivatedRoute, 
    private _sbarreg: SbarraService,
    private tabService: TabService,
    private _sfiltro: SfiltroService,
    _slibsvg: LibsvgService,
  ) {
    // Servicio de barra de registro
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
    })

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
    });

    _slibsvg.getArchivo().subscribe(() => {
      this.NodosSvg = _slibsvg.custShapes;
    });

    this._unsubscribeAll = new Subject();

    this.elemConecEdit = {
      id: "",
      text: "",
      fromId: "",
      toId: "",
      fromPoint: "-1",
      toPoint: "-1",
    };

    const flowNodes: FlowNode[] = [];
    const flowEdges: FlowEdge[] = [];
    this.seccNodosDataSource = new ArrayStore({
      key: "id",
      data: flowNodes,
    });
    this.seccConecDataSource = new ArrayStore({
      key: "id",
      data: flowEdges,
    });


    this.ValideExistencia = this.ValideExistencia.bind(this);
    this.confirmClick = this.confirmClick.bind(this);
    this.cancelClick = this.cancelClick.bind(this);
    this.onCellPrepared = this.onCellPrepared.bind(this);
    this.diagramCambios = this.diagramCambios.bind(this);
    this.selecSeccion = this.selecSeccion.bind(this);
    this.eliminarNodoDiagrama = this.eliminarNodoDiagrama.bind(this);
    this.cancelEliminarNodoDiagrama = this.cancelEliminarNodoDiagrama.bind(this);
    this.onSoloSeccSelec = this.onSoloSeccSelec.bind(this);
    this.opBlanquearForma = this.opBlanquearForma.bind(this);
    this.Guardar = this.Guardar.bind(this);
    this.onSeleccEstado = this.onSeleccEstado.bind(this);

  }


  // Llama a Acciones de registro
  selectedNodes: any[] = [];

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {

    // Activa modo de operacion para los demás componentes
    this._rutasdpservice.accion = operMenu.accion;

    switch (operMenu.accion) {
      case "r_ini":
        const user:any = localStorage.getItem("usuario");
        this.prmUsrAplBarReg = {
          tabla: "RUTAS_PRODUCCION",
          aplicacion: "PRO-012",
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
        if(this.valorBaseCosto !== '') {
          this.mnuAccion = "new";
          this.readOnly = false;
          this.opPrepararNuevo();
        } else {
          this.prmUsrAplBarReg.accion = 'r_cancelar';
          this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, 
                                  operacion: { } 
                                }
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          this.showModal('No hay parametro para Layout planta y Asignación de Costos configurado, por favor, actualice el registro en Parametros Generales.', 'Error', '');
        }
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
            this.mnuAccion = "";
            this.readOnly = true;
            this.ReadOnlyEncabDP = true;
            this.ReadOnlyEncabDPDescripcion = true;
            this.ReadOnlyEncabDPEstado = true;
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, 
                                    operacion: { } 
                                  }
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.opIrARegistro('r_numreg');
            if(this.VDatosReg.length <= 0) {
              this.opBlanquearForma();
              this.formLayout.instance.resetValues();
            }
          }
        });

        break;

      case "r_vista":
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

  
  opPrepararNuevo(): void {
    this.DatosPrmRuta.setObsDatosSeccDP("Nuevo");
    this.ReadOnlyEncabDP = false;
    this.statusSeccDP = "ED";
    this.diagReadOnly = true;
    this.ReadOnlyEncabDPDescripcion = false;
    this.opBlanquearForma();
    if(this.mnuAccion.match('new'))
      this.valoresObjetos('consecutivo');
    this.DataDistriPlanta.ESTADO = 'ACTIVO';

  }

  opBlanquearForma(): void {
    // Ini datos de la forma
    this.DataDistriPlanta.ID_RUTA = '';
    this.DataDistriPlanta.DESCRIPCION = '';
    this.DataDistriPlanta.ESTADO = '';
    this.DataDistriPlanta.TIPO = '';;
    this.DataDistriPlanta.PRIORIDAD = '';
    this.DataDistriPlanta.SECCIONES = '';
    this.DataDistriPlanta.DIAGRAMA = '';
    this.DataDistriPlanta.ID_LAYOUT = '';

    // Ini datos del diagrama
    this.treeList.instance.deselectAll();
    this.treeList.instance.repaint();
    this.DatosSeccRutasDP = JSON.parse(JSON.stringify(this.DatosSeccRutasDP_prev));
    this.inactivaNodosSeleccion(true);
    this.seccNodos.splice(0, this.seccNodos.length);
    this.seccConec.splice(0, this.seccConec.length);
    this.seccConecBak.splice(0, this.seccConecBak.length);
    const flowNodes: FlowNode[] = [];
    const flowEdges: FlowEdge[] = [];
    this.seccNodosBak = flowNodes;
    this.seccConecBak = flowEdges;
    this.seccNodosDataSource = new ArrayStore({
      key: "id",
      data: flowNodes,
    });
    this.seccConecDataSource = new ArrayStore({
      key: "id",
      data: flowEdges,
    });
  }

  // Activa/Inactiva nodos de seleccion
  inactivaNodosSeleccion (activar: boolean) {
    // Inactiva nodos en el arbol de secciones
    this.treeList.instance.forEachNode((node: any) => {
      const rowIndex = this.treeList.instance.getRowIndexByKey(node.key);
      var fila:any = this.treeList.instance.getRowElement(rowIndex);
      const check = fila[0].querySelectorAll(".dx-select-checkbox");
      check.forEach((ele: any, ixfila: any) => {
        const inst = dxCheckBox.getInstance(ele);
        inst.option("disabled", activar);
      });
    });
  }

  async opPrepararModificar() {
    this.DatosPrmRuta.setObsDatosSeccDP("Modificar");
    this.ReadOnlyEncabDP = false;
    this.ReadOnlyEncabDPDescripcion = false;
    this.ReadOnlyEncabDPEstado = false;
    this.statusSeccDP = "ED";
    // Ini datos del diagrama
    this.treeList.instance.repaint();
    this.DatosSeccRutasDP = JSON.parse(JSON.stringify(this.DatosSeccRutasDP_prev));

    this.diagReadOnly = false;
    this.IdRutaAnterior = this.DataDistriPlanta.ID_RUTA;

    // Analiza nodos y conectores por Integridad referencial
    const prm = { NODOS: this.seccNodos, 
                  CONECTORES: this.seccConec,
                  ID_LAYOUT: this.DataDistriPlanta.ID_RUTA
                };
    const apiRest = this._rutasdpservice.consulta('integridad referencial layout', prm, 'PRO012');
    let res = await lastValueFrom(apiRest, {defaultValue: true});
    res = JSON.parse(res.data); 
    if (res[0].ErrMensaje !== '') {
      this.showModal(res[0].ErrMensaje,'¡Importante!');
      return;
    }

    // Mensaje
    if (res[0].NODOS.length !== 0 || res[0].CONECTORES.length !== 0) {
      this.showModal('Hay secciones y conectores que ya están asociados a otras rutas. '+
                     'Su modificación quedará inactiva',
                     '¡Importante!');
    }

    // Bloquea objetos
    let bnod : any[] = res[0].NODOS;
    bnod.forEach(elnod => {
      const nx = this.seccNodos.findIndex(nod => String(nod.id) === elnod.id);
      if (nx !== -1)
        this.seccNodos[nx].bloqSeccion = true;
    });
    let bcon : any[] = res[0].CONECTORES;
    bcon.forEach(elcon => {
      const nx = this.seccConec.findIndex(con => String(con.id) === elcon.id);
      if (nx !== -1)
        this.seccConec[nx].bloqConn = true;
    });
    this.seccNodosDataSource = new ArrayStore({
      key: "id",
      data: this.seccNodos,
    });
    this.seccConecDataSource = new ArrayStore({
      key: "id",
      data: this.seccConec,
    });

    // Inactiva nodos en el arbol de secciones
    this.treeList.instance.forEachNode((node: any) => {
      const exf = bnod.findIndex(nod => nod.id === String(node.key));
      if (exf !== -1) {
        const rowIndex = this.treeList.instance.getRowIndexByKey(node.key);
        var fila:any = this.treeList.instance.getRowElement(rowIndex);
        const check = fila[0].querySelectorAll(".dx-select-checkbox");
        check.forEach((ele: any, ixfila: any) => {
          const inst = dxCheckBox.getInstance(ele);
          inst.option("disabled", true);
        });
      
      }
    });


  }

  async opPrepararGuardar(accion: string) {
    // Valida si hay diagrama
    if (this.seccNodosDataSource._array.length === 0) {
      this.showModal("No hay diagrama generado. Incluya secciones y su flujo entre ellas","Falta diagrama");
      return;
    }
    if (this.DataDistriPlanta.ID_RUTA === '' || this.DataDistriPlanta.ESTADO === '' || this.DataDistriPlanta.DESCRIPCION === '') {
      showToast("Faltan datos, complete todos los campos","error");
      return;
    }

    // Asociación de las secciones solo escogidas
    this.selectedNodes = this.treeList.instance.getSelectedRowsData("all");
    this.DataDistriPlanta.TIPO = "Layout Planta";
    const datossecc = { JSECC_ITM: this.selectedNodes };
    const datosdiagrama = {
      JDIAGRAMA: {
        NODOS: JSON.stringify(this.seccNodosDataSource._array),
        CONECTORES: JSON.stringify(this.seccConecDataSource._array),
      },
    };
    const prmDatos = {
      ...this.DataDistriPlanta,
      ID_RUTA_ANTERIOR: this.IdRutaAnterior,
    };
    const datossencab = { JRUTAS_ENC: prmDatos };
    
    // Exporta imagen
    let imgdiagtmp = await new Promise((resolve, reject) => {
      this.diagLay.instance.exportTo('png', (data) => {
        return resolve(data);
      });
    })
    let itool = new imgtool(); 
    var imgdiag;
    await itool.removeImageBlanks(imgdiagtmp).then(data => { imgdiag = data });
    const prmDatosGuardar = JSON.parse(
      (
        JSON.stringify(datossencab) +
        JSON.stringify(datossecc) +
        JSON.stringify(datosdiagrama) +
        JSON.stringify({ IMAGEN: imgdiag })
      ).replace(/}{/g, ",")
    );

    // API guardado de datos
    this.loadingVisible = true;
    var exito = false;
    this._rutasdpservice
      .save(accion, prmDatosGuardar)
      .pipe(takeUntil(this._unsubscribeAll), 
        catchError((err) =>{
          this.statusSeccDP = "ED";
          this.treeList.instance.repaint();
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
          let nodoselecc:any = [];
          for (const nodo of this.selectedNodes) {
            nodoselecc.push(nodo.ITEM.toString());
          }
          this.statusSeccDP = "";
          this.treeList.instance.repaint();
          this.DataDistriPlanta.SECCIONES = JSON.stringify(nodoselecc);
          this.DataDistriPlanta.DIAGRAMA = JSON.stringify({
            NODOS: this.seccNodosDataSource._array,
            CONECTORES: this.seccConecDataSource._array,
          });
          
          // Actualiza VDatosReg
          if (accion.match("new|copy")) {
            this.VDatosReg = [];
            this.VDatosReg.push(this.DataDistriPlanta);
          } else {
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1] = JSON.parse(JSON.stringify(this.DataDistriPlanta));
          }

          // Indicadores 
          this.ReadOnlyEncabDP = true;
          this.ReadOnlyEncabDPDescripcion = true;
          this.ReadOnlyEncabDPEstado = true;
          this.diagReadOnly = true;

          // Operaciones de barra
          if (this.VDatosReg.length > 0) {
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              r_totReg: this.VDatosReg.length,
              r_numReg: 1,
              accion: 'r_navegar',
              operacion: {}
            }
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          } else {
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              r_totReg: 0,
              r_numReg: 0,
              accion: 'r_cancelar',
              operacion: {}
            }
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this._rutasdpservice.accion = 'r_numreg';
          }
          showToast('Registro guardado', 'success');
        }
      });
  }

  opPrepararBuscar(accion:any): void {
    if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Layout de Planta",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      const prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      arrFiltro.push({ CAMPO: "TIPO", EXPRESION: "Layout Planta" });
      const prm = { RUTAS_PRODUCCION: arrFiltro };
      this.loadingVisible= true;
      this._rutasdpservice
        .consulta('consulta', prm, 'PRO012')
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((data: any) => {
          this.loadingVisible= false;
          this._sfiltro.enConsulta = false;
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const datares = res;

          if (datares[0].ErrMensaje !== '') {
            this.VDatosReg = [];
            this.vecNodosSelecc = [];
            this.treeList.instance.selectRows([], false);
            showToast(datares[0].ErrMensaje, 'error');
            // Prepara la barra
            this.prmUsrAplBarReg = {...this.prmUsrAplBarReg,
                                    r_totReg: 0,
                                    r_numReg: 0,
                                    accion: 'r_cancelar',
                                    operacion: {}
                                   }
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          } else {
            this.VDatosReg = datares === null ? [] : datares;
            // Prepara la barra para navegación
            this.prmUsrAplBarReg = {...this.prmUsrAplBarReg,
                                    r_totReg: datares.length,
                                    r_numReg: 1,
                                    accion: 'r_navegar',
                                    operacion: {}
                                   }
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          }

          if (this.VDatosReg.length > 0) {
            this.DataDistriPlanta = JSON.parse(JSON.stringify(this.VDatosReg[0]));

            // Selecciona las secciones asociadas
            try {
              this.vecNodosSelecc = JSON.parse(this.VDatosReg[0].SECCIONES);
              this.DatosPrmRuta.setDatosSeleccionDP(
                this.vecNodosSelecc.SECCIONES
              );
              this.modelDiagrama = JSON.parse(this.VDatosReg[0].DIAGRAMA);
            } catch (error) {
              this.modelDiagrama = { NODOS: [{}], CONECTORES: [{}] };
            }
            // >*this.DatosPrmRuta.setObsDatosSeccDP('Seleccion');
          } else {
            this.DataDistriPlanta = {
              ID_RUTA: "",
              AUTO_CONSECUTIVO: 0,
              DESCRIPCION: "",
              ESTADO: "",
              TIPO: "",
              PRIORIDAD: "",
              SECCIONES: "[]",
              DIAGRAMA: { NODOS: [], CONECTORES: [] },
            };
            this.DatosPrmRuta.setDatosSeleccionDP({});
            this.modelDiagrama = { NODOS: [], CONECTORES: [] };
          }

          // Selecciona las secciones
          this.treeList.instance.selectRows(this.vecNodosSelecc, false);
          this.statusSeccDP = "";
          // this.treeList.instance.repaint();

          // Trae el diagrama
          this.seccNodos =
            JSON.stringify(this.modelDiagrama.NODOS[0]) === "{}"
              ? []
              : this.modelDiagrama.NODOS;
          this.seccNodosDataSource = new ArrayStore({
            key: "id",
            data: this.seccNodos,
          });
          this.seccConec =
            JSON.stringify(this.modelDiagrama.CONECTORES[0]) === "{}"
              ? []
              : this.modelDiagrama.CONECTORES;
          this.seccConecDataSource = new ArrayStore({
            key: "id",
            data: this.seccConec,
          });
          this.seccNodosBak = JSON.parse(JSON.stringify(this.seccNodos));
          this.seccConecBak = JSON.parse(JSON.stringify(this.seccConec));

          this.treeList.instance.forEachNode(nodsecc => {
            this.treeList.instance.collapseRow(nodsecc.key);
          });
          this.treeList.instance.refresh();

          // Trae los items en los componentes asociados
          if (this.VDatosReg.length > 0) {
            this.opIrARegistro('r_primero');
          }
        });
    }

    // this.ReadOnlyEncabDP = false;
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        this.prmUsrAplBarReg.r_numReg = 1;
        this.DataDistriPlanta = JSON.parse(JSON.stringify(this.VDatosReg[0]));
        this.modelDiagrama = JSON.parse(this.VDatosReg[0].DIAGRAMA);
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.DataDistriPlanta = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.modelDiagrama = JSON.parse(
          this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].DIAGRAMA
        );
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        try {
          this.prmUsrAplBarReg.r_numReg =
            this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
              ? this.VDatosReg.length
              : this.prmUsrAplBarReg.r_numReg + 1;
          this.DataDistriPlanta = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this.modelDiagrama = JSON.parse(
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]?.DIAGRAMA
          );
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } catch (err) {
          this.modelDiagrama = [];
        }
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DataDistriPlanta = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.modelDiagrama = JSON.parse(
          this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].DIAGRAMA
        );
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
          this.DataDistriPlanta = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this.modelDiagrama = JSON.parse(
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].DIAGRAMA
          );
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.DataDistriPlanta = {
            ID_RUTA: "",
            AUTO_CONSECUTIVO: 0,
            DESCRIPCION: "",
            ESTADO: "",
            TIPO: "",
            PRIORIDAD: "",
            SECCIONES: "{}",
            DIAGRAMA: "{}",
          };
          this.modelDiagrama = { NODOS: [{}], CONECTORES: [{}] };
        }
        this.ReadOnlyEncabDP = true;
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        this.prmUsrAplBarReg.r_totReg--;
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length > 0) {
          this.DataDistriPlanta = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
          this.modelDiagrama = JSON.parse(
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].DIAGRAMA
          );
        } else {
          this.DataDistriPlanta = {
            ID_RUTA: "",
            AUTO_CONSECUTIVO: 0,
            DESCRIPCION: "",
            ESTADO: "",
            TIPO: "",
            PRIORIDAD: "",
            SECCIONES: "{}",
            DIAGRAMA: "{}",
          };
          this.modelDiagrama = { NODOS: [{}], CONECTORES: [{}] };
        }
        break;

      default:
        break;
    }

    try {
      // Trae secciones asociadas a la ruta
      this.statusSeccDP = "";
      this.diagReadOnly = true;
      this.vecNodosSelecc = JSON.parse(this.DataDistriPlanta?.SECCIONES);
      this.treeList.instance.selectRows(this.vecNodosSelecc, false);
      this.treeList.instance.repaint();

      // Explora el arbol de secciones y posiciona el nodo
      if (this.vecNodosSelecc.length > 0) {
        this.vecNodosSelecc.forEach((elnodo:any) => {
          this.treeList.instance.navigateToRow(Number(elnodo));
        });
      }

      //verificar si los svg del diagrama estan en el json principal
      this.modelDiagrama.NODOS.forEach((nodo:any) => {
        if ( !this.NodosSvg.includes(nodo['type']) ) {
          let valoresDisponibles = this.NodosSvg.filter((d:any) => d.id !== 'pro-base-layout');
          const newType:any = Math.floor(Math.random() * valoresDisponibles.length);
          nodo.type = this.NodosSvg[newType].id;
        }
      });

      // Trae diagrama
      this.seccNodos =
        JSON.stringify(this.modelDiagrama.NODOS[0]) === "{}"
          ? []
          : this.modelDiagrama.NODOS;
      for (var k=0; k < this.seccNodos.length; k++) {
        const nomsecc:any = this.DatosSeccRutasDP.find(s => s.ITEM === Number(this.seccNodos[k].id));
        if (nomsecc !== null && nomsecc !== undefined && nomsecc !== '')
          this.seccNodos[k] = {...this.seccNodos[k], bloqSeccion: false};
      };
      this.seccNodosDataSource = new ArrayStore({
        key: "id",
        data: this.seccNodos,
      });
      this.seccConec =
        JSON.stringify(this.modelDiagrama.CONECTORES[0]) === "{}"
          ? []
          : this.modelDiagrama.CONECTORES;
      for (var k=0; k < this.seccConec.length; k++) {
        this.seccConec[k] = {...this.seccConec[k], bloqConn: false};
      };
      this.seccConecDataSource = new ArrayStore({
        key: "id",
        data: this.seccConec,
      });
      this.seccNodosBak = JSON.parse(JSON.stringify(this.seccNodos));
      this.seccConecBak = JSON.parse(JSON.stringify(this.seccConec));

      // Asociar tooltips
      this.asociarTooltipsSecciones();


    } catch (err) {
      this.showModal(err);
      // this.vecNodosSelecc = [];
    }
  }


  opEliminar(): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html: "¿Desea eliminar el Layout de Planta <i>" +
            this.DataDistriPlanta.ID_RUTA +
            " " +
            this.DataDistriPlanta.DESCRIPCION +
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
    const prm = { ID_RUTA: this.DataDistriPlanta.ID_RUTA };
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
        this.ReadOnlyEncabDP = true;
        this.ReadOnlyEncabDPEstado = true;
        this.ReadOnlyEncabDPDescripcion = true;
        showToast('Layout eliminado', 'success');

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
      Titulo: "Layout de planta",
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: '',
      Filtro: '',
      keyGrid: ['ID_RUTA']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
    
  }

  onToolbarPreparing(e: any) {
    e.toolbarOptions.items.push({
      id:'dxCheckBoxSeleccionadas',
      location: "before",
      widget: "dxCheckBox",
      options: {
        width: 140,
        text: "Solo seleccionadas",
        onValueChanged: this.onSoloSeccSelec.bind(this),
      },
    });
  }

  onSoloSeccSelec(e: any) {
    // this.treeList.instance.forEachNode((node: any) => {
    //   if (!e.value) {
    //     node.data.IsActive = true;
    //   } else {
    //     if (!node.hasChildren) {
    //       if (!this.treeList.instance.isRowSelected(node.data.ITEM)) {
    //         node.data.IsActive = !e.value;
    //       }
    //     }
    //   }
    // });
    // if (!e.value) 
    //   // this.treeList.instance.state(null);
    //   this.treeList.instance.clearFilter();
    // else 
    //   // this.treeList.instance.option("filterValue", ["IsActive", "=", true]);
    //   this.treeList.instance.filter(["IsActive"]);
    //   setTimeout(() => {
    //     this.treeList.instance.forEachNode((node: any) => {
    //       this.treeList.instance.expandRow(node.key);
    //     });
    //   }, 300);
    if (e.value) {
      if ( this.selectedRowKeysSecciones.length > 0) {
        this.DatosSeccRutasDP_prev = JSON.parse(JSON.stringify(this.DatosSeccRutasDP));
        const key:any = 'ITEM';
        // Filtrar los datos del DataSource para cargar solo los elementos seleccionados
        let data:any = JSON.parse(JSON.stringify(
          this.DatosSeccRutasDP.filter((item) => {
            return this.selectedRowKeysSecciones.includes(item.ITEM);
          })
        ));
        if( data.length > 0) {
          data.forEach((item:any) => {
            if( data.findIndex((d:any) => d.ITEM === item.ANTERIOR) === -1)
              item.ANTERIOR = 0;
          });
          this.DatosSeccRutasDP = data;
        }

        this.treeList.instance.refresh();
      } else {
        showToast('No hay items seleccionados por mostrar.', 'error');
      }
    } else {
      this.DatosSeccRutasDP = JSON.parse(JSON.stringify(this.DatosSeccRutasDP_prev));
    }

  }

  onContentReady(e: any): void {
    if (this.statusSeccDP === "INI")
      return;

    const check = e.element.querySelectorAll(".dx-select-checkbox");
    // var store = this.treeList.instance.getDataSource().store();

    check.forEach((ele: any, ixfila: any) => {
      const inst = dxCheckBox.getInstance(ele);
      // store.load().done((items) => {
      //  let lastId = items[items.length - 1].ID + 1;
      // });
      if (inst) {
        if (this.statusSeccDP !== "ED") {
          inst.option("disabled", true);
        } else {
          inst.option("disabled", false);
        }
      }
    });
  }

  onInitialized(e: any) {
    this.PopupTreeList = e.component;
  }

  onContentReadySecciones(e: any) {
    setTimeout(() => {
      this.onResizeEnd(undefined);
    }, 500);
  }

  onResizeEnd(e: any) {
    let popupHeight = Number(this.popUpAddSecciones.instance.option("height"))?? 400;
    this.PopupTreeList.option("height",popupHeight-100);
  }

  onCellPrepared(e: any): void {
    // Solo deja seleccionables las operativas
    if (
      e.rowType == "data" &&
      e.cellElement.querySelector(".dx-select-checkbox")
    ) {
      const check = e.cellElement.querySelectorAll(".dx-select-checkbox");
      check.forEach((ele: any, ixfila: any) => {
        const inst = dxCheckBox.getInstance(ele);
        if (this.mnuAccion !== undefined && this.mnuAccion !== null && this.mnuAccion !== '') {
          if (this.valorBaseCosto === 'PROCESO' && e.data.TIPO === this.valorBaseCosto && e.data.INVENTARIO === true)
            inst.option("visible", true);
          else if (this.valorBaseCosto === 'PROCESO' && e.data.TIPO === this.valorBaseCosto && e.data.INVENTARIO === false)
            inst.option("visible", false);
          else if (this.valorBaseCosto === 'OPERATIVA' && e.data.TIPO === this.valorBaseCosto)
            inst.option("visible", true);
          else if (e.data.TIPO !== this.valorBaseCosto)
            inst.option("visible", false);

        } else if (this.mnuAccion === '' && this.selectedRowKeysSecciones.length > 0) {
          const inst = dxCheckBox.getInstance(ele);
          if (this.selectedRowKeysSecciones.findIndex((d:any) => d === e.data.ITEM) > -1)
            inst.option("visible", true);
          else
            inst.option("visible", false);

        } else {
          inst.option("visible", false);
        }
        
      });
    }
  }
  
  //Verifica si la seccion marcada tiene hijas
  seccionesHijas(NodoSecc:any) {
    const NodoHijoSecc:any[] = this.DatosSeccRutasDP.filter((d:any) => d.ANTERIOR === NodoSecc.ITEM);
    if ( NodoHijoSecc.length > 0 ) {
      NodoHijoSecc.forEach((ele:any) => {
        if ( ele.TIPO === this.valorBaseCosto)
          this.selectedRowKeysSecciones.push(ele.ITEM);
        else {
          this.seccionesHijas(ele);
        }
      });
    }
  }

  // Marca sección y agrega componente al diagrama
  selecSeccion(e: any): void {
    // *** si ES ADICION *** //
    if (e.currentSelectedRowKeys.length > 0) {
      if ( this.statusSeccDP === "" || e.selectedRowKeys.length === 0 ) return;
      e.selectedRowKeys.forEach((key:any) => {
        let NodoSecc = this.DatosSeccRutasDP.find((s) => s.ITEM === key)!;
        this.seccionesHijas(NodoSecc);
      });
        
      this.selectedRowKeysSecciones.forEach((secc:any) => {
        let NodoSecc = this.DatosSeccRutasDP.find((s) => s.ITEM === secc)!;
        if(NodoSecc.TIPO === this.valorBaseCosto) {
          if(this.seccNodos.findIndex((d:any) => d.id_seccion === NodoSecc.ID_SECCION) === -1) {
            // Coordenadas de 4 en 4
            let maxX = Number(
              this.seccNodos.length !== 0 
              ? this.seccNodos.reduce((ant, act) => {
                  return Number(ant.x) > Number(act.x) ? ant : act;
                }).x 
              : 0
            );
            let maxY = Number(
              this.seccNodos.length !== 0 
              ?  this.seccNodos.reduce((ant, act) => {
                  return Number(ant.y) > Number(act.y) ? ant : act;
                }).y
              : 0
            );
            if (this.seccNodos.length !== 0) {
              let obj = this.seccNodos.reduce((ant, act) => {
                return Number(ant.y) + Number(ant.height) >
                  Number(act.y) + Number(act.height)
                  ? ant
                  : act;
              });
              if (Number(obj.x) + 150 <= 600) {
                maxX = Number(obj.x);
                maxY = Number(obj.y)
              } else {
                maxX = 0;
                maxY = maxY + 110;
              }
            } 
            const nx = maxX === 0 ? "50" : String(maxX + 150); 
            const ny = maxY === 0 ? "50" : String(maxY);

            //Carga el svg del contenedor para el nodo
            let typeContainerNodo:any = '';
            let valoresDisponibles = this.NodosSvg.filter((d:any) => d.id !== 'pro-base-layout');
            const newType:any = Math.floor(Math.random() * valoresDisponibles.length);
            typeContainerNodo = this.NodosSvg[newType].id;
      
            this.elemNodo = {
              id: secc,
              text: NodoSecc.DESCRIPCION,
              type: typeContainerNodo, 
              x: nx,
              y: ny,
              width: "100",
              height: "60",
              bloqSeccion: false,
              id_seccion: NodoSecc.ID_SECCION,
              nom_seccion: NodoSecc.DESCRIPCION
            };
            this.seccNodos = [...this.seccNodos, this.elemNodo];
            this.seccNodosDataSource = new ArrayStore({
              key: "id",
              data: this.seccNodos,
            });
            this.seccNodosBak = JSON.parse(JSON.stringify(this.seccNodos));
      
            // Adiciona conectores
            if (this.seccNodos.length > 1) {
              const seccUlt = this.seccNodos[this.seccNodos.length - 2].id;
              const elemConect = {
                id: "clp_" + seccUlt + "_" + secc,
                fromId: seccUlt,
                toId: secc,
                text: "",
                conecStyle: "stroke: #0ec308; stroke-width: 1",
                fromPoint: "4",
                toPoint: "10",
              };
              this.seccConec = [...this.seccConec, elemConect];
              this.seccConecDataSource = new ArrayStore({
                key: "id",
                data: this.seccConec,
              });
              this.seccConecBak = JSON.parse(JSON.stringify(this.seccConec));
            }
          }
  
        }
      });

    }

    // *** si ES ELIMINACION *** //
    if (e.currentDeselectedRowKeys.length > 0) {
      e.currentDeselectedRowKeys.forEach((element:any) => {
        const seccElim = element;
        // Elimina nodo
        this.seccNodos.forEach((item: any, index: any) => {
          if (item.id === seccElim) this.seccNodos.splice(index, 1);
        });
        this.seccNodosDataSource = new ArrayStore({
          key: "id",
          data: this.seccNodos,
        });
        this.seccNodosBak = JSON.parse(JSON.stringify(this.seccNodos));
  
        // Elimina conectores
        let elcon1 = this.seccConecDataSource._array.find((s: any) => s.fromId === seccElim);
        let elcon = elcon1 !== undefined ? JSON.parse(JSON.stringify(elcon1)) : [];
        for(var k=0; k < elcon.length; k++) {
          var connBusq = this.seccConecDataSource._array.findIndex((s: any) => s.id === elcon[k]);
          if (connBusq !== -1) this.seccConec.splice(connBusq, 1);
        }
        elcon1 = this.seccConecDataSource._array.find((s: any) => s.toId === seccElim);
        elcon = elcon1 !== undefined ? JSON.parse(JSON.stringify(elcon1)) : [];
        for(var k=0; k < elcon.length; k++) {
          var connBusq = this.seccConecDataSource._array.findIndex((s: any) => s.id === elcon[k]);
          if (connBusq !== -1) this.seccConec.splice(connBusq, 1);
        }
    
        this.seccConecDataSource = new ArrayStore({
          key: "id",
          data: this.seccConec,
        });
        this.seccConecBak = JSON.parse(JSON.stringify(this.seccConec));
      });

      if ( this.selectedRowKeysSecciones.length === 0 ) {
        // Ini datos del diagrama
        this.treeList.instance.deselectAll();
        this.treeList.instance.repaint();
        if ( this.DataDistriPlanta.ID_RUTA === '' )
          this.inactivaNodosSeleccion(true);
        this.seccNodos.splice(0, this.seccNodos.length);
        this.seccConec.splice(0, this.seccConec.length);
        this.seccConecBak.splice(0, this.seccConecBak.length);
        const flowNodes: FlowNode[] = [];
        const flowEdges: FlowEdge[] = [];
        this.seccNodosBak = flowNodes;
        this.seccConecBak = flowEdges;
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
    e.component.option("hasChanges", false);
    // Refresh info secciones
    this.asociarTooltipsSecciones();

  }

  // Asociar informacion de secciones en tooltips
  asociarTooltipsSecciones() {
    setTimeout(() => {
      const docdiag = document.getElementById('diagram');
      const objshape = docdiag?.querySelectorAll('g.shape')!;
      for (let i = 0; i < objshape.length; i++) {
        const e = objshape[i];
        const x = objshape[i].firstChild as HTMLElement;
        if (e.id === '') {
          if (x.nodeName === 'image' ) {
            if (e.childNodes[3] !== undefined) {
              if (e.childNodes[3].textContent !== undefined) {
                const data_asis:any = this.DatosSeccRutasDP;

                const isecc = this.DatosSeccRutasDP.find((s:any) => s.DESCRIPCION.replace(/\s/g,'') === e.childNodes[3].textContent);
                if (isecc !== undefined) {
                  e.setAttribute('id', "nsecc_" + isecc.ID_SECCION);
                  let that = this;
                  e.addEventListener("mouseover", ( event ) => {
                    that.targetIdTooltip = "#" + e.id;
                  });
                  if (e instanceof HTMLElement) {
                  }
                }
              }
            }
          }
        }
      };
    }, 3000);
  }


  // Muestra info general de la sección
  onShowingInfoSecc(e:any) {
    const idsecc = this.targetIdTooltip.replace('#nsecc_','');
    let NodoSecc = this.DatosSeccRutasDP.find((s:any) => s.ID_SECCION === idsecc);
    if (NodoSecc !== undefined) {
        this.infoSeccionTooltip[0] = idsecc;
        this.infoSeccionTooltip[1] = NodoSecc.DESCRIPCION;
        this.infoSeccionTooltip[1] = '<b>'+NodoSecc.DESCRIPCION+'</b>';
        this.infoSeccionTooltip[2] = 'Asignable: <i>' + (NodoSecc.ASIGNABLE ? 'Sí' : 'No') + '</i><br>' + 
                                     'Inventario: <i>' + (NodoSecc.INVENTARIO ? 'Sí' : 'No') + '</i><br>' +
                                     'Mano de Obra: <i>' + (NodoSecc.MANO_OBRA ? 'Sí' : 'No') + '</i><br>';
    }
  }


  showPopup(popupMode: any, data: any): void {
    this.popupVisible = true;

    // Visualiza todas las secciones para selección
    if (this.ModoPopUp == "treelist") {
      this.DatosSecciones = this.DatosSeccRutasDP;
    }
  }
  confirmClick(e: any): void {
    // Agregar nodo y expandir
    if (this.ModoPopUp === "treelist") {
      // Busca si existe nodo de secciones
      this.eliminarNodo = false;
      const seccNodo = this.treeListLP.instance.getSelectedRowsData("all");
      if (!this.treeList.instance.isRowSelected(seccNodo[0].ITEM)) {
        this.treeList.instance.selectRows([seccNodo[0].ITEM], true);
      }
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
        if (e.data.TIPO != "OPERATIVA") inst.option("visible", false);
      });
    }
  }

  // Permitir solo una seleccion
  onSeleccNodo(e: any): void {
    this.SelNodoDato = this.treeListLP.instance.getSelectedRowsData("all");
    this.SelNodoLP = e.currentSelectedRowKeys;
  }
  onRowDblClick(e: any): void {
    // Agregar nodo y expandir
    if (this.ModoPopUp === "treelist") {
      // Busca si existe nodo de secciones
      this.eliminarNodo = false;
      const seccNodo = this.treeListLP.instance.getSelectedRowsData("all");
      if (!this.treeList.instance.isRowSelected(seccNodo[0].ITEM)) {
        this.treeList.instance.selectRows([seccNodo[0].ITEM], true);
      }
    }
    this.popupVisible = false;
  }
  onSeleccEstado(e: any): void {
    this.DataDistriPlanta.ESTADO = e.value;
  }
  
  autoSaveTimeout: any = -1;
  diagramCambios(e: any): any {
    // Valida si hubo cambios de un nodo
    if ( this.diagReadOnly || this.popupVisible || this.seccNodosDataSource._array.length === 0 )
      return;

    // ** Valida ELIMINACIÓN ** //
    if (this.seccNodosBak.length > this.seccNodosDataSource._array.length) {
      // Confirma cual es el que falta
      this.seccNodosBak.forEach((nodo: any) => {
        const nodBusq = this.seccNodosDataSource._array.find(
          (s: any) => s.id === nodo.id
        );
        if (nodBusq === undefined) {
          this.elemNodo = nodo; // ** Nodo eliminado
          return false;
        }
        return true;
      });

      if (!this.elemNodo.type.match("pro-")) return;
  
      e.component.option("hasChanges", false);
      return;
    }

    // console.log('options...',e);
    // ** Valida ADICIÓN ** //
    this.elemNodo = this.seccNodosDataSource._array[ this.seccNodosDataSource._array.length - 1 ]; // ** Nodo info
    if (this.elemNodo.type.match("pro-")) {
      let NodoSecc = this.DatosSeccRutasDP.find( (s) => s.ITEM === Number(this.elemNodo.id) );
      if (NodoSecc === undefined) {
        if(this.mnuAccion === 'new') {
          // Remueva el que acaba de arrastrar (drop)
          this.seccNodosDataSource._array.pop();
          this.popupVisible = true;
          this.ModoPopUp = "treelist";
          this.showPopup("Secciones", "");
          e.component.option("hasChanges", false);
          return;
        };
        if(this.mnuAccion === 'update') {
          Swal.fire({
            title: '',
            text: 'Se modifico una sección existente en la ruta, ¿Desea reemplazar o eliminar '+ 
                  this.elemNodo.nom_seccion + ' - '+this.elemNodo.nom_seccion +'?',
            iconHtml: "<i class='icon-alert-ol'></i>",
            showCancelButton: true,
            confirmButtonColor: '#DF3E3E',
            cancelButtonColor: '#438ef1',
            cancelButtonText: 'Reemplazar',
            confirmButtonText: 'Eliminar'
          }).then((result) => {
            if (result.isConfirmed) {
              // Elimina los conectores que conecten con la seccion modificada.
              const conRe:any = this.seccConec.filter((d:any) => (d.fromId === this.elemNodo.id) || (d.toId === this.elemNodo.id));
              conRe.forEach((con:any) => {
                const nposfromId:any = this.seccConec.findIndex((d:any) => d.fromId === this.elemNodo.id );
                if(nposfromId !== -1)
                  this.seccConec.splice(nposfromId, 1);
                const posToId:any = this.seccConec.findIndex((d:any) => d.toId === this.elemNodo.id );
                if(posToId !== -1)
                  this.seccConec.splice(posToId, 1);
              });
              this.seccConecDataSource = new ArrayStore({
                key: "id",
                data: this.seccConec,
              });
              this.seccConecBak = JSON.parse(JSON.stringify(this.seccConec));
              // Elimina los NODOS con la seccion modificada.
              const seccRe:any = this.seccNodos.filter((d:any) => d.id === this.elemNodo.id );
              seccRe.forEach((con:any) => {
                const posNodo:any = this.seccNodos.findIndex((d:any) => d.id === this.elemNodo.id );
                if(posNodo !== -1)
                  this.seccNodos.splice(posNodo, 1);
              });
              this.seccNodosDataSource = new ArrayStore({
                key: "id",
                data: this.seccNodos,
              });
              this.seccNodosBak = JSON.parse(JSON.stringify(this.seccNodos));
            }
            if (result.isDismissed) {
              // Reemplaza al seccion que no se activa.
              this.seccNodosDataSource._array.pop();
              this.popupVisible = true;
              this.ModoPopUp = "treelist";
              this.showPopup("Secciones", "");
              e.component.option("hasChanges", false);
              return;
            }
          });
        };
      }
    }
    e.component.option("hasChanges", false);

    // Valida cambios en los nodos asignados manualmente
    this.autoSaveTimeout = setTimeout(() => {
      // Verfica si hubo cambios en conectores
      if ( Number(this.elemConecEdit.fromPoint) != -1 && Number(this.elemConecEdit.toPoint) != -1 ) {
        this.seccConec.forEach((cn) => {
          const frId = this.seccNodos.filter((f) => f.id == cn.fromId);
          const toId = this.seccNodos.filter((f) => f.id == cn.toId);
          const cnIgual = this.seccConec.filter( (f) => f.id == cn.toId && f.id == cn.fromId && f.id.match("clp_") );

          // 1. cambia el id de conectores agregados manualmente
          // 2. agrega a los conectores de las rutas
          if ( frId[0].type.match("pro-") && toId[0].type.match("pro-") && !cn.id.match("clp_") && cnIgual.length === 0 ) {
            // re-asigna codigo id
            cn.id = "clp_" + cn.fromId + "_" + cn.toId;
            let conecInfo = this.seccConec.findIndex((f) => f.id == cn.id);
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
              this.seccConec = [...this.seccConec, elemConect];
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

  // Eliminar seccion validando
  async eliminarNodoDiagrama(nodo:any) {
    // Busca seccion y elimina
    const nodBusq = this.seccNodosDataSource._array.findIndex(
                        (s: any) => s.id === nodo.key && s.type.match('pro-'));
    if (nodBusq !== -1 && this.mnuAccion === 'update') {

      // Valida la existencia de la llave respectiva
      const prm = { ID_SECCION: nodo.key, 
                    accion: this.mnuAccion, 
                    ID_RUTA: this.DataDistriPlanta.ID_RUTA };
      const apiRest = this._rutasdpservice.consulta('validar seccion rutas', prm, 'PRO012');
      let res = await lastValueFrom(apiRest, {defaultValue: true});
      res = JSON.parse(res.data); 
      if (res[0].ErrMensaje !== '') {
        this.showModal(res[0].ErrMensaje);
        return;
      }
    }

    // // Busca conectores a y desde la seccion y los elimina
    // let elcon1 = this.seccConecDataSource._array.filter((s: any) => s.fromId === nodo.key);
    // let elcon = elcon1 !== undefined ? JSON.parse(JSON.stringify(elcon1)) : [];
    // for(var k=0; k < elcon.length; k++) {
    //   var connBusq = this.seccConecDataSource._array.findIndex((s: any) => s.id === elcon[k].id);
    //   if (connBusq !== -1) this.seccConec.splice(connBusq, 1);
    // }
    // elcon1 = this.seccConecDataSource._array.filter((s: any) => s.toId === nodo.key);
    // elcon = elcon1 !== undefined ? JSON.parse(JSON.stringify(elcon1)) : [];
    // for(var k=0; k < elcon.length; k++) {
    //   var connBusq = this.seccConecDataSource._array.findIndex((s: any) => s.id === elcon[k].id);
    //   if (connBusq !== -1) this.seccConec.splice(connBusq, 1);
    // }

    
    // Busca conectores a y desde la seccion y los elimina
    let elcon1 = this.seccConecDataSource._array.filter((s: any) => s.fromId === nodo.key || s.toId === nodo.key );
    for(var k=0; k < elcon1.length; k++) {
      var connBusq = this.seccConecDataSource._array.findIndex((s: any) => s.id === elcon1[k].id);
      if (connBusq !== -1) this.seccConecDataSource._array.splice(connBusq, 1);
    }
    this.seccConec = JSON.parse(JSON.stringify(this.seccConecDataSource._array));

    // Elimina nodo-seccion
    this.seccNodos.splice(nodBusq, 1);

    // Des-selecciona del arbol de secciones
    this.eliminarNodo = true;
    this.treeList.instance.deselectRows([nodo.key]);

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

    // Refresh
    this.asociarTooltipsSecciones();

  }

  
  // Eliminar conector validando
  async eliminarConectorDiagrama(conector) {
    // Busca conector y elimina
    const conBusq = this.seccConecDataSource._array.findIndex((s: any) => s.id === conector.key);
    if (conBusq !== -1 && this.mnuAccion === 'update') {

      // Valida la existencia de la llave respectiva
      const prm = { CONECTOR: conector.key, 
                    toId: conector.dataItem.toId,
                    fromId: conector.dataItem.fromId,
                    accion: this.mnuAccion, 
                    ID_RUTA: this.DataDistriPlanta.ID_RUTA };
      const apiRest = this._rutasdpservice.consulta('validar conector rutas', prm, 'PRO012');
      let res = await lastValueFrom(apiRest, {defaultValue: true});
      res = JSON.parse(res.data); 
      if (res[0].ErrMensaje !== '') {
        this.showModal(res[0].ErrMensaje);
        return;
      }
    }

    // Busca conectores para eliminar
    var connBusq = this.seccConecDataSource._array.findIndex((s: any) => s.id === conector.key);
    if (connBusq !== -1) this.seccConec.splice(connBusq, 1);

    // Refresca diagrama
    this.seccConecDataSource = new ArrayStore({
      key: "id",
      data: this.seccConec,
    });

    this.seccConecBak = JSON.parse(JSON.stringify(this.seccConec));
  }

  cancelEliminarNodoDiagrama(): void {
    this.eliminarNodo = false;
    this.seccNodosDataSource = new ArrayStore({
      key: "id",
      data: JSON.parse(JSON.stringify(this.seccNodosBak)),
    });
    this.seccConecDataSource = new ArrayStore({
      key: "id",
      data: JSON.parse(JSON.stringify(this.seccConecBak)),
    });
    this.seccNodos = JSON.parse(JSON.stringify(this.seccNodosBak));
    this.seccConec = JSON.parse(JSON.stringify(this.seccConecBak));
  }

  selectionChangedHandler(e:any) {
    this.selectedNodos = e.items.filter((item:any) => item.itemType === 'shape');
    this.selectedConn = e.items.filter((item:any) => item.itemType === 'connector');
  }

  // Control de nodos y conectores 
  async requestEditOperationHandler(e: any) {
    if (e.operation === "deleteShape" && e.reason === 'modelModification') {
      // Confirmar operación de elminación
      e.allowed = false;
      let msj:string = '';
      const esEliminar = await new Promise((resolve, reject) => {
        if(this.selectedNodos.length === 1) {
          msj = "Desea eliminar esta sección: <br ><i>" + this.selectedNodos[0].text + "</i><br >" +
                "Se eliminarán también los conectores a otras secciones <br >" +
                "Se actualizará cualquier Ruta que contenga esta sección";
        }

        if(this.selectedNodos.length > 1){
          let secc: any = [];
          this.selectedNodos.forEach((nodo:any) => {
            secc.push(nodo.text);
          });
          msj = `Desea eliminar las secciones: <br ><i> ${secc.join(", ")} </i><br > Se eliminarán también los conectores a otras secciones <br > Se actualizará cualquier Ruta que contenga esta sección`;
        }

        Swal.fire({
          title: '',
          html: msj,
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.selectedNodos.forEach((nodo:any) => {
              this.eliminarNodoDiagrama(nodo);
            });
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
                }
                e.args.connector.id = 'clp_' + e.args.connector.fromKey + '_' + e.args.connector.toKey;
                console.log(e.args.connector);
              }
            }
            resolve (true);
          }
          else {
            e.allowed = false;
            resolve (false);
          }
        });
      });
    };
    if (e.operation === "addShape" && e.reason === 'modelModification') {
      if( e.args.shape === undefined && e.args.shape === null ) {
        if( e.args.shape.dataItem === undefined && e.args.shape.dataItem === null ) {
          this.ModoPopUp = "treelist";
          this.showPopup("Secciones", "");
          return;
        }
      }
      return;
    };
  }

  requestLayoutUpdateHandler(e: any) {
    for (var k=0; k < e.changes.length; k++) {
      if(e.changes[k].type === 'insert') {
        // Valida si es un conector
        if (e.changes[k].data.fromId !== undefined) {
          // e.changes[k].data.conecStyle = {"stroke-width": "1"};
          // e.component.option("hasChanges", true);
        }
      }
    }
  }

  // Valide unicidad de la llave
  async ValideExistencia(e: any) {
    if (e.value === '' && this.mnuAccion !== '') {
      // var fNextEditor:any = this.formLayout.instance.getEditor('ID_RUTA');
      // fNextEditor.focus();
      this.inactivaNodosSeleccion(true);
      this.diagReadOnly = true;
      this.ReadOnlyEncabDPDescripcion = true;
      this.ReadOnlyEncabDPEstado = true;
      // showToast('Debe asignar un Código y una Descripción para continuar con la configuración.', 'error');
      // this.treeList.instance.repaint();
      return false;
    }
    if (this.ReadOnlyEncabDP || !this.mnuAccion.match('new|update')) {
      this.ReadOnlyEncabDPDescripcion = true;
      this.ReadOnlyEncabDPEstado = true;
      return false;
    } 
    if (this.mnuAccion === 'update' && this.DataDistriPlanta.ID_RUTA === e.value) {
      this.ReadOnlyEncabDPDescripcion = true;
      this.ReadOnlyEncabDPEstado = true;
      return false;
    }

    // Valida la existencia de la llave respectiva
    const prm = { ID_RUTA: e.value, accion: this.mnuAccion };
    const apiRest = this._rutasdpservice.validellave('EXISTE RUTA',prm,'PRO012');
    let res = await lastValueFrom(apiRest, {defaultValue: true});
    res = JSON.parse(res.data); 
    if (res[0].ErrMensaje === '') {
      this.diagReadOnly = false;
      this.ReadOnlyEncabDPDescripcion = false;
      this.ReadOnlyEncabDPEstado = false;
      // this.DataDistriPlanta.ID_RUTA = e.value;
      this.diagReadOnly = false;
      this.inactivaNodosSeleccion(false);
      this.treeList.instance.repaint();
      return (true);
    } else {
      this.ReadOnlyEncabDPDescripcion = true;
      this.ReadOnlyEncabDPEstado = true;
      showToast(res[0].ErrMensaje, 'error');
      this.diagReadOnly = true;
      // var fNextEditor:any = this.formLayout.instance.getEditor('ID_RUTA');
      // fNextEditor.focus();
      this.selectedRowKeysSecciones = [];
      this.inactivaNodosSeleccion(true);
      this.treeList.instance.repaint();
      return (false);
    }
  
  }

  dragEnd(unit: any, sizes: any): any {
    // const ed = this.diagLay.instance.element();
    // ed.style.width = sizes[1];
    this.diagLay.instance.repaint();
  }

  onRowPrepared(e:any) {
		if (e.rowType === "data") {
			if (e.data) {
				if (e.data.TIPO === 'Planta') {
					e.rowElement.style.fontWeight = '700';
				}
			}
    }
	}
  onIniDiagrama(e: any): any {
    // this.diagLay.instance.repaint();
  }

  onResized(event: any) {
    const width:number = event.newRect.width;
    const height:number = event.newRect.height;
    const constainer_expandir:any = document.getElementById('dxCheckBoxSeleccionadas');
    if(width < 330) {
      constainer_expandir.style.width = '100%';
      constainer_expandir.style.position = 'relative';
    } else {
      constainer_expandir.style.width = '110px';
      constainer_expandir.style.position = 'absolute';
    };
  }

 
  Nuevo() {
    this.IdRutaAnterior = "";
    this.OpGuardar = "new";
    this.DataDistriPlanta = {
      ID_RUTA: "",
      AUTO_CONSECUTIVO: 0,
      DESCRIPCION: "",
      ESTADO: "",
      TIPO: "",
      PRIORIDAD: "",
      SECCIONES: "{}",
      DIAGRAMA: "{}",
    };
    this.opPrepararNuevo();
  }
  IrA(e: any) {
    this.opIrARegistro(e);
  }
  Modificar() {
    this.OpGuardar = "update";
    this.IdRutaAnterior = this.DataDistriPlanta.ID_RUTA;
    this.statusSeccDP = "ED";
    this.treeList.instance.repaint();
    this.opPrepararModificar();
  }
  Cancelar(e: any) {
    this.opBlanquearForma();
    // this.opPrepararBuscar();
    this.prmUsrAplBarReg.accion = "pre_Buscar";
  }

  Eliminar() {
    this.opEliminar();
  }
  Vista_rapida() {
    this.opVista();
  }
  Guardar() {
    this.opPrepararGuardar(this.OpGuardar); 
  }
  navRegistro(num: string) {
    this.opIrARegistro(num);
  }
  Buscar(operMenu: any) {
    if (operMenu === "pre_Buscar") {
      this.DataDistriPlanta = {
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
    this.opBlanquearForma();
    this.opPrepararBuscar('');
  }

  ExportPDF() {
    console.log("ExportPDF");
  }

  ExportExcel() {
    console.log("ExportExcel");
  }
  // TOO: Traer
  async getPermisos(e = null): Promise<void> { }

  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte, archivo, datosrpt) {

    let filtroRep = {ID_RUTA: (this.DataDistriPlanta == undefined ? '' : this.DataDistriPlanta.ID_RUTA), TIPO: (this.DataDistriPlanta == undefined ? 'Layout Planta' : this.DataDistriPlanta.TIPO)};
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

  destro() {
    // this._unsubscribeAll.unsubscribe();
    this._unsubscribeAll.next(true);
    this._unsubscribeAll.complete();
  }

  ngOnInit(): any {
    
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

    const user:any = localStorage.getItem("usuario");
    this.prmUsrAplBarReg = {
      tabla: "RUTAS_PRODUCCION",
      aplicacion: "PRO-012",
      usuario: user,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: {}
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';

    this.DataDistriPlanta = {
      ID_RUTA: "",
      AUTO_CONSECUTIVO: 0,
      DESCRIPCION: "",
      ESTADO: "",
      TIPO: "",
      PRIORIDAD: "",
      SECCIONES: "",
      DIAGRAMA: "{}",
    };

    this.valoresObjetos('todos');

  }

 
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.diagLay.instance.repaint();
    }, 1000);
  }
  ngOnDestroy() {
    // this.subscription.unsubscribe();
    this.destro();
    this.subscription.unsubscribe();
    this.subs_visor.unsubscribe();
    this.subs_filtro.unsubscribe();
    this._sfiltro.enConsulta = false;
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string){
    if (obj == 'secciones' || obj == 'todos') {
      const prm = { FILTRO: ''};
      this._secciones
      .getSecciones(prm)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DatosSeccRutasDP = res;
        this.DatosSeccRutasDP_prev = res;

        // Actualiza diagrama, si está visualizado
        this.seccNodos.forEach(nodsecc => {
          const seccinfo:any = this.DatosSeccRutasDP.find(s => s.ITEM === Number(nodsecc.id));
          if (nodsecc.id_seccion === seccinfo.ID_SECCION ) {
            nodsecc.text = seccinfo.DESCRIPCION;
            nodsecc.id_seccion = seccinfo.ID_SECCION;
            nodsecc.nom_seccion = seccinfo.DESCRIPCION;
          };
        });
        this.seccNodosDataSource = new ArrayStore({
          key: "id",
          data: this.seccNodos,
        });
        this.seccNodosBak = JSON.parse(JSON.stringify(this.seccNodos));
        
      });
    };
    if (obj === 'valor base' || obj == 'todos') {
      const prm = { DATOS: '' };
      this._secciones.getBasesdelCosto('VALOR BASE', prm).subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res.filter((d:any) => d.CLASE === 'ASIGNACION DE COSTOS');
        if(newArray.length > 0) {
          const mensaje = newArray[0].ErrMensaje;
          if (mensaje != '') {
            this.showModal(mensaje, 'Error');
          }
          else {
            this.valorBaseCosto = newArray[0].CODIGO;
          };
        } else {
          this.valorBaseCosto = '';
        }
      },
        (err => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    if (obj === 'consecutivo') {
      const prm = {ID_APLICACION: this.prmUsrAplBarReg.aplicacion, CLASE: 'Layout Planta' };
      this._rutasdpservice.getConsecutivo('CONSECUTIVO',prm,this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if (res.ErrMensaje !== '') {
          this.showModal(res.ErrMensaje);
        } else {
          if(res.CONSECUTIVO !== 0) {
            this.DataDistriPlanta.ID_RUTA = res.VAR_CONSECUTIVO;
            this.DataDistriPlanta.AUTO_CONSECUTIVO = res.CONSECUTIVO;
          } else {
            this.DataDistriPlanta.ID_RUTA = 'xxxxxxxx';
          }
        }
      });
    };
  }

  showModal(mensaje, titulo = '¡Error!', msg_html= '') {
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
