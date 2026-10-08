"use client";

import { useFolder } from "@/hooks/useFolder";
import { useEffect, useState } from "react";

interface GoalData{
    hoursThisWeek: number;
    weeklyTargetHours: number;
    progressPercent: number;
    subConceptsToday: number;
    subjectLabel: string | null;
    goalExists: boolean;
}

export interface StudyPlanFile{
   fileId: string;
   title: string;
   readingTimeMinutes: number;
}

interface StudyPlan{
    files: StudyPlanFile[];
    totalMinutes: number;
    remainingFiles: number;
    message: string;
}

interface WeeklyLearningGoalProps{
    folderId: string;
    workspaceId: string;
}

// Circular Progress Ring

const CircularProgress = ({ percent }: { percent: number }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - ( percent / 100) * circumference;

    return (
        <div className="relative w-[100px] h-[100px] flex-shrink-0">
            <svg 
                width="100" 
                height="100"
                style={{ transform: "rotate(-90deg)"}}
            >
                {/* Track */}
                <circle 
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="#1A0F18"
                    strokeWidth="8"
                />
                {/* Progress */}
                <circle 
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-500 ease-out"
                />
            </svg>

            {/* Label in career */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-bold text-zinc-100 font-mono">
                    {percent}%
                </span>
                <span className="text-[10px] font-mono text-zinc-500 tracking-wider">
                    GOAL
                </span>
            </div>
        </div>
    );
}

// Adjust Goal Modal

const AdjustGoalModal = ({
    folderId,
    workspaceId,
    current,
    subjectLabel,
    onClose,
    onSaved,
}: {
    folderId: string;
    workspaceId: string;
    current: number;
    subjectLabel: string | null;
    onClose: () => void;
    onSaved: (hours: number, label: string )=> void;
}) => {
    const [ hours, setHours ] = useState(current);
    const [ label, setLabel ] = useState(subjectLabel ?? "");
    const [ saving, setSaving ] = useState(false);

    const { updateLearningGoal } = useFolder();

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateLearningGoal(folderId, workspaceId, hours, label);
            if(!result.success){
                console.error("[AdjustGoal] Failed");
            }
            onSaved(hours, label);
            onClose();
        } catch (error) {
            console.error("[AdjustGoal] Failed ", error);
        }finally{
            setSaving(false);
        }
    }

    return (
        <div 
            className="bg-black/70 backdrop-blur-xs fixed inset-0 flex items-center 
            justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-[#110A10] border border-white/10 rounded-xl p-7 w-[360px]
                text-zinc-200"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="mb-4.5 text-xs font-mono font-bold text-zinc-100">
                    Adjust Weekly Goal
                </h3>
                <label className="text-xs font-mono text-zinc-400 block mb-1.5">
                    Subject name (optional)
                </label>
                <input 
                    type="text"
                    placeholder="e.g. Linear Algebra"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full bg-[#0A0507] border border-white/10 focus:border-purple-500/50 
                    rounded-lg text-zinc-200 py-2 px-3 text-xs font-mono outline-none mb-4"
                />

                <label className="text-xs font-mono text-zinc-400 block mb-1.5">
                    Weekly target (hours)
                </label>
                <input 
                    type="number"
                    min={1}
                    max={100}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full bg-[#0A0507] border border-white/10 focus:border-purple-500/50 
                    rounded-lg 
                    text-zinc-200 py-2 px-3 text-xs font-mono outline-none"
                />

                <div className="flex gap-2.5 mt-5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-lg border border-white/10 bg-transparent
                         text-zinc-400 hover:text-white cursor-pointer text-xs font-mono
                          transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex-1 py-2 rounded-xs border border-purple-500/30 
                            bg-purple-600 hover:bg-purple-500 text-white font-mono 
                            font-semibold transition-colors text-xs ${saving 
                                ? "cursor-not-allowed opacity-[0.7px]" 
                                : "cursor-pointer opacity-[1px]"}`
                        }
                    >
                        {saving ? "Saving..." : "Save" }
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Deep Session
const DeepSessionDrawer = ({
    folderId,
    onClose,
    onSessionComplete,
}: {
    folderId: string;
    onClose: () => void;
    onSessionComplete: () => void;
}) => {
    const [ minutes, setMinutes ] = useState(60);
    const [ plan, setPlan ] = useState<StudyPlan | null>(null);
    const [ loading, setLoading ] = useState(false);
    const { getStudPlan } = useFolder();

    const fetchPlan = async () => {
        setLoading(true);
        try {
            const result = await getStudPlan(folderId, minutes);
            if(!result.success && !result.data){
                console.error("[DeepSessionDrawer] Failed to fetch plan: ",result.error);
            }
            setPlan(result.data ?? null);
            onSessionComplete();
        } catch (error: any) {
            console.error("[DeepSessionDrawer] Failed: ",error.message);
        }finally{
            setLoading(false);
        }
    }

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-end 
            justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-[#110A10] border border-white/10 p-5 w-full max-w-[640px] 
                max-h-[70vh] overflow-auto text-zinc-200 rounded-t-[12px]"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-sm font-mono text-zinc-100 mb-4">
                    Deep Session Planner
                </h3>

                {!plan ? (
                    <>
                        <p className="text-xs font-mono text-zinc-400 mb-4">
                            How many minutes do you have?
                        </p>
                        <div className="flex gap-2.5 items-center">
                            <input 
                                type="number"
                                min={10}
                                max={480}
                                value={minutes}
                                onChange={(e) => setMinutes(Number(e.target.value))}
                                className="flex-1 bg-[#0A0507] border border-white/10
                                rounded-lg text-zinc-200 py-2 px-3 text-xs font-mono 
                                outline-none"
                            />
                            <span className="text-xs font-mono text-zinc-500">
                                minutes
                            </span>
                            <button
                                onClick={fetchPlan}
                                disabled={loading}
                                className={`py-2 px-5 rounded-[6px] bg-purple-600 hover:bg-purple-500 
                                text-white font-mono font-semibold border border-purple-400/30 transition-all
                                text-xs ${loading 
                                    ? "cursor-not-allowed opacity-[0.7px]" 
                                    : "cursor-pointer opacity-[1px]"}`}
                            >
                                {loading ? "Planning..." : "Plan It" }
                            </button>
                        </div>
                    </>
                ) : (
                   <>
                        <p className="text-xs font-mono text-purple-300 mb-4">
                            {plan.message} · {plan.totalMinutes} min total
                        </p>
                        {plan.files.map((f, i) => (
                            <div
                                key={f.fileId}
                                className="flex justify-between py-2.5 bg-[#0A0507] border
                                 border-white/5 text-xs items-center rounded-lg font-mono"
                            >
                                <span className="truncate pr-2 text-zinc-200">
                                    <span className="text-zinc-500 mr-2.5">
                                        {i + 1}.
                                    </span>
                                    {f.title}
                                </span>
                                <span className="text-zinc-400 shrink-0">
                                    {f.readingTimeMinutes}
                                </span>
                            </div>
                        ))}
                        {plan.remainingFiles > 0 && (
                            <p className="text-[12px] font-mono text-zinc-500 mt-3">
                                +{plan.remainingFiles} more files not included in this session
                            </p>
                        )}
                        <button
                            onClick={() => setPlan(null)}
                            className="mt-4 bg-transparent border border-white/10 hover:border-white/20
                             rounded-lg font-mono transition-colors
                            text-zinc-400 hover:text-white cursor-pointer py-2 px-4 text-xs"
                        >
                             ← Change duration
                        </button>
                   </>
                )}
            </div>
        </div>
    )
}

export const WeeklyLearningGoal = ({
    folderId,
    workspaceId,
}: WeeklyLearningGoalProps) => {
    const [ data, setData ] = useState<GoalData | null>(null);
    const [ loading, setLoading ] = useState(true);
    const [ showGoalModal, setShowGoalModal ] = useState(false);
    const [ showDeepSession, setShowDeepSession ] = useState(false);
    const { getLearningGoal } = useFolder();

    const learningGoal = async () => {
        setLoading(true);
        try {
            const result = await getLearningGoal(folderId, workspaceId);
            if(!result.success && !result.data){
                console.error("[WeeklyLearningGoal] Failed to fetch learning goal: ",result.error);
            }
            setData(result.data ?? null);
        } catch (error: any) {
            console.error("[WeeklyLearningGoal] Failed to load learning goal: ",error.message);
        }finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        learningGoal();
    }, [
        folderId,
        workspaceId,
    ]);

    if(loading){
        return (
            <div className="bg-[#110A10] border border-white/10 rounded-[12px] p-6 
            text-zinc-500 text-xs font-mono animate-pulse">
                Loading learning target...
            </div>
        );
    }

    const d = data ?? {
        hoursThisWeek: 0,
        weeklyTargetHours: 20,
        progressPercent: 0,
        subConceptsToday: 0,
        subjectLabel: null,
        goalExists: false,
    };

    return (
        <>
            <div className="bg-[#110A10] border border-white/10 rounded-xl py-6 px-5 
            sm:px-7 flex flex-col sm:flex-row gap-6 sm:items-center items-start ">
                {/* Ring */}
                <div className="self-center sm:self-auto">
                    <CircularProgress percent={d.progressPercent}/>
                </div>

                {/* Text + actions */}
                <div className="flex-1 min-w-0">
                    <h3 className="mb-2 text-sm font-mono font-bold text-zinc-100">
                        Weekly Learning Goal
                    </h3>
                    <p className="mb-4 text-xs font-mono text-zinc-400 leading-relaxed">
                        {`You're`} <span className="text-zinc-100 font-bold">
                            {d.hoursThisWeek} hours
                        </span> into yours{" "}
                        <span className="text-zinc-100 font-bold">{d.weeklyTargetHours}-hour</span>
                        weekly target 
                        {d.subjectLabel ? (
                            <> for <span className="text-purple-300 font-semibold">
                                {d.subjectLabel}
                            </span></>
                        ) : null}
                        . {`You've cleared`}{" "}
                        <span className="text-purple-300 font-bold">
                            {d.subConceptsToday} sub-concepts
                        </span>{" "} today.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowGoalModal(true)}
                            className="py-2 px-3 rounded-lg border border-white/10
                             hover:border-purple-500/30 bg-[#0A0507] text-zinc-300
                              cursor-pointer text-xs font-mono transition-all"
                        >
                            Adjust Goal
                        </button>
                        <button
                            onClick={() => setShowDeepSession(true)}
                            className="py-2 px-4 rounded-[6px] border border-purple-500/30
                             bg-purple-600 hover:bg-purple-500 text-white
                            cursor-pointer text-xs font-mono font-medium transition-all"
                        >
                            Deep Session
                        </button>
                    </div>
                </div>
            </div>

            {showGoalModal && (
                <AdjustGoalModal 
                    folderId={folderId}
                    workspaceId={workspaceId}
                    current={d.weeklyTargetHours}
                    subjectLabel={d.subjectLabel}
                    onClose={() => setShowGoalModal(false)}
                    onSaved={(hours, label) => 
                        setData((prev) => 
                            prev ? {
                                ...prev,
                                weeklyTargetHours: hours,
                                subjectLabel: label || null,
                                progressPercent: Math.min(
                                    Math.round((prev.hoursThisWeek / hours) * 100),
                                    100
                                ),
                            } : prev
                        )
                    }
                />
            )}

            {showDeepSession && (
                <DeepSessionDrawer 
                    folderId={folderId}
                    onClose={() => setShowDeepSession(false)}
                    onSessionComplete={learningGoal}
                />
            )}
        </>
    );
}