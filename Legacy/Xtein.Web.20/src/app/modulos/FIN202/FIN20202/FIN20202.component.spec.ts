import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FIN20202Component } from './FIN20202.component';

describe('FIN20202Component', () => {
  let component: FIN20202Component;
  let fixture: ComponentFixture<FIN20202Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FIN20202Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FIN20202Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
