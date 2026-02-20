// Client detail page — displays client information and notes for advisors.
"use client";

import { ActionIcon, Alert, Badge, Button, Card, CopyButton, Group, Skeleton, Stack, Text, Textarea, Title, Tooltip } from "@mantine/core";
import { IconAlertCircle, IconArrowLeft, IconAt, IconCalendar, IconCheck, IconClock, IconCopy, IconMail, IconNote, IconPhone, IconPointFilled, IconReload, IconSend, IconTimeline, IconUsers } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useApi } from "@/api/context";
import { Client, ClientNote } from "@/types/clients";
import { formatAbsoluteTimestamp, formatDate, formatTimestamp, getDaysSince } from "@/utils/time";

import styles from "./page.module.scss";

const AVATAR_COLORS = [
    "var(--mantine-color-blue-6)",
    "var(--mantine-color-teal-6)",
    "var(--mantine-color-violet-6)",
    "var(--mantine-color-orange-6)",
    "var(--mantine-color-cyan-6)",
    "var(--mantine-color-pink-6)",
    "var(--mantine-color-indigo-6)",
    "var(--mantine-color-grape-6)",
    "var(--mantine-color-lime-7)",
    "var(--mantine-color-red-6)",
];

function hashName(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}

function getAvatarColor(name: string): string {
    return AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];
}

function getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getInitialsFromName(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
}

function getLastContactedClass(value: string | null): string {
    if (!value) return "";
    const days = getDaysSince(value);
    if (days > 90) return styles["last-contacted-danger"];
    if (days > 30) return styles["last-contacted-warning"];
    return styles["last-contacted-recent"];
}

type CategoryType = "note" | "call" | "meeting" | "email" | "follow_up";

const CATEGORY_CONFIG: Record<CategoryType, { label: string; color: string; borderVar: string; icon: React.ReactNode }> = {
    note: { label: "Note", color: "gray", borderVar: "var(--mantine-color-gray-5)", icon: <IconNote size={14} /> },
    call: { label: "Call", color: "green", borderVar: "var(--mantine-color-green-5)", icon: <IconPhone size={14} /> },
    meeting: { label: "Meeting", color: "blue", borderVar: "var(--mantine-color-blue-5)", icon: <IconUsers size={14} /> },
    email: { label: "Email", color: "violet", borderVar: "var(--mantine-color-violet-5)", icon: <IconAt size={14} /> },
    follow_up: { label: "Follow-up", color: "orange", borderVar: "var(--mantine-color-orange-5)", icon: <IconReload size={14} /> },
};

const CATEGORY_ORDER: CategoryType[] = ["note", "call", "meeting", "email", "follow_up"];

const FILTER_OPTIONS: { value: CategoryType | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "call", label: "Call" },
    { value: "meeting", label: "Meeting" },
    { value: "email", label: "Email" },
    { value: "follow_up", label: "Follow-up" },
    { value: "note", label: "Note" },
];

function getCategoryConfig(category: string) {
    return CATEGORY_CONFIG[category as CategoryType] ?? CATEGORY_CONFIG.note;
}

function NoteCard({ note }: { note: ClientNote }) {
    const config = getCategoryConfig(note.category);
    const creatorInitials = getInitialsFromName(note.creator_name);
    const creatorColor = getAvatarColor(note.creator_name);

    return (
        <div
            className={styles["note-card"]}
            style={{ borderLeftColor: config.borderVar }}
        >
            <div className={styles["note-card-header"]}>
                <div
                    className={styles["note-avatar"]}
                    style={{ backgroundColor: creatorColor }}
                >
                    <Text className={styles["note-avatar-text"]}>{creatorInitials}</Text>
                </div>
                <div className={styles["note-meta"]}>
                    <Group gap="xs" align="center">
                        <Text size="sm" fw={500}>{note.creator_name}</Text>
                        <Text size="xs" c="dimmed">·</Text>
                        <Tooltip label={formatAbsoluteTimestamp(note.created_at)} withArrow>
                            <Text size="xs" c="dimmed" className={styles["note-timestamp"]}>
                                {formatTimestamp(note.created_at)}
                            </Text>
                        </Tooltip>
                    </Group>
                    <Badge variant="light" color={config.color} size="xs" mt={4}>
                        {config.label}
                    </Badge>
                </div>
            </div>
            <Text size="sm" className={styles["note-content"]}>{note.content}</Text>
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div className={styles.container}>
            <Skeleton height={30} width={140} radius="sm" mb="sm" />

            <Card withBorder radius="md" className={styles.card}>
                <div className={styles["card-header"]}>
                    <Skeleton height={72} width={72} circle />
                    <div className={styles["header-info"]}>
                        <Skeleton height={28} width={200} radius="sm" />
                        <Skeleton height={16} width={180} radius="sm" />
                    </div>
                </div>
                <div className={styles.divider} />
                <Stack gap="md">
                    <Skeleton height={16} width="60%" radius="sm" />
                    <Skeleton height={16} width="50%" radius="sm" />
                    <Skeleton height={16} width="40%" radius="sm" />
                </Stack>
            </Card>

            <Skeleton height={24} width={120} radius="sm" mb="sm" />
            <Skeleton height={100} radius="md" mb="md" />
            <Stack gap="sm">
                <Skeleton height={80} radius="md" />
                <Skeleton height={80} radius="md" />
                <Skeleton height={80} radius="md" />
            </Stack>
        </div>
    );
}

export default function ClientDetailPage({ id }: { id: string }) {
    const api = useApi();
    const router = useRouter();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notes, setNotes] = useState<ClientNote[]>([]);
    const [notesError, setNotesError] = useState<string | null>(null);
    const [noteContent, setNoteContent] = useState("");
    const [noteCategory, setNoteCategory] = useState<CategoryType>("note");
    const [submitting, setSubmitting] = useState(false);
    const [activeFilter, setActiveFilter] = useState<CategoryType | "all">("all");

    useEffect(() => {
        api.clients.getClient(id)
            .then(setClient)
            .catch(() => setError("Failed to load client. The client may not exist or the server may be unavailable."))
            .finally(() => setLoading(false));
        api.clients.listNotes(id)
            .then(setNotes)
            .catch(() => setNotesError("Failed to load activity. Please try refreshing the page."));
    }, [api, id]);

    useEffect(() => {
        if (client) {
            document.title = `${client.first_name} ${client.last_name} | Hi Interview`;
        }
    }, [client]);

    const filteredNotes = useMemo(() => {
        if (activeFilter === "all") return notes;
        return notes.filter(note => note.category === activeFilter);
    }, [notes, activeFilter]);

    const handleAddNote = async () => {
        if (!noteContent.trim()) return;
        setSubmitting(true);
        try {
            const created = await api.clients.createNote(id, {
                content: noteContent.trim(),
                category: noteCategory,
            });
            setNoteContent("");
            setNoteCategory("note");
            setNotes(prev => [created, ...prev]);
            setNotesError(null);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <DetailSkeleton />;
    }

    if (error || !client) {
        return (
            <div className={styles.container}>
                <Button
                    variant="subtle"
                    leftSection={<IconArrowLeft size={16} />}
                    onClick={() => router.push("/clients")}
                    mb="md"
                >
                    Back to Clients
                </Button>
                <Alert
                    icon={<IconAlertCircle size={16} />}
                    title="Client not found"
                    color="red"
                    variant="light"
                >
                    {error || "This client does not exist or may have been removed."}
                </Alert>
            </div>
        );
    }

    const clientAvatarColor = getAvatarColor(`${client.first_name}${client.last_name}`);
    const clientInitials = getInitials(client.first_name, client.last_name);

    return (
        <div className={styles.container}>
            <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => router.push("/clients")}
                className={styles.back}
            >
                Back to Clients
            </Button>

            <Card withBorder radius="md" className={styles.card}>
                <div className={styles["card-header"]}>
                    <div
                        className={styles.avatar}
                        style={{ backgroundColor: clientAvatarColor }}
                    >
                        <Text className={styles["avatar-text"]}>{clientInitials}</Text>
                    </div>
                    <div className={styles["header-info"]}>
                        <Title order={2}>{client.first_name} {client.last_name}</Title>
                        <Group gap="xs" className={styles["email-row"]}>
                            <IconMail size={14} color="var(--mantine-color-dimmed)" />
                            <Text size="sm" c="dimmed">{client.email}</Text>
                            <CopyButton value={client.email} timeout={2000}>
                                {({ copied, copy }) => (
                                    <Tooltip label={copied ? "Copied" : "Copy email"} withArrow>
                                        <ActionIcon
                                            variant="subtle"
                                            color={copied ? "teal" : "gray"}
                                            size="xs"
                                            onClick={copy}
                                        >
                                            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                            </CopyButton>
                        </Group>
                    </div>
                </div>

                <div className={styles.divider} />

                <Stack gap="md" className={styles["info-rows"]}>
                    <Group gap="sm">
                        <IconCalendar size={16} color="var(--mantine-color-dimmed)" />
                        <Text size="sm" c="dimmed" className={styles["info-label"]}>Member since</Text>
                        <Text size="sm" fw={500}>{formatDate(client.created_at)}</Text>
                    </Group>
                    <Group gap="sm">
                        <IconClock size={16} color="var(--mantine-color-dimmed)" />
                        <Text size="sm" c="dimmed" className={styles["info-label"]}>Last contacted</Text>
                        {client.last_contacted_at ? (
                            <Tooltip label={formatAbsoluteTimestamp(client.last_contacted_at)} withArrow>
                                <Text size="sm" fw={500} className={getLastContactedClass(client.last_contacted_at)}>
                                    {formatTimestamp(client.last_contacted_at)}
                                </Text>
                            </Tooltip>
                        ) : (
                            <Text size="sm" c="dimmed">Never</Text>
                        )}
                    </Group>
                    <Group gap="sm">
                        <IconPointFilled size={16} color="var(--mantine-color-green-6)" />
                        <Text size="sm" c="dimmed" className={styles["info-label"]}>Status</Text>
                        <Badge variant="light" color="green" size="sm">Active</Badge>
                    </Group>
                </Stack>
            </Card>

            <Group gap="xs" className={styles["activity-header"]}>
                <IconTimeline size={20} />
                <Title order={3}>Activity</Title>
                <Badge variant="light" color="gray" size="sm" circle>
                    {notes.length}
                </Badge>
            </Group>

            <Group gap="xs" className={styles["filter-chips"]}>
                {FILTER_OPTIONS.map(option => (
                    <Button
                        key={option.value}
                        size="compact-xs"
                        variant={activeFilter === option.value ? "filled" : "light"}
                        color={activeFilter === option.value ? "violet" : "gray"}
                        onClick={() => setActiveFilter(option.value)}
                        radius="xl"
                    >
                        {option.label}
                    </Button>
                ))}
            </Group>

            <div className={styles.composer}>
                <Group gap="xs" className={styles["composer-categories"]}>
                    {CATEGORY_ORDER.map(cat => {
                        const config = CATEGORY_CONFIG[cat];
                        const isActive = noteCategory === cat;
                        return (
                            <Button
                                key={cat}
                                size="compact-xs"
                                variant={isActive ? "light" : "subtle"}
                                color={isActive ? config.color : "gray"}
                                leftSection={config.icon}
                                onClick={() => setNoteCategory(cat)}
                                className={
                                    styles["composer-category-btn"] +
                                    (isActive ? " " + styles["composer-category-active"] : "")
                                }
                            >
                                {config.label}
                            </Button>
                        );
                    })}
                </Group>
                <Textarea
                    placeholder="Log a note, call summary, or follow-up..."
                    value={noteContent}
                    onChange={e => setNoteContent(e.currentTarget.value)}
                    minRows={3}
                    autosize
                    className={styles["composer-textarea"]}
                />
                <Group justify="flex-end" mt="sm">
                    <Button
                        onClick={handleAddNote}
                        loading={submitting}
                        disabled={!noteContent.trim()}
                        leftSection={<IconSend size={14} />}
                        size="sm"
                    >
                        Save
                    </Button>
                </Group>
            </div>

            {notesError ? (
                <Alert
                    icon={<IconAlertCircle size={16} />}
                    title="Could not load activity"
                    color="red"
                    variant="light"
                >
                    {notesError}
                </Alert>
            ) : notes.length === 0 ? (
                <div className={styles["empty-state"]}>
                    <IconNote size={40} color="var(--mantine-color-gray-4)" />
                    <Text c="dimmed" size="sm" mt="sm">No activity yet</Text>
                    <Text c="dimmed" size="xs">Notes and interactions will appear here.</Text>
                </div>
            ) : (
                <Stack gap="sm">
                    {filteredNotes.length === 0 ? (
                        <Text c="dimmed" size="sm" ta="center" py="lg">
                            No {FILTER_OPTIONS.find(o => o.value === activeFilter)?.label.toLowerCase()} entries found.
                        </Text>
                    ) : (
                        filteredNotes.map(note => (
                            <NoteCard key={note.id} note={note} />
                        ))
                    )}
                </Stack>
            )}
        </div>
    );
}
