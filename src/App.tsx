import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import History from './History';
import Stats from './Stats';

const API_URL = import.meta.env.VITE_API_URL || "https://web-production-e70f0c.up.railway.app";

function App() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isLogin, setIsLogin] = useState(true);
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Новые состояния для лимита и оплаты
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [entriesToday, setEntriesToday] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Функция переключения языка
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Функция выхода
  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setIsSubscribed(false);
    setEntriesToday(0);
    setShowQR(false);
    setShowSuccessMessage(false);
  };

  // Загрузка количества записей при входе
  useEffect(() => {
    const fetchCount = async () => {
      if (!token) return;
      try {
        const response = await axios.get(`${API_URL}/api/v1/entries/today-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEntriesToday(response.data.count);
        if (response.data.count >= 3) {
          setShowQR(true);
        }
      } catch (err) {
        console.error('Ошибка получения количества записей', err);
      }
    };

    // Проверка статуса подписки
    const fetchStatus = async () => {
      if (!token) return;
      try {
        const response = await axios.get(`${API_URL}/api/v1/subscription/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsSubscribed(response.data.is_subscribed);
      } catch (err) {
        console.error('Ошибка проверки подписки', err);
      }
    };

    fetchCount();
    fetchStatus();
  }, [token]);

  // Функция создания записи с проверкой лимита
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Если лимит исчерпан и нет подписки
    if (entriesToday >= 3 && !isSubscribed) {
      setShowQR(true);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/entries`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data);
      setText('');
      setEntriesToday(prev => prev + 1); // Увеличиваем счетчик
    } catch (err) {
      setError('Ошибка при отправке записи');
    } finally {
      setLoading(false);
    }
  };

  // Функция после оплаты
  const handlePaymentConfirmation = async () => {
    try {
      await axios.post(`${API_URL}/api/v1/entries/confirm-payment`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowSuccessMessage(true);
    } catch (error) {
      console.error('Ошибка отправки запроса:', error);
    }
  };

  return (
    <BrowserRouter>
      <nav className="flex justify-between items-center p-4 bg-white shadow-md">
        <div className="flex gap-4">
          <button onClick={() => changeLanguage('ru')} className="text-sm">RU</button>
          <button onClick={() => changeLanguage('en')} className="text-sm">EN</button>
        </div>
        <div>
          <button
            onClick={logout}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-300 transition"
          >
            {t('logout')}
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6">
        {/* Форма входа/регистрации */}
        {!token ? (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/40">
            <h2 className="text-3xl font-bold mb-6">
              {isLogin ? t('login') : t('register')}
            </h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
            />
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <button
              onClick={async () => {
                try {
                  const response = await axios.post(
                    `${API_URL}/api/v1/auth/${isLogin ? 'login' : 'register'}`,
                    { email, password }
                  );
                  setToken(response.data.access_token);
                  localStorage.setItem('token', response.data.access_token);
                  setEmail('');
                  setPassword('');
                } catch (err) {
                  setError('Неверный email или пароль');
                }
              }}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold"
            >
              {isLogin ? t('login') : t('register')}
            </button>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-blue-600 mt-4"
            >
              {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
            </button>
          </div>
        ) : (
          <div>
            {/* Главная страница дневника */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/40">
              <h1 className="text-3xl font-bold mb-4">{t('how_was_your_day')}</h1>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Напишите, что вы чувствуете..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg mb-4"
                disabled={showQR && !isSubscribed}
              />
              <button
                onClick={handleSubmit}
                disabled={loading || (showQR && !isSubscribed)}
                className="bg-amber-500 text-white px-6 py-3 rounded-full font-bold hover:bg-amber-600 disabled:opacity-50"
              >
                {loading ? 'Анализирую...' : t('analyze')}
              </button>

              {/* Кнопка оплаты всегда видна, если нет подписки */}
              {!isSubscribed && (
                <div className="mt-6 border border-gray-300 rounded-lg p-4 bg-gray-50 text-center">
                  <img src="/qr-code.png" alt="QR-код" className="w-48 h-48 mx-auto mb-2 rounded-lg" />
                  <p className="text-sm font-bold text-gray-800">Подписка: 299 ₽ / месяц</p>
                  <p className="text-xs text-gray-500 mt-2 mb-4">После оплаты нажмите кнопку ниже</p>
                  <button
                    onClick={handlePaymentConfirmation}
                    className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition text-sm font-bold"
                  >
                    ✅ Я оплатил
                  </button>
                  {showSuccessMessage && (
                    <p className="text-green-600 text-sm mt-2 font-medium">
                      Спасибо! Запрос отправлен. Мы проверим оплату в ближайшее время.
                    </p>
                  )}
                </div>
              )}

              {result && (
                <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
              )}
            </div>
            
            <Routes>
              <Route path="/history" element={<History />} />
              <Route path="/stats" element={<Stats />} />
            </Routes>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;