import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { DxDateBoxModule, DxPopupComponent, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { lastValueFrom, Observable, Subscription } from 'rxjs';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxFileUploaderModule } from 'devextreme-angular/ui/file-uploader';
import { DxLoadPanelModule } from 'devextreme-angular/ui/load-panel';
import * as XLSX from 'xlsx';
import { DxPopupModule } from 'devextreme-angular';
import { CommonModule, DatePipe } from '@angular/common';
import { VEN155Service } from 'src/app/services/VEN155/VEN155.service';
import { showToast } from '../../../shared/toast/toastComponent.js'
import Swal from 'sweetalert2';

interface ClienteRow {
  IdCliente: string | number;
  Nombre: string;
  Valor: number;
}

@Component({
  selector: 'app-FIN20203',
  templateUrl: './FIN20203.component.html',
  styleUrls: ['./FIN20203.component.scss'],
  standalone: true,
  imports: [DxFileUploaderModule, DxDataGridModule, DxButtonModule, DxLoadPanelModule,
            DxPopupModule, CommonModule, DxSelectBoxModule, DxTextBoxModule,
            DxDateBoxModule
  ]
})
export class FIN20203Component {

  @ViewChild('gridPrerecaudos', { static: false }) gridPrerecaudos!: DxDataGridComponent;
  @ViewChild('popUpPrerecaudos', { static: false }) popUpPrerecaudos!: DxPopupComponent;


  DPrerecaudos: ClienteRow[] = [];
  totalPrerecaudo: number = 0;
  fileName = '';
  errorMessage = '';
  isLoading = false;
  popupVisible: boolean = false;
  DBancos: any[] = [];
  DPagaduria: any[] = [];
  bancoRecaudo = '';
  fechaRecaudo: Date | string | number = new Date();
  detalleRecaudo = '';
  idPagaduria = '';

  dropDownOptionsBancos = { width: 400,
                            hideOnParentScroll: true};

  @Input() events: Observable<any>;
  @Output() onRespuestaPreRecaudo = new EventEmitter<any>();
  private eventsSubscription: Subscription;

  constructor(
    private _sdatos: VEN155Service,
    private datePipe: DatePipe
  )
    {
      this.calculateCustomSummary = this.calculateCustomSummary.bind(this);
    }

      /**
   * Se dispara cuando el dx-file-uploader recibe un archivo.
   */
  onFileSelected(e: any): void {
    this.errorMessage = '';
    const file: File = e?.value?.[0];

    if (!file) {
      return;
    }

    const validExtensions = ['.xlsx', '.xls'];
    const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isValid) {
      this.errorMessage = 'El archivo debe ser .xlsx o .xls';
      return;
    }

    this.fileName = file.name;
    this.isLoading = true;

    const reader = new FileReader();

    reader.onload = (event: any) => {
      try {
        const bstr = new Uint8Array(event.target.result);
        const workbook = XLSX.read(bstr, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];

        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: null });

        this.DPrerecaudos = this.mapAndValidateRows(rawJson);
      } catch (err) {
        console.error(err);
        this.errorMessage = 'No se pudo leer el archivo. Verifique el formato.';
        this.DPrerecaudos = [];
      } finally {
        this.isLoading = false;

        // Trae informacion de la factura de cartera
        this._sdatos.consulta('datos cartera prerecaudo', this.DPrerecaudos, 'FIN202')
          .subscribe({
            next: (res: any) => {
              const datRecaudo = JSON.parse(res.data);
              if (datRecaudo[0].ErrMensaje === '') {
                this.DPrerecaudos = datRecaudo;
                this.totalPrerecaudo = datRecaudo[0].TotalPrerecaudo;
              } else {
                showToast(datRecaudo[0].ErrMensaje, 'warning');
              }
                this.resizeGrid();
            },
            error: (err) => {
              showToast(err.message, 'warning');
            }
          });

        setTimeout(() => {
          e.component.reset();
        }, 200);

        }
    };

    reader.onerror = () => {
      this.errorMessage = 'Ocurrió un error al leer el archivo.';
      this.isLoading = false;
    };

    reader.readAsArrayBuffer(file);
  }

  /**
   * Mapea las filas del Excel a la estructura esperada,
   * validando que existan las columnas requeridas.
   */
  private mapAndValidateRows(rawRows: any[]): ClienteRow[] {
    if (!rawRows.length) {
      this.errorMessage = 'El archivo no contiene datos.';
      return [];
    }

    const requiredColumns = ['IdCliente', 'Nombre', 'Valor'];
    const firstRowKeys = Object.keys(rawRows[0]);
    const missing = requiredColumns.filter(col => !firstRowKeys.includes(col));

    if (missing.length) {
      this.errorMessage = `Faltan columnas requeridas: ${missing.join(', ')}`;
      return [];
    }

    return rawRows
      .filter(row => row.IdCliente !== null && row.IdCliente !== undefined)
      .map(row => ({
        IdCliente: row.IdCliente,
        Nombre: row.Nombre ?? '',
        Valor: this.parseNumber(row.Valor)
      }));
  }

  private parseNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    const parsed = parseFloat(String(value).replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }

  clearGrid(): void {
    this.DPrerecaudos = [];
    this.fileName = '';
    this.errorMessage = '';
  }

  ngOnInit() {
    this.eventsSubscription = this.events.subscribe((data: any) => {
      this.popupVisible = true;
      this.DPrerecaudos = [];
      this.bancoRecaudo = '';
      this.detalleRecaudo = '';
      this.totalPrerecaudo = 0;
    });

    // Carga lista de Bancos y cuentas
    const prm = { ID_APLICACION : 'FIN-202', USUARIO: localStorage.getItem('usuario')};
    this._sdatos
      .consulta('BANCOS', prm, 'FIN-202')
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DBancos = res;
      });

    // Carga lista de Pagadurías
    const prmPagaduria = { ID_APLICACION : 'FIN-202', USUARIO: localStorage.getItem('usuario')};
    this._sdatos
      .consulta('PAGADURIAS', prmPagaduria, 'FIN-202')
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.DPagaduria = res;
      });

  }

  // ─── Aceptar ──────────────────────────────────────────────────────
  aceptarRecaudo(): void {

    const seleccionadas = this.DPrerecaudos.filter(f =>
      f.Valor > 0
    );

    if (this.bancoRecaudo === '' || this.bancoRecaudo === null) {
      showToast('No se ha seleccionado ningún medio de pago.', 'error', 2000);
      return;
    }

    // Genera recaudos
    const prm = {
      ID_APLICACION : 'FIN-202',
      USUARIO: localStorage.getItem('usuario'),
      BANCO: this.bancoRecaudo,
      ID_PAGADURIA: this.idPagaduria,
      FECHA_RECAUDO: this.datePipe.transform(this.fechaRecaudo, 'yyyy-MM-dd'), // Formato YYYY-MM-DD
      PRERECAUDOS: this.DPrerecaudos
    };
    this._sdatos.consulta('guardar prerecaudo', prm, 'FIN202')
      .subscribe({
        next: (res: any) => {
          const resp = JSON.parse(res.data);
          if (resp[0].ErrMensaje.includes('Exito:')) {
            this.popupVisible = false;
            this.showModal('','',resp[0].ErrMensaje);
          } else {
            showToast(resp[0].ErrMensaje, 'error');
          }
            this.resizeGrid();
        },
        error: (err) => {
          showToast(err.message, 'error');
        }
      });


  }

  // ─── Cancelar ─────────────────────────────────────────────────────
  cancelarRecaudo(): void {
    this.popupVisible = false;
  }

  onResizeEnd(e: any) {
    setTimeout(() => {
      if (this.gridPrerecaudos) {
        this.resizeGrid();
      }
    }, 200);
  }

  resizeGrid() {
    // Redimensiona la grilla para que ocupe el espacio disponible en el popup
    const popupHeightOption = this.popUpPrerecaudos.instance.option("height");
    let popupHeightInPixels = 0;
    if (typeof popupHeightOption === 'string') {
      if (popupHeightOption.includes('vh')) {
        // Extraer el número (80) y calcularlo en base al alto de la ventana
        const vhValue = parseFloat(popupHeightOption);
        popupHeightInPixels = (window.innerHeight * vhValue) / 100;
      } else if (popupHeightOption.includes('px')) {
        popupHeightInPixels = parseFloat(popupHeightOption);
      }
    } else if (typeof popupHeightOption === 'number') {
      popupHeightInPixels = popupHeightOption;
    }
    const botonesHeight = 230;
    const gridHeight = popupHeightInPixels - botonesHeight;
    this.gridPrerecaudos.instance.option("height", gridHeight);
    this.gridPrerecaudos.instance.repaint();
  }

  // Método para asignar la clase CSS dinámica
  obtenerClaseBadge(status: string): string {
    switch (status) {
      case 'activa':
        return 'badge-activa';
      case 'Sin cartera':
        return 'badge-inactiva';
      case 'Sin saldo':
        return 'badge-sin-saldo';
      default:
        return 'badge-default';
    }
  }

  calculateCustomSummary(options: any): void {
    if (options.name === 'totalPrerecaudo' && options.summaryProcess === 'finalize') {
      options.totalValue = this.totalPrerecaudo;
    }
  }

  onSeleccBanco(e) {
    this.bancoRecaudo = e.value;
  }

  onSeleccPagaduria(e) {
    this.idPagaduria = e.value;
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
