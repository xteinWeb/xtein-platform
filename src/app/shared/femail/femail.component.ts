
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DxCheckBoxModule, DxFormModule, DxPopupModule, DxScrollViewModule, DxTemplateModule, DxTextAreaModule, DxTextBoxModule } from 'devextreme-angular';
import { Observable, Subject, Subscription } from 'rxjs';

@Component({
    selector: 'app-femail',
    templateUrl: './femail.component.html',
    styleUrls: ['./femail.component.css'],
    imports: [DxFormModule, DxPopupModule, DxTextBoxModule, DxCheckBoxModule, DxTemplateModule, DxTextAreaModule, DxScrollViewModule]
})
export class FemailComponent {

  private eventsSubscription: Subscription;
  eventsSubjectSbox: Subject<any> = new Subject<any>();
  popupVisible: boolean = false;
  popUpVisor: any;
  DEnvioCorreo: any;
  emailsArray: any[] = [];

  isFormReadOnly = false

  submitButtonOptions = {
    text: "Enviar",
    useSubmitBehavior: true
  }

  @Input() events: Observable<any>;

  @Input() titEnvioCorreo: any;

  @Output() onRespuestaSelecc = new EventEmitter<any>;


  constructor() {
    this.onInitializedPopUp = this.onInitializedPopUp.bind(this);
  }

  onShown(e: any) {
  }
  onHidden(e: any) {
    this.popupVisible = false;
  }
  onInitializedPopUp(e: any) {
    this.popUpVisor = e.component;
  }

  handleSubmit(e) {
    if (this.onRespuestaSelecc) {
      // Consolidar correos desde el arreglo editable antes de emitir
      if (this.emailsArray.length > 0) {
        this.DEnvioCorreo.DESTINO_EMAIL = this.emailsArray
          .map(item => item.email)
          .filter(email => email && email.trim() !== '')
          .join(', ');
      }
      this.onRespuestaSelecc.emit(this.DEnvioCorreo);
    }
    this.popupVisible = false;
    e.preventDefault();
  }

  ngOnInit(): void {
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      console.log("datos modal", datos);
      if (datos !== 'cerrar') {
        if (datos.dataSource) {
          this.DEnvioCorreo = datos.dataSource;
          // Separar la cadena DESTINO_EMAIL en un arreglo para edición
          if (this.DEnvioCorreo.DESTINO_EMAIL) {
            this.emailsArray = this.DEnvioCorreo.DESTINO_EMAIL.split(',').map(e => ({ email: e.trim() }));
          } else {
            this.emailsArray = [];
          }
        }
        if (datos.visible)
          this.popupVisible = datos.visible
        setTimeout(() => {
          this.eventsSubjectSbox.next(datos);
        }, 300);
      }
      else {
        this.popUpVisor.close();
      }
    });

  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

}
