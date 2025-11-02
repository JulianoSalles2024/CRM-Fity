import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Tag as TagType } from '../types';

interface TagFilterPopupProps {
    allTags: TagType[];
    selectedTags: TagType[];
    onTagToggle: (tag: TagType) => void;
    onClose: () => void;
    onClear: () => void;
}

const TagFilterPopup: React.FC<TagFilterPopupProps> = ({ allTags, selectedTags, onTagToggle, onClose, onClear }) => {
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const isSelected = (tag: TagType) => selectedTags.some(selected => selected.id === tag.id);

    return (
        <motion.div
            ref={popupRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-72 bg-zinc-800 rounded-lg border border-zinc-700 shadow-lg z-20"
        >
            <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-white">Filtrar por Tags</h3>
                    <p className="text-sm text-zinc-400">Selecione uma ou mais tags.</p>
                </div>
                <button onClick={() => { onClear(); onClose(); }} className="text-xs text-violet-400 hover:text-violet-300">Limpar</button>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto">
                {allTags.length > 0 ? allTags.map((tag) => (
                    <button
                        key={tag.id}
                        onClick={() => onTagToggle(tag)}
                        className="w-full flex items-center justify-between p-2 rounded-md hover:bg-zinc-700/50 text-left"
                    >
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }}></span>
                            <span className="text-sm font-medium text-white">{tag.name}</span>
                        </div>
                        {isSelected(tag) && <Check className="w-4 h-4 text-violet-400" />}
                    </button>
                )) : (
                    <p className="p-4 text-center text-sm text-zinc-500">Nenhuma tag cadastrada.</p>
                )}
            </div>
        </motion.div>
    );
};

export default TagFilterPopup;
