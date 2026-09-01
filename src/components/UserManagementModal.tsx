import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { 
  Users, 
  Shield, 
  ShieldAlert, 
  UserCheck, 
  Eye, 
  X, 
  Check, 
  Sparkles,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { user, userProfile, isAdmin, updateUserRole } = useAuth();
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          uid: docSnap.id,
          email: data.email || null,
          displayName: data.displayName || 'Utilisateur',
          photoURL: data.photoURL || null,
          role: (data.role as UserRole) || 'coach',
          createdAt: data.createdAt,
          lastLoginAt: data.lastLoginAt,
        });
      });
      setUsersList(list);
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleChangeRole = async (targetUid: string, newRole: UserRole) => {
    try {
      await updateUserRole(targetUid, newRole);
      setUsersList(prev => prev.map(u => u.uid === targetUid ? { ...u, role: newRole } : u));
      setActionSuccess(`Rôle mis à jour en "${newRole}".`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e) {
      console.error('Error updating role:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Gestion des Accès & Utilisateurs</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  Administration
                </span>
              </h2>
              <p className="text-xs text-indigo-200/80">
                Attribuez les rôles : Administrateur, Coach ou Observateur.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              className="p-2 text-indigo-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action success alert */}
        {actionSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Modal content: Users table */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-extrabold">Guide des Rôles :</span>
              <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pt-1">
                <li><strong className="text-slate-900">Admin :</strong> Accès total (modification, gestion des rôles, exports, suppression).</li>
                <li><strong className="text-slate-900">Coach :</strong> Saisie de la feuille de match, scores, chronomètre et évaluations.</li>
                <li><strong className="text-slate-900">Observateur (Viewer) :</strong> Consultation en direct et lecture seule sans modification.</li>
              </ul>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Utilisateur</span>
              <span>Rôle & Permissions</span>
            </div>

            <div className="divide-y divide-slate-100">
              {usersList.length > 0 ? (
                usersList.map((usr) => {
                  const isCurrent = usr.uid === user?.uid;
                  return (
                    <div key={usr.uid} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-300 shadow-2xs">
                          {usr.photoURL ? (
                            <img src={usr.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            (usr.displayName || usr.email || 'U').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>{usr.displayName || 'Utilisateur'}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded-full">
                                Vous
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{usr.email || 'Sans email'}</div>
                        </div>
                      </div>

                      {/* Role selection badge/dropdown */}
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <select
                            value={usr.role}
                            onChange={(e) => handleChangeRole(usr.uid, e.target.value as UserRole)}
                            className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                          >
                            <option value="admin">🛡️ Admin (Gestion complète)</option>
                            <option value="coach">⚽ Coach (Édition match)</option>
                            <option value="viewer">👁️ Observateur (Lecture seule)</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            usr.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : usr.role === 'coach'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {usr.role === 'admin' ? '🛡️ Admin' : usr.role === 'coach' ? '⚽ Coach' : '👁️ Observateur'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  {isLoading ? 'Chargement des utilisateurs...' : 'Aucun utilisateur enregistré dans le système.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
