import type { Message as A2AMessage, Task } from '@a2a-js/sdk';

export type { A2AMessage, Task };
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

export interface CompanyProfile {
  name: string;
  description: string;
  regions_codes: string[];
  okpd2_codes: string[];
}

export interface SavedCompany {
  company_id: string;
  company_name: string;
}

export interface AgentResponse {
  result?: {
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
  company_id: string;
  company_name: string;
}
