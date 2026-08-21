import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxListComponent, DxListModule, DxPopupModule, DxToolbarModule } from 'devextreme-angular';
import { Observable, Subject, Subscription } from 'rxjs';

@Component({
    selector: 'DB00101',
    templateUrl: './DB00101.component.html',
    styleUrls: ['./DB00101.component.css'],
    imports: [DxPopupModule, DxButtonModule, DxListModule, DxToolbarModule]
})
export class DB00101Component {

  @ViewChild("listaOpciones", { static: false }) listaOpciones: DxListComponent;

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
    // this.listaOpciones = e.component;
  }
  onSelectionChanged(e) {
    if (!this.indInicio) {
      this.indInicio = true;
      this.visiblePopup = false;
      this.onRespuestaSelecc.emit(e);
    }
  }
  onItemDeleting (e) {
    const itemData = e.itemData;
    const itemDomNode = e.itemElement;
    const itemIndex = e.itemIndex;
    // Handler of the "itemDeleting" event
  }
  onItemDeleted (e) {
      const itemData = e.itemData;
      const itemDomNode = e.itemElement;
      const itemIndex = e.itemIndex;
      // Handler of the "itemDeleted" event
  }

  accionPopUp(accion) {

    this.visiblePopup = false;
    if (accion === 'cancelar') return;

    // Prepara datos seleccionados
    var selectedItems = this.listaOpciones.instance.option("selectedItems");

    // envia respuesta
    this.onRespuestaSelecc.emit(selectedItems);

  }

  ngOnInit(): void {
    this.indInicio = true;
    var that = this;
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      that.listaValores = datos.dataSource;
      that.visiblePopup = datos.visible;

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
