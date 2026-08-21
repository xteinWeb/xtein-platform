import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnChanges, 
  SimpleChanges, 
  TemplateRef,
  OnInit,
  AfterViewInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { DxTreeViewModule } from 'devextreme-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface TreeFieldConfig {
  // Campos para la estructura del árbol
  idField: string;
  parentIdField: string;
  prefix: string;
  
  // Campos para mostrar en el árbol
  displayFields: string[];
  displaySeparator?: string;
  
  // Campos opcionales para funcionalidades extras
  iconField?: string;
  badgeField?: string;
  descriptionField?: string;
  statusField?: string;
  orderField?: string;
  
  // Configuración de búsqueda
  searchFields?: string[];
}

export interface TreeEvent {
  node: any;
  originalEvent?: any;
  component?: any;
}

export interface SelectionChangeEvent {
  selectedNodes: any[];
  allSelectedKeys: any[];
  originalEvent: any;
}

@Component({
  selector: 'app-generic-tree',
  standalone: true,
  imports: [
    DxTreeViewModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './generic-tree.component.html',
  styleUrls: ['./generic-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenericTreeComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {
  
  // ========== INPUTS PRINCIPALES ==========
  @Input() dataSource: any[] = [];
  
  // ========== CONFIGURACIÓN DEL ÁRBOL (OBLIGATORIO) ==========
  @Input() fieldConfig!: TreeFieldConfig;
  
  // ========== CONFIGURACIÓN DE COMPORTAMIENTO ==========
  @Input() showCheckBoxes = false;
  @Input() selectionMode: 'single' | 'multiple' = 'single';
  @Input() expandAllOnLoad = false;
  @Input() collapseAllOnLoad = false;
  @Input() autoExpandFirst = false;
  @Input() selectFirstNode = false;
  @Input() searchEnabled = false;
  @Input() searchMode: 'contains' | 'startswith' | 'equals' = 'contains';
  @Input() searchPlaceholder = 'Buscar...';
  @Input() showSearchBox = true;
  @Input() animationEnabled = true;
  @Input() focusStateEnabled = true;
  @Input() hoverStateEnabled = true;
  @Input() height: number | string = '100%';
  @Input() width: number | string = '100%';
  @Input() showRoot = false;
  @Input() rootLabel = 'Raíz';
  @Input() showParentPrefix = false;
  @Input() showChildPrefix = false;  
  @Input() showParentStatus = false;
  @Input() showChildStatus = false;
  @Input() showParentBadge = false;
  @Input() showChildBadge = false;
  
  // ========== FILTROS ==========
  @Input() filterByStatus?: string | string[];
  @Input() filterByText?: string;
  
  // ========== TEMPLATES PERSONALIZADOS ==========
  @Input() customItemTemplate?: TemplateRef<any>;
  @Input() customLoadingTemplate?: TemplateRef<any>;
  @Input() customEmptyTemplate?: TemplateRef<any>;
  
  // ========== CARGA BAJO DEMANDA ==========
  @Input() loadOnDemand = false;
  @Input() loadChildNodes?: (node: any) => Promise<any[]>;

  // ========== OUTPUTS (EVENTOS) ==========
  @Output() itemClick = new EventEmitter<TreeEvent>();
  @Output() itemExpand = new EventEmitter<TreeEvent>();
  @Output() itemCollapse = new EventEmitter<TreeEvent>();
  @Output() selectionChange = new EventEmitter<SelectionChangeEvent>();
  @Output() itemContextMenu = new EventEmitter<TreeEvent>();
  @Output() dataLoaded = new EventEmitter<any[]>();
  @Output() searchEvent = new EventEmitter<string>();
  @Output() statusFilterChange = new EventEmitter<string | string[]>();

  // ========== ESTADO INTERNO (PÚBLICO PARA EL TEMPLATE) ==========
  // Cambiado de private a public para acceso en el template
  public searchSubject = new Subject<string>();
  public destroy$ = new Subject<void>();
  
  // Señales públicas para el template
  public treeData = signal<any[]>([]);
  public searchText = signal<string>('');
  public loading = signal<boolean>(false);
  public selectedKeys = signal<any[]>([]);
  
  // Computed values
  public filteredData = computed(() => {
    let data = this.treeData();
    
    const searchText = this.searchText().toLowerCase().trim();
    if (searchText) {
      data = this.filterTreeData(data, searchText);
    }
    
    if (this.filterByStatus && this.filterByStatus.length > 0 && this.fieldConfig.statusField) {
      data = this.filterByStatusFn(data);
    }
    
    return data;
  });

  // ========== CONSTRUCTOR ==========
  constructor(private cdr: ChangeDetectorRef) {}

  // ========== CICLO DE VIDA ==========
  ngOnInit(): void {
    this.validateConfig();
    this.setupSearchDebounce();
    this.buildTree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataSource'] && this.dataSource) {
      this.buildTree();
    }
    
    if (changes['fieldConfig']) {
      this.validateConfig();
      this.buildTree();
    }
    
    if (changes['expandAllOnLoad'] || changes['collapseAllOnLoad']) {
      this.updateExpansionState();
    }
    
    if (changes['filterByStatus'] || changes['filterByText']) {
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit(): void {
    if (this.selectFirstNode) {
      this.selectFirstNodeFn();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  // ========== VALIDACIÓN DE CONFIGURACIÓN ==========
  private validateConfig(): void {
    if (!this.fieldConfig) {
      console.warn('GenericTree: fieldConfig es requerido');
      return;
    }
    
    if (!this.fieldConfig.idField) {
      console.warn('GenericTree: idField es requerido en fieldConfig');
    }
    
    if (!this.fieldConfig.parentIdField) {
      console.warn('GenericTree: parentIdField es requerido en fieldConfig');
    }
    
    if (!this.fieldConfig.displayFields || this.fieldConfig.displayFields.length === 0) {
      console.warn('GenericTree: displayFields es requerido en fieldConfig');
    }
  }

  // ========== CONFIGURACIÓN DE BÚSQUEDA ==========
  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchText => {
      this.searchText.set(searchText);
      this.searchEvent.emit(searchText);
      this.cdr.markForCheck();
    });
  }

  // ========== MÉTODO PRINCIPAL: CONSTRUIR ÁRBOL ==========
  private buildTree(): void {
    if (!this.dataSource || this.dataSource.length === 0) {
      this.treeData.set([]);
      this.dataLoaded.emit([]);
      return;
    }

    if (!this.fieldConfig) {
      console.error('GenericTree: fieldConfig no está definido');
      this.treeData.set([]);
      return;
    }

    this.loading.set(true);

    try {
      const treeData = this.convertToTree(this.dataSource);
      
      const sortedData = this.fieldConfig.orderField 
        ? this.sortTreeNodes(treeData) 
        : treeData;

      if (this.showRoot) {
        this.treeData.set([{
          [this.fieldConfig.idField]: 'root',
          [this.fieldConfig.displayFields[0]]: this.rootLabel,
          [this.childrenExpr]: sortedData,
          expanded: this.expandAllOnLoad,
          [this.expandedExpr]: this.expandAllOnLoad,
          isRoot: true,
          _displayText: this.rootLabel
        }]);
      } else {
        this.treeData.set(sortedData);
      }

      this.updateExpansionState();
      this.dataLoaded.emit(this.treeData());
      
    } catch (error) {
      console.error('Error building tree:', error);
      this.treeData.set([]);
    } finally {
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }

  // ========== CONVERTIR DATOS PLANOS A ÁRBOL ==========
  private convertToTree(flatData: any[]): any[] {
    const map = new Map<any, any>();
    const roots: any[] = [];
    const { idField, parentIdField, prefix, displayFields, displaySeparator, statusField } = this.fieldConfig;

    flatData.forEach(item => {
      const displayText = this.buildDisplayText(item);
      
      const node = {
        ...item,
        [this.childrenExpr]: [],
        [this.expandedExpr]: this.expandAllOnLoad,
        [this.selectedExpr]: false,
        _level: 0,
        _displayText: displayText,
        _id: item[idField],
        _parentId: item[parentIdField],
        _status: statusField ? item[statusField] : undefined
      };
      
      if (statusField) {
        node.isActive = this.isNodeActive(item);
      }
      
      map.set(item[idField], node);
    });

    flatData.forEach(item => {
      const node = map.get(item[idField]);
      if (!node) return;

      const parentId = item[parentIdField];
      
      if (parentId !== null && 
          parentId !== undefined && 
          parentId !== '' && 
          parentId !== 0 && 
          map.has(parentId)) {
        const parent = map.get(parentId);
        parent[this.childrenExpr].push(node);
        node._level = (parent._level || 0) + 1;
      } else {
        roots.push(node);
      }
    });

    return this.sortTreeNodes(roots);
  }

  // ========== CONSTRUIR TEXTO DE VISUALIZACIÓN ==========
  private buildDisplayText(item: any): string {
    const { displayFields, displaySeparator = ' ' } = this.fieldConfig;
    
    const parts = displayFields
      .map(field => item[field] !== undefined && item[field] !== null ? String(item[field]) : '')
      .filter(text => text !== '');
    
    return parts.join(displaySeparator);
  }

  // ========== ORDENAR NODOS ==========
  private sortTreeNodes(nodes: any[]): any[] {
    const orderField = this.fieldConfig.orderField;
    const displayFields = this.fieldConfig.displayFields;
    const primaryField = displayFields[0] || 'name';
    
    const sortFn = (a: any, b: any) => {
      if (orderField) {
        const valA = a[orderField] || '';
        const valB = b[orderField] || '';
        return valA.toString().localeCompare(valB.toString());
      }
      
      const nameA = (a[primaryField] || '').toString().toLowerCase();
      const nameB = (b[primaryField] || '').toString().toLowerCase();
      return nameA.localeCompare(nameB);
    };

    return nodes.sort(sortFn).map(node => {
      if (node[this.childrenExpr]?.length > 0) {
        node[this.childrenExpr] = this.sortTreeNodes(node[this.childrenExpr]);
      }
      return node;
    });
  }

  // ========== VERIFICAR ESTADO DEL NODO ==========
  private isNodeActive(item: any): boolean {
    const statusField = this.fieldConfig.statusField;
    if (!statusField) return true;
    
    const status = item[statusField];
    if (status === undefined || status === null) return true;
    
    const statusStr = String(status).toLowerCase();
    const activeStates = ['activo', 'active', '1', 'true', 'si', 'yes', 'habilitado', 'enabled', 'a', 'act'];
    return activeStates.includes(statusStr);
  }

  // ========== FILTRAR POR ESTADO ==========
  private filterByStatusFn(nodes: any[]): any[] {
    const statusField = this.fieldConfig.statusField;
    if (!statusField) return nodes;
    
    const statuses = Array.isArray(this.filterByStatus) 
      ? this.filterByStatus 
      : [this.filterByStatus];
    
    const result: any[] = [];
    
    for (const node of nodes) {
      const nodeStatus = node[statusField];
      const statusStr = nodeStatus !== undefined && nodeStatus !== null 
        ? String(nodeStatus).toLowerCase() 
        : '';
      
      const matches = statuses.some(s => 
        statusStr.includes(String(s).toLowerCase())
      );
      
      let children: any[] = [];
      if (node[this.childrenExpr]) {
        children = this.filterByStatusFn(node[this.childrenExpr]);
      }
      
      if (matches || children.length > 0) {
        result.push({
          ...node,
          [this.childrenExpr]: children
        });
      }
    }
    
    return result;
  }

  // ========== FILTRADO POR TEXTO ==========
  private filterTreeData(nodes: any[], searchText: string): any[] {
    if (!searchText) return nodes;

    const result: any[] = [];
    
    for (const node of nodes) {
      const matches = this.nodeMatchesSearch(node, searchText);
      
      let children: any[] = [];
      if (node[this.childrenExpr]) {
        children = this.filterTreeData(node[this.childrenExpr], searchText);
      }

      if (matches || children.length > 0) {
        const newNode = {
          ...node,
          [this.childrenExpr]: children,
          [this.expandedExpr]: true
        };
        result.push(newNode);
      }
    }

    return result;
  }

  private nodeMatchesSearch(node: any, searchText: string): boolean {
    const searchFields = this.fieldConfig.searchFields || this.fieldConfig.displayFields;
    
    for (const field of searchFields) {
      const value = node[field];
      if (value !== undefined && value !== null) {
        const strValue = String(value).toLowerCase();
        switch (this.searchMode) {
          case 'contains':
            if (strValue.includes(searchText)) return true;
            break;
          case 'startswith':
            if (strValue.startsWith(searchText)) return true;
            break;
          case 'equals':
            if (strValue === searchText) return true;
            break;
        }
      }
    }
    
    const idField = this.fieldConfig.idField;
    if (idField) {
      const idValue = node[idField];
      if (idValue !== undefined && idValue !== null) {
        if (String(idValue).toLowerCase().includes(searchText)) return true;
      }
    }
    
    return false;
  }

  // ========== MÉTODOS PÚBLICOS ==========

  getSelectedNodes(): any[] {
    return this.findSelectedNodes(this.treeData());
  }

  getSelectedKeys(): any[] {
    return this.getSelectedNodes().map(node => node[this.fieldConfig.idField]);
  }

  selectNodes(keys: any[]): void {
    if (!keys || keys.length === 0) return;
    this.selectNodesRecursive(this.treeData(), keys);
    this.cdr.markForCheck();
  }

  deselectAll(): void {
    this.deselectAllRecursive(this.treeData());
    this.cdr.markForCheck();
  }

  expandAll(): void {
    this.setExpandedAll(this.treeData(), true);
    this.cdr.markForCheck();
  }

  collapseAll(): void {
    this.setExpandedAll(this.treeData(), false);
    this.cdr.markForCheck();
  }

  expandToLevel(level: number): void {
    this.expandToLevelRecursive(this.treeData(), 0, level);
    this.cdr.markForCheck();
  }

  filterNodes(searchText: string): void {
    this.searchSubject.next(searchText);
  }

  reloadData(): void {
    this.buildTree();
  }

  getNodeByKey(key: any): any | null {
    return this.findNodeByKey(this.treeData(), key);
  }

  getNodePath(key: any): any[] {
    const path: any[] = [];
    this.findNodePath(this.treeData(), key, path);
    return path;
  }

  expandNode(key: any): void {
    const node = this.getNodeByKey(key);
    if (node) {
      node[this.expandedExpr] = true;
      this.expandParents(key);
      this.cdr.markForCheck();
    }
  }

  collapseNode(key: any): void {
    const node = this.getNodeByKey(key);
    if (node) {
      node[this.expandedExpr] = false;
      this.cdr.markForCheck();
    }
  }

  toggleNode(key: any): void {
    const node = this.getNodeByKey(key);
    if (node) {
      node[this.expandedExpr] = !node[this.expandedExpr];
      this.cdr.markForCheck();
    }
  }

  getNodesByStatus(status: string | string[]): any[] {
    const statusField = this.fieldConfig.statusField;
    if (!statusField) return [];
    
    const statuses = Array.isArray(status) ? status : [status];
    return this.findNodesByStatus(this.treeData(), statuses);
  }

  getActiveNodes(): any[] {
    return this.getNodesByStatus(['activo', 'active', '1', 'true']);
  }

  getInactiveNodes(): any[] {
    return this.getNodesByStatus(['inactivo', 'inactive', '0', 'false']);
  }

  // ========== MÉTODOS AUXILIARES ==========

  private findSelectedNodes(nodes: any[]): any[] {
    let selected: any[] = [];
    for (const node of nodes) {
      if (node[this.selectedExpr]) {
        selected.push(node);
      }
      if (node[this.childrenExpr]) {
        selected = selected.concat(this.findSelectedNodes(node[this.childrenExpr]));
      }
    }
    return selected;
  }

  private selectNodesRecursive(nodes: any[], keys: any[]): boolean {
    const idField = this.fieldConfig.idField;
    let found = false;
    for (const node of nodes) {
      if (keys.includes(node[idField])) {
        node[this.selectedExpr] = true;
        found = true;
      }
      if (node[this.childrenExpr]) {
        const childFound = this.selectNodesRecursive(node[this.childrenExpr], keys);
        found = found || childFound;
      }
    }
    return found;
  }

  private deselectAllRecursive(nodes: any[]): void {
    for (const node of nodes) {
      node[this.selectedExpr] = false;
      if (node[this.childrenExpr]) {
        this.deselectAllRecursive(node[this.childrenExpr]);
      }
    }
  }

  private setExpandedAll(nodes: any[], expanded: boolean): void {
    for (const node of nodes) {
      if (!node.isRoot) {
        node[this.expandedExpr] = expanded;
      }
      if (node[this.childrenExpr]) {
        this.setExpandedAll(node[this.childrenExpr], expanded);
      }
    }
  }

  private updateExpansionState(): void {
    if (this.expandAllOnLoad) {
      this.expandAll();
    } else if (this.collapseAllOnLoad) {
      this.collapseAll();
    }
  }

  private selectFirstNodeFn(): void {
    const firstNode = this.getFirstNode(this.treeData());
    if (firstNode) {
      firstNode[this.selectedExpr] = true;
      this.cdr.markForCheck();
    }
  }

  private getFirstNode(nodes: any[]): any | null {
    if (!nodes || nodes.length === 0) return null;
    const node = nodes[0];
    if (node[this.childrenExpr]?.length > 0) {
      return this.getFirstNode(node[this.childrenExpr]) || node;
    }
    return node;
  }

  private findNodeByKey(nodes: any[], key: any): any | null {
    const idField = this.fieldConfig.idField;
    for (const node of nodes) {
      if (node[idField] === key) return node;
      if (node[this.childrenExpr]) {
        const found = this.findNodeByKey(node[this.childrenExpr], key);
        if (found) return found;
      }
    }
    return null;
  }

  private findNodePath(nodes: any[], key: any, path: any[]): boolean {
    const idField = this.fieldConfig.idField;
    for (const node of nodes) {
      if (node[idField] === key) {
        path.push(node);
        return true;
      }
      if (node[this.childrenExpr]) {
        path.push(node);
        if (this.findNodePath(node[this.childrenExpr], key, path)) {
          return true;
        }
        path.pop();
      }
    }
    return false;
  }

  private expandParents(key: any): void {
    const path = this.getNodePath(key);
    for (const node of path) {
      if (!node.isRoot) {
        node[this.expandedExpr] = true;
      }
    }
  }

  private expandToLevelRecursive(nodes: any[], currentLevel: number, targetLevel: number): void {
    if (currentLevel >= targetLevel) return;
    for (const node of nodes) {
      if (!node.isRoot) {
        node[this.expandedExpr] = true;
      }
      if (node[this.childrenExpr]) {
        this.expandToLevelRecursive(node[this.childrenExpr], currentLevel + 1, targetLevel);
      }
    }
  }

  private findNodesByStatus(nodes: any[], statuses: string[]): any[] {
    const statusField = this.fieldConfig.statusField;
    if (!statusField) return [];
    
    let result: any[] = [];
    for (const node of nodes) {
      const nodeStatus = node[statusField];
      const statusStr = nodeStatus !== undefined && nodeStatus !== null 
        ? String(nodeStatus).toLowerCase() 
        : '';
      
      if (statuses.some(s => statusStr.includes(String(s).toLowerCase()))) {
        result.push(node);
      }
      
      if (node[this.childrenExpr]) {
        result = result.concat(this.findNodesByStatus(node[this.childrenExpr], statuses));
      }
    }
    return result;
  }

  // ========== MANEJADORES DE EVENTOS ==========

  handleItemClick(event: any): void {
    this.itemClick.emit({
      node: event.itemData,
      originalEvent: event.event,
      component: event.component
    });
  }

  handleItemExpanded(event: any): void {
    if (this.loadOnDemand && 
        (!event.itemData[this.childrenExpr] || event.itemData[this.childrenExpr].length === 0) &&
        this.loadChildNodes) {
      this.loadChildNodes(event.itemData).then(children => {
        if (children && children.length > 0) {
          event.itemData[this.childrenExpr] = children;
          this.cdr.markForCheck();
        }
      });
    }
    
    this.itemExpand.emit({
      node: event.itemData,
      originalEvent: event.event
    });
  }

  handleItemCollapsed(event: any): void {
    this.itemCollapse.emit({
      node: event.itemData,
      originalEvent: event.event
    });
  }

  handleSelectionChanged(event: any): void {
    const selectedNodes = event.component.getSelectedNodes();
    const allSelectedKeys = selectedNodes.map((node: any) => node[this.fieldConfig.idField]);
    
    this.selectedKeys.set(allSelectedKeys);
    
    this.selectionChange.emit({
      selectedNodes: selectedNodes,
      allSelectedKeys: allSelectedKeys,
      originalEvent: event
    });
  }

  handleItemContextMenu(event: any): void {
    event.event?.preventDefault();
    this.itemContextMenu.emit({
      node: event.itemData,
      originalEvent: event.event,
      component: event.component
    });
  }

  // ========== GETTERS PARA EL TEMPLATE ==========
  get childrenExpr(): string {
    return 'children';
  }

  get expandedExpr(): string {
    return 'expanded';
  }

  get selectedExpr(): string {
    return 'selected';
  }

  getTreeHeight(): string {
    let offset = 0;
    if (this.searchEnabled && this.showSearchBox) offset += 60;
    return `calc(100% - ${offset}px)`;
  }

  getChildrenCount(node: any): number {
    if (!node[this.childrenExpr]) return 0;
    return node[this.childrenExpr].length;
  }
}