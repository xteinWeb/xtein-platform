import { FormControl, FormGroup } from '@angular/forms';

/**
 * Typed FormGroup representation of FIN-221 header form.
 */
export type Fin221HeaderForm = FormGroup<{
  ID_PLAN: FormControl<string>;
  ESTADO: FormControl<string>;
  DESCRIPCION: FormControl<string>;
  TIPO_FRECUENCIA: FormControl<'Constante' | 'Variable'>;
  FRECUENCIA: FormControl<number>;
  DIAS_PRIMERA_CUOTA: FormControl<number>;
  FINANCIAR_GRAV: FormControl<string>;
  NUMERO_PAGOS: FormControl<number>;
}>;
