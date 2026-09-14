import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule, DxButtonModule, DxAutocompleteModule, DxDateBoxModule, DxSelectBoxModule, DxTreeListModule, DxNumberBoxModule, DxLoadPanelModule, DxPopupModule } from 'devextreme-angular';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { PRO035Service } from 'src/app/services/PRO035/PRO035.service';
import { validatorRes } from 'src/app/shared/validator/validator';
import { showToast } from '../../../shared/toast/toastComponent';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { FiltrobusqComponent } from 'src/app/shared/filtrobusq/filtrobusq.component';

@Component({
  selector: 'app-pro036',
  templateUrl: './pro036.component.html',
  styleUrls: ['./pro036.component.css'],
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxButtonModule, DxAutocompleteModule, DxDateBoxModule, DxSelectBoxModule, DxTreeListModule, DxNumberBoxModule, DxLoadPanelModule, DxPopupModule, FiltrobusqComponent]
})
export class PRO036Component implements OnInit, OnDestroy {

  fechaActual: Date | string | number = new Date();
  fechaFinal: Date | string | number = new Date();
  selectedAgendaItems: any[] = [];
  selectedAgendaKeys: any[] = [];

  readOnly: boolean = true;
  loadingVisible: boolean = false;
  activeConsults: number = 0;

  startLoading() {
    this.activeConsults++;
    this.loadingVisible = true;
  }

  stopLoading() {
    this.activeConsults--;
    if (this.activeConsults <= 0) {
      this.activeConsults = 0;
      this.loadingVisible = false;
    }
  }
  prmUsrAplBarReg!: clsBarraRegistro;
  unSubscribe: Subject<boolean> = new Subject<boolean>();
  subscription!: Subscription;
  subs_filtro: any;
  USUARIO_LOCAL: any = '';
  mnuAccion: string = '';

  plantas: any[] = [];
  selectedPlanta: any = null;
  agendaData: any[] = [];
  consecutivo: string = '';
  mdpProgramadoData: any[] = [];
  capPlanta: number = 0;
  mensajeCapacidadError: string = '';
  collapsed0: boolean = false;
  collapsed1: boolean = false;
  collapsed2: boolean = false;

  VDatosReg: any[] = [];
  registroActualData: any[] = [];
  QFiltro: string = '';

  plantasParam: any[] = [];

  modalSeccionesVisible: boolean = false;
  seccionesProductoData: any[] = [];
  selectedSeccionesItems: any[] = [];

  modalErroresVisible: boolean = false;
  erroresDuplicadosData: any[] = [];
  mensajeErrorPrincipal: string = '';

  // notificaciones y alerts
  toaVisible: boolean;
  toaPosicion: string;
  toaMessage: string = "Registro actualizado!";
  toaTipo: string = 'success';
  objToasPosiciones: string[] = [
    'top left', 'top center', 'top right',
    'bottom left', 'bottom center', 'bottom right',
    'left center', 'center', 'right center',
  ];

  eventsSubjectFiltro: Subject<any> = new Subject<any>();

  constructor(
    private _sbarreg: SbarraService,
    private sData: PRO035Service,
    public cdr: ChangeDetectorRef,
    private el: ElementRef,
    private _sfiltro: SfiltroService,
    private tabService: TabService,
  ) {
    this.subs_filtro = this._sfiltro.setObsFiltro.pipe().subscribe(resp => {
      console.log("resp", resp);
      const dfiltro = JSON.parse(resp);
      if (dfiltro.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opPrepararBuscar(resp);
    });
  }

  ngOnInit() {
    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase() || '';

    this.prmUsrAplBarReg = {
      tabla: 'MDP',
      aplicacion: 'PRO-036',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_modificar: true }
    };

    this.subscription = this._sbarreg.getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((datreg) => {
        if ((datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)) {
          this.opMenuRegistro(datreg);
        }
      });

    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    // this.ejecutarFunciones();
  }


  opMenuRegistro(operMenu: clsBarraRegistro): void {

    console.log(operMenu.accion);
    switch (operMenu.accion) {
      case "r_ini":
        this.prmUsrAplBarReg = {
          ...this.prmUsrAplBarReg,
          accion: "r_ini",
          error: "",
          operacion: { r_modificar: true }
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.cdr.markForCheck();
        break;

      case 'r_nuevo':
        this.mnuAccion = "new";
        this.loadPlantas();
        this.mdpProgramadoData = [];
        this.capPlanta = 0;
        this.mensajeCapacidadError = '';
        this.vaciarDatos();
        this.obtenerConsecutivo();
        this.readOnly = false;
        this.prmUsrAplBarReg.accion = 'r_nuevo';
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.cdr.markForCheck();
        break;

      case "r_modificar":
        this.opPrepararModificar();
        this.cdr.markForCheck();
        break;

      case "r_cancelar":
        import('sweetalert2').then(Swal => {
          Swal.default.fire({
            title: '¿Cancelar Edición?',
            text: 'Se perderán los cambios no guardados.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DF3E3E',
            cancelButtonText: 'No',
            confirmButtonText: 'Sí, cancelar'
          }).then((result) => {
            if (result.isConfirmed) {
              this.readOnly = true;
              this.prmUsrAplBarReg.accion = 'r_ini';
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
              // this.cargarAgenda();
              this.selectedPlanta = null;
              this.consecutivo = '';
              this.cdr.markForCheck();
            }
          });
        });
        break;

      case "r_guardar":
        showToast('MDP guardado correctamente', 'succes');
        this.readOnly = true;
        this.prmUsrAplBarReg.accion = 'r_ini';
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.vaciarDatos();
        this.cdr.markForCheck();
        break;

      case 'r_refrescar':
        this.ejecutarFunciones();
        break;

      case "r_primero":
      case "r_anterior":
      case "r_siguiente":
      case "r_ultimo":
      case "r_numreg":
        this.opIrARegistro(operMenu.accion);
        break;

      case 'r_buscar':
        if (GlobalVariables.idAplicacionActiva !== this.prmUsrAplBarReg.aplicacion) return;
        if (!this._sfiltro.enConsulta) {
          this.opPrepararBuscar('filtro');
        } else {
          this.toaMessage = 'Consulta en proceso, por favor espere.';
          this.toaVisible = true;
          this.toaPosicion = 'top center';
          this.toaTipo = 'warning';
          showToast('Consulta en proceso, por favor espere.', 'warning');
        }
        break;

      case 'r_buscar_ejec':
        this.vaciarDatos();
        if (operMenu.operacion.filtro_arg) {
          this.opPrepararBuscar(operMenu.operacion.filtro_arg);
        } else {
          if (!this._sfiltro.enConsulta) {
            this.opPrepararBuscar('');
          } else {
            showToast('Consulta en proceso, por favor espere.', 'warning');
          }
        }
        break;

      default:
        break;
    }
  }

  opIrARegistro(accion: string): void {
    this.prmUsrAplBarReg.accion = "r_numreg";
    switch (accion) {
      case "r_primero":
        this.prmUsrAplBarReg.r_numReg = 1;
        break;

      case "r_anterior":
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg <= 1 ? 1 : this.prmUsrAplBarReg.r_numReg - 1;
        break;

      case "r_siguiente":
        this.prmUsrAplBarReg.r_numReg = this.prmUsrAplBarReg.r_numReg >= this.VDatosReg.length ? this.VDatosReg.length : this.prmUsrAplBarReg.r_numReg + 1;
        break;

      case "r_ultimo":
        this.prmUsrAplBarReg.r_numReg = this.VDatosReg.length;
        break;

      case "r_numreg":
        // usar r_numReg actual
        break;
      default:
        break;
    }

    if (this.VDatosReg.length > 0 && this.prmUsrAplBarReg.r_numReg > 0) {
      const idx = this.prmUsrAplBarReg.r_numReg - 1;
      const registro = this.VDatosReg[idx];

      this.registroActualData = [registro];

      this.consecutivo = registro.CONSECUTIVO_DIARIO || registro.CONSECUTIVO || '';
      this.selectedPlanta = registro.ID_UN_ITEM || registro.ID_PLANTA || null;

      if (registro.FECHA_INICIO_PROGRAMADA) {
        this.fechaActual = new Date(registro.FECHA_INICIO_PROGRAMADA);
      }
      if (registro.FECHA_FIN_PROGRAMADA) {
        this.fechaFinal = new Date(registro.FECHA_FIN_PROGRAMADA);
      }

      this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      this.ejecutarFunciones();
    } else {
      this.registroActualData = [];
      this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
      this.vaciarDatos();
    }
  }

  vaciarDatos() {
    this.agendaData = [];
    this.plantas = [];
    this.selectedPlanta = null;
    this.consecutivo = '';
    this.capPlanta = 0;
    this.mensajeCapacidadError = '';
  }

  opPrepararModificar(): void {
    this.mnuAccion = "update";
    console.log("se ejecuta");
    this.cargarAgenda();
    this.readOnly = false;
  }

  ngOnDestroy() {
    if (this.subs_filtro) this.subs_filtro.unsubscribe();
    this.unSubscribe.next(true);
    this.unSubscribe.complete();
  }


  ejecutarFunciones() {
    this.loadPlantas();
    this.cargarAgenda();
    this.cargarMDPProgramado();

  }

  loadPlantas() {
    this.startLoading();
    const prm = { USUARIO: this.USUARIO_LOCAL };

    this.sData.consulta('plantas', prm, 'pro032').subscribe((data: any) => {
      this.stopLoading();
      const res = validatorRes(data);
      if (res[0].ErrMensaje && res[0].ErrMensaje !== '') {
        showToast(res[0].ErrMensaje, 'error');
        this.plantas = [];
      } else {
        this.plantas = res;
      }
      this.cdr.markForCheck();
    }, (err) => {
      this.stopLoading();
      showToast('Error al cargar plantas', 'error');
      this.cdr.markForCheck();
    });
  }

  obtenerConsecutivo() {
    this.startLoading();
    this.sData.consulta('consecutivo', {}, 'pro032').subscribe((res: any) => {
      this.stopLoading();
      if (res && res.data) {
        this.consecutivo = res.data;
      }
      this.cdr.markForCheck();
    }, (err) => {
      this.stopLoading();
      this.cdr.markForCheck();
    });
  }

  cargarMDPProgramado() {
    this.startLoading();
    const prm = { CONSECUTIVO: this.consecutivo };

    this.sData.consulta('mdp programado', prm, 'pro032').subscribe((data: any) => {
      const res = validatorRes(data);
      if (res && !res[0]?.ErrMensaje) {
        const groupedMap = new Map<string, any>();
        const finalData: any[] = [];

        res.forEach((item: any) => {
          const seccionActualCode = item.ID_SECCION || item.SECCION || '';
          const descripcion = item.DESCRIPCION_SECCION || seccionActualCode || 'Sin Sección';
          const seccionId = `S_${seccionActualCode}_${descripcion}`;

          // Nivel 1: Sección
          if (!groupedMap.has(seccionId)) {
            groupedMap.set(seccionId, {
              UNIQUE_ID: seccionId,
              UNIQUE_PARENT: 'RAIZ',
              FECHA: null,
              ID_PARTE: '',
              NOMBRE: item.DESCRIPCION_SECCION || seccionActualCode || 'Sin Sección',
              CANTIDAD: null,
              ID_SECCION: seccionActualCode,
              ESTADO: null,
              ORDEN_PRO: null
            });
            finalData.push(groupedMap.get(seccionId));
          }

          // Nivel 2: Producto
          const productoId = `P_${item.PRODUCTO}_${seccionId}_${item.NC_PEDIDO}_${item.ORDEN_PRO}`;
          if (!groupedMap.has(productoId)) {
            groupedMap.set(productoId, {
              UNIQUE_ID: productoId,
              UNIQUE_PARENT: seccionId,
              FECHA: item.FECHA,
              ID_PARTE: item.PRODUCTO,
              NOMBRE: item.NOMBRE_PRODUCTO || item.NOMBRE_PADRE || item.NOMBRE || `OP: ${item.ORDEN_PRO} - Pedido: ${item.NC_PEDIDO}`,
              CANTIDAD: null,
              ID_SECCION: '',
              ESTADO: null,
              ORDEN_PRO: item.ORDEN_PRO
            });
            finalData.push(groupedMap.get(productoId));
          }

          // Nivel 3: Detalle (Parte)
          const child = { ...item };
          child.NOMBRE = item.NOMBRE_PARTE || item.NOMBRE;
          child.UNIQUE_ID = `C_${item.ITEM}_${item.CONSECUTIVO}`;
          child.UNIQUE_PARENT = productoId;
          finalData.push(child);
        });

        const itemsCapacidad = res.map((item: any) => ({
          ID_PARTE: item.ID_PARTE || item.PRODUCTO || '',
          ID_SECCION: item.ID_SECCION || item.SECCION || '',
          CANTIDAD_ENTRADA: item.CANTIDAD || item.CANTIDAD_PROGRAMADA || item.CANT_PROGRAMAR || 0
        }));

        const prmCap = {
          CONSECUTIVO: this.consecutivo,
          DATOS: itemsCapacidad,
          DETALLE: itemsCapacidad,
          ITEMS: itemsCapacidad
        };

        // Cargar capacidad desde el backend para enriquecer los datos
        this.sData.consulta('capacidad', itemsCapacidad, 'pro032').subscribe({
          next: (capData: any) => {
            this.stopLoading();
            this.mensajeCapacidadError = '';
            try {
              // Si la respuesta en texto plano crudo contiene el texto del mensaje de secciones sin capacidad
              if (capData && typeof capData.data === 'string' && capData.data.startsWith('No existen estas secciones con capacidad')) {
                this.mensajeCapacidadError = capData.data;
              }

              const capRes = validatorRes(capData);
              if (capRes && capRes[0] && !capRes[0]?.ErrMensaje) {
                this.capPlanta = capRes[0].CAP_PLANTA || 0;
                const capSecciones = capRes[0].CAP_SECCION || [];

                capSecciones.forEach((cap: any) => {
                  const capSeccionCode = cap.ID_SECCION || cap.SECC_RUTA || '';
                  const secNode = finalData.find(node =>
                    node.UNIQUE_PARENT === 'RAIZ' &&
                    node.ID_SECCION &&
                    capSeccionCode &&
                    node.ID_SECCION.toString().trim().toUpperCase() === capSeccionCode.toString().trim().toUpperCase()
                  );
                  if (secNode) {
                    secNode.PDIF = cap.PDIF;
                    secNode.TDIF = cap.TDIF;
                    secNode.TOT_TIEMPO = cap.TOT_TIEMPO;
                    secNode.TOT_TIEMPO_PROG = cap.TOT_TIEMPO_PROG;
                    secNode.TOT_TRA_DISP = cap.TOT_TRA_DISP;
                    secNode.TOT_TRA_REQ = cap.TOT_TRA_REQ;
                  }
                });

                // Si viene WarnMensaje en la respuesta exitosa (advertencia)
                if (capRes[0].WarnMensaje) {
                  this.mensajeCapacidadError = capRes[0].WarnMensaje;
                }
              } else {
                this.capPlanta = 0;
                if (capRes && capRes[0]?.ErrMensaje) {
                  this.mensajeCapacidadError = capRes[0].ErrMensaje;
                }
              }
            } catch (e) {
              console.error('Error al parsear respuesta de capacidad:', e);
              this.capPlanta = 0;
              if (capData && typeof capData.data === 'string') {
                this.mensajeCapacidadError = capData.data;
              } else if (capData && capData.ErrMensaje) {
                this.mensajeCapacidadError = capData.ErrMensaje;
              } else {
                this.mensajeCapacidadError = 'Error al obtener la capacidad de secciones.';
              }
            }
            this.mdpProgramadoData = finalData;
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error al cargar capacidad:', err);
            this.stopLoading();
            this.capPlanta = 0;
            this.mensajeCapacidadError = err?.message || 'Error al conectar con la acción de capacidad';
            this.mdpProgramadoData = finalData;
            this.cdr.markForCheck();
          }
        });

      } else {
        this.stopLoading();
        this.mdpProgramadoData = [];
        this.capPlanta = 0;
        this.cdr.markForCheck();
      }
    }, (err) => {
      this.stopLoading();
      this.mdpProgramadoData = [];
      this.capPlanta = 0;
      this.cdr.markForCheck();
    });
  }

  verificarPlanta() {
    if (this.readOnly || this.mnuAccion !== 'new') {
      if (this.selectedPlanta) {
        this.plantasParam = [{ ID_UN_ITEM: this.selectedPlanta }];
      } else {
        this.plantasParam = [];
      }
      return;
    }

    if (this.selectedPlanta) {
      this.plantasParam = [{ ID_UN_ITEM: this.selectedPlanta }];
    } else {
      this.agendaData = [];
      this.stopLoading();
      this.cdr.markForCheck();
      return;
    }
    this.startLoading();
    const prm = {
      DATOS: this.plantasParam
    };
    this.sData.consulta('verificar planta', prm, 'pro032').subscribe((res: any) => {
      this.stopLoading();
      if (res && res.data != 0) {
        import('sweetalert2').then(Swal => {
          Swal.default.fire({
            title: 'Ya hay un MDP activo para esta planta',
            text: 'Finaliza ese MDP antes de crear uno nuevo.',
            icon: 'warning',
            showCancelButton: false,
            confirmButtonText: 'Aceptar'
          }).then((result) => {
            if (result.isConfirmed) {
              this.selectedPlanta = '';
            }
          });
        });
      } else {
        this.cargarAgenda();
      }

      console.log(res);
      console.log(res.data);

      this.cdr.markForCheck();
    }, (err) => {
      this.stopLoading();
      this.cdr.markForCheck();
    });
  }

  cargarAgenda() {
    // if (this.readOnly) {
    //   this.agendaData = [];
    //   return;
    // }

    this.startLoading();

    if (this.selectedPlanta) {
      this.plantasParam = [{ ID_PLANTA: this.selectedPlanta }];
    } else {
      this.agendaData = [];
      this.stopLoading();
      this.cdr.markForCheck();
      return;
    }

    const prm = {
      USUARIO: localStorage.getItem("usuario")?.toUpperCase(),
      PLANTAS: JSON.stringify(this.plantasParam),
      VISTA: 'Básica'
    };

    this.sData.consulta('cargar agenda', prm, 'pro032').subscribe((data: any) => {
      this.stopLoading();
      const res = validatorRes(data);
      if (!res || res.length === 0) {
        this.agendaData = [];
      } else if (res[0].ErrMensaje && res[0].ErrMensaje !== '') {
        // Si el error es simplemente que no hay datos, no mostramos toast de error
        if (res[0].ErrMensaje.toLowerCase().includes('no se encontraron') || res[0].ErrMensaje.toLowerCase().includes('sin datos')) {
          this.agendaData = [];
        } else {
          showToast(res[0].ErrMensaje, 'error');
          this.agendaData = [];
        }
      } else if (Array.isArray(res)) {
        // 1. Mapeo previo para indexar los ítems existentes por su ID de ITEM base
        const itemsExistentes = new Set(res.map(item => String(item.ITEM_ID).trim()));

        // 2. Primer paso: Crear la lista con IDs únicos compuestos
        const treeData = res.map((item: any, index: number) => {
          const itemBase = String(item.ITEM_ID).trim();
          const itemPadreBase = item.ITEM_PADRE !== null && item.ITEM_PADRE !== undefined ? String(item.ITEM_PADRE).trim() : '-1';
          const productoOParte = (item.ID_PARTE || item.PRODUCTO || '').trim();
          const productoPadre = (item.PRODUCTO || '').trim();

          const idUnicoCompuesto = `${itemBase}_${productoOParte}_${index}`;
          const esRaizEstricta = itemPadreBase === '-1' || item.PRODUCTO === 'RAIZ';

          return {
            ...item,
            PRODUCTO: item.PRODUCTO === 'RAIZ' ? (item.ID_PARTE || item.PRODUCTO) : item.PRODUCTO,
            // Llaves lógicas de control
            itemOriginal: itemBase,
            itemPadreOriginal: itemPadreBase,
            productoOriginal: productoPadre,
            codigoComponente: productoOParte,
            documentoPedido: item.DOCUMENTO_PEDIDO || item.ID_PEDIDO,

            // Propiedades para DevExtreme TreeList
            UNIQUE_ID: idUnicoCompuesto,
            UNIQUE_PARENT: esRaizEstricta ? '-1' : itemPadreBase,

            FECHA: item.FECHA_ENTREGA,
            PEDIDO_OP: item.ID_PEDIDO,
            PENDIENTE: item.CANTIDAD_SALDO,
            CANT_PROGRAMAR: item.CANTIDAD_SALDO,
            SECCION: item.ID_SECCION_ACT,
            SECCION_SIG: item.ID_SECCION_SIG,
            seccionesActuales: this.parsearSecciones(item.ID_SECCION_ACT),
            seccionesSiguientes: this.parsearSecciones(item.ID_SECCION_SIG),
            ES_GRUPO_RAIZ: esRaizEstricta,
            ES_HIJO_RAIZ: !esRaizEstricta
          };
        });

        // 3. Segundo paso: Lógica Avanzada de Vinculación
        treeData.forEach(nodo => {
          if (nodo.UNIQUE_PARENT !== '-1') {
            let nodoPadreReal: any = null;

            // Intento A: Buscar coincidencia directa por ID numérico de ITEM (ITEM_ID / ITEM_PADRE) y mismo pedido/OP
            if (nodo.itemPadreOriginal && nodo.itemPadreOriginal !== '-1' && nodo.itemPadreOriginal !== 'undefined' && nodo.itemPadreOriginal !== 'null') {
              nodoPadreReal = treeData.find(p =>
                p.itemOriginal === nodo.itemPadreOriginal &&
                (p.ID_PEDIDO === nodo.ID_PEDIDO || p.ORDEN_PRODUCCION === nodo.ORDEN_PRODUCCION)
              );
            }

            // Intento B: Si no se encuentra, buscar solo por ID numérico de ITEM
            if (!nodoPadreReal && nodo.itemPadreOriginal && nodo.itemPadreOriginal !== '-1' && nodo.itemPadreOriginal !== 'undefined' && nodo.itemPadreOriginal !== 'null') {
              nodoPadreReal = treeData.find(p => p.itemOriginal === nodo.itemPadreOriginal);
            }

            // Intento C: Mapear por código de producto/parte y pedido (Lógica tradicional de PRO035/PRO036)
            if (!nodoPadreReal) {
              nodoPadreReal = treeData.find(p =>
                p.ES_GRUPO_RAIZ &&
                (p.ID_PARTE === nodo.PRODUCTO || p.productoOriginal === nodo.productoOriginal || p.codigoComponente === nodo.PRODUCTO) &&
                (p.documentoPedido === nodo.documentoPedido || p.PEDIDO_OP === nodo.PEDIDO_OP || p.ID_PEDIDO === nodo.ID_PEDIDO)
              );
            }

            if (nodoPadreReal) {
              nodo.UNIQUE_PARENT = nodoPadreReal.UNIQUE_ID;
            } else {
              nodo.UNIQUE_PARENT = '-1';
              nodo.ES_GRUPO_RAIZ = true;
              nodo.ES_HIJO_RAIZ = false;
            }
          }
        });

        // 4. Tercer paso: Filtrado garantizando la retención de ancestros
        const keptIds = new Set<string>();
        treeData.forEach(item => {
          if (item.ES_GRUPO_RAIZ || item.PENDIENTE > 0) {
            keptIds.add(item.UNIQUE_ID);
          }
        });

        let addedAny = true;
        while (addedAny) {
          addedAny = false;
          treeData.forEach(item => {
            if (keptIds.has(item.UNIQUE_ID) && item.UNIQUE_PARENT !== '-1' && !keptIds.has(item.UNIQUE_PARENT)) {
              keptIds.add(item.UNIQUE_PARENT);
              addedAny = true;
            }
          });
        }

        this.agendaData = treeData.filter((item: any) => keptIds.has(item.UNIQUE_ID));
      } else {
        this.agendaData = [];
      }
      this.cdr.markForCheck();
    }, (err) => {
      this.stopLoading();
      showToast('Error al cargar datos', 'error');
      this.cdr.markForCheck();
    });
  }

  onContextMenuPreparing(e: any) {
    if (e.row && e.row.rowType === 'data') {
      e.items = [{
        text: 'Anular',
        icon: 'remove',
        onItemClick: () => {
          this.anularItem(e.row.data);
        }
      }];
    }
  }

  anularItem(rowData: any) {
    import('sweetalert2').then(Swal => {
      Swal.default.fire({
        title: '¿Anular programación?',
        text: '¿Está seguro que desea anular la programación de este elemento?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DF3E3E',
        cancelButtonText: 'No, cancelar',
        confirmButtonText: 'Sí, anular'
      }).then((result) => {
        if (result.isConfirmed) {
          this.startLoading();
          this.cdr.markForCheck();
          const prm = {
            USUARIO: this.USUARIO_LOCAL,
            CONSECUTIVO: rowData.CONSECUTIVO,
          };
          this.sData.consulta('anular', prm, 'pro032').subscribe((data: any) => {
            this.stopLoading();

            let parsedData: any = null;
            if (data && data.data && typeof data.data === 'string') {
              try { parsedData = JSON.parse(data.data); } catch (e) { }
            } else if (typeof data === 'string') {
              try { parsedData = JSON.parse(data); } catch (e) { }
            }

            let res: any = null;
            try {
              res = validatorRes(data);
            } catch (e) {
              console.error("Error al validar respuesta:", e);
            }
            const errorMsg = (parsedData && (parsedData.ErrMensaje !== undefined && parsedData.ErrMensaje !== null) ? parsedData.ErrMensaje : null) || (res && res[0] && res[0].ErrMensaje) || (res && res.ErrMensaje);

            if (!errorMsg || errorMsg === '') {
              showToast('Elemento anulado con éxito', 'success');
              this.ejecutarFunciones();
            } else {
              showToast(errorMsg || 'Error al anular elemento', 'error');
            }
            this.cdr.markForCheck();
          }, (err) => {
            this.stopLoading();
            showToast('Error de conexión al anular', 'error');
            this.cdr.markForCheck();
          });
        }
      });
    });
  }

  onSelectionChangedAgenda(e: any) {
    const selectedRows = e.selectedRowsData || [];
    const seleccionValida = selectedRows.filter((row: any) => !row?.ES_GRUPO_RAIZ);

    this.selectedAgendaItems = seleccionValida;
    this.selectedAgendaKeys = seleccionValida.map((row: any) => row.UNIQUE_ID);
  }

  onRowPreparedAgenda(e: any) {
    if (e?.rowType === 'data' && e?.data?.ES_GRUPO_RAIZ && e?.rowElement) {
      e.rowElement.classList.add('fila-raiz-no-checkbox');
    }
  }

  get registroActual(): any[] {
    if (this.VDatosReg && this.VDatosReg.length > 0 && this.prmUsrAplBarReg && this.prmUsrAplBarReg.r_numReg > 0) {
      const idx = this.prmUsrAplBarReg.r_numReg - 1;
      return [this.VDatosReg[idx]];
    }
    return [];
  }

  onCellPrepared(e: any) {
    const esColumnaSeleccion = e.column?.command === 'select' || e.column?.type === 'selection';

    if (e.rowType === 'header' && esColumnaSeleccion) {
      // Oculta checkbox de "seleccionar todo" en el encabezado.
      if (e.cellElement) {
        e.cellElement.innerHTML = '';
      }
      return;
    }

    if (e.rowType === 'data' && esColumnaSeleccion && e.data?.ES_GRUPO_RAIZ) {
      const selectCheckbox = e.cellElement?.querySelector('.dx-select-checkbox') as HTMLElement;
      const genericCheckbox = e.cellElement?.querySelector('.dx-checkbox') as HTMLElement;
      if (selectCheckbox) selectCheckbox.style.display = 'none';
      if (genericCheckbox) genericCheckbox.style.display = 'none';

      // En algunos temas de DevExtreme no basta ocultar el control; vaciamos la celda.
      if (e.cellElement) {
        e.cellElement.innerHTML = '';
      }
      e.cellElement.style.pointerEvents = 'none';
      e.cellElement.style.opacity = '1';
      e.cellElement.title = '';
    }
  }

  private parsearSecciones(seccion: any): any[] {
    if (!seccion) return [];
    if (typeof seccion === 'object') {
      return Array.isArray(seccion) ? seccion : [seccion];
    }
    try {
      const parsed = JSON.parse(seccion);
      if (parsed && typeof parsed === 'object') {
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  get minFechaFinal(): Date {
    if (!this.fechaActual) return new Date();
    return new Date(this.fechaActual as Date | string | number);
  }

  get isCamposHeaderBloqueados(): boolean {
    return this.readOnly || (this.mnuAccion === 'new' && this.mdpProgramadoData && this.mdpProgramadoData.length > 0);
  }

  onFechaInicialChanged(e: any) {
    if (!e.value) return;
    this.fechaActual = e.value;

    if (this.fechaActual && this.fechaFinal) {
      const fIni = new Date(this.fechaActual as Date | string | number);
      const fFin = new Date(this.fechaFinal as Date | string | number);
      fIni.setHours(0, 0, 0, 0);
      fFin.setHours(0, 0, 0, 0);

      if (fFin < fIni) {
        setTimeout(() => {
          this.fechaFinal = this.fechaActual;
          this.cdr.markForCheck();
        });
      }
    }
  }

  onFechaFinalChanged(e: any) {
    if (!e.value) return;
    this.fechaFinal = e.value;

    if (this.fechaActual && this.fechaFinal) {
      const fIni = new Date(this.fechaActual as Date | string | number);
      const fFin = new Date(this.fechaFinal as Date | string | number);
      fIni.setHours(0, 0, 0, 0);
      fFin.setHours(0, 0, 0, 0);

      if (fFin < fIni) {
        setTimeout(() => {
          this.fechaFinal = this.fechaActual;
          this.cdr.markForCheck();
        });
      }
    }
  }

  calculateSaldoRestante = (rowData: any) => {
    if (rowData.ES_GRUPO_RAIZ) return null;
    return (rowData.PENDIENTE || 0) - (rowData.CANT_PROGRAMAR || 0);
  }

  private resolverIdUnItem(item?: any): string {
    const fromSelectedPlanta = this.selectedPlanta;
    const fromPlantasParam = this.plantasParam && this.plantasParam[0]
      ? (this.plantasParam[0].ID_PLANTA || this.plantasParam[0].ID_UN_ITEM)
      : '';
    const fromItem = item
      ? (item.ID_UN_ITEM || item.ID_UN_ITEM_ACT || item.ID_PLANTA)
      : '';

    return (fromSelectedPlanta || fromPlantasParam || fromItem || '').toString();
  }

  private obtenerSeccionesActuales(item: any): string[] {
    const rawSecciones = item?.ID_SECCION_ACT ?? item?.SECCION_ACTUAL ?? item?.SECCION ?? [];
    const secciones = this.parsearSecciones(rawSecciones);

    if (!secciones || secciones.length === 0) {
      return rawSecciones ? [rawSecciones.toString()] : [];
    }

    return secciones
      .map((seccion: any) => {
        if (typeof seccion === 'string') {
          return seccion.trim();
        }
        return (seccion?.ID_SECCION_ACT || seccion?.ID_SECCION || seccion?.SECCION || '').toString().trim();
      })
      .filter((seccion: string) => seccion !== '');
  }

  programarSeleccionados() {
    const itemsAProcesar = this.selectedAgendaItems;

    if (itemsAProcesar.length === 0) {
      showToast('Seleccione al menos un producto para programar', 'warning');
      return;
    }

    if (!this.consecutivo) {
      showToast('Debe generar un consecutivo primero', 'error');
      return;
    }

    const itemsMapped = itemsAProcesar.flatMap(item => {
      const seccionesActuales = this.obtenerSeccionesActuales(item);

      if (seccionesActuales.length === 0) {
        return [{
          ID_UN: item.ID_UN || '00',
          ID_UN_ITEM: this.resolverIdUnItem(item),
          ID_PARTE: item.ID_PARTE,
          ID_PEDIDO: item.ID_PEDIDO,
          NC_PEDIDO: item.CONSECUTIVO,
          SECCION_ACTUAL: '',
          CONSECUTIVO: this.consecutivo,
        }];
      }

      return seccionesActuales.map((seccionActual: string) => ({
        ID_UN: item.ID_UN || '00',
        ID_UN_ITEM: this.resolverIdUnItem(item),
        ID_PARTE: item.ID_PARTE,
        ID_PEDIDO: item.ID_PEDIDO,
        NC_PEDIDO: item.CONSECUTIVO,
        SECCION_ACTUAL: seccionActual,
        CONSECUTIVO: this.consecutivo,
      }));
    });

    const prm = {
      DATOS: itemsMapped
    };

    this.startLoading();
    this.sData.consulta('secciones producto', prm, 'pro032').subscribe((data: any) => {
      this.stopLoading();
      const res = validatorRes(data);

      if (res && res.length > 0) {
        let parsedData = res;
        // The API returns the array inside a stringified "data" property in some endpoints
        if (res && res.data && typeof res.data === 'string') {
          try { parsedData = JSON.parse(res.data); } catch (e) { }
        } else if (typeof res === 'string') {
          try { parsedData = JSON.parse(res); } catch (e) { }
        } else if (Array.isArray(res)) {
          // Si es un arreglo, intentamos procesar cada elemento (soporte para múltiples partes)
          parsedData = [];
          res.forEach((item: any) => {
            if (item.data && typeof item.data === 'string') {
              try {
                const subData = JSON.parse(item.data);
                if (Array.isArray(subData)) {
                  parsedData = [...parsedData, ...subData];
                } else if (subData) {
                  parsedData.push(subData);
                }
              } catch (e) { }
            } else if (typeof item === 'object' && !item.data) {
              parsedData.push(item);
            }
          });
        }

        // or if it's an array and there's no data property but it's just the array of sections
        if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].ErrMensaje) {
          showToast(parsedData[0].ErrMensaje, 'error');
          return;
        }

        const uniqueData = Array.isArray(parsedData) ? parsedData.filter((v: any, i: number, a: any[]) =>
          a.findIndex((t: any) => (
            t.ID_PARTE === v.ID_PARTE &&
            (t.Descripcion_Seccion || t.Nombre_en_Ruta || t.DESCRIPCION_SECCION) === (v.Descripcion_Seccion || v.Nombre_en_Ruta || v.DESCRIPCION_SECCION)
          )) === i
        ) : [];

        if (uniqueData.length === 0) {
          import('sweetalert2').then(Swal => {
            Swal.default.fire({
              title: 'Aviso',
              text: 'NO hay secciones para esta planta.',
              icon: 'warning',
              confirmButtonColor: '#0F4C81',
              confirmButtonText: 'Aceptar'
            });
          });
          this.cdr.markForCheck();
          return;
        }

        // Asegurar orden por Secuencia_Ruta para cada parte
        uniqueData.sort((a, b) => (a.ID_PARTE === b.ID_PARTE) ? (a.Secuencia_Ruta - b.Secuencia_Ruta) : a.ID_PARTE.localeCompare(b.ID_PARTE));

        uniqueData.forEach((item: any, i: number) => {
          item.UNIQUE_KEY = `${item.ID_PARTE}_${item.Codigo_Seccion_Maestro || i}`;

          const agendaItem = this.selectedAgendaItems.find(a => a.ID_PARTE === item.ID_PARTE);
          const nombreParte = agendaItem ? (agendaItem.NOMBRE_PARTE || agendaItem.NOMBRE || '') : '';

          item.PRODUCTO_DISPLAY = `Parte: ${item.ID_PARTE}${nombreParte ? ' - ' + nombreParte : ''}`;
          item.Descripcion_Seccion = item.Descripcion_Seccion || item.Nombre_en_Ruta || item.DESCRIPCION_SECCION || '';
          item.Codigo_Seccion_Maestro = item.Codigo_Seccion_Maestro || item.ID_SECCION || '';
        });

        this.seccionesProductoData = uniqueData;

        // Estado Inicial: Solo el primer checkbox de cada parte está habilitado/marcado?
        // Según el requerimiento: "Estado Inicial: Solo el primer checkbox está habilitado"
        // Vamos a marcar solo la primera sección de cada parte por defecto
        const initialSelection: string[] = [];
        const processedParts = new Set();
        uniqueData.forEach(item => {
          if (!processedParts.has(item.ID_PARTE)) {
            initialSelection.push(item.UNIQUE_KEY);
            processedParts.add(item.ID_PARTE);
          }
        });

        this.selectedSeccionesItems = initialSelection;
        this.modalSeccionesVisible = true;
        this.cdr.markForCheck();
      } else {
        import('sweetalert2').then(Swal => {
          Swal.default.fire({
            title: 'Aviso',
            text: 'NO hay secciones para esta planta.',
            icon: 'warning',
            confirmButtonColor: '#0F4C81',
            confirmButtonText: 'Aceptar'
          });
        });
        this.cdr.markForCheck();
      }
    }, (err) => {
      this.stopLoading();
      showToast('Error de conexión al procesar la programación', 'error');
      this.cdr.markForCheck();
    });
  }

  onSelectionChangedSecciones(e: any) {
    const currentSelectedKeys = e.selectedRowKeys;
    const allItems = this.seccionesProductoData;
    const parts = [...new Set(allItems.map(i => i.ID_PARTE))];

    let newSelectedKeys = [...currentSelectedKeys];
    let changed = false;

    parts.forEach(partId => {
      const partItems = allItems.filter(i => i.ID_PARTE === partId)
        .sort((a, b) => a.Secuencia_Ruta - b.Secuencia_Ruta);

      // Regla: Si se desmarca n, desmarcar todos los n+1 posteriores
      let firstUnselectedFound = false;
      partItems.forEach((item) => {
        const isSelected = currentSelectedKeys.includes(item.UNIQUE_KEY);
        if (!isSelected) {
          firstUnselectedFound = true;
        } else if (firstUnselectedFound) {
          // Este item está marcado pero hay uno anterior desmarcado -> desmarcar
          newSelectedKeys = newSelectedKeys.filter(k => k !== item.UNIQUE_KEY);
          changed = true;
        }
      });
    });

    if (changed) {
      this.selectedSeccionesItems = newSelectedKeys;
      this.cdr.markForCheck();
    }
    // Forzar el repintado para que onCellPrepared vuelva a evaluar qué checkboxes habilitar
    e.component.repaint();
  }

  onCellPreparedSecciones(e: any) {
    if (e.rowType === 'data' && e.column.command === 'select') {
      const allItems = this.seccionesProductoData;
      const rowData = e.data;
      const partItems = allItems.filter(i => i.ID_PARTE === rowData.ID_PARTE)
        .sort((a, b) => a.Secuencia_Ruta - b.Secuencia_Ruta);
      const rowIndex = partItems.findIndex(i => i.UNIQUE_KEY === rowData.UNIQUE_KEY);

      if (rowIndex > 0) {
        // Habilitar solo si el anterior está marcado
        const prevItem = partItems[rowIndex - 1];
        const isPrevSelected = this.selectedSeccionesItems.includes(prevItem.UNIQUE_KEY);

        if (!isPrevSelected) {
          e.cellElement.style.pointerEvents = 'none';
          e.cellElement.style.opacity = '0.4';
          e.cellElement.title = 'Debe seleccionar la sección anterior primero';
        } else {
          e.cellElement.style.pointerEvents = '';
          e.cellElement.style.opacity = '';
          e.cellElement.title = '';
        }
      }
    }
  }

  cerrarModalSecciones = () => {
    this.modalSeccionesVisible = false;
    this.cdr.markForCheck();
  }

  cerrarModalErrores = () => {
    this.modalErroresVisible = false;
    this.cdr.markForCheck();
  }

  mostrarMensajeCapacidad() {
    if (this.mensajeCapacidadError) {
      import('sweetalert2').then(Swal => {
        Swal.default.fire({
          icon: 'warning',
          title: 'Aviso de Capacidad',
          text: this.mensajeCapacidadError,
          confirmButtonColor: '#0f4c81',
          confirmButtonText: 'Aceptar'
        });
      });
    }
  }

  confirmarSecciones = () => {
    if (this.selectedSeccionesItems.length === 0) {
      showToast('Seleccione al menos una sección.', 'warning');
      return;
    }

    const payloadData: any[] = [];

    this.selectedSeccionesItems.forEach(seccionKey => {
      const seccion = this.seccionesProductoData.find(s => s.UNIQUE_KEY === seccionKey);
      if (!seccion) return;

      const agendaItems = this.selectedAgendaItems.filter(item => item.ID_PARTE === seccion.ID_PARTE);

      // Buscar si hay un ítem de la agenda cuya sección actual coincida con la sección a programar
      let targetItem = agendaItems.find(item => item.ID_SECCION_ACT === seccion.Codigo_Seccion_Maestro);

      // Si no hay coincidencia directa, usar el primer ítem seleccionado de esta parte
      if (!targetItem && agendaItems.length > 0) {
        targetItem = agendaItems[0];
      }

      if (targetItem) {
        payloadData.push({
          ID_UN: targetItem.ID_UN || '00',
          ID_UN_ITEM: this.resolverIdUnItem(targetItem),
          ID_PLAN: targetItem.ID_PLAN,
          ID_PEDIDO: targetItem.ID_PEDIDO,
          NC_PEDIDO: targetItem.CONSECUTIVO,
          ORDEN_PRO: targetItem.ORDEN_PRODUCCION,
          PRODUCTO: targetItem.PRODUCTO,
          ID_PARTE: targetItem.ID_PARTE,
          NOMBRE_PRODUCTO: targetItem.NOMBRE_PRODUCTO,
          ATRIBUTO: targetItem.ID_ATRIBUTO || '',
          ITEM: targetItem.ITEM,
          CANTIDAD: targetItem.CANTIDAD,
          CANTIDAD_PENDIENTE: (targetItem.PENDIENTE || 0) - (targetItem.CANT_PROGRAMAR || 0),
          TIEMPO_PRODUCCION: targetItem.TIEMPO_PRODUCCION || 0,
          SERIAL: targetItem.SERIAL || '',
          FECHA_ENTREGA: targetItem.FECHA_ENTREGA,
          FECHA_PRODUCCION: this.fechaActual instanceof Date ? this.fechaActual.toISOString().split('T')[0] : this.fechaActual,
          FECHA_PRODUCCION_FINAL: this.fechaFinal instanceof Date ? this.fechaFinal.toISOString().split('T')[0] : this.fechaFinal,
          HORA_PRODUCCION: new Date().toLocaleTimeString('en-GB'),
          ESTADO: targetItem.ESTADO,
          CANTIDAD_PROGRAMADA: targetItem.CANT_PROGRAMAR,
          NUMERO_OC: targetItem.NUMERO_OC || '',
          CONSECUTIVO_DIARIO: this.consecutivo,
          SECCION: seccion.Codigo_Seccion_Maestro,
          SECCION_SIG: seccion.Codigo_Seccion_Sig,
          DESCRIPCION_SECCION: seccion.Descripcion_Seccion || '',
          DESCRIPCION_SECCION_SIG: seccion.Descripcion_Seccion_Sig || '',
          USUARIO: localStorage.getItem("usuario")?.toUpperCase() || ''
        });
      }
    });

    if (payloadData.length === 0) {
      showToast('No se encontraron coincidencias para programar.', 'warning');
      return;
    }

    const prm = {
      DATOS: payloadData
    };

    this.startLoading();
    this.sData.consulta('programar', prm, 'pro032').subscribe((data: any) => {
      this.stopLoading();

      let parsedData: any = null;
      if (data && data.data && typeof data.data === 'string') {
        try { parsedData = JSON.parse(data.data); } catch (e) { }
      } else if (typeof data === 'string') {
        try { parsedData = JSON.parse(data); } catch (e) { }
      } else if (Array.isArray(data) && data.length > 0 && data[0].data && typeof data[0].data === 'string') {
        try { parsedData = JSON.parse(data[0].data); } catch (e) { }
      }

      let res: any = null;
      try {
        res = validatorRes(data);
      } catch (e) {
        console.error("Error al validar respuesta:", e);
      }

      let errorMsg: string | undefined = undefined;
      let duplicados: any[] = [];

      if (parsedData) {
        errorMsg = parsedData.ErrMensaje;
        duplicados = parsedData.ProductosDuplicados || [];
      } else {
        errorMsg = (res && res[0] && res[0].ErrMensaje) || (res && res.ErrMensaje);
        duplicados = (res && res[0] && res[0].ProductosDuplicados) || (res && res.ProductosDuplicados) || [];
      }

      console.log("Respuesta de programar:", { data, res, parsedData, errorMsg });

      if (errorMsg && errorMsg !== '') {
        console.log("Detectado error con duplicados:", duplicados.length);
        if (duplicados && duplicados.length > 0) {
          this.mensajeErrorPrincipal = errorMsg;
          this.erroresDuplicadosData = duplicados;
          this.modalSeccionesVisible = false;
          // Pequeño delay para asegurar que la primera modal se cierre antes de abrir la segunda
          setTimeout(() => {
            this.modalErroresVisible = true;
            this.cdr.detectChanges();
          }, 200);
        } else {
          showToast(errorMsg, 'error');
        }
        this.cdr.detectChanges();
      } else {
        showToast(`Programación de secciones confirmada con éxito`, 'success');
        this.modalSeccionesVisible = false;
        this.ejecutarFunciones();
        this.selectedAgendaItems = [];
        this.selectedAgendaKeys = [];
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.cdr.markForCheck();
      }
    }, (err) => {
      this.stopLoading();
      showToast('Error de conexión al confirmar la programación', 'error');
      this.cdr.markForCheck();
    });
  }



  opPrepararBuscar(accion: any): void {
    if (accion === "filtro") {
      const prmFiltro = {
        Titulo: "Datos de filtro para Agenda de Producción",
        accion: "activar",
        Filtro: "",
        TablaBase: this.prmUsrAplBarReg.tabla,
        aplicacion: this.prmUsrAplBarReg.aplicacion,
        objRegistro: this._sbarreg,
        objTab: this.tabService,
        usuario: this.prmUsrAplBarReg.usuario,
        title: 'Programación MDP'
      };

      this.eventsSubjectFiltro.next(prmFiltro);
    } else {
      this._sfiltro.enConsulta = true;
      let prmDatosBuscar = JSON.parse(accion);
      let arrFiltro = prmDatosBuscar.ESTRUCTURA;
      const prm = { [this.prmUsrAplBarReg.tabla]: arrFiltro };

      this.startLoading();
      this.sData.consulta('consulta', prm, 'PRO032').subscribe(
        (data: any) => {
          this.stopLoading();

          let res: any[] = [];
          if (data && data.data && typeof data.data === 'string') {
            try { res = JSON.parse(data.data); } catch (e) { }
          } else if (typeof data === 'string') {
            try { res = JSON.parse(data); } catch (e) { }
          } else if (Array.isArray(data)) {
            res = data;
          }

          if (res && res.length > 0 && (!res[0].ErrMensaje || res[0].ErrMensaje === '')) {
            let datares: any[] = res;

            if (datares && datares.length > 0) {
              this.VDatosReg = datares;
              this.QFiltro = datares[0].QFILTRO || '';

              this.prmUsrAplBarReg = {
                ...this.prmUsrAplBarReg,
                r_totReg: datares.length,
                r_numReg: 1,
                accion: 'r_navegar',
                operacion: {}
              };
              this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
              this.opIrARegistro('r_primero');
            } else {
              this.VDatosReg = [];
              showToast('No se encontraron registros', 'warning');
            }
          } else if (res && res.length > 0 && res[0].ErrMensaje) {
            showToast(res[0].ErrMensaje, 'warning');
            this.VDatosReg = [];
          } else {
            this.VDatosReg = [];
            showToast('No se encontraron registros', 'warning');
          }

          this._sfiltro.enConsulta = false;
          this.cdr.markForCheck();
        },
        (err: any) => {
          this.stopLoading();
          this._sfiltro.enConsulta = false;
          showToast('Error en la búsqueda', 'error');
          this.cdr.markForCheck();
        }
      );
    }
  }

  onRespuestaFiltro(e: any) {
  }
}
