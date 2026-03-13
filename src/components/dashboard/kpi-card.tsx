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
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  destructive: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  warning: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  info: "bg-chart-3/10 text-chart-3 border-chart-3/20",
};

export function KpiCard({ label, value, icon: Icon, trend, color = "primary", className, onClick }: KpiCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200 border-l-4",
        color === "primary" && "border-l-primary",
        color === "success" && "border-l-chart-1",
        color === "destructive" && "border-l-chart-4",
        color === "warning" && "border-l-chart-2",
        color === "info" && "border-l-chart-3",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                {trend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-chart-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-chart-4" />
                )}
                <span className={cn("text-xs font-medium", trend > 0 ? "text-chart-1" : "text-chart-4")}>
                  {Math.abs(trend)}% vs mês anterior
                </span>
              </div>
            )}
          </div>
          <div className={cn("p-2.5 rounded-lg border", colorMap[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
