import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { StyleSheet, View, Text, FlatList, Pressable, ActivityIndicator, Platform } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { FolderOpen, Plus } from "lucide-react-native";

import Colors from "@/constants/colors";
import proSwings from "@/constants/proSwings";
import { useVideoStore } from "@/hooks/useVideoStore";
import { ProSwing, VideoSource } from "@/types/video";
import VideoCropper from "@/components/VideoCropper";

export default function ProLibraryScreen() {
  const [loading, setLoading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const { setTopVideo } = useVideoStore();
  const insets = useSafeAreaInsets();

  const selectProSwing = (swing: ProSwing) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTopVideo(swing);
    router.replace("/");
  };

  const importProVideo = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedVideoUri(result.assets[0].uri);
        setShowCropper(true);
      }
    } catch (error) {
      console.error("Error picking video:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCropComplete = (croppedUri: string) => {
    const video: VideoSource = {
      id: Date.now().toString(),
      uri: croppedUri,
      name: `Pro Swing ${Date.now()}`,
    };

    setTopVideo(video);
    setShowCropper(false);
    setSelectedVideoUri(null);
    router.replace("/");
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedVideoUri(null);
  };

  const renderProSwing = ({ item }: { item: ProSwing }) => (
    <Pressable style={styles.swingItem} onPress={() => selectProSwing(item)}>
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.thumbnail}
          contentFit="cover"
        />
      </View>
      <View style={styles.swingInfo}>
        <Text style={styles.golferName}>{item.golfer}</Text>
        <Text style={styles.swingDetails}>
          {item.club} • {item.year}
        </Text>
      </View>
    </Pressable>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Pressable style={styles.importButton} onPress={importProVideo}>
        {loading ? (
          <ActivityIndicator color={Colors.background} size="small" />
        ) : (
          <>
            <FolderOpen color={Colors.background} size={20} />
            <Text style={styles.importButtonText}>Import & Crop Pro Video</Text>
          </>
        )}
      </Pressable>
      <Text style={styles.sectionTitle}>Featured Pro Swings</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Pro Baseball Swings</Text>
        <Text style={styles.subtitle}>
          Select a professional swing to compare with your own
        </Text>
      </View>

      <FlatList
        data={proSwings}
        renderItem={renderProSwing}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 60 }]}
        ListHeaderComponent={renderHeader}
      />

      <VideoCropper
        visible={showCropper}
        videoUri={selectedVideoUri}
        onComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  listContent: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 20,
  },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  importButtonText: {
    color: Colors.background,
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  swingItem: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    overflow: "hidden",
  },
  thumbnailContainer: {
    width: 120,
    height: 80,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  swingInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  golferName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  swingDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});