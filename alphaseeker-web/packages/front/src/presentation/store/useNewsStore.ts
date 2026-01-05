import { create } from 'zustand';
import { NewsFilters } from '@alphaseeker/shared';

interface NewsState {
    filters: NewsFilters;
    appliedFilters: NewsFilters;
    setFilters: (filters: Partial<NewsFilters>) => void;
    applyFilters: () => void;
    addHashtag: (tag: string) => void;
    removeHashtag: (tag: string) => void;
    resetFilters: () => void;
}

const INITIAL_FILTERS: NewsFilters = {
    title: '',
    category: 'ALL',
    asset_class: 'ALL',
    sentiment: 'ALL',
    risk_level: 'ALL',
    action: 'ALL',
    tags: []
};

export const useNewsStore = create<NewsState>((set, get) => ({
    filters: { ...INITIAL_FILTERS },
    appliedFilters: { ...INITIAL_FILTERS },

    setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
    })),

    applyFilters: () => set((state) => ({
        appliedFilters: { ...state.filters }
    })),

    addHashtag: (tag) => {
        const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
        const currentTags = get().filters.tags || [];

        if (!currentTags.includes(cleanTag)) {
            set((state) => ({
                filters: {
                    ...state.filters,
                    tags: [...currentTags, cleanTag]
                }
            }));
            // Automatically apply filters when adding a tag from click
            set((state) => ({
                appliedFilters: { ...state.filters }
            }));
        }
    },

    removeHashtag: (tag) => set((state) => ({
        filters: {
            ...state.filters,
            tags: (state.filters.tags || []).filter(t => t !== tag)
        }
    })),

    resetFilters: () => set({
        filters: { ...INITIAL_FILTERS },
        appliedFilters: { ...INITIAL_FILTERS }
    })
}));

