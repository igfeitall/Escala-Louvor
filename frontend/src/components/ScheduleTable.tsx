import type { ScheduleEntry } from '../types';
import { formatIsoDate } from '../utils/calendar';

interface ScheduleTableProps {
  schedule: ScheduleEntry[];
  onExport: () => Promise<void>;
}

export function ScheduleTable({ schedule, onExport }: ScheduleTableProps) {
  return (
    <section className="space-y-5 rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel print:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="font-display text-2xl text-ink">Escala gerada</h2>
          <p className="text-sm text-stone-600">Imprima a tabela ou exporte em CSV com a mesma ordenação oficial.</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-full border border-stone-300 px-5 py-3 font-semibold text-stone-700" onClick={() => window.print()}>
            Imprimir
          </button>
          <button className="rounded-full bg-accent px-5 py-3 font-semibold text-white" onClick={() => void onExport()}>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-stone-100 text-left text-stone-700">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Culto</th>
              <th className="px-4 py-3">Ministro</th>
              <th className="px-4 py-3">Apoio</th>
              <th className="px-4 py-3">Violão</th>
              <th className="px-4 py-3">Guitarra</th>
              <th className="px-4 py-3">Teclado</th>
              <th className="px-4 py-3">Baixo</th>
              <th className="px-4 py-3">Bateria</th>
              <th className="px-4 py-3">Observações</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((entry) => (
              <tr key={`${entry.date}-${entry.serviceType}`} className="border-t border-stone-200 align-top">
                <td className="px-4 py-3">{formatIsoDate(entry.date)}</td>
                <td className="px-4 py-3">{entry.serviceLabel}</td>
                <td className="px-4 py-3">{entry.minister ?? '—'}</td>
                <td className="px-4 py-3">{entry.apoio ?? '—'}</td>
                <td className="px-4 py-3">{entry.violao ?? '—'}</td>
                <td className="px-4 py-3">{entry.guitarra ?? '—'}</td>
                <td className="px-4 py-3">{entry.teclado ?? '—'}</td>
                <td className="px-4 py-3">{entry.baixo ?? '—'}</td>
                <td className="px-4 py-3">{entry.bateria ?? '—'}</td>
                <td className="px-4 py-3">{entry.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
