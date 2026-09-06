interface Props {
  points: { x: number; y: number }[];
  splitAt: number;
  earlyMean: number;
  lateMean: number;
  totalScripts: number;
}

/**
 * Every partial-credit script, plotted where it was marked against how far the
 * faculty sat above Markable's reading of their own guide. One scale places the
 * dots, the mean lines and the labels — if the two segments sit at different
 * heights, the marking standard moved.
 */
export default function DriftChart({ points, splitAt, earlyMean, lateMean, totalScripts }: Props) {
  const W = 760;
  const H = 260;
  const L = 58;
  const R = 726;
  const T = 22;
  const B = 200;

  const ys = points.map((p) => p.y);
  const yMax = Math.ceil(Math.max(...ys, earlyMean) * 2) / 2 + 0.5;
  const yMin = Math.min(0, Math.floor(Math.min(...ys) * 2) / 2);

  const x = (n: number) => L + ((R - L) * (n - 1)) / Math.max(1, totalScripts - 1);
  const y = (v: number) => B - ((B - T) * (v - yMin)) / (yMax - yMin);

  const ticks: number[] = [];
  for (let t = Math.ceil(yMin); t <= yMax; t += 1) ticks.push(t);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`Faculty marks minus Markable's marks, plotted against marking order. Scripts 1 to ${splitAt} average ${earlyMean} marks above Markable; scripts ${splitAt + 1} to ${totalScripts} average ${lateMean}.`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} y1={y(t)} x2={R} y2={y(t)} stroke="var(--rule)" strokeWidth={1} />
          <text x={L - 10} y={y(t) + 4} textAnchor="end" fill="var(--faint)" fontFamily="IBM Plex Mono, monospace" fontSize={13}>
            {t > 0 ? `+${t}` : t}
          </text>
        </g>
      ))}

      <line x1={x(splitAt + 0.5)} y1={T} x2={x(splitAt + 0.5)} y2={B} stroke="var(--critical)" strokeWidth={1} strokeDasharray="3 3" />
      <text x={x(splitAt + 0.5) + 7} y={T + 11} fill="var(--critical)" fontFamily="IBM Plex Mono, monospace" fontSize={13}>
        script {splitAt}
      </text>

      {points.map((p, i) => (
        <circle
          key={i}
          cx={x(p.x)}
          cy={y(p.y)}
          r={3.4}
          fill={p.x <= splitAt ? 'var(--good)' : 'var(--faculty)'}
          fillOpacity={0.85}
        />
      ))}

      <line x1={x(1)} y1={y(earlyMean)} x2={x(splitAt)} y2={y(earlyMean)} stroke="var(--good)" strokeWidth={2.5} />
      <line x1={x(splitAt + 1)} y1={y(lateMean)} x2={x(totalScripts)} y2={y(lateMean)} stroke="var(--faculty)" strokeWidth={2.5} />

      <text x={x(1)} y={y(earlyMean) - 10} fill="var(--good)" fontFamily="IBM Plex Mono, monospace" fontSize={16} fontWeight={600}>
        mean +{earlyMean.toFixed(2)}
      </text>
      <text x={x(totalScripts)} y={y(lateMean) + 18} textAnchor="end" fill="var(--faculty)" fontFamily="IBM Plex Mono, monospace" fontSize={16} fontWeight={600}>
        mean +{lateMean.toFixed(2)}
      </text>

      <line x1={L} y1={B} x2={R} y2={B} stroke="var(--rule-strong)" strokeWidth={1} />
      {[1, splitAt, totalScripts].map((n) => (
        <text key={n} x={x(n)} y={B + 18} textAnchor="middle" fill="var(--faint)" fontFamily="IBM Plex Mono, monospace" fontSize={13}>
          {n}
        </text>
      ))}
      <text x={(L + R) / 2} y={B + 38} textAnchor="middle" fill="var(--faint)" fontFamily="IBM Plex Mono, monospace" fontSize={13} letterSpacing="0.12em">
        MARKING ORDER
      </text>
      <text
        x={14}
        y={(T + B) / 2}
        textAnchor="middle"
        transform={`rotate(-90 14 ${(T + B) / 2})`}
        fill="var(--faint)"
        fontFamily="IBM Plex Mono, monospace"
        fontSize={13}
        letterSpacing="0.12em"
      >
        YOU − Markable (MARKS)
      </text>
    </svg>
  );
}
