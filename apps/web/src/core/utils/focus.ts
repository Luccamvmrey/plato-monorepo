/**
 * Marks an input as part of a sequential keyboard-navigable field chain.
 * Fields are advanced in DOM order.
 */
export const EDITOR_FIELD_ATTR = "data-editor-field";

const getFields = (): HTMLElement[] =>
    Array.from(document.querySelectorAll<HTMLElement>(`[${EDITOR_FIELD_ATTR}]`))
        .filter((el) => !(el as HTMLInputElement).disabled);

/**
 * Moves focus to the next field in the chain.
 * Returns false when `current` is the last field (or is not in the chain),
 * letting the caller decide what "done" means — usually blurring to dismiss
 * the on-screen keyboard.
 */
export const focusNextField = (current: HTMLElement): boolean => {
    const fields = getFields();
    const index = fields.indexOf(current);
    if (index === -1) return false;

    const next = fields[index + 1];
    if (!next) return false;

    next.focus();
    (next as HTMLInputElement).select?.();
    next.scrollIntoView({ block: "center", behavior: "smooth" });
    return true;
};

/**
 * Focuses (and scrolls to) the first field matching `selector`.
 * Used to take the user straight to whatever failed validation instead of
 * rendering an error somewhere off-screen.
 */
export const focusField = (selector: string): void => {
    // Wait a frame so the element exists after the error state has rendered.
    requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(selector);
        if (!el) return;
        el.focus({ preventScroll: true });
        el.scrollIntoView({ block: "center", behavior: "smooth" });
    });
};
