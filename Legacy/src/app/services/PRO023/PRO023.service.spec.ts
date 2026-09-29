import { TestBed } from '@angular/core/testing';

import { PRO023Service } from './PRO023.service';

describe('PRO023Service', () => {
  let service: PRO023Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PRO023Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
