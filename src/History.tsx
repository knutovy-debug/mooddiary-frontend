import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "https://web-production-e70f0c.up.railway.app";

function History() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`${API_URL}/api/v1/entries/my`, { headers: { Authorization: `Bearer ${token}` } });
        setEntries(response.data);
      } catch (error) {
        console.error("Ошибка загрузки истории", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">📜 История записей</h2>
      {loading && <p>Загрузка...</p>}
      {entries.map((entry) => (
        <div key={entry.id} className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-4 shadow-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">{new Date(entry.created_at).toLocaleString()}</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Уровень стресса: {entry.stress_level}/10</span>
          </div>
          <p className="text-gray-800 mb-3">{entry.text}</p>
          <div className="text-sm">
            <p className="font-semibold">Рекомендация: <span className="font-normal text-gray-600">{entry.recommendation}</span></p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default History;
