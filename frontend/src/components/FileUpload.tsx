import type { ChangeEvent } from 'react';

import type { ParseResult } from '../types';

interface FileUploadProps {
  file: File | null;
  csvText: string;
  parseResult: ParseResult | null;
  isParsing: boolean;
  onFileChange: (file: File | null) => void;
  onCsvTextChange: (value: string) => void;
  onParse: () => Promise<void>;
}

export function FileUpload({
  file,
  csvText,
  parseResult,
  isParsing,
  onFileChange,
  onCsvTextChange,
  onParse,
}: FileUploadProps) {
  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    onFileChange(event.target.files?.[0] ?? null);
  }

  return (
    <section className="space-y-5 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-ink">Importação mensal</h2>
        <p className="text-sm text-stone-600">
          Envie um arquivo `.xlsx` ou `.csv`, ou cole o CSV manualmente. Nomes não cadastrados aparecem como aviso.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-accentSoft bg-[linear-gradient(135deg,_rgba(216,184,159,0.18),_rgba(255,255,255,0.9))] p-6 text-center">
          <input className="hidden" type="file" accept=".xlsx,.csv" onChange={handleFileInput} />
          <span className="font-semibold text-ink">{file ? file.name : 'Selecionar arquivo'}</span>
          <span className="mt-2 text-sm text-stone-600">Clique para escolher a planilha do mês.</span>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-stone-700">CSV colado manualmente</span>
          <textarea
            className="min-h-52 w-full rounded-[1.75rem] border border-stone-300 bg-stone-50 px-4 py-4 font-mono text-sm outline-none transition focus:border-accent"
            value={csvText}
            onChange={(event) => onCsvTextChange(event.target.value)}
            placeholder={'Nome,Funcoes,Indisponivel\nJoão Silva,"Teclado, Apoio","05/04, 12/04"'}
          />
        </label>
      </div>

      <button
        className="rounded-full bg-forest px-5 py-3 font-semibold text-white transition hover:opacity-90"
        disabled={isParsing || (!file && !csvText.trim())}
        onClick={() => void onParse()}
      >
        {isParsing ? 'Processando...' : 'Ler importação'}
      </button>

      {parseResult ? (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
          <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
            <h3 className="font-semibold text-stone-800">Prévia</h3>
            <ul className="mt-3 space-y-3 text-sm text-stone-600">
              {parseResult.parsedRows.length === 0 ? (
                <li>Nenhuma linha válida encontrada.</li>
              ) : (
                parseResult.parsedRows.slice(0, 5).map((row) => (
                  <li key={`${row.row}-${row.name}`} className="rounded-2xl bg-white px-3 py-2">
                    <strong className="text-stone-800">{row.name}</strong> • {row.roles.join(', ')} •{' '}
                    {row.unavailableDates.length > 0 ? row.unavailableDates.join(', ') : 'sem bloqueios'}
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="font-semibold text-amber-900">Não cadastrados</h3>
            <ul className="mt-3 space-y-2 text-sm text-amber-900">
              {parseResult.unmatchedMembers.length === 0 ? (
                <li>Nenhum nome pendente.</li>
              ) : (
                parseResult.unmatchedMembers.map((name) => <li key={name}>{name}</li>)
              )}
            </ul>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
            <h3 className="font-semibold text-rose-900">Erros por linha</h3>
            <ul className="mt-3 space-y-2 text-sm text-rose-900">
              {parseResult.rowErrors.length === 0 ? (
                <li>Nenhum erro.</li>
              ) : (
                parseResult.rowErrors.map((error) => (
                  <li key={`${error.row}-${error.message}`}>
                    Linha {error.row}: {error.message}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
