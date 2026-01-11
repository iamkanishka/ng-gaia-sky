import * as THREE from 'three';

/**
 * Creates an animated Sun material with:
 * - Hot yellow-white core
 * - Animated surface turbulence
 * - Corona glow effect
 */
export function createSunMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCoreColor: { value: new THREE.Color(0xfff4e0) },  // Hot white-yellow
      uCoronaColor: { value: new THREE.Color(0xff8800) }, // Orange corona
    },

    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;

      // 3D Simplex noise for turbulence
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;

        // Animated surface turbulence
        vec3 turbulence = position;
        float noise1 = snoise(turbulence * 2.0 + uTime * 0.3);
        float noise2 = snoise(turbulence * 4.0 - uTime * 0.5);
        float noise3 = snoise(turbulence * 8.0 + uTime * 0.7);
        
        float displacement = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2) * 10.0;
        
        vec3 newPosition = position + normal * displacement;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `,

    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;
      uniform vec3 uCoreColor;
      uniform vec3 uCoronaColor;

      // Simple noise for surface detail
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        
        return mix(
          mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
        );
      }

      void main() {
        // Fresnel effect (edge glow)
        vec3 viewDirection = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);

        // Animated surface turbulence
        float turbulence = noise(vPosition * 0.5 + uTime * 0.2);
        turbulence += noise(vPosition * 1.0 - uTime * 0.3) * 0.5;
        turbulence += noise(vPosition * 2.0 + uTime * 0.5) * 0.25;
        turbulence /= 1.75;

        // Core: Hot yellow-white with dark spots (sunspots)
        vec3 core = mix(
          uCoreColor * 0.6,  // Darker sunspots
          uCoreColor * 1.2,  // Bright surface
          turbulence
        );

        // Corona: Orange atmospheric glow at edges
        vec3 corona = uCoronaColor * fresnel * 2.0;

        // Combine
        vec3 finalColor = core + corona;

        // Add extra brightness for realism
        finalColor *= 1.5;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,

    side: THREE.FrontSide,
  });
}