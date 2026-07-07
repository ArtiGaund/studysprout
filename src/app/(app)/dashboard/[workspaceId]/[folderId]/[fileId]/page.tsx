/**
 * FILE VIEW PAGE (Real-time Editor)
 * ---------------------------------
 * Role: The primary workspace for note-taking and collaborative editing.
 * * Core Features:
 * 1. Collaborative Presence: Tracks active users in the file via 'useFilePresence'.
 * 2. Binary Data Handling: Decodes Yjs Binary state from Base64/Buffer to Uint8Array.
 * 3. Dynamic Rendering: Loads the TextEditor component client-side only (SSR: false)
 * 4. Contextual Navigation: Ensures users are redirected if the file cannot be fetched.
 */
"use client"

import dynamic from 'next/dynamic'
import { useFile } from '@/hooks/useFile'
import { ReduxFile, ReduxFlashcardSet } from '@/types/state.type'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SET_CURRENT_RESOURCE } from '@/store/slices/contextSlice'
import { makeSelectFiles, selectCurrentFile } from '@/store/selectors/fileSelector'
import { useFilePresence } from '@/hooks/socket/useFilePresence'
import { useUser } from '@/lib/providers/user-provider'
import { NavHeader } from '@/components/banner-upload/nav-header'
import { FileHeader } from '@/components/file-view/file-header'
import { FileInsightsPanel, FlashcardSet, ParentSet } from '@/components/file-view/file-insights-pannel'
import { RootState } from '@/store/store'
import { selectCurrentFolder } from '@/store/selectors/folderSelector'
import * as Y from "yjs";
import { PanelRightOpen } from 'lucide-react'

// Optimized: Load editor only on the client to avoid hydration mismatches.
const DynamicTextEditor = dynamic(
    () => import("@/components/editor/editor"),
    {
        ssr: false,
        loading: () => <div> Loading editor...</div>
    }
)

const FilePage: React.FC<{ 
    params : { fileId: string, workspaceId?: string,folderId?: string }
}> = ({ params }) => {
    const fileId = params.fileId;
    const { user } = useUser();
    const router = useRouter()
    const dispatch = useDispatch();

    const { currentFileDetails, detectFilePrerequisites } = useFile();

    const currentFile = useSelector(selectCurrentFile);
    const currentFolder = useSelector(selectCurrentFolder);
    
    const folderId = currentFolder?._id ?? "";

    const [ loading, setLoading ] = useState(false);
    const [ prereqLoading, setPrereqLoading ] = useState(false);

    // Insights panel: only relevant as an "open/closed" concept below `lg` 
    // On `lg` + panel ignores this and is always shown
    const [ isInsightsPanelOpen, setIsInsightsPanelOpen ] = useState(false);

    const onChangeHandler = ( content: string ) => {
        // console.log("Live updated content of file ",content);
    }
   
    // SOCKET HOOK: Manages presence list for current file
    const rawActiveUsers = useFilePresence(params.fileId, user);
    const activeFileUsers = (rawActiveUsers ?? []).map((user: any) => ({
        id: user.id ?? user._id ?? user.userId ?? '',
        username: user.username ?? user.name ?? 'Unknown',
        avatarUrl: user.avatarUrl ?? user.avatar ?? undefined,
        color: user.color ?? undefined,
    }));

    // Flashcard sets from Redux
    const allSets: ReduxFlashcardSet[] = useSelector(
        (state: RootState) => state.flashcardSet.sets ?? []
    );

    // File-level set: resourceType === 'File' and resourceId === fileId
    const fileFlashcardSet = useMemo<FlashcardSet | null>(() => {
        const match = allSets.find(
            set => set.resourceType === "File" && set.resourceId === fileId
        );
        if(!match) return null;
        const mastery = match.totalCards > 0
            ? Math.round(((match.totalCards - match.dueCount) / match.totalCards) * 100)
            : 0;
        return {
            _id: match._id,
            title: match.title,
            cardCount: match.cardCount,
            drillType: match.desiredTypes?.[0] ?? 'Mixed',
            mastery,
            isActive: mastery > 0 && mastery < 100,
        }
    },[
        allSets,
        fileId,
    ]);

    /**
     * Parent sets: folder or workspace sets that include this file in their sourceSnapshot
     */
    const parentSets = useMemo<ParentSet[]>(() => {
        return allSets
            .filter(s => 
                (s.resourceType === 'Folder' || s.resourceType === 'Workspace') &&
                (s.sourceSnapshot?.fileIds ?? []).includes(fileId)
            )
            .map(s => ({
                title: s.title,
                type: s.resourceType === 'Folder' ? 'folder' : 'workspace',
                cardCount: s.cardCount,
            }));
    },[
        allSets,
        fileId,
    ]);

    // File Statistics derived from Redux

    /**
     * Reading Time: stored directly on the File document by FileSyncWorker.
     */
    const readingTimeMin = currentFile?.readingTimeMinutes;

    /**
     * Complexity: derived from block count.
     * <20 blocks = low, 20-60 = medium, >60 = high
     */
    const complexity = useMemo((): 'low' | 'medium' | 'high' => {
        const count = currentFile?.blockOrder.length ?? 0;
        if(count < 20) return 'low';
        if(count < 60) return 'medium';
        return 'high';
    },[
        currentFile?.blockOrder
    ]);

    /**
     * Mention + connected concepts: from parent folder's concept graph
     * - mention = edge where this file is the source (how many terms this file defines/user)
     * - connectedConcept = unique term linked to this file
     */
    const { mentions, connectedConcepts } = useMemo(() => {
        const graph = currentFolder?.conceptGraph;
        if(!graph){
            return {
                mentions: 0,
                connectedConcepts: 0,
            }
        }
        const fileEdges = graph.edges.filter(e => e.source === fileId);
        return {
            mentions: fileEdges.length,
            connectedConcepts: new Set(fileEdges.map(e => e.target)).size,
        }
    },[
        currentFolder?.conceptGraph,
        fileId,
    ]);

    const documentMasteryPct = fileFlashcardSet?.mastery ?? 0;

    // --- Prerequisites
    const selectFiles = useMemo(makeSelectFiles,[]);
    const siblingFiles = useSelector((state: RootState) => 
        selectFiles(state, folderId)
    );

    const prereqItems = useMemo(() => {
        return (currentFile?.prerequisites ?? [])
            .map((id) => siblingFiles.find((f) => f._id === String(id)))
            .filter(Boolean)
            .map((f) => ({ id: f!._id, title: f!.title }));
    },[
        currentFile?.prerequisites,
        siblingFiles,
    ]);

    const prereqNeverRun = 
        currentFile?.prerequisites === undefined ||
        currentFile.prerequisites === null ||
        currentFile.prerequisites.length === 0;

    const handleDetectFilePrerequisites = async () => {
        if(!fileId) return;
        setPrereqLoading(true);
        await detectFilePrerequisites(fileId);
        setPrereqLoading(false);
    }

    const handlePrereqClick = useCallback((prereqFileId: string) => {
        router.push(
            `/dashboard/${params.workspaceId}/${params.folderId}/${prereqFileId}`
        );
    },[
        params.workspaceId,
        params.folderId,
        router,
    ])
    /** * Effect: Initial File Data Load
     * Fetches file metadata and content if not present in Redux.
     */
    useEffect(() => {
        if(!params.fileId || typeof params.fileId !== 'string'){
            const redirectPath = params.workspaceId 
                ? `/dashboard/${params.workspaceId}${params.folderId ? `/${params.folderId}` : ''}`
                : `/dashboard`;
            router.push(redirectPath);
            return;
        }

        if(currentFile?._id === params.fileId) return;
        // Call currentFileDetails from useFile hook.
        // The hook handles:
        // 1. checking if the file is already in Redux state
        // 2. using its internal useRef guard ( hasFetchedCurrentFiles) to prevent redundant API calls.
        const getFileDetails = async() => {
            setLoading(true);
            try {
                const response = await currentFileDetails(params.fileId)
                if(!response.success){
                    const redirect = params.workspaceId && params.folderId 
                    ? `/dashboard/${params.workspaceId}/${params.folderId}`
                    : `/dashboard/${params.workspaceId}`
                    router.push(redirect)
                }else{
                   const fetchedFile = response.data as ReduxFile;
                   dispatch(SET_CURRENT_RESOURCE({
                       id: fetchedFile._id,
                       title: fetchedFile.title,
                       type: 'File',
                   }))
                }
            } catch (error) {
                console.warn("FilePage: Error while fetching file details:  ",error)
                const redirect = params.workspaceId && params.folderId
                ? `/dashboard/${params.workspaceId}/${params.folderId}`
                : `/dashboard/${params.workspaceId}`
                router.push(redirect)
            }finally{
                setLoading(false);
            }
        }
        getFileDetails()
    }, [
        params.fileId, 
    ])
    
    /** * DATA TRANSFORMATION: Binary Decoding
     *  Yjs requires a Uint8Array. This memo block converts the MongoDB/Base64 stored data into 
     * the correct binary format for the TipTap editor
     */
    const binaryData = useMemo(() => {
        const rawBinary = currentFile?.contentBinary;
       
        // Primary path: use stored binary
        if(rawBinary){
             // 1. If its a Base64 string
            if(typeof rawBinary === 'string'){
                const binaryString = window.atob(rawBinary);
                const bytes = new Uint8Array(binaryString.length);
                for(let i = 0;i<binaryString.length;i++){
                    bytes[i]=binaryString.charCodeAt(i);
                }
                if(bytes.length > 0) return bytes;
            }

            // 2. If it's the MongoDb/Node Buffer Object { data: number[] }
            if(
                typeof rawBinary === 'object' && 
                'data' in rawBinary && 
                Array.isArray((rawBinary as any).data)
            ){
                const bytes = new Uint8Array((rawBinary as any).data);
                if(bytes.length > 0) return bytes;
            }
             if(rawBinary instanceof Uint8Array) return rawBinary;
            // 3. If it's already an array-like structure
            if(Array.isArray(rawBinary) && rawBinary.length > 0){
                return new Uint8Array(rawBinary)
            }
        }
       
        // Fallback: recontract Yjs from blocks when binary is missing/empty 
        // This prevent blank editor when contentBinary is corrupted or absent
        const blocks = currentFile?.blocks;
        const blockOrder = currentFile?.blockOrder;

        if(!blocks || !blockOrder || blockOrder.length === 0) return null;

        try {
            const doc = new Y.Doc();
            const fragment = doc.getXmlFragment("document-content");

            for(const blockId of blockOrder){
                const block = blocks[blockId];
                if(!block) continue;

                const container = new Y.XmlElement("blockContainer");
                container.setAttribute("id", block.id);

                const type = block.type ?? "paragraph";
                const inner = new Y.XmlElement(type);

                // Restore ALL props as attributes - covers heading level, codeBlock language,
                // image url/caption/showPreview, textAlignment,textColor, etc.
                if(block.props && typeof block.props === "object"){
                    for(const [key, value] of Object.entries(block.props)){
                        if(value !== undefined && value !== null){
                            inner.setAttribute(key, String(value));
                        }
                    }
                }

                // image store data in props.url - no text node needed
                if(type !== "image"){
                    const content = 
                        typeof block.content === "string" && block.content.length > 0
                            ? block.content
                            : (block.plainText ?? "");
                    if(content.length > 0){
                        inner.insert(0, [new Y.XmlText(content)]);
                    }
                }

                container.insert(0, [inner]);
                fragment.push([container]);
            }

            const update = Y.encodeStateAsUpdate(doc);
            return update;
        } catch (error) {
            console.error(`[FilePage] Block fallback reconstruction failed: `,error);
            return null;
        }
    },[
        currentFile?.contentBinary,
        currentFile?.blocks,
        currentFile?.blockOrder,
    ]);

    if(!currentFile || currentFile._id !== fileId || loading){
        return <div>Loading file content...</div>
    }
    return (
        <>
            <NavHeader 
                    dirType='file'
                    fileId={params.fileId}
                    dirDetails={currentFile}
                />
        <div className='flex flex-col md:flex-row h-screen overflow-y-auto
         md:overflow-hidden relative'>
    
            {/*Center: Editor column  */}
            <main className='flex-1 md:overflow-y-auto min-w-0'>
                <div className='px-4 sm:px-10 pt-8 pb-24'>

                    <div className='flex items-start justify-between gap-3'>
                    <FileHeader 
                        currentFile={currentFile}
                    />

                    {/* Burger toggle: only shown below `lg` widths, since the panel is a
                    fixed column on lg+ */}
                    <button
                        type='button'
                        onClick={() => setIsInsightsPanelOpen(true)}
                        aria-label='Open file insights panel'
                        className='lg:hidden flex-shrink-0 mt-1 p-2 rounded-lg border
                        border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300
                        transition-colors'
                    >
                        <PanelRightOpen className='w-4 h-4'/>
                    </button>
                    </div>
                    {/* Editor content render */}
                    {/* [&_.bn-editor]:!px-0 overrides BlockNotes internal horizontal padding */}
                    <div className='mt-6 [&_.bn-editor]:!px-0 [&_.bn-block-outer]:!mx-0'>
                        <DynamicTextEditor
                            key={`${params.fileId}-${!!binaryData}`} 
                            fileId={params.fileId}
                            initialContentBinary={binaryData}
                            username={user?.username || ''}
                            // onChange= {onChangeHandler}
                            editable={!currentFile.inTrash}
                        />
                    </div>
                </div>
            </main>

            {/* Backdrop: only rendered/interactive below `lg`, closes the drawer on click */}
            {isInsightsPanelOpen && (
                <div 
                    onClick={() => setIsInsightsPanelOpen(false)}
                    className='fixed inset-0 bg-black/60 z-40 lg:hidden'
                    aria-hidden='true'
                />
            )}

            {/* Right: Insight panel */}
            <aside className={`w-full sm:w-[380px] lg:w-[320px] xl:w-[360px] flex-shrink-0
                border-white/10 border-l fixed lg:static top-0 right-0 h-full lg:h-auto
                z-50 lg:z-auto lg:overflow-y-auto shadow-2xl lg:shadow-none
                transition-transform duration-300 ease-in-out
                ${isInsightsPanelOpen ? 'translate-x-0' : 'translate-x-full'}
                lg:translate-x-0`}>
                <FileInsightsPanel 
                    fileId={params.fileId}
                    currentFile={currentFile}
                    activeUsers={activeFileUsers}
                    flashcardSet={fileFlashcardSet}
                    parentSets={parentSets}
                    readingTimeMin={readingTimeMin}
                    complexity={complexity}
                    mentions={mentions}
                    connectedConcepts={connectedConcepts}
                    documentMasteryPct={documentMasteryPct}
                    relatedConcepts={currentFile.terms ?? []}
                    prereqItems={prereqItems}
                    prereqNeverRun={prereqNeverRun}
                    prereqLoading={prereqLoading}
                    onDetectPrerequisites={handleDetectFilePrerequisites}
                    onPrereqClick={handlePrereqClick}
                    onClose={() => setIsInsightsPanelOpen(false)}
                />
            </aside>
        </div>
        </>
    )
}

export default FilePage

