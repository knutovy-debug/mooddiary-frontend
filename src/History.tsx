import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "https://web-production-e70f0c.up.railway.app";

interface Entry {
  id: number;
  text: string;
  sentiment: string;
  stress_level: number;
  topics: string;
  recommendation: string;
  created_at: string;
}

function History() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEntries = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('unauthorized') || 'Вы не авторизованы');
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/api/v1/entries/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEntries(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || t('error_loading') || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [t]);

  if (loading) return <div className="text-center p-6 text-amber-700">⏳ {t('loading')}...</div>;
  if (error) return <div className="text-center text-red-500 p-6">{error}</div>;
  if (entries.length === 0) return <div className="text-center p-6 text-amber-700">📭 {t('no_entries')}</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-amber-800 mb-4">📜 {t('my_entries')}</h2>
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="glass-card p-4 rounded-2xl shadow-md animate-softFadeIn">
            <div className="flex justify-between items-start">
              <p className="text-amber-900 whitespace-pre-wrap">{entry.text}</p>
              <span className="text-sm text-amber-500/70 ml-4 whitespace-nowrap">
                {new Date(entry.created_at).toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100/70 text-blue-700 rounded-full text-xs">😊 {t('mood')}: {entry.sentiment}</span>
              <span className="px-3 py-1 bg-red-100/70 text-red-700 rounded-full text-xs">📊 {t('stress')}: {entry.stress_level}/10</span>
              <span className="px-3 py-1 bg-green-100/70 text-green-700 rounded-full text-xs">🏷️ {t('topics')}: {entry.topics || '—'}</span>
            </div>
            <p className="mt-2 text-sm text-amber-700/70">💡 {t('advice')}: {entry.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;