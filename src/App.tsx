import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import History from './History';
import Stats from './Stats';

const API_URL = import.meta.env.VITE_API_URL || "https://web-production-7c06d.up.railway.app";

function App() {
  const { i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isLogin, setIsLogin] = useState(true);
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(localStorage.getItem('isSubscribed') === 'true');
  const [entriesToday, setEntriesToday] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!token) return;
      try {
        const subResponse = await axios.get(`${API_URL}/api/v1/subscription/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (subResponse.data.is_subscribed) {
          localStorage.setItem('isSubscribed', 'true');
          setIsSubscribed(true);
          setShowQR(false);
        }
        const countResponse = await axios.get(`${API_URL}/api/v1/entries/today-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEntriesToday(countResponse.data.count);
        if (countResponse.data.count >= 3 && !subResponse.data.is_subscribed) {
          setShowQR(true);
        }
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
      }
    };
    fetchAllData();
  }, [token]);

  const changeLanguage = (lng: string) => { i18n.changeLanguage(lng); };

  const handleLogin = async () => {
    setLoading(true); setError('');
    try {
      const url = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API_URL}/api/v1${url}`, { email, password });
      localStorage.setItem('token', response.data.access_token);
      setToken(response.data.access_token);
    } catch (err: any) { setError(err.response?.data?.detail || "Ошибка авторизации"); }
    finally { setLoading(false); }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Ваш браузер не поддерживает голосовой ввод. Откройте в Chrome или Яндекс.Браузере.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText(prev => prev ? prev + " " + transcript : transcript);
    };

    recognition.start();
  };

  const handleSubmit = async () => {
    if (entriesToday >= 3 && !isSubscribed) { setShowQR(true); return; }
    setLoading(true); setError('');
    try {
      const response = await axios.post(`${API_URL}/api/v1/entries`, { text, lang: i18n.language }, { headers: { Authorization: `Bearer ${token}` } });
      setResult(response.data); setText(''); setEntriesToday(prev => prev + 1);
    } catch (err: any) { setError(err.response?.data?.detail || "Ошибка при отправке"); }
    finally { setLoading(false); }
  };

  const handlePaymentConfirmation = async () => {
    try {
      await axios.post(`${API_URL}/api/v1/entries/confirm-payment`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) { console.error(error); }
    setShowQR(false);
    setPaymentPending(true);
  };

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('isSubscribed'); setToken(''); setIsSubscribed(false); window.location.href = '/'; };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)' }}>
      <BrowserRouter>
        <nav style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.5)', padding: '16px 20px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/brain.png" alt="MoodDiary" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, background: 'linear-gradient(90deg, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MoodDiary</h1>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => changeLanguage('ru')} style={{ padding: '4px 12px', borderRadius: '20px', border: 'none', background: 'white', fontSize: '14px', cursor: 'pointer' }}>RU</button>
              <button onClick={() => changeLanguage('en')} style={{ padding: '4px 12px', borderRadius: '20px', border: 'none', background: 'white', fontSize: '14px', cursor: 'pointer' }}>EN</button>
              {token && (
                <button onClick={logout} style={{ padding: '4px 12px', borderRadius: '20px', border: 'none', background: '#fda4af', color: 'white', fontSize: '14px', cursor: 'pointer' }}>Выйти</button>
              )}
            </div>
          </div>
        </nav>

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
          {!token ? (
            <div style={{ marginTop: '40px', background: 'rgba(255,255,255,0.6)', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '24px', textAlign: 'center', color: '#333' }}>{isLogin ? 'С возвращением!' : 'Создать аккаунт'}</h2>
              {error && <p style={{ color: '#ef4444', marginBottom: '16px', textAlign: 'center' }}>⚠️ {error}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '12px', borderRadius: '16px', border: '1px solid #ddd', fontSize: '16px' }} />
                <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '12px', borderRadius: '16px', border: '1px solid #ddd', fontSize: '16px' }} />
                <button onClick={handleLogin} style={{ background: 'linear-gradient(90deg, #c4b5fd, #a5b4fc)', color: 'white', padding: '12px', borderRadius: '16px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
                  {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
                </button>
                <p onClick={() => setIsLogin(!isLogin)} style={{ color: '#8b5cf6', cursor: 'pointer', textAlign: 'center', marginTop: '16px' }}>{isLogin ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}</p>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <Link to="/" style={{ flex: 1, background: 'rgba(255,255,255,0.6)', borderRadius: '16px', padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333', textDecoration: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>📝 Запись</Link>
                <Link to="/history" style={{ flex: 1, background: 'rgba(255,255,255,0.6)', borderRadius: '16px', padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333', textDecoration: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>📜 История</Link>
                <Link to="/stats" style={{ flex: 1, background: 'rgba(255,255,255,0.6)', borderRadius: '16px', padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333', textDecoration: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>📊 Статистика</Link>
              </div>

              <Routes>
                <Route path="/" element={
                  <div>
                    {paymentPending ? (
                      <div style={{ border: '1px solid #93c5fd', borderRadius: '16px', padding: '16px', background: '#eff6ff', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb', marginBottom: '8px' }}>Заявка отправлена!</h3>
                        <p style={{ fontSize: '14px', color: '#666' }}>Мы получили запрос на оплату. Пожалуйста, подождите, пока администратор проверит перевод.</p>
                      </div>
                    ) : showQR && !isSubscribed ? (
                      <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '24px', padding: '24px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Лимит исчерпан</h3>
                        <p style={{ color: '#666', marginBottom: '16px' }}>Вы использовали 3 бесплатные записи. Продолжайте с подпиской!</p>
                        <img src="/qr-code.png" alt="QR-код для оплаты" style={{ width: '192px', height: '192px', margin: '0 auto 16px', borderRadius: '12px', display: 'block' }} />
                        <p style={{ fontSize: '18px', fontWeight: '700', color: '#8b5cf6' }}>299 ₽ / месяц</p>
                        <button onClick={handlePaymentConfirmation} style={{ marginTop: '16px', background: 'linear-gradient(90deg, #6ee7b7, #34d399)', color: 'white', padding: '12px 32px', borderRadius: '50px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                          ✅ Я оплатил
                        </button>
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: '#333' }}>Как прошёл твой день?</h2>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <textarea value={text} onChange={(e) => setText(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #ddd', minHeight: '150px', fontSize: '16px', boxSizing: 'border-box' }} placeholder="Напишите, что вы чувствуете..." />
                          <button onClick={handleVoiceInput} style={isRecording ? { background: '#f87171', color: 'white', padding: '16px', borderRadius: '50%', border: 'none', fontSize: '20px', cursor: 'pointer', minWidth: '56px', height: '56px' } : { background: '#a5b4fc', color: 'white', padding: '16px', borderRadius: '50%', border: 'none', fontSize: '20px', cursor: 'pointer', minWidth: '56px', height: '56px' }}>
                            {isRecording ? "🔴" : "🎤"}
                          </button>
                        </div>
                        <button onClick={handleSubmit} style={{ marginTop: '16px', background: 'linear-gradient(90deg, #fdba74, #fcd34d)', color: '#333', padding: '12px 24px', borderRadius: '50px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                          {loading ? 'Анализ...' : 'Отправить на анализ ✨'}
                        </button>
                        {result && (
                          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, #ecfdf5, #eff6ff)', border: '1px solid #a7f3d0' }}>
                            <p style={{ fontWeight: '700', color: '#166534', margin: '0 0 8px 0' }}>Настроение: {result.sentiment}</p>
                            <p style={{ color: '#333', margin: 0 }}><b>Совет:</b> {result.recommendation}</p>
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
    </div>
  );
}

export default App;
