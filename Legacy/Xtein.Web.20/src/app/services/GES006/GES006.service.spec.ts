import { TestBed } from '@angular/core/testing';

import { GES006Service } from './GES006.service';

describe('GES006Service', () => {
  let service: GES006Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GES006Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
