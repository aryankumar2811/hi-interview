// Clients list page with create client modal.
"use client";

import { Alert, Button, CloseButton, Group, Modal, Skeleton, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconAlertCircle, IconChevronDown, IconChevronUp, IconDownload, IconPlus, IconSearch, IconSelector } from "@tabler/icons-react";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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

type SortField = "name" | "email" | "last_contacted";
type SortDirection = "asc" | "desc";

interface SortState {
    field: SortField;
    direction: SortDirection;
}

function SortIcon({ field, sort }: { field: SortField; sort: SortState }) {
    if (sort.field !== field) return <IconSelector size={14} color="var(--mantine-color-dimmed)" />;
    return sort.direction === "asc"
        ? <IconChevronUp size={14} />
        : <IconChevronDown size={14} />;
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
    const [sort, setSort] = useState<SortState>({ field: "name", direction: "asc" });

    const toggleSort = useCallback((field: SortField) => {
        setSort(prev =>
            prev.field === field
                ? { field, direction: prev.direction === "asc" ? "desc" : "asc" }
                : { field, direction: "asc" }
        );
    }, []);

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
        const filtered = query
            ? clients.filter(client => {
                const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
                const record = client as unknown as Record<string, unknown>;
                const university = typeof record.university === "string" ? record.university.toLowerCase() : "";
                const program = typeof record.program === "string" ? record.program.toLowerCase() : "";
                return fullName.includes(query) || client.email.toLowerCase().includes(query)
                    || university.includes(query) || program.includes(query);
            })
            : [...clients];

        filtered.sort((a, b) => {
            const dir = sort.direction === "asc" ? 1 : -1;
            switch (sort.field) {
                case "name": {
                    const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
                    const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
                    return dir * nameA.localeCompare(nameB);
                }
                case "email":
                    return dir * a.email.toLowerCase().localeCompare(b.email.toLowerCase());
                case "last_contacted": {
                    const timeA = a.last_contacted_at ? new Date(a.last_contacted_at).getTime() : 0;
                    const timeB = b.last_contacted_at ? new Date(b.last_contacted_at).getTime() : 0;
                    return dir * (timeA - timeB);
                }
                default:
                    return 0;
            }
        });

        return filtered;
    }, [clients, search, sort]);

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

    const handleExportCsv = useCallback(() => {
        const escapeCsv = (val: string) => {
            if (val.includes(",") || val.includes('"') || val.includes("\n")) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        };

        const header = "Name,Email,Assigned,Last Contacted,Status";
        const rows = filteredClients.map(client => {
            const name = escapeCsv(`${client.first_name} ${client.last_name}`);
            const email = escapeCsv(client.email);
            const assigned = client.assigned_user_id ? "Yes" : "No";
            const lastContacted = client.last_contacted_at ? formatTimestamp(client.last_contacted_at) : "Never";
            const status = "Active";
            return `${name},${email},${assigned},${lastContacted},${status}`;
        });

        const csv = [header, ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const date = new Date().toISOString().slice(0, 10);
        const link = document.createElement("a");
        link.href = url;
        link.download = `clients-${date}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }, [filteredClients]);

    return (
        <div className={styles.container}>
            <Group justify="space-between" className={styles.title}>
                <Title order={2}>Clients</Title>
                <Group gap="sm">
                    <Button
                        variant="light"
                        leftSection={<IconDownload size={16} />}
                        onClick={handleExportCsv}
                        disabled={loading || filteredClients.length === 0}
                    >
                        Export
                    </Button>
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={open}
                    >
                        New Client
                    </Button>
                </Group>
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
                    <Group justify="space-between" align="flex-end" className={styles.search}>
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
                            style={{ flex: 1 }}
                        />
                        <Text size="sm" c="dimmed" className={styles["client-count"]}>
                            {search && filteredClients.length !== clients.length
                                ? `${filteredClients.length} of ${clients.length} clients`
                                : `${clients.length} ${clients.length === 1 ? "client" : "clients"}`}
                        </Text>
                    </Group>
                    <Table
                        striped
                        highlightOnHover
                        withTableBorder
                        withColumnBorders
                    >
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th className={styles["sort-header"]} onClick={() => toggleSort("name")}>
                                    <Group gap={4} wrap="nowrap">Name <SortIcon field="name" sort={sort} /></Group>
                                </Table.Th>
                                <Table.Th className={styles["sort-header"]} onClick={() => toggleSort("email")}>
                                    <Group gap={4} wrap="nowrap">Email <SortIcon field="email" sort={sort} /></Group>
                                </Table.Th>
                                <Table.Th>Assigned</Table.Th>
                                <Table.Th className={styles["sort-header"]} onClick={() => toggleSort("last_contacted")}>
                                    <Group gap={4} wrap="nowrap">Last Contacted <SortIcon field="last_contacted" sort={sort} /></Group>
                                </Table.Th>
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
