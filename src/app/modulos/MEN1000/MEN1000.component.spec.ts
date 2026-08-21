import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MEN1000Component } from './MEN1000.component';

describe('MEN1000Component', () => {
  let component: MEN1000Component;
  let fixture: ComponentFixture<MEN1000Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MEN1000Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MEN1000Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
