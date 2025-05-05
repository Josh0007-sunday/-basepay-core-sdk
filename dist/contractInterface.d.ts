import { BaseContract, ContractTransactionResponse } from "ethers";
export interface InvoiceTrackerContract extends BaseContract {
    createInvoice(_invoiceHash: string, _merchant: string, _token: string, _amount: bigint, _validForSeconds: number, _memo: string): Promise<ContractTransactionResponse>;
    payInvoice(_invoiceHash: string, overrides?: {
        value?: bigint;
    }): Promise<ContractTransactionResponse>;
    invoices(invoiceHash: string): Promise<{
        merchant: string;
        token: string;
        amount: bigint;
        dueBy: bigint;
        isPaid: boolean;
        memo: string;
    }>;
}
