import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, View, Pressable, Platform } from "react-native";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react-native";

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
    activeVideo
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

  return (
    <View style={styles.container}>
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
    gap: 12,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});