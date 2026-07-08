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
import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signInSchema } from "@/schemas/signInSchema";
import { signIn } from "next-auth/react";
import { Chrome, Github, Loader2, Lock, Mail } from "lucide-react";
import { useSelector } from "react-redux";
import { selectUserId } from "@/store/selectors/userSelector";
import { Footer } from "@/landing/components/Footer";

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
    const userId = useSelector(selectUserId);

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
                if(!userId) return;
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
       className="relative min-h-screen bg-[#050A0A] flex flex-col items-center 
            justify-start lg:justify-center pt-24 sm:pt-28 lg:pt-12 px-4 sm:px-8 lg:px-12 
            pb-0 overflow-y-auto lg:overflow-hidden"
       >
            
            {/* Brand Navigation - Top left anchor */}
            <div className="absolute top-8 left-8 sm:top-12 sm:left-12 z-[110]">
                <Link 
                    href="/"
                    className="flex items-center gap-2 group transition-all active:scale-95"
                >
                    <div className="w-8 h-8 rounded-lg bg-[#63FF9D]/10 flex items-center justify-center border border-[#63FF9D]/20 group-hover:border-[#63FF9D]/50 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-[#63FF9D] animate-pulse"/>
                    </div>
                    <span className="text-[#63FF9D] font-black text-xl tracking-tighter group-hover:text-white transition-colors">
                        Studysprout
                    </span>
                </Link>
            </div>

            {/* Background Decorative Layers */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Primary Mint Glow */}
                <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[#63FF9D] opacity-[0.08] blur-[120px] animate-pulse" />
                
                {/* Secondary Blue/Purple Glow for Depth */}
                <div className="absolute bottom-[10%] right-[10%] h-[500px] w-[500px] rounded-full bg-blue-600 opacity-[0.05] blur-[150px] [animation-delay:2s] animate-pulse" />
                
                {/* Subtly Grainy Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>
            {/* Background Decorative Blur */}
            <div className="absolute top-1/2 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-[#63FF9D]/5 blur-[120px] animate-pulse" />

            <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 
            lg:gap-24 flex-1 mb-20">

                {/* Left side: Brand Copy */}
                <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
                    <h1 className="text-5xl sm:text-7xl font-extrabold text-white leading-tight tracking-tighter">
                        Cultivate your <br />
                        <span className="text-[#63FF9D]">Intellect.</span>
                    </h1>

                    <p className="text-gray-500 text-lg max-w-md leading-relaxed">
                        Access the world&apos;s most advanced neural learning environment. 
                        Where collective intelligence meets organic cognitive growth.
                    </p>
                </div>

                {/* Right side: Modern Auth Form */}
                <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                    <div className="bg-[#080C0C]/50 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative">

                        <header className="mb-10">
                            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                            <p className="text-gray-500 text-sm">Continue your journey through the greenhouse.</p>
                        </header>

                        {/* Preserving your existing Form logic */}
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                
                                {/* Identifier Field */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">
                                        Email Address
                                    </label>
                                    <FormField 
                                        name="identifier"
                                        control={form.control}
                                        render={({ field }) => (
                                            <FormItem className="space-y-0">
                                                <FormControl>
                                                    <Input 
                                                        {...field}
                                                        icon={<Mail size={16} className="text-gray-600" />}
                                                        placeholder="username or email"
                                                        className="w-full bg-white/[0.03] border-white/10 rounded-2xl py-6 pl-12 pr-4 text-sm text-white focus-visible:ring-[#63FF9D]/50 transition-all placeholder:text-gray-700"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px] mt-1 ml-2 text-red-500 font-bold uppercase tracking-widest" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Password Field with Isolated Header */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1 mb-2">
                                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                            Password
                                        </label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-[10px] font-bold text-[#63FF9D] hover:underline"
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
                                                        className="w-full bg-white/[0.03] border-white/10 rounded-2xl py-6 pl-12 pr-4 text-sm text-white focus-visible:ring-[#63FF9D]/50 transition-all placeholder:text-gray-700"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px] mt-1 ml-2 text-red-500 font-bold uppercase tracking-widest" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full bg-[#63FF9D] text-black font-black uppercase text-xs tracking-widest py-6 rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(99,255,157,0.2)]"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : "Sign In"}
                                </Button>
                            </form>
                        </Form>

                        {/* Social Auth Grid */}
                        <div className="mt-10">
                            <div className="relative flex items-center justify-center mb-8">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                                <span className="relative px-4 bg-[#080C0C] text-[10px] font-black text-gray-600 uppercase tracking-widest">Or Continue With</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => signIn('google')}
                                    className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    <Chrome size={18} className="text-gray-400" />
                                    <span className="text-xs font-bold text-gray-300">Google</span>
                                </button>
                                <button 
                                    onClick={() => signIn('github')}
                                    className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    <Github size={18} className="text-gray-400" />
                                    <span className="text-xs font-bold text-gray-300">GitHub</span>
                                </button>
                            </div>
                        </div>

                        <p className="mt-10 text-center text-xs text-gray-600">
                            Don&apos;t have an account? <Link href="/sign-up" className="text-[#63FF9D] font-bold hover:underline">Sign Up</Link>
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

export default SignIn;