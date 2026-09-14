import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxLoadPanelModule, DxNumberBoxModule, DxToolbarModule, DxTooltipComponent, DxTooltipModule, DxTreeListComponent, DxTreeListModule } from 'devextreme-angular';
import { Observable, Subscription } from 'rxjs';
import { PRO023Service } from 'src/app/services/PRO023/PRO023.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-PRO02301',
  templateUrl: './PRO02301.component.html',
  styleUrls: ['./PRO02301.component.css'],
	standalone: true,
	imports: [CommonModule, DxDateBoxModule, DxButtonModule, DxDataGridModule, DxNumberBoxModule, DxTooltipModule,
					DxLoadPanelModule, DxToolbarModule, DxCheckBoxModule, DxTreeListModule
	]
})
export class PRO02301Component {

  @ViewChild("treeListPartes", { static: false }) treeListPartes: DxTreeListComponent;


  @Input() events: Observable<any>;
  @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();

  private eventsSubscription: Subscription;
  subscription: Subscription;

  DGPartes:any[] = [];
  templateGroup: any = ['PRODUCTO'];
	columnVisibles: any = [];
  noDataText:any = '';

  constructor( private sData: PRO023Service )  { 
    this.addColumn = this.addColumn.bind(this);
  }

  ngOnInit(): void {
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.accion) {
        case 'init':
          // this.ACCION_LOCAL = datos.accion;
          break;
          
          case 'CONSULTA PARTES':
            this.valoresObjetos('consulta partes', datos.dataSource);
          break;

        default:
          break;
      }
    });
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  addColumn(data:any) {
		this.DGPartes = [];
		let columns:any = [];
    var newArray:any = [];
    if (this.columnVisibles.length === 0)
      this.columnVisibles = this.treeListPartes.instance.getVisibleColumns();
    for (let i = 0; i < data.length; i++) {
      var element = data[i];
      if (element.ATRIBUTOS != undefined) {
				element.ATRIBUTOS.forEach((atr:any) => {
					const nomCol = atr.CLASE?.toUpperCase();
					const desAtr = atr.CLASE;
					const exis = columns.indexOf(nomCol);
					if (exis === -1) {
            const indexColumn:any = this.columnVisibles.findIndex((d:any) => d.caption === 'Atributos');
						columns.push({dataField:nomCol, caption:desAtr, ownerBand:this.columnVisibles[indexColumn].index, alignment:'left'});
					}
					element = {...element, [nomCol]:atr.VALOR};
				});
			};
      newArray.push(element);
    }
		
    this.DGPartes = newArray;
    columns.forEach((col:any) => {
      const columnVisibles:any [] = this.treeListPartes.instance.getVisibleColumns();
      const indexColumn:any = columnVisibles.findIndex((d:any) => d.dataField === col.dataField);
      if (indexColumn === -1)
        this.treeListPartes.instance.addColumn(col);
    });
	}

  valoresObjetos(obj: string, datos:any){
		if (obj === 'consulta partes' || obj === 'todos'){
      const prm = { PRODUCTO: datos.PRODUCTO };
      this.sData.consulta('CONSULTA PARTES', prm, 'PRO-023')
			.subscribe((data: any) => {
				const res = JSON.parse(data.data);
				if ( (data.token != undefined) ){
					const refreshToken = data.token;
					localStorage.setItem("token", refreshToken);
				}
				if (res[0].ErrMensaje !== '') {
					// this.showModal(res[0].ErrMensaje, '');
          this.noDataText = res[0].ErrMensaje;
				} else {
					// this.DGPartes = res;
          this.addColumn(res);
				}
			});
    };
  }

  showModal(mensaje:any, titulo:any='¡Error!', msg_html:any= '') {
    let iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
    if (titulo !== '¡Error!') iconHtml = "<i class='icon-alert-ol'></i>";
    Swal.fire({
      iconHtml: iconHtml,
      confirmButtonColor: '#0F4C81',
      title: titulo,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: "center",
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }

}
