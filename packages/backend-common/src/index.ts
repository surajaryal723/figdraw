import dotenv from "dotenv"


// Load .env from the root of the project
dotenv.config({ path: "../../.env" })

if (!process.env.JWT_SECRET) {
    console.error("Warning: JWT_SECRET is not defined in environment variables")
}

export const JWT_SECRET = process.env.JWT_SECRET



