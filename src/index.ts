import { GatewayIntentBits } from 'discord.js'
import { Ilo } from '@src/Ilo';
import { token } from '@base/config.json'

const client = new Ilo({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions]
});

async function main() {
    try {
        console.log("starting bot...")
        await client.login(token);
    } catch (e) {
        console.error(e);
    }
}

main();