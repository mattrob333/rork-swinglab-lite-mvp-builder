import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Camera, FolderOpen, X, Video as VideoIcon } from "lucide-react-native";

import Colors from "@/constants/colors";
import { VideoSource } from "@/types/video";
import { useVideoStore } from "@/hooks/useVideoStore";

interface VideoSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  position: "top" | "bottom";
}

export default function VideoSelector({ isVisible, onClose, position }: VideoSelectorProps) {
  const [loading, setLoading] = useState(false);
  const { recentVideos, setTopVideo, setBottomVideo } = useVideoStore();

  const pickVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const video: VideoSource = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          name: position === "bottom" ? `My Swing ${recentVideos.length + 1}` : `Pro Swing ${recentVideos.length + 1}`,
        };

        if (position === "top") {
          setTopVideo(video);
        } else {
          setBottomVideo(video);
        }
        onClose();
      }
    } catch (error) {
      console.error("Error picking video:", error);
    } finally {
      setLoading(false);
    }
  };

  const recordVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    router.push("/camera");
  };

  const selectVideo = (video: VideoSource) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (position === "top") {
      setTopVideo(video);
    } else {
      setBottomVideo(video);
    }
    onClose();
  };

  const renderVideoItem = ({ item }: { item: VideoSource }) => (
    <Pressable style={styles.videoItem} onPress={() => selectVideo(item)}>
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: item.uri }}
          style={styles.thumbnail}
          contentFit="cover"
        />
        <View style={styles.videoOverlay}>
          <VideoIcon color={Colors.text} size={16} />
        </View>
      </View>
      <Text style={styles.videoName} numberOfLines={2}>
        {item.name}
      </Text>
    </Pressable>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {position === "bottom" ? "Select Your Swing" : "Select Pro Swing"}
            </Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X color={Colors.text} size={24} />
            </Pressable>
          </View>

          <View style={styles.optionsContainer}>
            {position === "bottom" && (
              <Pressable style={styles.option} onPress={recordVideo}>
                <Camera color={Colors.primary} size={32} />
                <Text style={styles.optionText}>Record New</Text>
              </Pressable>
            )}
            <Pressable style={styles.option} onPress={pickVideo}>
              <FolderOpen color={Colors.primary} size={32} />
              <Text style={styles.optionText}>
                {position === "bottom" ? "My Videos" : "Pro Videos"}
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <>
              <Text style={styles.sectionTitle}>Recent Videos</Text>
              {recentVideos.length > 0 ? (
                <FlatList
                  data={recentVideos}
                  renderItem={renderVideoItem}
                  keyExtractor={(item) => item.id}
                  horizontal={false}
                  numColumns={3}
                  style={styles.videoList}
                />
              ) : (
                <Text style={styles.emptyText}>No recent videos</Text>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  closeButton: {
    padding: 5,
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  option: {
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    width: "45%",
  },
  optionText: {
    color: Colors.text,
    marginTop: 8,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  videoList: {
    flex: 1,
  },
  videoItem: {
    width: "30%",
    marginBottom: 16,
    marginHorizontal: "1.5%",
  },
  thumbnailContainer: {
    aspectRatio: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 4,
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  videoOverlay: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 4,
    padding: 2,
  },
  videoName: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 20,
  },
});