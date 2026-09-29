import { Component, Directive, EventEmitter, HostListener, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { DxPopupModule } from 'devextreme-angular';
import { Observable, Subscription } from 'rxjs';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { tabs } from '../classes/tabs.class';
import { GlobalVariables } from '../common/global-variables';
import { libtools } from 'src/app/shared/common/libtools';

// Datos gloables
var dataLink: any;
var ltoolLink: any;
var popupObj: any;

@Directive({
  selector: "[cms-links]",
  standalone: true
})
export class CmsLinksHandler {

  // constructor(private _sdatos: GeneralesService,
  //             private tabService: TabService,) {}
  constructor() {}

  @HostListener("click", ["$event"])
  handle(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.nodeName === "A") {
      event.preventDefault();
      event.stopPropagation();
      const href = target.getAttribute("href");
      // this.abrirApl({ ID_APLICACION: href, desplegar: true, TABLA_APLICACION: 'PRODUCTOS', NOMBRE: 'Productos'});
      this.abrirApl();
    }
  }

  // Hace el llamado a la aplicación con el filtro de cargue
  public abrirApl(){
    const compoApl = { ID_APLICACION: dataLink.aplicacion,
                       TABLA: dataLink.prmApl.tabla,
                       user: dataLink.prmApl.usuario,
                       FILTRO: dataLink.filtro
    }
    ltoolLink.abrirApl(compoApl); 
    popupObj.hide();
  }

    // ****** Adiciona a la página de tareas la aplicacion seleccionada ******
  // Buscar en el arbol de aplicaciones si es una aplicacion
  // Abrir la aplicacion si no está abierta
//   public abrirApl(item){
//     item.desplegar = !item.desplegar;
//     const listaTab = this.tabService.tabs.find(c => c.aplicacion === item.ID_APLICACION);
//     const compo:any = tabs.find(c => c.aplicacion === item.ID_APLICACION);
        
//     if (listaTab === undefined) {
//       // Adicione a la lista de aplicaciones abiertas
//       GlobalVariables.listaAplicaciones.unshift({ aplicacion: item.ID_APLICACION, barra: undefined, statusEdicion: '' });

//       // Crea pestaña contenedora de la aplicación
//       this.tabService.addTab(
//           new Tab(compo.component, 
//                   item.NOMBRE, 
//                   { parent: "PrincipalComponent" }, 
//                   item.ID_APLICACION,
//                   item.icon,
//                   item.TABLA_APLICACION,
//                   true));
      
//       // Adiciona a las más usadas
//       const prm = { aplicacion: item.ID_APLICACION, 
//                     ip: this._sdatos.getIPAddress, 
//                     usuario: localStorage.getItem('usuario') }
//       this._sdatos.consulta('uso aplicacion',prm,'generales').subscribe((data: any)=> {
//         const res = JSON.parse(data.data);
//         if ( (data.token != undefined) ){
//           const refreshToken = data.token;
//           localStorage.setItem("token", refreshToken);
//         }
//       });
//     }

//     // Si existe, activa Tab
//     else {
//       const indexTab = this.tabService.tabs.findIndex(c => c.aplicacion === item.ID_APLICACION);
//       this.tabService.activaTab(indexTab);
//     }

//   }

}


@Component({
  selector: 'app-menufloat',
  templateUrl: './menufloat.component.html',
  styleUrls: ['./menufloat.component.css',
              '../../../assets/xtein.scss'],
  standalone: true,
  imports: [DxPopupModule, CmsLinksHandler]
              
})
export class MenufloatComponent implements OnInit {

  ltool: any;

  private eventsSubscription: Subscription;
  
  @Input('popupVisible') esVisible: boolean;

  @Input() targetElem: any;

  @Input() data: any;

  @Input() events: Observable<void>;

  @Output() cerrarMenu = new EventEmitter<boolean>();

  menuTool: any;
  target: any;
  titMenu: string;
  contenidoTool: string;
 
  constructor(private _sdatos: GeneralesService) { }

  onShown(e) {
    this.target = this.targetElem;

    // Librería que se encarga de cargar aplicacion con filtro
    this.ltool = new libtools(this.data.objRegistro, this.data.objTab);
    dataLink = { objRegistro: this.data.objRegistro, 
                 objTab: this.data.objTab, 
                 prmApl: this.data.prmApl,
                 filtro: this.data.filtro,
                 aplicacion: this.data.aplicacion };
    ltoolLink = this.ltool;

    // Datos de configuración
    this.titMenu = this.data.titulo;

    // Trae la información relevante al objeto donde se diclo ctrl+click
    const prm = { prmApl: this.data.prmApl, objeto: this.data.objeto };
    this._sdatos.consulta('menutool', prm, 'generales').subscribe((data: any)=> {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }

      this.contenidoTool = res[0].HTML;
      this.titMenu = res[0].TITULO;
    });
 
  }
  onInitialized(e) {
    console.log('onInitialized....',this.targetElem);
    popupObj = e.component;
  }
  onResizeEnd(e) {
  }
  onHidden(e) {
    this.esVisible = false;
    this.cerrarMenu.emit(false);
    console.log('fin....',e);
  }
  ngOnInit(): void {
    this.menuTool = [ { font: 'icon-crear', name: 'crear', visible: true },
                      { font: 'icon-editar-ol', name: 'modificar', visible: true },
                      { font: 'icon-eliminar', name: 'modificar', visible: true }
                    ]

    this.eventsSubscription = this.events.subscribe(() => {
      this.cerrarMenu.emit(false);
    });                    


  }
  ngAfterViewInit(): void {
    console.log('pre....',this.targetElem);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['esVisible'] && changes['esVisible']?.previousValue != changes['esVisible']?.currentValue) {
      //this.esVisible = !this.esVisible;
      // Do Something triggered by the parent button.
      console.log('cambios');
    }
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

}
