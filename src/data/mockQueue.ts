export type FileStatus = "waiting" | "processing" | "processed" | "failed" | "waitingForProcessAfterFail";
export type FileType = "image" | "video" | "audio";

export interface QueueItem {
  id: string;
  fileName: string;
  fileType: FileType;
  fileSize: string;
  status: FileStatus;
  progress: number;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export const mockQueue: QueueItem[] = [
  { id: "q-001", fileName: "product_hero.png", fileType: "image", fileSize: "4.2 MB", status: "processed", progress: 100, queuedAt: "2026-03-13T09:10:00", startedAt: "2026-03-13T09:12:00", completedAt: "2026-03-13T09:12:34" },
  { id: "q-002", fileName: "brand_video_v2.mp4", fileType: "video", fileSize: "128 MB", status: "processing", progress: 67, queuedAt: "2026-03-13T09:14:00", startedAt: "2026-03-13T09:15:00" },
  { id: "q-003", fileName: "podcast_ep42.wav", fileType: "audio", fileSize: "85 MB", status: "failed", progress: 23, queuedAt: "2026-03-13T08:40:00", startedAt: "2026-03-13T08:45:00", error: "Timeout: превышен лимит обработки" },
  { id: "q-004", fileName: "banner_wide.jpg", fileType: "image", fileSize: "2.1 MB", status: "processed", progress: 100, queuedAt: "2026-03-13T08:28:00", startedAt: "2026-03-13T08:30:00", completedAt: "2026-03-13T08:30:12" },
  { id: "q-005", fileName: "social_reel.mp4", fileType: "video", fileSize: "45 MB", status: "processing", progress: 34, queuedAt: "2026-03-13T09:18:00", startedAt: "2026-03-13T09:20:00" },
  { id: "q-006", fileName: "voice_clone_sample.mp3", fileType: "audio", fileSize: "12 MB", status: "processed", progress: 100, queuedAt: "2026-03-13T07:48:00", startedAt: "2026-03-13T07:50:00", completedAt: "2026-03-13T07:51:05" },
  { id: "q-007", fileName: "texture_map_4k.png", fileType: "image", fileSize: "18 MB", status: "processing", progress: 89, queuedAt: "2026-03-13T09:02:00", startedAt: "2026-03-13T09:05:00" },
  { id: "q-008", fileName: "interview_raw.mp4", fileType: "video", fileSize: "512 MB", status: "failed", progress: 5, queuedAt: "2026-03-13T05:55:00", startedAt: "2026-03-13T06:00:00", error: "Файл слишком большой: макс. 500 MB" },
  { id: "q-009", fileName: "logo_variations.svg", fileType: "image", fileSize: "0.8 MB", status: "processed", progress: 100, queuedAt: "2026-03-13T08:58:00", startedAt: "2026-03-13T09:00:00", completedAt: "2026-03-13T09:00:08" },
  { id: "q-010", fileName: "ambient_track.flac", fileType: "audio", fileSize: "34 MB", status: "processing", progress: 52, queuedAt: "2026-03-13T09:15:00", startedAt: "2026-03-13T09:18:00" },
  { id: "q-011", fileName: "promo_cut_final.mp4", fileType: "video", fileSize: "67 MB", status: "processed", progress: 100, queuedAt: "2026-03-13T07:55:00", startedAt: "2026-03-13T08:00:00", completedAt: "2026-03-13T08:05:22" },
  { id: "q-012", fileName: "narration_take3.wav", fileType: "audio", fileSize: "22 MB", status: "failed", progress: 78, queuedAt: "2026-03-13T09:08:00", startedAt: "2026-03-13T09:10:00", error: "Ошибка модели: некорректный формат аудио" },
  { id: "q-013", fileName: "avatar_3d_render.png", fileType: "image", fileSize: "9.5 MB", status: "processed", progress: 100, queuedAt: "2026-03-13T07:30:00", startedAt: "2026-03-13T07:32:00", completedAt: "2026-03-13T07:33:15" },
  { id: "q-014", fileName: "cinematic_intro.mp4", fileType: "video", fileSize: "220 MB", status: "processing", progress: 12, queuedAt: "2026-03-13T09:22:00", startedAt: "2026-03-13T09:25:00" },
  { id: "q-015", fileName: "sfx_explosion.wav", fileType: "audio", fileSize: "5 MB", status: "processed", progress: 100, queuedAt: "2026-03-13T06:40:00", startedAt: "2026-03-13T06:42:00", completedAt: "2026-03-13T06:42:30" },
  { id: "q-016", fileName: "thumbnail_yt.jpg", fileType: "image", fileSize: "1.2 MB", status: "processed", progress: 100, queuedAt: "2026-03-13T09:01:00", startedAt: "2026-03-13T09:02:00", completedAt: "2026-03-13T09:02:04" },
  { id: "q-017", fileName: "demo_reel_2026.mp4", fileType: "video", fileSize: "340 MB", status: "failed", progress: 0, queuedAt: "2026-03-13T05:00:00", error: "Не удалось начать обработку" },
  { id: "q-018", fileName: "jingle_v5.mp3", fileType: "audio", fileSize: "3.8 MB", status: "processed", progress: 100, queuedAt: "2026-03-13T08:10:00", startedAt: "2026-03-13T08:12:00", completedAt: "2026-03-13T08:12:18" },
  { id: "q-019", fileName: "bg_pattern_tile.png", fileType: "image", fileSize: "1.5 MB", status: "waiting", progress: 0, queuedAt: "2026-03-13T09:30:00" },
  { id: "q-020", fileName: "customer_testimonial.mp4", fileType: "video", fileSize: "95 MB", status: "waiting", progress: 0, queuedAt: "2026-03-13T09:31:00" },
  { id: "q-021", fileName: "notification_chime.wav", fileType: "audio", fileSize: "0.4 MB", status: "waiting", progress: 0, queuedAt: "2026-03-13T09:32:00" },
  { id: "q-022", fileName: "clip_corrupted.mp4", fileType: "video", fileSize: "55 MB", status: "waitingForProcessAfterFail", progress: 0, queuedAt: "2026-03-13T09:35:00", error: "Предыдущая ошибка: таймаут" },
  { id: "q-023", fileName: "audio_glitch.wav", fileType: "audio", fileSize: "8 MB", status: "waitingForProcessAfterFail", progress: 0, queuedAt: "2026-03-13T09:36:00", error: "Предыдущая ошибка: некорректный формат" },
];
