"use client"
import BannerSection from '@/components/banner-upload/banner-section'
import TextEditor from '@/components/editor/editor'
import Editor from '@/components/editor/editor'
import { File } from '@/model/file.model'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { RootProps } from 'postcss'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

const FilePage: React.FC<{ params : { fileId: string }}> = ({ params }) => {
    const router = useRouter()
    const [ fileDetails, setFileDetails ] = useState<File | undefined>(undefined)

    const onChangeHandler = ( content: string ) => {
        console.log("Live updated content of file ",content);
    }
    useEffect(() => {
        const getFileDetails = async() => {
            try {
                const response = await axios.get(`/api/get-current-file?fileId=${params.fileId}`)
                if(!response.data.success){
                    router.push('/dashboard')
                }else{
                    setFileDetails(response.data.data)
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