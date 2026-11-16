import type { JamMemberState } from "@/features/jam/jam.types.ts";

/** Quem está na jam agora, por ordem de entrada. Quem saiu não aparece. */
export const JamMemberList = ({ members, hostUserId, currentUserId }: {
    members: JamMemberState[];
    hostUserId: number;
    currentUserId: number | undefined;
}) => (
    <ul className="flex flex-col">
        {members.filter((member) => member.leftAt === null).map((member) => (
            <li key={member.userId} className="flex items-center gap-3 py-2.5 border-t border-border first:border-t-0">
                <span
                    aria-hidden
                    className="size-9 shrink-0 rounded-full bg-muted flex items-center justify-center text-[14px] font-medium"
                >
                    {member.name.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 min-w-0 truncate text-[14px]">
                    {member.name}
                    {member.userId === currentUserId && <span className="text-muted-foreground"> (você)</span>}
                </span>
                {member.userId === hostUserId && (
                    <span className="text-[13px] text-muted-foreground">Criou a jam</span>
                )}
            </li>
        ))}
    </ul>
);
