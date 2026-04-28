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

export const IdentityCard = ({
    name,
    email,
    createdAt,
    totalSessions,
    lifetimeVolume,
    totalPRs,
}: IdentityCardProps) => {
    return (
        <div className="mx-4 mb-4 bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-[15px] font-medium text-muted-foreground">
                        {(name || "A").charAt(0).toUpperCase()}
                    </span>
                </div>
                <div className="min-w-0">
                    <p className="text-[15px] font-medium tracking-[-0.02em] text-foreground truncate">
                        {name || "Atleta"}
                    </p>
                    <p className="text-[12px] text-muted-foreground truncate">{email}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {[
                    {
                        label: "Membro desde",
                        value: format(new Date(createdAt), "MMM 'de' yyyy", { locale: ptBR }),
                    },
                    { label: "Total de sessões", value: String(totalSessions) },
                    { label: "Recordes (PRs)", value: String(totalPRs) },
                    { label: "Volume total", value: `${lifetimeVolume.toLocaleString()} kg` },
                ].map(({ label, value }) => (
                    <div key={label}>
                        <p className="text-[10px] font-medium tracking-[0.05em] uppercase
                                      text-muted-foreground mb-0.5">
                            {label}
                        </p>
                        <p className="text-[15px] font-medium tracking-[-0.02em] text-foreground">
                            {value}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
