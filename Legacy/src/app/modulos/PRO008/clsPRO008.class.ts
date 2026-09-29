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
    CAPACIDAD: any [];
    CAPACIDAD_PROD: number;
    STOCK_SEGURIDAD: number;
    FACTOR_PROTECCION_MO: number;
    MANO_OBRA: boolean;
    MSG: string;
    IsActive: boolean;
  }
  