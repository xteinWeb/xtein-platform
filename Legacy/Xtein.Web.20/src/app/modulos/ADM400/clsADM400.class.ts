export class IData {
  public storage: any;
}

export class ILista {
  public ID: string;
  public SQL: string;
  public storage: any;

  public constructor() {}
}

export class clsConfigCodigos{
  public ID_UN: string;
  public ID_APLICACION: string;
  public MODO: string;
  public ESTADO: string;
}

export class clsConfigCodigosItems{
  public ID_UN: string;
  public ID_APLICACION: string;
  public ITEM: number;
  public MODO: string;
  public TIPO: string;
  public CONDICION: string;
  public PREFIJO: string;
  public CANTIDAD_CONSECUTIVO: number;
  public INICIO_CONSECUTIVO: number;
  public INCREMENTO_CONSECUTIVO: number;
  public ESTADO: string;
}