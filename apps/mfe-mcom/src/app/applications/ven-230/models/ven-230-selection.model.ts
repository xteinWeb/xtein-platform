import type { Column } from 'devextreme/ui/data_grid';
import type { ValidationRule } from 'devextreme/common';
import { Ven230Lookup } from './ven-230-business.model';
export type Ven230SelectionColumn = Omit<Column<Ven230Lookup, number>, 'validationRules'> & {
  editable?: boolean;
  templateGroup?: string | string[];
  validationRules?: string | ValidationRule[];
  msgError?: string;
};
