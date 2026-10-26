import type { XteinGridColumn } from '@xtein/ui';
import type { XteinValidationRule } from '@xtein/ui';
import { Ven213Lookup } from './ven-213-business.model';
export type Ven213SelectionColumn = Omit<XteinGridColumn<Ven213Lookup, number>, 'validationRules'> & {
  editable?: boolean;
  templateGroup?: string | string[];
  validationRules?: string | XteinValidationRule[];
  msgError?: string;
};
