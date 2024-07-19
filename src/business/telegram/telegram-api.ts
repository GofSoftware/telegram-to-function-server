import * as https from 'https';
import { InlineKeyboardMarkup, ReplyKeyboardMarkup, Update } from 'node-telegram-bot-api';

export interface ITelegramResponse {
    ok: boolean;
    description?: string;
    result?: Update[];
    error_code?: number;
}

export class TelegramApiError {
    public static fromTelegramResponse(response: ITelegramResponse): TelegramApiError {
        return new TelegramApiError(response.description, response.error_code);
    }

    constructor(public description: string, public error_code: number | undefined) {
    }
}

export class TelegramApi {
    public constructor(private token: string) {
    }

    public async sendMessage(message: string, chatId: number): Promise<void> {
        const url = this.methodUrl('sendMessage') + `?chat_id=${chatId}&parse_mode=HTML&text=${encodeURIComponent(message)}`;
        const ret = await this.makeHttpsRequest(url);
        if (ret.ok !== true) {
            this.handleError(ret);
        }
    }

    public async sendKeyboard(message: string, chatId: number): Promise<void> {
        const replyKeyboardMarkup: ReplyKeyboardMarkup = {keyboard: [[{text: 'Да'}, {text: 'Нет'}]], one_time_keyboard: true};
        const url = this.methodUrl('sendMessage') + `?chat_id=${chatId}&parse_mode=HTML&text=${encodeURIComponent(message)}` +
                                 `&reply_markup=${encodeURIComponent(JSON.stringify(replyKeyboardMarkup))}`;
        const ret = await this.makeHttpsRequest(url);
        if (ret.ok !== true) {
            this.handleError(ret);
        }
    }

    public async sendInlineKeyboard(message: string, chatId: number): Promise<void> {
        const inlineKeyboardMarkup: InlineKeyboardMarkup = {inline_keyboard: [[{text: 'Да', callback_data: 'yes'}, {text: 'Нет', callback_data: 'no'}]]};
        const url = this.methodUrl('sendMessage') + `?chat_id=${chatId}&parse_mode=HTML&text=${encodeURIComponent(message)}` +
            `&reply_markup=${encodeURIComponent(JSON.stringify(inlineKeyboardMarkup))}`;
        const ret = await this.makeHttpsRequest(url);
        if (ret.ok !== true) {
            this.handleError(ret);
        }
    }

    public async sendDice(chatId: number): Promise<number> {
        const url = this.methodUrl('sendDice') + `?chat_id=${chatId}`;
        const ret = await this.makeHttpsRequest(url);
        if (ret.ok !== true) {
            this.handleError(ret);
            return -1;
        }
        console.log(`Sent dice: ${ret.result.dice.value}`);
        return ret.result.dice.value;
    }

    public async sendPhoto(chatId: number): Promise<void> {
        const url = this.methodUrl('sendPhoto') + `?chat_id=${chatId}&photo=${encodeURIComponent('https://vistage.kharkov.ua/img/catalog/38_b.jpg')}`;
        const ret = await this.makeHttpsRequest(url);
        if (ret.ok !== true) {
            this.handleError(ret);
        }
    }

    public async getUpdates(offset: number): Promise<Update[]> {
        const url = this.methodUrl('getUpdates') + ((offset != null) ? '?offset=' + offset : '');
        const updateData: ITelegramResponse = await this.makeHttpsRequest(url);
        if (updateData.ok !== true) {
            this.handleError(updateData);
        }
        // console.log(offset, JSON.stringify(updateData, null, 4));
        return updateData.result;
    }

    public async answerCallbackQuery(callbackQueryId: string, message: string): Promise<void> {
        const url = this.methodUrl('answerCallbackQuery') + `?callback_query_id=${callbackQueryId}&text=${encodeURIComponent(message)}`;
        const ret = await this.makeHttpsRequest(url);
        if (ret.ok !== true) {
            this.handleError(ret);
        }
    }

    public async setWebhook(hookUrl: string): Promise<void> {
        const url1 = this.methodUrl('getWebhookInfo');
        console.log(url1);
        const ret1 = await this.makeHttpsRequest(url1);
        console.log(ret1);
        const url = this.methodUrl('setWebhook') + `?url=${hookUrl}`;
        console.log(url);
        const ret = await this.makeHttpsRequest(url);
        if (ret.ok !== true) {
            this.handleError(ret);
        }
        const url2 = this.methodUrl('getWebhookInfo');
        console.log(url2);
        const ret2 = await this.makeHttpsRequest(url2);
        console.log(ret2);
    }

    private makeHttpsRequest(url: string): Promise<any> {
        return new Promise(((resolve, reject) => {
            https.get(url, (resp: any) => {
                resp.setEncoding('utf8');
                let data = '';

                // A chunk of data has been received.
                resp.on('data', (chunk: string) => {
                    data += chunk;
                });

                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    resolve(JSON.parse(data));
                });

            }).on('error', (error: any) => {
                reject(error);
            });
        }));
    }

    private handleError(response: ITelegramResponse): void {
        console.log(`Got error from Telegram: [${response.error_code}] ${response.description}`);
        throw TelegramApiError.fromTelegramResponse(response);
    }

    private get baseUrl(): string {
        return `https://api.telegram.org/bot${this.token}/`;
    }

    private methodUrl(methodName: string): string {
        return this.baseUrl + methodName;
    }
}
