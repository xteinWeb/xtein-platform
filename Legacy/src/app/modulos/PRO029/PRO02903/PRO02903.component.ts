import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxContextMenuModule, DxDataGridComponent, DxDataGridModule, DxDiagramModule, DxDropDownBoxComponent, DxDropDownBoxModule } from 'devextreme-angular';
import ArrayStore from 'devextreme/data/array_store';
import { Observable, Subscription } from 'rxjs';
import { childFlowNode, custShapesDiagrama, FlowEdge, FlowNode } from 'src/app/services/PRO011/interface';
import { PRO011Service } from 'src/app/services/PRO011/PRO011.service';
import { LibsvgService } from 'src/app/services/PRO011/SVisor.service';
import { PRO029Service } from 'src/app/services/PRO029/PRO029.service';
import { showToast } from 'src/app/shared/toast/toastComponent';
import { validatorRes } from 'src/app/shared/validator/validator';

@Component({
  selector: 'app-PRO02903',
  templateUrl: './PRO02903.component.html',
  styleUrls: ['./PRO02903.component.css'],
  standalone: true,
  imports: [CommonModule, DxDiagramModule, DxContextMenuModule, DxDropDownBoxModule, DxDataGridModule, DxButtonModule],
  providers: [PRO011Service]
})
export class PRO02903Component {
  
  @ViewChild("GDatosDP", { static: false }) gridLP: DxDataGridComponent;
  @ViewChild("ddBoxLay", { static: false }) ddLayout: DxDropDownBoxComponent;
  
  @Input() events: Observable<any>;
  @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();

  private eventsSubscription: Subscription;
	subscription: Subscription;


  NodosSvg: custShapesDiagrama[] = [];
  GValorLayout: string[] = [];
  seccNodosDataSource: any;
  seccConecDataSource: any;
  GDatosLayoutDP: any;
  modelDiagrama: any;
  seccNodos: FlowNode[] = [];
  seccNodosRuta: FlowNode[] = [];
  seccNodosLay: FlowNode[] = [];
  seccConec: FlowEdge[] = [];
  seccConecRuta: FlowEdge[] = [];
  seccConecLay: FlowEdge[] = [];
  seccNodosBak: FlowNode[] = [];
  seccConecBak: FlowEdge[] = [];
  nodoSeccionAccion: any [] = [];

  opendDrop:any = {
    LAYOUT: false
  }
  readOnly:boolean = true;
  consulta:boolean = false;

  
  constructor(
    private sData: PRO029Service,
    private Spro11: PRO011Service,
    _slibsvg: LibsvgService
  ) {
    // this.onRespuestaComponent = this.onRespuestaComponent.bind(this);
    
    _slibsvg.getArchivo().subscribe(() => {
      this.NodosSvg = _slibsvg.custShapes;
    });
  }

  ngOnInit(): void {
    this.valoresObjetos('layouts de planta', '');
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.accion) {
        case 'Load Data':
          this.readOnly = datos.readOnly;
          this.consulta = datos.consultado;
          break;

        default:
          break;
      }
    });
  }

  ngOnDestroy() {
    // this.subscription.unsubscribe();
  }

  onContentReady(e: any) {
    e.component.option("autoZoomMode", "fitContent");
    e.component.option("autoZoomMode", "disabled");
  }
  
  onValueChangedLayout(e:any) {
    if ((e.value === '') || (e.value === null) || (e.value === undefined) || (e.value.length <= 0)) {
      this.GValorLayout = [];
      this.seccNodos.splice(0, this.seccNodos.length);
      this.seccConec.splice(0, this.seccConec.length);
      const flowNodes: FlowNode[] = [];
      const flowEdges: FlowEdge[] = [];
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
  aceptarBottom(e:any, btn:any) {
    switch (btn) {
      case 'LAYOUT':
        this.opendDrop.LAYOUT = false;
        // if (this.GValorLayout.length > 0)
        //   this.cerrarListaDP();
        break;
    
      default:
        break;
    }
  }

  cerrarListaDP() {
    this.ddLayout.instance.close();
    //Coloca el diagrama en blanco
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

    // Carga el diagrama por el Layout seleccionado
    const selectedRowsLP = this.gridLP.instance.getSelectedRowsData();
    selectedRowsLP.forEach((elay:any) => {
      const id:any = 'cnt_'+elay.ID_RUTA;
      //verifica si el layout ya esta cargado en el diagrama
      const npos:any = this.seccNodos.findIndex((s:any) => s.id === id);
      //si no esta lo agrega; si esta, lo omite
      if ( npos === -1 ) {
        const prm:any = {accion: "diagrama layout planta", ID_RUTA: elay.ID_RUTA};
        this.Spro11
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
          }
        });
      }

    });
  }

  // Agrega layout como un container
  childCnt: childFlowNode[] = [];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  agregarLayout(IdRuta: string, NomRuta: string) {
    let nodoCnt = this.seccNodos.filter((s:any) => s.type === "horizontalContainer");
    // const numCnt = nodoCnt !== undefined ? nodoCnt.length : 0;

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
      nod.textStyle = "fill: black";
      nod.type = "pro-purple";
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
    var elemNodo:any = {
      id: "cnt_" + IdRuta,
      text: NomRuta,
      type: "horizontalContainer",
      x: (this.minX - 40).toString(),
      y: (this.minY - 10).toString(),
      width: (this.maxX + 10).toString(),
      height: this.maxY.toString(),
      itemStyleExpr: { stroke: '#7ed3f1' }
    };

    // Agrega secciones - nodos
    this.seccNodos = [...this.seccNodos, elemNodo];
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
  selectionChangedHandler(e:any) {
    if (e.items.length > 0)
      this.nodoSeccionAccion = e.items.filter((item:any) => item.itemType === 'shape');
  }
  onItemDblClick(e: any) {
    this.nodoSeccionAccion = [e.item];
    if (this.consulta)
      this.onRespuestaComponent.emit({ ACCION:'CONSULTA PROGRAMACION', DATA: {ID_SECCION: this.nodoSeccionAccion[0].dataItem.id_seccion} });
    else
      showToast('No hay datos cargados, por favor consulte los datos a mostrar.', 'warning');
  }
  onCustomMenuDiag(e: any) {
    switch (e.name) {
      case "PROGRAMACION":
        if (this.consulta)
          this.onRespuestaComponent.emit({ ACCION:'CONSULTA PROGRAMACION', DATA: {ID_SECCION: this.nodoSeccionAccion[0].dataItem.id_seccion} });
        else
          showToast('No hay datos cargados, por favor consulte los datos a mostrar.', 'warning');
        break;

      default:
        break;
    }
  }


  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, datos:any){
    if (obj === 'layouts de planta' || obj === 'todos') {
			const prm = { };
      this.sData.consulta("qlistadp", { accion: "qlistadp", ID_RUTA: "" }, 'PRO013')
      .subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.GDatosLayoutDP = res;
        if(this.gridLP !== undefined && this.gridLP !== null)
          this.gridLP.instance.refresh();

      });
		};
  }
}
