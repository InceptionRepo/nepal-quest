import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function getBarColor(score) {
  if (score <= 3) return '#22c55e';
  if (score <= 6) return '#f59e0b';
  return '#ef4444';
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const score = payload[0].value;
  let labelText = 'Quiet';
  if (score > 3 && score <= 6) labelText = 'Moderate';
  else if (score > 6 && score <= 8) labelText = 'Busy';
  else if (score > 8) labelText = 'Very Crowded';

  return (
    <div className="bg-gray-800 border border-white/10 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-white">{label}</p>
      <p className="text-gray-400">Score: {typeof score === 'number' ? score.toFixed(1) : score}</p>
      <p style={{ color: getBarColor(score) }} className="font-medium">{labelText}</p>
    </div>
  );
}

export default function CrowdChart({ data, destName }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-xl border border-white/5 p-4">
      <h3 className="text-sm font-semibold text-gray-200 mb-3">
        Crowd Trend — {destName || 'Destination'}
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#374151" />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#374151" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
