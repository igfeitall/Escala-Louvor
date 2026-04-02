import type { Member, Role } from '../types';

const ROLE_LABELS: Record<Role, string> = {
  MINISTRO: 'Ministro',
  APOIO: 'Apoio',
  VIOLAO: 'Violão',
  GUITARRA: 'Guitarra',
  TECLADO: 'Teclado',
  BAIXO: 'Baixo',
  BATERIA: 'Bateria',
};

interface MemberManagerProps {
  members: Member[];
  onCreate: () => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

export function MemberManager({ members, onCreate, onEdit, onDelete }: MemberManagerProps) {
  return (
    <section className="space-y-5 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-ink">Membros cadastrados</h2>
          <p className="text-sm text-stone-600">Cadastre e ordene as funções por prioridade para alimentar o agendador.</p>
        </div>
        <button className="rounded-full bg-accent px-5 py-3 font-semibold text-white transition hover:opacity-90" onClick={onCreate}>
          Novo membro
        </button>
      </div>

      <div className="grid gap-4">
        {members.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-stone-300 px-6 py-8 text-center text-stone-500">
            Nenhum membro cadastrado ainda.
          </p>
        ) : (
          members.map((member) => (
            <article key={member.id} className="rounded-3xl border border-stone-200 bg-stone-50/80 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-stone-800">{member.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {member.roles.map((role, index) => (
                      <span key={`${member.id}-${role}`} className="rounded-full bg-white px-3 py-1 text-sm text-stone-700">
                        {index + 1}. {ROLE_LABELS[role]}
                      </span>
                    ))}
                  </div>
                  {member.notes ? <p className="text-sm text-stone-500">{member.notes}</p> : null}
                </div>
                <div className="flex gap-2">
                  <button className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700" onClick={() => onEdit(member)}>
                    Editar
                  </button>
                  <button className="rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700" onClick={() => onDelete(member)}>
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
