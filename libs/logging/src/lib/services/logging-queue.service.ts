import { Injectable } from '@angular/core';
import { LogEvent } from '../models/log-event.model';
import { normalizeLogDate } from '../utils/log-date';

@Injectable({ providedIn: 'root' })
export class LoggingQueueService {
  private memory: LogEvent[] = [];
  private database?: Promise<IDBDatabase>;
  private db(): Promise<IDBDatabase> {
    return this.database ??= new Promise((resolve, reject) => {
      const request = indexedDB.open('xtein-platform-errors', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('events', { keyPath: 'ID_EVENTO' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Log storage blocked'));
    });
  }
  async list(): Promise<LogEvent[]> {
    try {
      const db = await this.db();
      const rows = await new Promise<LogEvent[]>((resolve, reject) => {
        const request = db.transaction('events').objectStore('events').getAll();
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      });
      return [...new Map([...rows, ...this.memory].map(row => [row.ID_EVENTO, row])).values()].map(normalizeLogDate);
    } catch { return this.memory.map(normalizeLogDate); }
  }
  async put(event: LogEvent): Promise<void> {
    this.memory.push(event); this.memory = this.memory.slice(-100);
    try {
      const db = await this.db();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('events', 'readwrite'); tx.objectStore('events').put(event);
        tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      });
      this.memory = this.memory.filter(row => row.ID_EVENTO !== event.ID_EVENTO);
      const rows = (await this.list()).sort((a,b) => a.ENCOLADO_EN - b.ENCOLADO_EN);
      for (const row of rows.slice(0, Math.max(0, rows.length - 100))) await this.remove(row.ID_EVENTO);
    } catch { /* Memory queue remains available when browser storage is disabled/full. */ }
  }
  async remove(id: string): Promise<void> {
    this.memory = this.memory.filter(row => row.ID_EVENTO !== id);
    try {
      const db = await this.db();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('events', 'readwrite'); tx.objectStore('events').delete(id);
        tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
      });
    } catch {}
  }
}
