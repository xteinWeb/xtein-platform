import { Component, OnInit, ViewChild } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { ADM015Service } from 'src/app/services/ADM015/ADM015.service';
import { CommonModule } from '@angular/common';
import { DxCheckBoxModule, DxTreeListComponent, DxTreeListModule } from 'devextreme-angular';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { showToast } from '../../../shared/toast/toastComponent.js';

@Component({
  selector: 'app-ADM01506',
  templateUrl: './ADM01506.component.html',
  styleUrls: ['./ADM01506.component.css'],
  standalone: true,
  imports: [CommonModule, DxTreeListModule, DxCheckBoxModule]
})
export class ADM01506Component implements OnInit {
  @ViewChild('treeList01506', { static: false }) treeList01506: DxTreeListComponent;

  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subscription: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  focusedRowKey: any;

  // Variables de datos
  DTreeList: any[] = [];

  constructor(private _sdatos: ADM015Service) {
    this.subscription = this._sdatos
      .getObs_UsuarioConexiones()
      .subscribe((datprm) => {
        this.operCompo(datprm);
      });
  }

  ngOnInit(): void {
    if (this._sdatos.USUARIO) {
      this.valoresObjetos('aplicacionesAsociadas');
    }
    // console.log('Usuario ', this._sdatos.USUARIO);
    // console.log('Usuario  LocalStorage ', localStorage.getItem('usuario')?? '');
    // console.log('Empresa ', localStorage.getItem('empresa')?? '');
  }

  valoresObjetos(obj: string) {
    if (obj == 'aplicacionesAsociadas' || obj == 'todos') {
      const prm = {
        USUARIO: this._sdatos.USUARIO,
        ID_UN: localStorage.getItem('empresa') ?? '',
        APLICACIONES_ASOCIADAS: [{
          CAMPO: 'ID_APLICACION',
          EXPRESION: 'Z001',
          TABLA: 'APLICACIONES_ASOCIADAS'
        }]
      };
      this._sdatos.consultaAplicacionesAsociadas('consulta', prm, 'ADM015').subscribe((data: any) => {
        const res = validatorRes(data);
        if (data.token != undefined) {
          localStorage.setItem('token', data.token);
        }
        if (res[0].ErrMensaje === '') {
          this.DTreeList = res.map((item: any) => ({
            ID_APLICACION:       item.ID_APLICACION,
            ID_APLICACION_PADRE: item.ID_APLICACION_PADRE === 'RAIZ' ? null : item.ID_APLICACION_PADRE,
            NOMBRE:              item.NOMBRE,
            VER:                 !!item.A_LISTAR,
            DATA_IA:             item.DATA_IA ?? false
          }));
        } else {
          this.DTreeList = [];
          showToast(res[0].ErrMensaje, 'warning');
        }
      });
    }
  }

  operCompo(operMenu: any): void {
    switch (operMenu.accion) {
      case 'r_ini':
        break;

      case 'r_nuevo':
        this.mnuAccion = 'new';
        this.esEdicion = true;
        this.DTreeList = [];
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.esEdicion = true;
        break;

      case 'r_guardar':
        this.opPrepararGuardar();
        break;

      case 'r_primero':
      case 'r_anterior':
      case 'r_siguiente':
      case 'r_ultimo':
      case 'r_numreg':
        this.opIrARegistro(operMenu.accion);
        this.esEdicion = false;
        break;

      case 'r_cancelar':
        this.valoresObjetos('aplicacionesAsociadas');
        this.mnuAccion = '';
        this.esEdicion = false;
        break;

      default:
        break;
    }
  }

  opPrepararGuardar() {
    this._sdatos.D_AplicacionesAsociadas = this.DTreeList.map((item: any) => ({
      ID_UN:         localStorage.getItem('empresa') ?? '',
      USUARIO:       this._sdatos.USUARIO,
      ID_APLICACION: item.ID_APLICACION,
      A_ABRIR:       false,
      A_CREAR:       false,
      A_MODIFICAR:   false,
      A_ELIMINAR:    false,
      A_BUSCAR:      false,
      A_LISTAR:      item.VER ?? false,
      A_EXCLUSIVA:   false,
      A_CONFIGURAR:  false
    }));
    this.esEdicion = false;
  }

  opIrARegistro(acc: any) {
    this.valoresObjetos('aplicacionesAsociadas');
  }

  onCellValueChanged(e: any): void {
    if (e.column.dataField !== 'VER') return;
    this.propagarDescendientes(e.key, e.value);
    this.treeList01506.instance.refresh();
  }

  propagarDescendientes(idPadre: string, valor: boolean): void {
    const hijos = this.DTreeList.filter(item => item.ID_APLICACION_PADRE === idPadre);
    hijos.forEach(hijo => {
      hijo.VER = valor;
      this.propagarDescendientes(hijo.ID_APLICACION, valor);
    });
  }

  onCheckVer(item: any, valor: boolean): void {
    item.VER = valor;
    this.propagarDescendientes(item.ID_APLICACION, valor);
  }
}
