"use client"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { verifySchema } from "@/schemas/verifySchema"
import { ApiResponse } from "@/types/api.interface"
import { zodResolver } from "@hookform/resolvers/zod"
import axios, { AxiosError } from "axios"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import React from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"

const VerifyAccount = () => {
    const router = useRouter()
    // taking data from params (url)
    const params = useParams<{username: string}>()
    const { toast } = useToast()
    

    // zod implementation
  const form = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema)
  })

  const onSubmit = async(data: z.infer<typeof verifySchema>) => {
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
        const axiosError = error as AxiosError<ApiResponse>
        let errorMessage = axiosError.response?.data.message 
        toast({
            title: "Sign up failed",
            description: errorMessage,
            variant: "destructive"
        })
    }
  }
    return(
            <div>
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
                    <Button type="submit">Submit</Button>
                </form>
            </Form>
            </div>
    )
}

export default VerifyAccount