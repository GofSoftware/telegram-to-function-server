import { TelegramUpdateServer } from './business/telegram-update-server';
import { ConfigLocal } from './config.local'; // If you can't find this file, just run "npm build" it will be created.

class Main {
    public server: TelegramUpdateServer;
    public async startTelegram(): Promise<void> {
        this.server = new TelegramUpdateServer(ConfigLocal.token, ConfigLocal.postFunction);
        if (process.argv.indexOf('--web-hook') !== -1) {
            await this.server.setWebHook();
        } else {
            await this.server.start();
        }
    }
}

const app = new Main();
try {
    (async () => await app.startTelegram())();
} catch (error) {
    console.error(error);
}



