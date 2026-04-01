/**
 * @module YjsNormalization
 * @description A transformation utility that bridges the gap between Yjs XML fragments 
 * and the application's internal Block-based data model.
 * * KEY ARCHITECTURAL FEATURES:
 * 1. CRDT Integration: Specifically designed to parse `Y.XmlElement` nodes, 
 * enabling real-time sync between collaborative users.
 * 2. Sanitization Logic: Implements Regex-based stripping of residual internal 
 * XML tags to ensure the 'content' remains clean, searchable text.
 * 3. Structured Text Generation: Dynamically converts specialized block types 
 * (Headings, Quotes, Code) into Markdown-compatible strings for AI-processing.
 * 4. Traceable IDs: Prioritizes `containerAttrs.id` to maintain a persistent link 
 * between the visual editor and the backend database.
 */
import * as Y from "yjs";
import { IBlock } from "@/model/file.model";

/**
 * @method normalizeYjsBlock
 * @param node - The Yjs XML Element representing a single block container.
 * @returns A normalized IBlock object or null if the node is invalid.
 */
export const normalizeYjsBlock = (
    node: Y.XmlElement
): IBlock | null => {
    // 1. Validation: Ensure we are processing a valid block container
    if(node.nodeName !== "blockContainer") return null;

    const containerAttrs = node.getAttributes();
    const contentNode = node.get(0);

    if(!(contentNode instanceof Y.XmlElement)) return null;

    const type = contentNode.nodeName;
    const props = contentNode.getAttributes();
    const id = containerAttrs.id || props.id;

    if(!id) return null;

    // 2. Data Extraction: Strip Yjs internal markers to get the pure text content
    const rawText = contentNode.toString().replace(/<[^>]*>/g,"").trim();

    let structuredText = rawText;

    /**
     * @section Markdown Transformation
     * Converts the visual block type into its Markdown equivalent.
     * This is critical for the AI Flashcard Generator to understand the 
     * semantic hierarchy (e.g., distinguishing a Heading from a List).
     */
    switch(type){
        case "heading":
            const level = Number(props.level) || 1;
            structuredText = `${"#".repeat(level)} ${rawText}`;
            break;
        case "bulletListItem":
        case "numberedListItem":
            structuredText = `- ${rawText}`;
            break;
        case "quote":
            structuredText = `> ${rawText}`;
            break;
        case "code":
            structuredText = `\`\`\`\n${rawText}\n\`\`\``;
            break;
        default:
            structuredText = rawText;
            break;
    }

    // 3. Return a consistent, typed Block object for the Redux store
    return {
        id,
        type,
        props,
        content: rawText,
        plainText: rawText,
        structuredText,
        updatedAt: new Date(),
    };
}