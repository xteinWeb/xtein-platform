import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent, DxDataGridModule, DxDropDownBoxModule, DxFormModule, DxSwitchModule } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { clsUbicaciones } from 'src/app/modulos/CXP200/clsCXP200.class';
import { UbicacionesService } from './service/ubicaciones.service';
import { CXP200Service } from 'src/app/services/CXP200/s_CXP200.service';

@Component({
  selector: 'ubicaciones-component',
  templateUrl: './ubicaciones.component.html',
  styleUrls: ['./ubicaciones.component.css'],
  standalone: true,
  imports: [DxFormModule, DxDropDownBoxModule, DxDataGridModule, DxSwitchModule]
})
export class UBICACIONESComponent implements OnInit {
  @Input() DataUbicaciones: any;
  @ViewChild('datagridUbicaciones', { static: false }) gridUbicaciones: DxDataGridComponent;

  subscription: Subscription;
  prmUsrAplBarReg: clsBarraRegistro;
  mnuAccion: string;

  openActividad: boolean = false;
  openCiudad: boolean = false;
  openBarrio: boolean = false;
  readOnly: boolean = true;
  
  selectActividad: any[] = [];
  selectCiudad: any[] = [];
  selectBarrio: any[] = [];
  selectUbicacion: any[] = [];
  selectTelefono: any[] = [];

  DActividad: any = [];
  DCiudad: any = [];
  DBarrio: any = [];
  DUbicacion: any = [];
  Dtelefono: any = [];

  FUbicaciones: clsUbicaciones;

  constructor( 
    private UbicacionesService: UbicacionesService,
    private _sdatos: CXP200Service
  ) {
    // Recibe de principal
    this.subscription = this.UbicacionesService
      .getObj_Ubicaciones()
      .subscribe((datprm) => {
        // Ejecuta de acuerdo al parámetro
        this.operCompo(datprm);
      })
  }
  
  ngOnInit(): void {
    this.valoresObjetos('todos');
    this.operCompo({ accion: 'r_numreg' });
    
    if ( this.DataUbicaciones??'' != '' ) {
      this.selectActividad = [this.DataUbicaciones.id_actividad];
      this.DUbicacion = this.DataUbicaciones.ubicaciones;
      this.Dtelefono = this.DataUbicaciones.telefonos;
    }
  }

  // Llama a Acciones de registro
  operCompo(data: any): void {
    switch (data.accion) {

      case "r_ini":
        break;

      case "r_listar":
        this.readOnly = false;
        this.DUbicacion = data;
        break;

      case "r_nuevo":
        this.mnuAccion = "new";
        this.readOnly = false;
        this.opPrepararNuevo();
        break;

      case "r_modificar":
        this.opPrepararModificar();
        break;

      case "r_guardar":
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case "r_buscar":
        this.opPrepararBuscar('');
        break;

      case "r_buscar_ejec":
        this.opBlanquearForma();
        this.opPrepararBuscar('');
        break;

      case "r_eliminar":
        this.opEliminar();
        break;

      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
        this.selectActividad = data.id_actividad;
        this.DUbicacion = data.ubicaciones;
        this.Dtelefono = data.telefonos;
        break;

      case "r_cancelar":
        this.readOnly = true;
        break;

      case "r_refrescar":
        this.gridUbicaciones.instance.repaint();
        break;

      default:
        break;
    }
  }

  onSelectionActividad(e) {
    this.openActividad = false;
  }

  onSelectionCiudad(e) {
    this.openCiudad = false;
    this.FUbicaciones.NOM_CUIDAD = e.selectedRowsData[0].NOMBRE;
    this.DUbicacion.NOM_CUIDAD = e.selectedRowsData[0].NOMBRE;
  }

  onSelectionBarrio(e) {
    this.openBarrio = false;
  }

  onSelectionUbicaciones1(e) {
    this.openActividad = false;
  }

  onSelectionUbicaciones2(e) {
    this.openActividad = false;
  }

  opPrepararNuevo() {
    this.readOnly = false;
    this.opBlanquearForma();
  }

  opBlanquearForma() {
    this.FUbicaciones = {
      ID_GRUPO: '',
      NOMBRE: '',
      ASIGNABLE: '',
      ID_DIRECCION: '',
      TIPO_DIRECCION: '',
      TIPO_NOMENCLATURA: '',
      NOMENCLATURA: '',
      NUMERO1: '',
      NUMERO2: '',
      DOMICILIO: '',
      CIUDAD: '',
      NOM_CUIDAD: '',
      BARRIO: '',
      NOM_BARRIO: '',
      REFERENCIA: '',
      ID_TELEFONO: '',
      TIPO_TELEFONO: '',
      TELEFONO: '',
      EXTENSION: ''
    };

  }

  opPrepararModificar() {
    this.readOnly = false;
    this.mnuAccion = "update";
  }

  opPrepararGuardar(accion) {}
  opPrepararBuscar(oper) {}
  opEliminar() {}
  // Busqueda de datos
  opIrARegistro(acc) {
    
  }

  // Cargue de datos de la aplicacion
  valoresObjetos(obj: string){  
    if (obj == 'actividades' || obj == 'todos') {
      const prm = { };
      this._sdatos.consulta('GRUPOS',prm,'CXP001').subscribe((data: any)=> {
        const res = JSON.parse(data);
        const newArray = res.filter(e => e.ASIGNABLE === true);
        this.DActividad = newArray;
      });
    }
    if (obj == 'cuidades' || obj == 'todos') {
      const prm = { TIPO_UBICACION:"CIUDAD" };
      this._sdatos.consultaCiudades('consulta',prm,'CXP001').subscribe((data: any)=> {
        const res = JSON.parse(data);
        this.DCiudad = res;
      });
    }

  }


}
