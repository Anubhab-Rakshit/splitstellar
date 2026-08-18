import { useState, useEffect } from 'react';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Line, ComposedChart,
} from 'recharts';
import { getInteractionData } from '../services/analytics';

const EVENT_META = {
  wallet_connect: { label: 'Wallet Connect', color: '#22c55e' },
  create_pool: { label: 'Create Pool', color: '#3b82f6' },
  join_request: { label: 'Join Request', color: '#a855f7' },
  log_expense: { label: 'Log Expense', color: '#f59e0b' },
  settle_payment: { label: 'Settle Payment', color: '#ef4444' },
  update_profile: { label: 'Update Profile', color: '#06b6d4' },
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const entry = payload[0]?.payload;
  const items = payload.filter((p) => p.dataKey !== 'uniqueWallets' && p.value > 0);
  const wallets = entry?.uniqueWallets || 0;

  return (
    <div className="bg-white dark:bg-[#111] border border-[#E5E5E5] dark:border-[#333] px-4 py-3 shadow-lg">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888] mb-2">{label}</p>
      {items.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
          <span className="font-mono text-xs text-[#333] dark:text-[#ccc]">
            {EVENT_META[item.dataKey]?.label || item.dataKey}: {item.value}
          </span>
        </div>
      ))}
      {wallets > 0 && (
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-[#E5E5E5] dark:border-[#333]">
          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#06b6d4]" />
          <span className="font-mono text-xs text-[#333] dark:text-[#ccc]">
            Unique wallets: {wallets}
          </span>
        </div>
      )}
    </div>
  );
}

export default function InteractionGraph() {
  const [chartData, setChartData] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);

  useEffect(() => {
    let active = true;
    getInteractionData(14).then((data) => {
      if (!active) return;
      setChartData(data.days_data);
      setEventTypes(data.eventTypes);
    });
    return () => { active = false; };
  }, []);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-[320px] flex items-center justify-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#999] dark:text-[#555]">Loading interaction data...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="text-[#E5E5E5] dark:text-[#222]"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#999' }}
            axisLine={{ stroke: '#E5E5E5' }}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          {eventTypes.map((evt) => (
            <Bar
              key={evt}
              dataKey={evt}
              stackId="events"
              fill={EVENT_META[evt]?.color || '#888'}
              radius={evt === eventTypes[eventTypes.length - 1] ? [2, 2, 0, 0] : [0, 0, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
            />
          ))}
          <Line
            type="monotone"
            dataKey="uniqueWallets"
            stroke="#06b6d4"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ r: 3, fill: '#06b6d4', strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
            animationDuration={1000}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
