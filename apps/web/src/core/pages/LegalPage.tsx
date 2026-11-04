import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import type { LegalDocument } from "@/core/pages/legal-content.ts";

const LegalPage = ({ document }: { document: LegalDocument }) => (
    <main className="min-h-dvh w-screen bg-background overflow-y-auto px-4 py-8">
        <article className="mx-auto max-w-prose flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative tap-target"
                    aria-label="Voltar"
                    onClick={() => window.history.back()}
                >
                    <ArrowLeft />
                </Button>
                <h1 className="text-[24px] font-semibold tracking-[-0.02em]">{document.title}</h1>
                <p className="text-[13px] text-muted-foreground">Atualizado em {document.updatedAt}</p>
            </header>

            {document.sections.map((section) => (
                <section key={section.heading} className="flex flex-col gap-2">
                    <h2 className="text-[16px] font-medium">{section.heading}</h2>
                    {section.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="text-[14px] leading-relaxed text-muted-foreground">
                            {paragraph}
                        </p>
                    ))}
                </section>
            ))}
        </article>
    </main>
);

export default LegalPage;
