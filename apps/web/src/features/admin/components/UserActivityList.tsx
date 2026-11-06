import type { AdminMetrics } from "@plato/shared";
import { formatDaysAgo } from "@/core/utils/formatters.ts";
import { FEATURE_LABEL } from "../utils/feature-labels.ts";

const describeActivity = ({ lastWorkoutAt, sessions28d, totalSessions }: AdminMetrics["users"][number]) =>
    lastWorkoutAt === null
        ? "Nunca treinou"
        : `Último treino ${formatDaysAgo(lastWorkoutAt)} · ${sessions28d} em 28 dias · ${totalSessions} no total`;

export const UserActivityList = ({ users }: { users: AdminMetrics["users"] }) => (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
        <h2 className="px-4 pt-4 pb-3 text-[17px] font-semibold tracking-[-0.02em]">Quem está treinando</h2>

        <ul>
            {users.map((user) => (
                <li key={user.id} className="px-4 py-3 border-t border-border/50">
                    <p className="text-[14px] font-medium truncate">{user.name ?? `Usuário #${user.id}`}</p>
                    <p className="text-[13px] text-muted-foreground tabular-nums mt-0.5">{describeActivity(user)}</p>
                    {user.features.length > 0 && (
                        <p className="text-[13px] text-muted-foreground mt-0.5">
                            {user.features.map((feature) => FEATURE_LABEL[feature]).join(" · ")}
                        </p>
                    )}
                </li>
            ))}
        </ul>
    </section>
);
