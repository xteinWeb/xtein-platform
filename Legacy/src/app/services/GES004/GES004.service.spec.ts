import { TestBed } from '@angular/core/testing';

import { GES004Service } from './GES004.service';

describe('GES003Service', () => {
  let service: GES004Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GES004Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
