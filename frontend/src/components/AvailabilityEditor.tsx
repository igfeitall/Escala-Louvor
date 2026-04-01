import type { Member, ServiceSlot } from '../types';
import { formatIsoDate, formatServiceColumnLabel } from '../utils/calendar';

interface AvailabilityEditorProps {
  members: Member[];
  serviceSlots: ServiceSlot[];
  overrides: Record<string, string[]>;
  onToggle: (memberId: string, serviceKey: string) => void;
}

export function AvailabilityEditor({
  members,
  serviceSlots,
  overrides,
  onToggle,
}: AvailabilityEditorProps) {
  return (
    <section className="space-y-5 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-ink">Indisponibilidade do mes</h2>
        <p className="text-sm text-stone-600">
          Marque por culto. A mesma pessoa pode ficar indisponivel so de manha ou so a noite.
          Essas alteracoes ficam salvas por mes.
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
                {serviceSlots.map((service) => (
                  <th key={service.serviceKey} className="min-w-24 px-2 py-3 text-center">
                    <div className="font-semibold text-stone-700">{formatIsoDate(service.date)}</div>
                    <div className="text-xs text-stone-500">
                      {formatServiceColumnLabel(service)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const unavailableServices = new Set(overrides[member.id] ?? []);

                return (
                  <tr key={member.id} className="border-t border-stone-200">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-stone-800">
                      {member.name}
                    </td>
                    {serviceSlots.map((service) => {
                      const active = unavailableServices.has(service.serviceKey);

                      return (
                        <td key={`${member.id}-${service.serviceKey}`} className="px-2 py-3 text-center">
                          <button
                            className={`h-9 w-9 rounded-full border text-sm font-semibold transition ${
                              active
                                ? 'border-rose-200 bg-rose-100 text-rose-700'
                                : 'border-stone-200 bg-stone-50 text-stone-500'
                            }`}
                            onClick={() => onToggle(member.id, service.serviceKey)}
                            type="button"
                          >
                            {active ? 'X' : '.'}
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
