import { TelegramApi } from './telegram/telegram-api';
import { Update } from 'node-telegram-bot-api';
import * as http from 'http';
import { ConfigLocal } from '../config.local';

export class TelegramUpdateServer {
    private timeoutHandle: NodeJS.Timeout;
    private updateOffset: number = null;

    private readonly postFunction: string;
    private readonly telegramApi: TelegramApi;

    constructor(token: string, postFunction: string) {
        this.telegramApi = new TelegramApi(token);
        this.postFunction = postFunction;
    }

    public async setWebHook(): Promise<void>  {
        console.log(`${new Date().toString()} Start setting Web Hook...`);
        await this.telegramApi.setWebhook(ConfigLocal.webHook);
    }

    public async start(): Promise<void> {
        console.log(`${new Date().toString()} Server has started.`);
        return this.requestUpdates();
    }

    public stop() {
        if (this.timeoutHandle == null) {
            return;
        }
        clearTimeout(this.timeoutHandle);
        this.timeoutHandle = null;
    }

    private async requestUpdates(): Promise<void> {
        try {
            const data = await this.telegramApi.getUpdates(this.updateOffset);
            const updateId = await this.handleUpdates(data);
            this.updateOffset = updateId >= this.updateOffset ? updateId + 1 : this.updateOffset;
        } catch (error) {
            console.error(error);
        }

        this.timeoutHandle = setTimeout(async () => { await this.requestUpdates(); }, 1000);
    }

    private async handleUpdates(updateData: Update[]): Promise<number> {
        let maxUpdate = 0;

        for (const update of updateData) {
            try {
                if (update.update_id >= maxUpdate) {
                    maxUpdate = update.update_id;
                }

                await this.post(update);

            } catch (error) {
                console.error(error);
            }
        }
        return maxUpdate;
    }

    private post(object: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: ConfigLocal.functionsHost,
                port: ConfigLocal.functionsPort,
                path: this.postFunction,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            const req = http.request(options, (res) => {
                console.log('Status: ' + res.statusCode);
                console.log('Headers: ' + JSON.stringify(res.headers));
                res.setEncoding('utf8');
                res.on('data', (body) => {
                    console.log('Body: ' + body);
                    resolve();
                });
            });
            req.on('error', (error) => {
                reject(error);
            });
            req.write(JSON.stringify(object));
            req.end();
        });
    }
}
