import React, { forwardRef } from 'react';

interface CypressSearchIconProps extends React.SVGProps<SVGSVGElement> {}

const CypressSearchIcon = forwardRef<SVGSVGElement,CypressSearchIconProps>(( props, ref) => {
  return (
     <svg
      ref={ref}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18C12.4439 18 14.1951 17.2917 15.5408 16.0847L19.293 19.837C19.6835 20.2275 20.3165 20.2275 20.707 19.837C21.0975 19.4465 21.0975 18.8134 20.707 18.4229L16.9532 14.6691C17.7025 13.342 18 11.9213 18 10.5C18 6.35786 14.6421 3 10.5 3ZM10.5 4.5C13.8137 4.5 16.5 7.18629 16.5 10.5C16.5 13.8137 13.8137 16.5 10.5 16.5C7.18629 16.5 4.5 13.8137 4.5 10.5C4.5 7.18629 7.18629 4.5 10.5 4.5Z"
        className="dark:fill-[#2B2939] fill-[#D3D3D3] transition-all group-hover/native:fill-washed-purple-400"
        fill="currentColor"
      />
    </svg>
  );
});

CypressSearchIcon.displayName = 'CypressSearchIcon';

export default CypressSearchIcon;