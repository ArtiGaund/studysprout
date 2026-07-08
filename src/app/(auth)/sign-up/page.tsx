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
        <main className="relative min-h-screen bg-[#050A0A] flex flex-col items-center 
            justify-start lg:justify-center pt-24 sm:pt-28 lg:pt-12 px-4 sm:px-8 lg:px-12 
            pb-0 overflow-y-auto lg:overflow-hidden">
                    
            {/* Brand Navigation - Top left anchor */}
            <div className="absolute top-8 left-8 sm:top-12 sm:left-12 z-[110]">
                <Link 
                href="/"
                className="flex items-center gap-2 group transition-all active:scale-95"
                >
                    <div className="w-8 h-8 rounded-lg bg-[#63FF9D]/10 flex items-center 
                    justify-center border border-[#63FF9D]/20
                     group-hover:border-[#63FF9D]/50 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-[#63FF9D] animate-pulse"/>
                    </div>
                    <span className="text-[#63FF9D] font-black text-xl tracking-tighter
                     group-hover:text-white transition-colors">
                        Studysprout
                    </span>
                </Link>
            </div>
        
            {/* Background Decorative Layers */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Primary Mint Glow */}
                <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full
                 bg-[#63FF9D] opacity-[0.08] blur-[120px] animate-pulse" />
                        
                    {/* Secondary Blue/Purple Glow for Depth */}
                    <div className="absolute bottom-[10%] right-[10%] h-[500px] w-[500px] 
                    rounded-full bg-blue-600 opacity-[0.05] blur-[150px] [animation-delay:2s]
                     animate-pulse" />
                        
                    {/* Subtly Grainy Texture Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay 
                    pointer-events-none 
                    bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                </div>

                {/* Background Decorative Blur */}
                <div className="absolute top-1/2 left-1/4 -z-10 h-[500px] w-[500px] rounded-full
                 bg-[#63FF9D]/5 blur-[120px] animate-pulse" />
        
                    <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 
                    lg:gap-24 flex-1 mb-20">
        
                        {/* Left side: Brand Copy */}
                        <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-left-8
                         duration-1000">
                            <h1 className="text-5xl sm:text-7xl font-extrabold text-white 
                            leading-tight tracking-tighter">
                                Cultivate your <br />
                                <span className="text-[#63FF9D]">{`Potential.`}</span>
                            </h1>
        
                            <p className="text-gray-500 text-lg max-w-md leading-relaxed">
                               Join our collective ecosystem of learners. Watch your ideas branch
                               out and connect in a space designed for organic growth.
                            </p>
                        </div>
        
                        {/* Right side: Modern Auth Form */}
                        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 
                        duration-1000 delay-200">
                            <div className="bg-[#080C0C]/50 backdrop-blur-3xl border
                             border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative">
        
                                <header className="mb-10">
                                    <h2 className="text-3xl font-bold text-white mb-2">
                                        Create Account
                                    </h2>
                                    <p className="text-gray-500 text-sm">
                                        Start your intellectual journey today.
                                    </p>
                                </header>
        
                                {/* Preserving your existing Form logic */}
                                <Form {...form}>
                                    <form 
                                    onSubmit={form.handleSubmit(onSubmit)} 
                                    className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black
                                             text-gray-600 uppercase tracking-widest px-1">
                                                Email Address
                                            </label>
                                             <FormField 
                                                name="username"
                                                control={form.control}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input 
                                                            icon={<IconUser />}
                                                            placeholder="username"
                                                            {...field}
                                                            onChange={(e) => {
                                                                field.onChange(e)
                                                                debounce(e.target.value)
                                                            }}
                                                            className="w-full bg-white/[0.03]
                                                             border-white/10 rounded-2xl py-6 
                                                             pl-12 pr-4 text-sm text-white
                                                              focus-visible:ring-[#63FF9D]/50 
                                                              transition-all
                                                               placeholder:text-gray-700"
                                                            />
                                                        </FormControl>
                                                        {isCheckingUsername && <Loader2 className="animate-spin"/>}
                                                        <p className={`relative text-sm ${usernameAvailable === "Username is unique" ?
                                                            'text-green-500' : 'text-red-500'
                                                        } left-[12px]`}>
                                                            {usernameAvailable}
                                                        </p>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        {/* Identifier Field */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black
                                             text-gray-600 uppercase tracking-widest px-1">
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
                                                            icon={<Mail size={16} className="text-gray-600" />}
                                                            placeholder="email"
                                                            className="w-full bg-white/[0.03]
                                                             border-white/10 rounded-2xl py-6 
                                                             pl-12 pr-4 text-sm text-white
                                                              focus-visible:ring-[#63FF9D]/50 
                                                              transition-all
                                                               placeholder:text-gray-700"
                                                            />
                                                        </FormControl>
                                                        <FormMessage 
                                                        className="text-[10px] mt-1 ml-2
                                                         text-red-500 font-bold uppercase 
                                                         tracking-widest" />
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
                                                                icon={
                                                                    <Lock 
                                                                    size={16} 
                                                                    className="text-gray-600" 
                                                                    />
                                                                }
                                                                className="w-full
                                                                 bg-white/[0.03]
                                                                  border-white/10 rounded-2xl
                                                                   py-6 pl-12 pr-4 text-sm
                                                                    text-white
                                                                     focus-visible:ring-[#63FF9D]/50
                                                                      transition-all
                                                                       placeholder:text-gray-700"
                                                            />
                                                        </FormControl>
                                                        <FormMessage 
                                                        className="text-[10px] mt-1 ml-2
                                                         text-red-500 font-bold uppercase 
                                                         tracking-widest" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
        
                                        <Button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="w-full bg-[#63FF9D] text-black font-black uppercase text-xs tracking-widest py-6 rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(99,255,157,0.2)]"
                                        >
                                            {isSubmitting 
                                            ? <Loader2 className="animate-spin" size={16}/> 
                                            : "Sign Up"
                                            }
                                        </Button>
                                    </form>
                                </Form>
        
                                {/* Social Auth Grid */}
                                <div className="mt-10">
                                    <div className="relative flex items-center justify-center 
                                    mb-8">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-white/5" />
                                            </div>
                                        <span className="relative px-4 bg-[#080C0C] 
                                        text-[10px] font-black text-gray-600 uppercase
                                         tracking-widest">
                                            Or Continue With
                                        </span>
                                    </div>
        
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => signIn('google')}
                                            className="flex items-center justify-center gap-3
                                             bg-white/5 border border-white/10 py-3
                                              rounded-xl hover:bg-white/10 transition-colors"
                                        >
                                            <Chrome 
                                            size={18} 
                                            className="text-gray-400" 
                                            />
                                            <span className="text-xs font-bold text-gray-300">
                                                Google
                                            </span>
                                        </button>
                                        <button 
                                            onClick={() => signIn('github')}
                                            className="flex items-center justify-center gap-3
                                             bg-white/5 border border-white/10 py-3
                                              rounded-xl hover:bg-white/10 transition-colors"
                                        >
                                            <Github 
                                            size={18} 
                                            className="text-gray-400" 
                                            />
                                            <span className="text-xs font-bold text-gray-300">
                                                GitHub
                                            </span>
                                        </button>
                                    </div>
                                </div>
        
                                <p className="mt-10 text-center text-xs text-gray-600">
                                    Already have an account? <Link 
                                    href="/sign-in" 
                                    className="text-[#63FF9D] font-bold hover:underline">
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