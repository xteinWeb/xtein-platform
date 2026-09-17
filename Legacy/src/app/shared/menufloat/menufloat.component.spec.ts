import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenufloatComponent } from './menufloat.component';

describe('MenufloatComponent', () => {
  let component: MenufloatComponent;
  let fixture: ComponentFixture<MenufloatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MenufloatComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MenufloatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
