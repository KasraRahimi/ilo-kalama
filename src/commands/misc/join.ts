import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { VoiceConnectionStatus, AudioPlayerStatus, joinVoiceChannel, createAudioPlayer, createAudioResource } from "@discordjs/voice";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('joins voice channel'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply('joining!');
        const guild = interaction.guild;
        if (guild === null) await interaction.editReply('you can only use this command in a server');

        const guildMember = interaction.member as GuildMember | null;
        if (guildMember === null) await interaction.editReply('Some error occured, please try again.');
        const voiceChannel = guildMember!.voice.channel;
        if (voiceChannel === null) await interaction.editReply('you must first be connected to a voice channel');

        const channelId = voiceChannel!.id;
        const guildId = guild!.id;
        const adaptorCreator = guild!.voiceAdapterCreator;

        const connection = joinVoiceChannel({
            channelId: channelId,
            guildId: guildId,
            adapterCreator: adaptorCreator
        });

        const player = createAudioPlayer();
        const resource = createAudioResource('./../../sound/nyan-cat.mp3');
        player.play(resource);
        connection.subscribe(player);
        console.log('playing it');
        const thing = await new Promise((resolve) => {
            setTimeout(resolve, 180_000);
        })
        console.log('done');
        connection.destroy();
    }
}