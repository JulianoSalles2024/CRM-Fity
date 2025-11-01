import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, ColumnData, Id } from '../types';
import { User as UserIcon, Settings, SlidersHorizontal, ToyBrick, GripVertical, Trash2, PlusCircle, Upload, Edit, Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import CreateStageModal from './CreateStageModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import NotificationSettings from './NotificationSettings';

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
        <div className="bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="p-6 border-b border-zinc-700">
                <h2 className="text-lg font-semibold text-white">Informações do Perfil</h2>
                <p className="text-sm text-zinc-400 mt-1">Atualize suas informações pessoais e foto de perfil</p>
            </div>
            <div className="p-6 space-y-8">
                <div className="flex items-center gap-5">
                    <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-800" />
                    <div>
                        <input type="file" ref={fileInputRef} hidden accept="image/jpeg, image/png, image/webp" onChange={handleAvatarChange} />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 bg-zinc-700 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-zinc-600 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Alterar foto</span>
                        </button>
                        <p className="text-xs text-zinc-500 mt-2">JPG, PNG ou WebP. Máximo 2MB.</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">Nome Completo</label>
                        <input
                            type="text" id="name" value={name} onChange={(e) => setName(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                        <input
                            type="email" id="email" value={currentUser.email} disabled
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-400 cursor-not-allowed"
                        />
                         <p className="text-xs text-zinc-500 mt-2">O email não pode ser alterado</p>
                    </div>
                </div>

            </div>
             <div className="p-4 bg-zinc-900/30 border-t border-zinc-700 rounded-b-lg flex justify-end">
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
    return (
        <div className="flex items-center gap-3 p-2 bg-zinc-900/50 rounded-lg border border-zinc-700 touch-none">
            <button {...listeners} className="cursor-grab p-1 touch-none">
                <GripVertical className="w-5 h-5 text-zinc-500 flex-shrink-0" />
            </button>
            <div className={`w-4 h-4 rounded-sm flex-shrink-0`} style={{ backgroundColor: column.color }}></div>
            <div className="flex-1 flex items-center gap-4">
                <span className="font-medium text-white">{column.title}</span>
                <span className="text-sm text-zinc-500">Posição: {index + 1}</span>
            </div>
            {onEdit && (
                <button onClick={() => onEdit(column)} className="p-2 text-zinc-400 hover:text-white rounded-md">
                    <Edit className="w-4 h-4" />
                </button>
            )}
            {onDelete && (
                <button onClick={() => onDelete(column.id)} className="p-2 text-zinc-400 hover:text-red-500 rounded-md">
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
        return <div ref={setNodeRef} style={style} className="h-[52px] w-full bg-zinc-800 rounded-lg opacity-50 border-2 border-dashed border-zinc-600" />
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <StageItem column={column} index={index} onEdit={onEdit} onDelete={onDelete} listeners={listeners} />
        </div>
    );
};

// --- Subcomponente de Pipeline ---
interface Pipeline {
    id: Id;
    name: string;
    columns: ColumnData[];
}
interface PipelineSettingsProps {
    initialColumns: ColumnData[];
    onUpdatePipeline: (columns: ColumnData[]) => void;
}

const PipelineSettings: React.FC<PipelineSettingsProps> = ({ initialColumns, onUpdatePipeline }) => {
    const [pipelines, setPipelines] = useState<Pipeline[]>([
        { id: 'default-1', name: 'Vendas Padrão', columns: initialColumns }
    ]);
    const [activePipelineId, setActivePipelineId] = useState<Id>(pipelines[0].id);
    
    const [isCreateStageModalOpen, setCreateStageModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<ColumnData | null>(null);
    const [stageToDelete, setStageToDelete] = useState<Id | null>(null);
    const [activeColumn, setActiveColumn] = useState<ColumnData | null>(null);

    const [pipelineToDelete, setPipelineToDelete] = useState<Id | null>(null);
    const [isPipelineNameModalOpen, setPipelineNameModalOpen] = useState(false);
    const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
    const [newPipelineName, setNewPipelineName] = useState('');

    const activePipeline = useMemo(() => pipelines.find(p => p.id === activePipelineId), [pipelines, activePipelineId]);
    
    useEffect(() => {
        if (!activePipeline && pipelines.length > 0) {
            setActivePipelineId(pipelines[0].id);
        }
    }, [activePipeline, pipelines]);
    
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );
    
    const columnIds = useMemo(() => activePipeline?.columns.map(c => c.id) || [], [activePipeline]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveColumn(activePipeline?.columns.find(col => col.id === active.id) || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveColumn(null);
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setPipelines(currentPipelines =>
                currentPipelines.map(p => {
                    if (p.id === activePipelineId) {
                        const oldIndex = p.columns.findIndex(item => item.id === active.id);
                        const newIndex = p.columns.findIndex(item => item.id === over.id);
                        return { ...p, columns: arrayMove(p.columns, oldIndex, newIndex) };
                    }
                    return p;
                })
            );
        }
    };
    
    const handleOpenEditModal = (column: ColumnData) => {
        setEditingStage(column);
        setCreateStageModalOpen(true);
    };
    
    const handleCreateOrUpdateStage = (stageData: {id?: Id, title: string, color: string}) => {
      if (stageData.id) { // It's an update
         setPipelines(currentPipelines =>
            currentPipelines.map(p => {
                if (p.id === activePipelineId) {
                    return {
                        ...p,
                        columns: p.columns.map(c => c.id === stageData.id ? { ...c, title: stageData.title, color: stageData.color } : c)
                    };
                }
                return p;
            })
        );
      } else { // It's a create
        const newColumn: ColumnData = { id: `new-stage-${Date.now()}`, title: stageData.title, color: stageData.color };
        setPipelines(currentPipelines =>
            currentPipelines.map(p =>
                p.id === activePipelineId ? { ...p, columns: [...p.columns, newColumn] } : p
            )
        );
      }
      setCreateStageModalOpen(false);
      setEditingStage(null);
    };


    const handleDeleteColumn = (id: Id) => {
        if (activePipeline && activePipeline.columns.length <= 1) {
            alert("Você deve ter pelo menos um estágio no pipeline.");
            return;
        }
        setStageToDelete(id);
    };

    const confirmDeleteStage = () => {
        if (stageToDelete) {
             setPipelines(currentPipelines =>
                currentPipelines.map(p =>
                    p.id === activePipelineId ? { ...p, columns: p.columns.filter(col => col.id !== stageToDelete) } : p
                )
             );
             setStageToDelete(null);
        }
    };
    
    const handleOpenPipelineNameModal = (pipeline: Pipeline | null) => {
        setEditingPipeline(pipeline);
        setNewPipelineName(pipeline ? pipeline.name : '');
        setPipelineNameModalOpen(true);
    };

    const handleSavePipelineName = () => {
        if (!newPipelineName.trim()) {
            alert("O nome do funil não pode ser vazio.");
            return;
        }
        if (editingPipeline) { // Rename existing
            setPipelines(pipelines.map(p => p.id === editingPipeline.id ? { ...p, name: newPipelineName } : p));
        } else { // Create new
            const newPipeline: Pipeline = {
                id: `pipeline-${Date.now()}`,
                name: newPipelineName,
                columns: initialColumns.map(c => ({...c, id: `${c.id}-${Date.now()}`})) // Ensure unique ids for new columns
            };
            setPipelines([...pipelines, newPipeline]);
            setActivePipelineId(newPipeline.id);
        }
        setPipelineNameModalOpen(false);
    };

    const confirmDeletePipeline = () => {
        if (pipelineToDelete) {
            setPipelines(pipelines.filter(p => p.id !== pipelineToDelete));
            setPipelineToDelete(null);
        }
    };

    const handleSaveChanges = () => {
        if(activePipeline) {
            onUpdatePipeline(activePipeline.columns);
        }
    }

    return (
        <>
            <div className="bg-zinc-800/50 rounded-lg border border-zinc-700 mb-6">
                <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Funis de Venda</h2>
                        <p className="text-sm text-zinc-400 mt-1">Gerencie múltiplos funis de venda.</p>
                    </div>
                    <button onClick={() => handleOpenPipelineNameModal(null)} className="flex items-center gap-2 bg-zinc-700 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-zinc-600 transition-colors">
                        <PlusCircle className="w-4 h-4" /><span>Novo Funil</span>
                    </button>
                </div>
                <div className="p-6 space-y-2">
                    {pipelines.map(pipeline => (
                        <div key={pipeline.id} onClick={() => setActivePipelineId(pipeline.id)}
                             className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activePipelineId === pipeline.id ? 'bg-violet-900/50 border-violet-700' : 'bg-zinc-900/50 border-zinc-700 hover:bg-zinc-700/50'}`}>
                            <div className="flex-1 font-medium text-white">{pipeline.name}</div>
                            <button onClick={(e) => { e.stopPropagation(); handleOpenPipelineNameModal(pipeline); }} className="p-2 text-zinc-400 hover:text-white rounded-md"><Edit className="w-4 h-4" /></button>
                            {pipelines.length > 1 && (
                                <button onClick={(e) => { e.stopPropagation(); setPipelineToDelete(pipeline.id); }} className="p-2 text-zinc-400 hover:text-red-500 rounded-md"><Trash2 className="w-4 h-4" /></button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {activePipeline && (
                <div className="bg-zinc-800/50 rounded-lg border border-zinc-700">
                     <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Estágios do Pipeline: <span className="text-violet-400">{activePipeline.name}</span></h2>
                            <p className="text-sm text-zinc-400 mt-1">Configure os estágios do seu funil de vendas. Arraste para reordenar.</p>
                        </div>
                        <button onClick={() => { setEditingStage(null); setCreateStageModalOpen(true); }} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-violet-700 transition-colors">
                            <PlusCircle className="w-4 h-4" /><span>Novo Estágio</span>
                        </button>
                    </div>
                     <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="p-6 space-y-3">
                            <SortableContext items={columnIds} strategy={verticalListSortingStrategy}>
                                {activePipeline.columns.map((col, index) => (
                                    <SortableStageItem key={col.id} column={col} index={index} onEdit={handleOpenEditModal} onDelete={handleDeleteColumn} />
                                ))}
                            </SortableContext>
                        </div>
                        <DragOverlay>{activeColumn ? <StageItem column={activeColumn} index={activePipeline.columns.findIndex(c => c.id === activeColumn.id)} /> : null}</DragOverlay>
                    </DndContext>

                     <div className="p-4 bg-zinc-900/30 border-t border-zinc-700 rounded-b-lg flex justify-end">
                         <button onClick={handleSaveChanges} className="px-6 py-2 text-sm font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 transition-colors">
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            )}
            
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
                        message={<><p>Tem certeza que deseja deletar este estágio?</p><p className="mt-2 text-sm text-zinc-500">Esta ação não pode ser desfeita. Leads neste estágio não serão excluídos, mas precisarão ser movidos.</p></>}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {pipelineToDelete && (
                    <ConfirmDeleteModal onClose={() => setPipelineToDelete(null)} onConfirm={confirmDeletePipeline} title="Confirmar Exclusão de Funil"
                        message={<p>Tem certeza que deseja deletar este funil? Todos os seus estágios serão removidos. Esta ação não pode ser desfeita.</p>}
                    />
                )}
            </AnimatePresence>
             <AnimatePresence>
                {isPipelineNameModalOpen && (
                     <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setPipelineNameModalOpen(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-800 rounded-lg shadow-xl w-full max-w-md border border-zinc-700" onClick={e => e.stopPropagation()}>
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-white">{editingPipeline ? 'Renomear Funil' : 'Criar Novo Funil'}</h2>
                                <input type="text" value={newPipelineName} onChange={(e) => setNewPipelineName(e.target.value)}
                                    placeholder="Nome do Funil" required
                                    className="mt-4 w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"/>
                            </div>
                            <div className="p-4 bg-zinc-900/30 border-t border-zinc-700 flex justify-end gap-3">
                                <button onClick={() => setPipelineNameModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-zinc-300 bg-zinc-700 rounded-md hover:bg-zinc-600">Cancelar</button>
                                <button onClick={handleSavePipelineName} className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700">Salvar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

// --- Placeholder ---
const PlaceholderTab: React.FC<{ title: string }> = ({ title }) => (
    <div className="text-center p-10 bg-zinc-800/50 rounded-lg border-2 border-dashed border-zinc-700">
        <h2 className="text-lg font-semibold text-white">WIP: {title}</h2>
        <p className="text-zinc-400 mt-2">Esta seção estará disponível em breve!</p>
    </div>
);


// --- Componente Principal ---
interface SettingsPageProps {
    currentUser: User;
    columns: ColumnData[];
    onUpdateProfile: (name: string, avatarFile?: File) => void;
    onUpdatePipeline: (columns: ColumnData[]) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, columns, onUpdateProfile, onUpdatePipeline }) => {
    const [activeTab, setActiveTab] = useState('Notificações');

    const tabs = [
        { name: 'Perfil', icon: UserIcon },
        { name: 'Pipeline', icon: Settings },
        { name: 'Preferências', icon: SlidersHorizontal },
        { name: 'Integrações', icon: ToyBrick },
        { name: 'Notificações', icon: Bell },
    ];

    return (
        <div className="flex flex-col gap-6">
             <div className="flex items-center gap-4">
                <Settings className="w-8 h-8 text-[#14ff00]" />
                <div>
                    <h1 className="text-2xl font-bold text-white">Configurações</h1>
                    <p className="text-zinc-400">Gerencie suas preferências e configurações da conta</p>
                </div>
            </div>
            <div>
                <div className="border-b border-zinc-700 mb-6">
                    <nav className="flex -mb-px space-x-6" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`whitespace-nowrap flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.name ? 'border-violet-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            <div>
                {activeTab === 'Perfil' && <ProfileSettings currentUser={currentUser} onUpdateProfile={onUpdateProfile} />}
                {activeTab === 'Pipeline' && <PipelineSettings initialColumns={columns} onUpdatePipeline={onUpdatePipeline} />}
                {activeTab === 'Preferências' && <PlaceholderTab title="Preferências" />}
                {activeTab === 'Integrações' && <PlaceholderTab title="Integrações" />}
                {activeTab === 'Notificações' && <NotificationSettings />}
            </div>
        </div>
    );
};

export default SettingsPage;