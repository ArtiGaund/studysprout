'use client';

import { useWorkspace } from "@/hooks/useWorkspace";
import { RootState } from "@/store/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { 
    Bar, CartesianGrid, Cell, ComposedChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, 
    YAxis 
} from "recharts";

interface DayData{
    date: string;
    label: string;
    score: number;
    cardsReviewed: number;
    filesTouched: number;
}

interface GraphData{
    days: DayData[];
    dailyTarget: number;
    weeklyTotal: number;
    weeklyTargetTotal: number;
    percentComplete: number;
}

interface WeeklyResearchGoalsProps{
    workspaceId: string;
}

function CustomTooltip({
    active,
    payload,
    label,
}: any){
    if(!active || !payload?.length) return null;
    const d: DayData = payload[0]?.payload;

    return (
        <div className="bg-[#110A10] border border-white/10 rounded-lg p-2.5
        text-xs font-mono text-zinc-200 shadow-xl space-y-1"
        >
            <p className="font-semibold text-purple-300 border-b border-white/5 pb-1 mb-1">
                {label}
            </p>
            <p className="text-purple-400">Score: {d.score}</p>
            <p className="text-emerald-400">Cards reviewed: {d.cardsReviewed}</p>
            <p className="text-blue-400">Files touched: {d.filesTouched}</p>
        </div>
    );
}

function ManageGoalsModal({
    workspaceId,
    currentTarget,
    onClose,
    onSaved,
}: {
    workspaceId: string;
    currentTarget: number;
    onClose: () => void;
    onSaved: (newTarget: number) => void;
}){
    const [ value, setValue ] = useState(currentTarget);
    const [ saving, setSaving ] = useState(false);

    const { saveGoal } = useWorkspace();

    async function handleSave(){
        setSaving(true);
        try {
            const result = await saveGoal(workspaceId, value);
            onSaved(value);
            onClose();
        } catch (error: any) {
            console.error("[ManageGoalModal] Failed: ",error.message);
        }finally{
            setSaving(false);
        }
    }

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center 
            justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-[#110A10] border border-white/10 rounded-[12px] p-7 w-[340px]
                text-zinc-100 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-base font-semibold text-purple-200 mb-2">
                    Manage Daily Goal
                </h3>
                <p className="text-xs font-mono text-zinc-400 mb-4 leading-relaxed">
                    Daily activity = cards reviewed + files touched. The goal line on the graph
                    will update immediately.
                </p>
                <label className="text-xs font-mono text-purple-300 block mb-1.5">
                    Daily activity target
                </label>
                <input 
                    type="number"
                    min={1}
                    max={200}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full bg-[#0A0507] border border-white/10 rounded-lg
                    text-zinc-100 py-2 px-3 text-xs box-border focus:outline-none
                     focus:border-purple-500/50 mb-5"
                />
                <div className="flex gap-2.5 mt-5">
                    <button
                    onClick={onClose}
                    className="flex-1 py-2 rounded-lg border border-white/10 bg-transparent
                    text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex-1 py-2 rounded-[6px] border-none bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono transition-colors disabled:opacity-50 ${saving 
                            ? "cursor-not-allowed opacity-[0.7]" : "cursor-pointer opacity-[1]"}`}
                    >
                        {saving ? "Saving..." : "Save" }
                    </button>
                </div>
            </div>
        </div>
    )
}


export const WeeklyResearchGoals = ({
    workspaceId
}: WeeklyResearchGoalsProps) => {
    const [ data, setData ] = useState<GraphData | null>(null);
    const [ loading, setLoading ] = useState(true);
    const [ showModal, setShowModal ] = useState(false);

    const { getResearchGraph } = useWorkspace();

    const statsStale = useSelector((state: RootState) => state.workspace.statsStale);

    async function fetchGraph(){
        setLoading(true);
        try {
            const result = await getResearchGraph(workspaceId);
            if(!result.success){
                console.error("[WeeklyResearchGoals] fetchGraph failed: ",result.error);
                return;
            }
            // const json = await result.json();
            setData(result.data ?? null);
        } catch (error: any) {
            console.error("[FetchGraph] Failed: ",error.message);
        }finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchGraph();

        // Refresh every 5 min
        const interval = setInterval(fetchGraph, 5*60*1000);
        return () => clearInterval(interval);
    },[
        workspaceId,
        statsStale,
    ]);

    const today = new Date().toISOString().split("T")[0];

    return (
        <div className="bg-[#110A10] border border-white/10 rounded-xl py-5 px-6 
        text-zinc-100 flex flex-1 flex-col justify-between">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start sm:items-center mb-5 
            shrink-0 gap-y-2">
                <div>
                    <h2 className="text-sm font-semibold text-zinc-100">
                        Weekly Research Goals
                    </h2>
                    {data && (
                        <p className="mt-0.5 text-xs font-mono text-zinc-40">
                            {data.weeklyTotal} / {data.weeklyTargetTotal} this week ·{" "}
                            <span className={`${data.percentComplete >=100 
                                ? "text-emerald-400 font-bold"
                                : "text-purple-400 font-bold"
                            }`}
                            >
                                {data.percentComplete}%
                            </span>
                        </p>
                    )}
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-transparent border border-purple-500/20 hover:border-purple-500/40 text-purple-300 hover:text-purple-200 px-2.5 py-1 rounded-md text-xs font-mono transition-colors"
                >
                    Manage Goal
                </button>
            </div>
            
            <div className="flex-1 w-full min-h-[180px] sm:min-h-[220px]">
                {/* Chart */}
                {loading ? ( 
                    <div className="h-[180px] flex items-center justify-center text-zinc-500 
                    text-xs font-mono">
                        Loading activity chart...
                    </div>
                ) : data ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={data.days}
                            margin={{
                                top: 4,
                                right: 4,
                                left: -20,
                                bottom: 0
                            }}
                        >
                            <CartesianGrid 
                                strokeDasharray="3 3"
                                stroke="#ffffff0d"
                            />
                            <XAxis 
                                dataKey="label"
                                tick={{ fill: "#71717a", fontSize: 12, fontFamily: "monospace"}}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis 
                                tick={{ fill: "#71717a", fontSize: 12, fontFamily: "monospace"}}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                content={<CustomTooltip />}
                                cursor={{ fill: "#ffffff05" }}
                            />
                            <Bar
                                dataKey="score"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={36}
                            >
                                {data.days.map((d) => (
                                    <Cell 
                                        key={d.date}
                                        fill={d.date === today ? "#9333ea" : "#3b0764"}
                                    />
                                ))}
                            </Bar>

                            {/* Goal line */}
                            <ReferenceLine 
                                y={data.dailyTarget}
                                stroke="#c084fc"
                                strokeDasharray="5 3"
                                label={{
                                    value: `Goal: ${data.dailyTarget}`,
                                    position: "right",
                                    fill: "#c084fc",
                                    fontSize: 11,
                                    fontFamily: "monospace",
                                }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[180px] text-zinc-500 text-xs font-mono flex items-center 
                    justify-center">
                        No data yet. Start reviewing cards or editing files.
                    </div>
                )}
            </div>
            {/* Modal */}
            {showModal && data && (
                <ManageGoalsModal 
                    workspaceId={workspaceId}
                    currentTarget={data.dailyTarget}
                    onClose={() => setShowModal(false)}
                    onSaved={(newTarget) => {
                        setData((prev) => 
                            prev
                                ? {
                                    ...prev,
                                    dailyTarget: newTarget,
                                    weeklyTargetTotal: newTarget * 7,
                                    percentComplete: Math.round(
                                        (prev.weeklyTotal / (newTarget * 7 )) * 100
                                    ),
                                 }
                                : prev
                        );
                    }}
                />
            )}
        </div>
    );
}