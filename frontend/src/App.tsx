import { useEffect, useMemo, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
import { getMonthLabel, getMonthOptionLabel, getServiceDates } from './utils/calendar';

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

  const monthLabel = getMonthLabel(month, year);
  const serviceDates = useMemo(() => getServiceDates(month, year), [month, year]);

  async function loadMembers() {
    setIsLoadingMembers(true);

    try {
      const nextMembers = await fetchMembers();
      setMembers(nextMembers);
    } catch (loadError) {
      toast.error(loadError instanceof Error ? loadError.message : 'Erro ao carregar membros.');
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
    try {
      if (editingMember) {
        await updateMember(editingMember.id, input);
        toast.success('Membro atualizado com sucesso.');
      } else {
        await createMember(input);
        toast.success('Membro criado com sucesso.');
      }

      setEditingMember(null);
      setShowForm(false);
      await loadMembers();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : 'Erro ao salvar membro.');
      throw saveError;
    }
  }

  async function handleDeleteMember(member: Member) {
    if (!window.confirm(`Excluir ${member.name}?`)) {
      return;
    }

    try {
      await deleteMember(member.id);
      toast.success('Membro removido.');
      setOverrides((current) => {
        const next = { ...current };
        delete next[member.id];
        return next;
      });
      await loadMembers();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Erro ao excluir membro.');
    }
  }

  async function handleParse() {
    if (!file && !csvText.trim()) {
      return;
    }

    setIsParsing(true);

    try {
      const payload =
        file ??
        new File([csvText], `escala-${year}-${String(month).padStart(2, '0')}.csv`, {
          type: 'text/csv;charset=utf-8',
        });
      const result = await parseSpreadsheet(payload, month, year);
      setParseResult(result);
      setOverrides((current) => mergeOverridesFromParseResult(current, result));
      toast.success('Importacao processada com sucesso.');
    } catch (parseError) {
      toast.error(parseError instanceof Error ? parseError.message : 'Erro ao processar importacao.');
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

    try {
      const payload = Object.entries(overrides).map(([memberId, unavailableDates]) => ({
        memberId,
        unavailableDates,
      }));
      const result = await generateSchedule(month, year, payload);
      setSchedule(result.schedule);
      toast.success('Escala gerada com sucesso.');
    } catch (generateError) {
      toast.error(generateError instanceof Error ? generateError.message : 'Erro ao gerar escala.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleExportCsv() {
    try {
      const csv = await exportScheduleCsv(schedule);
      downloadCsv(csv, month, year);
      toast.success('CSV exportado com sucesso.');
    } catch (exportError) {
      toast.error(exportError instanceof Error ? exportError.message : 'Erro ao exportar CSV.');
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f6f1e8_0%,_#efe3d4_100%)] text-ink">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar pauseOnFocusLoss={false} />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <Header
          title={`Escala de Louvor • ${monthLabel}`}
          subtitle="Gerencie membros, importe indisponibilidades do mes e gere uma escala equilibrada para domingos e quartas-feiras."
        />

        <section className="grid gap-4 rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-panel md:grid-cols-[1fr_1fr_auto] print:hidden">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-700">Mes</span>
            <select
              className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3"
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  {getMonthOptionLabel(value, year)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-stone-700">Ano</span>
            <input
              className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3"
              type="number"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            />
          </label>
          <div className="flex items-end">
            <button
              className="w-full rounded-full bg-forest px-5 py-3 font-semibold text-white transition hover:opacity-90"
              disabled={isGenerating || isLoadingMembers}
              onClick={() => void handleGenerateSchedule()}
            >
              {isGenerating ? 'Gerando...' : 'Gerar escala'}
            </button>
          </div>
        </section>

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

        <AvailabilityEditor
          members={members}
          serviceDates={serviceDates}
          overrides={overrides}
          onToggle={toggleAvailability}
        />

        {schedule.length > 0 ? (
          <ScheduleTable schedule={schedule} onExport={handleExportCsv} />
        ) : null}
      </div>
    </div>
  );
}
