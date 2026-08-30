"use client";

import { deleteInboxItemService, getInboxCountService, getInboxDataService, mergeInboxItemService } from "@/services/inboxServices";
import { useCallback } from "react";

export function useInbox(){
   
    const getInboxItems = useCallback(async (): Promise<{
            success: boolean,
            data?: any,
            error?: string
         }> => {
            try {
                const items = await getInboxDataService();
                if(!items){
                    return {
                        success: false,
                        error: "Failed to get all items of inbox",
                    }
                }

                return {
                    success: true,
                    data: items,
                }
            } catch (error: any) {
                console.warn("[useInbox] Failed to getInboxItems: ",error.message);
                return {
                    success: false,
                    error: error.message ?? "[getInboxItems] Internal Server Error",
                }
            }
    },[]);

    const deleteInboxItem = useCallback(async (itemId: string): Promise<{
        success: boolean,
        data?: any,
        error?: string,
    }> => {
        try {
            const deletedItem = await deleteInboxItemService(itemId);
            if(!deletedItem){
                return {
                    success: false,
                    error: "Failed to delete inbox item",
                }
            }
            return {
                success: true,
                data: deletedItem,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message ?? "[deleteInboxItem] Internal Service error",
            }
        }
    },[]);

    const getInboxCount = useCallback(async(): Promise<{
        success: boolean,
        data?: number,
        error?: string,
    }> => {
        try {
            const result = await getInboxCountService();
            if(!result){
                return {
                    success: false,
                    error: "[useInbox] Failed to get inbox count",
                }
            }

            return {
                success: true,
                data: result.count,
            }
        } catch (error: any) {
            console.warn("[useInbox] Failed to getInboxCount: ",error.message);
            return {
                success: false,
                error: error.message ?? "[useInbox] getInboxCount Internal Server error", 
            }
        }
    },[]);

    const mergeInboxItem = useCallback(async ( inboxId: string, fileId: string,): Promise<{
        success: boolean,
        data?: any,
        error?: string,
    }> => {
        try {
            const result = await mergeInboxItemService(inboxId, fileId);
            if(!result){
                return {
                    success: false,
                    error: "[useInbox] Failed to merge inbox item",
                };
            }

            return {
                success: true,
                data: result
            };
        } catch (error: any) {
            console.warn(error.message ?? "[useInbox] Internal Server Error");
            return {
                success: false,
                error: error.message ?? "[useInbox] Internal Server Error",
            };
        }
    },[]);

    const deleteInboxItemsBatch = useCallback( async (itemsIds: string[]): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }> => {
        try {
            const results = await Promise.all(itemsIds.map((id) => deleteInboxItemService(id)));
            const allSuccessful = results.every((res) => Boolean(res));
            return {
                success: allSuccessful,
                data: results,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message ?? "[useInbox] deleteInboxItemsBatch Failed to delete items",
            };
        }
    },[]);

    const mergeInboxItemsBatch = useCallback(async(
        itemIds: string[],
        fileId: string,
    ): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }> => {
        try {
            let lastResult: any = null;
            // Process sequentially from oldest to newest to maintain proper file layout order
            for(const id of itemIds){
                const result = await mergeInboxItemService(id, fileId);
                if(!result) throw new Error(`[useInbox] Failed to merge item ${id}`);
                lastResult = result;
            }
            return {
                success: true,
                data: lastResult,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message ?? "[useInbox] mergeInboxItemsBatch Internal Server error",
            };
        }
    },[]);

    return {
        getInboxItems,
        deleteInboxItem,
        getInboxCount,
        mergeInboxItem,
        deleteInboxItemsBatch,
        mergeInboxItemsBatch,
    }
}