import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DxDropDownBoxModule, DxDataGridModule, DxDateBoxModule, DxTextBoxModule, DxNumberBoxModule, DxTooltipModule } from 'devextreme-angular';
import { Observable, Subscription } from 'rxjs';
import { PRO034Service } from 'src/app/services/PRO034/PRO034.service';

@Component({
    selector: 'app-PRO03401',
    templateUrl: './PRO03401.component.html',
    styleUrls: ['./PRO03401.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        DxDropDownBoxModule,
        DxDataGridModule,
        DxDateBoxModule,
        DxTextBoxModule,
        DxNumberBoxModule,
        DxTooltipModule
    ],
    providers: [DatePipe]
})
export class PRO03401Component implements OnInit, OnDestroy {
    @Input() events: Observable<any>;
    @Output() onRespuestaComponent: EventEmitter<any> = new EventEmitter<any>();

    private eventsSubscription: Subscription;

    // Logic state
    readOnly: boolean = true;
    NOW: Date = new Date();
    // Data for the header
    DGplanes: any[] = [];
    DGplanesFiltro: any[] = [];
    selectPlanes: any[] = [];
    openPlanes: boolean = false;

    planMaestro: any = null; // Consecutivo del plan
    fechaProgramacion: any = null;
    filtroFecha: any = null;
    ultimaFechaProgramada: any = null;

    onValueChangedFecha(e: any): void {
        this.fechaProgramacion = e.value;
        this.onRespuestaComponent.emit({
            accion: 'dia_programacion_cambiado',
            data: e.value
        });
    }

    // Percentages state
    porcentajes: any = {
        sobredimensionado: 0,
        comprometido: 0,
        programado: 0,
        enProceso: 0,
        finalizado: 0
    };

    // Totals state
    totales: any = {
        programado: { cant: 0, money: 0 },
        pendiente: { cant: 0, money: 0 }
    };

    sinCapacidad: any[] = [];

    // Limits/Dates for validation
    planFechas: any = {
        inicio: null,
        final: null
    };

    constructor(
        private sData: PRO034Service,
        private datePipe: DatePipe
    ) { }

    ngOnInit(): void {
        this.eventsSubscription = this.events.subscribe((datos: any) => {
            if (datos.componente === 'PRO03401' || !datos.componente) {
                this.handleEvents(datos);
            }
        });

        this.valoresObjetos('planes produccion');
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
                this.aplicarFiltroPlanes();
                break;
            case 'update_percentages':
                this.porcentajes = { ...this.porcentajes, ...datos.data };
                break;
            case 'update_totals':
                this.totales = datos.data;
                break;
            case 'update_sin_capacidad':
                this.sinCapacidad = datos.data;
                break;
            case 'load_data':
                this.valoresObjetos('planes produccion');
                break;
        }
    }

    valoresObjetos(obj: string): void {
        if (obj === 'planes produccion') {
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
                } else if (res && res.length > 0) {
                    this.DGplanes = res;
                    this.aplicarFiltroPlanes();
                }
            });
        }
    }

    aplicarFiltroPlanes(): void {
        if (this.readOnly) {
            this.DGplanesFiltro = this.DGplanes;
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            this.DGplanesFiltro = this.DGplanes.filter(plan => {
                const fechaFinal = plan.FECHA_FINAL ? new Date(plan.FECHA_FINAL) : null;
                if (!fechaFinal) return true; // Si no tiene fecha, lo dejamos por si acaso
                fechaFinal.setHours(0, 0, 0, 0);
                return fechaFinal >= today;
            });
        }
    }

    onSelectionChangedPlan(e: any, type: string): void {
        if (type === 'GRID') {
            if (e.selectedRowKeys.length > 0) {
                const item = e.selectedRowsData[0];
                this.planMaestro = item.CONSECUTIVO;
                this.planFechas.inicio = new Date(item.FECHA_INICIO);
                this.planFechas.final = new Date(item.FECHA_FINAL);
                this.openPlanes = false;

                // Clear dates when plan changes
                this.fechaProgramacion = null;
                this.filtroFecha = null;

                this.onRespuestaComponent.emit({
                    accion: 'plan_seleccionado',
                    data: item
                });

                this.onRespuestaComponent.emit({
                    accion: 'dia_programacion_cambiado',
                    data: null
                });
            }
        }

        if (type === 'DROP' && (!e.value || e.value.length === 0)) {
            this.planMaestro = null;
            this.planFechas.inicio = null;
            this.planFechas.final = null;
            this.fechaProgramacion = null;
            this.filtroFecha = null;

            this.onRespuestaComponent.emit({
                accion: 'plan_deseleccionado'
            });

            this.onRespuestaComponent.emit({
                accion: 'dia_programacion_cambiado',
                data: null
            });
        }
    }

    formatDate(date: any): string {
        return this.datePipe.transform(date, 'dd/MM/yyyy') || '--';
    }
}