import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Coffee, Eye, Shield, Sun, Trash2, Save } from 'lucide-react';
import { pathTemplates } from '../utils/pathTemplates';

export default function PathSettingsModal({ isOpen, onClose, onSubmit, onDelete, path }) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState('focus');
  const [duration, setDuration] = useState(15);

  const isEditMode = !!path;

  // Prepopulate form if editing
  useEffect(() => {
    if (isEditMode && path) {
      setName(path.name || '');
      setMode(path.mode || 'focus');
      setDuration(path.defaultDuration || 15);
    } else {
      setName('');
      setMode('focus');
      setDuration(15);
    }
  }, [path, isOpen, isEditMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name, mode, duration);
    onClose();
  };

  const modesList = [
    { id: 'focus', label: 'Focus', icon: Brain, color: '#8a2be2' },
    { id: 'break', label: 'Break', icon: Coffee, color: '#ff69b4' },
    { id: 'meditate', label: 'Meditate', icon: Eye, color: '#00bfff' },
    { id: 'detox', label: 'Detox', icon: Shield, color: '#2ecc71' },
    { id: 'awaken', label: 'Awaken', icon: Sun, color: '#f59e0b' }
  ];

  const activeColor = modesList.find(m => m.id === mode)?.color || '#00bfff';

  const applyTemplate = (template) => {
    setName(template.name);
    setMode(template.mode);
    setDuration(template.duration);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(12px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            style={{
              background: 'rgba(15, 15, 28, 0.94)',
              border: `1px solid ${isEditMode ? activeColor + '40' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '24px',
              padding: '2rem 1.5rem',
              width: '100%',
              maxWidth: '380px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 30px ${activeColor}15`,
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '15px', right: '15px',
                background: 'transparent', border: 'none', color: '#a0a0c0', cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0c0'}
            >
              <X size={22} />
            </button>

            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: 800, color: '#fff', textAlign: 'center' }}>
              {isEditMode ? 'Edit Path Settings' : 'Create Kaizen Path'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              {!isEditMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#a0a0c0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Templates
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {pathTemplates.map((template) => {
                      const isSelected = name === template.name && mode === template.mode && duration === template.duration;
                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => applyTemplate(template)}
                          style={{
                            textAlign: 'left',
                            background: isSelected ? `${activeColor}20` : 'rgba(0,0,0,0.25)',
                            border: `1px solid ${isSelected ? activeColor : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: '12px',
                            padding: '0.7rem',
                            color: '#fff',
                            cursor: 'pointer',
                            minHeight: '74px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>{template.name}</span>
                            <span style={{ fontSize: '0.65rem', color: '#a0a0c0', fontWeight: 700 }}>{template.duration}m</span>
                          </div>
                          <div style={{ color: '#a0a0c0', fontSize: '0.65rem', lineHeight: 1.3, marginTop: '0.3rem' }}>
                            {template.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Path Name Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#a0a0c0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Path Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Work Study, Night Sleep"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  required
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    padding: '0.8rem',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.95rem',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = activeColor}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
              </div>

              {/* Mode Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#a0a0c0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Frequency Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
                  {modesList.map(m => {
                    const Icon = m.icon;
                    const isSelected = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(m.id)}
                        style={{
                          background: isSelected ? m.color : 'rgba(0,0,0,0.3)',
                          border: `1px solid ${isSelected ? m.color : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '12px',
                          padding: '0.6rem 0.2rem',
                          color: isSelected ? '#fff' : '#a0a0c0',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.3rem',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? `0 4px 12px ${m.color}30` : 'none'
                        }}
                      >
                        <Icon size={16} />
                        <span style={{ fontSize: '0.65rem', fontWeight: isSelected ? 700 : 400 }}>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', color: '#a0a0c0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Daily Goal Duration
                  </label>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>{duration}m</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: activeColor
                  }}
                />
              </div>

              {/* Actions Grid */}
              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem' }}>
                {isEditMode && onDelete && path.id !== 'default-path' && (
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(path.id);
                      onClose();
                    }}
                    style={{
                      flex: 'none',
                      width: '48px',
                      background: 'rgba(255, 105, 180, 0.1)',
                      border: '1px solid rgba(255, 105, 180, 0.25)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ff69b4',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ff69b4';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 105, 180, 0.1)';
                      e.currentTarget.style.color = '#ff69b4';
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: activeColor,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.9rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: `0 8px 20px ${activeColor}30`,
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {isEditMode ? <Save size={18} /> : null}
                  <span>{isEditMode ? 'Save Settings' : 'Create Path'}</span>
                </button>
              </div>

            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
