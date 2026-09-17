import { TestBed } from '@angular/core/testing';

import { VEN155Service } from './VEN155.service';

describe('VEN155Service', () => {
  let service: VEN155Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VEN155Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
