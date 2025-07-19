export interface VideoSource {
  id: string;
  uri: string;
  thumbnail?: string;
  name: string;
  duration?: number;
}

export interface ProSwing extends VideoSource {
  golfer: string;
  club: string;
  year?: number;
}