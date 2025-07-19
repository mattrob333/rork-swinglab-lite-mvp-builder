import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, forwardRef } from "react";
import { StyleSheet, View, Pressable, Dimensions, Platform } from "react-native";
import { Plus, RotateCcw, X } from "lucide-react-native";

import { VideoSource } from "@/types/video";
import { useVideoStore } from "@/hooks/useVideoStore";
import Colors from "@/constants/colors";

const { width: screenWidth } = Dimensions.get("window");
const VIDEO_SIZE = screenWidth - 4;

interface VideoPlayerProps {
  video: VideoSource | null;
  position: "top" | "bottom";
  onSelect: () => void;
}

const VideoPlayer = forwardRef<View, VideoPlayerProps>(({ video, position, onSelect }, ref) => {
  const videoRef = useRef<Video>(null);
  const { 
    isPlaying, 
    topCurrentTime, 
    bottomCurrentTime,
    setTopDuration, 
    setBottomDuration,
    setTopVideo, 
    setBottomVideo, 
    addRecentVideo,
    activeVideo,
    setActiveVideo,
    topFlipped,
    bottomFlipped,
    toggleTopFlip,
    toggleBottomFlip
  } = useVideoStore();

  const currentTime = position === "top" ? topCurrentTime : bottomCurrentTime;
  const isFlipped = position === "top" ? topFlipped : bottomFlipped;
  const isActive = activeVideo === position;

  useEffect(() => {
    if (videoRef.current && video) {
      if (isPlaying && isActive) {
        videoRef.current.playFromPositionAsync(currentTime * 1000);
      } else {
        videoRef.current.pauseAsync();
        videoRef.current.setPositionAsync(currentTime * 1000);
      }
    }
  }, [isPlaying, currentTime, isActive]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      const duration = status.durationMillis ? status.durationMillis / 1000 : 0;
      if (position === "top") {
        setTopDuration(duration);
      } else {
        setBottomDuration(duration);
      }
    }
  };

  const pickVideo = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newVideo: VideoSource = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          name: position === "top" ? `Pro Swing ${Date.now()}` : `My Swing ${Date.now()}`,
        };

        if (position === "top") {
          setTopVideo(newVideo);
        } else {
          setBottomVideo(newVideo);
        }
        
        addRecentVideo(newVideo);
      }
    } catch (error) {
      console.error("Error picking video:", error);
    }
  };

  const handleVideoPress = () => {
    if (video) {
      setActiveVideo(position);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      pickVideo();
    }
  };

  const handleFlipPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (position === "top") {
      toggleTopFlip();
    } else {
      toggleBottomFlip();
    }
  };

  const handleRemoveVideo = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (position === "top") {
      setTopVideo(null);
    } else {
      setBottomVideo(null);
    }
  };

  return (
    <View ref={ref} style={[styles.videoWrapper, isActive && styles.activeVideoWrapper]}>
      {video ? (
        <>
          <Video
            ref={videoRef}
            source={{ uri: video.uri }}
            style={[
              styles.video,
              isFlipped && { transform: [{ scaleX: -1 }] }
            ]}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
          <Pressable style={styles.removeButton} onPress={handleRemoveVideo}>
            <X 
              color={Colors.text} 
              size={16} 
            />
          </Pressable>
          <Pressable style={styles.flipButton} onPress={handleFlipPress}>
            <RotateCcw 
              color={isFlipped ? Colors.primary : Colors.textSecondary} 
              size={20} 
            />
          </Pressable>
        </>
      ) : (
        <Pressable style={styles.placeholderContainer} onPress={handleVideoPress}>
          <Plus color={Colors.primary} size={48} />
        </Pressable>
      )}
      
      {video && (
        <Pressable style={styles.videoOverlay} onPress={handleVideoPress} />
      )}
    </View>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;

const styles = StyleSheet.create({
  videoWrapper: {
    width: VIDEO_SIZE,
    height: VIDEO_SIZE,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    overflow: "hidden",
    alignSelf: "center",
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeVideoWrapper: {
    borderColor: Colors.primary,
  },
  video: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  flipButton: {
    position: "absolute",
    top: 8,
    right: 44,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
});