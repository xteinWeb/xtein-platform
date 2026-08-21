
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SbarraService } from '../../regbarra/_sbarra.service';
import { clsBarraRegistro } from '../../regbarra/_clsBarraReg';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { DxButtonModule, DxListModule, DxPopupModule, DxTooltipModule } from 'devextreme-angular';
import Swal from 'sweetalert2';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { ApiRestService } from 'src/app/services/usuarios/api-rest.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-BARRA',
    templateUrl: './BARRA.component.html',
    styleUrls: ['./BARRA.component.css'],
    standalone: true,
    imports: [FormsModule, DxTooltipModule, DxPopupModule, DxListModule, DxButtonModule,
              CommonModule, FormsModule, MatMenuModule, MatButtonModule]
})
export class BARRAComponent {

  subscription: Subscription;
  cfgBarra: clsBarraRegistro;
  listaReportes: any[] = [];
  listaOpciones: any[] = [];
  btnConfigUsr: any = {
    r_buscar: false,
    r_eliminar: false,
    r_imprimir: false,
    r_modificar: false,
    r_nuevo: false
  }
  btnOcultos:any [] = [];

  visibleBarraGeneral: boolean = false;
  visibleBarraIni: boolean = true;
  visibleBarraEdicion: boolean = false;
  visibleBarraNavegar: boolean = false;
  visibleListaInf: boolean = false;
  visibleSettings: boolean = false;

  toolTipVisible: boolean = false;
  targetIdTooltip: string;
  tooltipTitulo: string;
  tooltipInfo: string;

  accion_prev:string;

  // Control de numero de registros
	r_numReg = 0;
	r_totReg = '  de 99999 ';

  opcionImpActualTodos: string = 'actual';
  wrapperAttr = { class: "cls-tooltip-reg" };

  menuItemsInfo = [
    {name: 'r_nuevo', titulo: 'Nuevo registro', info: 'Adiciona nuevo registro'},
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
    {name: 'r_numreg', titulo: 'Registro actual', info: 'Número de registro actual de la consulta presente'},
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
  ];


  constructor(
    private _sbarreg: SbarraService,
    private _sgenerales: GeneralesService,
    private sData: ApiRestService
  ) {
    this.subscription = this._sbarreg.getObsMenuReg()
    .subscribe((prmBarra) => {
      // Procesa acción...
      this.cfgBarra = prmBarra;
      if (this.cfgBarra.accion !== 'activar')
        this.aplAccionReg();
      else
        this.cargarBarraAplActiva();

      // Carga lista de informes
      const napl = GlobalVariables.listaAplicaciones.map((a:any) => a.aplicacion).indexOf(this.cfgBarra.aplicacion);
      if (napl > -1) {
        if (GlobalVariables.listaAplicaciones[napl].informes)
          this.listaReportes = GlobalVariables.listaAplicaciones[napl].informes;
        else
          this.cargarReportes();
      } else {
        this.cargarReportes();
      }

      this.validarAccionesBarra();
    });

    this.btnAccionMenuReg = this.btnAccionMenuReg.bind(this);
    this.seleccOpcionConfig = this.seleccOpcionConfig.bind(this);
    this.aplAccionReg = this.aplAccionReg.bind(this);
    this.validarAccionesBarra = this.validarAccionesBarra.bind(this);
    this.seleccOpcionImprimir = this.seleccOpcionImprimir.bind(this);

  }

  ngOnInit(): void {
    // if (GlobalVariables.idAplicacionActiva === "") {
    //   this.visibleBarraIni = false;
    //   this.visibleBarraNavegar = false;
    //   this.visibleBarraEdicion = false;
    // }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }



  // Operaciones ejecutadas desde la aplicación
  aplAccionReg(): void {
    switch (this.cfgBarra.accion) {
      // Carga configuración de registro para la aplicacion/usuario/uso/permisos
      case "r_ini":
        this._sbarreg.carguemenu(this.cfgBarra).subscribe((data) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }

          const napl = GlobalVariables.listaAplicaciones.map((a:any) => a.aplicacion).indexOf(this.cfgBarra.aplicacion);
          GlobalVariables.listaAplicaciones[napl].permisos_usuario = res;

          this.btnConfigUsr = res;
          this.visibleBarraIni = true;
          this.visibleBarraNavegar = false;
          this.visibleBarraEdicion = false;
          this.accion_prev = this.cfgBarra.accion;
          this.asoBarraAplicacion();
        });
        break;

      case "zero":
        // this.menuItems.forEach((el:any) => { el.visible = false });
        this.visibleBarraIni = false;
        this.visibleBarraEdicion = false;
        this.visibleBarraNavegar = false;
        break;

      case "r_nuevo":
      case "r_modificar":
      case "r_copiar":
        this.accion_prev = this.cfgBarra.accion;
        this.visibleBarraIni = false;
        this.visibleBarraNavegar = false;
        this.visibleBarraEdicion = true;
        // this.asoBarraAplicacion();
        break;
      case "r_eliminar":
        break;
      case "r_guardar":
      case "reset":
        if (this.cfgBarra.error === "") {
          this.visibleBarraIni = true;
          this.visibleBarraNavegar = false;
          this.visibleBarraEdicion = false;
          // this.asoBarraAplicacion();
          this.cfgBarra.accion = "";
        } else {
          this.visibleBarraIni = false;
          this.visibleBarraNavegar = false;
          this.visibleBarraEdicion = true;
          this.cfgBarra.accion = "err_guardar";
        }
        break;
      case "r_cancelar":
        this.cfgBarra.accion = '';
        if (this.accion_prev === '' || this.accion_prev.match('r_ini|zero|r_nuevo|r_modificar|r_copiar')) {
          this.visibleBarraIni = true;
          this.visibleBarraEdicion = false;
          this.visibleBarraNavegar = false;
        } else if (this.accion_prev.match('r_primero|r_anterior|r_numreg|r_siguiente|r_ultimo')) {
          this.visibleBarraIni = false;
          this.visibleBarraEdicion = false;
          this.visibleBarraNavegar = true;
        }
        break;
      case "r_buscar":
        break;
      case "r_buscar_ejec":
        this.visibleBarraIni = false;
        this.visibleBarraEdicion = false;
        this.visibleBarraNavegar = true;
        this.r_numReg = 1;
        this.r_totReg = ' de ' + this.cfgBarra.r_totReg.toString() + '  ';
        break;
      case "r_buscar_prep":
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
      case "r_navegar":
        this.visibleBarraIni = false;
        this.visibleBarraEdicion = false;
        this.visibleBarraNavegar = true;
        this.accion_prev = this.cfgBarra.accion;

        if (this.cfgBarra.r_numReg > 0 && this.cfgBarra.r_totReg > 0) {
          this.r_numReg = this.cfgBarra.r_numReg;
          this.r_totReg = ' de ' + this.cfgBarra.r_totReg.toString() + '  ';
        } else {
          const napl = GlobalVariables.listaAplicaciones.map((a:any) => a.aplicacion).indexOf(this.cfgBarra.aplicacion);
          if (napl > -1) {
            this.r_numReg = GlobalVariables.listaAplicaciones[napl].r_numReg;
            this.r_totReg = ' de ' + GlobalVariables.listaAplicaciones[napl].r_totReg.toString() + '  ';

            this.cfgBarra.r_numReg = GlobalVariables.listaAplicaciones[napl].r_numReg;
            this.cfgBarra.r_totReg = GlobalVariables.listaAplicaciones[napl].r_totReg;
          }
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
        // this.menuItems = [...this.prev_barMenuReg];
        break;

      // Si se activa boton de manera explícita
      case "operacion":
        Object.keys(this.cfgBarra.operacion).forEach(key => {
          this.btnConfigUsr[key] = this.cfgBarra.operacion[key];
        });
        break;

      default:
        // Si hay una operación específica
        this.visibleBarraIni = true;
        this.visibleBarraNavegar = false;
        this.visibleBarraEdicion = false;
        break;
    }


    //carga permisos de usuario
    const napl = GlobalVariables.listaAplicaciones.map((a:any) => a.aplicacion).indexOf(this.cfgBarra.aplicacion);
    if (napl > -1 && GlobalVariables.listaAplicaciones[napl].permisos_usuario) {
      this.btnConfigUsr = GlobalVariables.listaAplicaciones[napl].permisos_usuario;
    }

    // Asocia estado de la barra a la aplicacion
    if (!this.cfgBarra.accion.match('r_ini|zero'))
      this.asoBarraAplicacion();
  }

  // Muestra la barra activa
  cargarBarraAplActiva() {
    const napl = GlobalVariables.listaAplicaciones.map(a => a.aplicacion).indexOf(this.cfgBarra.aplicacion);
    this.cfgBarra.accion = GlobalVariables.listaAplicaciones[napl].accion;
    this.aplAccionReg();
  }

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
      const napl = GlobalVariables.listaAplicaciones.map((a:any) => a.aplicacion).indexOf(this.cfgBarra.aplicacion);
      if (napl > -1)
        GlobalVariables.listaAplicaciones[napl].informes = this.listaReportes;
    });
  }

  // Operaciones click sobre cada uno de los botones de registro
  btnAccionMenuReg(accion: any) {

    // Traza accion seleccionada
    this.cfgBarra.accion = accion;
    this.cfgBarra.error = "";
    this.toolTipVisible = false;

    if (!accion.match("r_cancelar|r_eliminar|r_imprimir|r_guardar"))
      this.accion_prev = accion;

    switch (accion) {
      case "r_nuevo":
      case "r_modificar":
      case "r_copiar":
        this.visibleBarraIni = false;
        this.visibleBarraNavegar = false;
        this.visibleBarraEdicion = true;
        this.asoBarraAplicacion();
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
        this._sbarreg.carguemenu(this.cfgBarra).subscribe((data) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const napl = GlobalVariables.listaAplicaciones.map((a:any) => a.aplicacion).indexOf(this.cfgBarra.aplicacion);
          GlobalVariables.listaAplicaciones[napl].permisos_usuario = res;
          this.btnConfigUsr = res;

          if (this.cfgBarra.accion.match('r_ini|zero')) {
            this.visibleBarraIni = true;
            this.visibleBarraEdicion = false;
            this.visibleBarraNavegar = false;
          } else if (this.cfgBarra.accion.match('r_nuevo|r_modificar|r_copiar')) {
            this.visibleBarraIni = false;
            this.visibleBarraEdicion = true;
            this.visibleBarraNavegar = false;
          } else if (this.cfgBarra.accion.match('r_primero|r_anterior|r_numreg|r_siguiente|r_ultimo')) {
            this.visibleBarraIni = false;
            this.visibleBarraEdicion = false;
            this.visibleBarraNavegar = true;
          }
        });
        break;
      case "r_cerrar":
        break;
      case "r_configurar":
        this.mostrarOpciones();
        break;
      case "r_mas_opciones":
        // this.activarVisorBarra();
        break;

      default:
        break;
    }

    if (accion !== "r_imprimir" && accion !== "r_configurar")
      this._sbarreg.setObsRegApl(this.cfgBarra);

  }

  // Asocia config de barra aplicacion a cada aplicacion
  asoBarraAplicacion() {
    const napl = GlobalVariables.listaAplicaciones.map((a:any) => a.aplicacion).indexOf(this.cfgBarra.aplicacion);
    if (napl > -1) {
      GlobalVariables.listaAplicaciones[napl].accion = this.cfgBarra.accion;
      GlobalVariables.listaAplicaciones[napl].r_numReg = this.cfgBarra.r_numReg;
      GlobalVariables.listaAplicaciones[napl].r_totReg = this.cfgBarra.r_totReg;
      GlobalVariables.listaAplicaciones[napl].operacion = this.cfgBarra.operacion;
    }
  }

  // Administra presentación de tooltips
  toggleToolTip(btnmenu:any) {
    this.targetIdTooltip = '#'+btnmenu;
    this.toolTipVisible = true;
    const nx = this.menuItemsInfo.findIndex((m:any) => m.name === btnmenu);
    if (nx >= 0) {
      this.tooltipTitulo = this.menuItemsInfo[nx].titulo;
      this.tooltipInfo = this.menuItemsInfo[nx].info;
    } else {
      const nx = this.menuItemsInfo.findIndex(m => btnmenu.match(m.name));
      if (nx >= 0) {
        this.tooltipTitulo = this.menuItemsInfo[nx].titulo;
        this.tooltipInfo = this.menuItemsInfo[nx].info;
      }
    }
  }

  seleccOpcionConfig(e:any) {
    this.visibleSettings = false;
    this.cfgBarra = { ...this.cfgBarra, operacion: { data_config: e.itemData } };
    this._sbarreg.setObsRegApl(this.cfgBarra);
  }

  validarAccionesBarra() {
    //Activa y desactiva botones de la barra segun parametros de opertación:
    setTimeout(() => {
      if (!this.cfgBarra || !this.cfgBarra.operacion) {
        return;
      }

      if (this.btnOcultos.length > 0 && this.btnOcultos[0].btn.length > 0) {
        if (this.btnOcultos[0].ID_APLICACION !== this.cfgBarra.aplicacion) {
          this.btnOcultos[0].btn.forEach((key:any) => {
            let boton:any = document.getElementById(key);
            if (boton) {
              boton.classList.remove("BtnNoVisible");
            }
          });
          this.btnOcultos = [];
        }
      }

      Object.keys(this.cfgBarra.operacion).forEach(key => {
        let boton:any = document.getElementById(key);
        if (boton) { // Verifica si el botón existe en el HTML
          // boton.style.display = this.cfgBarra.operacion[key] ? '' : 'none !important';
          if (this.btnOcultos.findIndex((d:any) => d.ID_APLICACION === this.cfgBarra.aplicacion) === -1) {
            this.btnOcultos[0] = {ID_APLICACION : this.cfgBarra.aplicacion};
            this.btnOcultos[0].btn = [];
          }

          const className: string = boton.className;
          const operacionActiva = this.cfgBarra.operacion[key] !== false;

          if (!operacionActiva) {
            if (!className.includes('BtnNoVisible')) {
              boton.className = className + ' BtnNoVisible';
            }
            if (!this.btnOcultos[0].btn.includes(key)) {
              this.btnOcultos[0].btn.push(key);
            }
          } else {
            boton.className = className
              .replace(' BtnNoVisible', '')
              .replace('BtnNoVisible', '')
              .trim();
            this.btnOcultos[0].btn = this.btnOcultos[0].btn.filter((b:any) => b !== key);
          }
        }
      });
    }, 300);

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

  //Consulta lista de configuraciones segun aplicación activa
  mostrarOpciones() {
    this.visibleSettings = true;
    // Cargar opciones
    // const prm:any = { USUARIO: localStorage.getItem('usuario')?.toUpperCase() };
    // this.sData.getUsuarios('settings_aplicacion', prm)
    const prm:any = { APLICACION: GlobalVariables.idAplicacionActiva, USUARIO: localStorage.getItem('usuario')?.toUpperCase() };
    this._sgenerales.consulta('settings_aplicacion', prm, 'generales' )
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
        } else {
          this.listaOpciones = [];
        }
      }, error: ((err:any) => {
        this.visibleSettings = false;
        this.showModal('Error al cargar configuración de aplicación: '+err.message);
      })
    });
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
