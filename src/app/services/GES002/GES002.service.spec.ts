import { TestBed } from '@angular/core/testing';

import { GES002Service } from './GES002.service';

describe('GES002Service', () => {
  let service: GES002Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GES002Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
