import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import {
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDropDownBoxModule,
  DxFormModule,
  DxListModule,
  DxLoadPanelModule,
  DxNumberBoxModule,
  DxPopupModule,
  DxRadioGroupModule,
  DxTextBoxModule,
  DxTreeListModule,
} from 'devextreme-angular';
import Swal from 'sweetalert2';
import { showToast } from '../toast/toastComponent';
import { AngularSplitModule } from 'angular-split';
import { Subject, Subscription } from 'rxjs';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { CambiarMaterialComponent } from './cambio-materiales-form/cambio-materiales.component';
import { MatrizAvanzadaService } from 'src/app/services/matriz-avanzada/matriz-avanzada.service';
import { ActualizarParteComponent } from './actualizar-parte-form/actualizar-parte.component';
import dxCheckBox from 'devextreme/ui/check_box';
import { ListaPrecioComponent } from './lista-precio/lista-precio.component';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-matriz-avanzada',
    templateUrl: './matriz-avanzada.component.html',
    styleUrls: ['./matriz-avanzada.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        DxFormModule,
        DxDataGridModule,
        DxDropDownBoxModule,
        DxTextBoxModule,
        DxNumberBoxModule,
        DxButtonModule,
        DxTreeListModule,
        DxRadioGroupModule,
        CdkAccordionModule,
        DxLoadPanelModule,
        DxPopupModule,
        DxListModule,
        AngularSplitModule,
        CambiarMaterialComponent,
        ActualizarParteComponent,
        ListaPrecioComponent
    ],
    providers: []
})
export class MatrizAvanzadaComponent implements OnInit {


  private endPoint = environment.apiUrl;

  @ViewChild("treeListMatrices", { static: false }) treeListMatrices: DxDataGridComponent;

  DProductos: any[] = [];
  DataSourceMatrices: any[] = [];
  DLMatricesCAL: any[] = [];
  MAnterior: any[] = [];
  MNuevo: any[] = [];
  setDatos: any = [];
  subscription: Subscription;
  eventsDatos: Subject<any> = new Subject<any>();

  selectMatrizList: any[] = [];

  loadingVisible: boolean = false;
  widthSerchTreeList: any = 200;
  prmUsrAplBarReg: clsBarraRegistro;

  width: string = '50%';
  height: string = '50%';
  viewForm: string = '';
  USUARIO_LOCAL: any = '';
  EMPRESA: any = '';

  constructor(
    private sData: MatrizAvanzadaService,
    private _sbarreg: SbarraService
  ) {
    this.subscription = this._sbarreg
      .getObsRegApl()
      .subscribe((dempeg) => {
        if (dempeg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(dempeg);
      });

  }

  ngOnInit() {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.EMPRESA = localStorage.getItem('empresa');
    this.prmUsrAplBarReg = {
      tabla: "MATRIZ",
      aplicacion: "MA-019",
      usuario: this.USUARIO_LOCAL,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_refrescar: true }
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
  }

  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        const user: any = localStorage.getItem("usuario")
        this.prmUsrAplBarReg = {
          tabla: "MATRIZ",
          aplicacion: "MA-019",
          usuario: this.USUARIO_LOCAL,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_refrescar: true }
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);


        if (operMenu.operacion.filtro_arg !== this.viewForm) {
          this.DataSourceMatrices = [];
          this.DLMatricesCAL = [];
        } else {
          return;
        }
        switch (operMenu.operacion.filtro_arg) {
          case "Cambio de Material":
            this.valoresObjetos('baseCosto', operMenu.operacion.filtro_arg);
            setTimeout(() => {
              this.viewForm = operMenu.operacion.filtro_arg;
              this.DataSourceMatrices = [];
              this.DLMatricesCAL = [];
              //si va a visualizar totales debe colocar las tablas una debajo de la otra
              this.width = '100%';
              this.height = '50%';

            }, 500);
            break;
          case "Actualizar Parte":
            setTimeout(() => {
              this.viewForm = operMenu.operacion.filtro_arg;
              this.DataSourceMatrices = [];
              this.DLMatricesCAL = [];
              //si va a visualizar totales debe colocar las tablas una debajo de la otra
              this.width = '100%';
              this.height = '50%';
            }, 500);
            break;
          case "Inactivar Matrices":
            this.valoresObjetos('MATRICES EXISTENTES', '');
            this.viewForm = operMenu.operacion.filtro_arg;
            this.DataSourceMatrices = [];
            this.DLMatricesCAL = [];
            this.width = '50%';
            this.height = '100%';
            break;
          case "Actualizar por Lista de Precio":
            // this.valoresObjetos('MATRICES EXISTENTES', '');
            this.viewForm = operMenu.operacion.filtro_arg;
            this.DataSourceMatrices = [];
            this.DLMatricesCAL = [];
            this.width = '100%';
            this.height = '50%';
            break;

          default:
            break;
        }
        break;

      case "r_nuevo":
      case "r_modificar":
      case "r_guardar":
      case "r_buscar":
      case "r_buscar_ejec":
      case "r_eliminar":
      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
      case "r_cancelar":
      case "Vista":
      case 'r_refrescar':
      case "r_imprimir":
        break;

      default:
        break;
    }
  }

  valoresObjetos(accion: string, condicion: any) {
    if (accion === 'baseCosto' && (condicion === "Cambio de Material")) {
      const url: string = this.endPoint+'/PRO019/bases-costos';
      const prm = { DATOS: '' };
      this.loadingVisible = true;
      this.sData.consulta('VALOR BASE', prm, url).subscribe((data: any) => {
        this.loadingVisible = false;
        let res: any[] = [];
        if (data.data !== undefined && data.data !== null) {
          res = JSON.parse(data.data);
        } else {
          showToast('No hay listas de precios.', 'warning');
          return;
        }
        if ((data.token != undefined)) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const mensaje = res[0].ErrMensaje;
        if (mensaje != '') {
          this.showModal(mensaje, 'Error', "<i class='icon-cancelar-ol error-color'></i>",);
        }
        else {
          const base_costo: any = res.filter((d: any) => d.CLASE === 'BASES COSTO');
          this.sData.BASES_COSTOS = base_costo[0].CODIGO;
        }
      },
        (err => {
          this.loadingVisible = false;
          this.showModal(err.message, 'Error', "<i class='icon-cancelar-ol error-color'></i>",);
        })
      );
    };
    if (accion === 'MATERIAL EN MATRICES' || accion === 'MATRICES RELACIONADAS' && (condicion !== undefined || condicion !== null)) {
      const url: string = this.endPoint+'/matrizAvanzada/consulta';
      const prm = condicion;
      this.loadingVisible = true;
      this.sData.consulta(accion, prm, url).subscribe((data: any) => {
        this.loadingVisible = false;
        let res: any[] = [];
        if (data.data !== undefined && data.data !== null) {
          res = JSON.parse(data.data);
        } else {
          showToast('No hay matrices relacionadad.', 'warning');
          return;
        }
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.DataSourceMatrices = [];
          this.showModal(mensaje, '', "<i class='icon-alert-ol'></i>");
        } else {

          newArray.forEach((matriz: any) => {
            if (newArray.findIndex((d: any) => matriz.PADRE === d.PRODUCTO) === -1) {
              matriz.TEMP = matriz.PADRE;
              matriz.PADRE = 'RAIZ';
            }
          });
          this.DLMatricesCAL = [];
          this.DataSourceMatrices = newArray;
        };
      },
        (err => {
          this.loadingVisible = false;
          this.showModal(err.message, '', "<i class='icon-alert-ol'></i>");
        })
      );
    };
    if (accion === 'CALCULAR CAMBIO MATERIAL' && (condicion !== undefined || condicion !== null)) {
      const url: string = this.endPoint+'/matrizAvanzada/consulta';
      const prm = condicion
      this.loadingVisible = true;
      this.sData.consulta('CALCULAR CAMBIO MATERIAL', prm, url).subscribe((data: any) => {
        this.loadingVisible = false;
        let res: any[] = [];
        if (data.data !== undefined && data.data !== null) {
          res = JSON.parse(data.data);
        }
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        } else {
          showToast('No hay matrices relacionadad.', 'warning');
          return;
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.DLMatricesCAL = [];
          this.showModal(mensaje, '', "<i class='icon-alert-ol'></i>");
        } else {
          this.DLMatricesCAL = newArray;
        };
      },
        (err => {
          this.loadingVisible = false;
          this.showModal(err.message, '', "<i class='icon-alert-ol'></i>");
        })
      );
    };
    if (accion === 'CALCULAR TOTALES') {
      const url: string = this.endPoint+'/matrizAvanzada/consulta';
      const prm = { MATRICES: this.selectMatrizList };
      this.loadingVisible = true;
      this.sData.consulta('CALCULAR TOTALES', prm, url).subscribe((data: any) => {
        this.loadingVisible = false;
        let res: any[] = [];
        if (data.data !== undefined && data.data !== null) {
          res = JSON.parse(data.data);
        } else {
          showToast('No hay matrices relacionadad.', 'warning');
          return;
        }
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.DLMatricesCAL = [];
          this.showModal(mensaje, '', "<i class='icon-alert-ol'></i>");
        } else {
          this.DLMatricesCAL = newArray;
        };
      },
        (err => {
          this.loadingVisible = false;
          this.showModal(err.message, '', "<i class='icon-alert-ol'></i>");
        })
      );
    };
    if (accion === 'MATRICES EXISTENTES') {
      const url: string = this.endPoint+'/matrizAvanzada/consulta';
      const prm = {};
      this.loadingVisible = true;
      this.sData.consulta('MATRICES EXISTENTES', prm, url).subscribe((data: any) => {
        this.loadingVisible = false;
        const res = JSON.parse(data.data);
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        this.loadingVisible = false;
        if (mensaje !== '') {
          this.showModal(mensaje, '', "<i class='icon-alert-ol'></i>");
        } else {
          this.DataSourceMatrices = newArray;
        };
      },
        (err => {
          this.loadingVisible = false;
          this.showModal(err.message, '', "<i class='icon-alert-ol'></i>");
        })
      );
    };
    if (accion === 'CALCULAR CON LISTA PRECIO' && (condicion !== undefined || condicion !== null)) {
      const url: string = this.endPoint+'/matrizAvanzada/consulta';
      const prm = condicion
      this.loadingVisible = true;
      this.sData.consulta('CALCULAR CON LISTA PRECIO', prm, url).subscribe((data: any) => {
        this.loadingVisible = false;
        let res: any[] = [];
        if (data.data !== undefined && data.data !== null) {
          res = JSON.parse(data.data);
        }
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.DLMatricesCAL = [];
          this.showModal(mensaje, '', "<i class='icon-alert-ol'></i>");
        } else {
          this.DLMatricesCAL = newArray;
        };
      },
        (err => {
          this.loadingVisible = false;
          this.showModal(err.message, '', "<i class='icon-alert-ol'></i>");
        })
      );
    };
  }

  onSeleccionMatrices(e: any) {
    this.selectMatrizList = e.selectedRowKeys;
    switch (this.viewForm) {
      // case 'Actualizar Parte':
      case 'Inactivar Matrices':
        this.DLMatricesCAL = e.selectedRowsData;
        break;

      default:
        break;
    }
  }

  onAceptarBtn(e: any, btn: string) {
    switch (btn) {
      case 'CALCULAR':
        switch (this.viewForm) {
          case 'Cambio de Material':
            if (this.selectMatrizList.length > 0) {
              if (this.MNuevo.length > 0 && this.MAnterior.length > 0) {
                let data = {
                  MNuevo: this.MNuevo,
                  MAnterior: this.MAnterior,
                  MATRICES: this.selectMatrizList
                }
                this.valoresObjetos('CALCULAR CAMBIO MATERIAL', data);
              } else {
                showToast('No has seleccionado el material nuevo.', 'warning');
              }
            } else {
              showToast('No hay matrices seleccionadas.', 'warning');
            }
            break;
          case 'Actualizar Parte':
            if (this.selectMatrizList.length > 0) {
              this.valoresObjetos('CALCULAR TOTALES', '');
            } else {
              showToast('No hay matrices seleccionadas.', 'warning');
            }
            break;
          case 'Actualizar por Lista de Precio':
            if (this.DataSourceMatrices.length > 0) {
              this.valoresObjetos('CALCULAR CON LISTA PRECIO', {ID_LISTA: this.MNuevo[0].ID_LISTA, MATRICES: this.DataSourceMatrices});
            } else {
              showToast('No hay matrices seleccionadas.', 'warning');
            }
            break;

          default:
            break;
        }
        break;

      case 'CANCELAR':
        if (this.viewForm === 'Cambio de Material') {
          this.eventsDatos.next({
            accion: 'cancelar',
            vista:'Cambio de Material'
          });
        } else if (this.viewForm === 'Actualizar Parte') {
          this.eventsDatos.next({
            accion: 'cancelar',
            vista:'Actualizar Parte'
          });
        } else if (this.viewForm === 'Inactivar Matrices') {
          this.treeListMatrices.instance.clearSelection();
        }

        this.DLMatricesCAL = [];
        break;

      case 'GUARDAR':
        switch (this.viewForm) {
          case 'Cambio de Material':
            if (this.DLMatricesCAL.length > 0) {
              const url: string = this.endPoint+'/matrizAvanzada/consulta';
              this.guardarMatrices('GENERAR AUTORIZACION CAMBIO MATERIAL', {MATRICES: this.DLMatricesCAL}, url);
            } else {
              showToast('No hay matrices seleccionadas.', 'warning');
            }
            break;
          case 'Actualizar Parte':
            if (this.DLMatricesCAL.length > 0) {
              const url: string = this.endPoint+'/matrizAvanzada/consulta';
              this.guardarMatrices('GENERAR AUTORIZACION TOTALES', {MATRICES: this.DLMatricesCAL, PRODUCTO: this.MAnterior }, url);
            } else {
              showToast('No hay matrices seleccionadas.', 'warning');
            }
            break;
          case 'Inactivar Matrices':
            if (this.DLMatricesCAL.length > 0) {
              const url: string = this.endPoint+'/matrizAvanzada/consulta';
              this.guardarMatrices('GENERAR AUTORIZACION INACTIVAR MATRICES', {MATRICES: this.DLMatricesCAL}, url);
            } else {
              showToast('No hay matrices seleccionadas.', 'warning');
            }
            break;
          case 'Actualizar por Lista de Precio':
            if (this.DLMatricesCAL.length > 0) {
              const url: string = this.endPoint+'/matrizAvanzada/consulta';
              this.guardarMatrices('GENERAR AUTORIZACION LISTA PRECIO', {MATRICES: this.DLMatricesCAL}, url);
            } else {
              showToast('No hay matrices cargadas.', 'warning');
            }
            break;

          default:
            break;
        }
        break;

      default:
        break;
    }
  }

  guardarMatrices(accion: string, data, url) {
    let prm = { ...data, USUARIO: this.USUARIO_LOCAL }
    this.loadingVisible = true;
    this.sData.consulta(accion, prm, url).subscribe((data: any) => {
      this.loadingVisible = false;
      const res = JSON.parse(data.data);
      if (data.token != undefined) {
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      const newArray = res;
      const mensaje = newArray[0].ErrMensaje;
      if (mensaje !== '') {
        this.showModal(mensaje, '', "<i class='icon-alert-ol'></i>");
      } else {
        showToast('Matrices Actializadas', '');
        switch (this.viewForm) {
          case 'Cambio de Material':
            this.onRespuestaPerfilTrib({accion: 'limpiar'});
            break;
          case 'Actualizar Parte':
            this.onRespuestaPerfilTrib({accion: 'limpiar'});
            break;
          case 'Inactivar Matrices':
            this.onAceptarBtn('', 'CANCELAR');
            break;

          default:
            break;
        }
      };
    },
      (err => {
        this.loadingVisible = false;
        this.showModal(err.message, '', "<i class='icon-alert-ol'></i>");
      })
    );
  }

  showModal(mensaje: any, title: any, icon: string) {
    const tipo = title;
    Swal.fire({
      iconHtml: icon,
      confirmButtonColor: tipo === 'Error' ? 'DF3E3E' : '#0F4C81 !important',
      title: title,
      html: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      stopKeydownPropagation: false,
    });
  }

  onRespuestaPerfilTrib(e: any) {
    switch (e.accion) {
      case 'Set Materiales':
        this.MNuevo = e.data.MNUEVO;
        this.MAnterior = e.data.MANTERIOR;
        break;
      case 'Cambio de Material':
        // this.MAnterior = e.data.MANTERIOR;
        // let data = {
        //   PRODUCTO: e.data.PRODUCTO
        // }
        this.valoresObjetos('MATERIAL EN MATRICES', e.data);
        break;
      case 'Actualizar Parte':
        this.MAnterior = e.data.PRODUCTO;
        this.valoresObjetos('MATRICES RELACIONADAS', e.data);
        break;
      case 'Actualizar por Lista de Precio':
        this.DataSourceMatrices = e.data.MATRICES;
        this.MNuevo = [{ID_LISTA: e.data.ID_LISTA}];
        break;
      case 'limpiar':
        this.selectMatrizList = [];
        this.DataSourceMatrices = [];
        this.DLMatricesCAL = [];
        break;

      default:
        break;
    }
  }

  onCellPreparedLP(e: any) {
    if (this.viewForm === 'Cambio de Material') {
      if (this.DataSourceMatrices.length > 0) {
        if (e.rowType == "data" && e.cellElement.querySelector(".dx-select-checkbox")) {
          let check = e.cellElement.querySelectorAll(".dx-select-checkbox");
          check.forEach((ele: any, ixfila: any) => {
            const inst = dxCheckBox.getInstance(ele);
            if (this.MAnterior[0].ID_UDM === e.data.ID_UDM) {
              inst.option("visible", true);
            } else {
              inst.option("visible", false);
            }
          });
        };
      }
    }
  }
}
