import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { XteinApiAccessMode, XteinApiClientService, XteinDataApiResponse } from '@xtein/api-client';
import type { LogContext } from '@xtein/logging';
import type { XteinRecordFilterCriterion } from '@xtein/ui';
import { Cal003Action, Cal003Application, Cal003Endpoint, Cal003Limits } from '../constants/cal-003.constants';
import { createCal003Log } from '../constants/cal-003-logging.constants';
import type {
  Cal003Ajuste,
  Cal003Consecutivo,
  Cal003ArbolProducto,
  Cal003Area,
  Cal003Aviso,
  Cal003Bodega,
  Cal003Cliente,
  Cal003Destino,
  Cal003EntradaEncabezado,
  Cal003EntradaGuardada,
  Cal003EntradaProducto,
  Cal003Entrega,
  Cal003EntregaCompleta,
  Cal003Historial,
  Cal003InventarioFila,
  Cal003Permisos,
  Cal003Precios,
  Cal003ProductoLista,
  Cal003Resultado,
  Cal003Servicio,
  Cal003ServicioCliente,
  Cal003TipoServicio,
  Cal003ServicioCompleto,
  Cal003ServicioEntregable,
  Cal003ServicioFiltro,
  Cal003Traslado
} from '../models/cal-003.model';
import { Cal003BackendError, decodificar } from '../utils/cal-003-errores';

/**
 * Llamadas de CAL-003, solo a /api/CAL003/* por XteinApiClientService.
 * La identidad (usuario, empresa, UN) y los permisos los pone el back desde el token: nunca se envían aquí.
 */
@Injectable()
export class Cal003Service {
  private readonly api = inject(XteinApiClientService);
  private readonly log = createCal003Log();

  private async ejecutar<T>(endpoint: string, action: string, data: unknown, logContext: LogContext): Promise<T[]> {
    const respuesta = await firstValueFrom(this.api.execute<XteinDataApiResponse<unknown>>({
      endpoint, action, data, logContext, accessMode: XteinApiAccessMode.Authenticated
    }));
    return decodificar<T>(respuesta);
  }

  private consultar<T>(action: Cal003Action, data: unknown = {}): Promise<T[]> {
    return this.ejecutar<T>(Cal003Endpoint.Query, action, data, this.log.Query);
  }

  private async primero<T>(action: Cal003Action, data: unknown = {}): Promise<T> {
    const [fila] = await this.consultar<T>(action, data);
    if (!fila) throw new Cal003BackendError('El servidor no devolvió datos.');
    return fila;
  }

  private async guardar(action: Cal003Action, data: unknown): Promise<Cal003Resultado> {
    const [fila] = await this.ejecutar<Cal003Resultado>(Cal003Endpoint.Save, action, data, this.log.Save);
    if (!fila) throw new Cal003BackendError('El servidor no devolvió el resultado.');
    return fila;
  }

  // ================= Listas de apoyo =================

  permisos(): Promise<Cal003Permisos> {
    return this.primero<Cal003Permisos>(Cal003Action.Permissions);
  }

  clientes(texto = ''): Promise<Cal003Cliente[]> {
    return this.consultar<Cal003Cliente>(Cal003Action.Clients, { TEXTO: texto, TOP: Cal003Limits.ClientsTop });
  }

  bodegas(): Promise<Cal003Bodega[]> {
    return this.consultar<Cal003Bodega>(Cal003Action.Warehouses);
  }

  /** Documento que tendrá el próximo registro del movimiento (ENTRADA, TRASLADO o SALIDA). */
  async consecutivo(movimiento: string): Promise<Cal003Consecutivo | null> {
    const filas = await this.consultar<Cal003Consecutivo>(Cal003Action.NextDocument, { MOVIMIENTO: movimiento, ID_APLICACION: Cal003Application.Id });
    return filas[0] ?? null;
  }

  areas(): Promise<Cal003Area[]> {
    return this.consultar<Cal003Area>(Cal003Action.Areas);
  }

  tiposServicio(): Promise<Cal003TipoServicio[]> {
    return this.consultar<Cal003TipoServicio>(Cal003Action.ServiceTypes);
  }

  /** Juegos y productos activos que se pueden recibir. */
  productos(): Promise<Cal003ProductoLista[]> {
    return this.consultar<Cal003ProductoLista>(Cal003Action.Products);
  }

  /** Árbol del producto por código interno o asociado (de un juego, de uno de sus productos o de un PF suelto). */
  arbolProducto(codigo: string): Promise<Cal003ArbolProducto> {
    return this.primero<Cal003ArbolProducto>(Cal003Action.ProductTree, { CODIGO: codigo });
  }

  avisos(): Promise<Cal003Aviso[]> {
    return this.consultar<Cal003Aviso>(Cal003Action.Notices);
  }

  // ================= Entrada =================

  servicios(filtro: Cal003ServicioFiltro): Promise<Cal003Servicio[]> {
    return this.consultar<Cal003Servicio>(Cal003Action.Services, {
      TEXTO: filtro.TEXTO.trim(), FECHA_DESDE: filtro.FECHA_DESDE, FECHA_HASTA: filtro.FECHA_HASTA
    });
  }

  /** Entradas con los criterios del buscador de la barra (sin criterios: todas). */
  buscarServicios(criterios: XteinRecordFilterCriterion[]): Promise<Cal003Servicio[]> {
    return this.consultar<Cal003Servicio>(Cal003Action.Services, { FILTRO: criterios });
  }

  servicio(idServicio: number): Promise<Cal003ServicioCompleto> {
    return this.primero<Cal003ServicioCompleto>(Cal003Action.Service, { ID_SERVICIO: idServicio });
  }

  async entradaNueva(entrada: Cal003EntradaEncabezado, productos: Cal003EntradaProducto[]): Promise<Cal003EntradaGuardada[]> {
    return this.ejecutar<Cal003EntradaGuardada>(Cal003Endpoint.Save, Cal003Action.EntryNew,
      { ENTRADA: entrada, PRODUCTOS: productos }, this.log.Save);
  }

  entradaAnular(idServicio: number, version: string, observacion: string): Promise<Cal003Resultado> {
    return this.guardar(Cal003Action.EntryVoid, { ID_SERVICIO: idServicio, VERSION: version, OBSERVACION: observacion });
  }

  // ================= Traslado =================

  serviciosTrasladables(): Promise<Cal003ServicioCompleto[]> {
    return this.consultar<Cal003ServicioCompleto>(Cal003Action.Transferable);
  }

  traslados(criterios: XteinRecordFilterCriterion[] = []): Promise<Cal003Traslado[]> {
    return this.consultar<Cal003Traslado>(Cal003Action.Transfers, { FILTRO: criterios });
  }

  trasladoEnviar(idServicio: number, destino: string, unidades: number[]): Promise<Cal003Resultado> {
    return this.guardar(Cal003Action.TransferSend, { ID_SERVICIO: idServicio, ID_UN_BODEGA_DESTINO: destino, UNIDADES: unidades });
  }

  // ================= Salida · Entrega =================

  serviciosEntregables(idCliente: string, bodega: string): Promise<Cal003ServicioEntregable[]> {
    return this.consultar<Cal003ServicioEntregable>(Cal003Action.Deliverable, { ID_CLIENTE: idCliente, ID_UN_BODEGA: bodega });
  }

  entregas(criterios: XteinRecordFilterCriterion[] = []): Promise<Cal003Entrega[]> {
    return this.consultar<Cal003Entrega>(Cal003Action.Deliveries, { FILTRO: criterios });
  }

  entrega(idEntrega: number): Promise<Cal003EntregaCompleta> {
    return this.primero<Cal003EntregaCompleta>(Cal003Action.Delivery, { ID_ENTREGA: idEntrega });
  }

  async entregaDespachar(idCliente: string, bodega: string, servicios: number[]): Promise<Cal003Entrega> {
    const [fila] = await this.ejecutar<Cal003Entrega>(Cal003Endpoint.Save, Cal003Action.DeliveryDispatch,
      { ID_CLIENTE: idCliente, ID_UN_BODEGA: bodega, SERVICIOS: servicios }, this.log.Save);
    if (!fila) throw new Cal003BackendError('El servidor no devolvió el documento de entrega.');
    return fila;
  }

  entregaAnularLinea(idEntrega: number, idServicio: number, observacion: string): Promise<Cal003Resultado> {
    return this.guardar(Cal003Action.DeliveryVoidLine, { ID_ENTREGA: idEntrega, ID_SERVICIO: idServicio, OBSERVACION: observacion });
  }

  async soporteAdjuntar(idEntrega: number, nombre: string, base64: string): Promise<Cal003Resultado> {
    const [fila] = await this.ejecutar<Cal003Resultado>(Cal003Endpoint.SupportUpload, Cal003Action.SupportAttach,
      { ID_ENTREGA: idEntrega, NOMBRE_ORIGINAL: nombre, BASE64: base64 }, this.log.Support);
    if (!fila) throw new Cal003BackendError('El servidor no devolvió el resultado.');
    return fila;
  }

  /** El soporte llega como base64 en JSON; el componente arma un data: URL. */
  async soporte(idEntrega: number): Promise<{ MIME: string; BASE64: string; NOMBRE: string }> {
    const [fila] = await this.ejecutar<{ MIME: string; BASE64: string; NOMBRE: string }>(Cal003Endpoint.Support, Cal003Action.SupportView,
      { ID_ENTREGA: idEntrega }, this.log.Support);
    if (!fila?.BASE64) throw new Cal003BackendError('El soporte no tiene contenido.');
    return fila;
  }

  // ================= Salida · Ajuste =================

  serviciosAjustables(): Promise<Cal003Servicio[]> {
    return this.consultar<Cal003Servicio>(Cal003Action.Adjustable);
  }

  ajustes(criterios: XteinRecordFilterCriterion[] = []): Promise<Cal003Ajuste[]> {
    return this.consultar<Cal003Ajuste>(Cal003Action.Adjustments, { FILTRO: criterios });
  }

  ajusteProponer(idServicio: number, destino: Cal003Destino): Promise<Cal003Resultado> {
    return this.guardar(Cal003Action.AdjustmentPropose, { ID_SERVICIO: idServicio, DESTINO: destino });
  }

  // ================= Precios ESPECIAL =================

  precios(): Promise<Cal003Precios> {
    return this.primero<Cal003Precios>(Cal003Action.SpecialPrices);
  }

  preciosGuardar(precios: { ID_SERVICIO: number; PRECIO: number }[]): Promise<Cal003Resultado> {
    return this.guardar(Cal003Action.PricesSave, { PRECIOS: precios });
  }

  // ================= Consultas =================

  inventarioBodega(bodega: string): Promise<Cal003InventarioFila[]> {
    return this.consultar<Cal003InventarioFila>(Cal003Action.StockByWarehouse, { ID_UN_BODEGA: bodega });
  }

  serviciosCliente(idCliente: string): Promise<Cal003ServicioCliente[]> {
    return this.consultar<Cal003ServicioCliente>(Cal003Action.ClientServices, { ID_CLIENTE: idCliente });
  }

  historial(idServicio: number): Promise<Cal003Historial[]> {
    return this.consultar<Cal003Historial>(Cal003Action.History, { ID_SERVICIO: idServicio });
  }
}
