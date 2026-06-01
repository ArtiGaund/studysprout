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
                    <p className="text-red-400 text-sm">Diagram render error</p>
                    `
                }
                console.error("[Diagram render Error]: ",error);
            }
        };
        renderDiagram();
    },[
        diagramSyntax,
    ])
    return <div
    ref={ref}
    className="w-full overflow-x-auto py-2"
    />
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
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, width, height);

        // Title
        ctx.fillStyle = "#a78bfa";
        ctx.font = "bold 13px sans-serif";
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

                ctx.fillStyle = "#9ca3af";
                ctx.font = "10px sans-serif";
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
        className="rounded-lg border border-gray-700 w-full max-w-sm mx-auto block"
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
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                    {heading}
                </p>
                {type === "diagram" && 
                    <MermaidDiagram 
                    diagramSyntax={data}
                    />}
                {type === "chart" && 
                    <SimpleChart 
                        chartData={data}
                    />
                }
                {type === "image-labeling" && 
                    <img 
                        src = {question}
                        alt = "Label this image"
                        className = "max-w-full rounded-lg mx-auto block"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                        }}
                    />
                }
            </div>
           {type !== "image-labeling" && <div className="bg-gray-900 p-4 rounded-lg text-sm text-gray-100">
                <span className="text-gray-500">Question: </span>
                {question}
            </div>}

            {type === "image-labeling" &&
                <p className="text-sm text-gray-400">
                    What are the key parts or labels in this image?
                </p>
            }
            {!revealAnswer ? (
                <button
                onClick={() => setRevealAnswer(true)}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-500"
                >   
                    Reveal Answer
                </button>
            ) : (
                <div className="bg-gray-800 p-4 rounded-lg text-sm">
                    <span className="text-gray-500">Answer: </span>
                    <span className="text-gray-100">{answer}</span>
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
                <CardContent>
                    <span className="p-2 text-gray-600">Question: </span>
                        <div 
                        className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm leading-relaxed"
                        >
                            {card.question}
                        </div>
                        {!revealAnswer ? (
                            <button 
                            onClick={() => setRevealAnswer(true)}
                            className="
                            mt-3 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-300 transition
                            disabled:text-gray-500 disabled:cursor-not-allowed
                            "
                            >
                                Reveal Answer
                            </button>
                            ) : (
                                <button 
                                onClick={() => setRevealAnswer(false)}
                                className="mt-3 flex items-center gap-1 px-3 py-1"
                                >
                                   <Undo2 size={20}/>
                                </button>
                        )}
                        { revealAnswer &&
                           ( <>
                                <span className="p-2 text-gray-600">Answer: </span>
                                <div className="text-[15px]">{card.answer}</div>
                             </>
                          )}
                 </CardContent>
            );
        case "mcq":
            return (
                <CardContent>
                    <span className="p-2 text-gray-600">Question: </span>
                        <div 
                            className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm leading-relaxed"
                        >
                           {card.question}
                        </div>
                        {card.options?.map(( option: string, key: number) =>{ 
                            const isCorrect = option === card.answer;
                            const isSelected = option === selectedOption;
                
                            let optionStyle = "border-gray-300";
                
                            if(checked){
                                if(isSelected && isCorrect) optionStyle = "text-green-600";
                                else if(isSelected && !isCorrect) optionStyle = "text-red-600";
                                else if(isCorrect) optionStyle = "text-green-600";
                            }
                                return(
                                        <div key={key} 
                                        onClick={() => !checked && setSelectedOption(option)}
                                        className={`p-3 border rounded-lg cursor-pointer text-sm transition ${optionStyle}`}
                                        >
                                            <input 
                                            type="radio"
                                            name={`option-${card._id}`}
                                            value={option}
                                            checked={isSelected}
                                            onChange={() => !checked && setSelectedOption(option)}
                                            />
                                            <span>{option}</span>
                                         </div>
                        )})}
                        <div className="flex flex-row gap-3">
                            <button 
                                onClick={() => setChecked(true)}
                                disabled={!selectedOption || revealAnswer}
                                className="
                                mt-3 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-300 transition
                                disabled:text-gray-500 disabled:cursor-not-allowed disabled:bg-gray-300
                                "
                            >Check Answer</button>
                                    
                            {!revealAnswer && (
                                <button 
                                onClick={() =>{ 
                                setRevealAnswer(true);
                                setSelectedOption(card.answer);
                                setChecked(true);
                                 }}
                                className="
                                    mt-3 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-800 transition
                                    disabled:text-gray-500 disabled:cursor-not-allowed
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
                                    className="mt-3 flex items-center gap-1 px-3 py-1"
                                >
                                    <Undo2 size={20}/>
                                </button>
                            )}
                        </div>
                </CardContent>
            );
        case "fill-in-the-blank":
            return(
                <CardContent className="space-y-4">
                    <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 leading-relaxed">
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
                                            <span className="text-slate-200">{part}</span>
                                            {i !== arr.length - 1 && (
                                                <div className="inline-grid items-center align-bottom">
                                                    <span className="invisible whitespace-pre px-1 col-start-1 row-start-1 text-lg">
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
                                                            col-start-1 row-start-1 bg-transparent border-b-2 text-center outline-none
                                                            transition-all px-1 w-full
                                                            ${checked
                                                                ? (currentVal.trim().toLowerCase() === (answerArray[i] || "").toLowerCase()
                                                                    ? "border-green-500 text-green-400"
                                                                    : "border-red-500 text-red-400")
                                                                : "border-purple-500 focus:border-white"
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
                
                    <div className="flex flex-row gap-3">
                        {/* Control Bar for Fill-in-the-Blanks */}
                        {!checked && !revealAnswer && (
                            <>
                                <button
                                    disabled={Object.keys(userAnswer).length === 0}
                                    onClick={() => setChecked(true)}
                                    className={`
                                        px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-800
                                        disabled:bg-gray-700 transition
                                    `}
                                >
                                    Check Answer
                               </button>
                                <button
                                    onClick={() => setRevealAnswer(true)}
                                    className={`
                                        px-4 py-2 rounded-lg border border-purple-600 text-purple-400 text-sm
                                        hover:bg-purple-900/30 transition
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
                                className="flex items-center gap-1 px-3 py-1 text-gray-400 hover:text-white"
                            >
                                <Undo2 size={20}/>
                                <span className="text-xs">Reset</span>
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