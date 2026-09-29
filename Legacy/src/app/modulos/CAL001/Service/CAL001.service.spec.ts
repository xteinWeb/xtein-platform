import { TestBed } from '@angular/core/testing';

import { CAL001Service } from './CAL001.service';

describe('CAL001Service', () => {
  let service: CAL001Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CAL001Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
