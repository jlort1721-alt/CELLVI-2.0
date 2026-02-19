/**
 * MediaPipe Integration for Real-Time Face Detection
 *
 * This module provides integration with MediaPipe FaceMesh for real-time
 * facial landmark detection, enabling accurate fatigue monitoring through:
 * - Eye Aspect Ratio (EAR) calculation
 * - Yawn detection via mouth opening
 * - Head pose estimation
 * - Micro-sleep detection
 *
 * @requires @mediapipe/face_mesh
 * @requires @mediapipe/camera_utils
 */

import { env } from '@/config/env';

// Types for MediaPipe results
export interface FaceLandmarks {
  x: number;
  y: number;
  z: number;
}

export interface MediaPipeResults {
  multiFaceLandmarks?: FaceLandmarks[][];
  image?: HTMLVideoElement;
}

export interface EyeLandmarks {
  leftEye: FaceLandmarks[];
  rightEye: FaceLandmarks[];
}

export interface MouthLandmarks {
  topLip: FaceLandmarks;
  bottomLip: FaceLandmarks;
  leftCorner: FaceLandmarks;
  rightCorner: FaceLandmarks;
}

/**
 * MediaPipe Face Mesh Configuration
 */
const MEDIAPIPE_CONFIG = {
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
};

/**
 * Landmark indices for eye detection
 * Based on MediaPipe Face Mesh 468 landmarks
 */
const EYE_LANDMARKS = {
  LEFT_EYE: {
    upper: [159, 145, 158],
    lower: [145, 23, 133],
    outer: 33,
    inner: 133,
  },
  RIGHT_EYE: {
    upper: [386, 374, 385],
    lower: [374, 253, 362],
    outer: 263,
    inner: 362,
  },
};

/**
 * Landmark indices for mouth detection
 */
const MOUTH_LANDMARKS = {
  TOP_LIP: 13,
  BOTTOM_LIP: 14,
  LEFT_CORNER: 61,
  RIGHT_CORNER: 291,
};

/**
 * Calculate Euclidean distance between two 3D points
 */
function euclideanDistance(p1: FaceLandmarks, p2: FaceLandmarks): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate Eye Aspect Ratio (EAR)
 *
 * EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
 *
 * Where:
 * - p1, p4 are horizontal eye corners
 * - p2, p3, p5, p6 are vertical eye points
 *
 * Normal EAR: ~0.3
 * Closed eyes: <0.2
 *
 * @param landmarks - Array of facial landmarks
 * @param eyeIndices - Indices for specific eye
 * @returns Eye Aspect Ratio value
 */
export function calculateEAR(
  landmarks: FaceLandmarks[],
  eyeIndices: typeof EYE_LANDMARKS.LEFT_EYE
): number {
  const upperPoints = eyeIndices.upper.map(i => landmarks[i]);
  const lowerPoints = eyeIndices.lower.map(i => landmarks[i]);

  // Calculate vertical distances
  const verticalDist1 = euclideanDistance(upperPoints[0], lowerPoints[0]);
  const verticalDist2 = euclideanDistance(upperPoints[2], lowerPoints[2]);

  // Calculate horizontal distance
  const horizontalDist = euclideanDistance(
    landmarks[eyeIndices.outer],
    landmarks[eyeIndices.inner]
  );

  // EAR formula
  const ear = (verticalDist1 + verticalDist2) / (2.0 * horizontalDist);

  return ear;
}

/**
 * Calculate Mouth Aspect Ratio (MAR)
 *
 * MAR = ||top - bottom|| / ||left - right||
 *
 * Normal MAR: ~0.3-0.4
 * Yawning: >0.6
 *
 * @param landmarks - Array of facial landmarks
 * @returns Mouth Aspect Ratio value
 */
export function calculateMAR(landmarks: FaceLandmarks[]): number {
  const topLip = landmarks[MOUTH_LANDMARKS.TOP_LIP];
  const bottomLip = landmarks[MOUTH_LANDMARKS.BOTTOM_LIP];
  const leftCorner = landmarks[MOUTH_LANDMARKS.LEFT_CORNER];
  const rightCorner = landmarks[MOUTH_LANDMARKS.RIGHT_CORNER];

  const verticalDist = euclideanDistance(topLip, bottomLip);
  const horizontalDist = euclideanDistance(leftCorner, rightCorner);

  const mar = verticalDist / horizontalDist;

  return mar;
}

/**
 * Calculate head pose (pitch, yaw, roll) from facial landmarks
 *
 * Uses simplified 3D geometry from nose, chin, and eye landmarks
 *
 * @param landmarks - Array of facial landmarks
 * @returns Head pose angles in degrees
 */
export function calculateHeadPose(landmarks: FaceLandmarks[]): {
  pitch: number;
  yaw: number;
  roll: number;
} {
  // Key landmarks for pose estimation
  const noseTip = landmarks[1];
  const chin = landmarks[152];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  // Calculate yaw (left-right head turn)
  const eyeMidpoint = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
    z: (leftEye.z + rightEye.z) / 2,
  };

  const yaw = Math.atan2(noseTip.x - eyeMidpoint.x, noseTip.z - eyeMidpoint.z) * (180 / Math.PI);

  // Calculate pitch (up-down head tilt)
  const pitch = Math.atan2(noseTip.y - chin.y, noseTip.z - chin.z) * (180 / Math.PI);

  // Calculate roll (head rotation)
  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

  return {
    pitch: Math.round(pitch),
    yaw: Math.round(yaw),
    roll: Math.round(roll),
  };
}

/**
 * MediaPipe Face Mesh Wrapper Class
 *
 * Handles initialization, video processing, and landmark extraction
 */
export class MediaPipeFaceMesh {
  private faceMesh: any = null;
  private camera: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private isInitialized = false;
  private onResultsCallback: ((results: MediaPipeResults) => void) | null = null;

  constructor() {
    // Check if MediaPipe is configured
    if (!env.ai.mediapipe.useCdn && !env.ai.mediapipe.baseUrl) {
      console.warn('⚠️ MediaPipe not configured. Using simulated data.');
    }
  }

  /**
   * Initialize MediaPipe Face Mesh
   *
   * @param videoElement - HTML video element for camera feed
   * @param onResults - Callback function for processing results
   */
  async initialize(
    videoElement: HTMLVideoElement,
    onResults: (results: MediaPipeResults) => void
  ): Promise<void> {
    try {
      this.videoElement = videoElement;
      this.onResultsCallback = onResults;

      // Check if MediaPipe libraries are available
      // @ts-ignore - MediaPipe global
      if (typeof window.FaceMesh === 'undefined') {
        throw new Error(
          'MediaPipe FaceMesh not loaded. Please include the MediaPipe script in your HTML.'
        );
      }

      // @ts-ignore - MediaPipe global
      this.faceMesh = new window.FaceMesh({
        locateFile: (file: string) => {
          return `${env.ai.mediapipe.baseUrl}/${file}`;
        },
      });

      this.faceMesh.setOptions(MEDIAPIPE_CONFIG);
      this.faceMesh.onResults(this.handleResults.bind(this));

      // @ts-ignore - MediaPipe Camera
      this.camera = new window.Camera(videoElement, {
        onFrame: async () => {
          if (this.faceMesh) {
            await this.faceMesh.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Error initializing MediaPipe:', error);
      throw error;
    }
  }

  /**
   * Start camera and face detection
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MediaPipe not initialized. Call initialize() first.');
    }

    if (this.camera) {
      await this.camera.start();
    }
  }

  /**
   * Stop camera and face detection
   */
  stop(): void {
    if (this.camera) {
      this.camera.stop();
    }
  }

  /**
   * Handle MediaPipe results
   */
  private handleResults(results: MediaPipeResults): void {
    if (this.onResultsCallback) {
      this.onResultsCallback(results);
    }
  }

  /**
   * Extract fatigue metrics from MediaPipe results
   */
  extractFatigueMetrics(results: MediaPipeResults): {
    leftEAR: number;
    rightEAR: number;
    avgEAR: number;
    MAR: number;
    headPose: { pitch: number; yaw: number; roll: number };
    faceDetected: boolean;
  } | null {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return null;
    }

    const landmarks = results.multiFaceLandmarks[0];

    // Calculate Eye Aspect Ratios
    const leftEAR = calculateEAR(landmarks, EYE_LANDMARKS.LEFT_EYE);
    const rightEAR = calculateEAR(landmarks, EYE_LANDMARKS.RIGHT_EYE);
    const avgEAR = (leftEAR + rightEAR) / 2;

    // Calculate Mouth Aspect Ratio
    const MAR = calculateMAR(landmarks);

    // Calculate Head Pose
    const headPose = calculateHeadPose(landmarks);

    return {
      leftEAR,
      rightEAR,
      avgEAR,
      MAR,
      headPose,
      faceDetected: true,
    };
  }

  /**
   * Check if MediaPipe is available and configured
   */
  static isAvailable(): boolean {
    // @ts-ignore
    return typeof window.FaceMesh !== 'undefined';
  }
}

/**
 * Create and return MediaPipe instance
 * Returns null if MediaPipe is not available (falls back to simulation)
 */
export function createMediaPipeFaceMesh(): MediaPipeFaceMesh | null {
  if (MediaPipeFaceMesh.isAvailable()) {
    return new MediaPipeFaceMesh();
  }

  console.warn('⚠️ MediaPipe not available. Using simulated fatigue detection.');
  return null;
}

/**
 * Integration Instructions:
 *
 * 1. Add MediaPipe scripts to index.html:
 *
 * <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
 * <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"></script>
 * <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"></script>
 *
 * 2. Configure environment variables in .env:
 *
 * VITE_MEDIAPIPE_USE_CDN=true
 * VITE_MEDIAPIPE_BASE_URL=https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh
 *
 * 3. Use in FatigueMonitor component:
 *
 * const mediaPipe = createMediaPipeFaceMesh();
 * if (mediaPipe) {
 *   await mediaPipe.initialize(videoElement, (results) => {
 *     const metrics = mediaPipe.extractFatigueMetrics(results);
 *     if (metrics) {
 *       // Use real metrics from MediaPipe
 *       updateFatigueState(metrics);
 *     }
 *   });
 *   await mediaPipe.start();
 * }
 *
 * 4. Fallback to simulation if MediaPipe unavailable
 */
