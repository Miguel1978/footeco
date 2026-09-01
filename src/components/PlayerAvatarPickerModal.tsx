import React, { useState, useRef } from 'react';
import { Player } from '../types';
import { 
  X, 
  Sparkles, 
  Upload, 
  Check, 
  Shuffle, 
  Palette, 
  User, 
  Image as ImageIcon,
  Trash2,
  Smile
} from 'lucide-react';
import { 
  AVATAR_COLORS, 
  AVATAR_ICONS, 
  AVATAR_PRESETS, 
  generateRandomAvatar 
} from '../utils/avatarUtils';
import { PlayerAvatar } from './PlayerAvatar';

interface PlayerAvatarPickerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (playerId: string, updates: Partial<Player>) => void;
}

export const PlayerAvatarPickerModal: React.FC<PlayerAvatarPickerModalProps> = ({
  player,
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'icon' | 'preset' | 'photo'>('icon');
  const [selectedColor, setSelectedColor] = useState<string>(player?.avatarColor || AVATAR_COLORS[0].bg);
  const [selectedIcon, setSelectedIcon] = useState<string>(player?.avatarIcon || 'foot');
  const [selectedType, setSelectedType] = useState<'icon' | 'preset' | 'photo' | 'initials'>(player?.avatarType || 'icon');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>(player?.avatarUrl || '');
  const [inputUrl, setInputUrl] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when player changes
  React.useEffect(() => {
    if (player) {
      setSelectedColor(player.avatarColor || AVATAR_COLORS[0].bg);
      setSelectedIcon(player.avatarIcon || 'foot');
      setSelectedType(player.avatarType || 'icon');
      setCustomPhotoUrl(player.avatarUrl || '');
      if (player.avatarType === 'preset') setActiveTab('preset');
      else if (player.avatarType === 'photo') setActiveTab('photo');
      else setActiveTab('icon');
    }
  }, [player]);

  if (!isOpen || !player) return null;

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomPhotoUrl(reader.result);
          setSelectedType('photo');
          setActiveTab('photo');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRandomize = () => {
    const rand = generateRandomAvatar(Math.floor(Math.random() * 20));
    setSelectedType(rand.avatarType);
    setSelectedColor(rand.avatarColor);
    setSelectedIcon(rand.avatarIcon);
    setCustomPhotoUrl(rand.avatarUrl || '');
    if (rand.avatarType === 'preset') {
      setActiveTab('preset');
    } else {
      setActiveTab('icon');
    }
  };

  const handleApply = () => {
    onSave(player.id, {
      avatarType: selectedType,
      avatarColor: selectedColor,
      avatarIcon: selectedIcon,
      avatarUrl: selectedType === 'photo' || selectedType === 'preset' ? customPhotoUrl : undefined,
    });
    onClose();
  };

  const tempPlayerPreview: Partial<Player> = {
    ...player,
    avatarType: selectedType,
    avatarColor: selectedColor,
    avatarIcon: selectedIcon,
    avatarUrl: customPhotoUrl,
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Identité visuelle du joueur</h3>
              <p className="text-xs text-slate-500">{player.name} • {player.defaultPosition || 'Milieu'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Bar */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlayerAvatar
              player={tempPlayerPreview}
              size="xl"
              showBorder
              className="shadow-lg ring-4 ring-white/20"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight">{player.name}</span>
                {player.number !== undefined && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-mono font-bold">
                    N°{player.number}
                  </span>
                )}
              </div>
              <span className="text-xs text-emerald-400 font-medium">
                {player.defaultPosition || 'Poste non défini'}
              </span>
              <div className="mt-1 text-[11px] text-slate-300">
                {selectedType === 'photo' ? 'Photo personnalisée' : selectedType === 'preset' ? 'Avatar Foot FE12' : 'Icône sportive colorée'}
              </div>
            </div>
          </div>

          <button
            onClick={handleRandomize}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors shadow-xs"
            title="Générer un look aléatoire"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Aléatoire</span>
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('icon');
              if (selectedType !== 'initials') setSelectedType('icon');
            }}
            className={`px-3.5 py-2 rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'icon'
                ? 'bg-white text-slate-900 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>1. Icônes & Couleurs</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('preset');
              setSelectedType('preset');
            }}
            className={`px-3.5 py-2 rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'preset'
                ? 'bg-white text-slate-900 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>2. Avatars Foot FE12</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('photo');
              setSelectedType('photo');
            }}
            className={`px-3.5 py-2 rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'photo'
                ? 'bg-white text-slate-900 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>3. Photo</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: ICONS & COLORS */}
          {activeTab === 'icon' && (
            <div className="space-y-4">
              
              {/* Color Palette */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Couleur du badge ({AVATAR_COLORS.find(c => c.bg === selectedColor)?.name || 'Personnalisée'})
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_COLORS.map(color => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color.bg);
                        if (selectedType === 'photo') setSelectedType('icon');
                      }}
                      className={`h-9 rounded-xl flex items-center justify-center transition-all ${
                        selectedColor === color.bg
                          ? 'ring-3 ring-slate-900 scale-105 shadow-md'
                          : 'hover:scale-102 opacity-90 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color.bg }}
                      title={color.name}
                    >
                      {selectedColor === color.bg && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon / Symbol selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Symbole ou Caractéristique
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectedType(selectedType === 'initials' ? 'icon' : 'initials')}
                    className={`text-xs px-2 py-0.5 rounded font-medium border transition-colors ${
                      selectedType === 'initials'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {selectedType === 'initials' ? '✓ Mode Numéro / Initiales actif' : 'Utiliser Numéro / Initiales'}
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_ICONS.map(icon => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => {
                        setSelectedIcon(icon.id);
                        setSelectedType('icon');
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                        selectedIcon === icon.id && selectedType === 'icon'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-1 ring-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <PlayerAvatar
                        player={{ avatarColor: selectedColor, avatarIcon: icon.id, avatarType: 'icon' }}
                        size="sm"
                        showBorder={false}
                      />
                      <span className="text-[11px] truncate">{icon.name}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PRESET CARTOON FOOTBALL PLAYERS */}
          {activeTab === 'preset' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Sélectionnez un profil joueur illustré
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setCustomPhotoUrl(preset.svgDataUri);
                      setSelectedType('preset');
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      customPhotoUrl === preset.svgDataUri && selectedType === 'preset'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <img
                      src={preset.svgDataUri}
                      alt={preset.name}
                      className="w-12 h-12 rounded-full border border-slate-300 shadow-xs"
                    />
                    <span className="text-[10px] font-bold text-slate-800 text-center leading-tight truncate w-full">
                      {preset.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM PHOTO / UPLOAD */}
          {activeTab === 'photo' && (
            <div className="space-y-4">
              
              {/* File upload zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Cliquez ou déposez une photo de votre joueur
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Formats JPG, PNG, WebP acceptés (recadrage rond automatique)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* URL input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Ou coller une URL d'image web :
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://exemple.com/photo.jpg"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (inputUrl.trim()) {
                        setCustomPhotoUrl(inputUrl.trim());
                        setSelectedType('photo');
                        setInputUrl('');
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors"
                  >
                    Valider
                  </button>
                </div>
              </div>

              {/* Remove photo button if set */}
              {customPhotoUrl && selectedType === 'photo' && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPhotoUrl('');
                      setSelectedType('icon');
                      setActiveTab('icon');
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer la photo
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Annuler
          </button>
          
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Enregistrer l'avatar</span>
          </button>
        </div>

      </div>
    </div>
  );
};
