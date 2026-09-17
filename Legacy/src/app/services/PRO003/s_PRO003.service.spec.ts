import { TestBed } from '@angular/core/testing';
import { PRO003Service } from './s_PRO003.service';


describe('ParametrosProduccionService', () => {
  let service: PRO003Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PRO003Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
