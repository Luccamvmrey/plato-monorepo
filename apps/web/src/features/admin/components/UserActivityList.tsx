import type { AdminFeature, AdminUserRow, AdminUserStatus } from "@plato/shared";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { formatDaysAgo } from "@/core/utils/formatters.ts";
import { STATUS_OPTIONS } from "../hooks/useAdminDashboard.ts";
import { FEATURE_LABEL } from "../utils/feature-labels.ts";

const FEATURES = Object.keys(FEATURE_LABEL) as AdminFeature[];

const describeWorkouts = ({ lastWorkoutAt, openSessionStartedAt, sessions28d, totalSessions }: AdminUserRow) => {
    if (lastWorkoutAt !== null) {
        return `Último treino ${formatDaysAgo(lastWorkoutAt)} · ${sessions28d} em 28 dias · ${totalSessions} no total`;
    }

    return openSessionStartedAt === null ? "Nunca treinou" : "Nenhum treino concluído";
};

interface UserActivityListProps {
    users: AdminUserRow[];
    totalUsers: number;
    status: AdminUserStatus;
    onStatusChange: (status: AdminUserStatus) => void;
    statusCounts: Record<AdminUserStatus, number>;
    feature: AdminFeature | "ALL";
    onFeatureChange: (feature: AdminFeature | "ALL") => void;
    search: string;
    onSearchChange: (search: string) => void;
    hasFilters: boolean;
    onClearFilters: () => void;
}

export const UserActivityList = ({
    users,
    totalUsers,
    status,
    onStatusChange,
    statusCounts,
    feature,
    onFeatureChange,
    search,
    onSearchChange,
    hasFilters,
    onClearFilters,
}: UserActivityListProps) => (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex flex-col gap-3 p-4">
            <h2 className="text-[17px] font-semibold tracking-[-0.02em]">Quem está treinando</h2>

            <Input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar pelo nome"
                aria-label="Buscar pelo nome"
                className="h-11 rounded-md"
            />

            <div className="grid grid-cols-2 gap-2">
                <Select value={status} onValueChange={(value) => onStatusChange(value as AdminUserStatus)}>
                    <SelectTrigger aria-label="Filtrar por situação" className="w-full h-9 rounded-lg text-[13px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>{label} ({statusCounts[value]})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={feature} onValueChange={(value) => onFeatureChange(value as AdminFeature | "ALL")}>
                    <SelectTrigger aria-label="Filtrar por recurso" className="w-full h-9 rounded-lg text-[13px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todos os recursos</SelectItem>
                        {FEATURES.map((item) => (
                            <SelectItem key={item} value={item}>{FEATURE_LABEL[item]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between gap-3 min-h-5">
                <p role="status" className="text-[13px] text-muted-foreground tabular-nums">
                    {users.length} de {totalUsers} {totalUsers === 1 ? "pessoa" : "pessoas"}
                </p>
                {hasFilters && (
                    <button type="button" onClick={onClearFilters} className="text-[13px] text-primary font-medium relative tap-target">
                        Limpar filtros
                    </button>
                )}
            </div>
        </div>

        {users.length === 0 ? (
            <p className="px-4 pb-6 pt-2 text-[14px] text-muted-foreground text-center">
                Ninguém com esses filtros.
            </p>
        ) : (
            <ul>
                {users.map((user) => (
                    <li key={user.id} className="px-4 py-3 border-t border-border/50">
                        <p className="text-[14px] font-medium truncate">{user.name ?? `Usuário #${user.id}`}</p>
                        <p className="text-[13px] text-muted-foreground tabular-nums mt-0.5">{describeWorkouts(user)}</p>
                        {user.openSessionStartedAt !== null && (
                            <p className="text-[13px] font-medium mt-0.5">
                                Treino em aberto, começou {formatDaysAgo(user.openSessionStartedAt)}
                            </p>
                        )}
                        {user.features.length > 0 && (
                            <p className="text-[13px] text-muted-foreground mt-0.5">
                                {user.features.map((item) => FEATURE_LABEL[item]).join(" · ")}
                            </p>
                        )}
                    </li>
                ))}
            </ul>
        )}
    </section>
);
