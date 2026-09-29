import { TestBed } from '@angular/core/testing';

import { PRO033Service } from '../PRO033.service';

describe('PRO033Service', () => {
  let service: PRO033Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PRO033Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
