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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { IconUser, IconMail, IconLock } from "@tabler/icons-react";


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
                    const axiosError = error as AxiosError<ApiResponse>
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
            const response = await axios.post<ApiResponse>('/api/sign-up', data)
            toast({
                title: 'Sign up successful',
                description: response.data.message
            })
            router.replace(`/verify/${username}`)
        } catch (error) {
            console.error("Error in sign-up of user", error);
            const axiosError = error as AxiosError<ApiResponse>
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
        <div className="flex  bg-black h-screen justify-center items-center ">
            <div className="flex flex-row w-[60rem] h-[30.5rem] rounded-3xl bg-zinc-900">
            <div className="flex flex-1 items-center justify-center">
                <div className="flex flex-col gap-y-4">
                    <h2 className="text-3xl font-bold text-neutral-200">
                        Welcome to StudySprout
                    </h2>
                    <div className="flex justify-center items-center">
                        <span>Already have an account?</span> &nbsp;
                        <span className="text-blue-600">
                            <Link href="/sign-in">Sign in</Link>
                        </span>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <FormField 
                            name="username"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    {/* <FormLabel>Username</FormLabel> */}
                                    <FormControl>
                                        <Input 
                                        icon={<IconUser />}
                                        placeholder="username"
                                        {...field}
                                        onChange={(e) => {
                                            field.onChange(e)
                                            debounce(e.target.value)
                                        }}
                                        className="w-full p-2"
                                        />
                                    </FormControl>
                                    {isCheckingUsername && <Loader2 className="animate-spin"/>}
                                    <p className={`relative text-sm ${usernameAvailable === "Username is unique" ?
                                        'text-green-500' : 'text-red-500'
                                    } left-[12px]`}>
                                        test {usernameAvailable}
                                    </p>
                                </FormItem>
                            )}
                            />
                            <FormField
                                name="email"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormControl>
                                        <Input 
                                        icon={<IconMail />}
                                        placeholder="email" 
                                        {...field} 
                                        className="w-full p-2"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                name="password"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormControl>
                                        <Input 
                                        icon={<IconLock />} 
                                        type="password" 
                                        placeholder="password" 
                                        {...field} 
                                        className="w-full p-2"
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
                                        ) : ('SignUp')
                                    }
                                </Button>
                        </form>
                    </Form>
                    
            </div>
            </div>
            <div className="flex-1 w-full h-full rounded-r-3xl overflow-hidden">
                <Image src="/images/login.PNG" width={500} height={400} alt="signup" />
            </div>
        </div>
        </div>
    )
}

export default SignUp