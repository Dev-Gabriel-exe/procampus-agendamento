'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Archive, ArchiveRestore, X, Check, CheckSquare } from 'lucide-react'

type Item = {
  id: string
  label: string      // texto principal
  sublabel?: string  // texto secundário (data, disciplina, etc.)
}

type Props = {
  mode: 'archive' | 'unarchive'
  items: Item[]
  onConfirm: (ids: string[]) => void
  onCancel: () => void
  loading?: boolean
}

export default function ArchiveModal({ mode, items, onConfirm, onCancel, loading }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map(i => i.id)))
  }

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const isArchive = mode === 'archive'
  const accent = isArchive ? '#4054B2' : '#23A455'
  const accentBg = isArchive ? '#eef1fb' : '#e8f9eb'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ position: 'relative', background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isArchive
              ? <Archive style={{ width: 22, height: 22, color: accent }} />
              : <ArchiveRestore style={{ width: 22, height: 22, color: accent }} />}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 18, color: '#0a1a0d', margin: 0 }}>
              {isArchive ? 'Arquivar registros' : 'Desarquivar registros'}
            </h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '3px 0 0' }}>
              {isArchive
                ? 'Selecione os itens para arquivar. Eles ficam ocultos mas podem ser restaurados.'
                : 'Selecione os itens arquivados para restaurar.'}
            </p>
          </div>
          <button onClick={onCancel} style={{ padding: 6, background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#6b7280' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Select all */}
        {items.length > 0 && (
          <button onClick={toggleAll}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${accent}`, background: accentBg, color: accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 10, width: '100%' }}>
            <CheckSquare style={{ width: 15, height: 15 }} />
            {selected.size === items.length ? 'Desmarcar todos' : `Selecionar todos (${items.length})`}
          </button>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 14 }}>
              {isArchive ? 'Nenhum item disponível para arquivar.' : 'Nenhum item arquivado.'}
            </div>
          ) : items.map(item => {
            const sel = selected.has(item.id)
            return (
              <button key={item.id} onClick={() => toggle(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${sel ? accent : '#e5e7eb'}`, background: sel ? accentBg : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: sel ? accent : 'white', border: sel ? `2px solid ${accent}` : '2px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {sel && <Check style={{ width: 12, height: 12, color: 'white' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0a1a0d', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</p>
                  {item.sublabel && <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>{item.sublabel}</p>}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={() => onConfirm(Array.from(selected))} disabled={selected.size === 0 || loading}
            style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: selected.size === 0 || loading ? '#e5e7eb' : accent, color: selected.size === 0 || loading ? '#9ca3af' : 'white', fontSize: 13, fontWeight: 700, cursor: selected.size === 0 || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {isArchive ? <Archive style={{ width: 14, height: 14 }} /> : <ArchiveRestore style={{ width: 14, height: 14 }} />}
            {loading ? 'Processando...' : isArchive
              ? `Arquivar ${selected.size > 0 ? selected.size : ''} selecionado${selected.size !== 1 ? 's' : ''}`
              : `Restaurar ${selected.size > 0 ? selected.size : ''} selecionado${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
