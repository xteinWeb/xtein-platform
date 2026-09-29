import { TestBed } from '@angular/core/testing';

import { PRO019DataService } from './pro019.service';

describe('PRO019DataService', () => {
  let service: PRO019DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PRO019DataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
