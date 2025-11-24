import React from 'react';
import { SpinnerIcon } from './icons';
import styles from './Loading.module.css';

const Loading: React.FC = () => {
    return (
        <div className={styles.container}>
            <div className={styles.accentOne} aria-hidden></div>
            <div className={styles.accentTwo} aria-hidden></div>

            <div className={styles.contentBox}>
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
