import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxFormModule, DxSelectBoxModule } from 'devextreme-angular';
import { Subject, Subscription } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import Swal from 'sweetalert2';
import { AngularSplitModule } from 'angular-split';
import { clsOperRutas } from './clsPRO030.class';
import { PRO030Service } from 'src/app/services/PRO011/PRO030.service';
import { showToast } from '../../shared/toast/toastComponent.js';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { FiltrobusqComponent } from 'src/app/shared/filtrobusq/filtrobusq.component';

@Component({
  selector: 'app-PRO030',
  templateUrl: './PRO030.component.html',
  styleUrls: ['./PRO030.component.css'],
  standalone: true,
  imports: [ CommonModule, DxFormModule, DxSelectBoxModule, DxDataGridModule, DxButtonModule,
             AngularSplitModule, FiltrobusqComponent
   ]
})
export class PRO030Component {
  @ViewChild("gridRutasSust", { static: false }) gridItems: DxDataGridComponent;

  colCountByScreen: object;

  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string;
  FRutas: any;
  DListaRutas: any;
  DItemsRutas: clsOperRutas[] = [];
  DSeccRutas: any[] = [];
  USUARIO_LOCAL: any = '';
  EMPRESA: any = '';
  NOMBRE_USUARIO_LOCAL: any = '';
  readOnly: boolean = true;
  esEdicion: boolean = false;
  loadingVisible: boolean = false;
  accionRuta: string = "";
  rutaSecciones: string = "";
  QFiltro: string = "";
  VDatosReg: any;

  dropDownOptions = { width: 600, 
    height: 400, 
    hideOnParentScroll: true,
    container: '#router-container' };

    // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esNuevaFila: boolean = false;
  esVisibleSelecc: string = 'none';
  ltool: any;
  subscription: Subscription;
  eventsSubjectFiltro: Subject<any> = new Subject<any>();
  
  constructor(
    private _sdatos: PRO030Service,
		private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private tabService: TabService
  ) { 
    // Servicio de barra de registro
    this.subscription = this._sbarreg.getObsRegApl().subscribe((datreg) => {
        // Valida si la petición es para esta aplicacion
        if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });


  }

  // Llama a Acciones de registro
	opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes

		switch (operMenu.accion) {
			case "r_ini":
        this.prmUsrAplBarReg = {
          tabla: "RUTAS_PRODUCCION",
          aplicacion: "PRO-030",
          aplicacionBase: '',
          usuario: this.USUARIO_LOCAL,
					accion: "r_ini",
					error: "",
					r_numReg: 0,
					r_totReg: 0,
					operacion: { r_modificar: true }
				};
				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
				break;

      case 'r_nuevo':
        this.mnuAccion = 'new';
        this.readOnly = false;
        this.esVisibleSelecc = 'always';
        this.gridItems.instance.deselectAll();
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.readOnly = false;
        this.esVisibleSelecc = 'always';
        this.opPrepararModificar();
        break;

			case 'r_guardar':
				this.opPrepararGuardar(this.mnuAccion);
				break;

      case 'r_buscar':
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_buscar_ejec':
        this.opBlanquearForma();
        if (operMenu.operacion.filtro_arg) {
          this.opPrepararBuscar(operMenu.operacion.filtro_arg)
        }
        else {
          if (this._sfiltro.enConsulta === false) {
            this.opPrepararBuscar('');
          } else {
            showToast('Consulta en proceso, por favor espere.', 'warning');
          }
        }
        break;

      case 'r_cancelar':
        Swal.fire({
          title: '',
          text: 'Desea cancelar la operación?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar',
        }).then((result) => {
          if (result.isConfirmed) {
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
            this.readOnly = true;
            this.esEdicion = false;
            this.esVisibleSelecc = 'none';
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            this.opBlanquearForma();

            // Restituye los valores
            this.mnuAccion = '';
          }
        });
				break;

      case 'r_refrescar':
				break;

			default:
				break;
		}
	}

  opPrepararNuevo(): void {
    // Activa componentes
    this.esEdicion = true;
    this.opBlanquearForma();
  }

  opPrepararModificar()  {
    this.esEdicion = true;
    this.opBlanquearForma();
  }
  opBlanquearForma() {
    this.FRutas = {};
    this.DItemsRutas = [];
    this.DSeccRutas = [];
  }

  opPrepararGuardar(accion: string): void {
    // Acción validación de datos
    if (this.DItemsRutas.findIndex(r => r.ACCION == 'cancela') !== -1){
      this.showModal("Hay rutas con secciones faltantes en la ruta nueva!");
      return;
    }

    // API guardado de datos
    const prm = { ID_RUTA_NUEVA: this.FRutas.ID_RUTA, 
                  RUTAS: this.DItemsRutas, 
                  USUARIO: this.USUARIO_LOCAL,
                  APLICACION: this.prmUsrAplBarReg.aplicacion
                }
    var exito = false;
    this.loadingVisible = true;
    this._sdatos
    .save("actualizar", prm)
    .subscribe(

      { next: (resp) => {

        this.loadingVisible = false;
        try {
          
          const res = JSON.parse(resp.data);
          if (res[0].ErrMensaje !== ""){
            this.showModal('', 'error',res[0].ErrMensaje);
          } 
          else
          {
            this.readOnly = true;
            this.esEdicion = false;
            this.esVisibleSelecc = 'none';

            // Operaciones de barra
            if (this.mnuAccion === 'new'){
              this.QFiltro = ""
              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                error: "",
                accion: "r_navegar",
                r_numReg: 1,
                r_totReg: 1,
                operacion: {}
              };
            }
            else
              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                error: "",
                accion: "r_navegar",
                operacion: {}
            };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

            showToast('Registro actualizado', 'success');

          }

        } 
        catch (error) {
          this.showModal('El cambio de ruta necesita revisión: '+error);
        }

      },
      error: (e) => {
        this.loadingVisible = false;
        this.showModal('Error al generar actualización: '+e.error.message);
        }
      });

  }

  onSeleccRuta(e) {
    if (e.value) {
      const dnom: any = this.DListaRutas.find((p: any) => p.ID_RUTA === e.value);
      if (dnom) {
        this.FRutas.NOMBRE = dnom.DESCRIPCION;
      }
    }
  }

  initNewRow(e) {
    e.data.ID_RUTA = '';
    e.data.NOMBRE_RUTA = '';
    e.data.TIPO = '';
    e.data.SECCIONES = [];
    if (this.DItemsRutas.length > 0) {
      const item = this.DItemsRutas.reduce((ant:any, act:any) => {return (ant.ITEM > act.ITEM) ? ant : act}) 
      e.data.ITEM = item.ITEM + 1;
    } else {
      e.data.ITEM = 1;
    }
  }
  insertingRow(e) {

  }
  insertedRow(e) {
  }
  updatingRow(e) {
  }
  updatedRow(e) {
  }
  removedRow(e) {
  }
  onEditingStart(e) {
  }
  onEditorPreparing(e) {
  }
  onToolbarPreparingGrid(e) {
  }
  onRowPrepared(e) {
  }
  onRowValidating(e) {
  }
  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (!this.rowApplyChanges) {
      if (this.filasSelecc.length != 0)
        this.rowDelete = true;
      else
        this.rowDelete = false;
    }
  }
  onFocusedRowChanged(e) {
  }
  onEditCanceled(e) {
  }
  onCellClick(e) {
  }

  onRowClick(e) {
    this.DSeccRutas = e.data.SECCIONES;
    this.rutaSecciones = e.data.ID_RUTA+" "+e.data.NOMBRE_RUTA;
  }

  onSeleccRowRuta(e:any, cellInfo:any) {
    if (e.value){
      cellInfo.data.ID_RUTA = e.value;
      cellInfo.data.ACCION = 'cancela';
      const dnom: any = this.DListaRutas.find((p: any) => p.ID_RUTA === e.value);
      if (dnom) {
        cellInfo.data.NOMBRE_RUTA = dnom.DESCRIPCION;
        cellInfo.data.TIPO = dnom.TIPO;

        // Carga las secciones asociadas
        const prm = { ID_RUTA: e.value, ID_RUTA_NUEVA: this.FRutas.ID_RUTA, USUARIO: localStorage.getItem('usuario')};
        this._sdatos
          .consulta('secciones rutas', prm, this.prmUsrAplBarReg.aplicacion)
          .subscribe((data: any) => {
            const res = JSON.parse(data.data);
            if ( (data.token != undefined) ){
              const refreshToken = data.token;
              localStorage.setItem("token", refreshToken);
            }
            this.DSeccRutas = res;

            // Valida si no hay secciones homologadas
            const nx = this.DSeccRutas.findIndex(s => s.ACCION === 'no existe en nueva');
            if (nx != -1)
              cellInfo.data.ACCION = 'cancela';
            else
              cellInfo.data.ACCION = 'aplica';
            this.gridItems.instance.cellValue(cellInfo.rowIndex, "SECCIONES", this.DSeccRutas);
            this.gridItems.instance.saveEditData();
            this.rowApplyChanges = false;
            this.rowNew = true;
            this.esVisibleSelecc = 'always';
     
          });
          
      }
    }
  }

  onRespuestaFiltro(e: any) {
  }
  opPrepararBuscar(accion): void {

    if (accion === 'filtro') {
      const prmFiltro = {
        Titulo: "Datos de filtro para operaciones de rutas",
        accion: "activar",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
        objRegistro: this._sbarreg,
        objTab: this.tabService,
        usuario: this.prmUsrAplBarReg.usuario,
        title: 'Operaciones rutas'
      };
      this.eventsSubjectFiltro.next(prmFiltro);

    }
    else {
      this._sfiltro.enConsulta = true;

      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { RUTAS_PRODUCCION: arrFiltro };

      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }

          // Datos
          const datares = res;

          if (datares[0].ErrMensaje === '') {
            this.VDatosReg = datares;
            this.FRutas = datares[0];
            this.DItemsRutas = datares[0].RUTAS;
            this.DSeccRutas = datares[0].RUTAS[0].SECCIONES;
            this.QFiltro = datares[0].QFILTRO;

            // Prepara la barra para navegación
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              r_totReg: datares.length,
              r_numReg: 1,
              accion: 'r_navegar',
              operacion: { r_modificar: false },
            };
          }
          else {
            this.VDatosReg = [];
            showToast(datares[0].ErrMensaje, 'warning');
            this.opBlanquearForma();

            // Prepara la barra para navegación
            const user: any = localStorage.getItem('usuario');
            this.prmUsrAplBarReg = {
              tabla: 'RUTAS_PRODUCCION',
              aplicacion: 'PRO-030',
              usuario: user,
              accion: 'r_ini',
              error: '',
              r_numReg: 0,
              r_totReg: 0,
              operacion: { r_modificar: false }
            };

            this.mnuAccion = '';
            this.readOnly = true;
            this._sdatos.accion = 'r_ini';
          }
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

          // Trae los items en los componentes asociados
          this.loadingVisible = false;
          this._sfiltro.enConsulta = false;
        });
    }

    this.readOnly = true;
  }

  operGrid(e, operacion) {

    if (operacion !== 'delete') {
      this.gridItems.instance.deselectAll();    
    }

    switch (operacion) {
      case 'new':
        this.gridItems.instance.addRow();
        this.rowApplyChanges = true;
        this.esVisibleSelecc = 'none';
        this.esVisibleSelecc = 'none';
        this.rowNew = false;
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this.esVisibleSelecc = 'none';
        break;
      case 'save':
        this.gridItems.instance.saveEditData();
        this.rowApplyChanges = false;
        this.rowNew = true;
        this.esVisibleSelecc = 'always';
        this.gridItems.instance.deselectAll();    
        break;
      case 'cancel':
        this.gridItems.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.esVisibleSelecc = 'always';
        break;
      case 'delete':
        // Elimina filas seleccionadas
        Swal.fire({
          title: '',
          text: 'Desea eliminar los items seleccionados?',
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.filasSelecc.forEach((key) => {
              const index = this.DItemsRutas.findIndex(a => a.ITEM === key);
              this.DItemsRutas.splice(index, 1);
            });
            this.gridItems.instance.refresh();
          }
        });
        break;

      default:
        break;
    }
  }

  dragEnd(unit: any, sizes: any): any {
    // const ed = this.diagLay.instance.element();
    // ed.style.width = sizes[1];
  }
  onResized(event: any) {
  }

  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined){

    if (obj == 'rutas') {
      const prm = { USUARIO: localStorage.getItem('usuario')};
      this._sdatos
        .consulta('lista rutas', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DListaRutas = res;
        });
    }

  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: "RUTAS_PRODUCCION",
      aplicacion: "PRO-030",
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_modificar: true }
    };

    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.mnuAccion = '';
    this.readOnly = true;
    this.FRutas = {ID_RUTA: ''};
    this.DListaRutas = [];
    this.valoresObjetos('rutas');

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  showModal(mensaje, titulo = '', html = '', iconw = '') {
		Swal.fire({
			iconHtml: (iconw == '' ? "<i class='icon-cancelar-ol error-color'></i>" : "<i class='icon-alert-ol error-color'></i>"),
      confirmButtonColor: '#0F4C81',
			title: (titulo !== '' ? titulo : '¡Error!'),
			text: mensaje,
			allowOutsideClick: true,
			allowEscapeKey: false,
			allowEnterKey: false,
			backdrop: true,
			position: 'center',
      html,
			stopKeydownPropagation: false,
		});
	}

}