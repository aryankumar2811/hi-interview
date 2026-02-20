import type { Metadata } from "next";

import ClientDetailPage from "./ClientDetailPage";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10001";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;

    try {
        const response = await fetch(`${BASE_URL}/client/${id}`, {
            cache: "no-store",
        });

        if (response.ok) {
            const client = await response.json();
            return {
                title: `${client.first_name} ${client.last_name} | Hi Interview`,
            };
        }
    } catch {
        // Fall through to default
    }

    return {
        title: "Client | Hi Interview",
    };
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    return <ClientDetailPage id={id} />;
}
