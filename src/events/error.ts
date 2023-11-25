import { Events } from 'discord.js';
import { Ilo } from '@src/Ilo';

module.exports = {
    name: Events.Error,
    once: true,
    execute(client: Ilo, error: Error) {
        console.error(error);
        console.log('error event was triggered, continuing...');
    }
};