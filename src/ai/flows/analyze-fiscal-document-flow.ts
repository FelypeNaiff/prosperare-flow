'use server';
/**
 * @fileOverview Análise de documentos fiscais (Situação Fiscal RFB, CND, PGFN,
 * débitos estaduais/municipais) usando Gemini via Genkit.
 *
 * - analyzeFiscalDocument - recebe um ou mais PDFs (data URI) e retorna análise estruturada.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PendenciaSchema = z.object({
  orgao: z.string().describe('Órgão: Receita Federal, PGFN, SEFAZ, Prefeitura, etc.'),
  tipo: z.string().describe('Ex: Débito em aberto, Omissão de declaração, Inscrição em Dívida Ativa, Processo fiscal'),
  descricao: z.string().describe('Descrição clara, em linguagem simples, do que é a pendência'),
  periodo: z.string().describe('Competência/período de apuração. Vazio se não houver.'),
  valor: z.number().describe('Valor em reais (0 se não informado)'),
  gravidade: z.enum(['ALTA', 'MEDIA', 'BAIXA']),
  recomendacao: z.string().describe('O que o cliente deve fazer para regularizar'),
});

const AnalysisOutputSchema = z.object({
  tipoDocumento: z.string().describe('Ex: Relatório de Situação Fiscal - RFB/PGFN, Certidão Negativa, etc.'),
  contribuinteNome: z.string(),
  contribuinteDocumento: z.string().describe('CNPJ ou CPF'),
  dataEmissao: z.string().describe('Data de emissão do documento (dd/mm/aaaa)'),
  situacaoGeral: z.enum(['REGULAR', 'ATENCAO', 'IRREGULAR']),
  podeEmitirCND: z.string().describe('Avaliação se o contribuinte consegue emitir CND/CPEN hoje e por quê'),
  resumo: z.string().describe('Resumo executivo de 1 a 2 parágrafos em linguagem simples'),
  pendencias: z.array(PendenciaSchema),
  parcelamentos: z.array(
    z.object({
      descricao: z.string(),
      situacao: z.string(),
      observacao: z.string(),
    })
  ),
  pontosPositivos: z.array(z.string()),
  recomendacoes: z.array(z.string()).describe('Plano de ação em ordem de prioridade'),
  conclusao: z.string(),
});
export type FiscalAnalysis = z.infer<typeof AnalysisOutputSchema>;

export type AnalyzeFiscalInput = {
  files: { dataUri: string; name: string }[];
  documentType: string;
  clientName?: string;
  observacoes?: string;
};

const SYSTEM = `Você é um contador tributarista sênior brasileiro do escritório Prosperare.
Analise os documentos fiscais anexados (podem ser: Relatório de Situação Fiscal da Receita Federal/PGFN (e-CAC),
Certidões Negativas/Positivas (CND/CPEN), relatórios da PGFN/Regularize, débitos estaduais (SEFAZ) ou municipais).

Regras:
- Extraia TODAS as pendências: débitos (SIEF, DCTF, Simples Nacional, previdenciários), omissões de declaração
  (DCTF, EFD, DEFIS, PGDAS-D, GFIP, ECF, DIRF etc.), inscrições em dívida ativa, processos fiscais, malha, CADIN.
- Use APENAS informações presentes nos documentos. Nunca invente valores. Se não houver valor, use 0.
- Tom: técnico, porém simples e didático para um cliente leigo. Explique siglas na primeira vez (ex: "DCTF (declaração mensal de débitos federais)").
- Gravidade ALTA: impede CND, dívida ativa, risco de execução/bloqueio. MEDIA: débito/omissão recente regularizável. BAIXA: pendência formal.
- situacaoGeral: REGULAR (sem pendências), ATENCAO (pendências que não impedem CPEN ou estão suspensas), IRREGULAR (impede certidão).
- Escreva em português do Brasil.`;

export async function analyzeFiscalDocument(input: AnalyzeFiscalInput): Promise<FiscalAnalysis> {
  if (!input.files?.length) throw new Error('Nenhum arquivo enviado.');

  const parts: any[] = [];
  for (const f of input.files) {
    const contentType = f.dataUri.substring(5, f.dataUri.indexOf(';')) || 'application/pdf';
    parts.push({ text: `Arquivo: ${f.name}` });
    parts.push({ media: { url: f.dataUri, contentType } });
  }
  parts.push({
    text: `Tipo de documento informado pelo usuário: ${input.documentType}
${input.clientName ? `Cliente: ${input.clientName}` : ''}
${input.observacoes ? `Observações do contador: ${input.observacoes}` : ''}

Gere a análise completa no formato solicitado.`,
  });

  const { output } = await ai.generate({
    system: SYSTEM,
    prompt: parts,
    output: { schema: AnalysisOutputSchema },
    config: { temperature: 0.2 },
  });

  if (!output) throw new Error('A IA não retornou uma análise válida.');
  return output;
}
