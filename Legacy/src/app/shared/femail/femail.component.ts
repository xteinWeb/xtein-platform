import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DxFormModule, DxPopupModule } from 'devextreme-angular';
import { Observable, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-femail',
  templateUrl: './femail.component.html',
  styleUrls: ['./femail.component.css'],
  standalone: true,
  imports: [ CommonModule, DxFormModule, DxPopupModule]
})
export class FemailComponent {

  private eventsSubscription: Subscription;
  eventsSubjectSbox: Subject<any> = new Subject<any>();
  popupVisible: boolean = false;
  popUpVisor: any;
  DEnvioCorreo: any;

  isFormReadOnly = false

  submitButtonOptions = {
    text: "Enviar",
    useSubmitBehavior: true
  }

  @Input() events: Observable<any>;

  @Input() titEnvioCorreo: any;
  
  @Output() onRespuestaSelecc = new EventEmitter<any>;


  constructor() {
    this.onInitializedPopUp =this.onInitializedPopUp.bind(this);
  }

  onShown(e: any) {
  }
  onHidden(e:any) {
    this.popupVisible = false;
  }
  onInitializedPopUp(e: any) {
    this.popUpVisor = e.component;
  }

  handleSubmit(e) {
      setTimeout(() => { 
        this.onRespuestaSelecc.emit(this.DEnvioCorreo);
        this.popupVisible = false;
      }, 1000);
      
      e.preventDefault();
  }

  ngOnInit(): void { 
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      if (datos !== 'cerrar') {
        if (datos.dataSource) 
          this.DEnvioCorreo = datos.dataSource;
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
