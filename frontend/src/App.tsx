import { useEffect, useMemo, useRef, useState } from 'react';
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
  fetchAvailability,
  fetchMembers,
  generateSchedule,
  parseSpreadsheet,
  saveAvailability,
  updateMember,
} from './services/api';
import type { Member, ParseResult, Role, ScheduleEntry } from './types';
import {
  mapOverridesToPayload,
  mapOverridesToRecord,
  mergeOverridesFromParseResult,
} from './utils/availability';
import { getMonthLabel, getMonthOptionLabel, getServiceSlots } from './utils/calendar';
import { createScheduleWhatsAppMessage, exportSchedulePdf } from './utils/scheduleExport';

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
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const editFormRef = useRef<HTMLDivElement | null>(null);

  const monthLabel = getMonthLabel(month, year);
  const serviceSlots = useMemo(() => getServiceSlots(month, year), [month, year]);

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

  async function persistOverrides(nextOverrides: Record<string, string[]>) {
    setIsSavingAvailability(true);

    try {
      await saveAvailability(month, year, mapOverridesToPayload(nextOverrides));
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : 'Erro ao salvar disponibilidade do mes.',
      );
      throw saveError;
    } finally {
      setIsSavingAvailability(false);
    }
  }

  useEffect(() => {
    void loadMembers();
  }, []);

  useEffect(() => {
    let isActive = true;

    setSchedule([]);
    setParseResult(null);
    setOverrides({});
    setIsLoadingAvailability(true);

    void (async () => {
      try {
        const availability = await fetchAvailability(month, year);

        if (!isActive) {
          return;
        }

        setOverrides(mapOverridesToRecord(availability.overrides));
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        toast.error(
          loadError instanceof Error
            ? loadError.message
            : 'Erro ao carregar disponibilidade do mes.',
        );
      } finally {
        if (isActive) {
          setIsLoadingAvailability(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [month, year]);

  useEffect(() => {
    if (!showForm || !editingMember || !editFormRef.current) {
      return;
    }

    editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [editingMember, showForm]);

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

    const nextOverrides = { ...overrides };
    delete nextOverrides[member.id];

    try {
      await deleteMember(member.id);
      setOverrides(nextOverrides);
      await persistOverrides(nextOverrides);
      toast.success('Membro removido.');
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
      const nextOverrides = mergeOverridesFromParseResult(overrides, result);

      setParseResult(result);
      setOverrides(nextOverrides);
      await persistOverrides(nextOverrides);
      toast.success('Importacao processada com sucesso.');
    } catch (parseError) {
      toast.error(parseError instanceof Error ? parseError.message : 'Erro ao processar importacao.');
    } finally {
      setIsParsing(false);
    }
  }

  function toggleAvailability(memberId: string, serviceKey: string) {
    const serviceKeys = new Set(overrides[memberId] ?? []);

    if (serviceKeys.has(serviceKey)) {
      serviceKeys.delete(serviceKey);
    } else {
      serviceKeys.add(serviceKey);
    }

    const nextOverrides = {
      ...overrides,
      [memberId]: [...serviceKeys].sort(),
    };

    setOverrides(nextOverrides);
    void persistOverrides(nextOverrides);
  }

  async function handleGenerateSchedule() {
    setIsGenerating(true);

    try {
      const validMemberIds = new Set(members.map((member) => member.id));
      const payload = mapOverridesToPayload(overrides).filter((override) =>
        validMemberIds.has(override.memberId),
      );
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

  function handleExportPdf() {
    try {
      exportSchedulePdf(schedule, month, year);
      toast.success('PDF exportado com sucesso.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar PDF.');
    }
  }

  function handleShareWhatsApp() {
    try {
      const message = createScheduleWhatsAppMessage(schedule, month, year);
      const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao preparar mensagem do WhatsApp.');
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f6f1e8_0%,_#efe3d4_100%)] text-ink">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar pauseOnFocusLoss={false} />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <Header
          title={`Escala de Louvor - ${monthLabel}`}
          subtitle="Gerencie membros, importe indisponibilidades do mes e gere uma escala equilibrada por culto."
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
              disabled={isGenerating || isLoadingMembers || isLoadingAvailability}
              onClick={() => void handleGenerateSchedule()}
            >
              {isGenerating ? 'Gerando...' : 'Gerar escala'}
            </button>
          </div>
        </section>

        {isLoadingAvailability ? (
          <p className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-600">
            Carregando disponibilidade salva para este mes...
          </p>
        ) : null}

        {isSavingAvailability ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Salvando disponibilidade do mes...
          </p>
        ) : null}

        {showForm ? (
          <div ref={editFormRef}>
            <MemberForm
              initialValue={editingMember}
              onCancel={() => {
                setShowForm(false);
                setEditingMember(null);
              }}
              onSubmit={handleSaveMember}
            />
          </div>
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
          serviceSlots={serviceSlots}
          overrides={overrides}
          onToggle={toggleAvailability}
        />

        {schedule.length > 0 ? (
          <ScheduleTable
            schedule={schedule}
            onExportCsv={handleExportCsv}
            onExportPdf={handleExportPdf}
            onShareWhatsApp={handleShareWhatsApp}
          />
        ) : null}
      </div>
    </div>
  );
}
