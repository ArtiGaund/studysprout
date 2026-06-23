import { SearchResult, SearchResultType } from "@/app/api/search/route";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

export interface GlobalSearchParams{
    q: string;
    type?: SearchResultType | "all";
    workspaceId?: string;
}

export async function globalSearchService(
    params: GlobalSearchParams,
    signal?: AbortSignal
): Promise<SearchResult[]> {
    try {
        const qs = new URLSearchParams({
            q: params.q,
            type: params.type ?? "all"
        });

        if(params.workspaceId) qs.set("workspaceId", params.workspaceId);
        const relativePath = `/api/search?${qs.toString()}`;
        const url = `${BASE_URL}${relativePath}`;
        const { data } = await axios.get(url, {
            signal, //AbortController signal - axios cancels the request if signal fires
        });

        if(!data.success) throw new Error(data.message);
        return data.data as SearchResult[];
    } catch (error) {
        console.error("[globalSearchService] Failed: ",error);
        throw new Error;
    }
}