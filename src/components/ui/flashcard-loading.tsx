 const FlashcardLoading = () => {
        return(
            <div className="w-full mt-6 flex flex-col gap-4">
                
                {/* Header skeleton */}
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"/>

                {/* Card Skeleton */}
                <div className="h-[200px] bg-gray-200 rounded-xl animate-pulse"/>

                {/* Progress skeleton */}
                <div className="flex gap-2 mt-4">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"/>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"/>
                </div>
            </div>
        )
    }

    export default FlashcardLoading;