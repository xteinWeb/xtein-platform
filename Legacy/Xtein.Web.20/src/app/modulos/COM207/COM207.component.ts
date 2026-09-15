import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild, OnInit } from '@angular/core';
import { 
  DxDataGridModule, 
  DxDataGridComponent,
  DxTooltipModule,
  DxLoadPanelModule,
  DxSelectBoxModule 
} from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { COM207Service } from '../../services/COM207/com207.service';

@Component({
  selector: 'app-COM207',
  templateUrl: './COM207.component.html',
  styleUrls: ['./COM207.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    DxDataGridModule,
    DxSelectBoxModule,
  ]
})
export class COM207Component implements OnInit {

  @ViewChild('gridCOM207', { static: false }) gridCOM207!: DxDataGridComponent;

  DGdatos: any;
  
  tooltipInfo: any[] = [{}];
  targetIdTooltip: string = '';
  wrapperAttr: any = { class: 'tooltip-wrapper' };
  
  loadingVisible: boolean = false;

  estadoOpciones = [
    { id: 'PENDIENTE_RECIBO', texto: 'Pendiente de recibo' },
    { id: 'PENDIENTE_INGRESO', texto: 'Pendiente ingreso registrado pendiente nc gasto' },
    { id: 'PENDIENTE_ACEPTAR', texto: 'Pendiente aceptar' },
    { id: 'PENDIENTE', texto: 'Pendiente' }
  ];

  prmUsrAplBarReg: any;
  VDatosReg: any[] = [];
  keyFila: any;
  readOnly: boolean = true;
  QFiltro: string = '';
  
  FFacturas: any = {};
  DFacturas: any = {};
  
  USUARIO_LOCAL: string = '';
  EMPRESA: string = '';
  NOMBRE_USUARIO_LOCAL: string = '';

  constructor(
    private _sdatos: COM207Service,
    private datepipe: DatePipe
  ) { }

  ngOnInit(): void {
    
    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase() || '';
    this.EMPRESA = localStorage.getItem('empresa')?.toUpperCase() || '';
    this.NOMBRE_USUARIO_LOCAL = localStorage.getItem("user_name") || '';
    
    this.FFacturas = {
      ID_FACTURA: '',
      PROVEEDOR: '',
      FACTURA: '',
      FECHA: this.datepipe.transform(new Date, 'MM/dd/yyyy'),
      PRECIO: 0,
      ARCHIVO: '',
      ESTADO: 'PENDIENTE'
    };

    this.initializeDataSource();
    this.opMenuRegistro({ accion: 'r_ini' });
  }

  initializeDataSource() {
    this.DGdatos = new CustomStore({
      key: 'FACTURA',
      load: (loadOptions: any) => {
        return new Promise((resolve, reject) => {
          console.log('CustomStore load options:', loadOptions);
          
          // Calcular página y tamaño de página
          const skip = loadOptions.skip || 0;
          const take = loadOptions.take || 10;
          const page = Math.floor(skip / take) + 1;
          
          const prm = {
            ID_APLICACION: 'COM207',
            USUARIO: this.USUARIO_LOCAL,
            PAGE: page,
            PAGE_SIZE: take
          };
          
          console.log('Parámetros de consulta:', prm);
          
          this._sdatos.consulta('consulta', prm, 'COM207')
            .subscribe({
              next: (data: any) => {
                try {
                  let res;
                  if (typeof data.data === 'string') {
                    res = JSON.parse(data.data);
                  } else {
                    res = data.data;
                  }
                  
                  console.log('Datos recibidos:', res);
                  
                  const items = Array.isArray(res) ? res : [];
                  let totalCount = 0;
                  
                  // Extraer totalCount de manera más robusta
                  if (items.length > 0) {
                    // Buscar TotalFilas en el primer elemento que lo tenga
                    const firstItem = items.find(item => item.TotalFilas !== undefined);
                    if (firstItem && firstItem.TotalFilas) {
                      totalCount = parseInt(firstItem.TotalFilas, 10);
                    } else {
                      totalCount = items.length;
                    }
                  }
                  
                  console.log('Total de registros disponibles (totalCount):', totalCount);
                  console.log('Items en esta página:', items.length);
                  
                  resolve({
                    data: items,
                    totalCount: totalCount
                  });
                } catch (error) {
                  console.error('Error al procesar respuesta:', error);
                  reject(error);
                }
              },
              error: (error) => {
                console.error('Error en la consulta:', error);
                reject(error);
              }
            });
        });
      }
    });
  }

  cargarDatos() {
    // Refrescar el data source
    if (this.gridCOM207?.instance) {
      this.gridCOM207.instance.refresh();
    }
  }

  opMenuRegistro(operMenu: any): void {
    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          tabla: "FACTURAS",
          aplicacion: "COM-207",
          aplicacionBase: '',
          usuario: this.USUARIO_LOCAL,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: {}
        };
        // El CustomStore se encarga de cargar los datos automáticamente
        break;

      case 'r_modificar':
        this.opPrepararModificar();
        break;

      default:
        break;
    }
  }

  opPrepararModificar(): void {
    this.readOnly = false;
    console.log('Modo edición activado para factura:', this.FFacturas);
  }

  // El CustomStore maneja automáticamente los cambios de paginación

  onGridContentReady(e: any): void {
    const gridInstance = e.component;
    const totalCount = gridInstance.totalCount();
    const pageCount = gridInstance.pageCount();
    const pageIndex = gridInstance.pageIndex();
    const pageSize = gridInstance.pageSize();
    
    console.log('=== Grid Content Ready ===');
    console.log('Total Count:', totalCount);
    console.log('Page Count:', pageCount);
    console.log('Current Page Index:', pageIndex);
    console.log('Page Size:', pageSize);
    console.log('========================');
  }

  onEstadoChanged(e: any, rowData: any): void {
    rowData.ESTADO = e.value;
  }

}
