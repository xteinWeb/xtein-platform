import { Injectable } from "@angular/core";

import { BehaviorSubject } from "rxjs";

@Injectable()
export class PRO013Service {
  public onDataChanged: BehaviorSubject<any>;
  constructor() {
    this.onDataChanged = new BehaviorSubject({});
  }
}
