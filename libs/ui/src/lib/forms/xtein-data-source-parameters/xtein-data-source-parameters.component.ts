import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';

import {
  FormControl,
  FormRecord,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Subscription,
  finalize
} from 'rxjs';

import {
  XteinInputComponent
} from '../xtein-input/xtein-input.component';

import {
  XteinPasswordComponent
} from '../xtein-password/xtein-password.component';

import {
  XteinNumberComponent
} from '../xtein-number/xtein-number.component';

import {
  XteinSelectComponent
} from '../xtein-select/xtein-select.component';

import {
  XteinButtonComponent
} from '../xtein-button/xtein-button.component';

import {
  ConnectionField
} from './models/connection-field.model';

import {
  ConnectionFieldsService
} from './services/connection-fields.service';


/**
 * Represents the result of a data source connection test.
 */
export interface DataSourceConnectionTestResult {

  /**
   * Indicates whether the connection was established successfully.
   */
  success: boolean;

  /**
   * Message returned by the backend.
   */
  message: string;
}


/**
 * Provides the dynamic XTEIN data source parameter editor.
 *
 * Parameter definitions are obtained from the existing XTEIN backend
 * and rendered exclusively through reusable XTEIN UI controls.
 */
@Component({
  selector: 'xtein-data-source-parameters',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    XteinInputComponent,
    XteinPasswordComponent,
    XteinNumberComponent,
    XteinSelectComponent,
    XteinButtonComponent
  ],

  templateUrl:
    './xtein-data-source-parameters.component.html',

  styleUrl:
    './xtein-data-source-parameters.component.scss'
})
export class XteinDataSourceParametersComponent
  implements OnInit, OnChanges, OnDestroy {

  /**
   * Current data source identifier.
   */
  @Input()
  origin = '';

  /**
   * Serialized connection parameters.
   */
  @Input()
  value = '';

  /**
   * Determines whether the parameter controls are read-only.
   *
   * The public input remains "readonly" to preserve the existing
   * component contract while using readOnly internally.
   */
  @Input('readonly')
  readOnly = false;

  /**
   * Number of columns used to display the parameter fields.
   */
  @Input()
  colCount = 2;

  /**
   * Emits the serialized connection parameters.
   */
  @Output()
  readonly valueChange =
    new EventEmitter<string>();

  /**
   * Emits the loading state while testing a connection.
   */
  @Output()
  readonly loadingChange =
    new EventEmitter<boolean>();

  /**
   * Emits the result of a connection test.
   */
  @Output()
  readonly connectionTest =
    new EventEmitter<DataSourceConnectionTestResult>();

  /**
   * Dynamic Angular form containing the connection parameters.
   *
   * FormRecord is used because the field names are provided
   * dynamically by the backend.
   */
  form =
    new FormRecord<
      FormControl<any>
    >({});

  /**
   * Parameter definitions associated with the current origin.
   */
  fields:
    ConnectionField[] = [];

  /**
   * Indicates whether a connection test is currently running.
   */
  testingConnection =
    false;

  /**
   * Current validation state.
   */
  private valid =
    true;

  /**
   * Prevents value emission while values received from the parent
   * component are being applied to the dynamic form.
   */
  private updatingFromParent =
    false;

  /**
   * Indicates whether the parameter configuration has already
   * been obtained from the backend.
   */
  private configurationLoaded =
    false;

  /**
   * Subscription associated with dynamic form changes.
   */
  private valueSubscription?:
    Subscription;

  /**
   * Existing backend service identifier.
   */
  private readonly serviceId =
    'data-source-parameters';

  constructor(
    private readonly connectionFieldsService:
      ConnectionFieldsService
  ) {
  }


  /**
   * Loads the available connection parameter definitions.
   */
  ngOnInit(): void {

    this.connectionFieldsService
      .getParameter(
        this.serviceId
      )
      .subscribe({

        next: () => {

          this.configurationLoaded =
            true;

          this.loadFields();
        },

        error: error => {

          console.error(
            'Unable to load data source parameter configuration.',
            error
          );

          this.configurationLoaded =
            false;

          this.fields = [];

          this.resetForm();
        }

      });
  }


  /**
   * Handles changes received from the parent component.
   *
   * @param changes Angular input changes.
   */
  ngOnChanges(
    changes: SimpleChanges
  ): void {

    if (
      changes['origin'] &&
      this.configurationLoaded
    ) {

      this.loadFields();
    }

    if (
      changes['value'] &&
      !changes['value'].firstChange
    ) {

      this.applyParentValue();
    }

    if (
      changes['readOnly']
    ) {

      this.updateReadonlyState();
    }
  }


  /**
   * Releases subscriptions created by the component.
   */
  ngOnDestroy(): void {

    this.valueSubscription
      ?.unsubscribe();
  }


  /**
   * Returns the FormControl associated with a connection field.
   *
   * @param fieldName Connection field name.
   * @returns Dynamic Angular FormControl.
   */
  getFieldControl(
    fieldName: string
  ): FormControl<any> {

    return this.form.controls[
      fieldName
    ];
  }


  /**
   * Validates all current connection parameter controls.
   *
   * @returns True when the form is valid.
   */
  validate(): boolean {

    this.form
      .markAllAsTouched();

    this.form
      .updateValueAndValidity();

    this.valid =
      this.form.valid;

    return this.valid;
  }


  /**
   * Returns validation messages associated with the current fields.
   *
   * @returns User-facing validation messages.
   */
  getValidationErrors():
    string[] {

    const errors:
      string[] = [];

    this.fields
      .forEach(field => {

        const control =
          this.form.controls[
            field.name
          ];

        if (
          !control ||
          !control.invalid
        ) {
          return;
        }

        if (
          control.errors?.['required']
        ) {

          errors.push(
            `${field.label} es requerido`
          );
        }
      });

    return errors;
  }


  /**
   * Returns the current form validation state.
   *
   * @returns True when the form is valid.
   */
  isValidForm(): boolean {

    return this.valid;
  }


  /**
   * Determines whether the connection test button must be displayed.
   *
   * @returns True when the selected source represents a database.
   */
  showTestConnectionButton():
    boolean {

    return (
      this.fields.length > 0 &&
      this.fields[0].sourcetype ===
        'DataBase'
    );
  }


  /**
   * Tests the connection using the current parameter values.
   */
  testConnection(): void {

    if (
      this.fields.length === 0 ||
      this.testingConnection
    ) {
      return;
    }

    if (
      !this.validate()
    ) {

      this.connectionTest
        .emit({
          success:
            false,

          message:
            'Complete los parámetros obligatorios antes de probar la conexión.'
        });

      return;
    }

    this.testingConnection =
      true;

    this.loadingChange
      .emit(
        true
      );

    const parameters =
      this.form
        .getRawValue();

    const request = {

      parametros:
        parameters,

      tipoOrigen:
        this.fields[0].source
    };

    this.connectionFieldsService
      .testConnection(
        request,
        this.serviceId
      )
      .pipe(
        finalize(() => {

          this.testingConnection =
            false;

          this.loadingChange
            .emit(
              false
            );
        })
      )
      .subscribe({

        next: response => {

          try {

            const result =
              typeof response.data ===
                'string'
                ? JSON.parse(
                    response.data
                  )
                : response.data;

            const success =
              Boolean(
                result?.success
              );

            const message =
              result?.message ??
              (
                success
                  ? 'Conexión exitosa.'
                  : 'No fue posible establecer la conexión.'
              );

            this.connectionTest
              .emit({
                success,
                message
              });

          } catch (error) {

            console.error(
              'Unable to parse the connection test response.',
              error
            );

            this.connectionTest
              .emit({
                success:
                  false,

                message:
                  'La respuesta de la prueba de conexión no es válida.'
              });
          }
        },

        error: error => {

          console.error(
            'Unable to test the data source connection.',
            error
          );

          this.connectionTest
            .emit({
              success:
                false,

              message:
                'Error al probar la conexión. Verifique los parámetros.'
            });
        }

      });
  }


  /**
   * Creates the dynamic controls associated with the selected origin.
   */
  private loadFields(): void {

    this.valueSubscription
      ?.unsubscribe();

    if (
      !this.origin
    ) {

      this.fields = [];

      this.resetForm();

      return;
    }

    this.fields =
      this.connectionFieldsService
        .getFields(
          this.origin
        );

    const controls:
      Record<
        string,
        FormControl<any>
      > = {};

    this.fields
      .forEach(field => {

        const validators =
          field.required
            ? [
                Validators.required
              ]
            : [];

        /*
         * Nullish coalescing is intentional.
         *
         * Valid values such as 0 and false must be preserved.
         */
        const defaultValue =
          field.defaultValue ??
          null;

        controls[
          field.name
        ] =
          new FormControl<any>(
            {
              value:
                defaultValue,

              disabled:
                this.readOnly
            },
            {
              validators
            }
          );
      });

    this.form =
      new FormRecord<
        FormControl<any>
      >(
        controls
      );

    this.applyParentValue();

    this.valueSubscription =
      this.form
        .valueChanges
        .subscribe(() => {

          if (
            !this.updatingFromParent &&
            !this.readOnly
          ) {

            this.emitCurrentValue();
          }

          this.updateValidationState();
        });

    this.updateValidationState();
  }


  /**
   * Applies the serialized parameter value received from the parent.
   */
  private applyParentValue(): void {

    if (
      !this.value ||
      Object.keys(
        this.form.controls
      ).length === 0
    ) {
      return;
    }

    try {

      this.updatingFromParent =
        true;

      const parsedValue:
        unknown =
          JSON.parse(
            this.value
          );

      if (
        parsedValue ===
          null ||
        typeof parsedValue !==
          'object' ||
        Array.isArray(
          parsedValue
        )
      ) {
        return;
      }

      const parameterValues =
        parsedValue as
          Record<
            string,
            unknown
          >;

      Object.entries(
        parameterValues
      )
        .forEach(
          (
            [
              fieldName,
              fieldValue
            ]
          ) => {

            const control =
              this.form.controls[
                fieldName
              ];

            if (
              !control
            ) {
              return;
            }

            control.setValue(
              fieldValue,
              {
                emitEvent:
                  false
              }
            );
          }
        );

      this.updateValidationState();

    } catch (error) {

      console.error(
        'Unable to parse the data source parameter value.',
        error
      );

    } finally {

      this.updatingFromParent =
        false;
    }
  }


  /**
   * Synchronizes the read-only state with all dynamic controls.
   */
  private updateReadonlyState():
    void {

    Object.keys(
      this.form.controls
    )
      .forEach(
        fieldName => {

          const control =
            this.form.controls[
              fieldName
            ];

          if (
            this.readOnly
          ) {

            control.disable({
              emitEvent:
                false
            });

            return;
          }

          control.enable({
            emitEvent:
              false
          });
        }
      );
  }


  /**
   * Serializes and emits the current connection parameter values.
   */
  private emitCurrentValue():
    void {

    const serializedValue =
      JSON.stringify(
        this.form
          .getRawValue()
      );

    this.valueChange
      .emit(
        serializedValue
      );
  }


  /**
   * Updates the current validation state.
   */
  private updateValidationState():
    void {

    this.valid =
      this.form.valid;
  }


  /**
   * Resets the dynamic parameter form.
   */
  private resetForm(): void {

    this.valueSubscription
      ?.unsubscribe();

    this.form =
      new FormRecord<
        FormControl<any>
      >({});

    this.valid =
      true;
  }
}