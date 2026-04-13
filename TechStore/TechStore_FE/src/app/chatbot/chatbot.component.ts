import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChatbotService } from '../Service/chatbot.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
})
export class ChatbotComponent implements OnInit {
  @ViewChild('chatBody') private chatBodyContainer!: ElementRef;

  showChat = false;
  showForm = false;
  inputText = '';
  userName = '';
  userPhone = '';
  sessionId = '';
  isBrowser: boolean;
  isSending = false;

  messages: { from: 'user' | 'bot'; text: string }[] = [];
  showSuggestions = false;
  suggestionChips = [
    'iPhone 15 Pro Max',
    'Tư vấn Laptop',
    'Địa chỉ cửa hàng',
    'Liên hệ',
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private chatbotService: ChatbotService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {}

  toggleChat() {
    this.showChat = !this.showChat;
    this.showForm = this.showChat;
    this.messages = [];
  }

  submitUserInfo() {
    if (!this.userName.trim() || !this.userPhone.trim()) return;

    this.showForm = false;
    this.loadSessionId();
    this.loadChatHistory();

    if (this.messages.length === 0) {
      this.addWelcomeMessages();
    } else {
      this.showSuggestions = true;
    }

    if (!this.sessionId) {
      const userId = this.deriveUserIdFromPhone(this.userPhone);
      this.chatbotService.createSession(userId).subscribe({
        next: (sessionId: string) => {
          this.sessionId = sessionId;
          this.saveSessionId();
        },
        error: () => {
          this.messages.push({
            from: 'bot',
            text: 'Không thể khởi tạo phiên chat. Anh/Chị vui lòng thử lại sau.',
          });
          this.scrollToBottom();
        },
      });
    }
  }

  addWelcomeMessages() {
    this.messages.push({
      from: 'bot',
      text: 'Xin chào Anh/Chị. Em là trợ lý AI của Tech Store.',
    });

    setTimeout(() => {
      this.messages.push({
        from: 'bot',
        text: 'Em sẵn sàng hỗ trợ Anh/Chị tìm sản phẩm phù hợp.',
      });
      this.showSuggestions = true;
      this.scrollToBottom();
    }, 500);
  }

  sendMessage() {
    const msg = this.inputText.trim();
    if (!msg || this.isSending) return;

    this.messages.push({ from: 'user', text: msg });
    this.inputText = '';
    this.showSuggestions = false;
    this.isSending = true;
    this.scrollToBottom();

    const sendUserMessage = () => {
      if (!this.sessionId) {
        this.messages.push({
          from: 'bot',
          text: 'Phiên chat chưa sẵn sàng. Anh/Chị thử gửi lại giúp em nhé.',
        });
        this.isSending = false;
        this.showSuggestions = true;
        this.scrollToBottom();
        return;
      }

      this.chatbotService.sendMessage(this.sessionId, msg).subscribe({
        next: (reply: string) => {
          this.messages.push({
            from: 'bot',
            text: this.formatBotMessage(reply),
          });
          this.showSuggestions = true;
          this.saveChatHistory();
          this.isSending = false;
          this.scrollToBottom();
        },
        error: () => {
          this.messages.push({
            from: 'bot',
            text: 'Rất tiếc, đã có lỗi xảy ra. Anh/Chị vui lòng thử lại sau.',
          });
          this.showSuggestions = true;
          this.isSending = false;
          this.scrollToBottom();
        },
      });
    };

    if (this.sessionId) {
      sendUserMessage();
      return;
    }

    const userId = this.deriveUserIdFromPhone(this.userPhone);
    this.chatbotService.createSession(userId).subscribe({
      next: (sessionId: string) => {
        this.sessionId = sessionId;
        this.saveSessionId();
        sendUserMessage();
      },
      error: () => {
        this.messages.push({
          from: 'bot',
          text: 'Không thể khởi tạo phiên chat. Anh/Chị vui lòng thử lại sau.',
        });
        this.showSuggestions = true;
        this.isSending = false;
        this.scrollToBottom();
      },
    });
  }

  selectSuggestion(chip: string) {
    this.inputText = chip;
    this.sendMessage();
  }

  saveChatHistory() {
    if (!this.isBrowser) return;
    localStorage.setItem(`chat_${this.userPhone}`, JSON.stringify(this.messages));
  }

  loadChatHistory() {
    if (!this.isBrowser) return;
    const saved = localStorage.getItem(`chat_${this.userPhone}`);
    if (saved) this.messages = JSON.parse(saved);
  }

  saveSessionId() {
    if (!this.isBrowser) return;
    if (!this.sessionId) return;
    localStorage.setItem(`chat_session_${this.userPhone}`, this.sessionId);
  }

  loadSessionId() {
    if (!this.isBrowser) return;
    const savedSession = localStorage.getItem(`chat_session_${this.userPhone}`);
    this.sessionId = savedSession || '';
  }

  private deriveUserIdFromPhone(phone: string): number {
    const digits = phone.replace(/\D/g, '');
    if (!digits) {
      return 1;
    }

    let hash = 0;
    for (const char of digits) {
      hash = (hash * 31 + Number(char)) % 2147483647;
    }

    return hash || 1;
  }

  private formatBotMessage(reply: string): string {
    const safeReply = reply || 'Xin lỗi, em chưa hiểu ý câu hỏi này.';
    const withLineBreaks = safeReply.replace(/\n/g, '<br>');

    return withLineBreaks.replace(
      /(^|[\s>])(https?:\/\/[^\s<]+)/g,
      (_match, prefix: string, url: string) =>
        `${prefix}<a class="chat-external-link" href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    );
  }

  scrollToBottom() {
    setTimeout(() => {
      try {
        this.chatBodyContainer.nativeElement.scrollTop =
          this.chatBodyContainer.nativeElement.scrollHeight + 50;
      } catch {}
    }, 0);
  }
}
