import React, { useRef } from "react";
import { StyleSheet, View, ScrollView, StatusBar, Dimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import VideoPlayer from "@/components/VideoPlayer";
import PlaybackControls from "@/components/PlaybackControls";
import ScrubberSlider from "@/components/ScrubberSlider";
import ScreenshotButton from "@/components/ScreenshotButton";
import { useVideoStore } from "@/hooks/useVideoStore";
import Colors from "@/constants/colors";

const { height: screenHeight } = Dimensions.get("window");

export default function CompareScreen() {
  const { topVideo, bottomVideo } = useVideoStore();
  const topVideoRef = useRef<View>(null);
  const bottomVideoRef = useRef<View>(null);
  const insets = useSafeAreaInsets();

  const CONTROLS_HEIGHT = 100;

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: CONTROLS_HEIGHT + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.videoContainer}>
          <VideoPlayer
            ref={topVideoRef}
            video={topVideo}
            position="top"
            onSelect={() => {}}
          />
          <VideoPlayer
            ref={bottomVideoRef}
            video={bottomVideo}
            position="bottom"
            onSelect={() => {}}
          />
        </View>
      </ScrollView>

      <View style={styles.stickyControls}>
        <ScrubberSlider />
        <View style={styles.controlButtonsRow}>
          <PlaybackControls />
          <ScreenshotButton 
            topVideoRef={topVideoRef}
            bottomVideoRef={bottomVideoRef}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 2,
  },
  videoContainer: {
    flex: 1,
    width: "100%",
    gap: 2,
  },
  stickyControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 0,
  },
  controlButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 8,
    paddingBottom: 8,
  },
});