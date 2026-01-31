import { create } from 'zustand';

export type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
export type MediaType = 'TXT' | 'IMG' | 'VIDEO';

export interface Content {
    ID: string;
    Text?: string;
    Image?: string;
    Video?: string;
    TextStatus: Status;
    ImageStatus: Status;
    VideoStatus: Status;
    FinalStatus: Status;
    CreatedAt: string;
    UpdatedAt: string;
    ModerationResult?: unknown;
    ModerationEvents?: unknown;
    Audit?: unknown;
}

interface ContentState {
    contents: Content[];
    addContent: (content: Omit<Content, 'ID' | 'CreatedAt' | 'UpdatedAt' | 'TextStatus' | 'ImageStatus' | 'VideoStatus' | 'FinalStatus'>) => void;
    updateStatus: (id: string, status: Status) => void;
    setContents: (contents: Content[]) => void;
}

export const useContentStore = create<ContentState>((set) => ({
    contents: [],
    addContent: (newContent) => set((state) => ({
        contents: [
            {
                ...newContent,
                ID: Math.random().toString(36).substring(7),
                TextStatus: 'PENDING',
                ImageStatus: 'PENDING',
                VideoStatus: 'PENDING',
                FinalStatus: 'PENDING',
                CreatedAt: new Date().toISOString(),
                UpdatedAt: new Date().toISOString(),
            },
            ...state.contents,
        ],
    })),
    updateStatus: (id, status) => set((state) => ({
        contents: state.contents.map((c) =>
            c.ID === id ? { ...c, FinalStatus: status, UpdatedAt: new Date().toISOString() } : c
        ),
    })),
    setContents: (contents) => set({ contents }),
}));

