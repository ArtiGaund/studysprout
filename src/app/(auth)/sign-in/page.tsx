"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod"
import Link from "next/link";
import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signInSchema } from "@/schemas/signInSchema";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";


const SignIn = () => {
    const [ isSubmitting, setIsSubmitting ] = useState(false)
    const { toast } = useToast()
    const router = useRouter()
    const form = useForm<z.infer<typeof signInSchema>>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            identifier: "", password: "",
        }
    })

    const onSubmit = async( data: z.infer<typeof signInSchema>) => {
        try {
            setIsSubmitting(true)
            const result = await signIn('credentials', {
                redirect: false,
                identifier: data.identifier,
                password: data.password
            })
            if(result?.error){
                if(result?.error === 'CredentialsSignin'){
                    toast({
                        title: "Login failed",
                        description: "Incorrect username or password",
                        variant: "destructive"
                    })
                }else{
                    toast({
                        title: "Login failed",
                        description: result.error,
                        variant: "destructive"
                    })
                }
                
            }
            if(result?.url){
                toast({
                    title: "Login Successful",
                    description: " Moving to Dashboard",
                })
                router.replace('/dashboard')
            }
        } catch (error) {
            console.log("Error while login ",error)
            toast({
                title: "Login Error",
                description: " Error while login",
                variant: "destructive",
            })

        } finally{
            setIsSubmitting(false)
        }
        
    }

    return(
        <div>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <FormField 
                    name="identifier"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username or Email</FormLabel>
                            <FormControl>
                                <Input 
                                placeholder="username or email"
                                {...field}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                    />
                        <FormField
                        name="password"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="password" 
                                {...field} 
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <Button type="submit" disabled={isSubmitting}>
                            {
                                isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Please Wait
                                    </>
                                ) : ('SignIn')
                            }
                        </Button>
                </form>
            </Form>
        </div>
    )
}

export default SignIn;