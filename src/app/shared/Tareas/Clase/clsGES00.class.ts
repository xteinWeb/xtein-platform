export class clsNewPoryect {
  public ITEM: number;
	public NOMBRE: string;
  public DESCRIPCION: string;
  public USUARIO: string;
  public RESPONSABLE: string;
  public ESTADO: any;

	public constructor() {}
}

export class clsGesActividades {
  public ID_ACTIVIDAD: number;
  public ID_ACTIVIDAD_PADRE: number;
  public ITEM: number;
	public NOMBRE: string;
  public ESTADO: string;
  public FECHA_INICIO: Date;
  public FECHA_FIN: Date;
  public DESCRIPCION: string;
  public RESPONSABLES: any;
  public COLABORADORES: any;
  public TIPO: string;
  public PRIORIDAD: string;
  public COSTO: number;
  public DURACION: string;
  public CLASE: string;
  public FRECUENCIA: string;
  public PERIODO_FRECUENCIA: any;
  public PROGRAMACION: any;
  public DATOS_PROG: any;
  public INTERVALO_FRECUENCIA: number;
  public ARCHIVOS: any;
  public REPETIR: boolean;
  public TODO_DIA: boolean;
  public ANULADO: boolean;
  public visibleBtnComentarios: boolean;
  public readOnlyResponsables: boolean;
  public readOnlyFechaInicio: boolean;
  public readOnlyFechaFinal: boolean;
  public readOnlyTipo: boolean;
  public readOnlyRepetir: boolean;

	public constructor() {}
}
