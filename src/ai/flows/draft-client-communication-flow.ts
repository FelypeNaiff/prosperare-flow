'use server';
/**
 * @fileOverview Um assistente de IA para redigir comunicações personalizadas por e-mail para clientes.
 *
 * - draftClientCommunication - Função que gera um rascunho de e-mail personalizado para um cliente.
 * - DraftClientCommunicationInput - O tipo de entrada para a função draftClientCommunication.
 * - DraftClientCommunicationOutput - O tipo de retorno para a função draftClientCommunication.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DraftClientCommunicationInputSchema = z.object({
  clientName: z.string().describe('O nome completo do cliente.'),
  clientEmail: z.string().email().describe('O endereço de e-mail do cliente.'),
  communicationPurpose: z
    .string()
    .describe(
      'O motivo principal do e-mail (ex: "vencimento fiscal próximo", "atualização de processo", "solicitação de documentos").'
    ),
  specificDetails: z
    .string()
    .optional()
    .describe(
      'Quaisquer detalhes específicos relevantes para a comunicação, como prazos específicos, documentos ausentes ou atualizações de status.'
    ),
  clientRegime: z
    .string()
    .optional()
    .describe(
      'O regime tributário do cliente (ex: MEI, Simples Nacional, Lucro Presumido, Lucro Real) para contexto adicional.'
    ),
  dueDate: z.string().optional().describe('Uma data de vencimento específica relevante, se houver.'),
  documentsNeeded: z
    .array(z.string())
    .optional()
    .describe('Uma lista de documentos específicos que o cliente precisa fornecer.'),
  processStatus: z.string().optional().describe('O status atual de um processo específico do cliente.'),
});
export type DraftClientCommunicationInput = z.infer<typeof DraftClientCommunicationInputSchema>;

const DraftClientCommunicationOutputSchema = z.object({
  subject: z.string().describe('A linha de assunto sugerida para o e-mail.'),
  body: z.string().describe('O conteúdo do corpo do e-mail rascunhado.'),
});
export type DraftClientCommunicationOutput = z.infer<typeof DraftClientCommunicationOutputSchema>;

export async function draftClientCommunication(
  input: DraftClientCommunicationInput
): Promise<DraftClientCommunicationOutput> {
  return draftClientCommunicationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'draftClientCommunicationPrompt',
  input: {schema: DraftClientCommunicationInputSchema},
  output: {schema: DraftClientCommunicationOutputSchema},
  prompt: `Você é um assistente de IA para um escritório de contabilidade (ContaHub). Sua tarefa é redigir um e-mail profissional, claro e em conformidade para um cliente com base nas informações fornecidas.

Nome do Cliente: {{{clientName}}}
E-mail do Cliente: {{{clientEmail}}}
Objetivo da Comunicação: {{{communicationPurpose}}}

Considere os seguintes detalhes adicionais:
{{#if clientRegime}}Regime Tributário: {{{clientRegime}}}{{/if}}
{{#if dueDate}}Data de Vencimento: {{{dueDate}}}{{/if}}
{{#if documentsNeeded}}Documentos Necessários: {{#each documentsNeeded}}- {{{this}}}{{/each}}{{/if}}
{{#if processStatus}}Status do Processo: {{{processStatus}}}{{/if}}
{{#if specificDetails}}Detalhes Específicos Adicionais: {{{specificDetails}}}{{/if}}

Redija um e-mail conciso e profissional em português brasileiro (PT-BR). O tom deve ser prestativo, formal e informativo. Certifique-se de que todos os detalhes relevantes foram incluídos e que a linguagem seja apropriada para o contexto contábil brasileiro.

Com base no exposto, gere um assunto e um corpo de e-mail adequados.`,
});

const draftClientCommunicationFlow = ai.defineFlow(
  {
    name: 'draftClientCommunicationFlow',
    inputSchema: DraftClientCommunicationInputSchema,
    outputSchema: DraftClientCommunicationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
