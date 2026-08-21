import { TestBed } from '@angular/core/testing';

import { GES007Service } from './GES007.service';

describe('GES007Service', () => {
  let service: GES007Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GES007Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
