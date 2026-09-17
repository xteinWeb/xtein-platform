import { clsBarraRegistro } from "src/app/containers/regbarra/_clsBarraReg";

export interface FlowNode {
    id: string;
    text: string;
    type: string;
    x: string;
    y: string;
    width: string;
    height: string;
    textStyle?: string;
    contenedor?: string;
    bloqSeccion?: boolean;
    itemStyleExpr?: any;
    baseType?: string;
    tipoNodo?: string;
    id_seccion?: string;
    nom_seccion?: string;
  }
  
  export interface childFlowNode {
    id: string;
    text: string;
    type: string;
  }
  export interface FlowEdge {
    id: string;
    fromId: string;
    toId: string;
    text: string;
    fromPoint: string;
    toPoint: string;
    conecStyle?: string;
    bloqConn?: boolean;
    pointsConec?: pointsEdge[];
    tipoFlecha?: string;
  }
  export interface pointsEdge {
    x: number;
    y: number;
  }
  
  export interface MDistriplantas {
    ID_RUTA: string;
    AUTO_CONSECUTIVO: number;
    DESCRIPCION: string;
    ESTADO: string;
    TIPO: string;
    PRIORIDAD: string;
    SECCIONES: any;
    DIAGRAMA: any;
    ID_LAYOUT?: any;
  }
  
  export interface MSecciones {
    ID_UN: string;
    ID_SECCION: string;
    ITEM: number;
    DESCRIPCION: string;
    ANTERIOR: number;
    ID_UN_ITEM: string;
    ASIGNABLE: boolean;
    ESTADO: string;
    INVENTARIO: boolean;
    TIPO: string;
    MANO_OBRA: boolean;
    MSG: string;
    IsActive: boolean;
  }
  
  
  export interface MenuClass {
    name: string;
    icon: string;
    visible: boolean;
    uso: boolean;
    items?: SubMenu[];
  }
  interface SubMenu {
    text: string;
    name: string;
    icon: string;
    visible: boolean;
    uso: boolean;
  }
  export interface AppSettings {
    defaultUrl: string;
    urlapi: string;
  }
  
  export interface MVisor {
    accion: string;
    Titulo: string;
    cols: any;
    Filtro: string;
    Grupo: any;
    opciones: string;
    keyGrid: any;
  }
  export interface MColumna {
    Nombre: string;
    Titulo: string;
  }
  
  export interface MRutasPartes {
    ID_RUTA: string;
    AUTO_CONSECUTIVO: number;
    DESCRIPCION: string;
    ESTADO: string;
    TIPO: string;
    PRIORIDAD: string;
    SECCIONES: string;
    LAYOUT_DP: any;
    NODOS: any[];
    CONECTORES: any[];
    DIAG_LAYOUT: any[];
  }
  
  export interface MSeccionesPartes {
    ID_SECCION: string;
    ITEM: number;
    DESCRIPCION: string;
    ANTERIOR: number;
    ID_UN?: string;
    ID_UN_ITEM?: string;
    ASIGNABLE?: boolean;
    ESTADO?: string;
    INVENTARIO?: boolean;
    TIPO?: string;
    MANO_OBRA?: boolean;
    MSG?: string;
    RUTA_PARTE?: boolean;
    PRECEDENTES?: string;
  }
  export class custShapesDiagrama {
    constructor(public id: string = "", public svg: string = "") {}
  }
  