import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  signal
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  DecimalPipe
} from '@angular/common';

import {
  DomSanitizer,
  SafeHtml
} from '@angular/platform-browser';

import {
  Observable,
  Subscription,
  catchError,
  debounceTime,
  finalize,
  forkJoin,
  merge,
  of
} from 'rxjs';

import {
  DxDropDownBoxModule,
  DxTemplateModule
} from 'devextreme-angular';

import {
  DeniedRecordToolbarPermissions,
  RecordToolbarMode,
  RecordToolbarPermissions,
  createRecordToolbarState
} from '@xtein/sdk';

import {
  RecordToolbarPermissionsService,
  ToolbarRuntimeService,
  WorkspaceRuntimeService
} from '@xtein/runtime';

import {
  SessionService
} from '@xtein/session';

import {
  XteinButtonComponent,
  XteinDataGridComponent,
  XteinDateComponent,
  XteinGridColumn,
  XteinGridSelectionEvent,
  XteinGridToolbarAction,
  XteinLabelComponent,
  XteinLoadingComponent,
  XteinNotificationService,
  XteinSelectComponent,
  XteinTagBoxComponent
} from '@xtein/ui';

import {
  Ghu250Application,
  Ghu250LiquidationClass,
  Ghu250Step
} from './constants/ghu-250.constants';

import {
  Ghu250EmployeeColumns,
  Ghu250EmployeeLookupColumns,
  Ghu250LiquidationClassOptions,
  Ghu250Steps,
  Ghu250ToolbarCapabilities
} from './constants/ghu-250-ui.constants';

import {
  Ghu250Cause,
  Ghu250Company,
  Ghu250Concept,
  Ghu250Employee,
  Ghu250Group,
  Ghu250LiquidationResult,
  Ghu250LiquidationRow,
  Ghu250Parameters
} from './models/ghu-250.model';

import {
  Ghu250Service
} from './services/ghu-250.service';

import {
  ghu250BuildColumns,
  ghu250BuildRows,
  ghu250CloneRows,
  ghu250CollectAdjustments
} from './utils/ghu-250-liquidation.utils';

import {
  Ghu250ReportContext,
  ghu250BuildGeneralReport,
  ghu250BuildPaySlips
} from './utils/ghu-250-reports.utils';


type Ghu250Report = 'general' | 'slips';


/**
 * GHU-250 - Liquidación de prestaciones por terminación de contrato.
 *
 * Wizard without record toolbar:
 *   1. Parameters and filter.
 *   2. Selected employees.
 *   3. Generated liquidations (editable).
 *   4. Generated reports.
 */
@Component({
  selector:
    'ghu-250',

  standalone:
    true,

  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    DxDropDownBoxModule,
    DxTemplateModule,
    XteinButtonComponent,
    XteinDataGridComponent,
    XteinDateComponent,
    XteinLabelComponent,
    XteinLoadingComponent,
    XteinSelectComponent,
    XteinTagBoxComponent
  ],

  providers: [
    Ghu250Service
  ],

  templateUrl:
    './ghu-250.component.html',

  styleUrl:
    './ghu-250.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class Ghu250Component
  implements OnInit, OnDestroy {

  @ViewChild('liquidationGrid')
  private liquidationGrid?:
    XteinDataGridComponent<Ghu250LiquidationRow, string>;

  @ViewChild('reportFrame')
  private reportFrame?:
    ElementRef<HTMLIFrameElement>;


  readonly applicationId =
    Ghu250Application.Id;

  readonly Step =
    Ghu250Step;

  readonly steps =
    Ghu250Steps;

  readonly classOptions = [
    ...Ghu250LiquidationClassOptions
  ];

  readonly employeeLookupColumns =
    Ghu250EmployeeLookupColumns;

  readonly employeeColumns =
    Ghu250EmployeeColumns;

  readonly lookupToolbarActions: XteinGridToolbarAction[] = [{
    id: 'clear',
    text: 'Limpiar',
    icon: 'undo',
    variant: 'secondary',
    action: () => this.clearLookupSelection()
  }];

  readonly employeeDropDownOptions = {
    width: 'min(640px, 95vw)',
    height: 'min(440px, 75dvh)',
    hideOnParentScroll: true
  };


  readonly form =
    new FormGroup({

      CLASE_LIQUIDACION:
        new FormControl<Ghu250LiquidationClass[]>(
          [Ghu250LiquidationClass.ContractTermination],
          { nonNullable: true, validators: [Validators.required] }
        ),

      FECHA_RETIRO:
        new FormControl<string | null>(
          this.today(),
          { validators: [Validators.required] }
        ),

      ID_CAUSA:
        new FormControl<string | null>(null),

      ID_EMPRESA:
        new FormControl<string | null>(null),

      ID_GRUPO:
        new FormControl<string | null>(null)
    });


  readonly step =
    signal<Ghu250Step>(Ghu250Step.Parameters);

  readonly loading =
    signal(false);

  readonly validationRequested =
    signal(false);

  readonly causes =
    signal<Ghu250Cause[]>([]);

  readonly companies =
    signal<Ghu250Company[]>([]);

  readonly groups =
    signal<Ghu250Group[]>([]);

  readonly lookupEmployees =
    signal<Ghu250Employee[]>([]);

  readonly lookupSelectedIds =
    signal<string[]>([]);

  readonly lookupOpened =
    signal(false);

  readonly preparedEmployees =
    signal<Ghu250Employee[]>([]);

  readonly preparedSelectedIds =
    signal<string[]>([]);

  readonly liquidation =
    signal<Ghu250LiquidationResult | null>(null);

  readonly liquidationRows =
    signal<Ghu250LiquidationRow[]>([]);

  readonly liquidationColumns =
    signal<XteinGridColumn<Ghu250LiquidationRow, string>[]>([]);

  readonly activeReport =
    signal<Ghu250Report>('general');

  readonly reports =
    signal<Record<Ghu250Report, string>>({ general: '', slips: '' });

  readonly reportDocument =
    computed<SafeHtml>(() =>
      this.sanitizer.bypassSecurityTrustHtml(this.reports()[this.activeReport()]));

  readonly liquidationTotal =
    computed(() => this.liquidationRows().reduce((total, row) => total + (Number(row.TOTAL_PAGAR) || 0), 0));


  private permissions:
    Readonly<RecordToolbarPermissions> =
      DeniedRecordToolbarPermissions;

  private originalRows:
    Ghu250LiquidationRow[] = [];

  private parameters:
    Ghu250Parameters | null = null;

  private lookupRequest?:
    Subscription;

  private readonly subscriptions =
    new Subscription();


  constructor(
    private readonly ghu250Service:
      Ghu250Service,

    private readonly permissionsService:
      RecordToolbarPermissionsService,

    private readonly toolbarRuntime:
      ToolbarRuntimeService,

    private readonly workspaceRuntime:
      WorkspaceRuntimeService,

    private readonly session:
      SessionService,

    private readonly notification:
      XteinNotificationService,

    private readonly sanitizer:
      DomSanitizer
  ) {
  }


  ngOnInit():
    void {

    this.publishToolbarState();

    this.subscribeToFilterChanges();

    this.loadInitializationData();
  }


  ngOnDestroy():
    void {

    this.lookupRequest?.unsubscribe();

    this.subscriptions.unsubscribe();
  }


  /*======================================================================
  = STEP 1
  ======================================================================*/

  isInvalid(
    controlName: keyof Ghu250Component['form']['controls']
  ): boolean {

    const control = this.form.controls[controlName];

    return control.invalid && (control.touched || this.validationRequested());
  }


  selectLookupEmployees(
    event: XteinGridSelectionEvent<Ghu250Employee, string>
  ): void {

    this.setLookupSelection(event.selectedRowKeys ?? []);
  }


  changeLookupValue(
    value: unknown
  ): void {

    this.setLookupSelection(Array.isArray(value) ? value.map(String) : []);
  }


  clearLookupSelection():
    void {

    this.setLookupSelection([]);
  }


  /**
   * Step 1 -> 2: 'preparar empleados'.
   */
  prepareEmployees():
    void {

    if (this.loading()) return;

    this.validationRequested.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.notification.warning('Complete los campos requeridos.');
      return;
    }

    const parameters = this.getParameters();

    this.loading.set(true);

    this.subscriptions.add(
      this.ghu250Service
        .prepareEmployees(parameters)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: employees => {

            if (!employees.length) {
              this.notification.warning('No se encontraron empleados que cumplan con el filtro.');
              return;
            }

            this.parameters = parameters;
            this.preparedEmployees.set(employees);
            this.preparedSelectedIds.set(employees.map(employee => employee.ID_EMPLEADO));
            this.step.set(Ghu250Step.Employees);
          },
          error: error => this.showUnknownError(error, 'No fue posible consultar los empleados.')
        })
    );
  }


  /*======================================================================
  = STEP 2
  ======================================================================*/

  selectPreparedEmployees(
    event: XteinGridSelectionEvent<Ghu250Employee, string>
  ): void {

    this.preparedSelectedIds.set([...(event.selectedRowKeys ?? [])]);
  }


  /**
   * Step 2 -> 3: 'prestaciones' (PLIQ_NOMINA + benefits).
   */
  liquidate():
    void {

    if (this.loading() || !this.parameters) return;

    const employeeIds = this.preparedSelectedIds();

    if (!employeeIds.length) {
      this.notification.warning('Seleccione al menos un empleado para liquidar.');
      return;
    }

    const parameters: Ghu250Parameters = {
      ...this.parameters,
      LISTA_EMPLEADOS: [...employeeIds]
    };

    this.loading.set(true);

    this.subscriptions.add(
      this.ghu250Service
        .liquidate(parameters)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: result => {

            this.parameters = parameters;
            this.applyLiquidation(result);
            this.step.set(Ghu250Step.Liquidation);
            this.workspaceRuntime.setDirty(this.applicationId, true);

            if (result.EMPLEADOS.length < employeeIds.length) {
              this.notification.warning(
                `Se liquidaron ${result.EMPLEADOS.length} de ${employeeIds.length} empleados seleccionados.`);
            } else {
              this.notification.success('Liquidación generada correctamente.');
            }
          },
          error: error => this.showUnknownError(error, 'No fue posible generar la liquidación.')
        })
    );
  }


  /*======================================================================
  = STEP 3
  ======================================================================*/

  markLiquidationDirty():
    void {

    this.workspaceRuntime.setDirty(this.applicationId, true);
  }


  /**
   * Step 3 -> 4: stores the edited values ('ajustes') and builds the
   * general report and the individual pay slips.
   */
  async generateReports():
    Promise<void> {

    const liquidation = this.liquidation();

    if (this.loading() || !liquidation || !this.parameters) return;

    try {
      await this.liquidationGrid?.saveEditData();
    } catch (error) {
      this.showUnknownError(error, 'Revise los valores modificados.');
      return;
    }

    if (this.liquidationGrid?.hasEditData()) {
      this.notification.warning('Revise los valores modificados antes de continuar.');
      return;
    }

    const adjustments = ghu250CollectAdjustments(this.liquidationRows(), this.originalRows, liquidation.CONCEPTOS);

    if (!adjustments.length) {
      this.showReports();
      return;
    }

    this.loading.set(true);

    this.subscriptions.add(
      this.ghu250Service
        .saveAdjustments(this.parameters, liquidation.CONSECUTIVO, adjustments)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: result => {

            this.applyLiquidation(result);
            this.showReports();
          },
          error: error => this.showUnknownError(error, 'No fue posible guardar los valores modificados.')
        })
    );
  }


  /*======================================================================
  = STEP 4
  ======================================================================*/

  selectReport(
    report: Ghu250Report
  ): void {

    this.activeReport.set(report);
  }


  printReport():
    void {

    const frameWindow = this.reportFrame?.nativeElement.contentWindow;

    if (!frameWindow) return;

    frameWindow.focus();
    frameWindow.print();
  }


  downloadReport():
    void {

    const report = this.activeReport();
    const html = this.reports()[report];

    if (!html) return;

    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');

    link.href = url;
    link.download = `${this.applicationId}-${report === 'general' ? 'liquidacion-general' : 'tirillas'}-${this.liquidation()?.CONSECUTIVO ?? ''}.html`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url));
  }


  /*======================================================================
  = NAVIGATION
  ======================================================================*/

  goBack():
    void {

    if (this.loading()) return;

    switch (this.step()) {

      case Ghu250Step.Employees:
        this.step.set(Ghu250Step.Parameters);
        break;

      case Ghu250Step.Liquidation:
        this.step.set(Ghu250Step.Employees);
        break;

      case Ghu250Step.Reports:
        this.step.set(Ghu250Step.Liquidation);
        break;

      default:
        break;
    }
  }


  restart():
    void {

    if (this.loading()) return;

    this.liquidation.set(null);
    this.liquidationRows.set([]);
    this.liquidationColumns.set([]);
    this.preparedEmployees.set([]);
    this.preparedSelectedIds.set([]);
    this.reports.set({ general: '', slips: '' });
    this.activeReport.set('general');
    this.originalRows = [];
    this.parameters = null;
    this.validationRequested.set(false);
    this.step.set(Ghu250Step.Parameters);
    this.workspaceRuntime.setDirty(this.applicationId, false);
  }


  /*======================================================================
  = PRIVATE
  ======================================================================*/

  private loadInitializationData():
    void {

    this.loading.set(true);

    this.subscriptions.add(
      forkJoin({
        permissions: this.permissionsService
          .getPermissions(this.applicationId)
          .pipe(catchError(() => of(DeniedRecordToolbarPermissions))),
        causes: this.safeList(this.ghu250Service.getCauses(), 'causas'),
        companies: this.safeList(this.ghu250Service.getCompanies(), 'empresas'),
        groups: this.safeList(this.ghu250Service.getGroups(), 'grupos'),
        employees: this.safeList(this.ghu250Service.getEmployees(this.getLookupFilter()), 'empleados')
      })
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe(result => {

          this.permissions = result.permissions;
          this.causes.set(result.causes);
          this.companies.set(result.companies);
          this.groups.set(result.groups);
          this.setLookupEmployees(result.employees);
          this.publishToolbarState();
        })
    );
  }


  /**
   * Reloads the employee drop-down when company, group or retirement
   * date change.
   */
  private subscribeToFilterChanges():
    void {

    const controls = this.form.controls;

    this.subscriptions.add(
      merge(
        controls.ID_EMPRESA.valueChanges,
        controls.ID_GRUPO.valueChanges,
        controls.FECHA_RETIRO.valueChanges
      )
        .pipe(debounceTime(250))
        .subscribe(() => this.reloadLookupEmployees())
    );
  }


  private reloadLookupEmployees():
    void {

    this.lookupRequest?.unsubscribe();

    this.lookupRequest =
      this.ghu250Service
        .getEmployees(this.getLookupFilter())
        .subscribe({
          next: employees => this.setLookupEmployees(employees),
          error: error => this.showUnknownError(error, 'No fue posible cargar los empleados.')
        });
  }


  private setLookupEmployees(
    employees: Ghu250Employee[]
  ): void {

    const available = new Set(employees.map(employee => employee.ID_EMPLEADO));

    this.lookupEmployees.set(employees);
    this.setLookupSelection(this.lookupSelectedIds().filter(id => available.has(id)));
  }


  /**
   * Avoids selection feedback loops between the drop-down value and
   * the inner grid selection.
   */
  private setLookupSelection(
    ids: readonly string[]
  ): void {

    const next = [...ids];
    const current = this.lookupSelectedIds();

    if (next.length === current.length && next.every((id, index) => id === current[index])) return;

    this.lookupSelectedIds.set(next);
  }


  private applyLiquidation(
    result: Ghu250LiquidationResult
  ): void {

    const rows = ghu250BuildRows(result);

    this.liquidation.set(result);
    this.liquidationColumns.set(ghu250BuildColumns(result.CONCEPTOS));
    this.liquidationRows.set(rows);
    this.originalRows = ghu250CloneRows(rows);
  }


  private showReports():
    void {

    const context = this.getReportContext();

    this.reports.set({
      general: ghu250BuildGeneralReport(context),
      slips: ghu250BuildPaySlips(context)
    });

    this.activeReport.set('general');
    this.step.set(Ghu250Step.Reports);
    this.workspaceRuntime.setDirty(this.applicationId, false);
  }


  private getReportContext():
    Ghu250ReportContext {

    const parameters = this.parameters;
    const liquidation = this.liquidation();
    const session = this.session.current;
    const company = this.companies().find(item => item.ID_EMPRESA === parameters?.ID_EMPRESA);
    const cause = this.causes().find(item => item.ID_CAUSA === parameters?.ID_CAUSA);

    return {
      companyName: company?.NOMBRE ?? session?.companyName ?? '',
      userName: session?.userName ?? session?.userId ?? '',
      retirementDate: liquidation?.FECHA_RETIRO ?? parameters?.FECHA_RETIRO ?? null,
      cause: cause?.DESCRIPCION ?? parameters?.ID_CAUSA ?? '',
      liquidationClasses: this.describeClasses(parameters?.CLASE_LIQUIDACION ?? []),
      consecutive: liquidation?.CONSECUTIVO ?? null,
      concepts: liquidation?.CONCEPTOS ?? ([] as Ghu250Concept[]),
      rows: this.liquidationRows()
    };
  }


  private describeClasses(
    classes: readonly Ghu250LiquidationClass[]
  ): string {

    return this.classOptions
      .filter(option => classes.includes(option.value))
      .map(option => option.text)
      .join(', ');
  }


  private getParameters():
    Ghu250Parameters {

    const value = this.form.getRawValue();

    return {
      CLASE_LIQUIDACION: [...(value.CLASE_LIQUIDACION ?? [])],
      FECHA_RETIRO: value.FECHA_RETIRO,
      ID_CAUSA: value.ID_CAUSA || null,
      ID_EMPRESA: value.ID_EMPRESA || null,
      ID_GRUPO: value.ID_GRUPO || null,
      LISTA_EMPLEADOS: [...this.lookupSelectedIds()]
    };
  }


  private getLookupFilter():
    Pick<Ghu250Parameters, 'FECHA_RETIRO' | 'ID_EMPRESA' | 'ID_GRUPO'> {

    const value = this.form.getRawValue();

    return {
      FECHA_RETIRO: value.FECHA_RETIRO,
      ID_EMPRESA: value.ID_EMPRESA || null,
      ID_GRUPO: value.ID_GRUPO || null
    };
  }


  private safeList<T>(
    request: Observable<T[]>,
    listName: string
  ): Observable<T[]> {

    return request.pipe(
      catchError(error => {
        this.showUnknownError(error, `No fue posible cargar la lista de ${listName}.`);
        return of([] as T[]);
      })
    );
  }


  private publishToolbarState():
    void {

    this.toolbarRuntime
      .setState(
        createRecordToolbarState({
          busy: this.loading(),
          applicationId: this.applicationId,
          mode: RecordToolbarMode.Initial,
          permissions: this.permissions,
          capabilities: Ghu250ToolbarCapabilities,
          currentIndex: 0,
          totalRecords: 0
        })
      );
  }


  private today():
    string {

    const now = new Date();

    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');
  }


  private showUnknownError(
    error: unknown,
    fallbackMessage: string
  ): void {

    console.error('GHU-250 operation failed.', error);

    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : fallbackMessage;

    this.notification.error(message);
  }
}
