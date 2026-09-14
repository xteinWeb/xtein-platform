import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FIN20203Component } from './FIN20203.component';

describe('FIN20203Component', () => {
  let component: FIN20203Component;
  let fixture: ComponentFixture<FIN20203Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FIN20203Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FIN20203Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
