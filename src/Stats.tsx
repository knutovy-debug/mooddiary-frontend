import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer
} from 'recharts';

const API_URL = 'web-production-e70f0c.up.railway.app';

interface StatsData {
  dates: string[];
  sentiments: number[];
  stress: number[];
  topics: Record<string, number>;
}

function Stats() {
  const { t } = useTranslation();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('unauthorized') || 'Вы не авторизованы');
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/api/v1/entries/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || t('error_loading') || 'Ошибка загрузки статистики');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [t]);

  if (loading) return <div className="text-center p-6 text-amber-700">⏳ {t('loading_stats')}...</div>;
  if (error) return <div className="text-center text-red-500 p-6">{error}</div>;
  if (!data || data.dates.length === 0) return <div className="text-center p-6 text-amber-700">📊 {t('no_data')}</div>;

  const chartData = data.dates.map((date, index) => ({
    date,
    sentiment: data.sentiments[index],
    stress: data.stress[index],
  }));

  const topTopics = Object.entries(data.topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-amber-800 mb-4">📊 {t('stats_title')}</h2>

      <div className="glass-card p-4 rounded-2xl shadow-md mb-6">
        <h3 className="text-lg font-semibold text-amber-800 mb-2">📈 {t('mood_chart')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5d5c0" />
            <XAxis dataKey="date" stroke="#a67c5b" />
            <YAxis stroke="#a67c5b" />
            <Tooltip contentStyle={{ background: '#fdf6f0', border: '1px solid #e5d5c0' }} />
            <Legend />
            <Line type="monotone" dataKey="sentiment" stroke="#8B5CF6" name={t('mood_label')} strokeWidth={2} />
            <Line type="monotone" dataKey="stress" stroke="#F97316" name={t('stress_label')} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-4 rounded-2xl shadow-md mb-6">
        <h3 className="text-lg font-semibold text-amber-800 mb-2">📊 {t('stress_chart')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5d5c0" />
            <XAxis dataKey="date" stroke="#a67c5b" />
            <YAxis stroke="#a67c5b" />
            <Tooltip contentStyle={{ background: '#fdf6f0', border: '1px solid #e5d5c0' }} />
            <Legend />
            <Bar dataKey="stress" fill="#F97316" name={t('stress_label')} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-4 rounded-2xl shadow-md">
        <h3 className="text-lg font-semibold text-amber-800 mb-2">🏷️ {t('topics_freq')}</h3>
        <ul className="list-disc pl-5 text-amber-800">
          {topTopics.map(([topic, count]) => (
            <li key={topic}>{topic}: {count} {t('times')}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Stats;