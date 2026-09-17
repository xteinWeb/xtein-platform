import { TestBed } from '@angular/core/testing';

import { CAL002Service } from './CAL002.service';

describe('CAL002Service', () => {
  let service: CAL002Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CAL002Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
