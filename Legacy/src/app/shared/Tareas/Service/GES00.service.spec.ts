import { TestBed } from '@angular/core/testing';

import { GES00Service } from './GES00.service';

describe('GES00Service', () => {
  let service: GES00Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GES00Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
