import { TestBed } from '@angular/core/testing';

import { MEN1000Service } from './MEN1000.service';

describe('MEN1000Service', () => {
  let service: MEN1000Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MEN1000Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
