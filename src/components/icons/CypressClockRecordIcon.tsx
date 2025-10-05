import React, { FC } from "react";

interface ClockRecordIconProps {}

const CypressClockRecordIcon: FC<ClockRecordIconProps> = () => {
  return (
    // CRITICAL: Add the 'group' class here so inner elements can respond to the hover event on the SVG
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="icon icon-tabler icon-tabler-clock-record group"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      strokeWidth="2"
      fill="none" // Ensure the base SVG is not filled
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      
      {/* Clock Outer Circle and Hands (Line/Stroke Elements) */}
      {/* We apply STROKE colors for line icons */}
      <path 
        d="M21 12a9 9 0 1 0 -9.9 8.5" 
        // Initial color for the stroke
        className={`stroke-[#817EB5] transition-all group-hover/native:stroke-washed-purple-400`} 
      />
      
      {/* Clock Hands (Line/Stroke Elements) */}
      <path 
        d="M12 7v5l3 3" 
        // Initial color for the stroke
        className={`stroke-[#817EB5] transition-all group-hover/native:stroke-washed-purple-400`} 
      />
      
      {/* Record Dot (Filled Element) */}
      {/* This element is specifically meant to be FILLED */}
      <path 
        fillRule="evenodd" // Adding fill rules for clean rendering of the dot
        clipRule="evenodd" 
        d="M19 16.5a3 3 0 1 0 0 6a3 3 0 1 0 0 -6" // Simplified path for a centered dot at (19, 19)
        // We apply FILL colors here, matching the HomeIcon's background fill logic
        className={`dark:fill-[#2B2939] fill-[#D3D3D3] transition-all group-hover/native:fill-washed-blue-500`}
        stroke="none" // Ensure the dot itself has no stroke
      />
    </svg>
  );
};

export default CypressClockRecordIcon;
