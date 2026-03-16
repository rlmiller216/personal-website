import { describe, it, expect } from 'vitest';

/**
 * Pure function extracted from LetterSidebar's RAF loop.
 * Exponential decay interpolation — frame-rate independent.
 */
function smoothDamp(current: number, target: number, rate: number, dt: number): number {
	return current + (target - current) * (1 - Math.exp(-rate * dt));
}

describe('smoothDamp — exponential decay interpolation', () => {
	it('converges to target after many iterations', () => {
		let pos = 0;
		const target = 500;
		const rate = 5;
		const dt = 1 / 60; // 60fps

		for (let i = 0; i < 300; i++) {
			pos = smoothDamp(pos, target, rate, dt);
		}

		expect(pos).toBeCloseTo(target, 0); // within 0.5px
	});

	it('higher rate converges faster than lower rate', () => {
		const target = 400;
		const dt = 1 / 60;
		let fast = 0;
		let slow = 0;

		// Simulate 30 frames (~0.5s)
		for (let i = 0; i < 30; i++) {
			fast = smoothDamp(fast, target, 8, dt);
			slow = smoothDamp(slow, target, 3, dt);
		}

		// Fast (rate=8) should be closer to target than slow (rate=3)
		expect(Math.abs(target - fast)).toBeLessThan(Math.abs(target - slow));
	});

	it('cascading rates produce ordered positions after N frames', () => {
		const target = 300;
		const dt = 1 / 60;
		const rates = [8, 5, 3]; // R=snappy, L=moderate, M=floaty
		const positions = [0, 0, 0];

		for (let frame = 0; frame < 20; frame++) {
			for (let i = 0; i < 3; i++) {
				positions[i] = smoothDamp(positions[i], target, rates[i], dt);
			}
		}

		// R (rate=8) closest to target, then L (rate=5), then M (rate=3)
		expect(positions[0]).toBeGreaterThan(positions[1]);
		expect(positions[1]).toBeGreaterThan(positions[2]);
	});

	it('large dt does not overshoot target', () => {
		const current = 0;
		const target = 100;

		// dt=2.0 is absurdly large (simulates returning from backgrounded tab)
		const result = smoothDamp(current, target, 8, 2.0);

		expect(result).toBeLessThanOrEqual(target);
		expect(result).toBeGreaterThanOrEqual(current);
	});

	it('zero dt returns current unchanged', () => {
		const result = smoothDamp(42, 500, 8, 0);
		expect(result).toBe(42);
	});
});
