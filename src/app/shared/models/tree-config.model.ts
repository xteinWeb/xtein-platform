// src/app/shared/models/tree-config.model.ts
export interface TreeConfig {
  // Campos obligatorios
  dataSource: any[];
  displayExpr: string;
  keyExpr: string;
  
  // Campos opcionales
  childrenExpr?: string;
  parentIdExpr?: string;
  descriptionExpr?: string;
  iconExpr?: string;
  badgeExpr?: string;
  searchExpr?: string | string[];
  
  // Comportamiento
  dataStructure?: 'tree' | 'flat';
  searchEnabled?: boolean;
  searchMode?: 'contains' | 'startswith';
  showCheckBoxes?: boolean;
  selectionMode?: 'single' | 'multiple' | 'all';
  autoExpandFirst?: boolean;
}