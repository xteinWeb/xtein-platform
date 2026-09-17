import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DB00101Component } from './DB00101.component';

describe('DB00101Component', () => {
  let component: DB00101Component;
  let fixture: ComponentFixture<DB00101Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DB00101Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DB00101Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
