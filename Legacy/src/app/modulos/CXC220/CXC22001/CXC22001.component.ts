import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DxDataGridModule, DxLoadPanelModule } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import { lastValueFrom } from 'rxjs';
import { CXC220Service } from 'src/app/services/CXC220/CXC220.service';

@Component({
  selector: 'app-CXC22001',
  templateUrl: './CXC22001.component.html',
  styleUrls: ['./CXC22001.component.scss'],
  standalone: true,
  imports: [ CommonModule, DxDataGridModule, DxLoadPanelModule]
})
export class CXC22001Component {

  DSolicitudCredito: any = [];
  empresa: string;
  loadingVisible: boolean = false;
  pageSize = 50;
  dataSource: any;

  constructor(private _sdatos: CXC220Service) 
    {
    }
  
  valoresObjetos(obj: string, opcion: any = undefined) {

    if (obj === 'consulta') {
      this.loadingVisible = true;
      // const prm = { ID_APLICACION : 'CXC-220', 
      //               USUARIO: localStorage.getItem('usuario')};
      // this._sdatos
      //   .consulta('consulta', prm, 'CXC-220')
      //   .subscribe({
      //     next: (data: any) => {
      //       this.loadingVisible = false;
      //       const res = JSON.parse(data.data);
      //       if ( (data.token != undefined) ){
      //         const refreshToken = data.token;
      //         localStorage.setItem("token", refreshToken);
      //       }
      //       this.DSolicitudCredito = res;
      //     },
      //     error: (err) => {
      //       alert("Error en la consulta: " + err.message);
      //     },
      //   });

        const store = new CustomStore ({
              key: ["DOCUMENTO"], // clave compuesta
              load: (loadOptions: any) => {
                const page = (loadOptions.skip || 0) / (loadOptions.take || this.pageSize) + 1;
                const pageSize = loadOptions.take || this.pageSize;

                // Armar el DATA_JSON con filtros/llaves que necesites
                const dataJson = { 
                  ID_APLICACION : 'CXC-220', 
                  USUARIO: localStorage.getItem('usuario')
                };

                const apiRest = this._sdatos.loadPage(dataJson, "CXC-220", page, pageSize);
                return lastValueFrom(apiRest, {defaultValue: true}).then((res: any) => {
                    // la respuesta debe tener { Header, Items, TotalCount }
                    const items = JSON.parse(res.data) || [];
                    const total = items[0].TotalFilas || 0;
                    // opcional: actualizar UI con header si necesitas
                    // this.header = res.Header;
                    this.loadingVisible = false;
                    return { data: items, totalCount: total };
                  }
                );
              }
            });

            this.DSolicitudCredito = new DataSource({ store });
  
    }

  }  

  ngOnInit(): void {
    const user:any = localStorage.getItem('usuario');
    this.empresa = localStorage.getItem('empresa')??'';
  }

  ngAfterViewInit(): void { 

    setTimeout(() => {
      this.valoresObjetos('consulta');
    }, 300);

  }

  ngOnDestroy(){
  }

  abrirDocumento(doc: string) {
    console.log("Documento seleccionado:", doc);

    // Aquí puedes navegar a otro componente Angular:
    // this.router.navigate(['/detalle-documento', doc]);

    // O mostrar un popup, dialog, etc.
    alert("Abrir componente para: " + doc);
  }

}
