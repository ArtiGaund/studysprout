/**
 * @module concept-graph-builder
 * 
 * What it does:
 *      Finds terms that appear in 2+ files across a folder/workspace.
 *      Builds a graph of nodes (terms) and edges ( term ↔ file relationships).
 * 
 * Input: 1) workspace.termIndex
 *        2) Terms with fileIds.length >= 2 become nodes. Files are edges.
 * 
 * Where stored: folder.conceptGraph 
 */

import { onSynthesisCompleted } from "@/lib/activity-hooks";
import dbConnect from "@/lib/dbConnect";
import { FileModel, FolderModel, WorkSpaceModel } from "@/model";

export interface ConceptNode{
    id: string;   //the term itself
    label: string;   //display label 
    fileCount: number;
}

export interface ConceptEdge{
    source: string;   //fileId
    target: string;   //term ( node id)
}

export interface ConceptGraph{
    nodes: ConceptNode[];
    edges: ConceptEdge[];
}

function toTitleCase(term: string):string{
    return term.replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- Core builder ---

/**
 * Builds the concept graph for a set of files using the workspace term index.
 * 
 * @param fileIds       Files to include
 * @param workspaceId   Workspace whose termIndex to read from
 * @param minFiles      Minimum files a term must appear in to become a node (default: 2)
 */

export async function buildFolderConceptGraph(
    fileIds: string[],
    workspaceId: string,
    minFiles = 2,
    folderId?: string,
    userId?: string,
    folderTitle?: string,
): Promise<ConceptGraph>{
    try {
        await dbConnect();

        // Load term index
        const workspace = await WorkSpaceModel.findById(workspaceId, {
            termIndex: 1,
        }).lean();

        const termIndex = (workspace?.termIndex ?? {}) as Record<string, string[]>;
        const fileIdSet = new Set(fileIds.map(String));

        // Filter to terms that appears in more than minFiles of the target file set
        const nodes: ConceptNode[] = [];
        const edges: ConceptEdge[] = [];

        for(const [ term, allFileIds ] of Object.entries(termIndex)){
            // Only count files that belong to the requested set
            const matchingFileIds = allFileIds.filter( (id) => fileIdSet.has(id));

            if(matchingFileIds.length < minFiles) continue;

            // Node
            nodes.push({
                id: term,
                label: toTitleCase(term),
                fileCount: matchingFileIds.length,
            });

            // One edge per file that contain this term
            for(const fileId of matchingFileIds){
                edges.push({
                    source: fileId,
                    target: term,
                });
            }
        }
        // Sort nodes by fileCount descending - most cross-cutting concept first
        nodes.sort((a, b) => b.fileCount - a.fileCount);
   
        if(folderId && workspaceId){
            await onSynthesisCompleted(
                workspaceId,
                userId ?? "system",
                nodes.length,
                String(workspace?.title)
            )
        }

        return {
            nodes,
            edges,
        };
    } catch (error) {
        console.error("[BuildFolderConceptGraph] error: ",error);
        throw error;
    }
}

export async function buildWorkspaceConceptGraph(
    workspaceId: string,
    userId?: string,
){
    try {
        const workspace = await WorkSpaceModel.findById(workspaceId, {
            termIndex: 1,
            folders: 1,
        }).lean();

        // termIndex -> { term -> [fileId, fileId ...]}
        // we need: term -> [folderId, folderId, ...]
        // so load files and map fileId -> folderId
        const files = await FileModel.find(
            { workspaceId },
            { 
                _id: 1,
                folderId: 1,
            }
        ).lean();

        const fileToFolder = new Map(
            files.map(file => [String(file._id), String(file.folderId)])
        );

        // For each term, collect which folders it appears in
        const termToFolders = new Map<string, Set<string>>();
        for(const [ term, fileIds ] of Object.entries(workspace?.termIndex ?? [])){
            const folderIds = new Set(
                fileIds.map(id => fileToFolder.get(id)).filter(Boolean) as string[]
            );
            if(folderIds.size >= 2) termToFolders.set(term, folderIds);
        }

        // Build folder nodes
        const folders = await FolderModel.find(
            {
                _id: { $in: workspace?.folders }
            },
            {
                _id: 1,
                title: 1,
                files: 1,
            },
        ).lean();

        const nodes = folders.map(folder => ({
            id: String(folder._id),
            label: folder.title,
            fileCount: (folder.files ?? []).length,
        }));

        const folderMatchCount = new Map<string, Map<string, number>>();
        for(const [ term, fileIds ] of Array.from(termToFolders.entries())){
            // Count how many files per folder contain this term
            const folderFileCounts = new Map<string, number>();
            for(const fileId of Array.from(fileIds)){
                const folderId = fileToFolder.get(fileId);
                if(!folderId) continue;
                folderFileCounts.set(folderId, (folderFileCounts.get(folderId) ?? 0) + 1);
            }

            const sorted = Array.from(folderFileCounts.entries())
                .sort((a, b) => b[1] - a[1]);
            if(sorted.length < 2) continue;

            // Folder with most files containing this term = definer
            const defineFolderId = sorted[0][0];

            // All other folders = consumers (they depends on definer)
            for(const [consumerFolderId] of sorted.slice(1)){
                if(!folderMatchCount.has(consumerFolderId)){
                    folderMatchCount.set(consumerFolderId, new Map());
                }
                const inner = folderMatchCount.get(consumerFolderId)!;
                inner.set(defineFolderId, (inner.get(defineFolderId) ?? 0) + 1);
            }
        }

        const EDGE_THRESHOLD = 3;
        const edges: { 
            source: string;
            target: string;
        }[] = [];
        for(const [ consumerId, definerMap ] of Array.from(folderMatchCount.entries())){
            for(const [ definerId, count] of Array.from(definerMap.entries())){
                if(count >= EDGE_THRESHOLD){
                    edges.push({
                        source: consumerId,
                        target: definerId,
                    })
                }
            }
        }

        await onSynthesisCompleted(
            workspaceId,
            userId ?? "system",
            nodes.length,
            String(workspace?.title ?? "Workspace")
        );

        return {
            nodes,
            edges,
        }
    } catch (error) {
        console.error("[BuildWorkspaceConceptGraph] error: ",error);
        throw error;
    }
}