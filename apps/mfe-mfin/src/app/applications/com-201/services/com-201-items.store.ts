import { Injectable, computed, inject, signal } from '@angular/core';
import { Com201BusinessService } from './com-201-business.service';
import { Com201DefaultPageSize, Com201Message } from '../constants/com-201-ui.constants';
import { Com201Item, Com201ItemsPage } from '../models/com-201-item.model';
import { Com201ItemQuery } from '../models/com-201-business.model';
import { duplicateGroups } from '../utils/com-201-validation';

/** Fields sent to /COM201/save for every item (TOTAL_REGISTROS and paging columns are dropped). */
const ItemFields: readonly (keyof Com201Item)[] = ['ITEM', 'ID_GRUPO', 'PRODUCTO', 'NOMBRE', 'ATRIBUTO', 'UDM_PRES', 'PRECIO_BASE', 'PRECIO', 'PRECIO_IVA'];

/** Origin of an item touched during the current edition. */
type Com201ItemOrigin = 'manual' | 'merged';

/** Active group filter: selected group (sent to the SP) and the group with its subgroups (client filter). */
interface Com201GroupFilter {
  id: string;
  groups: ReadonlySet<string>;
}

/** Result of buildSavePayload: items to save and non-blocking warnings. */
export interface Com201SavePayload {
  items: Com201Item[];
  warnings: string[];
}

/**
 * Item state of one COM-201 instance.
 *
 * Browsing: pages on the server when the SP returns TOTAL_REGISTROS, otherwise in memory.
 * Creating / Editing / Copying: the complete list (`full`) is the only source of truth until save or cancel.
 */
@Injectable()
export class Com201ItemsStore {
  private readonly business = inject(Com201BusinessService);

  readonly idLista = signal('');
  readonly serverPaged = signal(false);
  readonly full = signal<Com201Item[] | null>(null);
  readonly page = signal<Com201Item[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(Com201DefaultPageSize);
  readonly total = signal(0);
  readonly groupFilter = signal<Com201GroupFilter | null>(null);
  readonly search = signal('');
  readonly selectedKeys = signal<ReadonlySet<number>>(new Set());
  readonly hasItems = signal(false);
  readonly editing = signal(false);
  readonly loading = signal(false);

  /** Copy of `full` taken when it was materialized (identifies new and edited rows). */
  private snapshot = new Map<number, Com201Item>();
  /** Rows whose key was changed by hand (or added) and rows produced by the legacy merge. */
  private origins = new Map<number, Com201ItemOrigin>();
  /** Incremented by every request and reset; late responses with another sequence are discarded. */
  private requestSeq = 0;
  /** True when the loaded list came from a request without PAGINA (the only list safe to edit as complete). */
  private loadedWithoutPage = false;

  /** Client-side rows after the group and search filters. */
  private readonly filtered = computed(() => {
    const rows = this.full() ?? [];
    const group = this.groupFilter();
    const text = this.search().trim().toLowerCase();
    return rows.filter(row => (!group || group.groups.has(row.ID_GRUPO))
      && (!text || String(row.PRODUCTO ?? '').toLowerCase().includes(text) || String(row.NOMBRE ?? '').toLowerCase().includes(text)));
  });

  /** Rows received by the grid. */
  readonly visible = computed(() => {
    if (this.serverPaged()) return this.page();
    const start = this.pageIndex() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  /** Number of rows of the active filter. */
  readonly count = computed(() => this.serverPaged() ? this.total() : this.filtered().length);

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.count() / this.pageSize())));

  /**
   * Browsing load. Requests the first page; the response decides server or client paging.
   */
  async load(idLista: string): Promise<void> {
    const seq = ++this.requestSeq;
    this.idLista.set(idLista);
    this.editing.set(false);
    this.pageIndex.set(0);
    this.loading.set(true);
    try {
      let result: Com201ItemsPage;
      let withoutPage = false;
      try {
        result = await this.business.itemsPage(this.pageQuery(idLista));
      } catch (error) {
        if (!this.isParameterError(error)) throw error;
        result = { ...(await this.business.itemsPage({ ID_LISTA: idLista })), serverPaged: false };
        withoutPage = true;
      }
      if (!this.current(seq, idLista)) return;
      this.loadedWithoutPage = withoutPage;
      this.serverPaged.set(result.serverPaged);
      if (result.serverPaged) {
        this.full.set(null);
        this.page.set(result.rows);
        this.total.set(result.total);
      } else {
        this.full.set(result.rows);
        this.page.set([]);
        this.total.set(result.rows.length);
      }
    } finally {
      if (seq === this.requestSeq) this.loading.set(false);
    }
  }

  async setPage(index: number): Promise<void> {
    this.pageIndex.set(Math.max(0, Math.min(index, this.pageCount() - 1)));
    await this.refreshServerPage();
  }

  async setPageSize(size: number): Promise<void> {
    this.pageSize.set(size);
    this.pageIndex.set(0);
    await this.refreshServerPage();
  }

  async setGroup(filter: Com201GroupFilter | null): Promise<void> {
    this.groupFilter.set(filter);
    this.pageIndex.set(0);
    await this.refreshServerPage();
  }

  async setSearch(text: string): Promise<void> {
    this.search.set(text.trim());
    this.pageIndex.set(0);
    await this.refreshServerPage();
  }

  /**
   * Loads the complete list (without PAGINA) before Editing or Copying.
   * Returns false when the response no longer belongs to the requested list.
   */
  async materialize(idLista: string): Promise<boolean> {
    const seq = ++this.requestSeq;
    let rows = this.full();
    if (!rows || this.serverPaged() || !this.loadedWithoutPage || this.idLista() !== idLista) {
      this.loading.set(true);
      try {
        rows = await this.business.allItems(idLista);
      } finally {
        if (seq === this.requestSeq) this.loading.set(false);
      }
      if (seq !== this.requestSeq) return false;
    }
    this.idLista.set(idLista);
    this.loadedWithoutPage = true;
    this.serverPaged.set(false);
    this.full.set(rows.map(row => ({ ...row })));
    this.page.set([]);
    this.pageIndex.set(0);
    this.snapshot = new Map(rows.map(row => [row.ITEM, { ...row }]));
    this.origins.clear();
    this.selectedKeys.set(new Set());
    this.hasItems.set(rows.length > 0);
    this.editing.set(true);
    return true;
  }

  /** Creating: empty list in client mode, without backend calls. */
  startNew(): void {
    this.reset();
    this.full.set([]);
    this.editing.set(true);
  }

  /** New row (not yet in the list) with ATRIBUTO 'SIN' and ITEM = max + 1 (legacy onInitNewRow). */
  addNew(): Com201Item {
    const rows = this.full() ?? [];
    return { ITEM: rows.reduce((max, row) => Math.max(max, Number(row.ITEM) || 0), 0) + 1,
      ID_GRUPO: '', PRODUCTO: '', NOMBRE: '', ATRIBUTO: 'SIN', UDM_PRES: '', PRECIO_BASE: 0, PRECIO: 0, PRECIO_IVA: 0 };
  }

  /** Inserts or replaces a row of `full`. keyChanged marks rows that are new or whose key was changed by hand. */
  upsert(row: Com201Item, keyChanged: boolean): void {
    const rows = [...(this.full() ?? [])];
    const index = rows.findIndex(item => item.ITEM === row.ITEM);
    if (index >= 0) rows[index] = { ...row };
    else rows.push({ ...row });
    if (keyChanged || index < 0) this.origins.set(row.ITEM, 'manual');
    this.full.set(rows);
  }

  /** Removes rows from `full` (all pages); hasItems is recalculated as in legacy COM201.component.ts:1786-1790. */
  remove(keys: ReadonlySet<number>): void {
    const rows = (this.full() ?? []).filter(row => !keys.has(row.ITEM));
    keys.forEach(key => this.origins.delete(key));
    this.full.set(rows);
    this.selectedKeys.set(new Set());
    this.hasItems.set(rows.length > 0);
    this.clampPage();
  }

  /** Replaces `full` with the result of the legacy merge. */
  replaceAll(rows: Com201Item[], mergedKeys: ReadonlySet<number>): void {
    mergedKeys.forEach(key => this.origins.set(key, 'merged'));
    const keys = new Set(rows.map(row => row.ITEM));
    this.full.set(rows.map(row => ({ ...row })));
    this.selectedKeys.update(selected => new Set([...selected].filter(key => keys.has(key))));
    this.clampPage();
  }

  /** Applies the grid selection; keys outside the visible page are kept. */
  select(selected: readonly number[], deselected: readonly number[]): void {
    const visible = new Set(this.visible().map(row => row.ITEM));
    this.selectedKeys.update(current => {
      const next = new Set(current);
      selected.forEach(key => next.add(key));
      deselected.filter(key => visible.has(key)).forEach(key => next.delete(key));
      return next;
    });
  }

  /**
   * Builds ITM_LISTA_PRECIOS: validates duplicates, checks concurrency (Editing) and strips paging columns.
   * Throws when the save must be aborted.
   */
  async buildSavePayload(options: { checkConcurrency: boolean; idListaPrev: string; byAttribute: boolean }): Promise<Com201SavePayload> {
    const rows = this.full() ?? [];
    const warnings: string[] = [];
    for (const group of duplicateGroups(rows, options.byAttribute)) {
      const product = group[0].PRODUCTO;
      if (group.some(row => this.origins.get(row.ITEM) === 'manual')) throw new Error(`${Com201Message.itemRepeated} (${product})`);
      warnings.push(group.some(row => this.origins.get(row.ITEM) === 'merged')
        ? `El producto ${product} quedó repetido tras generar precios.`
        : `El producto ${product} ya estaba repetido en la lista.`);
    }
    if (options.checkConcurrency) {
      const edited = rows.filter(row => {
        const previous = this.snapshot.get(row.ITEM);
        return previous && ItemFields.some(field => previous[field] !== row[field]);
      });
      if (edited.length) {
        const server = new Map((await this.business.allItems(options.idListaPrev)).map(row => [row.ITEM, row]));
        if (edited.some(row => server.get(row.ITEM)?.PRODUCTO !== this.snapshot.get(row.ITEM)?.PRODUCTO)) throw new Error(Com201Message.listChanged);
      }
    }
    const items = rows.map(row => Object.fromEntries(ItemFields.map(field => [field, row[field]])) as unknown as Com201Item);
    return { items, warnings };
  }

  /** Clears the state and discards every pending response. */
  reset(): void {
    ++this.requestSeq;
    this.idLista.set('');
    this.loadedWithoutPage = false;
    this.serverPaged.set(false);
    this.full.set(null);
    this.page.set([]);
    this.pageIndex.set(0);
    this.total.set(0);
    this.groupFilter.set(null);
    this.search.set('');
    this.selectedKeys.set(new Set());
    this.hasItems.set(false);
    this.editing.set(false);
    this.loading.set(false);
    this.snapshot = new Map();
    this.origins.clear();
  }

  private async refreshServerPage(): Promise<void> {
    if (!this.serverPaged()) { this.clampPage(); return; }
    const seq = ++this.requestSeq;
    const idLista = this.idLista();
    this.loading.set(true);
    try {
      const result = await this.business.itemsPage(this.pageQuery(idLista));
      if (!this.current(seq, idLista)) return;
      this.page.set(result.rows);
      this.total.set(result.serverPaged ? result.total : this.pageIndex() * this.pageSize() + result.rows.length);
    } finally {
      if (seq === this.requestSeq) this.loading.set(false);
    }
  }

  private pageQuery(idLista: string): Com201ItemQuery {
    const group = this.groupFilter();
    const search = this.search();
    return { ID_LISTA: idLista, PAGINA: this.pageIndex() + 1, TAMANO_PAGINA: this.pageSize(),
      ...(group ? { ID_GRUPO: group.id } : {}), ...(search ? { BUSQUEDA: search } : {}) };
  }

  private current(seq: number, idLista: string): boolean {
    return seq === this.requestSeq && idLista === this.idLista();
  }

  private clampPage(): void {
    if (this.pageIndex() > this.pageCount() - 1) this.pageIndex.set(this.pageCount() - 1);
  }

  /** Errors that suggest the current SP rejected the paging parameters. */
  private isParameterError(error: unknown): boolean {
    return /PAGINA|TAMANO_PAGINA|par[aá]metro|parameter|argument/i.test(this.business.errorMessage(error, ''));
  }
}
