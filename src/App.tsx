import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import History from './History';
import Stats from './Stats';

const API_URL = 'https://mooddiary-backend.onrender.com';

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
        alert(t('login_success') || 'Успешный вход!');
      } else {
        alert(t('register_success') || 'Регистрация успешна! Теперь войдите.');
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error('Ошибка:', err);
      let msg = t('unknown_error') || 'Неизвестная ошибка';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') msg = detail;
        else if (Array.isArray(detail)) msg = detail.map((d: any) => d.msg).join(', ');
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
  try {
    const response = await axios.get(`${API_URL}/api/v1/analyze`, {
      params: { text, lang: i18n.language },
      headers: { Authorization: `Bearer ${token}` },
    });
    setResult(response.data);
  } catch (err: any) {
    console.error('Ошибка:', err);
    setError(err.message || 'Ошибка запроса');
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
    if (result.sentiment === 'positive') return 'card-result-positive';
    if (result.sentiment === 'negative') return 'card-result-negative';
    return 'card-result-neutral';
  };

  // ===== СТРАНИЦА ВХОДА =====
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#fdf6f0' }}>
        <div className="glass-card p-8 rounded-3xl shadow-xl w-full max-w-sm">
          <div className="flex justify-end gap-2 mb-4">
            <button onClick={() => changeLanguage('ru')} className="text-sm hover:scale-110 transition">🇷🇺</button>
            <button onClick={() => changeLanguage('en')} className="text-sm hover:scale-110 transition">🇬🇧</button>
          </div>
          <h1 className="text-4xl font-bold text-center text-amber-800 mb-6">
            {isLogin ? '🔐 ' + t('login') : '📝 ' + t('register')}
          </h1>
          <input
            type="email"
            placeholder={t('enter_email')}
            className="input-primary mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder={t('enter_password')}
            className="input-primary mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleAuth} className="btn-primary w-full">
            {isLogin ? t('login') : t('register')}
          </button>
          <p className="text-center text-sm mt-4 text-amber-700/70">
            {isLogin ? t('no_account') : t('already_account')}
            <span
              className="text-amber-600 font-medium cursor-pointer hover:underline ml-1"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? t('sign_up') : t('sign_in')}
            </span>
          </p>
          {error && <p className="text-red-500 text-center mt-3 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  // ===== ОСНОВНОЙ ИНТЕРФЕЙС =====
  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ background: '#fdf6f0' }}>
        {/* Навигация */}
        <nav className="glass-card p-4 flex flex-wrap justify-between items-center border-b border-amber-200/30">
          <h1 className="text-2xl font-bold text-amber-800">🧠 MoodDiary</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <Link to="/" className="text-amber-700 hover:text-amber-900 font-medium transition">{t('home')}</Link>
            <Link to="/history" className="text-amber-700 hover:text-amber-900 font-medium transition">{t('history')}</Link>
            <Link to="/stats" className="text-amber-700 hover:text-amber-900 font-medium transition">{t('stats')}</Link>
            <button onClick={() => changeLanguage('ru')} className="text-sm hover:scale-110 transition">🇷🇺</button>
            <button onClick={() => changeLanguage('en')} className="text-sm hover:scale-110 transition">🇬🇧</button>
            <button onClick={logout} className="bg-amber-200/50 text-amber-800 px-4 py-2 rounded-full hover:bg-amber-300/50 transition">
              {t('logout')}
            </button>
          </div>
        </nav>

        {/* Основной контент */}
        <div className="max-w-3xl mx-auto p-6">
          <Routes>
            <Route path="/" element={
              <div className="glass-card rounded-3xl p-8 animate-softFadeIn">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl animate-float">📝</span>
                  <h2 className="text-2xl font-semibold text-amber-800">{t('how_was_day')}</h2>
                </div>

                <textarea
                  className="input-primary"
                  placeholder={t('write_here')}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />

                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="btn-primary w-full mt-5"
                >
                  {loading ? (
                    <span className="animate-gentlePulse">⏳ {t('analyzing')}</span>
                  ) : (
                    t('analyze')
                  )}
                </button>

                {error && (
                  <div className="mt-4 p-3 bg-red-50/80 text-red-700 rounded-xl border border-red-200/50">
                    {error}
                  </div>
                )}

                {result && (
                  <div className={`mt-6 p-5 rounded-2xl border animate-softFadeIn ${getResultBg()}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🧠</span>
                      <h3 className="text-lg font-semibold text-amber-800">{t('result')}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-amber-900">
                      <div><span className="font-medium">{t('mood')}:</span> {result.sentiment}</div>
                      <div><span className="font-medium">{t('stress')}:</span> {result.stress_level}/10</div>
                      <div className="col-span-2"><span className="font-medium">{t('topics')}:</span> {result.topics?.join(', ') || '—'}</div>
                      <div className="col-span-2"><span className="font-medium">{t('advice')}:</span> {result.recommendation}</div>
                    </div>
                  </div>
                )}
              </div>
            } />
            <Route path="/history" element={<History />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;