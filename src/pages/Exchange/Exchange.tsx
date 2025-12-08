import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GovernmentOrder, UserProfile } from '../../shared/types';
import { MOCK_GOVERNMENT_ORDERS } from '../../shared/lib/mockData';
import './Exchange.css';

export const Exchange = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<GovernmentOrder[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has completed profile
    const profileData = sessionStorage.getItem('userProfile');
    if (!profileData) {
      navigate('/');
      return;
    }

    setUserProfile(JSON.parse(profileData));

    // Simulate neural network processing
    setTimeout(() => {
      // Sort orders by match score (highest first)
      const sortedOrders = [...MOCK_GOVERNMENT_ORDERS].sort(
        (a, b) => b.matchScore - a.matchScore
      );
      setOrders(sortedOrders);
      setIsLoading(false);
    }, 1500);
  }, [navigate]);

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const handleBackToProfile = () => {
    sessionStorage.removeItem('userProfile');
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="exchange-page">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Анализируем ваш профиль и подбираем государственные контракты...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exchange-page">
      <div className="exchange-container">
        <div className="exchange-header">
          <div>
            <h1>Биржа государственных заказов</h1>
            <p className="subtitle">Подходящие возможности на основе вашего профиля</p>
          </div>
          <button className="back-btn" onClick={handleBackToProfile}>
            Новый поиск
          </button>
        </div>

        <div className="orders-grid">
          {orders.map((order) => (
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
                  <span className="detail-label">Срок:</span>
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
                Подать заявку на контракт
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
