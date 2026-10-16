/**
 * SIGN-IN PAGE
 * ------------
 * Role: Entry point for user authentication
 * * Features:
 * 1. Form Management: Uses React Hook Form + Zod for client-side validation 
 * 2. Multi-Provider Auth: Supports standard Credentials (Email/Username) and OAuth(Google/Github)
 * 3. Feedback: Integration with shadcn/ui Toast for error/success reporting.
 * 4. UX: Handles loading states and prevents double-submission via 'isSubmitting'. 
 */
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod"
import Link from "next/link";
import React, { Suspense, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signInSchema } from "@/schemas/signInSchema";
import { signIn } from "next-auth/react";
import { Chrome, Github, Loader2, Lock, Mail } from "lucide-react";
import { Footer } from "@/landing/components/Footer";

const SignInContent = () => {
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
          
            if(result?.ok){
                router.replace('/dashboard');
            }
        } catch (error) {
            console.warn("Error while login ",error)
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
       <main 
       className="relative min-h-screen bg-[#0A0507] text-white flex flex-col items-center 
            justify-start lg:justify-center pt-24 sm:pt-28 lg:pt-12 px-4 sm:px-8 lg:px-12 
            pb-0 overflow-y-auto lg:overflow-hidden select-none"
       >
            
            {/* Brand Navigation - Top left anchor */}
            <div className="absolute top-8 left-8 sm:top-12 sm:left-12 z-[110]">
                <Link 
                    href="/"
                    className="flex items-center gap-2.5 group transition-transform active:scale-95"
                >
                    <div className="w-8 h-8 rounded-xl bg-purple-950/50 flex items-center 
                    justify-center border border-purple-500/30 group-hover:border-purple-500/60 
                    transition-colors">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"/>
                    </div>
                    <span className="text-white font-bold text-lg tracking-tight 
                    group-hover:text-purple-300 transition-colors font-mono">
                        Studysprout
                    </span>
                </Link>
            </div>

            {/* Background Decorative Layers */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] h-[550px] w-[550px] 
                rounded-full bg-purple-900/10 blur-[140px]" />
                <div className="absolute bottom-[10%] right-[10%] h-[450px] w-[450px] 
                rounded-full bg-amber-900/10 blur-[150px]" />
            </div>
           
            <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 
            lg:gap-24 flex-1 mb-16 z-10">

                {/* Left side: Brand Copy */}
                <div className="flex-1 space-y-6">
                    <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight 
                    tracking-tight">
                        Cultivate your <br />
                        <span className="text-purple-400">Intellect.</span>
                    </h1>

                    <p className="text-neutral-400 text-sm max-w-md leading-relaxed font-mono">
                        Access the world&apos;s most advanced neural learning environment. 
                        Where collective intelligence meets organic cognitive growth.
                    </p>
                </div>

                {/* Right side: Modern Auth Form */}
                <div className="w-full max-w-md">
                    <div className="bg-[#110A10] backdrop-blur-2xl border border-white/10 
                    rounded-3xl p-8 sm:p-10 shadow-2xl relative font-mono">

                        <header className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
                                Welcome Back
                            </h2>
                            <p className="text-neutral-400 text-xs">
                                Continue your journey through the greenhouse.
                            </p>
                        </header>

                        {/* Preserving your existing Form logic */}
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                
                                {/* Identifier Field */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-neutral-400 
                                    uppercase tracking-widest px-0.5">
                                        Email Address / Username
                                    </label>
                                    <FormField 
                                        name="identifier"
                                        control={form.control}
                                        render={({ field }) => (
                                            <FormItem className="space-y-0">
                                                <FormControl>
                                                    <Input 
                                                        {...field}
                                                        icon={<Mail size={16} className="text-neutral-500" />}
                                                        placeholder="username or email"
                                                        className="w-full bg-[#0A0507] 
                                                        border-white/10 rounded-xl py-5 pl-10
                                                         pr-4 text-xs text-white 
                                                         focus-visible:ring-purple-500/50 
                                                         transition-all 
                                                         placeholder:text-neutral-600"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px] mt-1 ml-2 
                                                text-rose-400 font-bold uppercase 
                                                tracking-wider" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Password Field with Isolated Header */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center px-0.5">
                                        <label className="text-[10px] font-bold text-neutral-400 
                                        uppercase tracking-widest">
                                            Password
                                        </label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-[10px] font-bold text-purple-400
                                             hover:text-purple-300 transition-colors"
                                        >
                                            Forgot Password?
                                        </Link>
                                    </div>

                                    <FormField
                                        name="password"
                                        control={form.control}
                                        render={({ field }) => (
                                            <FormItem className="space-y-0">
                                                <FormControl>
                                                    <Input 
                                                        {...field}
                                                        type="password" 
                                                        placeholder="password" 
                                                        icon={<Lock size={16} className="text-gray-600" />}
                                                        className="w-full bg-[#0A0507]
                                                         border-white/10 rounded-xl py-5 pl-10
                                                         pr-4 text-xs text-white 
                                                         focus-visible:ring-purple-500/50 
                                                         transition-all 
                                                         placeholder:text-neutral-600"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px] mt-1 ml-2
                                                 text-rose-400 font-bold uppercase 
                                                 tracking-widest" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full bg-purple-600 hover:bg-purple-500
                                     text-white font-bold uppercase text-xs tracking-wider 
                                     py-5 rounded-xl flex items-center justify-center gap-2 
                                     transition-all shadow-md active:scale-[0.99] mt-2"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin text-purple-200" size={16}/> : "Sign In"}
                                </Button>
                            </form>
                        </Form>

                        {/* Social Auth Grid */}
                        <div className="mt-6">
                            <div className="relative flex items-center justify-center mb-5">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10" /></div>
                                <span className="relative px-3 bg-[#110A10] text-[10px] 
                                font-bold text-neutral-500 uppercase tracking-widest">
                                    Or Continue With
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => signIn('google', {
                                        callbackUrl: '/dashboard?extension=true'
                                    })}
                                    className="flex items-center justify-center gap-2
                                     bg-[#0A0507] border border-white/10 py-2.5 rounded-xl 
                                     hover:bg-white/5 transition-colors"
                                >
                                    <Chrome size={18} className="text-neutral-400" />
                                    <span className="text-xs font-bold text-neutral-300">
                                        Google
                                    </span>
                                </button>
                                <button 
                                    onClick={() => signIn('github', {
                                        callbackUrl: '/dashboard?extension=true'
                                    })}
                                    className="flex items-center justify-center gap-2 
                                    [#0A0507] border border-white/10 py-2.5 rounded-xl
                                     hover:bg-white/5 transition-colors"
                                >
                                    <Github size={18} className="text-neutral-400" />
                                    <span className="text-xs font-bold text-neutral-300">
                                        GitHub
                                    </span>
                                </button>
                            </div>
                        </div>

                        <p className="mt-6 text-center text-xs text-neutral-600">
                            Don&apos;t have an account?{" "} 
                            <Link href="/sign-up" 
                            className="text-purple-400 font-bold hover:text-purple-300 
                            transition-colors">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Responsive Footer with Top Margin Spacer */}
            <div className="w-screen -mx-4 sm:-mx-8 lg:-mx-12 mt-auto">
                <Footer />
            </div>
        </main>
    )
}

export default function SignIn(){
    return (
    <Suspense 
        fallback={
        <div className="flex justify-center items-center h-screen bg-[#0A0507] 
        text-neutral-400 font-mono text-xs">
            Loading sign in...
        </div>
    }>
      <SignInContent />
    </Suspense>
    )
};