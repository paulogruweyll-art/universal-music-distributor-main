import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export function LegalDraft({
  title,
  introduction,
  sections,
}: {
  title: string;
  introduction: string;
  sections: LegalSection[];
}) {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:py-16">
      <Button asChild variant="ghost">
        <Link to="/">Voltar ao site</Link>
      </Button>
      <div className="mt-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3 py-1.5 text-sm font-medium text-warning-foreground">
          <AlertTriangle className="h-4 w-4" />
          Rascunho para revisão jurídica
        </div>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{introduction}</p>
        <div className="mt-6 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm leading-relaxed">
          Este documento não está aprovado para uso legal. Os campos sobre entidade responsável,
          morada, jurisdição, prazos, contactos e condições comerciais precisam de confirmação
          pelo responsável da GruweyllMusic e revisão por advogado antes da publicação.
        </div>
      </div>
      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-xl font-semibold">{section.heading}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-12 border-t pt-5 text-sm text-muted-foreground">
        Para perguntas operacionais, utilize os canais de contacto que forem definidos pelo
        responsável da plataforma. Não envie documentos sensíveis por canais não aprovados.
      </p>
    </main>
  );
}
