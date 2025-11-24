import React from "react";
import "./AnimatedChristmasTree.css";

const AnimatedChristmasTree: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={className} style={{ width: "80px", height: "110px" }}>
      <svg viewBox="0 0 100 140" width="100%" height="100%">
        <polygon points="50,10 10,90 90,90" fill="#0A5F2C" />
        <polygon points="50,40 20,105 80,105" fill="#0C7A38" />
        <rect x="42" y="105" width="16" height="30" fill="#5A3E1B" />

        {/* Flashing lights */}
        <circle className="light" cx="40" cy="45" r="4" />
        <circle className="light" cx="60" cy="60" r="4" />
        <circle className="light" cx="45" cy="75" r="4" />
        <circle className="light" cx="55" cy="90" r="4" />
      </svg>
    </div>
  );
};

export default AnimatedChristmasTree;
