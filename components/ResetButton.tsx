import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Pressable, Platform } from "react-native";
import { RefreshCw } from "lucide-react-native";

import Colors from "@/constants/colors";
import { useVideoStore } from "@/hooks/useVideoStore";

export default function ResetButton() {
  const { resetPlayback } = useVideoStore();

  const handleReset = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    resetPlayback();
  };

  return (
    <Pressable style={styles.button} onPress={handleReset}>
      <RefreshCw color={Colors.primary} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});