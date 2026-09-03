import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  signal
} from '@angular/core';

import {
  DxTextBoxModule,
  DxTreeViewModule
} from 'devextreme-angular';


/**
 * Generic data item emitted by the XTEIN tree.
 *
 * Applications are not required to implement an index signature
 * in their domain models.
 */
export type XteinTreeDataItem =
  Record<
    string,
    unknown
  >;


/**
 * Internal normalized tree node.
 */
interface XteinTreeNode {

  /**
   * Unique tree node identifier.
   */
  key:
    string;

  /**
   * Main display text.
   */
  text:
    string;

  /**
   * Optional display prefix.
   */
  prefix:
    string;

  /**
   * Indicates whether the node represents an active item.
   */
  active:
    boolean;

  /**
   * Indicates whether the node is expanded.
   */
  expanded:
    boolean;

  /**
   * Child tree nodes.
   */
  children:
    XteinTreeNode[];

  /**
   * Original application data object.
   */
  data:
    object;
}


/**
 * Minimal DevExtreme item-click event required by the
 * XTEIN tree component.
 */
interface XteinTreeItemClickEvent {

  /**
   * Selected tree node.
   */
  itemData?:
    XteinTreeNode;
}


/**
 * Standard reusable XTEIN hierarchical tree.
 *
 * DevExtreme remains encapsulated inside the shared UI library.
 * Applications only provide their domain objects and field names.
 *
 * Application models do not need to extend Record<string, unknown>
 * or implement an index signature.
 */
@Component({
  selector:
    'xtein-tree',

  standalone:
    true,

  imports: [
    DxTextBoxModule,
    DxTreeViewModule
  ],

  templateUrl:
    './xtein-tree.component.html',

  styleUrl:
    './xtein-tree.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class XteinTreeComponent
  implements OnChanges {

  /**
   * Flat source collection.
   *
   * Any application domain object can be supplied.
   */
  @Input()
  items:
    readonly object[] =
      [];


  /**
   * Unique identifier field.
   */
  @Input()
  idField =
    'id';


  /**
   * Parent identifier field.
   */
  @Input()
  parentIdField =
    'parentId';


  /**
   * Main display field.
   */
  @Input()
  displayField =
    'name';


  /**
   * Optional field displayed before the main text.
   */
  @Input()
  prefixField =
    '';


  /**
   * Optional status field.
   */
  @Input()
  statusField =
    '';


  /**
   * Fields used by local tree search.
   */
  @Input()
  searchFields:
    readonly string[] =
      [];


  /**
   * Enables local search.
   */
  @Input()
  searchEnabled =
    true;


  /**
   * Search placeholder.
   */
  @Input()
  searchPlaceholder =
    'Buscar...';


  /**
   * Displays the configured prefix.
   */
  @Input()
  showPrefix =
    true;


  /**
   * Displays active/inactive status.
   */
  @Input()
  showStatus =
    true;


  /**
   * Expands all nodes when data is loaded.
   */
  @Input()
  expandAllOnLoad =
    true;


  /**
   * Emits the original selected data item.
   */
  @Output()
  readonly itemClick =
    new EventEmitter<
      XteinTreeDataItem
    >();


  /**
   * Current local search text.
   */
  readonly searchText =
    signal(
      ''
    );


  /**
   * Internal hierarchical tree.
   *
   * DevExtreme requires a mutable array for its items binding.
   */
  private readonly treeState =
    signal<
      XteinTreeNode[]
    >(
      []
    );


  /**
   * Tree filtered according to the current local search.
   *
   * DevExtreme receives a mutable array.
   */
  readonly visibleNodes =
    computed<
      XteinTreeNode[]
    >(
      () => {

        const search =
          this.searchText()
            .trim()
            .toLowerCase();


        if (
          !search
        ) {

          return [
            ...this.treeState()
          ];
        }


        return this.filterNodes(
          this.treeState(),
          search
        );
      }
    );


  /**
   * Indicates whether the tree currently has data.
   */
  readonly hasItems =
    computed(
      () =>
        this.visibleNodes()
          .length > 0
    );


  /**
   * Rebuilds the hierarchy when source data changes.
   */
  ngOnChanges(
    changes:
      SimpleChanges
  ): void {

    if (
      changes['items'] ||
      changes['idField'] ||
      changes['parentIdField'] ||
      changes['displayField'] ||
      changes['prefixField'] ||
      changes['statusField']
    ) {

      this.buildTree();
    }
  }


  /**
   * Updates the local search.
   *
   * @param value Search editor value.
   */
  updateSearch(
    value:
      unknown
  ): void {

    this.searchText.set(
      String(
        value ?? ''
      )
    );
  }


  /**
   * Handles one DevExtreme tree item click.
   *
   * @param event DevExtreme item-click event.
   */
  handleItemClick(
    event:
      XteinTreeItemClickEvent
  ): void {

    const node =
      event.itemData;


    if (
      !node
    ) {

      return;
    }


    this.itemClick.emit(
      this.toDataItem(
        node.data
      )
    );
  }


  /**
   * Converts the flat source collection into a hierarchy.
   */
  private buildTree():
    void {

    if (
      !this.items.length
    ) {

      this.treeState.set(
        []
      );

      return;
    }


    const nodes =
      new Map<
        string,
        XteinTreeNode
      >();


    for (
      const item
      of this.items
    ) {

      const key =
        this.normalizeKey(
          this.readValue(
            item,
            this.idField
          )
        );


      if (
        !key
      ) {

        continue;
      }


      nodes.set(
        key,
        {
          key,

          text:
            this.readText(
              item,
              this.displayField
            ),

          prefix:
            this.prefixField
              ? this.readText(
                  item,
                  this.prefixField
                )
              : '',

          active:
            this.isActive(
              item
            ),

          expanded:
            this.expandAllOnLoad,

          children:
            [],

          data:
            item
        }
      );
    }


    const roots:
      XteinTreeNode[] =
        [];


    for (
      const item
      of this.items
    ) {

      const key =
        this.normalizeKey(
          this.readValue(
            item,
            this.idField
          )
        );


      if (
        !key
      ) {

        continue;
      }


      const node =
        nodes.get(
          key
        );


      if (
        !node
      ) {

        continue;
      }


      const parentKey =
        this.normalizeKey(
          this.readValue(
            item,
            this.parentIdField
          )
        );


      if (
        parentKey &&
        parentKey !==
          key
      ) {

        const parent =
          nodes.get(
            parentKey
          );


        if (
          parent
        ) {

          parent.children.push(
            node
          );

          continue;
        }
      }


      roots.push(
        node
      );
    }


    this.sortNodes(
      roots
    );


    this.treeState.set(
      roots
    );
  }


  /**
   * Sorts nodes recursively by display text.
   *
   * @param nodes Nodes to sort.
   */
  private sortNodes(
    nodes:
      XteinTreeNode[]
  ): void {

    nodes.sort(
      (
        first,
        second
      ) =>
        first.text.localeCompare(
          second.text,
          undefined,
          {
            sensitivity:
              'base'
          }
        )
    );


    for (
      const node
      of nodes
    ) {

      this.sortNodes(
        node.children
      );
    }
  }


  /**
   * Filters nodes recursively while preserving matching parents.
   *
   * @param nodes Nodes to filter.
   * @param search Normalized search text.
   * @returns Mutable filtered tree.
   */
  private filterNodes(
    nodes:
      readonly XteinTreeNode[],

    search:
      string
  ): XteinTreeNode[] {

    const result:
      XteinTreeNode[] =
        [];


    for (
      const node
      of nodes
    ) {

      const children =
        this.filterNodes(
          node.children,
          search
        );


      if (
        this.matchesSearch(
          node,
          search
        ) ||
        children.length > 0
      ) {

        result.push(
          {
            ...node,

            expanded:
              true,

            children
          }
        );
      }
    }


    return result;
  }


  /**
   * Tests one node against the configured search fields.
   *
   * @param node Tree node.
   * @param search Normalized search text.
   * @returns True when the node matches.
   */
  private matchesSearch(
    node:
      XteinTreeNode,

    search:
      string
  ): boolean {

    const fields =
      this.searchFields.length > 0
        ? this.searchFields
        : [
            this.idField,
            this.displayField
          ];


    return fields.some(
      field => {

        const value =
          this.readValue(
            node.data,
            field
          );


        return String(
          value ?? ''
        )
          .toLowerCase()
          .includes(
            search
          );
      }
    );
  }


  /**
   * Determines whether a source item represents an active node.
   *
   * @param item Source data item.
   * @returns True when active.
   */
  private isActive(
    item:
      object
  ): boolean {

    if (
      !this.statusField
    ) {

      return true;
    }


    const normalizedStatus =
      String(
        this.readValue(
          item,
          this.statusField
        ) ?? ''
      )
        .trim()
        .toLowerCase();


    if (
      !normalizedStatus
    ) {

      return true;
    }


    return [
      'activo',
      'active',
      '1',
      'true',
      'si',
      'sí',
      'yes',
      'habilitado',
      'enabled'
    ].includes(
      normalizedStatus
    );
  }


  /**
   * Reads one source property dynamically.
   *
   * Dynamic field access remains internal to the shared component.
   * Application models therefore remain strongly typed and do not
   * require an index signature.
   *
   * @param item Source data object.
   * @param field Property name.
   * @returns Property value.
   */
  private readValue(
    item:
      object,

    field:
      string
  ): unknown {

    if (
      !field
    ) {

      return undefined;
    }


    const record =
      item as
        Record<
          string,
          unknown
        >;


    return record[
      field
    ];
  }


  /**
   * Reads one field as display text.
   *
   * @param item Source data item.
   * @param field Field name.
   * @returns Normalized text.
   */
  private readText(
    item:
      object,

    field:
      string
  ): string {

    return String(
      this.readValue(
        item,
        field
      ) ?? ''
    ).trim();
  }


  /**
   * Converts an object into the generic tree output contract.
   *
   * @param item Original source object.
   * @returns Generic tree data item.
   */
  private toDataItem(
    item:
      object
  ): XteinTreeDataItem {

    return item as
      XteinTreeDataItem;
  }


  /**
   * Normalizes a source identifier.
   *
   * @param value Identifier value.
   * @returns Normalized key.
   */
  private normalizeKey(
    value:
      unknown
  ): string {

    if (
      value ===
        null ||
      value ===
        undefined
    ) {

      return '';
    }


    return String(
      value
    ).trim();
  }
}