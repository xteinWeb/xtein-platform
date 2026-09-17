import { TestBed } from '@angular/core/testing';

import { SINV209Service } from './s_INV209.service';

describe('SINV209Service', () => {
  let service: SINV209Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SINV209Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
