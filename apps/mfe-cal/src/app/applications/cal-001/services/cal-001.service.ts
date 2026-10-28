import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { XteinApiAccessMode, XteinApiClientService, XteinDataApiResponse } from '@xtein/api-client';
import type { LogContext } from '@xtein/logging';
import { Cal001Action, Cal001Endpoint, Cal001Limits, Cal001QueryAction } from '../constants/cal-001.constants';
import { createCal001Log } from '../constants/cal-001-logging.constants';
import type {
  Cal001Borrador,
  Cal001Causa,
  Cal001Cliente,
  Cal001ConsultaFiltro,
  Cal001ConsultaResultado,
  Cal001GuardarResultado,
  Cal001HistorialDetalle,
  Cal001ListasCliente,
  Cal001Operario,
  Cal001PartesProducto,
  Cal001Permisos,
  Cal001Producto,
  Cal001RegistroCompleto
} from '../models/cal-001.model';
import { Cal001BackendError, decodificar } from '../utils/cal-001-errores';
import { Cal001OperacionPendiente, construirPayload, payloadAgregar, payloadFoto } from '../utils/cal-001-payload';

/**
 * Llamadas de CAL-001, solo a /api/CAL001N/* y siempre por XteinApiClientService (JSON, sin multipart).
 * La identidad (usuario, empresa, UN) y los permisos los pone el back desde el token: nunca se envían aquí.
 * Toda escritura lleva ID_OPERACION (contrato §2.5): un reintento de la misma operación reutiliza el ID.
 */
@Injectable()
export class Cal001Service {
  private readonly api = inject(XteinApiClientService);
  private readonly log = createCal001Log();
  /** Guardado (new/update/agregar) pendiente de confirmar: su ID se reutiliza si se reintenta lo mismo. */
  private readonly operacion = new Cal001OperacionPendiente();

  private async ejecutar<T>(endpoint: string, action: string, data: unknown, logContext: LogContext): Promise<T[]> {
    const respuesta = await firstValueFrom(this.api.execute<XteinDataApiResponse<unknown>>({
      endpoint, action, data, logContext, accessMode: XteinApiAccessMode.Authenticated
    }));
    return decodificar<T>(respuesta);
  }

  private consultar<T>(action: Cal001QueryAction, data: unknown = {}): Promise<T[]> {
    return this.ejecutar<T>(Cal001Endpoint.Query, action, data, this.log.Query);
  }

  private async primero<T>(action: Cal001QueryAction, data: unknown = {}): Promise<T> {
    const [fila] = await this.consultar<T>(action, data);
    if (!fila) throw new Cal001BackendError('El servidor no devolvió datos.');
    return fila;
  }

  permisos(): Promise<Cal001Permisos> {
    return this.primero<Cal001Permisos>(Cal001Action.Permissions);
  }

  causas(): Promise<Cal001Causa[]> {
    return this.consultar<Cal001Causa>(Cal001Action.Causes);
  }

  productos(texto: string): Promise<Cal001Producto[]> {
    return this.consultar<Cal001Producto>(Cal001Action.Products, { TEXTO: texto, TOP: Cal001Limits.SearchTop });
  }

  partesProducto(producto: string): Promise<Cal001PartesProducto> {
    return this.primero<Cal001PartesProducto>(Cal001Action.ProductParts, { PRODUCTO: producto });
  }

  operarios(texto: string): Promise<Cal001Operario[]> {
    return this.consultar<Cal001Operario>(Cal001Action.Operators, { TEXTO: texto, TOP: Cal001Limits.SearchTop });
  }

  clientes(texto: string): Promise<Cal001Cliente[]> {
    return this.consultar<Cal001Cliente>(Cal001Action.Clients, { TEXTO: texto, TOP: Cal001Limits.SearchTop });
  }

  listasCliente(): Promise<Cal001ListasCliente> {
    return this.primero<Cal001ListasCliente>(Cal001Action.ClientLists);
  }

  consulta(filtro: Cal001ConsultaFiltro, pagina: number, tamano: number = Cal001Limits.PageSize): Promise<Cal001ConsultaResultado> {
    const datos: Record<string, unknown> = { FECHA_DESDE: filtro.FECHA_DESDE, FECHA_HASTA: filtro.FECHA_HASTA, PAGINA: pagina, TAMANO: tamano };
    if (filtro.ORIGEN) datos['ORIGEN'] = filtro.ORIGEN;
    if (filtro.DOCUMENTO.trim()) datos['DOCUMENTO'] = filtro.DOCUMENTO.trim();
    // Solo el gestor ve el campo; el SP responde E05 a los demás (DP-L).
    if (filtro.ID_EMPLEADO?.trim()) datos['ID_EMPLEADO'] = filtro.ID_EMPLEADO.trim();
    if (filtro.FECHA_BASE) datos['FECHA_BASE'] = filtro.FECHA_BASE;
    return this.primero<Cal001ConsultaResultado>(Cal001Action.Query, datos);
  }

  registro(idRegistro: number): Promise<Cal001RegistroCompleto> {
    return this.primero<Cal001RegistroCompleto>(Cal001Action.QueryRecord, { ID_REGISTRO_NC: idRegistro });
  }

  historial(idRegistro: number): Promise<Cal001HistorialDetalle[]> {
    return this.consultar<Cal001HistorialDetalle>(Cal001Action.History, { ID_REGISTRO_NC: idRegistro });
  }

  async guardar(borrador: Cal001Borrador): Promise<Cal001GuardarResultado> {
    const accion = borrador.ID_REGISTRO_NC ? Cal001Action.Update : Cal001Action.New;
    const id = this.operacion.para(accion, borrador);
    return this.escribir(accion, construirPayload(borrador, accion, id));
  }

  /** Fase 2: anexa al registro guardado solo lo nuevo del borrador (delta). */
  async agregar(borrador: Cal001Borrador, original: Cal001RegistroCompleto): Promise<Cal001GuardarResultado> {
    const id = this.operacion.para(Cal001Action.Add, { borrador, VERSION: original.REGISTRO.VERSION });
    return this.escribir(Cal001Action.Add, payloadAgregar(borrador, original, id));
  }

  /** REPETIDA: 1 (el SP ya había aplicado este ID_OPERACION) es un éxito normal. */
  private async escribir(accion: string, datos: unknown): Promise<Cal001GuardarResultado> {
    const [fila] = await this.ejecutar<Cal001GuardarResultado>(Cal001Endpoint.Save, accion, datos, this.log.Save);
    if (!fila) throw new Cal001BackendError('El servidor no devolvió el resultado del guardado.');
    this.operacion.confirmar();
    return fila;
  }

  /** `idOperacion` es el de la foto en cola: se conserva en sus reintentos. */
  async subirFoto(idRegistro: number, nombre: string, base64: string, idOperacion: string): Promise<number> {
    const [fila] = await this.ejecutar<{ ID_FOTO_NC: number }>(Cal001Endpoint.PhotoUpload, Cal001Action.PhotoAdd,
      payloadFoto(idRegistro, nombre, base64, idOperacion), this.log.Photo);
    return fila?.ID_FOTO_NC ?? 0;
  }

  /** La foto llega como base64 en JSON (nunca por URL directa); el componente arma un data: URL. */
  async foto(idFoto: number): Promise<{ MIME: string; BASE64: string }> {
    const [fila] = await this.ejecutar<{ MIME: string; BASE64: string }>(Cal001Endpoint.Photo, Cal001Action.PhotoPath,
      { ID_FOTO_NC: idFoto }, this.log.Photo);
    if (!fila?.BASE64) throw new Cal001BackendError('La foto no tiene contenido.');
    return fila;
  }

  async retirarFoto(idFoto: number, motivo: string): Promise<void> {
    await this.ejecutar(Cal001Endpoint.PhotoRemove, Cal001Action.PhotoRemove,
      { ID_FOTO_NC: idFoto, MOTIVO: motivo || null }, this.log.Photo);
  }
}
