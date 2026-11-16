/**
 * O que está no programa beta agora. O perfil mostra esta lista para quem decide se liga o
 * toggle; o servidor bloqueia as rotas de cada item com `requireBeta`.
 *
 * Feature que sai do beta sai daqui também: passa a valer para todo mundo.
 */
export interface BetaFeature {
    key: string;
    name: string;
    description: string;
}

export const BETA_FEATURES: readonly BetaFeature[] = [];
