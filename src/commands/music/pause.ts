import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Ilo } from "@src/Ilo";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('pauses content being played'),
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
        session.pause();
        await interaction.reply('Content has been paused');
    }
}