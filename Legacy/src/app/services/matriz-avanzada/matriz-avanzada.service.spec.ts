import { TestBed } from '@angular/core/testing';
import { MatrizAvanzadaService } from './matriz-avanzada.service';


describe('MatrizAvanzadaService', () => {
  let service: MatrizAvanzadaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatrizAvanzadaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
