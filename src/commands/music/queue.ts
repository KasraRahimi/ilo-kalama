import { SlashCommandBuilder, ChatInputCommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { Ilo } from "@src/Ilo";
import { videoArrToString } from "@src/functions/youtube";
import { YouTubeVideo } from "play-dl";

const PAGE_SIZE = 20;
const TIME_TILL_QUEUE_EXPIRES = 10 * 60_000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('displays the current queue'),
    needsClient: true,
    async execute(interaction: ChatInputCommandInteraction, client: Ilo) {
        // Check if the interaction is in a guild and if there is a session running
        if (!interaction.inGuild()) {
            await interaction.reply('you can only use this command in a server');
            return;
        }
        const session = client.sessions.get(interaction.guildId);
        if (!session) {
            await interaction.reply('I\'m not playing anything in this server');
            return;
        }

        if (session.queue.length === 0) {
            await interaction.reply('The queue is empty');
            return;
        }

        // Get the queue and send it to the user
        const queuePages = pagesOfQueue(session.queue, PAGE_SIZE, session.currentIndex)
        const title = `__**~ The Queue ~**__`;
        const lastPage = queuePages.length - 1;
        let currentPage = 0;
        if (queuePages.length === 1) {
            await interaction.reply(`${title}\n${queuePages[currentPage]}`);
            return;
        }
        const msg = await interaction.reply({ content: `${title}\n${queuePages[currentPage]}`, components: [buildNavigationRow(PositionInPages.FIRST)], fetchReply: true });
        
        // Set a collector to handle navigation
        const collector = msg.createMessageComponentCollector({ time: TIME_TILL_QUEUE_EXPIRES });
        collector.on('collect', async i => {
            if (i.customId === 'next') {
                if (currentPage === lastPage) return;
                currentPage++;
                const pagePosition = currentPage === lastPage ? PositionInPages.LAST : PositionInPages.MIDDLE;
                await i.update({ content: `${title}\n${queuePages[currentPage]}`, components: [buildNavigationRow(pagePosition)] });
            } else if (i.customId === 'previous') {
                if (currentPage === 0) return;
                currentPage--;
                const pagePosition = currentPage === 0 ? PositionInPages.FIRST : PositionInPages.MIDDLE;
                await i.update({ content: `${title}\n${queuePages[currentPage]}`, components: [buildNavigationRow(pagePosition)] });
            }
        });

        collector.on('end', async () => {
            await msg.edit({ components: [] });
        });
    }
}

const pagesOfQueue = (queue: YouTubeVideo[], pageSize: number, currentIndex: number): string[] => {
    const pages: YouTubeVideo[][] = [];
    queue.forEach((video: YouTubeVideo, index: number) => {
        const indexInPage = Math.floor(index / pageSize);
        if (pages[indexInPage]) pages[indexInPage].push(video);
        else pages[indexInPage] = [video];
    });
    return pages.map((page: YouTubeVideo[], pageIndex: number) =>
        videoArrToString(page, (video: YouTubeVideo, index: number) => {
            const globalIndex = pageIndex * pageSize + index + 1;
            const videoInformation = `**${globalIndex}.** ${video.title} (${video.durationRaw})`;
            return globalIndex === currentIndex + 1 ? `__${videoInformation}__` : videoInformation;
        })
    );
};

enum PositionInPages {
    FIRST,
    MIDDLE,
    LAST
};

const buildNavigationRow = (position: PositionInPages): ActionRowBuilder<ButtonBuilder> => {
    const buttons = [];
    if (position !== PositionInPages.FIRST) buttons.push(new ButtonBuilder()
        .setCustomId('previous')
        .setLabel('◀')
        .setStyle(ButtonStyle.Primary));
    if (position !== PositionInPages.LAST) buttons.push(new ButtonBuilder()
        .setCustomId('next')
        .setLabel('▶')
        .setStyle(ButtonStyle.Primary));
    return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
};