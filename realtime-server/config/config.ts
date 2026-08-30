const config = {
    MONGO_CONNECTION: process.env.MONGO_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    MAIN_API_URL: process.env.MAIN_API_URL,
    INTERNAL_SECRET: process.env.INTERNAL_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
}

export default config;