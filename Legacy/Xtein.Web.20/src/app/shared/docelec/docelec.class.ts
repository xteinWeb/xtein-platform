export class clsDocumentoElectronico {
  public tipoDocElectronico: string;
  public ID_DOCUMENTO: string;
  public NC_DOCUMENTO: string;
  public ID_EMPRESA: string;
  public EMISOR_NIT: string;
  public NIT_PROVEEDOR?: string;
  public DOC_EVENTO?: string;
  public DATOS_EVENTO?: string;
  public DIR_XML?: string;
  public ID_EMPLEADO?: string;

  public constructor() {}
}

export class clsEventosElectronico {
  public ITEM: number;
  public ID_DOCUMENTO: string;
  public NC_DOCUMENTO: string;
  public FECHA: Date;
  public HORA: Date;
  public STATUS: string;

  public constructor() {}
}

