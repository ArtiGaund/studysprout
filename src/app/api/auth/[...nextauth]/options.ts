/**
 * NEXT-AUTH CONFIGURATION (authOptions)
 * -------------------------------------
 * Role: Core authentication logic for Studysprout
 * Logic:
 * 1. Multi-Provider: Supports Credentials (Email/Username), Github, and Google.
 * 2. Database Sync: Automatically creates/updates MongoDB user profiles on social login.
 * 3. Token Enrichment: Persists custom fields (_id, avatar, username) into the JWT.
 * 4. Cross-Server Auth: Encodes an 'accessToken' in the session to allow our External Realtime
 * Server to verify user identity.
 */
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/dbConnect";
import {UserModel} from "@/model/index";
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import crypto from "crypto"
import config from "@/config/config";
import { getInitials } from "@/utils/profile/profile.utils";
import { encode } from "next-auth/jwt";
 
export const authOptions: NextAuthOptions = {
    providers: [
        /**
         * CREDENTIALS PROVIDER:
         * Custom login logic for users using email/username and password.
         */
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text"},
                password: { label: "Password", type: "password" }
              },
              async authorize(credentials: any): Promise<any> {
                await dbConnect()

                try {
                    // Flexible lookup: Allows login via either username or email    
                    const user = await UserModel.findOne({
                        $or: [
                            { email: credentials.identifier },
                            { username: credentials.identifier }
                        ]
                    })
                    // if there is no user
                    if(!user){
                        throw new Error('No user found with this email.')
                    }
                    // if user is not verified
                    if(!user.isVerified){
                        throw new Error('Please verify your account before login.')
                    }
                    //Secure password verification
                    const isPasswordCorrect = await bcrypt.compare( credentials.password, user.password)
                    if(isPasswordCorrect){
                        return user
                    }else{
                        throw new Error('Incorrect Password')
                    }
                } catch (err: any) {
                    throw new Error(err)
                }
              }
        }),
        /**
         * SOCIAL PROVIDERS:
         * Configured for Github and Google OAuth.
         */
        GithubProvider({
            clientId: config.GITHUB_ID as string,
            clientSecret: config.GITHUB_SECRET as string
        }),
        GoogleProvider({
            clientId: config.GOOGLE_ID as string,
            clientSecret: config.GOOGLE_SECRET as string
        })
    ],
    callbacks: {
        /**
         * SIGN-IN CALLBACK:
         * Execute when a user attempts to log in via OAuth.
         * Ensure that social users have a corresponding document in MongoDB.
         */
        async signIn({ user, account }){
            await dbConnect();

            if(account?.provider === 'github' || account?.provider === 'google'){
                let existingUser = await UserModel.findOne({ email: user.email });

                // If first time social login, create a new user profile
                if(!existingUser){
                    const username = user.name?.replace(/\s+/g, "").toLowerCase() ?? user.email?.split("@")[0];

                    const initials = getInitials((user.name ?? username) as string);
                    const providerImage = user.image ?? null;

                    existingUser = await UserModel.create({
                        email: user.email,
                        // image: user.image,
                        isVerified: true, //Social logins are pre-verified
                         username: user.name?.replace(/\s+/g, "").toLowerCase(), //Dummy password for OAuth users
                         password: crypto.randomBytes(16).toString("hex"),
                         avatarType: providerImage ? "image" : "initial",
                         avatarUrl: providerImage,
                         avatarInitials: initials,
                    })
                }

                // Inject DB values into the user object for the JWT callback
                user._id = existingUser._id.toString();
                user.isVerified = existingUser.isVerified;
                user.username = existingUser.username;

                user.avatarType = existingUser.avatarType;
                user.avatarUrl = existingUser.avatarUrl;
                user.avatarInitials = existingUser.avatarInitials;
            }
           
            return true;
        },
        /**
         * JWT CALLBACK:
         * Persists user data into the JSON Web Token.
         * This data becomes accessible in the session.
         */
          async jwt({ token, user }) {
            // here user is coming from providers above => we are returning user
            if(user){
                token._id = user._id?.toString();
                token.isVerified = user.isVerified;
                token.username = user.username;

                token.avatarType = user.avatarType;
                token.avatarUrl = user.avatarUrl;
                token.avatarInitials = user.avatarInitials;
            }
            return token
          },
          /**
           * SESSION CALLBACK:
           * Exposes the JWT data to the client-side via useSession().
           * Also generates a custom 'accessToken' for our External Socket.io sever.
           */
          async session({ session, token }) {
            // next auth work basically on session based strategy, thats why adding all these value from token to session
            if(token){
                session.user._id = token._id;
                
                session.user.isVerified = token.isVerified;
                session.user.username = token.username;

                session.user.avatarType = token.avatarType;
                session.user.avatarUrl = token.avatarUrl;
                session.user.avatarInitials = token.avatarInitials;

                // Create an encoded token string for cross-origin authentication
                session.accessToken = await encode({
                    token,
                    secret: config.NEXTAUTH_SECRET!,
                })
            }
            return session
          },
    },
    pages: {
        signIn: '/sign-in', //Custom login page redirect
    },
    session: {
        strategy: "jwt" //Use JWT instead of database sessions for better scalability
    },
    secret: config.NEXTAUTH_SECRET
}


