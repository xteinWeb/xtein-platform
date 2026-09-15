
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class S_CXP20104Service {

constructor(private http: HttpClient) {}
  
  private webhookUrl = 'https://agentes.colchonessunmoon.com/webhook/04afca28-4972-4ef2-9595-400a5c430c80';

  sendData(payload: any): Observable<any> {
    return this.http.post(this.webhookUrl, payload);
  }
}
