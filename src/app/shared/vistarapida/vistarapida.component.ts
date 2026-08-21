import { DatePipe } from '@angular/common';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxPopupModule } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { GlobalVariables } from '../common/global-variables';
import { SvisorService } from './_svisor.service';

@Component({
    selector: 'app-vistarapida',
    templateUrl: './vistarapida.component.html',
    styleUrls: ['./vistarapida.component.scss'],
    imports: [DxPopupModule, DxDataGridModule, DxButtonModule]
})
export class VistarapidaComponent implements OnInit {

  @Input() aplicacion: any;
  // @ViewChild("Visordatos"+aplicacion, { static: false }) gridGravPT: DxDataGridComponent;

  popUpVisor: any;
  DVista: any;
  gridVisor: any;
  readonly allowedPageSizes: any[] = [5, 10, 20, 50, 100, 'all'];
  archExcelLiq: string = "";
  titVisor: string = "";
  Grupo: string[];
  Filtro: any;
  popupVisible = false;
  subscription: Subscription;
  initVisor: boolean = false;
  modeSelection: string;
  checkBoxesMode: string;
  colsconfig: any;
  keyGrid: any;
  dataSelect: any;

  // Alert de mensajes
  displayModal: boolean = false;
  errMsg: string = "";
  errTit: string = "";

  constructor(
    public datepipe: DatePipe,
    public SVisor: SvisorService)
  {
    this.popupVisible = false;
    this.subscription = this.SVisor.getObs_Visor().subscribe((datvisor) => {
      if (datvisor.accion === 'cerrar') return;
      if (this.SVisor.PrmVisor.aplicacion !== this.aplicacion) return;

      console.log(this.SVisor.PrmVisor.aplicacion);
      this.popupVisible = datvisor;
      this.DVista = this.SVisor.DatosVisor;
      this.titVisor = this.SVisor.PrmVisor.Titulo;
      this.Grupo = this.SVisor.PrmVisor.Grupo;
      this.Filtro = this.SVisor.PrmVisor.Filtro;
      this.keyGrid = this.SVisor.PrmVisor.keyGrid;
      this.colsconfig = this.SVisor.PrmVisor.cols;
      this.modeSelection = this.SVisor.PrmVisor.opciones.split('|')[0];
      this.checkBoxesMode = this.SVisor.PrmVisor.opciones.split('|')[1];
      this.cargarDatos(this.SVisor.PrmVisor.accion);
    });

    this.aceptarCambios = this.aceptarCambios.bind(this);
    this.customizeColumns = this.customizeColumns.bind(this);
    this.onInitializedPopUp = this.onInitializedPopUp.bind(this);
    this.onInitializedGrid = this.onInitializedGrid.bind(this);
    this.onSelectionChanged = this.onSelectionChanged.bind(this);

}

  // Personaliza columnas si hay especificación
  customizeColumns(columns: any) {
    if (this.colsconfig !== undefined && this.colsconfig != "") {
      // Primero ocultar todas las columnas
      columns.forEach((col: any) => {
        col.visible = false;
      });

      // Luego iterar sobre colsconfig para respetar el orden
      this.colsconfig.forEach((colcfg: any, index: number) => {
        const [dataField, caption] = colcfg.split('|');
        const column = columns.find((col: any) => col.dataField === dataField);

        if (column) {
          column.visible = true;
          column.caption = caption;
          column.visibleIndex = index; // Establece el orden
        }
      });
    }
  }

  onToolbarPreparing(e: any) {
    let toolbarItems = e.toolbarOptions.items;

    e.toolbarOptions.items.unshift(
      // {
      //     location: 'before',
      //     template: 'titVisordatos'
      // },
      {
        location: 'before',
        widget: 'dxButton',
        options: {
          icon: 'refresh',
          onClick: this.agrupar.bind(this)
        }
      }
    );
  }

  onResizeEnd(e: any) {
    //let popupHeight = Number(this.popUpVisor.instance.option("height"))?? 400;
    let popupHeight = Number(this.popUpVisor.option("height"))?? 400;
    this.gridVisor.option("height",popupHeight-100);
  }
  onSelectionChanged(e:any): void {
    if (e.data !== ''){
      this.dataSelect = e.data;
    }
  }
  // Seleccion de fila
  onSeleccRegistro(e: any): void {
    this.popupVisible = false;
    const prmRet = { ...e.data, accion: 'cerrar' };
    this.SVisor.setObs_Apl(prmRet);
  }
  onHidden(e:any) {
    this.popupVisible = false;
  }

  cargarDatos(accion: string) {
    // Si la accion es vacía, tome los datos enviados en DVista
    if (accion !== '') {
      this.SVisor.consulta(accion,this.Filtro,'generales').subscribe((data: any)=> {
        try {
          const res = JSON.parse(data.data);
          if ( (data.token != undefined) ){
            const refreshToken = data.token;
            localStorage.setItem("token", refreshToken);
          }
          this.DVista = res;
          this.gridVisor.instance.refresh();
        } catch (error) {
          this.displayModal = true;
          this.errMsg = "*** ERROR *** "+error+" >> "+data;
          this.errTit = "Error en "+accion;
          return;
        }
      });
    }
  }
  onContentReady(e: any) {
    var i = 0;
    this.Grupo.forEach((ele:any) => {
      e.component.columnOption(ele, "groupIndex", i);
      i++;
    })
    setTimeout(() => {
      this.onResizeEnd(undefined);
    }, 500);
  }
  agrupar(e: any) {
    var i = 0;
    this.Grupo.forEach((ele:any) => {
      this.gridVisor.instance.columnOption(ele, "groupIndex", i);
      i++;
    })
  }
  onShown(e: any) {
    /*var i = 0;
    this.Grupo.forEach((ele:any) => {
      this.gridVisor.instance.columnOption(ele, "groupIndex", i);
      i++;
    })*/
  }
  onInitializedPopUp(e: any) {
    /*var i = 0;
    this.Grupo.forEach((ele:any) => {
      this.gridVisor.instance.columnOption(ele, "groupIndex", i);
      i++;
    })*/
    this.popUpVisor = e.component;
  }
  onInitializedGrid(e: any) {
    this.gridVisor = e.component;
  }

  aceptarCambios(e: any) {
    // Valida que esté todo completo
    // var rowsel = this.gridVisor.instance.getSelectedRowsData();
    // if (rowsel.length === 0) {
    //   this.displayModal = true;
    //   this.errMsg = "No se ha seleccionado ningún producto!";
    //   this.errTit = "No hay selección";
    //   return;
    // }
    // this.SVisor.setObs_Apl(rowsel);
    // this.popupVisible = false;
    // this.subscription.unsubscribe();
    if (this.dataSelect !== ''){
      this.popupVisible = false;
      const prmRet = { ...this.dataSelect, accion: 'cerrar' };
      this.SVisor.setObs_Apl(prmRet);
    }
  }

  cancelarCambios(e: any) {
    this.popupVisible = false;
  }

  ngOnInit(): void {
  }
  ngAfterViewInit() {
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
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
