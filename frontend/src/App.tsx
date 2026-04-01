import { useEffect, useMemo, useState } from 'react';

import { AvailabilityEditor } from './components/AvailabilityEditor';
import { FileUpload } from './components/FileUpload';
import { Header } from './components/Header';
import { MemberForm } from './components/MemberForm';
import { MemberManager } from './components/MemberManager';
import { ScheduleTable } from './components/ScheduleTable';
import {
  createMember,
  deleteMember,
  exportScheduleCsv,
  fetchMembers,
  generateSchedule,
  parseSpreadsheet,
  updateMember,
} from './services/api';
import type { Member, ParseResult, Role, ScheduleEntry } from './types';
import { mergeOverridesFromParseResult } from './utils/availability';
import { getMonthLabel, getServiceDates } from './utils/calendar';

function downloadCsv(csv: string, month: number, year: number) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `escala-louvor-${year}-${String(month).padStart(2, '0')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [members, setMembers] = useState<Member[]>([]);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string[]>>({});
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const monthLabel = getMonthLabel(month, year);
  const serviceDates = useMemo(() => getServiceDates(month, year), [month, year]);

  async function loadMembers() {
    setIsLoadingMembers(true);

    try {
      const nextMembers = await fetchMembers();
      setMembers(nextMembers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar membros.');
    } finally {
      setIsLoadingMembers(false);
    }
  }

  useEffect(() => {
    void loadMembers();
  }, []);

  useEffect(() => {
    setSchedule([]);
    setParseResult(null);
    setOverrides({});
  }, [month, year]);

  async function handleSaveMember(input: { name: string; roles: Role[]; notes?: string }) {
    setError(null);
    setFeedback(null);

    try {
      if (editingMember) {
        await updateMember(editingMember.id, input);
        setFeedback('Membro atualizado com sucesso.');
      } else {
        await createMember(input);
        setFeedback('Membro criado com sucesso.');
      }

      setEditingMember(null);
      setShowForm(false);
      await loadMembers();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Erro ao salvar membro.');
      throw saveError;
    }
  }

  async function handleDeleteMember(member: Member) {
    if (!window.confirm(`Excluir ${member.name}?`)) {
      return;
    }

    setError(null);
    setFeedback(null);

    try {
      await deleteMember(member.id);
      setFeedback('Membro removido.');
      setOverrides((current) => {
        const next = { ...current };
        delete next[member.id];
        return next;
      });
      await loadMembers();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Erro ao excluir membro.');
    }
  }

  async function handleParse() {
    if (!file && !csvText.trim()) {
      return;
    }

    setIsParsing(true);
    setError(null);
    setFeedback(null);

    try {
      const payload =
        file ??
        new File([csvText], `escala-${year}-${String(month).padStart(2, '0')}.csv`, {
          type: 'text/csv;charset=utf-8',
        });
      const result = await parseSpreadsheet(payload, month, year);
      setParseResult(result);
      setOverrides((current) => mergeOverridesFromParseResult(current, result));
      setFeedback('Importação processada com sucesso.');
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : 'Erro ao processar importação.');
    } finally {
      setIsParsing(false);
    }
  }

  function toggleAvailability(memberId: string, date: string) {
    setOverrides((current) => {
      const dates = new Set(current[memberId] ?? []);

      if (dates.has(date)) {
        dates.delete(date);
      } else {
        dates.add(date);
      }

      return {
        ...current,
        [memberId]: [...dates].sort(),
      };
    });
  }

  async function handleGenerateSchedule() {
    setIsGenerating(true);
    setError(null);
    setFeedback(null);

    try {
      const payload = Object.entries(overrides).map(([memberId, unavailableDates]) => ({
        memberId,
        unavailableDates,
      }));
      const result = await generateSchedule(month, year, payload);
      setSchedule(result.schedule);
      setFeedback('Escala gerada com sucesso.');
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Erro ao gerar escala.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleExportCsv() {
    try {
      const csv = await exportScheduleCsv(schedule);
      downloadCsv(csv, month, year);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Erro ao exportar CSV.');
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f6f1e8_0%,_#efe3d4_100%)] text-ink">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <Header
          title={`Escala de Louvor • ${monthLabel}`}
          subtitle="Gerencie membros, importe indisponibilidades do mês e gere uma escala equilibrada para domingos e quartas-feiras."
        />

        <section className="grid gap-4 rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-panel md:grid-cols-[1fr_1fr_auto] print:hidden">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-700">Mês</span>
            <select className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  {new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(year, value - 1, 1))}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-700">Ano</span>
            <input className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3" type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} />
          </label>
          <div className="flex items-end">
            <button className="w-full rounded-full bg-forest px-5 py-3 font-semibold text-white transition hover:opacity-90" disabled={isGenerating || isLoadingMembers} onClick={() => void handleGenerateSchedule()}>
              {isGenerating ? 'Gerando...' : 'Gerar escala'}
            </button>
          </div>
        </section>

        {feedback ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 print:hidden">{feedback}</p> : null}
        {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 print:hidden">{error}</p> : null}

        {showForm ? (
          <MemberForm
            initialValue={editingMember}
            onCancel={() => {
              setShowForm(false);
              setEditingMember(null);
            }}
            onSubmit={handleSaveMember}
          />
        ) : null}

        <MemberManager
          members={members}
          onCreate={() => {
            setEditingMember(null);
            setShowForm(true);
          }}
          onEdit={(member) => {
            setEditingMember(member);
            setShowForm(true);
          }}
          onDelete={handleDeleteMember}
        />

        <FileUpload
          file={file}
          csvText={csvText}
          parseResult={parseResult}
          isParsing={isParsing}
          onFileChange={setFile}
          onCsvTextChange={setCsvText}
          onParse={handleParse}
        />

        <AvailabilityEditor members={members} serviceDates={serviceDates} overrides={overrides} onToggle={toggleAvailability} />

        {schedule.length > 0 ? <ScheduleTable schedule={schedule} onExport={handleExportCsv} /> : null}
      </div>
    </div>
  );
}
