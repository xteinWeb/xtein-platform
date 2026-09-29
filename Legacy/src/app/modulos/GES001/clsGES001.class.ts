export class clsNewPoryect {
  public ITEM: number;
	public NOMBRE: string;
  public DESCRIPCION: string;
  public USUARIO: string;
  public RESPONSABLE: string;
  public ESTADO: any;

	public constructor() {}
}

export class clsGesActividadesoldddd {
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
  public INTERVALO_FRECUENCIA: number;
  public REPETIR: boolean;
  public TODO_DIA: boolean;
  public visibleBtnAgregar: boolean;
  public visibleBtnComentarios: boolean;
  public PROGRAMACION: string;

	public constructor() {}
}

export class clsGesActividades {
  public ID_ACTIVIDAD: number;
  public ID_ACTIVIDAD_PADRE: number;
  public NOMBRE: string;
  public DESCRIPCION: string;
  public FECHA_INICIO: Date;
  public FECHA_FIN: Date;
  public PRIORIDAD: string;
  public ETIQUETAS: string;
  public MEDICION: string;
  public ESTADO: string;
  public USUARIO: string;
  public CLASE: string;
  public TIPO: string;
  public ANULADO: boolean;
  public REPETIR: boolean;
  public TODO_DIA: boolean;
  public FRECUENCIA:string;
  public PERIODO_FRECUENCIA: any;
  public INTERVALO_FRECUENCIA: string;
  public RESPONSABLE: string;
  public COLABORADORES: any;
  public PROGRAMACION: string;
  public ACT_MIAS: boolean;
  public ACT_ASIG: boolean;
  public ACT_AREA: boolean;
  public ACT_COLAB: boolean;
  public ACT_FIN: boolean;
  public ErrMensaje: string;
  public ITEM: number;
  public TEMP: number;
  public btnComentarios: boolean;
  public readOnlyResponsables: boolean;
  public readOnlyColaboradores: boolean;
  public readOnlyTipo: boolean;
  public ELIMINADO: boolean;
  public esEdit: boolean

  public constructor() {}
}
