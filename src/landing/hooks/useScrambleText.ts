import { useEffect, useState } from "react"

export const useScrambleText = (
    text: string,
    delay: number = 0
) => {
    const [display, setDisplay] = useState("");
        const chars = "!<>-_\\/[]{}—=+*^?#________";
    
        useEffect(() => {
            let frame = 0;
            const timer = setTimeout(() => {
                const interval = setInterval(() => {
                    setDisplay(
                        text.split("").map((char, index) => {
                            if (index < frame / 3) return char;
                            return chars[Math.floor(Math.random() * chars.length)];
                        }).join("")
                    );
                    frame++;
                    if (frame / 3 >= text.length) clearInterval(interval);
                }, 30);
            }, delay);
            return () => clearTimeout(timer);
        }, [text, delay]);
    
    return display;
}