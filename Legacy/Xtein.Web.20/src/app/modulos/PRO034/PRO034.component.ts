import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { PRO03401Component } from './PRO03401/PRO03401.component';
import { PRO03402Component } from './PRO03402/PRO03402.component';
import { PRO03403Component } from './PRO03403/PRO03403.component';

@Component({
    selector: 'app-PRO034',
    templateUrl: './PRO034.component.html',
    styleUrls: ['./PRO034.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        PRO03401Component,
        PRO03402Component,
        PRO03403Component
    ]
})
export class PRO034Component implements OnInit, OnDestroy {
    unSubscribe: Subject<boolean> = new Subject<boolean>();
    events: Subject<any> = new Subject<any>();
    prmUsrAplBarReg: any = {};
    USUARIO_LOCAL: any = '';
    readOnly: boolean = true;

    constructor(private _sbarreg: SbarraService) { }

    ngOnInit(): void {
        this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase();
        this.prmUsrAplBarReg = {
            tabla: 'PLANES_MAESTROS',
            aplicacion: 'PRO-034',
            usuario: this.USUARIO_LOCAL,
            accion: 'r_ini',
            error: '',
            r_numReg: 0,
            r_totReg: 0,
            operacion: {}
        };

        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

        this._sbarreg.getObsRegApl()
            .pipe(takeUntil(this.unSubscribe))
            .subscribe((datreg) => {
                if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
                    this.opMenuRegistro(datreg);
            });
    }

    ngOnDestroy(): void {
        this.unSubscribe.next(true);
        this.unSubscribe.complete();
    }

    opMenuRegistro(operMenu: any): void {
        console.log('Acción de barra:', operMenu.accion);
        switch (operMenu.accion) {
            case 'r_modificar':
                this.readOnly = false;
                this.events.next({ accion: 'set_readOnly', valor: false });

                break;
            case 'r_cancelar':
                this.readOnly = true;
                this.events.next({ accion: 'set_readOnly', valor: true });
                this.prmUsrAplBarReg.accion = 'r_cancelar';
                this.prmUsrAplBarReg.operacion = {};
                this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
                break;
            case 'r_guardar':
                // Placeholder for save logic
                this.readOnly = true;
                this.events.next({ accion: 'set_readOnly', valor: true });
                this.prmUsrAplBarReg.accion = 'r_navegar';
                this.prmUsrAplBarReg.operacion = {};
                this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
                break;
            case 'r_refrescar':
                console.log("refrescar")
                this.readOnly = true;
                this.prmUsrAplBarReg.accion = 'r_refrescar';
                this.prmUsrAplBarReg.operacion = {};
                this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
                this.events.next({ accion: 'load_data' });
                break;
        }
    }

    totalesProgramados: any = { cant: 0, money: 0 };
    totalesPendientes: any = { cant: 0, money: 0 };

    onRespuestaComponent(e: any): void {
        console.log('--- onRespuestaComponent START ---', e);
        if (e.accion === 'plan_seleccionado') {
            // Re-broadcast to other subcomponents
            this.events.next({
                componente: 'PRO03402',
                accion: 'plan_seleccionado',
                data: e.data
            });
            this.events.next({
                componente: 'PRO03403',
                accion: 'plan_seleccionado',
                data: e.data
            });
        } else if (e.accion === 'plan_deseleccionado') {
            this.events.next({ componente: 'PRO03402', accion: 'plan_deseleccionado' });
            this.events.next({ componente: 'PRO03403', accion: 'plan_deseleccionado' });
            this.events.next({
                componente: 'PRO03401',
                accion: 'update_percentages',
                data: { sobredimensionado: 0, comprometido: 0, programado: 0, enProceso: 0, finalizado: 0 }
            });
            this.totalesProgramados = { cant: 0, money: 0 };
            this.totalesPendientes = { cant: 0, money: 0 };
            this.emitirTotalesAlHeader();

        } else if (e.accion === 'update_percentages') {
            this.events.next({
                componente: 'PRO03401',
                accion: 'update_percentages',
                data: e.data
            });
        } else if (e.accion === 'update_sin_capacidad') {
            this.events.next({
                componente: 'PRO03401',
                accion: 'update_sin_capacidad',
                data: e.data
            });
        } else if (e.accion === 'update_totals_programmed') {
            this.totalesProgramados = e.data;
            this.emitirTotalesAlHeader();
        } else if (e.accion === 'update_totals_pending') {
            this.totalesPendientes = e.data;
            this.emitirTotalesAlHeader();
        } else if (e.accion === 'dia_programacion_cambiado') {
            this.events.next({
                componente: 'PRO03403',
                accion: 'dia_programacion_cambiado',
                data: e.data
            });
        } else if (e.accion === 'productos_programados') {
            console.log('Buscando refrescar subcomponentes...');
            this.events.next({ componente: 'PRO03402', accion: 'refresh_data' });
            this.events.next({ componente: 'PRO03403', accion: 'refresh_data' });
        }
    }

    emitirTotalesAlHeader() {
        this.events.next({
            componente: 'PRO03401',
            accion: 'update_totals',
            data: {
                programado: this.totalesProgramados,
                pendiente: this.totalesPendientes
            }
        });
    }
}
