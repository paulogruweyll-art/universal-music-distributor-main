import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brand } from "@/routes/index";
import {
  Check,
  Coins,
  CreditCard,
  Hash,
  Info,
  Landmark,
  ListMusic,
  Music2,
  UserRound,
} from "lucide-react";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos — GruweyllMusic Distribution" },
      {
        name: "description",
        content:
          "Consulte os planos grátis, mensal e anual da GruweyllMusic Distribution e os meios de pagamento disponíveis.",
      },
      { property: "og:title", content: "Planos — GruweyllMusic Distribution" },
      {
        property: "og:description",
        content: "Escolha como quer distribuir a sua música pela GruweyllMusic.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanosPage,
});

const PLANS = [
  {
    icon: UserRound,
    name: "Grátis",
    tagline: "Para começar",
    priceUsd: "0",
    priceAoa: "0",
    period: "para sempre",
    features: [
      "Crie o seu perfil de artista",
      "Registe os detalhes dos seus lançamentos",
      "Submeta lançamentos para revisão interna",
      "Acompanhe os estados no painel",
    ],
  },
  {
    icon: Music2,
    name: "Mensal",
    tagline: "Flexibilidade mês a mês",
    priceUsd: "10",
    priceAoa: "11 000",
    period: "por mês",
    features: [
      "Lançamentos enviados para revisão interna",
      "Escolha plataformas em cada lançamento",
      "Acompanhe o estado de revisão",
      "Consulte royalties quando forem disponibilizados",
    ],
  },
  {
    icon: ListMusic,
    name: "Anual",
    tagline: "Um ano de acesso",
    priceUsd: "120",
    priceAoa: "132 000",
    period: "por ano",
    features: [
      "Lançamentos enviados para revisão interna",
      "Escolha plataformas em cada lançamento",
      "Acompanhe o estado de revisão",
      "Consulte royalties quando forem disponibilizados",
    ],
  },
];

const PAYMENT_METHODS = [
  { icon: CreditCard, name: "Visa" },
  { icon: Coins, name: "Criptomoedas" },
  { icon: Hash, name: "Referência" },
  { icon: Landmark, name: "Transferência por IBAN" },
];

export default function PlanosPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Brand />
          <Button className="gradient-brand text-white shadow-glow-sm" asChild>
            <Link to="/auth">Criar conta grátis</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="mb-4 gap-1.5 border-primary/20 bg-primary/10 text-primary">
            <Music2 className="h-3.5 w-3.5" /> Planos de distribuição
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Escolha como quer <span className="text-gradient-brand">lançar</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Escolha o plano que melhor acompanha o seu percurso como artista.
          </p>
        </div>

        <div className="mx-auto mt-6 flex max-w-2xl items-start gap-2 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>
            Os valores em kwanzas correspondem a 1 USD = 1 100 Kz. O pagamento e a ativação
            dos planos ainda não são processados pelo site; confirme os dados de pagamento com
            a equipa antes de efetuar qualquer pagamento.
          </span>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="flex flex-col rounded-3xl border bg-card p-7 transition-shadow hover:shadow-glow-sm"
            >
              <div className="mb-4 inline-flex w-fit rounded-2xl gradient-brand-soft p-3 text-primary">
                <plan.icon className="h-6 w-6" />
              </div>
              <h2 className="font-display text-xl font-bold">{plan.name}</h2>
              <p className="text-sm font-medium text-primary">{plan.tagline}</p>
              <div className="mt-4">
                {plan.priceUsd === "0" ? (
                  <>
                    <p className="font-display text-3xl font-bold">Grátis</p>
                    <p className="mt-1 text-sm text-muted-foreground">para sempre</p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-3xl font-bold">
                      ${plan.priceUsd}{" "}
                      <span className="text-base font-medium text-muted-foreground">USD</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.priceAoa} Kz {plan.period}
                    </p>
                  </>
                )}
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8 gradient-brand text-white shadow-glow-sm" asChild>
                <Link to="/auth">
                  {plan.priceUsd === "0" ? "Criar conta grátis" : "Escolher plano"}
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <section className="mx-auto mt-16 max-w-4xl rounded-3xl border bg-card p-6 sm:p-8">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold">Formas de pagamento</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Estas são as formas de pagamento previstas para os planos pagos:
            </p>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PAYMENT_METHODS.map(({ icon: Icon, name }) => (
              <li
                key={name}
                className="flex items-center justify-center gap-2 rounded-xl border bg-background px-3 py-4 text-sm font-medium"
              >
                <Icon className="h-5 w-5 text-primary" />
                {name}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            O site ainda não processa pagamentos nem fornece dados de cartão, carteira cripto,
            referência ou IBAN. Confirme com a equipa quando o meio de pagamento escolhido estiver
            disponível e solicite as instruções oficiais antes de pagar.
          </p>
        </section>

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-muted-foreground">
          A aprovação interna de um lançamento não garante a entrega ou publicação em plataformas
          externas. A distribuição depende de integrações e parceiros autorizados.
        </p>
      </section>

      <footer className="border-t bg-card py-8">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} GruweyllMusic Distribution
        </p>
      </footer>
    </div>
  );
}
