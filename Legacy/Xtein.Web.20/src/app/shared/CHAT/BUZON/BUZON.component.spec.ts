import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BUZONComponent } from './BUZON.component';

describe('BUZONComponent', () => {
  let component: BUZONComponent;
  let fixture: ComponentFixture<BUZONComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BUZONComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BUZONComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
