import { CardContent } from "@/components/ui/card"
import { Undo2 } from "lucide-react";
import React, { useEffect, useRef } from "react";

/**
 * Renders a Mermaid diagram string as an SVG inline.
 */
const MermaidDiagram: React.FC<{
    diagramSyntax: string
}> = ({ diagramSyntax }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(!ref.current || !diagramSyntax) return;

        // Load mermaid from CDN if not already loaded
        const renderDiagram = async () => {
            if(!(window as any).mermaid){
                const script = document.createElement("script");
                script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
                script.onload = () => {
                    (window as any).mermaid.initialize({
                        startOnLoad: false,
                        theme: "dark",
                    });
                    renderNow();
                };
                document.head.appendChild(script);
            }else{
                renderNow();
            }
        };

        const renderNow = async () => {
            if(!ref.current) return;
            try {
                const { svg } = await (window as any).mermaid.render(
                    `diagram-${Date.now()}`,
                    diagramSyntax,
                );
                if(ref.current) ref.current.innerHTML = svg;
            } catch (error) {
                if(ref.current){
                    ref.current.innerHTML = `
                    <p className="text-rose-400 text-xs font-mono">Diagram render error</p>
                    `
                }
                console.error("[Diagram render Error]: ",error);
            }
        };
        renderDiagram();
    },[
        diagramSyntax,
    ])
    return <div ref={ref} className="w-full overflow-x-auto py-2"/>
}

/**
 * Render a simple bar/line/pie chart using HTML canvas.
 */
const SimpleChart: React.FC<{
    chartData: any
}> = ({ chartData }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if(!canvasRef.current || !chartData) return;
        const ctx = canvasRef.current.getContext("2d");
        if(!ctx) return;

        const {
            labels = [],
            values = [],
            title = "",
            chartType = "bar",
        } = chartData;

        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        const maxVal = Math.max(...values, 1);

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, width, height);

        // Title
        ctx.fillStyle = "#a78bfa";
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.fillText(title, width / 2, 20);

        if(chartType === "bar"){
            const barWidth = (width - 60) / labels.length - 10;
            labels.forEach((label: string, i: number) => {
                const barHeight = ((values[i] || 0) / maxVal) * (height - 60);
                const x = 30 + i * (barWidth + 10);
                const y = height - 30 - barWidth;

                ctx.fillStyle = `hsl(${260 + i * 30}, 70%, 60%)`;
                ctx.fillRect(x, y, barWidth, barHeight);

                ctx.fillStyle = "#a3a3a3";
                ctx.font = "10px monospace";
                ctx.textAlign = "center";
                ctx.fillText(label.slice(0, 8), x + barWidth / 2, height - 10);
                ctx.fillText(String(values[i]), x + barWidth / 2, y - 4);
            });
        }
    },[
        chartData,
    ])

    return <canvas 
        ref={canvasRef}
        width={320}
        height={200}
        className="rounded-lg border border-neutral-800 w-full max-w-sm mx-auto block 
        bg-neutral-950"
    />
}

interface MediaContentProps {
    heading: string;
    type: string;
    question: string;
    answer: string;
    revealAnswer: boolean;
    setRevealAnswer: (val: boolean) => void;
    data: any;
};

const MediaContent: React.FC<MediaContentProps> = ({
    heading,
    type,
    question,
    answer,
    revealAnswer,
    setRevealAnswer,
    data,
}) => {
    return(
        <CardContent className="space-y-4">
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <p className="text-[10px] font-sans text-neutral-400 mb-2 uppercase 
                tracking-wider">
                    {heading}
                </p>
                {type === "diagram" && <MermaidDiagram diagramSyntax={data} />}
                {type === "chart" && <SimpleChart chartData={data} />}
                {type === "image-labeling" && 
                    <img 
                        src = {question}
                        alt = "Label this image"
                        className = "max-w-full rounded-lg mx-auto block border border-neutral-800"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                        }}
                    />
                }
            </div>
           {type !== "image-labeling" &&( 
                <div className="bg-neutral-900/90 p-4 rounded-lg text-sm text-neutral-100
                border border-neutral-800/80">
                    <span className="text-neutral-400 font-mono text-xs uppercase 
                    tracking-wider block mb-1">
                        Question: 
                    </span>
                    {question}
                </div>
            )}

            {type === "image-labeling" &&
                <p className="text-xs font-mono text-neutral-400">
                    What are the key parts or labels in this image?
                </p>
            }
            {!revealAnswer ? (
                <button
                onClick={() => setRevealAnswer(true)}
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium
                 hover:bg-violet-500 transition-colors shadow-sm"
                >   
                    Reveal Answer
                </button>
            ) : (
                <div className="bg-neutral-900/90 p-4 rounded-lg text-sm border
                 border-neutral-800">
                    <span className="text-violet-400 font-mono text-xs uppercase 
                    tracking-wider block mb-1">
                        Answer: 
                    </span>
                    <span className="text-neutral-100">{answer}</span>
                </div>
            )}
        </CardContent>
    )
}

interface FlashcardContentRendererProps{
    heading?: string;
    card: any;
    revealAnswer: boolean;
    setRevealAnswer: (val: boolean) => void;
    checked?: boolean;
    setChecked: (val: boolean) => void;
    selectedOption?: string | null;
    setSelectedOption: (val: string | null) => void;
    userAnswer: Record<number, string>;
    setUserAnswer: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}
export const FlashcardContentRenderer: React.FC<FlashcardContentRendererProps> = ({
    heading,
    card,
    revealAnswer,
    setRevealAnswer,
    checked,
    setChecked,
    selectedOption,
    setSelectedOption,
    userAnswer,
    setUserAnswer,
}) => {
    
    switch(card.type){
        case "question-answer":
            return (
                <CardContent className="space-y-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider
                     text-neutral-400 block">
                        Question: 
                    </span>
                    <div className="bg-neutral-950 text-neutral-100 p-4 rounded-xl text-sm 
                    leading-relaxed border border-neutral-800">
                        {card.question}
                    </div>
                    {!revealAnswer ? (
                        <button 
                            onClick={() => setRevealAnswer(true)}
                            className="
                                mt-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm
                            hover:bg-violet-500 transition-colors font-medium shadow-sm
                            disabled:opacity-50 disabled:cursor-not-allowed
                            "
                        >
                                Reveal Answer
                            </button>
                            ) : (
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-mono uppercase 
                                        tracking-wider text-violet-400">
                                            Answer:
                                        </span>
                                        <button 
                                            onClick={() => setRevealAnswer(false)}
                                            className="p-1 rounded-md text-neutral-400
                                             hover:text-white hover:bg-neutral-800
                                              transition-colors"
                                              title="Hide answer"
                                        >
                                            <Undo2 size={20}/>
                                        </button>
                                    </div>
                                    <div className="bg-neutral-950/80 text-neutral-200 p-4
                                    rounded-xl border border-neutral-800 text-sm leading-relaxed">
                                        {card.answer}
                                    </div>
                                </div>
                        )}
                 </CardContent>
            );
       case "mcq": {
            const answerLetter = card.answer?.trim().toUpperCase();
            // "A" -> 0, "B" -> 1, etc. Primary match: position in the options array.
            const answerIndex = answerLetter?.length === 1
                ? answerLetter.charCodeAt(0) - 65
                : -1;

            // Fallback for options that still carry an "A) ..." style prefix
            const getOptionLetter = (opt: string) => opt?.trim().match(/^([A-Za-z])[).:]/)?.[1]?.toUpperCase();

            const correctOption =
                card.options?.[answerIndex] ??
                card.options?.find(
                    (opt: string) => opt === card.answer || getOptionLetter(opt) === answerLetter
                );

            return (
                <CardContent className="space-y-4">
                    <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider
                         text-neutral-400 block mb-1">
                            Question: 
                        </span>
                        <div className="bg-neutral-950 text-neutral-100 p-4 rounded-xl 
                        text-sm border border-neutral-800 leading-relaxed">
                            {card.question}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        {card.options?.map((option: string, key: number) => {
                            const isCorrect =
                                key === answerIndex ||
                                option === card.answer ||
                                getOptionLetter(option) === answerLetter;
                            const isSelected = option === selectedOption;

                            let optionStyle = "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 text-neutral-200";

                            if (isSelected) {
                                optionStyle = "border-violet-500/80 bg-violet-950/30 text-white";
                            }
                            if(checked){
                                if(isSelected && isCorrect) 
                                    optionStyle = "border-emerald-500 bg-emerald-950/40 text-emerald-300";
                                else if(isSelected && !isCorrect) 
                                    optionStyle = "order-rose-500 bg-rose-950/40 text-rose-300";
                                else if(isCorrect) 
                                    optionStyle = "border-emerald-500/80 bg-emerald-950/20 text-emerald-400";
                            }
                        return(
                            <div key={key}
                                onClick={() => !checked && setSelectedOption(option)}
                                className={`p-3 border rounded-lg cursor-pointer text-sm
                                     transition-all flex items-center gap-3 ${optionStyle}`}
                            >
                                <input
                                    type="radio"
                                    name={`option-${card._id}`}
                                    value={option}
                                    checked={isSelected}
                                    onChange={() => !checked && setSelectedOption(option)}
                                    className="accent-violet-500"
                                />
                                <span>{option}</span>
                            </div>
                        )
                    })}
                    </div>
                    <div className="flex flex-row items-center gap-3 pt-1">
                        <button
                            onClick={() => setChecked(true)}
                            disabled={!selectedOption || revealAnswer}
                            className="
                                px-4 py-2 rounded-lg bg-violet-600 text-white text-sm 
                                hover:bg-violet-500 transition-colors font-medium
                                disabled:opacity-40 disabled:cursor-not-allowed
                                "
                        >Check Answer</button>

                        {!revealAnswer && (
                            <button
                                onClick={() => {
                                    setSelectedOption(correctOption ?? null);
                                    setRevealAnswer(true);
                                    setChecked(true);
                                }}
                                className="
                                   px-4 py-2 rounded-lg border border-neutral-700
                                    text-neutral-300 text-sm hover:bg-neutral-800
                                     hover:text-white transition-colors
                                "
                            >
                                Reveal Answer
                            </button>
                        )}
                        {(checked || revealAnswer) && (
                            <button
                                onClick={() => {
                                    setSelectedOption(null);
                                    setChecked(false);
                                    setRevealAnswer(false);
                                }}
                                className="p-2 rounded-lg text-neutral-400 hover:text-white
                                 hover:bg-neutral-800 transition-colors"
                            >
                                <Undo2 size={20}/>
                            </button>
                        )}
                    </div>
                </CardContent>
            );
        }
        case "fill-in-the-blank":
            return(
                <CardContent className="space-y-4">
                    <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 
                    leading-relaxed">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-lg">
                            {card.question.split(/_{3,}/).map((
                                part: string,
                                i: number,
                                arr: any[]
                                ) => {
                                    const answerArray = card.answer.split(";").map((s:string) => s.trim());
                                    const currentVal = userAnswer[i] || "";
                                    return (
                                        <React.Fragment key={i}>
                                            <span className="text-neutral-200">{part}</span>
                                            {i !== arr.length - 1 && (
                                                <div className="inline-grid items-center 
                                                align-bottom">
                                                    <span className="invisible whitespace-pre 
                                                    px-1 col-start-1 row-start-1 text-lg">
                                                        {
                                                            ( revealAnswer 
                                                                ? answerArray[i]
                                                                : (currentVal || "...")) + " "
                                                        }
                                                    </span>
                                                    <input
                                                        autoFocus = { i=== 0}
                                                        disabled={revealAnswer || checked}
                                                        value={revealAnswer ? (answerArray[i] || "") : currentVal}
                                                        onChange={(e) => setUserAnswer(prev => ({
                                                            ...prev,
                                                            [i]: e.target.value
                                                        }))}
                                                        className={`
                                                            col-start-1 row-start-1 bg-transparent 
                                                            border-b-2 text-center outline-none
                                                            transition-all px-1 w-full font-mono text-base
                                                            ${checked
                                                                ? (currentVal.trim().toLowerCase() === (answerArray[i] || "").toLowerCase()
                                                                    ? "border-emerald-500 text-emerald-400"
                                                                    : "border-rose-500 text-rose-400")
                                                                : "border-violet-500 focus:border-white text-violet-200"
                                                            }
                                                            `}
                                                            placeholder="..."
                                                        />
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        )})}
                        </div>
                    </div>
                
                    <div className="flex flex-row items-center gap-3">
                        {/* Control Bar for Fill-in-the-Blanks */}
                        {!checked && !revealAnswer && (
                            <>
                                <button
                                    disabled={Object.keys(userAnswer).length === 0}
                                    onClick={() => setChecked(true)}
                                    className={`
                                        px-4 py-2 rounded-lg bg-violet-600 text-white text-sm
                                         hover:bg-violet-800 font-medium transition-colors
                                        disabled:opacity-40 disabled:cursor-not-allowed                                         
                                    `}
                                >
                                    Check Answer
                               </button>
                                <button
                                    onClick={() => setRevealAnswer(true)}
                                    className={`
                                        px-4 py-2 rounded-lg border border-neutral-700
                                         text-neutral-300 text-sm 
                                        hover:bg-neutral-800 hover:text-white transition-colors
                                    `}
                                >   
                                    Reveal Answer
                                </button>
                            </>
                        )}
                        {(checked || revealAnswer) && (
                            <button
                                onClick={() => {
                                    setUserAnswer({});
                                    setChecked(false);
                                    setRevealAnswer(false);
                                }}
                                className="flex items-center gap-1 px-3 py-1 text-neutral-400
                                 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                            >
                                <Undo2 size={20}/>
                                <span className="text-xs font-mono">Reset</span>
                            </button>
                        )}
                    </div>
                </CardContent>
            );
        case "diagram":
        case "chart":
        case "image-labeling":
            return(
                <MediaContent 
                heading={heading || ""}
                type={card.type}
                question={card.question}
                answer={card.answer}
                revealAnswer={revealAnswer}
                setRevealAnswer={setRevealAnswer}
                data= {card.diagram || card.chartData}
                />
            );
        default: 
            return (
                <CardContent>Unsupported card type.</CardContent>
            );
    }
}