import { REST, Routes } from 'discord.js';
import { token, clientId } from '@base/config.json';
import { getCommands } from '@src/get-commands';

const commands: any = getCommands().map((command: any) => command.data.toJSON());

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data: any = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands`);
    } catch (error) {
        console.error(error);
    }
})();