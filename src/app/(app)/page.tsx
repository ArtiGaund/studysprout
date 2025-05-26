"use client"
import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen, HardDrive, Users   } from "lucide-react";

export default function Home() {
  const router = useRouter()
  return (
   <section className="min-h-screen h-screen flex justify-center items-center overflow-hidden relative">
   {/* Left side orange color */}
        <div className="absolute w-[50rem] h-[50rem] rounded-full bg-gradient-to-br from-orange-900 via-orange-950
         to-black opacity-40 blur-3xl left-[-10rem]"/>

        {/* Middle green  */}
        <div className="absolute w-[20rem] h-[50rem] bg-gradient-to-br from-jungle-green via-dark-cyan opacity-40
         blur-3xl rotate-[-15deg] left-[35rem] z-[-10]" />
         {/* right side purple color */}
          <div className="absolute w-[50rem] h-[50rem] rounded-full bg-gradient-to-br via-zantium from-dark-purple
         to-black opacity-40 blur-3xl right-[0rem] rotate-[-25deg] top-[-15rem]"/>
  <div className="flex flex-col justify-between items-center w-full max-w-5xl px-4 py-10 h-full z-10">
    
    {/* Logo + Hero Text */}
    <div className="text-center">
      <div className="flex justify-center items-center mb-4">
        <Image 
          src="/images/logo.png"
          alt="logo"
          width={120}
          height={120}
        />
      </div>

      <h1 className="text-[2.5rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#A78BFA] to-[#60A5FA]">
        Take Smart Notes. Revise Faster. Stay Organized.
      </h1>
      <p className="text-gray-400 text-sm mt-4 max-w-2xl mx-auto">
        StudySprout is your all-in-one note-taking app built for productivity. Create structured notes,
        convert them into flashcards for instant revision, and access everything offline.
        Whether you&apos;re studying, planning, or brainstorming — StudySprout keeps your knowledge in sync.
      </p>
      <span className="text-lg text-green-600 mt-4 block">
        Start organizing your learning today — smarter, faster, and offline-ready.
      </span>

      {/* Button */}
      <div className="mt-6">
        <button
          className="relative inline-block p-px font-semibold leading-6 text-white bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95"
          onClick={() => router.push("/sign-up")}
        >
          <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <span className="relative z-10 block px-6 py-3 rounded-xl bg-gray-950">
            <div className="relative z-10 flex items-center space-x-2">
              <span className="transition-all duration-500 group-hover:translate-x-1">
                Let&apos;s get started
              </span>
              <svg className="w-6 h-6 transition-transform duration-500 group-hover:translate-x-1" fill="currentColor" viewBox="0 0 20 20">
                <path clipRule="evenodd" fillRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" />
              </svg>
            </div>
          </span>
        </button>
      </div>
    </div>

    {/* Cards Section */}
    <div className="w-full mt-8 flex justify-center">
      <div className="flex flex-wrap justify-center items-start gap-6">
        {/* Card 1 */}
        <div className="w-[15rem] p-4 rounded-lg bg-gradient-to-br from-gray-900 via-gray-700 to-gray-800 text-white shadow-lg">
          <BookOpen className="w-6 h-6 text-purple-400 mb-2" />
          <h3 className="text-lg font-semibold mb-2">Smart Learning Tools</h3>
          <div className="text-sm space-y-1 text-gray-300">
            <p>📚 Flashcards for revision</p>
            <p>🔍 Powerful search</p>
            <p>🎥 Multimedia support</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="w-[15rem] p-4 rounded-lg bg-gradient-to-br from-gray-900 via-gray-700 to-gray-800 text-white shadow-lg">
          <HardDrive className="w-6 h-6 text-blue-400 mb-2" />
          <h3 className="text-lg font-semibold mb-2">Seamless Accessibility</h3>
          <div className="text-sm space-y-1 text-gray-300">
            <p>📶 Offline usage</p>
            <p>🕰️ Version control</p>
            <p>📂 Structured notes</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="w-[15rem] p-4 rounded-lg bg-gradient-to-br from-gray-900 via-gray-700 to-gray-800 text-white shadow-lg">
          <Users className="w-6 h-6 text-green-400 mb-2" />
          <h3 className="text-lg font-semibold mb-2">Collaboration & Sync</h3>
          <div className="text-sm space-y-1 text-gray-300">
            <p>🤝 Real-time collaboration</p>
            <p>🧠 Knowledge sync</p>
            <p>🔁 Always in sync</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</section>

  );
}
