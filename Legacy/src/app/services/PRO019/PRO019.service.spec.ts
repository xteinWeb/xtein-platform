import { TestBed } from '@angular/core/testing';

import { PRO019Service } from './PRO019.service';

describe('PRO019Service', () => {
  let service: PRO019Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PRO019Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
