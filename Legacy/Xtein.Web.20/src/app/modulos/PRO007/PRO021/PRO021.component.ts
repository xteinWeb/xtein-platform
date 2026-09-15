import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DxButtonModule, DxCheckBoxModule, DxDataGridComponent, DxDataGridModule, DxFormComponent, DxFormModule, DxSelectBoxComponent, DxSelectBoxModule, DxTextBoxComponent, DxTextBoxModule, DxTooltipModule } from "devextreme-angular";
import { catchError, firstValueFrom, lastValueFrom, Subject, Subscription, takeUntil, throwError } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { PRO007Service } from 'src/app/services/PRO007/PRO007.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import Swal from 'sweetalert2';
import { MAtributos, MItemsAtributos } from './clsPRO021.class';
import notify from 'devextreme/ui/notify';
import { CommonModule } from '@angular/common';
import { AplsettingsComponent } from 'src/app/shared/aplsettings/aplsettings.component';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';
import { PRO02101Component } from './PRO02101/PRO02101.component';
import { showToast } from '../../../shared/toast/toastComponent.js'

@Component({
  selector: 'app-PRO021',
  templateUrl: './PRO021.component.html',
  styleUrls: ['./PRO021.component.scss'],
  standalone: true,
  imports: [CommonModule, DxFormModule, DxSelectBoxModule, DxDataGridModule, DxCheckBoxModule, DxTooltipModule,
            DxTextBoxModule, DxButtonModule, AplsettingsComponent, VistarapidaComponent, PRO02101Component
          ]
})
export class PRO021Component implements OnInit {
  @ViewChild("gitemsatr", { static: false }) gridAtributos: DxDataGridComponent;
  @ViewChild("txAtributo", { static: false }) valItmAtributo: DxTextBoxComponent;
  @ViewChild("txEstado", { static: false }) valItmEstado: DxSelectBoxComponent;
  @ViewChild("form", { static: false }) formAtr: DxFormComponent;

  public _unsubscribeAll: Subject<any>;

  // Variables fijas de la aplicación
  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string;
  VDatosReg: any;
  readOnly: boolean = true;
  esEdicion: boolean = false;
  esEdicionFila: boolean = false;

  // Variables de datos
  treeSecciones: any;
  DAtributos: MAtributos;
  DItemsAtributos: MItemsAtributos[];
  data_prev: any= [];
  colCountByScreen: object;
  DClaseAtr: any;
  imageAtributo: string = '';
  valItemAtributo: number;

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esVisibleSelecc: boolean = false;
  filaDatosEdit: any;
  filaDatosEditOld: any;
  modoImagen: boolean = false;
  altoFilaDatos: string[] = ["10px"];
  seleccDelete: boolean[] = [false];
  modoSeleccDelete: boolean = false;
  
  // notificaciones
  toaVisible: boolean;
	type = 'info'
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';

  constructor(
    private _sdatos: PRO007Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private tabService: TabService
  ) 
  {
    // Servicio de barra de registro
    this.subscription = this._sbarreg
      .getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((datreg) => {
        // Valida si la petición es para esta aplicacion
        if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });

    // Respuesta del filtro
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe(resp => {
        // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
        const dfiltro = JSON.parse(resp);
        if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opPrepararBuscar(resp);
      })
  
    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex(d => d.CODIGO === resp.CODIGO);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx+1;
        this.opIrARegistro('r_numreg');
      }
    })

    this.onSeleccDelete = this.onSeleccDelete.bind(this);
    this.ValideExistencia = this.ValideExistencia.bind(this);
    this.opVista = this.opVista.bind(this);

  }

  
  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        const user:any = localStorage.getItem("usuario");
        this.prmUsrAplBarReg = {
          tabla: "ATRIBUTOS",
          aplicacion: "PRO-021",
          usuario: user,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.readOnly = false;
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.mnuAccion = "update";
        this.readOnly = false;
        this.opPrepararModificar();
        break;

      case "r_guardar":
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case "r_copiar":
        Swal.fire({
          title: '',
          text: 'Para copiar este Registro recuerde: debe agregar un nuevo Código y Nombre.',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: false,
					confirmButtonColor: '#DF3E3E',
          confirmButtonText: 'Aceptar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.mnuAccion = "new";
            this.readOnly = false;
            this.opPrepararModificar();
            this.DAtributos.CODIGO = '';
            this.DAtributos.NOMBRE = '';
          }
        });
        break;

      case "r_buscar":
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          this.toaMessage = 'Consulta en proceso, por favor espere.';
          this.toaVisible = true;
          this.toaTipo = 'warning';
          showToast(this.toaMessage, 'warning');
        }
        break;

      case "r_buscar_ejec":
        this.opBlanquearForma();
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('');
        } else {
          this.toaMessage = 'Consulta en proceso, por favor espere.';
          this.toaVisible = true;
          this.toaTipo = 'warning';
          showToast(this.toaMessage, this.toaTipo);
        }
        break;

      case "r_eliminar":
        this.opEliminar();
        break;

      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
        this.esVisibleSelecc = false;
        this.opIrARegistro(operMenu.accion);
        break;

      case "r_cancelar":
        Swal.fire({
          title: '',
          text: '¿Desea cancelar la operación?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
					confirmButtonColor: '#DF3E3E',
					cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, 
                                    accion: 'r_cancelar',
                                    operacion: { } 
                                  }
            this.readOnly = true;
            this.esEdicion = false;
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.opIrARegistro('r_numreg');
            this.esVisibleSelecc = false;
            this.DItemsAtributos.forEach(a => {a.modoEdicion = false;});
            this.seleccDelete = [false];
            this.esEdicionFila = false;
            this.rowApplyChanges = false;
            this.rowDelete = false;
            this.rowNew = false;
            this.rowSave = false;
            this.rowEdit = false;

            // Restituye los valores
            this.mnuAccion = "";
          }
        });

        break;

      case "r_vista":
        this.opVista();
        break;

      case 'r_refrescar':
				this.valoresObjetos('ref');
				break;

      case "r_imprimir":
        this.imprimirReporte(operMenu.operacion.id_reporte, operMenu.operacion.archivo, operMenu.operacion.data_rpt);
        break;

      case "r_configurar":
        this.onSeleccOpcionSettings(null);
        break;

      default:
        break;
    }
  }
  
  // Llama a Acciones de registro
  
  opPrepararNuevo(): void {
    this.readOnly = false;
    this.esEdicion = true;
    this.esVisibleSelecc = false;
    this.seleccDelete = [false];
    this.esEdicionFila = false;
    this.rowApplyChanges = false;
    this.rowDelete = false;
    this.rowNew = true;
    this.rowSave = false;
    this.rowEdit = false;

    this.opBlanquearForma();
    this.DAtributos.ESTADO = 'ACTIVO';
  }
  opBlanquearForma(): void {
    this.DAtributos = {
      CODIGO: "",
      NOMBRE: "",
      ESTADO: "",
      CLASE: "",
      DEFECTO: false
    };
    this.DItemsAtributos.splice(0,this.DItemsAtributos.length)
  }

  opPrepararModificar(): void {
    this.readOnly = false;
    this.esEdicion = true;
    this.esVisibleSelecc = true;
    this.rowApplyChanges = false;
    this.rowDelete = false;
    this.rowNew = true;
    this.rowSave = false;
    this.rowEdit = false;
    this.esEdicionFila = false;
    this.data_prev = { encabezado: JSON.parse(JSON.stringify(this.DAtributos)), items: JSON.parse(JSON.stringify(this.DItemsAtributos)) };
    this.unseleccBorrar('edit');
  }
  opPrepararGuardar(accion: string): void {
    if (this.esEdicionFila){
			const type ='error';
			this.toaTipo = 'error';
			this.toaMessage = 'Hay cambios en items de atributos que no se han actualizado';
			this.toaVisible = true;
      showToast(this.toaMessage, this.toaTipo);
		} else {

      // Acción validación de datos
      if (!this.ValidaDatos("requerido")) {
        return;
      }
      const prmDatosGuardar = JSON.parse(
        (JSON.stringify({ ATRIBUTOS: this.DAtributos}) + JSON.stringify({ ITM_ATRIBUTOS: this.DItemsAtributos})).replace(
          /}{/g,
          ","
        )
      );
  
      // API guardado de datos
      this._sdatos
        .save(accion, prmDatosGuardar, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          if (res[0].ErrMensaje !== "") {
            this.showModal(res[0].ErrMensaje);
          } 
          else
          {
            this.readOnly = true;
  
            // Operaciones de barra
            if (this.mnuAccion === 'new') {
              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                error: "",
                accion: "r_navegar",
                r_numReg: 1,
                r_totReg: 1,
                operacion: {}
              };
            } else {
              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                error: "",
                accion: "r_navegar",
                operacion: {}
              };
            }
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            showToast('Registro actualizado', 'success');
  
            // Inicializacion objetos
            this.esEdicion = false;
            this.esVisibleSelecc = false;
            this.seleccDelete = [false];
            this.esEdicionFila = false;
            this.rowApplyChanges = false;
            this.rowDelete = false;
            this.rowNew = false;
            this.rowSave = false;
            this.rowEdit = false;
            this.DItemsAtributos.forEach(a => {a.modoEdicion = false;});

            // Actualiza items de atributos
            if (this.mnuAccion === 'new') {
              this.VDatosReg = [this.DAtributos];
              this.VDatosReg[0].ITM_ATRIBUTOS = JSON.parse(JSON.stringify(this.DItemsAtributos));
            }
            // else
            //   this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_ATRIBUTOS = JSON.parse(JSON.stringify(this.DItemsAtributos));
            else {
              // Buscar el índice del registro actual por CODIGO
              const idx = this.VDatosReg.findIndex((r:any) => r.CODIGO === this.DAtributos.CODIGO);
              if (idx !== -1) {
                // Reemplazar el registro completo
                this.VDatosReg[idx] = {
                  ...JSON.parse(JSON.stringify(this.DAtributos)),
                  ITM_ATRIBUTOS: JSON.parse(JSON.stringify(this.DItemsAtributos))
                };
              }
            }
            this.opIrARegistro('r_numreg');
  
          }  
  
        });

    }

  }

  ValidaDatos(Accion: string): boolean {
    if (Accion === "requerido") {
      if (
        this.DAtributos.CODIGO === "" ||
        this.DAtributos.NOMBRE === "" ||
        this.DAtributos.ESTADO === "" ||
        this.DAtributos.CLASE === "" 
      ) {
        this.showModal('',"Faltan datos","<b>Hay datos que faltan. Revisar contenido de datos del atributo!</b>");
        return false;
      }
    }
    return true;
  }

  opPrepararBuscar(accion): void {
    if (accion === "filtro") 
    {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Atributos",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);
    } 
    else 
    {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { ATRIBUTOS: arrFiltro };

      // Ejecuta búsqueda API
      this._sdatos
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion )
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje === '') {
            // Asocia datos
            if ( datares??'' != '' ) {
              this.VDatosReg = datares;
              this.DAtributos = datares[0];
              this.DItemsAtributos = datares[0].ITM_ATRIBUTOS;
            }

            // Prepara la barra para navegación
            this.prmUsrAplBarReg = {...this.prmUsrAplBarReg,
              r_totReg: datares.length,
              r_numReg: 1,
              accion: 'r_navegar',
              operacion: {}
            }
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

          } else {
            this.VDatosReg = [];
            //notificació
            showToast(datares[0].ErrMensaje, 'warning');
            //this.opBlanquearForma();
          } 
          this._sfiltro.enConsulta = false;
        });
    }

    this.readOnly = true;
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        this.prmUsrAplBarReg.r_numReg = 1;
        this.DAtributos = JSON.parse(JSON.stringify(this.VDatosReg[0]));
        this.DItemsAtributos = JSON.parse(JSON.stringify(this.VDatosReg[0].ITM_ATRIBUTOS));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        this.DAtributos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DItemsAtributos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_ATRIBUTOS));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
        this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
          ? this.VDatosReg.length
          : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.DAtributos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DItemsAtributos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_ATRIBUTOS));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        this.DAtributos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this.DItemsAtributos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1].ITM_ATRIBUTOS));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_numreg":
        if (this.prmUsrAplBarReg.r_numReg !== 0) {
          // Valida si hubo cambio de ordenamiento en el visor
          if (this.SVisor.ColSort.Columna !== "") {
            if (this.SVisor.ColSort.Clase === "asc") {
              this.VDatosReg = this.VDatosReg.sort((a: any, b: any) =>
                a[this.SVisor.ColSort.Columna].toUpperCase() <
                b[this.SVisor.ColSort.Columna].toUpperCase()
                  ? -1
                  : 1
              );
            } else {
              this.VDatosReg = this.VDatosReg.sort((a: any, b: any) =>
                a[this.SVisor.ColSort.Columna].toUpperCase() >
                b[this.SVisor.ColSort.Columna].toUpperCase()
                  ? -1
                  : 1
              );
            }
          }
          this.DAtributos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1]));
          this.DItemsAtributos = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1].ITM_ATRIBUTOS));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

        } 
        else {
          this.DAtributos = {
            CODIGO: "",
            NOMBRE: "",
            ESTADO: "",
            CLASE: "",
            DEFECTO: false
          };
        }
        this.readOnly = true;
        break;

      case "Eliminado":
        
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          const npos = this.DItemsAtributos.findIndex( f => f.CODIGO === this.DAtributos.CODIGO);
          this.DItemsAtributos.splice(npos, 1);
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length > 0) {
          const npos = this.DItemsAtributos.findIndex( f => f.CODIGO === this.DAtributos.CODIGO);
          this.DItemsAtributos.splice(npos, 1);
          this.DAtributos =
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        } else {
          const npos = this.DItemsAtributos.findIndex( f => f.CODIGO === this.DAtributos.CODIGO);
          this.DItemsAtributos.splice(npos, 1);
          this.DAtributos = {
            CODIGO: "",
            NOMBRE: "",
            ESTADO: "",
            CLASE: "",
            DEFECTO: false
          };
        }
        break;

      default:
        break;
    }

  }

  opEliminar(): void {
    // Confirma...
    Swal.fire({
      title: '',
      text: '',
      html: "¿Desea eliminar el atributo <i>" +
            this.DAtributos.CODIGO +
            " " +
            this.DAtributos.NOMBRE +
            "</i> ?",
      iconHtml: "<i class='icon-alert-ol'></i>",
      showCancelButton: true,
      confirmButtonColor: '#DF3E3E',
      cancelButtonColor: '#438ef1',
      cancelButtonText: 'No',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      // Procesa eliminación. Llama a la API para validar referenciación y 
      // eliminación en tabla
      if (result.isConfirmed) {
				this.AccionEliminar();
      }
    });

  }
  // Ejecuta la eliminación
  AccionEliminar(): void {

    // API eliminación de datos
    const prm = { CODIGO: this.DAtributos.CODIGO };
    this._sdatos
      .delete('delete',prm, this.prmUsrAplBarReg.aplicacion)
      .subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje);
          return;
        }

        // Elimina y posiciona en el Array de Consulta
        this.opIrARegistro("Eliminado");
        this.readOnly = true;
        showToast('Atributo eliminado', 'success');

        // Operaciones de barra
        this.prmUsrAplBarReg.r_totReg--;
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          error: "",
          accion: 'r_navegar',
          operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.opIrARegistro('r_numreg');
      });
  }

  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: "Atributos",
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: ['CODIGO|Código','NOMBRE|Nombre','CLASE|Clase','ESTADO|Estado'],
      Filtro: '',
      keyGrid: ['CODIGO']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  // Valide unicidad de la llave
  async ValideExistencia(e: any) {
    if (this.readOnly || !this.mnuAccion.match('new|update')) {
      return (true);
    }

    // Valida la existencia de la llave respectiva
    const prm = { ATRIBUTO: e.value };
    const apiRest = this._sdatos.validellave('EXISTE ATRIBUTO',prm,'PRO021');
    const res = await lastValueFrom(apiRest, {defaultValue: true});
    const msg = JSON.parse(res.data.toString());
    if (msg[0].ErrMensaje === '')
      return (true);
    else {
      showToast(msg[0].ErrMensaje, 'error');
      var fNextEditor:any = this.formAtr.instance.getEditor('CODIGO');
      fNextEditor.focus();
      return (false);
    }
  
  }

  onSeleccEstado(e: any): void {
    this.DAtributos.ESTADO = e.value;
  }
  onSeleccClase(e: any): void {
    this.DAtributos.CLASE = e.value;
  }

  insertRow(e:any) {
    if (e.data.ATRIBUTO === '' || e.data.ESTADO === '') {
      this.showModal('Valores nulos en Codigo de atributo y estado');
      e.cancel = true;
    }
    else {
      if( !this.itemRepetido(this.filaDatosEdit.data.ATRIBUTO, this.valItemAtributo) ) {
        e.data.ITEM = this.valItemAtributo;
        e.data.ATRIBUTO = this.filaDatosEdit.data.ATRIBUTO;
        e.data.ESTADO = this.filaDatosEdit.data.ESTADO;
        e.data.IMAGEN = this.filaDatosEdit.data.IMAGEN;
        e.data.modoEdicion = false;
        e.data.verZoom = false;
        this.esEdicionFila = false;
      }
      else {
        e.cancel = true;
      }
    }
  }
  insertRowPro(e:any) {
    this.esVisibleSelecc = true;
    this.esEdicionFila = false;
    this.unseleccBorrar('update');
  }
  updatingRow(e:any) {
    if (e.newData) {
      if (e.newData.ATRIBUTO) {
        if( this.itemRepetido(e.newData.ATRIBUTO, e.oldData.ITEM) ) {
          e.cancel = true;
        }
      }
    }
  }
  updateRowPro(e:any) {
    this.esVisibleSelecc = true;
    this.esEdicionFila = false;
    this.unseleccBorrar('update');
  }
  onSaving(e:any) {}
  deleteRowPro(e:any) {}
  onRowValidating(e:any) {}

  // Valida si el atributo está repetido
  itemRepetido(dato, item): boolean {
    if (this.DItemsAtributos.findIndex(a => a.ATRIBUTO === dato && a.ITEM !== item) !== -1) {
      this.showModal('Atributo repetido!');
      return true;
    }
    else
      return false;
  }

  onInitNewRowPro(e: any) {
    if (this.DItemsAtributos.length > 0) {
      const item = this.DItemsAtributos.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    }
    else {
      e.data.ITEM = 1;
    }
    this.valItemAtributo = e.data.ITEM;
    e.data.ATRIBUTO = "";
    e.data.ESTADO = "ACTIVO";
    e.data.IMAGEN = "../../../assets/no-image.jpg";
    e.data.modoEdicion = true;
    e.data.verZoom = false;
    this.esEdicionFila = true;
    this.imageAtributo = "../../../assets/no-image.jpg";
    this.filaDatosEdit = undefined;
    this.esVisibleSelecc = true;
    this.unseleccBorrar('new');
    this.rowDelete = false;
  }

  // Llama al cargue del archivo
  datAtr: any;
  operArcImg(operArch, atr) {
    // Operación de cargue de archivo
    if(operArch.match('cargar|cargar prev')) {
      this.datAtr = atr;
      let input = document.createElement('input');
      input.type = 'file';
      input.accept="image/*";
      input.onchange = (e:any) => {
        this.fileChangeEvent(e, this.datAtr);    
      }
      input.click();
    }
    //Elimina archivo
    else {
      atr.data.IMAGEN = "../../../assets/no-image.jpg";
    }
  }

  imageError: string = '';
  fileChangeEvent(fileInput: any, atr: any) {
    this.imageError = '';
    if (fileInput.target.files && fileInput.target.files[0]) {
        // Size Filter Bytes
        const max_size = 61440;
        const allowed_types = ['image/png', 'image/jpeg'];
        const max_height = 15200;
        const max_width = 25600;

        if (fileInput.target.files[0].size > max_size) {
            this.imageError =
                'El máximo tamaño no debe supearar los 60 Kbytes ó ' + max_size / 1000000 + 'Mb';
            this.showModal(this.imageError);
            return false;
        }

        /*if (!_.includes(allowed_types, fileInput.target.files[0].type)) {
            this.imageError = 'Only Images are allowed ( JPG | PNG )';
            return false;
        }*/
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const image:any = new Image();
            image.src = e.target.result;
            image.onload = (rs:any) => {
                const img_height:any = rs.currentTarget['height'];
                const img_width:any = rs.currentTarget['width'];

                if (img_height > max_height && img_width > max_width) {
                    this.imageError =
                        'Máximas dimensiones permitidas: ' +
                        max_height +
                        '*' +
                        max_width +
                        'px';
                    this.showModal(this.imageError);
                    return false;
                } else {
                    const imgBase64Path = e.target.result;
                    //this.imageAtributo = imgBase64Path;
                    atr.data.IMAGEN = imgBase64Path;
                    this.filaDatosEdit = atr;
                    this.modoImagen = true;
                    //this.isImageSaved = true;
                    // this.previewImagePath = imgBase64Path;
                    return true;
                }
            };
        };

        if (this.imageError === '')
          reader.readAsDataURL(fileInput.target.files[0]);
        return true;
    }
    else 
      return false;
  }
  toggleWithTemplate(atr) {
    if (!atr.data.IMAGEN.match('no-image')) {
      atr.data.verZoom = !atr.data.verZoom;
    }
  }
  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte, archivo, datosrpt) {

    let filtroRep = {FILTRO: ''};
    const prmLiq = {
      clid: localStorage.getItem('empresa'), 
      usuario: localStorage.getItem('usuario'), 
      idrpt: archivo,
      id_reporte,
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      tabla: this.prmUsrAplBarReg.tabla,
      filtro: filtroRep
    };

    // Si no existe, no está abierta entonces agrega Tab
    const listaTab = this.tabService.tabs.find(c => c.aplicacion === id_reporte);
    if (listaTab === undefined) 
      GlobalVariables.listaAplicaciones.unshift({ aplicacion: id_reporte, barra: undefined, statusEdicion: '' });

    // Abre pestaña con nuevo reporte
    this.tabService.addTab(new Tab(VisorrepComponent,    // visor
                                    datosrpt.text,        // título
                                    { parent: "PrincipalComponent", args: prmLiq }, // parámetro: reporte,filtro
                                    id_reporte,           // código del reporte
                                    '',
                                    'reporte',
                                    true
                          ));
  }

  // Operaciones sobre la grid
  btnGuardar(e, datos, modo = '') {
    // Valida si no hay datos
    if (datos === undefined) {
      this.showModal('Valores nulos en atributo y estado');
      return;
    }
    // Datos digitados
    let rowIndex = datos.rowIndex;
    const v_atributo = this.valItmAtributo.instance.option('value');
    const v_estado = this.valItmEstado.instance.option('value');

    // Valida repetido
    if (this.itemRepetido(v_atributo, this.valItemAtributo)) return;
    
    // Valida...
    if (v_atributo === '' || v_estado === '') {
      this.showModal('Valores nulos en atributo y estado');
      return;
    }
    this.gridAtributos.instance.cellValue(rowIndex, 'ITEM', this.valItemAtributo);
    this.gridAtributos.instance.cellValue(rowIndex, 'ATRIBUTO', v_atributo);
    this.gridAtributos.instance.cellValue(rowIndex, 'ESTADO', v_estado);
    this.gridAtributos.instance.cellValue(rowIndex, 'IMAGEN', datos.data.IMAGEN);
    this.gridAtributos.instance.cellValue(rowIndex, 'modoEdicion', false);
    this.gridAtributos.instance.cellValue(rowIndex, 'verZoom', false);
    this.esEdicionFila = false;
    this.rowApplyChanges = false; 
    if (modo === '')
      this.gridAtributos.instance.saveEditData();
  }
  btnCancelar(e:any, datos:any) {
    datos.data.modoEdicion = false;
    this.gridAtributos.instance.cancelEditData();
  }
  editItemAtributoOld(e:any, oper:any, data:any) {
    // Modificar item
    if (oper === 'editar') {
      data.data.modoEdicion = true;
      this.gridAtributos.instance.editRow(data.rowIndex);
    }

    // Eliminar item
    else {
      this.gridAtributos.instance.deleteRow(data.rowIndex);
    }
  }
  onRowPrepared(e:any) {
    if (e.rowType === 'data') {
      if (e.data.IMAGEN.match('no-image.jpg')) {
        this.altoFilaDatos[e.data.ITEM] = '10px';
      }
      else {
        this.altoFilaDatos[e.data.ITEM] = '120px';
      }
    }
  }
  onSeleccDelete(e:any, datos:any) {

    // Activa modo seleccion para borrado
    this.modoSeleccDelete = true;

    // Si marcó/desmarcó todas
    if (datos === 'all') {
      for (var k=0; k<=this.DItemsAtributos.length; k++) {
        this.seleccDelete[k] = e.value;
      }
      this.rowDelete = e.value;
      return;
    }

    // Activa la fila
    this.seleccDelete[datos.data.ITEM] = e.value;
    if (this.seleccDelete.findIndex(d => d === true) !== -1) {
      this.rowDelete = true;
    }
    else {
      this.rowDelete = false;
    }
    this.filasSelecc = [];
    for (var k=0; k < this.seleccDelete.length; k++) {
      if (this.seleccDelete[k])
        this.filasSelecc.push(k);
    }
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string){
    if (obj == 'tipos atributos' || obj == 'todos' || obj == 'ref') {
      const prm = { };
      this._sdatos.consulta('TIPOS ATRIBUTOS',prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DClaseAtr = res;
      });
    }
  }

  // Desmarcar para borrado
  unseleccBorrar(oper:any) {
    for (var k=0; k<=this.DItemsAtributos.length; k++) {
      if (oper !== 'new') 
        if (this.DItemsAtributos.length !== 0)
          this.seleccDelete[this.DItemsAtributos[k===this.DItemsAtributos.length?k-1:k].ITEM] = false;
      else
        this.seleccDelete[k] = false;
    }
  }

  // Acciones sobre los settings de la aplicacion
  onSeleccOpcionSettings(e:any) {
    this._sdatos.setObs_OrdenAtr({ accion: 'activar', aplicacion: this.prmUsrAplBarReg.aplicacion});
  }

  // Operaciones de grid
  operGrid(e:any, operacion:any) {
    switch (operacion) {
      case 'new':
        // Valida que hayan datos del atributo
        if (this.ValidaDatos('requerido')) {
          if (this.esEdicionFila) this.btnGuardar(e, this.filaDatosEdit)
          setTimeout(() => {
            this.gridAtributos.instance.addRow();
          }, 300);
          this.rowApplyChanges = true;
          this.modoImagen = false;
          this.esEdicionFila = true;
        }
        break;
      case 'edit':
        if (!this.ValidaDatos('requerido')) return;
        this.esEdicionFila = true;
        this.rowApplyChanges = true;
        this.rowEdit = true;
        break;
      case 'save':
        this.btnGuardar(e, this.filaDatosEdit)
        this.rowNew = true;
        break;
      case 'cancel':
        this.gridAtributos.instance.cancelEditData();
        this.esEdicionFila = false;
        this.rowNew = true;
        this.rowApplyChanges = false;
        this.unseleccBorrar('cancel');
        if (this.filaDatosEdit) {
          this.filaDatosEdit.data = this.filaDatosEditOld;
          this.filaDatosEdit.data.modoEdicion = false;
          this.DItemsAtributos[this.filaDatosEdit.rowIndex] = this.filaDatosEditOld;
        }
        break;
      case 'delete':
        // Elimina filas seleccionadas
        Swal.fire({
          title: '',
          text: '¿Desea eliminar los items seleccionados?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
					confirmButtonColor: '#DF3E3E',
					cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.filasSelecc.forEach((key) => {
              const index = this.DItemsAtributos.findIndex(a => a.ITEM === key);
              if (index !== -1)
                this.DItemsAtributos.splice(index, 1);
            });
            this.unseleccBorrar('delete');
            this.rowDelete = false;
            this.gridAtributos.instance.refresh();
          }
        });
        break;

      default:
        break;
    }
  }
  selectionGrid(e:any) {
    this.filasSelecc = e.selectedRowKeys;
  }
  editItemAtributo(e:any) {
    // Modificar item
    if (this.readOnly || !this.mnuAccion.match('new|update')) return;

    if (e.rowType === 'data' && !this.modoSeleccDelete) {
      this.filaDatosEditOld = JSON.parse(JSON.stringify(e.data));
      this.filaDatosEdit = e;
      this.rowApplyChanges = true;
      this.esEdicionFila = true;
      this.valItemAtributo = e.data.ITEM;
      this.DItemsAtributos.forEach(a => { a.modoEdicion = false });
      e.data.modoEdicion = true;
      if (e.data.IMAGEN.match('no-image')) {
        this.modoImagen = false;
      }
      else {
        this.modoImagen = true;
      }
      this.gridAtributos.instance.editRow(e.rowIndex);
    }
    this.modoSeleccDelete = false;
  }
  async onValueChangedAtr(e:any, cellInfo:any) {
    if( await this.itemRepetido(e.value, cellInfo.data.ITEM ) ) {
      cellInfo.data.ATRIBUTO = e.previousValue;
      this.valItmAtributo.instance.option('value', e.previousValue);
    }
    else {
      if (e.value !== '') {
        cellInfo.data.ATRIBUTO = e.value;
        this.filaDatosEdit = cellInfo;
      }
      else {
        cellInfo.data.ATRIBUTO = e.previousValue;
        this.valItmAtributo.instance.option('value', e.previousValue);
      }
    }
  }
  onValueChangedEst(e, cellInfo) {
    cellInfo.data.ESTADO = e.value;
    this.filaDatosEdit = cellInfo;
  }
  
  ngOnInit(): void {
    const user:any = localStorage.getItem("usuario");
    this.prmUsrAplBarReg = {
      tabla: "ATRIBUTOS",
      aplicacion: "PRO-021",
      usuario: user,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: {}
    };
    this.DAtributos = { CODIGO: '', NOMBRE: '', ESTADO: '', CLASE: '', DEFECTO: false };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this.readOnly = true; 

    // Inicializacion de items
    this.DItemsAtributos = [];
    this.DClaseAtr = [];

    // Ini
    this.valoresObjetos('tipos atributos');

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
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
