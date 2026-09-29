import { TestBed } from '@angular/core/testing';

import { ADM225Service } from './ADM225.service';

describe('ADM225Service', () => {
  let service: ADM225Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ADM225Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
