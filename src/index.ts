import { ethers, Contract, JsonRpcProvider, Signer, EventLog, ContractTransactionReceipt } from "ethers";
import { InvoiceTrackerContract } from "./contractInterface";
import InvoiceTrackerABI from "./abis/InvoiceTracker.json";
import { generateQR } from "./utils/qr";
import { getRPCUrl, getTokenAddress } from "./utils/chains";

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

export class BasePay {
  private readonly provider: JsonRpcProvider;
  private readonly contractAddress: string;
  private readonly network: "base" | "base-sepolia";

  constructor(
    network: "base" | "base-sepolia" = "base-sepolia",
    contractAddress: string = "0xB8685deAB3a075EC495A4848321567F4224611c9"
  ) {
    this.network = network;
    this.contractAddress = contractAddress;
    this.provider = new JsonRpcProvider(getRPCUrl(network));
  }

  async createInvoice(
    params: InvoiceParams,
    signer: Signer
  ): Promise<{
    invoiceHash: string;
    qrCode: string;
    paymentUrl: string;
    txHash: string;
  }> {
    const contract = new Contract(
      this.contractAddress,
      InvoiceTrackerABI,
      signer
    ) as unknown as InvoiceTrackerContract;

    const tokenAddress = getTokenAddress(params.token, this.network);
    const amount = this.parseAmount(params.amount, params.token);
    const invoiceHash = this.generateInvoiceHash();
    const merchantAddress = params.merchant || (await signer.getAddress());

    console.log('Calling createInvoice with:', {
      invoiceHash,
      merchant: merchantAddress,
      tokenAddress,
      amount: amount.toString(),
      expiresIn: params.expiresIn || 0,
      memo: params.memo || ''
    });

    const tx = await contract.createInvoice(
      invoiceHash,
      merchantAddress, // Added merchant parameter
      tokenAddress,
      amount,
      params.expiresIn || 0,
      params.memo || ''
    );

    console.log('Transaction hash:', tx.hash);
    console.log('Waiting for confirmation...');
    const receipt: ContractTransactionReceipt | null = await tx.wait();
    if (!receipt) {
      throw new Error('Transaction receipt is null; transaction may have failed.');
    }
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());

    // Query the invoice to verify storage
    const invoice = await contract.invoices(invoiceHash);
    console.log('Stored invoice:', {
      merchant: invoice.merchant,
      token: invoice.token,
      amount: invoice.amount.toString(),
      dueBy: invoice.dueBy.toString(),
      isPaid: invoice.isPaid,
      memo: invoice.memo
    });

    return {
      invoiceHash,
      qrCode: await generateQR(this.buildInvoiceUri(invoiceHash, params)),
      paymentUrl: `https://pay.basepay.xyz/${invoiceHash}`,
      txHash: tx.hash
    };
  }

  async onPayment(
    invoiceHash: string,
    callback: (payer: string, memo: string) => void,
    pollInterval: number = 5000
  ): Promise<() => void> {
    const contract = new Contract(
      this.contractAddress,
      InvoiceTrackerABI,
      this.provider
    ) as unknown as InvoiceTrackerContract;

    let isListening = true;

    const checkPayments = async () => {
      while (isListening) {
        try {
          const events = await contract.queryFilter(
            contract.filters.InvoicePaid(invoiceHash),
            -1000,
            'latest'
          );
          console.log('Polled events:', events.length);
          for (const event of events) {
            if ('args' in event) {
              const typedEvent = event as EventLog;
              const { payer, memo } = typedEvent.args;
              callback(payer, memo);
              isListening = false;
              break;
            }
          }
        } catch (err) {
          console.error('@TODO Polling error:', err);
        }
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    };

    checkPayments();

    return () => {
      isListening = false;
    };
  }

  private generateInvoiceHash(): string {
    return ethers.id(`${Date.now()}-${Math.random().toString(36).substring(2, 15)}`);
  }

  private parseAmount(amount: string, token: "ETH" | "USDC"): bigint {
    return ethers.parseUnits(amount, token === "USDC" ? 6 : 18);
  }

  private buildPOSUri(params: POSParams): string {
    return `basepay://pay?${new URLSearchParams({
      token: params.token,
      amount: params.amount,
      ...(params.memo && { memo: params.memo })
    })}`;
  }

  private buildInvoiceUri(invoiceHash: string, params: InvoiceParams): string {
    return `basepay://invoice/${invoiceHash}?${new URLSearchParams({
      token: params.token,
      amount: params.amount,
      ...(params.memo && { memo: params.memo })
    })}`;
  }
}