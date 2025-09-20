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
import Image from "next/image"
import { IconMail, IconLock, IconBrandGoogle, IconBrandGithub } from "@tabler/icons-react";

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
        <div className="flex  bg-black h-screen justify-center items-center ">
            <div className="flex flex-row w-[60rem] h-[30.5rem] rounded-3xl bg-zinc-900">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <div className="flex flex-col gap-y-4 m-[3rem]">
                                <h2 className="text-3xl font-bold text-neutral-200">
                                    Welcome Back on StudySprout
                                </h2>
                                <div className="flex justify-center items-center">
                                    <span>Don&apos;t have an account?</span> &nbsp;
                                    <span className="text-blue-600">
                                        <Link href="/sign-up">Sign up</Link>
                                    </span>
                                </div>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <FormField 
                    name="identifier"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input 
                                icon={<IconMail />}
                                placeholder="username or email"
                                {...field}
                                 className="w-full p-2"
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
                            <FormControl>
                                <Input icon={<IconLock />} type="password" placeholder="password" className="w-full p-2"
                                {...field} 
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <Button className="w-full p-2" type="submit" disabled={isSubmitting}>
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
            
            <div className="flex justify-end text-xs">
                                    <a href="/forgot-password">forget password?</a>
                                </div>
                        </div>
                        <div className="flex flex-row items-center mt-[-2rem]">
                            <div className="w-[5rem] h-[1px] bg-gray-400 mx-2"/>
                            <span className="text-sm px-2">OR</span>
                             <div className="w-[5rem] h-[1px] bg-gray-400 mx-2"/>
                        </div>
                        {/* Social handle */}
                        <div className="flex flex-row items-center gap-x-3">
                            <div className="flex w-[2rem] h-[2rem] rounded-full overflow-hidden relative">
                                <button
                                className="cursor-pointer"
                                onClick={() => signIn('google') }
                                >
                                    <Image 
                                    src="/images/google.svg"
                                    fill
                                    alt="google image"
                                    style={{ objectFit: "cover"}}
                                    className="absolute inset-0"
                                    />
                                </button>
                            </div>
                           <div className="flex w-[2.5rem] h-[2.5rem] rounded-full overflow-hidden relative">
                             <button
                                className="cursor-pointer"
                                onClick={() => signIn('github')}
                                >
                                    <Image 
                                    src="/images/github.svg"
                                    fill
                                    alt="google image"
                                    style={{ objectFit: "cover"}}
                                    className="absolute inset-0"
                                    />
                                </button>
                            </div>
                        </div>
                        </div>
                        <div className="flex-1 w-full h-full rounded-r-3xl overflow-hidden relative">
                            <Image 
                            src="/images/login.PNG"
                            fill
                              alt="signup"
                              style={{ objectFit: "cover"}}
                              className="absolute inset-0"
                              />
                        </div>
                    </div>
        </div>
    )
}

export default SignIn;