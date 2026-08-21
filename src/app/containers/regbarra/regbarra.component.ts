import { Component, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { SbarraService } from './_sbarra.service';
import { takeUntil } from 'rxjs/operators';
import { clsBarraRegistro } from './_clsBarraReg';
import { GlobalVariables } from '../../shared/common/global-variables';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import Swal from 'sweetalert2';
import { DxButtonModule, DxListModule, DxPopupModule, DxToolbarModule, DxTooltipModule } from 'devextreme-angular';

import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-regbarra',
    templateUrl: './regbarra.component.html',
    styleUrls: ['./regbarra.component.scss'],
    imports: [FormsModule, DxToolbarModule, DxTooltipModule, DxPopupModule, DxListModule, DxButtonModule]
})
export class RegbarraComponent implements OnInit {

  visibleSettings: boolean;
  listaOpciones: any[] = [];
  visibleListaOpc: boolean;
  visorBarra: boolean;

	menuItems : any = [
    {name: 'r_nuevo',font: 'icon-crear-ol', visible: false, uso: false},
    {name: 'r_modificar',font: 'icon-editar-ol', visible: false, uso: false},
    {name: 'r_eliminar',font: 'icon-eliminar-ol', visible: false, uso: false},
    {name: 'r_guardar',font: 'icon-aceptar-ol', visible: false, uso: false},
    {name: 'r_cancelar',font: 'icon-cancelar-ol', visible: false, uso: false},
    {name: 'r_buscar',font: 'icon-buscar-documentos-ol', visible: false, uso: false},
    {name: 'r_copiar',font: 'icon-copiar', visible: false, uso: false},
    {name: 'r_ordenar',font: 'icon-ordenar', visible: false, uso: false},
    {name: 'r_vista',font: 'icon-ver-ol', visible: false, uso: false},
    {name: 'r_primero',font: 'icon-primero', visible: false, uso: false},
    {name: 'r_anterior',font: 'icon-anterior', visible: false, uso: false},
    {name: 'r_numreg',font: '',visible: false, uso: false, valor: 0},
    {name: 'r_totreg',font: '',visible: false, uso: false, valor: 0},
    {name: 'r_siguiente',font: 'icon-siguiente', visible: false, uso: false},
    {name: 'r_ultimo',font: 'icon-ultimo', visible: false, uso: false},
    {name: 'r_descargar',font: 'icon-descargar-ol', visible: false, uso: false},
    {name: 'r_imprimir',font: 'icon-imprimir-ol', visible: false, uso: false},
    {name: 'r_refrescar',font: 'icon-refrescar', visible: false, uso: false},
    {name: 'r_configurar',font: 'icon-configurar-ol', visible: false, uso: false},
    {name: 'r_mas_opciones',font: 'icon-mas-opciones', visible: false, uso: false},
    {name: 'r_buscar_ejec',font: 'icon-buscar-ol', visible: false,uso: false},
  ]

  sub_Barra : any = [
    {name: 'r_nuevo',font: 'icon-crear-ol', visible: false,uso: false},
    {name: 'r_modificar',font: 'icon-editar-ol', visible: false,uso: false},
    {name: 'r_eliminar',font: 'icon-eliminar-ol', visible: false,uso: false},
    {name: 'r_guardar',font: 'icon-aceptar-ol', visible: false,uso: false},
    {name: 'r_cancelar',font: 'icon-cancelar-ol', visible: false,uso: false},
    {name: 'r_buscar',font: 'icon-buscar-documentos-ol', visible: false,uso: false},
    {name: 'r_copiar',font: 'icon-copiar', visible: false,uso: false},
    {name: 'r_ordenar',font: 'icon-ordenar', visible: false,uso: false},
    {name: 'r_vista',font: 'icon-ver-ol', visible: false,uso: false},
    {name: 'r_primero',font: 'icon-primero', visible: false,uso: false},
    {name: 'r_anterior',font: 'icon-anterior', visible: false,uso: false},
    {name: 'r_numreg',font: '',visible: false,uso: false, valor: 0},
    {name: 'r_totreg',font: '',visible: false,uso: false, valor: 0},
    {name: 'r_siguiente',font: 'icon-siguiente', visible: false,uso: false},
    {name: 'r_ultimo',font: 'icon-ultimo', visible: false,uso: false},
    {name: 'r_descargar',font: 'icon-descargar-ol', visible: false,uso: false},
    {name: 'r_imprimir',font: 'icon-imprimir-ol', visible: false,uso: false},
    {name: 'r_refrescar',font: 'icon-refrescar', visible: false,uso: false},
    {name: 'r_configurar',font: 'icon-configurar-ol', visible: false,uso: false},
    {name: 'r_mas_opciones',font: 'icon-mas-opciones', visible: false,uso: false},
  ]

  // Botones de status de operación de la barra
  menuStatus =[{name: 'r_nuevo_edicion',font: 'icon-crear-sl',visible: false,uso: true, titulo: 'Nuevo registro [EDICIÓN]', info: 'Está en modo adición de registro'},

               {name: 'r_modificar_edicion',font: 'icon-editar-sl',visible: false,uso: true, titulo: 'Modificar registro [EDICIÓN]', info: 'Está en modo modificación de registro'},

               {name: 'r_copiar_edicion',font: 'icon-copiar',visible: false,uso: true, titulo: 'Copiar registro [EDICIÓN]', info: 'Está en modo copia de registro'},
  ]

  menuItemsInfo = [{name: 'r_nuevo', titulo: 'Nuevo registro', info: 'Adiciona nuevo registro'},
              {name: 'r_modificar', titulo: 'Modifica registro', info: 'Modifica registro previamente consultado'},
              {name: 'r_eliminar', titulo: 'Elimina registro', info: 'Elimina registro actual. Aplican validaciones'},
              {name: 'r_guardar', titulo: 'Guardar registro', info: 'Guarda cambios. Aplican validaciones'},
              {name: 'r_cancelar', titulo: 'Cancela edición', info: 'Cancela cualquier cambio de registro y devuelve el control a la acción anterior'},
              {name: 'r_buscar', titulo: 'Prepara consulta', info: 'Solicita datos a consultar'},
              {name: 'r_buscar_ejec', titulo: 'Ejecuta consulta', info: 'Consulta datos basada en los parámetros'},
              {name: 'r_buscar_opc', titulo: '', info: ''},
              {name: 'r_copiar', titulo: 'Copiar registro', info: 'Copiar datos del registro actual para generar un nuevo registro'},
              {name: 'r_ordenar', titulo: 'Ordenar datos', info: 'Aplica ordenamiento de datos por un campo específico'},
              {name: 'r_vista', titulo: 'Vista preliminar', info: 'Vista general de datos consultados'},
              {name: 'r_primero', titulo: 'Ir al al primer registro', info: 'Posiciona la consulta en el primer registro'},
              {name: 'r_anterior', titulo: 'Anterior registro', info: 'Posiciona la consulta en el anterior registro'},
              {name: 'r_numreg', titulo: 'Ir a un registro', info: 'Ir a un numero de registro de la presente consulta'},
              {name: 'r_totreg', titulo: 'Número total de registros', info: 'Número total de registros consultados'},
              {name: 'r_siguiente', titulo: 'Siguiente registro', info: 'Posiciona la consulta en el siguiente registro'},
              {name: 'r_ultimo', titulo: 'Último registro', info: 'Posiciona la consulta en el último registro'},
              {name: 'r_descargar', titulo: 'Descargar datos', info: 'Descargar datos de la consulta o del registro actual'},
              {name: 'r_imprimir', titulo: 'Generación de informes', info: 'Seleccionar informe a generar del registro actual o de todos los consultados'},
              {name: 'r_refrescar', titulo: 'Refrescar datos', info: 'Recarga de datos asociados a los distintos objetos de la forma'},
              {name: 'r_cerrar', titulo: 'Cerrar aplicación', info: 'Cerrar aplicación validando cambios'},
              {name: 'r_configurar', titulo: 'Configuraciones de aplicación', info: 'Personaliza la aplicación'},
              {name: 'btnImpActual', titulo: 'Solo registro actual', info: 'Aplicar para solo el registro actual'},
              {name: 'btnImpTodos', titulo: 'Todos los registros', info: 'Aplicar para todos los registros consultados'},
              {name: 'btnImpPrev', titulo: 'Modo previsualización', info: 'Previsualiza el reporte'},
              {name: 'btnImpPdf', titulo: 'Generar pdf', info: 'Genera directamente pdf del reporte'},
              {name: 'btnImpEmail', titulo: 'Enviar via email', info: 'Envia reporte via email con pdf adjunto'},
  ]

  // Control de numero de registros
	r_numReg = 0;
	r_totReg = '  de 99999 ';

  subscription: Subscription;
  subscriptionOnResized: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  cfgBarra: clsBarraRegistro;
  btnConfigUsr: any;
  prev_barMenuReg: any;  // estado de los botones previo a la siguiente accion
  listaReportes: any[] = [];
  visibleListaInf: boolean;
  toolTipVisible: boolean;
  targetIdTooltip: string;
  tooltipTitulo: string;
  tooltipInfo: string;
  wrapperAttr = { class: "cls-tooltip-reg" };
  barraEdicionActiva: boolean = false;
  opcionImpActualTodos: string = 'actual';

  constructor(
    private _sbarreg: SbarraService,
    private _sgenerales: GeneralesService
  ) {
    this.subscription = this._sbarreg.getObsMenuReg()
    .subscribe((prmBarra) => {

      // console.log('📩 [constructor] Observable recibido:', {
      //   aplicacion: prmBarra.aplicacion,
      //   accion: prmBarra.accion,
      //   operacion: prmBarra.operacion,
      //   idAplicacionActiva: GlobalVariables.idAplicacionActiva
      // });

      // Procesa solo la aplicación activa
      if (GlobalVariables.idAplicacionActiva !== prmBarra.aplicacion)
        return;

      //validar si aplicacion es SECCIONES O EMPLEADOS-SECCIONES inactiva el boton crear.
      if(prmBarra.aplicacion.match('PRO-004|PRO-009')) {
        this.menuItems[0].uso = false;
        this.menuItems[0].visible = false;
      } else {
        this.menuItems[0].uso = true;
        this.menuItems[0].visible = true;
      }

      if(prmBarra.aplicacion === 'GES-001') {
        this.menuItems.forEach((ele:any) => {
          if(ele.name === 'r_refrescar') {
            ele.uso = true;
            ele.visible = true;
          } else {
            ele.uso = false;
            ele.visible = false;
          }
        });
      }

      // Procesa acción...
      this.cfgBarra = prmBarra;
      if (this.cfgBarra.accion !== 'activar')
        this.aplAccionReg();
      else
        this.cargarBarraAplActiva();

      // Carga lista de informes
      if (this.cfgBarra.accion.match('r_ini|activar'))
        this.cargarReportes();
    });

    this.subscriptionOnResized = this._sbarreg.getOnResized()
      .subscribe((grupo:number) => {
        this.onResizedBarra(grupo);
    });

    this.btnAccionMenuReg = this.btnAccionMenuReg.bind(this);
    this.seleccOpcionConfig = this.seleccOpcionConfig.bind(this);
    this.aplAccionReg = this.aplAccionReg.bind(this);
    this.seleccOpcionImprimir = this.seleccOpcionImprimir.bind(this);

  }

  // Administra presentación de tool tips
  mostrarSegunOperacion(btnName: string): boolean {
    if (!this.cfgBarra || !this.cfgBarra.operacion) {
      return true;
    }
    return this.cfgBarra.operacion[btnName] !== false;
  }

  // Administra presentación de tool tips
  toggleToolTip(btnmenu:any) {
    if ( btnmenu != 'r_divisor' ){
      this.targetIdTooltip = '#'+btnmenu;
      this.toolTipVisible = !this.toolTipVisible;
      if (!btnmenu.match('_edicion')) {
        const nx = this.menuItemsInfo.findIndex(m => m.name === btnmenu);
        if (nx >= 0) {
          this.tooltipTitulo = this.menuItemsInfo[nx].titulo;
          this.tooltipInfo = this.menuItemsInfo[nx].info;
        }
        else {
          const nx = this.menuItemsInfo.findIndex(m => btnmenu.match(m.name));
          if (nx >= 0) {
            this.tooltipTitulo = this.menuItemsInfo[nx].titulo;
            this.tooltipInfo = this.menuItemsInfo[nx].info;
          }
        }
      }
      else {
        const nx = this.menuStatus.findIndex(m => m.name === btnmenu);
        if (nx >= 0) {
          this.tooltipTitulo = this.menuStatus[nx].titulo;
          this.tooltipInfo = this.menuStatus[nx].info;
        }
      }
    }
  }

  // Operaciones ejecutadas desde la aplicación
  aplAccionReg(): void {

    if(this.visorBarra)
      this.visorBarra = !this.visorBarra;
    switch (this.cfgBarra.accion) {

      // Carga configuración de registro para la aplicacion/usuario/uso/permisos
      case "r_ini":
        this._sbarreg.carguemenu(this.cfgBarra).subscribe((data) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.btnConfigUsr = res;
          this.activarBotones();
          this.prev_barMenuReg = JSON.parse(JSON.stringify(this.menuItems));
          this.asoBarraAplicacion();
        });
        break;

      case "zero":
        this.menuItems.forEach((el:any) => { el.visible = false });
        this.menuStatus.forEach((el:any) => { el.visible = false });
        break;

      case "r_nuevo":
        this.menuItems[0].visible = false;
        this.menuItems[0].true = false;
        break;
      case "r_modificar":
        break;
      case "r_eliminar":
        break;
      case "r_guardar":
      case "reset":
        if (this.cfgBarra.error === "") {
          this.menuItems.forEach((el:any) => { el.visible = false });
          this.menuItems[0].visible = true;
          this.menuItems[0].uso = true;
          this.menuItems[1].visible = true;
          this.menuItems[1].uso = true;
          this.menuItems[2].visible = true;
          this.menuItems[2].uso = true;
          this.menuItems[16].visible = true;
          this.menuItems[16].uso = true;
          this.cfgBarra.accion = "";
        }
        else {
          this.menuItems = JSON.parse(JSON.stringify(this.prev_barMenuReg));
          this.cfgBarra.accion = "err_guardar";
        }
        break;
      case "r_cancelar":
        this.menuItems = JSON.parse(JSON.stringify(this.prev_barMenuReg));
        this.cfgBarra.accion = "";
        if (this.cfgBarra.aplicacion !== 'ADM-300') {
          this.menuItems[18].visible = true;
          this.menuItems[18].uso = true;
        }
        break;
      case "r_buscar":
        break;
      case "r_buscar_ejec":
        for(var k=0; k < this.menuItems.length; k++) {
          this.menuItems[k].visible = true;
          this.menuItems[k].uso = true;
        }
        this.menuItems[3].visible = false;
        this.menuItems[3].uso = false;
        this.menuItems[4].visible = false;
        this.menuItems[4].uso = false;
        this.r_numReg = 1;
        this.r_totReg = ' de ' + this.cfgBarra.r_totReg.toString() + '  ';
        break;
      case "r_buscar_prep":
        for(var k=0; k < this.menuItems.length; k++) {
          this.menuItems[k].visible = false;
          this.menuItems[k].uso = false;
        }
        this.menuItems.find(m => m.name == "r_buscar_ejec").visible = true;
        this.menuItems.find(m => m.name == "r_buscar_ejec").uso = true;
        break;
      case "r_copiar":
        break;
      case "r_ordenar":
        break;
      case "r_vista":
        break;

      case "r_primero":
      case "r_anterior":
      case "r_numreg":
      case "r_totreg":
      case "r_siguiente":
      case "r_ultimo":
        this.menuItems[11].valor = this.cfgBarra.r_numReg;
        this.menuItems[12].valor = this.cfgBarra.r_totReg;
        this.r_numReg = this.cfgBarra.r_numReg;
        if (this.cfgBarra.aplicacion !== 'ADM-300') {
          this.menuItems[18].visible = true;
          this.menuItems[18].uso = true;
        }
        break;

      case "r_navegar":
        for(var k=0; k < this.menuItems.length; k++) {
          if (k !== 19) {
            this.menuItems[k].visible = true;
            this.menuItems[k].uso = true;
          }
          if (k > 3 && k < 19) {
            this.menuItems[k].visible = true;
            this.menuItems[k].uso = true;
          }
        }
        this.menuItems[3].visible = false;
        this.menuItems[3].uso = false;
        this.menuItems[4].visible = false;
        this.menuItems[4].uso = false;
        this.r_numReg = this.cfgBarra.r_numReg;
        this.r_totReg = ' de ' + this.cfgBarra.r_totReg.toString() + '  ';
        this.menuItems[11].valor = this.cfgBarra.r_numReg;
        this.menuItems[12].valor = this.cfgBarra.r_totReg;
        if (this.cfgBarra.aplicacion !== 'ADM-300') {
          this.menuItems[18].visible = true;
          this.menuItems[18].uso = true;
        }
        break;

      case "r_descargar":
        break;
      case "r_imprimir":
        break;
      case "r_refrescar":
        break;
      case "r_cerrar":
        break;
      case "error":
        this.menuItems = [...this.prev_barMenuReg];
        break;

      default:
        // Si hay una operación específica
        // if (this.cfgBarra.operacion) {
        //   for(var k=0; k < this.menuItems.length; k++) {
        //     if (this.cfgBarra.operacion[this.menuItems[k].name] !== undefined) {
        //       this.menuItems[k].visible = this.cfgBarra.operacion[this.menuItems[k].name];
        //       this.menuItems[k].uso = this.cfgBarra.operacion[this.menuItems[k].name];
        //     }
        //   }
        // }

        break;
    }

    // Valida si hay operaciones que la aplicacion activa
    this.aplicarOperaciones();

    // Asocia estado de la barra a la aplicacion
    this.asoBarraEdicion();
    if (!this.cfgBarra.accion.match('r_ini|zero'))
      this.asoBarraAplicacion();

  }

  onResizedBarra(grupo:number) {

    if(this.cfgBarra !== null && this.cfgBarra !== undefined) {
      switch (grupo) {
        case 0:
          if(this.cfgBarra.accion.match('r_numreg|r_navegar')) {
            //restablece la barra principal
            for (let i = 0; i < this.menuItems.length; i++) {
              //restablece la barra principal
              this.menuItems[i].uso = true;
              this.menuItems[i].visible = true;
            }
            //inactiva el icono r_guardar, r_cancelar
            this.menuItems[3].uso = false;
            this.menuItems[3].visible = false;
            this.menuItems[4].uso = false;
            this.menuItems[4].visible = false;
            //activa el icono mas-opciones
            this.menuItems[19].uso = false;
            this.menuItems[19].visible = false;
            //restablece la sub-barra
            for (let i = 0; i < this.sub_Barra.length; i++) {
              this.sub_Barra[i].uso = false;
              this.sub_Barra[i].visible = false;
            }
          }
          break;
        case 2:
          if(this.cfgBarra.accion.match('r_numreg|r_navegar')) {
            //activa el icono mas-opciones
            this.menuItems[19].uso = true;
            this.menuItems[19].visible = true;
            for (let i = 5; i <= 18; i++) {
              //oculta iconos de la barra principal
              this.menuItems[i].uso = false;
              this.menuItems[i].visible = false;
              //activa iconos en sub-barra
              this.sub_Barra[i].uso = true;
              this.sub_Barra[i].visible = true;
            }
          }
          break;
        case 3:
          if(this.cfgBarra.accion.match('r_numreg|r_navegar')) {
            //activa el icono mas-opciones
            this.menuItems[19].uso = true;
            this.menuItems[19].visible = true;
            for (let i = 9; i <= 18; i++) {
              //oculta iconos de la barra principal
              this.menuItems[i].uso = false;
              this.menuItems[i].visible = false;
              //activa iconos en sub-barra
              this.sub_Barra[i].uso = true;
              this.sub_Barra[i].visible = true;
            }
          }
          break;
        case 4:
          if(this.cfgBarra.accion.match('r_numreg|r_navegar')) {
            //activa el icono mas-opciones
            this.menuItems[19].uso = true;
            this.menuItems[19].visible = true;
            //oculta iconos de la barra principal
            for (let i = 15; i <= 18; i++) {
              this.menuItems[i].uso = false;
              this.menuItems[i].visible = false;
              //activa iconos en sub-barra
              this.sub_Barra[i].uso = true;
              this.sub_Barra[i].visible = true;
            }
          }
          break;

        default:
          break;
      }
      // Re-aplicar las reglas de operacion después del resize
      this.aplicarOperaciones();

      const napl = GlobalVariables.listaAplicaciones.map(a => a.aplicacion).indexOf(this.cfgBarra.aplicacion);
      GlobalVariables.listaAplicaciones[napl].barra = JSON.parse(JSON.stringify(this.menuItems));
    }
  }

  // Aplica las reglas de operacion a los botones de la barra
  private aplicarOperaciones(): void {

    // Aplica reglas de operacion a la barra principal
    for(var k=0; k < this.menuItems.length; k++) {
      const btnName = this.menuItems[k].name;
      const opValue = this.cfgBarra?.operacion?.[btnName];

      if (opValue !== undefined) {
        const anterior = this.menuItems[k].visible;
        this.menuItems[k].visible = opValue;
        this.menuItems[k].uso = opValue;
      }

      // Si una operacion viene bloqueada en false, NO permitir que permisos la reactiven.
      if (opValue === false) {
        this.menuItems[k].visible = false;
        this.menuItems[k].uso = false;
        continue;
      }

      // Asocia si se usa o no la operación según permisos de usuario
      if (this.btnConfigUsr !== undefined && this.btnConfigUsr[btnName] !== undefined) {
        this.menuItems[k].uso = this.btnConfigUsr[btnName];
      }
    }

    // Aplica reglas de operacion a la sub-barra (popup "más opciones")
    for(var k=0; k < this.sub_Barra.length; k++) {
      const btnName = this.sub_Barra[k].name;
      const opValue = this.cfgBarra?.operacion?.[btnName];

      if (opValue !== undefined) {
        this.sub_Barra[k].visible = opValue;
        this.sub_Barra[k].uso = opValue;
      }

      // Si una operacion viene bloqueada en false, NO permitir que permisos la reactiven.
      if (opValue === false) {
        this.sub_Barra[k].visible = false;
        this.sub_Barra[k].uso = false;
        continue;
      }

      // Asocia si se usa o no la operación según permisos de usuario
      if (this.btnConfigUsr !== undefined && this.btnConfigUsr[btnName] !== undefined) {
        this.sub_Barra[k].uso = this.btnConfigUsr[btnName];
      }
    }
  }

  // Asocia valores de visibilidad a cada boton
	activarBotones(): void {
    for(var k=0; k < this.menuItems.length; k++) {
      this.menuItems[k].visible = false;
      this.menuItems[k].uso = false;
      // Guardar y Cancelar siempre se usan
      if (k !== 3 && k !== 4) {
        this.menuItems[k].visible = false;
        this.menuItems[k].uso = false;
      }

      // Asocia si se usa o no la operación
      if (this.btnConfigUsr[this.menuItems[k].name] !== undefined) {
        this.menuItems[k].uso = this.btnConfigUsr[this.menuItems[k].name];
        this.menuItems[k].visible = true;
      }
    }

    // Al iniciar: modificar, eliminar, imprimir no se activan
    this.menuItems[1].visible = false;
    this.menuItems[1].uso = false;
    this.menuItems[2].visible = false;
    this.menuItems[2].uso = false;

    // Valida si hay operaciones que la aplicacion activa
    for(var k=0; k < this.menuItems.length; k++) {
      if (this.cfgBarra.operacion[this.menuItems[k].name] !== undefined) {
        this.menuItems[k].visible = this.cfgBarra.operacion[this.menuItems[k].name];
        this.menuItems[k].uso = this.cfgBarra.operacion[this.menuItems[k].name];
      }
    }

    if (this.cfgBarra.aplicacion !== 'ADM-300') {
      this.menuItems[18].visible = true;
      this.menuItems[18].uso = true;
    }

  }

  // Operaciones click sobre cada uno de los botones de registro
  btnAccionMenuReg(accionmenu: any) {

    // Traza accion seleccionada
    this.cfgBarra.accion = accionmenu;
    this.cfgBarra.error = "";
    this.toolTipVisible = false;

    // Apaga todos por defecto para activarlos segun la acción
    if (accionmenu.match("r_nuevo|r_modificar|r_copiar")) {
      if (!accionmenu.match("r_cancelar|r_eliminar|r_imprimir|r_guardar"))
        this.prev_barMenuReg = JSON.parse(JSON.stringify(this.menuItems));
      for(var k=0; k < this.menuItems.length; k++) {
        this.menuItems[k].visible = false;
        this.menuItems[k].uso = false;
      }
    }

    switch (accionmenu) {
      case "r_nuevo":
        this.menuItems[3].visible = true;
        this.menuItems[3].uso = true;
        this.menuItems[4].visible = true;
        this.menuItems[4].uso = true;
        this.menuItems[17].visible = true;
        this.menuItems[17].uso = true;
        this.asoBarraAplicacion();
        this.asoBarraEdicion();
        break;
      case "r_modificar":
        this.menuItems[3].visible = true;
        this.menuItems[3].uso = true;
        this.menuItems[4].visible = true;
        this.menuItems[4].uso = true;
        this.menuItems[17].visible = true;
        this.menuItems[17].uso = true;
        this.asoBarraAplicacion();
        this.asoBarraEdicion();
        break;
      case "r_eliminar":
        break;
      case "r_guardar":
        break;
      case "r_cancelar":
        break;
      case "r_buscar":
        this.asoBarraAplicacion();
        break;
      case "r_buscar_ejec":
        break;
      case "r_buscar_opc":
        break;
      case "r_copiar":
        this.menuItems[3].visible = true;
        this.menuItems[3].uso = true;
        this.menuItems[4].visible = true;
        this.menuItems[4].uso = true;
        this.menuItems[17].visible = true;
        this.menuItems[17].uso = true;
        this.asoBarraAplicacion();
        this.asoBarraEdicion();
        break;
      case "r_ordenar":
        break;
      case "r_vista":
        break;
      case "r_primero":
      case "r_anterior":
      case "r_numreg":
      case "r_siguiente":
      case "r_ultimo":
        break;
      case "r_nueva_fila":
        break;
      case "r_descargar":
        break;
      case "r_eliminar_fila":
        break;
      case "r_imprimir":
        this.visibleListaInf = true;
        break;
      case "r_refrescar":
        break;
      case "r_cerrar":
        break;
      case "r_configurar":
        this.mostrarOpciones();
        break;
      case "r_mas_opciones":
        this.activarVisorBarra();
        break;

      default:
        break;
    }

    if (accionmenu !== "r_imprimir" && accionmenu !== "r_configurar")
      this._sbarreg.setObsRegApl(this.cfgBarra);

  }

  //Consulta lista de configuraciones segun aplicación activa
  mostrarOpciones() {
    this.visibleSettings = true;
    // Cargar opciones
    this._sgenerales.consulta('settings_aplicacion',
                              { aplicacion: GlobalVariables.idAplicacionActiva}, 'generales' )
      .subscribe({
      next: (resp: any) => {
        const res = JSON.parse(resp.data);
        if (res[0].ErrMensaje === '') {
          this.listaOpciones = [];
          res.forEach((eleres:any) => {
            this.listaOpciones.push({ text: eleres.VALOR,
                                      data: eleres,
                                      icon: eleres.FUENTE
                                    })
          });
        }
        else {
          this.listaOpciones = [];
        }
      },
      error: (err => {
        this.visibleSettings = false;
        this.showModal('Error al cargar configuración de aplicación: '+err.message);
      })
    });

  }

  // Asocia config de barra aplicacion a cada aplicacion
  asoBarraAplicacion() {
    const napl = GlobalVariables.listaAplicaciones.map(a => a.aplicacion).indexOf(this.cfgBarra.aplicacion);
    GlobalVariables.listaAplicaciones[napl].barra = JSON.parse(JSON.stringify(this.menuItems));
  }

  // Muestra la barra activa
  cargarBarraAplActiva() {
    const napl = GlobalVariables.listaAplicaciones.map(a => a.aplicacion).indexOf(this.cfgBarra.aplicacion);
    this.menuItems = JSON.parse(JSON.stringify(GlobalVariables.listaAplicaciones[napl].barra));
    this.cfgBarra.r_numReg = this.menuItems[11].valor;
    this.cfgBarra.r_totReg = this.menuItems[12].valor;
    this.r_numReg = this.menuItems[11].valor;
    this.r_totReg = ' de '+this.menuItems[12].valor;
    this.asoBarraEdicion();
  }

  // Barra de edición
  asoBarraEdicion() {
    this.menuStatus[0].visible = false;
    this.menuStatus[1].visible = false;
    this.menuStatus[2].visible = false;
    this.barraEdicionActiva = false;
    if (this.cfgBarra.aplicacion !== '') {
      const napl = GlobalVariables.listaAplicaciones.map(a => a.aplicacion).indexOf(this.cfgBarra.aplicacion);
      if (this.cfgBarra.accion !== 'activar') {
        GlobalVariables.listaAplicaciones[napl].statusEdicion =
          this.cfgBarra.accion.match('r_nuevo|r_modificar|r_copiar') ? this.cfgBarra.accion+'_edicion' : '';

        if (this.cfgBarra.accion === 'r_nuevo') this.menuStatus[0].visible = true;
        if (this.cfgBarra.accion === 'r_modificar') this.menuStatus[1].visible = true;
        if (this.cfgBarra.accion === 'r_copiar') this.menuStatus[2].visible = true;
        this.barraEdicionActiva = this.cfgBarra.accion.match('r_nuevo|r_modificar|r_copiar') ? true : false;
      } else {
        const btn = GlobalVariables.listaAplicaciones[napl].statusEdicion;
        const ix = this.menuStatus.map(m => m.name).indexOf(btn);
        if (ix !== -1) {
          this.menuStatus[ix].visible = true;
          this.barraEdicionActiva = true;
        } else {
          this.menuStatus.forEach(e => { e.visible = false });
          this.barraEdicionActiva = false;
        }
      }
    }

  }

  activarVisorBarra() {
    this.visorBarra = !this.visorBarra;
  }

  seleccOpcionConfig(e:any) {
    this.visibleSettings = false;
    this.cfgBarra = { ...this.cfgBarra, operacion: { data_config: e.itemData } };
    this._sbarreg.setObsRegApl(this.cfgBarra);
  }

  // Llama al reporte de la aplicación
  seleccReporte(e: any) {
    this.visibleListaInf = false;
    this.cfgBarra = { ...this.cfgBarra, operacion:
                      { id_reporte: e.itemData.id_reporte, archivo: e.itemData.archivo, data_rpt: e.itemData } };
    this._sbarreg.setObsRegApl(this.cfgBarra);
  }

  // Selección de opción de botones para imprimir
  seleccOpcionImprimir(data: any, opcion: any) {
    let btnActual = document.getElementById('btnImpActual'+data.item)!;
    let btnTodas = document.getElementById('btnImpTodos'+data.item)!;
    switch (opcion) {
      case 'actual':
        btnActual.style.color = "rgba(10,57,96,.95)";
        btnTodas.style.color = "rgba(10,57,96,.25)";
        this.opcionImpActualTodos = 'actual';
        break;

      case 'todos':
        btnActual.style.color = "rgba(10,57,96,.25)";
        btnTodas.style.color = "rgba(10,57,96,.95)";
        this.opcionImpActualTodos = 'todos';
        break;

      case 'previsualizar':
      case 'pdf':
      case 'email':
        this.visibleListaInf = false;
        this.cfgBarra = { ...this.cfgBarra,
                          operacion: { id_reporte: data.id_reporte,
                                       archivo: data.archivo,
                                       data_rpt: data,
                                       registro: this.opcionImpActualTodos,
                                       modo: opcion
                                     } };
        this._sbarreg.setObsRegApl(this.cfgBarra);
        break;

      default:
        break;
    }
  }

  // Cargar reportes de la aplicción
  cargarReportes() {
    // Lista de reportes de la aplicación
    const prm = { ID_APLICACION: (this.cfgBarra.aplicacionBase ? this.cfgBarra.aplicacionBase : this.cfgBarra.aplicacion) }
    this._sbarreg.listaInformes(prm).subscribe((data) => {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      this.listaReportes = [];
      let k = 0;
      res.forEach((rep:any) => {
        this.listaReportes.push({ text: rep.NOMBRE,
                                  id_reporte: rep.ID_REPORTE,
                                  archivo: rep.ARCHIVO,
                                  item: k
                                 })
        k++;
      });
    });
  }

  ngOnInit(): void {
    if (GlobalVariables.idAplicacionActiva === "") {
      for(var k=0; k < this.menuItems.length; k++) {
        this.menuItems[k].visible = false;
        this.menuItems[k].uso = false;
      }
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subscriptionOnResized.unsubscribe();
  }

  showModal(mensaje:any, titulo = '¡Error!', msg_html= '') {
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
