'use client';

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  const { selectedUser, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && selectedUser) {
      const isMaster = selectedUser.profile === "SÓCIO" || selectedUser.profile === "ADMINISTRADOR";
      const hasFinanceiro = (selectedUser.departmentIds || []).some((d: string) => d.toUpperCase() === "FINANCEIRO");

      if (!isMaster && !hasFinanceiro) {
        router.push("/dashboard");
      }
    }
  }, [selectedUser, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F7F8]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1FA67A]"></div>
          <p className="text-[#39586D] font-bold text-sm uppercase tracking-wider animate-pulse">Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  if (selectedUser) {
    const isMaster = selectedUser.profile === "SÓCIO" || selectedUser.profile === "ADMINISTRADOR";
    const hasFinanceiro = (selectedUser.departmentIds || []).some((d: string) => d.toUpperCase() === "FINANCEIRO");
    
    if (!isMaster && !hasFinanceiro) {
      return null;
    }
  }

  return <>{children}</>;
}
