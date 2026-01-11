import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
  OnDestroy,
} from '@angular/core';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GaiaService } from '../data/gia.service';

@Component({
  selector: 'app-sky',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `],
})
export class Sky implements AfterViewInit, OnDestroy {
  @Input()
  set year(value: number) {
    this.currentYear = value;
    this.recreateStars();
  }

  @Input()
  set magLimit(value: number) {
    this.currentMagLimit = value;
    this.recreateStars();
  }

  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private starPoints?: THREE.Points;
  private sunMarker?: THREE.Mesh;
  private rawStarData: any[] = [];
  
  currentYear = 2025;
  currentMagLimit = 14.0;

  constructor(private gaia: GaiaService) {}

  async ngAfterViewInit() {
    this.initThree();
    this.createSunMarker();
    this.loadGaiaData();
    this.animate();
  }

  ngOnDestroy() {
    if (this.controls) this.controls.dispose();
    if (this.renderer) this.renderer.dispose();
    window.removeEventListener('resize', this.onResize);
  }

  private initThree() {
    const canvas = this.canvas.nativeElement;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);

    // Scene - Pure black
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Camera - Start FAR outside looking at the Sun
    this.camera = new THREE.PerspectiveCamera(60, width / height, 1, 100000);
    this.camera.position.set(0, 5000, 10000); // High and far

    // Controls - Orbit around the Sun at origin
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10; // Can zoom to Sun
    this.controls.maxDistance = 30000; // Can zoom very far
    this.controls.target.set(0, 0, 0); // Always looking at Sun

    window.addEventListener('resize', this.onResize);

    console.log('✅ Three.js initialized');
    console.log('📍 Camera position:', this.camera.position);
    console.log('🎯 Camera target:', this.controls.target);
  }

  private createSunMarker() {
    // Create a bright yellow sphere at the origin to mark the Sun
    const geometry = new THREE.SphereGeometry(20, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      // emissive: 0xffff00,
      // emissiveIntensity: 1
    });
    
    this.sunMarker = new THREE.Mesh(geometry, material);
    this.sunMarker.position.set(0, 0, 0);
    this.scene.add(this.sunMarker);

    console.log('☀️ Sun marker created at origin (0, 0, 0)');
  }

  private loadGaiaData() {
    console.log('🔄 Loading Gaia data...');
    
    this.gaia.fetchSample(50000).subscribe({
      next: (result) => {
        console.log('📦 Gaia response:', result);
        
        const columns = [
          'source_id', 'ra', 'dec', 'parallax',
          'pmra', 'pmdec', 'phot_g_mean_mag', 'bp_rp'
        ];

        this.rawStarData = result.data.map((row: number[]) => {
          const obj: any = {};
          columns.forEach((col, i) => {
            obj[col] = row[i];
          });
          return obj;
        });

        console.log(`✅ Loaded ${this.rawStarData.length} stars`);
        this.recreateStars();
      },
      error: (err) => {
        console.error('❌ Failed to load Gaia data:', err);
      }
    });
  }

  private recreateStars() {
    if (this.rawStarData.length === 0) {
      console.warn('⚠️ No star data available yet');
      return;
    }

    console.log(`🔨 Creating stars with magLimit=${this.currentMagLimit}`);

    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    let validStars = 0;
    let skippedStars = 0;

    for (const star of this.rawStarData) {
      // Skip invalid parallax
      if (!star.parallax || star.parallax <= 0) {
        skippedStars++;
        continue;
      }

      // Skip faint stars
      if (star.phot_g_mean_mag > this.currentMagLimit) {
        skippedStars++;
        continue;
      }

      // Calculate distance (parsecs)
      const distance = 1000 / star.parallax;
      if (!isFinite(distance) || distance > 10000 || distance < 0) {
        skippedStars++;
        continue;
      }

      // ⭐ CORRECT SPHERICAL CONVERSION
      // RA/Dec describe a DIRECTION on the celestial sphere
      // We need to place stars at that direction AND at their distance

      // Convert RA (0-360°) and Dec (-90 to +90°) to radians
      const ra_rad = (star.ra * Math.PI) / 180;
      const dec_rad = (star.dec * Math.PI) / 180;

      // Spherical to Cartesian conversion
      // This creates a SPHERE of stars around the origin (Sun)
      const x = distance * Math.cos(dec_rad) * Math.cos(ra_rad);
      const y = distance * Math.sin(dec_rad);
      const z = -distance * Math.cos(dec_rad) * Math.sin(ra_rad);

      // Sanity check
      if (![x, y, z].every(isFinite)) {
        skippedStars++;
        continue;
      }

      positions.push(x, y, z);

      // Pure white color
      colors.push(1, 1, 1);

      // Size based on magnitude (brighter = larger)
      const size = Math.max(1, 15 - star.phot_g_mean_mag);
      sizes.push(size);

      validStars++;
    }

    console.log(`✅ Created ${validStars} stars (skipped ${skippedStars})`);
    console.log(`📊 Position range:`, {
      minX: Math.min(...positions.filter((_, i) => i % 3 === 0)),
      maxX: Math.max(...positions.filter((_, i) => i % 3 === 0)),
      minY: Math.min(...positions.filter((_, i) => i % 3 === 1)),
      maxY: Math.max(...positions.filter((_, i) => i % 3 === 1)),
      minZ: Math.min(...positions.filter((_, i) => i % 3 === 2)),
      maxZ: Math.max(...positions.filter((_, i) => i % 3 === 2)),
    });

    if (validStars === 0) {
      console.error('❌ No valid stars created!');
      return;
    }

    // Remove old stars
    if (this.starPoints) {
      this.scene.remove(this.starPoints);
      this.starPoints.geometry.dispose();
      (this.starPoints.material as THREE.Material).dispose();
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    // Create material
    const material = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float size;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Distance-based sizing (stars get smaller when far away)
          float distance = length(mvPosition.xyz);
          gl_PointSize = size * (500.0 / distance);
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          // Circular point with soft edges
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    this.starPoints = new THREE.Points(geometry, material);
    this.scene.add(this.starPoints);

    console.log('⭐ Stars added to scene');
    console.log('🎬 Scene has', this.scene.children.length, 'objects');
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.controls.update();
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