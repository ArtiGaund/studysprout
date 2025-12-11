"use client"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { verifySchema } from "@/schemas/verifySchema"
import { ApiResponse } from "@/types/api.interface"
import { zodResolver } from "@hookform/resolvers/zod"
import axios, { AxiosError } from "axios"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import React, { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { IconCode } from "@tabler/icons-react";
import Link from "next/link"
import { Loader2 } from "lucide-react"

const VerifyAccount = () => {
    const router = useRouter()
    // taking data from params (url)
    const params = useParams<{username: string}>()
    const { toast } = useToast()
    const [ isSubmitting, setIsSubmitting ] = useState(false)
    

    // zod implementation
  const form = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema)
  })

  const onSubmit = async(data: z.infer<typeof verifySchema>) => {
     setIsSubmitting(true)
    try {
        const response = await axios.post(`/api/verify-code`, {
            username: params.username,
            code: data.code
        })
        toast({
            title: "Success",
            description: response.data.message
        })

        router.replace('/sign-in')
    } catch (error) {
        console.error("Error in verifying user", error);
        const axiosError = error as AxiosError<ApiResponse<any>>
        let errorMessage = axiosError.response?.data.message 
        toast({
            title: "Sign up failed",
            description: errorMessage,
            variant: "destructive"
        })
    }finally{
            setIsSubmitting(false)
        }
  }
    return(
            <div className="flex  bg-black h-screen justify-center items-center ">
                        <div className="flex flex-row w-[60rem] h-[30.5rem] rounded-3xl bg-zinc-900">
                                    <div className="flex flex-1 items-center justify-center">
                                        <div className="flex flex-col gap-y-4">
                                            <h2 className="text-3xl font-bold text-neutral-200">
                                                Verification code
                                            </h2>
            {/* Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        name="code"
                        control={form.control}
                    
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Verification code</FormLabel>
                        <FormControl>
                            <Input placeholder="shadcn" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    {/* <Button type="submit">Submit</Button> */}
                     <Button className="w-full p-2" type="submit" disabled={isSubmitting}>
                                                        {
                                                            isSubmitting ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Please Wait
                                                                </>
                                                            ) : ('Submit')
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

export default VerifyAccount