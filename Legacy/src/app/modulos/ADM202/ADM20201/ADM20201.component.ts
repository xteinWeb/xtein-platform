import { Component, OnInit, ViewChild } from '@angular/core';
import {
  DxFormComponent,
  DxFormModule,
  DxSelectBoxModule,
} from 'devextreme-angular';
import { CListaIdetificacion } from '../clsADM202.class';
import { ADM202Service } from 'src/app/services/ADM202/ADM202.service';
import { validatorRes } from 'src/app/shared/validator/validator';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ADM20201',
  templateUrl: './ADM20201.component.html',
  styleUrls: ['./ADM20201.component.css'],
  standalone: true,
  imports: [DxFormModule, DxSelectBoxModule],
})
export class ADM20201Component implements OnInit {
  @ViewChild('formIdentificacion', { static: false })
  formIdentificacion: DxFormComponent;

  subscriptionReadOnly: Subscription;

  readOnly: boolean = true;
  FIdentificacion: CListaIdetificacion;
  DActividad: any;
  DCodigos: any;
  mnuAccion: string;

  constructor(private sData: ADM202Service) {
    this.subscriptionReadOnly = this.sData.getReadOnly().subscribe((datprm) => {
      this.getReadOnly(datprm);
    });
  }

  ngOnInit() {
    this.FIdentificacion = {
      TIPO_ACTIVIDAD: this.sData.D_Identificacion.TIPO_ACTIVIDAD,
      ID_ACTIVIDAD: this.sData.D_Identificacion.ID_ACTIVIDAD,
      COSTEO_INVENTARIO: this.sData.D_Identificacion.COSTEO_INVENTARIO,
      INVENTARIO: this.sData.D_Identificacion.INVENTARIO,
    };
    this.valoresObjetos('todos');
    this.operCompo({ accion: this.sData.accion });
  }

  operCompo(operMenu: any): void {
    switch (operMenu.accion) {
      case 'r_ini':
        break;

      case 'r_nuevo':
        this.mnuAccion = 'new';
        this.readOnly = true;
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.readOnly = false;
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case 'r_buscar':
        this.valoresObjetos('todos');
        break;

      case 'r_eliminar':
        this.opEliminar();
        break;

      case 'r_primero':
      case 'r_anterior':
      case 'r_siguiente':
      case 'r_ultimo':
      case 'r_numreg':
        this.opIrARegistro(operMenu.accion);
        this.readOnly = false;
        break;

      case 'r_cancelar':
        this.valoresObjetos('autorizaciones');
        break;

      default:
        break;
    }
  }

  getReadOnly(datprm: any) {
    this.readOnly = datprm;
  }

  opPrepararNuevo() { }

  opPrepararModificar() {
    this.setObsToService('r_modificar');
  }

  opPrepararGuardar(accion: any) {
    this.readOnly = false;
    this.sData.FUDnegocios = this.FIdentificacion;

  }

  setObsToService(accion: any) {
    this.sData.setObs_Identificacion({ accion: accion });
  }

  opEliminar() { }

  opIrARegistro(acc: any) {
    this.valoresObjetos('ACTIVIDAD');
  }

  onValueChangedForm(e: any, campo: string) {
    if (e.value !== '') {
      switch (campo) {
        case 'INVENTARIO':
          this.sData.D_Identificacion.INVENTARIO = e.value;
          break;
        case 'NOMBRE':
          this.sData.D_Identificacion.ID_ACTIVIDAD = e.value;
          break;
        case 'COSTEO_INVENTARIO':
          this.sData.D_Identificacion.COSTEO_INVENTARIO = e.value;
          break;
        case 'TIPO_ACTIVIDAD':
          this.sData.D_Identificacion.TIPO_ACTIVIDAD = e.value;
          break;
        case 'ID_ACTIVIDAD':
          this.sData.D_Identificacion.ID_ACTIVIDAD = e.value;
          break;

        default:
          break;
      }
    }
  }

  valoresObjetos(obj: string) {
    if (obj === 'ACTIVIDAD' || obj === 'todos') {
      // Carga las Grupos registradas
      const prm = {};
      this.sData
        .consulta('ACTIVIDADES', prm, 'ADM202')
        .subscribe((data: any) => {
          const res = validatorRes(data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          for (let i = 0; i < res.length; i++) {
            res[i].COD = i;
          }

          // Asocia datos de arbol y de grupos padre
          this.DActividad = res;
        });
    }

    if (obj === 'CODIGOS' || obj === 'todos') {
      const prm = { ID_DOMINIO: 'CIIU', ID_GRUPO_DOMINIO: 'ACTIVIDADES' };
      this.sData.consulta('ITM_DOMINIOS', prm, 'ADM012').subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (res[0].ErrMensaje !== '') {
          this.DCodigos = [];
        } else {
          for (let i = 0; i < res.length; i++) {
            res[i].COD = i;
          }

          this.DCodigos = res;
        }
      });
    };
  }
}
