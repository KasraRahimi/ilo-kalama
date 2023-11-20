import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('responds with pong!'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply('pong!');
    }
}