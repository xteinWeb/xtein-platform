import { Component, OnInit, ViewChild } from '@angular/core';
import {
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDropDownBoxComponent,
  DxDropDownBoxModule,
  DxFormModule,
  DxLoadPanelModule,
  DxPopupModule,
  DxSelectBoxComponent,
  DxSelectBoxModule,
  DxTagBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxToolbarModule,
  DxTreeListModule,
} from 'devextreme-angular';
import { DatePipe } from '@angular/common';
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { interval, take, lastValueFrom, Subscription, Subject } from 'rxjs';
import { INV209Service } from 'src/app/services/INV209/s_INV209.service';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { TabService } from 'src/app/containers/tabs/tab.service';
import Swal from 'sweetalert2';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { showToast } from '../../shared/toast/toastComponent.js';
import { GeninformesComponent } from 'src/app/shared/geninformes/geninformes.component';
import { VistarapidaComponent } from 'src/app/shared/vistarapida/vistarapida.component';

@Component({
    selector: 'app-INV209',
    templateUrl: './INV209.component.html',
    styleUrls: ['./INV209.component.scss'],
    standalone: true,
    imports: [
    DxFormModule,
    DxDataGridModule,
    DxDropDownBoxModule,
    DxPopupModule,
    DxTextBoxModule,
    DxTextAreaModule,
    DxLoadPanelModule,
    DxSelectBoxModule,
    DxButtonModule,
    GeninformesComponent,
    VistarapidaComponent,
    DxToolbarModule,
]
})
export class INV209Component {
  @ViewChild('dLBodegas', { static: false }) ddBodegas: DxSelectBoxComponent;
  @ViewChild('dLUMPro', { static: false }) ddUMPro: DxSelectBoxComponent;
  @ViewChild('GItems', { static: false }) gridItems: DxDataGridComponent;
  @ViewChild('ddGravamenes', { static: false }) ddGrav: DxDropDownBoxComponent;
  @ViewChild('ddBoxProveedor', { static: false })
  ddProveedor: DxDropDownBoxComponent;
  @ViewChild('gkardex', { static: false })
  gkardex: DxDataGridComponent;

  subscription: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  subs_filtro: Subscription;
  subs_visor: Subscription;

  templateGroup: any = ['ID_UN_BODEGA', 'PRODUCTO'];
  FKardex: any;
  IdAplicacion: string;
  colCountByScreen: object;
  DBodegas: any;
  DProductos: any;
  DKardex: any = [];
  GValorBod: any[] = [];
  GValorPro: any[] = [];
  dropDownOptions = { width: 700, height: 400 };
  isGridBoxOpenedBod: boolean;
  isGridBoxOpenedPro: boolean;
  readonly allowedPageSizes: any[] = [5, 10, 20, 50, 100, 'all'];
  popupVisible: boolean = false;
  aceptaCambios: any;
  cancelaCambios: any;
  titMovimiento: string;
  asoOrigenDestino: string;
  asoNombre: string;
  asoDetalle: string;
  filtroMaestro: boolean = false;
  USUARIO_LOCAL: any = '';
  EMPRESA: any = '';
  NOMBRE_USUARIO_LOCAL: any = '';
  SALDO_PRODUCTO: Number;
  data_prev: any = '';
  VDatosReg: any;
  VDatosReg2: any;
  QFiltro: any;

  eventsSubjectFiltro: Subject<any> = new Subject<any>();
  eventsSubjectInformes: Subject<any> = new Subject<any>();

  // Nombre de archivo de exportación
  archExcel: string = '';
  readOnly: boolean;
  mnuAccion: string;
  loadingVisible: boolean = false;
  columnChooserModes: any[] = [
    {
      key: 'dragAndDrop',
      name: 'Drag and drop',
    },
    {
      key: 'select',
      name: 'Select',
    },
  ];
  editorOptions = { placeholder: 'Search column' };
  allowSelectAll = true;
  selectByClick = true;
  recursive = true;
  constructor(
    private _sdatos: INV209Service,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private datepipe: DatePipe,
    private SVisor: SvisorService,
    private tabService: TabService
  ) {
    this.colCountByScreen = {
      xs: 3,
      sm: 2,
      md: 3,
      lg: 3,
    };

    this.aceptaCambios = {
      icon: 'check',
      text: 'Aceptar',
      onClick: this.actualizar.bind(this),
    };
    this.cancelaCambios = {
      text: 'Cancelar',
      onClick: this.actualizar.bind(this),
    };

    // Servicio de barra de registro
    this.subscription = this._sbarreg.getObsRegApl().subscribe((datreg) => {
      // Valida si la petición es para esta aplicacion
      // this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opMenuRegistro(datreg);
    });

    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe((resp) => {
      // Ejecuta búsqueda -> Valida si la petición es para esta aplicacion
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    });

    this.subs_visor = this.SVisor.getObs_Apl().subscribe((resp) => {
      // Ubica el registro
      if (this.SVisor.PrmVisor.aplicacion !== this.prmUsrAplBarReg.aplicacion)
        return;
      if (resp.accion === 'abrir') return;
      const nx = this.VDatosReg.findIndex(
        (d) => d.ITM_KARDEX === resp.ITM_KARDEX
      );
      if (nx !== -1) {
        this.prmUsrAplBarReg.r_numReg = nx + 1;
        this.opIrARegistro('r_numreg');
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subs_filtro.unsubscribe();
    this.subs_visor.unsubscribe();
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {
    // Activa modo de operacion para los demás componentes

    switch (operMenu.accion) {
      case 'r_ini':
        this.prmUsrAplBarReg = {
          tabla: 'KARDEX_PRODUCTOS',
          aplicacion: 'INV-209',
          aplicacionBase: '',
          usuario: this.USUARIO_LOCAL,
          accion: 'r_ini',
          error: '',
          r_numReg: 0,
          r_totReg: 0,
          operacion: {
            r_modificar: false,
            r_nuevo: false,
            r_copiar: false,
            r_eliminar: false,
          },
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_buscar':
        // this._sdatos.accion = 'consultar';
        if (
          GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion
        )
          return;
        if (this._sfiltro.enConsulta === false) {
          this.opPrepararBuscar('filtro');
        } else {
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_primero':
      case 'r_anterior':
      case 'r_siguiente':
      case 'r_ultimo':
      case 'r_numreg':
        this.opIrARegistro(operMenu.accion);
        break;

      case 'r_cancelar':
      case '':
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          accion: 'r_ini',
          operacion: {
            r_modificar: false,
            r_nuevo: false,
            r_copiar: false,
            r_eliminar: false,
          },
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.filtroMaestro = false;
        this.mnuAccion = '';
        break;

      case 'r_vista':
        this.opVista();
        break;

      case 'r_imprimir':

        var prmRep = {
          ...operMenu.operacion,
          accion: 'previsualizar',
          aplicacion: this.prmUsrAplBarReg.aplicacion,
          tabla: this.prmUsrAplBarReg.tabla,
          usuario: this.prmUsrAplBarReg.usuario,
          idrpt: 'RptExistenciasXCbodegas',
          parametros: {},
          clid: this.EMPRESA,
           QFiltro:
            (operMenu.operacion.registro === 'todos'
              ? this.QFiltro
              : " KARDEX_PRODUCTOS.ID_UN_BODEGA = '" +
                this.DKardex[0].ID_UN_BODEGA +
                "' AND KARDEX_PRODUCTOS.PRODUCTO = '" +
                this.DKardex[0].PRODUCTO +
                "'")  +
                (new Date(this.FKardex.FECHA_HISTORICO).getFullYear() != 1900
                    ? " [FECHA_HISTORICO:" + this.datepipe.transform(this.FKardex.FECHA_HISTORICO, 'MM/dd/yyyy') + "]"
                    : ''),
        };
        if (operMenu.operacion.modo === 'previsualizar')
          console.log(prmRep);
          this.eventsSubjectInformes.next(prmRep);

        if (operMenu.operacion.modo === 'pdf') {
          prmRep = { ...prmRep, accion: 'pdf' };
          this.eventsSubjectInformes.next(prmRep);
        }
        break;

      case 'r_refrescar':
        this.valoresObjetos('todos');
        break;

      default:
        break;
    }
  }

  opPrepararBuscar(accion): void {
    if (accion === 'filtro') {
      this.filtroMaestro = true;
      this.prmUsrAplBarReg = {
        ...this.prmUsrAplBarReg,
        tabla: 'RS_KARDEX_FILTRO',
        operacion: {
          r_modificar: false,
          r_nuevo: false,
          r_copiar: false,
          r_cancelar: false,
          r_eliminar: false,
        },
      };
      this._sfiltro.PrmFiltro = {
        Titulo: 'Datos de filtro para Kardex',
        accion: 'PREPARAR FILTRO',
        Filtro: '',
        TablaBase: 'RS_KARDEX_FILTRO',
        aplicacion: this.prmUsrAplBarReg.aplicacion,
      };
      this._sfiltro.getObsFiltro.emit(true);
      this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      this.opBlanquearForma();
    } else {
      // Ejecuta búsqueda

      this._sfiltro.enConsulta = true;
      // Extrae la estructura del filtro
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { RS_KARDEX_FILTRO: arrFiltro };
      // Ejecuta búsqueda API
      this.loadingVisible = true;
      this._sdatos
        .consulta('consulta', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe((data: any) => {
          try {
            this.loadingVisible = false;
            const res = JSON.parse(data.data);
            this._sfiltro.enConsulta = false;
            if (data.token != undefined) {
              const refreshToken = data.token;
              localStorage.setItem('token', refreshToken);
            }
            const datares = res;
            if (datares[0].ErrMensaje === '') {
              // Asocia datos
              if (datares ?? '' != '') {
                // cabecera
                this.VDatosReg = datares;
                this.data_prev = datares[0];
                this.QFiltro = datares[0].QFILTRO;

                // Prepara la barra para navegación
                this.prmUsrAplBarReg = {
                  ...this.prmUsrAplBarReg,
                  r_totReg: datares.length,
                  r_numReg: 1,
                  accion: 'r_navegar',
                  operacion: {
                    r_modificar: false,
                    r_nuevo: false,
                    r_copiar: false,
                    r_eliminar: false,
                    r_cancelar: false
                  },
                };
                this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
                // Trae los items en los componentes asociados
                this.opIrARegistro('r_primero');
                this.readOnly = true;
              }
            } else {
              this.VDatosReg = [];
              //notificación

              showToast(datares[0].ErrMensaje, 'warning');
              this.prmUsrAplBarReg.accion = 'r_cancelar';
              this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
              //this.opBlanquearFormDM();
            }
          } catch (error) {
            this.loadingVisible = false;
            this.readOnly = true;
            this._sfiltro.enConsulta = false;
            console.log(error);

            this.showModal(error, 'Error');
          }
        });

      this.filtroMaestro = false;
    }
  }

  onGridBoxOptionChangedBod(e: any) {
    if (e.value == undefined) return;
    if (e.name === 'value') {
      if (e.value.length != 0) {
        if (e.value[0]) {
          this.FKardex.ID_UN_BODEGA = e.value[0];

          // Filtra kardex
          let filtro: any =
            this.FKardex.ID_UN_BODEGA !== ''
              ? { ID_UN_BODEGA: this.FKardex.ID_UN_BODEGA }
              : {};
          filtro =
            this.FKardex.PRODUCTO !== ''
              ? { ...filtro, PRODUCTO: this.FKardex.PRODUCTO }
              : filtro;
          filtro =
            this.FKardex.NITEMS !== ''
              ? { ...filtro, NITEMS: this.FKardex.NITEMS }
              : filtro;
          // this.valoresObjetos('kardex', filtro);
        }
      }
      this.isGridBoxOpenedBod = false;
    }
  }
  onGridBoxOptionChangedPro(e: any) {
    if (e.value == undefined) return;
    if (e.name === 'value') {
      if (e.value.length != 0) {
        if (e.value[0]) {
          this.FKardex.PRODUCTO = e.value[0];
          const dnom = this.DProductos.find(
            (p) => p.PRODUCTO === e.value[0]
          ).NOMBRE;
          this.FKardex.NOMBRE = dnom;

          // Filtra kardex
          let filtro: any =
            this.FKardex.ID_UN_BODEGA !== ''
              ? { ID_UN_BODEGA: this.FKardex.ID_UN_BODEGA }
              : {};
          filtro =
            this.FKardex.PRODUCTO !== ''
              ? { ...filtro, PRODUCTO: this.FKardex.PRODUCTO }
              : filtro;
          filtro =
            this.FKardex.NITEMS !== ''
              ? { ...filtro, NITEMS: this.FKardex.NITEMS }
              : filtro;
          // this.valoresObjetos('kardex', filtro);
        }
      }
      this.isGridBoxOpenedPro = false;
    }
  }
  onValueChangedPro(e: any) {
    // if (e.value === null) {
    //   this.FKardex.PRODUCTO = "";
    //   // Filtra kardex
    //   let filtro: any = this.FKardex.ID_UN_BODEGA !== "" ? { ID_UN_BODEGA : this.FKardex.ID_UN_BODEGA } : {};
    //   filtro = this.FKardex.PRODUCTO !== "" ? {...filtro,  PRODUCTO: this.FKardex.PRODUCTO } : filtro;
    //   filtro = this.FKardex.NITEMS !== "" ? {...filtro,  NITEMS: this.FKardex.NITEMS } : filtro;
    //   // this.valoresObjetos('kardex', filtro);
    // }
  }
  onValueChangedBod(e: any) {
    // if (e.value === null) {
    //   this.FKardex.ID_UN_BODEGA = "";
    //   // Filtra kardex
    //   let filtro: any = this.FKardex.ID_UN_BODEGA !== "" ? { ID_UN_BODEGA : this.FKardex.ID_UN_BODEGA } : {};
    //   filtro = this.FKardex.PRODUCTO !== "" ? {...filtro,  PRODUCTO: this.FKardex.PRODUCTO } : filtro;
    //   filtro = this.FKardex.NITEMS !== "" ? {...filtro,  NITEMS: this.FKardex.NITEMS } : filtro;
    //   // this.valoresObjetos('kardex', filtro);
    // }
  }
  onSeleccNItems(e: any) {
    if (e.value === null) {
      this.FKardex.NITEMS = '';
    }
    if (e.value) {
      this.FKardex.NITEMS = e.value;
    }
    // Filtra kardex
    // let filtro: any = this.FKardex.ID_UN_BODEGA !== "" ? { ID_UN_BODEGA : this.FKardex.ID_UN_BODEGA } : {};
    // filtro = this.FKardex.PRODUCTO !== "" ? {...filtro,  PRODUCTO: this.FKardex.PRODUCTO } : filtro;
    // filtro = this.FKardex.NITEMS !== "" ? {...filtro,  NITEMS: this.FKardex.NITEMS } : filtro;
    // this.valoresObjetos('kardex', filtro);
  }

  async IrAMovimiento(cellInfo) {
    // Trae el movimiento asociado
    // if (cellInfo == undefined) return;
    // this.titMovimiento =
    //   'Movimiento: ' +
    //   cellInfo.data.ID_SOPORTE +
    //   ' - ' +
    //   cellInfo.data.NC_SOPORTE;
    // this.asoOrigenDestino = cellInfo.data.ORIGEN_DESTINO;
    // const apiRest = this._sdatos.consulta(
    //   'DATOS MOVIMIENTO',
    //   {
    //     ID_DOCUMENTO: cellInfo.data.ID_SOPORTE,
    //     CONSECUTIVO: cellInfo.data.NC_SOPORTE,
    //   },
    //   this.prmUsrAplBarReg.aplicacion
    // );
    // let detMov = await lastValueFrom(apiRest, { defaultValue: true });
    // const newDetMov = JSON.parse(JSON.stringify(detMov));
    // this.asoNombre = newDetMov[0].NOMBRE_ORG_DES;
    // this.asoDetalle = newDetMov[0].DETALLE;
    // this.popupVisible = true;
  }

  /*** Operaciones con la barra  ***/
  opBarra(oper: string) {
    switch (oper) {
      case 'informes':
        break;

      default:
        break;
    }
  }

  // Asociar valor de UM
  popup_showing(e: any) {}
  // Actualizar datos de conversión de la unidad de medida
  actualizar(e: any) {
    this.popupVisible = false;
  }

  onRowPrepared(e) {
    e.rowElement.style.height = '30px';
  }

  verFiltroMaestro(e) {
    this.filtroMaestro = !this.filtroMaestro;
  }

  templateHtml(columna: any, element: any): any {
    let cad = [{ ID_UN_BODEGA: '', PRODUCTO: '' }];
    let res: any = '';
    this.templateGroup.forEach((col: any) => {
      if (
        columna.row.data.items !== null &&
        columna.row.data.items !== undefined &&
        columna.row.data.items.length > 0
      ) {
        switch (element) {
          case 'ID_UN_BODEGA':
            if (columna.row.data.items[0].items !== null) {
              res =
                columna.row.data.items[0].items[0].ID_UN_BODEGA +
                '-' +
                columna.row.data.items[0].items[0].NOMBRE_BOD;
            }
            break;

          case 'PRODUCTO':
            res =
              columna.row.data.items[0].PRODUCTO +
              '-' +
              columna.row.data.items[0].NOMBRE;
            break;
          default:
            break;
        }
      }
      if (
        columna.row.data.collapsedItems !== undefined &&
        columna.row.data.collapsedItems.length > 0 &&
        columna.row.data.collapsedItems !== null
      ) {
        switch (element) {
          case 'ID_UN_BODEGA':
            if (columna.row.data.collapsedItems !== null) {
              res =
                columna.row.data.collapsedItems[0].items[0].ID_UN_BODEGA +
                '-' +
                columna.row.data.collapsedItems[0].items[0].NOMBRE_BOD;
            }
            break;

          case 'PRODUCTO':
            res =
              columna.row.data.collapsedItems[0].PRODUCTO +
              '-' +
              columna.row.data.collapsedItems[0].NOMBRE;
            break;
          default:
            break;
        }
      }
    });
    return res;
  }

  onCellPrepared(e: any) {
    if (e.rowType === 'totalFooter') {
      if (e.summaryItems.length > 0 && e.summaryItems[0].value != 0) {
        // e.cellElement.querySelector(".dx-datagrid-summary-item").style.fontWeight = 'bold';
        // e.cellElement.querySelector(".dx-datagrid-summary-item").style.color = '#064e8d';
        // e.cellElement.querySelector(".dx-datagrid-summary-item").style.fontSize = '20px';
      }
    }
    if (e.rowType === 'data' && e.column.dataField == 'CANTIDAD_ENTRADA') {
      e.cellElement.style.backgroundColor = '#e7fcdd';
    }
    if (e.rowType === 'data' && e.column.dataField == 'CANTIDAD_SALIDA') {
      e.cellElement.style.backgroundColor = '#fde2df';
    }
    if (e.rowType === 'data' && e.column.dataField == 'CANTIDAD_SALDO') {
      e.cellElement.style.backgroundColor = '#dfebfd';
      e.cellElement.style.fontWeight = 'bold';
    }
    if (e.rowType === 'data' && e.column.dataField === 'VALOR_TOTAL') {
      e.cellElement.style.backgroundColor = '#90cd93';
      e.cellElement.style.fontWeight = 'bold';
    }
  }

  onExporting(e: any) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Nómina');

    exportDataGrid({
      component: e.component,
      worksheet: worksheet,
      autoFilterEnabled: true,
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: 'application/octet-stream' }),
          this.archExcel
        );
      });
    });
    e.cancel = true;
  }

  informes(id_informe: string, opcion: string = '') {
    // Prepara filtro
    let filtro: any =
      this.FKardex.ID_UN_BODEGA !== ''
        ? { ID_UN_BODEGA: this.FKardex.ID_UN_BODEGA }
        : {};
    filtro =
      this.FKardex.PRODUCTO !== ''
        ? { ...filtro, PRODUCTO: this.FKardex.PRODUCTO }
        : filtro;
    filtro =
      this.FKardex.FECHA_DESDE != ''
        ? {
            ...filtro,
            FECHA_DESDE: this.datepipe.transform(
              this.FKardex.FECHA_DESDE,
              'MM/dd/yyyy'
            ),
          }
        : filtro;
    filtro =
      this.FKardex.FECHA_HASTA != ''
        ? {
            ...filtro,
            FECHA_HASTA: this.datepipe.transform(
              this.FKardex.FECHA_HASTA,
              'MM/dd/yyyy'
            ),
          }
        : filtro;

    var drep;
    var prmLiq;
    switch (id_informe) {
      case 'Existencias':
        // drep = this.listaInformes.find((s: any) => s.label === id_informe)!;
        // prmLiq = {Datos: {clid: this.globals.clid, IdApl: this.IdAplicacion, IdRpt: drep.id, Doc: this.FKardex.DOCUMENTO, Filtro: JSON.stringify(filtro), Accion: drep.target, url_rpt: this.globals.url_rpt}};
        // console.log(prmLiq);
        // var prm_safe = encodeURIComponent(JSON.stringify(prmLiq));
        // window.open('/visorrep?prm_rpt='+prm_safe, '_blank');
        break;

      case 'Kardex':
        // drep = this.listaInformes.find((s: any) => s.label === id_informe)!;
        // prmLiq = {Datos: {clid: this.globals.clid, IdApl: this.IdAplicacion, IdRpt: drep.id, Doc: this.FKardex.DOCUMENTO, Filtro: JSON.stringify(filtro), Accion: drep.target, url_rpt: this.globals.url_rpt}};
        // var prm_safe = encodeURIComponent(JSON.stringify(prmLiq));
        // window.open('/visorrep?prm_rpt='+prm_safe, '_blank');
        break;

      default:
        break;
    }
  }

  opVista(): void {
    this.SVisor.DatosVisor = JSON.parse(JSON.stringify(this.VDatosReg));
    this.SVisor.PrmVisor = {
      aplicacion: this.prmUsrAplBarReg.aplicacion,
      Titulo: 'KARDEX PRODUCTOS',
      accion: '',
      opciones: '|',
      Grupo: [],
      cols: [],
      Filtro: '',
      keyGrid: ['ITM_KARDEX'],
    };
    this.SVisor.setObs_Visor({ accion: 'abrir' });
  }

  // 'ID_UN_BODEGA|BODEGA',
  // 'NOMBRE|NOMBRE',
  // 'VALOR_PROMEDIO|VALOR PROMEDIO',
  // 'NOMBRE_BOD|NOMBRE BODEGA',
  // 'PRODUCTO|PRODUCTO',

  valoresObjetos(obj: string, filtro: any = {}): any {
    if (obj == 'productos' || obj == 'todos') {
      const prm = { MODO: 'kardex' };
      this._sdatos
        .consulta('PRODUCTOS', prm, 'PRO022')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          this.DProductos = res;
        });
    }

    if (obj == 'bodegas' || obj == 'todos') {
      this._sdatos
        .consulta('BODEGAS', { ESTADO: 'ACTIVO' }, 'INV-002')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          this.DBodegas = res;
        });
    }

    if (obj == 'kardex') {
      const prm = {
        ID_UN_BODEGA: filtro.ID_UN_BODEGA,
        PRODUCTO: filtro.PRODUCTO,
        FECHA_DESDE: filtro.FECHA_DESDE,
        FECHA_HASTA: filtro.FECHA_HASTA,
        NITEMS: filtro.NITEMS,
        EXISTENCIAS: filtro.EXISTENCIAS,
      };
      this.loadingVisible = true;
      this._sdatos
        .consulta('KARDEX', prm, this.prmUsrAplBarReg.aplicacion)
        .subscribe({
          next: (data: any) => {
            this.loadingVisible = false;
            const res = JSON.parse(data.data);
            if (data.token != undefined) {
              const refreshToken = data.token;
              localStorage.setItem('token', refreshToken);
            }
            this.DKardex = res;

            this.VDatosReg = this.DKardex;
            this.QFiltro = prm;

            // Prepara la barra para navegación
            this.prmUsrAplBarReg = {
              ...this.prmUsrAplBarReg,
              r_totReg: res.length,
              r_numReg: 1,
              accion: 'r_navegar',
              operacion: {
                r_modificar: false,
                r_nuevo: false,
                r_eliminar: false,
                r_copiar: false,
                r_descargar: false,
                r_configurar: false,
                r_ordenar: false,
              },
            };
            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

            // Trae los items en los componentes asociados
            this.opIrARegistro('r_primero');
            this._sfiltro.enConsulta = false;
          },
          error: (e) => {
            this.showModal('Error mostrar kardex: ' + e.message);
          },
        });
    }

    if (obj == 'datos mov' || obj == 'todos') {
      // const prm = filtro;
      // this._sdatos.consulta('DATOS MOVIMIENTO',prm,this.prmUsrAplBarReg).subscribe((data: any)=> {
      //   const res = JSON.parse(data);
      //   return res;
      // });
    }
  }

  // Navegación de registro
  async opIrARegistro(accion: string) {
    let newArray: any = [];
    this.prmUsrAplBarReg.accion = 'r_numreg';
    switch (accion) {
      case 'r_primero':
        this.prmUsrAplBarReg.r_numReg = 1;
        if (this.VDatosReg.length != 0) {
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[0]));
          this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        }
        break;

      case 'r_anterior':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === 1
            ? 1
            : this.prmUsrAplBarReg.r_numReg - 1;
        newArray = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_siguiente':
        this.prmUsrAplBarReg.r_numReg =
          this.prmUsrAplBarReg.r_numReg === this.VDatosReg.length
            ? this.VDatosReg.length
            : this.prmUsrAplBarReg.r_numReg + 1;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        newArray = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        break;

      case 'r_ultimo':
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        newArray = JSON.parse(
          JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1])
        );
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      case 'r_numreg':
        if (this.prmUsrAplBarReg.r_numReg !== 0) {
          // Valida si hubo cambio de ordenamiento en el visor
          if (this.SVisor.ColSort.Columna !== '') {
            if (this.SVisor.ColSort.Clase === 'asc') {
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
          newArray = JSON.parse(JSON.stringify(this.VDatosReg[this.prmUsrAplBarReg.r_numReg - 1]));
        } else {
          this.opBlanquearForma();
          setTimeout(() => {
            newArray.instance.resetValues();
          }, 100);
        }
        break;

      default:
        break;
    }

    let newRes: any = [];
    this.FKardex = newArray;
    const prm = {
      ID_UN_BODEGA: this.FKardex.ID_UN_BODEGA,
      PRODUCTO: this.FKardex.PRODUCTO,
      FECHA_DESDE: this.FKardex.FECHA_DESDE,
      FECHA_HASTA: this.FKardex.FECHA_HASTA,
      NITEMS: this.FKardex.NITEMS,
      ITM_KARDEX: this.FKardex.ITM_KARDEX,
      FECHA_HISTORICO: this.FKardex.FECHA_HISTORICO,
    };

    const apiRest = this._sdatos.consulta(
      'KARDEX PRODUCTOS',
      prm,
      this.prmUsrAplBarReg.aplicacion
    );
    let res = await lastValueFrom(apiRest, { defaultValue: true });

    newRes = JSON.parse(res.data);

    if (newRes.token != undefined) {
      const refreshToken = newRes.token;
      localStorage.setItem('token', refreshToken);
    }

    this.DKardex = newRes;
    this.SALDO_PRODUCTO = this.DKardex[0].SALDO_EXISTENCIA;
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
  }

  opBlanquearForma(): void {
    this.FKardex = {
      ID_UN_BODEGA: '',
      PRODUCTO: '',
      NOMBRE: '',
      FECHA_DESDE: '',
      FECHA_HASTA: '',
      EXISTENCIAS: false,
      NITEMS: '100',
    };
    this.GValorBod = [];
    this.GValorPro = [];
    this.DKardex = [];
  }

  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario')?.toUpperCase();
    this.EMPRESA = localStorage.getItem('empresa')?.toUpperCase();
    this.NOMBRE_USUARIO_LOCAL = localStorage.getItem('user_name');
    this.FKardex = {
      ID_UN_BODEGA: '',
      PRODUCTO: '',
      FECHA_DESDE: '',
      FECHA_HASTA: '',
      NITEMS: '100',
      EXISTENCIAS: false,
    };
    const n_apli: any = this.tabService.tabs.findIndex(
      (c: any) => c.active === true
    );
    this.prmUsrAplBarReg = {
      tabla: 'KARDEX_PRODUCTOS',
      aplicacion: 'INV-209',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: {
        r_modificar: false,
        r_nuevo: false,
        r_copiar: false,
        r_eliminar: false,
      },
    };

    this.mnuAccion = '';
    this.readOnly = true;
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.valoresObjetos('todos');

    this.archExcel = 'Kardex.xlsx';
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      // this.valoresObjetos('kardex');
    }, 300);
  }

  showModal(mensaje, titulo = '', html = '') {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
      title: '¡Error!',
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
