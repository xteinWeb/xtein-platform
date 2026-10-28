import { FormControl, FormGroup } from '@angular/forms';

/**
 * Typed FormGroup representation of FIN-224 header form.
 */
export type Fin224HeaderForm = FormGroup<{
  ID_CONDICION: FormControl<string>;
  DESCRIPCION: FormControl<string>;
  TIPO: FormControl<string>;
  ID_PLAN: FormControl<string>;
  ESTADO: FormControl<string>;
}>;
