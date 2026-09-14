import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  DxTreeListComponent,
  DxTreeListModule,
  DxButtonModule,
  DxToolbarModule,
  DxLoadPanelModule,
  DxDropDownButtonModule,
  DxCheckBoxModule,
  DxSelectBoxModule,
  DxPopupModule,
  DxLoadIndicatorModule,
} from 'devextreme-angular';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { showToast } from '../../shared/toast/toastComponent';
import dxCheckBox from 'devextreme/ui/check_box';
import { PRO029Service } from 'src/app/services/PRO029/PRO029.service';
import { DxDiagramModule } from 'devextreme-angular';
import ArrayStore from 'devextreme/data/array_store';
import { PRO011Service } from 'src/app/services/PRO011/PRO011.service';
import { LibsvgService } from 'src/app/services/PRO011/SVisor.service';


@Component({
  selector: 'app-PRO026',
  templateUrl: './PRO026.component.html',
  styleUrls: ['./PRO026.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    DxTreeListModule,
    DxButtonModule,
    DxToolbarModule,
    DxLoadPanelModule,
    DxDropDownButtonModule,
    DxCheckBoxModule,
    DxSelectBoxModule,
    DxPopupModule,
    DxDiagramModule,
    DxLoadIndicatorModule,
  ],
  providers: [PRO029Service, PRO011Service],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PRO026Component implements OnInit {

  @ViewChild('treeListProduccion', { static: false }) treeListProduccion!: DxTreeListComponent;

  // Observables
  private unSubscribe: Subject<boolean> = new Subject<boolean>();
  subscription!: Subscription;

  // Variables de configuración
  prmUsrAplBarReg!: clsBarraRegistro;
  loadingVisible: boolean = false;
  selectedRowKeys: any[] = [];
  opcionesAgrupacion: any[] = [];

  // Configuración del selector de vista
  tipoVistaSeleccionado: string = 'Básica';
  opcionesTipoVista: any[] = [
    { valor: 'Básica', texto: 'Básica' },
    // { valor: 'Estandar', texto: 'Estándar' },
    { valor: 'Ruta', texto: 'Ruta' }
  ];

  // Datos de la tree-list
  datosProduccionTree: any[] = [];
  listaPlanes: string[] = [];
  planSeleccionado: string = 'TODOS';

  // Modal de secciones
  modalSeccionesVisible: boolean = false;
  seccionSeleccionada: any = null;
  detallesSecciones: any[] = [];

  // Diagrama
  seccNodosDataSource: any;
  seccConecDataSource: any;
  NodosSvg: any = [];
  modelDiagrama: any;
  loadingDiagrama: boolean = false;

  constructor(
    private _sbarreg: SbarraService,
    private sData: PRO029Service,
    private sPro11: PRO011Service,
    private sLibSvg: LibsvgService,
    private cdr: ChangeDetectorRef,
  ) {
    this.sLibSvg.getArchivo().subscribe(() => {
      const originalShapes = this.sLibSvg.custShapes || [];
      const allShapes = [...originalShapes];

      originalShapes.forEach(shape => {
        if (shape.svg && shape.svg.includes('base64,')) {
          try {
            const parts = shape.svg.split('base64,');
            const header = parts[0] + 'base64,';
            const encoded = parts[1];
            let decoded = atob(encoded);

            // Generar versión ACTIVA (Azul)
            // Reemplazar color de fondo (blanco #FFFFFF o gris #F5F0F0) por azul (#3498db)
            let activeSvg = decoded.replace(/fill:#FFFFFF/g, 'fill:#3498db');
            activeSvg = activeSvg.replace(/fill:#F5F0F0/g, 'fill:#3498db');
            // Reemplazar color de borde por uno azul oscuro (#2980b9)
            activeSvg = activeSvg.replace(/stroke:#[0-9A-Fa-f]{6}/g, 'stroke:#2980b9');

            allShapes.push({
              ...shape,
              id: shape.id + '_active',
              svg: header + btoa(activeSvg)
            });

            // Generar versión PENDIENTE (Gris atenuado/Dashed)
            // Reemplazar color de borde por uno gris claro y hacerlo punteado
            let pendingSvg = decoded.replace(/stroke-miterlimit:10/g, 'stroke-miterlimit:10;stroke-dasharray:4');
            pendingSvg = pendingSvg.replace(/fill:#[0-9A-Fa-f]{6}/g, 'fill:#f9f9f9');
            pendingSvg = pendingSvg.replace(/stroke:#[0-9A-Fa-f]{6}/g, 'stroke:#dcdcdc');

            allShapes.push({
              ...shape,
              id: shape.id + '_pending',
              svg: header + btoa(pendingSvg)
            });
          } catch (e) {
            console.error("Error procesando SVG:", e);
          }
        }
      });

      this.NodosSvg = allShapes;
      this.cdr.markForCheck();
    });
  }

  ngOnInit() {
    this.inicializarComponente();
    this.cargarDatos();

    this._sbarreg.getObsRegApl()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((datreg) => {
        if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
          this.opMenuRegistro(datreg);
      });
  }

  opMenuRegistro(operMenu: any): void {
    switch (operMenu.accion) {
      case 'r_refrescar':
        this.selectedRowKeys = [];
        this.planSeleccionado = 'TODOS';
        this.cargarDatos();
        break;
    }
  }

  onPlanFilterChanged(e: any): void {
    if (!this.treeListProduccion) return;

    if (e.value === 'TODOS') {
      this.treeListProduccion.instance.clearFilter();
    } else {
      this.treeListProduccion.instance.filter(['planta', '=', e.value]);
    }
  }

  onRowPrepared(e: any): void {
    if (e.rowType === 'data' && e.node) {
      if (e.node.level === 0) {
        e.rowElement.classList.add('row-padre');
      } else {
        e.rowElement.classList.add('row-hijo');
      }
    }
  }

  private inicializarComponente(): void {
    const user: any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: 'PRO_PRODUCCION',
      aplicacion: 'PRO-026',
      usuario: user,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: { r_modificar: true }
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
  }

  ngOnDestroy() {
    this.unSubscribe.next(true);
    this.unSubscribe.complete();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }



  private cargarDatos(): void {
    this.loadingVisible = true;

    const prm = { VISTA: this.tipoVistaSeleccionado };

    this.sData.consulta('CONSULTA FILTRO', prm, 'PRO029')
      .pipe(takeUntil(this.unSubscribe))
      .subscribe({
        next: (response: any) => {

          try {
            // La respuesta viene como { data: "string_json", token: "..." }
            if (response && response.data) {
              const data = JSON.parse(response.data);

              if (Array.isArray(data) && data.length > 0 && !data[0].ErrMensaje) {
                // Procesar datos reales del servicio
                this.procesarDatos(data);
              } else {
                // Si hay error o no hay datos, limpiar la vista
                console.warn("No se pudieron cargar datos del servicio");
                this.datosProduccionTree = [];
                this.selectedRowKeys = [];
              }
            } else {
              console.warn("Respuesta sin datos");
              this.datosProduccionTree = [];
              this.selectedRowKeys = [];
            }
          } catch (parseError) {
            console.error("Error al parsear datos JSON:", parseError);
            this.datosProduccionTree = [];
            this.selectedRowKeys = [];
          }

          this.loadingVisible = false;
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error("Error al cargar datos:", error);
          showToast('Error al cargar los datos de producción', 'error');

          // Limpiar datos en caso de error
          this.datosProduccionTree = [];
          this.selectedRowKeys = [];
          this.loadingVisible = false;
          this.cdr.markForCheck();
        }
      });
  }

  // Método para cambio de tipo de vista
  onTipoVistaChanged(e: any): void {
    this.tipoVistaSeleccionado = e.value;
    // Recargar datos con la nueva vista
    this.cargarDatos();
  }

  private procesarDatos(data: any[]): void {
    console.log("Raw API data:", data);
    try {
      const planesSet = new Set<string>();
      data.forEach(item => {
        if (item.NOMBRE_PLAN) planesSet.add(item.NOMBRE_PLAN);
      });
      this.listaPlanes = ['TODOS', ...Array.from(planesSet).sort()];

      // 1. Mapeo previo para indexar los ítems existentes por su ID de ITEM base
      const itemsExistentes = new Set(data.map(item => String(item.ITEM_ID).trim()));

      // 2. Primer paso: Crear la lista con IDs únicos compuestos indestructibles
      const treeData = data.map((item, index) => {
        const itemBase = String(item.ITEM_ID).trim();
        const itemPadreBase = item.ITEM_PADRE !== null && item.ITEM_PADRE !== undefined ? String(item.ITEM_PADRE).trim() : '-1';
        const productoOParte = (item.ID_PARTE || item.PRODUCTO || '').trim();
        const productoPadre = (item.PRODUCTO || '').trim();

        const idUnicoCompuesto = `${itemBase}_${productoOParte}_${index}`;
        const esRaizEstricta = itemPadreBase === '-1';

        return {
          // Llaves lógicas de control
          itemOriginal: itemBase,
          itemPadreOriginal: itemPadreBase,
          productoOriginal: productoPadre,
          codigoComponente: productoOParte,
          documentoPedido: item.DOCUMENTO_PEDIDO,

          // Propiedades para DevExtreme TreeList
          id: idUnicoCompuesto,
          parent: esRaizEstricta ? '-1' : itemPadreBase, // Se recalcula con precisión abajo

          idPlan: item.ID_PLAN,
          producto: productoOParte,
          nombreProducto: esRaizEstricta
            ? (item.NOMBRE_PRODUCTO || item.NOMBRE_PARTE || '').trim()
            : (item.NOMBRE_PARTE || item.NOMBRE_PRODUCTO || '').trim(),

          pedidoClienteOp: `${item.DOCUMENTO_PEDIDO} - ${item.NOMBRE_CLIENTE}`,

          op: item.ORDEN_PRODUCCION || '',
          cantidad: item.CANTIDAD_PROGRAMADA,
          fechaHoraProduccion: item.FECHA_PEDIDO ? new Date(item.FECHA_PEDIDO) : null,
          fechaEntrega: item.FECHA_ENTREGA ? new Date(item.FECHA_ENTREGA) : null,
          fechaEntregaRaw: item.FECHA_ENTREGA || '',
          seccion: this.tipoVistaSeleccionado === 'Estandar'
            ? this.obtenerTextoTodasLasSecciones(item.SECCIONES)
            : this.obtenerNombrePrimeraSeccion(item.SECCIONES),
          secciones: this.parsearSecciones(item.SECCIONES),
          primeraSeccion: this.tipoVistaSeleccionado === 'Básica'
            ? this.obtenerPrimeraSeccionComoObjeto(item.SECCIONES)
            : null,
          planta: item.NOMBRE_PLAN || '',
          codigoAsociado: item.CODIGO_ASOCIADO || '',
          cliente: item.NOMBRE_CLIENTE,
          idRuta: item.ID_RUTA || '',
          detalleLayout: this.parsearDetalleLayout(item.DETALLE_LAYOUT),
          estado: item.ESTADO || ''
        };
      });

      // 3. Segundo paso: Lógica Avanzada de Vinculación y Adopción de Huérfanos
      treeData.forEach(nodo => {
        if (nodo.parent !== '-1') {
          // Intento A: Buscar coincidencia directa por ID numérico de ITEM
          let nodoPadreReal = treeData.find(p => p.itemOriginal === nodo.itemPadreOriginal);

          // Intento B (Comedores/Juegos completos): Si el padre numérico no existe, 
          // mapeamos los muebles intermedios (PF) al juego raíz (JU) que tenga su mismo código de PRODUCTO
          if (!nodoPadreReal) {
            nodoPadreReal = treeData.find(p =>
              p.itemPadreOriginal === '-1' &&
              p.productoOriginal === nodo.productoOriginal &&
              p.documentoPedido === nodo.documentoPedido
            );
          }

          // Asignación final del puntero parent
          if (nodoPadreReal) {
            nodo.parent = nodoPadreReal.id;
          } else {
            // Si es un huérfano absoluto que no amarra por ningún lado, va directo a la raíz general para que no se oculte
            nodo.parent = '-1';
          }
        }
      });

      console.log("TreeData estructurado en 3 niveles con éxito:", treeData);
      this.datosProduccionTree = treeData;
      this.cdr.markForCheck();

    } catch (error) {
      console.error("Error crítico en la re-estructuración del árbol:", error);
      showToast('Error al agrupar la estructura de producción', 'error');
    }
  }
  // Método para obtener la primera sección como objeto (para vista Básica)
  private obtenerPrimeraSeccionComoObjeto(seccionesJson: any): any {
    try {
      if (!seccionesJson) return null;

      let secciones: any[] = [];

      if (Array.isArray(seccionesJson)) {
        secciones = seccionesJson;
      } else if (typeof seccionesJson === 'string') {
        const jsonLimpio = seccionesJson.trim();
        try {
          secciones = JSON.parse(jsonLimpio);
          if (!Array.isArray(secciones)) secciones = [secciones];
        } catch (e) {
          // Fallback para texto plano
          const partes = jsonLimpio.split(/[,;\-→]+/).map(s => s.trim()).filter(Boolean);
          if (partes.length > 0) {
            return {
              nombre: partes[0],
              cantidad: 0,
              estado: '',
              esTextoPlano: true
            };
          }
          return {
            nombre: jsonLimpio,
            cantidad: 0,
            estado: '',
            esTextoPlano: true
          };
        }
      } else {
        return null;
      }

      // Filtrar secciones vacías
      if (Array.isArray(secciones)) {
        secciones = secciones.filter(s => {
          const nombre = s.NOMBRE_SECCION || s.DESCRIPCION || s.ID_SECCION || '';
          return nombre && nombre.trim() !== '';
        });
      }

      if (Array.isArray(secciones) && secciones.length > 0) {
        const primeraSeccion = secciones[0];
        return {
          nombre: primeraSeccion.NOMBRE_SECCION || primeraSeccion.DESCRIPCION || primeraSeccion.ID_SECCION || '',
          cantidad: primeraSeccion.CANTIDAD || primeraSeccion.CANTIDAD_SALDO || 0,
          estado: primeraSeccion.ESTADO || '',
          tiempoProduccion: primeraSeccion.TIEMPO_PRODUCCION || 0,
          cantidadProducida: primeraSeccion.CANTIDAD_PRODUCIDA || 0,
          cantidadPendiente: primeraSeccion.CANTIDAD_PENDIENTE || 0
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Método para obtener texto de todas las secciones en una línea
  private obtenerTextoTodasLasSecciones(seccionesJson: any): string {
    try {
      if (!seccionesJson) return '';

      let secciones: any[] = [];

      if (Array.isArray(seccionesJson)) {
        secciones = seccionesJson;
      } else if (typeof seccionesJson === 'string') {
        const jsonLimpio = seccionesJson.trim();
        try {
          secciones = JSON.parse(jsonLimpio);
          if (!Array.isArray(secciones)) secciones = [secciones];
        } catch (e) {
          const partes = jsonLimpio.split(/[,;\-→]+/).map(s => s.trim()).filter(Boolean);
          if (partes.length > 0) {
            return partes.join(' → ');
          }
          return jsonLimpio; // Devolver el texto plano directamente
        }
      } else {
        return '';
      }

      // Filtrar secciones vacías
      if (Array.isArray(secciones)) {
        secciones = secciones.filter(s => {
          const nombre = s.NOMBRE_SECCION || s.DESCRIPCION || s.ID_SECCION || '';
          return nombre && nombre.trim() !== '';
        });
      }

      if (Array.isArray(secciones) && secciones.length > 0) {
        const nombres = secciones.map(s => s.NOMBRE_SECCION || s.DESCRIPCION || 'Sin nombre');
        return nombres.join(' → ');
      }
      return '';
    } catch (error) {
      return 'Error en secciones';
    }
  }

  // Método para extraer solo el nombre de la primera sección
  private obtenerNombrePrimeraSeccion(seccionesJson: any): string {
    try {
      if (!seccionesJson) return '';

      let secciones: any[] = [];

      if (Array.isArray(seccionesJson)) {
        secciones = seccionesJson;
      } else if (typeof seccionesJson === 'string') {
        const jsonLimpio = seccionesJson.trim();
        try {
          secciones = JSON.parse(jsonLimpio);
          if (!Array.isArray(secciones)) secciones = [secciones];
        } catch (e) {
          const partes = jsonLimpio.split(/[,;\-→]+/).map(s => s.trim()).filter(Boolean);
          if (partes.length > 0) {
            return partes[0];
          }
          return jsonLimpio;
        }
      } else {
        return '';
      }

      // Filtrar secciones vacías
      if (Array.isArray(secciones)) {
        secciones = secciones.filter(s => {
          const nombre = s.NOMBRE_SECCION || s.DESCRIPCION || s.ID_SECCION || '';
          return nombre && nombre.trim() !== '';
        });
      }

      if (Array.isArray(secciones) && secciones.length > 0) {
        return secciones[0].NOMBRE_SECCION || secciones[0].DESCRIPCION || secciones[0].ID_SECCION || '';
      }
      return '';
    } catch (error) {
      return 'Error en sección';
    }
  }

  // Método para parsear las secciones desde JSON (para vista Estándar)
  private parsearSecciones(seccionesJson: any): any[] {
    try {
      if (!seccionesJson) return [];

      let secciones: any[] = [];

      if (Array.isArray(seccionesJson)) {
        secciones = seccionesJson;
      } else if (typeof seccionesJson === 'string') {
        const jsonLimpio = seccionesJson.trim();
        try {
          secciones = JSON.parse(jsonLimpio);
          if (!Array.isArray(secciones)) secciones = [secciones];
        } catch (e) {
          const partes = jsonLimpio.split(/[,;\-→]+/).map(s => s.trim()).filter(Boolean);
          if (partes.length > 0) {
            return partes.map(part => ({
              nombre: part,
              cantidad: 0,
              estado: '',
              esTextoPlano: true,
              tiempoProduccion: 0,
              cantidadProducida: 0,
              cantidadPendiente: 0
            }));
          }
          return [{ nombre: jsonLimpio, cantidad: 0, estado: '', esTextoPlano: true }];
        }
      } else {
        return [];
      }

      if (Array.isArray(secciones) && secciones.length > 0) {
        return secciones
          .map(s => ({
            nombre: s.NOMBRE_SECCION || s.DESCRIPCION || s.ID_SECCION || '',
            cantidad: s.CANTIDAD || s.CANTIDAD_SALDO || 0,
            estado: s.ESTADO || '',
            tiempoProduccion: s.TIEMPO_PRODUCCION || 0,
            cantidadProducida: s.CANTIDAD_PRODUCIDA || 0,
            cantidadPendiente: s.CANTIDAD_PENDIENTE || 0
          }))
          .filter(s => s.nombre && s.nombre.trim() !== '');
      }
      return [];
    } catch (error) {
      return [];
    }
  }


  // Método sobrecargado para uso en templates
  obtenerSeccionesProducto(data: any): any[] {
    // Si el data tiene secciones parseadas, devolverlas
    if (data && data.secciones && Array.isArray(data.secciones)) {
      return data.secciones;
    }

    return [];
  }

  // Método para obtener texto básico de secciones
  obtenerTextoSeccionesBasico(secciones: any[]): string {
    console.log('obtenerTextoSeccionesBasico - secciones recibidas:', secciones);

    if (!secciones || secciones.length === 0) {
      return 'Sin secciones';
    }

    // Las secciones ahora son objetos con propiedad 'nombre'
    const texto = secciones.map(s => s.nombre || s).join(', ');
    console.log('Texto de secciones generado:', texto);
    return texto;
  }

  // Método para parsear el detalle del layout (secciones por las que ya pasó)
  private parsearDetalleLayout(detalleJson: any): any[] {
    try {
      if (!detalleJson) return [];
      if (typeof detalleJson === 'string') {
        const data = JSON.parse(detalleJson);
        return Array.isArray(data) ? data : [data];
      }
      return Array.isArray(detalleJson) ? detalleJson : [detalleJson];
    } catch (error) {
      console.error("Error al parsear DETALLE_LAYOUT:", error);
      return [];
    }
  }


  // Método para abrir modal de secciones
  abrirModalSecciones(itemData: any): void {
    if (!itemData) return;

    this.seccionSeleccionada = itemData;
    this.detallesSecciones = itemData.secciones || [];
    this.modalSeccionesVisible = true;

    // Reset diagram data
    this.seccNodosDataSource = null;
    this.seccConecDataSource = null;

    if (itemData.idRuta) {
      this.loadingDiagrama = true;

      const prm = { RUTAS_PRODUCCION: [{ CAMPO: "ID_RUTA", EXPRESION: itemData.idRuta, TABLA: "RUTAS_PRODUCCION" }, { "CAMPO": "TIPO", "EXPRESION": "Rutas Compuestas" }] };

      this.sPro11.consulta('consulta', prm, 'PRO014')
        .pipe(takeUntil(this.unSubscribe))
        .subscribe({
          next: (resp: any) => {
            this.loadingDiagrama = false;
            try {
              if (resp && resp.data) {
                const datares = JSON.parse(resp.data);
                if (datares && datares.length > 0 && datares[0].DIAGRAMA) {
                  const modelDiagrama = JSON.parse(datares[0].DIAGRAMA);

                  if (modelDiagrama.NODOS && modelDiagrama.CONECTORES) {
                    const detalleLayout = itemData.detalleLayout || [];

                    // Procesar nodos para aplicar estilos
                    const nodosProcesados = modelDiagrama.NODOS.map((nodo: any) => {
                      // Solo procesamos tipos que conocemos (que tengan versión activa/pendiente)
                      const tipoOriginal = nodo.type || '';
                      const esTipoConocido = this.NodosSvg.some((s: any) => s.id === tipoOriginal);

                      if (!esTipoConocido) return nodo; // No tocar formas estándar o contenedores

                      // Verificar si la sección está en el detalle del layout (coincidencia por ID único de layout)
                      const matches = detalleLayout.filter((d: any) =>
                        d.ID_LAYOUT_REF === nodo.id
                      );

                      if (matches.length > 0) {
                        let textoAdicional = "";

                        // Recopilar información de todas las partes encontradas para este nodo
                        matches.forEach((info: any) => {
                          if (info.ID_PARTE) {
                            textoAdicional += `\n${info.ID_PARTE}`;
                          }
                          if (info.FECHA_INICIO_PRODUCCION) {
                            try {
                              const fecha = new Date(info.FECHA_INICIO_PRODUCCION);
                              textoAdicional += ` - ${fecha.toLocaleDateString()}`;
                            } catch (e) {
                              textoAdicional += ` - ${info.FECHA_INICIO_PRODUCCION.split('T')[0]}`;
                            }
                          }
                        });

                        // Usar versión activa del shape y agregar texto extra
                        return {
                          ...nodo,
                          text: nodo.text + textoAdicional,
                          type: tipoOriginal.endsWith('_active') ? tipoOriginal : tipoOriginal + '_active',
                          textStyle: { fill: '#ffffff', 'font-weight': 'bold', 'font-size': '8px' },
                          is_active: true
                        };
                      } else {
                        // Usar versión pendiente del shape
                        return {
                          ...nodo,
                          type: tipoOriginal.endsWith('_pending') ? tipoOriginal : tipoOriginal + '_pending',
                          textStyle: { fill: '#999999', 'font-size': '9px' },
                          is_active: false
                        };
                      }
                    });

                    // Identificar IDs de nodos activos para procesar conectores
                    const activeNodeIds = new Set(nodosProcesados.filter((n: any) => n.is_active).map((n: any) => n.id));

                    // Procesar conectores para aplicar estilos
                    const conectoresProcesados = modelDiagrama.CONECTORES.map((con: any) => {
                      const isActive = activeNodeIds.has(con.fromId) && activeNodeIds.has(con.toId);

                      if (isActive) {
                        return {
                          ...con,
                          lineStyle: { stroke: '#3498db', 'stroke-width': 2 }
                        };
                      } else {
                        return {
                          ...con,
                          lineStyle: { stroke: '#dcdcdc', 'stroke-dasharray': '4' }
                        };
                      }
                    });

                    this.seccNodosDataSource = new ArrayStore({
                      key: "id",
                      data: nodosProcesados,
                    });

                    this.seccConecDataSource = new ArrayStore({
                      key: "id",
                      data: conectoresProcesados,
                    });
                  }
                }
              }
            } catch (error) {
              console.error("Error al procesar diagrama:", error);
            }
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.loadingDiagrama = false;
            console.error("Error al cargar diagrama:", err);
            this.cdr.markForCheck();
          }
        });
    }

    this.cdr.markForCheck();
  }

  // Método para aplicar colores de estado de secciones
  getSectionColor(status: string, type: 'background' | 'color'): string {
    if (!status) return '';

    const estado = status.toUpperCase();

    // Mapeo de colores de fondo (background-color)
    const backgroundMap: { [key: string]: string } = {
      'REGISTRADO': 'rgba(255,255,255)',
      'COMPROMETIDO': 'rgba(128, 178, 200, .1)',
      'PROGRAMADO': 'rgba(255,255,255)',
      'EN PROCESO': 'rgba(255,115,232,.2)',
      'ANULADO': 'rgba(200,78,224,.2)',
      'FINALIZADO': 'rgba(53,204,172,.2)',
      'TERMINADO': 'rgba(53,204,172,.2)',
      'STOCK': 'rgba(53,204,172,.2)',
    };

    // Mapeo de colores de texto (color)
    const colorMap: { [key: string]: string } = {
      'REGISTRADO': 'rgba(98,121,140,.9)',
      'COMPROMETIDO': 'rgba(100, 150, 170, 0.8)',
      'PROGRAMADO': 'rgba(98,121,140,.75)',
      'EN PROCESO': 'rgba(26,115,232,1)',
      'ANULADO': 'rgba(200,78,224,1)',
      'FINALIZADO': 'rgba(53,204,172,1)',
      'TERMINADO': 'rgba(53,204,172,1)',
      'STOCK': 'rgba(53,204,172,1)',
    };

    if (type === 'background') {
      return backgroundMap[estado] || '';
    } else if (type === 'color') {
      return colorMap[estado] || '';
    }

    return '';
  }



  // Métodos adicionales para tree-list
  onCellPrepared(e: any): void {
    if (e.rowType === "data" && e.data) {
      // 1. Lógica para el checkbox de selección
      const checkboxElement = e.cellElement.querySelector(".dx-select-checkbox") || e.cellElement.querySelector(".dx-checkbox") || null;

      if (checkboxElement) {
        if (this.tipoVistaSeleccionado === 'Ruta') {
          checkboxElement.style.visibility = 'hidden';
        } else {
          const opVal = e.data.op || e.data.ORDEN_PRODUCCION || '';
          const tieneOP = String(opVal).trim() !== '';
          const estaProgramado = e.data.ESTADO !== 'COMPROMETIDO';

          const visible = !tieneOP && estaProgramado;
          checkboxElement.style.visibility = visible ? 'visible' : 'hidden';
        }
      }

      // 2. Lógica para "combinar" celdas (Evitar destruir la columna del árbol)
      const camposACombinar = ['pedidoClienteOp', 'producto']; // <-- Quitamos 'nombreProducto' de aquí

      if (camposACombinar.includes(e.column.dataField)) {
        if (e.node && e.node.level > 0) {
          // Es un hijo: ocultamos el texto de las columnas secundarias sin tocar los contenedores principales
          if (e.column.dataField === 'pedidoClienteOp') {
            Array.from(e.cellElement.childNodes).forEach((node: any) => {
              if (node.nodeType === 3) { // Node.TEXT_NODE
                node.textContent = "";
              }
            });
          } else {
            e.cellElement.innerText = "";
          }
          e.cellElement.style.borderTop = "none";
          e.cellElement.style.backgroundColor = "inherit";
          e.cellElement.classList.add('celda-combinada-hijo');
        } else if (e.node && e.node.level === 0 && e.node.children.length > 0) {
          // Es un padre con hijos
          e.cellElement.style.borderBottom = "none";
          e.cellElement.classList.add('celda-combinada-padre');
        }
      }

      // Tratamiento especial para la columna del árbol 'nombreProducto' (No usar innerText = "")
      if (e.column.dataField === 'nombreProducto') {
        if (e.node && e.node.level > 0) {
          // Si quieres quitarle bordes superiores a los hijos de la columna del árbol para el efecto visual:
          e.cellElement.style.borderTop = "none";
          e.cellElement.style.backgroundColor = "inherit";
        } else if (e.node && e.node.level === 0 && e.node.children.length > 0) {
          e.cellElement.style.borderBottom = "none";
        }
      }
    }
  }

  onSelectionChanged(e: any): void {
    const filteredKeys = e.selectedRowKeys.filter((key: any) => {
      const item = this.datosProduccionTree.find(d => d.id === key);
      // Validamos usando itemPadreOriginal para asegurar la raíz real
      return item && this.tipoVistaSeleccionado !== 'Ruta' && (!item.op || item.op.trim() === '') && item.itemPadreOriginal === '-1';
    });

    if (filteredKeys.length !== e.selectedRowKeys.length) {
      setTimeout(() => {
        this.selectedRowKeys = [...filteredKeys];
        this.cdr.markForCheck();
      }, 0);
    } else {
      this.selectedRowKeys = [...filteredKeys];
    }
    this.cdr.markForCheck();
  }


  // Método para generar orden de producción
  generarOrdenOP(e: any): void {
    if (this.selectedRowKeys.length === 0) {
      showToast('Debe seleccionar al menos un elemento para generar la orden de producción', 'warning');
      return;
    }

    const prm: any[] = [];
    let plan = '';
    let FECHA_ENTREGA = '';

    this.selectedRowKeys.forEach((ele: any) => {
      // Buscamos coincidencia exacta por el ID único compuesto de DevExtreme
      const temp: any = this.datosProduccionTree.filter((d: any) => d.id === ele);

      if (temp.length > 0) {
        prm.push({
          DOCUMENTO_PEDIDO: temp[0].pedidoClienteOp ? temp[0].pedidoClienteOp.split(' - ')[0] : '',
          PRODUCTO: temp[0].producto, // Mapeará el código limpio (ID_PARTE o PRODUCTO)
          FECHA_ENTREGA: temp[0].fechaEntregaRaw,
        });

        FECHA_ENTREGA = temp[0].fechaEntregaRaw;
        plan = temp[0].idPlan;
      }
    });

    if (prm.length === 0) {
      showToast('No se pudieron obtener los datos necesarios para generar la orden de producción', 'error');
      return;
    }

    this.loadingVisible = true;

    this.sData.consulta('GENERAR ORDEN PRO', { PEDIDOS: prm, ID_PLAN: plan, FECHA_ENTREGA: FECHA_ENTREGA, USUARIO: localStorage.getItem('usuario') }, 'PRO-029')
      .pipe(takeUntil(this.unSubscribe))
      .subscribe({
        next: (data: any) => {
          this.loadingVisible = false;
          try {
            const res = JSON.parse(data.data);
            if (data.token) localStorage.setItem("token", data.token);

            if (res[0].ErrMensaje !== '') {
              showToast(res[0].ErrMensaje, 'error');
            } else {
              const ordenProduccion = res[0];

              // Al actualizar localmente el árbol, buscamos por itemOriginal o id compuesto
              this.selectedRowKeys.forEach((ele: any) => {
                const productos = this.datosProduccionTree.filter((d: any) => d.id === ele);

                productos.forEach((pro: any) => {
                  const npos = this.datosProduccionTree.findIndex((d: any) => d.id === pro.id);
                  if (npos !== -1) {
                    this.datosProduccionTree[npos].op = ordenProduccion.ORDEN_PRO;
                    const pedidoCliente = this.datosProduccionTree[npos].pedidoClienteOp || '';
                    this.datosProduccionTree[npos].pedidoClienteOp = `${pedidoCliente.split(' - ')[0]} - ${pedidoCliente.split(' - ')[1]} - ${ordenProduccion.ORDEN_PRO}`;
                    if (ordenProduccion.ESTADO) this.datosProduccionTree[npos].estado = ordenProduccion.ESTADO;
                  }
                });
              });

              this.selectedRowKeys = [];
              if (this.treeListProduccion) {
                this.treeListProduccion.instance.clearSelection();
                this.treeListProduccion.instance.refresh();
                this.cargarDatos();
              }
              showToast('Orden de producción generada exitosamente: ' + ordenProduccion.ORDEN_PRO, 'success');
            }
          } catch (parseError) {
            console.error("Error al parsear respuesta:", parseError);
            showToast('Error al procesar la respuesta del servidor', 'error');
          }
        },
        error: (error: any) => {
          this.loadingVisible = false;
          console.error("Error al generar orden de producción:", error);
          showToast('Error al generar la orden de producción', 'error');
        }
      });
  }
}