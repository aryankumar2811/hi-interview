// Clients list page with create client modal.
"use client";

import { Button, Group, Modal, Stack, Table, TextInput, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useApi } from "@/api/context";
import { ApiError } from "@/types";
import { Client } from "@/types/clients";

import styles from "./page.module.scss";

export default function ClientsPage() {
    const api = useApi();
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [opened, { open, close }] = useDisclosure(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const fetchClients = () => {
        api.clients.listClients()
            .then(setClients)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchClients();
    }, [api]);

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

    if (loading) {
        return <div className={styles.container}>Loading...</div>;
    }

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
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {clients.map(client => (
                        <Table.Tr
                            key={client.id}
                            onClick={() => router.push(`/clients/${client.id}`)}
                            style={{ cursor: "pointer" }}
                        >
                            <Table.Td>{client.first_name} {client.last_name}</Table.Td>
                            <Table.Td>{client.email}</Table.Td>
                            <Table.Td>{client.assigned_user_id ? "Yes" : "No"}</Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>

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
                        <div className={styles.error}>{error}</div>
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
