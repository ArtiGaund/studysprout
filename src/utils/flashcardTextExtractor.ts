
// !. Helper: Extracts raw text from the block's inline content array
function extractInlineText(contentArray: any[]):string{
    if(!Array.isArray(contentArray)) return "";
    // Pull the 'text' property from each inline object and join the results.
    return contentArray.map(inlineItem => inlineItem.text || '').join('');
}

// 2.Recursive function to structure the text based on Block type
function extractReadableText(blocks: any[],level: number = 0): string {
    let outputText = "";
    // creating indentation (eg, " ","  ") for visual hierarchy
    const indentation = " ".repeat(level);

    blocks.forEach(block => {
        const blockText = extractInlineText(block.content);

        // Type Aware switch statement
        switch(block.type){
            case 'paragraph': 
            case 'heading1':
                if(blockText){
                    // Prepend markdown hashed for headings based on level prop
                    const prefix = block.type === 'heading' ? '#'.repeat(block.props?.level || 1) + ' '  : '';
                    outputText +=`${indentation}${prefix}${blockText}\n\n`;
                }
                break;
            case 'listItem':
                if(blockText){
                    // Use standard list markdown (* or 1) and single newline for list cohesion
                    const marker = block.props?.listType === 'ordered' ? '1. ' : '* ';
                    outputText += `${indentation}${marker}${blockText}\n`;
                }
                break;
            case 'toDo': //assuming the checklist type is 'toDo
                if(blockText){
                    const checked = block.props?.checked ? '[x]' : '[ ]';
                    outputText += `${indentation}- ${checked} ${blockText}\n`;
                }
                break;
            case 'quote':
                if(blockText){
                    outputText += `${indentation}> ${blockText}\n\n`;
                }
                break;
            case 'codeBlock':
                if(blockText){
                    // wrap code in fences for LLM context
                    const language = block.props?.language || '';
                    outputText += `\n${indentation}\`\`\`${language}\n${blockText}\n\`\`\`\n\n`;
                }
                break;
            case 'table':
                outputText += `\n${indentation} === TABLE START (Data omitted for structure) ===\n`;
                // TODO to create more deeper recursion function to iterate block.children (row) and block.children
                // (cells). 
                // For similicity, we flag it for the AI but omit the raw data
                outputText += `\n${indentation} === TABLE END ===\n\n`;
            default:
                // handle complex blocks or types we want the AI to ignore
                if(block.type !== 'image' && block.type !=='video' && blockText){
                    outputText += `[${block.type.toUpperCase()}: ${blockText}]\n\n`;
                }
                break;
        }

        // 3. Recursive call for nested children
        if(block.children && block.children.length > 0){
            outputText += extractReadableText(block.children, level + 1);
        }
    });
    return outputText;
}

// 3. Wrapper: Aggregates multiple file data strings and handles JSON parsing
export function getAggregatedPlainText(fileContentsArray: string[]): string{
    let aggregatedText = '';
    
    fileContentsArray.forEach( fileDataString => {
        if(typeof fileDataString === 'string' && fileDataString.trim().length > 0){
            try {
                // Must parse  the string before passing it to the recusive function
                const blocks = JSON.parse(fileDataString);

                // Add a separator before the content of each file for AI context
                aggregatedText += '=== DOCUMENT START ===\n';
                aggregatedText += extractReadableText(blocks, 0);
                aggregatedText += '=== DOCUMENT END ===\n';
            } catch (error) {
                console.log("Failed to parse BlockNote JSON during extraction: ",error);
                aggregatedText+= `[ERROR: Failed to process document. Skipping content.]\n\n`
            }
        }
    })

    return aggregatedText.trim();
}

// heading1, heading2, heading3,quote, numbered list, bullet list, check list, paragraph, code block, table