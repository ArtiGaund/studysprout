'use client';

import { useWorkspace } from "@/hooks/useWorkspace";
import { RootState } from "@/store/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Bar, CartesianGrid, Cell, ComposedChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
        <div className="bg-[#1a1a2e] border border-[#3a3a5c] rounded-[8px] py-2.5 px-2.5
        text-[13px] text-gray-300"
        >
            <p className="font-[600px] mb-0">
                {label}
            </p>
            <p className="text-[#a78bfa]">Score: {d.score}</p>
            <p className="text-[#6ee7b7]">Cards reviewed: {d.cardsReviewed}</p>
            <p className="text-[#93c5fd]">Files touched: {d.filesTouched}</p>
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
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-[#1a1a2e] border border-[#3a3a5c] rounded-[12px] p-7 w-[340px]
                text-[#e2e2f0]"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="mb-4 text-4 font-[600px]">
                    Manage Daily Goal
                </h3>
                <p className="text-[13px] text-[#9ca3af] mb-4">
                    Daily activity = cards reviewed + files touched. The goal line on the graph
                    will update immediately.
                </p>
                <label className="text-[13px] text-[#a78bfa] block mb-1.5">
                    Daily activity target
                </label>
                <input 
                    type="number"
                    min={1}
                    max={200}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full bg-[#0f0f1a] border border-[#3a3a5c] rounded-[6px]
                    text-[#e2e2f0] py-2 px-3 text-[15px] box-border"
                />
                <div className="flex gap-2.5 mt-5">
                    <button
                    onClick={onClose}
                    className="flex-1 py-2 rounded-[6px] border border-[#3a3a5c] bg-transparent
                    text-[#9ca3af] cursor-pointer text-[14px]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex-1 py-2 rounded-[6px] border-none bg-[#7c3aed] text-white
                        text-[14px] ${saving 
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
        <div className="bg-[#111827] border border-[#1f2937] rounded-[12px] py-5 px-6 
        text-[#e2e2f0] flex flex-1 flex-col justify-between">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start sm:items-center mb-5 
            shrink-0 gap-y-2">
                <div>
                    <h2 className="m-0 text-[16px] font-[600px]">
                        Weekly Research Goals
                    </h2>
                    {data && (
                        <p className="mt-1 text-[13px] text-[#6b7280]">
                            {data.weeklyTotal} / {data.weeklyTargetTotal} this week ·{" "}
                            <span className={`${data.percentComplete >=100 
                                ? "text-[#6ee7b7]"
                                : "text-[#a78bfa]"
                            }`}
                            >
                                {data.percentComplete}%
                            </span>
                        </p>
                    )}
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-transparent border-none text-[#7c3aed] cursor-pointer text-[13px]
                    font-[500px] p-0"
                >
                    Manage Goal
                </button>
            </div>
            
            <div className="flex-1 w-full min-h-[180px] sm:min-h-[220px]">
            {/* Chart */}
            {loading ? ( 
                <div className="h-[100px] flex items-center justify-center text-[#4b5563] text-[13px]"
                >
                    Loading...
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
                            stroke="#1f2937"
                        />
                        <XAxis 
                            dataKey="label"
                            tick={{ fill: "#6b7280", fontSize: 12}}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis 
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip 
                            content={<CustomTooltip />}
                            cursor={{ fill: "#1f2937" }}
                        />
                        <Bar
                            dataKey="score"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={36}
                        >
                            {data.days.map((d) => (
                                <Cell 
                                    key={d.date}
                                    fill={d.date === today ? "#7c3aed" : "#2d2d4e"}
                                />
                            ))}
                        </Bar>

                        {/* Goal line */}
                        <ReferenceLine 
                            y={data.dailyTarget}
                            stroke="#a78bfa"
                            strokeDasharray="5 3"
                            label={{
                                value: `Goal: ${data.dailyTarget}`,
                                position: "right",
                                fill: "#a78bfa",
                                fontSize: 11,
                            }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[180px] text-[#4b5563] text-[13px] fllllllex items-center justify-center">
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
    )
}