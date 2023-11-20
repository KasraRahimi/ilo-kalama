import { Events } from 'discord.js';
import { Ilo } from '@src/Ilo';

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client: Ilo) {
        console.log(`Logged in as ${client.user?.tag}!`);
    }
};