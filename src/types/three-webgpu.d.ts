declare module 'three/addons/renderers/webgpu/WebGPURenderer.js' {
  import { WebGLRenderer } from 'three';

  export class WebGPURenderer extends WebGLRenderer {
    constructor(parameters?: any);
    init(): Promise<void>;
  }
}
