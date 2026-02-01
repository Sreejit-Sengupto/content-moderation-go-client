import { create } from 'zustand';

export type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
export type MediaType = 'TXT' | 'IMG' | 'VID';
export type EventType = 'CREATED' | 'UPDATED' | 'MODERATED';
export type AuditAction = 'REVIEWED' | 'OVERRIDEN';

export interface ModerationResult {
    id: string;
    contentId: string;
    mediaType: MediaType;
    status: Status;
    riskScore: number;
    explanation: string;
    createdAt: string;
}

export interface ModerationEvent {
    id: string;
    contentId: string;
    eventType: EventType;
    payload: Record<string, unknown>;
    createdAt: string;
}

export interface Audit {
    id: string;
    contentId: string;
    action: AuditAction;
    reason: string;
    createdAt: string;
}

export interface Content {
    id: string;
    text?: string;
    image?: string;
    video?: string;
    textStatus: Status;
    imageStatus: Status;
    videoStatus: Status;
    finalStatus: Status;
    createdAt: string;
    updatedAt: string;
    moderationResult?: ModerationResult[];
    moderationEvents?: ModerationEvent[];
    audits?: Audit[];
}

interface ContentState {
    contents: Content[];
    addContent: (content: Omit<Content, 'id' | 'createdAt' | 'updatedAt' | 'textStatus' | 'imageStatus' | 'videoStatus' | 'finalStatus'>) => void;
    updateStatus: (id: string, status: Status) => void;
    setContents: (contents: Content[]) => void;
}

export const useContentStore = create<ContentState>((set) => ({
    contents: [],
    addContent: (newContent) => set((state) => ({
        contents: [
            {
                ...newContent,
                id: Math.random().toString(36).substring(7),
                textStatus: 'PENDING',
                imageStatus: 'PENDING',
                videoStatus: 'PENDING',
                finalStatus: 'PENDING',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            ...state.contents,
        ],
    })),
    updateStatus: (id, status) => set((state) => ({
        contents: state.contents.map((c) =>
            c.id === id ? { ...c, finalStatus: status, updatedAt: new Date().toISOString() } : c
        ),
    })),
    setContents: (contents) => set({ contents }),
}));

