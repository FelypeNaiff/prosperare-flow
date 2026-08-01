"use client"

import { useState, useMemo } from "react"
import { 
  Search, 
  Printer, 
  Eye, 
  EyeOff, 
  Copy, 
  ChevronDown, 
  ChevronRight, 
  Lock, 
  ExternalLink, 
  Globe, 
  ShieldCheck, 
  Loader2,
  Plus,
  Pencil,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  useUser,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking
} from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

export default function CofreSenhasPage() {
  const { userData, isUserLoading } = useUser()
  const firestore = useFirestore()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({})
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  // Modal / CRUD state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccess, setEditingAccess] = useState<any>(null)
  const [newPassVisible, setNewPassVisible] = useState(false)
  const [formData, setFormData] = useState({
    clientId: "",
    site: "",
    url: "",
    login: "",
    pass: ""
  })

  // Fetch clients
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [], isLoading: isClientsLoading } = useCollection(clientsQuery)

  // Fetch accesses
  const accessesQuery = useMemoFirebase(() => collection(firestore, "clientAccesses"), [firestore])
  const { data: accesses = [], isLoading: isAccessesLoading } = useCollection(accessesQuery)

  const isRestricted = userData?.profile === 'ASSISTENTE'

  const sortedClients = useMemo(() => {
    const lower = searchTerm.toLowerCase()
    return (clients || []).filter((c: any) => 
      c.corporateName?.toLowerCase().includes(lower) || 
      c.cnpj?.includes(searchTerm)
    ).sort((a: any, b: any) => 
      (a.corporateName || "").localeCompare(b.corporateName || "")
    )
  }, [clients, searchTerm])

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }))
  }

  const togglePassword = (accessId: string) => {
    if (isRestricted) {
      toast({
        title: "Acesso Negado",
        description: "Assistentes não possuem permissão para visualizar senhas.",
        variant: "destructive"
      })
      return
    }
    setVisiblePasswords(prev => ({
      ...prev,
      [accessId]: !prev[accessId]
    }))
  }

  const copyToClipboard = (text: string, label: string) => {
    if (isRestricted) {
      toast({
        title: "Acesso Negado",
        description: "Assistentes não possuem permissão para copiar senhas.",
        variant: "destructive"
      })
      return
    }
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`
    })
  }

  const handlePrint = () => {
    window.print()
  }

  // Open Modal for Create Mode
  const handleNewAccess = () => {
    if (isRestricted) {
      toast({
        title: "Acesso Negado",
        description: "Assistentes não podem cadastrar novos acessos.",
        variant: "destructive"
      })
      return
    }
    setEditingAccess(null)
    setNewPassVisible(false)
    setFormData({
      clientId: "",
      site: "",
      url: "",
      login: "",
      pass: ""
    })
    setIsModalOpen(true)
  }

  // Open Modal for Edit Mode
  const handleEditAccess = (access: any) => {
    if (isRestricted) {
      toast({
        title: "Acesso Negado",
        description: "Assistentes não podem editar acessos.",
        variant: "destructive"
      })
      return
    }
    setEditingAccess(access)
    setNewPassVisible(false)
    setFormData({
      clientId: access.clientId || "",
      site: access.site || "",
      url: access.url || "",
      login: access.login || "",
      pass: access.pass || ""
    })
    setIsModalOpen(true)
  }

  // Firestore Save Action
  const handleSaveAccess = () => {
    if (!formData.clientId || !formData.site || !formData.login || !formData.pass) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      })
      return
    }

    const accessId = editingAccess?.id || Math.random().toString(36).substr(2, 9)
    const docRef = doc(firestore, "clientAccesses", accessId)

    setDocumentNonBlocking(docRef, {
      ...formData,
      id: accessId,
      createdAt: editingAccess?.createdAt || new Date().toISOString()
    }, { merge: true })

    setIsModalOpen(false)
    toast({
      title: editingAccess ? "Acesso Atualizado!" : "Acesso Criado!",
      description: "As credenciais foram armazenadas de forma segura."
    })
  }

  // Firestore Delete Action
  const handleDeleteAccess = (accessId: string) => {
    if (isRestricted) {
      toast({
        title: "Acesso Negado",
        description: "Assistentes não podem excluir acessos.",
        variant: "destructive"
      })
      return
    }
    if (confirm("Tem certeza que deseja excluir esta credencial do cofre?")) {
      const docRef = doc(firestore, "clientAccesses", accessId)
      deleteDocumentNonBlocking(docRef)
      toast({
        title: "Acesso Excluído",
        description: "A credencial foi removida com sucesso."
      })
    }
  }

  if (isUserLoading || isClientsLoading || isAccessesLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-slate-500 font-medium text-sm">Carregando Cofre de Senhas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 print-container bg-slate-50 min-h-screen">
      {/* Print-specific Stylesheet */}
      <style>{`
        @media print {
          /* Hide sidebar, header, buttons, inputs, and all other non-essential elements */
          aside, header, nav, button, input, .no-print, .action-col {
            display: none !important;
          }
          main, .print-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: white !important;
          }
          /* Force printable accordion sections to display open */
          .print-accordion-content {
            display: block !important;
            opacity: 1 !important;
            height: auto !important;
            visibility: visible !important;
          }
          /* Prevent cards splitting across pages */
          .print-card {
            page-break-inside: avoid !important;
            border: 1px solid #e2e8f0 !important;
            margin-bottom: 1.5rem !important;
            background: white !important;
          }
        }
      `}</style>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-800">Cofre de Senhas</h1>
          <p className="text-slate-500 font-medium text-sm">Gerenciamento seguro e centralizado dos acessos dos clientes.</p>
        </div>
        <div className="flex items-center gap-2">
          {!isRestricted && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11 px-6 shadow-sm font-semibold transition-colors"
              onClick={handleNewAccess}
            >
              <Plus className="h-4 w-4" /> Novo Acesso
            </Button>
          )}
          <Button 
            variant="outline" 
            className="border-slate-300 text-slate-700 hover:bg-slate-100 gap-2 h-11 px-6 shadow-sm font-semibold"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" /> Imprimir Relatório
          </Button>
        </div>
      </div>

      {/* Protocol Banner */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 no-print">
        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-semibold text-emerald-800">Protocolo de Segurança Prosperare</h4>
          <p className="text-emerald-700 text-xs font-medium mt-0.5">
            Este ambiente é criptografado. Cada ação de visualização ou cópia de senhas é monitorada e registrada nos logs de auditoria do sistema.
          </p>
        </div>
      </div>

      {/* Search Filter Card */}
      <Card className="border-slate-200 shadow-sm no-print">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por cliente ou CNPJ..." 
              className="pl-10 h-12 bg-white border-slate-200 focus-visible:ring-blue-600 font-medium text-slate-700" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Accordion List */}
      <div className="space-y-3">
        {sortedClients.length > 0 ? (
          sortedClients.map((client: any) => {
            const clientAccesses = (accesses || []).filter((acc: any) => acc.clientId === client.id)
            const isExpanded = !!expandedClients[client.id]

            return (
              <Card key={client.id} className="border-slate-200 shadow-sm print-card overflow-hidden bg-white">
                {/* Header row clicking will toggle open */}
                <div 
                  className={cn(
                    "flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors select-none",
                    isExpanded && "border-b border-slate-100"
                  )}
                  onClick={() => toggleClient(client.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="no-print">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 text-sm">{client.corporateName}</span>
                      <span className="text-[10px] text-slate-400 font-mono tracking-wide mt-0.5">{client.cnpj}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-500 bg-slate-50">
                      {clientAccesses.length} {clientAccesses.length === 1 ? 'acesso' : 'acessos'}
                    </Badge>
                  </div>
                </div>

                {/* Expanded Details Section */}
                <div className={cn(
                  "hidden print-accordion-content",
                  isExpanded && "block"
                )}>
                  <div className="p-5 bg-white border-t border-slate-50 space-y-4">
                    {clientAccesses.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {clientAccesses.map((access: any) => {
                          const isPassVisible = !!visiblePasswords[access.id]
                          return (
                            <div 
                              key={access.id} 
                              className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                                  <Globe className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700 text-xs">{access.site}</span>
                                    {access.url && (
                                      <a 
                                        href={access.url} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="text-slate-400 hover:text-blue-600 transition-colors no-print"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono truncate block max-w-[200px] mt-0.5">{access.url || "URL não informada"}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 max-w-xl">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-medium text-slate-400">Login / Usuário</span>
                                  <div className="flex items-center gap-1.5">
                                    <Input 
                                      readOnly 
                                      value={access.login} 
                                      className="h-9 text-xs bg-slate-50 border-slate-200 text-slate-700 font-medium"
                                    />
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-slate-50 shrink-0 no-print"
                                      title="Copiar Usuário"
                                      onClick={() => copyToClipboard(access.login, 'Usuário')}
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-medium text-slate-400">Senha</span>
                                  <div className="flex items-center gap-1.5">
                                    <div className="relative flex-1">
                                      <Input 
                                        readOnly 
                                        type={isPassVisible && !isRestricted ? "text" : "password"} 
                                        value={isRestricted ? "••••••••" : access.pass} 
                                        className="h-9 pr-9 text-xs bg-slate-50 border-slate-200 text-slate-700 font-mono"
                                      />
                                      {isRestricted ? (
                                        <div className="absolute right-2.5 top-2 text-slate-400 no-print" title="Acesso restrito">
                                          <Lock className="h-4 w-4" />
                                        </div>
                                      ) : (
                                        <button 
                                          type="button"
                                          onClick={() => togglePassword(access.id)}
                                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 no-print"
                                        >
                                          {isPassVisible ? (
                                            <EyeOff className="h-4 w-4" />
                                          ) : (
                                            <Eye className="h-4 w-4" />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-slate-50 shrink-0 no-print"
                                      title="Copiar Senha"
                                      disabled={isRestricted}
                                      onClick={() => copyToClipboard(access.pass, 'Senha')}
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {!isRestricted && (
                                <div className="flex items-center gap-1.5 no-print shrink-0 border-l border-slate-100 pl-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    title="Editar Acesso"
                                    onClick={() => handleEditAccess(access)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Excluir Acesso"
                                    onClick={() => handleDeleteAccess(access.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs font-medium py-2">Nenhum acesso cadastrado para esta empresa.</p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold uppercase tracking-widest border-2 border-dashed rounded-xl bg-white border-slate-200 no-print">
            Nenhum cliente localizado para esta busca.
          </div>
        )}
      </div>

      {/* Modal Dialog for Create/Edit CRUD operations */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white border border-slate-200 rounded-2xl shadow-xl p-6">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <DialogTitle className="text-slate-800 font-semibold text-lg">
              {editingAccess ? "Editar Acesso Seguro" : "Cadastrar Novo Acesso"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">Cliente (Empresa) *</Label>
              <Select 
                value={formData.clientId} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, clientId: val }))}
                disabled={!!editingAccess}
              >
                <SelectTrigger className="w-full bg-white border-slate-200 text-xs text-slate-700 h-10">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200">
                  {(clients || []).map((client: any) => (
                    <SelectItem key={client.id} value={client.id} className="text-xs text-slate-700">
                      {client.corporateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">Nome do Portal / Sistema *</Label>
              <Input 
                placeholder="Ex: e-CAC, Calima, Prefeitura..." 
                value={formData.site} 
                onChange={(e) => setFormData(prev => ({ ...prev, site: e.target.value }))}
                className="h-10 text-xs bg-white border-slate-200 focus-visible:ring-blue-600 font-medium text-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">URL do Portal (Opcional)</Label>
              <Input 
                placeholder="https://..." 
                value={formData.url} 
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="h-10 text-xs bg-white border-slate-200 focus-visible:ring-blue-600 font-medium text-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">Login / Usuário *</Label>
              <Input 
                placeholder="Digite o login ou e-mail" 
                value={formData.login} 
                onChange={(e) => setFormData(prev => ({ ...prev, login: e.target.value }))}
                className="h-10 text-xs bg-white border-slate-200 focus-visible:ring-blue-600 font-medium text-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500">Senha *</Label>
              <div className="relative">
                <Input 
                  type={newPassVisible ? "text" : "password"} 
                  placeholder="Digite a senha" 
                  value={formData.pass} 
                  onChange={(e) => setFormData(prev => ({ ...prev, pass: e.target.value }))}
                  className="h-10 text-xs pr-10 bg-white border-slate-200 focus-visible:ring-blue-600 font-mono text-slate-700"
                />
                <button 
                  type="button"
                  onClick={() => setNewPassVisible(!newPassVisible)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {newPassVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              className="border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold h-10"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveAccess}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 px-6 transition-colors"
            >
              Salvar Acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
