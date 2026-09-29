import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild, OnInit } from '@angular/core';
import { 
  DxDataGridModule, 
  DxDataGridComponent,
  DxTooltipModule,
  DxLoadPanelModule,
  DxSelectBoxModule 
} from 'devextreme-angular';
import { COM207Service } from '../../services/COM207/com207.service';

@Component({
  selector: 'app-com207',
  templateUrl: './com207.component.html',
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

  DGdatos: any[] = [];
  
  tooltipInfo: any[] = [{}];
  targetIdTooltip: string = '';
  wrapperAttr: any = { class: 'tooltip-wrapper' };
  
  loadingVisible: boolean = false;

  currentPageSize: number = 10;
  currentPage: number = 1;
  totalRegistros: number = 0;

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

    this.opMenuRegistro({ accion: 'r_ini' });
  }

  cargarDatos() {
    this.loadingVisible = true;
    
    // Determinar el PAGE_SIZE a enviar
    let pageSizeToSend = this.currentPageSize;
    if (this.currentPageSize === 0 && this.totalRegistros > 0) {
      pageSizeToSend = this.totalRegistros; // Usar el total de registros para "Todos"
    } else if (this.currentPageSize === 0) {
      pageSizeToSend = 1000; // Valor por defecto si aún no tenemos el total
    }
    
    const prm = {
      ID_APLICACION: 'COM207', 
      USUARIO: this.USUARIO_LOCAL, 
      PAGE: this.currentPage, 
      PAGE_SIZE: pageSizeToSend
    }; 
    
    console.log('Parámetros de consulta:', prm);
    
    this._sdatos.consulta('consulta', prm, 'COM207')
      .subscribe({
        next: (data: any) => {
          this.loadingVisible = false;
          
          try {
            let res;
            if (typeof data.data === 'string') {
              res = JSON.parse(data.data);
            } else {
              res = data.data;
            }
            
            console.log('Datos recibidos:', res);
            this.DGdatos = Array.isArray(res) ? res : [];
            
            // Extraer y almacenar el total de registros
            if (res.length > 0 && res[0].TotalFilas) {
              this.totalRegistros = res[0].TotalFilas;
              console.log('Total de registros disponibles:', this.totalRegistros);
            }
          } catch (error) {
            console.error('Error al procesar respuesta:', error);
            this.DGdatos = [];
            alert('Error al procesar la respuesta del servicio');
          }
        },
        error: (error) => {
          this.loadingVisible = false;
          console.error('Error en la consulta:', error);
          alert('Error de conexión con el servicio: ' + error.message);
        }
      });
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
        this.cargarDatos();
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

  onPagerOptionChanged(e: any): void {
    console.log('Evento completo:', e);
    console.log('Nombre del evento:', e.name);
    console.log('Valor:', e.value);
    console.log('Full path:', e.fullName);
    
    // Capturar cambios en el tamaño de página
    if (e.name === 'paging.pageSize' || e.fullName === 'paging.pageSize') {
      // Manejar la opción "Todos"
      if (e.value === 'all') {
        this.currentPageSize = 0; // 0 indica "todos"
        this.currentPage = 1;
        console.log('Seleccionado: Todos los registros. Total disponible:', this.totalRegistros);
      } else {
        this.currentPageSize = e.value;
        this.currentPage = 1;
        console.log('Nuevo tamaño de página:', this.currentPageSize);
      }
      this.cargarDatos();

    // Capturar cambios en el índice de página  
    } else if (e.name === 'paging.pageIndex' || e.fullName === 'paging.pageIndex') {
      this.currentPage = e.value + 1;
      console.log('Nueva página:', this.currentPage);
      this.cargarDatos();
    }
  }

  onEstadoChanged(e: any, rowData: any): void {
    console.log('Estado cambiado:', e.value, 'para factura:', rowData.FACTURA);
    rowData.ESTADO = e.value;
  }
}