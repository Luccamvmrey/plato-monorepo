import { JwtPayload } from "jsonwebtoken";

export interface AppJwtPayload extends JwtPayload {
    id: number;
    email: string;
}