export interface FSGrupos {
  NOMBRE: string;
  DESCRIPCION: string;
  USUARIO: string;
  TIPO: string;
  PERFIL: string;
  PERMISOS: string;
  ESTADO: string;
  IMAGEN: string;
  USUARIO_ADMIN: string;

}

export interface FGrupos {
  NOMBRE: string;
  DESCRIPCION: string;
  IMAGEN: string;
  USUARIO: string;
}

export class clsUS_Asociadas {
  public ITEM: number;
  public ID_UN: string;
  public ID_UN_ASOCIADA: string;
  public TIPOUSUARIO: string;
  public NOMBRE: string;
  public VALOR_DEFECTO: boolean;

  public constructor() { }
}
