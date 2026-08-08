export function formatSetLine(s: { weight: number; reps: number; rir?: number | null }): string {
  return `${s.weight}kg × ${s.reps}${s.rir != null ? ` · RIR ${s.rir}` : ''}`;
}
