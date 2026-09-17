import { TestBed } from '@angular/core/testing';

import { ADM410Service } from './ADM410.service';

describe('ADM410Service', () => {
  let service: ADM410Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ADM410Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
