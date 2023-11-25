import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, ButtonBuilder, ButtonStyle, ActionRowBuilder, Guild, TextBasedChannel, VoiceBasedChannel } from "discord.js";
import { searchYoutubeVideos, videoArrToString } from "@src/functions/youtube";
import { Ilo } from "@src/Ilo";
import { Session } from "@src/classes/Session/Session";
import { playlist_info, search, yt_validate } from "play-dl";

interface InteractionInfo {
    guild: Guild;
    channel: TextBasedChannel;
    voiceChannel: VoiceBasedChannel;
}

const getInteractionInfo = async (interaction: ChatInputCommandInteraction): Promise<InteractionInfo | undefined> => {
    const guild = interaction.guild;
    const channel = interaction.channel;
    const guildMember = interaction.member as GuildMember | null;
    if (guild === null || channel === null) {
        await interaction.reply('you can only use this command in a server');
        return;
    }
    if (guildMember === null || search === null) {
        await interaction.reply('Some error occured, please try again.');
        return;
    }
    const voiceChannel = guildMember.voice.channel;
    if (voiceChannel === null) {
        await interaction.reply('you must first be connected to a voice channel');
        return;
    }
    return { guild, channel, voiceChannel };
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Add a whole playlist to the queue.')
        .addStringOption(option => option
            .setName('link')
            .setDescription('the link to the playlist you want to add')
            .setRequired(true)
        ),
    needsClient: true,
    async execute(interaction: ChatInputCommandInteraction, client: Ilo) {
        // Get the info from the interaction and return if there was an error
        const info = await getInteractionInfo(interaction);
        const link = interaction.options.getString('link')!;
        if (info === undefined) return;
        
        // Create session (or load existing one) and add video to queue
        let session = client.sessions.get(info.guild.id);
        if (session === undefined) {
            try {
                session = new Session(info.guild, info.channel, info.voiceChannel, client);
                client.sessions.set(info.guild.id, session);
            } catch (error) {
                console.error(error);
                await interaction.reply('There was an error while connecting to the voice chat.');
                return;
            }
        }

        if (yt_validate(link) !== 'playlist') {
            await interaction.reply('The link you provided is not a valid playlist.');
            return;
        }

        const playlist = await playlist_info(link, { incomplete: true });
        const videos = await playlist.all_videos();
        videos.forEach(async (video) => {
            await session!.addToQueue(video);
        });
        await interaction.reply(`Added ${videos.length} videos to the queue.`);
    }
}