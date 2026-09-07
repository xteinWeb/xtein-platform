import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';

import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';

import {
  XteinRecordFilterLookupItem
} from './models/xtein-record-filter.model';

import {
  XteinRecordFilterService
} from './services/xtein-record-filter.service';


/**
 * Control compartido de búsqueda automática utilizado
 * por los campos DATA_TYPE=searchbox.
 */
@Component({
  selector:
    'xtein-record-autosearch',

  standalone:
    true,

  imports: [
    CommonModule,
    ReactiveFormsModule
  ],

  template: `
    <div class="xtein-autosearch">

      <input
        type="text"
        class="xtein-autosearch__input"
        [formControl]="searchControl"
        placeholder="Buscar..."
        (focus)="handleFocus()" />

      @if (showResults) {

        <div class="xtein-autosearch__panel">

          @if (loading) {

            <div class="xtein-autosearch__status">
              Buscando...
            </div>

          } @else if (results.length === 0) {

            <div class="xtein-autosearch__status">
              No se encontraron datos
            </div>

          } @else {

            <div class="xtein-autosearch__actions">

              <button
                type="button"
                (click)="acceptSelection()">

                Seleccionar

              </button>

            </div>

            <div class="xtein-autosearch__table-wrap">

              <table class="xtein-autosearch__table">

                <thead>

                  <tr>

                    <th class="xtein-autosearch__check">
                    </th>

                    @for (
                      column of columns;
                      track column
                    ) {

                      <th>
                        {{ column }}
                      </th>
                    }

                  </tr>

                </thead>

                <tbody>

                  @for (
                    item of results;
                    track item
                  ) {

                    <tr>

                      <td class="xtein-autosearch__check">

                        <input
                          type="checkbox"
                          [checked]="isSelected(item)"
                          (change)="toggleSelection(item)" />

                      </td>

                      @for (
                        column of columns;
                        track column
                      ) {

                        <td>
                          {{ item[column] }}
                        </td>
                      }

                    </tr>
                  }

                </tbody>

              </table>

            </div>
          }

        </div>
      }

    </div>
  `,

  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .xtein-autosearch {
      position: relative;
      width: 100%;
    }

    .xtein-autosearch__input {
      width: 100%;
      min-height: 34px;
      box-sizing: border-box;
      border: 1px solid rgba(36, 77, 115, .25);
      border-radius: 6px;
      padding: 6px 10px;
      background: #fff;
      color: inherit;
    }

    .xtein-autosearch__panel {
      position: absolute;
      z-index: 2000;
      top: calc(100% + 4px);
      left: 0;

      min-width: 100%;
      width: max-content;

      max-width: min(760px, 80vw);
      max-height: 320px;

      overflow: hidden;

      border: 1px solid rgba(36, 77, 115, .18);
      border-radius: 8px;

      background: #fff;

      box-shadow:
        0 8px 24px
        rgba(24, 52, 78, .18);
    }

    .xtein-autosearch__status {
      min-width: 260px;
      padding: 12px;
    }

    .xtein-autosearch__actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px;

      border-bottom:
        1px solid
        rgba(36, 77, 115, .12);
    }

    .xtein-autosearch__actions button {
      border: 0;
      border-radius: 6px;

      padding: 6px 14px;

      background: #0f4c81;
      color: #fff;

      cursor: pointer;
    }

    .xtein-autosearch__table-wrap {
      overflow: auto;
      max-height: 260px;
    }

    .xtein-autosearch__table {
      border-collapse: collapse;
      min-width: 100%;
      font-size: 12px;
    }

    .xtein-autosearch__table th,
    .xtein-autosearch__table td {
      padding: 6px 8px;

      border-bottom:
        1px solid
        rgba(36, 77, 115, .10);

      white-space: nowrap;
      text-align: left;
    }

    .xtein-autosearch__table th {
      position: sticky;
      top: 0;

      background: #f7f9fb;

      z-index: 1;
    }

    .xtein-autosearch__check {
      width: 34px;
      text-align: center !important;
    }
  `],

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class XteinRecordAutoSearchComponent
  implements OnInit, OnDestroy {

  @Input({
    required: true
  })
  specification = '';

  @Input()
  value = '';

  @Output()
  readonly valueChange =
    new EventEmitter<string>();


  readonly searchControl =
    new FormControl(
      '',
      {
        nonNullable:
          true
      }
    );


  results:
    XteinRecordFilterLookupItem[] =
      [];

  columns:
    string[] =
      [];

  loading =
    false;

  showResults =
    false;


  private selected:
    XteinRecordFilterLookupItem[] =
      [];


  private readonly destroy$ =
    new Subject<void>();


  constructor(
    private readonly filterService:
      XteinRecordFilterService,

    private readonly changeDetector:
      ChangeDetectorRef
  ) {
  }


  ngOnInit(): void {

    this.searchControl
      .setValue(
        this.value ?? '',
        {
          emitEvent:
            false
        }
      );


    this.searchControl
      .valueChanges
      .pipe(

        debounceTime(
          300
        ),

        distinctUntilChanged(),

        tap(term => {

          this.showResults =
            Boolean(
              term.trim()
            );

          this.loading =
            Boolean(
              term.trim()
            );

          this.changeDetector
            .markForCheck();
        }),

        switchMap(term => {

          const normalized =
            term.trim();

          if (!normalized) {

            return of([]);
          }

          return this.filterService
            .autoSearch(
              this.specification,
              normalized
            );
        }),

        takeUntil(
          this.destroy$
        )
      )
      .subscribe({

        next:
          items => {

            this.results =
              items;

            this.columns =
              items.length > 0
                ? Object
                    .keys(
                      items[0]
                    )
                    .filter(
                      column =>
                        ![
                          'ErrMensaje',
                          'TotalCount',
                          'RN'
                        ]
                          .includes(
                            column
                          )
                    )
                : [];

            this.loading =
              false;

            this.changeDetector
              .markForCheck();
          },

        error:
          () => {

            this.results =
              [];

            this.columns =
              [];

            this.loading =
              false;

            this.changeDetector
              .markForCheck();
          }
      });
  }


  handleFocus(): void {

    if (
      this.searchControl
        .value
        .trim()
    ) {

      this.showResults =
        true;
    }
  }


  isSelected(
    item:
      XteinRecordFilterLookupItem
  ): boolean {

    return this.selected
      .includes(
        item
      );
  }


  toggleSelection(
    item:
      XteinRecordFilterLookupItem
  ): void {

    if (
      this.isSelected(
        item
      )
    ) {

      this.selected =
        this.selected
          .filter(
            current =>
              current !== item
          );

      return;
    }

    this.selected = [
      ...this.selected,
      item
    ];
  }


  acceptSelection(): void {

    if (
      this.selected.length === 0 ||
      this.columns.length === 0
    ) {

      return;
    }


    const keyColumn =
      this.columns[0];


    const value =
      this.selected
        .map(item =>
          String(
            item[keyColumn] ??
            ''
          )
            .trim()
        )
        .filter(Boolean)
        .join(';');


    this.searchControl
      .setValue(
        value,
        {
          emitEvent:
            false
        }
      );


    this.value =
      value;

    this.showResults =
      false;


    this.valueChange
      .emit(
        value
      );
  }


  ngOnDestroy(): void {

    this.destroy$
      .next();

    this.destroy$
      .complete();
  }
}