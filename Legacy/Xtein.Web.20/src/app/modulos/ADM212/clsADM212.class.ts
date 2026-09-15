export class clsDominios {
  public ID_DOMINIO: string;
  public NOMBRE: string;
  public ID_GRUPO_DOMINIO: string;

  public constructor() {}
}

export interface FDominios {
  ID_DOMINIO: string;
  NOMBRE: string;
  ID_GRUPO_DOMINIO: string;
  TIPO?: string;
}

export class clsDM_Asociadas {
  public ITEM: number;
  public ID_UN: string;
  public ID_UN_ASOCIADA: string;
  public TIPOUSUARIO: string;
  public NOMBRE: string;
  public VALOR_DEFECTO: boolean;

  public constructor() {}
}
