import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DxDiagramComponent, DxDiagramModule } from 'devextreme-angular';

@Component({
  selector: 'app-testdiag',
  templateUrl: './testdiag.component.html',
  styleUrls: ['./testdiag.component.css',
  "../../../../../node_modules/devexpress-diagram/dist/dx-diagram.min.css",
  "../../../../../node_modules/devextreme/dist/css/dx.light.css",
  "../../../../../node_modules/devextreme/dist/css/dx.common.css"],
  standalone: true,
  imports: [CommonModule, DxDiagramModule]

})
export class TestdiagComponent {
  @ViewChild(DxDiagramComponent, { static: false }) diagram: DxDiagramComponent;

  constructor() {
    setTimeout(() => {
      this.diagram.instance.repaint();
    }, 4000);
  }

}
