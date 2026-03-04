import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ThirdPersonController } from './ThirdPersonController';

const GROUND_SIZE = 50;
const GROUND_COLOR = 0x6b21a8; // purple-700

export interface PlaySceneOptions {
	container: HTMLElement;
	glbUrl: string | null;
	onError?: (message: string) => void;
}

export interface PlayScene {
	dispose: () => void;
}

export function createPlayScene(options: PlaySceneOptions): PlayScene {
	const { container, glbUrl, onError } = options;

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x1e1b4b); // dark purple

	const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
	camera.position.set(0, 4, 8);
	camera.lookAt(0, 0, 0);

	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1;
	container.appendChild(renderer.domElement);

	// Purple ground
	const groundGeo = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE);
	const groundMat = new THREE.MeshStandardMaterial({
		color: GROUND_COLOR,
		metalness: 0.1,
		roughness: 0.8
	});
	const ground = new THREE.Mesh(groundGeo, groundMat);
	ground.rotation.x = -Math.PI / 2;
	ground.position.y = 0;
	scene.add(ground);

	// Ambient + directional light
	scene.add(new THREE.AmbientLight(0xffffff, 0.5));
	const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
	dirLight.position.set(10, 20, 10);
	dirLight.castShadow = true;
	scene.add(dirLight);

	const characterPosition = new THREE.Vector3(0, 0.5, 0);
	const controller = new ThirdPersonController(characterPosition);

	let gotchiMesh: THREE.Group | null = null;

	function resize(): void {
		const w = container.clientWidth;
		const h = container.clientHeight;
		renderer.setSize(w, h);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
	}

	resize();
	const resizeObserver = new ResizeObserver(resize);
	resizeObserver.observe(container);

	// Load GLB and place at character position
	if (glbUrl) {
		const loader = new GLTFLoader();
		loader.load(
			glbUrl,
		(gltf: { scene: THREE.Group }) => {
			gotchiMesh = gltf.scene;
				gotchiMesh.position.copy(characterPosition);
				gotchiMesh.scale.setScalar(0.5);
				scene.add(gotchiMesh);
			},
			undefined,
			(err: unknown) => {
				onError?.(err instanceof Error ? err.message : 'Failed to load GLB');
			}
		);
	} else {
		onError?.('No GLB URL');
	}

	// Pointer lock and controls
	let isLocked = false;
	const onCanvasClick = () => {
		if (isLocked) return;
		renderer.domElement.requestPointerLock();
	};
	const onPointerLockChange = () => {
		isLocked = document.pointerLockElement === renderer.domElement;
	};
	const onMouseMove = (e: MouseEvent) => {
		if (!isLocked) return;
		controller.onMouseMove(e.movementX, e.movementY);
	};
	const onMouseDown = (e: MouseEvent) => {
		if (e.button === 2) {
			e.preventDefault();
			controller.setFreelookActive(true);
		}
	};
	const onMouseUp = (e: MouseEvent) => {
		if (e.button === 2) {
			controller.setFreelookActive(false);
		}
	};
	const onContextMenu = (e: MouseEvent) => {
		e.preventDefault();
	};
	const onKeyDown = (e: KeyboardEvent) => controller.onKeyDown(e.code);
	const onKeyUp = (e: KeyboardEvent) => controller.onKeyUp(e.code);

	renderer.domElement.addEventListener('click', onCanvasClick);
	renderer.domElement.addEventListener('contextmenu', onContextMenu);
	renderer.domElement.addEventListener('mousedown', onMouseDown);
	document.addEventListener('mouseup', onMouseUp);
	document.addEventListener('pointerlockchange', onPointerLockChange);
	document.addEventListener('mousemove', onMouseMove);
	document.addEventListener('keydown', onKeyDown);
	document.addEventListener('keyup', onKeyUp);

	let lastTime = performance.now() / 1000;
	let rafId: number;

	function tick(): void {
		rafId = requestAnimationFrame(tick);
		const now = performance.now() / 1000;
		const dt = Math.min(now - lastTime, 0.1);
		lastTime = now;

		controller.update(dt, camera);
		const pos = controller.getPosition();
		const yaw = controller.getYaw();
		if (gotchiMesh) {
			gotchiMesh.position.copy(pos);
			// Rotate model to face the direction the camera is looking (third-person: character faces camera look-at)
			gotchiMesh.rotation.y = yaw;
		}

		renderer.render(scene, camera);
	}
	tick();

	return {
		dispose() {
			resizeObserver.disconnect();
			cancelAnimationFrame(rafId);
			document.exitPointerLock();
			renderer.domElement.removeEventListener('click', onCanvasClick);
			renderer.domElement.removeEventListener('contextmenu', onContextMenu);
			renderer.domElement.removeEventListener('mousedown', onMouseDown);
			document.removeEventListener('mouseup', onMouseUp);
			document.removeEventListener('pointerlockchange', onPointerLockChange);
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('keyup', onKeyUp);
			renderer.dispose();
			if (container.contains(renderer.domElement)) {
				container.removeChild(renderer.domElement);
			}
			groundGeo.dispose();
			groundMat.dispose();
		}
	};
}
