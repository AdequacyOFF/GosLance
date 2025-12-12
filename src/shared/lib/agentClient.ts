import { A2AClient, ClientFactory } from '@a2a-js/sdk/client';
import type { MessageSendParams } from '@a2a-js/sdk';
import { v4 as uuidv4 } from 'uuid';
import type { AgentResponse, CompanyProfileResponse } from '../types';

export class AgentClient {
  private client: A2AClient | null = null;
  private sessionId: string;
  private baseUrl: string;
  private initPromise: Promise<void> | null = null;

  constructor(sessionId: string, baseUrl: string) {
    this.sessionId = sessionId;
    this.baseUrl = baseUrl;
  }

  private async initializeClient(): Promise<void> {
    try {
      console.log(`Fetching agent card from: ${this.baseUrl}/.well-known/agent-card.json`);
      const response = await fetch(`${this.baseUrl}/.well-known/agent-card.json`);

      if (!response.ok) {
        throw new Error(`Failed to fetch agent card: ${response.status} ${response.statusText}`);
      }

      const agentCard: any = await response.json();

      console.log('Original agent card URL:', agentCard.url);
      agentCard.url = this.baseUrl;
      console.log('Overridden agent card URL:', agentCard.url);

      try {
        this.client = new A2AClient(agentCard);
      } catch (error) {
        console.log('Fallback to ClientFactory...');
        const factory = new ClientFactory();
        if (typeof (factory as any).createFromAgentCard === 'function') {
          this.client = await (factory as any).createFromAgentCard(agentCard) as unknown as A2AClient;
        } else {
          this.client = await factory.createFromUrl(this.baseUrl) as unknown as A2AClient;
        }
      }

      console.log('A2A Client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize A2A client:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.client) return;

    // Prevent multiple concurrent initializations
    if (!this.initPromise) {
      this.initPromise = this.initializeClient();
    }

    await this.initPromise;
  }

  async sendMessage(userText: string, companyId?: string): Promise<AgentResponse> {
    // Lazy initialization
    await this.ensureInitialized();

    if (!this.client) {
      throw new Error('A2A Client not initialized');
    }

    const messageParams: MessageSendParams = {
      message: {
        messageId: uuidv4(),
        role: 'user',
        parts: [{ kind: 'text', text: userText }],
        kind: 'message',
      },
      configuration: {
        blocking: true,
        acceptedOutputModes: ['text/plain'],
      },
      metadata: {
        session_id: this.sessionId,
        ...(companyId && { company_id: companyId }),
      },
    };

    try {
      const response = await this.client.sendMessage(messageParams);
      return response as AgentResponse;
    } catch (error) {
      console.error('Agent API error:', error);
      throw error;
    }
  }

  extractAssistantText(response: AgentResponse): string | null {
    // Handle task-based responses with history array (current A2A format)
    const history = response.result?.history;
    if (history && Array.isArray(history)) {
      // Find the last agent message in history
      for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (msg.role === 'agent' && msg.parts && msg.parts.length > 0) {
          const textParts = msg.parts
            .filter((p: any) => p.kind === 'text' && p.text)
            .map((p: any) => p.text as string);

          if (textParts.length > 0) {
            return textParts.join('\n');
          }
        }
      }
    }

    // Fallback: try direct message field (for backward compatibility)
    const message = response.result?.message;
    if (message && message.parts) {
      const textParts = message.parts
        .filter((p) => p.kind === 'text' && 'text' in p && p.text)
        .map((p) => (p as any).text as string);

      return textParts.length > 0 ? textParts.join('\n') : null;
    }

    return null;
  }

  parseCompanyProfileResponse(text: string): CompanyProfileResponse | null {
    try {
      const jsonMatch = text.match(/\{[\s\S]*"company_id"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.company_id && parsed.company_name) {
          return parsed as CompanyProfileResponse;
        }
      }
    } catch (e) {
      return null;
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
}
