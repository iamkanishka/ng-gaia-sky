import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';

import * as THREE from 'three';

import { GaiaService } from '../data/gia.service';

@Component({
  selector: 'app-sky',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [`
    canvas {
      display: block;
      width: 100vw;
      height: 100vh;
    }
  `]
})
export class Sky implements AfterViewInit {
  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;


  constructor(private gaia: GaiaService) {}



  ngAfterViewInit() {
  this.initThree();
  this.animate();
  window.addEventListener('resize', this.onResize);

  this.gaia.fetchSample(500).subscribe(result => {
    console.log('Gaia DR3 sample:', result);
  });
}


  private initThree() {
    const canvas = this.canvas.nativeElement;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070b); // Gaia-like dark sky

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1e7
    );
    this.camera.position.z = 5;

    // Simple reference object (temporary)
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4fc3f7,
      wireframe: true
    });
    const sphere = new THREE.Mesh(geometry, material);
    this.scene.add(sphere);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  private onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };
}
