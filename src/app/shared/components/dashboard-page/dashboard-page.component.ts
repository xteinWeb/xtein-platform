import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { DashboardViewerComponent } from '../dashboard-viewer/dashboard-viewer.component';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { Subscription } from 'rxjs';
import { DxButtonModule } from 'devextreme-angular';
import { DashboardService } from 'src/app/shared/services/dashboard.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    DashboardViewerComponent,
    DxButtonModule
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css']
})
export class DashboardPageComponent implements OnInit {

  @Input()
  aplicacion!: string;
  dashboardId!: string;
  prmUsrAplBarReg: clsBarraRegistro;
  USUARIO: any;  
  subscription: Subscription;
  dashboardFullscreen = false;
  dashboardType!: string;
  lastUpdated: Date | null = null;

  constructor(      
      private _sbarreg: SbarraService,  
      private sData: DashboardService  
    ) {
      // Servicio de barra de registro
      this.subscription = this._sbarreg
      .getObsRegApl()
      .subscribe((datreg) => {
        // Valida si la petición es para esta aplicacion
        if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });
    }

  ngOnInit(): void {
    this.USUARIO = localStorage.getItem('usuario')?.toUpperCase();    
    const request = {
      dashboardId: this.aplicacion,
      user: this.USUARIO,
      type: 'view',
      filter: [
        {
          Field: '',
          Value: ''
        }
      ]
    };

    // Get Dashboard Type
    this.sData.consulta('DashboardType', {ID_APLICACION: this.aplicacion}, 'dashboard-data')
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (data.token != undefined) {
          localStorage.setItem('token', data.token);
        }
        if (res[0]?.ErrMensaje === '') {
          this.dashboardType = res[0]?.TIPO;  
          this.lastUpdated = res[0]?.FECHA_ACTUALIZACION;  
          this.dashboardId = JSON.stringify(request);        
        }
      }); 
      
    this.prmUsrAplBarReg = {
      tabla: '',
      aplicacion: this.aplicacion,
      usuario: this.USUARIO,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: {},
    };
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        const user:any = localStorage.getItem("usuario");
        this.prmUsrAplBarReg = {
          tabla: "",
          aplicacion: this.aplicacion,
          usuario: this.USUARIO,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;
      case 'r_refrescar':       
      const idAplicacionActiva = this.dashboardId;
        this.dashboardId = '';
        setTimeout(() => {
            this.dashboardId = idAplicacionActiva;
        });
      break;  
      default:
        break;
    }
  }
}