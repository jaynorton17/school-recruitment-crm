import React from 'react';
import { SpinnerIcon } from './icons';
import styles from './Loading.module.css';

const santaSvg = (
    <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
        <g transform="scale(-1, 1) translate(-200, 0)">
            <path d="M130 50 C 90 45, 60 48, 30 52" stroke="#8B4513" fill="none" strokeWidth="1" />
            <g fill="#A0522D" stroke="#654321" strokeWidth="0.5">
                <rect x="20" y="50" width="15" height="10" rx="3" />
                <path d="M22 50 l-3 -5 M28 50 l3 -5" stroke="#654321" strokeWidth="1" fill="none" />
                <circle cx="33" cy="51" r="1.5" fill="#ef4444" />
                <rect x="50" y="50" width="15" height="10" rx="3" />
                <path d="M52 50 l-3 -5 M58 50 l3 -5" stroke="#654321" strokeWidth="1" fill="none" />
            </g>
            <path d="M100 80 Q 95 60, 110 60 L 170 60 Q 185 60, 180 80 Z" fill="#dc2626" />
            <path d="M98 80 Q 140 95, 182 80" fill="none" stroke="#D4AF37" strokeWidth="3" />
            <path d="M100 80 C 80 80, 85 45, 105 45 L 115 45 L 110 60 Z" fill="#b91c1c" />
            <rect x="120" y="45" width="20" height="15" fill="#34D399" />
            <rect x="145" y="50" width="15" height="10" fill="#FBBF24" />
            <g>
                <circle cx="118" cy="40" r="10" fill="#dc2626" />
                <circle cx="118" cy="30" r="6" fill="#FFDDC1" />
                <rect x="114" y="22" width="8" height="4" fill="#dc2626" />
            </g>
        </g>
    </svg>
);

const Loading: React.FC = () => {
    const snowflakes = Array.from({ length: 50 }).map((_, index) => {
        const style = {
            left: `${Math.random() * 100}%`,
            animationDuration: `${6 + Math.random() * 6}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.4 + Math.random() * 0.6,
            width: `${4 + Math.random() * 4}px`,
            height: `${4 + Math.random() * 4}px`
        } as React.CSSProperties;

        return <div key={index} className={styles.snowflake} style={style}></div>;
    });

    return (
        <div className={styles.container}>
            <div className={styles.lights}>
                {['red', 'green', 'blue', 'yellow', 'red', 'green', 'blue', 'yellow'].map((color, idx) => (
                    <div key={idx} className={`${styles.bulb} ${styles[color as keyof typeof styles]}`} />
                ))}
            </div>

            <div className={styles.snowLayer}>{snowflakes}</div>

            <div className={styles.santa}>{santaSvg}</div>

            <div className={styles.contentBox}>
                <div className={styles.tree}>
                    <div className={styles.treeTop}></div>
                    <div className={styles.trunk}></div>
                    <div className={styles.star}></div>
                    <div className={styles.bauble}></div>
                    <div className={styles.bauble}></div>
                    <div className={styles.bauble}></div>
                    <div className={styles.bauble}></div>
                    <div className={styles.bauble}></div>
                </div>

                <h1 className={styles.title}>EduTalent Connect CRM</h1>

                <div className={styles.status}>
                    <SpinnerIcon className="w-6 h-6" />
                    <p className="text-lg">Initializing...</p>
                </div>
            </div>
        </div>
    );
};

export default Loading;
