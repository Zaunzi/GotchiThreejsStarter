import * as THREE from 'three';

const MOVE_SPEED = 8;
const MOUSE_SENSITIVITY = 0.002;
const PITCH_MIN = -0.4;
const PITCH_MAX = 0.4;
const CAMERA_DISTANCE = 6;
const CAMERA_HEIGHT = 2.5;

export class ThirdPersonController {
	private position: THREE.Vector3;
	private yaw: number;
	private pitch: number;
	/** Freelook: camera-only rotation (character does not rotate). */
	private freelookYaw: number;
	private freelookPitch: number;
	private freelookActive: boolean;
	private keys: { w: boolean; a: boolean; s: boolean; d: boolean };
	private mouseDeltaX: number;
	private mouseDeltaY: number;

	constructor(initialPosition: THREE.Vector3) {
		this.position = initialPosition.clone();
		this.yaw = 0;
		this.pitch = 0;
		this.freelookYaw = 0;
		this.freelookPitch = 0;
		this.freelookActive = false;
		this.keys = { w: false, a: false, s: false, d: false };
		this.mouseDeltaX = 0;
		this.mouseDeltaY = 0;
	}

	/** Hold right-click to look around without rotating the character. Release to snap camera back behind. */
	setFreelookActive(active: boolean): void {
		if (active && !this.freelookActive) {
			this.freelookYaw = this.yaw;
			this.freelookPitch = this.pitch;
		}
		this.freelookActive = active;
	}

	getPosition(): THREE.Vector3 {
		return this.position;
	}

	/** Yaw angle in radians (rotation around Y). Use this to rotate the model so it faces the camera look direction. */
	getYaw(): number {
		return this.yaw;
	}

	setPosition(p: THREE.Vector3): void {
		this.position.copy(p);
	}

	onKeyDown(code: string): void {
		if (code === 'KeyW') this.keys.w = true;
		if (code === 'KeyA') this.keys.a = true;
		if (code === 'KeyS') this.keys.s = true;
		if (code === 'KeyD') this.keys.d = true;
	}

	onKeyUp(code: string): void {
		if (code === 'KeyW') this.keys.w = false;
		if (code === 'KeyA') this.keys.a = false;
		if (code === 'KeyS') this.keys.s = false;
		if (code === 'KeyD') this.keys.d = false;
	}

	onMouseMove(deltaX: number, deltaY: number): void {
		this.mouseDeltaX += deltaX;
		this.mouseDeltaY += deltaY;
	}

	update(dt: number, camera: THREE.PerspectiveCamera): void {
		if (this.freelookActive) {
			// Freelook: only camera rotates, character stays fixed
			this.freelookYaw -= this.mouseDeltaX * MOUSE_SENSITIVITY;
			this.freelookPitch += this.mouseDeltaY * MOUSE_SENSITIVITY;
			this.freelookPitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, this.freelookPitch));
		} else {
			// Normal: mouse rotates character and camera together
			this.yaw -= this.mouseDeltaX * MOUSE_SENSITIVITY;
			this.pitch += this.mouseDeltaY * MOUSE_SENSITIVITY;
			this.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, this.pitch));
		}
		this.mouseDeltaX = 0;
		this.mouseDeltaY = 0;

		// Movement always uses character yaw (W = character forward)
		const forwardX = Math.sin(this.yaw);
		const forwardZ = Math.cos(this.yaw);
		const rightX = Math.cos(this.yaw);
		const rightZ = -Math.sin(this.yaw);

		let dx = 0;
		let dz = 0;
		if (this.keys.w) {
			dx += forwardX;
			dz += forwardZ;
		}
		if (this.keys.s) {
			dx -= forwardX;
			dz -= forwardZ;
		}
		if (this.keys.a) {
			dx += rightX;
			dz += rightZ;
		}
		if (this.keys.d) {
			dx -= rightX;
			dz -= rightZ;
		}
		const len = Math.sqrt(dx * dx + dz * dz);
		if (len > 0) {
			dx = (dx / len) * MOVE_SPEED * dt;
			dz = (dz / len) * MOVE_SPEED * dt;
			this.position.x += dx;
			this.position.z += dz;
		}

		// Camera: use freelook angles when active, else character angles (snap back when released)
		const camYaw = this.freelookActive ? this.freelookYaw : this.yaw;
		const camPitch = this.freelookActive ? this.freelookPitch : this.pitch;
		const camOffsetX = -Math.sin(camYaw) * Math.cos(camPitch) * CAMERA_DISTANCE;
		const camOffsetZ = -Math.cos(camYaw) * Math.cos(camPitch) * CAMERA_DISTANCE;
		const camOffsetY = CAMERA_HEIGHT + Math.sin(camPitch) * CAMERA_DISTANCE;
		camera.position.set(
			this.position.x + camOffsetX,
			this.position.y + camOffsetY,
			this.position.z + camOffsetZ
		);
		camera.lookAt(this.position.x, this.position.y + 1, this.position.z);
	}
}
