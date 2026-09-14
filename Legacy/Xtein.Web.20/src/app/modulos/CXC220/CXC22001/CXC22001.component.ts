import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DxDataGridModule, DxLoadPanelModule } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import { lastValueFrom, Observable } from 'rxjs';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
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

  @Input() events: Observable<any>;
  @Output() onRespuestaCon = new EventEmitter<any>();

  constructor(private _sdatos: CXC220Service
            )
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
      //       this.loadingVisible = false;
      //       alert("Error en la consulta: " + err.message);
      //     },
      //   });

      /*
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
      */

      this.DSolicitudCredito = new CustomStore({
        key: "DOCUMENTO",

        load: (loadOptions: any) => {
          const skip = loadOptions.skip || 0;
          const take = loadOptions.take || 50;
          const page = (loadOptions.skip || 0) / (loadOptions.take || this.pageSize) + 1;
          const pageSizeTmp = loadOptions.take || this.pageSize;
          const searchValue = loadOptions.searchValue || '';

          let textoBusqueda = '';
          if (loadOptions.filter) {
            // Buscamos el primer elemento que sea un array y extraemos el tercer valor (el texto)
            const filterArray = loadOptions.filter;
            if (Array.isArray(filterArray[0])) {
                textoBusqueda = filterArray[0][2];
            } else {
                // Si es un filtro simple
                textoBusqueda = filterArray[2];
            }
          }

          const prm = { ID_APLICACION : 'CXC-220',
                        USUARIO: localStorage.getItem('usuario'),
                        SKIP: skip,
                        TAKE: take,
                        SEARCH: textoBusqueda,
                        DATA: {},
                        CAMPO: '',
                        PAGE: page,
                        PAGESIZE: pageSizeTmp
                      };

          return lastValueFrom(
            this._sdatos.consulta('listaQuery', prm, 'CXC-220'), {defaultValue: true}
          ).then((result) => {
            const total = JSON.parse(result.data)[0].TotalCount || 0;
            const items = JSON.parse(result.data) || [];
            this.loadingVisible = false;
            return {
              data: items,
              totalCount: total
            };
          }).catch(error => {
            console.error('Error loading data:', error);
            throw error;
          });
        },

        byKey: (key: any) => {
          // Cargar un item específico por su clave
          return lastValueFrom(
            this._sdatos.consulta('listaQuery', '{'+key+'}', 'CXC-220')
          ).then(result => {
            const items = JSON.parse(result.data) || [];
            return {
                data: items,
                totalCount: items[0]?.TotalCount || 0
              };
            }
          );
        }
      });

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

  onCellClick(e) {
    if (e.row === undefined) return;
    if (e.row.cells[e.columnIndex].column.dataField === 'DOCUMENTO') {
        const compoApl = {accion: "consulta",
                          dato: { DOCUMENTO: e.row.data.DOCUMENTO,
                                  ID_CLIENTE: e.row.data.ID_CLIENTE,
                                  CALIDAD: 'TITULAR'
                                }
                        }
        this.onRespuestaCon.emit(compoApl);
    }
  }

}
