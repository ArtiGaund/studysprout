import { z } from "zod";

export const resetPasswordSchema = z.object({
    password: z.string().min(10,"Password must be atleast of 10 characters."),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPasword"] //This ensures the error shows up on the confirmPassword field
})