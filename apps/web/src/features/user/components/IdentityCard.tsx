import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, Weight, Activity, Award } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IdentityCardProps {
    name: string;
    email: string;
    createdAt: string;
    totalSessions: number;
    lifetimeVolume: number;
    totalPRs: number;
}

export const IdentityCard = ({ name, email, createdAt, totalSessions, lifetimeVolume, totalPRs }: IdentityCardProps) => {
    return (
        <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold">{name || "Atleta"}</CardTitle>
                        <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            Membro desde
                        </div>
                        <p className="text-sm font-medium">
                            {format(new Date(createdAt), "MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase font-semibold">
                            <Activity className="w-3.5 h-3.5" />
                            Total de Sessões
                        </div>
                        <p className="text-sm font-bold">{totalSessions}</p>
                    </div>

                    <div className="flex flex-col gap-1 pt-2 border-t">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase font-semibold">
                            <Award className="w-3.5 h-3.5" />
                            Recordes (PRs)
                        </div>
                        <p className="text-2xl font-black text-primary">
                            {totalPRs}
                        </p>
                    </div>

                    <div className="flex flex-col gap-1 pt-2 border-t">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase font-semibold">
                            <Weight className="w-3.5 h-3.5" />
                            Volume Total
                        </div>
                        <p className="text-2xl font-black text-primary">
                            {lifetimeVolume.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">kg</span>
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
