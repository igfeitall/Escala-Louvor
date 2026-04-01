interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="overflow-hidden rounded-[2rem] border border-white/50 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(246,241,232,0.85)_40%,_rgba(216,184,159,0.35)_100%)] p-8 shadow-panel">
      <div className="max-w-3xl">
        <p className="font-body text-sm uppercase tracking-[0.35em] text-accent">Escala de louvor</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">{subtitle}</p>
      </div>
    </header>
  );
}
