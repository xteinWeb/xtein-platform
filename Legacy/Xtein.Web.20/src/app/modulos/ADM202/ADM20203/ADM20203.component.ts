import { Component, OnInit, ViewChild } from '@angular/core';
import {
  DxDateBoxModule,
  DxFormComponent,
  DxFormModule,
  DxNumberBoxModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { CListaContabilidad, CListaIdetificacion } from '../clsADM202.class';
import { ADM202Service } from 'src/app/services/ADM202/ADM202.service';
import { validatorRes } from 'src/app/shared/validator/validator';
import { Subject, Subscription } from 'rxjs';
import { XcComboGridComponent } from 'src/app/shared/xc-combo-grid/xc-combo-grid.component';

@Component({
  selector: 'app-ADM20203',
  templateUrl: './ADM20203.component.html',
  styleUrls: ['./ADM20203.component.css'],
  standalone: true,
  imports: [
    DxFormModule,
    DxSelectBoxModule,
    DxDateBoxModule,
    DxValidatorModule,
    DxNumberBoxModule,
    DxTextBoxModule,
    XcComboGridComponent
  ],
})
export class ADM20203Component {
  @ViewChild('formContabilidad', { static: false })
  formContabilidad: DxFormComponent;

  readOnly: boolean = true;
  FContabilidad: CListaContabilidad;
  DActividad: any;
  perfilButton: any;
  conCambios: number = 0;
  subscriptionReadOnly: Subscription;

  DPerfilTributario: any = [];
  rowsSelectedPerfil: any;

  eventsSubjectPerfilTrib: Subject<any> = new Subject<any>();

  constructor(private sData: ADM202Service) {
    this.subscriptionReadOnly = this.sData.getReadOnly().subscribe((datprm) => {
      this.getReadOnly(datprm);
    });

    this.perfilButton = {
      icon: 'arrowup',
      type: 'default',
      onClick: (e) => {
        this.popupPerfilTributario();
      },
    };
  }

  ngOnInit() {
    this.FContabilidad = {
      ID_TRIBUTARIA: this.sData.D_Contabilidad.ID_TRIBUTARIA ?? '',
      BASE_ACUMULADA:
        this.sData.D_Contabilidad.BASE_ACUMULADA === true ? 'Si' : 'No',
      FECHA_CREACION: this.sData.D_Contabilidad.FECHA_CREACION ?? '',
      FECHA_INIC_CONTABLE: this.sData.D_Contabilidad.FECHA_INIC_CONTABLE ?? '',
      PERIODO: this.sData.D_Contabilidad.PERIODO ?? '',
    };
    this.valoresObjetos('perfiles tributarios');
  }

  valoresObjetos(obj: string) {
    if (obj == 'perfiles tributarios' || obj == 'todos') {
      const prm = {};
      this.sData
        .consulta('PIV PERFIL TRIBUTARIO', prm, 'generales')
        .subscribe((data: any) => {
          const res = JSON.parse(data.data);
          if (data.token != undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }

          // Envia datos al perfil
          this.DPerfilTributario = res;
        });
    }
  }

  onKeyDownPerfil(e: any) {
    e.event.preventDefault();
    return false;
  }

  popupPerfilTributario() {
    // Ubica el item, construyendo uno concatenado en la lista general de PT
    const cols = JSON.parse(
      this.DPerfilTributario[0].PERFIL_TRIBUTARIO[0].COLUMNAS
    );
    var perfilArray: any = [];
    var elemperf = '';
    this.DPerfilTributario[0].PERFIL_TRIBUTARIO.forEach((elpt) => {
      elemperf = '';
      cols.forEach((elept) => {
        elemperf +=
          (elemperf !== '' ? '|' : '') +
          [elept.dataField] +
          ':' +
          elpt[elept.dataField];
      });
      perfilArray.push(elemperf);
    });
    const seleccPerfil = this.FContabilidad.ID_TRIBUTARIA.split('~')[0];
    this.rowsSelectedPerfil = [{ ITEM: perfilArray.indexOf(seleccPerfil) }];

    const dataConfig = JSON.parse(
      this.DPerfilTributario[0].PERFIL_TRIBUTARIO[0].COLUMNAS
    );
    const dataConfigAlt = [
      { dataField: 'ID_TASA', caption: 'Id Tasa', width: '200' },
      { dataField: 'DESCRIPCION', caption: 'Nombre' },
      {
        dataField: 'PORCENTAJE',
        caption: '%',
        alignment: 'right',
        format: '0.00',
      },
      {
        dataField: 'VALOR_BASE',
        caption: 'Base',
        alignment: 'right',
        format: '#,##0',
      },
      {
        dataField: 'APLICA_BASE',
        caption: 'Aplica Base',
        alignment: 'left',
        editable: 'true',
      },
      {
        dataField: 'CLASE',
        caption: 'Clase',
        groupIndex: '0',
        templateGroup: ['CLASE'],
      },
    ];
    var seleccTasas: any = [];
    this.DPerfilTributario[0].LISTA_TASAS.forEach((eletasa) => {
      eletasa.PORCENTAJE = eletasa.PORCENTAJE * 100;
      eletasa.APLICA_BASE = false;
      if (this.FContabilidad.PERFIL_TASAS) {
        const ix = this.FContabilidad.PERFIL_TASAS.findIndex(
          (t) => t.ID_TASA === eletasa.ID_TASA
        );
        if (ix !== -1) {
          eletasa.APLICA_BASE =
            this.FContabilidad.PERFIL_TASAS[ix].APLICA_BASE;
          seleccTasas.push({
            ID_TASA: this.FContabilidad.PERFIL_TASAS[ix].ID_TASA,
          });
        }
      }
    });
    this.eventsSubjectPerfilTrib.next({
      dataSource: this.DPerfilTributario[0].PERFIL_TRIBUTARIO,
      rowsSelected: this.rowsSelectedPerfil,
      keyExpr: ['ITEM'],
      titGrid: 'Asociación de Perfiles Tributarios',
      modoSelection: 'single',
      colsConfig: dataConfig,
      container: 'tab',
      style: { height: 400, width: 800 },
      datosAlt: {
        dataSource: this.DPerfilTributario[0].LISTA_TASAS,
        rowsSelected: seleccTasas,
        keyExpr: ['ID_TASA'],
        titGrid: 'Asociación de Tasas',
        colsConfig: dataConfigAlt,
        modoSelection: 'multiple',
      },
    });
  }

  // Recibe los datos del selectbox perfil tributario
  onRespuestaPerfilTrib(e: any) {
    // Solo se procesa si es en modo edición
    if (this.readOnly) return;

    if (e !== 'refrescar') {
      // Perfil tributario
      const cols = JSON.parse(e.rowsSelected[0].COLUMNAS);
      var perfil: any = [];
      var busqperf: string = "";
      cols.forEach(elept => {
        perfil.push({ [elept.dataField]: e.rowsSelected[0][elept.dataField] });
        busqperf += (busqperf !== "" ? "|" : "") + [elept.dataField] + ':' + e.rowsSelected[0][elept.dataField];
      });

      // Tasas 
      if (e.rowsSelectedAlt)
        this.FContabilidad.PERFIL_TASAS = e.rowsSelectedAlt.map(({ ID_TASA, APLICA_BASE }) => ({ ID_TASA, APLICA_BASE }));
      else
        this.FContabilidad.PERFIL_TASAS = [];
      this.FContabilidad.ID_TRIBUTARIA = busqperf + (this.FContabilidad.PERFIL_TASAS.length !== 0 ? '~' + e.rowsSelectedAlt.map(t => t.ID_TASA + '^' + (t.APLICA_BASE ? 1 : 0)).join('|') : '');
      this.conCambios++;

    }
  }

  getReadOnly(datprm: any) {
    this.readOnly = datprm;
  }

  onValueChangedForm(e: any, campo: string) {
    if (e.value !== '') {
      switch (campo) {
        case 'ID_TRIBUTARIA':
          this.sData.D_Contabilidad.ID_TRIBUTARIA = e.value;
          break;
        case 'FECHA_CREACION':
          this.sData.D_Contabilidad.FECHA_CREACION = e.value;
          break;
        case 'FECHA_INIC_CONTABLE':
          this.sData.D_Contabilidad.FECHA_INIC_CONTABLE = e.value;
          break;
        case 'BASE_ACUMULADA':
          this.sData.D_Contabilidad.BASE_ACUMULADA = e.value === 'Si' ? true : false;
          break;
        case 'PERIODO':
          this.sData.D_Contabilidad.PERIODO = e.value;
          break;

        default:
          break;
      }
    }
  }
}
