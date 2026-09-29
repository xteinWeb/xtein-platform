import { TestBed } from '@angular/core/testing';

import { ADM015Service } from './ADM015.service';

describe('ADM015Service', () => {
  let service: ADM015Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ADM015Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
