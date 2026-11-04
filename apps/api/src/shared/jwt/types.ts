import { JwtPayload } from "jsonwebtoken";

export interface AppJwtPayload extends JwtPayload {
    id: number;
    email: string;
    /** `User.tokenVersion` na emissão. Diferente do valor atual = sessão encerrada. */
    tv: number;
}