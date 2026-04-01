import { useEffect, useState } from 'react';

import { ROLE_OPTIONS, type Member, type Role } from '../types';

interface MemberFormProps {
  initialValue?: Member | null;
  onCancel: () => void;
  onSubmit: (input: { name: string; roles: Role[]; notes?: string }) => Promise<void>;
}

const ROLE_LABELS: Record<Role, string> = {
  MINISTRO: 'Ministro',
  APOIO: 'Apoio',
  VIOLAO: 'Violão',
  GUITARRA: 'Guitarra',
  TECLADO: 'Teclado',
  BAIXO: 'Baixo',
  BATERIA: 'Bateria',
};

export function MemberForm({ initialValue, onCancel, onSubmit }: MemberFormProps) {
  const [name, setName] = useState(initialValue?.name ?? '');
  const [roles, setRoles] = useState<Role[]>(initialValue?.roles ?? []);
  const [notes, setNotes] = useState(initialValue?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(initialValue?.name ?? '');
    setRoles(initialValue?.roles ?? []);
    setNotes(initialValue?.notes ?? '');
  }, [initialValue]);

  function addRole(role: Role) {
    setRoles((current) => (current.includes(role) ? current : [...current, role]));
  }

  function moveRole(index: number, direction: -1 | 1) {
    setRoles((current) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  }

  function removeRole(role: Role) {
    setRoles((current) => current.filter((value) => value !== role));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      await onSubmit({
        name,
        roles,
        notes: notes.trim() || undefined,
      });
      setName('');
      setRoles([]);
      setNotes('');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-5 rounded-3xl border border-stone-200 bg-white/90 p-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-stone-700">Nome</span>
          <input
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-accent"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: João Silva"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-stone-700">Observações</span>
          <input
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-accent"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Opcional"
          />
        </label>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-stone-700">Funções disponíveis</p>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((role) => (
            <button
              key={role}
              type="button"
              className="rounded-full border border-stone-300 px-3 py-2 text-sm transition hover:border-accent hover:text-accent"
              onClick={() => addRole(role)}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-stone-700">Ordem de prioridade</p>
        {roles.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-500">
            Adicione ao menos uma função.
          </p>
        ) : (
          <div className="space-y-2">
            {roles.map((role, index) => (
              <div
                key={role}
                className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              >
                <span className="font-medium text-stone-700">
                  {index + 1}. {ROLE_LABELS[role]}
                </span>
                <div className="flex gap-2 text-sm">
                  <button type="button" className="rounded-full bg-stone-200 px-3 py-1" onClick={() => moveRole(index, -1)}>
                    Subir
                  </button>
                  <button type="button" className="rounded-full bg-stone-200 px-3 py-1" onClick={() => moveRole(index, 1)}>
                    Descer
                  </button>
                  <button type="button" className="rounded-full bg-rose-100 px-3 py-1 text-rose-700" onClick={() => removeRole(role)}>
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-full bg-forest px-5 py-3 font-semibold text-white transition hover:opacity-90" disabled={isSaving} type="submit">
          {initialValue ? 'Salvar membro' : 'Adicionar membro'}
        </button>
        <button className="rounded-full border border-stone-300 px-5 py-3 font-semibold text-stone-700" disabled={isSaving} type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
