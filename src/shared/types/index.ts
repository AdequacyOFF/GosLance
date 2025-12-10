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

export interface AgentMessagePart {
  kind: 'text';
  text: string;
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  parts: AgentMessagePart[];
  messageId: string;
}

export interface MessageSendParams {
  message: AgentMessage;
  metadata: {
    session_id: string;
    company_id?: string;
  };
}

export interface SendMessageRequest {
  id: string;
  params: MessageSendParams;
}

export interface AgentResponse {
  result?: {
    history?: AgentMessage[];
    [key: string]: any;
  };
}

export interface CompanyProfileResponse {
  status: string;
  event: string;
  completion_token: string;
  company_id: string;
  profile: CompanyProfile;
}
