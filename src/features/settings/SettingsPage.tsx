import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, ColumnData, Id, Playbook } from '@/shared/types';
import { User as UserIcon, Settings, SlidersHorizontal, ToyBrick, GripVertical, Trash2, PlusCircle, Upload, Edit, Bell, Webhook, MessageSquare, Loader2, BookOpen, Bot, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import CreateStageModal from './CreateStageModal';
import ConfirmDeleteModal from '@/shared/components/ConfirmDeleteModal';
import NotificationSettings from '@/features/notifications/NotificationSettings';
import PlaybookSettings from '@/features/playbooks/PlaybookSettings';
import IntegrationsPage from '@/features/integrations/IntegrationsPage';
import AISettings from '@/features/ai/AISettings';
import TeamSettings from './TeamSettings';

// --- Subcomponente de Perfil ---
interface ProfileSettingsProps {
    currentUser: User;
    onUpdateProfile: (name: string, avatarFile?: File) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ currentUser, onUpdateProfile }) => {
    const [name, setName] = useState(currentUser.name);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState(currentUser.avatarUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(currentUser.name);
        setAvatarPreview(currentUser.avatarUrl);
    }, [currentUser]);

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };
    
    const handleSave = () => {
        onUpdateProfile(name, avatarFile || undefined);
    };

    return (
        <div className="bg-slate-900 rounded-lg border border-slate-800">
            <div className="p-6 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">Informações do Perfil</h2>
                <p className="text-sm text-slate-400 mt-1">Atualize suas informações pessoais e foto de perfil</p>
            </div>
            <div className="p-6 space-y-8">
                <div className="flex items-center gap-5">
                    <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-900" />
                    <div>
                        <input type="file" ref={fileInputRef} hidden accept="image/jpeg, image/png, image/webp" onChange={handleAvatarChange} />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-600 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Alterar foto</span>
                        </button>
                        <p className="text-xs text-slate-500 mt-2">JPG, PNG ou WebP. Máximo 2MB.</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Nome Completo</label>
                        <input
                            type="text" id="name" value={name} onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                        <input
                            type="email" id="email" value={currentUser.email} disabled
                            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                        />
                         <p className="text-xs text-slate-500 mt-2">O email não pode ser alterado</p>
                    </div>
                </div>

            </div>
             <div className="p-4 bg-slate-800/50 border-t border-slate-700 rounded-b-lg flex justify-end">
                <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 transition-colors"
                >
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
};


// --- Componentes para Drag-and-Drop de Estágios ---

const StageItem: React.FC<{ column: ColumnData; index: number; onEdit?: (column: ColumnData) => void; onDelete?: (id: Id) => void; listeners?: any }> = ({ column, index, onEdit, onDelete, listeners }) => {
    const typeStyles: Record<ColumnData['type'], string> = {
        open: 'bg-slate-700 text-slate-300',
        qualification: 'bg-purple-900/50 text-purple-400',
        'follow-up': 'bg-blue-900/50 text-blue-400',
        scheduling: 'bg-teal-900/50 text-teal-400',
        won: 'bg-green-900/50 text-green-400',
        lost: 'bg-red-900/50 text-red-400',
    };
    const typeLabels: Record<ColumnData['type'], string> = {
        open: 'Abertura',
        qualification: 'Qualificação',
        'follow-up': 'Follow-up',
        scheduling: 'Agendamento',
        won: 'Ganho',
        lost: 'Perda',
    };

    return (
        <div className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg border border-slate-700 touch-none">
            <button {...listeners} className="cursor-grab p-1 touch-none">
                <GripVertical className="w-5 h-5 text-slate-500 flex-shrink-0" />
            </button>
            <div className={`w-4 h-4 rounded-sm flex-shrink-0`} style={{ backgroundColor: column.color }}></div>
            <div className="flex-1 flex items-center gap-4">
                <span className="font-medium text-white">{column.title}</span>
                <span className="text-sm text-slate-500">Posição: {index + 1}</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeStyles[column.type]}`}>{typeLabels[column.type]}</span>
            {onEdit && (
                <button onClick={() => onEdit(column)} className="p-2 text-slate-400 hover:text-white rounded-md">
                    <Edit className="w-4 h-4" />
                </button>
            )}
            {onDelete && (
                <button onClick={() => onDelete(column.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-md">
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}

const SortableStageItem: React.FC<{ column: ColumnData; index: number; onEdit: (column: ColumnData) => void; onDelete: (id: Id) => void }> = ({ column, index, onEdit, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: column.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return <div ref={setNodeRef} style={style} className="h-[52px] w-full bg-slate-800 rounded-lg opacity-50 border-2 border-dashed border-slate-600" />
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <StageItem column={column} index={index} onEdit={onEdit} onDelete={onDelete} listeners={listeners} />
        </div>
    );
};

// --- Subcomponente de Pipeline ---
interface PipelineSettingsProps {
    columns: ColumnData[];
    onUpdatePipeline: (columns: ColumnData[]) => void;
}

const PipelineSettings: React.FC<PipelineSettingsProps> = ({ columns: initialColumns, onUpdatePipeline }) => {
    const [columns, setColumns] = useState(initialColumns);
    const [isCreateStageModalOpen, setCreateStageModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<ColumnData | null>(null);
    const [stageToDelete, setStageToDelete] = useState<Id | null>(null);
    const [activeColumn, setActiveColumn] = useState<ColumnData | null>(null);

     useEffect(() => {
        setColumns(initialColumns);
    }, [initialColumns]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );
    
    const columnIds = useMemo(() => columns.map(c => c.id), [columns]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveColumn(columns.find(col => col.id === active.id) || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveColumn(null);
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = columns.findIndex(item => item.id === active.id);
            const newIndex = columns.findIndex(item => item.id === over.id);
            const newColumns = arrayMove(columns, oldIndex, newIndex);
            onUpdatePipeline(newColumns);
        }
    };
    
    const handleOpenEditModal = (column: ColumnData) => {
        setEditingStage(column);
        setCreateStageModalOpen(true);
    };
    
    const handleCreateOrUpdateStage = (stageData: {id?: Id, title: string, color: string, type: ColumnData['type']}) => {
      let newColumns: ColumnData[] = [];
        if (stageData.id) { // Update
            newColumns = columns.map(c => 
                c.id === stageData.id ? { ...c, title: stageData.title, color: stageData.color, type: stageData.type } : c
            );
        } else { // Create
            const newColumn: ColumnData = { id: `stage-${Date.now()}`, title: stageData.title, color: stageData.color, type: stageData.type };
            newColumns = [...columns, newColumn];
        }
        onUpdatePipeline(newColumns);
        setCreateStageModalOpen(false);
        setEditingStage(null);
    };


    const handleDeleteColumn = (id: Id) => {
        if (columns.length <= 1) {
            alert("Você deve ter pelo menos um estágio no pipeline.");
            return;
        }
        setStageToDelete(id);
    };

    const confirmDeleteStage = () => {
        if (stageToDelete) {
            const newColumns = columns.filter(col => col.id !== stageToDelete);
            onUpdatePipeline(newColumns);
            setStageToDelete(null);
        }
    };

    return (
        <>
            <div className="bg-slate-900 rounded-lg border border-slate-800">
                 <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Estágios do Pipeline: <span className="text-violet-400">Vendas Padrão</span></h2>
                        <p className="text-sm text-slate-400 mt-1">Configure os estágios do seu funil de vendas. Arraste para reordenar.</p>
                    </div>
                    <button onClick={() => { setEditingStage(null); setCreateStageModalOpen(true); }} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-violet-700 transition-colors">
                        <PlusCircle className="w-4 h-4" /><span>Novo Estágio</span>
                    </button>
                </div>
                 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="p-6 space-y-3">
                        <SortableContext items={columnIds} strategy={verticalListSortingStrategy}>
                            {columns.map((col, index) => (
                                <SortableStageItem key={col.id} column={col} index={index} onEdit={handleOpenEditModal} onDelete={handleDeleteColumn} />
                            ))}
                        </SortableContext>
                    </div>
                    <DragOverlay>{activeColumn ? <StageItem column={activeColumn} index={columns.findIndex(c => c.id === activeColumn.id)} /> : null}</DragOverlay>
                </DndContext>
            </div>
            
            <AnimatePresence>
                {isCreateStageModalOpen && (
                    <CreateStageModal 
                        onClose={() => {
                            setCreateStageModalOpen(false);
                            setEditingStage(null);
                        }} 
                        onSubmit={handleCreateOrUpdateStage}
                        stageToEdit={editingStage}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {stageToDelete && (
                    <ConfirmDeleteModal onClose={() => setStageToDelete(null)} onConfirm={confirmDeleteStage} title="Confirmar Exclusão de Estágio"
                        message={<><p>Tem certeza que deseja deletar este estágio?</p><p className="mt-2 text-sm text-slate-500">Esta ação não pode ser desfeita. Leads neste estágio não serão excluídos, mas precisarão ser movidos.</p></>}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

// --- Placeholder ---
const PlaceholderTab: React.FC<{ title: string }> = ({ title }) => (
    <div className="text-center p-10 bg-slate-900 rounded-lg border-2 border-dashed border-slate-800">
        <h2 className="text-lg font-semibold text-white">WIP: {title}</h2>
        <p className="text-slate-400 mt-2">Esta seção estará disponível em breve!</p>
    </div>
);


// --- Componente Principal ---
interface SettingsPageProps {
    currentUser: User;
    users: User[];
    columns: ColumnData[];
    onUpdateProfile: (name: string, avatarFile?: File) => void;
    onUpdatePipeline: (columns: ColumnData[]) => void;
    onUpdateUsers: (users: User[]) => void;
    onResetApplication: () => void;
    initialTab?: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, users, columns, onUpdateProfile, onUpdatePipeline, onUpdateUsers, onResetApplication, initialTab }) => {
    const [activeTab, setActiveTab] = useState('Pipeline');

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const tabs = [
        { name: 'Perfil', icon: UserIcon },
        { name: 'Pipeline', icon: Settings },
        { name: 'Equipe', icon: Users },
        { name: 'Inteligência Artificial', icon: Bot },
        { name: 'Preferências', icon: SlidersHorizontal },
        { name: 'Integrações', icon: Webhook },
        { name: 'Notificações', icon: Bell },
    ];

    return (
        <div className="flex flex-col gap-6">
             <div className="flex items-center gap-4">
                <Settings className="w-8 h-8 text-violet-500" />
                <div>
                    <h1 className="text-2xl font-bold text-white">Configurações</h1>
                    <p className="text-slate-400">Gerencie suas preferências e configurações da conta</p>
                </div>
            </div>
            <div>
                <div className="border-b border-slate-700 mb-6">
                    <nav className="flex -mb-px space-x-6 overflow-x-auto" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`whitespace-nowrap flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.name ? 'border-violet-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            <div className="space-y-6">
                {activeTab === 'Perfil' && <ProfileSettings currentUser={currentUser} onUpdateProfile={onUpdateProfile} />}
                {activeTab === 'Pipeline' && <PipelineSettings columns={columns} onUpdatePipeline={onUpdatePipeline} />}
                {activeTab === 'Equipe' && <TeamSettings users={users} currentUser={currentUser} onUpdateUsers={onUpdateUsers} />}
                {activeTab === 'Inteligência Artificial' && <AISettings />}
                {activeTab === 'Preferências' && <PlaceholderTab title="Preferências" />}
                {activeTab === 'Integrações' && <IntegrationsPage showNotification={() => {}} />}
                {activeTab === 'Notificações' && <NotificationSettings />}
            </div>

            {/* Danger Zone */}
            <div className="bg-slate-900 rounded-lg border border-red-500/30 mt-4">
                <div className="p-6 border-b border-red-500/20">
                    <h2 className="text-lg font-semibold text-red-400">Zona de Perigo</h2>
                    <p className="text-sm text-slate-400 mt-1">Ações destrutivas que não podem ser desfeitas.</p>
                </div>
                <div className="p-6 flex justify-between items-center">
                    <div>
                        <h3 className="font-medium text-white">Resetar Aplicação</h3>
                        <p className="text-sm text-slate-500">Isso irá apagar todos os dados do local storage e recarregar a aplicação.</p>
                    </div>
                    <button onClick={onResetApplication} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md transition-colors">
                        Resetar Dados
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;