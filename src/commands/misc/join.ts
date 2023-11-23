import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
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
        const search = interaction.options.getString('search');
        const guild = interaction.guild;
        const channel = interaction.channel;
        if (guild === null || channel === null) {
            await interaction.reply('you can only use this command in a server');
            return;
        }
        const guildMember = interaction.member as GuildMember | null;
        if (guildMember === null || search === null) {
            await interaction.reply('Some error occured, please try again.');
            return;
        }
        const voiceChannel = guildMember.voice.channel;
        if (voiceChannel === null) {
            await interaction.reply('you must first be connected to a voice channel');
            return;
        }

        let session = client.sessions.get(guild.id);
        if (session == undefined) {
            try {
                session = new Session(guild, channel, voiceChannel, client);
                client.sessions.set(guild.id, session);
            } catch (error) {
                console.error(error);
                await interaction.editReply('There was an error while connecting to the voice chat.');
                return;
            }
        }
        const videos = await searchYoutubeVideos(search);
        const row = makeButtonRow(videos.length);
        let selection: number | undefined;
        const response = await interaction.reply({
            content: `Choose a video to play\n${await videoArrToString(videos)}`,
            components: [row],
        });
        const confirmationFilter = (i: any) => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.awaitMessageComponent({ filter: confirmationFilter, time: 30_000 });
            confirmation.update({ content: 'Playing video', components: [] });
            selection = parseInt(confirmation.customId);
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'You did not select a video in time', components: [] });
            return;
        }
        session.setVideo(videos[selection]);
        await session.play();
    }
}