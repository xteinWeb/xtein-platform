import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Resolve } from "@angular/router";
import { environment } from "../../../environments/environment"
import { BehaviorSubject, Observable } from "rxjs";

@Injectable()
export class PRO012Service implements Resolve<any> {
  public apiData: any;
  public onDataChanged: BehaviorSubject<any>;

  constructor(private _httpClient: HttpClient) {
    this.onDataChanged = new BehaviorSubject({});
  }

  resolve(): Observable<any> | Promise<any> | any {
    return new Promise<void>((resolve, reject) => {
      Promise.all([this.getApiData()]).then(() => {
        resolve();
      }, reject);
    });
  }

  getApiData(): Promise<any[]> {
    const url = `${environment.apinet}/invoice-data`;
    return new Promise((resolve, reject) => {
      this._httpClient.get(url).subscribe((response: any) => {
        this.apiData = response;
        this.onDataChanged.next(this.apiData);
        resolve(this.apiData);
      }, reject);
    });
  }
}
