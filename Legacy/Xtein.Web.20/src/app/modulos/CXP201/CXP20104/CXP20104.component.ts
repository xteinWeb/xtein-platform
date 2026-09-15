import { CommonModule, formatNumber } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxDataGridComponent, DxDataGridModule, DxPopupComponent, DxPopupModule, DxLoadPanelModule, DxTagBoxModule, DxButtonModule, DxTextBoxModule } from 'devextreme-angular';
import dxTextBox from 'devextreme/ui/text_box';
import { Observable, Subscription } from 'rxjs';
import { showToast } from '../../../shared/toast/toastComponent.js';
import Swal from 'sweetalert2';
import { CXP200Service } from '../../../services/CXP200/s_CXP200.service';
import { clsPreEgresos } from '../clsCXP201.class';
import { S_CXP20104Service } from 'src/app/services/CXP20104/s_CXP20104.service';

@Component({
  selector: 'app-CXP20104',
  templateUrl: './CXP20104.component.html',
  styleUrls: ['./CXP20104.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxPopupModule, DxLoadPanelModule, DxTagBoxModule, DxButtonModule, DxTextBoxModule]
})
export class CXP20104Component {
  @ViewChild("popGenElec", { static: false }) popGenElec: DxPopupComponent;
  @ViewChild("gridGenElec", { static: false }) gridGenElec: DxDataGridComponent;
  

  visiblePopup: boolean = false;
  configBotonAceptar: any;
  configBotonCancelar: any;
  configSeleccFacturas: any;
  DPreEgresos: clsPreEgresos[] = [];
  DEgresos: clsPreEgresos = new clsPreEgresos();
  DDocumentos: any[] = [];
  DBancos: any[] = [];
  popUpLog: any;
  gridLog: any;
  valSelFac: string;
  valorTotEgreso: number;
  textBoxTotSelecc: any;
  titEgresos: string;
  seleccPreEgresos: number[] = [];
  iniGrid: boolean = false;
  loadingVisible: boolean = false;
  
  // Variables para gestión de correos en modal
  visiblePopEmails: boolean = false;
  listaEmailsEdicion: string[] = [];
  rowActualEdicion: any;
  nuevoEmailModal: string = '';

  private eventsSubscription: Subscription;

  @Input() events: Observable<any>;

  @Input() visible: boolean;

  @Output() onRespuestaSelecc = new EventEmitter<any>;

  constructor(private _sdatos: CXP200Service, private webhookService: S_CXP20104Service) 
  { 

    this.configBotonAceptar = {
      icon: 'todo',
      text: 'Enviar correos',
      onClick: this.accionPopUp.bind(this, 'aceptar')
    };
    this.configBotonCancelar = {
      icon: 'close',
      text: 'Cancelar',
      onClick: this.accionPopUp.bind(this, 'cancelar')
    };
    this.configSeleccFacturas = {
      elementAttr: {
        id: "totalSelecc",
        class: "total-selecc"
      },
      readOnly: true,
      onInitialized: this.iniTotalSelecc.bind(this)
    };
  }

  iniTotalSelecc(e) {
    this.textBoxTotSelecc = e.component as dxTextBox;
  }

  accionPopUp(accion) {

    if (accion === 'aceptar') {
      const datosSeleccionados = this.gridGenElec.instance.getSelectedRowsData();
          console.log('Datos seleccionados para envío:', datosSeleccionados);
      // Validación previa
      var cMsg = '';
      if (this.valorTotEgreso <= 0) {
        cMsg += 'No hay pagos seleccionados de proveedores o el valor a pagar es cero!'
      }
      if (cMsg !== ''){
        this.showModal('','Faltan datos',cMsg);
        return;
      }

      Swal.fire({
        title: '',
        text: 'Desea enviar por correo estos egresos?',
        iconHtml: "<i class='icon-alert-ol'></i>",
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#438ef1',
        cancelButtonText: 'No',
        confirmButtonText: 'Sí, generar',
    }).then((result) => {
        if (result.isConfirmed) {
          // Obtener todos los datos completos de las filas seleccionadas
          const datosSeleccionados = this.gridGenElec.instance.getSelectedRowsData();
          console.log('Datos seleccionados para envío:', datosSeleccionados);
          
          // Agrupar los egresos por proveedor
          const datosAgrupados = this.agruparEgresosPorProveedor(datosSeleccionados);
          console.log('Datos agrupados para envío:', datosAgrupados);

          // Mostrar pantalla de carga
          Swal.fire({
            title: 'Enviando egresos...',
            text: 'Por favor espere mientras se procesan los datos',
            iconHtml: "<i class='icon-loader'></i>",
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showConfirmButton: false,
          });

          this.webhookService.sendData(datosAgrupados).subscribe({
            next: (res) => {
              console.log('¡Webhook enviado con éxito!', res);
              
              // Cerrar pantalla de carga y mostrar mensaje de éxito
              Swal.fire({
                title: 'Éxito',
                text: 'Egresos enviados correctamente',
                icon: 'success',
                confirmButtonColor: '#0F4C81',
                confirmButtonText: 'Aceptar'
              }).then(() => {
                // Cerrar todas las modales
                this.visiblePopup = false;
                this.onRespuestaSelecc.emit({ accion: 'cerrar' });
              });
            },

            error: (err) => {
              console.error('Error al enviar el webhook', err);
              
              // Cerrar pantalla de carga y mostrar mensaje de error
              Swal.fire({
                title: 'Error',
                text: 'Error al enviar los egresos. Por favor intente nuevamente.',
                icon: 'error',
                confirmButtonColor: '#DF3E3E',
                confirmButtonText: 'Aceptar'
              });
            }
          });
        }
      });
  
    }

    if (accion === 'cancelar') {
      this.visiblePopup = false;
    }

    return;

  }

  // Método para agrupar egresos por proveedor
  agruparEgresosPorProveedor(datosSeleccionados: any[]): any[] {
    const proveedoresMap = new Map();

    datosSeleccionados.forEach(egreso => {
      const idProveedor = egreso.ID_PROVEEDOR;
      
      if (!proveedoresMap.has(idProveedor)) {
        // Crear nuevo proveedor
        proveedoresMap.set(idProveedor, {
          PROVEDOR: idProveedor,
          NOMBRE_PROVEEDOR: egreso.NOMBRE_PROVEEDOR,
          EMAILS: egreso.EMAILS,
          BANCO: egreso.BANCO,
          EGRESOS: []
        });
      }
      
      // Agregar el egreso al proveedor correspondiente
      proveedoresMap.get(idProveedor).EGRESOS.push({
        EGRESO: egreso.EGRESO,
        FECHA: this.formatDate(egreso.FECHA),
        ID_PROVEEDOR: egreso.ID_PROVEEDOR,
        NOMBRE_PROVEEDOR: egreso.NOMBRE_PROVEEDOR,
        TOTAL: egreso.TOTAL,
        EMAILS: egreso.EMAILS,
        BANCO: egreso.BANCO,
        STATUS: egreso.STATUS,
        DETALLE_FACTURAS: egreso.DETALLE_FACTURAS || []
      });
    });

    // Convertir el Map a array
    return Array.from(proveedoresMap.values());
  }

  onShown(e: any) {
  }
  onHidden(e:any) {
    this.visiblePopup = false;
  }
  onInitializedPopUp(e: any) {
    this.popUpLog = e.component;
  }
  onInitializedGrid(e: any) {
    this.gridLog = e.component;
  }

  onResizeEnd(e: any) {
    //let popupHeight = Number(this.popUpVisor.instance.option("height"))?? 400;
    let popupHeight = Number(this.popUpLog.option("height"))?? 400;
    this.gridLog.option("height",popupHeight-100);
  }

  onSelectionFact(e) {
    if (!this.gridGenElec) return;
    
    // Verificar si alguna fila seleccionada no tiene correos
    const filasInvalidas = e.selectedRowsData.filter(fac => 
      !fac.EMAILS || fac.EMAILS.trim() === '' || fac.EMAILS.toLowerCase().includes('sin email')
    );
    
    if (filasInvalidas.length > 0) {
      // Mostrar modal de error por cada proveedor sin correos
      const nombreProveedores = filasInvalidas.map(f => f.NOMBRE_PROVEEDOR).join(', ');
      this.showModal(
        '', 
        'Proveedores sin correo', 
        `Los siguientes proveedores no tienen correo electrónico asociado:<br><br><b>${nombreProveedores}</b><br><br>No es posible enviar notificaciones.`
      );
      
      // Deseleccionar las filas que no tienen correos
      const clavesValidas = e.selectedRowsData
        .filter(fac => fac.EMAILS && fac.EMAILS.trim() !== '')
        .map(fac => fac.EGRESO);
      
      // Actualizar la selección solo con las filas válidas
      setTimeout(() => {
        this.gridGenElec.instance.selectRows(clavesValidas, false);
      }, 100);
      
      this.seleccPreEgresos = clavesValidas;
      
      // Recalcular solo con las filas válidas
      const datosValidos = e.selectedRowsData.filter(fac => 
        fac.EMAILS && fac.EMAILS.trim() !== ''
      );
      
      var valSelecc: number = 0;
      datosValidos.forEach(fac => {
        let valor = 0;
        if (fac.TOTAL !== null && fac.TOTAL !== undefined && fac.TOTAL !== '') {
          valor = parseFloat(fac.TOTAL.toString().replace(/,/g, ''));
          if (isNaN(valor)) {
            valor = 0;
          }
        }
        valSelecc += valor;
      });
      
      this.valorTotEgreso = valSelecc;
      this.valSelFac = formatNumber(valSelecc, 'en-US', '1.2-2');
      
      if (this.textBoxTotSelecc) {
        this.textBoxTotSelecc.option('value', this.valSelFac);
      }
      
      return;
    }
    
    // Procesar normalmente si todas las filas tienen correos
    this.seleccPreEgresos = e.selectedRowKeys;
    
    var valSelecc: number = 0;
    e.selectedRowsData.forEach(fac => {
      // Validar que TOTAL existe y es un número válido
      let valor = 0;
      if (fac.TOTAL !== null && fac.TOTAL !== undefined && fac.TOTAL !== '') {
        valor = parseFloat(fac.TOTAL.toString().replace(/,/g, ''));
        if (isNaN(valor)) {
          valor = 0;
        }
      }
      valSelecc += valor;
      console.log(`Fila: ${fac.EGRESO}, TOTAL: ${fac.TOTAL}, Valor parseado: ${valor}`);
    });
    
    this.valorTotEgreso = valSelecc;
    this.valSelFac = formatNumber(valSelecc, 'en-US', '1.2-2');
    
    // Verificar que textBoxTotSelecc esté inicializado
    if (this.textBoxTotSelecc) {
      this.textBoxTotSelecc.option('value', this.valSelFac);
    } else {
      console.warn('textBoxTotSelecc no está inicializado');
    }
    
    // Debug info
    console.log('Total calculado:', valSelecc);
    console.log('Total formateado:', this.valSelFac);
    console.log('Datos seleccionados:', e.selectedRowsData);
    console.log('Claves seleccionadas:', e.selectedRowKeys);

  }

  onEditingStart(e) {
    // No permitir editar si no está seleccionada
    const seleccRows = e.component.getSelectedRowKeys();
    if (seleccRows.indexOf(e.key) === -1) {
      e.cancel = true;
      // this.gridDatos.instance.cancelEditData();
    }
  }

  // Si hubo cambios, señalar
  onCellPrepared(e: any) {
    if(e.rowType === "data" && e.column.dataField === "TOTAL" ) {
      const rowSel = this.gridGenElec.instance.getSelectedRowKeys();
      if ( rowSel.indexOf(e.data.EGRESO) !== -1 ) {
        e.cellElement.style.background = "#ffe1d5" 
      }
    }
  }

  formatDate(dateStr: any): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr.toString();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  getParsedEmails(emailsStr: string): string[] {
    if (!emailsStr) return [];
    // Soportar tanto coma como punto y coma para la lectura inicial, pero preferir punto y coma
    // También filtrar cadenas como "sin email"
    return emailsStr.split(/[,;]/)
      .map(e => e.trim())
      .filter(e => e !== '' && e.toLowerCase() !== 'sin email');
  }

  abrirModalEmails(rowData: any) {
    this.rowActualEdicion = rowData;
    this.listaEmailsEdicion = this.getParsedEmails(rowData.EMAILS);
    this.nuevoEmailModal = '';
    this.visiblePopEmails = true;
  }

  agregarEmailModal() {
    if (!this.nuevoEmailModal || this.nuevoEmailModal.trim() === '') {
      showToast('Escriba un correo válido', 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailAAgregar = this.nuevoEmailModal.trim();

    if (!emailRegex.test(emailAAgregar)) {
      showToast('El formato del correo no es válido', 'error');
      return;
    }

    if (this.listaEmailsEdicion.includes(emailAAgregar)) {
      showToast('Este correo ya está en la lista', 'warning');
      return;
    }

    // Llamada para guardar en BD como solicitó el usuario
    const prmDatos = {
        DOCUMENTO: this.rowActualEdicion.ID_PROVEEDOR,
        EMAIL: emailAAgregar
    };

    this._sdatos.save('NUEVO EMAIL', prmDatos, 'CXP-201').subscribe({
      next: (resp) => {
        showToast('Correo guardado correctamente', 'success');
      },
      error: (err) => {
        console.error('Error al guardar el nuevo email:', err);
        showToast('Error al guardar el correo en la base de datos', 'error');
      }
    });

    this.listaEmailsEdicion.push(emailAAgregar);
    this.nuevoEmailModal = '';
  }

  quitarEmailModal(index: number) {
    this.listaEmailsEdicion.splice(index, 1);
  }

  guardarEmailsModal() {
    if (this.rowActualEdicion) {
      this.rowActualEdicion.EMAILS = this.listaEmailsEdicion.join('; ');
    }
    this.visiblePopEmails = false;
  }


  templateHtml(columna): string {
    let cad = "";
    const col = "BANCO";
    if (columna.row.data.items !== null) {
      if (columna.row.data.items.length !== 0)
        cad = cad + (cad !== "" ? " " : "") + columna.row.data.items[0][col];
    }
    if (columna.row.data.collapsedItems !== undefined) {
      if (columna.row.data.collapsedItems.length !== 0)
        cad = cad + (cad !== "" ? " " : "") + columna.row.data.collapsedItems[0][col];
    }
    return cad;
  }

    // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined){
    
    if (obj == 'envio egresos' || obj == 'todos') {
      this.loadingVisible = true;
      const prm = { ID_APLICACION : 'CXP-201', USUARIO: localStorage.getItem('usuario')};
      this._sdatos
        .consulta('envio egresos', prm, 'CXP-201')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DPreEgresos = res;
          this.seleccPreEgresos = [];
          this.loadingVisible = false;
        }, (err) => {
          this.loadingVisible = false;
          console.error('Error al cargar egresos:', err);
        });
    }

  }  

  ngOnInit(): void { 

    this.eventsSubscription = this.events.subscribe((datos: any) => {
      if (datos.accion == 'activar') {
        this.visiblePopup = true;
        this.titEgresos = "Egresos para pago electrónico";
        this.valoresObjetos('todos');

        // Inicialización de datos
        this.valorTotEgreso = 0;

      }
    });
  }

  ngOnDestroy(){
    this.eventsSubscription.unsubscribe();
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

// [
//   {
//     "headers": {
//       "host": "agentes.colchonessunmoon.com",
//       "x-real-ip": "192.168.11.99",
//       "x-forwarded-for": "192.168.11.99",
//       "x-forwarded-proto": "https",
//       "connection": "Upgrade",
//       "content-length": "858",
//       "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0",
//       "accept": "application/json, text/plain, */*",
//       "accept-language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
//       "accept-encoding": "gzip, deflate, br, zstd",
//       "content-type": "application/json",
//       "origin": "http://localhost:4200",
//       "referer": "http://localhost:4200/",
//       "sec-fetch-dest": "empty",
//       "sec-fetch-mode": "cors",
//       "sec-fetch-site": "cross-site",
//       "priority": "u=0"
//     },
//     "params": {},
//     "query": {},
//     "body": [
//       {
//         "PROVEDOR": "901444399",
//         "NOMBRE_PROVEEDOR": "HIGH DECO DESING S.A.S",
//         "EGRESOS": [
//           {
//             "EGRESO": "EB-344",
//             "FECHA": "Jan 30 202",
//             "ID_PROVEEDOR": "901444399",
//             "NOMBRE_PROVEEDOR": "HIGH DECO DESING S.A.S",
//             "TOTAL": "3454646.00",
//             "EMAILS": "jj131204@gmail.com",
//             "STATUS": "Egreso",
//             "DETALLE_FACTURAS": [
//               {
//                 "ID_FACTURA": "X",
//                 "NC_FACTURA": "1111",
//                 "VALOR_PAGADO": 3454646
//               }
//             ]
//           },
//           {
//             "EGRESO": "EB-346",
//             "FECHA": "Jan 30 202",
//             "ID_PROVEEDOR": "901444399",
//             "NOMBRE_PROVEEDOR": "HIGH DECO DESING S.A.S",
//             "TOTAL": "5427560.82",
//             "EMAILS": "jj131204@gmail.com",
//             "STATUS": "Egreso",
//             "DETALLE_FACTURAS": [
//               {
//                 "ID_FACTURA": "FM",
//                 "NC_FACTURA": "103",
//                 "VALOR_PAGADO": 1452164.49
//               },
//               {
//                 "ID_FACTURA": "FM",
//                 "NC_FACTURA": "219",
//                 "VALOR_PAGADO": 3975396.33
//               }
//             ]
//           }
//         ]
//       },
//       {
//         "PROVVEDOR": "890907841",
//         "NOMBRE_PROVEEDOR": "ALMACEN RODAMIENTOS S.A",
//         "EGRESOS": [
//           {
//             "EGRESO": "EB-348",
//             "FECHA": "Jan 31 202",
//             "ID_PROVEEDOR": "890907841",
//             "NOMBRE_PROVEEDOR": "ALMACEN RODAMIENTOS S.A",
//             "TOTAL": "11.90",
//             "EMAILS": "jj131204@gmail.com",
//             "STATUS": "Egreso",
//             "DETALLE_FACTURAS": [
//               {
//                 "ID_FACTURA": "BQFE",
//                 "NC_FACTURA": "32228",
//                 "VALOR_PAGADO": 11.9
//               }
//             ]
//           }
//         ]
//       },
      
//     ],

//   }
// ]