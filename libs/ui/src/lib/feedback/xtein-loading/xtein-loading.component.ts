import {
  Component,
  Input
} from '@angular/core';

import {
  DxLoadPanelModule
} from 'devextreme-angular/ui/load-panel';


/**
 * Standard XTEIN loading overlay.
 *
 * DevExtreme is encapsulated inside this component so consuming
 * applications do not depend directly on dx-load-panel.
 */
@Component({
  selector: 'xtein-loading',

  standalone: true,

  imports: [
    DxLoadPanelModule
  ],

  templateUrl:
    './xtein-loading.component.html',

  styleUrl:
    './xtein-loading.component.scss'
})
export class XteinLoadingComponent {

  /**
   * Determines whether the loading overlay is visible.
   */
  @Input()
  visible = false;

  /**
   * Message displayed while the operation is running.
   */
  @Input()
  message = 'Procesando...';

  /**
   * Determines whether the pane behind the indicator is visible.
   */
  @Input()
  showPane = true;

  /**
   * Determines whether the loading indicator is visible.
   */
  @Input()
  showIndicator = true;

  /**
   * Determines whether user interaction behind the overlay
   * is visually shaded.
   */
  @Input()
  shading = true;

  /**
   * Opacity applied to the shading layer.
   */
  @Input()
  shadingOpacity = 0.18;

  /**
   * Determines whether the loading overlay can be hidden
   * by clicking outside of it.
   */
  @Input()
  hideOnOutsideClick = false;
}