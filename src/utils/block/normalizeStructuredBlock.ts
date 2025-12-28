import { normalizeNotes } from "../normalizeNotes";

export function normalizeStructuredBlock(block: {
    id: string;
    type: string;
    props: any;
    content: any;
}): string{
    const text = normalizeNotes(block.content);

    switch(block.type){
        case "heading":
            const level = block.props.level ?? 1;
            return `${"#".repeat(level)} ${text}`;
        case "bullListItem":
        case "numberedListItem":
            return `- ${text}`;
        case "quote":
            return `> ${text}`;
        case "code":
            return `\`\`\`\n ${text}\n\`\`\``;
        default:
            return text;
    }
    return "";
}