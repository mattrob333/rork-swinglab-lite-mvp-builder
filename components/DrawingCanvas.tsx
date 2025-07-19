import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { PanGestureHandler, State, GestureHandlerRootView } from "react-native-gesture-handler";
import Svg, { Path, Circle, Line, Defs, Marker, Polygon } from "react-native-svg";
import { captureRef } from "react-native-view-shot";
import {
  X,
  Save,
  Share,
  Pen,
  Circle as CircleIcon,
  ArrowRight,
  Minus,
  RotateCcw,
} from "lucide-react-native";

import Colors from "@/constants/colors";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface DrawingCanvasProps {
  visible: boolean;
  topImage?: string;
  bottomImage?: string;
  onClose: () => void;
}

type DrawingTool = "pen" | "circle" | "arrow" | "line";
type DrawingColor = string;

interface DrawingPath {
  id: string;
  type: DrawingTool;
  path?: string;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  centerX?: number;
  centerY?: number;
  radius?: number;
  color: DrawingColor;
  strokeWidth: number;
}

const COLORS: DrawingColor[] = [
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFFFFF", // White
  "#000000", // Black
];

export default function DrawingCanvas({ visible, topImage, bottomImage, onClose }: DrawingCanvasProps) {
  const [currentTool, setCurrentTool] = useState<DrawingTool>("pen");
  const [currentColor, setCurrentColor] = useState<DrawingColor>("#FF0000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [drawings, setDrawings] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<View>(null);
  const insets = useSafeAreaInsets();

  const TOOLS_HEIGHT = 180;
  const CANVAS_HEIGHT = screenHeight - insets.top - insets.bottom - 60 - TOOLS_HEIGHT;
  const CANVAS_WIDTH = screenWidth - 4;

  const handleGestureEvent = (event: any) => {
    const { x, y } = event.nativeEvent;
    
    if (event.nativeEvent.state === State.BEGAN) {
      setIsDrawing(true);
      setStartPoint({ x, y });
      
      if (currentTool === "pen") {
        setCurrentPath(`M${x},${y}`);
      }
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else if (event.nativeEvent.state === State.ACTIVE && isDrawing) {
      if (currentTool === "pen") {
        setCurrentPath(prev => `${prev} L${x},${y}`);
      }
    } else if (event.nativeEvent.state === State.END && isDrawing && startPoint) {
      const newDrawing: DrawingPath = {
        id: Date.now().toString(),
        type: currentTool,
        color: currentColor,
        strokeWidth,
      };

      switch (currentTool) {
        case "pen":
          newDrawing.path = currentPath;
          break;
        case "circle":
          const radius = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
          newDrawing.centerX = startPoint.x;
          newDrawing.centerY = startPoint.y;
          newDrawing.radius = radius;
          break;
        case "line":
          newDrawing.startX = startPoint.x;
          newDrawing.startY = startPoint.y;
          newDrawing.endX = x;
          newDrawing.endY = y;
          break;
        case "arrow":
          newDrawing.startX = startPoint.x;
          newDrawing.startY = startPoint.y;
          newDrawing.endX = x;
          newDrawing.endY = y;
          break;
      }

      setDrawings(prev => [...prev, newDrawing]);
      setCurrentPath("");
      setIsDrawing(false);
      setStartPoint(null);
    }
  };

  const clearDrawings = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setDrawings([]);
    setCurrentPath("");
  };

  const selectTool = (tool: DrawingTool) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCurrentTool(tool);
  };

  const selectColor = (color: DrawingColor) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCurrentColor(color);
  };

  const saveImage = async () => {
    try {
      setSaving(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Required", "Please grant media library access to save images");
        return;
      }

      if (canvasRef.current) {
        const uri = await captureRef(canvasRef.current, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });

        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(uri);
        
        // Try to create album
        try {
          await MediaLibrary.createAlbumAsync('SwingLab', asset, false);
        } catch (albumError) {
          console.log("Could not create album, but image was saved:", albumError);
        }

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        Alert.alert("Success", "Annotated swing comparison saved to your photos!");
      }
    } catch (error) {
      console.error("Error saving image:", error);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Error", "Failed to save image");
    } finally {
      setSaving(false);
    }
  };

  const shareImage = async () => {
    try {
      setSaving(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (canvasRef.current) {
        const uri = await captureRef(canvasRef.current, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });

        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share Swing Analysis',
          });
        }
      }
    } catch (error) {
      console.error("Error sharing image:", error);
      Alert.alert("Error", "Failed to share image");
    } finally {
      setSaving(false);
    }
  };

  const renderArrowMarker = () => (
    <Defs>
      <Marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <Polygon
          points="0 0, 10 3.5, 0 7"
          fill={currentColor}
        />
      </Marker>
    </Defs>
  );

  const imageHeight = topImage && bottomImage ? CANVAS_HEIGHT / 2 : CANVAS_HEIGHT;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.headerButton} onPress={onClose}>
              <X color={Colors.text} size={24} />
            </Pressable>
            <Text style={styles.title}>Swing Analysis</Text>
            <Pressable style={styles.headerButton} onPress={clearDrawings}>
              <RotateCcw color={Colors.text} size={20} />
            </Pressable>
          </View>

          <View style={[styles.canvasContainer, { 
            height: CANVAS_HEIGHT,
            width: CANVAS_WIDTH,
            alignSelf: 'center'
          }]} ref={canvasRef}>
            {topImage && (
              <Image
                source={{ uri: topImage }}
                style={[styles.image, { height: imageHeight }]}
                contentFit="contain"
              />
            )}
            {bottomImage && (
              <Image
                source={{ uri: bottomImage }}
                style={[styles.image, { height: imageHeight }]}
                contentFit="contain"
              />
            )}
            
            <PanGestureHandler onHandlerStateChange={handleGestureEvent}>
              <View style={styles.svgContainer}>
                <Svg style={styles.svg} width="100%" height="100%">
                  {renderArrowMarker()}
                  
                  {drawings.map((drawing) => {
                    switch (drawing.type) {
                      case "pen":
                        return (
                          <Path
                            key={drawing.id}
                            d={drawing.path}
                            stroke={drawing.color}
                            strokeWidth={drawing.strokeWidth}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        );
                      case "circle":
                        return (
                          <Circle
                            key={drawing.id}
                            cx={drawing.centerX}
                            cy={drawing.centerY}
                            r={drawing.radius}
                            stroke={drawing.color}
                            strokeWidth={drawing.strokeWidth}
                            fill="none"
                          />
                        );
                      case "line":
                        return (
                          <Line
                            key={drawing.id}
                            x1={drawing.startX}
                            y1={drawing.startY}
                            x2={drawing.endX}
                            y2={drawing.endY}
                            stroke={drawing.color}
                            strokeWidth={drawing.strokeWidth}
                          />
                        );
                      case "arrow":
                        return (
                          <Line
                            key={drawing.id}
                            x1={drawing.startX}
                            y1={drawing.startY}
                            x2={drawing.endX}
                            y2={drawing.endY}
                            stroke={drawing.color}
                            strokeWidth={drawing.strokeWidth}
                            markerEnd="url(#arrowhead)"
                          />
                        );
                      default:
                        return null;
                    }
                  })}
                  
                  {/* Current drawing preview */}
                  {isDrawing && currentTool === "pen" && currentPath && (
                    <Path
                      d={currentPath}
                      stroke={currentColor}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </Svg>
              </View>
            </PanGestureHandler>
          </View>

          <View style={[styles.toolsContainer, { paddingBottom: insets.bottom + 50 }]}>
            <View style={styles.toolsRow}>
              <Text style={styles.toolsLabel}>Tools:</Text>
              <Pressable
                style={[styles.toolButton, currentTool === "pen" && styles.activeToolButton]}
                onPress={() => selectTool("pen")}
              >
                <Pen color={currentTool === "pen" ? Colors.background : Colors.text} size={18} />
              </Pressable>
              <Pressable
                style={[styles.toolButton, currentTool === "circle" && styles.activeToolButton]}
                onPress={() => selectTool("circle")}
              >
                <CircleIcon color={currentTool === "circle" ? Colors.background : Colors.text} size={18} />
              </Pressable>
              <Pressable
                style={[styles.toolButton, currentTool === "arrow" && styles.activeToolButton]}
                onPress={() => selectTool("arrow")}
              >
                <ArrowRight color={currentTool === "arrow" ? Colors.background : Colors.text} size={18} />
              </Pressable>
              <Pressable
                style={[styles.toolButton, currentTool === "line" && styles.activeToolButton]}
                onPress={() => selectTool("line")}
              >
                <Minus color={currentTool === "line" ? Colors.background : Colors.text} size={18} />
              </Pressable>
            </View>

            <View style={styles.colorsRow}>
              <Text style={styles.toolsLabel}>Colors:</Text>
              {COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    currentColor === color && styles.activeColorButton,
                  ]}
                  onPress={() => selectColor(color)}
                />
              ))}
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionButton, styles.saveButton]}
                onPress={saveImage}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.background} size="small" />
                ) : (
                  <>
                    <Save color={Colors.background} size={16} />
                    <Text style={styles.actionButtonText}>Save</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.shareButton]}
                onPress={shareImage}
                disabled={saving}
              >
                <Share color={Colors.background} size={16} />
                <Text style={styles.actionButtonText}>Share</Text>
              </Pressable>
            </View>
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
    padding: 8,
    width: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
  },
  canvasContainer: {
    backgroundColor: Colors.cardBackground,
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    marginHorizontal: 2,
  },
  image: {
    width: "100%",
    backgroundColor: Colors.cardBackground,
  },
  svgContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  svg: {
    flex: 1,
  },
  toolsContainer: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  toolsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  toolsLabel: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 8,
    width: 50,
  },
  toolButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  activeToolButton: {
    backgroundColor: Colors.primary,
  },
  colorsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  colorButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeColorButton: {
    borderColor: Colors.text,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  shareButton: {
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    color: Colors.background,
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 14,
  },
});