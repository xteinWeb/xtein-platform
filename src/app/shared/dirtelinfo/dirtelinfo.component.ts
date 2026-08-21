
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DxDataGridModule, DxFormModule, DxTextBoxModule } from 'devextreme-angular';
import { clsContactos } from './clsDirTeInfo.class';
import { DireccionesComponent } from './direcciones/direcciones.component';
import { CorreosComponent } from './correos/correos.component';
import { TelefonosComponent } from './telefonos/telefonos.component';
import { Observable, Subject, Subscription } from 'rxjs';
import { CdkAccordionModule } from '@angular/cdk/accordion';

@Component({
    selector: 'app-dirtelinfo',
    templateUrl: './dirtelinfo.component.html',
    styleUrls: ['./dirtelinfo.component.css'],
    imports: [DxFormModule, DxDataGridModule, DireccionesComponent, CorreosComponent, TelefonosComponent, CdkAccordionModule, DxTextBoxModule]
})
export class DirtelinfoComponent {
  
  FContactos: clsContactos;
  datosDir: any;
  datosTel: any;
  datosEmail: any;
  datosContacto: any;
  readOnly: boolean = false;
  rowsSelectedCorreos: any;

  private eventsSubscription: Subscription;
  eventsSubjectDir: Subject<any> = new Subject<any>();
  eventsSubjectTel: Subject<any> = new Subject<any>();
  eventsSubjectCorreos: Subject<any> = new Subject<any>();
  itemsAco = ['Contacto','Correos','Direcciones','Teléfonos'];
  accordionExpand: any;
    
  @Input() events: Observable<any>;

  @Input() dataEmail: any;
  @Input() dataDirecciones: any;
  @Input() dataTelefonos: any;
  @Input() dataContacto: any;

  @Output() dataEmailChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() dataDireccionesChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() dataTelefonosChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() dataContactoChange: EventEmitter<any> = new EventEmitter<any>();

  dropDownOptions = { width: 600, 
    height: 400, 
    hideOnParentScroll: true,
    container: '#router-container' 
  };
  dropWidth: number = 600;
  dropHeight: number = 400;

  constructor() {

    this.accordionExpand = [true,true,false,false];

  }

  
  guardarCambiosCorreo(e) {
    this.dataEmailChange.emit(e);
  }
  guardarCambiosDir(e) {
    this.dataDireccionesChange.emit(e);
  }
  guardarCambiosTel(e) {
    this.dataTelefonosChange.emit(e);
  }
  onValueChanged(e, campo) {
    switch (campo) {
      case "URL":
        this.FContactos.URL = e.value;
        break;
      case "CIIU":
        this.FContactos.CIIU = e.value;
        break;
    
      default:
        break;
    }
    this.dataContactoChange.emit(this.FContactos);
  }

  // Activa campos de la forma para edición 
  // dependiendo de la acción a realizar
  activarEdicion(accion) {
    switch (accion) {
      case 'consulta':
        this.readOnly = true;
        break;
      case 'inactivo':
        this.readOnly = true;
        break;
      case 'activo':
      case 'nuevo':
        this.readOnly = false;
        break;
    
      default:
        break;
    }
    if (!accion.match('consulta')) {
      this.eventsSubjectDir.next({ operacion: accion });
      this.eventsSubjectTel.next({ operacion: accion });
      this.eventsSubjectCorreos.next({ operacion: accion });
    }

  }

  ngOnInit(): void { 
    this.FContactos = new clsContactos();
    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.operacion) {
        case 'nuevo':
          this.datosDir = [];
          this.datosTel = [];
          this.datosEmail = [];
          this.datosContacto = [];
          this.FContactos = new clsContactos();
          
          setTimeout(() => {
            this.eventsSubjectDir.next({ operacion: datos.operacion } );
            this.eventsSubjectTel.next({ operacion: datos.operacion } );
            this.eventsSubjectCorreos.next({ operacion: datos.operacion } );
          }, 300);
          break;
      
        case 'consulta':
          this.datosDir = datos.Dir.dataSource;
          this.datosTel = datos.Tel.dataSource;
          this.datosEmail = datos.Email.dataSource;
          this.datosContacto = datos.Contacto.dataSource;
          this.FContactos = datos.Contacto.dataSource;
          this.accordionExpand = [true,this.datosEmail.length!=0,this.datosDir.length!=0,this.datosTel.length!=0];

          setTimeout(() => {
            this.eventsSubjectDir.next({ ...datos.Dir, ...{ operacion: datos.operacion } });
            this.eventsSubjectTel.next({ ...datos.Tel, ...{ operacion: datos.operacion } });
            this.eventsSubjectCorreos.next({ ...datos.Email, ...{ operacion: datos.operacion } });
          }, 300);
          break;
      
        default:
          break;
      }
      this.activarEdicion(datos.operacion);

    });
  }
  ngAfterViewInit(): void {

  }
  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

}
