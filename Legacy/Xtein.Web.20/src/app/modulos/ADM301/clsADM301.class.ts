export class IData {
  public storage: any;
}

export class ILista {
  public ID: string;
  public SQL: string;
  public storage: any;

  public constructor() {}
}

export class clsCalendario{
  public ID_CALENDARIO: string;
  public NOMBRE: string;
  public ESTADO: string;
}

export class clsCalendarioItem{
  public ID_CALENDARIO: string;
  public FECHA_INICIAL: any;
  public FECHA_FINAL: any;
  public ESTADO: string;
}