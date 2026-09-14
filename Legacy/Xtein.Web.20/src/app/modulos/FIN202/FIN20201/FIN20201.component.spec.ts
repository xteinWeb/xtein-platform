import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FIN20201Component } from './FIN20201.component';

describe('FIN20201Component', () => {
  let component: FIN20201Component;
  let fixture: ComponentFixture<FIN20201Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FIN20201Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FIN20201Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
