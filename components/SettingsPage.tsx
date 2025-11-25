import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, ColumnData, Id, Playbook } from '../types';
import { User as UserIcon, Settings, SlidersHorizontal, ToyBrick, GripVertical, Trash2, PlusCircle, Upload, Edit, Bell, Webhook, MessageSquare, Loader2, BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import CreateStageModal from './CreateStageModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import NotificationSettings from './NotificationSettings';
import PlaybookSettings from './PlaybookSettings';

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
        <div className="bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="p-6 border-b border-zinc-700">
                <h2 className="text-lg font-semibold text-white">Informações do Perfil</h2>
                <p className="text-sm text-zinc-400 mt-1">Atualize suas informações pessoais e foto de perfil</p>
            </div>
            <div className="p-6 space-y-8">
                <div className="flex items-center gap-5">
                    <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-900" />
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
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
             <div className="p-4 bg-zinc-800/50 border-t border-zinc-700 rounded-b-lg flex justify-end">
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
        <div className="flex items-center gap-3 p-2 bg-zinc-800 rounded-lg border border-zinc-700 touch-none">
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
    
    const handleCreateOrUpdateStage = (stageData: {id?: Id, title: string, color: string}) => {
      let newColumns: ColumnData[] = [];
        if (stageData.id) { // Update
            newColumns = columns.map(c => 
                c.id === stageData.id ? { ...c, title: stageData.title, color: stageData.color } : c
            );
        } else { // Create
            const newColumn: ColumnData = { id: `stage-${Date.now()}`, title: stageData.title, color: stageData.color };
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
            <div className="bg-zinc-900 rounded-lg border border-zinc-800">
                 <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Estágios do Pipeline: <span className="text-violet-400">Vendas Padrão</span></h2>
                        <p className="text-sm text-zinc-400 mt-1">Configure os estágios do seu funil de vendas. Arraste para reordenar.</p>
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
                        message={<><p>Tem certeza que deseja deletar este estágio?</p><p className="mt-2 text-sm text-zinc-500">Esta ação não pode ser desfeita. Leads neste estágio não serão excluídos, mas precisarão ser movidos.</p></>}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

// --- WhatsApp Integration Tab ---
const WhatsAppChannelSettings: React.FC = () => {
    type Status = 'disconnected' | 'loading' | 'qr' | 'connected';
    const [status, setStatus] = useState<Status>(() => {
        return (localStorage.getItem('whatsapp_status') as Status) || 'disconnected';
    });

    useEffect(() => {
        localStorage.setItem('whatsapp_status', status);
    }, [status]);

    const handleConnect = () => {
        setStatus('loading');
        // Simulate fetching QR code
        setTimeout(() => {
            setStatus('qr');
            // Simulate user scanning the QR code and successful connection
            setTimeout(() => {
                setStatus('connected');
            }, 10000); // 10 seconds to "scan"
        }, 2000); // 2 seconds to "generate" QR
    };

    const handleDisconnect = () => {
        setStatus('disconnected');
    };

    const StatusIndicator = () => {
        switch(status) {
            case 'connected': return <div className="flex items-center gap-2 text-sm text-green-400"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>Conectado</div>;
            case 'loading': return <div className="flex items-center gap-2 text-sm text-yellow-400">Carregando...</div>;
            case 'qr': return <div className="flex items-center gap-2 text-sm text-yellow-400">Aguardando leitura</div>;
            default: return <div className="flex items-center gap-2 text-sm text-red-400"><div className="w-2 h-2 rounded-full bg-red-500"></div>Desconectado</div>;
        }
    };

    return (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-500" />
                        <span>WhatsApp Web</span>
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1">Conecte sua conta do WhatsApp para gerenciar conversas.</p>
                </div>
                <StatusIndicator />
            </div>
            <div className="p-6">
                {status === 'disconnected' && (
                    <div className="text-center">
                        <p className="text-zinc-400 mb-4">Clique no botão abaixo para gerar um QR Code e conectar sua conta do WhatsApp Web.</p>
                        <button onClick={handleConnect} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-md transition-colors">
                            Conectar ao WhatsApp
                        </button>
                    </div>
                )}
                {status === 'loading' && (
                     <div className="flex flex-col items-center justify-center text-center py-10">
                        <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-4" />
                        <p className="text-zinc-300">Gerando QR Code...</p>
                    </div>
                )}
                {status === 'qr' && (
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="bg-white p-4 rounded-lg">
                             <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ExampleQRCodeForFityCRM" alt="QR Code" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-lg">Leia o QR Code para conectar</h3>
                            <ol className="list-decimal list-inside text-zinc-400 mt-2 space-y-1 text-sm">
                                <li>Abra o WhatsApp no seu celular.</li>
                                <li>Toque em Menu ou Configurações e selecione <strong>Aparelhos conectados</strong>.</li>
                                <li>Toque em <strong>Conectar um aparelho</strong>.</li>
                                <li>Aponte seu celular para esta tela para capturar o código.</li>
                            </ol>
                            <p className="text-xs text-zinc-500 mt-4">Este QR Code irá expirar em breve.</p>
                        </div>
                    </div>
                )}
                 {status === 'connected' && (
                    <div className="text-center">
                        <p className="text-zinc-300 mb-4">Sua conta do WhatsApp está conectada.</p>
                         <button onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-md transition-colors">
                            Desconectar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Placeholder ---
const PlaceholderTab: React.FC<{ title: string }> = ({ title }) => (
    <div className="text-center p-10 bg-zinc-900 rounded-lg border-2 border-dashed border-zinc-800">
        <h2 className="text-lg font-semibold text-white">WIP: {title}</h2>
        <p className="text-zinc-400 mt-2">Esta seção estará disponível em breve!</p>
    </div>
);


// --- Componente Principal ---
interface SettingsPageProps {
    currentUser: User;
    columns: ColumnData[];
    playbooks: Playbook[];
    onUpdateProfile: (name: string, avatarFile?: File) => void;
    onUpdatePipeline: (columns: ColumnData[]) => void;
    onUpdatePlaybooks: (playbooks: Playbook[]) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, columns, playbooks, onUpdateProfile, onUpdatePipeline, onUpdatePlaybooks }) => {
    const [activeTab, setActiveTab] = useState('Pipeline');

    const tabs = [
        { name: 'Perfil', icon: UserIcon },
        { name: 'Pipeline', icon: Settings },
        { name: 'Playbooks', icon: BookOpen },
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
                {activeTab === 'Pipeline' && <PipelineSettings columns={columns} onUpdatePipeline={onUpdatePipeline} />}
                {activeTab === 'Playbooks' && <PlaybookSettings initialPlaybooks={playbooks} onSave={onUpdatePlaybooks} pipelineColumns={columns} />}
                {activeTab === 'Preferências' && <PlaceholderTab title="Preferências" />}
                {activeTab === 'Integrações' && <WhatsAppChannelSettings />}
                {activeTab === 'Notificações' && <NotificationSettings />}
            </div>
        </div>
    );
};

export default SettingsPage;