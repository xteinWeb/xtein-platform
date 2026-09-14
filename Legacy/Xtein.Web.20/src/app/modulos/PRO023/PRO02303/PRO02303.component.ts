import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild } from '@angular/core';
import { DxDiagramComponent, DxDiagramModule, DxLoadPanelModule } from 'devextreme-angular';
import ArrayStore from 'devextreme/data/array_store';
import { lastValueFrom, Observable, Subscription } from 'rxjs';
import { childFlowNode, custShapesDiagrama, FlowEdge, FlowNode } from 'src/app/services/PRO011/interface';
import { PRO011Service } from 'src/app/services/PRO011/PRO011.service';
import { LibsvgService } from 'src/app/services/PRO011/SVisor.service';
import { PRO029Service } from 'src/app/services/PRO029/PRO029.service';
import { showToast } from 'src/app/shared/toast/toastComponent';

@Component({
  selector: 'app-PRO02303',
  templateUrl: './PRO02303.component.html',
  styleUrls: ['./PRO02303.component.css'],
  standalone: true,
  imports: [CommonModule, DxDiagramModule,DxLoadPanelModule],
  providers: [PRO011Service]
  
})
export class PRO02303Component {

  @ViewChild("diagSimulador", { static: false }) diagLay: DxDiagramComponent;

  @Input() events: Observable<any>;
  private eventsSubscription: Subscription;
  subscription: Subscription;

  DetalleProgramacion:any [] = [];
  Programacion:any [] = [];

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

  loadingVisible: boolean = false;

  constructor (
    private sData: PRO029Service,
    private Spro11: PRO011Service,
    _slibsvg: LibsvgService
  ) {
    _slibsvg.getArchivo().subscribe(() => {
      this.NodosSvg = _slibsvg.custShapes;
    });
  }
  
  ngOnInit(): void {
    this.valoresObjetos('todos', '');
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.accion) {
        case 'Load Data':
          this.Programacion = datos.dataSource;
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

  onItemDblClick(e: any) {
    // this.nodoSeccionAccion = [e.item];
    // if (this.consulta)
    //   this.onRespuestaComponent.emit({ ACCION:'CONSULTA PROGRAMACION', DATA: {ID_SECCION: this.nodoSeccionAccion[0].dataItem.id_seccion} });
    // else
    //   showToast('No hay datos cargados, por favor consulte los datos a mostrar.', 'warning');
  }
  onCustomMenuDiag(e: any) {
    // switch (e.name) {
    //   case "PROGRAMACION":
    //     if (this.consulta)
    //       this.onRespuestaComponent.emit({ ACCION:'CONSULTA PROGRAMACION', DATA: {ID_SECCION: this.nodoSeccionAccion[0].dataItem.id_seccion} });
    //     else
    //       showToast('No hay datos cargados, por favor consulte los datos a mostrar.', 'warning');
    //     break;

    //   default:
    //     break;
    // }
  }
  selectionChangedHandler(e:any) {
    // if (e.items.length > 0)
    //   this.nodoSeccionAccion = e.items.filter((item:any) => item.itemType === 'shape');
  }


  // Agrega layout como un container
  childCnt: childFlowNode[] = [];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  iniX: number = 50;
  iniY: number = 50;
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
      this.seccNodosBak = [
        ...this.seccNodosBak,
        JSON.parse(JSON.stringify(nod)),
      ];
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
    this.maxY = Number(obj.y) + Number(obj.height) - Number(this.minY) + 40;
    var elemNodo:any = {
      id: "cnt_" + IdRuta,
      text: NomRuta,
      type: "horizontalContainer",
      x: this.iniX.toString(),
      y: (this.minY - 10).toString(),
      width: (this.maxX + 10).toString(),
      height: (this.maxY + 50).toString(),
      itemStyleExpr: { stroke: '#7ed3f1' }
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
    elemNodo.y = (this.maxY).toString();

    // Reasigna coordenadas de los nodos en el nuevo container
    this.seccNodosLay.forEach((nod) => {
      nod.y = ((Number(nod.y) - this.minY + 20) + this.maxY).toString();
      nod.x = (Number(nod.x) - this.minX + 100).toString();
    });

    //verificar Capacidad para Activar SVG de Color
    // this.seccNodos.forEach((nodo:any) => {
    //   const npos:any = this.DetalleProgramacion.findIndex((d:any) => d.ID_SECCION === nodo.id_seccion);
    //   if (npos > -1) {
    //     const dataSeccion:any = this.DetalleProgramacion[npos];
    //   }




    //   if ( !this.NodosSvg.includes(nodo['type']) ) {
    //     let valoresDisponibles = this.NodosSvg.filter((d:any) => d.id !== 'pro-base-layout');
    //     const newType:any = Math.floor(Math.random() * valoresDisponibles.length);
    //     nodo.type = this.NodosSvg[newType].id;
    //   }
    // });


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
    
    setTimeout(() => {
      this.diagLay.instance.option("zoomLevel", 1);
    }, 200);
  }

  async valoresObjetos(obj: string, datos:any){
    if (obj === 'layouts de planta' || obj === 'todos') {
			const prm = { };
      this.sData.consulta("qlistadp", { accion: "qlistadp", ID_RUTA: "" }, 'PRO013')
      .subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.GDatosLayoutDP = res.filter((d:any) => d.ID_RUTA.match('LP'));
        this.valoresObjetos('diagrama layout planta', '');
      });
		};
    if (obj === 'diagrama layout planta') {
      this.loadingVisible = true;
      for (const elay of this.GDatosLayoutDP) {
        const prm = { accion: "diagrama layout planta", ID_RUTA: elay.ID_RUTA };
        try {
          const apiRest = this.Spro11.consulta("diagrama layout planta", prm, 'PRO013');
          const res = await lastValueFrom(apiRest, { defaultValue: true });
          const newArray = JSON.parse(res.data);
          this.modelDiagrama = newArray;

          // Verificar secciones por agregar
          let agregar = false;
          for (const nodo of this.modelDiagrama.NODOS) {
            if (this.seccNodosBak.findIndex((d: any) => d.id_seccion === nodo.id_seccion) === -1) {
              agregar = true;
              break;
            }
          }

          if (agregar) {
            this.agregarLayout(elay.ID_RUTA, elay.DESCRIPCION);
          } else {
            showToast(`Hay secciones repetidas en ${elay.ID_RUTA} -- ${elay.DESCRIPCION}`, 'error');
          }
          
        } catch (error) {
          this.loadingVisible = false;
          console.error('Error consultando diagrama layout planta', error);
          showToast(`Error al procesar ${elay.ID_RUTA}`, 'error');
        }
      }

		};
  }

}
