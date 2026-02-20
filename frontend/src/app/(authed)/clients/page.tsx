// Clients list page with create client modal.
"use client";

import { Alert, Button, CloseButton, Group, Modal, Skeleton, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconAlertCircle, IconPlus, IconSearch } from "@tabler/icons-react";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useApi } from "@/api/context";
import { ApiError } from "@/types";
import { Client } from "@/types/clients";
import { formatTimestamp, getDaysSince } from "@/utils/time";

import styles from "./page.module.scss";

function LastContactedCell({ value }: { value: string | null }) {
    if (!value) {
        return <Text size="sm" c="dimmed">Never</Text>;
    }

    const days = getDaysSince(value);
    let className = "";
    if (days > 90) {
        className = styles["last-contacted-danger"];
    } else if (days > 30) {
        className = styles["last-contacted-warning"];
    }

    return (
        <Text size="sm" className={className}>
            {formatTimestamp(value)}
        </Text>
    );
}

const SKELETON_ROWS = 5;
const COLUMNS = 4;

function TableSkeleton() {
    return (
        <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Assigned</Table.Th>
                    <Table.Th>Last Contacted</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
                    <Table.Tr key={rowIndex}>
                        {Array.from({ length: COLUMNS }).map((_, colIndex) => (
                            <Table.Td key={colIndex}>
                                <Skeleton height={14} radius="sm" />
                            </Table.Td>
                        ))}
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
}

export default function ClientsPage() {
    const api = useApi();
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [opened, { open, close }] = useDisclosure(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const fetchClients = () => {
        setLoadError(null);
        api.clients.listClients()
            .then(setClients)
            .catch(() => setLoadError("Failed to load clients. Please try refreshing the page."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchClients();
    }, [api]);

    const filteredClients = useMemo(() => {
        const query = search.toLowerCase().trim();
        if (!query) return clients;
        return clients.filter(client => {
            const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
            return fullName.includes(query) || client.email.toLowerCase().includes(query);
        });
    }, [clients, search]);

    const handleCreate = async () => {
        setError("");
        setSubmitting(true);
        try {
            await api.clients.createClient({
                first_name: firstName,
                last_name: lastName,
                email,
            });
            close();
            setFirstName("");
            setLastName("");
            setEmail("");
            fetchClients();
        } catch (e) {
            const err = e as AxiosError<ApiError>;
            setError(err.response?.data?.detail || "Failed to create client");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <Group justify="space-between" className={styles.title}>
                <Title order={2}>Clients</Title>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={open}
                >
                    New Client
                </Button>
            </Group>

            {loading ? (
                <TableSkeleton />
            ) : loadError ? (
                <Alert
                    icon={<IconAlertCircle size={16} />}
                    title="Could not load clients"
                    color="red"
                    variant="light"
                >
                    {loadError}
                </Alert>
            ) : clients.length === 0 ? (
                <div className={styles.empty}>
                    <Text c="dimmed" size="lg">No clients yet</Text>
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={open}
                        mt="md"
                    >
                        New Client
                    </Button>
                </div>
            ) : (
                <>
                    <TextInput
                        placeholder="Search by name or email..."
                        leftSection={<IconSearch size={16} />}
                        rightSection={
                            search ? (
                                <CloseButton
                                    size="sm"
                                    onClick={() => setSearch("")}
                                />
                            ) : null
                        }
                        value={search}
                        onChange={e => setSearch(e.currentTarget.value)}
                        className={styles.search}
                    />
                    <Table
                        striped
                        highlightOnHover
                        withTableBorder
                        withColumnBorders
                    >
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Name</Table.Th>
                                <Table.Th>Email</Table.Th>
                                <Table.Th>Assigned</Table.Th>
                                <Table.Th>Last Contacted</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredClients.map(client => (
                                <Table.Tr
                                    key={client.id}
                                    onClick={() => router.push(`/clients/${client.id}`)}
                                    className={styles["table-row"]}
                                >
                                    <Table.Td>{client.first_name} {client.last_name}</Table.Td>
                                    <Table.Td>{client.email}</Table.Td>
                                    <Table.Td>{client.assigned_user_id ? "Yes" : "No"}</Table.Td>
                                    <Table.Td>
                                        <LastContactedCell value={client.last_contacted_at} />
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </>
            )}

            <Modal opened={opened} onClose={close} title="New Client">
                <Stack>
                    <TextInput
                        label="First Name"
                        required
                        value={firstName}
                        onChange={e => setFirstName(e.currentTarget.value)}
                    />
                    <TextInput
                        label="Last Name"
                        required
                        value={lastName}
                        onChange={e => setLastName(e.currentTarget.value)}
                    />
                    <TextInput
                        label="Email"
                        required
                        value={email}
                        onChange={e => setEmail(e.currentTarget.value)}
                    />
                    {error && (
                        <Alert
                            icon={<IconAlertCircle size={16} />}
                            color="red"
                            variant="light"
                        >
                            {error}
                        </Alert>
                    )}
                    <Button
                        onClick={handleCreate}
                        loading={submitting}
                        disabled={!firstName || !lastName || !email}
                    >
                        Create
                    </Button>
                </Stack>
            </Modal>
        </div>
    );
}
