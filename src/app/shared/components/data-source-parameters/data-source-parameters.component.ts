import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { DxFormModule, DxFormComponent } from 'devextreme-angular';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { ConnectionFieldsService } from '../../services/connection-fields.service';
import { ConnectionField } from '../../models/connection-field.model';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { DxButtonModule } from 'devextreme-angular/ui/button';

@Component({
  selector: 'app-data-source-parameters',
  templateUrl: './data-source-parameters.component.html',
  styleUrls: ['./data-source-parameters.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DxFormModule,
    DxTextBoxModule,
    DxNumberBoxModule,
    DxSelectBoxModule,
    DxButtonModule
  ]
})
export class DataSourceParametersComponent implements OnChanges, AfterViewInit, OnDestroy {

  @Input()
  origin: string = '';

  @Input()
  value: string = '';

  @Output()
  valueChange = new EventEmitter<string>();

  @Output() 
  loadingChange = new EventEmitter<boolean>();

  @Input()
  readonly: boolean = false;

  @Input()
  colCount: number = 2;

  @ViewChild(DxFormComponent) dxForm!: DxFormComponent;

  form!: FormGroup;
  fields: ConnectionField[] = [];
  formData: any = {};
  private valueSubscription?: Subscription;
  private isViewInitialized: boolean = false;
  private isUpdatingFromParent: boolean = false;
  private isValid: boolean = true;
  private idService: string = 'data-source-parameters';
  private loadingFields: boolean  = false;
  testingConnection = false;

  constructor(
    private fb: FormBuilder,
    private service: ConnectionFieldsService,
    private cdr: ChangeDetectorRef
  ) { }
  
  ngOnInit(): void {
    this.service.getParameter(this.idService)
      .subscribe({
        error: err => console.error(err)
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['origin']) {
      this.loadFields();
    }

    if (changes['value'] && !changes['value'].firstChange) {
      this.updateFormValueFromParent();
    }

    if (changes['readonly']) {
      this.updateReadonlyState();
    }
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    this.updateReadonlyState();
    this.cdr.detectChanges();
  }

  private loadFields(): void {
    this.loadingFields = true;
    this.fields = this.service.getFields(this.origin);

    const group: any = {};
    this.formData = {};

    this.fields.forEach(field => {
      const validators = field.required ? [Validators.required] : [];
      const defaultValue = field.defaultValue || null;
      
      group[field.name] = [defaultValue, validators];
      this.formData[field.name] = defaultValue;
    });

    this.form = this.fb.group(group);
    this.updateFormValueFromParent();
    this.updateReadonlyState();

    this.valueSubscription?.unsubscribe();
    this.valueSubscription = this.form.valueChanges.subscribe(values => {
      if (!this.readonly && 
          !this.isUpdatingFromParent &&
          !this.loadingFields
        ) {
        this.emitValue(values);
      }
      this.updateValidationState();
    });

    this.cdr.detectChanges();
    this.loadingFields = false;
  }

  private updateFormValueFromParent(): void {
    if (!this.value || !this.form) return;

    try {
      this.isUpdatingFromParent = true;
      const parsedValue = JSON.parse(this.value);
      
      Object.keys(parsedValue).forEach(key => {
        if (this.formData.hasOwnProperty(key)) {
          this.formData[key] = parsedValue[key];
        }
      });

      this.form.patchValue(parsedValue, { emitEvent: false });
      
    } catch (error) {
      console.error('Error al parsear el valor JSON:', error);
    } finally {
      this.isUpdatingFromParent = false;
    }
  }

  private updateReadonlyState(): void {
    if (!this.form) return;

    if (this.dxForm && this.isViewInitialized) {
      this.dxForm.readOnly = this.readonly;
    }

    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (this.readonly) {
        control?.disable({ emitEvent: false });
      } else {
        control?.enable({ emitEvent: false });
      }
    });

    this.cdr.detectChanges();
  }

  private emitValue(values: any): void {
    if (!this.readonly) {
      const jsonString = JSON.stringify(values);
      this.valueChange.emit(jsonString);
    }
  }

  private updateValidationState(): void {
    if (this.form) {
      this.isValid = this.form.valid;
    }
  }

  /**
 * Valida el formulario usando el dx-form.
 * Solo valida los campos que están visibles según el origen seleccionado.
 */
  validate(): boolean {
    // Si no hay formulario, consideramos que es válido
    if (!this.form) return true;

    // Verificar que el dx-form esté disponible
    if (this.dxForm && this.isViewInitialized) {
      try {
        const dxFormInstance = this.dxForm.instance;
        
        /**
         * Forzar validación de todos los editores del dx-form.
         * Esto asegura que las reglas de validación se ejecuten.
         */
        try {
          const editors = dxFormInstance.getEditor('*');
          if (editors && Array.isArray(editors)) {
            editors.forEach((editor: any) => {
              if (editor && typeof editor.validate === 'function') {
                editor.validate();
              }
            });
          }
        } catch (e) {
          // Si getEditor falla, continuar con la validación normal
          console.warn('Error al validar editores individuales:', e);
        }

        /**
         * Validar el formulario completo.
         * Obtiene todas las reglas de validación definidas en dxi-validation-rule
         */
        const result = dxFormInstance.validate();
        
        /**
         * Determinar si el formulario es válido.
         * Si result.isValid es booleano, usarlo; de lo contrario, usar el estado del FormGroup.
         * Esto es un fallback por si result.isValid viene como undefined.
         */
        this.isValid = (result && typeof result.isValid === 'boolean') 
          ? result.isValid 
          : this.form.valid;
        
        /**
         * Si el formulario no es válido, marcar los campos como touched
         * para que los mensajes de error sean visibles.
         */
        if (!this.isValid) {
          
          /**
           * Primero, marcar todos los campos del FormGroup como touched.
           * Esto asegura que los mensajes de error aparezcan en todos los campos.
           */
          Object.keys(this.form.controls).forEach(key => {
            const control = this.form.get(key);
            control?.markAsTouched();
          });

          /**
           * Luego, revisar si el dx-form devolvió reglas rotas (brokenRules).
           * Si las hay, sincronizar los errores con el FormGroup.
           * Solo se procesan los campos que están en la lista 'fields' (visibles).
           */
          if (result && result.brokenRules && result.brokenRules.length > 0) {
            // Primero, limpiar errores existentes del FormGroup para evitar falsos positivos
            this.clearFormGroupErrors();
            
            result.brokenRules.forEach((rule: any) => {
              const fieldName = rule.rule?.dataField;
              
              /**
               * Verificar que el campo exista en la lista de fields visibles.
               * Si no está en fields, significa que no debería ser visible y no lo validamos.
               */
              const fieldExists = this.fields.some(f => f.name === fieldName);
              
              if (fieldName && fieldExists && this.form) {
                const control = this.form.get(fieldName);
                if (control) {
                  // Marcar como touched para mostrar error visualmente
                  control.markAsTouched();
                  
                  // Obtener el valor actual del campo
                  const currentValue = control.value;
                  
                  // Verificar si el campo realmente está vacío o inválido
                  const isEmpty = currentValue === null || 
                                currentValue === undefined || 
                                currentValue === '' || 
                                (Array.isArray(currentValue) && currentValue.length === 0);
                  
                  // Solo establecer el error si el campo está vacío
                  if (isEmpty) {
                    // Usar el tipo de error que reporta el dx-form
                    const errorType = rule.rule?.type || 'required';
                    control.setErrors({ [errorType]: true });
                  } else {
                    // Si el campo tiene valor, limpiar cualquier error previo
                    control.setErrors(null);
                  }
                }
              }
            });
          }
          
          /**
           * Verificación adicional: Validar nuevamente el FormGroup
           * para asegurar que los errores estén sincronizados correctamente
           */
          this.form.updateValueAndValidity();
          
          // Recalcular isValid basado en el estado actual del FormGroup
          this.isValid = this.form.valid;
        }
        
        return this.isValid;
      } catch (error) {
        console.warn('Error al validar dx-form:', error);
        // Fallback a FormGroup
        Object.keys(this.form.controls).forEach(key => {
          const control = this.form.get(key);
          control?.markAsTouched();
        });
        this.isValid = this.form.valid;
        return this.isValid;
      }
    }

    /**
     * FALLBACK: Si el dx-form no está disponible, usar el FormGroup.
     * Esto solo ocurre en casos excepcionales.
     */
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
    this.isValid = this.form.valid;
    return this.isValid;
  }

  /**
   * Limpia los errores del FormGroup
   * Útil para evitar falsos positivos en validaciones
   */
  private clearFormGroupErrors(): void {
    if (!this.form) return;
    
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control) {
        // Solo limpiar si no tiene errores de validadores internos
        if (control.errors) {
          const currentErrors = control.errors;
          // Mantener errores que no sean de 'required' (ej: pattern, email, etc.)
          if (Object.keys(currentErrors).length === 1 && currentErrors['required']) {
            control.setErrors(null);
          }
        }
      }
    });
  }

  /**
   * Obtiene los mensajes de error del formulario.
   * Solo devuelve errores de los campos que están visibles.
   */
  getValidationErrors(): string[] {
    const errors: string[] = [];

    /**
     * Primero, intentar obtener errores del dx-form.
     * El dx-form tiene las reglas de validación definidas en dxi-validation-rule.
     */
    if (this.dxForm && this.isViewInitialized) {
      try {
        const dxFormInstance = this.dxForm.instance;
        const result = dxFormInstance.validate();
        
        /**
         * Procesar las reglas rotas (brokenRules) del dx-form.
         * Solo se incluyen los errores de campos que existen en la lista 'fields' (visibles).
         */
        if (result && result.brokenRules && result.brokenRules.length > 0) {
          result.brokenRules.forEach((rule: any) => {
            // Verificar que el campo esté en la lista de fields visibles
            const fieldExists = this.fields.some(f => f.name === rule.rule?.dataField);
            
            if (rule.message && fieldExists) {
              const field = this.fields.find(f => f.name === rule.rule?.dataField);
              const fieldName = field?.label || rule.rule?.dataField || 'Campo';
              errors.push(`${fieldName}: ${rule.message}`);
            }
          });
        }
      } catch (error) {
        console.warn('Error al obtener errores del dx-form:', error);
      }
    }

    /**
     * FALLBACK: Si no hay errores del dx-form, usar el FormGroup.
     * Esto solo ocurre si el dx-form no devolvió errores o no está disponible.
     */
    if (errors.length === 0 && this.form) {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        
        /**
         * Verificar que el campo esté en la lista de fields visibles.
         * Solo validamos campos que existen en la configuración actual.
         */
        const fieldExists = this.fields.some(f => f.name === key);
        
        if (fieldExists && control?.invalid && control.touched) {
          const field = this.fields.find(f => f.name === key);
          const fieldName = field?.label || key;
          
          // Verificar cada tipo de error posible
          if (control.errors?.['required']) {
            errors.push(`${fieldName} es requerido`);
          }
          if (control.errors?.['email']) {
            errors.push(`${fieldName} debe ser un email válido`);
          }
          if (control.errors?.['minlength']) {
            errors.push(`${fieldName} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`);
          }
          if (control.errors?.['maxlength']) {
            errors.push(`${fieldName} no puede tener más de ${control.errors['maxlength'].requiredLength} caracteres`);
          }
        }
      });
    }

    return errors;
  }

  isValidForm(): boolean {
    return this.isValid;
  }

  ngOnDestroy(): void {
    this.valueSubscription?.unsubscribe();
  }

  onFieldDataChanged(e: any): void {
    if (!this.readonly && 
        !this.isUpdatingFromParent && 
        !this.loadingFields
       ) {
      this.emitValue(this.formData);      
      this.updateValidationState();
    }
  }

  getEditorType(field: ConnectionField): string {
    const typeMap: { [key: string]: string } = {
      'text': 'dxTextBox',
      'password': 'dxTextBox',
      'number': 'dxNumberBox',
      'select': 'dxSelectBox'
    };
    return typeMap[field.type] || 'dxTextBox';
  }

  getEditorOptions(field: ConnectionField): any {
    const options: any = {
      placeholder: field.placeholder || '',
      searchEnabled: true,
      showClearButton: true
    };

    if (field.type === 'select') {       
       options.items = (field.items || []).map(item => item.value);
    }

    if (field.type === 'password') {
      options.mode = 'password';
    }

    if (field.type === 'number') {
      options.showSpinButtons = true;
    }

    return options;
  }

  getRequiredMessage(field: ConnectionField): string {
    return `${field.label} es requerido`;
  }

  showTestConnectionButton(): boolean {    
    return this.fields.length > 0 &&
          this.fields[0].sourcetype === 'DataBase';
  }

  // Test Database Connections
  testConnection(): void {  
    this.testingConnection = true;
    this.loadingChange.emit(true);
    this.service.testConnection({ 
        parametros: this.formData,
        tipoOrigen: this.fields[0].source
      }, this.idService)
      .subscribe({
        next: (data: any) => {          
          const res = JSON.parse(data.data);          
          if (data.token) {
            localStorage.setItem('token', data.token);
          }          
          if (res.success) {            
            this.showModal('¡Conexión exitosa!', 'Éxito');
          } else {
            this.showModal(`Error de conexión: ${res.message}`, 'Error');
          }
        },
        error: (error) => {          
          console.error('Error al probar conexión:', error);
          this.showModal('Error al probar la conexión. Verifique los parámetros.', 'Error');
        },
        complete: () => {
          this.testingConnection = false;
          this.loadingChange.emit(false);
        }
      });
  }

  showModal(mensaje: any, 
              titulo: any = '¡Error!', 
              msg_html: any = '', 
              tipo: 'error' | 'warning' | 'success' | 'default' = 'default') {
      let iconHtml = '';
      switch (tipo) {
          case 'success':
              iconHtml = "<i class='icon-check-circle success-color'></i>";
              break;
  
          case 'warning':
              iconHtml = "<i class='icon-alert-ol warning-color'></i>";
              break;
  
          case 'error':
              iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
              break;
  
          default:
              iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
              if (titulo !== '¡Error!') iconHtml = "<i class='icon-alert-ol'></i>";            
      }
      console.log(iconHtml);
      Swal.fire({
        iconHtml: iconHtml,
        confirmButtonColor: '#0F4C81',
        title: titulo,
        text: mensaje,
        allowOutsideClick: true,
        allowEscapeKey: false,
        allowEnterKey: false,
        backdrop: true,
        position: 'center',
        html: msg_html,
        stopKeydownPropagation: false,
      });
    }
}