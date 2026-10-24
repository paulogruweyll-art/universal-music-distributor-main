import { createFileRoute } from "@tanstack/react-router";
import { LegalDraft } from "@/components/legal-draft";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Serviço — GruweyllMusic (rascunho)" },
      { name: "description", content: "Rascunho dos Termos de Serviço para revisão jurídica." },
    ],
  }),
  component: () => (
    <LegalDraft
      title="Termos de Serviço"
      introduction="Rascunho de condições para o uso do painel de artistas e dos serviços de revisão da GruweyllMusic Distribution."
      sections={[
        {
          heading: "1. Identificação do prestador",
          paragraphs: [
            "Nome legal, forma jurídica, número de registo, endereço, jurisdição e contacto do responsável pela plataforma: [INFORMAÇÃO A CONFIRMAR].",
            "A plataforma não deve ser apresentada como distribuidor autorizado até que existam contratos e integrações efetivas com um distribuidor ou parceiros de destino.",
          ],
        },
        {
          heading: "2. Conta e segurança",
          paragraphs: [
            "Cada utilizador deve fornecer informações corretas, proteger as credenciais e utilizar apenas uma conta que esteja autorizado a controlar.",
            "As regras de confirmação de email, recuperação de conta, encerramento de conta e tratamento de abuso precisam de validação jurídica e operacional antes da publicação.",
          ],
        },
        {
          heading: "3. Envios e revisão",
          paragraphs: [
            "O artista pode enviar metadados, gravações, capas, créditos e declarações de titularidade para análise interna.",
            "O estado «aprovado internamente» não significa que a música foi entregue, aceite ou publicada numa plataforma externa. Não há garantia de prazo, aceitação, disponibilidade ou resultados de royalties.",
            "As especificações técnicas definitivas dos ficheiros, limites de tamanho, taxas, prazos de revisão e procedimentos de correção: [INFORMAÇÃO A CONFIRMAR].",
          ],
        },
        {
          heading: "4. Direitos e autorizações",
          paragraphs: [
            "O artista declara que tem os direitos ou autorizações necessários para enviar cada material e deve indicar os titulares e créditos de forma completa.",
            "A titularidade permanece sujeita a contratos escritos, licenças e direitos de terceiros aplicáveis. A redação final deve ser revista por advogado e não substitui esses contratos.",
          ],
        },
        {
          heading: "5. Preços, comissões e pagamentos",
          paragraphs: [
            "Os planos apresentados são grátis, mensal (USD 10 ou 11 000 Kz) e anual (USD 120 ou 132 000 Kz). Os valores em kwanzas são calculados à taxa indicada de 1 USD = 1 100 Kz.",
            "Estão previstos pagamentos por Visa, criptomoedas, referência ou transferência por IBAN. O site não processa pagamentos nem fornece instruções ou dados de cobrança; confirme a disponibilidade e os dados oficiais com a equipa antes de pagar. Não envie dinheiro para dados não confirmados.",
            "A contratação, ativação, renovação, cancelamento, reembolso, impostos e comissões carecem de condições operacionais e jurídicas aprovadas. A apresentação de um preço nesta página não substitui essas condições.",
          ],
        },
        {
          heading: "6. Suspensão e resolução de disputas",
          paragraphs: [
            "A administração pode suspender o acesso interno após análise de abuso, informação inconsistente ou denúncia fundamentada, respeitando o processo de contestação que vier a ser aprovado.",
            "Jurisdição competente, notificações, prazos, responsabilidade e procedimento de recurso: [INFORMAÇÃO A CONFIRMAR].",
          ],
        },
      ]}
    />
  ),
});
