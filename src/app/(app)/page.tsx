"use client"
import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen, HardDrive, Users   } from "lucide-react";
import ComingSoonRibbon from "@/components/global/coming-soon-ribbon";
import { LandingPage } from "@/landing/LandingPage";


export default function Home() {
  const router = useRouter()
  return (
    <LandingPage />
  );
}
