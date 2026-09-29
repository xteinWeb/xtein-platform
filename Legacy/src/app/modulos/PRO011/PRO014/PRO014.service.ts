import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Resolve } from "@angular/router";
import { BehaviorSubject, Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable()
export class PRO014Service  {
  public apiData: any;
  public onDataChanged: BehaviorSubject<any>;

  constructor(private http: HttpClient) {
    this.onDataChanged = new BehaviorSubject({});
  }

}
