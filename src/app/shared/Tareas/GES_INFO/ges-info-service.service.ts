import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, Subject, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GesInfoServiceService {

  public loadingVisible: boolean = false;

  private subjectGesproInfo = new Subject<any>();
  private subjectActividades = new Subject<any>();
  private subjectCondiciones = new Subject<any>();

  constructor(private http:HttpClient) { }
}
