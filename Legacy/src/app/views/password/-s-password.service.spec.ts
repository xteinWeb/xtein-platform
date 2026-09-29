import { TestBed } from '@angular/core/testing';

import { SPasswordService } from './-s-password.service';

describe('SPasswordService', () => {
  let service: SPasswordService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SPasswordService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
