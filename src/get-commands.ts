import * as fs from 'fs';
import * as path from 'path';

export const getCommands = () => {
    const commands: { data: any, execute: any }[] = [];
    const folderPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(folderPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(folderPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter((file: any) => file.endsWith('.ts'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) commands.push(command);
            else console.log(`[WARNING] the command at ${filePath} is missing a data or execute property.`);
        }
    }
    return commands;
}