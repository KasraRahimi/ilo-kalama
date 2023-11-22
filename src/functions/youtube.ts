import { YouTubeVideo } from 'play-dl';
import play from 'play-dl';

export const searchYoutubeVideos = async (query: string): Promise<YouTubeVideo[]> => {
    return await play.search(query, { limit: 5, source : { youtube: 'video' } });
};

export const videoToString = (video: YouTubeVideo): string => {
    return `${video.title} (${video.durationRaw})`;
};

export const videoArrToString = (videos: YouTubeVideo[]): string => {
    return videos.map((video: YouTubeVideo, index: number) => {
        return `${index + 1}. ${videoToString(video)}`;
    }).join('\n');
}