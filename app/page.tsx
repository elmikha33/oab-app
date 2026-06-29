import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Gamepad2,
  LogIn,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';

const benefits = [
  {
    title: 'Questões por matéria',
    description: 'Escolha o foco do dia e treine no ritmo da prova.',
    icon: BookOpenCheck,
  },
  {
    title: 'Revisão dos seus erros',
    description: 'Transforme cada erro em uma próxima tentativa melhor.',
    icon: RotateCcw,
  },
  {
    title: 'Progresso diário gamificado',
    description: 'Acompanhe sequência, conquistas e evolução com clareza.',
    icon: Trophy,
  },
];

const proofPoints = [
  'Treino direto ao ponto',
  'Feedback após responder',
  'Comece grátis agora',
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <section className="relative min-h-[92svh] overflow-hidden">
        <img
          src="/oaplay-brand-hero.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,0.88)_44%,rgba(2,6,23,0.58)_72%,rgba(2,6,23,0.86)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />

        <nav className="relative z-10 mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="OAPlay">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/25 bg-slate-950/75 shadow-lg shadow-black/30">
              <img
                src="/oaplay-icon-1024.png"
                alt=""
                className="h-9 w-9 rounded-xl object-contain"
              />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-2xl font-black leading-none tracking-normal">
                OA<span className="text-emerald-300">Play</span>
              </span>
              <span className="mt-1 block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-emerald-100/80">
                Missão OAB
              </span>
            </span>
          </Link>

          <Link
            href="/auth"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-black text-slate-100 transition hover:border-emerald-300/40 hover:bg-emerald-300/10 hover:text-emerald-100"
          >
            <LogIn className="h-4 w-4" strokeWidth={2.7} />
            Já tenho conta
          </Link>
        </nav>

        <div className="relative z-10 mx-auto flex min-h-[calc(92svh-5rem)] max-w-7xl items-center px-4 pb-10 pt-4 sm:px-6 lg:px-8">
          <div className="w-full">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                <Sparkles className="h-4 w-4" strokeWidth={2.6} />
                Comece grátis agora - sem cartão
              </div>

              <h1 className="mt-6 max-w-3xl font-heading text-4xl font-black leading-[1.02] tracking-normal text-white sm:text-5xl lg:text-6xl">
                Estude para a OAB em modo game
              </h1>

              <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-slate-200 sm:text-lg">
                Treine com questões, revise seus erros e acompanhe sua evolução diária no OAPlay.
              </p>

              <div className="mt-7 grid gap-3 sm:max-w-xl sm:grid-cols-[1.1fr_0.9fr]">
                <Link
                  href="/demo"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-emerald-950 shadow-xl shadow-emerald-950/30 transition hover:-translate-y-0.5 hover:bg-emerald-200"
                >
                  <Gamepad2 className="h-5 w-5" strokeWidth={2.7} />
                  Testar questões grátis
                  <ArrowRight className="h-4 w-4" strokeWidth={3} />
                </Link>

                <Link
                  href="/auth"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:border-emerald-300/40 hover:bg-white/10"
                >
                  <LogIn className="h-5 w-5" strokeWidth={2.7} />
                  Já tenho conta
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {proofPoints.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/55 px-3 py-1.5 text-xs font-bold text-slate-200"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" strokeWidth={3} />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-900 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-lg shadow-black/20"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
                    <Icon className="h-5 w-5" strokeWidth={2.7} />
                  </span>
                  <div>
                    <h2 className="text-base font-black text-white">{benefit.title}</h2>
                    <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-400">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
