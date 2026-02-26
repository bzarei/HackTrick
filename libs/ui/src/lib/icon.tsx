import React from "react";

export const Icon: React.FC<{
  name: string;
  size?: number;
  className?: string;
}> = ({ name, size = 20, className }) => (
  <svg
    width={size}
    height={size}
    className={className}
    aria-hidden={true}
    fill="currentColor"
  >
    <use href={`#${name}`} />
  </svg>
);
