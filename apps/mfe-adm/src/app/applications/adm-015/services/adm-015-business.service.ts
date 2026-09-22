import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '@xtein/session';
import { Adm015Service } from './adm-015.service';
import { Adm015Catalog } from '../constants/adm-015-catalog.constants';
import { Adm015Application } from '../constants/adm-015.constants';
import {
  Adm015UsuarioRecord,
  Adm015AutorizacionRecord,
  Adm015PermisoEspecialRecord,
  Adm015UNAsociadaRecord,
  Adm015ConexionRecord,
  Adm015SettingAplicacionRecord
} from '../models/adm-015.model';
import { Adm015SavePayload, Adm015ChangePasswordPayload } from '../models/adm-015-business.model';

@Injectable()
export class Adm015BusinessService {
  private readonly api = inject(Adm015Service);
  private readonly session = inject(SessionService);

  get identity() {
    return {
      ID_APLICACION: Adm015Application.Id,
      USUARIO: this.session.current?.userId ?? ''
    };
  }

  decode<T>(response: unknown): T[] {
    let data = response;
    for (let depth = 0; depth < 4; depth++) {
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
          continue;
        } catch {
          break;
        }
      }
      if (data && typeof data === 'object' && !Array.isArray(data) && 'data' in data) {
        data = (data as { data: unknown }).data;
        continue;
      }
      break;
    }
    const rows = Array.isArray(data) ? data : data == null ? [] : [data];
    const error = rows.find(row => row && typeof row === 'object' && 'ErrMensaje' in row && (row as { ErrMensaje: unknown }).ErrMensaje);
    if (error) {
      throw new Error(String((error as { ErrMensaje: unknown }).ErrMensaje));
    }
    return rows as T[];
  }

  async catalog(name: keyof typeof Adm015Catalog, data: unknown = {}): Promise<unknown[]> {
    const [endpoint, action] = Adm015Catalog[name];
    return this.decode<unknown>(await firstValueFrom(this.api.request(endpoint, action, data)));
  }

  async queryUsers(filterCriteria: unknown = {}): Promise<Adm015UsuarioRecord[]> {
    const prm = { USUARIOS: filterCriteria };
    return this.decode<Adm015UsuarioRecord>(await firstValueFrom(this.api.query('consulta', prm)));
  }

  async loadAutorizaciones(usuario: string, rol: string, accion = 'r_refrescar'): Promise<Adm015AutorizacionRecord[]> {
    const prm = { USUARIO: usuario, ACCION: accion, ID_ROL: rol };
    return this.decode<Adm015AutorizacionRecord>(await firstValueFrom(this.api.query('AUTORIZACIONES', prm)));
  }

  async loadPermisosEspeciales(usuario: string): Promise<Adm015PermisoEspecialRecord[]> {
    const prm = { USUARIO: usuario };
    return this.decode<Adm015PermisoEspecialRecord>(await firstValueFrom(this.api.query('PERMISOS ESPECIALES', prm)));
  }

  async loadUNAsociadas(usuario: string): Promise<Adm015UNAsociadaRecord[]> {
    const prm = { USUARIO: usuario };
    return this.decode<Adm015UNAsociadaRecord>(await firstValueFrom(this.api.query('UN ASOCIADAS', prm)));
  }

  async loadConexiones(usuario: string): Promise<Adm015ConexionRecord[]> {
    const prm = { USUARIO: usuario };
    return this.decode<Adm015ConexionRecord>(await firstValueFrom(this.api.query('CONEXIONES', prm)));
  }

  async loadSettings(usuario: string): Promise<Adm015SettingAplicacionRecord[]> {
    const prm = { USUARIO: usuario };
    return this.decode<Adm015SettingAplicacionRecord>(await firstValueFrom(this.api.query('settings_aplicacion', prm)));
  }

  async saveUser(action: string, payload: Adm015SavePayload): Promise<void> {
    await firstValueFrom(this.api.save(action, payload));
  }

  async deleteUser(usuario: string): Promise<void> {
    await firstValueFrom(this.api.delete({ USUARIO: usuario }));
  }

  async changePassword(payload: Adm015ChangePasswordPayload): Promise<void> {
    await firstValueFrom(this.api.changePassword(payload));
  }

  async checkUserExists(username: string, action: string): Promise<boolean> {
    try {
      const res = this.decode<{ EXISTE?: boolean; ErrMensaje?: string }>(
        await firstValueFrom(this.api.checkUserExists(username, action))
      );
      return Boolean(res[0]?.EXISTE);
    } catch {
      return false;
    }
  }
}
