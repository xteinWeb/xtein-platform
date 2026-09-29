export interface CCapacidad {
	FECHA_INICIO: Date,
	FECHA_FIN: Date,
	CAPACIDAD: string,
	HORARIOS: any,
	PLANTAS: any,
	FECHA_REGISTRO: Date,
	FECHA_UPDATE: Date,
	USUARIO: string,
	ITEM: number
}

export interface DSecciones {
	ID_SECCION: string,
	DESCRIPCION: string,
	ID_HORARIO: string,
	NOMBRE_HORARIO: string,
	HORAS_HORARIO: string,
	N_TRABAJADORES_INSTALADA: number,
	HORAS_INSTALADA: number,
	N_TRABAJADORES_DISPONIBLE: number,
	HORAS_DISPONIBLE: number,
	EFECTIVIDAD_AJUSTADA: number,
	HORAS_AJUSTADA: number
}
