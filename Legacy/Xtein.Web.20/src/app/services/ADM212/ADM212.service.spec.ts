import { TestBed } from '@angular/core/testing';

import { Adm212Service } from './ADM015.service';

describe('Adm212Service', () => {
  let service: Adm212Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Adm212Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
