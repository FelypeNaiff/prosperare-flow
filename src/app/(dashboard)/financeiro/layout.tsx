'use client';
 
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { collection } from "firebase/firestore";
 
export default function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  const { selectedUser, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const profilesQuery = useMemoFirebase(() => collection(firestore, "accessProfiles"), [firestore]);
  const { data: dbProfiles = [], isLoading: isLoadingProfiles } = useCollection(profilesQuery);
 
  useEffect(() => {
    if (!isUserLoading && !isLoadingProfiles && selectedUser) {
      const userProfileObj = (dbProfiles || []).find(p => p.name?.toUpperCase() === selectedUser.profile?.toUpperCase());
      
      let hasAccess = false;
      if (userProfileObj && userProfileObj.permissions) {
        if (userProfileObj.permissions.financeiro !== undefined) {
          hasAccess = !!userProfileObj.permissions.financeiro;
        } else {
          const profile = selectedUser.profile?.toUpperCase();
          const isMaster = profile === "SÓCIO" || profile === "ADMINISTRADOR" || profile === "CONTADOR/GESTOR";
          const hasFinanceiro = (selectedUser.departmentIds || []).some((d: string) => d.toUpperCase() === "FINANCEIRO");
          hasAccess = isMaster || hasFinanceiro;
        }
      } else {
        const profile = selectedUser.profile?.toUpperCase();
        const isMaster = profile === "SÓCIO" || profile === "ADMINISTRADOR" || profile === "CONTADOR/GESTOR";
        const hasFinanceiro = (selectedUser.departmentIds || []).some((d: string) => d.toUpperCase() === "FINANCEIRO");
        hasAccess = isMaster || hasFinanceiro;
      }

      if (!hasAccess) {
        router.push("/dashboard");
      }
    }
  }, [selectedUser, isUserLoading, dbProfiles, isLoadingProfiles, router]);
 
  if (isUserLoading || isLoadingProfiles) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F7F8]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
          <p className="text-[#39586D] font-bold text-sm uppercase tracking-wider animate-pulse">Verificando credenciais...</p>
        </div>
      </div>
    );
  }
 
  if (selectedUser) {
    const userProfileObj = (dbProfiles || []).find(p => p.name?.toUpperCase() === selectedUser.profile?.toUpperCase());
    
    let hasAccess = false;
    if (userProfileObj && userProfileObj.permissions) {
      if (userProfileObj.permissions.financeiro !== undefined) {
        hasAccess = !!userProfileObj.permissions.financeiro;
      } else {
        const profile = selectedUser.profile?.toUpperCase();
        const isMaster = profile === "SÓCIO" || profile === "ADMINISTRADOR" || profile === "CONTADOR/GESTOR";
        const hasFinanceiro = (selectedUser.departmentIds || []).some((d: string) => d.toUpperCase() === "FINANCEIRO");
        hasAccess = isMaster || hasFinanceiro;
      }
    } else {
      const profile = selectedUser.profile?.toUpperCase();
      const isMaster = profile === "SÓCIO" || profile === "ADMINISTRADOR" || profile === "CONTADOR/GESTOR";
      const hasFinanceiro = (selectedUser.departmentIds || []).some((d: string) => d.toUpperCase() === "FINANCEIRO");
      hasAccess = isMaster || hasFinanceiro;
    }
    
    if (!hasAccess) {
      return null;
    }
  }
 
  return <>{children}</>;
}
