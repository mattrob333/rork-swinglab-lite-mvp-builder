import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Camera as CameraIcon, Circle, RotateCcw } from "lucide-react-native";
import * as FileSystem from "expo-file-system";

import Colors from "@/constants/colors";
import { useVideoStore } from "@/hooks/useVideoStore";
import { VideoSource } from "@/types/video";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const GUIDE_SIZE = screenWidth - 40; // 1:1 square guide

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { setBottomVideo } = useVideoStore();
  const insets = useSafeAreaInsets();

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>We need your permission to show the camera</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const toggleCameraFacing = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFacing(current => (current === "back" ? "front" : "back"));
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setIsRecording(true);
      
      try {
        // Start recording video
        const recordingOptions = {
          quality: '720p' as const,
          maxDuration: 10, // 10 seconds max
          mute: false,
        };
        
        const recordingPromise = cameraRef.current.recordAsync(recordingOptions);
        
        // Set up a timeout to auto-stop recording after 10 seconds
        setTimeout(() => {
          if (isRecording) {
            stopRecording();
          }
        }, 10000);
        
        // Wait for recording to complete
        const recordedVideo = await recordingPromise;
        
        if (recordedVideo && recordedVideo.uri) {
          await processRecordedVideo(recordedVideo.uri);
        }
        
      } catch (error) {
        console.error("Error during recording:", error);
        setIsRecording(false);
        Alert.alert("Recording Error", "Failed to record video");
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      setIsRecording(false);
      setLoading(true);
      
      try {
        // Stop recording
        cameraRef.current.stopRecording();
      } catch (error) {
        console.error("Error stopping recording:", error);
        setLoading(false);
      }
    }
  };

  const processRecordedVideo = async (videoUri: string) => {
    try {
      setLoading(true);
      
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `swing_${timestamp}.mp4`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;
      
      // Copy the video to a permanent location
      await FileSystem.copyAsync({
        from: videoUri,
        to: newPath,
      });
      
      // Create the video object
      const video: VideoSource = {
        id: timestamp.toString(),
        uri: newPath,
        name: `My Swing ${new Date().toLocaleDateString()}`,
      };
      
      // Add to bottom video slot
      setBottomVideo(video);
      
      // Navigate back to compare screen
      router.replace("/");
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
    } catch (error) {
      console.error("Error processing video:", error);
      Alert.alert("Processing Error", "Failed to process the recorded video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing={facing} 
        ref={cameraRef}
        mode="video"
      >
        <SafeAreaView style={styles.cameraContent} edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft color={Colors.text} size={24} />
            </Pressable>
            <Text style={styles.title}>Record Baseball Swing</Text>
            <Pressable style={styles.flipButton} onPress={toggleCameraFacing}>
              <RotateCcw color={Colors.text} size={20} />
            </Pressable>
          </View>

          {/* 1:1 Recording Guide Overlay */}
          <View style={styles.guideContainer}>
            <View style={styles.guideOverlay}>
              {/* Dark overlay outside the guide */}
              <View style={styles.darkOverlay} />
              
              {/* 1:1 Square Guide */}
              <View style={styles.recordingGuide}>
                <View style={styles.guideFrame} />
                <View style={styles.guideCorners}>
                  <View style={[styles.guideCorner, styles.topLeft]} />
                  <View style={[styles.guideCorner, styles.topRight]} />
                  <View style={[styles.guideCorner, styles.bottomLeft]} />
                  <View style={[styles.guideCorner, styles.bottomRight]} />
                </View>
                
                {/* Guide text */}
                <View style={styles.guideTextContainer}>
                  <Text style={styles.guideText}>
                    {isRecording ? "Recording..." : "Frame your swing here"}
                  </Text>
                  <Text style={styles.guideSubtext}>
                    {isRecording ? "Keep steady" : "1:1 square format"}
                  </Text>
                  {isRecording && (
                    <Text style={styles.recordingTimer}>
                      Recording will auto-stop in 10s
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
          
          <View style={[styles.controlsContainer, { marginBottom: insets.bottom + 60 }]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Processing video...</Text>
              </View>
            ) : (
              <Pressable
                style={[styles.recordButton, isRecording && styles.recordingButton]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                disabled={loading}
              >
                {isRecording ? (
                  <View style={styles.stopIcon} />
                ) : (
                  <Circle color={Colors.primary} fill={Colors.primary} size={60} />
                )}
              </Pressable>
            )}
          </View>
          
          <Text style={[styles.instructions, { marginBottom: insets.bottom + 50 }]}>
            {isRecording
              ? "Recording in 1:1 format... Release to stop"
              : "Position your swing in the square, then press and hold to record"}
          </Text>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  camera: {
    flex: 1,
  },
  cameraContent: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  text: {
    color: Colors.text,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: Colors.background,
    fontWeight: "600",
    fontSize: 16,
  },
  guideContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  guideOverlay: {
    width: screenWidth,
    height: screenHeight,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  recordingGuide: {
    width: GUIDE_SIZE,
    height: GUIDE_SIZE,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  guideFrame: {
    width: "100%",
    height: "100%",
    borderWidth: 3,
    borderColor: Colors.primary,
    borderRadius: 12,
    backgroundColor: "transparent",
    borderStyle: "dashed",
  },
  guideCorners: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  guideCorner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: Colors.primary,
    borderWidth: 4,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  topLeft: {
    top: -4,
    left: -4,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -4,
    right: -4,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -4,
    left: -4,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -4,
    right: -4,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  guideTextContainer: {
    position: "absolute",
    bottom: -80,
    alignItems: "center",
  },
  guideText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  guideSubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recordingTimer: {
    color: Colors.primary,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  controlsContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    color: Colors.text,
    fontSize: 16,
    marginTop: 12,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.text,
  },
  recordingButton: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(255, 0, 0, 0.3)",
  },
  stopIcon: {
    width: 30,
    height: 30,
    backgroundColor: "red",
    borderRadius: 4,
  },
  instructions: {
    color: Colors.text,
    fontSize: 14,
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 12,
    borderRadius: 8,
    alignSelf: "center",
    marginHorizontal: 20,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});