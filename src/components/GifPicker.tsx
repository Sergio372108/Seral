import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

const GIPHY_API_KEY = 'DYWRIIKTiO2STqNmYByyagJxBvETOejq';

interface GifResult {
  id: string;
  url: string;
  preview: string;
}

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

type Tab = 'gif' | 'sticker';

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [tab, setTab]         = useState<Tab>('gif');
  const [query, setQuery]     = useState('');
  const [gifs, setGifs]       = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchGifs('', tab);
  }, [tab]);

  async function fetchGifs(search: string, type: Tab) {
    setLoading(true);
    try {
      const base = type === 'sticker'
        ? 'https://api.giphy.com/v1/stickers'
        : 'https://api.giphy.com/v1/gifs';

      const endpoint = search
        ? `${base}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(search)}&limit=20&rating=g`
        : `${base}/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`;

      const res  = await fetch(endpoint);
      const data = await res.json();

      const results: GifResult[] = (data.data || []).map((item: any) => ({
        id:      item.id,
        url:     item.images?.original?.url             || '',
        preview: item.images?.fixed_width_small?.url   || item.images?.original?.url || '',
      })).filter((g: GifResult) => g.url);

      setGifs(results);
    } catch (err) {
      console.error('[GifPicker] Error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGifs(value, tab), 400);
  }

  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    setQuery('');
    setGifs([]);
  }

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />

      <div className="absolute bottom-full mb-2 left-0 z-20 bg-white border border-slate-200 rounded-2xl shadow-xl w-72 overflow-hidden">
        {/* Tabs GIF / Stickers */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => handleTabChange('gif')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === 'gif'
                ? 'text-slate-900 border-b-2 border-slate-900'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            GIF
          </button>
          <button
            onClick={() => handleTabChange('sticker')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === 'sticker'
                ? 'text-slate-900 border-b-2 border-slate-900'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Stickers
          </button>
        </div>

        {/* Buscador */}
        <div className="p-2 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder={tab === 'gif' ? 'Buscar GIFs...' : 'Buscar stickers...'}
              className="w-full text-sm pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="p-2 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            </div>
          ) : gifs.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-6">Sin resultados</p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {gifs.map(gif => (
                <button
                  key={gif.id}
                  onClick={() => onSelect(gif.url)}
                  className="rounded-lg overflow-hidden hover:opacity-80 transition-opacity aspect-video bg-slate-100"
                >
                  <img
                    src={gif.preview}
                    alt="gif"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-2 pb-2 text-center">
          <span className="text-[10px] text-slate-300">Powered by GIPHY</span>
        </div>
      </div>
    </>
  );
}