import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UNITS } from "@/core/constants/units";

/**
 * Formats a weight value with the standard unit and locale.
 * @param weight Weight in kg
 * @returns Formatted string (e.g., "1.250,5 kg")
 */
export const formatWeight = (weight: number): string => {
    return `${weight.toLocaleString("pt-BR")} ${UNITS.WEIGHT}`;
};

/**
 * Lê um decimal digitado em pt-BR, onde a vírgula é o separador.
 *
 * Os inputs de carga são `type="text" inputMode="decimal"` justamente porque
 * `type="number"` descarta a vírgula antes de qualquer parser ver o valor — "82,5"
 * chegaria como "". Normalizar só no parse não resolve nada: não há mais vírgula
 * para normalizar.
 */
export const parseDecimalPtBr = (value: string): number =>
    Math.max(0, parseFloat(value.replace(",", ".")) || 0);

/**
 * Formats a date using a predefined pattern and pt-BR locale.
 * @param date Date to format
 * @param pattern date-fns pattern
 * @returns Formatted string
 */
export const formatDateCustom = (date: Date | string | number, pattern: string): string => {
    return format(new Date(date), pattern, { locale: ptBR });
};

/**
 * Formats a date to "day de month de year" (e.g., "2 de maio de 2026").
 */
export const formatDateFull = (date: Date | string | number): string => {
    return formatDateCustom(date, "d 'de' MMMM 'de' yyyy");
};

/**
 * Formats a date to "day de month" (e.g., "2 de maio").
 */
export const formatDateShort = (date: Date | string | number): string => {
    return formatDateCustom(date, "d 'de' MMMM");
};
