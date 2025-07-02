"use client"
import BannerSection from '@/components/banner-upload/banner-section'
import TextEditor from '@/components/editor/editor'
import Editor from '@/components/editor/editor'
import { useFile } from '@/hooks/useFile'
import { File } from '@/model/file.model'
import { ReduxFile } from '@/types/state.type'
import { transformFile } from '@/utils/data-transformers'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { RootProps } from 'postcss'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'


const FilePage: React.FC<{ params : { fileId: string }}> = ({ params }) => {
    const router = useRouter()
    const [ fileDetails, setFileDetails ] = useState<ReduxFile | undefined>(undefined)

    const { currentFileDetails } = useFile();
    const onChangeHandler = ( content: string ) => {
        console.log("Live updated content of file ",content);
    }
    useEffect(() => {
        const getFileDetails = async() => {
            try {
                const response = await currentFileDetails(params.fileId)
                if(!response.success){
                    router.push('/dashboard')
                }else{
                    if(response.data){
                        const file = transformFile(response.data);
                        setFileDetails(file);
                    }else{
                        setFileDetails(undefined)
                    }
                    
                }
            } catch (error) {
                console.log("Error while fetching all the file details ",error)

            }
        }
        getFileDetails()
    }, [params.fileId, router])
    return (
        <div className='relative'>
            { fileDetails && (
                <>
                    <BannerSection
                    dirType='file'
                    fileId={params.fileId}
                    dirDetails={fileDetails}
                    ></BannerSection>
                    <TextEditor 
                    fileId={params.fileId}
                    fileDetails={fileDetails}
                    onChange= {onChangeHandler}
                    initialContent={JSON.stringify(fileDetails.data)}
                    editable={true}
                    />
                    {/* <Editor /> */}
                    
                </>
            )}
        </div>
    )
}

export default FilePage