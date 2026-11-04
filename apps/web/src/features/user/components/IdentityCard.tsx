import { formatDateCustom, formatWeight } from "@/core/utils/formatters";

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
        <section className="mx-4 mb-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3 p-4">
                <div className="size-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <span className="text-[17px] font-semibold">
                        {(name || "A").charAt(0).toUpperCase()}
                    </span>
                </div>
                <div className="min-w-0">
                    <p className="text-[17px] font-semibold tracking-[-0.02em] text-foreground truncate">
                        {name || "Atleta"}
                    </p>
                    <p className="text-[13px] text-muted-foreground truncate">
                        {email} · desde {formatDateCustom(createdAt, "MMM 'de' yyyy")}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-3 border-t border-border">
                {[
                    { label: "Sessões", value: totalSessions.toLocaleString("pt-BR") },
                    { label: "Recordes", value: totalPRs.toLocaleString("pt-BR") },
                    // Em toneladas a partir de 10 t: em um terço da largura, "216.266 kg" era cortado.
                    {
                        label: "Volume total",
                        value: lifetimeVolume >= 10000
                            ? `${(lifetimeVolume / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} t`
                            : formatWeight(lifetimeVolume),
                    },
                ].map(({ label, value }, index) => (
                    <div key={label} className={index > 0 ? "p-4 border-l border-border min-w-0" : "p-4 min-w-0"}>
                        <p className="text-[13px] text-muted-foreground truncate">{label}</p>
                        <p className="text-[17px] font-semibold tracking-[-0.02em] tabular-nums mt-1 truncate">{value}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};
