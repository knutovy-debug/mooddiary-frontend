import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || "https://web-production-e70f0c.up.railway.app";

function Stats() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`${API_URL}/api/v1/entries/stats`, { headers: { Authorization: `Bearer ${token}` } });
        const formatted = response.data.dates.map((date: string, index: number) => ({
          date: new Date(date).toLocaleDateString(),
          stress: response.data.stress_levels[index]
        }));
        setData(formatted);
      } catch (error) {
        console.error("Ошибка загрузки статистики", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-6 shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Динамика стресса</h2>
      {loading && <p>Загрузка...</p>}
      {data.length === 0 && !loading && <p className="text-gray-500">Пока нет данных для графика.</p>}
      {data.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="date" stroke="#8884d8" />
            <YAxis domain={[0, 10]} stroke="#8884d8" />
            <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Line type="monotone" dataKey="stress" stroke="#f43f5e" strokeWidth={3} dot={{ r: 5, fill: '#f43f5e' }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default Stats;
