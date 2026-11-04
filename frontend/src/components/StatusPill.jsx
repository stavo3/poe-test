// Colour-coded booking/gig status label.
const OK = ['confirmed', 'completed', 'active'];
const BAD = ['cancelled', 'canceled', 'rejected', 'failed'];

export default function StatusPill({ status }) {
  const s = String(status || '');
  const tone = OK.includes(s) ? 'is-ok' : BAD.includes(s) ? 'is-bad' : 'is-pending';
  return <span className={`status-pill ${tone}`}>{s}</span>;
}
