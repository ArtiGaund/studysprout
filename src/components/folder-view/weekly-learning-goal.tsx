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
                    stroke="#1f2937"
                    strokeWidth="8"
                />
                {/* Progress */}
                <circle 
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
            </svg>

            {/* Label in career */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4 font-[700px] text-[#e2e2f0]">
                    {percent}%
                </span>
                <span className="text-[10px] text-[#6b7280]">
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
            className="bg-black/60 fixed inset-0 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-[#1a1a2e] border border-[#3a3a5c] rounded-[12px] p-7 w-[360px]
                text-[#e2e2f0]"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="mb-4.5 text-[16px] font-[600px]">
                    Adjust Weekly Goal
                </h3>
                <label className="text-[13px] text-[#a78bfa] block mb-1.5">
                    Subject name (optional)
                </label>
                <input 
                    type="text"
                    placeholder="e.g. Linear Algebra"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full bg-[#0f0f1a] border border-[#3a3a5c] rounded-xs
                    text-[#e2e2f0] py-2 px-3 text-[14px] box-border mb-4"
                />

                <label className="text-[13px] text-[#a78bfa] block mb-1.5">
                    Weekly target (hours)
                </label>
                <input 
                    type="number"
                    min={1}
                    max={100}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full bg-[#0f0f1a] border border-[#3a3a5c] rounded-xs 
                    text-[#e2e2f0] py-2 px-3 text-[15px] box-border"
                />

                <div className="flex gap-2.5 mt-5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-xs border border-[#3a3a5c] bg-transparent
                        text-[#9ca3af] cursor-pointer text-[14px]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex-1 py-2 rounded-xs border-none bg-[#7c3aed] text-white
                        text-[14px] ${saving 
                            ? "cursor-not-allowed opacity-[0.7px]" 
                            : "cursor-pointer opacity-[1px]"}`}
                    >
                        {saving ? "Saving..." : "Save" }
                    </button>
                </div>
            </div>
        </div>
    )
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
            className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
            onClick={onClose}
        >
            <div 
            className="bg-[#111827] border border-[#1f2937] p-5 w-full max-w-[640px] max-h-[70vh]
            overflow-auto text-[#e2e2f0] rounded-t-[12px]"
            onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-[16px] font-[600px] mb-4">
                    Deep Session Planner
                </h3>

                {!plan ? (
                    <>
                        <p className="text-[13px] text-[#6b7280] mb-4">
                            How many minutes do you have?
                        </p>
                        <div className="flex gap-2.5 items-center">
                            <input 
                                type="number"
                                min={10}
                                max={480}
                                value={minutes}
                                onChange={(e) => setMinutes(Number(e.target.value))}
                                className="flex-1 bg-[#0f172a] border border-[#1f2937]
                                rounded-[6px] text-[#e2e2f0] py-2 px-3 text-[15px]"
                            />
                            <span className="text-[13px] text-[#6b7280]">
                                minutes
                            </span>
                            <button
                                onClick={fetchPlan}
                                disabled={loading}
                                className={`py-2 px-5 rounded-[6px] border-none bg-[#7c3aed] text-white
                                text-[14px] ${loading 
                                    ? "cursor-not-allowed opacity-[0.7px]" 
                                    : "cursor-pointer opacity-[1px]"}`}
                            >
                                {loading ? "Planning..." : "Plan It" }
                            </button>
                        </div>
                    </>
                ) : (
                   <>
                        <p className="text-[13px] text-[#6ee7b7] mb-4">
                            {plan.message} · {plan.totalMinutes} min total
                        </p>
                        {plan.files.map((f, i) => (
                            <div
                                key={f.fileId}
                                className="flex justify-between py-2.5 border border-[#1f2937]
                                text-[14px]"
                            >
                                <span>
                                    <span className="text-[#4b5563] mr-2.5">
                                        {i + 1}.
                                    </span>
                                    {f.title}
                                </span>
                                <span className="text-[#6b7280] flex-shrink-0">
                                    {f.readingTimeMinutes}
                                </span>
                            </div>
                        ))}
                        {plan.remainingFiles > 0 && (
                            <p className="text-[12px] text-[#4b5563] mt-3">
                                +{plan.remainingFiles} more files not included in this session
                            </p>
                        )}
                        <button
                            onClick={() => setPlan(null)}
                            className="mt-4 bg-transparent border border-[#1f2937] rounded-[6px]
                            text-[#6b7280] cursor-pointer py-2 px-4 text-[13px]"
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
            <div className="bg-[#111827] rounded-[12px] p-6 text-[#4b5563] text-[13px]">
                Loading goal...
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
            <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] py-6 px-5 
            sm:px-7 flex flex-col sm:flex-row gap-6 sm:items-center items-start text-[#e2e2f0]">
                {/* Ring */}
                <div className="self-center sm:self-auto">
                    <CircularProgress percent={d.progressPercent}/>
                </div>

                {/* Text + actions */}
                <div className="flex-1">
                    <h3 className="mb-2 text-[15px] font-[600px]">
                        Weekly Learning Goal
                    </h3>
                    <p className="mb-4 text-[13px] text-[#9ca3af] leading-1.6">
                        {`You're`} <strong className="text-[#e2e2f0]">
                            {d.hoursThisWeek}
                        </strong> hours into yours{" "}
                        <strong className="text-[#e2e2f0]">{d.weeklyTargetHours}</strong>-hour
                        weekly target 
                        {d.subjectLabel ? (
                            <> for <strong className="text-[#e2e2f0]">{d.subjectLabel}</strong></>
                        ) : null}
                        . {`You've cleared`}{" "}
                        <strong className="text-[#a78bfa]">
                            {d.subConceptsToday} sub-concepts
                        </strong>{" "} today.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowGoalModal(true)}
                            className="py-2 px-3 rounded-[6px] border border-[#3a3a5c] 
                            bg-transparent text-[#e2e2f0] cursor-pointer text-[13px]"
                        >
                            Adjust Goal
                        </button>
                        <button
                            onClick={() => setShowDeepSession(true)}
                            className="py-2 px-4 rounded-[6px] border-none bg-[#7c3aed] text-white
                            cursor-pointer text-[13px]"
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
    )
}