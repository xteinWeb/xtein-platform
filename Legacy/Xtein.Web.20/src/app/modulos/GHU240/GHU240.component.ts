import { Component } from '@angular/core';
import notify from 'devextreme/ui/notify';
import { DxDataGridModule } from 'devextreme-angular';
import { Empleado } from './GHU240.class';
import { EmpleadoService } from 'src/app/services/GHU240/GHU240.service';

@Component({
  selector: 'app-GHU240',
  templateUrl: './GHU240.component.html',
  styleUrls: ['./GHU240.component.scss'],
  standalone: true,
  imports: [ DxDataGridModule]
})
export class GHU240Component {
  empleados: Empleado[] = [];
  isLoading: boolean = false;

  constructor(private empleadoService: EmpleadoService) { }

  ngOnInit(): void {
    this.loadEmpleados();
  }

  // Cargar empleados desde la API
  loadEmpleados(): void {
    this.isLoading = true;
    const prm = { USUARIO: localStorage.getItem('usuario')
                };
    this.empleadoService.consulta('anticipos', prm, "GHU-230").subscribe({
      next: (data) => {
        const response = JSON.parse(data.data);
        if (response[0].ErrMensaje == "") {
          this.empleados = response;
        } else {
          this.empleados = [];
          notify('No se encontraron empleados', 'info', 3000);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar empleados:', error);
        notify('Error al cargar los datos', 'error', 3000);
        this.isLoading = false;
      }
    });
  }

  // Evento cuando se inserta una nueva fila
  onRowInserting(e: any): void {
    e.cancel = true; // Cancelar la operación por defecto
    const nuevoEmpleado: Empleado = e.data;
    const prm = { USUARIO: localStorage.getItem('usuario'),
                  ANTICIPOS: nuevoEmpleado
                };
    this.empleadoService.consulta('new anticipo', prm, 'GHU-230').subscribe({
      next: (response) => {
        this.loadEmpleados(); // Recargar datos
        notify('Empleado creado exitosamente', 'success', 2000);
      },
      error: (error) => {
        console.error('Error al crear empleado:', error);
        notify('Error al crear el empleado '+error.message, 'error', 3000);
      }
    });
  }

  // Evento cuando se actualiza una fila
  onRowUpdating(e: any): void {
    e.cancel = true; // Cancelar la operación por defecto
    const empleadoActualizado: Empleado = { ...e.oldData, ...e.newData };
    const id = e.key.ID_EMPLEADO;
    const prm = { USUARIO: localStorage.getItem('usuario'),
                  ANTICIPOS: empleadoActualizado
                };

    this.empleadoService.consulta('update anticipo', prm, 'GHU-230').subscribe({
      next: (response) => {
        const resp = JSON.parse(response.data);
        if (resp[0].ErrMensaje == "") {
          notify('Empleado actualizado exitosamente', 'success', 2000);
          this.loadEmpleados(); // Recargar datos
        } else {
          notify('Error: ' + resp[0].ErrMensaje, 'error', 3000);
        }
      },
      error: (error) => {
        console.error('Error al actualizar empleado:', error);
        notify('Error al actualizar el empleado '+error.message, 'error', 3000);
      }
    });
  }

  // Evento cuando se elimina una fila
  onRowRemoving(e: any): void {
    e.cancel = true; // Cancelar la operación por defecto
    const id = e.key.ID_EMPLEADO;
    const prm = { USUARIO: localStorage.getItem('usuario'),
                  ANTICIPOS: { ID_EMPLEADO: id }
                };

    this.empleadoService.save('delete anticipo', prm, 'GHU-230').subscribe({
      next: (response) => {
        this.loadEmpleados(); // Recargar datos
        notify('Empleado eliminado exitosamente', 'success', 2000);
      },
      error: (error) => {
        console.error('Error al eliminar empleado:', error);
        notify('Error al eliminar el empleado '+error.message, 'error', 3000);
      }
    });
  }

  // Calcular valores personalizados si es necesario
  onEditorPreparing(e: any): void {
    // Aquí puedes personalizar editores si lo necesitas
  }

}
