import React, { useState } from 'react';
import { PersonalInfoCard } from '../components/PersonalInfoCard';
import { PersonalInfoForm } from '../components/PersonalInfoForm';
import { SecurityCard } from '../components/SecurityCard';
import { SecurityForm } from '../components/SecurityForm';

export const ProfilePage: React.FC = () => {
  const [editMode, setEditMode] = useState<'none' | 'personal' | 'security'>('none');
  
  // Mock user data based on screenshots
  const [user, setUser] = useState({
    firstName: 'Juliano',
    lastName: 'Salles',
    nickname: 'Juka',
    fullName: 'Juliano Salles',
    role: 'Admin',
    email: 'jukasalleso@gmail.com',
    phone: '+5551993351127',
    memberSince: 'fevereiro de 2026',
    avatarUrl: 'https://i.pravatar.cc/150?u=juka'
  });

  const handleSavePersonal = (newData: any) => {
    setUser({
      ...user,
      ...newData,
      fullName: `${newData.firstName} ${newData.lastName}`
    });
    setEditMode('none');
  };

  const handleSaveSecurity = (passwords: any) => {
    console.log('Saving passwords:', passwords);
    setEditMode('none');
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">Meu Perfil</h1>
        <p className="text-slate-400">Gerencie suas informações pessoais e segurança.</p>
      </header>

      <div className="space-y-8">
        {editMode === 'personal' ? (
          <PersonalInfoForm 
            initialData={{
              firstName: user.firstName,
              lastName: user.lastName,
              nickname: user.nickname,
              phone: user.phone,
              avatarUrl: user.avatarUrl,
              role: user.role
            }}
            onSave={handleSavePersonal}
            onCancel={() => setEditMode('none')}
          />
        ) : (
          <PersonalInfoCard 
            user={user}
            onEdit={() => setEditMode('personal')}
          />
        )}

        {editMode === 'security' ? (
          <SecurityForm 
            onSave={handleSaveSecurity}
            onCancel={() => setEditMode('none')}
          />
        ) : (
          <SecurityCard 
            onEdit={() => setEditMode('security')}
          />
        )}
      </div>
    </div>
  );
};
