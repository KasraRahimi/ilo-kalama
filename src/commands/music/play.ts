import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, ButtonBuilder, ButtonStyle, ActionRowBuilder, Guild, TextBasedChannel, VoiceBasedChannel } from "discord.js";
import { searchYoutubeVideos, videoArrToString } from "@src/functions/youtube";
import { Ilo } from "@src/Ilo";
import { Session } from "@src/classes/Session/Session";

const link = 'https://www.youtube.com/watch?v=jhYg5NrN-r8';

const makeButtonRow = (count: number) => {
    const buttons = [];
    for (let i = 0; i < count; i++) {
        const button = new ButtonBuilder()
            .setCustomId(`${i}`)
            .setLabel(`${i+1}`)
            .setStyle(ButtonStyle.Primary);
        buttons.push(button);
    }
    return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
}

interface InteractionInfo {
    search: string;
    guild: Guild;
    channel: TextBasedChannel;
    voiceChannel: VoiceBasedChannel;
}

const getInteractionInfo = async (interaction: ChatInputCommandInteraction): Promise<InteractionInfo | undefined> => {
    const search = interaction.options.getString('search');
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
    return { search, guild, channel, voiceChannel };
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('plays music in your voice channel')
        .addStringOption(option => option
            .setName('search')
            .setDescription('the title of the youtube you want to play')
            .setRequired(true)
        ),
    needsClient: true,
    async execute(interaction: ChatInputCommandInteraction, client: Ilo) {
        // Get the info from the interaction and return if there was an error
        const info = await getInteractionInfo(interaction);
        if (info === undefined) return;

        // Find the list of videos and prompt user to select one
        const videos = await searchYoutubeVideos(info.search);
        const row = makeButtonRow(videos.length);
        let selection: number;
        const response = await interaction.reply({
            content: `Choose a video to play\n${await videoArrToString(videos)}`,
            components: [row],
        });
        const confirmationFilter = (i: any) => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.awaitMessageComponent({ filter: confirmationFilter, time: 30_000 });
            confirmation.update({ content: 'Added to queue', components: [] });
            selection = parseInt(confirmation.customId);
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'You did not select a video in time', components: [] });
            return;
        }
        
        // Create session (or load existing one) and add video to queue
        let session = client.sessions.get(info.guild.id);
        if (session == undefined) {
            try {
                session = new Session(info.guild, info.channel, info.voiceChannel, client);
                client.sessions.set(info.guild.id, session);
            } catch (error) {
                console.error(error);
                await interaction.editReply('There was an error while connecting to the voice chat.');
                return;
            }
        }
        await session.addToQueue(videos[selection]);
    }
}