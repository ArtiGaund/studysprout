"use client";


import { useCallback, useState } from "react";
import { Dialog, DialogTrigger } from "../ui/dialog";
import ResourceHierarchyList from "./resource-hierarchy-list";


interface ResourcePickerModelProps{
    children: React.ReactNode;
    getValue?: (resource: string) => void;
    editable?: boolean;
}

const ResourcePickerModel: React.FC<ResourcePickerModelProps> = ({
    children,
    getValue,
    editable,
    
}) => {
    // State to control the Dialog visibility
    const [isOpen, setIsOpen] = useState(false);

    // function to handle the selection from the ResourceHierarchyList
    const handleSelect = useCallback((
        id: string,
        title: string,
        type: 'Workspace' | 'Folder' | 'File'
    ) => {
        const resourceString = `[${type} : ${title}, Id: ${id}]`;

        // 1.send the data back to the parent component (FlashcardTypesForm)
        if(getValue){
            getValue(resourceString);
        }

        // 2.close the modal
        setIsOpen(false)
    },[getValue])

    return(
        <div className="flex items-center">
            <Dialog>
                <DialogTrigger asChild>
                    <div className="cursor-pointer">{children}</div>
                </DialogTrigger>
                <ResourceHierarchyList onSelect={handleSelect}/>
            </Dialog>
        </div>
    )
}

export default ResourcePickerModel;