import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent, DxDataGridModule, DxTextAreaModule } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { PRO007Service } from 'src/app/services/PRO007/PRO007.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-PRO02204',
  templateUrl: './PRO02204.component.html',
  styleUrls: ['./PRO02204.component.css'],
  standalone: true,
  imports: [DxDataGridModule, DxTextAreaModule]
})
export class PRO02204Component implements OnInit {

  @ViewChild("GEspecCompo", { static: false }) gridEspec: DxDataGridComponent;

  subscription: Subscription;
  DCompoPro: any;
  readOnly: boolean = false;
  esEdicion: boolean = false;
  mnuAccion: string;
  VDatosReg: any;

  constructor(private _sdatos: PRO007Service) { 

    // Recibe de productos
    this.subscription = this._sdatos
    .getObs_ProEspec()
    .subscribe((datprm) => {
      // Ejecuta de acuerdo al parámetro de producto
      this.operCompo(datprm);
    });
    this.onEditorPreparing = this.onEditorPreparing.bind(this);
  }

  onEditorPreparing(e) {
    if (e.dataField === "DETALLE") {
      e.editorName = "dxTextArea";
      e.editorOptions.autoResizeEnabled = true;
      e.editorOptions.addEventListener("oninitialized", (e) => {
        e.element.closest("td").classList.add("dx-editor-cell");
        let prevWidth = null;
        var intervalID = setInterval(() => {
          if(e.element.offsetWidth !== prevWidth) {
            e.component.beginUpdate();
            e.component.option("autoResizeEnabled", false);
            e.component.option("autoResizeEnabled", true);
            e.component.endUpdate();
          }
          prevWidth = e.element.offsetWidth;
        }, 200);
    
        e.component.on("disposing", function () {
          clearInterval(intervalID);
        });
      });
    }
  }

  onCellClick() {
    if (this._sdatos.PRODUCTO === '') {
      this.showModal('No se ha introducido ningún código de producto principal!');
      return;
    }
  }

  // Llama a Acciones de registro
  operCompo(operMenu: any): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.opBlanquearForma();
        if (operMenu.esEdicion !== '' || operMenu.esEdicion !== null || operMenu.esEdicion !== undefined ) this.esEdicion = operMenu.esEdicion;
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.mnuAccion = "update";
        this.opPrepararModificar();
        break;

      case "r_guardar":
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case "r_buscar":
        this.opPrepararBuscar('');
        break;

      case "r_buscar_ejec":
        this.opBlanquearForma();
        this.opPrepararBuscar('');
        break;

      case "r_eliminar":
        this.opEliminar();
        break;

      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
        this.esEdicion = false;
        this.opIrARegistro(operMenu.accion);
        break;

      case "r_cancelar":
        this.esEdicion = false;
        // this.opBlanquearForma();
        // this.valoresObjetos('composicion');
        break;

      case "r_refrescar":
        this.valoresObjetos('composicion');
        break;

      default:
        break;
    }
  }
  
  opPrepararNuevo() {
    this.esEdicion = true;
    this.opBlanquearForma();
  }
  opPrepararModificar() {
    this.esEdicion = true;
  }
  opPrepararGuardar(accion) {}

  opBlanquearForma() {
    if (this.DCompoPro !== undefined) {
      this.DCompoPro.forEach(ele => {
        ele.DETALLE = '';
      });
      this._sdatos.D_Compo = this.DCompoPro;
    } else {
      this._sdatos.D_Compo = [];
    }
    // this.valoresObjetos('composicion');
  }

  opPrepararBuscar(oper) {}
  opEliminar() {}
  opIrARegistro(acc) {
    this.valoresObjetos('composicion');
  }
  opVista() {}

  onValueChanged(e){
    this._sdatos.D_Compo = this.DCompoPro;
    this._sdatos.conCambios = this._sdatos.conCambios + 1;
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string){  
    if (obj == 'composicion' || obj == 'todos') {
      const prm = { PRODUCTO: this._sdatos.PRODUCTO };
      this._sdatos.consulta('COMPOSICION BASE',prm, 'PRO022').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DCompoPro = res;
        if (this._sdatos.accion !== 'r_ini')
          this._sdatos.D_Compo = this.DCompoPro;
      });
    }
  }

  ngOnInit(): void {

    // Ini
    this.esEdicion = false;
    this.valoresObjetos('todos');
    this.operCompo({ accion: this._sdatos.accion });
    
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  showModal(mensaje, titulo = 'Error!', msg_html= '') {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
      title: titulo,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: "center",
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }

}
