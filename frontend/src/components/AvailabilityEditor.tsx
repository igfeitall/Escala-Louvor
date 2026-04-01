import type { Member } from '../types';
import { formatIsoDate } from '../utils/calendar';

interface AvailabilityEditorProps {
  members: Member[];
  serviceDates: string[];
  overrides: Record<string, string[]>;
  onToggle: (memberId: string, date: string) => void;
}

export function AvailabilityEditor({
  members,
  serviceDates,
  overrides,
  onToggle,
}: AvailabilityEditorProps) {
  return (
    <section className="space-y-5 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-ink">Indisponibilidade do mês</h2>
        <p className="text-sm text-stone-600">
          Marque os dias em que cada pessoa não pode servir. O estado vale só para a sessão atual.
        </p>
      </div>

      {members.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-stone-300 px-6 py-8 text-center text-stone-500">
          Cadastre membros para editar a disponibilidade.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-stone-200">
          <table className="min-w-full border-collapse bg-white">
            <thead>
              <tr className="bg-stone-100 text-left text-sm text-stone-700">
                <th className="px-4 py-3">Membro</th>
                {serviceDates.map((date) => (
                  <th key={date} className="px-2 py-3 text-center">
                    {formatIsoDate(date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const unavailableDates = new Set(overrides[member.id] ?? []);

                return (
                  <tr key={member.id} className="border-t border-stone-200">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-stone-800">
                      {member.name}
                    </td>
                    {serviceDates.map((date) => {
                      const active = unavailableDates.has(date);

                      return (
                        <td key={`${member.id}-${date}`} className="px-2 py-3 text-center">
                          <button
                            className={`h-9 w-9 rounded-full border text-sm font-semibold transition ${
                              active
                                ? 'border-rose-200 bg-rose-100 text-rose-700'
                                : 'border-stone-200 bg-stone-50 text-stone-500'
                            }`}
                            onClick={() => onToggle(member.id, date)}
                            type="button"
                          >
                            {active ? 'X' : '·'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
