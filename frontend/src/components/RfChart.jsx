import { useMemo, useState } from "react";
import { normalizeMediciones, formatFrecuencia, unwrapPhase } from "../lib/rfUtils";

function ChartSvg({ puntos, yKey, yLabel, yUnit, color, height = 220 }) {
  const W = 720;
  const H = height;
  const pad = { l: 56, r: 16, t: 18, b: 34 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const valid = puntos.filter((p) => p[yKey] != null && isFinite(p[yKey]));
  if (valid.length < 2) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-black/10 bg-white/60 text-sm text-tivit-ink/50">
        Se necesitan al menos 2 puntos con {yLabel}
      </div>
    );
  }

  const xs = valid.map((p) => p.freqHz);
  const ys = valid.map((p) => p[yKey]);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const yPad = (yMax - yMin) * 0.12 || 1;
  const yLo = yMin - yPad;
  const yHi = yMax + yPad;

  // log scale for freq if span > 100x
  const useLog = xMax / Math.max(xMin, 1) > 100;
  const xScale = (x) => {
    if (useLog) {
      const lxMin = Math.log10(Math.max(xMin, 1));
      const lxMax = Math.log10(Math.max(xMax, 1));
      const lx = Math.log10(Math.max(x, 1));
      return pad.l + ((lx - lxMin) / Math.max(lxMax - lxMin, 1e-9)) * plotW;
    }
    return pad.l + ((x - xMin) / Math.max(xMax - xMin, 1e-9)) * plotW;
  };
  const yScale = (y) => pad.t + (1 - (y - yLo) / Math.max(yHi - yLo, 1e-9)) * plotH;

  const pathD = valid
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.freqHz).toFixed(2)} ${yScale(p[yKey]).toFixed(2)}`)
    .join(" ");

  const gridYs = 4;
  const gridXs = 5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border border-black/5 bg-white shadow-sm" role="img" aria-label={`${yLabel} vs frecuencia`}>
      {/* grid */}
      {Array.from({ length: gridYs + 1 }).map((_, i) => {
        const y = pad.t + (i / gridYs) * plotH;
        const val = yHi - (i / gridYs) * (yHi - yLo);
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
            <text x={pad.l - 8} y={y + 3} textAnchor="end" fontSize="10" fill="rgba(0,0,0,0.45)">
              {val.toFixed(1)}{yUnit}
            </text>
          </g>
        );
      })}
      {Array.from({ length: gridXs + 1 }).map((_, i) => {
        const x = pad.l + (i / gridXs) * plotW;
        return <line key={i} x1={x} y1={pad.t} x2={x} y2={H - pad.b} stroke="rgba(0,0,0,0.04)" strokeWidth="1" />;
      })}
      {/* axes */}
      <rect x={pad.l} y={pad.t} width={plotW} height={plotH} fill="none" stroke="rgba(0,0,0,0.08)" rx="6" />
      {/* path */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* dots */}
      {valid.map((p, i) => (
        <circle key={i} cx={xScale(p.freqHz)} cy={yScale(p[yKey])} r="3.2" fill={color} stroke="white" strokeWidth="1.2" />
      ))}
      {/* x labels */}
      {[0, 0.5, 1].map((t) => {
        const freq = useLog ? Math.pow(10, Math.log10(Math.max(xMin, 1)) + t * (Math.log10(Math.max(xMax, 1)) - Math.log10(Math.max(xMin, 1)))) : xMin + t * (xMax - xMin);
        const x = xScale(freq);
        return (
          <text key={t} x={x} y={H - 10} textAnchor="middle" fontSize="10" fill="rgba(0,0,0,0.55)">
            {formatFrecuencia(freq)}
          </text>
        );
      })}
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="9" fill="rgba(0,0,0,0.35)">Frecuencia</text>
      <text x={12} y={H / 2} textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`} fontSize="10" fill="rgba(0,0,0,0.55)">
        {yLabel}
      </text>
    </svg>
  );
}

export function RfChart({ mediciones, titulo }) {
  const [unwrap, setUnwrap] = useState(false);
  const [showDb, setShowDb] = useState(true);

  const pts = useMemo(() => {
    const n = normalizeMediciones(mediciones);
    return unwrap ? unwrapPhase(n) : n;
  }, [mediciones, unwrap]);

  if (!pts || pts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-6 text-center">
        <p className="text-sm font-semibold text-tivit-ink/60">Sin mediciones para graficar</p>
        <p className="mt-1 text-xs text-tivit-ink/45">Agrega puntos en el editor CMS (frecuencia + magnitud/fase) para ver magnitud en dB y fase como en ADS.</p>
      </div>
    );
  }

  const hasDb = pts.some((p) => p.db != null);
  const hasFase = pts.some((p) => p.fase != null);

  return (
    <div className="space-y-4">
      {titulo && <h3 className="text-sm font-bold uppercase tracking-wider text-tivit-ink/60">{titulo}</h3>}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs font-medium text-tivit-ink/70">
          <input type="checkbox" checked={showDb} onChange={(e) => setShowDb(e.target.checked)} className="rounded" /> Magnitud (dB)
        </label>
        <label className="flex items-center gap-1.5 text-xs font-medium text-tivit-ink/70">
          <input type="checkbox" checked={unwrap} onChange={(e) => setUnwrap(e.target.checked)} className="rounded" /> Fase unwrap
        </label>
        <span className="ml-auto text-xs text-tivit-ink/40">{pts.length} puntos · {formatFrecuencia(pts[0].freqHz)} → {formatFrecuencia(pts[pts.length - 1].freqHz)}</span>
      </div>
      {hasDb && showDb && (
        <div>
          <p className="mb-2 text-xs font-semibold text-tivit-ink/55">Magnitud — 20·log10(|S|) [dB]</p>
          <ChartSvg puntos={pts} yKey="db" yLabel="Magnitud" yUnit=" dB" color="#dc2626" />
        </div>
      )}
      {hasFase && (
        <div>
          <p className="mb-2 text-xs font-semibold text-tivit-ink/55">Fase [°]</p>
          <ChartSvg puntos={pts} yKey="fase" yLabel="Fase" yUnit="°" color="#2563eb" />
        </div>
      )}
      <details className="rounded-xl border border-black/5 bg-white p-3">
        <summary className="cursor-pointer text-xs font-semibold text-tivit-ink/70">Ver tabla de datos ({pts.length})</summary>
        <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-black/5">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-tivit-red-light/40 text-tivit-ink/60">
              <tr><th className="px-2 py-1 text-left">Frecuencia</th><th className="px-2 py-1 text-right">dB</th><th className="px-2 py-1 text-right">Fase °</th></tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {pts.map((p, i) => (
                <tr key={i} className="hover:bg-tivit-red-light/20">
                  <td className="px-2 py-1 font-mono">{formatFrecuencia(p.freqHz)}</td>
                  <td className="px-2 py-1 text-right font-mono">{p.db != null ? p.db.toFixed(2) : "—"}</td>
                  <td className="px-2 py-1 text-right font-mono">{p.fase != null ? p.fase.toFixed(2) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-tivit-ink/45">Fórmula dB: <code className="rounded bg-tivit-ink/5 px-1">20·log10(|mag|)</code> idéntica a ADS. Si cargas magnitud lineal, se convierte; si cargas dB directo, se usa tal cual.</p>
      </details>
    </div>
  );
}
