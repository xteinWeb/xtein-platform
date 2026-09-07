import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';

import {
  DxButtonModule,
  DxCheckBoxModule,
  DxDataGridModule,
  DxDateBoxModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxTagBoxModule,
  DxTextBoxModule
} from 'devextreme-angular';

import DataSource
  from 'devextreme/data/data_source';

import CustomStore
  from 'devextreme/data/custom_store';

import {
  lastValueFrom
} from 'rxjs';

import {
  XteinRecordFilterCriterion,
  XteinRecordFilterField,
  XteinRecordFilterLookupItem,
  XteinRecordFilterResult
} from './models/xtein-record-filter.model';

import {
  XteinRecordFilterService
} from './services/xtein-record-filter.service';

import {
  XteinRecordAutoSearchComponent
} from './xtein-record-autosearch.component';


/**
 * Filtro compartido para consultas de registros XTEIN.
 *
 * La aplicación proporciona únicamente su tabla base.
 * El componente consulta la configuración del filtro y
 * devuelve la estructura que debe enviar el MFE a su
 * operación de consulta.
 */
@Component({
  selector:
    'xtein-record-filter',

  standalone:
    true,

  imports: [
    DxPopupModule,
    DxDataGridModule,
    DxDateBoxModule,
    DxTextBoxModule,
    DxCheckBoxModule,
    DxSelectBoxModule,
    DxTagBoxModule,
    DxButtonModule,
    XteinRecordAutoSearchComponent
  ],

  templateUrl:
    './xtein-record-filter.component.html',

  styleUrl:
    './xtein-record-filter.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class XteinRecordFilterComponent
  implements OnChanges {

  /**
   * Estado visible del popup.
   */
  @Input()
  visible =
    false;


  /**
   * Tabla base configurada para la aplicación.
   */
  @Input({
    required: true
  })
  tableBase =
    '';


  /**
   * Título del popup.
   */
  @Input()
  title =
    'Buscar';


  /**
   * Permite two-way binding de visible.
   */
  @Output()
  readonly visibleChange =
    new EventEmitter<boolean>();


  /**
   * Resultado final del filtro.
   */
  @Output()
  readonly search =
    new EventEmitter<XteinRecordFilterResult>();


  /**
   * Evento de cancelación.
   */
  @Output()
  readonly cancelled =
    new EventEmitter<void>();


  fields:
    XteinRecordFilterField[] =
      [];


  loading =
    false;


  errorMessage =
    '';


  readonly allowedPageSizes:
    Array<number | 'all'> =
      [
        5,
        10,
        20,
        50,
        100,
        'all'
      ];


  private readonly listSources =
    new Map<
      string,
      DataSource
    >();


  constructor(
    private readonly filterService:
      XteinRecordFilterService,

    private readonly changeDetector:
      ChangeDetectorRef
  ) {
  }


  ngOnChanges(
    changes:
      SimpleChanges
  ): void {

    if (
      (
        changes['visible'] ||
        changes['tableBase']
      ) &&
      this.visible
    ) {

      this.loadFields();
    }
  }


  /**
   * Maneja el cierre realizado por DevExtreme.
   */
  handleVisibleChange(
    visible:
      boolean
  ): void {

    this.visible =
      visible;

    this.visibleChange
      .emit(
        visible
      );

    if (!visible) {

      this.cancelled
        .emit();
    }
  }


  /**
   * Construye el mismo resultado funcional que utilizaba
   * el filtro existente:
   *
   * FILTRO + ESTRUCTURA.
   */
  executeSearch(): void {

    const structure:
      XteinRecordFilterCriterion[] =
        [];


    const expressions:
      string[] =
        [];


    for (
      const field
      of this.fields
    ) {

      const criterion =
        this.buildCriterion(
          field
        );

      if (!criterion) {

        continue;
      }

      structure.push(
        criterion.criterion
      );

      expressions.push(
        criterion.filterExpression
      );
    }


    this.visible =
      false;

    this.visibleChange
      .emit(
        false
      );


    this.search
      .emit({

        FILTRO:
          expressions
            .join(
              ' AND '
            ),

        ESTRUCTURA:
          structure
      });
  }


  cancel(): void {

    this.visible =
      false;

    this.visibleChange
      .emit(
        false
      );

    this.cancelled
      .emit();
  }


  getInlineItems(
    field:
      XteinRecordFilterField
  ): XteinRecordFilterLookupItem[] {

    return this.filterService
      .parseInlineLookup(
        field.DATA
      );
  }


  /**
   * Crea una fuente remota para DATA_TYPE=lista.
   */
  getListDataSource(
    field:
      XteinRecordFilterField
  ): DataSource {

    const key =
      field.CAMPO;


    const existing =
      this.listSources
        .get(
          key
        );

    if (existing) {

      return existing;
    }


    const source =
      new DataSource({

        paginate:
          true,

        pageSize:
          50,

        store:
          new CustomStore({

            key:
              'KEY_COL',

            load:
              async loadOptions => {

                const skip =
                  loadOptions.skip ??
                  0;


                const take =
                  loadOptions.take ??
                  50;


                const search =
                  this.extractSearchText(
                    loadOptions.filter,
                    loadOptions.searchValue
                  );


                const page =
                  await lastValueFrom(

                    this.filterService
                      .getLookupPage(
                        field.CAMPO,
                        field.DATA,
                        skip,
                        take,
                        search
                      )
                  );


                return {

                  data:
                    page.items,

                  totalCount:
                    page.totalCount
                };
              }
          })
      });


    this.listSources
      .set(
        key,
        source
      );


    return source;
  }


  setValue(
    field:
      XteinRecordFilterField,

    value:
      unknown
  ): void {

    field.VALOR =
      value ??
      '';
  }


  setDateFrom(
    field:
      XteinRecordFilterField,

    value:
      Date |
      string |
      number |
      null
  ): void {

    const current =
      this.parseDateRange(
        field.VALOR
      );


    this.setDateRange(
      field,
      value,
      current.to
    );
  }


  setDateTo(
    field:
      XteinRecordFilterField,

    value:
      Date |
      string |
      number |
      null
  ): void {

    const current =
      this.parseDateRange(
        field.VALOR
      );


    this.setDateRange(
      field,
      current.from,
      value
    );
  }


  getDateFrom(
    field:
      XteinRecordFilterField
  ): Date | null {

    return this.toDate(
      this.parseDateRange(
        field.VALOR
      )
        .from
    );
  }


  getDateTo(
    field:
      XteinRecordFilterField
  ): Date | null {

    return this.toDate(
      this.parseDateRange(
        field.VALOR
      )
        .to
    );
  }


  private loadFields(): void {

    if (
      !this.tableBase
        ?.trim()
    ) {

      this.fields =
        [];

      this.errorMessage =
        'La aplicación no tiene una tabla base configurada para búsqueda.';

      return;
    }


    this.loading =
      true;

    this.errorMessage =
      '';

    this.listSources
      .clear();


    this.filterService
      .getFields(
        this.tableBase
      )
      .subscribe({

        next:
          fields => {

            this.fields =
              fields
                .map(
                  field => ({

                    ...field,

                    VALOR:
                      field.VALOR ??
                      ''
                  })
                );


            this.loading =
              false;


            this.changeDetector
              .markForCheck();
          },

        error:
          error => {

            this.fields =
              [];

            this.loading =
              false;

            this.errorMessage =
              error?.message ??
              'No fue posible cargar los campos de búsqueda.';


            this.changeDetector
              .markForCheck();
          }
      });
  }


  private buildCriterion(
    field:
      XteinRecordFilterField
  ): {
    criterion:
      XteinRecordFilterCriterion;

    filterExpression:
      string;
  } | null {

    const value =
      field.VALOR;


    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {

      return null;
    }


    if (
      Array.isArray(
        value
      ) &&
      value.length === 0
    ) {

      return null;
    }


    const table =
      field.TABLA ??
      '';


    if (
      field.DATA_TYPE ===
      'smalldatetime'
    ) {

      const range =
        this.parseDateRange(
          value
        );


      const from =
        this.formatDate(
          range.from
        );


      const to =
        this.formatDate(
          range.to
        );


      if (
        from &&
        to
      ) {

        return {

          criterion: {

            CAMPO:
              field.CAMPO,

            EXPRESION:
              `${from}..${to}`,

            TABLA:
              table
          },

          filterExpression:
            `${field.CAMPO} BETWEEN '${from}' AND '${to}'`
        };
      }


      const single =
        from ||
        to;


      if (!single) {

        return null;
      }


      return {

        criterion: {

          CAMPO:
            field.CAMPO,

          EXPRESION:
            single,

          TABLA:
            table
        },

        filterExpression:
          `${field.CAMPO}='${this.escapeSql(single)}'`
      };
    }


    const expression =
      Array.isArray(
        value
      )
        ? JSON.stringify(
            value
          )
        : String(
            value
          );


    return {

      criterion: {

        CAMPO:
          field.CAMPO,

        EXPRESION:
          expression,

        TABLA:
          table
      },

      filterExpression:
        `${field.CAMPO}='${this.escapeSql(expression)}'`
    };
  }


  private parseDateRange(
    value:
      unknown
  ): {
    from:
      unknown;

    to:
      unknown;
  } {

    if (
      typeof value !==
        'string' ||
      !value.trim()
    ) {

      return {

        from:
          null,

        to:
          null
      };
    }


    const parts =
      value
        .split(
          ' - '
        );


    return {

      from:
        parts[0]
          ?.trim() ||
        null,

      to:
        parts[1]
          ?.trim() ||
        null
    };
  }


  private setDateRange(
    field:
      XteinRecordFilterField,

    from:
      unknown,

    to:
      unknown
  ): void {

    const fromText =
      this.formatDate(
        from
      );


    const toText =
      this.formatDate(
        to
      );


    field.VALOR =
      fromText &&
      toText
        ? `${fromText} - ${toText}`
        : (
            fromText ||
            toText ||
            ''
          );
  }


  private toDate(
    value:
      unknown
  ): Date | null {

    if (!value) {

      return null;
    }


    const date =
      value instanceof Date
        ? value
        : new Date(
            String(
              value
            )
          );


    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  }


  private formatDate(
    value:
      unknown
  ): string {

    const date =
      this.toDate(
        value
      );


    if (!date) {

      return '';
    }


    const month =
      String(
        date.getMonth() +
        1
      )
        .padStart(
          2,
          '0'
        );


    const day =
      String(
        date.getDate()
      )
        .padStart(
          2,
          '0'
        );


    return (
      `${month}/` +
      `${day}/` +
      `${date.getFullYear()}`
    );
  }


  private escapeSql(
    value:
      string
  ): string {

    return value
      .replace(
        /'/g,
        "''"
      );
  }


  private extractSearchText(
    filter:
      unknown,

    searchValue:
      unknown
  ): string {

    if (
      typeof searchValue ===
        'string' &&
      searchValue.trim()
    ) {

      return searchValue
        .trim();
    }


    if (
      !Array.isArray(
        filter
      )
    ) {

      return '';
    }


    if (
      Array.isArray(
        filter[0]
      )
    ) {

      return String(
        filter[0]?.[2] ??
        ''
      );
    }


    return String(
      filter[2] ??
      ''
    );
  }
}