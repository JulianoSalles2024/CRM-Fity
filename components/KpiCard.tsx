import React from 'react';
import { LucideProps } from 'lucide-react';

interface KpiCardProps {
    title: string;
    value: string;
    icon: React.FC<LucideProps>;
    iconColor: string; // e.g., "text-violet-400"
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, iconColor }) => {
    // Dynamically create border color class from text color class
    const borderColorClass = iconColor.replace('text-', 'border-');

    return (
        <div className={`bg-zinc-800 p-6 rounded-lg border border-zinc-700 flex items-center gap-5 transition-all duration-200 ease-in-out hover:bg-zinc-700/50 hover:-translate-y-1 hover:shadow-lg border-l-4 ${borderColorClass}`}>
            <div className={`w-12 h-12 rounded-lg bg-zinc-900 flex-shrink-0 flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div>
                 <p className="text-3xl font-bold text-white">{value}</p>
                 <p className="text-base text-zinc-400">{title}</p>
            </div>
        </div>
    );
};

export default KpiCard;
