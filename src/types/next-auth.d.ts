import "next-auth"
import { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt";

// making packages aware of the new datatype (it cannot be done directly using interface)
declare module 'next-auth' {
    // changing in the module
    interface User{
        _id? : string;
        isVerified? : boolean;
        username?: string;
    }
    interface Session{
        user: {
            _id?: string;
            isVerified?: boolean;
            username?: string;
        } & DefaultSession['user']
    }
}

// default session is important
declare module 'next-auth/jwt'{
    interface JWT{
        _id?: string;
        isVerified?: boolean;
        username?: string;
    }
}