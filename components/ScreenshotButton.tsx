import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import React, { useState } from "react";
import { StyleSheet, Pressable, Text, View, ActivityIndicator, Platform, Alert } from "react-native";
import { Camera } from "lucide-react-native";
import { captureRef } from "react-native-view-shot";

import Colors from "@/constants/colors";
import { useVideoStore } from "@/hooks/useVideoStore";
import DrawingCanvas from "@/components/DrawingCanvas";

interface ScreenshotButtonProps {
  topVideoRef: React.RefObject<View | null>;
  bottomVideoRef: React.RefObject<View | null>;
}

export default function ScreenshotButton({ topVideoRef, bottomVideoRef }: ScreenshotButtonProps) {
  const [taking, setTaking] = useState(false);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [capturedImages, setCapturedImages] = useState<{ top?: string; bottom?: string }>({});
  const { topVideo, bottomVideo } = useVideoStore();

  const takeScreenshot = async () => {
    if (!topVideo && !bottomVideo) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("No Videos", "Please select videos to screenshot");
      return;
    }

    try {
      setTaking(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const screenshots: { top?: string; bottom?: string } = {};

      // Capture top video if it exists
      if (topVideo && topVideoRef.current) {
        try {
          const topUri = await captureRef(topVideoRef.current, {
            format: 'png',
            quality: 1.0,
            result: 'base64',
          });
          screenshots.top = `data:image/png;base64,${topUri}`;
        } catch (error) {
          console.log("Error capturing top video:", error);
        }
      }

      // Capture bottom video if it exists
      if (bottomVideo && bottomVideoRef.current) {
        try {
          const bottomUri = await captureRef(bottomVideoRef.current, {
            format: 'png',
            quality: 1.0,
            result: 'base64',
          });
          screenshots.bottom = `data:image/png;base64,${bottomUri}`;
        } catch (error) {
          console.log("Error capturing bottom video:", error);
        }
      }

      if (!screenshots.top && !screenshots.bottom) {
        Alert.alert("Screenshot Failed", "Could not capture video frames");
        return;
      }

      setCapturedImages(screenshots);
      setShowDrawingCanvas(true);

    } catch (error) {
      console.error("Error taking screenshot:", error);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Error", "Failed to take screenshot");
    } finally {
      setTaking(false);
    }
  };

  const handleDrawingComplete = () => {
    setShowDrawingCanvas(false);
    setCapturedImages({});
  };

  return (
    <>
      <Pressable
        style={[styles.button, (!topVideo && !bottomVideo) && styles.disabledButton]}
        onPress={takeScreenshot}
        disabled={taking || (!topVideo && !bottomVideo)}
      >
        {taking ? (
          <ActivityIndicator color={Colors.background} size="small" />
        ) : (
          <View style={styles.buttonContent}>
            <Camera color={Colors.background} size={14} />
            <Text style={styles.buttonText}>Screenshot</Text>
          </View>
        )}
      </Pressable>

      <DrawingCanvas
        visible={showDrawingCanvas}
        topImage={capturedImages.top}
        bottomImage={capturedImages.bottom}
        onClose={handleDrawingComplete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: Colors.inactive,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  buttonText: {
    color: Colors.background,
    fontWeight: "600",
    fontSize: 11,
  },
});