import { createFileRoute } from "@tanstack/react-router";
import { LegalDraft } from "@/components/legal-draft";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — GruweyllMusic (rascunho)" },
      { name: "description", content: "Rascunho da Política de Privacidade para revisão jurídica." },
    ],
  }),
  component: () => (
    <LegalDraft
      title="Política de Privacidade"
      introduction="Rascunho sobre dados de conta, metadados de música, declarações de direitos, documentos privados e denúncias."
      sections={[
        {
          heading: "1. Responsável e contacto",
          paragraphs: [
            "Responsável pelo tratamento, morada, contacto de privacidade, jurisdição e representante: [INFORMAÇÃO A CONFIRMAR].",
            "Este rascunho não identifica uma base legal nem constitui uma declaração de conformidade com uma jurisdição específica.",
          ],
        },
        {
          heading: "2. Categorias de dados",
          paragraphs: [
            "A aplicação pode tratar dados de conta e perfil, metadados de lançamentos, faixas, capas, créditos, declarações de titularidade, documentos voluntariamente enviados, comunicações de direitos, sessões de autenticação e registos de auditoria.",
            "Não envie documentos de identificação ou outros dados sensíveis até que o responsável confirme a necessidade, a base legal, os controlos e o canal autorizado para esse tratamento.",
          ],
        },
        {
          heading: "3. Finalidades e fornecedores",
          paragraphs: [
            "Os dados são utilizados para autenticar contas, receber lançamentos, rever informações e gerir comunicações de direitos dentro da plataforma.",
            "A infraestrutura atual usa Supabase para autenticação, base de dados e armazenamento. A entidade contratante, localizações de alojamento, subcontratantes, transferências internacionais e termos desses fornecedores precisam de confirmação.",
          ],
        },
        {
          heading: "4. Acesso, segurança e partilha",
          paragraphs: [
            "Os ficheiros de direitos e os materiais de lançamento são configurados como privados e o acesso é limitado por políticas de base de dados e armazenamento.",
            "O acesso administrativo deve ser atribuído apenas pelo responsável autorizado. As finalidades, os destinatários e os registos de acesso devem ser validados antes de iniciar o serviço.",
          ],
        },
        {
          heading: "5. Conservação e direitos dos titulares",
          paragraphs: [
            "Prazos de conservação, eliminação após encerramento de conta, cópias de segurança, exercício de direitos, resposta a pedidos e autoridade de controlo: [INFORMAÇÃO A CONFIRMAR].",
            "Os períodos não foram inventados neste rascunho e devem ser definidos com base na operação real e na lei aplicável.",
          ],
        },
        {
          heading: "6. Incidentes e alterações",
          paragraphs: [
            "O plano de resposta a incidentes, notificações legalmente exigidas, contacto para reclamações e procedimento de atualização desta política precisam de validação jurídica e operacional.",
          ],
        },
      ]}
    />
  ),
});
