import { MCQ, DocumentSettings, PageSetting } from '../../../types';
import { calculatePages } from './bookUtils';

// Seeded random generator (Mulberry32)
const mulberry32 = (a: number) => {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// String hash for seed
const cyrb53 = (str: string, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

export const getRandomGenerator = (seed?: string) => {
    if (seed && seed.trim()) {
        const seedNum = cyrb53(seed);
        return mulberry32(seedNum);
    }
    return Math.random;
};

export const shuffleArray = <T>(array: T[], rng: () => number): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

export const shuffleOptions = (mcq: MCQ, rng: () => number): MCQ => {
    const options = [
        { key: 'A', val: mcq.optionA },
        { key: 'B', val: mcq.optionB },
        { key: 'C', val: mcq.optionC },
        { key: 'D', val: mcq.optionD }
    ];
    
    // Check which one was correct
    const correctVal = options.find(o => o.key === mcq.answer)?.val;
    
    const shuffled = shuffleArray(options, rng);
    
    // Find new key for the correct value
    const newAnswerIndex = shuffled.findIndex(o => o.val === correctVal);
    const newAnswerKey = ['A', 'B', 'C', 'D'][newAnswerIndex] as 'A' | 'B' | 'C' | 'D';
    
    return {
        ...mcq,
        optionA: shuffled[0].val,
        optionB: shuffled[1].val,
        optionC: shuffled[2].val,
        optionD: shuffled[3].val,
        answer: newAnswerKey
    };
};

export type ShuffleType = 'simple' | 'sections' | 'options' | 'full';

export const performShuffle = (
    mcqs: MCQ[],
    type: ShuffleType,
    seed: string,
    settings?: DocumentSettings,
    pageSettings?: PageSetting[]
): MCQ[] => {
    const rng = getRandomGenerator(seed);

    if (type === 'simple') {
        return shuffleArray(mcqs, rng);
    }

    if (type === 'options') {
        return mcqs.map(m => shuffleOptions(m, rng));
    }

    if (type === 'full') {
        const rowShuffled = shuffleArray(mcqs, rng);
        return rowShuffled.map(m => shuffleOptions(m, rng));
    }

    if (type === 'sections') {
        if (!settings) return shuffleArray(mcqs, rng); // Fallback
        
        // Calculate current layout to identify sections
        const { pages } = calculatePages(mcqs, settings);
        
        // Group by sections
        // We'll iterate pages, check pageSetting for that page.
        // If title exists, start new section. If not, continue previous.
        const sections: { title: string, items: MCQ[] }[] = [];
        let currentSectionIndex = -1;
        let lastTitle = "General";

        // Initial check: if first page has no title, create default section
        sections.push({ title: lastTitle, items: [] });
        currentSectionIndex = 0;

        pages.forEach(page => {
            const pSet = pageSettings?.find(ps => ps.pageNumber === page.pageNumber);
            if (pSet && pSet.title) {
                // New section
                lastTitle = pSet.title;
                sections.push({ title: lastTitle, items: [] });
                currentSectionIndex++;
            }
            // Add items
            const pageMcqs = [...page.column1, ...page.column2];
            sections[currentSectionIndex].items.push(...pageMcqs);
        });

        // Shuffle within sections
        let finalMCQs: MCQ[] = [];
        sections.forEach(sec => {
            const shuffledItems = shuffleArray(sec.items, rng);
            finalMCQs = [...finalMCQs, ...shuffledItems];
        });

        return finalMCQs;
    }

    return mcqs;
};
