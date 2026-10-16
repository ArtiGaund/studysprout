"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"
import { useEffect, useState } from "react"
// for schema based username verification
import { useDebounceCallback } from "usehooks-ts"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { signUpSchema } from "@/schemas/signUpSchema"
import axios, { AxiosError } from "axios"
import { ApiResponse } from "@/types/api.interface"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Chrome, Github, Loader2, Lock, Mail } from "lucide-react"
import { IconUser, IconMail, IconLock } from "@tabler/icons-react";
import { signIn } from "next-auth/react"
import { Footer } from "@/landing/components/Footer"


const SignUp = () => {
    const [ username, setUsername ] = useState('')
    // username is available or not
    const [usernameAvailable, setUsernameAvailable ] = useState('')
    // setting loader field when we are sending request to backend
    const [ isCheckingUsername, setIsCheckingUsername ] = useState(false)
    // set of form
    const [ isSubmitting, setIsSubmitting ] = useState(false)
    // hook->to send username and will get the username return
    const debounce = useDebounceCallback(setUsername, 300)
    const { toast } = useToast()
    const router = useRouter()

    // schema base verification
    const form = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
        }
    })

    // debouncing when username value is changed 
    useEffect(()=> {
        // checking username
        const checkUsernameUnique = async() => {
            if(username){
                setIsCheckingUsername(true)
                setUsernameAvailable('')
                try {
                    const response = await axios.get(`/api/check-username-unique?username=${username}`)
                    setUsernameAvailable(response.data.message)
                } catch (error) {
                    const axiosError = error as AxiosError<ApiResponse<any>>
                    setUsernameAvailable(
                        axiosError.response?.data.message || "Error while checking username"
                    )
                } finally{
                    setIsCheckingUsername(false)
                }
            }
        }
        checkUsernameUnique()
    },[username])

    // when form is submit
    const onSubmit = async ( data: z.infer<typeof signUpSchema>) => {
        setIsSubmitting(true)
        try {
            const response = await axios.post<ApiResponse<any>>('/api/sign-up', data)
            toast({
                title: 'Sign up successful',
                description: response.data.message
            })
            router.replace(`/verify/${username}`)
        } catch (error) {
            console.error("Error in sign-up of user", error);
            const axiosError = error as AxiosError<ApiResponse<any>>
            let errorMessage = axiosError.response?.data.message 
            toast({
                title: "Sign up failed",
                description: errorMessage,
                variant: "destructive"
            })
        } finally{
            setIsSubmitting(false)
        }
    }
    return(
        <main className="relative min-h-screen bg-[#0A0507] text-white flex flex-col 
            items-center justify-start lg:justify-center pt-24 sm:pt-28 lg:pt-12 px-4 sm:px-8 
            lg:px-12 pb-0 overflow-y-auto lg:overflow-hidden select-none">
                    
            {/* Brand Navigation - Top left anchor */}
            <div className="absolute top-8 left-8 sm:top-12 sm:left-12 z-[110]">
                <Link 
                href="/"
                className="flex items-center gap-2.5 group transition-transform active:scale-95"
                >
                    <div className="w-8 h-8 rounded-xl bg-purple-950/50 flex items-center 
                    justify-center border border-purple-500/30 
                    group-hover:border-purple-500/60 transition-colors">
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
                <div className="absolute top-[-10%] left-[-10%] h-[550px] w-[550px] rounded-full
                 bg-purple-900/10 blur-[140px]" />
                <div className="absolute bottom-[10%] right-[10%] h-[450px] w-[450px] 
                rounded-full bg-amber-900/10 blur-[150px]" />
            </div>

            <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 
            lg:gap-20 flex-1 mb-16 z-10">
        
                {/* Left side: Brand Copy */}
                <div className="flex-1 space-y-6">
                    <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight 
                    tracking-tight">
                        Cultivate your <br />
                        <span className="text-purple-400">{`Potential.`}</span>
                    </h1>
        
                    <p className="text-neutral-400 text-sm max-w-md leading-relaxed font-mono">
                        Join our collective ecosystem of learners. Watch your ideas branch
                        out and connect in a space designed for organic growth.
                    </p>
                </div>
        
                {/* Right side: Modern Auth Form */}
                <div className="w-full max-w-md">
                    <div className="bg-[#110A10] backdrop-blur-3xl border font-mono
                        border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative">
        
                        <header className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
                                Create Account
                            </h2>
                            <p className="text-neutral-400 text-xs">
                                Start your intellectual journey today.
                            </p>
                        </header>
        
                        {/* Preserving your existing Form logic */}
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-neutral-400 
                                    uppercase tracking-widest px-0.5">
                                        Username
                                    </label>
                                    <FormField 
                                        name="username"
                                        control={form.control}
                                        render={({ field }) => (
                                        <FormItem className="space-y-0">
                                            <FormControl>
                                                <div className="relative flex items-center">
                                                    <Input 
                                                        icon={<IconUser />}
                                                        placeholder="username"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e)
                                                            debounce(e.target.value)
                                                        }}
                                                        className="w-full bg-[#0A0507] 
                                                        border-white/10 rounded-xl py-5 pl-10 
                                                        pr-9 text-xs text-white transition-all
                                                        focus-visible:ring-purple-500/50 
                                                        placeholder:text-neutral-600"
                                                    />
                                                    {isCheckingUsername && 
                                                        <Loader2 className="animate-spin 
                                                        absolute right-3 w-4 h-4 text-purple-400"/>
                                                    }
                                                </div>
                                            </FormControl>
                                                       
                                            {usernameAvailable && (
                                                <p className={`relative text-[10px]
                                                    mt-1.5 ml-1 font-bold uppercase tracking-wider 
                                                    ${usernameAvailable === "Username is unique" 
                                                        ? 'text-emerald-400' : 'text-rose-400'
                                                    } left-[12px]`}
                                                >
                                                    {usernameAvailable}
                                                </p>
                                            )}
                                            <FormMessage className="text-[10px] mt-1 ml-1 
                                            text-rose-400 font-bold uppercase tracking-wider" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            {/* Identifier Field */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-neutral-400 
                                uppercase tracking-widest px-0.5">
                                    Email Address
                                </label>
                                <FormField 
                                    name="email"
                                    control={form.control}
                                    render={({ field }) => (
                                    <FormItem className="space-y-0">
                                        <FormControl>
                                            <Input 
                                                {...field}
                                                icon={<Mail size={16} className="text-neutral-500" />}
                                                placeholder="email"
                                                className="w-fullbg-[#0A0507] transition-all
                                                border-white/10 rounded-xl py-5 
                                                pl-10 pr-4 text-xs text-white 
                                                focus-visible:ring-purple-500/50 
                                                placeholder:text-neutral-600"
                                            />
                                        </FormControl>
                                        <FormMessage 
                                            className="text-[10px] mt-1 ml-1  tracking-wider
                                            text-rose-400 font-bold uppercase" />
                                    </FormItem>
                                    )}
                                />
                            </div>
        
                                        {/* Password Field with Isolated Header */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center 
                                            px-0.5">
                                                <label className="text-[10px] font-bold 
                                                text-neutral-400 uppercase tracking-widest">
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
                                                                icon={
                                                                    <Lock 
                                                                    size={16} 
                                                                    className="text-neutral-500" 
                                                                    />
                                                                }
                                                                className="bg-[#0A0507] border-white/10 rounded-xl py-5 pl-10 pr-4 text-xs text-white focus-visible:ring-purple-500/50 transition-all placeholder:text-neutral-600"
                                                            />
                                                        </FormControl>
                                                        <FormMessage 
                                                        className="text-[10px]mt-1 ml-1 text-rose-400 font-bold uppercase tracking-wider" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
        
                                        <Button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="w-full bg-purple-600 hover:bg-purple-500 
                                            text-white font-bold uppercase text-xs tracking-wider
                                             py-6 rounded-xl flex items-center justify-center gap-2 
                                             active:scale-[0.99] transition-all"
                                        >
                                            {isSubmitting 
                                            ? <Loader2 className="animate-spin text-purple-200" size={16}/> 
                                            : "Sign Up"
                                            }
                                        </Button>
                                    </form>
                                </Form>
        
                                {/* Social Auth Grid */}
                                <div className="mt-6">
                                    <div className="relative flex items-center justify-center 
                                    mb-5">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-white/10" />
                                            </div>
                                        <span className="relative px-3 bg-[#110A10] 
                                        text-[10px] font-bold text-neutral-500 uppercase
                                         tracking-widest">
                                            Or Continue With
                                        </span>
                                    </div>
        
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => signIn('google')}
                                            className="flex items-center justify-center gap-2 bg-[#0A0507] border border-white/10 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
                                        >
                                            <Chrome 
                                            size={18} 
                                            className="text-neutral-400" 
                                            />
                                            <span className="text-xs font-bold text-neutral-300">
                                                Google
                                            </span>
                                        </button>
                                        <button 
                                            onClick={() => signIn('github')}
                                            className="flex items-center justify-center gap-2 bg-[#0A0507] border border-white/10 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
                                        >
                                            <Github 
                                            size={18} 
                                            className="text-neutral-400" 
                                            />
                                            <span className="text-xs font-bold text-neutral-300">
                                                GitHub
                                            </span>
                                        </button>
                                    </div>
                                </div>
        
                                <p className="mt-6 text-center text-xs text-neutral-500">
                                    Already have an account? <Link 
                                    href="/sign-in" 
                                    className="text-purple-400 font-bold hover:text-purple-300 transition-colors">
                                        Sign In
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

export default SignUp