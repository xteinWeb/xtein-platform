import { Subscription } from 'rxjs';
import { clsBarraRegistro } from '../../containers/regbarra/_clsBarraReg';
import { SbarraService } from '../../containers/regbarra/_sbarra.service';
import { Tab } from '../../containers/tabs/tab.model';
import { TabService } from '../../containers/tabs/tab.service';
import { GeneralesService } from '../../services/generales/generales.service';
import { tabs } from '../classes/tabs.class';
import { GlobalVariables } from './global-variables';

export class libtools {

  subscription: Subscription;

  // Autobúsqueda
  searchText: string;
  url: string;
  words: Array<any>;
  self = this;
  customCalculateFilterExpression: any;

  constructor(
    private _sbarreg: SbarraService,
    private tabService: TabService
  ) { 

    this.searchText = "";
    this.words = [];
    let self = this;
    this.customCellTemplate = this.customCellTemplate.bind(this);

    // Filtro de búsqueda en todas las columnas - m+ultiples palabras
    this.customCalculateFilterExpression = function(filterValue: any, selectedFilterOperation: any, target: string) {
      const column = this as any;
      if (target !== 'search' || typeof filterValue !== "string") {
        return column.defaultCalculateFilterExpression.apply(column, arguments);
      }
      if (target === 'search') {
        if (filterValue.trim().length > 0) {
          self.words = filterValue.split(' ').filter(k => k !== '');
          let filter: Array<any> = [];
          self.words.forEach((word) => {
            filter.push([column.dataField, 'contains', word]);
            filter.push('and');
          });
          filter.pop();
          return filter;
        } else {
          return column.defaultCalculateFilterExpression.apply(column, arguments);
        }
      }
    }

  }

  // Funcion de busqueda
  splitWithoutDeleting(string: string, substring: string) {
    let index = string.toLowerCase().indexOf(substring.toLowerCase());
    let startIndex = index;
    let endIndex = index + substring.length;
    if (startIndex === -1) return [string]
    let arr = [string.substring(0, startIndex), string.substring(startIndex, endIndex), string.substring(endIndex, string.length)];
    if (startIndex === 0) arr.shift();
    if (endIndex === string.length) arr.pop();
    return arr;
  }

  // Resalta palabras filtradas
  customCellTemplate(container: any, options: any, prmSearch: any) {
    let arr = [options.text];
    if (this.words) {
      this.words.forEach(word => {
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].toLowerCase().includes(word.toLowerCase())) {
            arr.splice(i, 1, ...this.splitWithoutDeleting(arr[i], word))
          }
        }
      });
      for (let i = 0; i < arr.length; i++) {
        arr[i] = {string: arr[i], highlight: 0}
        this.words.forEach(word => {
          if (arr[i].string.toLowerCase().includes(word.toLowerCase())) {
            arr[i].highlight = 1;
          }
        })
      }
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].highlight) {
          let highlightArray = ['<span class="highlighted">', arr[i].string, '</span>'];
          arr.splice(i, 1, ...highlightArray)
        } else if (arr[i].string) {
          arr[i] = arr[i].string;
        }
      }
    }
    let el = document.createElement('span');
    el.innerHTML = this.searchText ? (arr ? arr.join('').toString() : options.text.toString()) : options.text.toString()
    container.append(el);
  }
  
  //---------------------------------------------------------//
  //    Abrir una aplicacion desde otra con parámetros       //
  prmUsrAplBarReg: clsBarraRegistro;
  public abrirApl(compoApl: any, accion: any) {
    // if (compoApl.APLICACION === "GES-001" && accion === "nueva_actividad") {

    // }
    const listaTab = this.tabService.tabs.find(c => c.aplicacion === compoApl.ID_APLICACION && c.title === compoApl.title);
    const compo: any = tabs.find(c => c.aplicacion === compoApl.ID_APLICACION);

    if (listaTab === undefined) {
      // Adicione a la lista de aplicaciones abiertas
      GlobalVariables.listaAplicaciones.unshift({ aplicacion: compoApl.ID_APLICACION, barra: undefined, statusEdicion: '' });

      // Crea pestaña contenedora de la aplicación
      this.tabService.addTab(
        new Tab(compo.component,
          compoApl.title,
          { parent: "PrincipalComponent" },
          compoApl.ID_APLICACION,
          compoApl.icon,
          compoApl.TABLA,
          true));

    } else { // Si existe, activa Tab
      const indexTab = this.tabService.tabs.findIndex(c => c.aplicacion === compoApl.ID_APLICACION);
      this.tabService.activaTab(indexTab);
    }

    if (accion === 'consulta') {
      // Envia evento de búsqueda
      setTimeout(() => {
        this.prmUsrAplBarReg = {
          tabla: compoApl.TABLA,
          aplicacion: compoApl.ID_APLICACION,
          usuario: compoApl.user,
          accion: compoApl.accion ? compoApl.accion : 'r_buscar_ejec',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { filtro_arg: compoApl.FILTRO },
        };
        this._sbarreg.setObsRegApl(this.prmUsrAplBarReg);
      }, 600);
    }

  }

  possible: any = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  public makeRandom(lengthOfCode: number) {
    let text = "";
    for (let i = 0; i < lengthOfCode; i++) {
      text += this.possible.charAt(Math.floor(Math.random() * this.possible.length));
    }
    return text;
  }

}