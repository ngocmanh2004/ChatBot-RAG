import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environments';

interface ApiResponse<T> {
  statusCode: number;
  isSuccess: boolean;
  result: T;
}

interface ChatMessageResult {
  responseText: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly chatbotApiUrl =
    environment.chatbotApiUrl || 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient) {}

  createSession(userId: number): Observable<string> {
    return this.http
      .post<ApiResponse<string>>(`${this.chatbotApiUrl}/sessions`, { userId })
      .pipe(map((res) => res?.result || ''));
  }

  sendMessage(sessionId: string, userPrompt: string): Observable<string> {
    return this.http
      .post<ApiResponse<ChatMessageResult>>(
        `${this.chatbotApiUrl}/sessions/${sessionId}`,
        { message: userPrompt }
      )
      .pipe(
        map((res) => {
          const rawResponse = res?.result?.responseText || '';
          return this.extractAssistantText(rawResponse, userPrompt);
        })
      );
  }

  private extractAssistantText(rawResponse: string, userPrompt: string): string {
    if (!rawResponse) {
      return 'Xin lỗi, hiện tại em chưa thể trả lời. Anh/Chị thử lại giúp em nhé.';
    }

    const normalizedResponse = this.extractJsonPayload(rawResponse);

    try {
      const parsed = JSON.parse(normalizedResponse);

      if (Array.isArray(parsed?.products) && parsed.products.length > 0) {
        const productLines = parsed.products
          .slice(0, 5)
          .map((item: any, idx: number) => {
            const name = item?.product_name || item?.name || 'Sản phẩm';
            const price = Number(item?.price);
            const safePrice = Number.isFinite(price)
              ? `${price.toLocaleString('vi-VN')} VNĐ`
              : 'Liên hệ';
            const highlights = this.buildHighlights(item, userPrompt);
            const detailLink = this.buildDetailLink(item);
            const productTitle = detailLink
              ? `<a class="chat-product-link" href="${detailLink}" target="_blank" rel="noopener noreferrer">${idx + 1}. ${name}</a>`
              : `${idx + 1}. ${name}`;
            return `${productTitle} - ${safePrice}${highlights ? `\n${highlights}` : ''}`;
          })
          .join('\n');

        const answerText =
          typeof parsed?.responseText === 'string' && parsed.responseText.trim()
            ? parsed.responseText.trim()
            : 'Em gợi ý một số sản phẩm phù hợp theo nhu cầu của Anh/Chị:';

        return `${answerText}\n${productLines}`;
      }

      if (typeof parsed?.responseText === 'string' && parsed.responseText.trim()) {
        return parsed.responseText;
      }
    } catch (_error) {
      return rawResponse;
    }

    return rawResponse;
  }

  private extractJsonPayload(text: string): string {
    const trimmed = text.trim();

    if (trimmed.startsWith('```')) {
      const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    return trimmed;
  }

  private buildDetailLink(product: any): string {
    const productId = Number(product?.product_id || product?.id);
    if (!Number.isFinite(productId) || productId <= 0) {
      return '';
    }
    if (typeof window === 'undefined') {
      return `/home/product/detail/${productId}`;
    }
    return `${window.location.origin}/home/product/detail/${productId}`;
  }

  private buildHighlights(product: any, userPrompt: string): string {
    const specs = product?.specifications || {};
    const cpu = specs['CPU'] || '';
    const ram = specs['RAM (GB)'] || '';
    const refresh = specs['Refresh rate (Hz)'] || '';
    const rearCam = specs['Rear camera (MP)'] || '';
    const frontCam = specs['Front camera (MP)'] || '';
    const battery = specs['Battery (mAh)'] || '';

    const normalizedPrompt = (userPrompt || '').toLowerCase();
    const gamingFocus =
      normalizedPrompt.includes('game') ||
      normalizedPrompt.includes('gaming') ||
      normalizedPrompt.includes('hiệu năng');
    const cameraFocus =
      normalizedPrompt.includes('camera') ||
      normalizedPrompt.includes('chụp') ||
      normalizedPrompt.includes('ảnh') ||
      normalizedPrompt.includes('selfie');

    if (gamingFocus) {
      const parts = [
        cpu ? `Chip: ${cpu}` : '',
        ram ? `RAM: ${ram}GB` : '',
        refresh ? `Màn hình: ${refresh}Hz` : '',
        battery ? `Pin: ${battery}mAh` : '',
      ].filter(Boolean);
      return parts.join(' | ');
    }

    if (cameraFocus) {
      const parts = [
        rearCam ? `Camera sau: ${rearCam}MP` : '',
        frontCam ? `Camera trước: ${frontCam}MP` : '',
        cpu ? `Chip xử lý ảnh: ${cpu}` : '',
      ].filter(Boolean);
      return parts.join(' | ');
    }

    const parts = [
      cpu ? `Chip: ${cpu}` : '',
      ram ? `RAM: ${ram}GB` : '',
      rearCam ? `Camera sau: ${rearCam}MP` : '',
    ].filter(Boolean);
    return parts.join(' | ');
  }
}
