import type { Column, SelectionChangedEvent, EditingStartEvent, RowClickEvent } from 'devextreme/ui/data_grid';
import type { ValidationRule } from 'devextreme/common';
export type XteinGridColumn<T = unknown, K = unknown> = Column<T, K>;
export type XteinGridSelectionEvent<T = unknown, K = unknown> = SelectionChangedEvent<T, K>;
export type XteinGridEditingEvent<T = unknown, K = unknown> = EditingStartEvent<T, K>;
export type XteinGridRowEvent<T = unknown, K = unknown> = RowClickEvent<T, K>;
export type XteinValidationRule = ValidationRule;
