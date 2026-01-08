import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';

import * as THREE from 'three';

import { GaiaService } from '../data/gia.service';

import { radecToGalactic, galacticToCartesian } from '../astro/coordinates';

import { toObserverFrame } from '../astro/observer';

import { absoluteMagnitude, apparentMagnitude, fluxFromMagnitude } from '../astro/photometry';

import { galacticDensity } from '../astro/galaxy-model';

import { extinctionMagnitude, reddenBpRp } from '../astro/extinction';

import { passesGaiaSelection } from '../astro/selection';

import { noisyMagnitude } from '../astro/noise';

import { yearsSinceEpoch } from '../astro/time';

import { angularUncertainty, spatialUncertainty } from '../astro/uncertainty';

import { createStarMaterial } from '../render/star-material';

import { ExoplanetService } from '../data/exoplanet.service';

import { AdsService } from '../data/ads.service';

@Component({
  selector: 'app-sky',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [
    `
      canvas {
        display: block;
        width: 100vw;
        height: 100vh;
      }
    `,
  ],
})
export class Sky implements AfterViewInit {
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.clearFocus();
    }
  }

  @Input()
  set year(value: number) {
    this.setYear(value);
  }

  @Input()
  set magLimit(value: number) {
    this.currentMagLimit = value;
    if (this.latestStars) {
      this.worker.postMessage({
        stars: this.latestStars,
        year: this.currentYear,
        magLimit: this.currentMagLimit,
        exoHosts: Array.from(this.exoplanetHosts),
      });
    }
  }

  @Output()
  starSelected = new EventEmitter<any>();

  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private starPoints?: THREE.Points;

  currentYear = 2025;

  showUncertainty = false;

  private latestStars: any[] | null = null;

  private worker!: Worker;

  currentMagLimit = 6.0;

  private exoplanetHosts = new Set<string>();

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  selectedStarIndex: number | null = null;
  selectedStarData: any | null = null;

  focusedIndex: number | null = null;

  private starMaterial: THREE.ShaderMaterial | null = null;

  constructor(
    private gaia: GaiaService,
    private exoplanets: ExoplanetService,
    private ads: AdsService
  ) {}

  ngAfterViewInit() {
    this.initThree();
    this.worker = new Worker(new URL('../worker/star.worker', import.meta.url), { type: 'module' });

    this.worker.onmessage = ({ data }) => {
      this.updateStarGeometry(data.positions, data.colors, data.hostFlags);
    };
    this.animate();
    window.addEventListener('resize', this.onResize);

    // this.gaia.fetchSample(2000).subscribe((result) => {
    //   this.latestStars = result.data;
    //   this.createStarPoints(result.data);
    // });

    this.exoplanets.loadHostIndex().subscribe((set) => {
      this.exoplanetHosts = set;
    });

    this.gaia.fetchSample(2000).subscribe((result) => {
      this.latestStars = result.data;
      this.worker.postMessage({
        stars: result.data,
        year: this.currentYear,
        magLimit: this.currentMagLimit,
        exoHosts: Array.from(this.exoplanetHosts),
      });
    });
    this.canvas.nativeElement.addEventListener('click', this.onClick);
  }

  private initThree() {
    const canvas = this.canvas.nativeElement;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.6;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070b); // Gaia-like dark sky

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1e7);
    this.camera.position.z = 5;

    // Simple reference object (temporary)
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4fc3f7,
      wireframe: true,
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

  private createStarPoints(stars: any[]) {
    const positions: number[] = [];
    const colors: number[] = [];

    const years = yearsSinceEpoch(this.currentYear);

    for (const s of stars) {
      // 🚨 Parallax validation
      if (s.parallax == null || !isFinite(s.parallax) || s.parallax <= 0) continue;

      const distancePc = Math.min(10000, 1000 / s.parallax);

      const ra = s.ra + ((s.pmra ?? 0) * years) / (1000 * 3600);
      const dec = s.dec + ((s.pmdec ?? 0) * years) / (1000 * 3600);

      // Coordinates
      const { l, b } = radecToGalactic(ra, dec);
      const [gx, gy, gz] = galacticToCartesian(l, b, distancePc);
      const [x, y, z] = toObserverFrame(gx, gy, gz);

      if (![x, y, z].every(Number.isFinite)) continue;

      // Absolute magnitude
      const M = absoluteMagnitude(s.phot_g_mean_mag, distancePc);
      if (!isFinite(M)) continue;

      // Extinction (in magnitudes)
      const A = extinctionMagnitude(distancePc, z);
      if (!isFinite(A)) continue;

      // Apparent magnitude INCLUDING extinction
      const m0 = apparentMagnitude(M, distancePc, A);
      const m = noisyMagnitude(m0);

      if (!isFinite(m)) continue;

      // Gaia selection
      if (!passesGaiaSelection(m)) {
        continue;
      }

      // Convert to flux
      const baseFlux = fluxFromMagnitude(m);

      // Galactic density modulation
      const density = galacticDensity(x, y, z);
      const flux = baseFlux * density;
      if (!isFinite(flux)) continue;

      // Temporary display scaling
      const brightness = Math.min(1, flux * 3e5);

      positions.push(x, y, z);

      const bpRp = reddenBpRp(s.bp_rp ?? 0.8, A);

      // Simple color mapping (temporary)
      const r = Math.min(1, brightness * (1 + bpRp * 0.2));
      const g = Math.min(1, brightness);
      const cb = Math.min(1, brightness * (1 - bpRp * 0.1));

      colors.push(r, g, cb);
      colors.push(brightness, brightness, brightness);

      // ------------------------------------------------------------------
      // 10.6 OPTIONAL: compute uncertainty per star (NOT rendered here)
      // ------------------------------------------------------------------
      const angSigma = angularUncertainty(s.ra_error ?? 0, s.pmra_error ?? 0, years);

      const sigmaR = spatialUncertainty(angSigma, distancePc);
      // (intentionally unused unless debug rendering is enabled)
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    geometry.computeBoundingSphere(); // now SAFE

    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      sizeAttenuation: true,
    });

    if (this.starPoints) {
      this.scene.remove(this.starPoints);
      this.starPoints.geometry.dispose();
    }

    this.starPoints = new THREE.Points(geometry, material);
    this.scene.add(this.starPoints);

    // ------------------------------------------------------------------
    // 10.5 OPTIONAL: render uncertainty for ONE star (safe debug mode)
    // ------------------------------------------------------------------
    if (this.showUncertainty && stars.length > 0 && positions.length >= 3) {
      const s = stars[0];

      if (s.parallax && s.parallax > 0) {
        const distancePc = 1000 / s.parallax;
        const years = yearsSinceEpoch(this.currentYear);

        const angSigma = angularUncertainty(s.ra_error ?? 0, s.pmra_error ?? 0, years);

        const radius = spatialUncertainty(angSigma, distancePc);

        const cone = this.createUncertaintyCone(radius, radius * 4);

        cone.position.set(positions[0], positions[1], positions[2]);

        this.scene.add(cone);
      }
    }

    this.camera.position.z = 4000;
  }

  public setYear(year: number) {
    this.currentYear = year;
    if (this.latestStars) {
      this.worker.postMessage({
        stars: this.latestStars,
        year: this.currentYear,
        magLimit: this.currentMagLimit,
        exoHosts: Array.from(this.exoplanetHosts),
      });
    }
  }

  private createUncertaintyCone(radius: number, length: number): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(radius, length, 8, 1, true);
    const material = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    return new THREE.Mesh(geometry, material);
  }

  private updateStarGeometry(
    positions: Float32Array,
    colors: Float32Array,
    hostFlags: Float32Array
  ) {
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    geometry.setAttribute('host', new THREE.BufferAttribute(hostFlags, 1));

    const material = createStarMaterial();
    this.starMaterial = material;

    if (this.starPoints) {
      this.scene.remove(this.starPoints);
    }

    this.starPoints = new THREE.Points(geometry, material);
    this.scene.add(this.starPoints);

    this.camera.position.z = 4000;
  }

  private onClick = (event: MouseEvent) => {
    const rect = this.canvas.nativeElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (!this.starPoints) return;

    const intersects = this.raycaster.intersectObject(this.starPoints);

    if (intersects.length > 0) {
      this.selectStar(intersects[0].index!);
    }
  };

  // private selectStar(index: number) {
  //   if (!this.latestStars) return;

  //   const star = this.latestStars[index];
  //   this.selectedStarIndex = index;
  //   this.selectedStarData = star;

  //   // Example: use Gaia ID or known name later
  //   this.ads.searchByObjectName(`Gaia DR3 ${star.source_id}`).subscribe((res) => {
  //     this.selectedStarData.papers = res.response.docs;
  //   });
  // }

  private selectStar(index: number) {
    if (!this.latestStars) return;

    this.focusedIndex = index;
    const star = this.latestStars[index];

    this.starSelected.emit(star);
    if (this.starMaterial) {
  this.starMaterial.uniforms['uFocusIndex'].value = index;
}
  }

  private clearFocus() {
    this.focusedIndex = null;
    this.starSelected.emit(null);
    if (this.starMaterial) {
  this.starMaterial.uniforms['uFocusIndex'].value = -1;
}
  }
}
