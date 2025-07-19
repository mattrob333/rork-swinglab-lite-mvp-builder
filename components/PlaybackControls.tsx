import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, View, Pressable, Platform } from "react-native";
import { Pause, Play, SkipBack, SkipForward, RefreshCw } from "lucide-react-native";

import Colors from "@/constants/colors";
import { useVideoStore } from "@/hooks/useVideoStore";

export default function PlaybackControls() {
  const { 
    isPlaying, 
    setIsPlaying, 
    topCurrentTime,
    bottomCurrentTime,
    setTopCurrentTime,
    setBottomCurrentTime,
    topDuration,
    bottomDuration,
    activeVideo,
    resetPlayback 
  } = useVideoStore();

  const currentTime = activeVideo === "top" ? topCurrentTime : bottomCurrentTime;
  const duration = activeVideo === "top" ? topDuration : bottomDuration;
  const setCurrentTime = activeVideo === "top" ? setTopCurrentTime : setBottomCurrentTime;

  const handlePlayPause = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsPlaying(!isPlaying);
  };

  const handlePreviousFrame = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const frameStep = 1 / 30; // Assuming 30fps for frame-by-frame
    const newTime = Math.max(currentTime - frameStep, 0);
    setCurrentTime(newTime);
  };

  const handleNextFrame = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const frameStep = 1 / 30; // Assuming 30fps for frame-by-frame
    const newTime = Math.min(currentTime + frameStep, duration);
    setCurrentTime(newTime);
  };

  const handleReset = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    resetPlayback();
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={handleReset}>
        <RefreshCw color={Colors.primary} size={18} />
      </Pressable>
      <Pressable style={styles.button} onPress={handlePreviousFrame}>
        <SkipBack color={Colors.primary} size={18} />
      </Pressable>
      <Pressable style={[styles.button, styles.playButton]} onPress={handlePlayPause}>
        {isPlaying ? (
          <Pause color={Colors.background} size={18} />
        ) : (
          <Play color={Colors.background} size={18} />
        )}
      </Pressable>
      <Pressable style={styles.button} onPress={handleNextFrame}>
        <SkipForward color={Colors.primary} size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});