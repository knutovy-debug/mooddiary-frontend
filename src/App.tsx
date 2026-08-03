import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer
} from 'recharts';

interface StatsData {
  dates: string[];
  sentiments: number[];
  stress: number[];
  topics: Record<string, number>;
}

function Stats() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Вы не авторизованы');
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get('https://mooddiary-backend.onrender.com/api/v1/entries/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Ошибка загрузки статистики');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center p-6">⏳ Загрузка статистики...</div>;
  if (error) return <div className="text-center text-red-500 p-6">{error}</div>;
  if (!data || data.dates.length === 0) return <div className="text-center p-6">📊 Нет данных для статистики. Сделайте записи!</div>;

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
      <h2 className="text-2xl font-bold text-teal-700 mb-4">📊 Статистика настроения</h2>

      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border border-white/30 mb-6">
        <h3 className="text-lg font-semibold mb-2">📈 Динамика настроения и стресса</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sentiment" stroke="#8884d8" name="Настроение (1=позитивное)" />
            <Line type="monotone" dataKey="stress" stroke="#ff7300" name="Стресс (1-10)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border border-white/30 mb-6">
        <h3 className="text-lg font-semibold mb-2">📊 Уровень стресса по дням</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="stress" fill="#ff7300" name="Стресс" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border border-white/30">
        <h3 className="text-lg font-semibold mb-2">🏷️ Частота тем</h3>
        <ul className="list-disc pl-5">
          {topTopics.map(([topic, count]) => (
            <li key={topic}>{topic}: {count} раз</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Stats;