/**
 * Formato dos links de compartilhamento, usado pela API e pelo web.
 *
 * O token tem 128 bits em base64url, ou seja, 22 caracteres. Validar o formato antes de
 * consultar o banco evita gastar uma query com qualquer texto que chegue na rota pública.
 */
const TOKEN = "[A-Za-z0-9_-]{22}";

const TOKEN_PATTERN = new RegExp(`^${TOKEN}$`);
const SHARED_PLAN_PATH_PATTERN = new RegExp(`^/s/(${TOKEN})(\\?add=1)?$`);

export const SUGGESTED_PROGRAMS_PATH = "/suggested";

export const isShareToken = (value: unknown): value is string =>
    typeof value === "string" && TOKEN_PATTERN.test(value);

/**
 * Para onde o login e o cadastro podem devolver a pessoa.
 *
 * É uma lista fechada, e não "qualquer caminho relativo", porque `next` vem da URL: quem
 * monta o link controla o valor. `//site.com` e `/\site.com` parecem relativos e levam
 * para fora do app.
 */
export const isSafeReturnPath = (value: unknown): value is string =>
    typeof value === "string" &&
    (value === SUGGESTED_PROGRAMS_PATH || SHARED_PLAN_PATH_PATTERN.test(value));

/** O token do link de um caminho de retorno, para atribuir o cadastro a ele. */
export const shareTokenFromReturnPath = (value: unknown): string | null => {
    if (typeof value !== "string") return null;

    return SHARED_PLAN_PATH_PATTERN.exec(value)?.[1] ?? null;
};
