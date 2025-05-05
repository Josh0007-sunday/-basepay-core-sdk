"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePay = void 0;
const ethers_1 = require("ethers");
const InvoiceTracker_json_1 = __importDefault(require("./abis/InvoiceTracker.json"));
const qr_1 = require("./utils/qr");
const chains_1 = require("./utils/chains");
class BasePay {
    constructor(network = "base-sepolia", contractAddress = "0xB8685deAB3a075EC495A4848321567F4224611c9") {
        this.network = network;
        this.contractAddress = contractAddress;
        this.provider = new ethers_1.JsonRpcProvider((0, chains_1.getRPCUrl)(network));
    }
    async createInvoice(params, signer) {
        const contract = new ethers_1.Contract(this.contractAddress, InvoiceTracker_json_1.default, signer);
        const tokenAddress = (0, chains_1.getTokenAddress)(params.token, this.network);
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
        const tx = await contract.createInvoice(invoiceHash, merchantAddress, // Added merchant parameter
        tokenAddress, amount, params.expiresIn || 0, params.memo || '');
        console.log('Transaction hash:', tx.hash);
        console.log('Waiting for confirmation...');
        const receipt = await tx.wait();
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
            qrCode: await (0, qr_1.generateQR)(this.buildInvoiceUri(invoiceHash, params)),
            paymentUrl: `https://pay.basepay.xyz/${invoiceHash}`,
            txHash: tx.hash
        };
    }
    async onPayment(invoiceHash, callback, pollInterval = 5000) {
        const contract = new ethers_1.Contract(this.contractAddress, InvoiceTracker_json_1.default, this.provider);
        let isListening = true;
        const checkPayments = async () => {
            while (isListening) {
                try {
                    const events = await contract.queryFilter(contract.filters.InvoicePaid(invoiceHash), -1000, 'latest');
                    console.log('Polled events:', events.length);
                    for (const event of events) {
                        if ('args' in event) {
                            const typedEvent = event;
                            const { payer, memo } = typedEvent.args;
                            callback(payer, memo);
                            isListening = false;
                            break;
                        }
                    }
                }
                catch (err) {
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
    generateInvoiceHash() {
        return ethers_1.ethers.id(`${Date.now()}-${Math.random().toString(36).substring(2, 15)}`);
    }
    parseAmount(amount, token) {
        return ethers_1.ethers.parseUnits(amount, token === "USDC" ? 6 : 18);
    }
    buildPOSUri(params) {
        return `basepay://pay?${new URLSearchParams({
            token: params.token,
            amount: params.amount,
            ...(params.memo && { memo: params.memo })
        })}`;
    }
    buildInvoiceUri(invoiceHash, params) {
        return `basepay://invoice/${invoiceHash}?${new URLSearchParams({
            token: params.token,
            amount: params.amount,
            ...(params.memo && { memo: params.memo })
        })}`;
    }
}
exports.BasePay = BasePay;
