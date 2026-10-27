'use client';

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"
import { 
  TrendingUp, 
  ArrowRight, 
  Search, 
  Building2, 
  Globe, 
  ShieldCheck, 
  FileText, 
  Users, 
  ArrowUpRight, 
  Phone,
  Instagram,
  Briefcase,
  ExternalLink,
  ChevronDown,
  Menu,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface LinkUtil {
  id: string
  title: string
  url: string
  category: "societario" | "receita" | "trabalho"
  categoryLabel: string
  description: string
  icon: any
  iconBg: string
  iconColor: string
}

const LINKS_DATA: LinkUtil[] = [
  {
    id: "jucap",
    title: "JUCAP",
    url: "http://www.jucap.ap.gov.br/",
    category: "societario",
    categoryLabel: "Juntas e Prefeituras",
    description: "Registro mercantil, abertura, alteração e baixa de empresas no Estado do Amapá.",
    icon: Building2,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600"
  },
  {
    id: "esocial",
    title: "eSocial",
    url: "https://www.gov.br/esocial/pt-br",
    category: "trabalho",
    categoryLabel: "Trabalho e FGTS",
    description: "Plataforma unificada para envio de obrigações trabalhistas, previdenciárias e fiscais de colaboradores.",
    icon: Users,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600"
  },
  {
    id: "fgts-digital",
    title: "Portal FGTS Digital",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital",
    category: "trabalho",
    categoryLabel: "Trabalho e FGTS",
    description: "Nova ferramenta digital para arrecadação, declaração e gestão de guias do FGTS.",
    icon: Briefcase,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600"
  },
  {
    id: "consulta-cnpj",
    title: "Consulta CNPJ",
    url: "https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp",
    category: "receita",
    categoryLabel: "Fisco e Receita",
    description: "Emissão de comprovante de inscrição e consulta de situação cadastral de pessoa jurídica (CNPJ).",
    icon: FileText,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600"
  },
  {
    id: "consulta-cpf",
    title: "Consulta CPF",
    url: "https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cpf",
    category: "receita",
    categoryLabel: "Fisco e Receita",
    description: "Verificação da situação e regularidade cadastral de pessoa física na Receita Federal.",
    icon: Users,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600"
  },
  {
    id: "cnd-receita",
    title: "CND Receita Federal",
    url: "https://servicos.receitafederal.gov.br/servico/certidoes/",
    category: "receita",
    categoryLabel: "Fisco e Receita",
    description: "Emissão e consulta de Certidões Negativas de Débitos Relativos a Créditos Tributários Federais.",
    icon: ShieldCheck,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600"
  },
  {
    id: "cnd-fgts",
    title: "CND FGTS",
    url: "https://consulta-crf.caixa.gov.br/consultacrf/pages/consultaEmpregador.jsf",
    category: "trabalho",
    categoryLabel: "Trabalho e FGTS",
    description: "Consulta e emissão do CRF (Certificado de Regularidade do FGTS) junto à Caixa Econômica.",
    icon: ShieldCheck,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600"
  },
  {
    id: "prefeitura-macapa",
    title: "Prefeitura de Macapá",
    url: "https://macapa.ap.gov.br/",
    category: "societario",
    categoryLabel: "Juntas e Prefeituras",
    description: "Portal oficial da Prefeitura de Macapá para consulta de alvarás, impostos e taxas municipais.",
    icon: Globe,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600"
  },
  {
    id: "nfse-macapa",
    title: "Nota Fiscal de Serviços Macapá (PMM)",
    url: "https://macapa.ap.gov.br/orientacao-novo-sistema-de-issqn-macapa-ap/",
    category: "societario",
    categoryLabel: "Juntas e Prefeituras",
    description: "Portal do novo sistema de ISSQN e emissão de Notas Fiscais Eletrônicas de Serviço (NFS-e) de Macapá.",
    icon: FileText,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600"
  }
]

export default function LinksUteisPage() {
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLoginRedirect = () => {
    router.push("/login")
  }

  const handleWhatsAppRedirect = () => {
    window.open("https://wa.me/5596981296544", "_blank")
  }

  // Filtragem dos links
  const filteredLinks = LINKS_DATA.filter((link) => {
    const matchesSearch = 
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      link.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = activeCategory === "all" || link.category === activeCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-slate-800 font-sans selection:bg-[#2563EB]/25 flex flex-col justify-between">
      
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push("/")}>
            <div className="p-2 bg-[#2563EB] rounded-xl shadow-md flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm md:text-base font-black tracking-tighter text-[#2C4156] uppercase flex flex-col leading-none">
              <span>PROSPERARE</span>
              <span className="text-[9px] text-[#2563EB] font-bold tracking-widest mt-0.5">Serviços Contábeis</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="/" className="text-sm font-bold text-slate-500 hover:text-[#2563EB] uppercase tracking-wider transition-colors">Início</a>
            <a href="/#sobre-nos" className="text-sm font-bold text-slate-500 hover:text-[#2563EB] uppercase tracking-wider transition-colors">Sobre Nós</a>
            <a href="/#servicos" className="text-sm font-bold text-slate-500 hover:text-[#2563EB] uppercase tracking-wider transition-colors">Serviços</a>
            <a href="/links-uteis" className="text-sm font-bold text-[#2563EB] uppercase tracking-wider transition-colors">Links Úteis</a>
          </nav>

          {/* Login Action Button */}
          <div className="hidden md:flex items-center gap-4">
            {mounted && !isUserLoading && user ? (
              <Button 
                onClick={() => router.push("/portal/ferias")}
                className="bg-[#2C4156] hover:bg-[#2C4156]/90 text-white font-bold text-xs uppercase tracking-wider h-11 px-6 rounded-xl transition-all shadow-md"
              >
                Acessar Painel <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button 
                onClick={handleLoginRedirect}
                className="bg-[#2563EB] hover:bg-[#2563EB]/95 text-white font-bold text-xs uppercase tracking-wider h-11 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl shadow-blue-600/10 hover:shadow-blue-600/20"
              >
                Área do Cliente / Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 border-b border-slate-200/80 px-6 py-6 space-y-4 animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col gap-4">
              <a 
                href="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-black text-slate-500 hover:text-[#2563EB] uppercase tracking-wider"
              >
                Início
              </a>
              <a 
                href="/#sobre-nos" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-black text-slate-500 hover:text-[#2563EB] uppercase tracking-wider"
              >
                Sobre Nós
              </a>
              <a 
                href="/#servicos" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-black text-slate-500 hover:text-[#2563EB] uppercase tracking-wider"
              >
                Serviços
              </a>
              <a 
                href="/links-uteis" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-black text-[#2563EB] uppercase tracking-wider"
              >
                Links Úteis
              </a>
            </nav>
            <div className="pt-4 border-t border-slate-100">
              {mounted && !isUserLoading && user ? (
                <Button 
                  onClick={() => router.push("/portal/ferias")}
                  className="w-full bg-[#2C4156] text-white font-bold text-xs uppercase h-11 rounded-xl"
                >
                  Acessar Painel
                </Button>
              ) : (
                <Button 
                  onClick={handleLoginRedirect}
                  className="w-full bg-[#2563EB] text-white font-bold text-xs uppercase h-11 rounded-xl"
                >
                  Área do Cliente / Login
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO / HEADER SECTION */}
      <section className="pt-32 pb-12 bg-white relative overflow-hidden border-b border-slate-200/50 flex-1">
        {/* Soft glowing decorations */}
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#2563EB]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#2574A9]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-6 max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 text-[10px] font-black uppercase tracking-wider">
              Facilitando sua rotina
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-[#2C4156] tracking-tighter uppercase leading-tight">
              Central de <span className="text-[#2563EB]">Links Úteis</span>
            </h1>
            
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
              Acesse rapidamente os principais portais governamentais, juntas comerciais, emissores de certidões e serviços municipais essenciais para o seu negócio.
            </p>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="bg-[#F7F7F7] border border-slate-200/80 rounded-2xl p-6 shadow-sm mb-10 flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
            {/* Search Input */}
            <div className="relative w-full md:max-w-xs shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar link ou serviço..."
                className="w-full h-11 pl-10 pr-4 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus-visible:ring-[#2563EB]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 w-full justify-start md:justify-end">
              <button
                onClick={() => setActiveCategory("all")}
                className={cn(
                  "px-4 h-9 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  activeCategory === "all"
                    ? "bg-[#2C4156] text-white shadow-md shadow-[#2C4156]/15"
                    : "bg-white text-slate-500 hover:text-slate-700 border border-slate-200/60"
                )}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveCategory("societario")}
                className={cn(
                  "px-4 h-9 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  activeCategory === "societario"
                    ? "bg-[#2C4156] text-white shadow-md shadow-[#2C4156]/15"
                    : "bg-white text-slate-500 hover:text-slate-700 border border-slate-200/60"
                )}
              >
                Juntas e Prefeituras
              </button>
              <button
                onClick={() => setActiveCategory("receita")}
                className={cn(
                  "px-4 h-9 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  activeCategory === "receita"
                    ? "bg-[#2C4156] text-white shadow-md shadow-[#2C4156]/15"
                    : "bg-white text-slate-500 hover:text-slate-700 border border-slate-200/60"
                )}
              >
                Fisco e Receita
              </button>
              <button
                onClick={() => setActiveCategory("trabalho")}
                className={cn(
                  "px-4 h-9 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  activeCategory === "trabalho"
                    ? "bg-[#2C4156] text-white shadow-md shadow-[#2C4156]/15"
                    : "bg-white text-slate-500 hover:text-slate-700 border border-slate-200/60"
                )}
              >
                Trabalho e FGTS
              </button>
            </div>
          </div>

          {/* LINKS GRID */}
          <div className="max-w-6xl mx-auto">
            {filteredLinks.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200/60 rounded-3xl p-8 max-w-md mx-auto">
                <p className="text-sm font-black uppercase text-slate-400 tracking-wider">Nenhum link encontrado</p>
                <p className="text-xs text-slate-500 font-semibold mt-2">
                  Tente ajustar a sua busca ou filtro para encontrar o que procura.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLinks.map((link) => (
                  <div 
                    key={link.id}
                    className="bg-white border border-slate-200/70 p-6 rounded-2xl flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
                  >
                    <div className="space-y-4">
                      {/* Icon & Category Badge */}
                      <div className="flex items-start justify-between">
                        <div className={cn("p-3 rounded-xl", link.iconBg, link.iconColor)}>
                          <link.icon className="h-5 w-5" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                          {link.categoryLabel}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-2 text-left">
                        <h3 className="text-base font-black text-[#2C4156] tracking-tight group-hover:text-[#2563EB] transition-colors">
                          {link.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                          {link.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-6 mt-4 border-t border-slate-100">
                      <a 
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:text-[#2563EB]/80 transition-all uppercase tracking-wider"
                      >
                        Acessar Portal <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#2563EB] rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-black text-white uppercase tracking-wider flex flex-col leading-none">
                <span>PROSPERARE</span>
                <span className="text-[8px] text-[#2563EB] font-bold tracking-widest mt-0.5">Serviços Contábeis</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              Tradição de uma década com inovação tecnológica. Simplificamos a sua gestão fiscal e societária para você focar no que importa: crescer.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a 
                href="https://instagram.com/prosperaresc" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-slate-800 hover:bg-[#2563EB] hover:text-white rounded-lg transition-all text-slate-400"
                title="Siga no Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-[10px] font-black uppercase text-white tracking-widest mb-4 border-b border-slate-800 pb-2">Serviços</h5>
            <ul className="space-y-2 text-[10px] font-bold uppercase tracking-wider">
              <li><a href="/#servicos" className="hover:text-white transition-colors">Contabilidade Consultiva</a></li>
              <li><a href="/#servicos" className="hover:text-white transition-colors">Gestão de DP e RH</a></li>
              <li><a href="/#servicos" className="hover:text-white transition-colors">Gestão Tributária</a></li>
              <li><a href="/#servicos" className="hover:text-white transition-colors">Processos e Legalização</a></li>
              <li><a href="/#servicos" className="hover:text-white transition-colors">Suframa</a></li>
              <li><a href="/#servicos" className="hover:text-white transition-colors">Auditoria e Perícia</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-[10px] font-black uppercase text-white tracking-widest mb-4 border-b border-slate-800 pb-2">Contato</h5>
            <div className="space-y-3 text-[10px] font-semibold leading-relaxed">
              <div>
                <p className="text-white uppercase font-black tracking-widest mb-0.5">Endereço:</p>
                <p className="text-slate-500">Av. Acelino de Leão, 1046 - Trem, Macapá - AP, 68901-092</p>
              </div>
              <div>
                <p className="text-white uppercase font-black tracking-widest mb-0.5">Telefones:</p>
                <p className="text-slate-500">(96) 98129-6544 / 98133-4568</p>
              </div>
              <div>
                <p className="text-white uppercase font-black tracking-widest mb-0.5">Funcionamento:</p>
                <p className="text-slate-500">Seg à Sex - 08h às 12h / 14h às 18h</p>
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-[10px] font-black uppercase text-white tracking-widest mb-4 border-b border-slate-800 pb-2">Navegação</h5>
            <ul className="space-y-2 text-[10px] font-bold uppercase tracking-wider">
              <li><a href="/" className="hover:text-white transition-colors">Início</a></li>
              <li><a href="/#sobre-nos" className="hover:text-white transition-colors">Sobre Nós</a></li>
              <li><a href="/#servicos" className="hover:text-white transition-colors">Serviços</a></li>
              <li><a href="/login" className="hover:text-white transition-colors">Portal do Cliente (Login)</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 mt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-[9px] font-bold uppercase text-slate-500 tracking-wider">
          <span>Prosperare Serviços Contábeis © 2026 — Todos os direitos reservados.</span>
          <span>Desenvolvido com tecnologia Prosperare Cloud.</span>
        </div>
      </footer>

    </div>
  )
}
