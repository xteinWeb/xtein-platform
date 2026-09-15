import { Component, OnInit, ViewChild } from '@angular/core';
import { DxListComponent, DxListModule, DxPopupModule } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { PRO007Service } from 'src/app/services/PRO007/PRO007.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-PRO02101',
  templateUrl: './PRO02101.component.html',
  styleUrls: ['./PRO02101.component.css'],
  standalone: true,
  imports: [DxPopupModule, DxListModule]
})
export class PRO02101Component implements OnInit {
  @ViewChild("listaOpcionesOrd", { static: false }) listaOpcionesOrd: DxListComponent;

  visiblePopup: boolean = false;
  listaValores: any[] = [];
  subscription: Subscription;
  configBotonAceptar: any;
  configBotonCancelar: any;

  constructor(private _sdatos: PRO007Service) 
  
  { 
    // Recibe de productos
    this.subscription = this._sdatos
      .getObs_OrdenAtr()
      .subscribe((datprm) => {
        // Ejecuta de acuerdo al parámetro de producto
        if (datprm.accion === 'activar')
          this.cargarDatos(datprm);
    });

    this.configBotonAceptar = {
      icon: 'todo',
      text: 'Aceptar',
      onClick: this.accionPopUp.bind(this, 'aceptar')
    };
    this.configBotonCancelar = {
      icon: 'close',
      text: 'Cancelar',
      onClick: this.accionPopUp.bind(this, 'cancelar')
    };

    this.accionPopUp = this.accionPopUp.bind(this);

  }

  accionPopUp(accion) {

    this.visiblePopup = false;
    if (accion === 'cancelar') return;

    // Prepara datos ordenados
    var listaPrm:any = [];
    for (var k=0; k < this.listaValores.length; k++) {
      listaPrm.push({ CODIGO: this.listaValores[k].CODIGO,
                      NOMBRE: this.listaValores[k].NOMBRE,
                      ORDEN: k+1
                   })
    }

    // actualizar ordenamiento
    const prm = listaPrm ;
    this._sdatos.consulta('reordenar atributos',prm,'PRO021').subscribe((data: any)=> {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      if (res[0].ErrMensaje !== '') {
        this.showModal(res[0].ErrMensaje);
      }
    });

  }

  onInitialized(e) {
    this.listaOpcionesOrd = e.component;
  }

  cargarDatos(datprm) {
    this.visiblePopup = true;

    // Carga datos de la lista
    const prm = { ID_APLICACION: datprm.aplicacion };
    this._sdatos.consulta('ATRIBUTOS',prm,'PRO021').subscribe((data: any)=> {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      this.listaValores = [];
      res.ATRIBUTOS.forEach(dat => {
        this.listaValores.push({ CODIGO: dat.CODIGO, NOMBRE: dat.NOMBRE });
      })
    });

  }
  onDragStart(e) {
    e.itemData = e.fromData[e.fromIndex];
  }
  onDragEnd(e) {
    e.fromData.splice(e.fromIndex, 1);
    e.toData.splice(e.toIndex, 0, e.itemData);
  }
  onAdd(e) {
    e.toData.splice(e.toIndex, 0, e.itemData);
  }
  onRemove(e) {
    e.fromData.splice(e.fromIndex, 1);
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  showModal(mensaje, titulo = '¡Error!', msg_html= '') {
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
