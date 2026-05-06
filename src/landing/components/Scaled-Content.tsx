'use client';


interface ScaledContentProps{
    naturalWidth: number;
    naturalHeight: number;
    availW: number;
    availH: number;
    children: React.ReactNode;
}

export const ScaledContent: React.FC<ScaledContentProps> = ({
    naturalWidth,
    naturalHeight,
    availW,
    availH,
    children,
}) => {
    const scaleX = availW / naturalWidth;
    const scaleY = availH / naturalHeight;
    const scale = Math.min(scaleX, scaleY);
    return(
        <div
            style={{
                width: naturalWidth,
                height: naturalHeight,
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                flexShrink: 0,
                overflow: 'hidden',
            }}
        >
            {children}
        </div>
    )
}