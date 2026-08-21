
import { Component, ViewChild, Input } from '@angular/core';
import { DxCheckBoxModule, DxDateBoxModule, DxFileUploaderModule, DxFormModule, DxSelectBoxModule, DxTextAreaModule, DxTextBoxModule, DxLoadPanelModule } from 'devextreme-angular';
import { Subject} from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { MAD002Service } from 'src/app/services/MAD002/MAD002.service';
import Swal from 'sweetalert2';
import { ConfigDashboardModel } from './models/config-dashboard.model.js';
import { Aplicaciones } from './models/aplicaciones.model.js';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';
import { DxTreeViewModule } from 'devextreme-angular';
import { GenericTreeComponent } from 'src/app/shared/components/generic-tree/generic-tree.component';
import { DxButtonModule } from 'devextreme-angular';
import { DxFormComponent } from 'devextreme-angular';
import { DxDataGridModule } from 'devextreme-angular';
import { DxTabPanelModule } from 'devextreme-angular';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from 'src/app/shared/components/dashboard/dashboard.component.js';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-MAD002',
    imports: [
    DxFormModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxCheckBoxModule,
    DxDateBoxModule,
    DxFileUploaderModule,
    DxButtonModule,
    DxTextAreaModule,
    DxTreeViewModule,
    VistarapidaComponent,
    GeninformesComponent,
    GenericTreeComponent,    
    DxDataGridModule,
    DxTabPanelModule,    
    CommonModule,    
    DashboardComponent,
    DxLoadPanelModule
],
    templateUrl: './MAD002.component.html',
    styleUrls: ['./MAD002.component.css']
})
export class MAD002Component {
  @ViewChild('arbolAplicaciones') arbolAplicaciones!: GenericTreeComponent;
  @ViewChild('form') form!: DxFormComponent;  
  dataAppModel: ConfigDashboardModel;  
  aplicacionesTree: Aplicaciones[] = []; 
  mostrarArbol = true;   // Controlado por el formulario
  arbolVisible = true;   // Estado local del árbol
  @Input()
  aplicacion!: string;
  dashboardFullscreen = false;
  public _unsubscribeAll: Subject<any>;
  subscription: Subscription;

  // Variables fijas de la aplicación 
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();
  prmUsrAplBarReg: clsBarraRegistro;
  USUARIO: any;  
  loadingVisible: boolean = false; 


  constructor(
    private sData: MAD002Service,    
    private _sbarreg: SbarraService,    
  ) {
    this._unsubscribeAll = new Subject();  
    // Servicio de barra de registro
    this.subscription = this._sbarreg
    .getObsRegApl()
    .subscribe((datreg) => {
      // Valida si la petición es para esta aplicacion
      if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opMenuRegistro(datreg);
    });  
  }

  ngOnInit(): void {
    this.dataAppModel = {
      ID_APLICACION: '',      
      DATA: null      
    };
    this.USUARIO = localStorage.getItem('usuario')?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'CONFIG_DASHBOARDS',
      aplicacion: this.aplicacion,
      usuario: this.USUARIO,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: {},
    };    
    this.mostrarArbol = true;
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);    
    this.cargarArbolAplicaciones();  
  }

  ngOnDestroy() {  
    this.subscription.unsubscribe();  
  }

  cargarArbolAplicaciones(): void {
    this.sData.consulta('ARBOL_APLICACIONES', {}, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (data.token != undefined) {
          localStorage.setItem('token', data.token);
        }
        if (res[0]?.ErrMensaje === '') {
          this.aplicacionesTree = res;          
        }
      });
  }

  onAplicacionTreeClick(event: any): void {
    const aplicacion = event.node; 
    
    // Si el nodo tiene hijos, no hace nada
    if (aplicacion.children && aplicacion.children.length > 0) {
        return;
    }    
    this.dataAppModel = { ...aplicacion };        
    this.mostrarArbol = true;       
  }
   
  filtrarArbol(event: any): void {    
    console.log('Buscando:', event.value);
  } 

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {    
    switch (operMenu.accion) {
      case "r_ini":
        const user:any = localStorage.getItem("usuario");
        this.prmUsrAplBarReg = {
          tabla: "CONFIG_DASHBOARDS",
          aplicacion: this.aplicacion,
          usuario: user,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_refrescar':           
        this.cargarArbolAplicaciones();
        const idAplicacionActiva = this.dataAppModel.ID_APLICACION;
        this.dataAppModel.ID_APLICACION = '';
        setTimeout(() => {
            this.dataAppModel.ID_APLICACION = idAplicacionActiva;
        });
        break;
      default:
        break;
    }
  }

  showModal(mensaje: any, 
            titulo: any = '¡Error!', 
            msg_html: any = '', 
            tipo: 'error' | 'warning' | 'success' | 'default' = 'default') {
    let iconHtml = '';
    switch (tipo) {
        case 'success':
            iconHtml = "<i class='icon-check-circle success-color'></i>";
            break;

        case 'warning':
            iconHtml = "<i class='icon-alert-ol warning-color'></i>";
            break;

        case 'error':
            iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
            break;

        default:
            iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
            if (titulo !== '¡Error!') iconHtml = "<i class='icon-alert-ol'></i>";            
    }
    console.log(iconHtml);
    Swal.fire({
      iconHtml: iconHtml,
      confirmButtonColor: '#0F4C81',
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

  toggleArbol(): void {
    if (this.mostrarArbol) {
      this.arbolVisible = !this.arbolVisible;
    }
  }
}