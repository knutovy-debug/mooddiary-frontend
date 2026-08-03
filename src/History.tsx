import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Entry {
  id: number;
  text: string;
  sentiment: string;
  stress_level: number;
  topics: string;   // <--- теперь строка, а не массив
  recommendation: string;
  created_at: string;
}

function History() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEntries = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Вы не авторизованы');
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get('http://mooddiary-backend.onrender.com', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEntries(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, []);

  if (loading) return <div className="text-center p-6">⏳ Загрузка...</div>;
  if (error) return <div className="text-center text-red-500 p-6">{error}</div>;
  if (entries.length === 0) return <div className="text-center p-6">📭 У вас пока нет записей.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-teal-700 mb-4">📜 Мои записи</h2>
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border border-white/30">
            <div className="flex justify-between items-start">
              <p className="text-gray-700 whitespace-pre-wrap">{entry.text}</p>
              <span className="text-sm text-gray-400 ml-4 whitespace-nowrap">
                {new Date(entry.created_at).toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">😊 {entry.sentiment}</span>
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">📊 {entry.stress_level}/10</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">🏷️ {entry.topics || '—'}</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">💡 {entry.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;