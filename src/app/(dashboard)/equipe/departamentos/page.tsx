
"use client"

import { DepartmentManagement } from "@/components/team/department-management"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function DepartamentosPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Departamentos</h1>
          <p className="text-[#98A7AA] font-medium">Gerencie a estrutura organizacional do escritório.</p>
        </div>
      </div>
      <DepartmentManagement />
    </div>
  )
}
