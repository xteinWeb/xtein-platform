import { TestBed } from '@angular/core/testing';

import { COM207Service } from './com207.service';

describe('COM207Service', () => {
  let service: COM207Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(COM207Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
