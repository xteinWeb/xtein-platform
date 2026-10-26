import { Injectable } from '@angular/core';
import type { XteinGridColumn } from '@xtein/ui';
import { Ven210Lookup } from '../models/ven-210-business.model';
import { Ven210SelectionColumn } from '../models/ven-210-selection.model';
import { compileValidation } from '../utils/ven-210-validation-expression';

@Injectable()
export class Ven210SelectionService {
  columns(config: string | undefined): XteinGridColumn<Ven210Lookup, number>[] {
    const values: Ven210SelectionColumn[] = config ? JSON.parse(config) : [];
    if (!Array.isArray(values)) throw new Error('La configuración de columnas no es válida.');
    return values.map(column => {
      const {editable, templateGroup, validationRules, msgError, ...options} = column;
      const result: XteinGridColumn<Ven210Lookup, number> = {...options, visible: column['visible'] !== false, allowEditing: !!editable};
      if (typeof validationRules === 'string' && validationRules.trim()) {
        const validate = compileValidation(validationRules);
        result.validationRules = [{type:'custom', reevaluate:true, ignoreEmptyValue:false,
          message:msgError || 'El valor no cumple la validación configurada.', validationCallback:event=>{
            try { return validate(event); } catch { return false; }
          }}];
      } else if (Array.isArray(validationRules)) result.validationRules = validationRules;
      if (templateGroup || column['groupIndex'] != null) result.groupCellTemplate = 'xteinGroup';
      return result;
    });
  }
  validateRows(config: string | undefined, rows: Ven210Lookup[]): void {
    const columns: Ven210SelectionColumn[] = config ? JSON.parse(config) : [];
    for (const column of columns) {
      const dataField = column['dataField'];
      if (!dataField || typeof column.validationRules !== 'string' || !column.validationRules.trim()) continue;
      const validate = compileValidation(column.validationRules);
      for (const data of rows) {
        if (!validate({value: data[dataField], data, column})) {
          throw new Error(column.msgError || 'El valor no cumple la validación configurada.');
        }
      }
    }
  }
  groupFields(config: string | undefined, field: string): string[] {
    const columns: Ven210SelectionColumn[] = config ? JSON.parse(config) : [];
    const template = columns.find(column=>column['dataField']===field)?.templateGroup;
    if (Array.isArray(template)) return template;
    if (!template) return [field];
    try { const fields = JSON.parse(template.replace(/'/g,'"')); return Array.isArray(fields)?fields:[field]; }
    catch { return [template]; }
  }
}
