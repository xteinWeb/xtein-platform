import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { DxButtonModule, DxNumberBoxModule } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { PRO019Service } from 'src/app/services/PRO019/PRO019.service';
import { PRO019DataService } from '../SERVICE/pro019.service';

@Component({
  selector: 'app-PRO01905',
  templateUrl: './PRO01905.component.html',
  styleUrls: ['./PRO01905.component.css'],
  standalone: true,
  imports: [CommonModule, DxNumberBoxModule, MatCardModule, DxButtonModule]
})
export class PRO01905Component implements OnInit {
  
  subscription: Subscription;
  subscriptionRead: Subscription;
  subscriptionConCambios: Subscription;

  DGTotales: any [] = [];
  TOTAL_MATERIALES: number = 0;
  TOTAL_MANO_OBRA: number = 0;
  TOTAL_COSTO_DIRECTO: number = 0;
  TOTAL_CIF: number = 0;
  TOTAL_COSTO: number = 0;
  TOTAL_UTILIDAD: number = 0;
  PRECIO_BASE: number = 0;
  CON_OPERATIVA: number = 0;
  TOTAL_AJUSTE_PRECIO: number = 0;
  TOTAL_PAG: number = 0;
  TOTAL_GRAVAMENES: number = 0;
  TOTAL_PDG: number = 0;
  TOTAL_MATRIZ: number = 0;
  VARIACION: number = 0;
  
  inputAttr: any;
  styleTitulo: any;
  styleCardsCosto: any;
  styleCardsTotalMatriz: any;
  readOnly: boolean;
  checkAllowEditing: boolean = true;
  // activeBtnCalcularTotal: boolean = false;
  // conCambios: number = 0;

  constructor(
    private sData: PRO019Service,
    public _sdatos: PRO019DataService
  ) {
    // Recibe de principal
    this.subscription = this._sdatos
      .getTotales()
      .subscribe((datprm) => {
        if (datprm.GRUPO === 'TOTALES')
          this.asignacion(datprm);
      }
    );
    this.subscriptionRead = this._sdatos
      .getReadOnly()
      .subscribe((datprm) => {
        this.getReadOnly(datprm);
      }
    );
    // this.subscriptionConCambios = this._sdatos
    //   .getConCambios()
    //   .subscribe((datprm) => {
    //     this._sdatos.conCambios = this._sdatos.conCambios + datprm;
    //   }
    // );
    this.onCalculateTotal = this.onCalculateTotal.bind(this);
  }

  ngOnInit(): void {
    this.readOnly = this._sdatos.readonly;
    this.DGTotales = [
      { TOTAL_DESCRIPCION: 'Utilidad', TOTAL_VALOR: this._sdatos.TOTAL_UTILIDAD, ICON: 'icon-coin' },
      { TOTAL_DESCRIPCION: 'Precio base', TOTAL_VALOR: this._sdatos.PRECIO_BASE, ICON: 'icon-coin' },
      { TOTAL_DESCRIPCION: 'Ajuste de Precio', TOTAL_VALOR: this._sdatos.TOTAL_AJUSTE_PRECIO, ICON: 'icon-coin' },
      { TOTAL_DESCRIPCION: 'Precio Antes Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_PAG, ICON: 'icon-coin' },
      { TOTAL_DESCRIPCION: 'Contribución operativa', TOTAL_VALOR: this._sdatos.CON_OPERATIVA, ICON: 'icon-coin' },
      { TOTAL_DESCRIPCION: 'Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_GRAVAMENES, ICON: 'icon-coin' },
      { TOTAL_DESCRIPCION: 'Precio Despues Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_PDG, ICON: 'icon-coin' },
      { TOTAL_DESCRIPCION: 'Total Matriz', TOTAL_VALOR: this._sdatos.TOTAL_MATRIZ, ICON: 'icon-matriz' }
    ];
    // if(this._sdatos.D_MATRIZ.CLASE.match('Juego|Producto compuesto|Parte compuesta'))
    //   this.valoresObjetos('CALCULAR TOTALES');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subscriptionRead.unsubscribe();
    // this.subscriptionConCambios.unsubscribe();
  }

  getReadOnly(datprm:any) {
    this.readOnly = datprm;
    if (this._sdatos.accion === "modificar") {
      this.DGTotales = [
        { TOTAL_DESCRIPCION: 'Utilidad', TOTAL_VALOR: this._sdatos.TOTAL_UTILIDAD, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Precio base', TOTAL_VALOR: this._sdatos.PRECIO_BASE, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Ajuste de Precio', TOTAL_VALOR: this._sdatos.TOTAL_AJUSTE_PRECIO, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Precio Antes Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_PAG, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Contribución operativa', TOTAL_VALOR: this._sdatos.CON_OPERATIVA, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_GRAVAMENES, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Precio Despues Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_PDG, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Variación', TOTAL_VALOR: this._sdatos.VARIACION, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Total Matriz', TOTAL_VALOR: this._sdatos.TOTAL_MATRIZ, ICON: 'icon-matriz' }
      ];
    } else {
      // this._sdatos.conCambios = 0;
      this.DGTotales = [
        { TOTAL_DESCRIPCION: 'Utilidad', TOTAL_VALOR: this._sdatos.TOTAL_UTILIDAD, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Precio base', TOTAL_VALOR: this._sdatos.PRECIO_BASE, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Ajuste de Precio', TOTAL_VALOR: this._sdatos.TOTAL_AJUSTE_PRECIO, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Precio Antes Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_PAG, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Contribución operativa', TOTAL_VALOR: this._sdatos.CON_OPERATIVA, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_GRAVAMENES, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Precio Despues Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_PDG, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Total Matriz', TOTAL_VALOR: this._sdatos.TOTAL_MATRIZ, ICON: 'icon-matriz' }
      ];
    }
  }

  asignacion(datos:any) {
    switch (datos.ACCION) {
      case 'CALCULAR':
        this.valoresObjetos('CALCULAR TOTALES');
        break;

      case 'CARGAR':
        this.getTotales(datos);
        break;
    
      default:
        break;
    }
  }

  onCalculateTotal(e: any) {
    if (this._sdatos.accion !== 'r_numreg') {
      this._sdatos.conCambios++;
      this._sdatos.setConCambios(this._sdatos.conCambios);
      this.TOTAL_AJUSTE_PRECIO = e.value;
      this._sdatos.TOTAL_AJUSTE_PRECIO = e.value;
      this._sdatos.accion
      this.valoresObjetos('CALCULAR TOTALES');
    }
  }

  getTotales(datprm: any) {
    this.TOTAL_MATERIALES = (datprm.TOTAL_MATERIALES !== null && datprm.TOTAL_MATERIALES !== undefined) ? datprm.TOTAL_MATERIALES : this._sdatos.TOTAL_MATERIALES;
    this.TOTAL_MANO_OBRA = (datprm.TOTAL_MANO_OBRA !== null && datprm.TOTAL_MANO_OBRA !== undefined) ? datprm.TOTAL_MANO_OBRA : this._sdatos.TOTAL_MANO_OBRA;
    this.TOTAL_COSTO_DIRECTO = (datprm.TOTAL_COSTO_DIRECTO !== null && datprm.TOTAL_COSTO_DIRECTO !== undefined) ? datprm.TOTAL_COSTO_DIRECTO : this._sdatos.TOTAL_COSTO_DIRECTO;
    this.TOTAL_CIF = (datprm.TOTAL_CIF !== null && datprm.TOTAL_CIF !== undefined) ? datprm.TOTAL_CIF : this._sdatos.TOTAL_CIF;
    this.TOTAL_COSTO = (datprm.TOTAL_COSTO !== null && datprm.TOTAL_COSTO !== undefined) ? datprm.TOTAL_COSTO : this._sdatos.TOTAL_COSTO;
    this.TOTAL_UTILIDAD = (datprm.TOTAL_UTILIDAD !== null && datprm.TOTAL_UTILIDAD !== undefined) ? datprm.TOTAL_UTILIDAD : this._sdatos.TOTAL_UTILIDAD;
    this.PRECIO_BASE = (datprm.PRECIO_BASE !== null && datprm.PRECIO_BASE !== undefined) ? datprm.PRECIO_BASE : this._sdatos.PRECIO_BASE;
    this.TOTAL_AJUSTE_PRECIO = (datprm.TOTAL_AJUSTE_PRECIO !== null && datprm.TOTAL_AJUSTE_PRECIO !== undefined) ? datprm.TOTAL_AJUSTE_PRECIO : this._sdatos.TOTAL_AJUSTE_PRECIO;
    this.TOTAL_PAG = (datprm.TOTAL_PAG !== null && datprm.TOTAL_PAG !== undefined) ? datprm.TOTAL_PAG : this._sdatos.TOTAL_PAG;
    this.CON_OPERATIVA = (datprm.CON_OPERATIVA !== null && datprm.CON_OPERATIVA !== undefined) ? datprm.CON_OPERATIVA : this._sdatos.CON_OPERATIVA;
    this.TOTAL_GRAVAMENES = (datprm.TOTAL_GRAVAMENES !== null && datprm.TOTAL_GRAVAMENES !== undefined) ? datprm.TOTAL_GRAVAMENES : this._sdatos.TOTAL_GRAVAMENES;
    this.TOTAL_PDG = (datprm.TOTAL_PDG !== null && datprm.TOTAL_PDG !== undefined) ? datprm.TOTAL_PDG : this._sdatos.TOTAL_PDG;

    // if ( this._sdatos.D_MATRIZ.CLASE.match('Juego|Producto compuesto|Parte compuesta')) {
    //   const total_costo = this._sdatos.DPartes.reduce((acc:any, item:any) => {
    //     return acc += item.TOTAL;
    //   }, 0);
    //   this.TOTAL_COSTO = this.TOTAL_COSTO + total_costo;
    //   this._sdatos.TOTAL_COSTO = this.TOTAL_COSTO;
    // }

    this._sdatos.TOTAL_MATERIALES = this.TOTAL_MATERIALES;
    this._sdatos.TOTAL_MANO_OBRA = this.TOTAL_MANO_OBRA;
    this._sdatos.TOTAL_CIF = this.TOTAL_CIF;
    this._sdatos.TOTAL_COSTO_DIRECTO = this.TOTAL_COSTO_DIRECTO;
    this._sdatos.TOTAL_COSTO = this.TOTAL_COSTO;
    this._sdatos.TOTAL_UTILIDAD = this.TOTAL_UTILIDAD;
    this._sdatos.PRECIO_BASE = this.PRECIO_BASE;
    this._sdatos.CON_OPERATIVA = this.CON_OPERATIVA;
    this._sdatos.TOTAL_PAG = this.TOTAL_PAG;
    this._sdatos.TOTAL_GRAVAMENES = this.TOTAL_GRAVAMENES;
    this._sdatos.TOTAL_PDG = this.TOTAL_PDG;
    this._sdatos.TOTAL_AJUSTE_PRECIO = this.TOTAL_AJUSTE_PRECIO;
    
    if (this._sdatos.accion === "modificar") {
      this.VARIACION = 1-(this._sdatos.TOTAL_MATRIZ / this._sdatos.TOTAL_PDG);
      this._sdatos.VARIACION = this.VARIACION;
      this.DGTotales = [
        { TOTAL_DESCRIPCION: 'Utilidad', TOTAL_VALOR: this._sdatos.TOTAL_UTILIDAD, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Precio base', TOTAL_VALOR: this._sdatos.PRECIO_BASE, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Ajuste de Precio', TOTAL_VALOR: this._sdatos.TOTAL_AJUSTE_PRECIO, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Precio Antes Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_PAG, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Contribución operativa', TOTAL_VALOR: this._sdatos.CON_OPERATIVA, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_GRAVAMENES, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Precio Despues Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_PDG, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Variación', TOTAL_VALOR: this._sdatos.VARIACION, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Total Matriz', TOTAL_VALOR: this._sdatos.TOTAL_MATRIZ, ICON: 'icon-matriz' }
      ];
    } else {
      // if (this._sdatos.accion === "") this._sdatos.conCambios = 0;
      this.TOTAL_MATRIZ = (datprm.TOTAL_MATRIZ !== null && datprm.TOTAL_MATRIZ !== undefined) ? datprm.TOTAL_MATRIZ : this._sdatos.TOTAL_MATRIZ;
      this._sdatos.TOTAL_MATRIZ = this.TOTAL_MATRIZ;
      this.VARIACION = 0;
      this._sdatos.VARIACION = this.VARIACION;
      this.DGTotales = [
        { TOTAL_DESCRIPCION: 'Utilidad', TOTAL_VALOR: this._sdatos.TOTAL_UTILIDAD, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Precio base', TOTAL_VALOR: this._sdatos.PRECIO_BASE, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Ajuste de Precio', TOTAL_VALOR: this._sdatos.TOTAL_AJUSTE_PRECIO, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Precio Antes Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_PAG, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Contribución operativa', TOTAL_VALOR: this._sdatos.CON_OPERATIVA, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_GRAVAMENES, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Precio Despues Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_PDG, ICON: 'icon-coin' },
        { TOTAL_DESCRIPCION: 'Total Matriz', TOTAL_VALOR: this._sdatos.TOTAL_MATRIZ, ICON: 'icon-matriz' }
      ];
    }

    this._sdatos.setTotales({
      GRUPO: 'PRINCIPAL', ACCION: 'CARGAR',
      TOTAL_MATERIALES: this._sdatos.TOTAL_MATERIALES,
      SUBTOTAL_MA: this._sdatos.SUBTOTAL_MA,
      PROTECCION_MA: this._sdatos.PROTECCION_MA,
      TOTAL_GRAVADOS: this._sdatos.TOTAL_GRAVADOS,
      TOTAL_SIN_IVA: this._sdatos.TOTAL_SIN_IVA,
      SUBTOTAL_MO: this._sdatos.SUBTOTAL_MO,
      PROTECCION_MO: this._sdatos.PROTECCION_MO,
      TOTAL_MANO_OBRA: this._sdatos.TOTAL_MANO_OBRA,
      TOTAL_COSTO_DIRECTO: this._sdatos.TOTAL_COSTO_DIRECTO,
      TOTAL_CIF: this._sdatos.TOTAL_CIF,
      TOTAL_CIF_VARIABLE: this._sdatos.TOTAL_CIF_VARIABLE,
      TOTAL_CIF_FIJO: this._sdatos.TOTAL_CIF_FIJO,
      TOTAL_COSTO: this._sdatos.TOTAL_COSTO,
      TOTAL_UTILIDAD: this._sdatos.TOTAL_UTILIDAD,
      PRECIO_BASE: this._sdatos.PRECIO_BASE,
      CON_OPERATIVA: this._sdatos.CON_OPERATIVA,
      TOTAL_AJUSTE_PRECIO: this._sdatos.TOTAL_AJUSTE_PRECIO,
      TOTAL_PAG: this._sdatos.TOTAL_PAG,
      TOTAL_GRAVAMENES: this._sdatos.TOTAL_GRAVAMENES,
      TOTAL_PDG: this._sdatos.TOTAL_PDG,
      VARIACION: this._sdatos.VARIACION
    });
    // TOTAL_MATRIZ: this._sdatos.TOTAL_MATRIZ
  }

  asignarTotal(e:any) {
    this.TOTAL_MATRIZ = this._sdatos.TOTAL_PDG;
    this._sdatos.TOTAL_MATRIZ = this.TOTAL_MATRIZ;
    this.DGTotales = [
      { TOTAL_DESCRIPCION: 'Utilidad', TOTAL_VALOR: this._sdatos.TOTAL_UTILIDAD, ICON: 'icon-coin' },
      { TOTAL_DESCRIPCION: 'Precio base', TOTAL_VALOR: this._sdatos.PRECIO_BASE, ICON: 'icon-coin' },
      { TOTAL_DESCRIPCION: 'Ajuste de Precio', TOTAL_VALOR: this._sdatos.TOTAL_AJUSTE_PRECIO, ICON: 'icon-coin' },
      { TOTAL_DESCRIPCION: 'Precio Antes Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_PAG, ICON: 'icon-coin' },
      { TOTAL_DESCRIPCION: 'Contribución operativa', TOTAL_VALOR: this._sdatos.CON_OPERATIVA, ICON: 'icon-coin' },
      { TOTAL_DESCRIPCION: 'Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_GRAVAMENES, ICON: 'icon-coin' },
      { TOTAL_DESCRIPCION: 'Precio Despues Gravamenes', TOTAL_VALOR: this._sdatos.TOTAL_PDG, ICON: 'icon-coin' },
      { TOTAL_DESCRIPCION: 'Variación', TOTAL_VALOR: this._sdatos.VARIACION, ICON: 'icon-coin' },
      { TOTAL_DESCRIPCION: 'Total Matriz', TOTAL_VALOR: this._sdatos.TOTAL_MATRIZ, ICON: 'icon-matriz' }
    ];
  }

  valoresObjetos(obj:string) {
    if (obj === 'CALCULAR TOTALES' || obj === 'todos') {
      const total_partes:number = this._sdatos.DPartes.reduce((acc:any, item:any) => {
        return acc += item.TOTAL;
      }, 0);
      const prm = { 
        IVA: this._sdatos.D_MATRIZ.PORCENTAJE,
        MARGEN: this._sdatos.D_MATRIZ.MARGEN_RENTABILIDAD/100,
        TOTAL_CIF: this._sdatos.TOTAL_CIF,
        TOTAL_COSTO_DIRECTO: this._sdatos.TOTAL_COSTO_DIRECTO,
        TOTAL_AJUSTE_PRECIO: this._sdatos.TOTAL_AJUSTE_PRECIO,
        TOTAL_PARTES: (total_partes !== null && total_partes !== undefined) ? total_partes : 0
      };
      // this.loadingVisible = true;
      this.sData.getCalcularTotales('CALCULAR TOTALES', prm).subscribe((data: any) => {
        // this.loadingVisible = false;
        const res = JSON.parse(data.data);
        if ( data.token != undefined ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        const newArray = res;
        const mensaje = newArray[0].ErrMensaje;
        if (mensaje !== '') {
          this.showModal(mensaje, '');
        } else {
          newArray[0].ACCION = 'CALCULAR';
          this.getTotales(newArray[0]);
        };
      },
        (err => {
          // this.loadingVisible = false;
          this.showModal(err.message, '');
        })
      );
    }
  }

  showModal(mensaje: any, title: any) {
    const tipo = title;
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo==='Error' ? 'DF3E3E':'#0F4C81 !important',
			title: title,
			text: mensaje,
			allowOutsideClick: true,
			allowEscapeKey: false,
			allowEnterKey: false,
			backdrop: true,
			position: 'center',
			stopKeydownPropagation: false,
		});
	}
  
}
