import { TestBed } from '@angular/core/testing';

import { PRO032Service } from './PRO032.service';

describe('PRO032Service', () => {
  let service: PRO032Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PRO032Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
