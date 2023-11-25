import { SlashCommandBuilder, ChatInputCommandInteraction, time } from "discord.js";
import { Ilo } from "@src/Ilo";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('skip the current song')
        .addStringOption(option => option
            .setName('time')
            .setDescription('the time to seek to in (hh:mm:ss) format')
            .setRequired(true)),
    needsClient: true,
    async execute(interaction: ChatInputCommandInteraction, client: Ilo) {
        const timestamp = interaction.options.getString('time');
        if (!interaction.inGuild()) {
            await interaction.reply('you can only use this command in a server');
            return;
        }
        const session = client.sessions.get(interaction.guildId);
        if (!session) {
            await interaction.reply('I\'m not playing anything in this server');
            return;
        }
        
        let seconds;
        try {
            seconds = timestampToSeconds(timestamp!);
        } catch (error) {
            await interaction.reply('Invalid timestamp');
            return;
        }
        
        if (session.currentVideo) {
            await interaction.reply(`seeking: ${timestamp}`);
            session.seek(seconds);
            return;
        };
        await interaction.reply('There is no song to seek');
    }
}

const timestampToSeconds = (timestamp: string): number => {
    const timestamps = timestamp.split(':');
    switch (timestamps.length) {
        case 1:
            return parseInt(timestamps[0]);
        case 2:
            return parseInt(timestamps[0]) * 60 + parseInt(timestamps[1]);
        case 3:
            return parseInt(timestamps[0]) * 3600 + parseInt(timestamps[1]) * 60 + parseInt(timestamps[2]);
        default:
            throw new Error('Invalid timestamp');
    }
};