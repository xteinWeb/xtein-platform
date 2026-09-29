import { Component, Input, Output, EventEmitter, ViewChild, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule, DxDataGridComponent, DxDropDownBoxModule, DxButtonModule, DxTreeListModule, DxDropDownBoxComponent } from 'devextreme-angular';
import Swal from 'sweetalert2';
import { ApiRestService } from 'src/app/services/usuarios/api-rest.service';
import { GroupItem } from 'devexpress-dashboard/model';
import { TreeListItem,  Modulo, Aplicacion, UnidadesNegocio} from './clsADM20702.class';
import { ADM207Service } from 'src/app/services/ADM207/ADM207.service';
@Component({
  selector: 'app-adm20702',
  templateUrl: './ADM20702.component.html',
  styleUrls: ['./ADM20702.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxDropDownBoxModule, DxButtonModule, DxTreeListModule,  ],

})
export class ADM20702Component implements OnInit, OnChanges {
  
  @Input() dataSource: any[] = [];
  @Input() readOnly: boolean = true;
  @Input() treeDataProdcutos: any[] = [];
  @Input() documentoData: any = {}; 
  @Input() prmUsrAplBarRegUsuario: any = ''; 
  @Input() id_app: any = ''; 
  @Input() appSelecteds: any[] = [];

  @Output() dataChanged = new EventEmitter<any[]>();
  @Output() selectionChanged = new EventEmitter<any>();

  @ViewChild('gridRefUn') gridRefUn!: DxDataGridComponent;

  // Variables para traer las aplicaciones
  usuario: any;
  empresa: any;
  usuarioAplicaciones: any = [];
  @ViewChild('appsDisponibles', { static: false }) appsDisponibles: DxDropDownBoxComponent; 
  appSeleccionadas: string[] = [];
  aplicacionesSeleccionadas: any[] = [];
  appsDataSource: TreeListItem[] = [];


  // Variables para asociar un nuevo UNs
  @ViewChild('asociarUNs', { static: false }) asociarUNs: DxDropDownBoxComponent;
  UNsSeleccionadas: string[] = [];
  UNsSeleccionadasCompletas: UnidadesNegocio[] = [];
  UnsDisponibles: any[] = [];
  // Variables de control de botones del grid
  rowNewUN: boolean = true;
  rowEditUN: boolean = false;
  rowDeleteUN: boolean = false;
  rowApplyChangesUN: boolean = false;
  
  // Variables originales
  private filasSelecc: any[] = [];
  

  constructor(
    private sData: ApiRestService,
    private _sdatos: ADM207Service
  ){}

  ngOnInit(): void {
    this.resetButtonStates();
    this.getInfoUser();
    this.getAplicacionesUser();
    this.consultarUNs();
    
  }

  ngOnChanges(): void {
    
    this.appSeleccionadas = this.appSelecteds;

    this.consultarUNs();

  }


  getInfoUser(){
    this.usuario = localStorage.getItem('usuario');
    this.empresa = localStorage.getItem('empresa');
  }

  getAplicacionesUser(){
    const prm = {USUARIO: this.usuario, EMPRESA: this.empresa};
    this.sData.usuarioAplicaciones('USUARIO APLICACIONES', prm).subscribe((data: any)=> {
    
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      this.usuarioAplicaciones = res;

      this.filterMenuItems();
    });
  }

  filterMenuItems(){
    var modulos: any = this.usuarioAplicaciones.filter((d: any) => 
      d.ID_APLICACION_PADRE === 'XTEIN' && d.TIPO === 'modulo'
    );
    
    modulos.forEach((element: any) => {
      var menu1: any = this.usuarioAplicaciones.filter((d: any) => 
        d.ID_APLICACION_PADRE === element.ID_APLICACION
      );
      
      if(menu1.length > 0) {
        menu1.sort((a: any, b: any) => {
          if (a.NOMBRE > b.NOMBRE) return 1;
          if (a.NOMBRE < b.NOMBRE) return -1;
          return 0;
        });
        
        const index: any = modulos.findIndex((d: any) => 
          d.ID_APLICACION === element.ID_APLICACION
        );
        modulos[index].items = menu1;
        
        menu1.forEach((item: any) => {
          var menu2: any = this.usuarioAplicaciones.filter((e: any) => 
            e.ID_APLICACION_PADRE === item.ID_APLICACION
          );
          
          if(menu2.length > 0) {
            menu2.sort((a: any, b: any) => {
              if (a.NOMBRE > b.NOMBRE) return 1;
              if (a.NOMBRE < b.NOMBRE) return -1;
              return 0;
            });
            
            const npos: any = menu1.findIndex((d: any) => 
              d.ID_APLICACION === item.ID_APLICACION
            );
            modulos[index].items[npos].items = menu2;
          }
        });
      }
    });


    this.appsDataSource = this.transformarDatos(modulos)
  }


  transformarDatos(modulos: Modulo[]): TreeListItem[] {
    const datosAplanados: TreeListItem[] = [];

    modulos.forEach(modulo => {
        
        datosAplanados.push({
            ID_GRUPO: modulo.ID_APLICACION,
            NOMBRE: `${modulo.NOMBRE} (Módulo)`,
            ID_GRUPO_PADRE: null, 
            TIPO: 'modulo'
        });

        if (modulo.items && Array.isArray(modulo.items)) {
            modulo.items.forEach(aplicacion => {
                datosAplanados.push({
                    ID_GRUPO: aplicacion.ID_APLICACION,
                    NOMBRE: `${aplicacion.NOMBRE} (App)`,
                    ID_GRUPO_PADRE: aplicacion.ID_APLICACION_PADRE, 
                    TIPO: 'aplicacion'
                });
            });
        }
    });
    return datosAplanados;
  }

  
  onSelectionChanged(e: any, type:String): void {
    if(type == 'UN'){
      this.UNsSeleccionadas = e.selectedRowKeys || [];
      this.selectionChanged.emit({
          type: 'UN',
          selectedKeys: this.UNsSeleccionadas
        });
    }
    if(type == 'APLICACIONES'){
        this.appSeleccionadas = e.selectedRowKeys || [];

  
        this.selectionChanged.emit({
          type: 'aplicaciones',
          selectedKeys: this.appSeleccionadas
        });
    }

  
  }


  onValueChanged(e: any, type:String): void {
    if (!e.value || e.value.length === 0) {
      if(type == 'UN'){
        this.UNsSeleccionadas = [];
      }
      if(type == 'APLICACIONES'){
        this.appSeleccionadas = [];
      }
    }
  }


  // Consultar unidades de negocio

  updateUnsData(){
    const unsAsociadas = this.dataSource.map((item: any) => {
      // Verificar diferentes posibles campos
      return item.ID_UN_ASOCIADA;
    }).filter(id => id);

    this.UNsSeleccionadas = [...unsAsociadas];

    this.UNsSeleccionadasCompletas = this.UnsDisponibles
    .filter((un: any) => this.UNsSeleccionadas.includes(un.ID_UN))
    .map((un: any) => ({
      ID_UN: this.documentoData?.ID_UN || '',
      ID_DOCUMENTO: this.documentoData?.ID_DOCUMENTO || '',
      ID_UN_ASOCIADA: un.ID_UN,
      NOMBRE: un.NOMBRE || un.UN_NOMBRE || ''
    }));

  }

  consultarUNs(){
    this._sdatos.consulta('UNIDADES NEGOCIOS',
      { ESTADO: 'ACTIVO', 
        USUARIO: this.prmUsrAplBarRegUsuario,
        ID_APLICACION: this.id_app
      },'ADM-002').
      subscribe((data: any) => {
        try{
          
          const res = JSON.parse(data.data);
          if (res[0].ErrMensaje === '') {
            this.UnsDisponibles = res;
            
            this.createUnsFlat();

          }

        }catch(error){
          console.error("Error al consultar UNs:", error);
        }
        
      });
  }

  createUnsFlat(): void {
      let flatArray: any[] = [];
      this.UnsDisponibles = this.UnsDisponibles.map(un => ({
         ...un,
        ID_UN_SUPERIOR: un.ID_UN_SUPERIOR === "RAIZ" || un.ID_UN_SUPERIOR === "" 
          ? null
          : un.ID_UN_SUPERIOR
      }));

      this.UnsDisponibles.forEach((un: any) => {
        flatArray.push({
          ID_UN: un.ID_UN,
          UN_NOMBRE: un.UN_NOMBRE || `${un.ID_UN} - ${un.NOMBRE}`,
          NOMBRE: un.NOMBRE,
          ID_UN_SUPERIOR: un.ID_UN_SUPERIOR,
        });
      });

      this.UnsDisponibles = flatArray;
      
      this.updateUnsData();
    }

  aceptarSeleccionUNs(){
    try{
      this.UNsSeleccionadasCompletas = this.UnsDisponibles
      .filter((un: any) => this.UNsSeleccionadas.includes(un.ID_UN))
      .map((un: any) => ({
        ID_UN: this.documentoData?.ID_UN || '',
        ID_DOCUMENTO: this.documentoData?.ID_DOCUMENTO || '',
        ID_UN_ASOCIADA: un.ID_UN,
        NOMBRE: un.NOMBRE || un.UN_NOMBRE || ''
      }));

      this.emitDataChange();

      if (this.asociarUNs?.instance) {
        this.asociarUNs.instance.close();
      }
    }catch (error) {
      console.error('❌ Error en aceptarSeleccionUNs:', error);
    }
    
  }

  // GRilla
  
  selectionGridUN(e: any): void {
    if (!this.gridRefUn?.instance) {
      console.warn("Grid UN no está disponible");
      return;
    }

    try {
      if (!this.gridRefUn.instance.hasEditData()) {
        this.filasSelecc = e.selectedRowKeys || [];
        
        if (this.filasSelecc.length > 0) {
          if (this.filasSelecc.length === 1) {
            const rowIndex = e.component.getRowIndexByKey(this.filasSelecc[0]);
            this.filasSelecc = [rowIndex];
            this.rowEditUN = true;
          } else {
            this.rowEditUN = false;
          }
          this.rowDeleteUN = true;
        } else {
          this.rowDeleteUN = false;
          this.rowEditUN = false;
        }
        
      } else {
        this.rowDeleteUN = false;
        this.rowEditUN = false;
      }
    } catch (error) {
      console.error("Error en selección UN:", error);
      this.resetSelection();
    }
  }

  // Función original de operaciones
  operGridUN(event: any, accion: string): void {
    if (!this.gridRefUn?.instance) {
      console.error("Grid UN no disponible");
      return;
    }

    const gridInstance = this.gridRefUn.instance;

    try {
      switch (accion) {
        case 'new':
          gridInstance.addRow();
          this.rowNewUN = false;
          this.rowDeleteUN = false;
          this.rowApplyChangesUN = true;
          this.rowEditUN = false;
          break;
          
        case 'edit':
          if (this.filasSelecc?.length === 1) {
            gridInstance.editRow(this.filasSelecc[0]);
            this.rowApplyChangesUN = true;
            this.rowNewUN = false;
            this.rowDeleteUN = false;
            this.rowEditUN = false;
            gridInstance.clearSelection();
          }
          break;
          
        case 'save':
          gridInstance.saveEditData().then(() => {
            this.resetButtonStates();
            this.emitDataChange();
            console.log('Datos guardados correctamente');
          }).catch((error) => {
            console.error("Error al guardar:", error);
          });
          break;
          
        case 'cancel':
          gridInstance.cancelEditData();
          this.resetButtonStates();
          this.updateButtonsBasedOnSelection();
          break;
          
        case 'delete':
          this.deleteSelectedRows();
          break;

        default:
          console.warn(`Acción ${accion} no reconocida`);
      }
    } catch (error) {
      console.error("Error en operación UN:", error);
    }
  }

  // Función original de inserción
  onGridRowInsertingUN(e: any): void {
    const data = e.data; 
    data.ID_UN = this.documentoData.ID_UN;
    data.ID_DOCUMENTO = this.documentoData.ID_DOCUMENTO;

    this.rowApplyChangesUN = true; 
  }

  
  
  
  private resetButtonStates(): void {
    this.rowApplyChangesUN = false;
    this.rowNewUN = true;
    this.rowEditUN = false;
    this.rowDeleteUN = false;
  }

  private resetSelection(): void {
    this.filasSelecc = [];
    this.rowEditUN = false;
    this.rowDeleteUN = false;
  }

  private updateButtonsBasedOnSelection(): void {
    if (this.filasSelecc.length > 0) {
      this.rowEditUN = this.filasSelecc.length === 1;
      this.rowDeleteUN = true;
    } else {
      this.rowEditUN = false;
      this.rowDeleteUN = false;
    }
  }


  private emitDataChange(): void {
    this.dataChanged.emit(this.UNsSeleccionadasCompletas);
  }

  private deleteSelectedRows(): void {
    if (!this.filasSelecc || this.filasSelecc.length === 0) {
      console.log('Seleccione al menos una fila para eliminar.');
      return;
    }

    Swal.fire({
    title: '',
    text: '¿Desea eliminar los items seleccionados?',
    iconHtml: "<i class='icon-alert-ol'></i>",
    showCancelButton: true,
    confirmButtonColor: '#DF3E3E',
    cancelButtonColor: '#438ef1',
    cancelButtonText: 'No',
    confirmButtonText: 'Sí, eliminar'
  }).then((result) => {
    if (result.isConfirmed) {
      try {
        const selectedRowsData = this.gridRefUn.instance.getSelectedRowsData();
    
        const idsToRemove: string[] = [];
        for (let i = selectedRowsData.length - 1; i >= 0; i--) {
           const rowToDelete = selectedRowsData[i];
        
          // Guardar el ID_UN_ASOCIADA para eliminarlo de UNsSeleccionadas
          if (rowToDelete.ID_UN_ASOCIADA) {
            idsToRemove.push(rowToDelete.ID_UN_ASOCIADA);
          }
          
          
          // Buscar por referencia exacta en memoria
          const index = this.UNsSeleccionadasCompletas.indexOf(rowToDelete);

          if (index !== -1) {
            this.UNsSeleccionadasCompletas.splice(index, 1);
          } else {
            // Si no encuentra por referencia, buscar por contenido
            const contentIndex = this.UNsSeleccionadasCompletas.findIndex((item: any) => 
              JSON.stringify(item) === JSON.stringify(rowToDelete)
            );
            
            if (contentIndex !== -1) {
              this.UNsSeleccionadasCompletas.splice(contentIndex, 1);
            }
          }
        }

        this.UNsSeleccionadas = this.UNsSeleccionadas.filter(id => 
          !idsToRemove.includes(id)
        );

       
        this.gridRefUn.instance.refresh();
        this.resetButtonStates();
        this.gridRefUn.instance.clearSelection();
        this.filasSelecc = [];
        
        // Emitir cambios al componente padre
        this.emitDataChange();
      } catch (error) {
        console.error("Error al eliminar registros de UN:", error);
        
      }
    }
  });
  }

}
