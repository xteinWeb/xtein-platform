import { TestBed } from '@angular/core/testing';

import { PRO035Service } from './PRO035.service';

describe('PRO035Service', () => {
  let service: PRO035Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PRO035Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
