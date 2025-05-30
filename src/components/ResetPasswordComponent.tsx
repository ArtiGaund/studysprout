"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { resetPasswordSchema } from "@/schemas/resetPasswordSchema";
import { ApiResponse } from "@/types/api.interface";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconLock } from "@tabler/icons-react";
import axios, { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const ResetPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    setIsSubmitting(true);

    const token = searchParams.get("token");
    const userId = searchParams.get("id");

    if (!token || !userId) {
      toast({
        title: "Invalid link",
        description: "Token or user ID is missing from the URL.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post("/api/reset-password", {
        ...data,
        token,
        userId,
      });

      if (!response.data.success) {
        toast({
          title: "Error",
          description: response.data.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: response.data.message,
        });
        router.push("/sign-in");
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: "Reset password failed",
        description: axiosError.response?.data.message ?? "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex bg-black h-screen justify-center items-center">
      <div className="flex flex-row w-[60rem] h-[30.5rem] rounded-3xl bg-zinc-900">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col gap-y-4">
            <h2 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200">
              Enter your email address
            </h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  name="password"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          icon={<IconLock />}
                          placeholder="Enter new password"
                          type="password"
                          {...field}
                          className="w-full p-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="confirmPassword"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          icon={<IconLock />}
                          placeholder="Confirm password"
                          type="password"
                          {...field}
                          className="w-full p-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button className="w-full p-2" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please Wait
                    </>
                  ) : (
                    "Submit"
                  )}
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
  );
};

export default ResetPasswordPage;
