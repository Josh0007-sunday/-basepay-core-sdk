"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQR = generateQR;
const qrcode_1 = __importDefault(require("qrcode"));
async function generateQR(content) {
    return qrcode_1.default.toString(content, {
        type: 'svg',
        margin: 2,
        width: 200,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    });
}
