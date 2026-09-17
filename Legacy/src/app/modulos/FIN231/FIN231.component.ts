import { Component, ViewChild } from '@angular/core';
import notify from 'devextreme/ui/notify';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxPopupModule, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { FIN230Service } from 'src/app/services/FIN230/s_FIN230.service';
import { Asociado } from './FIN231.class';
import { Condicion } from '../FIN230/FIN230.class';

@Component({
  selector: 'app-FIN231',
  templateUrl: './FIN231.component.html',
  styleUrls: ['./FIN231.component.scss'],
  standalone: true,
  imports: [ DxDataGridModule, DxSelectBoxModule, DxButtonModule, DxTextBoxModule, DxPopupModule ]
})
export class FIN231Component {
  @ViewChild("gridAsociados", { static: false }) gridAsociados: DxDataGridComponent;
  

  asociados: Asociado[] = [];
  tiposAsociados: any[] = [];
  DCiudades: any[] = [];
  isLoading: boolean = false;
  usuario: string | null = '';
  empresa: string | null = '';
  prmUsrAplBarReg: any;
  nuevoAsociado: string = '';
  visiblePopupNuevoAsociado: boolean = false;
  dropDownOptions = { width: 400, height: 400, hideOnParentScroll: true, container: '#router-container'};

  constructor(private s_datos: FIN230Service) { }

  ngOnInit(): void {
    this.usuario = localStorage.getItem('usuario')?.toUpperCase() || '';
    this.empresa = localStorage.getItem('empresa')?.toUpperCase() || '';
    this.prmUsrAplBarReg = {
      tabla: 'asociados_PLANES',
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
        
    this.loadasociados();
  }

  // Cargar asociados desde la API
  loadasociados(): void {
    this.isLoading = true;
    const prm = { USUARIO: this.usuario
                };
    this.s_datos.consulta('consulta asociados', prm, "FIN-230").subscribe({
      next: (data) => {
        const response = JSON.parse(data.data);
        if (response[0].ErrMensaje == "") {
          this.asociados = response;
        } else {
          this.asociados = [];
          notify(response[0].ErrMensaje, 'info', 3000);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar asociados:', error);
        notify('Error al cargar los asociados: ' + error.message, 'error', 3000);
        this.isLoading = false;
      }
    });

    // Tipos de asociados
    const prm2 = {ID_DOMINIO: 'CREDITO', ID_GRUPO_DOMINIO: 'ASOCIADOS'};
    this.s_datos
      .consulta('ITM_DOMINIOS', prm2, 'ADM012')
      .subscribe((data: any) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.tiposAsociados = res;
    });

    // Ubicaciones - Ciudades
    this.s_datos.consulta('ubicaciones', 
                          { TIPO_UBICACION: 'Ciudad'}, 
                          'ADM-006').subscribe((data: any) => {
      const res = JSON.parse(data.data);
      if ((data.token != undefined)) {
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      this.DCiudades = res;
    });


  }

  onInitNewRow(e: any): void {
    e.data.ID_ASOCIADO = this.nuevoAsociado; // Asignar el ID del nuevo asociado
    e.data.ITEM = this.asociados.length + 1; // Asignar el siguiente número de ítem
    e.data.NOMBRE = ''; // Inicializar el campo NOMBRE
    e.data.DIRECCION = ''; // Inicializar el campo DIRECCION
    e.data.TELEFONO = ''; // Inicializar el campo TELEFONO
    e.data.ID_UBICACION = ''; // Inicializar el campo ID_UBICACION
    e.data.EMAIL = '';    
    e.data.TIPO = ''; // Inicializar el campo TIPO
  }

  // Evento cuando se inserta una nueva fila
  onRowInserting(e: any): void {
  }
  onRowInserted(e: any): void {
    const nuevoAsociado: Asociado = e.data;
    const prm = { USUARIO: this.usuario,
                  ASOCIADOS: nuevoAsociado
                };
    this.s_datos.save('new asociado', prm, 'FIN-230').subscribe({
      next: (response) => {
        const resp = JSON.parse(response.data);
        this.loadasociados(); // Recargar datos
        if (resp[0].ErrMensaje === '') {
          notify('Asociado creado exitosamente', 'success', 2000);
        } else {
          notify('Error: ' + resp[0].ErrMensaje, 'error', 3000);
        }
      },
      error: (error) => {
        console.error('Error al crear asociado:', error);
        notify('Error al crear el asociado: ' + error.message, 'error', 3000);
      }
    });
  }

  onRowUpdating(e: any): void {
  }
  // Evento cuando se actualiza una fila
  onRowUpdated(e: any): void {
    const asociadoActualizado: Asociado = e.data;
    const id = e.key.ID_ASOCIADO;
    const prm = { USUARIO: this.usuario,
                  ASOCIADOS: asociadoActualizado
                };

    this.s_datos.save('update asociado', prm, 'FIN-230').subscribe({
      next: (response) => {
        const resp = JSON.parse(response.data);
        this.loadasociados(); // Recargar datos
        if (resp[0].ErrMensaje == "") {
          notify('Asociado actualizado exitosamente', 'success', 2000);
        } else {
          notify('Error: ' + resp[0].ErrMensaje, 'error', 3000);
        }
      },
      error: (error) => {
        console.error('Error al actualizar asociado:', error);
        notify('Error al actualizar el asociado: ' + error.message, 'error', 3000);
      }
    });
  }

  // Evento cuando se elimina una fila
  onRowRemoving(e: any): void {
    const prm = { USUARIO: this.usuario,
                  ASOCIADOS: e.data
                };

    this.s_datos.delete('delete asociado', prm, 'FIN-230').subscribe({
      next: (response) => {
        const resp = JSON.parse(response.data);
        this.loadasociados(); // Recargar datos
        if (resp[0].ErrMensaje === '') {
          notify('Asociado eliminado exitosamente', 'success', 2000);
        } else {
          notify('Error: ' + resp[0].ErrMensaje, 'error', 3000);
        }
      },
      error: (error) => {
        console.error('Error al eliminar asociado:', error);
        notify('Error al eliminar el asociado: ' + error.message, 'error', 3000);
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

  onTipoSelecc(event: any, cellInfo: any): void {
    // Aquí puedes manejar la lógica cuando se selecciona un tipo de asociado
    cellInfo.setValue(event.selectedItem.VALOR1); // Asignar el ID del tipo de asociado al campo correspondiente
  }
  onUbicacionSelecc(event: any, cellInfo: any): void {
    // Aquí puedes manejar la lógica cuando se selecciona una ubicación
    cellInfo.setValue(event.selectedItem.ID_UBICACION); // Asignar el ID de la ubicación al campo correspondiente
  }

  agregarAsociado(): void {
    this.gridAsociados.instance.addRow(); // Agregar una nueva fila al grid
  }
  aceptar(): void {
    this.visiblePopupNuevoAsociado = false;
    setTimeout(() => {
      this.gridAsociados.instance.addRow(); // Agregar una nueva fila al grid
    }, 300);
  }
  cancelar(): void {
    this.visiblePopupNuevoAsociado = false;
    this.nuevoAsociado = ''; // Limpiar el campo de nuevo asociado
  }

}
