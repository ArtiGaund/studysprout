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
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <FormField 
                    name="username"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input 
                                placeholder="username"
                                {...field}
                                onChange={(e) => {
                                    field.onChange(e)
                                    debounce(e.target.value)
                                }}
                                />
                            </FormControl>
                            {isCheckingUsername && <Loader2 className="animate-spin"/>}
                            <p className={`text-sm ${usernameAvailable === "Username is unique" ?
                                'text-green-500' : 'text-red-500'
                            }`}>
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="email" 
                                {...field} 
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
                                ) : ('SignUp')
                            }
                        </Button>
                </form>
            </Form>
        </div>
    )
}

export default SignUp