export class clsGES_INFO {
  public ID_ACTIVIDAD: string;
  public ID_ACTIVIDAD_PADRE: string;
  public ID_GESTION: number;
  public ITEM: number;
	public NOMBRE: string;
  public DESCRIPCION: string;
  public RESPONSABLE: any;
  public COLABORADORES: any;
  public ESTADO: string;
  public TIPO: string;
  public PRIORIDAD: string;
  public MEDICION: number;
  public COSTO: number;
  public FECHA_INICIO: Date;
  public FECHA_FIN: Date;
  public TIEMPO_RETRASO : number;
  public DURACION: string;
  public UM_DURACION: string;
  public VERIFICABLE: boolean;
  public CLASE: string;
  public IMAGEN: any;
  public ARCHIVOS: any;
  public ANULADO: boolean;

	public constructor() {}
}