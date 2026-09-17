


export function showToast(message, type) {
  const container = document.getElementById('router-container');
  notify({
    message: message,
    width: 300,
    position: {
      at: 'bottom center',
      my: 'bottom center',
      of: container
    },
    animation: {
      show: { type: 'fade', duration: 400, from: 0, to: 1 },
      hide: { type: 'fade', duration: 40, to: 0 }
    },
  },
  type, 4500 );
}


export function onTotalSeccion() {
	const subtotalSecciones = this.DGDetalleMateriales.reduce( (acc, item) => {
		return acc += item.SUB_TOTAL;
	}, 0);
	const proteccion = this.DGDetalleMateriales.reduce( (acc, item) => {
		return acc += item.PROTECCION;
	}, 0);
	const factor_pro = (subtotalSecciones > 0) ? (proteccion / subtotalSecciones) * 100 : 0;

	if(this._sdatos.D_MATRIZ.CLASE.match('Producto simple|Parte simple')) {
		this.send_totalSeccionMateriales.emit({
			SUB_TOTAL: subtotalSecciones,
			ID_SECCION: this.getData.ID_SECCION,
			TOTAL_GRAVADOS: this.conGravados,
			TOTAL_SIN_IVA: this.conExcluidos,
			FACTOR_MA: factor_pro,
			PROTECCION: proteccion
		});
	}
	if (this._sdatos.D_MATRIZ.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
		this.DGDetalleMateriales.forEach((material) => {
			material.ID_PARTE = this._sdatos.D_MATRIZ.PRODUCTO;
		});
		this.send_totalSeccionMateriales.emit({
			ID_PARTE: this.getData.ID_PARTE,
			ID_SECCION: this.getData.ID_SECCION,
			SUB_TOTAL: subtotalSecciones,
			TOTAL_GRAVADOS: this.conGravados,
			TOTAL_SIN_IVA: this.conExcluidos,
			FACTOR_MA: factor_pro,
			PROTECCION: proteccion
		});
	}

	const pos = this._sdatos.MATRIZ_DETALLE_MATERIALES.findIndex((d) => d.ID_SECCION === this.getData.ID_SECCION);
	if ( pos !== -1 )
		this._sdatos.MATRIZ_DETALLE_MATERIALES[pos] = { ID_SECCION: this.getData.ID_SECCION, DATA_SOURCE: this.DGDetalleMateriales };
	else
		this._sdatos.MATRIZ_DETALLE_MATERIALES.push({ ID_SECCION: this.getData.ID_SECCION, DATA_SOURCE: this.DGDetalleMateriales });
	
	this.DGDetalleMateriales_prev = JSON.parse(JSON.stringify(this.DGDetalleMateriales));
}