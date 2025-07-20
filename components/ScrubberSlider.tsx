import React, { useEffect, useCallback, useRef, useState } from "react";
import { StyleSheet, View, Dimensions, Text, PanResponder } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import Colors from "@/constants/colors";
import { useVideoStore } from "@/hooks/useVideoStore";

const { width: screenWidth } = Dimensions.get("window");
const SLIDER_WIDTH = screenWidth - 48;
const THUMB_SIZE = 24;
const TRACK_HEIGHT = 4;

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
  
  // State for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  
  // Refs for performance optimization
  const lastUpdateTime = useRef(0);
  const isUserDragging = useRef(false);
  
  // Animated values
  const progress = useSharedValue(0);
  const thumbScale = useSharedValue(1);

  // Update progress when video time changes (only when not dragging)
  useEffect(() => {
    if (!isUserDragging.current && duration > 0) {
      const newProgress = Math.max(0, Math.min(1, currentTime / duration));
      progress.value = withSpring(newProgress, { damping: 15, stiffness: 150 });
      setDragProgress(newProgress);
    }
  }, [currentTime, duration]);

  // Throttled video time update
  const updateVideoTime = useCallback((newProgress: number) => {
    const now = Date.now();
    if (now - lastUpdateTime.current >= 33) { // ~30fps throttling for stability
      lastUpdateTime.current = now;
      if (duration > 0) {
        const newTime = Math.max(0, Math.min(duration, newProgress * duration));
        setCurrentTime(newTime);
      }
    }
  }, [duration, setCurrentTime]);

  // Pan responder for gesture handling
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: (evt) => {
      setIsDragging(true);
      isUserDragging.current = true;
      thumbScale.value = withSpring(1.2);
      
      // Pause video when starting to scrub
      if (isPlaying) {
        setIsPlaying(false);
      }
      
      // Calculate initial position based on touch
      const touchX = evt.nativeEvent.locationX;
      const initialProgress = Math.max(0, Math.min(1, touchX / SLIDER_WIDTH));
      setDragProgress(initialProgress);
      progress.value = initialProgress;
      updateVideoTime(initialProgress);
      
      // Removed haptic feedback to prevent glitchy behavior
    },
    
    onPanResponderMove: (evt) => {
      const touchX = evt.nativeEvent.locationX;
      const newProgress = Math.max(0, Math.min(1, touchX / SLIDER_WIDTH));
      
      setDragProgress(newProgress);
      progress.value = newProgress;
      updateVideoTime(newProgress);
    },
    
    onPanResponderRelease: () => {
      setIsDragging(false);
      isUserDragging.current = false;
      thumbScale.value = withSpring(1);
      
      // Removed haptic feedback to prevent glitchy behavior
    },
    
    onPanResponderTerminate: () => {
      setIsDragging(false);
      isUserDragging.current = false;
      thumbScale.value = withSpring(1);
    },
  });

  // Animated styles
  const thumbStyle = useAnimatedStyle(() => {
    const translateX = progress.value * SLIDER_WIDTH;
    return {
      transform: [
        { translateX: Math.max(0, Math.min(SLIDER_WIDTH - THUMB_SIZE, translateX - THUMB_SIZE / 2)) },
        { scale: thumbScale.value },
      ],
    };
  });

  const progressStyle = useAnimatedStyle(() => {
    const width = progress.value * SLIDER_WIDTH;
    return {
      width: Math.max(0, Math.min(SLIDER_WIDTH, width)),
    };
  });

  // Format time display
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  if (duration <= 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noVideoText}>No video loaded</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.durationText}>{formatTime(duration)}</Text>
      </View>
      
      <View style={styles.sliderContainer} {...panResponder.panHandlers}>
        <View style={styles.track}>
          <Animated.View style={[styles.progress, progressStyle]} />
        </View>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </View>
      
      <Text style={styles.instructionText}>
        {isDragging ? "Release to freeze" : "Drag to scrub • Lift to freeze"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: "100%",
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  timeText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  durationText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  sliderContainer: {
    height: 40,
    justifyContent: "center",
    marginBottom: 8,
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: Colors.border,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: Colors.primary,
    borderRadius: THUMB_SIZE / 2,
    position: "absolute",
    top: (TRACK_HEIGHT - THUMB_SIZE) / 2,
    left: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  instructionText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  noVideoText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "500",
  },
});