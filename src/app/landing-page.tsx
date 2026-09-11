import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  Gauge,
  MessageSquare,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';

const features = [
  {
    icon: ClipboardList,
    title: 'Zakázky pod kontrolou',
    text: 'Od přijetí auta až po dokončení máte vždy jasno, co se na autě děje.',
  },
  {
    icon: CalendarDays,
    title: 'Přehled dne',
    text: 'Vidíte, co je dnes naplánované, co se právě řeší a co už je hotové.',
  },
  {
    icon: Users,
    title: 'Zákazníci a vozidla',
    text: 'Kontakty, auta, SPZ a kompletní historie oprav na jednom místě.',
  },
  {
    icon: FileText,
    title: 'Fakturace bez přepisování',
    text: 'Z dokončené zakázky vytvoříte fakturu bez zbytečného přepisování údajů.',
  },
  {
    icon: MessageSquare,
    title: 'Komunikace se zákazníkem',
    text: 'Mějte důležité informace a úkoly spojené přímo se zakázkou.',
  },
  {
    icon: Gauge,
    title: 'Přehled pro majitele',
    text: 'Sledujte provoz servisu, zakázky, práci mechaniků a výsledky na jednom místě.',
  },
];

const faqs = [
  ['Pro koho je Garazio?', 'Pro malé a střední autoservisy, které chtějí mít zakázky, zákazníky, vozidla a každodenní provoz přehledně na jednom místě.'],
  ['Kolik Garazio stojí?', 'Garazio stojí 299 Kč měsíčně. Jednoduchá cena bez zbytečně složitých tarifů.'],
  ['Musím něco instalovat?', 'Ne. Garazio je webová aplikace, takže ji používáte přímo v prohlížeči na počítači, tabletu nebo telefonu.'],
  ['Mohu mít v systému více mechaniků?', 'Ano. Garazio počítá s týmem servisu a umožňuje pracovat s jednotlivými uživateli a jejich oprávněními.'],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-text-primary">
      <nav className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/garazio-logo.svg" alt="Garazio" width={36} height={36} className="h-9 w-9 rounded-lg" priority />
          <span className="font-heading text-lg font-extrabold tracking-tight">Garazio</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm font-semibold text-text-secondary md:flex">
          <a href="#funkce" className="transition hover:text-text-primary">Funkce</a>
          <a href="#jak-to-funguje" className="transition hover:text-text-primary">Jak to funguje</a>
          <a href="#cena" className="transition hover:text-text-primary">Cena</a>
          <a href="#faq" className="transition hover:text-text-primary">FAQ</a>
        </div>
        <div className="relative z-20 flex items-center gap-2">
          <Link href="/login" className="rounded-lg px-2 py-2 text-xs font-semibold text-text-secondary transition hover:text-text-primary sm:px-3 sm:text-sm">Přihlásit se</Link>
          <Link href="/signup" className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 sm:px-4 sm:py-2.5 sm:text-sm">Vyzkoušet zdarma</Link>
        </div>
      </nav>

      <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-12 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-32 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid items-center gap-14 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Pro malé a střední autoservisy
            </div>
            <h1 className="max-w-2xl font-heading text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Mějte svůj autoservis <span className="text-primary">konečně pod kontrolou.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-text-secondary sm:text-lg">
              Zakázky, zákazníci, vozidla, mechanici, úkoly i fakturace. Všechno, co potřebujete pro každodenní provoz servisu, přehledně na jednom místě.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition hover:brightness-110">
                Vyzkoušet Garazio zdarma <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#jak-to-funguje" className="rounded-lg border border-border bg-surface px-5 py-3.5 text-sm font-semibold text-text-primary transition hover:bg-surface-hover">
                Jak to funguje?
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-text-muted">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Bez instalace</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Funguje v prohlížeči</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> 299 Kč / měsíc</span>
            </div>
          </div>

          <div className="relative rounded-2xl border border-border bg-surface p-2.5 shadow-2xl shadow-black/30">
            <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-xs font-medium text-text-muted">Přehled servisu</p>
                  <h2 className="mt-0.5 font-heading text-xl font-bold">Dnes</h2>
                </div>
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">4 zakázky</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border bg-surface p-3"><p className="text-[10px] uppercase tracking-wide text-text-muted">Dnes</p><p className="mt-1 text-xl font-extrabold">4</p><p className="text-[10px] text-text-muted">zakázky</p></div>
                <div className="rounded-lg border border-border bg-surface p-3"><p className="text-[10px] uppercase tracking-wide text-text-muted">Práce</p><p className="mt-1 text-xl font-extrabold">2</p><p className="text-[10px] text-text-muted">probíhají</p></div>
                <div className="rounded-lg border border-border bg-surface p-3"><p className="text-[10px] uppercase tracking-wide text-text-muted">Hotovo</p><p className="mt-1 text-xl font-extrabold">1</p><p className="text-[10px] text-text-muted">dnes</p></div>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  ['08:00', 'Škoda Octavia', 'Výměna oleje', 'PRACUJE SE'],
                  ['10:30', 'VW Passat', 'Brzdy + kontrola', 'ČEKÁ'],
                  ['13:00', 'BMW 320d', 'Servisní prohlídka', 'HOTOVO'],
                ].map(([time, car, job, status]) => (
                  <div key={time} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
                    <span className="w-10 font-mono text-xs text-text-muted">{time}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{car}</p><p className="truncate text-xs text-text-muted">{job}</p></div>
                    <span className="hidden rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary sm:block">{status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /><span className="text-xs font-semibold">Mechanik právě pracuje</span></div>
                <span className="text-xs font-bold text-primary">Octavia</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1fr_1.5fr] lg:items-center lg:px-8">
          <div><p className="text-sm font-bold uppercase tracking-widest text-primary">Poznáte to?</p><h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">Papíry, Excel, telefonáty a hledání informací.</h2></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {['Kde je auto zákazníka?', 'Co má dnes dělat mechanik?', 'Co se na autě dělalo minule?'].map((text) => <div key={text} className="rounded-xl border border-border bg-surface p-4 text-sm font-semibold text-text-secondary">{text}</div>)}
          </div>
        </div>
      </section>

      <section id="funkce" className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-widest text-primary">Všechno na jednom místě</p><h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Méně administrativy. Více přehledu.</h2><p className="mt-4 leading-7 text-text-secondary">Garazio je postavené kolem toho, jak servis skutečně funguje. Ne kolem desítek funkcí, které nikdy nepoužijete.</p></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-primary/30"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><h3 className="mt-4 font-heading font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-text-secondary">{text}</p></div>)}
        </div>
      </section>

      <section id="jak-to-funguje" className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="text-center"><p className="text-sm font-bold uppercase tracking-widest text-primary">Jak to funguje</p><h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Od příjezdu auta po hotovou zakázku.</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-text-secondary">Jednoduchý postup, který zvládne celý tým bez složitého zaškolování.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              ['01', 'Přijmete auto', 'Vyberete zákazníka, vozidlo, popíšete problém a naplánujete termín.'],
              ['02', 'Servis pracuje', 'Mechanik vidí svou práci, může začít pracovat na zakázce a průběžně ji aktualizovat.'],
              ['03', 'Zakázka končí', 'Vidíte výsledek práce, historii vozidla a můžete vystavit fakturu přímo ze zakázky.'],
            ].map(([number, title, text]) => <div key={number} className="relative rounded-2xl border border-border bg-surface p-6"><span className="font-mono text-xs font-bold text-primary">{number}</span><h3 className="mt-5 font-heading text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-text-secondary">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section id="cena" className="mx-auto max-w-5xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">Jednoduchá cena</p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Celé Garazio za 299 Kč měsíčně.</h2>
            <p className="mt-4 max-w-xl leading-7 text-text-secondary">Žádné složité balíčky. Jedna aplikace pro každodenní provoz vašeho autoservisu.</p>
            <div className="mt-6 space-y-3 text-sm font-semibold">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Zakázky, zákazníci a vozidla</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Přehled práce mechaniků</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Historie vozidel</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Fakturace a přehled servisu</div>
            </div>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-7 text-center shadow-xl shadow-primary/10">
            <p className="text-sm font-semibold text-text-secondary">Garazio</p>
            <div className="mt-2 flex items-end justify-center gap-1"><span className="font-heading text-5xl font-extrabold">299</span><span className="pb-1 text-sm font-semibold text-text-secondary">Kč / měsíc</span></div>
            <p className="mt-3 text-xs text-text-muted">Jednoduchá cena. Bez zbytečných tarifů.</p>
            <Link href="/signup" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:brightness-110">Vyzkoušet Garazio <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 lg:px-8 lg:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">Pro majitele servisu</p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Neřešte jen dnešek. Mějte přehled o celém servisu.</h2>
            <p className="mt-5 max-w-xl leading-7 text-text-secondary">Když máte tým, potřebujete vědět, co se právě děje. Přehled servisu vám pomůže sledovat zakázky, práci mechaniků a výsledky bez procházení každé jednotlivé zakázky.</p>
            <div className="mt-7 space-y-3 text-sm font-semibold"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Přehled zakázek a jejich stavu</div><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Evidence práce mechaniků</div><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Přehled tržeb a výkonu servisu</div></div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-3 shadow-xl shadow-black/20"><div className="rounded-xl border border-border bg-background p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-text-muted">Majitel servisu</p><h3 className="font-heading text-xl font-bold">Přehled</h3></div><Gauge className="h-5 w-5 text-primary" /></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-lg border border-border bg-surface p-4"><p className="text-xs text-text-muted">Zakázky tento měsíc</p><p className="mt-1 text-2xl font-extrabold">42</p></div><div className="rounded-lg border border-border bg-surface p-4"><p className="text-xs text-text-muted">Dokončeno</p><p className="mt-1 text-2xl font-extrabold">35</p></div><div className="rounded-lg border border-border bg-surface p-4"><p className="text-xs text-text-muted">Mechanici</p><p className="mt-1 text-2xl font-extrabold">3</p></div><div className="rounded-lg border border-border bg-surface p-4"><p className="text-xs text-text-muted">Dnes</p><p className="mt-1 text-2xl font-extrabold">6</p></div></div><div className="mt-4 h-24 rounded-lg border border-border bg-surface p-4"><div className="flex h-full items-end gap-2">{[28, 44, 35, 58, 48, 72, 62, 82, 70, 90, 76, 96].map((height, index) => <div key={index} className="flex-1 rounded-t bg-primary/70" style={{ height: `${height}%` }} />)}</div></div></div></div>
        </div>
      </section>

      <section id="faq" className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-3xl px-5 py-20 lg:px-8 lg:py-24">
          <div className="text-center"><p className="text-sm font-bold uppercase tracking-widest text-primary">FAQ</p><h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Časté otázky</h2></div>
          <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-surface px-5">
            {faqs.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-heading font-bold"><span>{question}</span><ChevronDown className="h-4 w-4 shrink-0 text-text-muted transition group-open:rotate-180" /></summary><p className="mt-3 max-w-2xl pr-8 text-sm leading-6 text-text-secondary">{answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20 text-center lg:px-8 lg:py-28">
        <div className="rounded-3xl border border-primary/20 bg-primary/5 px-6 py-12 sm:px-10">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Přestaňte řídit servis z papíru a telefonu.</h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-text-secondary">Vyzkoušejte Garazio a zjistěte, jak může vypadat přehlednější provoz autoservisu.</p>
          <Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition hover:brightness-110">Začít s Garazio <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8 text-center text-xs text-text-muted">© {new Date().getFullYear()} Garazio · Jednoduchý digitální diář pro autoservisy</footer>
    </main>
  );
}
