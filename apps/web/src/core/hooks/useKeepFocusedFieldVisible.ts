import { useEffect } from "react";
import { isTextEntry } from "@/core/hooks/useKeyboardOpen.ts";

/** Rough duration of the keyboard slide-in; measuring earlier reads stale geometry. */
const KEYBOARD_ANIMATION_MS = 300;
const EDGE_MARGIN_PX = 16;

/**
 * Keeps the focused text field inside the visible area once the keyboard is up.
 *
 * Removing the fixed bottom chrome frees the space, but nothing was moving the
 * field into it: a field low in a long list still lands under the keyboard, and
 * the user has to scroll by hand after every tap.
 *
 * Runs on focus *and* on viewport resize, because the two platforms reveal the
 * occlusion at different moments — Android shrinks the layout viewport (window
 * resize), iOS only shrinks the visual viewport.
 */
export const useKeepFocusedFieldVisible = (): void => {
    useEffect(() => {
        if (!window.matchMedia?.("(pointer: coarse)").matches) return;

        let timer = 0;

        const ensureVisible = () => {
            const el = document.activeElement as HTMLElement | null;
            if (!isTextEntry(el)) return;

            // visualViewport is the only thing that knows about the keyboard on iOS.
            const visibleBottom = window.visualViewport?.height ?? window.innerHeight;
            const rect = el!.getBoundingClientRect();

            const hiddenBelow = rect.bottom > visibleBottom - EDGE_MARGIN_PX;
            const hiddenAbove = rect.top < EDGE_MARGIN_PX;
            if (!hiddenBelow && !hiddenAbove) return;

            // Centring the field alone can push the controls *below* it — the RPE
            // chips and the confirm button — back off-screen. When the field sits in
            // a group that still fits, bring the whole group in instead.
            const anchor = el!.closest<HTMLElement>("[data-keyboard-anchor]");
            if (anchor && anchor.getBoundingClientRect().height <= visibleBottom - EDGE_MARGIN_PX * 2) {
                anchor.scrollIntoView({ block: "nearest", behavior: "smooth" });
                return;
            }

            el!.scrollIntoView({ block: "center", behavior: "smooth" });
        };

        const schedule = () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(ensureVisible, KEYBOARD_ANIMATION_MS);
        };

        document.addEventListener("focusin", schedule);
        window.addEventListener("resize", schedule);
        window.visualViewport?.addEventListener("resize", schedule);

        return () => {
            window.clearTimeout(timer);
            document.removeEventListener("focusin", schedule);
            window.removeEventListener("resize", schedule);
            window.visualViewport?.removeEventListener("resize", schedule);
        };
    }, []);
};
