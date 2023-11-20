import { Ilo } from '@src/Ilo';
import { Events, Interaction } from 'discord.js';

module.exports = {
    name: Events.InteractionCreate,
    async execute(client: Ilo, interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;
    
        const command = client.commands.get(interaction.commandName);
        if (command === undefined) {
            console.log(`no matching command for ${interaction.commandName} was found`);
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
}