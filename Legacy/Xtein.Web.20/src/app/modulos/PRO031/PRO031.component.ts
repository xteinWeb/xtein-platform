import { CommonModule, formatDate } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { of, Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { showToast } from '../../shared/toast/toastComponent';
import { validatorRes } from 'src/app/shared/validator/validator';
import { PRO031Service } from 'src/app/services/PRO031/PRO031.service';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxLoadPanelModule, DxNumberBoxModule, DxPopupModule, DxTooltipComponent, DxTooltipModule, DxTreeListComponent, DxTreeListModule } from 'devextreme-angular';
import { on } from 'devextreme/events';
import Swal from 'sweetalert2';
import { MatCardModule } from '@angular/material/card';
import { CellInfo } from 'devexpress-richedit/lib/core/layout-formatter/table/info/cell-info';
import { CdkAccordionModule } from '@angular/cdk/accordion';

@Component({
  selector: 'app-PRO031',
  templateUrl: './PRO031.component.html',
  styleUrls: ['./PRO031.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxTooltipModule, DxLoadPanelModule, DxPopupModule, MatCardModule,
            DxButtonModule, DxNumberBoxModule, DxTreeListModule, CdkAccordionModule, DxDateBoxModule
  ]
})
export class PRO031Component {

  @ViewChild("gridGestionProd", { static: false }) gridGestionProd: DxTreeListComponent;
  @ViewChild("gridPartes1", { static: false }) gridPartes1: DxDataGridComponent;
  @ViewChild("gridPartes2", { static: false }) gridPartes2: DxDataGridComponent;
  @ViewChild("tooltipInfoDetalles", { static: false }) tooltipInfoDetalles: DxTooltipComponent;

  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
	public _unsubscribeAll: Subject<any>;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();

  QFiltro: any;
	VDatosReg: any;
	mnuAccion: string;
  prmUsrAplBarReg: clsBarraRegistro;

  USUARIO_LOCAL:any = '';
  
  readOnly: boolean = false;
	loadingVisible: boolean = true;
  loadingVisible1: boolean = true;
	popupVisibleProgramacion: boolean = false;
	activeNextSeccion: boolean = true;
  
  conCambios: number = 0;

  Dsecciones:any = [];
  DGdetalles:any = [];
	columnVisibles: any = [];

  tituloPopupProgramacion:any = '';
  infoPopupProgramacion:any = {};
  infoNextSeccion:any = {};
  noInfoSeccion:any = '';
  targetIdTooltip: string;
  tooltipTitulo: string;
  tooltipInfo: any = [];
  wrapperAttr = { class: "cls-tooltip-reg" };
  templateGroup: any = ['NOMBRE_PRODUCTO'];

  
  items:any = [ 'Cantidades', 'Partes Requeridas'];
  accordionExpand = [true,false];
  numTrabajadores: number = 1;
  horaSalida: any = new Date();

  constructor(
    private sData: PRO031Service,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private SVisor: SvisorService
  ) {
    
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
    });

    // Respuesta del visor de datos
    this.subs_visor = this.SVisor.getObs_Apl().subscribe(resp => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion) return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex((d:any) => d.ITEM === resp.ITEM);
      if (nx !== 0) {
        this.prmUsrAplBarReg.r_numReg = nx+1;
        this.opIrARegistro('r_numreg');
      }
    });

    
    this.addColumn = this.addColumn.bind(this);
    this.onCellPrepared = this.onCellPrepared.bind(this);
    this.selectCellTemplate = this.selectCellTemplate.bind(this);
    this.validateComponent = this.validateComponent.bind(this);

  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'AGENDA_PRODUCCION',
      aplicacion: 'PRO-031',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_imprimir: true, r_refrescar: true }
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.readOnly = true;
    this.mnuAccion = '';
    this.valoresObjetos('todos', '');
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  onCellPrepared(e:any) {
    if (e.rowType === "data") {
      const indexColumn:any = this.columnVisibles.findIndex((d:any) => d.caption === 'Secciones');
      const ownerBand:any = this.columnVisibles[indexColumn].index;
      if (ownerBand === e.column.ownerBand) {
        on(e.cellElement, "mouseover", (arg:any) => {
          const temData:any [] = e.data.SECCIONES.filter((d:any) => d.ID_SECCION === e.column.dataField);
          if(temData.length > 0)
            // if(temData.length > 0 && temData[0].CANTIDAD > 0)
            this.tooltipInfo = [{...temData[0], ORDEN_PRO: e.data.ORDEN_PRO}];
          if (this.tooltipInfo.length === 0) {
            this.tooltipInfo = [{ErrMesaje:'La sección no pertence a la ruta del producto.'}];
          }
          this.tooltipInfoDetalles.instance.show(arg.target);
        });
        on(e.cellElement, "mouseout", (arg:any) => {
          this.tooltipInfoDetalles.instance.hide();
          this.tooltipInfo = [];
          this.tooltipInfo = [{ErrMesaje:'La sección no pertence a la ruta del producto.'}];
        });
      }
    }
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          tabla: 'AGENDA_PRODUCCION',
          aplicacion: 'PRO-031',
          usuario: this.USUARIO_LOCAL,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { r_imprimir: true, r_refrescar: true }
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.readOnly = false;
        // this.opPrepararNuevo();
        break;

      case "r_modificar":
        // this.opPrepararModificar();
        break;

      case "r_guardar":
          // this.opPrepararGuardar(this.mnuAccion);
        break;

      case "r_buscar":
        if ( GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion ) return;
        if (!this._sfiltro.enConsulta)
          this.opPrepararBuscar('filtro');
        else
          showToast('Consulta en proceso, por favor espere.', 'warning');
        break;

      case "r_eliminar":
        // this.opEliminar();
        break;

      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
        this.opIrARegistro(operMenu.accion);
        // this.esVisibleSelecc = 'none';
        break;

      case "r_cancelar":
        var mensaje = '¿Desea cancelar la operación?';
        if (this.conCambios > 0) mensaje = 'Desea cancelar sin guardar cambios?';
        Swal.fire({
          title: '',
          text: mensaje,
          iconHtml: "<i class='icon-alert-ol'></i>",
          showCancelButton: true,
          confirmButtonColor: '#DF3E3E',
          cancelButtonColor: '#438ef1',
          cancelButtonText: 'No',
          confirmButtonText: 'Sí, cancelar'
          }).then((result) => {
          if (result.isConfirmed) {
            this.prmUsrAplBarReg.accion = 'r_cancelar';
            this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
            // this.FCapacidad = JSON.parse(JSON.stringify(this.FCapacidad_prev));
            this.mnuAccion = "";
            // this.esVisibleSelecc = 'none';
            this.readOnly = true;
            this.conCambios = 0;
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          }
        });
        break;

      case "r_copiar":
        // if (this.FCapacidad) {
        //   this.mnuAccion = 'new';
        //   this.readOnly = false;
        // } else {
        //   showToast('Seleccione sección a copiar', 'Error');
        // }
        break;

      case "r_vista":
        this.opVista();
        break;

      case 'r_refrescar':
        // if (this.cambiosFiltro > 0) {
        //   this.valoresObjetos('todos', '');
        //   this.crearFiltro();
        // } else {
        //   this.valoresObjetos('todos', '');
        // }
        this.valoresObjetos('todos', '');
        break;

      case "r_imprimir":
        // this.sendDataFilter('imprimir', operMenu, '');
        break;

      default:
        break;
    }
  }

  opPrepararBuscar(accion: any): void {
    if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para Agenda",
        accion: "PREPARAR FILTRO",
        Filtro: "",
        TablaBase: "AGENDA_PRODUCCION",
        aplicacion: this.prmUsrAplBarReg.aplicacion
      };
      this._sfiltro.getObsFiltro.emit(true);
    } else {
      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { AGENDA_PRODUCCION: arrFiltro };
      this.loadingVisible = true;

      // Ejecuta búsqueda API
      this.sData
        .consulta('consulta', prm,this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          this.loadingVisible = false;
          this._sfiltro.enConsulta = false;
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          const datares = res;
          if (datares[0].ErrMensaje !== '') {
            this.VDatosReg = [];
            // this.opBlanquearForma();
            showToast(datares[0].ErrMensaje, 'error');
            return;
          } else {
            this.VDatosReg = datares;
            this.QFiltro = datares[0].QFILTRO;
            // this.DAgenda = JSON.parse(JSON.stringify(this.VDatosReg));
            
            // Prepara la barra para navegación
            this.prmUsrAplBarReg = {...this.prmUsrAplBarReg,
              r_totReg: datares.length,
              r_numReg: 1,
              accion: 'r_navegar',
              operacion: {}
            }
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
            // Trae los items en los componentes asociados
            this.opIrARegistro('r_primero');
          }
          // this._sfiltro.enConsulta = false;
        });
    }
      this.readOnly = true;

    // this.readOnly = false;
  }

  opIrARegistro(accion: string): void {
    var newArray:any = {};
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        if ( this.VDatosReg.length != 0 ) {
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this.prmUsrAplBarReg.r_numReg = 1;
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        } else {
          this.readOnly = true;
          showToast("No se encontraron datos", 'error');
        }
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg =
        this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
          ? this.VDatosReg.length
          : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
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
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg-1]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

        } else {
          // this.opBlanquearForma();
        }
        this.readOnly = true;
        break;

      case "Eliminado":
        this.VDatosReg.splice(this.prmUsrAplBarReg.r_numReg - 1, 1);
        this.prmUsrAplBarReg.r_totReg = this.VDatosReg.length;
        if (this.prmUsrAplBarReg.r_numReg > this.prmUsrAplBarReg.r_totReg) {
          this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_totReg;
        }
        if (this.VDatosReg.length >= 0) {
          newArray =
            this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1];
        } else {
          // this.opBlanquearForma();
        }
        break;

      default:
        break;
    }

    // this.DAgenda = newArray;
    // this.sendDataFilter('Load Data', '', newArray);

  }

  opEliminar(): void {
    Swal.fire({
      title: '',
      text: '',
      html: '¿Eliminar el registro?<br/>'+
            '<b style="color: red;">¡ADVERTENCIA!</b> Se eliminarán los datos asociados!',
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
    const prm = { OPERACION: 'delete', DATOS: '' };
    this.sData
      .consulta('delete', prm, this.prmUsrAplBarReg.aplicacion)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({ 
        next: (data) => {
          try {
            const res = validatorRes(data);
            if (res[0].ErrMensaje !== '') {
              this.showModal(res[0].ErrMensaje, 'Error');
              return;
            }
  
            this.opIrARegistro("Eliminado");
            showToast('Turno eliminado', 'success');
            this.readOnly = true;
  
            // Operaciones de barra
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              error: "",
              accion: this.prmUsrAplBarReg.r_totReg !== 0 ? 'r_navegar' : 'r_ini',
              operacion: {}
            };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
          } catch (error) {
            this.showModal('Error respuesta eliminar');
          }
        },
        error: (err => {
          this.showModal('Error al eliminar');
        })
      });
  }

  // Vista/Zoom de los datos consultados
  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: "Gestion de la producción",
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: ['FECHA_INICIO|Fecha Inicio','FECHA_FIN|Fecha Fin'],
      Filtro: '',
      keyGrid: ['ITEM']
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  templateHtml(columna:any, element:any): any {
    let cad = [{ NOMBRE_PARTE: ''}];
    let res:any='';
    var nomProd:any = '';
    this.templateGroup.forEach((col:any) => {
      if (columna.row.data !== null && columna.row.data !== undefined) {
        nomProd = columna.row.data.NOMBRE_PARTE.toLowerCase();
        nomProd = nomProd[0].toUpperCase() + nomProd.slice(1);
        
        if (columna.row.data.PRODUCTO === 'RAIZ') {
          cad[0].NOMBRE_PARTE =  columna.row.data.ID_PARTE+' - '+nomProd+
          ', Pedido: '+columna.row.data.ID_PEDIDO+'-'+columna.row.data.NC_PEDIDO+', ' +
          'Orden: '+columna.row.data.ORDEN_PRO;

        } else if (columna.row.data.PRODUCTO !== 'RAIZ') {
          cad[0].NOMBRE_PARTE =  nomProd;
        }

        switch (element) {
          case 'NOMBRE_PARTE':
            res = cad[0].NOMBRE_PARTE;
            break;
          default:
            break;
        }
      }
      if (columna.row.data.collapsedItems !== undefined) {
        nomProd = columna.row.data.collapsedItems[0].NOMBRE_PARTE.toLowerCase();
        nomProd[0].toUpperCase() + nomProd.slice(1);
        cad[0].NOMBRE_PARTE =  columna.row.data.collapsedItems[0].ID_PARTE+' - '+nomProd+
                                ', Pedido: '+columna.row.data.collapsedItems[0].ID_PEDIDO+'-'+columna.row.data.collapsedItems[0].NC_PEDIDO+', ' +
                                'Orden: '+columna.row.data.collapsedItems[0].ORDEN_PRO;
        switch (element) {
          case 'NOMBRE_PARTE':
            res = cad[0].NOMBRE_PARTE;
            break;
          default:
            break;
        }
      }
    });
    return res;
  }

  addColumn(data:any, id_secciones:any, config:string) {
    // const dataSoruce:any = data.DETALLES;
    const idSecciones:any = id_secciones;
    const dataSoruce:any = data;
		this.DGdetalles = [];
		let columns:any = [];
    var newArray:any = [];
    if (this.columnVisibles.length === 0)
      this.columnVisibles = this.gridGestionProd.instance.getVisibleColumns();
    for (let i = 0; i < dataSoruce.length; i++) {
      var element = dataSoruce[i];
      if (config === 'CONFIG SECCIONES') {
        //Agrega Columnas de Atributos
        if (element.ATRIBUTOS !== undefined) {
          element.ATRIBUTOS.forEach((atr:any) => {
            const nomCol = atr.CODIGO?.toUpperCase();
            const desAtr = atr.CODIGO === 'SIN' ? 'SIN' : atr.CLASE;
            const exis = columns.indexOf(nomCol);
            if (exis === -1) {
              const indexColumn:any = this.columnVisibles.findIndex((d:any) => d.caption === 'Atributos');
              columns.push({dataField:nomCol, caption:desAtr, ownerBand:this.columnVisibles[indexColumn].index, alignment:'left'});
            }
            element = {...element, [nomCol]:atr.VALOR};
          });
        };
        //Agrega Columnas de Secciones
        if (element.SECCIONES.length > 0) {
          element.SECCIONES.forEach((secc:any) => {
            if (secc.ID_SECCION !== undefined) {
              const nomCol = secc.ID_SECCION?.toUpperCase();
              const desSecc = secc.NOMBRE_SECCION;
              const exis = columns.indexOf(nomCol);
              if (exis === -1) {
                const indexColumn:any = this.columnVisibles.findIndex((d:any) => d.caption === 'Secciones');
                columns.push({
                  dataField:nomCol, 
                  caption:desSecc, 
                  ownerBand:this.columnVisibles[indexColumn].index, 
                  isBand:true, 
                  alignment:'center',
                  cellTemplate: 'cellContenidoSeccion'
                  // cellTemplate: this.selectCellTemplate(secc)
                  // cellTemplate: (secc.ORDEN_SECC === 0 || secc.ORDEN_SECC === 1) && (secc.ESTADO === "REGISTRADO" || secc.ESTADO === "PROGRAMADO")
                  //               ? 'cellStartSeccion' 
                  //               : (secc.ORDEN_SECC === 0 || secc.ORDEN_SECC === 1) && (secc.ESTADO !== "REGISTRADO" && secc.ESTADO !== "PROGRAMADO")
                  //               ? 'cellContenidoSeccion' 
                  //               : secc.ORDEN_SECC > 1 
                  //               ? 'cellContenidoSeccion' 
                  //               : 'cellNoContenidoSeccion'
                });
              };
              element.ESTADO = secc.ESTADO;
              element = {...element, [nomCol]:secc.NOMBRE_SECCION};
            };
          });
          for (let i = 0; i < idSecciones.length; i++) {
            const secc = idSecciones[i];
            if (element.SECCIONES.findIndex((d:any) => d.ID_SECCION === secc) === -1) {
              const npos:any = this.Dsecciones.findIndex((d:any) => d.ID_SECCION === secc);
              const nomCol = secc?.toUpperCase();
              const desSecc = this.Dsecciones[npos].DESCRIPCION;
              const exis = columns.indexOf(nomCol);
              if (exis === -1) {
                const indexColumn:any = this.columnVisibles.findIndex((d:any) => d.caption === 'Secciones');
                columns.push({
                  dataField:nomCol, 
                  caption:desSecc, 
                  ownerBand:this.columnVisibles[indexColumn].index, 
                  isBand:true, 
                  alignment:'center',
                  cellTemplate: 'cellContenidoSeccion'
                  // cellTemplate: 'cellNoContenidoSeccion'
                });
              }
            }
          };
        }

      } else if (config === 'CONFIG ESTANDAR') {
        if (element.ID_SECCION !== undefined) {
          const nomCol = element.ID_SECCION?.toUpperCase();
          const desSecc = element.DESCRIPCION;
          const exis = columns.indexOf(nomCol);
          if (exis === -1) {
            const indexColumn:any = this.columnVisibles.findIndex((d:any) => d.caption === 'Secciones');
            columns.push({
              dataField:nomCol, 
              caption:desSecc, 
              ownerBand:this.columnVisibles[indexColumn].index, 
              isBand:true, 
              alignment:'center',
              cellTemplate: 'cellContenidoSeccion'
            });
          };
          element = {...element, [nomCol]:element.DESCRIPCION};
        };
      }

      newArray.push(element);
    };
		
    this.DGdetalles = newArray;
    //ordenar alfabéticamente
    let newColumns = columns.sort((a:any, b:any) => {
      return a.dataField.localeCompare(b.dataField);
    });
    newColumns.forEach((col:any) => {
      const columnVisibles:any [] = this.gridGestionProd.instance.getVisibleColumns();
      const indexColumn:any = columnVisibles.findIndex((d:any) => d.dataField === col.dataField);
      if (indexColumn === -1)
        this.gridGestionProd.instance.addColumn(col);
    });

    if(this.loadingVisible) this.loadingVisible = false;

	}

  selectCellTemplate(cellInfo:any, template:any) {
    var res:boolean = false;
    var datos:any = '';
    const pos:any = cellInfo.data.SECCIONES.findIndex((d:any) => d.ID_SECCION === cellInfo.column.dataField);
    switch (template) {
      case 'No Contenido':
        if (pos <= -1)
          res = true;
        break;

      case 'Start Seccion':
        if (pos > -1) {
          if (cellInfo.data.SECCIONES[pos].ESTADO === 'REGISTRADO' || cellInfo.data.SECCIONES[pos].ESTADO === 'PROGRAMADO') {
            if (cellInfo.data.SECCIONES[pos].ORDEN_SECC === 0 || cellInfo.data.SECCIONES[pos].ORDEN_SECC === 1)
              res = true;
          }else
            res = false;
        }
        else
          res = false;
        break;
        
      case 'Finish Seccion':
        if (pos > -1 && cellInfo.data.SECCIONES[pos].ESTADO === 'FINALIZADO') {
          res = true;
        }
        else
          res = false;
        break;

        
      case 'Process Seccion':
        if (pos > -1) {
          if (cellInfo.data.SECCIONES[pos].ESTADO === 'EN PROCESO') {
            res = true;
          }
          else
            res = false;
        }
        else
          res = false;
      break;
    
      default:
        res = false;
        break;
    }

    return of(res);
  }

  onContentReady(e:any) {
    setTimeout(() => {
      e;
    }, 500);
  }


  onCellDblClick(e:any) {
    if (e.rowType === "data") {
      const indexColumn:any = this.columnVisibles.findIndex((d:any) => d.caption === 'Secciones');
      const ownerBand:any = this.columnVisibles[indexColumn].index;
      if (ownerBand === e.column.ownerBand) {
        const npos:any = e.data.SECCIONES.findIndex((a:any) => a.ID_SECCION === e.column.dataField);
        if (npos > -1) {
          // this.infoPopupProgramacion = {...e.data, INFO_SECCION: e.data.SECCIONES[npos]};
          // this.tituloPopupProgramacion = 'Programación en Sección '+this.infoPopupProgramacion.INFO_SECCION.NOMBRE_SECCION;

          //información de la siguiente sección
          // if ((this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 0 || this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 1 &&
          //   this.infoPopupProgramacion.INFO_SECCION.ESTADO === 'EN PROCESO') || (this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC > 1)
          // ) 
            this.valoresObjetos('INFO SECCION', {...e.data, INFO_SECCION: e.data.SECCIONES[npos]});
          // else {
          //   // this.noInfoSeccion = res[0].ErrMensaje;
          //   this.activeNextSeccion = false;
          //   this.popupVisibleProgramacion = true;
          // }
          
        }
      };
    }
  }
  
  onClickSeccion(e:any, Btn:any, Data:any) {
    switch (Btn) {
      case 'Next':
        this.infoNextSeccion.INFO_SECCION.CANTIDAD = Data.INFO_SECCION.CANTIDAD_AUTORIZADA;
        break;
        
      case 'Before':
        this.infoNextSeccion.INFO_SECCION.CANTIDAD = 0;
        break;
    
      default:
        break;
    }
  }

  getFechaFormateada(fechaInicio:any, fechaFin: any) {
    var res:any = '';
    const locale = 'es';

    if (fechaInicio && !fechaFin) {
      const dIni = new Date(fechaInicio);    
      const diaIni = formatDate(dIni, 'd', locale);
      const mesIni = formatDate(dIni, 'MMM', locale);
      const anioIni = formatDate(dIni, 'y', locale);
      const horaIni = formatDate(dIni, 'h:mm a', locale);
      
      res = `${diaIni} ${mesIni} ${anioIni}, ${horaIni}`;

    } else if (!fechaInicio && fechaFin) {
      const dFin = new Date(fechaFin);  
      const diaFin = formatDate(dFin, 'd', locale);
      const mesFin = formatDate(dFin, 'MMM', locale);
      const anioFin = formatDate(dFin, 'y', locale);
      const horaFin = formatDate(dFin, 'h:mm a', locale);
      
      res = `${diaFin} ${mesFin} ${anioFin}, ${horaFin}`;

    } else if (fechaInicio && fechaFin) {
      const dIni = new Date(fechaInicio);
      const dFin = new Date(fechaFin);
    
      const mismoDia = dIni.getDate() === dFin.getDate() &&
                       dIni.getMonth() === dFin.getMonth() &&
                       dIni.getFullYear() === dFin.getFullYear();
    
      const mismoMes = dIni.getMonth() === dFin.getMonth();
      const mismoAnio = dIni.getFullYear() === dFin.getFullYear();
    
      const diaIni = formatDate(dIni, 'd', locale);
      const mesIni = formatDate(dIni, 'MMM', locale);
      const anioIni = formatDate(dIni, 'y', locale);
      const horaIni = formatDate(dIni, 'h:mm a', locale);
    
      const diaFin = formatDate(dFin, 'd', locale);
      const mesFin = formatDate(dFin, 'MMM', locale);
      const anioFin = formatDate(dFin, 'y', locale);
      const horaFin = formatDate(dFin, 'h:mm a', locale);
    
      if (mismoDia) {
        res = `${diaIni} ${mesIni}, ${horaIni} - ${horaFin}`;
      } else if (mismoMes && mismoAnio) {
        res = `${diaIni}, ${horaIni} - ${diaFin}, ${horaFin}`;
      } else if (mismoAnio) {
        res = `${diaIni} ${mesIni}, ${horaIni} - ${diaFin} ${mesFin}, ${horaFin}`;
      } else {
        res = `${diaIni} ${mesIni} ${anioIni}, ${horaIni} - ${diaFin} ${mesFin} ${anioFin}, ${horaFin}`;
      }

    }

    return res;
  }

  validateComponent(component:string) {
    var res:boolean;
    switch (component) {
      case 'btnAceptar':
        if ((this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 0 ||
          this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 1) &&
          this.infoPopupProgramacion.INFO_SECCION.CANTIDAD_AUTORIZADA === 0 
          // &&
          // !this.activeNextSeccion
        )  
          res = true 
        else if ((this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 0 ||
          this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 1) &&
          // this.infoPopupProgramacion.INFO_SECCION.CANTIDAD_AUTORIZADA > 0 &&
          this.infoPopupProgramacion.INFO_SECCION.CANTIDAD_AUTORIZADA === this.infoPopupProgramacion.INFO_SECCION.CANTIDAD 
          // && 
          // !this.activeNextSeccion
        )  
          res = false
        else if (this.activeNextSeccion && this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC > 1 && this.infoNextSeccion.INFO_SECCION.CANTIDAD <= 0) 
          res = true 
        else
          res = true
        break;

      case 'cardNextSeccion':
        if (this.activeNextSeccion && (this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 0 || this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 1 &&
          this.infoPopupProgramacion.INFO_SECCION.ESTADO === 'REGISTRADO' || this.infoPopupProgramacion.INFO_SECCION.ESTADO === 'PROGRAMADO') 
        )
          res = false 
        else if (this.activeNextSeccion && (this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 0 || this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 1 &&
          this.infoPopupProgramacion.INFO_SECCION.ESTADO === 'EN PROCESO') 
        )
          res = true
        else if (this.activeNextSeccion && this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC > 1)
          res =true
        else
          res = false

        break;
    
      default:
        res = true 
        break;
    }

    return res;
  }

  onClickBtnProgramacion(e:any, btn:string) {
    var mensaje:any = '';
    switch (btn) {
      case 'Aceptar':
        if (this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 0 ||
          this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 1 &&
          this.infoPopupProgramacion.INFO_SECCION.CANTIDAD_AUTORIZADA <= 0
        )
          showToast('Debe asignar una cantidad a esta sección.', 'warning');
        else if (this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 0 ||
            this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 1 &&
            this.infoPopupProgramacion.INFO_SECCION.CANTIDAD_AUTORIZADA < this.infoPopupProgramacion.INFO_SECCION.CANTIDAD
        ) {
          showToast('La Cantidad Autorizada debe ser igual a la Requerida.', 'warning');
        }
        else if (this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 0 ||
            this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 1 &&
            this.infoPopupProgramacion.INFO_SECCION.CANTIDAD_AUTORIZADA === this.infoPopupProgramacion.INFO_SECCION.CANTIDAD
        ) {
          mensaje = '¿Comenzar con la producción de '+this.infoNextSeccion.NOMBRE_PARTE+' en esta sección?';
          Swal.fire({
            title: '',
            text: mensaje,
            iconHtml: "<i class='icon-alert-ol'></i>",
            showCancelButton: true,
            confirmButtonColor: '#DF3E3E',
            cancelButtonColor: '#438ef1',
            cancelButtonText: 'No',
            confirmButtonText: 'Sí, continuar'
            }).then((result) => {
            if (result.isConfirmed) {
              this.opPrepararDatos();
            }
          });
        } else if (this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC > 1) {
          if (this.activeNextSeccion && this.infoNextSeccion.INFO_SECCION.CANTIDAD_AUTORIZADA < this.infoNextSeccion.INFO_SECCION.CANTIDAD
          ) {
            showToast('La Cantidad Autorizada debe ser igual a la Requerida.', 'warning');
          }
          else if (this.activeNextSeccion && this.infoNextSeccion.INFO_SECCION.CANTIDAD_AUTORIZADA === this.infoNextSeccion.INFO_SECCION.CANTIDAD) {
            mensaje = '¿Desea asignar '+this.infoNextSeccion.INFO_SECCION.CANTIDAD_AUTORIZADA+' '
                          +this.infoNextSeccion.NOMBRE_PARTE+' en la sección '+
                          this.infoNextSeccion.INFO_SECCION.NOMBRE_SECCION
                          ? this.infoNextSeccion.INFO_SECCION.NOMBRE_SECCION
                          : this.infoNextSeccion.INFO_SECCION.ID_SECCION_SIG
                          +'?';
            Swal.fire({
              title: '',
              text: mensaje,
              iconHtml: "<i class='icon-alert-ol'></i>",
              showCancelButton: true,
              confirmButtonColor: '#DF3E3E',
              cancelButtonColor: '#438ef1',
              cancelButtonText: 'No',
              confirmButtonText: 'Sí, continuar'
              }).then((result) => {
              if (result.isConfirmed) {
                this.opPrepararDatos();
              }
            });
          }

        } else {
          showToast('Debe asignar una cantidad a la siguiente sección.', 'warning');
        }
        break;
      case 'Cancelar':
        this.popupVisibleProgramacion = false;
        // setTimeout(() => {
        //   this.tituloPopupProgramacion = '';
        //   this.infoPopupProgramacion = {};
        //   this.infoNextSeccion = {};      
        // }, 1000);
        break;
    
      default:
        break;
    }
  }

  opPrepararDatos() {
    //datos seccion actual
    var seccAct:any = {};
    var seccSig:any = {};
    var AUT:boolean = false;
    if (this.Dsecciones.findIndex((d:any) => d.ID_SECCION === this.infoPopupProgramacion.INFO_SECCION.ID_SECCION_SIG) === -1) AUT = true;

    if (this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 0 || this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC === 1) {
      if (this.infoPopupProgramacion.INFO_SECCION.ESTADO === 'PROGRAMADO') {
        seccAct = {
          ID_PEDIDO: this.infoPopupProgramacion.ID_PEDIDO,
          NC_PEDIDO: this.infoPopupProgramacion.NC_PEDIDO,
          ORDEN_PRO: this.infoPopupProgramacion.ORDEN_PRO,
          PRODUCTO: this.infoPopupProgramacion.PRODUCTO,
          NOMBRE_PRODUCTO: this.infoPopupProgramacion.NOMBRE_PRODUCTO,
          ATRIBUTO: 'SIN',
          ESTADO: this.validateEstado(this.infoPopupProgramacion.INFO_SECCION),
          ID_PARTE: this.infoPopupProgramacion.ID_PARTE,
          NOMBRE_PARTE: this.infoPopupProgramacion.NOMBRE_PARTE,
          ORDEN_SECC: this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC,
          ID_SECCION: this.infoPopupProgramacion.INFO_SECCION.ID_SECCION,
          ID_SECCION_SIG: this.infoPopupProgramacion.INFO_SECCION.ID_SECCION_SIG,
          CANTIDAD: this.infoPopupProgramacion.INFO_SECCION.CANTIDAD,
          CANTIDAD_PENDIENTE: this.infoPopupProgramacion.INFO_SECCION.CANTIDAD - this.infoPopupProgramacion.INFO_SECCION.CANTIDAD_AUTORIZADA,
          CANTIDAD_PRODUCIDA: this.infoPopupProgramacion.INFO_SECCION.CANTIDAD_AUTORIZADA,
          TIEMPO_PRODUCCION: this.infoPopupProgramacion.INFO_SECCION.TIEMPO_PRODUCCION,
          FECHA_INICIO_PROGRAMADA: this.infoPopupProgramacion.INFO_SECCION.FECHA_INICIO_PROGRAMADA,
          FECHA_FIN_PROGRAMADA: this.infoPopupProgramacion.INFO_SECCION.FECHA_FIN_PROGRAMADA,
          FECHA_INICIO_PRODUCCION: new Date(),
          FECHA_FIN_PRODUCCION: null,
          TIEMPO_ATRASO: null,
          USUARIO: this.USUARIO_LOCAL
        };

      } else if (this.infoPopupProgramacion.INFO_SECCION.ESTADO === 'EN PROCESO') {
        seccAct = {
          ID_PEDIDO: this.infoPopupProgramacion.ID_PEDIDO,
          NC_PEDIDO: this.infoPopupProgramacion.NC_PEDIDO,
          ORDEN_PRO: this.infoPopupProgramacion.ORDEN_PRO,
          PRODUCTO: this.infoPopupProgramacion.PRODUCTO,
          NOMBRE_PRODUCTO: this.infoPopupProgramacion.NOMBRE_PRODUCTO,
          ATRIBUTO: 'SIN',
          ESTADO: this.validateEstado(this.infoPopupProgramacion.INFO_SECCION),
          ID_PARTE: this.infoPopupProgramacion.ID_PARTE,
          NOMBRE_PARTE: this.infoPopupProgramacion.NOMBRE_PARTE,
          ORDEN_SECC: this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC,
          ID_SECCION: this.infoPopupProgramacion.INFO_SECCION.ID_SECCION,
          ID_SECCION_SIG: this.infoPopupProgramacion.INFO_SECCION.ID_SECCION_SIG,
          CANTIDAD: this.infoPopupProgramacion.INFO_SECCION.CANTIDAD,
          CANTIDAD_PENDIENTE: this.infoPopupProgramacion.INFO_SECCION.CANTIDAD - this.infoPopupProgramacion.INFO_SECCION.CANTIDAD_AUTORIZADA,
          CANTIDAD_PRODUCIDA: this.infoPopupProgramacion.INFO_SECCION.CANTIDAD_AUTORIZADA,
          TIEMPO_PRODUCCION: this.infoPopupProgramacion.INFO_SECCION.TIEMPO_PRODUCCION,
          FECHA_INICIO_PROGRAMADA: new Date(this.infoPopupProgramacion.INFO_SECCION.FECHA_INICIO_PROGRAMADA),
          FECHA_FIN_PROGRAMADA: new Date(this.infoPopupProgramacion.INFO_SECCION.FECHA_FIN_PROGRAMADA),
          FECHA_INICIO_PRODUCCION: new Date(this.infoPopupProgramacion.INFO_SECCION.FECHA_INICIO_PRODUCCION),
          FECHA_FIN_PRODUCCION: new Date(),
          TIEMPO_ATRASO: null,
          USUARIO: this.USUARIO_LOCAL
        };
        seccSig = {
          ID_PEDIDO: this.infoNextSeccion.ID_PEDIDO,
          NC_PEDIDO: this.infoNextSeccion.NC_PEDIDO,
          ORDEN_PRO: this.infoNextSeccion.ORDEN_PRO,
          PRODUCTO: this.infoNextSeccion.PRODUCTO,
          NOMBRE_PRODUCTO: this.infoPopupProgramacion.NOMBRE_PRODUCTO,
          ATRIBUTO: 'SIN',
          ESTADO: AUT ? 'PENDIENTE ACEPTAR' : this.validateEstado(this.infoNextSeccion.INFO_SECCION),
          ID_PARTE: this.infoNextSeccion.ID_PARTE,
          NOMBRE_PARTE: this.infoPopupProgramacion.NOMBRE_PARTE,
          ORDEN_SECC: this.infoNextSeccion.INFO_SECCION.ORDEN_SECC,
          ID_SECCION: this.infoNextSeccion.INFO_SECCION.ID_SECCION,
          ID_SECCION_SIG: this.infoNextSeccion.INFO_SECCION.ID_SECCION_SIG,
          CANTIDAD: this.infoNextSeccion.INFO_SECCION.CANTIDAD_AUTORIZADA,
          CANTIDAD_PENDIENTE: this.infoNextSeccion.INFO_SECCION.CANTIDAD_PENDIENTE,
          CANTIDAD_PRODUCIDA: 0,
          TIEMPO_PRODUCCION: this.infoNextSeccion.INFO_SECCION.TIEMPO_PRODUCCION,
          FECHA_INICIO_PROGRAMADA: new Date(this.infoNextSeccion.INFO_SECCION.FECHA_INICIO_PROGRAMADA),
          FECHA_FIN_PROGRAMADA: new Date(this.infoNextSeccion.INFO_SECCION.FECHA_FIN_PROGRAMADA),
          FECHA_INICIO_PRODUCCION: new Date(),
          FECHA_FIN_PRODUCCION: null,
          TIEMPO_ATRASO: null,
          USUARIO: this.USUARIO_LOCAL
        };
      }

    } else if (this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC > 1) {
      seccAct = {
        ID_PEDIDO: this.infoPopupProgramacion.ID_PEDIDO,
        NC_PEDIDO: this.infoPopupProgramacion.NC_PEDIDO,
        ORDEN_PRO: this.infoPopupProgramacion.ORDEN_PRO,
        PRODUCTO: this.infoPopupProgramacion.PRODUCTO,
        NOMBRE_PRODUCTO: this.infoPopupProgramacion.NOMBRE_PRODUCTO,
        ATRIBUTO: 'SIN',
        ESTADO: this.validateEstado(this.infoPopupProgramacion.INFO_SECCION),
        ID_PARTE: this.infoPopupProgramacion.ID_PARTE,
        NOMBRE_PARTE: this.infoPopupProgramacion.NOMBRE_PARTE,
        ORDEN_SECC: this.infoPopupProgramacion.INFO_SECCION.ORDEN_SECC,
        ID_SECCION: this.infoPopupProgramacion.INFO_SECCION.ID_SECCION,
        ID_SECCION_SIG: this.infoPopupProgramacion.INFO_SECCION.ID_SECCION_SIG,
        CANTIDAD: this.infoPopupProgramacion.INFO_SECCION.CANTIDAD,
        CANTIDAD_PENDIENTE: this.infoPopupProgramacion.INFO_SECCION.CANTIDAD - this.infoPopupProgramacion.INFO_SECCION.CANTIDAD_AUTORIZADA,
        CANTIDAD_PRODUCIDA: this.infoPopupProgramacion.INFO_SECCION.CANTIDAD_AUTORIZADA,
        TIEMPO_PRODUCCION: this.infoPopupProgramacion.INFO_SECCION.TIEMPO_PRODUCCION,
        FECHA_INICIO_PROGRAMADA: new Date(this.infoPopupProgramacion.INFO_SECCION.FECHA_INICIO_PROGRAMADA),
        FECHA_FIN_PROGRAMADA: new Date(this.infoPopupProgramacion.INFO_SECCION.FECHA_FIN_PROGRAMADA),
        FECHA_INICIO_PRODUCCION: this.infoPopupProgramacion.INFO_SECCION.ESTADO !== 'PROGRAMADO'
                                  ? new Date(this.infoPopupProgramacion.INFO_SECCION.FECHA_INICIO_PRODUCCION)
                                  : new Date(),
        FECHA_FIN_PRODUCCION: null,
        TIEMPO_ATRASO: null,
        USUARIO: this.USUARIO_LOCAL
      };

      if (this.infoNextSeccion.INFO_SECCION.PARTES.length === 0) {
        seccSig = {
          ID_PEDIDO: this.infoNextSeccion.ID_PEDIDO,
          NC_PEDIDO: this.infoNextSeccion.NC_PEDIDO,
          ORDEN_PRO: this.infoNextSeccion.ORDEN_PRO,
          PRODUCTO: this.infoNextSeccion.PRODUCTO,
          NOMBRE_PRODUCTO: this.infoPopupProgramacion.NOMBRE_PRODUCTO,
          ATRIBUTO: 'SIN',
          ESTADO: AUT ? 'PENDIENTE ACEPTAR' : this.validateEstado(this.infoNextSeccion.INFO_SECCION),
          ID_PARTE: this.infoNextSeccion.ID_PARTE,
          NOMBRE_PARTE: this.infoPopupProgramacion.NOMBRE_PARTE,
          ORDEN_SECC: this.infoNextSeccion.INFO_SECCION.ORDEN_SECC,
          ID_SECCION: this.infoNextSeccion.INFO_SECCION.ID_SECCION,
          ID_SECCION_SIG: this.infoNextSeccion.INFO_SECCION.ID_SECCION_SIG,
          CANTIDAD: this.infoNextSeccion.INFO_SECCION.CANTIDAD_AUTORIZADA,
          CANTIDAD_PENDIENTE: this.infoNextSeccion.INFO_SECCION.CANTIDAD_PENDIENTE,
          CANTIDAD_PRODUCIDA: 0,
          TIEMPO_PRODUCCION: this.infoNextSeccion.INFO_SECCION.TIEMPO_PRODUCCION,
          FECHA_INICIO_PROGRAMADA: new Date(this.infoNextSeccion.INFO_SECCION.FECHA_INICIO_PROGRAMADA),
          FECHA_FIN_PROGRAMADA: new Date(this.infoNextSeccion.INFO_SECCION.FECHA_FIN_PROGRAMADA),
          FECHA_INICIO_PRODUCCION: new Date(),
          FECHA_FIN_PRODUCCION: null,
          TIEMPO_ATRASO: null,
          USUARIO: this.USUARIO_LOCAL
        };
      } else if (this.infoNextSeccion.INFO_SECCION.PARTES.length > 0) {
        seccSig = {
          ID_PEDIDO: this.infoNextSeccion.ID_PEDIDO,
          NC_PEDIDO: this.infoNextSeccion.NC_PEDIDO,
          ORDEN_PRO: this.infoNextSeccion.ORDEN_PRO,
          PRODUCTO: this.infoNextSeccion.PRODUCTO,
          NOMBRE_PRODUCTO: this.infoPopupProgramacion.NOMBRE_PRODUCTO,
          ATRIBUTO: 'SIN',
          ESTADO: AUT ? 'PENDIENTE ACEPTAR' : this.validateEstado(this.infoNextSeccion.INFO_SECCION),
          ID_PARTE: this.infoNextSeccion.ID_PARTE,
          NOMBRE_PARTE: this.infoPopupProgramacion.NOMBRE_PARTE,
          ORDEN_SECC: this.infoNextSeccion.INFO_SECCION.ORDEN_SECC,
          ID_SECCION: this.infoNextSeccion.INFO_SECCION.ID_SECCION,
          ID_SECCION_SIG: this.infoNextSeccion.INFO_SECCION.ID_SECCION_SIG,
          CANTIDAD: this.infoNextSeccion.INFO_SECCION.CANTIDAD_AUTORIZADA,
          CANTIDAD_PENDIENTE: this.infoNextSeccion.INFO_SECCION.CANTIDAD_PENDIENTE,
          CANTIDAD_PRODUCIDA: 0,
          TIEMPO_PRODUCCION: this.infoNextSeccion.INFO_SECCION.TIEMPO_PRODUCCION,
          FECHA_INICIO_PROGRAMADA: new Date(this.infoNextSeccion.INFO_SECCION.FECHA_INICIO_PROGRAMADA),
          FECHA_FIN_PROGRAMADA: new Date(this.infoNextSeccion.INFO_SECCION.FECHA_FIN_PROGRAMADA),
          FECHA_INICIO_PRODUCCION: new Date(),
          FECHA_FIN_PRODUCCION: null,
          TIEMPO_ATRASO: null,
          USUARIO: this.USUARIO_LOCAL
        };
      }

    }

    seccAct.TRABAJADORES = this.numTrabajadores;
    seccAct.HORA_SALIDA = this.horaSalida ? formatDate(this.horaSalida, 'HH:mm', 'es') : null;
    if (seccSig && seccSig.ID_PEDIDO) {
      seccSig.TRABAJADORES = this.numTrabajadores;
      seccSig.HORA_SALIDA = seccAct.HORA_SALIDA;
    }

    const prm:any = {Act: seccAct, Sig: seccSig, AUT}
    this.opPrepararGuardar(prm);
    
  }

  validateEstado(data:any) {
    var res: any = '';
    switch (data.ESTADO) {
      case 'REGISTRADO':
      case 'PROGRAMADO':
        res = 'EN PROCESO';
        break;
      case 'EN PROCESO':
        res = 'FINALIZADO';
        break;
      case 'FINALIZADO':
        res = 'FINALIZADO';
        break;
    
      default:
        break;
    }
    return res;
  }

  opPrepararGuardar(datos:any) {
    const prm:any = {SECCION_ACTUAL: datos.Act, SECCION_SIGUIENTE: datos.Sig, AUTORIZAR: datos.AUT };
    this.sData.consulta('UPDATE ITEM AGENDA', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any) => {
      this.loadingVisible = false;
      const res = validatorRes(data);
      if ((data.token !== undefined)) {
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      const mensaje = res[0].ErrMensaje;
      if (mensaje !== '') {
        this.showModal(mensaje, 'error');
      } else {
        showToast('Registro exitoso.', 'success');
        this.valoresObjetos('todos', '');
        //notificacion al Responsable
        // this.envioNotificacion('notificacion', prm.ACTIVIDAD, TIMELINE);
      };
    },
      ((err:any) => {
        this.loadingVisible = false;
        this.showModal(err.message, 'error');
      })
    );

  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, datos:any) {
     this.loadingVisible = true;
    if (obj === 'secciones' || obj === 'todos') {
      const prm = {USUARIO: this.USUARIO_LOCAL };
      this.loadingVisible = true;
      this.sData.consulta('SECCIONES', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = validatorRes(data);
        if(res[0].ErrMensaje !== '') {
          this.loadingVisible = false;
          showToast(res[0].ErrMensaje, 'error');
          this.DGdetalles = [];
        } else {
          const prmData:any = res.map((d:any) => d.ID_SECCION);
          this.Dsecciones = res;
          this.sData.consulta('PROGRAMADO SECCIONES', {SECCIONES: prmData}, this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
            const newRes = validatorRes(data);
            if(newRes[0].ErrMensaje !== '') {
              showToast(newRes[0].ErrMensaje, 'error');
              this.addColumn(this.Dsecciones, prmData, 'CONFIG ESTANDAR');
              this.DGdetalles = [];
            } else {
              // this.Dsecciones = res;
              this.addColumn(newRes, prmData, 'CONFIG SECCIONES');
            }
          });
          // this.addColumn(res);
        }
      });
    };
    if (obj === 'INFO SECCION') {
      const prm = {
        ID_SECCION_ACT: datos.INFO_SECCION.ID_SECCION,
        ID_SECCION_SIG: datos.INFO_SECCION.ID_SECCION_SIG,
        PRODUCTO: datos.PRODUCTO,
        ID_PARTE: datos.ID_PARTE,
        ID_PEDIDO: datos.ID_PEDIDO,
        NC_PEDIDO: datos.NC_PEDIDO,
        ORDEN_PRO: datos.ORDEN_PRO
      };
      this.loadingVisible = true;
      this.sData.consulta('INFO SECCION', prm, this.prmUsrAplBarReg.aplicacion).subscribe((data: any)=> {
        const res = validatorRes(data);
        if(res[0].ErrMensaje !== '') {
          this.loadingVisible = false;
          this.noInfoSeccion = res[0].ErrMensaje;
          this.activeNextSeccion = false;
          this.popupVisibleProgramacion = true;
        } else {
          //información de la siguiente sección
          this.infoPopupProgramacion = {...datos, INFO_SECCION: res[0].SECCION_ACTUAL[0]};
          this.tituloPopupProgramacion = 'Programación en Sección '+this.infoPopupProgramacion.INFO_SECCION.NOMBRE_SECCION;
          this.infoNextSeccion = {...datos, INFO_SECCION: res[0].SECCION_SIGUIENTE[0]};
          this.numTrabajadores = 1;
          this.horaSalida = new Date();

          if (typeof  this.infoPopupProgramacion.INFO_SECCION.PARTES === 'string'){
            this.infoPopupProgramacion.INFO_SECCION.PARTES = JSON.parse(this.infoPopupProgramacion.INFO_SECCION.PARTES)
          };
          if (typeof this.infoNextSeccion.INFO_SECCION.PARTES === 'string'){
            this.infoNextSeccion.INFO_SECCION.PARTES = JSON.parse(this.infoNextSeccion.INFO_SECCION.PARTES)
          }
          this.activeNextSeccion = true;
          this.popupVisibleProgramacion = true;
          this.loadingVisible = false;

          // if (this.gridPartes1.instance) this.gridPartes1.instance.refresh();
          // if (this.gridPartes2.instance) this.gridPartes2.instance.refresh();

        }
      });
    };
  }
  
  // Imprimir reporte de aplicación
  imprimirReporte(operMenu:any) {
    var prmRep = {
      ...operMenu.operacion, 
      accion: 'previsualizar',
      aplicacion: this.prmUsrAplBarReg.aplicacion, 
      tabla: this.prmUsrAplBarReg.tabla,
      usuario: this.prmUsrAplBarReg.usuario,
      // QFiltro: (operMenu.operacion.registro === 'todos') ? this.QFiltro : " CAPACIDAD_PRODUCCION.ITEM = "+this.FCapacidad.ITEM
    };
    if (operMenu.operacion.modo === 'previsualizar')
      this.eventsSubjectInformes.next(prmRep);
    if (operMenu.operacion.modo === 'pdf') {
      prmRep = { ...prmRep, accion: 'pdf' };
      this.eventsSubjectInformes.next(prmRep);
    }
    if (operMenu.operacion.modo === 'email') {
      let template = '';
      let asunto = '';
      let email_sale = '';
      let nom_usr = '';
      var prmRep = { ...operMenu.operacion, 
          accion: 'email',
          asunto,
          email_sale,
          especUsuarioEmail: nom_usr,
          // nombre: this.FCapacidad.ITEM,
          email:  '',
          template,
          replacements: '',
          // dataSource: this.FCapacidad
        };
      this.eventsSubjectInformes.next(prmRep);
    }

  }

  showModal(mensaje:any, titulo:any='¡Error!', msg_html:any= '') {
    let iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
    if (titulo !== '¡Error!') iconHtml = "<i class='icon-alert-ol'></i>";
    Swal.fire({
      iconHtml: iconHtml,
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
