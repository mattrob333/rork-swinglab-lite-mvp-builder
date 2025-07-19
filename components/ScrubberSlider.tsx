import * as Haptics from "expo-haptics";
import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, PanResponder, Dimensions, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

import Colors from "@/constants/colors";
import { useVideoStore } from "@/hooks/useVideoStore";

const { width: screenWidth } = Dimensions.get("window");
const SLIDER_WIDTH = screenWidth - 24;
const THUMB_SIZE = 24;

export default function ScrubberSlider() {
  const { 
    topCurrentTime, 
    bottomCurrentTime,
    topDuration,
    bottomDuration,
    setTopCurrentTime, 
    setBottomCurrentTime,
    activeVideo,
    isPlaying,
    setIsPlaying
  } = useVideoStore();
  
  const currentTime = activeVideo === "top" ? topCurrentTime : bottomCurrentTime;
  const duration = activeVideo === "top" ? topDuration : bottomDuration;
  const setCurrentTime = activeVideo === "top" ? setTopCurrentTime : setBottomCurrentTime;
  
  const progress = useSharedValue(0);
  const [isDragging, setIsDragging] = useState(false);

  // Update progress when video time changes (but not when user is dragging)
  useEffect(() => {
    if (!isDragging && duration > 0) {
      const newProgress = Math.max(0, Math.min(1, currentTime / duration));
      progress.value = newProgress;
    }
  }, [currentTime, duration, isDragging]);

  const updateVideoTime = useCallback((progressValue: number) => {
    if (duration > 0) {
      const newTime = Math.max(0, Math.min(duration, progressValue * duration));
      setCurrentTime(newTime);
    }
  }, [duration, setCurrentTime]);

  const handleProgressChange = useCallback((newProgress: number) => {
    const clampedProgress = Math.max(0, Math.min(1, newProgress));
    progress.value = clampedProgress;
    updateVideoTime(clampedProgress);
  }, [updateVideoTime]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: (evt) => {
      setIsDragging(true);
      
      // Pause video while dragging
      if (isPlaying) {
        setIsPlaying(false);
      }
      
      // Calculate initial position based on touch location
      const touchX = evt.nativeEvent.locationX;
      const initialProgress = Math.max(0, Math.min(1, touchX / SLIDER_WIDTH));
      handleProgressChange(initialProgress);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    
    onPanResponderMove: (evt, gestureState) => {
      // Calculate progress based on current touch position
      const touchX = evt.nativeEvent.locationX;
      const newProgress = Math.max(0, Math.min(1, touchX / SLIDER_WIDTH));
      handleProgressChange(newProgress);
    },
    
    onPanResponderRelease: () => {
      setIsDragging(false);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    
    onPanResponderTerminate: () => {
      setIsDragging(false);
    },
  });

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const translateX = progress.value * (SLIDER_WIDTH - THUMB_SIZE);
    return {
      transform: [{ translateX: Math.max(0, Math.min(SLIDER_WIDTH - THUMB_SIZE, translateX)) }],
    };
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.track}>
        <Animated.View style={[styles.progress, progressStyle]} />
      </View>
      <Animated.View style={[styles.thumb, thumbStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 12,
    width: "100%",
  },
  track: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.primary,
    top: (40 - THUMB_SIZE) / 2,
    left: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});