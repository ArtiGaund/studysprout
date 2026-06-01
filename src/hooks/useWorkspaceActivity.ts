"use client";

import { ActivityEvent, ActivityPagination } from "@/components/workspace-view/acitivity-feed";
import { getActivityService, getRecentActivityService } from "@/services/workspaceServices";
import { APPEND_ACTIVITY_EVENTS, CLEAR_ACTIVITY, MARK_ACTIVITY_FRESH, SET_ACTIVITY_ERROR, SET_ACTIVITY_EVENTS, SET_ACTIVITY_LOADING } from "@/store/slices/activitySlice";
import { RootState } from "@/store/store";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export function useWorkspaceActivity(
    workspaceId: string | undefined,
    limit = 4,
){
    const dispatch = useDispatch();
    const {
        events,
        pagination,
        loading,
        error,
    } = useSelector(
        (state: RootState) => state.activity
    );

    const activityStale = useSelector(
        (state: RootState) => state.activity.activityStale
    );

   const getRecentActivity = useCallback(async(
        limit: number = 4,
    ): Promise<{
        success: boolean;
        data?: {
            events: ActivityEvent[];
            pagination: ActivityPagination;
        };
        error?: string;
    }> => {
        if(!workspaceId) return {
            success: false,
            error: "[GetRecentActivity] WorkspaceId required",
        }
        dispatch(SET_ACTIVITY_LOADING(true));
        try {
            const result = await getRecentActivityService(workspaceId, limit);
            if(!result.success || !result.data) {
                dispatch(SET_ACTIVITY_ERROR(result.message ?? "Failed"));
                return {
                    success: false,
                    error: result.message,
                }
            }
            dispatch(SET_ACTIVITY_EVENTS({
                events: result.data.events,
                pagination: result.data.pagination,
            }))
            dispatch(MARK_ACTIVITY_FRESH());
            return {
                success: true,
                data: result.data,
            }
        } catch (error: any) {
            console.error("[GetRecentActivity] Failed: ",error.message);
            dispatch(SET_ACTIVITY_ERROR(error.message));
            return {
                success: false,
                error: error.message || "[GetRecentActivity] Failed to fetch activity", 
            }
        }finally{
            dispatch(SET_ACTIVITY_LOADING(false));
        }
    },[
        workspaceId,
        dispatch,
    ]);

    useEffect(() => {
        if(!activityStale || !workspaceId) return;
        getRecentActivity(4);
    },[
        activityStale,
        workspaceId,
    ]);

    const getActivity = useCallback(async(
        params: {
            page?: number;
            limit?: number;
            type?: string;
            folderId?: string
        } = {},
        replace: boolean = true,
    ): Promise<{
        success: boolean;
        data?: {
            events: ActivityEvent[];
            pagination: ActivityPagination;
        };
        error?: string;
    }> => {
        if(!workspaceId) return {
            success: false,
            error: "[GetActivity] workspaceId is required",
        }
        dispatch(SET_ACTIVITY_LOADING(true));
        try {
            const result = await getActivityService(workspaceId, params);
            if(!result.success || !result.data){
                dispatch(SET_ACTIVITY_ERROR(result.message ?? "Failed"));
                return {
                    success: false,
                    error: result.message ||"[GetActivity] Failed",
                }
            }
            if(replace){
                dispatch(SET_ACTIVITY_EVENTS({
                    events: result.data.events,
                    pagination: result.data.pagination,
                }));
            }else{
                dispatch(APPEND_ACTIVITY_EVENTS({
                    events: result.data.events,
                    pagination: result.data.pagination,
                }));
            }
            return {
                success: true,
                data: result.data
            }
        } catch (error: any) {
            console.error("[useWorkspace] getActivity failed: ", error.message);
            dispatch(SET_ACTIVITY_ERROR(error.message));
            return { 
                success: false, 
                error: error.message || "Failed to fetch activity" 
            };
        }finally{
            dispatch(SET_ACTIVITY_LOADING(false));
        }
    },[
        workspaceId,
        dispatch,
    ]);

    const loadMore = useCallback(() => {
        if(!pagination?.hasNextPage || loading) return;
        getActivity({
            page: pagination.page + 1
        }, false);
    },[
        pagination,
        loading,
        getActivity,
    ])
    useEffect(() => {
        dispatch(CLEAR_ACTIVITY());
    },[
        workspaceId,
        dispatch,
    ]);

    return {
        events,
        pagination,
        loading,
        error,
        getRecentActivity,
        getActivity,
        loadMore,
    }
}