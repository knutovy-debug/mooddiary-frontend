import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)                 // подключаем загрузчик файлов
  .use(initReactI18next)        // подключаем React-интеграцию
  .init({
    lng: localStorage.getItem('lang') || 'ru',   // язык по умолчанию
    fallbackLng: 'en',           // резервный язык, если перевод не найден
    debug: true,                 // полезно для отладки — показывает логи в консоли
    interpolation: {
      escapeValue: false,        // React уже экранирует текст
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',   // путь к файлам переводов
    },
  });

export default i18n;