import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiRestService } from '../../../services/usuarios/api-rest.service';
import Swal from 'sweetalert2';
import { TabService } from '../../tabs/tab.service';
import { Router } from '@angular/router';
import { Tab } from '../../tabs/tab.model';
import { GlobalVariables } from '../../../shared/common/global-variables';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { tabs } from '../../../shared/classes/tabs.class';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DxButtonModule, DxSwitchModule, DxToolbarModule, DxTooltipModule, DxTreeViewComponent, DxTreeViewModule } from 'devextreme-angular';

@Component({
    selector: 'leftvar-component',
    templateUrl: './leftvar.component.html',
    styleUrls: ['./leftvar.component.scss'],
    imports: [FormsModule, CommonModule, DxButtonModule, DxTooltipModule, DxSwitchModule, DxTreeViewModule, DxToolbarModule]
})

export class LeftvarComponent implements OnInit {

	@ViewChild ('treeviewMenu', { static: false }) treeviewMenu : DxTreeViewComponent;

  collapsed: any;
  modCollapsed: boolean = false;
  toolTipVisible: boolean = false;
  expandtreeviewMenu: boolean = false;
  targetIdTooltip: string;
  tooltipTitulo: string;
  tooltipInfo: string;
  btnContraer: string = 'Expandir';

  usuario: any;
  empresa: any;
  aplicaciones: any = [];
  tblMasUsadas: any;
  busqueda: any;
  screen:number = 0;

  menuKey = '';
  usuarioAplicaciones: any = [];
  aplicacionesAsociadas: any = [];

  public sidebarMinimized = false;
  menuItems: any = [];
  
  constructor(
    private sData: ApiRestService, 
    private tabService: TabService,
    private _sdatos: GeneralesService,
    private router: Router
  ) {
    this.carouselUp = this.carouselUp.bind(this);
    this.carouselDown = this.carouselDown.bind(this);
  }

  ngOnInit(): void {
    this.collapsed = this.sData.collapsed;
    this.getInfoUser();
    this.getAplicacionesUser();
    this.getMasUsadas();
    this.getMenu(this.usuarioAplicaciones, this.menuKey);
    this.getAplicacionTablero();
  };

  ngOnDestroy() {
    this.tabService.tabs = [];
  }

  onResized(event:any) {
    this.screen = event.target.innerWidth;
    if(this.screen <= 768)
      this.collapsed = true;
    else
      this.collapsed = false;

    this.sData.collapsed = this.collapsed;
  }

  getInfoUser(){
    this.usuario = localStorage.getItem('usuario');
    this.empresa = localStorage.getItem('empresa');
  }

  onExpandirMenu(e:any) {
    if(this.treeviewMenu.expandAllEnabled) {
      this.btnContraer = 'Expandir';
      this.expandtreeviewMenu = !this.expandtreeviewMenu;
      this.menuItems.forEach((ele:any) => {
        if(ele.TIPO === 'modulo') {
          this.treeviewMenu.instance.collapseItem(ele.ID_APLICACION);
        }
      });
      return;
    }
    if(!this.treeviewMenu.expandAllEnabled) {
      this.btnContraer = 'Contraer';
      this.expandtreeviewMenu = !this.expandtreeviewMenu;
      this.menuItems.forEach((ele:any) => {
        if(ele.TIPO === 'modulo') {
          this.treeviewMenu.instance.expandItem(ele.ID_APLICACION);
        }
      });
      return;
    }
  }
  
  getAplicacionesUser(){
    const prm = {USUARIO: this.usuario, EMPRESA: this.empresa};
    this.sData.usuarioAplicaciones('USUARIO APLICACIONES', prm).subscribe((data: any)=> {
     
      let res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      // Eliminar duplicados por ID_APLICACION para evitar error E1040
      res = res.filter((v:any, i:any, a:any) => a.findIndex((t:any) => (t.ID_APLICACION === v.ID_APLICACION)) === i);

      this.usuarioAplicaciones = res;
      this.aplicacionesAsociadas = res;
      this._sdatos.APLICACIONES = res;
      this._sdatos.setAplicaciones(this.usuarioAplicaciones);

      var newArray = res.filter(function (el:any) {
        return el.ID_APLICACION_PADRE === 'XTEIN';
      });

      const mensaje = newArray[0].ErrMensaje;
      if ( mensaje != ''){
        this.showModal(mensaje);
      } else {
        this.aplicaciones = newArray;
        this.menuItems = newArray;
        this.menuItems.forEach((element:any) => {
          element.desplegar = false;
        });
        this.filterMenuItems();
      }
    });
  }

  filterMenuItems(){
    //modulos de aplicaciones:::
    var modulos:any = this.usuarioAplicaciones.filter((d:any) => d.ID_APLICACION_PADRE === 'XTEIN' && d.TIPO === 'modulo');
    modulos.forEach((element:any) => {
      //primer nivel de aplicaciones
      var menu1:any = this.usuarioAplicaciones.filter((d:any) => d.ID_APLICACION_PADRE === element.ID_APLICACION);
      if(menu1.length > 0) {
        menu1.sort((a:any, b:any) => {
          if (a.NOMBRE > b.NOMBRE) return 1;
          if (a.NOMBRE < b.NOMBRE) return -1;
          return 0;
        });
        const index:any = modulos.findIndex((d:any) => d.ID_APLICACION === element.ID_APLICACION);
        modulos[index].items = menu1;
        // element = { ...element, items: menu1 };
        //segundo nivel de aplicaciones
        menu1.forEach((item:any) => {
          var menu2:any = this.usuarioAplicaciones.filter((e:any) => e.ID_APLICACION_PADRE === item.ID_APLICACION);
          if(menu2.length > 0) {
            menu2.sort((a:any, b:any) => {
              if (a.NOMBRE > b.NOMBRE) return 1;
              if (a.NOMBRE < b.NOMBRE) return -1;
              return 0;
            });
            const npos:any = menu1.findIndex((d:any) => d.ID_APLICACION === item.ID_APLICACION);
            modulos[index].items[npos].items = menu2;
            // item = { ...item, items: menu2 };
          }
        });
      }
    });
    this.menuItems = modulos;
  }

  getMasUsadas() {
    const prm = { usuario: localStorage.getItem('usuario') };
    this.sData.consulta('apl mas usadas',prm, 'generales').subscribe((data: any)=> {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      if (res[0].ID_APLICACION === 'ADM-300')
        res.splice(0, 1);
      for (let i = 0; i < res.length; i++) {
        res[i].subMenu = [];
        res[i].item = i;
      }
      this.tblMasUsadas = res;
    });
  }

  getMenu(usuarioAplicaciones:any, menuKey:any){
    const tempArray = [...usuarioAplicaciones].sort();
    var menuItems = tempArray.filter(function (el) {
      return el.ID_APLICACION_PADRE === menuKey
    });
    menuItems.forEach(el => {
      const subm = usuarioAplicaciones.filter((it:any) => it.ID_APLICACION_PADRE == el.ID_APLICACION);
      let xel = {...el, subMenu: (subm.length !== 0 ? subm : []!), desplegar: false, toggle: (subm.length != 0 ? 'dropdown-toggle': '') };
      let n = menuItems.findIndex(e => e.ID_APLICACION === el.ID_APLICACION);
      menuItems[n] = xel;
    });
    this.menuItems = menuItems;

  }

  // Relocaliza la barra de herramientas
  dimensBarra() {
    var barra = document.getElementsByClassName('cls-reg-barra') as HTMLCollectionOf<HTMLElement>;;
    barra[0].style.setProperty('margin-left','5vw !important;');
    barra[0].style.backgroundColor = 'yellow !important';
  }

  // Trae configuracion de todos los elementos del tablero
  getAplicacionTablero() {
    const prm = {USUARIO: this.usuario, EMPRESA: this.empresa, ID_APLICACION: 'ADM-300'};
    this._sdatos.consulta('consulta aplicacion', prm, 'generales').subscribe((data: any)=> {
      // Abre tablero como pestaña por defecto
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      if (res[0].ErrMensaje === '') {
        res[0].subMenu = JSON.parse(res[0].subMenu);
        this.abrirApl(res[0]);
      }
    });
  }

  drawerToggle(): void {
    this.collapsed = !this.collapsed;
    this.sData.collapsed = this.collapsed;
    this.sData.setObs_collapsed(this.collapsed);
  }

  onItemClickTreeMenu(e:any) {
    if (e.itemData.TIPO === 'modulo') {
      if (e.itemData.desplegar) {
        e.itemData.desplegar = false;
        this.treeviewMenu.instance.collapseItem(e.itemData.ID_APLICACION);
        return;
      };
      if (!e.itemData.desplegar) {
        e.itemData.desplegar = true;
        this.treeviewMenu.instance.expandItem(e.itemData.ID_APLICACION);
        return;
      };
    };
    // if (e.itemData.TIPO === 'aplicacion') {
    //   if(this.screen <= 768.98 && e.itemData.ID_APLICACION !== "ADM-300")
    //     this.collapsed = !this.collapsed;
    // }
  }

  // ****** Adiciona a la página de tareas la aplicacion seleccionada ******
  // Buscar en el arbol de aplicaciones si es una aplicacion
  // Abrir la aplicacion si no está abierta
  abrirApl(item:any){
    // item.desplegar = !item.desplegar;
    if (item.subMenu === undefined || item.subMenu.length === 0) {
      let subm = this.usuarioAplicaciones.filter((it:any) => it.ID_APLICACION_PADRE === item.ID_APLICACION);
      if (subm.length === 0) {

        // Verifica si es una aplicacion multiple con uso de aplicacion padre
        subm = this.usuarioAplicaciones.filter((it:any) => it.ID_APLICACION === item.ID_APLICACION);
        let aplicacion = item.ID_APLICACION;
        let nom_aplicacion = item.NOMBRE;
        if (subm.length > 0) {
          if (subm[0].PARAMETROS !== '' && subm[0].PARAMETROS !== undefined && subm[0].PARAMETROS !==  null) {
            aplicacion = subm[0].PARAMETROS;
            nom_aplicacion = subm[0].NOMBRE;
          }
        }
        const listaTab = this.tabService.tabs.find(c => c.aplicacion === aplicacion);
        const compo:any = tabs.find(c => c.aplicacion === aplicacion);
        // Si no existe, no está abierta entonces agrega Tab
        if (listaTab === undefined) {
          this.router.navigate(['home/principal'], {skipLocationChange: true});

          // Adicione a la lista de aplicaciones abiertas
          GlobalVariables.listaAplicaciones.unshift({ aplicacion: aplicacion, barra: undefined, statusEdicion: '' });

          // Crea pestaña contenedora de la aplicación
          this.tabService.addTab(
              new Tab(compo.component,
                      item.NOMBRE,
                      { parent: "PrincipalComponent", args: item.ID_APLICACION },
                      aplicacion,
                      item.icon,
                      item.TABLA_APLICACION,
                      true));
          
          // Adiciona a las más usadas
          const prm = { aplicacion: aplicacion,
                        ip: this._sdatos.getIPAddress,
                        usuario: localStorage.getItem('usuario') }
          this._sdatos.consulta('uso aplicacion',prm,'generales').subscribe((data: any)=> {
            const res = JSON.parse(data.data);
            if ( (data.token != undefined) ){
              const refreshToken = data.token;
              localStorage.setItem("token", refreshToken);
            }
            if (res[0].ErrMensaje !== '')
              this.showModal(res[0].ErrMensaje);
          });
        }
        // Si existe, activa Tab
        else {
          //verifica si es exactamente la misma aplicación o es otra hija
          const indexTab = this.tabService.tabs.findIndex(c => c.aplicacion === aplicacion && c.title === nom_aplicacion);
          if (indexTab !== -1) {
            this.tabService.tabs[indexTab].title = nom_aplicacion;
            this.tabService.activaTab(indexTab, item.ID_APLICACION);

          } else { //si no abre la hija en una nueva tab
            this.router.navigate(['home/principal'], {skipLocationChange: true});

            // Adicione a la lista de aplicaciones abiertas
            GlobalVariables.listaAplicaciones.unshift({ aplicacion: aplicacion, barra: undefined, statusEdicion: '' });

            // Crea pestaña contenedora de la aplicación
            this.tabService.addTab(
              new Tab(compo.component,
                      item.NOMBRE,
                      { parent: "PrincipalComponent", args: item.ID_APLICACION },
                      aplicacion,
                      item.icon,
                      item.TABLA_APLICACION,
                      true)
            );
            
            // Adiciona a las más usadas
            const prm = { aplicacion: aplicacion,
                          ip: this._sdatos.getIPAddress,
                          usuario: localStorage.getItem('usuario') }
            this._sdatos.consulta('uso aplicacion',prm,'generales').subscribe((data: any)=> {
              const res = JSON.parse(data.data);
              if ( (data.token != undefined) ){
                const refreshToken = data.token;
                localStorage.setItem("token", refreshToken);
              }
              if (res[0].ErrMensaje !== '')
                this.showModal(res[0].ErrMensaje);
            });
          }
        }
      }
    }
  }

  // Administra presentación de tool tips
  toggleToolTip(btnmenu:any) {
    this.targetIdTooltip = '#'+btnmenu.icon+'-'+btnmenu.item;
    this.toolTipVisible = !this.toolTipVisible;
    this.tooltipTitulo = btnmenu.NOMBRE;
  }

  carouselUp() {
    const carousel:any = document.getElementById('carousel-icons');
    carousel.style.transition = 'all 1s ease';
    carousel.scrollTop -= 40;
  }

  carouselDown() {
    const carousel:any = document.getElementById('carousel-icons');
    carousel.style.transition = 'all 1s ease';
    carousel.scrollTop += 40;
  }

  filtrarAplicaciones(e:any){
    const search = e.target.value;
    this.menuItems = [];
    this.usuarioAplicaciones = this.aplicacionesAsociadas;

    if (search === ''){
      this.modCollapsed = false;
      this.menuItems = this.aplicacionesAsociadas.filter((i:any) => i.ID_APLICACION_PADRE === 'XTEIN');
    }else{
      this.modCollapsed = true;
      this.usuarioAplicaciones = this.usuarioAplicaciones.filter((i:any) => i.NOMBRE.toLowerCase().includes(search.toLowerCase()));
      this.usuarioAplicaciones.forEach((e:any) =>{
        const pad = this.aplicacionesAsociadas.filter((i:any) => i.ID_APLICACION === e.ID_APLICACION_PADRE);
        pad.forEach((e:any) => {
          this.usuarioAplicaciones.push(e);
          const mod = this.aplicacionesAsociadas.filter((i:any) => i.ID_APLICACION === e.ID_APLICACION_PADRE);
          if (mod.length > 0){
            mod.forEach((e:any) => {
              this.menuItems.push(e);
            });
          }else{
            this.menuItems.push(e);
          }
        });
      })
    }
    this.menuItems = [...new Set(this.menuItems)];
    this.usuarioAplicaciones = [...new Set(this.usuarioAplicaciones)];
    this.filterMenuItems();
  }
  
  showModal(mensaje:any) {
    Swal.fire({
      icon: 'error',
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
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