import { TestBed } from '@angular/core/testing';

import { COMO1Service } from './s_COM01.service';

describe('COMO1Service', () => {
  let service: COMO1Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(COMO1Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
