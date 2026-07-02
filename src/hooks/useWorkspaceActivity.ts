"use client";

import { ActivityEvent, ActivityPagination } from "@/components/workspace-view/acitivity-feed";
import { getActivityService, getRecentActivityService } from "@/services/workspaceServices";
import { APPEND_ACTIVITY_EVENTS, CLEAR_ACTIVITY, MARK_ACTIVITY_FRESH, SET_ACTIVITY_ERROR, SET_ACTIVITY_EVENTS, SET_ACTIVITY_LOADING } from "@/store/slices/activitySlice";
import { RootState } from "@/store/store";
import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

interface GetActivityParams{
    page?: number;
    limit?: number;
    type?: string;
    folderId?: string;
}

interface UseWorkspaceActivityOptions{
    autoRefreshOnStale?: boolean;
}
export function useWorkspaceActivity(
    workspaceId: string | undefined,
    limit = 4,
    options: UseWorkspaceActivityOptions = {},
){

    const { autoRefreshOnStale = true } = options;

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

    // Tracks the params of the last "fresh" (page 1 /replace) query, so loadMore can preserve
    // the current type/folder filter instead of losing it on page 2+
    const lastParamsRef = useRef<Omit<GetActivityParams, "page">>({});

    const getRecentActivity = useCallback(async(
       requestLimit: number = limit,
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
            const result = await getRecentActivityService(workspaceId, requestLimit);
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
        limit,
    ]);

    /**
     * @effect Auto-refresh on staleness
     * use the limit instead of hardcoded 4, and is guarded behind `autoRefreshOnStale` so
     * consumers with a different shape of data (pagination, filters) can opt out and handle
     * staleness themselves through the exposed `activityStale` value below.
     */
    useEffect(() => {
        if(!autoRefreshOnStale) return;
        if(!activityStale || !workspaceId) return;
        getRecentActivity(limit);
    },[
        activityStale,
        workspaceId,
        limit,
        autoRefreshOnStale,
        getRecentActivity,
    ]);

    const getActivity = useCallback(async(
        params: GetActivityParams = {},
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
                // Remembering these params (minus pages) so loadMore can reuse them - only a 
                // "fresh" (replace=true) query, since that's what defines the current filter/view
                //  the user is looking at.
                const { page: _page, ...rest } = params;
                lastParamsRef.current = rest;
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

    /**
     * @function loadMore
     * Spreads lastParamsRef.current alongside the new page number.
     */
    const loadMore = useCallback(() => {
        if(!pagination?.hasNextPage || loading) return;
        getActivity({
            ...lastParamsRef.current,
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
        activityStale,
        getRecentActivity,
        getActivity,
        loadMore,
    }
}