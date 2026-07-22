import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SsoBridgeComponent } from './sso-bridge.component';

describe('SsoBridgeComponent', () => {
  let component: SsoBridgeComponent;
  let fixture: ComponentFixture<SsoBridgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SsoBridgeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SsoBridgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
