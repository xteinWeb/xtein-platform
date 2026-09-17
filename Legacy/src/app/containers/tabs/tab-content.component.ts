import { CommonModule } from "@angular/common";
import {
  Component,
  Input,
  ViewChild,
  OnInit,
  ViewContainerRef
} from "@angular/core";
import { ContentContainerDirective } from "./content-container.directive";
import { SkeletonComponent } from "./skeleton.component";
import { Tab } from "./tab.model";

@Component({
  standalone: true,
  selector: "app-tab-content",
  template: "<ng-template content-container></ng-template>",
  imports: [CommonModule],
})
export class TabContentComponent implements OnInit {
  @Input() tab;
  @ViewChild(ContentContainerDirective, { static: true })
  contentContainer: ContentContainerDirective;

  constructor(private viewContainerRef: ViewContainerRef) {}

  ngOnInit() {
    const tab: Tab = this.tab;
    const componentRef = this.viewContainerRef.createComponent(tab.component);
    if (tab.tabla === 'reporte') {
      componentRef.instance.prm_rpt = tab.tabData.args;
    }
    (componentRef.instance as SkeletonComponent).data = tab.tabData;
  }
}
