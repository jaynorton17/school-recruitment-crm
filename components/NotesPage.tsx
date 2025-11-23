import React from 'react';
import { Note } from '../types';
import { AddIcon } from './icons';

interface NotesPageProps {
  notes: Note[];
  onOpenAddNoteModal: () => void;
}

const NotesPage: React.FC<NotesPageProps> = ({ notes, onOpenAddNoteModal }) => {
  return (
    <div className="p-6">
       <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Notes</h2>
        <button 
            onClick={onOpenAddNoteModal}
            className="flex items-center bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
        >
            <AddIcon className="w-5 h-5 mr-2"/>
            Add Note
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <ul className="divide-y divide-slate-100">
            {notes.map((note, index) => (
                <li key={index} className="p-4 hover:bg-slate-50">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-grow">
                            <p className="font-semibold text-slate-800">{note.schoolName}</p>
                            <p className="text-sm text-slate-600 mt-1">"{note.note}"</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="text-xs font-medium text-slate-500">{note.date}</p>
                            <p className="text-xs text-slate-400 mt-1">By {note.accountManager}</p>
                        </div>
                    </div>
                </li>
            ))}
            {notes.length === 0 && (
                <li className="p-8 text-center text-slate-500">No notes found.</li>
            )}
        </ul>
      </div>
    </div>
  );
};

export default NotesPage;