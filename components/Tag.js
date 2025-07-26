import React from 'react';

const Tag = ({ tag, className = "", onClick = null, selected = false }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200";
  const selectedClasses = selected 
    ? "border-transparent text-white" 
    : "border-border text-foreground hover:border-primary";
  
  const classes = `${baseClasses} ${selectedClasses} ${className}`;
  
  return (
    <span
      className={classes}
      style={{
        backgroundColor: selected ? tag.color : 'transparent'
      }}
      onClick={onClick}
    >
      {tag.name}
    </span>
  );
};

export default Tag; 