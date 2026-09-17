import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxListComponent, DxListModule, DxPopupModule } from 'devextreme-angular';
import { Observable, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-COM20001',
  templateUrl: './COM20001.component.html',
  styleUrls: ['./COM20001.component.css'],
  standalone: true,
  imports: [ DxPopupModule, DxListModule ]
})
export class COM20001Component {

  @ViewChild("listaOpcionesGrav", { static: false }) listaOpcionesGrav: DxListComponent;

  visiblePopup: boolean = false;
  listaValores: any[] = [];
  ivaDefecto: any;
  seleccionIva: any[] = [];
  configBotonAceptar: any;
  configBotonCancelar: any;
  indInicio: boolean = true;

  private eventsSubscription: Subscription;
  eventsSubjectSbox: Subject<any> = new Subject<any>();
  popupVisible: boolean = false;
  popUpGrid: any;
  componentSbox: any;

  @Input() events: Observable<any>;

  @Input() visible: boolean;

  @Output() onRespuestaSelecc = new EventEmitter<any>;

  constructor() 
  { 
    this.configBotonAceptar = {
      icon: 'todo',
      text: 'Aceptar',
      onClick: this.accionPopUp.bind(this, 'aceptar')
    };
    this.configBotonCancelar = {
      icon: 'close',
      text: 'Cancelar',
      onClick: this.accionPopUp.bind(this, 'cancelar')
    };
  }

  onInitialized(e) {
    this.listaOpcionesGrav = e.component;
  }
  onSelectionChanged(e) {
    if (!this.indInicio) {
      this.indInicio = true;
      this.visiblePopup = false;
      this.onRespuestaSelecc.emit(e);
    }
  }
  onItemClick(e) {
    if (!this.indInicio) {
      this.indInicio = true;
      this.visiblePopup = false;
      this.onRespuestaSelecc.emit({ addedItems: [ e.itemData ]});
    }
  }

  accionPopUp(accion) {

    this.visiblePopup = false;
    if (accion === 'cancelar') return;

    // Prepara datos ordenados
    var listaPrm:any = [];
    for (var k=0; k < this.listaValores.length; k++) {
      listaPrm.push({ CODIGO: this.listaValores[k].CODIGO,
                      NOMBRE: this.listaValores[k].NOMBRE,
                      ORDEN: k+1
                   })
    }

    // envia respuesta
    this.onRespuestaSelecc.emit(listaPrm);

  }

  onInit(e: any) {  
    e.component.registerKeyHandler("escape", function (arg) {  
        arg.stopPropagation();  
    });  
  }  

  ngOnInit(): void { 
    this.indInicio = true;
    var that = this;
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      that.listaValores = datos.dataSource;
      that.visiblePopup = datos.visible;
      that.ivaDefecto = datos.iva;
      this.seleccionIva = this.ivaDefecto !== '' ? [this.ivaDefecto] : [];

      setTimeout(() => {
        this.indInicio = false;
      }, 1000);
    });
  }
  ngAfterViewInit() {
    //this.selectedKeys = ["Prepare 2016 Financial"];
    this.seleccionIva = this.ivaDefecto !== '' ? [this.ivaDefecto] : [];
  }
  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

}
