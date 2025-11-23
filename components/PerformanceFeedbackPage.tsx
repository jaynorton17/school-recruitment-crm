import React from 'react';
import { PerformanceFeedback } from '../types';
import { PerformanceIcon } from './icons';

const PerformanceFeedbackPage: React.FC<{ feedbackHistory: PerformanceFeedback[] }> = ({ feedbackHistory }) => {
    return (
        <div className="p-6 bg-slate-50 min-h-full">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Performance & Feedback</h2>
            {feedbackHistory.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200">
                    <PerformanceIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700">No Feedback Yet</h3>
                    <p className="text-slate-500 mt-2">
                        Complete 5 transcribed calls to generate your first performance report.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {feedbackHistory.map((feedback) => (
                        <div key={feedback.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                                <h3 className="text-lg font-bold text-slate-800">Performance Review</h3>
                                <p className="text-sm text-slate-500 font-medium">Calls from: {feedback.dateRange}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-emerald-600 mb-2">Strengths</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                                        {feedback.strengths.map((item, index) => <li key={index}>{item}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-amber-600 mb-2">Areas for Improvement</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                                        {feedback.areasForImprovement.map((item, index) => <li key={index}>{item}</li>)}
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t">
                                <h4 className="font-semibold text-sky-600 mb-2">Quick Tips</h4>
                                <div className="space-y-2">
                                    {feedback.tips.map((tip, index) => (
                                         <p key={index} className="text-sm p-3 bg-sky-50 text-sky-800 rounded-lg">{tip}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PerformanceFeedbackPage;
