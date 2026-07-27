import { useEffect, useState } from "react";

/**
 * Elements that summon the on-screen keyboard when focused.
 */
export const isTextEntry = (element: Element | null): boolean => {
    if (!element) return false;
    if ((element as HTMLElement).isContentEditable) return true;

    if (element.tagName === "TEXTAREA") return true;
    if (element.tagName !== "INPUT") return false;

    const type = (element as HTMLInputElement).type;
    return !["button", "submit", "reset", "checkbox", "radio", "range", "color", "file", "image"].includes(type);
};

/**
 * Tracks whether the on-screen keyboard is (almost certainly) covering the viewport.
 *
 * Detection is focus-based rather than viewport-based on purpose: with
 * `interactive-widget=resizes-content` (set in index.html) Android shrinks the
 * *layout* viewport along with the visual one, so `innerHeight - visualViewport.height`
 * stays at 0 and never reveals the keyboard. Focus is the one signal that behaves
 * the same on both Android and iOS.
 *
 * Gated on a coarse pointer so focusing an input on desktop — where there is no
 * on-screen keyboard — never hides chrome.
 */
export const useKeyboardOpen = (): boolean => {
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        if (!window.matchMedia?.("(pointer: coarse)").matches) return;

        const handleFocusIn = (e: FocusEvent) => {
            if (isTextEntry(e.target as Element)) setIsKeyboardOpen(true);
        };

        const handleFocusOut = () => {
            // Focus moves out before it moves in, so defer: tabbing between two
            // inputs must not flash the chrome back on between them.
            requestAnimationFrame(() => {
                if (!isTextEntry(document.activeElement)) setIsKeyboardOpen(false);
            });
        };

        document.addEventListener("focusin", handleFocusIn);
        document.addEventListener("focusout", handleFocusOut);

        return () => {
            document.removeEventListener("focusin", handleFocusIn);
            document.removeEventListener("focusout", handleFocusOut);
        };
    }, []);

    return isKeyboardOpen;
};
