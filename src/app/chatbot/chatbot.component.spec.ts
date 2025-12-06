import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatbotComponent } from './chatbot.component';

describe('ChatbotComponent', () => {
  let component: ChatbotComponent;
  let fixture: ComponentFixture<ChatbotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatbotComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChatbotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with chat closed', () => {
    expect(component.isOpen).toBeFalse();
  });

  it('should toggle chat window', () => {
    component.toggleChat();
    expect(component.isOpen).toBeTrue();
    component.toggleChat();
    expect(component.isOpen).toBeFalse();
  });

  it('should have welcome message on init', () => {
    expect(component.messages.length).toBeGreaterThan(0);
    expect(component.messages[0].isBot).toBeTrue();
  });
});

