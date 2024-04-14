import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Ilo } from "@src/Ilo";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('clears the queue, stops the music and leaves the channel.'),
    needsClient: true,
    async execute(interaction: ChatInputCommandInteraction, client: Ilo) {
        if (!interaction.inGuild()) {
            await interaction.reply('you can only use this command in a server');
            return;
        }
        const session = client.sessions.get(interaction.guildId);
        if (!session) {
            await interaction.reply('I\'m not playing anything in this server');
            return;
        }
        await interaction.reply('Stopping the music and clearing the queue.');
        await session.handleSessionEnd();
        client.sessions.delete(interaction.guildId);
    }
}