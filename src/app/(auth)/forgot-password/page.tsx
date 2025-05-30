"use client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast";
import { forgotPasswordSchema } from "@/schemas/forgotPasswordSchema";
import { ApiResponse } from "@/types/api.interface";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconMail } from "@tabler/icons-react";
import axios, { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form"
import { z } from "zod";

const ForgotPasswordPage = () => {
    const [ isSubmitting, setIsSubmitting ] = useState(false)
    const router = useRouter();

    const form = useForm<z.infer<typeof forgotPasswordSchema>>({
        resolver: zodResolver(forgotPasswordSchema)
    })


     const onSubmit = async(data: z.infer<typeof forgotPasswordSchema>) => {
        setIsSubmitting(true);
            try {
                const response = await axios.post('/api/forgot-password', data);
                if(!response.data.success){
                    toast({
                        title: "Error",
                        description: response.data.message,
                        variant: "destructive"
                    })
                }
                toast({
                    title: "Success",
                    description: response.data.message
                })
                router.push("/sign-in")
            } catch (error) {
                console.error("Error in sending reset link", error);
                            const axiosError = error as AxiosError<ApiResponse>
                            let errorMessage = axiosError.response?.data.message 
                            toast({
                                title: "Forgot password failed",
                                description: errorMessage,
                                variant: "destructive"
                            })
            }
            finally{
                        setIsSubmitting(false)
                    }
     }
    return(
        <div className="flex  bg-black h-screen justify-center items-center ">
                                <div className="flex flex-row w-[60rem] h-[30.5rem] rounded-3xl bg-zinc-900">
                                            <div className="flex flex-1 items-center justify-center">
                                                <div className="flex flex-col gap-y-4">
                                                    <h2 className="text-3xl font-bold text-neutral-200">
                                                        Enter your email address
                                                    </h2>
                    {/* Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                name="email"
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

export default ForgotPasswordPage;