import { TestBed } from '@angular/core/testing';

import { PRO024Service } from './pro024.service';

describe('PRO024Service', () => {
  let service: PRO024Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PRO024Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
