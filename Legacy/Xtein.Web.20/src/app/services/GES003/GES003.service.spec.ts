import { TestBed } from '@angular/core/testing';

import { GES003Service } from './GES003.service';

describe('GES003Service', () => {
  let service: GES003Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GES003Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
