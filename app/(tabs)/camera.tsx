import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

import { useVideoStore } from "@/hooks/useVideoStore";
import { VideoSource } from "@/types/video";

export default function CameraTab() {
  const { setBottomVideo } = useVideoStore();

  useEffect(() => {
    const openCamera = async () => {
      try {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
          quality: 1,
          videoMaxDuration: 30,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const video: VideoSource = {
            id: Date.now().toString(),
            uri: result.assets[0].uri,
            name: `My Swing ${new Date().toLocaleDateString()}`,
          };
          
          setBottomVideo(video);
          router.replace("/");
        } else {
          // User cancelled, go back to compare screen
          router.replace("/");
        }
      } catch (error) {
        console.error("Error opening camera:", error);
        router.replace("/");
      }
    };

    openCamera();
  }, []);

  return null;
}