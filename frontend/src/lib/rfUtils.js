/**
 * Utilidades RF para gráficos dB / fase (ADS parity)
 * 20*log10(|mag|) para magnitud, fase en grados.
 */

export function parseFrecuencia(str) {
  if (str == null) return NaN;
  if (typeof str === "number") return str;
  const s = String(str).trim().toLowerCase().replace(/\s+/g, "");
  const match = s.match(/^([\d.]+(?:e[+-]?\d+)?)(ghz|mhz|khz|hz)?$/);
  if (!match) {
    const n = Number(s);
    return isNaN(n) ? NaN : n;
  }
  const val = parseFloat(match[1]);
  const unit = match[2] || "hz";
  const mult = { hz: 1, khz: 1e3, mhz: 1e6, ghz: 1e9 };
  return val * (mult[unit] || 1);
}

export function formatFrecuencia(hz) {
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(3).replace(/\.?0+$/, "")} GHz`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(2).replace(/\.?0+$/, "")} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(1).replace(/\.?0+$/, "")} kHz`;
  return `${hz} Hz`;
}

export function magToDb(mag) {
  const m = Math.abs(Number(mag));
  if (!isFinite(m) || m <= 0) return -120; // floor
  return 20 * Math.log10(m);
}

export function normalizeMediciones(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const pts = raw
    .map((r) => {
      const freqHz = parseFrecuencia(r.frecuencia ?? r.freq ?? r.f);
      if (!isFinite(freqHz)) return null;
      let db = null;
      if (r.magDb != null && r.magDb !== "" && isFinite(Number(r.magDb))) {
        db = Number(r.magDb);
      } else if (r.magnitud != null && r.magnitud !== "" && isFinite(Number(r.magnitud))) {
        db = magToDb(Number(r.magnitud));
      } else if (r.mag != null && isFinite(Number(r.mag))) {
        db = magToDb(Number(r.mag));
      } else {
        db = null;
      }
      const fase = r.fase != null ? Number(r.fase) : r.phase != null ? Number(r.phase) : null;
      if (db == null && fase == null) return null;
      return { freqHz, db, fase, raw: r };
    })
    .filter(Boolean)
    .sort((a, b) => a.freqHz - b.freqHz);
  return pts;
}

export function unwrapPhase(pts) {
  // Opcional: desenrolla saltos >180°
  if (pts.length < 2) return pts;
  const out = [{ ...pts[0] }];
  let offset = 0;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1].fase;
    const cur = pts[i].fase;
    if (prev == null || cur == null) {
      out.push({ ...pts[i] });
      continue;
    }
    let diff = cur - prev;
    if (diff > 180) offset -= 360;
    else if (diff < -180) offset += 360;
    out.push({ ...pts[i], fase: cur + offset });
  }
  return out;
}
