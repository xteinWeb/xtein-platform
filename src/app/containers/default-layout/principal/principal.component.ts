import { Component, Output, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { GlobalVariables } from '../../../shared/common/global-variables';
import { clsBarraRegistro } from '../../regbarra/_clsBarraReg';
import { SbarraService } from '../../regbarra/_sbarra.service';
import { ActivatedRoute } from '@angular/router';
import { Tab } from '../../tabs/tab.model';
import { TabService } from '../../tabs/tab.service';
import { Subscription } from 'rxjs';
// import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkLazyDropList } from '../../tabs/lazy-drag-drop.directive';
import Swal from 'sweetalert2';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabContentComponent } from '../../tabs/tab-content.component';
import { FiltroComponent } from 'src/app/shared/filtro/filtro.component';
// import { MatLegacyTabGroup as MatTabGroup, MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { RegbarraComponent } from '../../regbarra/regbarra.component';
import { DxSpeedDialActionModule } from 'devextreme-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';

@Component({
    selector: 'principal-component',
    templateUrl: 'principal.component.html',
    styleUrls: ['./principal.component.scss'],
    standalone: true,
    imports: [FormsModule, CommonModule, TabContentComponent,
        FiltroComponent, RegbarraComponent, DxSpeedDialActionModule,
        CommonModule, MatTabGroup, MatTabsModule, MatMenuModule, MatButtonModule
    ],
    providers: [DatePipe]
})

export class PrincipalComponent implements OnInit, OnDestroy {
  @ViewChild("tabsPrincipal", { static: false }) tabsPrincipal: MatTabGroup;
  @ViewChild('cdkLazyDropList', { static: false }) cdkLazyDropList: CdkLazyDropList;

  tabs = new Array<Tab>();
  selectedTab: number = 0;

  subscription: Subscription;
  listaApl: any[] = [];
  stylePesta: any = [];
  prmUsrAplBarReg: clsBarraRegistro;
  tabPpalVisible: boolean = true;

  constructor(private _sbarreg: SbarraService,
    private activatedRoute: ActivatedRoute,
    private tabService: TabService) { }

  // Establece aplicación activa
  onTabClick(e: any) {
    // No procesar si no hat Tabs
    if (e.index <= 0) return;
    if (this.tabService.tabs.length === 0) return;

    const idApl = this.tabService.tabs[e.index - 1].aplicacion;
    const tabla = this.tabService.tabs[e.index - 1].tabla;
    this.tabService.tabs[e.index - 1].active = true;
    this.tabService.tabs.forEach((tab: any) => {
      if (tab.aplicacion !== idApl)
        tab.active = false;
    });
    const napl = GlobalVariables.listaAplicaciones.map(a => a.aplicacion).indexOf(idApl);
    GlobalVariables.idAplicacionActiva = idApl;
    if (tabla === 'reporte') {
      const user: any = localStorage.getItem("usuario");
      this.prmUsrAplBarReg = {
        tabla: tabla,
        aplicacion: idApl,
        usuario: user,
        accion: 'zero',
        error: "",
        r_numReg: 0,
        r_totReg: 0,
        operacion: {}
      };
      this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    }
    if (napl === -1) return;

    // Parámetro de configuracion de la barra para la aplicación activa
    if (tabla !== 'reporte') {
      const user: any = localStorage.getItem("usuario");
      this.prmUsrAplBarReg = {
        tabla: tabla,
        aplicacion: idApl,
        usuario: user,
        // accion: (GlobalVariables.listaAplicaciones[napl].barra === undefined ? 'r_ini' : 'activar'),
        accion: (GlobalVariables.listaAplicaciones[napl].accion === undefined ? 'r_ini' : 'activar'),
        error: "",
        r_numReg: (GlobalVariables.listaAplicaciones[napl].r_numReg === undefined ? 0 : GlobalVariables.listaAplicaciones[napl].r_numReg),
        r_totReg: (GlobalVariables.listaAplicaciones[napl].r_totReg === undefined ? 0 : GlobalVariables.listaAplicaciones[napl].r_totReg),
        operacion: (GlobalVariables.listaAplicaciones[napl].operacion === undefined ? {} : GlobalVariables.listaAplicaciones[napl].operacion),
      };
      // if (GlobalVariables.listaAplicaciones[napl].barra === undefined)
      if (GlobalVariables.listaAplicaciones[napl].accion === undefined)
        this._sbarreg.setObsRegApl(this.prmUsrAplBarReg);
      else
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

      // Si es un aplicacion de un arbol padre, envia parámetro
      if (this.tabService.tabs[e.index - 1].tabData.args) {
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          accion: 'r_apl_hija',
          operacion: { apl_hija: this.tabService.tabs[e.index - 1].tabData.args }
        };
        this._sbarreg.setObsRegApl(this.prmUsrAplBarReg);
      }

    }
  }

  removeTab(index: number): void {
    // Valida si está en modo edición
    if (GlobalVariables.listaAplicaciones[index].statusEdicion.match('_edicion')) {
      Swal.fire({
        title: '',
        text: 'No se han guardado cambios en [' + this.tabService.tabs[index].title +
          ']. Desea cerrar sin guardar cambios? ',
        iconHtml: "<i class='icon-alert-ol'></i>",
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#438ef1',
        cancelButtonText: 'No',
        confirmButtonText: 'Sí, cerrar'
      }).then((result) => {
        if (result.isConfirmed) {
          // Removerla de la lista de apps
          GlobalVariables.listaAplicaciones.splice(index, 1);

          // Removerla de la lista de tareas
          this.tabService.removeTab(index);

          // Si no hay tareas, ocultar barra de registro
          if (this.tabService.tabs.length === 0) {
            GlobalVariables.idAplicacionActiva = '';
            this.prmUsrAplBarReg = {
              tabla: '',
              aplicacion: '',
              usuario: '',
              accion: 'zero',
              error: '',
              r_numReg: 0,
              r_totReg: 0,
              operacion: {}
            };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          }
        }
      });
    } else {
      if (GlobalVariables.listaAplicaciones[index].aplicacion !== "ADM-300") {
        // Removerla de la lista de apps
        GlobalVariables.listaAplicaciones.splice(index, 1);

        // Removerla de la lista de tareas
        this.tabService.removeTab(index);

        // Si no hay tareas, ocultar barra de registro
        if (this.tabService.tabs.length === 0) {
          GlobalVariables.idAplicacionActiva = '';
          this.prmUsrAplBarReg = {
            tabla: '',
            aplicacion: '',
            usuario: '',
            accion: 'zero',
            error: '',
            r_numReg: 0,
            r_totReg: 0,
            operacion: {}
          };
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }
      }
    }
  }

  dropped(event: any, t: any): void {
    const arr = t._tabs.toArray();
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    t._tabs.reset(arr);
  }

  ngOnInit(): void {
    // Inicializa servicio de tabs
    this.subscription = this.tabService.tabSub.subscribe(tabs => {
      this.tabs = tabs;
      this.selectedTab = tabs.findIndex(tab => tab.active);
      this.stylePesta = { 'text-transform': 'uppercase', 'font-weight': 'bold', 'font-size': '18px', 'background-color': 'blue' };
      if (this.selectedTab !== -1) this.selectedTab++;
      // Inicializa aplicación
      this.onTabClick({ index: this.selectedTab });

      setTimeout(() => {
        //if (this.selectedTab === 0) this.selectedTab = 1;
        this.tabsPrincipal.selectedIndex = this.selectedTab;
        if (tabs.length === 0)
          this.tabPpalVisible = false;
        else
          this.tabPpalVisible = true;
      }, 150);
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onWindowScroll($event: Event) {
    var container_list_tabs: any = document.getElementsByClassName('mat-tab-list');
    // const container_tabs = document.querySelector('mat-tab-header') as HTMLElement;
    container_list_tabs.classList.toggle("container-header-toggle", container_list_tabs.scrollTop > 0);
  }

}
