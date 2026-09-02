import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import History from './History';
import Stats from './Stats';

// НАШ РАБОЧИЙ API (Railway)
const API_URL = import.meta.env.VITE_API_URL || "https://web-production-e70f0c.up.railway.app";

function App() {
  const { t, i18n } = useTranslation();
  
  // ===== СОСТОЯНИЯ =====
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isLogin, setIsLogin] = useState(true);
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ЧИТАЕМ ПОДПИСКУ ИЗ LOCALSTORAGE (чтобы QR не появлялся после перезагрузки)
  const [isSubscribed, setIsSubscribed] = useState(localStorage.getItem('isSubscribed') === 'true');
  const [entriesToday, setEntriesToday] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // ===== ПРИ ЗАГРУЗКЕ ПРОВЕРЯЕМ ЛИМИТ =====
  useEffect(() => {
    const fetchCount = async () => {
      if (!token) return;
      try {
        const response = await axios.get(`${API_URL}/api/v1/entries/today-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEntriesToday(response.data.count);
        
        // Если уже 3 записи и нет подписки - показываем QR
        if (response.data.count >= 3 && !isSubscribed) {
          setShowQR(true);
        }
      } catch (error) {
        console.error("Ошибка получения количества записей:", error);
      }
    };
    fetchCount();
  }, [token, isSubscribed]);

  // ===== ФУНКЦИЯ ОТПРАВКИ ЗАПИСИ =====
  const handleSubmit = async () => {
    // Проверка лимита перед отправкой
    if (entriesToday >= 3 && !isSubscribed) {
      setShowQR(true);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/api/v1/entries`, {
        text: text,
        lang: i18n.language
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(response.data);
      setText('');
      setEntriesToday(prev => prev + 1);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка при отправке");
    } finally {
      setLoading(false);
    }
  };

  // ===== КНОПКА "Я ОПЛАТИЛ" (РАБОЧАЯ ВЕРСИЯ) =====
  const handlePaymentConfirmation = async () => {
    try {
      // Отправляем запрос на бэкенд (если он упадет, мы не сломаемся)
      await axios.post(`${API_URL}/api/v1/entries/confirm-payment`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Ошибка отправки запроса на подтверждение:", error);
    }

    // 1. Показываем сообщение
    alert("Запрос на подтверждение отправлен!");

    // 2. ЛОКАЛЬНО АКТИВИРУЕМ ПОДПИСКУ, чтобы QR исчез и не мешал
    localStorage.setItem('isSubscribed', 'true');
    setIsSubscribed(true);
    setShowQR(false);

    // 3. ПЕРЕКИДЫВАЕМ НА ГЛАВНУЮ (перезагружаем страницу)
    window.location.href = '/';
  };

  // ===== ВЫХОД =====
  const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
};

  // ===== РЕНДЕР (ЭКРАНЫ) =====
  return (
    <BrowserRouter>
      <nav className="flex justify-between items-center p-4 bg-white shadow-md">
        <div className="flex gap-4">
          <button onClick={() => changeLanguage('ru')} className="text-sm">RU</button>
          <button onClick={() => changeLanguage('en')} className="text-sm">EN</button>
        </div>
        <div>
          <button onClick={logout} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-300 transition">
            {t('logout')}
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6">
        {!token ? (
          // ЭКРАН ВХОДА / РЕГИСТРАЦИИ
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/40">
            <h1 className="text-3xl font-bold mb-4">{isLogin ? 'Войти' : 'Зарегистрироваться'}</h1>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2 rounded mb-2" />
            <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2 rounded mb-2" />
            <button onClick={handleLogin} className="w-full bg-blue-500 text-white p-2 rounded mt-2">
              {isLogin ? 'Войти' : 'Зарегистрироваться'}
            </button>
            <p onClick={() => setIsLogin(!isLogin)} className="text-blue-500 cursor-pointer mt-2">
              {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
            </p>
          </div>
        ) : (
          // ГЛАВНАЯ СТРАНИЦА
          <div>
            <div className="flex gap-4 mb-4">
              <Link to="/" className="bg-gray-100 p-2 rounded">Главная</Link>
              <Link to="/history" className="bg-gray-100 p-2 rounded">История</Link>
              <Link to="/stats" className="bg-gray-100 p-2 rounded">Статистика</Link>
            </div>

            <Routes>
              <Route path="/" element={
                <div>
                  {/* Блок с QR-кодом, если лимит исчерпан */}
                  {showQR && !isSubscribed && (
                    <div className="mt-6 border border-gray-300 rounded-lg p-4 bg-gray-50 text-center">
                      <h3 className="text-lg font-bold mb-2">Вы использовали 3 бесплатные записи!</h3>
                      <p className="text-sm text-gray-600 mb-3">Оплатите подписку, чтобы продолжить</p>
                      <img src="/qr-code.png" alt="QR-код для оплаты" className="w-48 h-48 mx-auto mb-4 rounded-lg" />
                      <p className="text-sm font-bold text-gray-800">Подписка: 299 ₽ / месяц</p>
                      <button
                        onClick={handlePaymentConfirmation}
                        className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition text-sm font-bold mt-3"
                      >
                        ✅ Я оплатил
                      </button>
                    </div>
                  )}

                  {/* Форма записи (если есть лимит - скрываем) */}
                  {!showQR && (
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Как прошёл твой день?</h2>
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full border p-2 rounded"
                        placeholder="Напишите, что вы чувствуете..."
                      />
                      <button onClick={handleSubmit} className="bg-amber-500 text-white px-4 py-2 rounded-full hover:bg-amber-600 transition text-sm mt-2">
                        Отправить на анализ
                      </button>
                      {result && (
                        <div className="mt-4 p-4 bg-gray-100 rounded">
                          <p><b>Настроение:</b> {result.sentiment}</p>
                          <p><b>Рекомендация:</b> {result.recommendation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              } />
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