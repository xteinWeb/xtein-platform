import { TestBed } from '@angular/core/testing';

import { COM200Service } from './com200.service';

describe('COM200Service', () => {
  let service: COM200Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(COM200Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
