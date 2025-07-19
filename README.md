# SwingLab - Baseball Swing Analysis App

A React Native mobile application for comparing and analyzing baseball swings using side-by-side video comparison.

## 🏗️ Project Overview

SwingLab allows users to:
- Record their own baseball swings using the camera
- Compare their swings with professional player swings
- Use frame-by-frame analysis with synchronized playback
- Take screenshots and annotate them with drawing tools
- Import and crop videos to 1:1 aspect ratio for optimal comparison

## 🛠️ Tech Stack

- **Framework**: React Native with Expo (SDK 53)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand for video state
- **Backend**: Hono.js with tRPC
- **Styling**: React Native StyleSheet
- **Video**: Expo AV
- **Camera**: Expo Camera
- **Animations**: React Native Reanimated
- **Gestures**: React Native Gesture Handler
- **Drawing**: React Native SVG
- **Screenshots**: React Native View Shot

## 📱 App Structure

```
app/
├── (tabs)/
│   ├── index.tsx          # Main comparison screen
│   ├── pro-library.tsx    # Professional swings library
│   └── camera.tsx         # Camera tab (redirects to /camera)
├── camera.tsx             # Full-screen camera recording
└── _layout.tsx            # Root layout with providers

components/
├── VideoPlayer.tsx        # Individual video player with controls
├── PlaybackControls.tsx   # Play/pause/frame controls
├── ScrubberSlider.tsx     # Video timeline scrubber
├── ScreenshotButton.tsx   # Screenshot and annotation trigger
├── DrawingCanvas.tsx      # Annotation overlay with drawing tools
├── VideoCropper.tsx       # Video cropping interface
└── ResetButton.tsx        # Reset playback to start

hooks/
└── useVideoStore.ts       # Zustand store for video state

constants/
├── colors.ts              # App color scheme
└── proSwings.ts           # Sample professional swing data

backend/
├── hono.ts                # Hono server setup
└── trpc/                  # tRPC API routes
```

## 🎯 Key Features

### 1. Video Comparison Interface
- Side-by-side video comparison (top/bottom layout)
- Synchronized playback controls
- Frame-by-frame navigation
- Active video selection with visual indicators
- Video flipping (horizontal mirror)

### 2. Camera Recording
- Full-screen camera interface
- 1:1 aspect ratio overlay guide
- Press-and-hold recording (10-second max)
- Automatic video processing and storage

### 3. Video Controls
- Play/pause with visual feedback
- Scrubber slider for timeline navigation
- Frame-by-frame stepping (30fps assumed)
- Reset to beginning functionality

### 4. Screenshot & Annotation
- Capture current video frames
- Drawing tools: pen, circle, arrow, line
- Multiple colors and stroke widths
- Save to device gallery
- Share functionality

### 5. Pro Library
- Curated professional swing videos
- Import and crop custom pro videos
- Video cropping with pinch/pan gestures

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run start

# Start web version
npm run start-web
```

### Environment Variables
The app expects `EXPO_PUBLIC_RORK_API_BASE_URL` to be set for backend communication.

## 🎨 Design System

### Colors
- Background: `#121212` (dark theme)
- Card Background: `#1A1A1A`
- Primary: `#00FF00` (bright green)
- Text: `#FFFFFF`
- Secondary Text: `#A3A3A3`
- Border: `#333333`

### Layout
- 1:1 aspect ratio videos for optimal comparison
- Sticky controls at bottom of screen
- Safe area handling for all devices
- Responsive design for different screen sizes

## 📊 State Management

The app uses Zustand for state management with the following key state:

```typescript
interface VideoState {
  topVideo: VideoSource | null;      // Pro swing video
  bottomVideo: VideoSource | null;   // User's swing video
  isPlaying: boolean;                // Playback state
  topCurrentTime: number;            // Top video position
  bottomCurrentTime: number;         // Bottom video position
  activeVideo: "top" | "bottom";     // Which video is active
  topFlipped: boolean;               // Horizontal flip state
  bottomFlipped: boolean;            // Horizontal flip state
  // ... other state properties
}
```

## 🔧 Backend API

The backend uses Hono.js with tRPC for type-safe API communication:

- Health check: `GET /api/`
- tRPC routes: `POST /api/trpc/*`
- Example route: `example.hi` mutation

## 📱 Platform Compatibility

### Mobile (iOS/Android)
- Full feature support
- Haptic feedback
- Camera recording
- Media library access
- File system operations

### Web
- Limited camera functionality
- No haptic feedback
- Basic video playback
- Screenshot functionality works
- Some gesture limitations

## 🐛 Known Issues

1. **Video Controls Positioning**: Controls sometimes float too high above navigation bar
2. **Expo Crashes**: App may crash in Expo Go on some devices
3. **Video Cropping**: Cropping doesn't actually process video, just copies file
4. **FFmpeg Integration**: No actual video processing, needs custom development client

## 📝 Code Quality

- TypeScript throughout with strict typing
- Component composition and reusability
- Proper error handling and loading states
- Platform-specific code with fallbacks
- Accessibility considerations (haptic feedback, visual indicators)

## 🔒 Permissions Required

- Camera access (for recording)
- Media library access (for saving screenshots)
- File system access (for video storage)

## 🚢 Deployment

Currently configured for Expo managed workflow. For production deployment:

1. **Expo Application Services (EAS)**:
   ```bash
   eas build --platform all
   ```

2. **Custom Development Client** (recommended for FFmpeg):
   - Create custom development client with native modules
   - Integrate react-native-ffmpeg or similar
   - Build standalone apps

## 📚 Dependencies

Key dependencies and their purposes:

- `expo`: Core Expo SDK
- `expo-av`: Video playback
- `expo-camera`: Camera functionality
- `expo-image-picker`: Media selection
- `react-native-reanimated`: Smooth animations
- `react-native-gesture-handler`: Touch gestures
- `react-native-svg`: Drawing and annotations
- `zustand`: State management
- `@trpc/react-query`: Type-safe API calls
- `hono`: Lightweight backend framework

## 🤝 Contributing

The codebase follows these conventions:
- Functional components with hooks
- TypeScript interfaces for all data structures
- StyleSheet for styling (no external CSS libraries)
- File-based routing with Expo Router
- Component-based architecture with clear separation of concerns