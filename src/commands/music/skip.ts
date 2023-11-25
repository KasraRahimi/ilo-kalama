import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Ilo } from "@src/Ilo";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('skip the current song'),
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
        if (session.currentVideo) {
            await interaction.reply(`Skipping *${session.currentVideo.title}*`);
            session.playNext();
            return;
        };
        await interaction.reply('There is no song to skip');
    }
}