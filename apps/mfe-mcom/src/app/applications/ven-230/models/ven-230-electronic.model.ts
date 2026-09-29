export interface Ven230ElectronicDocument {
 tipoDocElectronico: string; ID_DOCUMENTO: string; NC_DOCUMENTO: string; ID_EMPRESA: string; EMISOR_NIT: string;
}

export interface Ven230ElectronicView {
  document: string; date: string; client: string; email: string; cufe: string; qr: string;
}
