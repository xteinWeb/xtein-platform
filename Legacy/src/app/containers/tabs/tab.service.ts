import { Injectable } from "@angular/core";
import { Tab } from "./tab.model";
import { BehaviorSubject } from "rxjs";

@Injectable()
export class TabService {
  public tabs: Tab[] = [];

  public tabSub = new BehaviorSubject<Tab[]>(this.tabs);

  // Cierra una aplicación
  public removeTab(index: number) {
    this.tabs.splice(index, 1);
    if (this.tabs.length > 0) {
      this.tabs[this.tabs.length - 1].active = true;
    }
    this.tabSub.next(this.tabs);
  }

  // Abre una nueva aplicacion -- no cargada
  public addTab(tab: Tab) {
    for (let i = 0; i < this.tabs.length; i++) {
      if (this.tabs[i].active === true) {
        this.tabs[i].active = false;
      }
    }
    if (this.tabs.length !== 0){
      if ( this.tabs.findIndex(t => t.aplicacion === tab.aplicacion && t.title === tab.title) !== -1 ){
        const npos = this.tabs.findIndex(t => t.aplicacion === tab.aplicacion);
        this.tabs[npos].active = true;
        return;
      }
    }
    tab.id = this.tabs.length + 1;
    tab.active = true;
    this.tabs.unshift(tab);
    this.tabSub.next(this.tabs);
  }

  // Activa una aplicación
  public activaTab(index: number, args = undefined) {
    for (let i = 0; i < this.tabs.length; i++) {
      if (this.tabs[i].active === true) {
        this.tabs[i].active = false;
      }
    }
    this.tabs[index].active = true;

    // Si lleva como argumento la aplicacion que pertenece a un solo arbol padre
    if (args !== undefined) this.tabs[index].tabData.args = args;

    // Activa tab aplicacion
    this.tabSub.next(this.tabs);
  }

}
