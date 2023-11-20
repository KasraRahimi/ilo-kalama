import { Client, ClientOptions, Collection } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { getCommands } from '@src/get-commands';

export class Ilo extends Client {
    commands: Collection<any, any> = new Collection();

    constructor(options: ClientOptions) {
        super(options);
        this.loadEvents();
        this.loadCommands();
    }

    private loadEvents() {
        const eventsPath = path.join(__dirname, 'events');
        const eventFiles = fs.readdirSync(eventsPath).filter((file: string) => file.endsWith('.ts'));
        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);
            if (event.once) {
                this.once(event.name, (...args) => event.execute(this, ...args));
            } else {
                this.on(event.name, (...args) => event.execute(this, ...args));
            }
        }
    }

    private loadCommands() {
        const commands = getCommands();
        commands.forEach((command) => {
            this.commands.set(command.data.name, command);
        })
    }
}