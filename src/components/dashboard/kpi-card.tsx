import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  color?: "primary" | "success" | "destructive" | "warning" | "info";
  className?: string;
  onClick?: () => void;
}

const colorMap = {
  primary: "bg-[#2C4156]/10 text-[#2C4156] border-[#2C4156]/20",
  success: "bg-[#1FA67A]/10 text-[#1FA67A] border-[#1FA67A]/20",
  destructive: "bg-[#E74C3C]/10 text-[#E74C3C] border-[#E74C3C]/20",
  warning: "bg-[#F2B705]/10 text-[#F2B705] border-[#F2B705]/20",
  info: "bg-[#2574A9]/10 text-[#2574A9] border-[#2574A9]/20",
};

const borderMap = {
  primary: "border-l-[#2C4156]",
  success: "border-l-[#1FA67A]",
  destructive: "border-l-[#E74C3C]",
  warning: "border-l-[#F2B705]",
  info: "border-l-[#2574A9]",
};

/**
 * Componente memoizado para evitar re-renderizações desnecessárias em dashboards densos.
 */
export const KpiCard = memo(function KpiCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  color = "primary", 
  className, 
  onClick 
}: KpiCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 bg-white",
        borderMap[color],
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">{label}</p>
            <h3 className="text-2xl font-black tracking-tight text-[#2C4156]">{value}</h3>
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                {trend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-[#1FA67A]" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-[#E74C3C]" />
                )}
                <span className={cn("text-[9px] font-black uppercase", trend > 0 ? "text-[#1FA67A]" : "text-[#E74C3C]")}>
                  {Math.abs(trend)}% vs mês anterior
                </span>
              </div>
            )}
          </div>
          <div className={cn("p-2.5 rounded-xl border", colorMap[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
