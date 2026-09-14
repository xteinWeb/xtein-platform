import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DxDataGridModule, DxDataGridComponent, DxLoadPanelModule, DxButtonModule, DxTooltipModule, DxNumberBoxModule, DxPopupModule, DxDropDownBoxModule, DxDateBoxModule } from 'devextreme-angular';
import dxCheckBox from 'devextreme/ui/check_box';
import { lastValueFrom, Observable, Subscription } from 'rxjs';
import { PRO034Service } from 'src/app/services/PRO034/PRO034.service';
import { MatDividerModule } from '@angular/material/divider';
import { showToast } from '../../../shared/toast/toastComponent';
import { CdkAccordionModule } from '@angular/cdk/accordion';

@Component({
    selector: 'app-PRO03403',
    templateUrl: './PRO03403.component.html',
    styleUrls: ['./PRO03403.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        DxDataGridModule,
        DxLoadPanelModule,
        DxButtonModule,
        DxTooltipModule,
        DxNumberBoxModule,
        DxPopupModule,
        DxDropDownBoxModule,
        DxDateBoxModule,
        MatDividerModule,
        CdkAccordionModule
    ],
    providers: [DatePipe]
})
export class PRO03403Component implements OnInit, OnDestroy {
    @ViewChild("gridPedidosPMP", { static: false }) gridPedidosPMP: DxDataGridComponent;

    @Input() events: Observable<any>;
    @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();

    private eventsSubscription: Subscription;

    // State
    readOnly: boolean = true;
    USUARIO_LOCAL: string = '';
    loadingVisible: boolean = false;
    accordionExpand: boolean[] = [true];
    gridHeight: string | number = 400;
    esVisibleSelecc: string = 'none';
    fechaProgramacion: any = null;
    selectPedido: any[] = [];

    // Tooltip for matrix
    tooltipVisible: boolean = false;
    tooltipInfo: string = '';
    targetTooltip: any = null;

    // Summary counts
    totalCantidad: number = 0;
    cantidadPendiente: number = 0;

    // Plan dates for reloading

    // Plan dates for reloading
    planFechas: any = { inicio: null, final: null };


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
    DGPMP: any[] = [];
    selectPlanes: any[] = [];

    constructor(
        private sData: PRO034Service,
        private datePipe: DatePipe
    ) { }

    ngOnInit(): void {
        this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase() || '';

        this.eventsSubscription = this.events.subscribe((datos: any) => {
            if (datos.componente === 'PRO03403' || !datos.componente) {
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
                this.DGPMP = [];
                this.totalCantidad = 0;
                this.cantidadPendiente = 0;
                this.planFechas = { inicio: null, final: null };
                this.esVisibleSelecc = 'none';
                this.fechaProgramacion = null;
                break;
            case 'dia_programacion_cambiado':
                this.fechaProgramacion = datos.data;
                this.esVisibleSelecc = this.fechaProgramacion ? 'always' : 'none';
                break;
            case 'refresh_data':
            case 'load_data':
                this.selectPedido = [];
                if (this.gridPedidosPMP && this.gridPedidosPMP.instance) {
                    this.gridPedidosPMP.instance.clearSelection();
                }
                this.valoresObjetos('PLANES PROD');
                this.loadData();
                break;
        }
    }

    loadData(planData?: any): void {
        if (this.selectPlanes.length === 0) return;

        this.loadingVisible = true;
        this.DGPMP = []; // Clear current data

        const prm: any = { ID_PLAN: this.selectPlanes[0] };

        // Use provided data or stored dates
        const inicio = planData ? planData.FECHA_INICIO : this.planFechas.inicio;
        const final = planData ? planData.FECHA_FINAL : this.planFechas.final;

        if (inicio) prm.FECHA_INICIO = inicio;
        if (final) prm.FECHA_FINAL = final;

        this.sData.consulta('PEDIDOS PMP', prm, 'PRO-023').subscribe((data: any) => {
            this.loadingVisible = false;
            let res: any[] = [];
            try {
                res = data.data ? JSON.parse(data.data) : [];
            } catch (e) {
                console.error('Error parsing PEDIDOS PMP:', e, data.data);
                showToast('Error en formato de datos de pedidos', 'error');
                return;
            }

            if (res && res.length > 0 && res[0].ErrMensaje && res[0].ErrMensaje !== '') {
                showToast(res[0].ErrMensaje, 'error');
            } else if (res && res.length > 0) {
                // Filter pending orders (following PRO023 logic: ESTADO === 'PEDIDO')
                this.DGPMP = res.filter((d: any) => d.ESTADO === 'PEDIDO');

                // Ensure unique ITEM ID for selection (as in PRO023) and process quantities
                this.DGPMP.forEach((d: any, index: number) => {
                    d.ITEM = index;

                    // Parse ATRIBUTOS if it's a string
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

                    // Respect backend values for quantities
                    d.CANTIDAD = parseFloat(d.CANTIDAD) || 0;

                    // REAL_PENDIENTE is the total amount currently available to be programmed
                    d.REAL_PENDIENTE = (d.CANTIDAD_PENDIENTE !== undefined && d.CANTIDAD_PENDIENTE !== null) ? parseFloat(d.CANTIDAD_PENDIENTE) : d.CANTIDAD;
                    d.CANTIDAD_PROGRAMADA = d.REAL_PENDIENTE;
                    // CANTIDAD_PROGRAMADA defaults to REAL_PENDIENTE unless backend specifies otherwise
                    if (d.CANTIDAD_PROGRAMADA === undefined || d.CANTIDAD_PROGRAMADA === null) {
                        d.CANTIDAD_PROGRAMADA = d.REAL_PENDIENTE;
                    } else {
                        d.CANTIDAD_PROGRAMADA = parseFloat(d.CANTIDAD_PROGRAMADA);
                    }

                    // The UI CANTIDAD_PENDIENTE reflects what will remain after this programming action
                    d.CANTIDAD_PENDIENTE = d.REAL_PENDIENTE - d.CANTIDAD_PROGRAMADA;
                });

                // Calculate totals after processing all items
                this.actualizarTotales();
                this.emitirTotales();
            }
        });
    }

    actualizarTotales() {
        this.totalCantidad = this.DGPMP.reduce((acc: number, d: any) => acc + (parseFloat(d.CANTIDAD) || 0), 0);
        this.cantidadPendiente = this.DGPMP.reduce((acc: number, d: any) => acc + (parseFloat(d.CANTIDAD_PENDIENTE) || 0), 0);
    }

    emitirTotales() {
        let cant = 0;
        let money = 0;

        this.DGPMP.forEach(d => {
            const rPend = parseFloat(d.REAL_PENDIENTE) || 0;
            const vUnit = parseFloat(d.VALOR_UNITARIO) || 0;
            cant += rPend;
            money += (rPend * vUnit);
        });

        this.onRespuestaComponent.emit({
            accion: 'update_totals_pending',
            data: { cant, money }
        });
    }

    onSelectionChangedPedidos(e: any): void {
        this.selectPedido = e.selectedRowsData;
    }

    onValueChangedCP(e: any, cellInfo: any) {
        const val = parseFloat(e.value) || 0;
        const available = parseFloat(cellInfo.data.REAL_PENDIENTE) || 0;

        if (val >= 0 && val <= available) {
            cellInfo.data.CANTIDAD_PROGRAMADA = val;
            cellInfo.data.CANTIDAD_PENDIENTE = available - val;
        } else {
            cellInfo.data.CANTIDAD_PROGRAMADA = available;
            cellInfo.data.CANTIDAD_PENDIENTE = 0;
        }

        const pos: any = this.gridPedidosPMP.instance.getRowIndexByKey(cellInfo.key);
        this.gridPedidosPMP.instance.cellValue(pos, 'CANTIDAD_PROGRAMADA', cellInfo.data.CANTIDAD_PROGRAMADA);
        this.gridPedidosPMP.instance.cellValue(pos, 'CANTIDAD_PENDIENTE', cellInfo.data.CANTIDAD_PENDIENTE);

        // Update footer totals
        this.actualizarTotales();
    }

    async programarPedidos() {
        if (!this.fechaProgramacion) {
            showToast('Defina una fecha de programación', 'warning');
            return;
        }

        if (this.selectPedido.length === 0) {
            showToast('Seleccione al menos un producto', 'warning');
            return;
        }

        const newArray = JSON.parse(JSON.stringify(this.selectPedido));
        newArray.forEach((ele: any) => {
            ele.FECHA_PROGRAMADA = this.datePipe.transform(this.fechaProgramacion, 'yyyy-MM-dd');
            // Use the quantities from the grid (already updated via onValueChangedCP)
            ele.USUARIO = this.USUARIO_LOCAL;
        });

        const prm = { PRODUCTOS: newArray };
        this.loadingVisible = true;

        try {
            // 1. First step: PROGRAMACION
            const data: any = await lastValueFrom(this.sData.consulta('PROGRAMACION', prm, 'PRO-023'));
            let res: any[] = [];
            try {
                res = data.data ? JSON.parse(data.data) : [];
            } catch (e) {
                console.error('Error parsing PROGRAMACION:', e, data.data);
                showToast('Error en formato de datos de programación', 'error');
                this.loadingVisible = false;
                return;
            }

            if (res.length > 0 && res[0].ErrMensaje && res[0].ErrMensaje !== '') {
                this.loadingVisible = false;
                showToast(res[0].ErrMensaje, 'error');
                return;
            }

            // 2. Second step: Persist each item with GUARDAR AGENDA (as in PRO023)
            for (let i = 0; i < res.length; i++) {
                res[i].ITEM = i;
                res[i].ID_PLAN = this.selectPlanes[0];

                if ((res[i].ESTADO === 'PEDIDO' || res[i].ESTADO === 'REGISTRADO' || res[i].ESTADO === 'PENDIENTE') &&
                    (res[i].ORDEN_PRO === null || res[i].ORDEN_PRO === undefined || res[i].ORDEN_PRO === '')
                ) {
                    try {
                        const prmSave = { PRODUCTOS: [res[i]], USUARIO: this.USUARIO_LOCAL, TIPO: 'PEDIDO' };
                        const saveRes: any = await lastValueFrom(this.sData.save('UPDATE AGENDA', prmSave));
                        let parsedSave: any[] = [];
                        try {
                            parsedSave = saveRes.data ? JSON.parse(saveRes.data) : [];
                        } catch (e) {
                            console.error('Error parsing GUARDAR AGENDA response:', e, saveRes.data);
                            res[i].ESTADO = 'ERROR';
                            continue;
                        }

                        if (parsedSave.length > 0 && parsedSave[0].ErrMensaje === '') {
                            res[i].ESTADO = parsedSave[0].ESTADO === 'REGISTRADO' ? 'COMPROMETIDO' : parsedSave[0].ESTADO;
                        } else {
                            res[i].ESTADO = 'ERROR';
                        }
                    } catch (err) {
                        res[i].ESTADO = 'ERROR';
                    }
                }
            }

            this.loadingVisible = false;
            showToast('Productos programados correctamente', 'success');

            this.gridPedidosPMP.instance.clearSelection();
            this.gridPedidosPMP.instance.refresh();

            // Notify parent to refresh PRO03402 and percentages
            this.onRespuestaComponent.emit({
                accion: 'productos_programados',
                data: res
            });

        } catch (err) {
            this.loadingVisible = false;
            showToast('Error en la programación', 'error');
        }
    }

    onCellPrepared(e: any): void {
        // Solo deja seleccionables las que tengan Matriz Completa (Temporalmente habilitado para todos)
        if (e.rowType == "data" && e.cellElement.querySelector(".dx-select-checkbox")) {
            const check = e.cellElement.querySelectorAll(".dx-select-checkbox");
            check.forEach((ele: any) => {
                const inst = dxCheckBox.getInstance(ele);
                // Temporalmente todas visibles:
                inst.option("visible", true);
                e.cellElement.style.pointerEvents = '';
                e.cellElement.style.opacity = '';
                
                /* Lógica original:
                if (e.data.MATRIZ) {
                    inst.option("visible", true);
                    e.cellElement.style.pointerEvents = '';
                    e.cellElement.style.opacity = '';
                } else {
                    inst.option("visible", false);
                    e.cellElement.style.pointerEvents = 'none';
                    e.cellElement.style.opacity = '0.5';
                }
                */
            });
        }
    }

    onContextMenuPreparing(e: any): void {
        if (e.row && e.row.rowType === "data") {
            const grid = 'DGPMP';
            e.items = [
                {
                    text: "Anular",
                    disabled: this.readOnly || (e.row.data.ESTADO === 'CANCELADO' || e.row.data.ESTADO === 'FINALIZADO'),
                    onClick: () => {
                        this.popupTitulo = 'Anular ' + e.row.data.PRODUCTO + ' - ' + e.row.data.NOMBRE_PRODUCTO;
                        this.popupAccionGrid = grid;
                        this.popupAccion = 'cancelar';
                        this.popupData = {
                            ...e.row.data,
                            FECHA_ANTERIOR: e.row.data.FECHA_PROGRAMADA
                        };
                        this.selectPlanPopup = [this.selectPlanes[0]];

                        this.FECHA_INICIO_POPUP = new Date(this.planFechas.inicio);
                        this.FECHA_FIN_POPUP = new Date(this.planFechas.final);
                        this.FECHA_DIA_POPUP = this.fechaProgramacion ? new Date(this.fechaProgramacion) : new Date();
                        this.popupVisible = true;
                    }
                },
                // {
                //     text: "Reprogramar",
                //     disabled: this.readOnly || (e.row.data.ESTADO === 'FINALIZADO'),
                //     onClick: () => {
                //         this.popupTitulo = e.row.data.PRODUCTO + ' - ' + e.row.data.NOMBRE_PRODUCTO;
                //         this.popupAccion = 'reprogramar';
                //         this.popupAccionGrid = grid;
                //         this.popupData = {
                //             ...e.row.data,
                //             FECHA_ANTERIOR: e.row.data.FECHA_PROGRAMADA
                //         };
                //         this.selectPlanPopup = [this.selectPlanes[0]];
                //         this.FECHA_INICIO_POPUP = new Date(this.planFechas.inicio);
                //         this.FECHA_FIN_POPUP = new Date(this.planFechas.final);
                //         this.FECHA_DIA_POPUP = this.fechaProgramacion ? new Date(this.fechaProgramacion) : new Date();
                //         this.popupVisible = true;
                //     }
                // }
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
                const prm = { PRODUCTOS: [datosCompletos], USUARIO: this.USUARIO_LOCAL, TIPO: 'PEDIDO' };
                this.loadingVisible = true;

                this.sData.save(op, prm).subscribe({
                    next: (data) => {
                        this.loadingVisible = false;
                        let res: any[] = [];
                        try {
                            res = data.data ? JSON.parse(data.data) : [];
                        } catch (e) {
                            console.error('Error parsing save response:', e, data.data);
                            showToast('Error al procesar respuesta del servidor', 'error');
                            return;
                        }

                        if (data.token !== undefined && data.token !== null) {
                            localStorage.setItem("token", data.token);
                        }
                        if (res.length > 0 && res[0].ErrMensaje && res[0].ErrMensaje !== '') {
                            showToast(res[0].ErrMensaje, 'error');
                        } else {
                            showToast('Registro actualizado', 'success');
                            this.loadData();
                        }
                    },
                    error: (err) => {
                        this.loadingVisible = false;
                        showToast('Error al guardar', 'error');
                    }
                });
            } catch (err: any) {
                console.error('Error en onConfirmarAccionPopup:', err);
                this.loadingVisible = false;
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

    toggleToolTip(cellInfo: any) {
        this.tooltipInfo = 'El producto ' + cellInfo.data.PRODUCTO + ' - ' + cellInfo.data.NOMBRE_PRODUCTO + ' tiene datos faltantes en Matriz.';
        this.targetTooltip = cellInfo.cellElement;
        this.tooltipVisible = true;
    }

    expandAll() {
        this.gridPedidosPMP.instance.expandAll();
    }

    collapseAll() {
        this.gridPedidosPMP.instance.collapseAll();
    }
}