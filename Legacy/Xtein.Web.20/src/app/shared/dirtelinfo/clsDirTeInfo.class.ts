export class clsContactos{
  public ID_CONTACTO: number;
  public EMAIL: string;
  public URL: string;
  public CIIU: string;
}

export class clsEmail{
  public ITEM: number;
  public EMAIL: string;
  public ETIQUETA: string;
  public isEdit: boolean;
}

export class clsDirecciones{
    public ID_DIRECCION: number;
    public TIPO_DIRECCION: string;
    public TIPO_NOMENCLATURA: string;
    public NOMENCLATURA: string;
    public NUMERO1: string;
    public NUMERO2: string;
    public DOMICILIO: string;
    public BARRIO: string;
    public DEPENDIENTE: string;
    public REFERENCIA: string;
    public ID_UBICACION: string;
    public CODIGO_POSTAL: string;
    public NOMBRE_UBICACION: string;
    public NOMBRE_BARRIO: string;
    public isEdit: boolean;
  }

  export class clsTelefonos{
    public ID_TELEFONO: number;
    public ID_DIRECCION: number;
    public TIPO_TELEFONO: string;
    public TELEFONO: string;
    public EXTENSION: string;
    public isEdit: boolean;
  }

   