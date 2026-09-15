export class clsBarraRegistro {
	constructor(
		public tabla: string,
		public aplicacion: string,
		public accion: string,
		public r_numReg: number,
		public r_totReg: number,
		public error: string,
		public usuario: string,
		public operacion: any,
		public aplicacionBase?: string
	) {}
}
