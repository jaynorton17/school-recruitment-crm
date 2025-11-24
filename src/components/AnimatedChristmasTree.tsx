import React from 'react';

const AnimatedChristmasTree: React.FC = () => {
  return (
    <div className="animated-christmas-tree" aria-hidden>
      <style>{`
        .animated-christmas-tree {
          display: inline-block;
          width: 120px;
          height: 150px;
          filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35));
        }
        .animated-christmas-tree svg {
          width: 100%;
          height: 100%;
        }
        .tree-light {
          animation: tree-flash 1.4s ease-in-out infinite;
          transform-origin: center;
        }
        .tree-light:nth-of-type(1) { animation-delay: 0.1s; }
        .tree-light:nth-of-type(2) { animation-delay: 0.3s; }
        .tree-light:nth-of-type(3) { animation-delay: 0.5s; }
        .tree-light:nth-of-type(4) { animation-delay: 0.7s; }
        .tree-light:nth-of-type(5) { animation-delay: 0.9s; }
        .tree-light:nth-of-type(6) { animation-delay: 1.1s; }
        .tree-light:nth-of-type(7) { animation-delay: 1.3s; }
        @keyframes tree-flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
      `}</style>
      <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Festive Christmas tree">
        <polygon points="60,5 15,85 60,75 30,125 60,115 45,150 75,150 60,115 90,125 60,75 105,85" fill="#0d6b32" />
        <polygon points="60,15 25,85 60,78 35,120 60,110 45,145 75,145 60,110 85,120 60,78 95,85" fill="#148f3b" />
        <rect x="52" y="145" width="16" height="15" fill="#6b4226" rx="2" />

        <circle className="tree-light" cx="50" cy="35" r="4" fill="#fbbf24" />
        <circle className="tree-light" cx="70" cy="42" r="4" fill="#60a5fa" />
        <circle className="tree-light" cx="40" cy="60" r="4" fill="#f472b6" />
        <circle className="tree-light" cx="80" cy="65" r="4" fill="#22d3ee" />
        <circle className="tree-light" cx="55" cy="85" r="4" fill="#a3e635" />
        <circle className="tree-light" cx="70" cy="100" r="4" fill="#f97316" />
        <circle className="tree-light" cx="45" cy="115" r="4" fill="#38bdf8" />

        <polygon points="60,22 64,30 73,31 66,37 68,46 60,42 52,46 54,37 47,31 56,30" fill="#fcd34d" />
      </svg>
    </div>
  );
};

export default AnimatedChristmasTree;
