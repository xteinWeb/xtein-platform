import { TestBed } from '@angular/core/testing';

import { PRO031Service } from './PRO031.service';

describe('PRO031Service', () => {
  let service: PRO031Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PRO031Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
