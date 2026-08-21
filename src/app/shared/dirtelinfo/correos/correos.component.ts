import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxTextBoxModule, DxValidatorModule } from 'devextreme-angular';
import { clsEmail } from '../clsDirTeInfo.class';
import { Observable, Subject, Subscription, lastValueFrom } from 'rxjs';
import { DirtelinfoService } from '../dirtelinfo.service';
import { showToast } from '../../toast/toastComponent.js';
import Swal from 'sweetalert2';

import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-correos',
    templateUrl: './correos.component.html',
    styleUrls: ['./correos.component.css'],
    imports: [DxDataGridModule, DxButtonModule, DxTextBoxModule, DxValidatorModule]
})
export class CorreosComponent {

  @ViewChild("gridEmails", { static: false }) gridEmails: DxDataGridComponent;

  DEmail: clsEmail[] = [];
  tiposCorreos: any[] = []; // Para el dropdown de tipos
  esEdicion: boolean = false;
  esVisibleSelecc: string = 'none';
  esInicioDatos: boolean = false;
  esCreacion: boolean = false;
  esInicioObj: any;
  iniEdicion: boolean = false;
  focusedRowIndex: number;
  focusedRowKey: string;
  msgValidacion: string;
  filaValida: boolean = false;

  // Operaciones de grid
  rowNew: boolean = true;
  rowEdit: boolean = false;
  rowDelete: boolean = false;
  rowSave: boolean = false;
  rowApplyChanges: boolean = false;
  filasSelecc: any[] = [];
  esNuevaFila: boolean = false;
  numeroFila: number;
  ltool: any;

  private eventsSubscription: Subscription;
  eventsSubjectSbox: Subject<any> = new Subject<any>();

  @Input() events: Observable<any>;

  @Output() onGuardarCambios: EventEmitter<any> = new EventEmitter<any>;

  constructor( private _sdatos: DirtelinfoService,
               private httpClient: HttpClient
             ) 
  {
    this.valideEmail = this.valideEmail.bind(this);
    this.insertedRow = this.insertedRow.bind(this);
    this.onCellClick = this.onCellClick.bind(this);
  }

  initNewRow(e){
    const maxItem = this.DEmail.length > 0 ? Math.max(...this.DEmail.map(d => d.ITEM || 0)) : 0;
    e.data.ITEM = maxItem + 1;
    e.data.EMAIL = '';
    e.data.ETIQUETA = '';
    e.data.isEdit = true;
  }

  insertedRow(e){
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
    this.rowNew = true;
    e.data.isEdit = false;
    this.onGuardarCambios.emit(this.DEmail);
  }

  insertingRow(e) {
    // Permitir insertar
  }

  updatedRow(e){
    this.rowApplyChanges = false;
    this.esVisibleSelecc = 'always';
    this.rowNew = true;
    e.data.isEdit = false;
    this.onGuardarCambios.emit(this.DEmail);
  }

  updatingRow(e) {
    if (e.oldData === undefined)
      return;
    e.oldData.isEdit = true;
  }
  onEditingStart(e) {
    // if (this.numeroFila === e.data.ITEM) {
      // this.esVisibleSelecc = 'none';
      // this.rowApplyChanges = true;
      // this.rowNew = false;
      // e.data.isEdit = true;
    // }
  }
  onCellClick(e) {
    this.numeroFila = e.data.ITEM;
    this.esVisibleSelecc = 'none';
    this.rowApplyChanges = true;
    this.rowNew = false;
    e.data.isEdit = true;
  }
  onEditorPreparing(e) {
  }
  onCellPrepared(e) {
  }
  onToolbarPreparingGrid(e: any) {
    let toolbarItems = e.toolbarOptions.items;
    e.toolbarOptions.items.unshift(
      {
        location: 'before'
      }
    );
  }
  removedRow(e) {
    this.rowApplyChanges = false;
    this.onGuardarCambios.emit(this.DEmail);
  }
  onRowPrepared(e) {
    if (e.rowType === "data") {
      if (e.data.isEdit) {
				// e.rowElement.style.backgroundColor = 'lightyellow';
				const className:string = e.rowElement.className;
				e.rowElement.className = className +' row-modified-focused';
			}
      if (e.data.isEdit) 
        {
          // this.esVisibleSelecc = 'none';
        }
    }
    if (e.rowType === "header" && e.rowIndex === 2 && !this.esEdicion) {
      e.rowElement.style.display = "none";
    }
  }
  onRowValidating(e: any) {
    // Solo valida completitud del email ya que la etiqueta viene predefinida
    var errMsg = '';
    if (e.newData.EMAIL !== undefined && e.newData.EMAIL == '') 
      errMsg = 'Falta registrar un email';
    
    if (errMsg !== '') {
      e.isValid = false;
      showToast(errMsg, 'warning');
      return;
    }
  }
  onContentReady(e) {  
    e.component.columnOption("command:edit", "visible", false);  
  }
  onFocusedRowChanged(e){
  }
  onEditCanceled(e) {
    this.esVisibleSelecc = 'always';
    this.rowApplyChanges = false;
    this.rowNew = true;
  }
  onCellHoverChanged(e) {
  }
  selectionGrid(e) {
    this.filasSelecc = e.selectedRowKeys;
    if (this.filasSelecc.length != 0)
      this.rowDelete = true;
    else
      this.rowDelete = false;
  }

  valideEmail(params) {
    var ret: boolean = true;
    this.filaValida = true;
    const EMAIL_REGEXP = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

    this.msgValidacion = ""
    if (params.value !== '' && (params.value.length <= 5 || !EMAIL_REGEXP.test(params.value))) {
      this.msgValidacion = "Email inválido"
      ret = false;  
      this.filaValida = false;
    }  

    return ret;

  }

  operGrid(e, operacion) {
    switch (operacion) {
      case 'new':
        if (this.gridEmails && this.gridEmails.instance) {
          this.gridEmails.instance.addRow();
          this.rowApplyChanges = true;
          this.rowNew = false;
          this.esVisibleSelecc = 'none';
        }
        break;
      case 'edit':
        this.esEdicion = true;
        this.rowApplyChanges = true;
        this.rowEdit = false;
        this.esVisibleSelecc = 'none';
        break;
      case 'save':
        if (this.filaValida) {
          this.gridEmails.instance.saveEditData();
          this.rowApplyChanges = false;
          this.rowNew = true;
          this.esVisibleSelecc = 'always';
        }
        else {
          showToast('Hay errores de datos del email!','error');
        }
        break;
      case 'cancel':
        this.gridEmails.instance.cancelEditData();
        this.rowApplyChanges = false;
        this.rowNew = true; // Restaurar estado
        this.esVisibleSelecc = 'always';
        break;
      case 'delete':
        if (this.filasSelecc.length > 0) {
          this.filasSelecc.forEach(key => {
            const index = this.DEmail.findIndex(d => d.ITEM === key);
            if (index !== -1) {
              this.DEmail.splice(index, 1);
            }
          });
          this.gridEmails.instance.deselectAll();
          this.filasSelecc = [];
          this.rowDelete = false;
          this.onGuardarCambios.emit(this.DEmail);
          setTimeout(() => {
            this.gridEmails.instance.refresh();
          }, 100);
        } else {
          showToast('Seleccione al menos una fila para eliminar.', 'warning');
        }
        break;

      default:
        break;
    }
  }

  // **** Cargue de datos iniciales y/o refrescar todos los datos asociados a objetos
  valoresObjetos(obj: string, opcion: any = undefined) {

    if (obj == 'correos' || obj == 'todos') {
      this.cargarTiposCorreos();
    }
  }

  // Cargar tipos de correos desde la API y combinar con datos existentes
  cargarTiposCorreosConDatos(datosExistentes: clsEmail[]) {
    const prm = { 
      ID_DOMINIO: 'correos_usuarios',
      ID_GRUPO_DOMINIO: 'emails'
    };
    
    this._sdatos
      .consulta('ITM_DOMINIOS', prm, "ADM012")
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }

        // Cargar tipos de correos para el lookup
        if (res && Array.isArray(res)) {
          this.tiposCorreos = res.map((item: any) => ({ VALOR1: item.VALOR1 || '' }));
        } else {
          this.tiposCorreos = [{ VALOR1: 'Email Principal' }];
        }
        
        // Crear array combinando tipos de API con datos existentes
        this.DEmail = [];
        let indexItem = 1;
        if (res && Array.isArray(res) && res.length > 0) {
          res.forEach((item: any) => {
            const tipoCorreo = item.VALOR1 || '';
            
            // Buscar todos los datos para este tipo de correo
            const datosFiltrados = datosExistentes.filter(d => d.ETIQUETA === tipoCorreo);
            
            if (datosFiltrados.length > 0) {
              // Si existen datos, agregar todos
              datosFiltrados.forEach(dato => {
                const nuevoEmail = new clsEmail();
                nuevoEmail.ITEM = indexItem++;
                nuevoEmail.ETIQUETA = tipoCorreo;
                nuevoEmail.EMAIL = dato.EMAIL || '';
                nuevoEmail.isEdit = false;
                this.DEmail.push(nuevoEmail);
              });
            } else {
              // Si no existe, crear uno vacío para guiar al usuario
              const nuevoEmail = new clsEmail();
              nuevoEmail.ITEM = indexItem++;
              nuevoEmail.ETIQUETA = tipoCorreo;
              nuevoEmail.EMAIL = '';
              nuevoEmail.isEdit = false;
              this.DEmail.push(nuevoEmail);
            }
          });
        } else {
          // Si no hay datos de la API, usar solo los datos existentes
          this.DEmail = datosExistentes;
          // Asegurar que todos los objetos tengan el campo ITEM
          this.DEmail.forEach((item, index) => {
            if (!item.ITEM) {
              item.ITEM = indexItem++;
            }
          });
        }
        
        // Refrescar el grid después de un pequeño delay
        setTimeout(() => {
          if (this.gridEmails && this.gridEmails.instance) {
            this.gridEmails.instance.refresh();
          }
        }, 100);
      }, (error) => {
        console.error('Error al cargar tipos de correos:', error);
        // En caso de error, usar solo los datos existentes
        this.DEmail = datosExistentes;
        // Asegurar que todos los objetos tengan los campos necesarios
        this.DEmail.forEach((item, index) => {
          if (!item.ITEM) {
            item.ITEM = index + 1;
          }
        });
        
        if (this.gridEmails && this.gridEmails.instance) {
          this.gridEmails.instance.refresh();
        }
      });
  }

  // Cargar tipos de correos desde la API
  // La API debe devolver un array con estructura:
  // [{"ID_DOMINIO":"correos_usuarios","ID_GRUPO_DOMINIO":"emails","ITEM":1,"VALOR1":"Pagos","VALOR2":"","VALOR3":"","VALOR4":"","ErrMensaje":""}...]
  // Donde VALOR1 contiene el tipo/etiqueta del correo a mostrar
  cargarTiposCorreos() {
    const prm = { 
      ID_DOMINIO: 'correos_usuarios',
      ID_GRUPO_DOMINIO: 'emails'
    };
    
    // NOTA: Cambiar 'tipos_correos' por el endpoint real que devuelve los tipos de correos
    this._sdatos
      .consulta('ITM_DOMINIOS', prm, "ADM012") // Cambiar el endpoint según corresponda
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
         
        // Cargar tipos de correos para el lookup
        if (res && Array.isArray(res)) {
          this.tiposCorreos = res.map((item: any) => ({ VALOR1: item.VALOR1 || '' }));
        } else {
          this.tiposCorreos = [{ VALOR1: 'Email Principal' }];
        }
        
        // Crear array de emails basado en la respuesta de la API
        this.DEmail = [];
        if (res && Array.isArray(res) && res.length > 0) {
          res.forEach((item: any, index: number) => {
            const nuevoEmail = new clsEmail();
            // Asegurar que siempre haya un ITEM válido
            nuevoEmail.ITEM = item.ITEM || (index + 1);
            nuevoEmail.EMAIL = ''; // Email vacío para que el usuario lo complete
            nuevoEmail.ETIQUETA = item.VALOR1 || ''; // Tipo de email viene en VALOR1
            nuevoEmail.isEdit = false;
            this.DEmail.push(nuevoEmail);
          });
        } else {
          // Si no hay datos de la API, crear al menos un registro por defecto
          const emailDefault = new clsEmail();
          emailDefault.ITEM = 1;
          emailDefault.EMAIL = '';
          emailDefault.ETIQUETA = 'Email Principal';
          emailDefault.isEdit = false;
          this.DEmail = [emailDefault];
        }
        
        // Refrescar el grid después de un pequeño delay para asegurar que los datos estén listos
        setTimeout(() => {
          if (this.gridEmails && this.gridEmails.instance) {
            this.gridEmails.instance.refresh();
          }
        }, 100);
      }, (error) => {
        console.error('Error al cargar tipos de correos:', error);
        showToast('Error al cargar los tipos de correos', 'error');
        
        // En caso de error, crear un registro por defecto
        const emailDefault = new clsEmail();
        emailDefault.ITEM = 1;
        emailDefault.EMAIL = '';
        emailDefault.ETIQUETA = 'Email Principal';
        emailDefault.isEdit = false;
        this.DEmail = [emailDefault];
        
        if (this.gridEmails && this.gridEmails.instance) {
          this.gridEmails.instance.refresh();
        }
      });
  }

  // Valida que todos los emails estén completos y emite los cambios
  validarYEmitirCambios() {
    const emailsIncompletos = this.DEmail.filter(email => !email.EMAIL || email.EMAIL.trim() === '');
    
    return {
      data: this.DEmail,
      esValido: emailsIncompletos.length === 0,
      emailsIncompletos: emailsIncompletos.map(email => email.ETIQUETA),
      mensaje: emailsIncompletos.length > 0 
        ? `Faltan completar los siguientes emails: ${emailsIncompletos.map(e => e.ETIQUETA).join(', ')}`
        : ''
    };
  }

  // Activa campos de la forma para edición 
  // dependiendo de la acción a realizar
  activarEdicion(accion) {
    switch (accion) {
      case 'consulta':
      case 'inactivo':
        this.esVisibleSelecc = 'none';
        this.esEdicion = false;
        break;
      case 'activo':
      case 'nuevo':
        this.esVisibleSelecc = 'always';
        this.esEdicion = true;
        break;
    
      default:
        break;
    }

  }

  ngOnInit(): void { 
    // Inicializar con un array vacío que contenga al menos un registro por defecto para evitar errores de keyExpr
    const emailDefault = new clsEmail();
    emailDefault.ITEM = 1;
    emailDefault.EMAIL = '';
    emailDefault.ETIQUETA = '';
    emailDefault.isEdit = false;
    this.DEmail = [emailDefault];

    this.eventsSubscription = this.events.subscribe((datos: any) => {
      switch (datos.operacion) {
        case 'nuevo':
          this.DEmail = [];
          // Cargar los tipos de correo predefinidos cuando se crea un nuevo registro
          this.cargarTiposCorreos();
          break;
      
        case 'consulta':
          const datosExistentes = datos.dataSource || [];
          // Cargar los tipos de correos y combinar con datos existentes
          this.cargarTiposCorreosConDatos(datosExistentes);
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

  showModal(mensaje: any, titulo = '¡Error!', msg_html= '') {
    const tipo = titulo;
		Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo==='Error' ? 'DF3E3E':'#0F4C81 !important',
			title: titulo,
			text: mensaje,
			allowOutsideClick: true,
			allowEscapeKey: false,
			allowEnterKey: false,
			backdrop: true,
			position: 'center',
			stopKeydownPropagation: false,
		});
	}


}
