import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CHATComponent } from './CHAT.component';

describe('CHATComponent', () => {
  let component: CHATComponent;
  let fixture: ComponentFixture<CHATComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CHATComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CHATComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
