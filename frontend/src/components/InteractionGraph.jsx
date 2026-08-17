import { useState, useEffect } from 'react';
import { getInteractionData } from '../services/analytics';

const CHART = {
  width: 700,
  height: 320,
  padTop: 24,
  padRight: 16,
  padBottom: 48,
  padLeft: 40,
};

const EMPTY = { days_data: [], eventTypes: [], eventLabels: {}, eventColors: {}, maxTotal: 1 };

export default function InteractionGraph() {
  const [data, setData] = useState(EMPTY);

  useEffect(() => {
    let active = true;
    getInteractionData(14).then((d) => { if (active) setData(d); });
    return () => { active = false; };
  }, []);
  const { days_data, eventTypes, eventLabels, eventColors, maxTotal } = data;

  const plotW = CHART.width - CHART.padLeft - CHART.padRight;
  const plotH = CHART.height - CHART.padTop - CHART.padBottom;
  const barGap = 2;
  const barW = Math.max(Math.floor(plotW / days_data.length) - barGap, 4);

  const yTicks = 5;
  const yStep = Math.ceil(maxTotal / yTicks) || 1;

  const bars = days_data.map((d, i) => {
    const x = CHART.padLeft + i * (barW + barGap) + barGap / 2;
    let y = CHART.padTop + plotH;
    const segments = [];

    for (const evt of eventTypes) {
      const count = d.byEvent[evt] || 0;
      if (count === 0) continue;
      const h = (count / (yStep * yTicks)) * plotH;
      segments.push({ evt, count, y: y - h, h });
      y -= h;
    }

    return { x, segments, total: d.total, label: d.label, wallets: d.uniqueWallets };
  });

  const walletMax = Math.max(...days_data.map((d) => d.uniqueWallets), 1);

  const walletLine = days_data.map((d, i) => {
    const x = CHART.padLeft + i * (barW + barGap) + barGap / 2 + barW / 2;
    const y = CHART.padTop + plotH - (d.uniqueWallets / walletMax) * plotH;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        className="w-full h-auto"
        style={{ minWidth: 480 }}
      >
        {[...Array(yTicks + 1)].map((_, i) => {
          const y = CHART.padTop + plotH - (i / yTicks) * plotH;
          return (
            <line
              key={i}
              x1={CHART.padLeft}
              y1={y}
              x2={CHART.width - CHART.padRight}
              y2={y}
              stroke="currentColor"
              className="text-[#E5E5E5] dark:text-[#222]"
              strokeWidth="1"
            />
          );
        })}

        {bars.map((b, i) => (
          <g key={i}>
            {b.segments.map((s) => (
              <rect
                key={s.evt}
                x={b.x}
                y={s.y}
                width={barW}
                height={Math.max(s.h, 0)}
                fill={eventColors[s.evt]}
                rx="1"
                opacity="0.85"
              >
                <title>{`${eventLabels[s.evt] || s.evt}: ${s.count}`}</title>
              </rect>
            ))}
            {b.total === 0 && (
              <line
                x1={b.x}
                y1={CHART.padTop + plotH - 1}
                x2={b.x + barW}
                y2={CHART.padTop + plotH - 1}
                stroke="currentColor"
                className="text-[#E5E5E5] dark:text-[#333]"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
            <text
              x={b.x + barW / 2}
              y={CHART.padTop + plotH + 16}
              textAnchor="middle"
              className="fill-[#999] dark:text-[#666]"
              fontSize="9"
              fontFamily="monospace"
            >
              {b.label}
            </text>
          </g>
        ))}

        <polyline
          points={walletLine}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 3"
          opacity="0.7"
        />
        {days_data.map((d, i) => {
          if (d.uniqueWallets === 0) return null;
          const x = CHART.padLeft + i * (barW + barGap) + barGap / 2 + barW / 2;
          const y = CHART.padTop + plotH - (d.uniqueWallets / walletMax) * plotH;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="#06b6d4"
              opacity="0.8"
            >
              <title>{`${d.label}: ${d.uniqueWallets} unique wallet${d.uniqueWallets !== 1 ? 's' : ''}`}</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
