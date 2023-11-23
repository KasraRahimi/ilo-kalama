import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Ilo } from "@src/Ilo";
import { videoArrToString } from "@src/functions/youtube";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('displays the current queue'),
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
        const queue = session.queue;
        const queueString = videoArrToString(queue);
        await interaction.reply(`__**~ The Queue ~**__\n${queueString}`);
    }
}