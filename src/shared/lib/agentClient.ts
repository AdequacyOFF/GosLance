import type { AgentMessage, SendMessageRequest, AgentResponse, CompanyProfileResponse } from '../types';

const BASE_URL = import.meta.env.VITE_AGENT_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://5.129.212.83:52000');

export class AgentClient {
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async sendMessage(userText: string, companyId?: string): Promise<AgentResponse> {
    const messageId = this.generateUUID();
    const requestId = this.generateUUID();

    const request: SendMessageRequest = {
      id: requestId,
      params: {
        message: {
          role: 'user',
          parts: [
            {
              kind: 'text',
              text: userText,
            },
          ],
          messageId: messageId,
        },
        metadata: {
          session_id: this.sessionId,
          ...(companyId && { company_id: companyId }),
        },
      },
    };

    // Use BASE_URL directly (mimics Python: agent_card.url = BASE_URL)
    const response = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
  }

  extractAssistantText(response: AgentResponse): string | null {
    const history = response.result?.history;
    if (!history || history.length === 0) {
      return null;
    }

    let assistantMsg: AgentMessage | null = null;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role !== 'user') {
        assistantMsg = history[i];
        break;
      }
    }

    if (!assistantMsg && history.length >= 2) {
      assistantMsg = history[history.length - 2];
    }

    if (!assistantMsg) {
      return null;
    }

    const textParts = assistantMsg.parts
      .filter((p) => p.kind === 'text')
      .map((p) => p.text);

    return textParts.length > 0 ? textParts.join('\n') : null;
  }

  parseCompanyProfileResponse(text: string): CompanyProfileResponse | null {
    try {
      const jsonMatch = text.match(/\{[\s\S]*"company_id"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.company_id && parsed.completion_token === '<TASK_DONE>') {
          return parsed as CompanyProfileResponse;
        }
      }
    } catch (e) {
      // Not a JSON response
    }
    return null;
  }

  cleanAgentText(text: string): string {
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    cleaned = cleaned.replace(/<NEED_USER_INPUT>/gi, '').trim();
    return cleaned;
  }

  hasThinkingTag(text: string): boolean {
    return /<think>/i.test(text);
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
