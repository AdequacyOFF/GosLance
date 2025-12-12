import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { GovernmentOrder, Message, SavedCompany } from '../../shared/types';
import { MOCK_GOVERNMENT_ORDERS } from '../../shared/lib/mockData';
import { AgentClient } from '../../shared/lib/agentClient';
import { CompanyManager } from '../../shared/lib/companyManager';
import { MarkdownMessage } from '../../shared/ui/MarkdownMessage/MarkdownMessage';
import './Exchange.css';

export const Exchange = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<SavedCompany | null>(null);
  const [companies, setCompanies] = useState<SavedCompany[]>([]);
  const [agentClient] = useState(() => new AgentClient(
    generateSessionId(),
    'https://25855856-ed62-4327-8321-92831b4810bd-agent.ai-agent.inference.cloud.ru'
  ));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCompanies = CompanyManager.getCompanies();
    setCompanies(savedCompanies);

    const stateCompany = location.state?.company as SavedCompany | undefined;
    if (stateCompany) {
      setSelectedCompany(stateCompany);
      addAssistantMessage(
        `Добро пожаловать в поиск тендеров, ${stateCompany.company_name}!\n\nОпишите, какие тендеры вас интересуют, или просто напишите "Найди тендеры".`
      );
    } else if (savedCompanies.length > 0) {
      setSelectedCompany(savedCompanies[0]);
      addAssistantMessage(
        `Добро пожаловать в поиск тендеров!\n\nОпишите, какие тендеры вас интересуют, или просто напишите "Найди тендеры".`
      );
    } else {
      addAssistantMessage(
        'У вас еще нет профиля компании.\n\nПожалуйста, сначала создайте профиль компании.'
      );
    }
  }, [location.state]);

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

  const addAssistantMessage = (text: string, orders?: GovernmentOrder[], isThinking = false) => {
    const message: Message = {
      id: `assistant-${Date.now()}`,
      text,
      sender: 'assistant',
      timestamp: new Date(),
      isThinking,
      orders,
    };
    setMessages(prev => [...prev, message]);
  };

  const streamText = async (text: string, orders?: GovernmentOrder[]) => {
    const messageId = `assistant-${Date.now()}`;
    const message: Message = {
      id: messageId,
      text: '',
      sender: 'assistant',
      timestamp: new Date(),
      orders,
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
    if (!currentInput.trim() || isLoading || !selectedCompany) return;

    const userText = currentInput.trim();
    addUserMessage(userText);
    setCurrentInput('');
    setIsLoading(true);

    try {
      addAssistantMessage('Ищу подходящие тендеры...', undefined, true);

      const response = await agentClient.sendMessage(
        userText,
        selectedCompany.company_id
      );

      setMessages(prev => prev.filter(m => !m.isThinking));

      const rawText = agentClient.extractAssistantText(response);
      if (!rawText) {
        addAssistantMessage('Извините, произошла ошибка. Попробуйте еще раз.');
        setIsLoading(false);
        return;
      }

      const cleanText = agentClient.cleanAgentText(rawText);

      const orders = filterOrders(userText);

      await streamText(cleanText, orders);
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

  const filterOrders = (query: string): GovernmentOrder[] => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('больше') || lowerQuery.includes('выше')) {
      return MOCK_GOVERNMENT_ORDERS.filter(o => {
        const budget = parseInt(o.budget.replace(/[^\d]/g, ''));
        return budget > 500000;
      }).slice(0, 3);
    }

    return [...MOCK_GOVERNMENT_ORDERS]
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  };

  const getMatchScoreColor = (score: number): string => {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const handleCompanySelect = (companyId: string) => {
    const company = CompanyManager.getCompanyById(companyId);
    if (company) {
      setSelectedCompany(company);
      setMessages([]);
      addAssistantMessage(
        `Переключено на компанию "${company.company_name}".\n\nОпишите, какие тендеры вас интересуют.`
      );
    }
  };

  const handleBackToProfile = () => {
    navigate('/');
  };

  return (
    <div className="exchange-page">
      <div className="exchange-container">
        <div className="chat-container" style={{
          width: '100%',
          maxWidth: '900px',
          display: 'flex',
          flexDirection: 'column',
          height: '85vh',
          background: 'var(--bg-tertiary)',
          borderRadius: '20px',
          border: '1px solid var(--border-primary)',
          boxShadow: '0 20px 60px var(--shadow-glow)'
        }}>
          <div className="messages-container" style={{
            flex: 1,
            overflowY: 'auto',
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {messages.map((message) => (
              <div key={message.id}>
                <div
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

                {message.orders && message.orders.length > 0 && (
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {message.orders.map((order) => (
                      <div key={order.id} className="order-card">
                        <div className="order-header">
                          <h2 className="order-title">{order.title}</h2>
                          <div
                            className="match-badge"
                            style={{
                              background: getMatchScoreColor(order.matchScore),
                              boxShadow: `0 0 20px ${getMatchScoreColor(order.matchScore)}40`
                            }}
                          >
                            {order.matchScore}% Совпадение
                          </div>
                        </div>

                        <p className="order-description">{order.description}</p>

                        <div className="order-details">
                          <div className="detail-item">
                            <span className="detail-label">Бюджет:</span>
                            <span className="detail-value">{order.budget}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Дата заявки:</span>
                            <span className="detail-value">
                              {new Date(order.deadline).toLocaleDateString('ru-RU', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="requirements">
                          <h3 className="requirements-title">Требования:</h3>
                          <ul className="requirements-list">
                            {order.requirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>

                        <button className="apply-btn">
                          Подать заявку на тендер
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
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
                  onClick={handleBackToProfile}
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
                placeholder={
                  selectedCompany
                    ? 'Опишите интересующие тендеры...'
                    : 'Сначала создайте профиль компании...'
                }
                className="chat-input"
                disabled={isLoading || !selectedCompany}
              />
              <button
                type="submit"
                className="send-btn"
                disabled={isLoading || !currentInput.trim() || !selectedCompany}
              >
                Отправить
              </button>
            </form>
          </div>
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
