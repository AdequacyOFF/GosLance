export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
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
