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
  const [showQR, setShowQR] = useState(false);
  const [entriesToday, setEntriesToday] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(3);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [entriesCount, setEntriesCount] = useState(0);

  useEffect(() => {
    if (token) {
      axios
        .get(`${API_URL}/api/v1/subscription/status`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setIsSubscribed(res.data.is_subscribed))
        .catch(() => {});

      axios
        .get(`${API_URL}/api/v1/entries/today-count`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setEntriesToday(res.data.count);
          setDailyLimit(res.data.limit);
          setIsSubscribed(res.data.is_premium);
        })
        .catch(() => {});
    }
  }, [token]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  const handleAuth = async () => {
    setError('');
    const url = isLogin
      ? `${API_URL}/api/v1/auth/login`
      : `${API_URL}/api/v1/auth/register`;
    try {
      const res = await axios.post(url, { email, password });
      if (isLogin) {
        const token = res.data.access_token;
        if (!token) throw new Error('Токен не получен');
        setToken(token);
        localStorage.setItem('token', token);
        alert('Успешный вход!');
      } else {
        alert('Регистрация успешна! Теперь войдите.');
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error('Ошибка:', err);
      let msg = 'Неизвестная ошибка';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') msg = detail;
        else if (Array.isArray(detail))
          msg = detail.map((d: any) => d.msg).join(', ');
        else msg = JSON.stringify(detail);
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    
    // БЛОКИРОВКА: если использованы 3 бесплатные записи и нет подписки - показываем QR
    if (entriesToday >= 3 && !isSubscribed) {
      setShowQR(true);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/v1/analyze`, {
        params: { text, lang: i18n.language },
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(response.data);
      
      const countRes = await axios.get(`${API_URL}/api/v1/entries/today-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntriesToday(countRes.data.count);
      setDailyLimit(countRes.data.limit);
      setIsSubscribed(countRes.data.is_premium);
    } catch (err: any) {
      console.error('Ошибка:', err);
      let msg = 'Ошибка запроса';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') msg = detail;
        else if (Array.isArray(detail))
          msg = detail.map((d: any) => d.msg).join(', ');
        else msg = JSON.stringify(detail);
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    window.location.reload();
  };

  const getResultBg = () => {
    if (!result) return '';
    if (result.sentiment === 'positive') return 'bg-green-50 border-green-200';
    if (result.sentiment === 'negative') return 'bg-red-50 border-red-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-white/40">
          <div className="flex justify-end gap-2 mb-4">
            <button onClick={() => changeLanguage('ru')} className="text-sm">🇷🇺</button>
            <button onClick={() => changeLanguage('en')} className="text-sm">🇬🇧</button>
          </div>
          <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-6">
            {isLogin ? `🔐 ${t('login')}` : `📝 ${t('register')}`}
          </h1>
          <input
            type="email"
            placeholder={t('enter_email')}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 transition outline-none mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder={t('enter_password')}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 transition outline-none mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleAuth}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            {isLogin ? t('login') : t('register')}
          </button>
          <p className="text-center text-sm mt-4 text-gray-600">
            {isLogin ? t('no_account') : t('already_account')}
            <span
              className="text-indigo-600 font-medium cursor-pointer hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? ` ${t('sign_up')}` : ` ${t('sign_in')}`}
            </span>
          </p>
          {error && <p className="text-red-500 text-center mt-3">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <nav className="bg-white/70 backdrop-blur-md shadow-sm p-4 flex flex-wrap justify-between items-center border-b border-white/30">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            🧠 MoodDiary
          </h1>

          <div className="flex items-center gap-3 flex-wrap">
            <Link to="/" className="text-gray-700 hover:text-indigo-600 font-medium transition">
              🏠 {t('home')}
            </Link>
            <Link to="/history" className="text-gray-700 hover:text-indigo-600 font-medium transition">
              📜 {t('history')}
            </Link>
            <Link to="/stats" className="text-gray-700 hover:text-indigo-600 font-medium transition">
              📊 {t('stats')}
            </Link>

            <span className="text-sm text-gray-500">
              📝 {entriesToday} / {dailyLimit === 999 ? '∞' : dailyLimit}
            </span>

            {isSubscribed ? (
              <span className="text-green-600 font-semibold">⭐ Премиум</span>
            ) : (
              <span className="text-amber-600">🔓 Бесплатный</span>
            )}

            <button onClick={() => changeLanguage('ru')} className="text-sm">🇷🇺</button>
            <button onClick={() => changeLanguage('en')} className="text-sm">🇬🇧</button>

            <button
              onClick={logout}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-300 transition"
            >
              {t('logout')}
            </button>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto p-6">
          {/* БЛОК С QR-КОДОМ (показывается только когда showQR = true) */}
          {showQR && !isSubscribed && (
            <div className="bg-white border-2 border-amber-300 rounded-3xl p-6 mb-6 text-center shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                🚀 Лимит использован!
              </h3>
              <p className="text-gray-600 mb-4">
                Вы использовали {entriesToday} из {dailyLimit} бесплатных записей.
                Продолжите с подпиской!
              </p>
              <span className="block text-gray-800 font-bold text-lg mb-3">
                💎 299 ₽ / месяц
              </span>
              <img
                src="/qr-code.png"
                alt="QR-код для оплаты"
                className="w-48 h-48 mx-auto mb-3 rounded-lg border border-gray-300"
              />
              <span className="block text-gray-500 text-xs">
                Отсканируйте QR-код в приложении банка. После оплаты нажмите «Выйти» и войдите снова.
              </span>
            </div>
          )}

          <Routes>
            <Route
              path="/"
              element={
                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/40">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">📝</span>
                    <h2 className="text-2xl font-semibold text-gray-800">{t('how_was_day')}</h2>
                  </div>
                  <textarea
                    className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 transition outline-none resize-none"
                    placeholder={t('write_here')}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full mt-5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {loading ? t('analyzing') : t('analyze')}
                  </button>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
                      {error}
                    </div>
                  )}

                  {result && (
                    <div className={`mt-6 p-5 rounded-xl border shadow-md animate-fadeInUp ${getResultBg()}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🧠</span>
                        <h3 className="text-lg font-semibold text-gray-800">{t('result')}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><span className="font-medium">{t('mood')}:</span> {result.sentiment}</div>
                        <div><span className="font-medium">{t('stress')}:</span> {result.stress_level}/10</div>
                        <div className="col-span-2"><span className="font-medium">{t('topics')}:</span> {result.topics?.join(', ') || '—'}</div>
                        <div className="col-span-2"><span className="font-medium">{t('advice')}:</span> {result.recommendation}</div>
                      </div>
                    </div>
                  )}
                </div>
              }
            />
            <Route path="/history" element={<History />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;