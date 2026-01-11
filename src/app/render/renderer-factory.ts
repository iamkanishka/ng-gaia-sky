import * as THREE from 'three';
import  WebGPURenderer  from 'three/src/renderers/webgpu/WebGPURenderer.js';

export async function createRenderer(
  canvas: HTMLCanvasElement
): Promise<THREE.WebGLRenderer> {

  // WebGPU detection
  const hasWebGPU =
    'gpu' in navigator &&
    (THREE as any).WebGPURenderer !== undefined;

  if (hasWebGPU) {
    try {
    

      const renderer = new WebGPURenderer({
        canvas,
        antialias: true
      });

      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      console.info('✅ Using WebGPU renderer');
      return renderer as unknown as THREE.WebGLRenderer;
    } catch (e) {
      console.warn('WebGPU failed, falling back to WebGL', e);
    }
  }

  // WebGL fallback
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  console.info('ℹ️ Using WebGL renderer');
  return renderer;
}
