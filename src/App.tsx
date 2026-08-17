import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import History from './History';
import Stats from './Stats';
// Если у тебя есть другие компоненты, добавь их сюда

const API_URL = 'https://api.mooddiary.pro';

function App() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isLogin, setIsLogin] = useState(true);
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Остальная логика (функции входа/регистрации, logout и т.д.)
  // Здесь должен быть твой код авторизации, запросы к API и прочее

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  return (
    <BrowserRouter>
      <nav className="flex justify-between items-center p-4 bg-white shadow-md">
        {/* Логотип и навигация */}
        <div className="flex gap-4">
          {/* Кнопки переключения языка */}
          <button onClick={() => changeLanguage('ru')} className="text-sm">RU</button>
          <button onClick={() => changeLanguage('en')} className="text-sm">EN</button>
        </div>

        <div>
          {/* Ссылка на оплату - исправленная */}
          <a
            href="https://t.me/mooddiary_pay_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-500 text-white px-4 py-2 rounded-full hover:bg-amber-600 transition text-sm"
          >
            {t('buy_subscription') || 'Купить подписку'}
          </a>

          {/* Кнопка выхода */}
          <button
            onClick={logout}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-300 transition"
          >
            {t('logout')}
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6">
        <Routes>
          <Route path="/" element={
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/40">
              {/* Здесь твой основной контент */}
              {/* Пример ввода текста */}
              <div className="flex flex-col items-center gap-3 mb-4">
                <span className="text-3xl">🧠</span>
              </div>
              {/* Остальной контент страницы */}
            </div>
          } />
          {/* Добавь другие маршруты, если есть */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
