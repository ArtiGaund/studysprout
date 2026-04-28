'use client';

// import { EditorSection } from "./components/Editor-Section";
import { FlashcardSection } from "./components/Flashcard-Section";
import { Footer } from "./components/Footer";
import { HeroSection } from "./components/Hero-Section";
import { KnowledgeGraphSection } from "./components/Knowledge-Graph-Section";
import { Navbar } from "./components/Navbar";
import { NavbarDebugger } from "./components/NavbarDebugger";
import { WorkspaceShowcaseSection } from "./components/Workspace-Showcase-Section";
import dynamic from 'next/dynamic';

// Import the EditorSection dynamically and disable server-side rendering
const EditorSection = dynamic(
  () => import('./components/Editor-Section').then((mod) => mod.EditorSection),
  { ssr: false }
);

export const LandingPage = () => {
    return (
        <>
            <Navbar />
            {/* <NavbarDebugger /> */}
            <HeroSection />
            <WorkspaceShowcaseSection />
            <EditorSection />
            <FlashcardSection />
            <KnowledgeGraphSection />
            <Footer />
        </>
    )
}