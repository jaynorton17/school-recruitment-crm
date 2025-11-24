import React from 'react';
import styles from './AnimatedChristmasTree.module.css';

interface AnimatedChristmasTreeProps {
  className?: string;
}

const AnimatedChristmasTree: React.FC<AnimatedChristmasTreeProps> = ({ className = '' }) => {
  const lights = [
    { cx: 70, cy: 70, className: `${styles.light} ${styles.red}`, delay: '0s' },
    { cx: 90, cy: 90, className: `${styles.light} ${styles.blue}`, delay: '0.2s' },
    { cx: 60, cy: 110, className: `${styles.light} ${styles.gold}`, delay: '0.4s' },
    { cx: 100, cy: 125, className: `${styles.light} ${styles.green}`, delay: '0.6s' },
    { cx: 80, cy: 145, className: `${styles.light} ${styles.red}`, delay: '0.8s' },
    { cx: 50, cy: 130, className: `${styles.light} ${styles.blue}`, delay: '1s' },
  ];

  return (
    <div className={`${styles.treeWrapper} ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 140 180" className={styles.treeSvg} role="img">
        <polygon points="70,10 25,100 115,100" fill="#15803d" />
        <polygon points="70,40 20,130 120,130" fill="#16a34a" />
        <polygon points="70,70 15,160 125,160" fill="#22c55e" />
        <rect x="58" y="150" width="24" height="28" rx="4" className={styles.trunk} />
        <polygon points="70,18 76,32 92,32 79,42 84,58 70,48 56,58 61,42 48,32 64,32" className={styles.star} />
        {lights.map((light, idx) => (
          <circle
            key={idx}
            cx={light.cx}
            cy={light.cy}
            r={6}
            className={light.className}
            style={{ animationDelay: light.delay }}
          />
        ))}
      </svg>
    </div>
  );
};

export default AnimatedChristmasTree;
