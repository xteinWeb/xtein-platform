import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DxGalleryComponent, DxGalleryModule } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { PasosComponent } from 'src/app/shared/pasos/pasos.component';
import { PasosService } from 'src/app/shared/pasos/pasos.service';
import { AgruparComponent } from './agrupar/agrupar.component';
import { OrdenarComponent } from './ordenar/ordenar.component';

@Component({
  selector: 'app-informes',
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css'],
  standalone: true,
  imports: [CommonModule, DxGalleryModule, PasosComponent, AgruparComponent, OrdenarComponent]
})
export class InformesComponent implements OnInit {
  @ViewChild("tabsPasosGenInf", { static: false }) tabsPasosGenInf: DxGalleryComponent;
  @ViewChild("tabsPasosModulo", { static: false }) tabsPasosModulo: DxGalleryComponent;

  listaModulos: any;
  pasoInforme: number = 0;
  modulo: string;
  nomModulo: string;
  idInforme: string;
  subscription: Subscription;
  prmDatosPasos: any;
  informesModulo: any;
  pasoGenInforme: number = 0;
  tabsGenInforme = ['Agrupación',
                    'Ordenamiento',
                    'Especificaciones',
                    'Filtro'];
  tabsInformesModApl: any;

  constructor(private _sdatos: GeneralesService,
              private _spasos: PasosService
    ) 
  { 
    this.subscription = this._spasos.getObsPasos().subscribe((datprm) => {
      // Procesa solo la aplicación activa
      if (this.pasoInforme === 2) {
        switch (datprm.titulo) {
          case 'Agrupación':
            this.tabsPasosGenInf.instance.goToItem(0, false);
            break;
          case 'Ordenamiento':
            this.tabsPasosGenInf.instance.goToItem(1, false);
            break;
          case 'Especificaciones':
            this.tabsPasosGenInf.instance.goToItem(2, false);
            break;
          case 'Filtro':
            this.tabsPasosGenInf.instance.goToItem(3, false);
            break;
          default:
            break;
        }

      }
      
      // Procesa categoría del modulo
      if (this.pasoInforme === 1) {
        this.tabsPasosModulo.instance.goToItem(datprm.idTab, false);
      }

      // Ir a home
      if (datprm === 'home') {
        this.pasoInforme = 0;
      }

      // Ir a paso de la ruta
      if (datprm.ruta) {
        // Pasos de generación de un informe
        this.cargarInformeMod(datprm.ruta.datos.ID_APLICACION_PADRE);
      }

    });

  }

  // Abre el asistente de informes
  cargarInformeMod(modApl) {
    this.modulo = modApl;
    this.nomModulo = this.listaModulos.find(m => m.ID_APLICACION === modApl).NOMBRE;

    // Informes del módulo
    const prminf = { usuario: localStorage.getItem("usuario"),
                     modulo: modApl,
                     aplicacion: modApl
                   }                         
    this._sdatos.consulta('informes modulo-aplicacion', prminf, 'generales')
      .subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }

        // Llama a los pasos del módulo
        let catrpt:any = [];
        for (var k=0; k < res.length ; k++) {
          catrpt.push({ idTab: k, titulo: res[k].CATEGORIA });
        };
        this.prmDatosPasos = { items: catrpt,
                               titulo: 'INFORMES DE '+this.nomModulo,
                               subtitulo: 'Generación de informes del módulo',
                               ruta: [{ text: this.nomModulo, datos: res[0].REPORTES }]
                            };
        this.pasoInforme = 1;
        this.tabsInformesModApl = res;
    });
            
  }

  // Ver el último generado
  verUltimo(informe) {
    alert('ultimo');
  }

  generarInforme(informe) {
    // Pasos de generación de un informe
    this.prmDatosPasos = { items: [ {idTab: 0, titulo: 'Agrupación'},
                                    {idTab: 1, titulo: 'Ordenamiento'},
                                    {idTab: 2, titulo: 'Especificaciones'},
                                    {idTab: 3, titulo: 'Filtro'}
                                  ],
                           titulo: informe.NOMBRE,
                           subtitulo: informe.DESCRIPCION,
                           ruta: [{ text: this.nomModulo, datos: informe }]
                         };
    this.pasoInforme = 2;

  }

  selectTab(item) {

  }
  onContentReady(e) {
    setTimeout(() => {
      var widthOfOneTab = 100 / e.component.option("items").length;
        var tabs = e.element.querySelectorAll('.dx-tab');
     
        for(var i = 0; i < tabs.length; i++) {
            tabs[i].style.width = widthOfOneTab + "%";
            tabs[i].style.display = "inline-block";
        }
    });
}

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string){  
  
    if (obj == 'modulos' || obj == 'todos') {
      const prm = { usuario: localStorage.getItem('usuario') };
      this._sdatos.consulta('modulos informes',prm,'generales').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.listaModulos = res;
      });
    }
  }
  
  ngOnInit(): void {
    // Modulos asociados al usuario
    this.valoresObjetos('todos');
  }

}
