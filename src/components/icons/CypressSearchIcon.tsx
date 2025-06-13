import React, { FC } from 'react';

interface CypressSearchIconProps {}

const CypressSearchIcon: FC<CypressSearchIconProps> = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Magnifying Glass Icon Paths */}
      {/* Path for the circle (main part of the magnifying glass) */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18C12.4439 18 14.1951 17.2917 15.5408 16.0847L19.293 19.837C19.6835 20.2275 20.3165 20.2275 20.707 19.837C21.0975 19.4465 21.0975 18.8134 20.707 18.4229L16.9532 14.6691C17.7025 13.342 18 11.9213 18 10.5C18 6.35786 14.6421 3 10.5 3ZM4.5 10.5C4.5 7.18629 7.18629 4.5 10.5 4.5C13.8137 4.5 16.5 7.18629 16.5 10.5C16.5 13.8137 13.8137 16.5 10.5 16.5C7.18629 16.5 4.5 13.8137 4.5 10.5Z"
        className={`dark:fill-[#2B2939] fill-[#D3D3D3] text-xl transition-all group-hover/native:fill-washed-purple-400`}
      />
      {/* This icon typically only needs one path for the magnifying glass shape */}
      {/* I've combined the circle and handle into one path here for simplicity of a common search icon */}
      {/* If you have a specific two-part search icon, you can use two paths as in your home icon */}

      {/* The color classes should be similar to your home icon for consistency */}
      {/* You might use the same fill for the entire icon, or if you have a two-tone search icon, adjust */}
      {/* For a simple magnifying glass, one path with the base fill is usually sufficient */}
    </svg>
  );
};

export default CypressSearchIcon;