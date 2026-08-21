import { TestBed } from '@angular/core/testing';

import { ADM301Service } from './ADM301.service';

describe('ADM301Service', () => {
  let service: ADM301Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ADM301Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
