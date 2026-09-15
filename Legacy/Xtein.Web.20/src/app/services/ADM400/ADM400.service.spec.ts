import { TestBed } from '@angular/core/testing';

import { ADM400Service } from './ADM400.service';

describe('ADM400Service', () => {
  let service: ADM400Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ADM400Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
