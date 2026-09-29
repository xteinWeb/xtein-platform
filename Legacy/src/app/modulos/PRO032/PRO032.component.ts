import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { showToast } from '../../shared/toast/toastComponent';
import { validatorRes } from 'src/app/shared/validator/validator';
import Swal from 'sweetalert2';
import { PRO032Service } from 'src/app/services/PRO032/PRO032.service';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxListModule, DxNumberBoxModule, DxRadioGroupModule, DxSelectBoxModule, DxToolbarModule, DxTreeListComponent, DxTreeListModule } from 'devextreme-angular';
import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { Tab } from 'src/app/containers/tabs/tab.model';
import dxCheckBox from 'devextreme/ui/check_box';

@Component({
  selector: 'app-PRO032',
  templateUrl: './PRO032.component.html',
  styleUrls: ['./PRO032.component.css'],
  standalone: true,
  imports: [CommonModule, DxSelectBoxModule, DxDataGridModule, DxListModule, DxToolbarModule, DxRadioGroupModule, DxDateBoxModule,
            DxTreeListModule, DxNumberBoxModule, DxDropDownBoxModule, DxButtonModule
   ]
})
export class PRO032Component {

  @ViewChild("treeListProgramacion", { static: false }) treeListProgramacion: DxTreeListComponent;
  @ViewChild("gridListaProductosConsolidado", { static: false }) gridListaProductosConsolidado: DxDataGridModule;
  @ViewChild("gridListaProductosDetallado", { static: false }) gridListaProductosDetallado: DxDataGridModule;
  @ViewChild("gridListaProductos", { static: false }) gridListaProductos: DxDataGridComponent;


  subscription: Subscription;
  subs_filtro: Subscription;
  subs_visor: Subscription;
	public _unsubscribeAll: Subject<any>;
  unSubscribe: Subject<boolean> = new Subject<boolean>();

  QFiltro: any;
  VDatosReg: any;
  mnuAccion: string;
  prmUsrAplBarReg: clsBarraRegistro;
  
  USUARIO_LOCAL:any = '';
  conCambios: number = 0;
  selectMateriales: any = [];
  DGMateriales: any = [];
  DGMaterialesConsolidado: any [] = [];
  
  readOnly: boolean = false;
	loadingVisible: boolean = false;
  ActiveConsolidado: boolean = false;

  FMDP: any = {};
  DSecciones:any = [];
  DProgramacion:any = [];
  DGdetalles:any = [];
	columnVisibles: any = [];

  DPlantas: any [] = [];
	selectPlantas: any = [];
  openIdPlantas: boolean = false;

  templateGroup: any = ['PRODUCTO','NOMBRE_PRODUCTO'];
  priorities = [ 'Consolidado', 'Detallado' ];

  constructor(
    private sData: PRO032Service,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private SVisor: SvisorService,
    private tabService: TabService
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

      
  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase();
    this.prmUsrAplBarReg = {
      tabla: 'AGENDA_PRODUCCION',
      aplicacion: 'PRO-032',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { }
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.readOnly = true;
    this.mnuAccion = '';
    this.FMDP  = {
      TIPO_MDP: '',
      TIPO_TR: '',
      FECHA_INICIO: '',
      FECHA_FINAL: '',
      PRODUCTOS: []
    }
    this.valoresObjetos('arbol secciones', '');
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          tabla: 'AGENDA_PRODUCCION',
          aplicacion: 'PRO-032',
          usuario: this.USUARIO_LOCAL,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: { }
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.readOnly = false;
        this.opPrepararNuevo();
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
            this.mnuAccion = "";
            this.readOnly = true;
            this.conCambios = 0;
            this.opBlanquearForma();
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
        // this.valoresObjetos('todos', '');
        break;

      case "r_imprimir":
        // this.sendDataFilter('imprimir', operMenu, '');
        break;

      default:
        break;
    }
  }

  opPrepararNuevo() {
    this.conCambios = 0;
    const hoy = new Date();
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);

    this.FMDP  = {
      TIPO_MDP: '',
      TIPO_TR: '',
      FECHA_INICIO: new Date(),
      FECHA_FINAL: mañana,
      PRODUCTOS: []
    }
  }

  opBlanquearForma(): void {
    this.FMDP  = {
      TIPO_MDP: '',
      TIPO_TR: '',
      FECHA_INICIO: '',
      FECHA_FINAL: '',
      PRODUCTOS: []
    }
    this.DGMateriales = [];
    this.DGMaterialesConsolidado = [];
    this.conCambios = 0;
  }

  opPrepararBuscar(accion: any): void {
    if (accion === "filtro") {
      this._sfiltro.PrmFiltro = {
        Titulo: "Datos de filtro para MDP",
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

  onValueChangedFecha(e:any, campo:string) {
    if (campo === 'Inicio') this.FMDP.FECHA_INICIO = e.value;
    else if (campo === 'Final') this.FMDP.FECHA_FINAL = e.value;
    if (this.mnuAccion.match('new|update')) this.conCambios++;
  }

  selectionTipoMdp(e:any) {
    if (e.value !== undefined && e.value !== null && e.value !== '') {
      this.FMDP.TIPO_MDP = e.value;
      this.FMDP.TIPO_TR = '';
      this.DGMateriales = [];
      this.DGMaterialesConsolidado = [];
      if (e.value === 'PROGRAMADO')
        this.valoresObjetos('agenda', '');
    }
    if (this.mnuAccion.match('new|update')) this.conCambios++;
  }

  selectionTipoTr(e:any) {
    if (e.value !== undefined && e.value !== null && e.value !== '') {
      this.FMDP.TIPO_TR = e.value;
      if (e.value === 'PROGRAMADA')
        this.valoresObjetos('agenda', '');
    }
    if (this.mnuAccion.match('new|update')) this.conCambios++;
  }

  onCellPrepared(e:any, treeList:string) {
    if (e.rowType === "data" && e.cellElement.querySelector(".dx-select-checkbox")) {
      const check = e.cellElement.querySelectorAll(".dx-select-checkbox");
      check.forEach((ele: any, ixfila: any) => {
        const inst = dxCheckBox.getInstance(ele);
        if (treeList === 'PRODUCTOS') {
          if (e.data.PRODUCTO === 'RAIZ')
            inst.option("visible", true);
          else
            inst.option("visible", false);
        } else if (treeList === 'SECCIONES') {
          if (e.data.TIPO.match('Planta|PROCESO'))
            inst.option("visible", true);
          else 
            inst.option("visible", false);
        }

      });
    }
  }

  onRowPrepared(e:any) {
		if (e.rowType === "data") {
			if (e.data) {
				if (e.data.TIPO === 'Planta') {
					e.rowElement.style.fontWeight = '700';
				}
			}
    }
	}
  onValueChangedPlanta(e:any) {
    if( this.mnuAccion.match('new|update') && (e.value === undefined || e.value === null || e.value.length === 0) ) {
      this.openIdPlantas = false;
      // this.FCapacidad.PLANTAS = [];
      this.conCambios++;
    }
  }
  // onSelectionChangedPlanta(e:any) {
  //   if(this.mnuAccion.match('new|update')) {
  //     // this.FCapacidad.PLANTAS = this.selectPlantas;
  //     this.selectPlantas = e.value;
  //     this.conCambios++;
  //   }
  // }

  aceptarBottom(e:any, btn:any) {
    this.openIdPlantas = false;
    this.FMDP.TIPO_MDP = 'PROGRAMADO';
    this.FMDP.TIPO_TR = '';
    this.DGMateriales = [];
    this.DGMaterialesConsolidado = [];
    this.valoresObjetos('agenda', '');
  }

  onSelectionChangedProducto(e:any) {
    if (e.selectedRowsData.length > 0) {
      this.DGMateriales = [];
      this.DGMaterialesConsolidado = [];

      for (let i = 0; i < e.selectedRowsData.length; i++) {
        const element = e.selectedRowsData[i];
        if (element.PRODUCTO === 'RAIZ') {
          var dMateriales:any = [];
          dMateriales = this.DProgramacion.filter((a:any) => a.PRODUCTO === element.ID_PARTE )
          dMateriales.forEach((ele:any) => {
            for (let i = 0; i < ele.MATERIALES.length; i++) {
              const material:any = ele.MATERIALES[i];
              var ite:any = {};
              ite = element.MATERIALES.reduce((ant:any, act:any)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
              ite = ite.ITEM + 1;
              element.MATERIALES.push({...material, ITEM: ite});
            }
          });
        }

        element.MATERIALES.forEach((ma:any) => {
          var npos:number = -1;
          
          //Detallado
          npos =  this.DGMateriales.findIndex((d:any) => d.MATERIAL === ma.MATERIAL && 
                                                        // d.ID_PARTE === (ma.PRODUCTO === 'RAIZ' ? ma.ID_PARTE : ma.PRODUCTO) &&
                                                        d.PRODUCTO === (ma.PRODUCTO === 'RAIZ' ? ma.ID_PARTE : ma.PRODUCTO) 
          );
          if (npos > -1) {
            // this.DGMateriales[npos].CANTIDAD_REAL = this.DGMateriales[npos].CANTIDAD_REAL + (element.CANTIDAD_REQ * ma.CANTIDAD_MA);
            this.DGMateriales[npos].CANTIDAD_REAL = this.DGMateriales[npos].CANTIDAD_REAL + ma.CANTIDAD_MA;
            this.DGMateriales[npos].CANTIDAD_REQ = this.DGMateriales[npos].CANTIDAD_REQ + ma.CANTIDAD_REQ;
          } else {
            var item:any = {};
            if (this.DGMateriales.length > 0) {
              item = this.DGMateriales.reduce((ant:any, act:any)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
              item = item.ITEM + 1; 
            } else {
              item = 1;
            }
            this.DGMateriales.push({
              ...ma,
              ITEM: item,
              ORDEN_PRO: element.ORDEN_PRO,
              PRODUCTO: ma.PRODUCTO === 'RAIZ' ? ma.ID_PARTE : ma.PRODUCTO,
              NOMBRE_PRODUCTO: ma.PRODUCTO === 'RAIZ' ? ma.NOMBRE_PARTE : ma.NOMBRE_PRODUCTO,
              CANTIDAD_REQ: ma.CANTIDAD_REQ,
              // CANTIDAD_REAL: (element.CANTIDAD_REQ * ma.CANTIDAD_MA) 
              CANTIDAD_REAL: ma.CANTIDAD_MA 
            });
          }

          //Consolidado
          npos =  this.DGMaterialesConsolidado.findIndex((d:any) => d.MATERIAL === ma.MATERIAL);
          if (npos > -1) {
            // this.DGMaterialesConsolidado[npos].CANTIDAD_REAL = this.DGMaterialesConsolidado[npos].CANTIDAD_REAL + (element.CANTIDAD_REQ * ma.CANTIDAD_MA);
            this.DGMaterialesConsolidado[npos].CANTIDAD_REAL = this.DGMaterialesConsolidado[npos].CANTIDAD_REAL + ma.CANTIDAD_MA;
            this.DGMaterialesConsolidado[npos].CANTIDAD_REQ = this.DGMaterialesConsolidado[npos].CANTIDAD_REQ + ma.CANTIDAD_REQ;
          } else {
            var item:any = {};
            if (this.DGMaterialesConsolidado.length > 0) {
              item = this.DGMaterialesConsolidado.reduce((ant:any, act:any)=>{return (ant.ITEM > act.ITEM) ? ant : act}) 
              item = item.ITEM + 1;
            } else {
              item = 1;
            }
            this.DGMaterialesConsolidado.push({
              ...ma,
              ITEM: item,
              ORDEN_PRO: element.ORDEN_PRO,
              PRODUCTO: ma.PRODUCTO === 'RAIZ' ? ma.ID_PARTE : ma.PRODUCTO,
              NOMBRE_PRODUCTO: ma.PRODUCTO === 'RAIZ' ? ma.NOMBRE_PARTE : ma.NOMBRE_PRODUCTO,
              CANTIDAD_REQ: ma.CANTIDAD_REQ,
              // CANTIDAD_REAL: (element.CANTIDAD_REQ * ma.CANTIDAD_MA) 
              CANTIDAD_REAL: ma.CANTIDAD_MA 
            });
          }
        });

      }
    } else {
      this.DGMateriales = [];
      this.DGMaterialesConsolidado = [];
    }
    if (this.mnuAccion.match('new|update')) this.conCambios++;
  }

  templateHtml(columna:any, element:any, component:string) {
    let cad = [{ PRODUCTO: '', NOMBRE_PRODUCTO: '', ID_PARTE:'', NOMBRE_PARTE: ''}];
    let res:any='';
    this.templateGroup.forEach((col:any) => {
      if (component === 'DataGred') {
        if (columna.row.data.items !== null) {
          cad[0].PRODUCTO = columna.row.data.items[0].PRODUCTO;
          cad[0].NOMBRE_PRODUCTO = columna.row.data.items[0].NOMBRE_PRODUCTO;
          cad[0].ID_PARTE = columna.row.data.items[0].ID_PARTE;
          cad[0].NOMBRE_PARTE = columna.row.data.items[0].NOMBRE_PARTE;
          switch (element) {
            case 'PRODUCTO':
              res = cad[0].PRODUCTO;
              break;
            case 'NOMBRE_PRODUCTO':
              res = cad[0].NOMBRE_PRODUCTO;
              break;
            case 'ID_PARTE':
              res = cad[0].PRODUCTO;
              break;
            case 'NOMBRE_PARTE':
              res = cad[0].NOMBRE_PARTE;
              break;
            default:
              break;
          }
        }
        if (columna.row.data.collapsedItems !== undefined) {
          cad[0].PRODUCTO = columna.row.data.collapsedItems[0].PRODUCTO;
          cad[0].NOMBRE_PRODUCTO = columna.row.data.collapsedItems[0].NOMBRE_PRODUCTO;
          cad[0].ID_PARTE = columna.row.data.collapsedItems[0].ID_PARTE;
          cad[0].NOMBRE_PARTE = columna.row.data.collapsedItems[0].NOMBRE_PARTE;
          switch (element) {
            case 'PRODUCTO':
              res = cad[0].PRODUCTO;
              break;
            case 'NOMBRE_PRODUCTO':
              res = cad[0].NOMBRE_PRODUCTO;
              break;
            case 'ID_PARTE':
              res = cad[0].ID_PARTE;
              break;
            case 'NOMBRE_PARTE':
              res = cad[0].NOMBRE_PARTE;
              break;
            default:
              break;
          }
        }

      } else if (component === 'TreeList') {
        var nomProd:any = '';
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
      }


    });
    return res;
  }

  onValueChangedModeView(e:any) {
    if (e.value === "Consolidado") this.ActiveConsolidado = true;
    else if (e.value === "Detallado") this.ActiveConsolidado = false;

    //this.gridListaProductos.instance.refresh();
  }

  onValueChangedCantidadReq(e:any, cellInfo:any) {
    if (e.value > cellInfo.data.CANTIDAD_REAL)
      showToast('La Cantidad Requerida no debe ser mayor a la Cantidad Real.', 'warning');
    else {
      var npos:number = -1;
      npos =  this.DGMaterialesConsolidado.findIndex((d:any) => d.MATERIAL === cellInfo.data.MATERIAL);
      if (npos > -1) {
        this.DGMaterialesConsolidado[npos].CANTIDAD_REQ = this.DGMaterialesConsolidado[npos].CANTIDAD_REQ - (cellInfo.data.CANTIDAD_REAL - e.value);
      }
    }
  }

  onContentReady(e: any) {
    e.component.columnOption('command:edit', 'visible', false);
  }

  onCellDblClick(e:any) {
    if (this.FMDP.TIPO_MDP === 'PROGRAMADO') 
      showToast('No puede modificar los registros ya programados.', 'warning');
    if (this.FMDP.TIPO_MDP === 'MANUAL' && this.FMDP.TIPO_TR === 'PROGRAMADA') 
      showToast('Para modificar debe activar el modo de vista Detallado.', 'warning');
  }

  addColumn() {
    const dataSoruce:any = this.DProgramacion;
		this.DGdetalles = [];
		let columns:any = [];
    var newArray:any = [];
    if (this.columnVisibles.length === 0)
      this.columnVisibles = this.treeListProgramacion.instance.getVisibleColumns();
    for (let i = 0; i < dataSoruce.length; i++) {
      var element = dataSoruce[i];
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
      newArray.push(element);
    };
		
    this.DGdetalles = newArray;
    //ordenar alfabéticamente
    let newColumns = columns.sort((a:any, b:any) => {
      return a.dataField.localeCompare(b.dataField);
    });
    newColumns.forEach((col:any) => {
      const columnVisibles:any [] = this.treeListProgramacion.instance.getVisibleColumns();
      const indexColumn:any = columnVisibles.findIndex((d:any) => d.dataField === col.dataField);
      if (indexColumn === -1)
        this.treeListProgramacion.instance.addColumn(col);
    });

    if(this.loadingVisible) this.loadingVisible = false;

	}
  
  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string, datos:any) {
    if (obj === 'secciones' || obj === 'todos') {
      const prm = {USUARIO: this.USUARIO_LOCAL };
      this.loadingVisible = true;
      this.sData.consulta('SECCIONES', prm, 'PRO-031').subscribe((data: any)=> {
        const res = validatorRes(data);
        if(res[0].ErrMensaje !== '') {
          this.loadingVisible = false;
          showToast(res[0].ErrMensaje, 'error');
        } else {
          this.DSecciones = res;
        }
      });
    };
    if (obj === 'arbol secciones' || obj === 'todos') {
      // Carga las secciones registradas
      this.sData.consulta('qsecciones', { FILTRO: "" }, 'PRO-028').subscribe((data) => {
        const res = validatorRes(data);
        if (res[0].ErrMensaje !== '') {
          this.showModal(res[0].ErrMensaje, 'Error');
          return;
        }
        for (let i = 0; i < res.length; i++) {
          res[i].COD = i;
        }
        this.DSecciones = [];
        const newArray:any = JSON.parse(JSON.stringify(res));
        this.DPlantas = newArray.filter((d:any) => d.TIPO !== 'OPERATIVA');
      },
        (err => {
          this.showModal(err.message, 'Error');
        })
      );
    };
    if (obj === 'agenda' || obj === 'todos') {
      this.loadingVisible = true;
      if (this.DSecciones.length > 0) {
        const prmData:any = this.DSecciones.map((d:any) => d.ID_SECCION);
        this.sData.consulta('PROGRAMADO SECCIONES', {SECCIONES: prmData}, 'PRO-032').subscribe((data: any)=> {
          const res = validatorRes(data);
          if(res[0].ErrMensaje !== '') {
            showToast(res[0].ErrMensaje, 'error');
            this.DProgramacion = [];
          } else {
            for (let i = 0; i < res.length; i++) {
              const element = res[i];
              element.MATERIALES.forEach((ele:any) => {
                if (this.FMDP.TIPO_MDP === 'PROGRAMADO')
                  ele.CANTIDAD_REQ = ele.CANTIDAD_MA
              });
            }
            this.DProgramacion = res;
            this.addColumn();
          }
        });
      }
    };

  }

  // Imprimir reporte de aplicación
  imprimirReporte(id_reporte:any, archivo:any, datosrpt:any) {
    
    let filtroRep = {FILTRO: ''};
    const prmLiq = {  clid: localStorage.getItem('empresa'), 
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
    this.tabService.addTab( new Tab(VisorrepComponent,    // visor
                                    datosrpt.text,        // título
                                    { parent: "PrincipalComponent", args: prmLiq }, // parámetro: reporte,filtro
                                    id_reporte,           // código del reporte
                                    '',
                                    'reporte',
                                    true
                          ));

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
