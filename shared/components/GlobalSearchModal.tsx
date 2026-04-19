
import React, { useState, useEffect } from 'react';
import PremiumModal from './PremiumModal';
import { documentService, mcqSetService } from '../../core/storage/services';
import { Document, MCQSet } from '../../types';
import Icon from './Icon';
import { useDebounce } from '../hooks/useDebounce';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult = 
  | { type: 'document', item: Document }
  | { type: 'set', item: MCQSet, matchContext?: string }
  | { type: 'mcq', item: any, set: MCQSet, matchContext?: string };

const GlobalSearchModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [allSets, setAllSets] = useState<MCQSet[]>([]);

  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        setIsSearching(true);
        try {
          const [d, s] = await Promise.all([
            documentService.getAll(),
            mcqSetService.getAll()
          ]);
          setAllDocs(d);
          setAllSets(s);
        } catch(e) {
          console.error("Search init failed", e);
        } finally {
          setIsSearching(false);
        }
      };
      loadData();
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const performSearch = () => {
      setIsSearching(true);
      const lowerQ = debouncedQuery.toLowerCase();
      const hits: SearchResult[] = [];
      const MAX_RESULTS = 20;

      for (const doc of allDocs) {
        if (hits.length >= MAX_RESULTS) break;
        if (doc.title.toLowerCase().includes(lowerQ)) {
          hits.push({ type: 'document', item: doc });
        }
      }

      for (const set of allSets) {
        if (hits.length >= MAX_RESULTS) break;
        
        if (set.name.toLowerCase().includes(lowerQ)) {
          hits.push({ type: 'set', item: set });
          continue;
        }

        for (const mcq of set.mcqs) {
          if (hits.length >= MAX_RESULTS) break;
          if (mcq.question.toLowerCase().includes(lowerQ)) {
            hits.push({ 
              type: 'mcq', 
              item: mcq, 
              set: set,
              matchContext: mcq.question
            });
          }
        }
      }

      setResults(hits);
      setIsSearching(false);
    };

    performSearch();
  }, [debouncedQuery, allDocs, allSets]);

  const handleSelect = (result: SearchResult) => {
    onClose();
    if (result.type === 'document') {
      navigate(`/create/${result.item.id}`);
    } else if (result.type === 'set') {
      navigate(`/live-mcq/set/${result.item.id}`);
    } else if (result.type === 'mcq') {
      navigate(`/live-mcq/set/${result.set.id}`);
    }
  };

  return (
    <PremiumModal isOpen={isOpen} onClose={onClose} title="Search" size="lg">
      <div className="min-h-[300px]">
        <div className="relative mb-4">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-none focus:ring-1 focus:ring-primary focus:outline-none font-serif text-text-primary placeholder:font-sans placeholder-text-secondary/50"
            placeholder="Search documents, sets, questions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="absolute left-3.5 top-3.5 text-secondary">
            <Icon name="search" size="sm" />
          </div>
          {isSearching && (
            <div className="absolute right-3.5 top-3.5 text-secondary animate-spin">
              <Icon name="refresh-cw" size="sm" />
            </div>
          )}
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {results.length === 0 && query.trim() && !isSearching && (
            <div className="text-center py-10 text-secondary font-serif italic">
              <p>No results found for "{query}"</p>
            </div>
          )}
          
          {results.length === 0 && !query.trim() && (
             <div className="text-center py-10 text-secondary text-sm font-sans uppercase tracking-widest">
               Type to search across your library
             </div>
          )}

          {results.map((res, idx) => (
            <div 
              key={idx}
              onClick={() => handleSelect(res)}
              className="p-3 hover:bg-surface rounded-none cursor-pointer border border-transparent hover:border-border transition-all flex items-start gap-3"
            >
              <div className={`mt-1 p-2 rounded-none ${res.type === 'document' ? 'bg-background border border-border text-text-primary' : 'bg-background border border-border text-primary'}`}>
                <Icon name={res.type === 'document' ? 'file-text' : res.type === 'set' ? 'folder' : 'list'} size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                {res.type === 'document' && (
                  <>
                    <div className="font-serif font-medium text-text-primary tracking-tight">{res.item.title}</div>
                    <div className="font-sans text-[10px] uppercase tracking-wider text-secondary mt-1">Document • {res.item.mcqs.length} MCQs</div>
                  </>
                )}
                {res.type === 'set' && (
                  <>
                    <div className="font-serif font-medium text-text-primary tracking-tight">{res.item.name}</div>
                    <div className="font-sans text-[10px] uppercase tracking-wider text-secondary mt-1">MCQ Set • {res.item.mcqs.length} Questions</div>
                  </>
                )}
                {res.type === 'mcq' && (
                  <>
                    <div className="font-serif font-medium text-text-primary line-clamp-1 tracking-tight">{res.item.question}</div>
                    <div className="font-sans text-[10px] uppercase tracking-wider text-secondary mt-1">In Set: {res.set.name}</div>
                  </>
                )}
              </div>
              <Icon name="chevron-right" size="sm" className="text-secondary mt-2" />
            </div>
          ))}
        </div>
      </div>
    </PremiumModal>
  );
};

export default GlobalSearchModal;
