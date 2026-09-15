import { DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DxButtonModule, DxFormModule, DxLoadPanelModule, DxSelectBoxComponent, DxSelectBoxModule } from 'devextreme-angular';
import { Subject, Subscription } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import Swal from 'sweetalert2';
import { clsClientes } from './clsCXC2010.class';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';

@Component({
  selector: 'app-CXC210',
  templateUrl: './CXC210.component.html',
  styleUrls: ['./CXC210.component.css'],
  standalone: true,
  imports: [ DxFormModule, DxSelectBoxModule, DxButtonModule, DxLoadPanelModule, 
             GeninformesComponent ]
})
export class CXC210Component {

  @ViewChild("xs_ID_CLIENTE", { static: false }) sboxClientes: DxSelectBoxComponent;

  subscription: Subscription;
  DCuentasXCobrar: clsClientes = new clsClientes();  
  DClientes: any;
  loadingVisible: boolean = false;
  dropDownOptions: any =  { width: 700, 
    height: 400, 
    hideOnParentScroll: true, 
    container: '#router-container',
    toolbarItems: [{
      location: 'before', 
      toolbar: 'top',
      template: 'tempEncab',
    }]
  };
  prmUsrAplBarReg: clsBarraRegistro;
  USUARIO_LOCAL: any;
  mnuAccion: string;
  eventsSubjectInformes: Subject<any> = new Subject<any>();

  constructor(
    private _sdatos: GeneralesService,
    private datepipe: DatePipe,
    private _sbarreg: SbarraService,
    private tabService: TabService

  ) 
    {

      // Servicio de barra de registro
    this.subscription = this._sbarreg.getObsRegApl().subscribe((datreg) => {
      // Valida si la petición es para esta aplicacion
      if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opMenuRegistro(datreg);
    });

  }

  // Llama a Acciones de registro
	opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes

		switch (operMenu.accion) {
			case "r_ini":
        this.prmUsrAplBarReg = {
          tabla: "MOVIMIENTOS",
          aplicacion: "COM-203",
          aplicacionBase: '',
          usuario: this.USUARIO_LOCAL,
					accion: "r_ini",
					error: "",
					r_numReg: 0,
					r_totReg: 0,
					operacion: { }
				};
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

      default:
        break;
    }
  }
  
  // Acciones sobre Selección cliente
  // Nombre
  onSeleccRowCliente(e:any) {
  }

  refreshClick(objeto) {
    // this.checkProSoloPrecio.instance.option("value", false);
    // this.checkProProveedor.instance.option("value", false);
    this.valoresObjetos('clientes');
    this.sboxClientes.instance._refresh();
    this.sboxClientes.instance.close();
  }

  generaInforme() {
    
    var prmRep = {  operacion: 'r_imprimir', 
                    accion: 'previsualizar',
                    aplicacion: this.prmUsrAplBarReg.aplicacion, 
                    tabla: this.prmUsrAplBarReg.tabla,
                    usuario: this.prmUsrAplBarReg.usuario,
                    idrpt: "XRptCarteraEstadoCuenta",
                    archivo: "XRptCarteraEstadoCuenta",
                    id_reporte: "CXC-201-001",
                    data_rpt: { text: 'Estado de cuenta', id_reporte: 'CXC-201-001', archivo: 'XRptCarteraEstadoCuenta', item: 0},
                    QFiltro: " CLIENTES.ID_CLIENTE = '"+this.DCuentasXCobrar.ID_CLIENTE+"'"
                  };
    this.eventsSubjectInformes.next(prmRep);

  }

  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined){

    if (obj == 'clientes' || obj == 'todos') {
      this._sdatos.consulta('CLIENTES CARTERA',{ },'VEN-001').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DClientes = res;
      });
    }
  }

  ngOnInit(): void {

    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: "CARTERA",
      aplicacion: "CXC-210",
      aplicacionBase: '',
      usuario: this.USUARIO_LOCAL,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: {}
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';

    // Inicializa datos
    this.valoresObjetos('todos');

  }

  ngOnDestroy(){
    
  }

  showModal(mensaje: any, titulo = '¡Error!', msg_html= '') {
    const tipo = titulo;
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo==='Error' ? 'DF3E3E':'#0F4C81 !important',
			title: titulo,
			text: mensaje,
			allowOutsideClick: true,
			allowEscapeKey: false,
			allowEnterKey: false,
			backdrop: true,
			position: 'center',
      html: msg_html,
			stopKeydownPropagation: false,
		});
	}

}
