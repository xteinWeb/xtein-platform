import type { XteinGridColumn } from '@xtein/ui';
import type { XteinValidationRule } from '@xtein/ui';
import { Ven230Lookup } from './ven-230-business.model';
export type Ven230SelectionColumn = Omit<XteinGridColumn<Ven230Lookup, number>, 'validationRules'> & {
  editable?: boolean;
  templateGroup?: string | string[];
  validationRules?: string | XteinValidationRule[];
  msgError?: string;
};
