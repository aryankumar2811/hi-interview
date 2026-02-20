import { AxiosInstance } from "axios";

import { Client, CreateClientRequest } from "@/types/clients";

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
}
