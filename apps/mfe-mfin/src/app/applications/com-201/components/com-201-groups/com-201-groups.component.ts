import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { XteinButtonComponent, XteinTreeComponent, XteinTreeDataItem } from '@xtein/ui';
import { Com201RootGroup } from '../../constants/com-201-ui.constants';
import { Com201Grupo } from '../../models/com-201-business.model';
import { descendantGroups } from '../../utils/com-201-groups';

/**
 * Product-group tree of COM-201 (legacy dx-tree-list with rootValue INVENTARIOS).
 *
 * xtein-tree has no expand/collapse API, so the button recreates the tree with
 * the requested expandAllOnLoad value.
 */
@Component({
  selector: 'com-201-groups',
  standalone: true,
  imports: [XteinTreeComponent, XteinButtonComponent],
  templateUrl: './com-201-groups.component.html',
  styleUrl: './com-201-groups.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Com201GroupsComponent implements OnChanges {
  @Input() groups: Com201Grupo[] = [];
  @Input() selectedId: string | null = null;
  @Input() disabled = false;

  @Output() selected = new EventEmitter<Com201Grupo | null>();

  readonly expanded = signal(false);
  readonly treeKey = signal(0);
  readonly searchFields = ['ID_GRUPO', 'NOMBRE'];
  treeItems: Com201Grupo[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['groups']) {
      const descendants = descendantGroups(this.groups, Com201RootGroup);
      this.treeItems = this.groups.filter(group => group.ID_GRUPO !== Com201RootGroup && descendants.has(group.ID_GRUPO));
    }
    if (changes['selectedId'] && !this.selectedId && !changes['selectedId'].firstChange) {
      this.treeKey.update(key => key + 1);
    }
  }

  selectedName(): string {
    return this.groups.find(group => group.ID_GRUPO === this.selectedId)?.NOMBRE ?? '';
  }

  toggleExpanded(): void {
    this.expanded.update(value => !value);
    this.treeKey.update(key => key + 1);
  }

  pick(item: XteinTreeDataItem): void {
    if (this.disabled) return;
    this.selected.emit(item as unknown as Com201Grupo);
  }

  clear(): void {
    if (this.disabled || !this.selectedId) return;
    this.selected.emit(null);
  }
}
