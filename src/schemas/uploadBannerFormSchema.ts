import { z } from "zod";

export const uploadBannerFormSchema = z.object({
    banner: z.string().describe("Banner Image")
})