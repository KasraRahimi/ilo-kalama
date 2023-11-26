import { YouTubeVideo } from 'play-dl';
import play from 'play-dl';

export const searchYoutubeVideos = async (query: string): Promise<YouTubeVideo[]> => {
    return await play.search(query, { limit: 5, source : { youtube: 'video' } });
};

export const videoToString = (video: YouTubeVideo): string => {
    return `${video.title} (${video.durationRaw})`;
};

const defaultVideoArrToStringCallback = (video: YouTubeVideo, index: number): string => {
    return `**${index + 1}.** ${videoToString(video)}`;
};

export const videoArrToString = (videos: YouTubeVideo[], callback: (video: YouTubeVideo, index: number) => string=defaultVideoArrToStringCallback): string => {
    return videos.map(callback).join('\n');
}