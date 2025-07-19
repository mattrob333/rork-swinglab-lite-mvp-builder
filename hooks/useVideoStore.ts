import { create } from "zustand";

import { VideoSource } from "@/types/video";

interface VideoState {
  topVideo: VideoSource | null;
  bottomVideo: VideoSource | null;
  recentVideos: VideoSource[];
  isPlaying: boolean;
  topCurrentTime: number;
  bottomCurrentTime: number;
  topDuration: number;
  bottomDuration: number;
  activeVideo: "top" | "bottom";
  topFlipped: boolean;
  bottomFlipped: boolean;
  swapActiveVideo: () => void;
  setTopVideo: (video: VideoSource | null) => void;
  setBottomVideo: (video: VideoSource | null) => void;
  addRecentVideo: (video: VideoSource) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setTopCurrentTime: (time: number) => void;
  setBottomCurrentTime: (time: number) => void;
  setTopDuration: (duration: number) => void;
  setBottomDuration: (duration: number) => void;
  setActiveVideo: (video: "top" | "bottom") => void;
  toggleTopFlip: () => void;
  toggleBottomFlip: () => void;
  resetPlayback: () => void;
}

export const useVideoStore = create<VideoState>()((set, get) => ({
  topVideo: null,
  bottomVideo: null,
  recentVideos: [],
  isPlaying: false,
  topCurrentTime: 0,
  bottomCurrentTime: 0,
  topDuration: 0,
  bottomDuration: 0,
  activeVideo: "top",
  topFlipped: false,
  bottomFlipped: false,

  swapActiveVideo: () => {
    const { activeVideo } = get();
    set({ activeVideo: activeVideo === "top" ? "bottom" : "top" });
  },

  setTopVideo: (video) => {
    set({ topVideo: video, activeVideo: "top" });
    if (video) {
      get().addRecentVideo(video);
    }
  },

  setBottomVideo: (video) => {
    set({ bottomVideo: video, activeVideo: "bottom" });
    if (video) {
      get().addRecentVideo(video);
    }
  },

  addRecentVideo: (video) => {
    const recentVideos = get().recentVideos;
    const filteredVideos = recentVideos.filter((v) => v.id !== video.id);
    const newRecentVideos = [video, ...filteredVideos].slice(0, 5);
    set({ recentVideos: newRecentVideos });
  },

  setIsPlaying: (isPlaying) => {
    set({ isPlaying });
  },

  setTopCurrentTime: (time) => {
    set({ topCurrentTime: time });
  },

  setBottomCurrentTime: (time) => {
    set({ bottomCurrentTime: time });
  },

  setTopDuration: (duration) => {
    set({ topDuration: duration });
  },

  setBottomDuration: (duration) => {
    set({ bottomDuration: duration });
  },

  setActiveVideo: (video) => {
    set({ activeVideo: video });
  },

  toggleTopFlip: () => {
    set({ topFlipped: !get().topFlipped });
  },

  toggleBottomFlip: () => {
    set({ bottomFlipped: !get().bottomFlipped });
  },

  resetPlayback: () => {
    set({ 
      topCurrentTime: 0, 
      bottomCurrentTime: 0, 
      isPlaying: false 
    });
  },
}));