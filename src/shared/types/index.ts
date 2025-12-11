// Import A2A SDK types
import type { Message as A2AMessage, Task } from '@a2a-js/sdk';

// Re-export SDK types for convenience
export type { A2AMessage, Task };

// UI-specific types
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isThinking?: boolean;
  orders?: GovernmentOrder[];
}

export interface Question {
  id: string;
  text: string;
  order: number;
}

export interface UserProfile {
  teamInfo: string;
  currentWork: string;
}

export interface GovernmentOrder {
  id: string;
  title: string;
  description: string;
  budget: string;
  deadline: string;
  requirements: string[];
  matchScore: number;
}

// AI Agent Types
export interface OKPD2Code {
  code: string;
  title: string;
}

export interface CompanyProfile {
  name: string;
  description: string;
  regions_codes: string[];
  okpd2_codes: OKPD2Code[];
}

export interface SavedCompany {
  company_id: string;
  company_name: string;
}

// Agent Response (now using SDK types)
export interface AgentResponse {
  result?: {
    // Task-based response with history array (current A2A format)
    history?: Array<{
      role: string;
      parts: Array<{ kind: string; text?: string; [key: string]: any }>;
      messageId?: string;
      contextId?: string;
      taskId?: string;
      [key: string]: any;
    }>;
    kind?: string;
    status?: {
      state: string;
      message?: any;
      timestamp?: string;
    };
    // Direct message response (fallback for backward compatibility)
    message?: A2AMessage;
    task?: Task;
  };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface CompanyProfileResponse {
  status: string;
  event: string;
  completion_token: string;
  company_id: string;
  profile: CompanyProfile;
}
