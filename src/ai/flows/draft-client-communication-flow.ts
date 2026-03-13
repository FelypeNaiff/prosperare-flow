'use server';
/**
 * @fileOverview An AI assistant for drafting personalized email communications to clients.
 *
 * - draftClientCommunication - A function that generates a personalized email draft for a client.
 * - DraftClientCommunicationInput - The input type for the draftClientCommunication function.
 * - DraftClientCommunicationOutput - The return type for the draftClientCommunication function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DraftClientCommunicationInputSchema = z.object({
  clientName: z.string().describe('The full name of the client.'),
  clientEmail: z.string().email().describe('The email address of the client.'),
  communicationPurpose: z
    .string()
    .describe(
      'The main reason for the email (e.g., "upcoming fiscal deadline", "process update", "document request").'
    ),
  specificDetails: z
    .string()
    .optional()
    .describe(
      'Any specific details relevant to the communication, such as specific deadlines, missing documents, or process status updates.'
    ),
  clientRegime: z
    .string()
    .optional()
    .describe(
      'The client\'s tax regime (e.g., MEI, Simples Nacional, Lucro Presumido, Lucro Real) for additional context.'
    ),
  dueDate: z.string().optional().describe('A specific due date relevant to the communication, if any.'),
  documentsNeeded: z
    .array(z.string())
    .optional()
    .describe('A list of specific documents the client needs to provide.'),
  processStatus: z.string().optional().describe('The current status of a specific process for the client.'),
});
export type DraftClientCommunicationInput = z.infer<typeof DraftClientCommunicationInputSchema>;

const DraftClientCommunicationOutputSchema = z.object({
  subject: z.string().describe('The suggested subject line for the email.'),
  body: z.string().describe('The drafted body content of the email.'),
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
  prompt: `You are an AI assistant for a tax accounting office (Contabilidade). Your task is to draft a professional, clear, and compliant email to a client based on the provided information.

Client Name: {{{clientName}}}
Client Email: {{{clientEmail}}}
Communication Purpose: {{{communicationPurpose}}}

Consider the following additional details:
{{#if clientRegime}}Client Tax Regime: {{{clientRegime}}}{{/if}}
{{#if dueDate}}Specific Due Date: {{{dueDate}}}{{/if}}
{{#if documentsNeeded}}Documents Needed: {{#each documentsNeeded}}- {{{this}}}{{/each}}{{/if}}
{{#if processStatus}}Process Status: {{{processStatus}}}{{/if}}
{{#if specificDetails}}Additional Specific Details: {{{specificDetails}}}{{/if}}

Draft a concise and professional email. The tone should be helpful and informative. Ensure all relevant details are included.

Based on the above, generate a suitable email subject line and body.`,
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
