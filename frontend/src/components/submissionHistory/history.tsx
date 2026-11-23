import { ChevronDown, ChevronLeft, FileText, Paperclip } from "lucide-react"
import { useState } from "react"
import { useSelector } from "react-redux"
import toast from "react-hot-toast"
import { RootState } from "../../store"
import { formatCalenderDate } from "../../utils/dateFormats"
import { handleDocument } from "../../utils/download"

export type AttachmentValue = string | Record<string, string>;

export interface HistoryAttachmentType {
    [key: string]: AttachmentValue;
}

export interface HistoryMediaType {
    id?: string;
    url?: string;
    [key: string]: unknown;
}

export interface HistoryItemType {
    title?: string;
    type?: string;
    created_at: string;
    status?: string;
    message?: string;
    comments?: string;
    attachments?: HistoryAttachmentType;
    documents_media?: Record<string, HistoryMediaType | null>;
    createdByUser?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        role?: { name?: string; description?: string };
    };
}

interface SubmissionHistoryProps {
    history: HistoryItemType[];
    loading: boolean;
    title?: string;
}

interface HistoryDoc {
    key: string;
    label: string;
    url: string;
}

const formatDocLabel = (key: string): string =>
    key
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());

const collectHistoryDocuments = (item: any): HistoryDoc[] => {
    const docs: HistoryDoc[] = [];
    const seen = new Set<string>();

    const push = (key: string, url: string) => {
        const trimmed = typeof url === "string" ? url.trim() : "";
        if (!trimmed || seen.has(trimmed)) return;
        seen.add(trimmed);
        docs.push({ key, label: formatDocLabel(key), url: trimmed });
    };

    // Backend (history API) attaches workflow documents under `documents_media`
    const documentsMedia = item?.documents_media;
    if (documentsMedia && typeof documentsMedia === "object") {
        for (const [key, value] of Object.entries(documentsMedia as Record<string, any>)) {
            if (value && typeof value === "object" && typeof value.url === "string") {
                push(key, value.url);
            }
        }
    }

    // Backward compatibility: some history items may still expose `attachments`
    const attachments = item?.attachments;
    if (attachments && typeof attachments === "object") {
        for (const [key, value] of Object.entries(attachments as Record<string, any>)) {
            if (typeof value === "string") {
                push(key, value);
            } else if (value && typeof value === "object") {
                for (const [nestedKey, nested] of Object.entries(value as Record<string, unknown>)) {
                    if (typeof nested === "string") {
                        push(`${key}_${nestedKey}`, nested);
                    }
                }
            }
        }
    }

    return docs;
};

const HistoryItem = ({ item, index, historyLength }: any) => {
    const [isOpened, setIsOpened] = useState(index == historyLength)
    const { token } = useSelector((state: RootState) => state.auth)
    const documents = collectHistoryDocuments(item)

    const onViewDocument = async (url: string) => {
        try {
            await handleDocument(url, token || "")
        } catch {
            toast.error("Unable to open document")
        }
    }

    return (
        <div className="border-b-1 rounded divide-y bg-[#f8f8f8] mb-2">
            <div className="px-4 py-3 flex items-center text-sm cursor-pointer" onClick={() => setIsOpened(!isOpened)}>
                {isOpened ? <ChevronDown className="h-4 w-4 text-gray-400 me-2" /> : <ChevronLeft className="h-4 w-4 text-gray-400 me-2" />}
                <span className="text-md me-2">{item?.title || 'Application'}</span>
                <span className="text-sm text-gray-500">
                    {item?.created_at
                        ? formatCalenderDate(item.created_at)
                        : '-'}
                </span>
            </div>

            {isOpened && <div className="px-4 pt-3 py-1 text-sm">
                <div className="text-gray-600 mt-1 mb-3">
                    {item?.createdByUser && (
                        <p className="mb-1 ms-5 ps-1 text-xs font-medium text-gray-500">
                            {`${item.createdByUser.first_name || ''} ${item.createdByUser.last_name || ''}`.trim() ||
                                item.createdByUser.email ||
                                'Officer'}
                            {item.createdByUser.role?.description || item.createdByUser.role?.name
                                ? ` · ${item.createdByUser.role?.description || item.createdByUser.role?.name}`
                                : ''}
                        </p>
                    )}
                    <p className="mb-2 ms-5 ps-1">
                        {item?.comments?.trim() ? item.comments : 'No comment provided'}
                    </p>
                </div>

                {documents.length > 0 && (
                    <div className="ms-5 ps-1 mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
                            <Paperclip className="w-3.5 h-3.5 mr-1" />
                            Attached Documents ({documents.length})
                        </p>
                        <div className="space-y-1">
                            {documents.map((doc, idx) => {
                                const fileName = doc.url.split('/').pop();
                                const decodedName = fileName ? decodeURIComponent(fileName) : doc.label;
                                return (
                                    <button
                                        key={`${doc.key}-${idx}`}
                                        type="button"
                                        onClick={() => void onViewDocument(doc.url)}
                                        className="w-full text-left flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center min-w-0">
                                            <FileText className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {doc.label}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {decodedName}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-blue-600 underline flex-shrink-0">
                                            View
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>}
        </div>
    )
}

export const SubmissionHistory = ({ history, loading, title }: SubmissionHistoryProps) => {

    if (!history || history?.length <= 0) {
        return (
            <h4>No history</h4>
        )
    }

    if (loading) {
        return (
            <h4>Loading...</h4>
        )
    }

    return (
        <div className="mt-5 bg-white p-4 rounded-lg">
            <h3 className="font-semibold mb-3">{title || 'Submission History'} ({history?.length})</h3>
            {history?.map((item: any, index: any) => <HistoryItem key={item?.id ?? index} item={item} index={index + 1} historyLength={1} />)}
        </div>
    )
}
