'use client';

export default function ComingSoonRibbon(){
    return(
        <div 
         className="absolute bg-[#BD1550] shadow-[inset_0_-10px_0_#0005] px-2 py-1 text-white font-bold text-xs"
            style={{
                // CSS variables
                '--f': '10px',
                '--r': '15px',
                '--t': '10px',
                // Positioning
                inset: 'var(--t) calc(-1*var(--f)) auto auto',
                padding: '0 10px var(--f) calc(10px + var(--r))',
                // Clip-path
                clipPath:
                    'polygon(0 0,100% 0,100% calc(100% - var(--f)),calc(100% - var(--f)) 100%,calc(100% - var(--f)) calc(100% - var(--f)),0 calc(100% - var(--f)),var(--r) calc(50% - var(--f)/2))',
            } as React.CSSProperties}
        >
            Coming Soon
        </div>
    )
}