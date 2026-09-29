import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
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
} from 'devextreme-angular';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { showToast } from '../../shared/toast/toastComponent';
import dxCheckBox from 'devextreme/ui/check_box';
import { PRO029Service } from 'src/app/services/PRO029/PRO029.service';


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
  ]
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
    { valor: 'Estandar', texto: 'Estándar' }
  ];
  
  // Datos de la tree-list
  datosProduccionTree: any[] = [];
  
  // Modal de secciones
  modalSeccionesVisible: boolean = false;
  seccionSeleccionada: any = null;
  detallesSecciones: any[] = [];
  
  constructor(
    private _sbarreg: SbarraService,
    private sData: PRO029Service,
  ) {
    // La configuración se hará en ngOnInit
  }

  ngOnInit() {
    this.inicializarComponente();
    this.cargarDatos();
  }
  
  private inicializarComponente(): void {
    const user: any = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: 'PRO_PRODUCCION',
      aplicacion: 'PRO026',
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
        },
        error: (error: any) => {
          console.error("Error al cargar datos:", error);
          showToast('Error al cargar los datos de producción', 'error');
          
          // Limpiar datos en caso de error
          this.datosProduccionTree = [];
          this.selectedRowKeys = [];
          this.loadingVisible = false;
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
    try {
      const treeData: any[] = [];
      const elementosRaiz = data.filter(item => item.PRODUCTO === 'RAIZ');
      
      elementosRaiz.forEach(raiz => {
        const elementoPadre = {
          id: raiz.ID_PARTE,
          parent: 'RAIZ',
          producto: raiz.ID_PARTE,
          nombreProducto: raiz.NOMBRE_PARTE,
          pedidoClienteOp: `${raiz.DOCUMENTO_PEDIDO} - ${raiz.NOMBRE_CLIENTE} - ${raiz.ORDEN_PRODUCCION || ''}`,
          op: raiz.ORDEN_PRODUCCION || '',
          cantidad: raiz.COMPROMETIDO,
          fechaHoraProduccion: raiz.FECHA_PEDIDO ? new Date(raiz.FECHA_PEDIDO) : null,
          fechaEntrega: raiz.FECHA_ENTREGA ? new Date(raiz.FECHA_ENTREGA) : null,
          seccion: this.tipoVistaSeleccionado === 'Estandar' 
            ? this.obtenerTextoTodasLasSecciones(raiz.SECCIONES)
            : this.obtenerNombrePrimeraSeccion(raiz.SECCIONES),
          secciones: this.tipoVistaSeleccionado === 'Estandar' 
            ? this.parsearSecciones(raiz.SECCIONES) 
            : [],
          primeraSeccion: this.tipoVistaSeleccionado === 'Básica' 
            ? this.obtenerPrimeraSeccionComoObjeto(raiz.SECCIONES) 
            : null,
          planta: raiz.NOMBRE_PLAN || '',
          codigoAsociado: raiz.CODIGO_ASOCIADO || '',
          cliente: raiz.NOMBRE_CLIENTE
        };
        
        treeData.push(elementoPadre);
        
        // Buscar elementos hijos (partes del producto)
        const elementosHijo = data.filter(item => 
          item.PRODUCTO === raiz.ID_PARTE && item.PRODUCTO !== 'RAIZ'
        );
        
        elementosHijo.forEach((hijo, index) => {
          const elementoHijo = {
            id: `${raiz.ID_PARTE}_${hijo.ID_PARTE}`,
            parent: raiz.ID_PARTE,
            producto: hijo.ID_PARTE,
            nombreProducto: hijo.NOMBRE_PARTE,
            pedidoClienteOp: '',
            op: hijo.ORDEN_PRODUCCION || '',
            cantidad: hijo.COMPROMETIDO,
            fechaHoraProduccion: hijo.FECHA_PEDIDO ? new Date(hijo.FECHA_PEDIDO) : null,
            fechaEntrega: hijo.FECHA_ENTREGA ? new Date(hijo.FECHA_ENTREGA) : null,
            seccion: this.tipoVistaSeleccionado === 'Estandar' 
              ? this.obtenerTextoTodasLasSecciones(hijo.SECCIONES)
              : this.obtenerNombrePrimeraSeccion(hijo.SECCIONES),
            secciones: this.tipoVistaSeleccionado === 'Estandar' 
              ? this.parsearSecciones(hijo.SECCIONES) 
              : [],
            primeraSeccion: this.tipoVistaSeleccionado === 'Básica' 
              ? this.obtenerPrimeraSeccionComoObjeto(hijo.SECCIONES) 
              : null,
            planta: hijo.NOMBRE_PLAN || '',
            codigoAsociado: hijo.CODIGO_ASOCIADO || '',
            cliente: hijo.NOMBRE_CLIENTE
          };
          
          treeData.push(elementoHijo);
        });
      });
      
      this.datosProduccionTree = treeData;
      
    } catch (error) {
      console.error("Error al procesar datos:", error);
      showToast('Error al procesar los datos', 'error');
    }
  }
  
  // Método para obtener la primera sección como objeto (para vista Básica)
  private obtenerPrimeraSeccionComoObjeto(seccionesJson: any): any {
    try {
      if (!seccionesJson) {
        return null;
      }
      
      let secciones: any[] = [];
      
      // Si ya es un array (viene parseado), usarlo directamente
      if (Array.isArray(seccionesJson)) {
        secciones = seccionesJson;
      } else if (typeof seccionesJson === 'string') {
        // Si es string, intentar parsearlo con limpieza
        let jsonLimpio = seccionesJson.trim();
        
        if (jsonLimpio.startsWith('""') && jsonLimpio.endsWith('""')) {
          jsonLimpio = jsonLimpio.slice(1, -1);
        }
        
        if ((jsonLimpio.startsWith('"') && jsonLimpio.endsWith('"')) || 
            (jsonLimpio.startsWith("'") && jsonLimpio.endsWith("'"))) {
          jsonLimpio = jsonLimpio.slice(1, -1);
        }
        
        secciones = JSON.parse(jsonLimpio);
      } else {
        return null;
      }
      
      if (Array.isArray(secciones) && secciones.length > 0) {
        // Devolver la primera sección como objeto procesado
        const primeraSeccion = secciones[0];
        return {
          nombre: primeraSeccion.NOMBRE_SECCION || '',
          cantidad: primeraSeccion.CANTIDAD || 0,
          tiempoProduccion: primeraSeccion.TIEMPO_PRODUCCION || 0,
          estado: primeraSeccion.ESTADO || '',
          cantidadPendiente: primeraSeccion.CANTIDAD_PENDIENTE || 0,
          cantidadProducida: primeraSeccion.CANTIDAD_PRODUCIDA || 0,
          ordenSeccion: primeraSeccion.ORDEN_SECC || 0,
          item: primeraSeccion.ITEM || 0,
          fechaInicioProgramada: primeraSeccion.FECHA_INICIO_PROGRAMADA || '',
          fechaFinProgramada: primeraSeccion.FECHA_FIN_PROGRAMADA || ''
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener primera sección como objeto:', error);
      return null;
    }
  }

  // Método para obtener texto de todas las secciones en una línea
  private obtenerTextoTodasLasSecciones(seccionesJson: any): string {
    try {
      if (!seccionesJson) {
        return 'Sin sección';
      }
      
      let secciones: any[] = [];
      
      // Si ya es un array (viene parseado), usarlo directamente
      if (Array.isArray(seccionesJson)) {
        secciones = seccionesJson;
      } else if (typeof seccionesJson === 'string') {
        // Si es string, intentar parsearlo con limpieza
        let jsonLimpio = seccionesJson.trim();
        
        // Remover posibles comillas dobles duplicadas
        if (jsonLimpio.startsWith('""') && jsonLimpio.endsWith('""')) {
          jsonLimpio = jsonLimpio.slice(1, -1);
        }
        
        // Remover comillas extra al inicio/final
        if ((jsonLimpio.startsWith('"') && jsonLimpio.endsWith('"')) || 
            (jsonLimpio.startsWith("'") && jsonLimpio.endsWith("'"))) {
          jsonLimpio = jsonLimpio.slice(1, -1);
        }
        
        secciones = JSON.parse(jsonLimpio);
      } else {
        return 'Tipo de dato inválido';
      }
      
      if (Array.isArray(secciones) && secciones.length > 0) {
        // Ordenar por ORDEN_SECC para mantener el orden correcto
        const seccionesOrdenadas = secciones.sort((a, b) => (a.ORDEN_SECC || 0) - (b.ORDEN_SECC || 0));
        
        // Crear una línea con todos los nombres de sección
        const nombresSecciones = seccionesOrdenadas.map(seccion => seccion.NOMBRE_SECCION || 'Sin nombre');
        const resultado = nombresSecciones.join(' → ');
        
        return resultado;
      }
      
      return 'Sin sección';
    } catch (error) {
      console.error('Error al parsear secciones JSON:', error);
      return 'Error en secciones';
    }
  }

  // Método para extraer solo el nombre de la primera sección
  private obtenerNombrePrimeraSeccion(seccionesJson: any): string {
    
    try {
      if (!seccionesJson) {
        return 'Sin sección';
      }
      
      let secciones: any[] = [];
      
      // Si ya es un array (viene parseado), usarlo directamente
      if (Array.isArray(seccionesJson)) {
        secciones = seccionesJson;
      } else if (typeof seccionesJson === 'string') {
        // Si es string, intentar parsearlo con limpieza
        let jsonLimpio = seccionesJson.trim();
        
        // Remover posibles comillas dobles duplicadas
        if (jsonLimpio.startsWith('""') && jsonLimpio.endsWith('""')) {
          jsonLimpio = jsonLimpio.slice(1, -1);
        }
        
        // Remover comillas extra al inicio/final
        if ((jsonLimpio.startsWith('"') && jsonLimpio.endsWith('"')) || 
            (jsonLimpio.startsWith("'") && jsonLimpio.endsWith("'"))) {
          jsonLimpio = jsonLimpio.slice(1, -1);
        }
        
        secciones = JSON.parse(jsonLimpio);
      } else {
        return 'Tipo de dato inválido';
      }
      
      if (Array.isArray(secciones) && secciones.length > 0) {
        const resultado = secciones[0].NOMBRE_SECCION || 'Sin sección';
        return resultado;
      }
      
      return 'Sin sección';
    } catch (error) {
      console.error('Error al parsear primera sección JSON:', error);
      return 'Error en sección';
    }
  }

  // Método para parsear las secciones desde JSON (para vista Estándar)
  private parsearSecciones(seccionesJson: any): any[] {
    try {
      if (!seccionesJson) {
        return [];
      }
      
      let secciones: any[] = [];
      
      // Si ya es un array (viene parseado), usarlo directamente
      if (Array.isArray(seccionesJson)) {
        secciones = seccionesJson;
      } else if (typeof seccionesJson === 'string') {
        // Si es string, intentar parsearlo
        let jsonLimpio = seccionesJson.trim();
        
        // Limpiar caracteres problemáticos
        if (jsonLimpio.startsWith('""') && jsonLimpio.endsWith('""')) {
          jsonLimpio = jsonLimpio.slice(1, -1);
        }
        if ((jsonLimpio.startsWith('"') && jsonLimpio.endsWith('"')) || 
            (jsonLimpio.startsWith("'") && jsonLimpio.endsWith("'"))) {
          jsonLimpio = jsonLimpio.slice(1, -1);
        }
        
        secciones = JSON.parse(jsonLimpio);
      } else {
        return [];
      }
      
      // Transformar los datos de la API al formato esperado por la UI
      if (Array.isArray(secciones) && secciones.length > 0) {
        const seccionesProcesadas = secciones
          .sort((a, b) => (a.ORDEN_SECC || 0) - (b.ORDEN_SECC || 0)) // Ordenar primero
          .map(seccion => ({
            nombre: seccion.NOMBRE_SECCION || '',
            cantidad: seccion.CANTIDAD || 0,
            tiempoProduccion: seccion.TIEMPO_PRODUCCION || 0,
            estado: seccion.ESTADO || '',
            cantidadPendiente: seccion.CANTIDAD_PENDIENTE || 0,
            cantidadProducida: seccion.CANTIDAD_PRODUCIDA || 0,
            ordenSeccion: seccion.ORDEN_SECC || 0,
            item: seccion.ITEM || 0,
            fechaInicioProgramada: seccion.FECHA_INICIO_PROGRAMADA || '',
            fechaFinProgramada: seccion.FECHA_FIN_PROGRAMADA || ''
          }));
        
        return seccionesProcesadas;
      }
      
      return [];
    } catch (error) {
      console.error('Error al parsear secciones JSON:', error, seccionesJson);
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

  
  // Método para abrir modal de secciones (ya no necesario)
  abrirModalSecciones(itemData: any): void {
    // Método removido - la vista ya no usa modal
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
    };

    // Mapeo de colores de texto (color)
    const colorMap: { [key: string]: string } = {
      'REGISTRADO': 'rgba(98,121,140,.9)',
      'COMPROMETIDO': 'rgba(100, 150, 170, 0.8)',
      'PROGRAMADO': 'rgba(98,121,140,.75)',
      'EN PROCESO': 'rgba(26,115,232,1)',
      'ANULADO': 'rgba(200,78,224,1)',
      'FINALIZADO': 'rgba(53,204,172,1)',
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
    if (
      e.rowType == "data" &&
      e.cellElement.querySelector(".dx-select-checkbox")
    ) {
      const check = e.cellElement.querySelectorAll(".dx-select-checkbox");
      check.forEach((ele: any, ixfila: any) => {
        const inst = dxCheckBox.getInstance(ele);
        if (e.data.op === '' && e.data.parent === 'RAIZ')
          inst.option("visible", true);
        else 
          inst.option("visible", false);
      });
    }
  }


  onSelectionChanged(e: any): void {
    // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      // Solo permitir selección de elementos que tienen checkbox visible
      // (elementos padre sin OP)
      this.selectedRowKeys = e.selectedRowKeys.filter((key: any) => {
        const item = this.datosProduccionTree.find(d => d.id === key);
        // Solo elementos que cumplen la misma condición que hace visible el checkbox
        return item && (!item.op || item.op.trim() === '') && item.parent === 'RAIZ';
      });
    }, 0);
  }

  
  // Método para generar orden de producción
  generarOrdenOP(e: any): void {
    if (this.selectedRowKeys.length === 0) {
      showToast('Debe seleccionar al menos un elemento para generar la orden de producción', 'warning');
      return;
    }

    // Organiza los datos para generar
    const prm: any[] = [];
    this.selectedRowKeys.forEach((ele: any) => {
      const temp: any = this.datosProduccionTree.filter((d: any) => d.producto === ele || d.id === ele);
      if (temp.length > 0) {
        prm.push({
          DOCUMENTO_PEDIDO: temp[0].pedidoClienteOp ? temp[0].pedidoClienteOp.split(' - ')[0] : '',
          PRODUCTO: temp[0].producto
        });
      }
    });

    if (prm.length === 0) {
      showToast('No se pudieron obtener los datos necesarios para generar la orden de producción', 'error');
      return;
    }

    this.loadingVisible = true;
    
    this.sData.consulta('GENERAR ORDEN PRO', { PEDIDOS: prm, USUARIO: localStorage.getItem('usuario') }, 'PRO-029')
      .pipe(takeUntil(this.unSubscribe))
      .subscribe({
        next: (data: any) => {
          this.loadingVisible = false;
          
          try {
            const res = JSON.parse(data.data);
            
            if (data.token) {
              localStorage.setItem("token", data.token);
            }
            
            if (res[0].ErrMensaje !== '') {
              showToast(res[0].ErrMensaje, 'error');
            } else {
              const ordenProduccion = res[0];
              
              // Actualizar los datos en el tree con la nueva orden de producción
              this.selectedRowKeys.forEach((ele: any) => {
                const productos = this.datosProduccionTree.filter((d: any) => 
                  d.producto === ele || d.id === ele || 
                  (d.parent === 'RAIZ' && d.producto === ele)
                );
                
                productos.forEach((pro: any) => {
                  const npos = this.datosProduccionTree.findIndex((d: any) => 
                    d.id === pro.id
                  );
                  
                  if (npos !== -1) {
                    // Actualizar campo OP
                    this.datosProduccionTree[npos].op = ordenProduccion.ORDEN_PRO;
                    
                    // Actualizar pedidoClienteOp para mostrar la nueva OP
                    const pedidoCliente = this.datosProduccionTree[npos].pedidoClienteOp || '';
                    
                    // Agregar nueva OP
                    this.datosProduccionTree[npos].pedidoClienteOp = `${pedidoCliente} ${ordenProduccion.ORDEN_PRO}`;
                    
                    
                    // Si hay un estado en la respuesta, también actualizarlo
                    if (ordenProduccion.ESTADO) {
                      // Aquí puedes agregar lógica adicional para manejar el estado si es necesario
                    }
                  }
                });
              });
              
              // Limpiar selección y refrescar tree
              this.selectedRowKeys = [];
              if (this.treeListProduccion) {
                this.treeListProduccion.instance.clearSelection();
                this.treeListProduccion.instance.refresh(); // Forzar actualización de la vista
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
