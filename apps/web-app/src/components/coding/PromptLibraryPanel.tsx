import { useEffect, useState } from 'react';
import { MagnifyingGlass, BookBookmark } from '@phosphor-icons/react';
import { API_URL } from '../../lib/api';

interface PromptLibraryPanelProps {
  onSelectPrompt: (content: string) => void;
}

interface Prompt {
  id: string;
  title: string;
  content: string;
}

export default function PromptLibraryPanel({ onSelectPrompt }: PromptLibraryPanelProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/prompts/categories`);
      if (res.ok) {
        const data = await res.json();
        const cats = Array.isArray(data) ? data.map((d: any) => d.category || d) : (data.categories || []);
        setCategories(cats);
        if (cats.length > 0) {
          fetchPrompts(cats[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch categories', e);
      setCategories(['Agents', 'Tasks', 'Workflows']);
      fetchPrompts('Agents');
    }
  };

  const fetchPrompts = async (category: string) => {
    setActiveCategory(category);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/prompts/prompts/${category}`);
      if (res.ok) {
        const data = await res.json();
        const mappedPrompts = Array.isArray(data) ? data.map((p: any, idx: number) => ({
          id: p.id || idx.toString(),
          title: p.title || p.name || p.role || `Prompt ${idx + 1}`,
          content: p.content || p.prompt || p.text || JSON.stringify(p, null, 2)
        })) : (data.prompts || []);
        setPrompts(mappedPrompts);
      }
    } catch (e) {
      console.error('Failed to fetch prompts', e);
      setPrompts([
        { id: '1', title: 'Data Scientist Agent', content: 'Create a Data Scientist agent...' },
        { id: '2', title: 'Code Reviewer', content: 'You are an expert code reviewer...' }
      ]);
    }
    setLoading(false);
  };

  const filteredPrompts = prompts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="p-4 border-b border-[#2A2A2A] bg-[#151515]">
        <div className="flex items-center gap-2 mb-4">
          <BookBookmark size={18} className="text-white" />
          <h2 className="text-sm font-medium text-white">Prompt Library</h2>
        </div>
        <div className="relative">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="w-full bg-[#000000] border border-[#2A2A2A] rounded px-8 py-1.5 text-xs text-white outline-none focus:border-[#4A4A4A] transition-colors"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {categories.map(cat => (
            <div key={cat} className="mb-2">
              <button
                onClick={() => fetchPrompts(cat)}
                className={`w-full text-left px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeCategory === cat ? 'bg-[#2A2A2A] text-white' : 'text-[#8A8A8A] hover:bg-[#151515]'
                }`}
              >
                {cat}
              </button>
              {activeCategory === cat && (
                <div className="mt-1 ml-2 border-l border-[#2A2A2A] pl-2 flex flex-col gap-1">
                  {loading ? (
                    <span className="text-xs text-[#4A4A4A] py-1">Loading...</span>
                  ) : (
                    filteredPrompts.map(prompt => (
                      <button
                        key={prompt.id}
                        onClick={() => onSelectPrompt(prompt.content)}
                        className="text-left px-2 py-1.5 rounded text-[11px] text-[#8A8A8A] hover:text-white hover:bg-[#151515] transition-colors line-clamp-2"
                      >
                        {prompt.title}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
