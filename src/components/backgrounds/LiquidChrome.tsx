import { useRef, useEffect } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import './LiquidChrome.css';

type LiquidChromeProps = {
  baseColor?: [number, number, number];
  speed?: number;
  amplitude?: number;
  frequencyX?: number;
  frequencyY?: number;
  interactive?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export const LiquidChrome = ({
  baseColor = [0.1, 0.1, 0.1],
  speed = 0.2,
  amplitude = 0.3,
  frequencyX = 3,
  frequencyY = 3,
  interactive = true,
  ...props
}: LiquidChromeProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetColorRef = useRef<Float32Array>(new Float32Array(baseColor));

  // 当 baseColor 变化时，更新目标颜色
  useEffect(() => {
    targetColorRef.current[0] = baseColor[0];
    targetColorRef.current[1] = baseColor[1];
    targetColorRef.current[2] = baseColor[2];
  }, [baseColor]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    // 启用抗锯齿以提升视觉质量
    const renderer = new Renderer({ antialias: true });
    const gl = renderer.gl;
    gl.clearColor(1, 1, 1, 1);

    const vertexShader = `
      attribute vec2 position;
      attribute vec2 uv;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform float uTime;
      uniform vec3 uResolution;
      uniform vec3 uBaseColor;
      uniform float uAmplitude;
      uniform float uFrequencyX;
      uniform float uFrequencyY;
      uniform vec2 uMouse;
      varying vec2 vUv;

      vec4 renderImage(vec2 uvCoord) {
          vec2 fragCoord = uvCoord * uResolution.xy;
          vec2 uv = (2.0 * fragCoord - uResolution.xy) / min(uResolution.x, uResolution.y);

          // 恢复循环次数到6次，保持接近原始效果的视觉质量
          for (float i = 1.0; i < 6.0; i++){
              uv.x += uAmplitude / i * cos(i * uFrequencyX * uv.y + uTime + uMouse.x * 3.14159);
              uv.y += uAmplitude / i * cos(i * uFrequencyY * uv.x + uTime + uMouse.y * 3.14159);
          }

          // 恢复鼠标交互的ripple效果，但降低强度以减少计算
          vec2 diff = (uvCoord - uMouse);
          float dist = length(diff);
          float falloff = exp(-dist * 20.0);
          float ripple = sin(8.0 * dist - uTime * 1.5) * 0.02;
          uv += (diff / (dist + 0.0001)) * ripple * falloff;

          vec3 color = uBaseColor / abs(sin(uTime - uv.y - uv.x));
          return vec4(color, 1.0);
      }

      void main() {
          // 使用轻量级采样（3x3简化为十字形5点采样），平衡性能与视觉质量
          vec4 col = vec4(0.0);
          int samples = 0;
          for (int i = -1; i <= 1; i++){
              for (int j = -1; j <= 1; j++){
                  // 只采样中心点和十字形4点，减少采样数量但保持抗锯齿
                  if (i != 0 && j != 0) continue;
                  vec2 offset = vec2(float(i), float(j)) * (1.0 / min(uResolution.x, uResolution.y));
                  col += renderImage(vUv + offset);
                  samples++;
              }
          }
          gl_FragColor = col / float(samples);
      }
    `;

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new Float32Array([gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height])
        },
        uBaseColor: { value: new Float32Array(baseColor) },
        uAmplitude: { value: amplitude },
        uFrequencyX: { value: frequencyX },
        uFrequencyY: { value: frequencyY },
        uMouse: { value: new Float32Array([0, 0]) }
      }
    });
    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      // 平衡性能与质量：渲染分辨率设为0.7倍
      const scale = 0.7;
      renderer.setSize(container.offsetWidth * scale, container.offsetHeight * scale);
      const resUniform = program.uniforms.uResolution.value as Float32Array;
      resUniform[0] = gl.canvas.width;
      resUniform[1] = gl.canvas.height;
      resUniform[2] = gl.canvas.width / gl.canvas.height;
    }
    window.addEventListener('resize', resize);
    resize();

    function handleMouseMove(event: MouseEvent) {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;
      const mouseUniform = program.uniforms.uMouse.value as Float32Array;
      mouseUniform[0] = x;
      mouseUniform[1] = y;
    }

    function handleTouchMove(event: TouchEvent) {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        const rect = container.getBoundingClientRect();
        const x = (touch.clientX - rect.left) / rect.width;
        const y = 1 - (touch.clientY - rect.top) / rect.height;
        const mouseUniform = program.uniforms.uMouse.value as Float32Array;
        mouseUniform[0] = x;
        mouseUniform[1] = y;
      }
    }

    if (interactive) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('touchmove', handleTouchMove, { passive: true });
    }

    // 存储当前颜色用于平滑过渡
    const currentColor = new Float32Array(baseColor);
    
    // 帧率控制：限制在45fps，平衡性能与流畅度
    let animationId = 0;
    let lastFrameTime = 0;
    const targetFPS = 45;
    const frameInterval = 1000 / targetFPS;
    
    function update(t: number) {
      animationId = requestAnimationFrame(update);
      
      // 帧率控制：限制在45fps，平衡性能与流畅度
      const now = performance.now();
      if (now - lastFrameTime < frameInterval) {
        return;
      }
      lastFrameTime = now;
      
      program.uniforms.uTime.value = t * 0.001 * speed;
      
      // 优化：只在颜色变化明显时才更新uniform，减少GPU调用
      const colorUniform = program.uniforms.uBaseColor.value as Float32Array;
      let colorChanged = false;
      for (let i = 0; i < 3; i++) {
        const diff = targetColorRef.current[i] - currentColor[i];
        if (Math.abs(diff) > 0.001) {
          currentColor[i] += diff * 0.05; // 平滑过渡速度
          colorUniform[i] = currentColor[i];
          colorChanged = true;
        }
      }
      
      renderer.render({ scene: mesh });
    }
    animationId = requestAnimationFrame(update);

    container.appendChild(gl.canvas);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      if (interactive) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('touchmove', handleTouchMove);
      }
      if ((gl.canvas as HTMLCanvasElement).parentElement) {
        (gl.canvas as HTMLCanvasElement).parentElement!.removeChild(gl.canvas as HTMLCanvasElement);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [speed, amplitude, frequencyX, frequencyY, interactive]); // 移除 baseColor 依赖，因为我们用单独的 useEffect 处理

  return <div ref={containerRef} className="liquidChrome-container" {...props} />;
};

export default LiquidChrome;


