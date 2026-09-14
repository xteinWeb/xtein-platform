import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { PRO009Service } from 'src/app/services/PRO009/s_PRO009.service';
import Swal from 'sweetalert2';
import { DetailServiceService } from '../service/detail-service.service';

@Component({
  selector: 'detalle-component',
  templateUrl: './detalle.component.html',
  styleUrls: ['./detalle.component.css']
})
export class DetalleComponent implements OnInit {
  @Input() idEmpleado:any;
	@Input() dataSeccionesEmpleado:any;
	@Output() dataSecciones = new EventEmitter<any>();
	
	subscription: Subscription;
  newArray: any = [];
  DGDetalle: any = [];
	selectSeccion: any = [];
	esEdicion: boolean = false;
	isEdit: boolean = false;
	esVisibleSelecc: string = 'none';
	npos: number;
	id_empleado: any;
	seccionAgregar: any = [];

  constructor(
		private datosServiceDetail: DetailServiceService
		) { }

  ngOnInit(): void { }

  ngAfterViewInit(e:any) {
		this.DGDetalle = this.dataSeccionesEmpleado;
	}

	selectionSeccion(row: any): void {
		this.esEdicion = this.datosServiceDetail.esEdicion;
		if( this.esEdicion == true){
			this.selectSeccion = row.selectedRowsData[0];
			this.npos = this.DGDetalle.findIndex(e => (e.ID_SECCION === this.selectSeccion.ID_SECCION) && (e.ID_EMPLEADO === this.selectSeccion.ID_EMPLEADO));

			this.datosServiceDetail.setEMPSecciones({ VDetalle: JSON.parse(JSON.stringify	(this.selectSeccion)),
																								ID_EMPLEADO: this.idEmpleado,
																								operacion: 'seleccion',
																								textButton: 'ACTUALIZAR'
																							});
		}
  }

	onRowPrepared(e) {
		if (e.rowType === "data") {
			if (this.isEdit){
				if ( this.seccionAgregar.findIndex( d => d.ID_SECCION === e.data.ID_SECCION ) != -1 ){
					if ( this.DGDetalle.findIndex(g => (g.ID_SECCION === e.data.ID_SECCION) && (g.ID_EMPLEADO === this.id_empleado )) != -1 ) {
						// e.rowElement.style.backgroundColor = 'lightyellow';
						const className:string = e.rowElement.className;
						e.rowElement.className = className +' row-modified-focused';
					}			
				}
			}
    }
	}

	deleteRowPro($event) {	
		this.datosServiceDetail.setEMPSecciones({ VDetalle: JSON.parse(JSON.stringify(this.DGDetalle)),
																							ID_EMPLEADO: this.idEmpleado,
																							operacion: 'eliminacion'
																						});
	}

  showModal(mensaje) {
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
			title: '¡Error!',
			text: mensaje,
			allowOutsideClick: true,
			allowEscapeKey: false,
			allowEnterKey: false,
			backdrop: true,
			position: 'center',
			stopKeydownPropagation: false,
		});
	}

}
