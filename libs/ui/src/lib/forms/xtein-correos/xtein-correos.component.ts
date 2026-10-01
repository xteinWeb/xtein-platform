import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild, DestroyRef, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { XteinDataGridComponent } from '../../data/xtein-data-grid/xtein-data-grid.component';
import { XteinGridToolbarAction } from '../../data/xtein-data-grid/models/xtein-data-grid.model';
import { XteinInputComponent } from '../xtein-input/xtein-input.component';
import { XteinSelectComponent } from '../xtein-select/xtein-select.component';
import { XteinNotificationService } from '../../feedback/xtein-notification/xtein-notification.service';
import { XteinCorreosCatalogService } from './xtein-correos-catalog.service';

export interface XteinCorreo { ITEM?: number; EMAIL?: string; ETIQUETA?: string; isEdit?: boolean; }
interface XteinCorreoDraft extends XteinCorreo { originalItem?: number; isNew?: boolean; }

/** Editable email collection. Types come from the shared Legacy domain catalog. */
@Component({
  selector: 'xtein-correos',
  standalone: true,
  imports: [CommonModule, FormsModule, XteinDataGridComponent, XteinInputComponent, XteinSelectComponent],
  templateUrl: './xtein-correos.component.html',
  styleUrls: ['./xtein-correos.component.scss']
})
export class XteinCorreosComponent implements OnChanges, OnInit {
  @Input() readOnly = false;
  @Input() emails: XteinCorreo[] = [];
  @Output() readonly emailsChange = new EventEmitter<XteinCorreo[]>();
  @ViewChild('emailsGrid') private emailsGrid?: XteinDataGridComponent;
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly emailColumns = [
    { dataField: 'EMAIL', caption: 'Email', minWidth: 220, cellTemplate: 'xteinGroup' },
    { dataField: 'ETIQUETA', caption: 'Tipo', width: 180, cellTemplate: 'xteinGroup' }
  ];
  etiquetasEmail: string[] = [];
  catalogError = false;
  emailRows: XteinCorreo[] = [];
  selectedEmails: number[] = [];
  emailDraft: XteinCorreoDraft | null = null;
  emailToolbarActions: XteinGridToolbarAction[] = [];
  constructor(private readonly notification: XteinNotificationService, private readonly catalog: XteinCorreosCatalogService) {}
  ngOnInit(): void { this.loadTypes(); }
  ngOnChanges(): void {
    this.emailDraft = null;
    this.selectedEmails = [];
    this.rebuildEmails();
  }
  loadTypes(): void {
    this.catalogError = false;
    const subscription = this.catalog.getTypes().subscribe({
      next: types => {
        this.etiquetasEmail = types;
        this.catalogError = types.length === 0;
        this.updateEmailToolbar();
        this.cdr.markForCheck();
      },
      error: () => { this.catalogError = true; this.cdr.markForCheck(); }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  private ensureEmailKeys(list: XteinCorreo[]): XteinCorreo[] {
    let max = 0;
    for (const e of list) {
      if (e.ITEM && e.ITEM > max) max = e.ITEM;
    }
    return list.map(e => {
      if (!e.ITEM) {
        max++;
        return { ...e, ITEM: max };
      }
      return e;
    });
  }

  rebuildEmails(): void {
    const list = this.ensureEmailKeys(this.emails);
    this.emails = list;
    this.selectedEmails = this.selectedEmails.filter(key => list.some(e => e.ITEM === key));
    this.emailRows = this.emailDraft
      ? [this.emailDraft, ...list.filter(e => e.ITEM !== this.emailDraft?.originalItem)]
      : [...list];
    this.updateEmailToolbar();
  }

  onEmailSelectionChanged(keys: unknown[]): void {
    this.selectedEmails = (keys as number[]).filter(
      id => id !== -9999 && this.emails.some(e => e.ITEM === id)
    );
    this.updateEmailToolbar();
  }

  private updateEmailToolbar(): void {
    this.emailToolbarActions = this.readOnly
      ? []
      : [
          {
            id: 'add-email',
            icon: 'plus',
            variant: 'primary',
            title: 'Nuevo Correo',
            disabled: !!this.emailDraft || !this.etiquetasEmail.length,
            action: () => this.beginAddEmail()
          },
          {
            id: 'edit-email',
            icon: 'edit',
            variant: 'secondary',
            title: 'Editar correo seleccionado',
            visible: this.selectedEmails.length === 1 && !this.emailDraft,
            action: () => {
              const found = this.emails.find(e => e.ITEM === this.selectedEmails[0]);
              if (found) this.beginEditEmail(found);
            }
          },
          {
            id: 'save-email',
            icon: 'check',
            variant: 'success',
            title: 'Guardar Correo',
            visible: !!this.emailDraft,
            action: () => this.commitEmail()
          },
          {
            id: 'cancel-email',
            icon: 'undo',
            variant: 'cancel',
            title: 'Cancelar',
            visible: !!this.emailDraft,
            action: () => this.cancelEmailDraft()
          },
          {
            id: 'delete-email',
            icon: 'trash',
            variant: 'danger',
            title: 'Eliminar correos seleccionados',
            visible: this.selectedEmails.length > 0 && !this.emailDraft,
            action: () => {
              void this.removeSelectedEmails();
            }
          }
        ];
  }

  beginAddEmail(): void {
    if (this.readOnly || this.emailDraft || !this.etiquetasEmail.length) return;
    this.emailDraft = {
      ITEM: -9999,
      EMAIL: '',
      ETIQUETA: this.etiquetasEmail[0] ?? '',
      isNew: true
    };
    this.rebuildEmails();
    this.emailsGrid?.resetView();
  }

  beginEditEmail(row: XteinCorreo): void {
    if (this.readOnly || this.emailDraft) return;
    this.emailDraft = {
      ...row,
      originalItem: row.ITEM,
      isNew: false
    };
    this.rebuildEmails();
  }

  commitEmail(): void {
    if (this.readOnly || !this.emailDraft) return;
    const emailStr = (this.emailDraft.EMAIL || '').trim();
    if (!emailStr) {
      this.notification.warning('Ingrese una dirección de correo electrónico.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      this.notification.warning('El formato del correo electrónico no es válido.');
      return;
    }

    const etiqueta = this.emailDraft.ETIQUETA;
    if (!etiqueta) {
      this.notification.warning('Seleccione un tipo de correo.');
      return;
    }
    const isNew = this.emailDraft.isNew;
    const originalItem = this.emailDraft.originalItem;

    let updatedList = [...this.emails];
    if (isNew) {
      let max = Math.max(0, ...updatedList.map(e => e.ITEM || 0));
      updatedList.push({
        ITEM: max + 1,
        EMAIL: emailStr,
        ETIQUETA: etiqueta
      });
    } else {
      updatedList = updatedList.map(e => {
        if (e.ITEM === originalItem) {
          return {
            ...e,
            EMAIL: emailStr,
            ETIQUETA: etiqueta
          };
        }
        return e;
      });
    }

    this.emailDraft = null;
    this.emails = updatedList;
    this.emailsChange.emit(this.emails);
    this.rebuildEmails();
  }

  cancelEmailDraft(): void {
    this.emailDraft = null;
    this.rebuildEmails();
  }

  async removeSelectedEmails(): Promise<void> {
    if (this.readOnly || !this.selectedEmails.length) return;
    const confirm = await Swal.fire({
      title: '¿Eliminar correos?',
      text:
        this.selectedEmails.length === 1
          ? '¿Desea eliminar el correo seleccionado?'
          : `¿Desea eliminar los ${this.selectedEmails.length} correos seleccionados?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No'
    });
    if (!confirm.isConfirmed || this.readOnly) return;

    const toDelete = new Set(this.selectedEmails);
    this.emails = this.emails.filter(e => !toDelete.has(e.ITEM!));
    this.selectedEmails = [];
    this.emailsChange.emit(this.emails);
    this.rebuildEmails();
  }

}
