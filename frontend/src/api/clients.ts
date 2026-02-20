import { AxiosInstance } from "axios";

import { Client, ClientNote, CreateClientNoteRequest, CreateClientRequest } from "@/types/clients";

export default class ClientsApi {
    private axiosInstance: AxiosInstance;

    constructor(axiosInstance: AxiosInstance) {
        this.axiosInstance = axiosInstance;
    }

    public listClients = async (): Promise<Client[]> => {
        const response = await this.axiosInstance.get<{ data: Client[] }>("client");
        return response.data.data;
    };

    public getClient = async (clientId: string): Promise<Client> => {
        const response = await this.axiosInstance.get<Client>(`client/${clientId}`);
        return response.data;
    };

    public createClient = async (data: CreateClientRequest): Promise<Client> => {
        const response = await this.axiosInstance.post<Client>("client", data);
        return response.data;
    };

    public listNotes = async (clientId: string): Promise<ClientNote[]> => {
        const response = await this.axiosInstance.get<{ data: ClientNote[] }>(`client/${clientId}/note`);
        return response.data.data;
    };

    public createNote = async (clientId: string, data: CreateClientNoteRequest): Promise<ClientNote> => {
        const response = await this.axiosInstance.post<ClientNote>(`client/${clientId}/note`, data);
        return response.data;
    };
}
