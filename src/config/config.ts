const config = {
    MONGO_CONNECTION: process.env.MONGO_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    BREVO_SMTP_USER: process.env.BREVO_SMTP_USER,
    BREVO_SMTP_PASS: process.env.BREVO_SMTP_PASS,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    GOOGLE_ID: process.env.GOOGLE_ID,
    GOOGLE_SECRET: process.env.GOOGLE_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    OWNER_EMAIL: process.env.OWNER_EMAIL,
    GEMINI_KEY: process.env.GEMINI_API_KEY,
}


if(!config.GEMINI_KEY){
    throw new Error("GEMINI_KEY is not defined");
}

export default config
