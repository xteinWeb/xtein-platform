import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DxDataGridModule, DxDataGridComponent, DxDateBoxModule, DxNumberBoxModule, DxLoadPanelModule, DxPopupModule, DxButtonModule, DxDropDownBoxModule, DxValidatorModule, DxTextBoxModule, DxSelectBoxModule, DxPopupComponent } from 'devextreme-angular';
import { Observable, Subscription } from 'rxjs';
import { PRO034Service } from 'src/app/services/PRO034/PRO034.service';
import { MatDividerModule } from '@angular/material/divider';
import Swal from 'sweetalert2';
import { showToast } from '../../../shared/toast/toastComponent';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-PRO03402',
    templateUrl: './PRO03402.component.html',
    styleUrls: ['./PRO03402.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        DxDataGridModule,
        DxDateBoxModule,
        DxNumberBoxModule,
        DxLoadPanelModule,
        DxPopupModule,
        DxButtonModule,
        DxDropDownBoxModule,
        DxValidatorModule,
        DxTextBoxModule,
        DxSelectBoxModule,
        MatDividerModule,
        CdkAccordionModule
    ],
    providers: [DatePipe]
})
export class PRO03402Component implements OnInit, OnDestroy {
    @ViewChild("gridProductos", { static: false }) gridProductos: DxDataGridComponent;
    @ViewChild("popupEnvioCorreo", { static: false }) popupEnvioCorreo: DxPopupComponent;

    @Input() events: Observable<any>;
    @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();

    private eventsSubscription: Subscription;

    // State
    readOnly: boolean = true;
    USUARIO_LOCAL: string = '';
    conCambios: number = 0;
    loadingVisible: boolean = false;
    activeConsults: number = 0;
    accordionExpand: boolean[] = [true];
    gridHeight: string | number = 400;
    planOriginal: string = '';
    // Grid operations (PRO022 style)
    rowEdit: boolean = false;
    rowApplyChanges: boolean = false;
    filasSelecc: any[] = [];
    filasSelectData: any[] = [];

    // Popup State (Reprogram/Cancel)
    popupVisible: boolean = false;
    popupAccion: string = '';
    popupTitulo: string = '';
    popupData: any = {};
    popupAccionGrid: string = '';
    selectPlanPopup: any = {};
    anteriorPlanPopup: any = {};
    openPlanPopup: boolean = false;
    FECHA_INICIO_POPUP: any = null;
    FECHA_FIN_POPUP: any = null;
    FECHA_DIA_POPUP: any = null;
    DGplanes: any[] = [];
    DGCapacidad: any = {};
    NOW: Date = new Date();
    plantSummaryColumns: string[] = [];
    gridColumns: any[] = [];
    gridSummaryConfig: any = { groupItems: [], totalItems: [] };

    // Compromise Selection Flow

    fechaSeleccionadaComprometer: any = null;
    popupComprometerOC: boolean = false;
    ordenCompra: string = '';
    modoOperacionOC: 'COMPROMETER' | 'AGREGAR_OC' = 'COMPROMETER';
    modoComprometerActivo: boolean = false;
    modoEnvioCorreoActivo: boolean = false;
    popupEnvioCorreoVisible: boolean = false;
    clienteSeleccionadoEnvio: string = '';
    listaClientesEnvio: string[] = [];
    productosFiltradosEnvio: any[] = [];

    // Popup Export Export Excel
    popupExportarExcel: boolean = false;
    estadosExportar: string[] = [];
    estadoSeleccionadoExportar: string = '';

    // Data
    DGproductos: any[] = [];
    selectPlanes: any[] = []; // ID of selected plan

    // Formatting/Summaries
    summaryGroupItems: any[] = [
        { column: 'CANTIDAD_PROGRAMADA', summaryType: 'sum', valueFormat: '#,##0.##', displayFormat: '{0}', alignByColumn: true, showInGroupFooter: false },
        { column: 'TOTAL', summaryType: 'sum', valueFormat: '#,##0', displayFormat: '{0}', alignByColumn: true, showInGroupFooter: false }
    ];
    totalSummaryItems: any[] = [
        { column: 'CANTIDAD_PROGRAMADA', summaryType: 'sum', valueFormat: '#,##0.##', displayFormat: '{0}', alignByColumn: true },
        { column: 'TOTAL', summaryType: 'sum', valueFormat: '#,##0', displayFormat: '{0}', alignByColumn: true }
    ];

    // Plan dates for reloading
    planFechas: any = { inicio: null, final: null };

    constructor(
        private sData: PRO034Service,
        private datePipe: DatePipe
    ) {
        this.onContentReady = this.onContentReady.bind(this);
    }

    ngOnInit(): void {
        this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase() || '';

        this.eventsSubscription = this.events.subscribe((datos: any) => {
            if (datos.componente === 'PRO03402' || !datos.componente) {
                this.handleEvents(datos);
            }
        });

        this.initGridConfig();
        this.valoresObjetos('PLANES PROD');
    }

    initGridConfig() {
        this.gridColumns = [
            {
                dataField: 'FECHA_PROGRAMADA',
                caption: 'Fecha programada',
                dataType: 'date',
                format: 'dd/MM/yyyy',
                groupIndex: 0,
                sortIndex: 0,
                sortOrder: 'asc'
            },
            {
                dataField: 'DOCUMENTO_PEDIDO',
                caption: 'Pedido',
                width: 100,
                allowEditing: false
            },
            {
                dataField: 'PRODUCTO',
                caption: 'Cod. Prod.',
                width: 120,
                allowEditing: false
            },
            {
                dataField: 'NOMBRE_PRODUCTO',
                caption: 'Producto',
                allowEditing: false
            },
            {
                dataField: 'CANTIDAD_PROGRAMADA',
                caption: 'Cant. Proyectada',
                dataType: 'number',
                format: '#,##0.##',
                width: 120
            },
            {
                dataField: 'TOTAL',
                caption: 'Total',
                dataType: 'number',
                format: '#,##0',
                width: 100,
                allowEditing: false
            },
            {
                dataField: 'ESTADO',
                caption: 'Estado',
                width: 110,
                allowEditing: false,
                headerFilter: {
                    dataSource: [
                        { text: 'PROYECTADO', value: 'PROYECTADO' },
                        { text: 'PROGRAMADO', value: 'PROGRAMADO' },
                        { text: 'COMPROMETIDO', value: 'COMPROMETIDO' },
                        { text: 'FINALIZADO', value: 'FINALIZADO' }
                    ]
                }
            }
        ];

        this.gridSummaryConfig = {
            groupItems: [
                { column: 'CANTIDAD_PROGRAMADA', summaryType: 'sum', valueFormat: '#,##0.##', displayFormat: '{0}', alignByColumn: true, showInGroupFooter: false },
                { column: 'TOTAL', summaryType: 'sum', valueFormat: '#,##0', displayFormat: '{0}', alignByColumn: true, showInGroupFooter: false }
            ],
            totalItems: [
                { column: 'CANTIDAD_PROGRAMADA', summaryType: 'sum', valueFormat: '#,##0.##', displayFormat: '{0}' },
                { column: 'TOTAL', summaryType: 'sum', valueFormat: '#,##0', displayFormat: '{0}' }
            ]
        };
    }

    ngOnDestroy(): void {
        if (this.eventsSubscription) {
            this.eventsSubscription.unsubscribe();
        }
    }

    handleEvents(datos: any): void {

        switch (datos.accion) {
            case 'set_readOnly':
                this.readOnly = datos.valor;
                break;
            case 'plan_seleccionado':
                this.selectPlanes = [datos.data.CONSECUTIVO];
                this.planFechas = { inicio: datos.data.FECHA_INICIO, final: datos.data.FECHA_FINAL };
                this.loadData();
                break;
            case 'plan_deseleccionado':
                this.selectPlanes = [];
                this.DGproductos = [];
                this.planFechas = { inicio: null, final: null };
                break;
            case 'refresh_data':
            case 'load_data':
                this.filasSelecc = [];
                this.filasSelectData = [];
                if (this.gridProductos && this.gridProductos.instance) {
                    this.gridProductos.instance.clearSelection();
                }
                this.loadData();
                break;
        }
    }

    decreaseActiveConsults() {
        this.activeConsults--;
        if (this.activeConsults <= 0) {
            this.loadingVisible = false;
        }
    }

    loadData(planData?: any): void {
        if (this.selectPlanes.length === 0) return;


        this.activeConsults = 2;
        this.loadingVisible = true;
        this.DGproductos = []; // Clear current data

        const prm: any = { ID_PLAN: this.selectPlanes[0] };

        // Use provided data or stored dates
        const inicio = planData ? planData.FECHA_INICIO : this.planFechas.inicio;
        const final = planData ? planData.FECHA_FINAL : this.planFechas.final;

        if (inicio) prm.FECHA_INICIO = inicio;
        if (final) prm.FECHA_FINAL = final;

        this.sData.consulta('PEDIDOS PMP', prm, 'PRO-023').subscribe((data: any) => {
            let res: any[] = [];
            try {
                res = data.data ? JSON.parse(data.data) : [];
            } catch (e) {
                console.error('Error parsing PEDIDOS PMP:', e, data.data);
                showToast('Error en formato de datos de pedidos', 'error');
                this.loadingVisible = false;
                return;
            }

            if (res && res.length > 0 && res[0].ErrMensaje && res[0].ErrMensaje !== '') {
                showToast(res[0].ErrMensaje, 'error');
                this.loadingVisible = false;
            } else {
                // Filter programmed products (anything with ORDEN_PRO or not in PEDIDO/CANCELADO state)
                const newData = res.filter((d: any) =>
                    (d.ORDEN_PRO !== null && d.ORDEN_PRO !== undefined && d.ORDEN_PRO !== '') ||
                    (d.ESTADO !== 'PEDIDO' && d.ESTADO !== 'CANCELADO')
                );



                this.calcularPorcentajes(res);
                this.emitirTotales(res);

                if (newData.length > 0) {
                    // Initialize quantities for the grid
                    newData.forEach((d: any) => {
                        d.CANTIDAD = parseFloat(d.CANTIDAD) || 0;
                        d.CANTIDAD_PROGRAMADA = parseFloat(d.CANTIDAD_PROGRAMADA) || 0;
                        d.CANTIDAD_PENDIENTE = d.CANTIDAD - d.CANTIDAD_PROGRAMADA;
                    });
                    this.subirProductos(newData, 'DGproductos', 'Consulta');
                } else {
                    this.DGproductos = [];
                    this.decreaseActiveConsults();
                }
            }
        });


        this.sData.consulta('CAPACIDAD', prm, 'PRO-023').subscribe({
            next: (data: any) => {
                try {
                    this.DGCapacidad = data.data ? JSON.parse(data.data)[0] : [];

                    this.calcularPorcentajes(this.DGproductos);

                } catch (e) {
                    console.error('Error parsing CAPACIDAD:', e, data.data);
                    this.decreaseActiveConsults();
                    return;
                }

                // if (resB.length > 0 && resB[0].ErrMensaje && resB[0].ErrMensaje !== '') {
                //     // silent error if needed or showToast
                // } else {
                //     console.log(data)
                //     // this.DGCapacidad = resB;
                //     // this.calcularPorcentajes(this.DGproductos); // Recalculate with capacity info
                //     // if (this.gridProductos) this.gridProductos.instance.refresh();
                // }
                this.decreaseActiveConsults();
            },
            error: (err: any) => {
                console.error('Error in CAPACIDAD:', err);
                this.decreaseActiveConsults();
            }
        });

    }

    async subirProductos(datos: any, grid: string, metodo: string) {
        const res = datos;
        for (let i = 0; i < res.length; i++) {
            res[i].ITEM = i;
            res[i].ID_PLAN = this.selectPlanes[0];
        }

        if (metodo === 'Consulta') {
            const prm = { PRODUCTOS: res };
            this.sData.consulta('PROGRAMACION', prm, 'PRO-023').subscribe({
                next: (data: any) => {
                    this.decreaseActiveConsults();
                    let resB: any[] = [];
                    try {
                        resB = data.data ? JSON.parse(data.data) : [];
                    } catch (e) {
                        console.error('Error parsing PROGRAMACION:', e, data.data);
                        showToast('Error en formato de datos de programación', 'error');
                        return;
                    }

                    if (resB.length > 0 && resB[0].ErrMensaje && resB[0].ErrMensaje !== '') {
                        showToast(resB[0].ErrMensaje, 'error');
                    } else {
                        this.addColumn(resB, 'DGproductos');
                    }
                },
                error: (err: any) => {
                    console.error('Error in PROGRAMACION:', err);
                    this.decreaseActiveConsults();
                    showToast('Error al consultar programación', 'error');
                }
            });
        }
    }

    addColumn(data: any, grid: string) {
        if (grid === 'DGproductos') {
            data.forEach((element: any) => {
                const npos = this.DGproductos.findIndex((d: any) =>
                    d.DOCUMENTO_PEDIDO === element.DOCUMENTO_PEDIDO &&
                    d.PRODUCTO === element.PRODUCTO &&
                    d.FECHA_PROGRAMADA === element.FECHA_PROGRAMADA
                );

                if (npos !== -1) {
                    this.DGproductos[npos] = { ...this.DGproductos[npos], ...element };
                } else {
                    this.DGproductos.push(element);
                }

                // Dynamic columns for Plantas
                const Plantas = Object.keys(element).filter(key => key.startsWith("PL"));
                if (Plantas.length > 0) {
                    const indexCantidad = this.gridColumns.findIndex((d: any) => d.dataField === 'CANTIDAD_PROGRAMADA');
                    let nextIndex = indexCantidad !== -1 ? indexCantidad + 1 : 1;

                    Plantas.forEach((key) => {
                        const existe = this.gridColumns.find((d: any) => d.dataField === key);
                        if (!existe) {
                            // Insert column in reactive array
                            this.gridColumns.splice(nextIndex++, 0, {
                                dataField: key,
                                caption: key,
                                alignment: 'right',
                                format: "#,##0"
                            });

                            // Add summaries to reactive config
                            this.gridSummaryConfig.groupItems.push({
                                column: key,
                                summaryType: 'sum',
                                valueFormat: '#,##0',
                                displayFormat: '{0}',
                                alignByColumn: true,
                                showInGroupFooter: false
                            });

                            this.gridSummaryConfig.totalItems.push({
                                column: key,
                                summaryType: 'sum',
                                valueFormat: '#,##0',
                                displayFormat: '{0}'
                            });
                        }
                    });
                }
            });

            this.gridColumns = [...this.gridColumns];
            this.gridSummaryConfig = { ...this.gridSummaryConfig };

            if (this.gridProductos) {
                this.gridProductos.instance.refresh();
            }
        }
    }

    onContentReady(e: any) {
        if (e.component) {
            e.component.columnOption("command:edit", "visible", false);
        }
    }

    selectionGrid(e: any) {
        if ((this.modoComprometerActivo || this.modoEnvioCorreoActivo) && e.currentSelectedRowKeys && e.currentSelectedRowKeys.length > 0) {
            const invalidKeys: any[] = [];
            e.currentSelectedRowKeys.forEach((key: any) => {
                const rowData = this.DGproductos.find((d: any) => d.ITEM === key);
                if (rowData) {
                    let valid = true;

                    if (this.modoComprometerActivo) {
                        const dateMatches = this.formatFecha(rowData.FECHA_PROGRAMADA) === this.formatFecha(this.fechaSeleccionadaComprometer);
                        valid = dateMatches;
                        if (this.modoOperacionOC === 'COMPROMETER' && rowData.ESTADO !== 'PROYECTADO') {
                            valid = false;
                        }
                    } else if (this.modoEnvioCorreoActivo) {
                        if (rowData.ESTADO !== 'PROYECTADO') {
                            valid = false;
                        }
                    }

                    if (!valid) {
                        invalidKeys.push(key);
                    }
                }
            });

            if (invalidKeys.length > 0) {
                setTimeout(() => {
                    if (this.gridProductos && this.gridProductos.instance) {
                        this.gridProductos.instance.deselectRows(invalidKeys);
                    }
                });
                const msg = this.modoComprometerActivo
                    ? 'Solo puede seleccionar productos válidos de la fecha en curso.'
                    : 'Solo puede seleccionar productos en estado PROYECTADO.';
                showToast(msg, 'warning');
            }
        }

        this.filasSelecc = e.selectedRowKeys;
        this.filasSelectData = e.selectedRowsData;

        // Use a flag to avoid layout thrashing during mass selection if any
        const isSingleSelected = this.filasSelecc.length === 1;
        this.rowEdit = isSingleSelected && !this.rowApplyChanges;
    }

    operGrid(e: any, operacion: string) {
        if (!this.gridProductos || !this.gridProductos.instance) return;

        switch (operacion) {
            case 'edit':
                if (this.filasSelecc.length === 0) return;

                const key = this.filasSelecc[0];
                const rowData = this.filasSelectData[0];

                // Only allow editing COMPROMETIDO products
                // if (rowData.ESTADO !== 'PROYECTADO') {
                //     showToast('Solo se pueden editar productos en estado COMPROMETIDO', 'warning');
                //     return;
                // }

                const index = this.gridProductos.instance.getRowIndexByKey(key);
                if (index !== -1) {
                    this.gridProductos.instance.editRow(index);
                    this.rowApplyChanges = true;
                    this.rowEdit = false;
                }
                break;

            case 'save':
                this.gridProductos.instance.saveEditData();
                break;

            case 'cancel':
                this.gridProductos.instance.cancelEditData();
                this.rowApplyChanges = false;
                if (this.filasSelecc.length === 1) {
                    this.rowEdit = true;
                }
                break;

            case 'delete':
                if (this.filasSelecc.length === 0) return;

                const rowToDelete = this.filasSelectData[0];

                Swal.fire({
                    title: '¿Eliminar programación?',
                    text: `El producto ${rowToDelete.PRODUCTO} se eliminará de la programación.`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#DF3E3E',
                    cancelButtonColor: '#438ef1',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'No'
                }).then((result) => {
                    if (result.isConfirmed) {
                        this.loadingVisible = true;

                        // Create a copy of the row data to modify
                        const updatedRow = { ...rowToDelete };

                        // Store original quantity to notify the update
                        updatedRow.CANTIDAD_CAMBIO = updatedRow.CANTIDAD_PROGRAMADA;

                        // Reset values
                        updatedRow.CANTIDAD_PROGRAMADA = 0;
                        updatedRow.CANTIDAD_PENDIENTE = updatedRow.CANTIDAD;
                        updatedRow.TOTAL = 0;

                        // Execute update
                        this.opPrepararGuardar('UPDATE AGENDA', 'AGENDA', [updatedRow])
                            .then((dataRes: any) => {
                                // Notify parent to refresh grids
                                this.onRespuestaComponent.emit({
                                    accion: 'productos_programados',
                                    data: dataRes
                                });
                                // loadData() will be called by the parent trigger if needed,
                                // but we call it here too to be safe and local.
                                this.loadData();
                            })
                            .catch((err) => {
                                console.error('Error deleting programmed quantity:', err);
                                showToast('Error al eliminar la programación', 'error');
                            })
                            .finally(() => {
                                this.loadingVisible = false;
                            });
                    }
                });
                break;
        }
    }

    onRowUpdating(e: any): void {
        const fieldName = 'CANTIDAD_PROGRAMADA';
        if (e.newData.hasOwnProperty(fieldName)) {
            const val = parseFloat(e.newData[fieldName]) || 0;
            const cantTotal = parseFloat(e.oldData.CANTIDAD) || 0;
            const valUnitario = parseFloat(e.oldData.VALOR_UNITARIO) || 0;

            // Updated values
            e.newData.CANTIDAD_PENDIENTE = cantTotal - val;
            e.newData.TOTAL = val * valUnitario;
            e.newData.CANTIDAD_CAMBIO = e.oldData.CANTIDAD_PROGRAMADA || 0;
        }
    }

    onRowUpdated(e: any): void {
        const operacion = 'UPDATE AGENDA';
        const updatedData = { ...e.data };

        this.loadingVisible = true;

        this.opPrepararGuardar(operacion, 'AGENDA', [updatedData])
            .then((dataRes: any) => {
                // Notify parent to refresh Pending grid
                this.onRespuestaComponent.emit({
                    accion: 'productos_programados',
                    data: dataRes
                });
            })
            .catch((err) => {
                console.error('Error saving quantity:', err);
                showToast('Error al guardar los cambios', 'error');
                this.loadData(); // Revert on error
            })
            .finally(() => {
                this.loadingVisible = false;
                this.rowApplyChanges = false;
                if (this.filasSelecc.length === 1) {
                    this.rowEdit = true;
                }
            });
    }

    onRowValidating(e: any): void {
        const fieldName = 'CANTIDAD_PROGRAMADA';
        if (e.newData.hasOwnProperty(fieldName)) {
            const newVal = parseFloat(e.newData[fieldName]) || 0;
            const oldVal = parseFloat(e.oldData[fieldName]) || 0;

            if (newVal > oldVal) {
                e.isValid = false;
                e.errorText = `La cantidad programada (${newVal}) no puede ser mayor a la actual (${oldVal}). Solo se permiten valores menores.`;
                showToast(e.errorText, 'warning');
            }
        }
    }

    async opPrepararGuardar(accion: string, tipo: string, datos: any, extraParams: any = {}): Promise<any> {
        const idPlan = this.selectPlanes[0];
        console.log("plan original", this.planOriginal);
        const productosConPlan = datos.map(d => ({
            ...d,
            ID_PLAN: (accion === 'REPROGRAMAR' || accion === 'CANCELAR') ? d.ID_PLAN : idPlan,
            ID_PLAN_ANTERIOR: (accion === 'REPROGRAMAR' || accion === 'CANCELAR') ? this.selectPlanes[0] : this.selectPlanes[0],
        }));
        const prm = { PRODUCTOS: productosConPlan, USUARIO: this.USUARIO_LOCAL, TIPO: tipo, ...extraParams };
        return new Promise((resolve, reject) => {
            this.sData.save(accion, prm).subscribe({
                next: (data) => {
                    let res: any[] = [];
                    try {
                        res = data.data ? JSON.parse(data.data) : [];
                    } catch (e) {
                        console.error('Error parsing save response:', e, data.data);
                        showToast('Error al procesar respuesta del servidor', 'error');
                        reject(e);
                        return;
                    }
                    if (res && res.length > 0 && res[0].ErrMensaje && res[0].ErrMensaje !== '') {
                        if (accion == "REPROGRAMAR" && res[0].CONFIRMAR == true) {
                            Swal.fire({
                                title: '¿Confirmar reprogramación?',
                                text: res[0].ErrMensaje,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Sí, reprogramar',
                                cancelButtonText: 'No, cancelar',
                                confirmButtonColor: '#3085d6',
                                cancelButtonColor: '#d33',
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    // Reintentar con el parámetro confirmar en true
                                    this.opPrepararGuardar(accion, tipo, datos, { ...extraParams, CONFIRMAR: "SI" })
                                        .then(resolve)
                                        .catch(reject);
                                } else {
                                    reject(res[0]);
                                }
                            });
                        } else {
                            showToast(res[0].ErrMensaje, 'error');
                            reject(res[0]);
                        }
                    } else {
                        showToast('Registro actualizado', 'success');
                        resolve(res);
                    }
                },
                error: (err) => {
                    showToast('Error al guardar', 'error');
                    reject(err);
                }
            });
        });
    }

    calcularPorcentajes(res: any[]) {
        let totalCantMes = 0;
        let totalCantProgramado = 0;
        let totalCantComprometido = 0;
        let totalCantEnProceso = 0;
        let totalCantFinalizado = 0;

        res.forEach(d => {
            // Define the contribution to the total base:
            // - If it's still in the pool ('PEDIDO'), its demand is what's left to program.
            // - If it's in agenda, its demand is what was programmed.
            const cantProg = parseFloat(d.CANTIDAD_PROGRAMADA) || 0;
            const cantPend = (d.CANTIDAD_PENDIENTE !== undefined && d.CANTIDAD_PENDIENTE !== null) ?
                parseFloat(d.CANTIDAD_PENDIENTE) : (parseFloat(d.CANTIDAD) || 0);

            const contribucionBase = (d.ESTADO === 'PEDIDO') ? cantPend : cantProg;

            // Exclude CANCELADO from all percentage calculations
            if (d.ESTADO === 'CANCELADO') return;

            // Total base is the sum of (Programmed + Remaining to program)
            totalCantMes += contribucionBase;

            // Programmed totals
            if (d.ESTADO !== 'PEDIDO') {
                totalCantProgramado += cantProg;

                if (d.ESTADO === 'COMPROMETIDO') totalCantComprometido += cantProg;
                if (d.ESTADO === 'PROGRAMADO') totalCantEnProceso += cantProg;
                if (d.ESTADO === 'FINALIZADO') totalCantFinalizado += cantProg;
            }
        });

        const totalPlantDays = this.DGCapacidad.CAP_FECHA ? this.DGCapacidad.CAP_FECHA.length : 0;
        let overCapacityDays = this.DGCapacidad.CAP_TOTAL;
        const porcentajes = {
            programado: totalCantMes > 0 ? Number(((totalCantProgramado / totalCantMes) * 100).toFixed(1)) : 0,
            comprometido: totalCantProgramado > 0 ? Number(((totalCantComprometido / totalCantProgramado) * 100).toFixed(1)) : 0,
            enProceso: totalCantProgramado > 0 ? Number(((totalCantEnProceso / totalCantProgramado) * 100).toFixed(1)) : 0,
            finalizado: totalCantProgramado > 0 ? Number(((totalCantFinalizado / totalCantProgramado) * 100).toFixed(1)) : 0,
            sobredimensionado: overCapacityDays ? overCapacityDays[0].POR_PLA : 0,
        };

        this.onRespuestaComponent.emit({
            accion: 'update_percentages',
            data: porcentajes
        });

        this.onRespuestaComponent.emit({
            accion: 'update_sin_capacidad',
            data: this.DGCapacidad.SIN_CAPACIDAD || []
        });
    }

    emitirTotales(res: any[]) {
        let cant = 0;
        let money = 0;

        res.forEach(d => {
            if (d.ESTADO !== 'PEDIDO' && d.ESTADO !== 'CANCELADO') {
                cant += parseFloat(d.CANTIDAD_PROGRAMADA) || 0;
                money += parseFloat(d.TOTAL) || 0;
            }
        });

        this.onRespuestaComponent.emit({
            accion: 'update_totals_programmed',
            data: { cant, money }
        });
    }


    onContextMenuPreparing(e: any): void {
        const grid = 'DGproductos';

        if (e.row && e.row.rowType === "data") {
            const contextItems: any[] = [
                {
                    text: "Reprogramar",
                    icon: 'event',
                    disabled: (e.row.data.ESTADO === 'FINALIZADO' || this.readOnly),
                    onClick: () => {
                        this.popupTitulo = e.row.data.PRODUCTO + ' - ' + e.row.data.NOMBRE_PRODUCTO;
                        this.popupAccion = 'reprogramar';
                        this.popupAccionGrid = grid;
                        this.popupData = {
                            ...e.row.data,
                            FECHA_ANTERIOR: e.row.data.FECHA_PROGRAMADA,
                            CANTIDAD_REPROG: e.row.data.CANTIDAD_PROGRAMADA
                        };
                        this.FECHA_INICIO_POPUP = new Date(this.planFechas.inicio);
                        this.FECHA_FIN_POPUP = new Date(this.planFechas.final);
                        this.FECHA_DIA_POPUP = new Date(e.row.data.FECHA_PROGRAMADA);
                        this.popupVisible = true;
                    }
                }
            ];

            if (e.row.data.ESTADO === 'COMPROMETIDO') {
                contextItems.push({
                    text: "Cambiar Orden de Compra",
                    icon: 'cart',
                    disabled: this.readOnly,
                    onClick: () => {
                        this.modoOperacionOC = 'AGREGAR_OC';
                        this.prepararAgregarOCIndividual(e.row.data);
                    }
                });
            }

            e.items = contextItems;

        } else if (e.row && e.row.rowType === "group" && e.row.groupIndex === 0) {
            // Group header context menu
            const fechaHeader = e.row.key;
            const fechaFmt = this.formatFecha(fechaHeader);
            const itemsGroup = this.DGproductos.filter(d => this.formatFecha(d.FECHA_PROGRAMADA) === fechaFmt);
            const hasProyectado = itemsGroup.some(d => d.ESTADO === 'PROYECTADO');

            if (hasProyectado) {
                e.items = [{
                    text: `Comprometer (${this.formatFecha(fechaHeader)})`,
                    icon: 'check',
                    disabled: this.readOnly,
                    onClick: () => {
                        this.modoOperacionOC = 'COMPROMETER';
                        this.prepararCompromisoMasivo(fechaHeader);
                    }
                }];
            }
        }
    }

    prepararAgregarOCIndividual(data: any) {
        this.fechaSeleccionadaComprometer = data.FECHA_PROGRAMADA;

        // Simular la captura de ítems seleccionados para reutilizar lógica del backend
        this.filasSelectData = [data];
        this.filasSelecc = [data.ITEM];

        if (this.gridProductos && this.gridProductos.instance) {
            this.gridProductos.instance.clearSelection();
        }

        // Cargar OC actual si existe buscando en probables columnas provenientes del backend
        const ocExistente = data.OC || data.ORDEN_COMPRA || data.ID_DOC_SOPORTE || '';
        this.ordenCompra = ocExistente !== null && ocExistente !== undefined ? ocExistente.toString().trim() : '';
        this.popupComprometerOC = true;
    }

    prepararCompromisoMasivo(fecha: any) {
        this.fechaSeleccionadaComprometer = fecha;
        const selectedFecha = this.formatFecha(fecha);

        // Find all PROYECTADO items for this date
        const projectedItems = this.DGproductos.filter(d =>
            d.ESTADO === 'PROYECTADO' && this.formatFecha(d.FECHA_PROGRAMADA) === selectedFecha
        );

        if (projectedItems.length === 0) {
            showToast('No hay productos proyectados para esta fecha', 'warning');
            return;
        }

        this.modoComprometerActivo = true;

        if (this.gridProductos && this.gridProductos.instance) {
            this.gridProductos.instance.option('selection.mode', 'multiple');
            this.gridProductos.instance.option('selection.showCheckBoxesMode', 'always');
        }

        setTimeout(() => {
            if (this.gridProductos && this.gridProductos.instance) {
                this.gridProductos.instance.clearSelection();
                this.gridProductos.instance.expandRow([fecha]);

                const keys = projectedItems.map((d: any) => d.ITEM);
                this.gridProductos.instance.selectRows(keys, false);
            }
        }, 50);
    }

    formatCompactNumber(val: any): string {
        const num = Number(val);
        if (isNaN(num) || num === null) return '0';
        if (num >= 1000000) {
            return (num / 1000000).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + ' M';
        }
        if (num >= 1000) {
            return (num / 1000).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + ' K';
        }
        return num.toLocaleString('es-ES');
    }

    onCellPrepared(e: any) {

        // Ocultar checkboxes para filas inválidas durante el modo de selección (OC o Comprometer o Correo)
        if (e.rowType === "data" && e.column.command === "select") {
            if (this.modoComprometerActivo && this.fechaSeleccionadaComprometer && e.data) {
                const dateMatches = this.formatFecha(e.data.FECHA_PROGRAMADA) === this.formatFecha(this.fechaSeleccionadaComprometer);
                let valid = dateMatches;

                // Si es modo COMPROMETER, solo permitir los PROYECTADOS
                if (this.modoOperacionOC === 'COMPROMETER' && e.data.ESTADO !== 'PROYECTADO') {
                    valid = false;
                }

                if (!valid) {
                    // Oculta completamente el checkbox y elimina la interacción
                    e.cellElement.innerHTML = '';
                    e.cellElement.style.pointerEvents = 'none';
                }
            }
        }

        // Diseñar columna Estado para filas de datos
        if (e.rowType === "data" && e.column.dataField === "ESTADO" && e.data) {
            const estado = e.data.ESTADO;
            let bg = 'rgba(71, 85, 105, 0.1)';
            let color = '#475569';
            if (estado === 'PROYECTADO') {
                bg = 'rgba(18, 94, 220, 0.15)';
                color = '#125edc';
            } else if (estado === 'COMPROMETIDO') {
                bg = 'rgba(245, 158, 11, 0.15)';
                color = '#d97706';
            } else if (estado === 'PROGRAMADO') {
                bg = 'rgba(16, 185, 129, 0.15)';
                color = '#10b981';
            } else if (estado === 'FINALIZADO') {
                bg = 'rgba(79, 70, 229, 0.15)';
                color = '#4f46e5';
            }

            e.cellElement.innerHTML = `<span style="font-size: 11px; font-weight: 600; color: ${color}; background: ${bg}; padding: 3px 8px; border-radius: 12px; display: inline-block; text-align: center; min-width: 95px;">${estado}</span>`;
        }

        // Custom summary design in group rows
        if (e.rowType === "group" && e.column) {
            const isPlant = e.column.dataField?.startsWith('PL');
            const isDate = e.column.dataField === 'FECHA_PROGRAMADA';

            if (isPlant || isDate) {
                // Skip if it is the group indent/expander cell to avoid double rendering
                if (e.cellElement.querySelector('.dx-datagrid-group-closed, .dx-datagrid-group-opened')) {
                    return;
                }

                const fieldName = e.column.dataField;
                const groupKey = e.row.key;
                let value: any;
                let color: string;
                let porc: number;
                let showPercentage: boolean;

                const fStr = this.formatFecha(groupKey);
                const itemsGroup = this.DGproductos.filter(d => this.formatFecha(d.FECHA_PROGRAMADA) === fStr);
                const hasProyectado = itemsGroup.some(d => d.ESTADO === 'PROYECTADO');

                if (hasProyectado) {
                    // Apply a sutil background highlight to the parent group row
                    e.rowElement.style.backgroundColor = 'rgba(18, 94, 220, 0.04)';
                }

                if (isPlant) {
                    const summary = e.summaryItems && e.summaryItems[0];
                    if (!summary) return;
                    value = summary.value;
                    color = this.getCapacidadColor(groupKey, fieldName);
                    porc = this.getPorcentajePlanta(groupKey, fieldName);
                    showPercentage = true;
                } else {
                    // It's the Date column
                    value = groupKey;
                    color = this.getCapacidadFechaColor(groupKey);
                    porc = this.getPorcentajeFecha(groupKey);
                    showPercentage = porc !== 0;
                }

                // Clear default content
                e.cellElement.innerHTML = "";

                // Create container
                const container = document.createElement("div");

                if (isDate) {
                    // Modern clean date header - transparent, no border
                    container.style.backgroundColor = "transparent";
                    container.style.border = "none";
                    container.style.padding = "4px 8px";
                    container.style.fontWeight = "700";
                    container.style.fontSize = "13px";
                    container.style.display = "flex";
                    container.style.alignItems = "center";

                    // Highlight slightly if critical capacity issue
                    if (color === '#E74C3C') {
                        container.style.color = "#ef4444"; // Red
                    } else if (color === '#ff9800') {
                        container.style.color = "#f59e0b"; // Warning/Amber
                    } else {
                        container.style.color = "#1e293b"; // Neutral
                    }

                    const displayValue = this.datePipe.transform(value, 'dd MMM yyyy') || '';
                    const proyectadoBadge = hasProyectado ? `<span style="font-size: 10px; font-weight: 700; color: #125edc; background: rgba(18, 94, 220, 0.12); padding: 2px 6px; border-radius: 10px; margin-left: 8px; border: 1px solid rgba(18, 94, 220, 0.2);">PROYECTADO</span>` : '';
                    container.innerHTML = `<span>${displayValue}</span>${proyectadoBadge}`;
                } else {
                    // Modern flat KPI cell - no border, subtle bg only for warnings/criticals
                    const lightBg = color === '#E74C3C' ? 'rgba(239, 68, 68, 0.06)' :
                        color === '#ff9800' ? 'rgba(245, 158, 11, 0.06)' : 'transparent';
                    const textColor = color === '#E74C3C' ? '#ef4444' :
                        color === '#ff9800' ? '#d97706' :
                            color === '#2AB361' ? '#10b981' : '#475569';

                    container.style.backgroundColor = lightBg;
                    container.style.border = "none";
                    container.style.borderRadius = "4px";
                    container.style.padding = "2px 8px";
                    container.style.color = "#334155"; // Value is dark neutral
                    container.style.fontWeight = "700";
                    container.style.fontSize = "13px";
                    container.style.display = "inline-flex";
                    container.style.alignItems = "center";
                    container.style.gap = "4px";
                    container.style.justifyContent = "center";
                    container.style.width = "100%";
                    container.style.minWidth = "75px";
                    container.title = new Intl.NumberFormat('es-CO').format(value);

                    const displayValue = this.formatCompactNumber(value);
                    let innerHTML = `<span>${displayValue}</span>`;

                    if (showPercentage) {
                        const arrow = porc > 0 ? '▲' : (porc < 0 ? '▼' : '');
                        innerHTML += `<span style="font-size: 10px; font-weight: 600; color: ${textColor}; margin-left: 2px;">${arrow} ${Math.abs(porc).toFixed(0)}%</span>`;
                    }
                    container.innerHTML = innerHTML;
                }

                e.cellElement.appendChild(container);
            }
        }
    }

    iniciarCompromisoOC() {
        if (this.filasSelecc.length === 0) {
            showToast('Seleccione al menos un producto proyectado', 'warning');
            return;
        }

        // Si alguno de los items seleccionados tiene ID_DOC_SOPORTE, lo mostramos en el campo OC
        const itemConSoporte = this.filasSelectData.find(d => d.ID_DOC_SOPORTE && d.ID_DOC_SOPORTE.toString().trim() !== '');
        if (itemConSoporte) {
            this.ordenCompra = itemConSoporte.ID_DOC_SOPORTE;
        }

        this.popupComprometerOC = true;
    }

    cancelarCompromisoMasivo() {
        this.fechaSeleccionadaComprometer = null;
        this.ordenCompra = '';
        this.modoComprometerActivo = false;
        if (this.gridProductos && this.gridProductos.instance) {
            this.gridProductos.instance.option('selection.mode', 'single');
            this.gridProductos.instance.option('selection.showCheckBoxesMode', 'none');
            this.gridProductos.instance.clearSelection();
        }
    }

    cancelarSeleccionOC() {
        this.cancelarCompromisoMasivo();
    }

    activarModoEnvioCorreo() {
        // Obtener lista única de clientes con productos en estado PROYECTADO
        const clientesUnicos = [...new Set(this.DGproductos
            .filter(d => d.ESTADO === 'PROYECTADO' && d.NOMBRE_CLIENTE)
            .map(d => d.NOMBRE_CLIENTE))];

        if (clientesUnicos.length === 0) {
            showToast('No hay productos en estado PROYECTADO para enviar notificaciones', 'info');
            return;
        }

        this.listaClientesEnvio = clientesUnicos as string[];
        this.clienteSeleccionadoEnvio = '';
        this.productosFiltradosEnvio = [];
        this.popupEnvioCorreoVisible = true;
    }

    onClienteChanged(e: any) {
        this.clienteSeleccionadoEnvio = e.value;
        if (this.clienteSeleccionadoEnvio) {
            this.productosFiltradosEnvio = this.DGproductos.filter(d =>
                d.ESTADO === 'PROYECTADO' && d.NOMBRE_CLIENTE === this.clienteSeleccionadoEnvio
            );
        } else {
            this.productosFiltradosEnvio = [];
        }

        // Repintar para recalcular posición centrada al expandirse el contenido
        setTimeout(() => {
            if (this.popupEnvioCorreo && this.popupEnvioCorreo.instance) {
                this.popupEnvioCorreo.instance.repaint();
            }
        }, 100);
    }

    confirmarEnvioCorreo() {
        if (this.productosFiltradosEnvio.length === 0) {
            showToast('No hay productos para enviar', 'warning');
            return;
        }

        // Agrupación anidada: Cliente -> [Fecha -> Productos]
        const groupedArray = this.productosFiltradosEnvio.reduce((acc: any[], item: any) => {
            const clientName = item.NOMBRE_CLIENTE || 'SIN_CLIENTE';
            const dateStr = this.formatFecha(item.FECHA_PROGRAMADA) || 'SIN_FECHA';

            let clientEntry = acc.find(c => c.CLIENTE === clientName);
            if (!clientEntry) {
                clientEntry = { CLIENTE: clientName, PROGRAMACION: [] };
                acc.push(clientEntry);
            }

            let dateEntry = clientEntry.PROGRAMACION.find(p => p.FECHA === dateStr);
            if (!dateEntry) {
                dateEntry = { FECHA: dateStr, PRODUCTOS: [] };
                clientEntry.PROGRAMACION.push(dateEntry);
            }

            // Datos específicos requeridos por el usuario
            const itemFiltrado = {
                ID_CLIENTE: item.ID_CLIENTE,
                NOMBRE_CLIENTE: item.NOMBRE_CLIENTE,
                PRODUCTO: item.PRODUCTO,
                CODIGO_ASOCIADO: (item.CODIGO_ASOCIADO && item.CODIGO_ASOCIADO.toString().trim() !== '') ? item.CODIGO_ASOCIADO : item.PRODUCTO,
                NOMBRE_PRODUCTO: item.NOMBRE_PRODUCTO,
                CANTIDAD: item.CANTIDAD_PROGRAMADA,
                FECHA_PROGRAMADA: item.FECHA_PROGRAMADA,
                TOTAL: item.TOTAL,
                ESTADO: item.ESTADO
            };

            dateEntry.PRODUCTOS.push(itemFiltrado);
            return acc;
        }, []);

        console.log('--- Envío de Notificaciones (Proyectados por Cliente) ---');
        console.log('Payload a enviar:', groupedArray);

        this.loadingVisible = true;
        this.sData.postToWebhook(groupedArray).subscribe({
            next: (res: any) => {
                console.log('Respuesta del webhook:', res);
                if (res.status === "success") {
                    showToast('Notificaciones enviadas correctamente', 'success');

                } else {
                    showToast('Error al enviar notificaciones', 'error');
                }
                this.popupEnvioCorreoVisible = false;
                this.loadingVisible = false;
            },
            error: (err: any) => {
                console.error('Error al enviar webhook:', err);
                showToast('Error al enviar notificaciones', 'error');
                this.loadingVisible = false;
            },
            complete: () => {
                this.loadingVisible = false;
            }
        });
    }

    cancelarModoEnvioCorreo() {
        this.popupEnvioCorreoVisible = false;
        this.clienteSeleccionadoEnvio = '';
        this.productosFiltradosEnvio = [];
    }

    abrirPopupOC() {
        if (!this.gridProductos || !this.gridProductos.instance) return;
        const rowsData = this.gridProductos.instance.getSelectedRowsData();
        if (rowsData.length === 0) {
            showToast('Debe seleccionar al menos un producto', 'warning');
            return;
        }

        const invalid = rowsData.find(d =>
            (this.modoOperacionOC === 'COMPROMETER' && d.ESTADO !== 'PROYECTADO')
        );

        if (invalid) {
            showToast('Ha seleccionado ítems inválidos para esta operación.', 'error');
            return;
        }

        this.filasSelectData = rowsData;
        this.filasSelecc = rowsData.map(d => d.ITEM);

        const itemConSoporte = rowsData.find(d => d.ID_DOC_SOPORTE && d.ID_DOC_SOPORTE.toString().trim() !== '');
        if (itemConSoporte) {
            this.ordenCompra = itemConSoporte.ID_DOC_SOPORTE;
        }

        this.popupComprometerOC = true;
    }

    async enviarCompromiso() {
        if (this.filasSelectData.length === 0) return;

        this.loadingVisible = true;
        this.popupComprometerOC = false;

        const isAgregarOC = this.modoOperacionOC === 'AGREGAR_OC';

        // Si es solo agregar OC, mantenemos el estado existente, si es comprometer, lo pasamos a COMPROMETIDO
        const dataToSave = this.filasSelectData.map(d => ({
            ...d,
            ESTADO: isAgregarOC ? d.ESTADO : 'COMPROMETIDO'
        }));

        try {
            const accionBackend = isAgregarOC ? 'ORDEN COMPRA' : 'COMPROMETIDO'; // Si es solo OC, enviamos ORDEN COMPRA indicado por SP

            // Iterar producto por producto ya que UPDATE AGENDA procesa transacciones de manera individual
            for (let item of dataToSave) {
                await this.opPrepararGuardar('UPDATE AGENDA', accionBackend, [item], { OC: this.ordenCompra });
            }

            this.cancelarCompromisoMasivo();
            this.loadData();
        } catch (err) {
            console.error('Error al comprometer/agregar OC masivamente:', err);
        } finally {
            this.loadingVisible = false;
        }
    }

    async comprometerItems(items: any[]) {
        const proyectados = items.filter(d => d.ESTADO === 'PROYECTADO');
        if (proyectados.length === 0) {
            showToast('No hay productos proyectados para comprometer', 'warning');
            return;
        }

        this.loadingVisible = true;

        // Prepare data with status change
        const dataToSave = proyectados.map(d => ({
            ...d,
            ESTADO: 'COMPROMETIDO'
        }));

        try {
            await this.opPrepararGuardar('UPDATE AGENDA', 'AGENDA', dataToSave);
            this.loadData();
        } catch (err) {
            console.error('Error al comprometer items:', err);
        } finally {
            this.loadingVisible = false;
        }
    }

    comprometerPorFecha(fecha: any) {
        // This is the old direct method, kept for reference if needed, 
        // but now replaced by prepararCompromisoMasivo in context menu
        // To be removed once selection flow is verified
    }

    async onConfirmarAccionPopup(accion: string, datos: any) {
        if (accion === 'cancelar' || accion === 'reprogramar') {
            if (!this.selectPlanPopup || this.selectPlanPopup.length === 0) {
                showToast('Debe seleccionar un plan válido', 'error');
                return;
            }

            try {
                let fechaProg;
                if (accion === 'cancelar') {
                    fechaProg = datos.FECHA_PROGRAMADA;
                } else {
                    if (!this.FECHA_DIA_POPUP) {
                        showToast('Debe seleccionar una fecha para reprogramar', 'error');
                        return;
                    }
                    fechaProg = this.formatFecha(this.FECHA_DIA_POPUP);
                }

                this.planOriginal = datos.ID_PLAN;
                const nuevoPlan = this.selectPlanPopup?.[0];

                const datosCompletos = {
                    ...datos,
                    ID_PLAN_ANTERIOR: this.planOriginal,
                    ID_PLAN: nuevoPlan,
                    FECHA_PROGRAMADA: fechaProg,
                    USUARIO: this.USUARIO_LOCAL,
                    FECHA_ANTERIOR: datos.FECHA_ANTERIOR || datos.FECHA_PROGRAMADA,
                    CANTIDAD_REPROG: datos.CANTIDAD_REPROG,
                    ESTADO: datos.ESTADO
                };

                const op = accion === 'cancelar' ? 'CANCELAR' : 'REPROGRAMAR';
                const ocValue = datos.OC || datos.ORDEN_COMPRA;
                const extraParams = ocValue ? { OC: ocValue } : {};
                await this.opPrepararGuardar(op, 'AGENDA', [datosCompletos], extraParams);
                this.loadData();
            } catch (err: any) {
                console.error('Error en onConfirmarAccionPopup:', err);
            }
        }

        if (accion === 'salir') {
            this.popupAccion = '';
            this.popupAccionGrid = '';
            this.popupData = {};
        }

        this.popupVisible = false;
    }

    valoresObjetos(obj: string): void {
        if (obj === 'PLANES PROD') {
            this.sData.consulta('PLANES PROD', {}, 'PRO-023').subscribe((data: any) => {
                let res: any[] = [];
                try {
                    res = data.data ? JSON.parse(data.data) : [];
                } catch (e) {
                    console.error('Error parsing PLANES PROD:', e, data.data);
                    return;
                }

                if (res && res.length > 0 && res[0].ErrMensaje && res[0].ErrMensaje !== '') {
                    console.error(res[0].ErrMensaje);
                } else {
                    this.DGplanes = res;
                }
            });
        }
    }

    onSelectionChangedPlanPopup(e: any, type: string): void {
        if (type === 'GRID_POPUP') {
            if (e.selectedRowKeys.length > 0) {

                const item = e.selectedRowsData[0];
                this.selectPlanPopup = [item.CONSECUTIVO];
                this.FECHA_INICIO_POPUP = new Date(item.FECHA_INICIO);
                this.FECHA_FIN_POPUP = new Date(item.FECHA_FINAL);
                this.openPlanPopup = false;
            }
        }
    }

    onValueChangedFechaPopup(e: any): void {
        this.FECHA_DIA_POPUP = e.value;
    }


    templateHtml(data: any, element: string, component: string): any {
        if (component === 'SPAN') {
            if (element === 'POPUP_FECHA_PROGRAMADA' || element === 'FECHA_INICIO_POPUP' || element === 'FECHA_FIN_POPUP') {
                return this.datePipe.transform(data, 'dd/MM/yyyy');
            }
        }
        return data;
    }

    formatFecha(date: any): string {
        if (!date) return '';

        // Si ya es un string con formato DD/MM/YYYY (común en el grid de DevExtreme)
        if (typeof date === 'string' && date.includes('/') && date.length <= 10) {
            const parts = date.split('/');
            if (parts.length === 3) {
                if (parts[2].length === 4) { // DD/MM/YYYY -> YYYY-MM-DD
                    date = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }
        }

        const d = new Date(date);
        if (!isNaN(d.getTime())) {
            return this.datePipe.transform(d, 'yyyy-MM-dd') || '';
        }

        return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
    }

    expandAll() {
        this.gridProductos.instance.expandAll();
    }

    collapseAll() {
        this.gridProductos.instance.collapseAll();
    }


    getPorcentajePlanta(fecha: any, planta: string): number {

        if (!this.DGCapacidad || !this.DGCapacidad.CAP_PLANTA || !fecha || !planta) return 0;

        const fStr = this.formatFecha(fecha);
        const match = this.DGCapacidad.CAP_PLANTA.find((d: any) =>
            this.formatFecha(d.FECHA_ENTREGA) === fStr &&
            d.ID_UN_ITEM?.trim().toUpperCase() === planta?.trim().toUpperCase()
        );

        return match ? parseFloat(match.POR_PLA) || 0 : 0;
    }

    getCapacidadColor(fecha: any, planta: string): string {

        if (!planta?.startsWith('PL') && planta !== 'CANTIDAD_PROGRAMADA') return 'transparent';
        const porc = this.getPorcentajePlanta(fecha, planta);
        if (porc < 0) return '#2AB361'; // Verde
        if (porc > 0) return '#E74C3C'; // Rojo (Negative)
        return '#ff9800'; // Amarillo (Zero)
    }

    getPorcentajeFecha(fecha: any): number {
        if (!this.DGCapacidad || !this.DGCapacidad.CAP_FECHA || !fecha) return 0;
        const fStr = this.formatFecha(fecha);
        const match = this.DGCapacidad.CAP_FECHA.find((d: any) =>
            this.formatFecha(d.FECHA_ENTREGA) === fStr
        );
        return match ? parseFloat(match.POR_DIA) || 0 : 0;
    }

    getCapacidadFechaColor(fecha: any): string {
        const porc = this.getPorcentajeFecha(fecha);
        if (porc < 0) return '#2AB361'; // Verde
        if (porc > 0) return '#E74C3C'; // Rojo (Negative)
        return '#ff9800'; // Amarillo (Zero)
    }

    exportToExcel() {
        if (!this.DGproductos || this.DGproductos.length === 0) {
            showToast('No hay datos para exportar', 'warning');
            return;
        }

        // Obtener estados únicos disponibles y pasarlos al selector del popup
        this.estadosExportar = Array.from(new Set(this.DGproductos.map(item => item.ESTADO || 'SIN ESTADO')));
        this.estadoSeleccionadoExportar = this.estadosExportar.length > 0 ? this.estadosExportar[0] : '';
        this.popupExportarExcel = true;
    }

    confirmarExportacionExcel() {
        if (!this.estadoSeleccionadoExportar) {
            showToast('Debe seleccionar un estado válido', 'warning');
            return;
        }
        this.popupExportarExcel = false;
        this.procesarExportacionExcel(this.estadoSeleccionadoExportar);
    }

    procesarExportacionExcel(estadoSeleccionado: string) {
        this.loadingVisible = true;
        try {
            const wb = XLSX.utils.book_new();

            // Filtrar productos por el estado seleccionado
            const productosFiltrados = this.DGproductos.filter(item => (item.ESTADO || 'SIN ESTADO') === estadoSeleccionado);

            if (productosFiltrados.length === 0) {
                showToast(`No hay productos con estado ${estadoSeleccionado}`, 'warning');
                return;
            }

            // Agrupar por NOMBRE_CLIENTE en lugar de ESTADO
            const grouped = productosFiltrados.reduce((acc, curr) => {
                const cliente = curr.NOMBRE_CLIENTE || 'SIN CLIENTE';
                if (!acc[cliente]) acc[cliente] = [];
                acc[cliente].push(curr);
                return acc;
            }, {});

            Object.keys(grouped).forEach(cliente => {
                const dataRows = grouped[cliente].map((item: any) => {
                    const row: any = {};
                    row['ID_CLIENTE'] = item.ID_CLIENTE || '';
                    row['NOMBRE_CLIENTE'] = item.NOMBRE_CLIENTE || '';
                    row['CODIGO_ASOCIADO'] = (item.CODIGO_ASOCIADO && item.CODIGO_ASOCIADO.toString().trim() !== '') ? item.CODIGO_ASOCIADO : item.PRODUCTO;

                    this.gridColumns.forEach(c => {
                        // Omitir columnas dinámicas de planta (PL01, PL02, etc.)
                        const isPlantColumn = c.dataField && c.dataField.startsWith('PL');
                        if (!isPlantColumn) {
                            let val = item[c.dataField];
                            if (c.dataType === 'date' && val) {
                                val = this.datePipe.transform(val, c.format || 'dd/MM/yyyy') || val;
                            }
                            const headerName = c.caption || c.dataField;
                            row[headerName] = val;
                        }
                    });
                    return row;
                });

                const ws = XLSX.utils.json_to_sheet(dataRows);
                // Asegurar que el nombre del cliente (hoja) tenga no más de 31 caracteres limpios especiales
                const safeName = cliente.replace(/[\\\/\?\*\[\]:]/g, ' ').substring(0, 31);
                XLSX.utils.book_append_sheet(wb, ws, safeName);
            });

            const fechaArchivo = this.datePipe.transform(new Date(), 'yyyyMMdd_HHmm') || '';
            XLSX.writeFile(wb, `Plan_${estadoSeleccionado}_${fechaArchivo}.xlsx`);

        } catch (error) {
            console.error('Error al exportar Excel:', error);
            showToast('Ocurrió un error al generar el Excel', 'error');
        } finally {
            this.loadingVisible = false;
        }
    }
}