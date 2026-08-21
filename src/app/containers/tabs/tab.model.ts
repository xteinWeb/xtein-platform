import { Type } from '@angular/core';

export class Tab {
  public id: number;
  public title: string;
  public tabData: any;
  public active: boolean;
  public aplicacion: string;
  public tabla: string;
  public icon: string;
  public component: Type<any>;

  constructor(component: Type<any>, title: string, tabData: any, 
              aplicacion: any, icon: string, tabla: any, active: boolean) {
    this.component = component;
    this.title = title;
    this.tabData = tabData;
    this.aplicacion = aplicacion;
    this.icon = icon;
    this.tabla = tabla;
    this.active = active;
  }
}
