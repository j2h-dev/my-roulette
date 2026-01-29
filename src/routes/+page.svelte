<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Matter from 'matter-js';

	let canvas: HTMLCanvasElement;
	let engine: Matter.Engine;
	let render: Matter.Render;
	let runner: Matter.Runner;

	// ⭐ 중요: static 폴더에 있는 이미지 파일명으로 바꿔주세요!
	// 만약 인터넷 주소를 쓴다면 "https://..." 를 넣으셔도 됩니다.
	// (Base64 문자열을 넣어도 작동합니다)
	const imageSource = '/map.jpg'; 

	onMount(async () => {
		engine = Matter.Engine.create();
		render = Matter.Render.create({
			canvas: canvas,
			engine: engine,
			options: { width: 600, height: 800, wireframes: false, background: '#222' }
		});

		// 벽 생성
		const wallOptions = { isStatic: true, render: { fillStyle: '#444' } };
		Matter.World.add(engine.world, [
			Matter.Bodies.rectangle(300, 790, 600, 20, wallOptions),
			Matter.Bodies.rectangle(10, 400, 20, 800, wallOptions),
			Matter.Bodies.rectangle(590, 400, 20, 800, wallOptions)
		]);

		try {
			// 이미지 로드 및 핀 생성
			const pins = await createPinsFromImage(imageSource);
			if (pins.length > 0) {
				Matter.World.add(engine.world, pins);
				console.log(`성공! ${pins.length}개의 핀이 생성되었습니다.`);
			} else {
				console.warn("이미지는 로드됐지만, 핀으로 만들 부분이 없습니다. (이미지가 너무 투명하거나 배경색과 같음)");
			}
		} catch (e) {
			console.error("이미지 불러오기 실패! 경로를 확인해주세요.", e);
		}

		// 공 계속 떨어뜨리기
		setInterval(() => {
			const ball = Matter.Bodies.circle(300 + (Math.random() - 0.5) * 40, 50, 8, {
				restitution: 0.9,
				render: { fillStyle: '#ffcc00' }
			});
			Matter.World.add(engine.world, ball);
		}, 800); // 0.8초마다 생성

		runner = Matter.Runner.create();
		Matter.Runner.run(runner, engine);
		Matter.Render.run(render);
	});

	onDestroy(() => {
		if (render) {
			Matter.Render.stop(render);
			if (runner) Matter.Runner.stop(runner);
		}
	});

	function createPinsFromImage(src: string): Promise<Matter.Body[]> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.src = src;
			
			img.onload = () => {
				const tempCanvas = document.createElement('canvas');
				const ctx = tempCanvas.getContext('2d');
				if (!ctx) return reject('Canvas Error');

				// 🎛️ 해상도 조절 (숫자가 클수록 더 세밀하게 표현됨, 30~50 추천)
				const DOT_DENSITY = 40; 
				const scale = DOT_DENSITY / img.width;
				const scaledWidth = Math.floor(img.width * scale);
				const scaledHeight = Math.floor(img.height * scale);

				tempCanvas.width = scaledWidth;
				tempCanvas.height = scaledHeight;
				ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

				const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight).data;
				const pins: Matter.Body[] = [];
				
				// 핀 간격 및 위치 설정
				const PIN_GAP = 12; // 핀 사이 간격
				const startX = (600 - (scaledWidth * PIN_GAP)) / 2;
				const startY = 150;

				for (let y = 0; y < scaledHeight; y++) {
					for (let x = 0; x < scaledWidth; x++) {
						const index = (y * scaledWidth + x) * 4;
						const r = imageData[index];
						const g = imageData[index + 1];
						const b = imageData[index + 2];
						const a = imageData[index + 3];

						// 🎯 조건: 투명하지 않으면(알파값 > 10) 무조건 핀 생성!
						// (흰색 배경인 이미지는 배경까지 핀이 될 수 있으니, 배경이 투명한 PNG가 제일 좋습니다)
						if (a > 10) { 
							const pin = Matter.Bodies.circle(startX + x * PIN_GAP, startY + y * PIN_GAP, 3, {
								isStatic: true,
								render: { fillStyle: `rgb(${r},${g},${b})` }
							});
							pins.push(pin);
						}
					}
				}
				resolve(pins);
			};
			
			img.onerror = () => reject(`이미지 로드 실패: '${src}' 경로를 찾을 수 없습니다.`);
		});
	}
</script>

<div class="game-container">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	:global(body) { margin: 0; padding: 0; background-color: #111; color: white; overflow: hidden; }
	.game-container { display: flex; justify-content: center; align-items: center; height: 100vh; }
</style>