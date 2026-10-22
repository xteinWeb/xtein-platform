import type { XteinGridColumn } from '@xtein/ui';
import type { XteinValidationRule } from '@xtein/ui';
import { Ven210Lookup } from './ven-210-business.model';
export type Ven210SelectionColumn = Omit<XteinGridColumn<Ven210Lookup, number>, 'validationRules'> & {
  editable?: boolean;
  templateGroup?: string | string[];
  validationRules?: string | XteinValidationRule[];
  msgError?: string;
};
