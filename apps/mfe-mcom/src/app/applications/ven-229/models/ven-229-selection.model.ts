import type { XteinGridColumn, XteinValidationRule } from '@xtein/ui';
import { Ven229Lookup } from './ven-229-business.model';

export type Ven229SelectionColumn = Omit<XteinGridColumn<Ven229Lookup, number>, 'validationRules'> & {
  editable?: boolean;
  templateGroup?: string | string[];
  validationRules?: string | XteinValidationRule[];
  msgError?: string;
};
