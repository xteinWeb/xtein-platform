import { TestBed } from '@angular/core/testing';

import { GES001Service } from './GES001.service';

describe('GES001Service', () => {
  let service: GES001Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GES001Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
