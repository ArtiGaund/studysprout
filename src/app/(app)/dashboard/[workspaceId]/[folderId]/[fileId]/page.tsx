"use client"
import TextEditor from '@/components/text-editor/text-editor'
import { File } from '@/model/file.model'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { RootProps } from 'postcss'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

const FilePage: React.FC<{ params : { fileId: string }}> = ({ params }) => {
    const router = useRouter()
    const [ fileDetails, setFileDetails ] = useState<File | undefined>(undefined)

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
    }, [params.fileId])
    return (
        <div className='relative'>
            { fileDetails && (
                <TextEditor
                dirType='file'
                fileId={params.fileId}
                dirDetails={fileDetails}
                ></TextEditor>
            )}
        </div>
    )
}

export default FilePage