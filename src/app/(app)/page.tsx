"use client"
import { Button } from "@/components/ui/button";
import React from "react";
import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter()
  return (
   <section>
    <div className="overflow-hidden px-4 sm:px-6 mt-10 sm:flex sm:flex-col gap-4 md:justify-center md:items-center">
        <Button onClick={() => router.push("/sign-up")}>Get Start</Button>
    </div>
   </section>
  );
}
