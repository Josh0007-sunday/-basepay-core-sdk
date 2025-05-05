import { Signer } from "ethers";
export interface InvoiceParams {
    token: "ETH" | "USDC";
    amount: string;
    expiresIn?: number;
    memo?: string;
    merchant?: string;
}
export interface POSParams {
    token: "ETH" | "USDC";
    amount: string;
    memo?: string;
}
export declare class BasePay {
    private readonly provider;
    private readonly contractAddress;
    private readonly network;
    constructor(network?: "base" | "base-sepolia", contractAddress?: string);
    createInvoice(params: InvoiceParams, signer: Signer): Promise<{
        invoiceHash: string;
        qrCode: string;
        paymentUrl: string;
        txHash: string;
    }>;
    onPayment(invoiceHash: string, callback: (payer: string, memo: string) => void, pollInterval?: number): Promise<() => void>;
    private generateInvoiceHash;
    private parseAmount;
    private buildPOSUri;
    private buildInvoiceUri;
}
