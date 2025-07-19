import { Tabs } from "expo-router";
import { Home, BookOpen, Video } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";

import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: { 
          backgroundColor: "#1A1A1A",
          height: Platform.OS === 'android' ? 95 : 85,
          paddingBottom: Platform.OS === 'android' ? 35 : 28,
          paddingTop: 8,
        },
        headerStyle: { backgroundColor: "#1A1A1A" },
        headerTintColor: "#FFFFFF",
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Compare",
          tabBarIcon: ({ color }) => <Home color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="pro-library"
        options={{
          title: "Pro Library",
          tabBarIcon: ({ color }) => <BookOpen color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Record",
          tabBarIcon: ({ color }) => <Video color={color} size={20} />,
          href: "/camera",
        }}
      />
    </Tabs>
  );
}