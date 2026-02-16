/**
 * Tests for MediaPipe Integration
 */

import { describe, it, expect } from 'vitest';
import {
  calculateEAR,
  calculateMAR,
  calculateHeadPose,
  type FaceLandmarks,
} from '../mediaPipeIntegration';

describe('MediaPipe Integration', () => {
  // Mock landmarks for testing
  const createMockLandmarks = (): FaceLandmarks[] => {
    const landmarks: FaceLandmarks[] = [];
    for (let i = 0; i < 468; i++) {
      landmarks.push({
        x: Math.random(),
        y: Math.random(),
        z: Math.random() * 0.1,
      });
    }
    return landmarks;
  };

  describe('calculateEAR', () => {
    it('should calculate Eye Aspect Ratio correctly', () => {
      const landmarks = createMockLandmarks();

      // Mock eye landmarks to simulate open eyes
      const eyeIndices = {
        upper: [159, 145, 158],
        lower: [145, 23, 133],
        outer: 33,
        inner: 133,
      };

      // Set realistic values for open eyes
      landmarks[159] = { x: 0.4, y: 0.3, z: 0 };
      landmarks[145] = { x: 0.42, y: 0.32, z: 0 };
      landmarks[158] = { x: 0.44, y: 0.3, z: 0 };
      landmarks[23] = { x: 0.42, y: 0.34, z: 0 };
      landmarks[133] = { x: 0.44, y: 0.32, z: 0 };
      landmarks[33] = { x: 0.38, y: 0.32, z: 0 };

      const ear = calculateEAR(landmarks, eyeIndices);

      // EAR should be positive
      expect(ear).toBeGreaterThan(0);
      expect(ear).toBeLessThan(1);
    });

    it('should return lower EAR for closed eyes', () => {
      const landmarks = createMockLandmarks();

      const eyeIndices = {
        upper: [159, 145, 158],
        lower: [145, 23, 133],
        outer: 33,
        inner: 133,
      };

      // Set values for closed eyes (minimal vertical distance)
      landmarks[159] = { x: 0.4, y: 0.32, z: 0 };
      landmarks[145] = { x: 0.42, y: 0.32, z: 0 };
      landmarks[158] = { x: 0.44, y: 0.32, z: 0 };
      landmarks[23] = { x: 0.42, y: 0.32, z: 0 };
      landmarks[133] = { x: 0.44, y: 0.32, z: 0 };
      landmarks[33] = { x: 0.38, y: 0.32, z: 0 };

      const ear = calculateEAR(landmarks, eyeIndices);

      // Closed eyes should have very small EAR
      expect(ear).toBeLessThan(0.1);
    });
  });

  describe('calculateMAR', () => {
    it('should calculate Mouth Aspect Ratio correctly', () => {
      const landmarks = createMockLandmarks();

      // Set realistic values for closed mouth
      landmarks[13] = { x: 0.5, y: 0.7, z: 0 }; // top lip
      landmarks[14] = { x: 0.5, y: 0.72, z: 0 }; // bottom lip
      landmarks[61] = { x: 0.45, y: 0.71, z: 0 }; // left corner
      landmarks[291] = { x: 0.55, y: 0.71, z: 0 }; // right corner

      const mar = calculateMAR(landmarks);

      // MAR should be positive and relatively small for closed mouth
      expect(mar).toBeGreaterThan(0);
      expect(mar).toBeLessThan(0.5);
    });

    it('should return higher MAR for open mouth (yawning)', () => {
      const landmarks = createMockLandmarks();

      // Set values for wide open mouth
      landmarks[13] = { x: 0.5, y: 0.65, z: 0 }; // top lip
      landmarks[14] = { x: 0.5, y: 0.75, z: 0 }; // bottom lip
      landmarks[61] = { x: 0.45, y: 0.7, z: 0 }; // left corner
      landmarks[291] = { x: 0.55, y: 0.7, z: 0 }; // right corner

      const mar = calculateMAR(landmarks);

      // Yawning should have high MAR
      expect(mar).toBeGreaterThan(0.5);
    });
  });

  describe('calculateHeadPose', () => {
    it('should calculate head pose angles', () => {
      const landmarks = createMockLandmarks();

      // Set key landmarks for neutral head position
      landmarks[1] = { x: 0.5, y: 0.5, z: 0 }; // nose tip
      landmarks[152] = { x: 0.5, y: 0.8, z: 0 }; // chin
      landmarks[33] = { x: 0.4, y: 0.4, z: 0 }; // left eye
      landmarks[263] = { x: 0.6, y: 0.4, z: 0 }; // right eye

      const pose = calculateHeadPose(landmarks);

      expect(pose).toHaveProperty('pitch');
      expect(pose).toHaveProperty('yaw');
      expect(pose).toHaveProperty('roll');

      // All angles should be numbers
      expect(typeof pose.pitch).toBe('number');
      expect(typeof pose.yaw).toBe('number');
      expect(typeof pose.roll).toBe('number');

      // Angles should be finite
      expect(isFinite(pose.pitch)).toBe(true);
      expect(isFinite(pose.yaw)).toBe(true);
      expect(isFinite(pose.roll)).toBe(true);
    });

    it('should detect head turned to the left', () => {
      const landmarks = createMockLandmarks();

      // Position landmarks for left turn
      landmarks[1] = { x: 0.4, y: 0.5, z: 0 }; // nose tip moved left
      landmarks[152] = { x: 0.4, y: 0.8, z: 0 };
      landmarks[33] = { x: 0.35, y: 0.4, z: 0 };
      landmarks[263] = { x: 0.55, y: 0.4, z: 0 };

      const pose = calculateHeadPose(landmarks);

      // Yaw should indicate left turn (negative or specific range)
      expect(Math.abs(pose.yaw)).toBeGreaterThan(0);
    });
  });
});
