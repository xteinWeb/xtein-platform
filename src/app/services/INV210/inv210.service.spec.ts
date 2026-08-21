import { TestBed } from '@angular/core/testing';

import { INV210Service } from './inv210.service';

describe('INV210Service', () => {
  let service: INV210Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(INV210Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
