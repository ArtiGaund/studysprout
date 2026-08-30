import React, { forwardRef } from "react"

interface CypressInboxIconProps extends React.SVGProps<SVGSVGElement> {}

const CypressInboxIcon = forwardRef<SVGSVGElement, CypressInboxIconProps>((props, ref) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 13V19C3 20.6569 4.34315 22 6 22H18C19.6569 22 21 20.6569 21 19V13H16C16 14.6569 14.6569 16 13 16H11C9.34315 16 8 14.6569 8 13H3Z"
        className={`dark:fill-[#2B2939] fill-[#D3D3D3] text-xl transition-all group-hover/native:fill-washed-purple-400`}
      />
      <path
        d="M3.5 11L6.10557 4.78933C6.42081 4.0335 7.15919 3.5 8 3.5H16C16.8408 3.5 17.5792 4.0335 17.8944 4.78933L20.5 11H16C16 12.1046 15.1046 13 14 13H10C8.89543 13 8 12.1046 8 11H3.5Z"
        className={`fill-[#817EB5] transition-all group-hover/native:fill-washed-blue-500`}
      />
    </svg>
  );
});

CypressInboxIcon.displayName = 'CypressInboxIcon';

export default CypressInboxIcon;