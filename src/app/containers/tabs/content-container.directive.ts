import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
    selector: "[content-container]",
    standalone: false
})
export class ContentContainerDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
