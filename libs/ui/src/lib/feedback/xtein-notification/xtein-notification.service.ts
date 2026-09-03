import {
  Injectable
} from '@angular/core';

import notify from 'devextreme/ui/notify';

import type {
  ToastType
} from 'devextreme/ui/toast';


/**
 * Defines the standard display duration of XTEIN notifications.
 */
const XteinNotificationDisplayTime = {

  Success:
    3000,

  Info:
    3500,

  Warning:
    4500,

  Error:
    5500

} as const;


/**
 * Provides consistent non-blocking notifications across
 * the XTEIN platform and all microfrontends.
 *
 * Applications only define the semantic notification type
 * and the message.
 *
 * Position, stacking, icons, colors, dimensions and responsive
 * behavior are controlled by the shared XTEIN UI layer.
 */
@Injectable({
  providedIn:
    'root'
})
export class XteinNotificationService {

  /**
   * Displays a successful-operation notification.
   *
   * @param message User-facing message.
   */
  success(
    message:
      string
  ): void {

    this.show(
      message,
      'success',
      XteinNotificationDisplayTime.Success
    );
  }


  /**
   * Displays an informational notification.
   *
   * @param message User-facing message.
   */
  info(
    message:
      string
  ): void {

    this.show(
      message,
      'info',
      XteinNotificationDisplayTime.Info
    );
  }


  /**
   * Displays a validation or warning notification.
   *
   * @param message User-facing message.
   */
  warning(
    message:
      string
  ): void {

    this.show(
      message,
      'warning',
      XteinNotificationDisplayTime.Warning
    );
  }


  /**
   * Displays an error notification.
   *
   * @param message User-facing message.
   */
  error(
    message:
      string
  ): void {

    this.show(
      message,
      'error',
      XteinNotificationDisplayTime.Error
    );
  }


  /**
   * Displays one XTEIN toast notification.
   *
   * The toast is positioned at the upper-right side of the
   * workspace. Shared styles align the notification with the
   * workspace tab bar and adapt the vertical offset on mobile.
   *
   * @param message User-facing message.
   * @param type Semantic notification type.
   * @param displayTime Display duration in milliseconds.
   */
  private show(
    message:
      string,

    type:
      ToastType,

    displayTime:
      number
  ): void {

    const normalizedMessage =
      message
        ?.trim();


    if (
      !normalizedMessage
    ) {

      return;
    }


    notify(
      {
        message:
          normalizedMessage,

        type,

        displayTime,

        closeOnClick:
          true,

        closeOnSwipe:
          true,

        hideOnOutsideClick:
          false,

        shading:
          false,

        position:
          'top right'
      },
      {
        position:
          'top right',

        direction:
          'down-push'
      }
    );
  }
}