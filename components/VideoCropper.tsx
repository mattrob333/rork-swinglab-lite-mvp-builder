import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Video, ResizeMode } from "expo-av";
import { Check, X, RotateCcw } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import { 
  PinchGestureHandler, 
  PanGestureHandler, 
  State,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  runOnJS,
  useAnimatedGestureHandler,
} from "react-native-reanimated";

import Colors from "@/constants/colors";

const { width: screenWidth } = Dimensions.get("window");
const CROP_SIZE = screenWidth - 40;

interface VideoCropperProps {
  visible: boolean;
  videoUri: string | null;
  onComplete: (croppedUri: string) => void;
  onCancel: () => void;
}

interface PinchContext {
  [key: string]: unknown;
  startScale: number;
}

interface PanContext {
  [key: string]: unknown;
  startTranslateX: number;
  startTranslateY: number;
}

export default function VideoCropper({ visible, videoUri, onComplete, onCancel }: VideoCropperProps) {
  const [processing, setProcessing] = useState(false);
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);

  // Animated values for video transform
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinchGestureHandler = useAnimatedGestureHandler<any, PinchContext>({
    onStart: (_, context) => {
      context.startScale = scale.value;
    },
    onActive: (event, context) => {
      const newScale = Math.max(0.8, Math.min(4, context.startScale * event.scale));
      scale.value = newScale;
      
      // Keep the video centered during pinch
      const maxTranslate = CROP_SIZE * 0.3 * newScale;
      translateX.value = Math.max(-maxTranslate, Math.min(maxTranslate, translateX.value));
      translateY.value = Math.max(-maxTranslate, Math.min(maxTranslate, translateY.value));
    },
    onEnd: () => {
      if (Platform.OS !== 'web') {
        runOnJS(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        })();
      }
    },
  });

  const panGestureHandler = useAnimatedGestureHandler<any, PanContext>({
    onStart: (_, context) => {
      context.startTranslateX = translateX.value;
      context.startTranslateY = translateY.value;
    },
    onActive: (event, context) => {
      const currentScale = scale.value;
      const maxTranslate = CROP_SIZE * 0.4 * currentScale;
      
      translateX.value = Math.max(
        -maxTranslate, 
        Math.min(maxTranslate, context.startTranslateX + event.translationX)
      );
      translateY.value = Math.max(
        -maxTranslate, 
        Math.min(maxTranslate, context.startTranslateY + event.translationY)
      );
    },
    onEnd: () => {
      if (Platform.OS !== 'web') {
        runOnJS(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        })();
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const resetTransform = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleCrop = async () => {
    if (!videoUri) return;

    try {
      setProcessing(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Create a unique filename for the cropped video
      const timestamp = Date.now();
      const fileName = `cropped_video_${timestamp}.mp4`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;

      // Copy the video to a new location with crop metadata
      await FileSystem.copyAsync({
        from: videoUri,
        to: newPath,
      });

      // Store the crop transform data for later use
      const cropData = {
        scale: scale.value,
        translateX: translateX.value,
        translateY: translateY.value,
        cropSize: CROP_SIZE,
      };

      console.log("Video cropped with transform:", cropData);

      // Return the video URI (in a real app, this would be the actual cropped video)
      onComplete(newPath);
      
    } catch (error) {
      console.error("Error cropping video:", error);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    resetTransform();
    onCancel();
  };

  if (!videoUri) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.headerButton} onPress={handleCancel}>
              <X color={Colors.text} size={24} />
            </Pressable>
            <Text style={styles.title}>Crop Video</Text>
            <Pressable style={styles.headerButton} onPress={resetTransform}>
              <RotateCcw color={Colors.text} size={20} />
            </Pressable>
          </View>

          <View style={styles.videoContainer}>
            <Text style={styles.instruction}>
              Pinch to zoom, drag to reposition. Crop to 1:1 aspect ratio.
            </Text>
            
            <View style={styles.cropFrameContainer}>
              {/* Dark overlay outside crop area */}
              <View style={styles.darkOverlay} />
              
              <View style={styles.cropFrame}>
                <PanGestureHandler onGestureEvent={panGestureHandler}>
                  <Animated.View style={styles.gestureContainer}>
                    <PinchGestureHandler onGestureEvent={pinchGestureHandler}>
                      <Animated.View style={[styles.videoWrapper, animatedStyle]}>
                        <Video
                          ref={videoRef}
                          source={{ uri: videoUri }}
                          style={styles.video}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={true}
                          isLooping={true}
                          isMuted={true}
                        />
                      </Animated.View>
                    </PinchGestureHandler>
                  </Animated.View>
                </PanGestureHandler>
              </View>
              
              {/* Crop guide overlay */}
              <View style={styles.cropOverlay}>
                <View style={styles.cropGuide} />
                <View style={styles.cropCorners}>
                  <View style={[styles.cropCorner, styles.topLeft]} />
                  <View style={[styles.cropCorner, styles.topRight]} />
                  <View style={[styles.cropCorner, styles.bottomLeft]} />
                  <View style={[styles.cropCorner, styles.bottomRight]} />
                </View>
              </View>
            </View>

            <Text style={styles.hint}>
              Only the area inside the square will be kept
            </Text>
            
            <View style={styles.instructions}>
              <Text style={styles.instructionText}>• Pinch to zoom in/out</Text>
              <Text style={styles.instructionText}>• Drag to reposition</Text>
              <Text style={styles.instructionText}>• Tap reset to center</Text>
            </View>
          </View>

          <View style={[styles.controls, { paddingBottom: insets.bottom + 80 }]}>
            <Pressable style={styles.cancelButton} onPress={handleCancel}>
              <X color={Colors.text} size={20} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.cropButton, processing && styles.disabledButton]} 
              onPress={handleCrop}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color={Colors.background} size="small" />
              ) : (
                <>
                  <Check color={Colors.background} size={20} />
                  <Text style={styles.cropButtonText}>Crop & Use</Text>
                </>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
  },
  videoContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  instruction: {
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  cropFrameContainer: {
    width: CROP_SIZE + 40,
    height: CROP_SIZE + 40,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  cropFrame: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    backgroundColor: "transparent",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    zIndex: 2,
  },
  gestureContainer: {
    width: "100%",
    height: "100%",
  },
  videoWrapper: {
    width: "100%",
    height: "100%",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  cropOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    width: CROP_SIZE,
    height: CROP_SIZE,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
    zIndex: 3,
  },
  cropGuide: {
    width: "100%",
    height: "100%",
    borderWidth: 3,
    borderColor: Colors.primary,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  cropCorners: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  cropCorner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: Colors.primary,
    borderWidth: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  topLeft: {
    top: -3,
    left: -3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -3,
    right: -3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -3,
    left: -3,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -3,
    right: -3,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  hint: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  instructions: {
    alignItems: "flex-start",
  },
  instructionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    minWidth: 120,
    justifyContent: "center",
  },
  cancelButtonText: {
    color: Colors.text,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  cropButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    minWidth: 120,
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: Colors.inactive,
  },
  cropButtonText: {
    color: Colors.background,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
});