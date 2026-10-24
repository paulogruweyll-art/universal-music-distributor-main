import { createFileRoute } from "@tanstack/react-router";
import { LegalDraft } from "@/components/legal-draft";

export const Route = createFileRoute("/direitos-autorais")({
  head: () => ({
    meta: [
      { title: "Política de Direitos Autorais — GruweyllMusic (rascunho)" },
      { name: "description", content: "Rascunho da política de direitos autorais para revisão jurídica." },
    ],
  }),
  component: () => (
    <LegalDraft
      title="Política de Direitos Autorais"
      introduction="Rascunho de um procedimento interno para declarações de titularidade, denúncias, contestação, investigação e decisões."
      sections={[
        {
          heading: "1. Titularidade e créditos",
          paragraphs: [
            "Antes de enviar um lançamento, o artista deve identificar os titulares da gravação e da composição, declarar a sua autorização e fornecer créditos por faixa.",
            "Uma declaração enviada para revisão não equivale a uma verificação independente, transferência de direitos ou garantia de que não existem reclamações de terceiros.",
          ],
        },
        {
          heading: "2. Comunicação de uma alegada infração",
          paragraphs: [
            "A pessoa que apresenta uma comunicação deve identificar-se, descrever a obra e o uso contestado, fornecer referências e declarar que atua de boa-fé.",
            "A equipa pode solicitar informação adicional. Documentos de prova enviados através do painel são privados e acessíveis apenas às partes autorizadas segundo as regras do serviço.",
          ],
        },
        {
          heading: "3. Notificação, investigação e resposta",
          paragraphs: [
            "A plataforma deve registar a receção, permitir uma resposta quando apropriado, analisar a informação disponível e documentar a decisão e o respetivo histórico.",
            "Prazos para responder, elementos legalmente obrigatórios, notificações às partes e critérios de decisão: [INFORMAÇÃO A CONFIRMAR POR ADVOGADO].",
          ],
        },
        {
          heading: "4. Contestação e recurso",
          paragraphs: [
            "A interface permite registar uma contestação a determinadas denúncias e um recurso de decisões internas, para que a administração os analise.",
            "O efeito jurídico, os prazos e os requisitos de uma contra-notificação dependem da jurisdição aplicável e têm de ser redigidos e aprovados por advogado. Este formulário interno não substitui uma notificação legal.",
          ],
        },
        {
          heading: "5. Decisões e limites do serviço",
          paragraphs: [
            "A decisão «removido» atualiza apenas o estado interno da aplicação. O serviço não comunica atualmente remoções, entregas, bloqueios ou reposições ao Spotify, Apple Music ou a qualquer outro destino externo.",
            "Uma remoção efetiva em serviços externos depende de um distribuidor autorizado, de um canal de entrega/takedown integrado e da confirmação do parceiro. Essa integração ainda não está configurada.",
          ],
        },
        {
          heading: "6. Contactos e responsabilidade",
          paragraphs: [
            "Contacto legal para notificações de direitos, nome do agente designado quando aplicável, morada e procedimento de urgência: [INFORMAÇÃO A CONFIRMAR].",
            "Este rascunho deve ser adaptado à entidade que opera o serviço e à legislação aplicável antes de ser apresentado como política vigente.",
          ],
        },
      ]}
    />
  ),
});
