export type UserProfile = 'SÓCIO' | 'ADMINISTRADOR' | 'CONTADOR/GESTOR' | 'ASSISTENTE';

export interface User {
  id: string;
  name: string;
  email: string;
  profile: UserProfile;
  department?: string;
  avatarUrl?: string;
  status: 'ATIVO' | 'INATIVO';
}

export type TaxRegime = 'MEI' | 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'Produtor Rural' | 'Pessoa Física' | 'Outros';

export interface Partner {
  nome: string;
  cpfCnpj: string;
  qualificacao: string;
  dataIngresso: string;
  participacao: number;
  percentualQuota?: number;
  rg?: string;
  rgOrgaoEmissor?: string;
  rgUf?: string;
  dataNascimento?: string;
  estadoCivil?: string;
  regimeBens?: string;
  profissao?: string;
  nacionalidade?: string;
  email?: string;
}

export interface Client {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  regime: TaxRegime;
  responsavelId: string;
  statusCertidao: 'Válida' | 'A Vencer' | 'Vencida' | 'Não emitida';
  honorarioVencimento: number;
  honorarioValor: number;
  healthScore: number;
  status: 'ATIVO' | 'INATIVO';
  codigoInterno?: string;
  
  // Dados societários e QSA
  capitalSocial?: number;
  dataInicioAtividade?: string;
  nire?: string;
  naturezaJuridica?: string;
  qsa?: Partner[];
}

export interface Task {
  id: string;
  clienteId: string;
  titulo: string;
  status: 'A Fazer' | 'Em Progresso' | 'Concluído' | 'Dispensado' | 'Em Multa';
  prazo: string;
  responsavelId: string;
  departamento: string;
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
}

export interface Certificate {
  id: string;
  clienteId: string;
  tipo: string;
  emissao: string;
  validade: string;
  status: 'Válida' | 'A Vencer 30d' | 'A Vencer 7d' | 'Vencida' | 'Não emitida';
  arquivoUrl?: string;
}

export interface Honorario {
  id: string;
  clienteId: string;
  competencia: string;
  valor: number;
  vencimento: string;
  pagamento?: string;
  status: 'Pendente' | 'Pago' | 'Vencido' | 'Cancelado';
}
