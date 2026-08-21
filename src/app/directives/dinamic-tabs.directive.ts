import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[dynamic-tabs]'
})
export class DinamicTabsDirective {

  constructor(public viewContainer: ViewContainerRef) { }

}
