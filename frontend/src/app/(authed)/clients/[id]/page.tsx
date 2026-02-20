// Client detail page — displays client information and notes for advisors.
"use client";

import { Badge, Button, Card, Group, Loader, Paper, Stack, Text, Textarea, Title } from "@mantine/core";
import { IconArrowLeft, IconCalendar, IconMail, IconNote, IconUser } from "@tabler/icons-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useApi } from "@/api/context";
import { Client, ClientNote } from "@/types/clients";

import styles from "./page.module.scss";

export default function ClientDetailPage() {
    const { id } = useParams<{ id: string }>();
    const api = useApi();
    const router = useRouter();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState<ClientNote[]>([]);
    const [noteContent, setNoteContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.clients.getClient(id)
            .then(setClient)
            .catch(() => setClient(null))
            .finally(() => setLoading(false));
        api.clients.listNotes(id).then(setNotes);
    }, [api, id]);

    const handleAddNote = async () => {
        if (!noteContent.trim()) return;
        setSubmitting(true);
        try {
            await api.clients.createNote(id, { content: noteContent.trim() });
            setNoteContent("");
            const updated = await api.clients.listNotes(id);
            setNotes(updated);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <Loader />
            </div>
        );
    }

    if (!client) {
        return (
            <div className={styles.container}>
                <Button
                    variant="subtle"
                    leftSection={<IconArrowLeft size={16} />}
                    onClick={() => router.push("/clients")}
                >
                    Back to Clients
                </Button>
                <Text mt="xl" c="dimmed">Client not found.</Text>
            </div>
        );
    }

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

            <div className={styles.header}>
                <Title order={2}>{client.first_name} {client.last_name}</Title>
                <Badge
                    variant="light"
                    color={client.assigned_user_id ? "green" : "gray"}
                    size="lg"
                >
                    {client.assigned_user_id ? "Assigned" : "Unassigned"}
                </Badge>
            </div>

            <Card withBorder radius="md" className={styles.card}>
                <Stack gap="md">
                    <Group gap="sm">
                        <IconMail size={18} color="var(--mantine-color-dimmed)" />
                        <Text size="sm" c="dimmed">Email</Text>
                        <Text size="sm" fw={500}>{client.email}</Text>
                    </Group>
                    <Group gap="sm">
                        <IconUser size={18} color="var(--mantine-color-dimmed)" />
                        <Text size="sm" c="dimmed">Status</Text>
                        <Text size="sm" fw={500}>
                            {client.assigned_user_id ? "Assigned to advisor" : "No advisor assigned"}
                        </Text>
                    </Group>
                    <Group gap="sm">
                        <IconCalendar size={18} color="var(--mantine-color-dimmed)" />
                        <Text size="sm" c="dimmed">Client since</Text>
                        <Text size="sm" fw={500}>
                            {new Date(client.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </Text>
                    </Group>
                </Stack>
            </Card>

            <Title order={3} className={styles["notes-title"]}>
                <Group gap="xs">
                    <IconNote size={20} />
                    Notes
                </Group>
            </Title>

            <div className={styles["note-input"]}>
                <Textarea
                    placeholder="Add a note..."
                    value={noteContent}
                    onChange={e => setNoteContent(e.currentTarget.value)}
                    minRows={3}
                    autosize
                />
                <Button
                    onClick={handleAddNote}
                    loading={submitting}
                    disabled={!noteContent.trim()}
                    mt="sm"
                >
                    Add Note
                </Button>
            </div>

            <Stack gap="sm" mt="md">
                {notes.length === 0 && (
                    <Text c="dimmed" size="sm">No notes yet.</Text>
                )}
                {notes.map(note => (
                    <Paper key={note.id} withBorder p="md" radius="md">
                        <Text size="sm">{note.content}</Text>
                        <Text size="xs" c="dimmed" mt="xs">
                            {new Date(note.created_at).toLocaleString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                            })}
                        </Text>
                    </Paper>
                ))}
            </Stack>
        </div>
    );
}
