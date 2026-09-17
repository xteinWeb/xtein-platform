import { TestBed } from '@angular/core/testing';

import { VEN208Service } from './VEN208.service';

describe('VEN208Service', () => {
  let service: VEN208Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VEN208Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
