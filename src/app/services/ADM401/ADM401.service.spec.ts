import { TestBed } from '@angular/core/testing';

import { ADM401Service } from './ADM401.service';

describe('ADM401Service', () => {
  let service: ADM401Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ADM401Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
