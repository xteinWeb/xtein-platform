import { TestBed } from '@angular/core/testing';

import { INV014Service } from './INV014.service';

describe('INV014Service', () => {
  let service: INV014Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(INV014Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
