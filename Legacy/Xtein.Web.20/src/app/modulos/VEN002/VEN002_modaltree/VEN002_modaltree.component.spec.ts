import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VEN002ModaltreeComponent } from './VEN002_modaltree.component';

describe('VEN002ModaltreeComponent', () => {
  let component: VEN002ModaltreeComponent;
  let fixture: ComponentFixture<VEN002ModaltreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VEN002ModaltreeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VEN002ModaltreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
