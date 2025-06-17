// Whole Next auth things
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/dbConnect";
import {UserModel} from "@/model/index";
 
export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text"},
                password: { label: "Password", type: "password" }
              },
            // method for authorization
              async authorize(credentials: any): Promise<any> {
                // using credentials we can access data
                // connect to database
                await dbConnect()

                try {
                    // using $or can find user using username or email (will return from either)
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
                    // checking password
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
        })
    ],
    callbacks: {
        // adding maximum data in this token => then add this data in session through token (either have token 
            // access or session access I can fetch values from it anytime) 
       
          async jwt({ token, user }) {
            // here user is coming from providers above => we are returning user
            if(user){
                token._id = user._id?.toString()
                token.isVerified = user.isVerified
                token.username = user.username
            }
            return token
          },
          async session({ session, token }) {
            // next auth work basically on session based strategy, thats why adding all these value from token to session
            if(token){
                session.user._id = token._id
                session.user.isVerified = token.isVerified
                session.user.username = token.username
            }
            return session
          },
    },
    pages: {
        signIn: '/sign-in',
    },
    session: {
        strategy: "jwt"
    },
    secret: process.env.NEXTAUTH_SECRET
}


