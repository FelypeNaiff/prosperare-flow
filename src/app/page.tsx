'use client';

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"
import { 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  FileText, 
  Layers, 
  MessageSquare, 
  Check, 
  Phone,
  BarChart3,
  Clock,
  CheckCircle2,
  Lock,
  Menu,
  X,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function LandingPage() {
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [mobileConteudosOpen, setMobileConteudosOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLoginRedirect = () => {
    router.push("/login")
  }

  const handleWhatsAppRedirect = () => {
    window.open("https://wa.me/5596991122334?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20a%20contabilidade%20digital%20da%20Prosperare.", "_blank")
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-slate-800 font-sans selection:bg-[#2563EB]/25">
      
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push("/")}>
            <div className="p-2 bg-[#2563EB] rounded-xl shadow-md flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tighter text-[#2C4156] uppercase">
              PROSPERARE <span className="text-[#2563EB]">FLOW</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#diferenciais" className="text-sm font-bold text-slate-500 hover:text-[#2563EB] uppercase tracking-wider transition-colors">Diferenciais</a>
            <a href="#como-funciona" className="text-sm font-bold text-slate-500 hover:text-[#2563EB] uppercase tracking-wider transition-colors">Como Funciona</a>
            <a href="#planos" className="text-sm font-bold text-slate-500 hover:text-[#2563EB] uppercase tracking-wider transition-colors">Planos</a>
            
            {/* Mega Menu Dropdown */}
            <div 
              className="relative py-2"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <button 
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[#2563EB] uppercase tracking-wider transition-colors focus:outline-none"
              >
                Conteúdos
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", megaMenuOpen && "transform rotate-180")} />
              </button>

              {/* Dropdown container */}
              <div 
                className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[550px] bg-white border border-slate-200/60 rounded-2xl shadow-xl p-6 transition-all duration-200 origin-top z-50",
                  megaMenuOpen 
                    ? "opacity-100 translate-y-0 pointer-events-auto scale-100" 
                    : "opacity-0 -translate-y-2 pointer-events-none scale-95"
                )}
              >
                <div className="grid grid-cols-2 gap-8 text-left">
                  {/* Column 1 */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-[#2C4156] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                      Calculadoras:
                    </h4>
                    <ul className="space-y-1">
                      <li>
                        <a 
                          href="/calculadoras/custo-para-abrir-cnpj" 
                          className="block text-xs font-bold text-slate-500 hover:text-[#2563EB] hover:bg-blue-50/50 px-2.5 py-2 rounded-lg transition-all"
                        >
                          Calculadora de Custo para abrir CNPJ
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/calculadoras/pj-x-clt" 
                          className="block text-xs font-bold text-slate-500 hover:text-[#2563EB] hover:bg-blue-50/50 px-2.5 py-2 rounded-lg transition-all"
                        >
                          Calculadora PJ x CLT
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/calculadoras/fator-r" 
                          className="block text-xs font-bold text-slate-500 hover:text-[#2563EB] hover:bg-blue-50/50 px-2.5 py-2 rounded-lg transition-all"
                        >
                          Calculadora de Fator R
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/calculadoras/rpa-online" 
                          className="block text-xs font-bold text-slate-500 hover:text-[#2563EB] hover:bg-blue-50/50 px-2.5 py-2 rounded-lg transition-all"
                        >
                          Calculadora de RPA online
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/calculadoras/reforma-tributaria" 
                          className="block text-xs font-bold text-slate-500 hover:text-[#2563EB] hover:bg-blue-50/50 px-2.5 py-2 rounded-lg transition-all"
                        >
                          Calculadora de Reforma Tributária
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-[#2C4156] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                      Nosso blog:
                    </h4>
                    <ul className="space-y-1">
                      <li>
                        <a 
                          href="/blog/abertura-de-empresa" 
                          className="block text-xs font-bold text-slate-500 hover:text-[#2563EB] hover:bg-blue-50/50 px-2.5 py-2 rounded-lg transition-all"
                        >
                          Abertura de Empresa
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/blog/simples-nacional" 
                          className="block text-xs font-bold text-slate-500 hover:text-[#2563EB] hover:bg-blue-50/50 px-2.5 py-2 rounded-lg transition-all"
                        >
                          Simples Nacional
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/blog/comparativo-clt-x-pj" 
                          className="block text-xs font-bold text-slate-500 hover:text-[#2563EB] hover:bg-blue-50/50 px-2.5 py-2 rounded-lg transition-all"
                        >
                          Comparativo CLT x PJ
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/blog/tabela-simples-nacional" 
                          className="block text-xs font-bold text-slate-500 hover:text-[#2563EB] hover:bg-blue-50/50 px-2.5 py-2 rounded-lg transition-all"
                        >
                          Tabela Simples Nacional
                        </a>
                      </li>
                      <li>
                        <a 
                          href="/blog/ebook-guia-para-ser-pj" 
                          className="block text-xs font-bold text-slate-500 hover:text-[#2563EB] hover:bg-blue-50/50 px-2.5 py-2 rounded-lg transition-all"
                        >
                          Ebook: Guia para ser PJ
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Login Action Button */}
          <div className="hidden md:flex items-center gap-4">
            {mounted && !isUserLoading && user ? (
              <Button 
                onClick={handleLoginRedirect}
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
                href="#diferenciais" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-black text-slate-500 hover:text-[#2563EB] uppercase tracking-wider"
              >
                Diferenciais
              </a>
              <a 
                href="#como-funciona" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-black text-slate-500 hover:text-[#2563EB] uppercase tracking-wider"
              >
                Como Funciona
              </a>
              <a 
                href="#planos" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-black text-slate-500 hover:text-[#2563EB] uppercase tracking-wider"
              >
                Planos
              </a>
              
              {/* Mobile Conteúdos Dropdown */}
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setMobileConteudosOpen(!mobileConteudosOpen)}
                  className="flex items-center justify-between text-xs font-black text-slate-500 hover:text-[#2563EB] uppercase tracking-wider w-full text-left"
                >
                  <span>Conteúdos</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", mobileConteudosOpen && "transform rotate-180")} />
                </button>
                
                {mobileConteudosOpen && (
                  <div className="pl-4 space-y-4 border-l border-slate-200 mt-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-[#2C4156] uppercase tracking-widest">Calculadoras:</p>
                      <div className="flex flex-col gap-2 pl-2">
                        <a href="/calculadoras/custo-para-abrir-cnpj" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Calculadora de Custo para abrir CNPJ</a>
                        <a href="/calculadoras/pj-x-clt" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Calculadora PJ x CLT</a>
                        <a href="/calculadoras/fator-r" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Calculadora de Fator R</a>
                        <a href="/calculadoras/rpa-online" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Calculadora de RPA online</a>
                        <a href="/calculadoras/reforma-tributaria" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Calculadora de Reforma Tributária</a>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-[#2C4156] uppercase tracking-widest">Nosso blog:</p>
                      <div className="flex flex-col gap-2 pl-2">
                        <a href="/blog/abertura-de-empresa" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Abertura de Empresa</a>
                        <a href="/blog/simples-nacional" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Simples Nacional</a>
                        <a href="/blog/comparativo-clt-x-pj" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Comparativo CLT x PJ</a>
                        <a href="/blog/tabela-simples-nacional" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Tabela Simples Nacional</a>
                        <a href="/blog/ebook-guia-para-ser-pj" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Ebook: Guia para ser PJ</a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
            <div className="pt-4 border-t border-slate-100">
              {mounted && !isUserLoading && user ? (
                <Button 
                  onClick={handleLoginRedirect}
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

      {/* HERO SECTION */}
      <section className="pt-36 pb-20 md:py-40 bg-radial-pattern relative overflow-hidden">
        {/* Soft glowing decorations */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#2563EB]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[#2574A9]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Contabilidade Digital e Inteligente
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#2C4156] tracking-tighter leading-[1.05] uppercase">
              A contabilidade que <span className="text-[#2563EB]">impulsiona</span> o seu negócio.
            </h2>
            
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed max-w-xl">
              Abra sua empresa de graça, simplifique sua gestão fiscal e tenha todo o departamento pessoal integrado em um sistema 100% online. Rápido, seguro e sem complicações.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <a href="#planos">
                <Button className="w-full sm:w-auto h-12 bg-[#2563EB] hover:bg-[#2563EB]/95 text-white font-black text-xs uppercase tracking-widest px-8 rounded-xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition-all duration-300">
                  Conheça nossos planos
                </Button>
              </a>
              <Button 
                onClick={handleWhatsAppRedirect}
                variant="outline" 
                className="w-full sm:w-auto h-12 border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest px-8 rounded-xl gap-2 transition-all"
              >
                <Phone className="h-4 w-4 text-[#2563EB]" /> Fale no WhatsApp
              </Button>
            </div>

            {/* Micro Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200 max-w-lg">
              <div>
                <p className="text-2xl font-black text-[#2C4156]">100%</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Digital e Seguro</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#2C4156]">+500</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Clientes Ativos</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#2C4156]">Zero</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Burocracia</p>
              </div>
            </div>

          </div>

          {/* Interactive Mockup Dashboard Card */}
          <div className="lg:col-span-5 relative animate-in fade-in duration-1000">
            <div className="absolute inset-0 bg-[#2563EB]/5 rounded-3xl blur-[40px] pointer-events-none transform -rotate-6" />
            
            <div className="relative bg-white border border-slate-200 shadow-2xl rounded-3xl p-6 space-y-6 max-w-sm mx-auto overflow-hidden">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#EA4335]" />
                  <div className="h-3 w-3 rounded-full bg-[#FBBC05]" />
                  <div className="h-3 w-3 rounded-full bg-[#34A853]" />
                </div>
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest bg-slate-100 px-2 py-1 rounded-md">Prosperare Platform v1.2</span>
              </div>

              {/* Mock Billing stats */}
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Faturamento Operacional</p>
                <p className="text-2xl font-black text-[#2C4156]">R$ 48.910,22</p>
                <p className="text-[8px] text-[#34A853] font-bold uppercase tracking-tight flex items-center gap-1">
                  ▲ +12.4% em relação ao mês anterior
                </p>
              </div>

              {/* Progress and status */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                    <span>Guia DAS Simples Nacional</span>
                    <span className="text-[#34A853]">Pago</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#34A853] h-full w-full" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                    <span>Folha de Pró-Labore</span>
                    <span className="text-blue-600">Disponível</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full w-[70%]" />
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex items-center gap-3">
                <div className="p-1.5 bg-[#34A853]/10 rounded-lg text-[#34A853] shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[8px] font-black uppercase tracking-wider leading-none mb-0.5">Certidão Federal Válida</span>
                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Próxima consulta em 3 dias</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* DIFFERENTIALS SECTION */}
      <section id="diferenciais" className="py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h3 className="text-xs font-black text-[#2563EB] uppercase tracking-[0.25em]">Tecnologia & Pessoas</h3>
            <h2 className="text-3xl md:text-4xl font-black text-[#2C4156] uppercase tracking-tight">
              Tudo o que sua empresa precisa em um só fluxo
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
              Substitua a contabilidade tradicional por uma plataforma digital intuitiva amparada por contadores especialistas focados no seu crescimento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-[#F7F7F7] border border-slate-200/60 p-6 rounded-2xl space-y-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
              <div className="p-3 bg-[#2563EB]/10 text-[#2563EB] rounded-xl w-fit group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-black text-[#2C4156] uppercase tracking-wide">Contabilidade Digital</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Plataforma 100% online para gerenciar faturamento, emitir relatórios e acompanhar a saúde financeira de onde estiver.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#F7F7F7] border border-slate-200/60 p-6 rounded-2xl space-y-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
              <div className="p-3 bg-[#2563EB]/10 text-[#2563EB] rounded-xl w-fit group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-black text-[#2C4156] uppercase tracking-wide">Departamento Pessoal</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Gestão simplificada de admissões, rescisões, férias e emissão mensal de guias de INSS, FGTS e Pró-labore.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#F7F7F7] border border-slate-200/60 p-6 rounded-2xl space-y-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
              <div className="p-3 bg-[#2563EB]/10 text-[#2563EB] rounded-xl w-fit group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-black text-[#2C4156] uppercase tracking-wide">Segurança Fiscal</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Monitoramento preventivo de impostos, certidões negativas e conformidades legais para manter sua empresa sem pendências.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#F7F7F7] border border-slate-200/60 p-6 rounded-2xl space-y-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
              <div className="p-3 bg-[#2563EB]/10 text-[#2563EB] rounded-xl w-fit group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
                <FileText className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-black text-[#2C4156] uppercase tracking-wide">BPO Financeiro</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Terceirização financeira inteligente com emissão de NF-se e conciliação de contas a pagar e receber integradas no sistema.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="como-funciona" className="py-24 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h3 className="text-xs font-black text-[#2563EB] uppercase tracking-[0.25em]">Transição Descomplicada</h3>
            <h2 className="text-3xl md:text-4xl font-black text-[#2C4156] uppercase tracking-tight">
              Mudar para a Prosperare é muito simples
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            
            {/* Step 1 */}
            <div className="space-y-4 text-center md:text-left relative">
              <div className="text-5xl font-black text-blue-600/10 leading-none">01</div>
              <h4 className="text-base font-black text-[#2C4156] uppercase">Faça o seu cadastro</h4>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Preencha os dados da sua empresa ou inicie a criação do seu CNPJ conosco de forma 100% gratuita.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 text-center md:text-left relative">
              <div className="text-5xl font-black text-blue-600/10 leading-none">02</div>
              <h4 className="text-base font-black text-[#2C4156] uppercase">Nós cuidamos da migração</h4>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Cuidamos de todo o processo de transferência com o seu antigo contador sem custos operacionais adicionais.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 text-center md:text-left relative">
              <div className="text-5xl font-black text-blue-600/10 leading-none">03</div>
              <h4 className="text-base font-black text-[#2C4156] uppercase">Opere em alto nível</h4>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Comece a utilizar o Prosperare Flow para acompanhar impostos, gerenciar colaboradores e interagir com o suporte.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* PLANS SECTION */}
      <section id="planos" className="py-24 bg-white border-t border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h3 className="text-xs font-black text-[#2563EB] uppercase tracking-[0.25em]">Preço Justo e Transparente</h3>
            <h2 className="text-3xl md:text-4xl font-black text-[#2C4156] uppercase tracking-tight">
              Planos que crescem com o seu negócio
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-semibold leading-relaxed">
              Planos mensais sem taxas de adesão ou fidelidade surpresa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Plan 1 */}
            <div className="bg-[#F7F7F7] border border-slate-200/80 p-8 rounded-3xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-[#2C4156] uppercase tracking-wide">Plano MEI</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Ideal para microempreendedores individuais</p>
                </div>
                <div className="flex items-baseline text-[#2C4156]">
                  <span className="text-lg font-bold">R$</span>
                  <span className="text-4xl font-black">89</span>
                  <span className="text-slate-400 text-xs font-bold">/mês</span>
                </div>
                <ul className="space-y-3 pt-4 border-t border-slate-200/60">
                  <li className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" /> Emissão de guias DAS MEI
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" /> Declaração anual (DASN-SIMEI)
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" /> Emissão de Notas Fiscais
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" /> Suporte via WhatsApp
                  </li>
                </ul>
              </div>
              <Button onClick={handleWhatsAppRedirect} className="w-full h-11 bg-white hover:bg-slate-50 text-[#2C4156] border-2 border-slate-200/80 font-bold text-xs uppercase tracking-wider rounded-xl transition-all">
                Contratar MEI
              </Button>
            </div>

            {/* Plan 2 - Recommended */}
            <div className="bg-[#2C4156] text-white p-8 rounded-3xl space-y-6 flex flex-col justify-between shadow-2xl relative border-2 border-[#2563EB]/40 transform md:-translate-y-2">
              <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-[#2563EB] text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                Mais Popular
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-lg font-black uppercase tracking-wide">Plano Pro</h4>
                  <p className="text-[10px] text-white/50 font-bold uppercase">Empresas do Simples Nacional ou Presumido</p>
                </div>
                <div className="flex items-baseline text-white">
                  <span className="text-lg font-bold">R$</span>
                  <span className="text-4xl font-black">249</span>
                  <span className="text-white/50 text-xs font-bold">/mês</span>
                </div>
                <ul className="space-y-3 pt-4 border-t border-white/10">
                  <li className="flex items-center gap-2.5 text-xs text-white/80 font-medium">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" /> Contabilidade Completa
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-white/80 font-medium">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" /> Emissão de guias e impostos mensais
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-white/80 font-medium">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" /> Pró-labore de até 2 sócios
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-white/80 font-medium">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" /> Acesso ao Prosperare Flow
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-white/80 font-medium">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" /> Consultor fiscal dedicado
                  </li>
                </ul>
              </div>
              <Button onClick={handleWhatsAppRedirect} className="w-full h-11 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-600/20 border-none">
                Contratar Pro
              </Button>
            </div>

            {/* Plan 3 */}
            <div className="bg-[#F7F7F7] border border-slate-200/80 p-8 rounded-3xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-[#2C4156] uppercase tracking-wide">Plano VIP / BPO</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Gestão contábil e terceirização financeira</p>
                </div>
                <div className="flex items-baseline text-[#2C4156]">
                  <span className="text-lg font-bold">R$</span>
                  <span className="text-4xl font-black">499</span>
                  <span className="text-slate-400 text-xs font-bold">/mês</span>
                </div>
                <ul className="space-y-3 pt-4 border-t border-slate-200/60">
                  <li className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" /> Tudo incluso no plano PRO
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" /> Gestão de Contas a Pagar/Receber
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" /> Faturamento e emissão de notas
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" /> Conciliação bancária diária
                  </li>
                  <li className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" /> Relatórios gerenciais e DRE
                  </li>
                </ul>
              </div>
              <Button onClick={handleWhatsAppRedirect} className="w-full h-11 bg-white hover:bg-slate-50 text-[#2C4156] border-2 border-slate-200/80 font-bold text-xs uppercase tracking-wider rounded-xl transition-all">
                Contratar VIP
              </Button>
            </div>

          </div>

        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-[#2C4156] text-white rounded-3xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden shadow-2xl border border-white/5">
            
            {/* Background highlights */}
            <div className="absolute inset-0 bg-[#2563EB]/5 rounded-3xl blur-[40px] pointer-events-none transform translate-y-12" />

            <h3 className="text-xs font-black text-[#2563EB] uppercase tracking-[0.2em]">Fale com um Especialista</h3>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight max-w-2xl mx-auto leading-tight">
              Pronto para evoluir a gestão da sua empresa?
            </h2>
            <p className="text-xs text-white/60 font-medium max-w-md mx-auto leading-relaxed">
              Converse com a nossa equipe de contadores no WhatsApp e tire todas as suas dúvidas agora mesmo.
            </p>
            
            <div className="pt-4 flex justify-center">
              <Button 
                onClick={handleWhatsAppRedirect}
                className="bg-[#2563EB] hover:bg-[#2563EB]/95 text-white font-black text-xs uppercase tracking-widest px-10 h-13 rounded-xl gap-2.5 transition-all shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20"
              >
                <Phone className="h-4 w-4" /> Iniciar conversa no WhatsApp
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#2563EB] rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-black text-white uppercase tracking-wider">
                PROSPERARE <span className="text-[#2563EB]">FLOW</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              Contabilidade digital inteligente de alta performance. Descomplicamos a sua rotina contábil para você focar no que importa.
            </p>
          </div>

          <div>
            <h5 className="text-[10px] font-black uppercase text-white tracking-widest mb-4">Serviços</h5>
            <ul className="space-y-2 text-[10px] font-bold uppercase tracking-wider">
              <li><a href="#diferenciais" className="hover:text-white transition-colors">Contabilidade Digital</a></li>
              <li><a href="#diferenciais" className="hover:text-white transition-colors">Abertura de Empresas</a></li>
              <li><a href="#diferenciais" className="hover:text-white transition-colors">Gestão de DP</a></li>
              <li><a href="#diferenciais" className="hover:text-white transition-colors">BPO Financeiro</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-[10px] font-black uppercase text-white tracking-widest mb-4">Navegação</h5>
            <ul className="space-y-2 text-[10px] font-bold uppercase tracking-wider">
              <li><a href="#diferenciais" className="hover:text-white transition-colors">Diferenciais</a></li>
              <li><a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
              <li><a href="#planos" className="hover:text-white transition-colors">Planos e Preços</a></li>
              <li><a href="/login" className="hover:text-white transition-colors">Portal do Cliente</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-[10px] font-black uppercase text-white tracking-widest mb-4">Segurança & Legal</h5>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
              <p className="text-[9px] font-black uppercase text-white leading-none">Ambiente Criptografado</p>
              <p className="text-[8px] text-slate-500 leading-tight">Os dados trafegados nesta plataforma cumprem integralmente as diretrizes de segurança de criptografia SSL/TLS e regras da LGPD.</p>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 mt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-[9px] font-bold uppercase text-slate-500 tracking-wider">
          <span>Prosperare Flow © 2026 — Todos os direitos reservados.</span>
          <span>Desenvolvido com tecnologia Prosperare Cloud.</span>
        </div>
      </footer>

    </div>
  )
}
