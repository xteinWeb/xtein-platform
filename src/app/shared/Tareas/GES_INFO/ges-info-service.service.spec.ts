import { TestBed } from '@angular/core/testing';

import { GesInfoServiceService } from './ges-info-service.service';

describe('GesInfoServiceService', () => {
  let service: GesInfoServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GesInfoServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
