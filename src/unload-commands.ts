import { REST, Routes } from 'discord.js';
import { token, clientId } from '@base/config.json';

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`Started clearing application (/) commands.`);

        const data: any = await rest.put(
            Routes.applicationCommands(clientId),
            { body: [] },
        );

        console.log(`Successfully cleared application (/) commands`);
    } catch (error) {
        console.error(error);
    }
})();