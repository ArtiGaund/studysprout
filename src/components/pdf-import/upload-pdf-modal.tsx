'use client';

import { forwardRef } from "react";
import CustomDialogTrigger from "../global/custom-dialog";
import { PDFUploadForm } from "./pdf-upload-form";


interface UploadPDFModalProps {
    children: React.ReactNode
}

export const UploadPDFModal = forwardRef<HTMLDivElement, UploadPDFModalProps>(
    ({ children, ...props}, ref) => {
        return (
            <div ref={ref} {...props}>
                <CustomDialogTrigger
                header="Import PDF to Folder"
                content={<PDFUploadForm />}
                >
                    {children}
                </CustomDialogTrigger>
            </div>
        )
    }
)

UploadPDFModal.displayName = "UploadPDFModal";