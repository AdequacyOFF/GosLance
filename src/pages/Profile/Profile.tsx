import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Message, SavedCompany } from '../../shared/types';
import { AgentClient } from '../../shared/lib/agentClient';
import { CompanyManager } from '../../shared/lib/companyManager';
import { MarkdownMessage } from '../../shared/ui/MarkdownMessage/MarkdownMessage';
import './Profile.css';

export const Profile = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<SavedCompany | null>(null);
  const [companies, setCompanies] = useState<SavedCompany[]>([]);
  const [agentClient] = useState(() => new AgentClient(
    generateSessionId(),
    'https://31fd7d3f-2580-4179-b86a-3b5125118293-agent.ai-agent.inference.cloud.ru'
  ));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCompanies = CompanyManager.getCompanies();
    setCompanies(savedCompanies);

    const greeting: Message = {
      id: 'greeting',
      text: 'Здравствуйте! Я ваш AI-ассистент. Я помогу вам создать профиль компании для поиска государственных тендеров. Расскажите о вашей компании: название, чем занимаетесь, ваш опыт и портфолио проектов.',
      sender: 'assistant',
      timestamp: new Date(),
    };

    setMessages([greeting]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addUserMessage = (text: string) => {
    const message: Message = {
      id: `user-${Date.now()}`,
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  };

  const addAssistantMessage = (text: string, isThinking = false) => {
    const message: Message = {
      id: `assistant-${Date.now()}`,
      text,
      sender: 'assistant',
      timestamp: new Date(),
      isThinking,
    };
    setMessages(prev => [...prev, message]);
  };

  const streamText = async (text: string) => {
    const messageId = `assistant-${Date.now()}`;
    const message: Message = {
      id: messageId,
      text: '',
      sender: 'assistant',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);

    const words = text.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i];
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, text: currentText } : m
        )
      );
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() || isLoading || isComplete) return;

    const userText = currentInput.trim();
    addUserMessage(userText);
    setCurrentInput('');
    setIsLoading(true);

    try {
      addAssistantMessage('Думаю...', true);

      const response = await agentClient.sendMessage(userText);

      setMessages(prev => prev.filter(m => !m.isThinking));

      const rawText = agentClient.extractAssistantText(response);
      if (!rawText) {
        addAssistantMessage('Извините, произошла ошибка. Попробуйте еще раз.');
        setIsLoading(false);
        return;
      }

      const profileResponse = agentClient.parseCompanyProfileResponse(rawText);
      if (profileResponse) {
        const newCompany: SavedCompany = {
          company_id: profileResponse.company_id,
          company_name: profileResponse.company_name,
        };
        CompanyManager.saveCompany(newCompany);
        setCompanies(CompanyManager.getCompanies());
        setSelectedCompany(newCompany);

        await streamText(
          `✅ Профиль компании "${newCompany.company_name}" успешно создан!\n\nID компании: ${newCompany.company_id}\n\nТеперь вы можете перейти к поиску подходящих тендеров.`
        );

        setIsComplete(true);
      } else {
        const cleanText = agentClient.cleanAgentText(rawText);
        await streamText(cleanText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => !m.isThinking));
      addAssistantMessage(
        'Извините, произошла ошибка при обращении к серверу. Пожалуйста, попробуйте еще раз.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSearch = () => {
    if (selectedCompany) {
      navigate('/exchange', { state: { company: selectedCompany } });
    }
  };

  const handleCompanySelect = (companyId: string) => {
    if (companyId === 'new') {
      setSelectedCompany(null);
      setMessages([]);
      setIsComplete(false);
      addAssistantMessage(
        'Отлично! Давайте создадим профиль новой компании.\n\nРасскажите мне о вашей компании: название, чем занимаетесь, ваш опыт и портфолио проектов.'
      );
    } else {
      const company = CompanyManager.getCompanyById(companyId);
      if (company) {
        setSelectedCompany(company);
        setIsComplete(true);
        setMessages([]);
        addAssistantMessage(
          `Профиль компании "${company.company_name}" загружен.\n\nID: ${company.company_id}\n\nВы можете перейти к поиску тендеров.`
        );
      }
    }
  };

  return (
    <div className="profile-page">
      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender === 'user' ? 'message-user' : 'message-assistant'}`}
            >
              <div className="message-content">
                {message.isThinking ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      background: 'currentColor',
                      borderRadius: '50%',
                      animation: 'thinking-bounce 1.4s infinite ease-in-out',
                      animationDelay: '-0.32s'
                    }}></span>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      background: 'currentColor',
                      borderRadius: '50%',
                      animation: 'thinking-bounce 1.4s infinite ease-in-out',
                      animationDelay: '-0.16s'
                    }}></span>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      background: 'currentColor',
                      borderRadius: '50%',
                      animation: 'thinking-bounce 1.4s infinite ease-in-out'
                    }}></span>
                  </div>
                ) : (
                  <MarkdownMessage content={message.text} />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          {isComplete && (
            <button className="start-search-btn" onClick={handleStartSearch}>
              Начать поиск тендеров
            </button>
          )}

          {companies.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '15px'
            }}>
              {companies.map(company => (
                <button
                  key={company.company_id}
                  onClick={() => handleCompanySelect(company.company_id)}
                  style={{
                    padding: '8px 16px',
                    background: selectedCompany?.company_id === company.company_id
                      ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                      : 'rgba(59, 130, 246, 0.15)',
                    color: selectedCompany?.company_id === company.company_id ? 'white' : 'var(--text-accent)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {company.company_name}
                </button>
              ))}
              <button
                onClick={() => handleCompanySelect('new')}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                Другая компания
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Расскажите о вашей компании..."
              className="chat-input"
              disabled={isComplete || isLoading}
            />
            <button type="submit" className="send-btn" disabled={isComplete || isLoading || !currentInput.trim()}>
              Отправить
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes thinking-bounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
