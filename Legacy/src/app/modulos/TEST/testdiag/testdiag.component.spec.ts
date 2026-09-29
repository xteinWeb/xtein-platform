import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestdiagComponent } from './testdiag.component';

describe('TestdiagComponent', () => {
  let component: TestdiagComponent;
  let fixture: ComponentFixture<TestdiagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestdiagComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestdiagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
