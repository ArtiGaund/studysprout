import crypto from "crypto";

export function computeHash(data: string){
    return crypto.createHash("sha256").update(data).digest("hex");
}
