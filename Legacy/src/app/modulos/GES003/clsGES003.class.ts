export class clsCargos {
  public ID_CARGO: string;
  public NOMBRE: string;
  public DESCRIPCION: string;
  public RESPONSABLES: any;
  public RESPONSABILIDADES: any;
  public ESTADO: string;
  public TIPO: string;
  public CONDICIONES: any;
  public CONSECUTIVO: number;

	public constructor() {}
}

export class DataActividad {
  actividad: number;
  startDate: Date;
  endDate: Date
}