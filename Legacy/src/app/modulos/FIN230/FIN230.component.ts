import { Component, ViewChild } from '@angular/core';
import notify from 'devextreme/ui/notify';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxPopupModule, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { Condicion } from './FIN230.class';
import { FIN230Service } from 'src/app/services/FIN230/s_FIN230.service';

@Component({
  selector: 'app-FIN230',
  templateUrl: './FIN230.component.html',
  styleUrls: ['./FIN230.component.scss'],
  standalone: true,
  imports: [ DxDataGridModule, DxSelectBoxModule, DxButtonModule, DxTextBoxModule, DxPopupModule ]
})
export class FIN230Component {
  @ViewChild("gridCondiciones", { static: false }) gridCondiciones: DxDataGridComponent;
  

  condiciones: Condicion[] = [];
  clientes: any[] = [];
  isLoading: boolean = false;
  usuario: string | null = '';
  empresa: string | null = '';
  prmUsrAplBarReg: any;
  nuevaCondicion: string = '';
  visiblePopupNuevaCondicion: boolean = false;
  dropDownOptions = { width: 400, height: 400, hideOnParentScroll: true, container: '#router-container'};

  constructor(private s_datos: FIN230Service) { }

  ngOnInit(): void {
    this.usuario = localStorage.getItem('usuario')?.toUpperCase() || '';
    this.empresa = localStorage.getItem('empresa')?.toUpperCase() || '';
    this.prmUsrAplBarReg = {
      tabla: 'CONDICIONES_PLANES',
      aplicacion: 'FIN-230',
      usuario: this.usuario,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: {
        r_modificar: false,
        r_nuevo: false,
        r_copiar: false,
        r_eliminar: false,
      },
    }
        
    this.loadCondiciones();
  }

  // Cargar condiciones desde la API
  loadCondiciones(): void {
    this.isLoading = true;
    const prm = { USUARIO: this.usuario
                };
    this.s_datos.consulta('consulta', prm, "FIN-230").subscribe({
      next: (data) => {
        const response = JSON.parse(data.data);
        if (response[0].ErrMensaje == "") {
          this.condiciones = response;
        } else {
          this.condiciones = [];
          notify(response[0].ErrMensaje, 'info', 3000);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar condiciones:', error);
        notify('Error al cargar las condiciones: ' + error.message, 'error', 3000);
        this.isLoading = false;
      }
    });

    // Clientes tipo pago a terceros
    this.s_datos.consulta('CLIENTES',{CLASE: 'Pagaduria'},'VEN-001').subscribe({
      next: (data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.clientes = res;
      },
        error: (error) => {
          console.error('Error al cargar clientes:', error);
          notify('Error al cargar los clientes: ' + error.message, 'error', 3000);
          this.isLoading = false;
        }
    });

  }

  onInitNewRow(e: any): void {
    e.data.ID_CONDICION = this.nuevaCondicion; // Asignar el ID de la nueva condición
    e.data.ITEM = this.condiciones.length + 1; // Asignar el siguiente número de ítem
    e.data.ID_CONCEPTO = ''; // Inicializar el campo ID_CONCEPTO
    e.data.VALOR = 0; // Inicializar el campo VALOR
    e.data.PORCENTAJE = 0; // Inicializar el campo PORCENTAJE
    e.data.FORMULA = ''; // Inicializar el campo FORMULA
    e.data.DESCONTAR_INI = false; // Inicializar el campo DESCONTAR_INI
    e.data.CARGO_CUOTA = false; // Inicializar el campo CARGO_CUOTA
    e.data.CLIENTE_PADRE = ''; // Inicializar el campo CLIENTE_PADRE
  }

  // Evento cuando se inserta una nueva fila
  onRowInserting(e: any): void {
  }
  onRowInserted(e: any): void {
    const nuevaCondicion: Condicion = e.data;
    const prm = { USUARIO: this.usuario,
                  CONDICIONES: nuevaCondicion
                };
    this.s_datos.save('new', prm, 'FIN-230').subscribe({
      next: (response) => {
        const resp = JSON.parse(response.data);
        if (resp[0].ErrMensaje === '') {
          this.loadCondiciones(); // Recargar datos
          notify('Condición creada exitosamente', 'success', 2000);
          }
        else {
          notify('Error: ' + resp[0].ErrMensaje, 'error', 3000);
        }
      },
      error: (error) => {
        console.error('Error al crear condición:', error);
        notify('Error al crear la condición: ' + error.message, 'error', 3000);
      }
    });
  }

  onRowUpdating(e: any): void {
  }
  // Evento cuando se actualiza una fila
  onRowUpdated(e: any): void {
    const condicionActualizada: Condicion = e.data;
    const id = e.key.ID_CONDICION;
    const prm = { USUARIO: this.usuario,
                  CONDICIONES: condicionActualizada
                };

    this.s_datos.save('update', prm, 'FIN-230').subscribe({
      next: (response) => {
        const resp = JSON.parse(response.data);
        if (resp[0].ErrMensaje == "") {
          notify('Condición actualizada exitosamente', 'success', 2000);
          this.loadCondiciones(); // Recargar datos
        } else {
          notify('Error: ' + resp[0].ErrMensaje, 'error', 3000);
        }
      },
      error: (error) => {
        console.error('Error al actualizar condición:', error);
        notify('Error al actualizar la condición: ' + error.message, 'error', 3000);
      }
    });
  }

  // Evento cuando se elimina una fila
  onRowRemoving(e: any): void {
    const prm = { USUARIO: this.usuario,
                  CONDICIONES: e.key
                };

    this.s_datos.delete('delete', prm, 'FIN-230').subscribe({
      next: (response) => {
        this.loadCondiciones(); // Recargar datos
        notify('Condición eliminada exitosamente', 'success', 2000);
      },
      error: (error) => {
        console.error('Error al eliminar condición:', error);
        notify('Error al eliminar la condición: ' + error.message, 'error', 3000);
      }
    });
  }

  // Calcular valores personalizados si es necesario
  onEditorPreparing(e: any): void {
    // Aquí puedes personalizar editores si lo necesitas
  }
  onEditingStart(e: any): void {
    // e.cancel = true; // Cancelar la operación por defecto
  }

  onClienteSelecc(event: any, cellInfo: any): void {
    // Aquí puedes manejar la lógica cuando se selecciona un cliente
    cellInfo.setValue(event.selectedItem.ID_CLIENTE); // Asignar el ID del cliente al campo correspondiente
  }

  aceptar(): void {
    this.visiblePopupNuevaCondicion = false;
    setTimeout(() => {
      this.gridCondiciones.instance.addRow(); // Agregar una nueva fila al grid
    }, 300);
  }
  cancelar(): void {
    this.visiblePopupNuevaCondicion = false;
    this.nuevaCondicion = ''; // Limpiar el campo de nueva condición
  }

}
