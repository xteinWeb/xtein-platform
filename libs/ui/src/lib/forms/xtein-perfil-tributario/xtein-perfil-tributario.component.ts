import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewChild,
  signal,
  computed,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import {
  DxTextBoxComponent,
  DxTextBoxModule,
  DxPopupModule,
  DxDataGridModule,
  DxDataGridComponent,
  DxButtonModule,
  DxCheckBoxModule,
  DxTemplateModule
} from 'devextreme-angular';
import { XteinLabelComponent } from '../xtein-label/xtein-label.component';

export interface XteinPerfilTasaRecord {
  ID_TASA: string;
  DESCRIPCION?: string;
  PORCENTAJE?: number;
  VALOR_BASE?: number;
  APLICA_BASE?: boolean;
  CLASE?: string;
  [key: string]: unknown;
}

export interface XteinPerfilGridColumn {
  dataField: string;
  caption: string;
  width?: number | string;
  alignment?: string;
  format?: string;
}

/**
 * Standard XTEIN Perfil Tributario input based on DevExtreme TextBox with an integrated action button
 * and built-in floating modal for tax profile and rates association with smooth tab transitions.
 */
@Component({
  selector: 'xtein-perfil-tributario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    XteinLabelComponent,
    DxTextBoxModule,
    DxPopupModule,
    DxDataGridModule,
    DxButtonModule,
    DxCheckBoxModule,
    DxTemplateModule
  ],
  templateUrl: './xtein-perfil-tributario.component.html',
  styleUrls: ['./xtein-perfil-tributario.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.id]': 'null',
    class: 'd-block w-100'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => XteinPerfilTributarioComponent),
      multi: true
    }
  ]
})
export class XteinPerfilTributarioComponent implements ControlValueAccessor, OnChanges {
  private static readonly PREFERRED_COLUMN_ORDER: Record<string, { caption: string; order: number }> = {
    AUTORETENEDOR: { caption: 'Agente Autoretenedor de Renta', order: 1 },
    GRAN_CONTRIBUYENTE: { caption: 'Persona Jurídica Gran Contribuyente', order: 2 },
    REGIMEN_IVA: { caption: 'Régimen de Tributación de Iva', order: 3 },
    AGENTE_RETENEDOR: { caption: 'Agente Retenedor', order: 4 },
    AIU: { caption: 'Admon, Imprevistos y Utilidad', order: 5 }
  };

  private static getColumnOrder(col: XteinPerfilGridColumn): number {
    const field = (col.dataField || '').toUpperCase();
    const caption = (col.caption || '').toLowerCase();

    if (field.includes('AUTORETENEDOR') || caption.includes('autoretenedor')) return 1;
    if (field.includes('GRAN') || field.includes('CONTRIBUYENTE') || caption.includes('gran contribuyente')) return 2;
    if (field.includes('IVA') || field.includes('REGIMEN') || caption.includes('iva') || caption.includes('régimen') || caption.includes('regimen')) return 3;
    if ((field.includes('RETENEDOR') || caption.includes('retenedor')) && !field.includes('AUTORETENEDOR') && !caption.includes('autoretenedor')) return 4;
    if (field.includes('AIU') || field.includes('ADMON') || caption.includes('admon') || caption.includes('imprevistos') || caption.includes('utilidad')) return 5;
    return 99;
  }

  @ViewChild(DxTextBoxComponent) private editor?: DxTextBoxComponent;
  @ViewChild('gridPerfiles', { static: false }) gridPerfiles?: DxDataGridComponent;
  @ViewChild('gridTasas', { static: false }) gridTasas?: DxDataGridComponent;

  // Form Control Inputs
  @Input() id = '';
  @Input() label = '';
  @Input() ariaLabel = '';
  @Input() placeholder = 'Perfil tributario';
  @Input() required = false;
  @Input() readOnly = false;
  @Input() disabled = false;
  @Input() invalid = false;
  @Input() errorMessage = '';

  // Data Inputs for the Floating Modal
  @Input() perfilesTributarios: Record<string, unknown>[] = [];
  @Input() listaTasas: XteinPerfilTasaRecord[] = [];
  @Input() perfilColumns: XteinPerfilGridColumn[] = [];
  @Input() perfilTasas: Array<{ ID_TASA: string; APLICA_BASE: boolean }> = [];

  // Outputs
  @Output() readonly buttonClick = new EventEmitter<void>();
  @Output() readonly blurred = new EventEmitter<void>();
  @Output() readonly perfilTasasChange = new EventEmitter<Array<{ ID_TASA: string; APLICA_BASE: boolean }>>();
  @Output() readonly saved = new EventEmitter<{
    perfilTributario: string;
    perfilTasas: Array<{ ID_TASA: string; APLICA_BASE: boolean }>;
  }>();

  value: string = '';
  private formDisabled = false;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  // Internal Modal State
  readonly modalVisible = signal(false);
  readonly activeTab = signal<'perfiles' | 'tasas'>('perfiles');
  readonly soloSeleccionadas = signal(false);

  readonly selectedPerfilKeys = signal<unknown[]>([]);
  readonly selectedTasaKeys = signal<string[]>([]);
  readonly localTasas = signal<XteinPerfilTasaRecord[]>([]);

  readonly allowedPageSizes = [5, 10, 20, 50, 100, 'all'] as const;

  readonly popupWrapperAttr = { class: 'xtein-perfil-popup xtein-modern-popup' };

  readonly resolvedPerfilColumns = computed<XteinPerfilGridColumn[]>(() => {
    let cols: XteinPerfilGridColumn[] = [];
    if (this.perfilColumns && this.perfilColumns.length > 0) {
      cols = this.perfilColumns.map(col => ({
        ...col,
        caption: XteinPerfilTributarioComponent.PREFERRED_COLUMN_ORDER[col.dataField]?.caption || col.caption
      }));
    } else if (this.perfilesTributarios && this.perfilesTributarios.length > 0) {
      const first = this.perfilesTributarios[0];
      cols = Object.keys(first)
        .filter(k => k !== 'ITEM' && k !== 'COLUMNAS' && k !== 'QFILTRO' && k !== 'FECHA_REGISTRO')
        .map(k => ({
          dataField: k,
          caption: XteinPerfilTributarioComponent.PREFERRED_COLUMN_ORDER[k]?.caption || k.replace(/_/g, ' ')
        }));
    }

    return cols.sort((a, b) => {
      const orderA = XteinPerfilTributarioComponent.getColumnOrder(a);
      const orderB = XteinPerfilTributarioComponent.getColumnOrder(b);
      return orderA - orderB;
    });
  });

  readonly buttonOptions = {
    icon: 'arrowup',
    type: 'default',
    stylingMode: 'contained',
    disabled: false,
    elementAttr: { class: 'xtein-perfil-action-btn', title: 'Asociación de Perfiles Tributarios' },
    onClick: () => {
      this.openModal();
      this.buttonClick.emit();
    }
  };

  readonly displayedPerfiles = computed(() => {
    const list = this.perfilesTributarios || [];
    const onlySelected = this.soloSeleccionadas();
    const selKeys = this.selectedPerfilKeys();
    if (onlySelected && selKeys.length > 0) {
      return list.filter(item => selKeys.includes(item['ITEM'] ?? item));
    }
    return list;
  });

  readonly displayedTasas = computed(() => {
    const list = this.localTasas() || [];
    const onlySelected = this.soloSeleccionadas();
    const selKeys = this.selectedTasaKeys();
    if (onlySelected && selKeys.length > 0) {
      return list.filter(item => selKeys.includes(item.ID_TASA));
    }
    return list;
  });

  constructor(private readonly changeDetector: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listaTasas'] && this.listaTasas) {
      this.initLocalTasas();
    }
    if (changes['perfilTasas'] && this.perfilTasas) {
      this.initLocalTasas();
    }
  }

  get isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  get inputAttributes(): Record<string, string> {
    const attributes: Record<string, string> = {};
    if (this.id) attributes['id'] = this.id;
    if (this.ariaLabel) attributes['aria-label'] = this.ariaLabel;
    if (this.required) attributes['aria-required'] = 'true';
    if (this.invalid) attributes['aria-invalid'] = 'true';
    return attributes;
  }

  writeValue(value: unknown): void {
    this.value = value != null ? String(value) : '';
    this.changeDetector.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled = isDisabled;
    this.changeDetector.markForCheck();
  }

  handleValueChanged(event: { value?: string }): void {
    this.value = event.value ?? '';
    this.onChange(this.value);
  }

  handleFocusOut(): void {
    this.onTouched();
    this.blurred.emit();
  }

  openModal(): void {
    this.initModalState();
    this.modalVisible.set(true);
  }

  closeModal(): void {
    this.modalVisible.set(false);
  }

  setActiveTab(tab: 'perfiles' | 'tasas'): void {
    this.activeTab.set(tab);
  }

  onSoloSeleccChanged(value: boolean): void {
    this.soloSeleccionadas.set(Boolean(value));
  }

  private initLocalTasas(): void {
    const currentSelected = new Map<string, boolean>();
    (this.perfilTasas || []).forEach(t => {
      currentSelected.set(t.ID_TASA, t.APLICA_BASE);
    });

    const mapped = (this.listaTasas || []).map(tasa => ({
      ...tasa,
      APLICA_BASE: currentSelected.has(tasa.ID_TASA)
        ? Boolean(currentSelected.get(tasa.ID_TASA))
        : Boolean(tasa.APLICA_BASE)
    }));

    this.localTasas.set(mapped);
  }

  private initModalState(): void {
    this.activeTab.set('perfiles');
    this.soloSeleccionadas.set(false);
    this.initLocalTasas();

    // Match current perfil tributario row
    const [perfilPart] = (this.value || '').split('~');
    let matchedItemKey: unknown = null;

    const cols = this.resolvedPerfilColumns();
    if (perfilPart && this.perfilesTributarios.length > 0 && cols.length > 0) {
      const currentPairs = new Map<string, string>();
      perfilPart.split('|').forEach(part => {
        const sepIdx = part.indexOf('=') !== -1 ? part.indexOf('=') : part.indexOf(':');
        if (sepIdx !== -1) {
          const key = part.substring(0, sepIdx).trim();
          const val = part.substring(sepIdx + 1).trim();
          currentPairs.set(key, val);
        }
      });

      for (const item of this.perfilesTributarios) {
        let allMatch = true;
        for (const col of cols) {
          const expectedVal = currentPairs.get(col.dataField);
          const actualVal = String(item[col.dataField] ?? '').trim();
          if (expectedVal !== undefined && expectedVal.toLowerCase() !== actualVal.toLowerCase()) {
            allMatch = false;
            break;
          }
        }
        if (allMatch && currentPairs.size > 0) {
          matchedItemKey = item['ITEM'] ?? item;
          break;
        }
      }
    }

    if (matchedItemKey != null) {
      this.selectedPerfilKeys.set([matchedItemKey]);
    } else if (this.perfilesTributarios.length > 0) {
      const first = this.perfilesTributarios[0];
      this.selectedPerfilKeys.set([first['ITEM'] ?? first]);
    } else {
      this.selectedPerfilKeys.set([]);
    }

    // Match current selected tasas
    const tasaKeys = (this.perfilTasas || []).map(t => t.ID_TASA);
    this.selectedTasaKeys.set(tasaKeys);
  }

  onAplicaBaseChanged(tasa: XteinPerfilTasaRecord, value: boolean): void {
    if (this.readOnly) {
      return;
    }
    const updated = this.localTasas().map(item =>
      item.ID_TASA === tasa.ID_TASA ? { ...item, APLICA_BASE: value } : item
    );
    this.localTasas.set(updated);

    if (value) {
      const currentKeys = this.selectedTasaKeys();
      if (!currentKeys.includes(tasa.ID_TASA)) {
        this.selectedTasaKeys.set([...currentKeys, tasa.ID_TASA]);
      }
    }
  }

  onPerfilSelectionChanged(e: { selectedRowKeys: unknown[] }): void {
    if (this.readOnly) {
      return;
    }
    this.selectedPerfilKeys.set(e.selectedRowKeys);
  }

  onTasasSelectionChanged(e: { selectedRowKeys: string[] }): void {
    if (this.readOnly) {
      return;
    }
    this.selectedTasaKeys.set(e.selectedRowKeys);
  }

  accept(): void {
    if (this.readOnly) {
      this.closeModal();
      return;
    }

    // 1. Resolve Perfil Tributario string
    let busqperf = '';
    const selKeys = this.selectedPerfilKeys();
    const selectedPerfilRow = this.perfilesTributarios.find(
      item => selKeys.includes(item['ITEM'] ?? item)
    ) || (this.perfilesTributarios.length > 0 ? this.perfilesTributarios[0] : null);

    const cols = this.resolvedPerfilColumns();
    if (selectedPerfilRow && cols.length > 0) {
      for (const col of cols) {
        busqperf += (busqperf !== '' ? '|' : '') + col.dataField + ':' + (selectedPerfilRow[col.dataField] ?? '');
      }
    } else {
      const [perfilPart] = (this.value || '').split('~');
      busqperf = perfilPart;
    }

    // 2. Resolve selected Tasas
    const selTasaKeys = this.selectedTasaKeys();
    const selectedTasas = this.localTasas()
      .filter(t => selTasaKeys.includes(t.ID_TASA))
      .map(t => ({
        ID_TASA: t.ID_TASA,
        APLICA_BASE: Boolean(t.APLICA_BASE)
      }));

    const tasasStr = selectedTasas.length > 0
      ? '~' + selectedTasas.map(t => `${t.ID_TASA}^${t.APLICA_BASE ? 1 : 0}`).join('|')
      : '';

    const finalPerfilString = busqperf + tasasStr;

    this.value = finalPerfilString;
    this.onChange(this.value);

    this.perfilTasas = selectedTasas;
    this.perfilTasasChange.emit(selectedTasas);

    this.saved.emit({
      perfilTributario: finalPerfilString,
      perfilTasas: selectedTasas
    });

    this.closeModal();
  }
}
