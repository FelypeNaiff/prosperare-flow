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
  ChevronDown,
  UserCheck,
  FileSignature,
  Globe,
  Search,
  Building2,
  Instagram,
  Target,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function LandingPage() {
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [calculadorasOpen, setCalculadorasOpen] = useState(false)
  const [linksMenuOpen, setLinksMenuOpen] = useState(false)
  const [mobileCalculadorasOpen, setMobileCalculadorasOpen] = useState(false)
  const [mobileLinksOpen, setMobileLinksOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLoginRedirect = () => {
    router.push("/login")
  }

  const handleWhatsAppRedirect = () => {
    window.open("https://wa.me/5596981296544", "_blank")
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
            <span className="text-sm md:text-base font-black tracking-tighter text-[#2C4156] uppercase flex flex-col leading-none">
              <span>PROSPERARE</span>
              <span className="text-[9px] text-[#2563EB] font-bold tracking-widest mt-0.5">Serviços Contábeis</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#sobre-nos" className="text-sm font-bold text-slate-500 hover:text-[#2563EB] uppercase tracking-wider transition-colors">Sobre Nós</a>
            <a href="#servicos" className="text-sm font-bold text-slate-500 hover:text-[#2563EB] uppercase tracking-wider transition-colors">Serviços</a>
            <a href="#como-funciona" className="text-sm font-bold text-slate-500 hover:text-[#2563EB] uppercase tracking-wider transition-colors">Como Funciona</a>
            
            {/* Calculadoras Dropdown */}
            <div 
              className="relative py-2"
              onMouseEnter={() => setCalculadorasOpen(true)}
              onMouseLeave={() => setCalculadorasOpen(false)}
            >
              <button 
                onClick={() => setCalculadorasOpen(!calculadorasOpen)}
                className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[#2563EB] uppercase tracking-wider transition-colors focus:outline-none"
              >
                Calculadoras
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", calculadorasOpen && "transform rotate-180")} />
              </button>

              {/* Dropdown container */}
              <div 
                className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[320px] bg-white border border-slate-200/60 rounded-2xl shadow-xl p-4 transition-all duration-200 origin-top z-50",
                  calculadorasOpen 
                    ? "opacity-100 translate-y-0 pointer-events-auto scale-100" 
                    : "opacity-0 -translate-y-2 pointer-events-none scale-95"
                )}
              >
                <ul className="space-y-1 text-left">
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
            </div>

            {/* Links Dropdown */}
            <div 
              className="relative py-2"
              onMouseEnter={() => setLinksMenuOpen(true)}
              onMouseLeave={() => setLinksMenuOpen(false)}
            >
              <button 
                onClick={() => setLinksMenuOpen(!linksMenuOpen)}
                className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[#2563EB] uppercase tracking-wider transition-colors focus:outline-none"
              >
                Links
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", linksMenuOpen && "transform rotate-180")} />
              </button>

              {/* Dropdown container */}
              <div 
                className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[240px] bg-white border border-slate-200/60 rounded-2xl shadow-xl p-4 transition-all duration-200 origin-top z-50",
                  linksMenuOpen 
                    ? "opacity-100 translate-y-0 pointer-events-auto scale-100" 
                    : "opacity-0 -translate-y-2 pointer-events-none scale-95"
                )}
              >
                <ul className="space-y-1 text-left">
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
                href="#sobre-nos" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-black text-slate-500 hover:text-[#2563EB] uppercase tracking-wider"
              >
                Sobre Nós
              </a>
              <a 
                href="#servicos" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-black text-slate-500 hover:text-[#2563EB] uppercase tracking-wider"
              >
                Serviços
              </a>
              <a 
                href="#como-funciona" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-black text-slate-500 hover:text-[#2563EB] uppercase tracking-wider"
              >
                Como Funciona
              </a>
              
              {/* Mobile Calculadoras Dropdown */}
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setMobileCalculadorasOpen(!mobileCalculadorasOpen)}
                  className="flex items-center justify-between text-xs font-black text-slate-500 hover:text-[#2563EB] uppercase tracking-wider w-full text-left"
                >
                  <span>Calculadoras</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", mobileCalculadorasOpen && "transform rotate-180")} />
                </button>
                
                {mobileCalculadorasOpen && (
                  <div className="pl-4 space-y-2 border-l border-slate-200 mt-2 animate-in slide-in-from-top-2 duration-200 flex flex-col gap-2">
                    <a href="/calculadoras/custo-para-abrir-cnpj" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Calculadora de Custo para abrir CNPJ</a>
                    <a href="/calculadoras/pj-x-clt" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Calculadora PJ x CLT</a>
                    <a href="/calculadoras/fator-r" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Calculadora de Fator R</a>
                    <a href="/calculadoras/rpa-online" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Calculadora de RPA online</a>
                    <a href="/calculadoras/reforma-tributaria" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Calculadora de Reforma Tributária</a>
                  </div>
                )}
              </div>

              {/* Mobile Links Dropdown */}
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setMobileLinksOpen(!mobileLinksOpen)}
                  className="flex items-center justify-between text-xs font-black text-slate-500 hover:text-[#2563EB] uppercase tracking-wider w-full text-left"
                >
                  <span>Links</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", mobileLinksOpen && "transform rotate-180")} />
                </button>
                
                {mobileLinksOpen && (
                  <div className="pl-4 space-y-2 border-l border-slate-200 mt-2 animate-in slide-in-from-top-2 duration-200 flex flex-col gap-2">
                    <a href="/blog/abertura-de-empresa" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Abertura de Empresa</a>
                    <a href="/blog/simples-nacional" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Simples Nacional</a>
                    <a href="/blog/comparativo-clt-x-pj" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Comparativo CLT x PJ</a>
                    <a href="/blog/tabela-simples-nacional" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Tabela Simples Nacional</a>
                    <a href="/blog/ebook-guia-para-ser-pj" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-semibold text-slate-500 hover:text-[#2563EB]">Ebook: Guia para ser PJ</a>
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
              <Button 
                onClick={handleWhatsAppRedirect}
                className="w-full sm:w-auto h-12 bg-[#2563EB] hover:bg-[#2563EB]/95 text-white font-black text-xs uppercase tracking-widest px-8 rounded-xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition-all duration-300"
              >
                Solicitar Orçamento
              </Button>
              <a href="#sobre-nos">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto h-12 border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest px-8 rounded-xl gap-2 transition-all"
                >
                  Sobre Nós
                </Button>
              </a>
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

      {/* INSTITUTIONAL / SOBRE NÓS SECTION */}
      <section id="sobre-nos" className="py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-12 space-y-6 text-center max-w-3xl mx-auto">
              <h3 className="text-xs font-black text-[#2563EB] uppercase tracking-[0.25em]">Sobre a Prosperare</h3>
              <h2 className="text-3xl md:text-4xl font-black text-[#2C4156] uppercase tracking-tight">
                Tradição, Tecnologia e Estratégia
              </h2>
              <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
                Com 10 anos de sólida atuação no mercado, a Prosperare Serviços Contábeis nasceu com o propósito de transformar a contabilidade em uma ferramenta estratégica para o crescimento dos negócios. Unimos a experiência de uma década com o que há de mais moderno em tecnologia, entregando inteligência financeira e segurança jurídica.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Missão */}
            <div className="bg-[#F7F7F7] border border-slate-200/60 p-8 rounded-2xl space-y-4 hover:shadow-lg transition-all duration-300">
              <div className="p-3 bg-[#2563EB]/10 text-[#2563EB] rounded-xl w-fit">
                <Target className="h-6 w-6" />
              </div>
              <h4 className="text-base font-black text-[#2C4156] uppercase tracking-wide">Missão</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Fornecer soluções contábeis e consultivas de excelência, simplificando a burocracia e garantindo segurança tributária.
              </p>
            </div>

            {/* Visão */}
            <div className="bg-[#F7F7F7] border border-slate-200/60 p-8 rounded-2xl space-y-4 hover:shadow-lg transition-all duration-300">
              <div className="p-3 bg-[#2563EB]/10 text-[#2563EB] rounded-xl w-fit">
                <Eye className="h-6 w-6" />
              </div>
              <h4 className="text-base font-black text-[#2C4156] uppercase tracking-wide">Visão</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Ser referência no Amapá e região Norte, reconhecido pela inovação tecnológica e parceria estratégica.
              </p>
            </div>

            {/* Valores */}
            <div className="bg-[#F7F7F7] border border-slate-200/60 p-8 rounded-2xl space-y-4 hover:shadow-lg transition-all duration-300">
              <div className="p-3 bg-[#2563EB]/10 text-[#2563EB] rounded-xl w-fit">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h4 className="text-base font-black text-[#2C4156] uppercase tracking-wide">Valores</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Ética, Inovação, Foco no Cliente, Transparência e Excelência Técnica.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="servicos" className="py-24 bg-[#F7F7F7] border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h3 className="text-xs font-black text-[#2563EB] uppercase tracking-[0.25em]">Nossas Soluções</h3>
            <h2 className="text-3xl md:text-4xl font-black text-[#2C4156] uppercase tracking-tight">
              Serviços Contábeis Especializados
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
              Oferecemos soluções contábeis completas para simplificar a gestão da sua empresa e impulsionar seus resultados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Service 1 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-2xl space-y-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
              <div className="p-3 bg-[#2563EB]/10 text-[#2563EB] rounded-xl w-fit group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-black text-[#2C4156] uppercase tracking-wide">Contabilidade Consultiva</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Contabilidade consultiva estratégica focada no crescimento e na saúde financeira do seu negócio.
              </p>
            </div>

            {/* Service 2 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-2xl space-y-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
              <div className="p-3 bg-[#2563EB]/10 text-[#2563EB] rounded-xl w-fit group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-black text-[#2C4156] uppercase tracking-wide">Gestão de DP e RH</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Admissões, folha de pagamento, férias e total conformidade com a legislação trabalhista.
              </p>
            </div>

            {/* Service 3 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-2xl space-y-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
              <div className="p-3 bg-[#2563EB]/10 text-[#2563EB] rounded-xl w-fit group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
                <FileText className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-black text-[#2C4156] uppercase tracking-wide">Gestão Tributária</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Planejamento tributário inteligente para otimizar impostos e garantir total segurança fiscal.
              </p>
            </div>

            {/* Service 4 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-2xl space-y-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
              <div className="p-3 bg-[#2563EB]/10 text-[#2563EB] rounded-xl w-fit group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
                <Building2 className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-black text-[#2C4156] uppercase tracking-wide">Processos e Legalização</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Constituição, alteração contratual, baixa de empresas e emissão de licenças regulamentares.
              </p>
            </div>

            {/* Service 5 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-2xl space-y-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
              <div className="p-3 bg-[#2563EB]/10 text-[#2563EB] rounded-xl w-fit group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
                <Globe className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-black text-[#2C4156] uppercase tracking-wide">Suframa</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Assessoria completa para habilitação, internamento de mercadorias e benefícios da Suframa.
              </p>
            </div>

            {/* Service 6 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-2xl space-y-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
              <div className="p-3 bg-[#2563EB]/10 text-[#2563EB] rounded-xl w-fit group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
                <Search className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-black text-[#2C4156] uppercase tracking-wide">Auditoria e Perícia</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Exame detalhado de demonstrações contábeis e laudos periciais com rigor técnico.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="como-funciona" className="py-24 bg-white border-t border-slate-200/80">
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

      {/* WHATSAPP BUDGET CTA SECTION */}
      <section className="py-24 bg-[#F7F7F7] border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-[#2C4156] text-white rounded-3xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden shadow-2xl border border-white/5">
            
            {/* Background highlights */}
            <div className="absolute inset-0 bg-[#2563EB]/5 rounded-3xl blur-[40px] pointer-events-none transform translate-y-12" />

            <h3 className="text-xs font-black text-[#2563EB] uppercase tracking-[0.2em]">Fale com um Especialista</h3>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight max-w-2xl mx-auto leading-tight">
              Pronto para transformar a gestão da sua empresa? Fale com nossos especialistas e receba uma proposta personalizada.
            </h2>
            
            <div className="pt-4 flex justify-center">
              <Button 
                onClick={handleWhatsAppRedirect}
                className="bg-[#2563EB] hover:bg-[#2563EB]/95 text-white font-black text-xs uppercase tracking-widest px-10 h-13 rounded-xl gap-2.5 transition-all shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20"
              >
                <Phone className="h-4 w-4" /> Solicitar Orçamento via WhatsApp
              </Button>
            </div>

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
              <li><a href="#servicos" className="hover:text-white transition-colors">Contabilidade Consultiva</a></li>
              <li><a href="#servicos" className="hover:text-white transition-colors">Gestão de DP e RH</a></li>
              <li><a href="#servicos" className="hover:text-white transition-colors">Gestão Tributária</a></li>
              <li><a href="#servicos" className="hover:text-white transition-colors">Processos e Legalização</a></li>
              <li><a href="#servicos" className="hover:text-white transition-colors">Suframa</a></li>
              <li><a href="#servicos" className="hover:text-white transition-colors">Auditoria e Perícia</a></li>
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
              <li><a href="#sobre-nos" className="hover:text-white transition-colors">Sobre Nós</a></li>
              <li><a href="#servicos" className="hover:text-white transition-colors">Serviços</a></li>
              <li><a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
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
