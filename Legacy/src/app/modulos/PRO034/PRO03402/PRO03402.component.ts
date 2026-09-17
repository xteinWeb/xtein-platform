import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DxDataGridModule, DxDataGridComponent, DxDateBoxModule, DxNumberBoxModule, DxLoadPanelModule, DxPopupModule, DxButtonModule, DxDropDownBoxModule, DxCheckBoxModule } from 'devextreme-angular';
import { Observable, Subscription } from 'rxjs';
import { PRO034Service } from 'src/app/services/PRO034/PRO034.service';
import { MatDividerModule } from '@angular/material/divider';
import Swal from 'sweetalert2';
import { showToast } from '../../../shared/toast/toastComponent';

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
        DxCheckBoxModule,
        MatDividerModule
    ],
    providers: [DatePipe]
})
export class PRO03402Component implements OnInit, OnDestroy {
    @ViewChild("gridProductos", { static: false }) gridProductos: DxDataGridComponent;

    @Input() events: Observable<any>;
    @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();

    private eventsSubscription: Subscription;

    // State
    readOnly: boolean = true;
    USUARIO_LOCAL: string = '';
    conCambios: number = 0;
    loadingVisible: boolean = false;
    isCollapsed: boolean = false;
    gridHeight: string | number = 400;
    modoEdicionGrid: any = false;
    editRows: Map<any, any> = new Map();

    toggleExpand() {
        this.isCollapsed = !this.isCollapsed;
        this.gridHeight = this.isCollapsed ? 'auto' : 400;
        setTimeout(() => {
            if (this.gridProductos) this.gridProductos.instance.updateDimensions();
        }, 100);
    }

    // Popup State (Reprogram/Cancel)
    popupVisible: boolean = false;
    popupAccion: string = '';
    popupTitulo: string = '';
    popupData: any = {};
    popupAccionGrid: string = '';
    selectPlanPopup: any[] = [];
    openPlanPopup: boolean = false;
    FECHA_INICIO_POPUP: any = null;
    FECHA_FIN_POPUP: any = null;
    FECHA_DIA_POPUP: any = null;
    DGplanes: any[] = [];
    NOW: Date = new Date();

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
    ) { }

    ngOnInit(): void {
        this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase() || '';

        this.eventsSubscription = this.events.subscribe((datos: any) => {
            if (datos.componente === 'PRO03402' || !datos.componente) {
                this.handleEvents(datos);
            }
        });

        this.valoresObjetos('PLANES PROD');
    }

    ngOnDestroy(): void {
        if (this.eventsSubscription) {
            this.eventsSubscription.unsubscribe();
        }
    }

    handleEvents(datos: any): void {
        console.log('PRO03402 recibió evento:', datos);
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
                this.loadData();
                break;
        }
    }

    loadData(planData?: any): void {
        if (this.selectPlanes.length === 0) return;

        console.log('Cargando productos para plan:', this.selectPlanes[0]);
        this.loadingVisible = true;
        this.DGproductos = []; // Clear current data

        const prm: any = { ID_PLAN: this.selectPlanes[0] };

        // Use provided data or stored dates
        const inicio = planData ? planData.FECHA_INICIO : this.planFechas.inicio;
        const final = planData ? planData.FECHA_FINAL : this.planFechas.final;

        if (inicio) prm.FECHA_INICIO = inicio;
        if (final) prm.FECHA_FINAL = final;

        this.sData.consulta('PEDIDOS PMP', prm, 'PRO-023').subscribe((data: any) => {
            console.log('Respuesta API PEDIDOS PMP:', data);
            const res = JSON.parse(data.data);
            console.log('Datos parseados:', res);
            if (res[0].ErrMensaje && res[0].ErrMensaje !== '') {
                showToast(res[0].ErrMensaje, 'error');
                this.loadingVisible = false;
            } else {
                // Filter programmed products (anything with ORDEN_PRO or not in PEDIDO/CANCELADO state)
                const newData = res.filter((d: any) =>
                    (d.ORDEN_PRO !== null && d.ORDEN_PRO !== undefined && d.ORDEN_PRO !== '') ||
                    (d.ESTADO !== 'PEDIDO' && d.ESTADO !== 'CANCELADO')
                );

                console.log('Productos filtrados (newData):', newData);
                console.log('Cantidad de productos filtrados:', newData.length);

                // Calculate percentages before filtering for the grid
                this.calcularPorcentajes(res);

                // Parse ATRIBUTOS if it's a string (to match PRO023)
                res.forEach((d: any) => {
                    if (typeof d.ATRIBUTOS === "string") {
                        try {
                            const parsed = JSON.parse(d.ATRIBUTOS);
                            d.ATRIBUTOS = Array.isArray(parsed) ? parsed : [parsed];
                        } catch (e) {
                            d.ATRIBUTOS = [];
                        }
                    } else if (!d.ATRIBUTOS) {
                        d.ATRIBUTOS = [];
                    }
                });

                if (newData.length > 0) {
                    this.subirProductos(newData, 'DGproductos', 'Consulta');
                } else {
                    this.DGproductos = [];
                    this.loadingVisible = false;
                }
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
            this.sData.consulta('PROGRAMACION', prm, 'PRO-023').subscribe((data: any) => {
                this.loadingVisible = false;
                const resB = JSON.parse(data.data);
                if (data.token !== undefined && data.token !== null) {
                    localStorage.setItem("token", data.token);
                }
                if (resB[0].ErrMensaje && resB[0].ErrMensaje !== '') {
                    showToast(resB[0].ErrMensaje, 'error');
                } else {
                    this.addColumn(resB, 'DGproductos');
                }
            });
        }
    }

    addColumn(data: any, grid: string) {
        if (grid === 'DGproductos') {
            let columnsToAdd: any[] = [];
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
                if (Plantas.length > 0 && this.gridProductos && this.gridProductos.instance) {
                    const visibles = this.gridProductos.instance.getVisibleColumns();
                    const indexCantidad = visibles.findIndex((d: any) => d.dataField === 'CANTIDAD_PROGRAMADA');
                    const col = visibles[indexCantidad];
                    let nextIndex = (indexCantidad !== -1 && col && col.visibleIndex !== undefined) ? col.visibleIndex + 1 : 1;

                    Plantas.forEach((key) => {
                        const existe = visibles.find((d: any) => d.dataField === key);
                        if (!existe && !columnsToAdd.some(c => c.dataField === key)) {
                            columnsToAdd.push({
                                dataField: key,
                                caption: key,
                                alignment: 'right',
                                format: "#,##0",
                                visibleIndex: nextIndex++
                            });

                            // Add summaries if they don't exist
                            if (!this.summaryGroupItems.some((item: any) => item.column === key)) {
                                this.summaryGroupItems.push({
                                    column: key, summaryType: 'sum', valueFormat: '#,##0', displayFormat: '{0}', alignByColumn: true, showInGroupFooter: false
                                });
                                this.totalSummaryItems.push({
                                    column: key, summaryType: 'sum', valueFormat: '#,##0', displayFormat: '{0}', alignByColumn: true
                                });
                            }
                        }
                    });
                }
            });

            // Add columns to grid instance
            columnsToAdd.forEach(col => {
                this.gridProductos.instance.addColumn(col);
            });

            if (this.gridProductos) this.gridProductos.instance.refresh();
        }
    }

    onRowUpdated(e: any): void {
        if (e.data.CANTIDAD_PROGRAMADA >= 0) {
            this.opPrepararGuardar('UPDATE AGENDA', 'Manual', [e.data])
                .then((dataRes: any) => {
                    const pos = this.gridProductos.instance.getRowIndexByKey(e.key);
                    this.gridProductos.instance.cellValue(pos, 'ESTADO', dataRes[0].ESTADO);
                    this.gridProductos.instance.refresh();
                })
                .catch(() => {
                    showToast('Error al guardar los cambios', 'error');
                });
        }
        this.conCambios++;
    }

    async opPrepararGuardar(accion: string, tipo: string, datos: any): Promise<any> {
        const prm = { PRODUCTOS: datos, USUARIO: this.USUARIO_LOCAL, TIPO: tipo };
        return new Promise((resolve, reject) => {
            this.sData.save(accion, prm).subscribe({
                next: (data) => {
                    const res = JSON.parse(data.data);
                    if (data.token !== undefined && data.token !== null) {
                        localStorage.setItem("token", data.token);
                    }
                    if (res[0].ErrMensaje && res[0].ErrMensaje !== '') {
                        reject(res[0]);
                    } else {
                        showToast('Registro actualizado', 'success');
                        // After saving, reload to refresh percentages and grid
                        this.loadData();
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
            const cant = parseFloat(d.CANTIDAD_PROGRAMADA || d.CANTIDAD) || 0;

            // Exclude CANCELADO from all percentage calculations
            if (d.ESTADO === 'CANCELADO') return;

            totalCantMes += cant;

            // In this context, anything that is NOT 'PEDIDO' is considered programmed at some stage
            if (d.ESTADO !== 'PEDIDO') {
                totalCantProgramado += cant;

                if (d.ESTADO === 'COMPROMETIDO') totalCantComprometido += cant;
                if (d.ESTADO === 'EN PROCESO') totalCantEnProceso += cant;
                if (d.ESTADO === 'FINALIZADO') totalCantFinalizado += cant;
            }
        });

        const porcentajes = {
            programado: totalCantMes > 0 ? Number(((totalCantProgramado / totalCantMes) * 100).toFixed(1)) : 0,
            comprometido: totalCantProgramado > 0 ? Number(((totalCantComprometido / totalCantProgramado) * 100).toFixed(1)) : 0,
            enProceso: totalCantProgramado > 0 ? Number(((totalCantEnProceso / totalCantProgramado) * 100).toFixed(1)) : 0,
            finalizado: totalCantProgramado > 0 ? Number(((totalCantFinalizado / totalCantProgramado) * 100).toFixed(1)) : 0,
            sobredimensionado: 0 // Default to 0 until formula is defined
        };

        this.onRespuestaComponent.emit({
            accion: 'update_percentages',
            data: porcentajes
        });
    }

    onContextMenuPreparing(e: any): void {
        if (e.row && e.row.rowType === "data") {
            const grid = 'DGproductos';
            e.items = [
                {
                    text: "Cancelar",
                    disabled: this.readOnly || (e.row.data.ESTADO === 'CANCELADO' || e.row.data.ESTADO === 'FINALIZADO'),
                    onClick: () => {
                        this.popupTitulo = 'Cancelar ' + e.row.data.PRODUCTO + ' - ' + e.row.data.NOMBRE_PRODUCTO;
                        this.popupAccionGrid = grid;
                        this.popupAccion = 'cancelar';
                        this.popupData = {
                            ...e.row.data,
                            FECHA_ANTERIOR: e.row.data.FECHA_PROGRAMADA
                        };
                        this.selectPlanPopup = [this.selectPlanes[0]];

                        this.FECHA_INICIO_POPUP = new Date(this.planFechas.inicio);
                        this.FECHA_FIN_POPUP = new Date(this.planFechas.final);
                        this.FECHA_DIA_POPUP = e.row.data.FECHA_PROGRAMADA ? new Date(e.row.data.FECHA_PROGRAMADA) : new Date();
                        this.popupVisible = true;
                    }
                },
                {
                    text: "Reprogramar",
                    disabled: this.readOnly || (e.row.data.ESTADO === 'FINALIZADO'),
                    onClick: () => {
                        this.popupTitulo = e.row.data.PRODUCTO + ' - ' + e.row.data.NOMBRE_PRODUCTO;
                        this.popupAccion = 'reprogramar';
                        this.popupAccionGrid = grid;
                        this.popupData = {
                            ...e.row.data,
                            FECHA_ANTERIOR: e.row.data.FECHA_PROGRAMADA
                        };
                        this.selectPlanPopup = [this.selectPlanes[0]];
                        this.FECHA_INICIO_POPUP = new Date(this.planFechas.inicio);
                        this.FECHA_FIN_POPUP = new Date(this.planFechas.final);
                        this.FECHA_DIA_POPUP = e.row.data.FECHA_PROGRAMADA ? new Date(e.row.data.FECHA_PROGRAMADA) : new Date();
                        this.popupVisible = true;
                    }
                }
            ];
        }
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

                const datosCompletos = {
                    ...datos,
                    FECHA_PROGRAMADA: fechaProg,
                    ID_PLAN: this.selectPlanPopup[0],
                    USUARIO: this.USUARIO_LOCAL,
                    FECHA_ANTERIOR: datos.FECHA_ANTERIOR || datos.FECHA_PROGRAMADA
                };

                const op = accion === 'cancelar' ? 'CANCELAR' : 'REPROGRAMAR';
                await this.opPrepararGuardar(op, 'AGENDA', [datosCompletos]);
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
                const res = JSON.parse(data.data);
                if (res[0].ErrMensaje && res[0].ErrMensaje !== '') {
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

    onValueChangedCPPopup(e: any): void {
        this.popupData.CANTIDAD_PROGRAMADA = e.value;
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
        return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
    }

    onValueChangedCP(e: any, cellInfo: any) {
        if (this.readOnly || !this.modoEdicionGrid) return;
        if (e.value === e.previousValue) return;

        const newVal = parseFloat(e.value) || 0;
        const oldVal = parseFloat(e.previousValue) || 0;
        const currentPend = parseFloat(cellInfo.data.CANTIDAD_PENDIENTE) || 0;

        // Validation: cannot be negative
        let valFinal = newVal;
        if (newVal < 0) valFinal = 0;

        const diff = valFinal - oldVal;

        // If diff > currentPend, it means they are programming more than available
        if (diff > currentPend) {
            valFinal = oldVal + currentPend;
        }

        const finalDiff = valFinal - oldVal;

        // We must update ALL rows in the grid that belong to this same order item
        const idDoc = cellInfo.data.ID_DOCUMENTO;
        const cons = cellInfo.data.CONSECUTIVO;
        const prod = cellInfo.data.PRODUCTO;

        this.DGproductos.forEach((row: any) => {
            if (row.ID_DOCUMENTO === idDoc && row.CONSECUTIVO === cons && row.PRODUCTO === prod) {
                row.CANTIDAD_PENDIENTE = Math.max(0, (parseFloat(row.CANTIDAD_PENDIENTE) || 0) - finalDiff);

                // Update the grid display for these rows
                const rowPos = this.gridProductos.instance.getRowIndexByKey(row.ITEM);
                if (rowPos !== -1) {
                    this.gridProductos.instance.cellValue(rowPos, 'CANTIDAD_PENDIENTE', row.CANTIDAD_PENDIENTE);
                }

                // If it's the row the user is editing, also update CANTIDAD_PROGRAMADA
                if (row.ITEM === cellInfo.key) {
                    row.CANTIDAD_PROGRAMADA = valFinal;
                    this.gridProductos.instance.cellValue(rowPos, 'CANTIDAD_PROGRAMADA', valFinal);
                }

                // Add to changed rows to ensure consistent save
                this.editRows.set(row.ITEM, row);
            }
        });

        this.conCambios = this.editRows.size;
    }

    onGuardarCambiosGrid() {
        if (this.editRows.size === 0) {
            showToast('No hay cambios para guardar', 'info');
            return;
        }

        const data = Array.from(this.editRows.values());
        this.loadingVisible = true;

        this.opPrepararGuardar('UPDATE AGENDA', 'Manual', data)
            .then(() => {
                this.editRows.clear();
                this.conCambios = 0;
                this.modoEdicionGrid = false;
                showToast('Cambios guardados con éxito', 'success');
                this.loadData(); // Re-load to ensure data is in sync
            })
            .catch(() => {
                showToast('Error al guardar cambios', 'error');
            })
            .finally(() => {
                this.loadingVisible = false;
            });
    }
}
