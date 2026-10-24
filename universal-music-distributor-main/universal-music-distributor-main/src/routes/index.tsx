import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PLATFORMS,
  PLATFORM_COUNT,
  PLATFORM_CATEGORY_LABEL,
  type PlatformCategory,
} from "@/lib/platforms";
import heroImg from "@/assets/hero.jpg";
import {
  Rocket,
  Globe2,
  Wallet,
  UploadCloud,
  ListMusic,
  Share2,
  ShieldCheck,
  Sparkles,
  Music2,
  BadgeCheck,
  TrendingUp,
  Headphones,
  Menu,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "GruweyllMusic — Prepare a sua música para distribuição digital",
      },
      {
        name: "description",
        content:
          "Prepare os dados e os direitos da sua música num painel em português. A distribuição externa depende de um parceiro autorizado.",
      },
      { property: "og:title", content: "GruweyllMusic Distribution" },
      {
        property: "og:description",
        content: "Submeta os detalhes da sua música para revisão numa plataforma em português.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    icon: UserPlus,
    title: "Crie a sua conta de artista",
    text: "Registe-se em minutos com email ou Google. O seu perfil de artista fica pronto para receber lançamentos.",
  },
  {
    icon: UploadCloud,
    title: "Envie a sua música",
    text: "Capa, faixas em áudio, data de lançamento e géneros. Escolha em que plataformas quer estar.",
  },
  {
    icon: Rocket,
    title: "A equipa revê",
    text: "A equipa analisa o lançamento. A entrega externa depende de um parceiro autorizado.",
  },
  {
    icon: Wallet,
    title: "Acompanhe os dados",
    text: "Consulte os dados de royalties quando forem disponibilizados à plataforma.",
  },
];

const FEATURES = [
  {
    icon: Globe2,
    title: " Alcance global",
    text: "Mais de 40 destinos: streaming global, redes sociais, lojas especializadas e plataformas fortes em África, na lusofonia e na Ásia.",
  },
  {
    icon: ShieldCheck,
    title: "Declare os titulares",
    text: "Registe os titulares e créditos por lançamento. As declarações não substituem contratos ou autorizações.",
  },
  {
    icon: TrendingUp,
    title: "Registo de informação",
    text: "Consulte os relatórios por plataforma quando dados válidos forem disponibilizados pela equipa ou por um parceiro.",
  },
];

function UserPlus(props: React.ComponentProps<typeof Sparkles>) {
  return <ListMusic {...props} />;
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <Hero />
      <PlatformMarquee />
      <HowItWorks />
      <PlatformsSection />
      <FeaturesSection />
      <FaqSection />
      <FinalCta />
      <Footer />
    </div>
  );
}

function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Brand />
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="#como-funciona" className="transition-colors hover:text-foreground">
            Como funciona
          </a>
          <a href="#plataformas" className="transition-colors hover:text-foreground">
            Plataformas
          </a>
          <Link to="/planos" className="transition-colors hover:text-foreground">
            Planos
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <details className="relative md:hidden">
            <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border bg-background text-foreground hover:bg-accent">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </summary>
            <nav className="absolute right-0 top-11 z-50 grid min-w-48 gap-1 rounded-xl border bg-card p-2 text-sm shadow-lg">
              <a href="#como-funciona" className="rounded-lg px-3 py-2 hover:bg-accent">
                Como funciona
              </a>
              <a href="#plataformas" className="rounded-lg px-3 py-2 hover:bg-accent">
                Plataformas
              </a>
              <a href="#perguntas-frequentes" className="rounded-lg px-3 py-2 hover:bg-accent">
                Perguntas frequentes
              </a>
              <Link to="/planos" className="rounded-lg px-3 py-2 hover:bg-accent">
                Planos
              </Link>
              <Link to="/auth" className="rounded-lg px-3 py-2 hover:bg-accent">
                Entrar
              </Link>
            </nav>
          </details>
          <Button variant="ghost" className="hidden sm:inline-flex" asChild>
            <Link to="/auth">Entrar</Link>
          </Button>
          <Button className="gradient-brand text-white shadow-glow-sm" asChild>
            <Link to="/auth">
              <span className="sm:hidden">Começar</span>
              <span className="hidden sm:inline">Começar grátis</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="gradient-brand flex h-9 w-9 items-center justify-center rounded-xl shadow-glow-sm">
        <Music2 className="h-5 w-5 text-white" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        Gruweyll<span className="text-gradient-brand">Music</span>
      </span>
    </Link>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="gradient-brand-soft absolute inset-0" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <Badge className="mb-5 gap-1.5 border-primary/20 bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Preparação de lançamentos para artistas independentes
          </Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Prepare a sua música para{" "}
            <span className="text-gradient-brand">distribuição digital</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Organize metadados, créditos e declarações de titularidade num só painel em português.
            A entrega a serviços externos só acontece com um distribuidor autorizado.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="gradient-brand text-white shadow-glow" asChild>
              <Link to="/auth">Submeter para revisão</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/planos">Ver planos</Link>
            </Button>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
            {[
              { value: `${PLATFORM_COUNT}`, label: "destinos planeados" },
              { value: "RLS", label: "acesso protegido" },
              { value: "PT", label: "suporte em português" },
            ].map((s) => (
              <div key={s.label}>
                <dt className="font-display text-2xl font-bold text-foreground">{s.value}</dt>
                <dd className="text-sm text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative">
          <div className="animate-float-slow">
            <img
              src={heroImg}
              alt="Ondas sonoras vibrantes em violeta, rosa e laranja com um disco de vinil"
              width={1792}
              height={1024}
              className="rounded-4xl shadow-glow"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PlatformMarquee() {
  const names = PLATFORMS.slice(0, 24).map((p) => p.name);
  const row = [...names, ...names];
  return (
    <section
      className="border-y border-border/60 bg-card py-5"
      aria-label="Exemplos de destinos planeados, sem integração externa ativa"
    >
      <div className="overflow-hidden">
        <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap">
          {row.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="font-display text-base font-semibold text-muted-foreground"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-20">
      <SectionHeading
        kicker="Como funciona"
        title="Prepare o lançamento em 4 passos"
        subtitle="Organize os materiais e acompanhe a revisão interna."
      />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="group relative rounded-3xl border bg-card p-6 transition-shadow hover:shadow-glow-sm"
          >
            <span className="text-gradient-brand font-display absolute right-5 top-4 text-4xl font-bold opacity-20">
              {i + 1}
            </span>
            <div className="mb-4 inline-flex rounded-2xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <step.icon className="h-6 w-6" />
            </div>
            <h3 className="font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlatformsSection() {
  const groups: PlatformCategory[] = ["streaming", "social", "regional", "store"];
  return (
    <section id="plataformas" className="bg-sidebar py-20 text-sidebar-foreground">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <span className="font-display text-sm font-semibold uppercase tracking-widest text-primary-glow">
            Destinos planeados
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Destinos a considerar quando houver integração autorizada
          </h2>
          <p className="mt-4 text-muted-foreground">
            A lista abaixo descreve destinos pretendidos, não integrações ativas. A disponibilidade
            depende de contratos e ligação técnica com um distribuidor autorizado.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {groups.map((cat) => (
            <div key={cat} className="rounded-3xl border border-sidebar-border bg-white/5 p-6">
              <div className="mb-4 flex items-center gap-2">
                {cat === "streaming" && <Headphones className="h-5 w-5 text-primary-glow" />}
                {cat === "social" && <Share2 className="h-5 w-5 text-primary-glow" />}
                {cat === "regional" && <Globe2 className="h-5 w-5 text-primary-glow" />}
                {cat === "store" && <BadgeCheck className="h-5 w-5 text-primary-glow" />}
                <h3 className="font-display font-semibold">
                  {PLATFORM_CATEGORY_LABEL[cat]}
                </h3>
              </div>
              <ul className="flex flex-wrap gap-2">
                {PLATFORMS.filter((p) => p.category === cat).map((p) => (
                  <li
                    key={p.id}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm"
                  >
                    {p.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="grid gap-6 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-3xl border bg-card p-7">
            <div className="mb-4 inline-flex rounded-2xl gradient-brand-soft p-3 text-primary">
              <f.icon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqSection() {
  const questions = [
    {
      question: "Como envio a minha música para distribuição?",
      answer:
        "Crie uma conta, abra o painel do artista e submeta a capa, as faixas, a data de lançamento, os créditos e a declaração de titularidade para revisão interna.",
    },
    {
      question: "O lançamento fica disponível imediatamente?",
      answer:
        "Não. Cada envio fica pendente de revisão interna. A aprovação não envia a música para serviços externos.",
    },
    {
      question: "Quem mantém os direitos da música?",
      answer:
        "A proposta da GruweyllMusic é que os direitos continuam a pertencer ao artista, sem exclusividade.",
    },
    {
      question: "Onde acompanho os royalties?",
      answer:
        "Quando os dados de royalties forem disponibilizados, pode consultá-los por plataforma e período no painel do artista.",
    },
  ];

  return (
    <section id="perguntas-frequentes" className="mx-auto max-w-6xl px-4 pb-20">
      <SectionHeading
        kicker="Perguntas frequentes"
        title="Antes de lançar"
        subtitle="O essencial sobre o envio da sua música e o acompanhamento da distribuição."
      />
      <div className="mt-8 divide-y rounded-3xl border bg-card px-6">
        {questions.map((item) => (
          <details key={item.question} className="group py-5">
            <summary className="cursor-pointer list-none font-semibold">
              <span className="mr-3 text-primary">+</span>
              {item.question}
            </summary>
            <p className="mt-3 pl-6 text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <div className="gradient-brand relative overflow-hidden rounded-4xl px-8 py-16 text-center text-white">
        <Music2 className="absolute -left-6 -top-6 h-40 w-40 opacity-10" />
        <Music2 className="absolute -bottom-8 -right-8 h-52 w-52 opacity-10" />
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Pronto para lançar a sua próxima música?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/85">
          Crie a sua conta e submeta os materiais para revisão interna.
        </p>
        <Button
          size="lg"
          className="mt-8 bg-white text-foreground hover:bg-white/90"
          asChild
        >
          <Link to="/auth">Criar conta de artista</Link>
        </Button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-card py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 md:flex-row">
        <Brand />
        <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <a href="#como-funciona" className="hover:text-foreground">
            Como funciona
          </a>
          <a href="#plataformas" className="hover:text-foreground">
            Plataformas
          </a>
          <Link to="/planos" className="hover:text-foreground">
            Planos
          </Link>
          <Link to="/termos" className="hover:text-foreground">
            Termos
          </Link>
          <Link to="/privacidade" className="hover:text-foreground">
            Privacidade
          </Link>
          <Link to="/direitos-autorais" className="hover:text-foreground">
            Direitos autorais
          </Link>
          <a href="#perguntas-frequentes" className="hover:text-foreground">
            Perguntas frequentes
          </a>
          <Link to="/auth" className="hover:text-foreground">
            Entrar
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} GruweyllMusic Distribution
        </p>
      </div>
    </footer>
  );
}

function SectionHeading({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-2xl">
      <span className="text-gradient-brand font-display text-sm font-semibold uppercase tracking-widest">
        {kicker}
      </span>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
