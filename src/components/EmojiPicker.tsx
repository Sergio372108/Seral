// src/components/EmojiPicker.tsx
import { useState } from 'react';

const CATEGORIES: Record<string, string[]> = {
  '😀': ['😀','😂','🤣','😊','😍','🥰','😘','😎','🤩','🥳','😅','😆','😁','😋','😜','🤪','😝','🤑','🤗','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕'],
  '👋': ['👋','🤚','🖐','✋','🖖','👌','🤌','✌','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👀','👁','👅','👄'],
  '❤️': ['❤️','🧡','💛','💚','💙','💜','🤍','💔','💖','💟','☮️','✝️','☪️','🕉','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚'],
  '🐶': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐈','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿','🦔'],
  '🍎': ['🍎','🍊','🍋','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🫑','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍘','🍥','🥮','🍢','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🧃','🥤','🧋','☕','🍵','🫖','🧉','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧊'],
  '⚽': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🥍','🏑','🏏','🪃','🥅','⛳','🪁','🤿','🎣','🤸','🤼','🤺','🏋','🤾','🏌','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🎽','🎿','🛷','🥌'],
  '💡': ['💡','🔦','🕯','🪔','💰','💴','💵','💶','💷','💸','💳','🪙','💹','📈','📉','📊','📋','📌','📍','🗂','🗃','🗄','🗑','🔒','🔓','🔏','🔐','🔑','🗝','🔨','🪓','⛏','⚒','🛠','🗡','⚔️','🛡','🪚','🔧','🪛','🔩','⚙️','🗜','⚖️','🦯','🔗','⛓','🪝','🧰','🪜','🧲','🪜','💊','🩺','🩻','🩹','🩼','💉','🩸','🧬','🦠','🧫','🧪','🌡','🔭','🔬','🕳','🪤','🧯','🛒','🚪','🛏','🛋','🪑','🚽','🪠','🚿','🛁','🪤','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🪥','🪒','🧽','🪞','🪟','🧸','🪆','🖼','🪄','🧿','🎃','🎊','🎉','🎎','🎏','🎐','🧧','🎀','🎁','🎗','🎟','🎫'],
};

const CATEGORY_ICONS = Object.keys(CATEGORIES);

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(CATEGORY_ICONS[0]);
  const [search, setSearch] = useState('');

  const filtered = search
    ? Object.values(CATEGORIES).flat().filter(e => e.includes(search))
    : CATEGORIES[activeCategory];

  return (
    <>
      {/* Overlay para cerrar al pulsar fuera */}
      <div className="fixed inset-0 z-10" onClick={onClose} />

      <div className="absolute bottom-full mb-2 left-0 z-20 bg-white border border-slate-200 rounded-2xl shadow-xl w-72 overflow-hidden">
        {/* Buscador */}
        <div className="p-2 border-b border-slate-100">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar emoji..."
            className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-slate-400"
          />
        </div>

        {/* Categorías */}
        {!search && (
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {CATEGORY_ICONS.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-2 py-1.5 text-lg transition-colors ${
                  activeCategory === cat ? 'bg-slate-100' : 'hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid de emojis */}
        <div className="grid grid-cols-8 gap-0.5 p-2 max-h-48 overflow-y-auto">
          {filtered.map((emoji, i) => (
            <button
              key={i}
              onClick={() => onSelect(emoji)}
              className="text-xl p-1 rounded hover:bg-slate-100 transition-colors leading-none"
            >
              {emoji}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-8 text-center text-slate-400 text-sm py-4">Sin resultados</p>
          )}
        </div>
      </div>
    </>
  );
}