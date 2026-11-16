import { useMemo } from "react";
import { renderSVG } from "uqr";

/**
 * QR em SVG, gerado no aparelho. Sempre preto no branco, mesmo no tema escuro: é o que as
 * câmeras leem melhor, ainda mais com o brilho da academia.
 */
export const JamQrCode = ({ value, label }: { value: string; label: string }) => {
    // O SVG sai de uma URL que o próprio app montou, nunca de texto de usuário.
    const svg = useMemo(() => renderSVG(value, { border: 2, whiteColor: "#ffffff", blackColor: "#000000" }), [value]);

    return (
        <div
            role="img"
            aria-label={label}
            className="w-full max-w-[280px] aspect-square rounded-xl bg-white p-2 [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};
