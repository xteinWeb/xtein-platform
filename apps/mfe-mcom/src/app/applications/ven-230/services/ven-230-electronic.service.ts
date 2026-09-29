import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { XTEIN_API_CONFIG } from '@xtein/api-client';
import { SessionService } from '@xtein/session';
import { XTEIN_LOG_CONTEXT } from '@xtein/logging';
import { createVen230Log } from '../constants/ven-230-logging.constants';
import { Ven230ElectronicDocument } from '../models/ven-230-electronic.model';
@Injectable()
export class Ven230ElectronicService {
 private readonly config=inject(XTEIN_API_CONFIG);
 private readonly session=inject(SessionService);
 private readonly http=inject(HttpClient);
 private readonly log=createVen230Log();
 private request(data:Ven230ElectronicDocument,action:string){
  const session=this.session.current;if(!session)throw new Error('No hay una sesión activa.');
  const base=this.config.electronicDocumentBaseUrl;if(!base)throw new Error('El servicio de documentos electrónicos no está configurado.');
  return {url:base.replace(/\/$/,'')+'/api/'+encodeURIComponent(data.tipoDocElectronico)+'/'+action,
   body:{prmAccion:action,prmDatos:JSON.stringify(data),prmConexion:session.companyId,prmTokenDatos:session.token},
   context:new HttpContext().set(XTEIN_LOG_CONTEXT,this.log.Electronic)};
 }
 send(data:Ven230ElectronicDocument){const req=this.request(data,'enviar');return this.http.post<{data:unknown}>(req.url,req.body,{context:req.context});}
 pdf(data:Ven230ElectronicDocument){const req=this.request(data,'pdf');return this.http.post(req.url,req.body,{context:req.context,responseType:'blob'});}
 get companyId(){return this.session.current?.companyId ?? '';}
}
