import { Video } from "@src/classes/Video/Video";
import { youtube } from "scrape-youtube";

export const searchYoutubeVideos = async (query: string): Promise<Video[]> => {
    const results = await youtube.search(query);
    const videos: Video[] = results.videos.map(video => new Video(video.title, video.link, video.duration));
    if (videos.length <= 5) return Promise.resolve(videos);
    return Promise.resolve(videos.splice(0, 5));
};

export const videoToString = (video: Video): string => {
    return `${video.title} (${video.durationString})`;
};

export const videoArrToString = (videos: Video[]): string => {
    return videos.map((video: Video, index: number) => {
        return `${index + 1}. ${videoToString(video)}`;
    }).join('\n');
}