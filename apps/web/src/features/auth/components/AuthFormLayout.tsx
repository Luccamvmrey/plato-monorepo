import type { ReactNode } from "react";

type AuthFormLayoutProps = {
    title: string;
    description: string;
    action?: ReactNode;
    children?: ReactNode;
    footer: ReactNode;
};

const AuthFormLayout = ({ title, description, action, children, footer }: AuthFormLayoutProps) => (
    <div className="w-full max-w-sm flex flex-col gap-6">
        <header className="flex items-start gap-3">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
                <h1 className="text-[24px] font-semibold tracking-[-0.02em]">{title}</h1>
                <p className="text-[14px] text-muted-foreground">{description}</p>
            </div>
            {action}
        </header>

        {children && <div className="flex flex-col gap-3">{children}</div>}

        <div className="flex flex-col gap-2">{footer}</div>
    </div>
);

export default AuthFormLayout;
