import { ComponentFixture, TestBed } from '@angular/core/testing';

import { INV210Component } from './INV210.component';

describe('INV210Component', () => {
  let component: INV210Component;
  let fixture: ComponentFixture<INV210Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ INV210Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(INV210Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
