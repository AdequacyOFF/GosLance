import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Message, UserProfile } from '../../shared/types';
import { ASSISTANT_QUESTIONS } from '../../shared/lib/mockData';
import './Profile.css';

export const Profile = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add initial greeting and first question
    const greeting: Message = {
      id: 'greeting',
      text: 'Здравствуйте! Я ваш AI-ассистент. Я помогу вам найти идеальные государственные контракты для вашей команды. Позвольте задать несколько вопросов, чтобы лучше понять ваши возможности.',
      sender: 'assistant',
      timestamp: new Date(),
    };

    const firstQuestion: Message = {
      id: 'q0',
      text: ASSISTANT_QUESTIONS[0].text,
      sender: 'assistant',
      timestamp: new Date(),
    };

    setMessages([greeting, firstQuestion]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: currentInput,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setUserAnswers(prev => [...prev, currentInput]);
    setCurrentInput('');

    // Check if there are more questions
    if (currentQuestionIndex < ASSISTANT_QUESTIONS.length - 1) {
      // Add next question after a short delay
      setTimeout(() => {
        const nextQuestion: Message = {
          id: `q${currentQuestionIndex + 1}`,
          text: ASSISTANT_QUESTIONS[currentQuestionIndex + 1].text,
          sender: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, nextQuestion]);
        setCurrentQuestionIndex(prev => prev + 1);
      }, 500);
    } else {
      // All questions answered
      setTimeout(() => {
        const completeMessage: Message = {
          id: 'complete',
          text: 'Спасибо! У меня есть вся необходимая информация. Нажмите "Начать поиск", чтобы найти подходящие государственные контракты.',
          sender: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, completeMessage]);
        setIsComplete(true);
      }, 500);
    }
  };

  const handleStartSearch = () => {
    // Store user profile data
    const profile: UserProfile = {
      teamInfo: userAnswers[0] || '',
      currentWork: userAnswers[1] || '',
    };

    // In a real app, this would send data to the neural network
    sessionStorage.setItem('userProfile', JSON.stringify(profile));

    // Navigate to exchange page
    navigate('/exchange');
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
                {message.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          {isComplete && (
            <button className="start-search-btn" onClick={handleStartSearch}>
              Начать поиск
            </button>
          )}
          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Введите ваш ответ..."
              className="chat-input"
              disabled={isComplete}
            />
            <button type="submit" className="send-btn" disabled={isComplete}>
              Отправить
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
