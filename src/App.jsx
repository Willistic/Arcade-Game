import React, { useRef, useEffect, useState } from "react";

// ------------------
// Game Engine Classes
// ------------------
class GameObject {
	constructor(x, y, size, color) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.color = color;
	}

	update(dt, game) {}
	draw(ctx) {}
}

class Particle extends GameObject {
	constructor(x, y, size, color, vx, vy, life = 0.5, gravity = 0) {
		super(x, y, size, color);
		this.vx = vx;
		this.vy = vy;
		this.life = life;
		this.alpha = 1;
		this.gravity = gravity;
		this.rotation = Math.random() * Math.PI * 2;
		this.rotationSpeed = (Math.random() - 0.5) * 0.2;
	}

	update(dt) {
		this.vy += this.gravity * dt;
		this.x += this.vx * dt * 60;
		this.y += this.vy * dt * 60;
		this.rotation += this.rotationSpeed;
		this.life -= dt;
		this.alpha = Math.max(0, this.life / 0.5);
	}

	draw(ctx) {
		ctx.save();
		ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
		ctx.rotate(this.rotation);
		ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
		ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
		ctx.restore();
	}

	isDead() {
		return this.life <= 0;
	}
}

class Player extends GameObject {
	constructor(x, y, size) {
		super(x, y, size, "blue");
		this.vx = 0;
		this.vy = 0;
		this.speed = 200 / 60;
		this.invincible = false;
	}

	update(dt, game) {
		this.x += this.vx * dt * 60;
		this.y += this.vy * dt * 60;

		// Keep inside canvas
		this.x = Math.max(0, Math.min(this.x, game.width - this.size));
		this.y = Math.max(0, Math.min(this.y, game.height - this.size));
	}

	draw(ctx) {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.size, this.size);
	}
}

class Enemy extends GameObject {
	constructor(x, y, size, color = "red") {
		super(x, y, size, color);
		const angle = Math.random() * Math.PI * 2;
		this.speed = 100 / 60;
		this.vx = Math.cos(angle) * this.speed;
		this.vy = Math.sin(angle) * this.speed;
	}

	update(dt, game) {
		this.x += this.vx * dt * 60;
		this.y += this.vy * dt * 60;

		if (this.x < 0 || this.x > game.width - this.size) this.vx *= -1;
		if (this.y < 0 || this.y > game.height - this.size) this.vy *= -1;
	}

	draw(ctx) {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.size, this.size);
	}
}

class FastEnemy extends Enemy {
	constructor(x, y, size) {
		super(x, y, size, "orange");
		this.speed = 200 / 60;
		const angle = Math.random() * Math.PI * 2;
		this.vx = Math.cos(angle) * this.speed;
		this.vy = Math.sin(angle) * this.speed;
	}
}

class SmartEnemy extends Enemy {
	constructor(x, y, size, player) {
		super(x, y, size, "purple");
		this.player = player;
		this.speed = 120 / 60;
	}

	update(dt, game) {
		const dx = this.player.x - this.x;
		const dy = this.player.y - this.y;
		const dist = Math.hypot(dx, dy);
		if (dist > 0) {
			this.vx = (dx / dist) * this.speed;
			this.vy = (dy / dist) * this.speed;
		}
		super.update(dt, game);
	}
}

class PowerUp extends GameObject {
	constructor(x, y, size, type) {
		const color =
			type === "speed" ? "gold" : type === "score" ? "lime" : "magenta";
		super(x, y, size, color);
		this.type = type;
	}

	relocate(game) {
		this.x = Math.random() * (game.width - this.size);
		this.y = Math.random() * (game.height - this.size);
	}

	draw(ctx) {
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(
			this.x + this.size / 2,
			this.y + this.size / 2,
			this.size / 2,
			0,
			Math.PI * 2
		);
		ctx.fill();
		ctx.strokeStyle = "#fff";
		ctx.stroke();
	}
}

// ------------------
// Game Engine
// ------------------
class Game {
	constructor(canvas, onGameOver, onScore) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.width = canvas.width;
		this.height = canvas.height;

		this.player = new Player(this.width / 2 - 15, this.height / 2 - 15, 30);
		this.enemies = [new Enemy(200, 100, 30)];
		this.powerUps = [new PowerUp(400, 250, 20, "score")];
		this.particles = [];

		this.score = 0;
		this.running = true;
		this.timeElapsed = 0;
		this.enemySpawnInterval = 10;

		this.onGameOver = onGameOver;
		this.onScore = onScore;

		this.keys = {};
		this.bindKeys();
	}

	bindKeys() {
		window.addEventListener("keydown", (e) => {
			this.keys[e.key] = true;
		});
		window.addEventListener("keyup", (e) => {
			this.keys[e.key] = false;
		});
	}

	spawnParticles(x, y, color, count = 20, gravity = 0) {
		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = Math.random() * 200 - 100;
			const vx = (Math.cos(angle) * speed) / 60;
			const vy = (Math.sin(angle) * speed) / 60;
			const size = Math.random() * 4 + 2;
			this.particles.push(
				new Particle(x, y, size, color, vx, vy, 0.5, gravity)
			);
		}
	}

	applyPowerUp(type) {
		if (type === "speed") {
			this.player.speed *= 2;
			setTimeout(() => (this.player.speed /= 2), 5000);
		} else if (type === "score") {
			this.score += 1;
			this.onScore(this.score);
		} else if (type === "invincible") {
			this.player.invincible = true;
			setTimeout(() => (this.player.invincible = false), 5000);
		}
	}

	update(dt) {
		this.timeElapsed += dt;

		// Spawn new fast enemy every 10 seconds
		if (this.timeElapsed > this.enemySpawnInterval) {
			this.enemies.push(
				new FastEnemy(
					Math.random() * this.width,
					Math.random() * this.height,
					30
				)
			);
			this.enemySpawnInterval += 10;
		}

		// Player input
		this.player.vx = 0;
		this.player.vy = 0;
		if (this.keys["ArrowLeft"]) this.player.vx = -this.player.speed;
		if (this.keys["ArrowRight"]) this.player.vx = this.player.speed;
		if (this.keys["ArrowUp"]) this.player.vy = -this.player.speed;
		if (this.keys["ArrowDown"]) this.player.vy = this.player.speed;

		this.player.update(dt, this);
		this.enemies.forEach((e) => e.update(dt, this));
		this.powerUps.forEach((p) => p.update(dt, this));
		this.particles.forEach((p) => p.update(dt));
		this.particles = this.particles.filter((p) => !p.isDead());

		// Collisions with enemies
		this.enemies.forEach((e) => {
			const dist = Math.hypot(this.player.x - e.x, this.player.y - e.y);
			if (
				!this.player.invincible &&
				dist < (this.player.size + e.size) / 2
			) {
				this.spawnParticles(
					this.player.x + this.player.size / 2,
					this.player.y + this.player.size / 2,
					"255,0,0",
					60
				);
				this.running = false;
				this.onGameOver();
			}
		});

		// Collisions with power-ups
		this.powerUps.forEach((pu) => {
			const dist = Math.hypot(this.player.x - pu.x, this.player.y - pu.y);
			if (dist < (this.player.size + pu.size) / 2) {
				this.spawnParticles(
					pu.x + pu.size / 2,
					pu.y + pu.size / 2,
					"255,255,0",
					25
				);
				this.applyPowerUp(pu.type);
				pu.relocate(this);
			}
		});
	}

	draw() {
		const ctx = this.ctx;
		ctx.clearRect(0, 0, this.width, this.height);
		this.player.draw(ctx);
		this.enemies.forEach((e) => e.draw(ctx));
		this.powerUps.forEach((p) => p.draw(ctx));
		this.particles.forEach((p) => p.draw(ctx));
	}

	start() {
		let lastTime = performance.now();
		const loop = (time) => {
			if (!this.running) return;
			const dt = (time - lastTime) / 1000;
			lastTime = time;
			this.update(dt);
			this.draw();
			requestAnimationFrame(loop);
		};
		requestAnimationFrame(loop);
	}

	stop() {
		this.running = false;
	}
}

// ------------------
// React Functional Component
// ------------------
export default function ArcadeGame() {
	const canvasRef = useRef(null);
	const [score, setScore] = useState(0);
	const [gameOver, setGameOver] = useState(false);
	const [gameObj, setGameObj] = useState(null);

	useEffect(() => {
		// Add styles to html, body, and root to ensure proper centering
		document.documentElement.style.height = "100%";
		document.body.style.height = "100%";
		document.body.style.margin = "0";
		document.body.style.display = "flex";
		document.body.style.alignItems = "center";
		document.body.style.justifyContent = "center";
		const root = document.getElementById("root");
		if (root) {
			root.style.width = "100%";
			root.style.height = "100%";
			root.style.display = "flex";
			root.style.alignItems = "center";
			root.style.justifyContent = "center";
		}

		if (!canvasRef.current) return;

		const game = new Game(
			canvasRef.current,
			() => setGameOver(true),
			(newScore) => setScore(newScore)
		);
		setGameObj(game);
		game.start();

		return () => game.stop();
	}, []);

	const restartGame = () => {
		setScore(0);
		setGameOver(false);
		if (gameObj) {
			gameObj.running = false;
			const game = new Game(
				canvasRef.current,
				() => setGameOver(true),
				(newScore) => setScore(newScore)
			);
			setGameObj(game);
			game.start();
		}
	};

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "100vh",
				textAlign: "center",
			}}
		>
			<h1>Arcade Game</h1>
			<p>Score: {score}</p>
			<canvas
				ref={canvasRef}
				width={600}
				height={400}
				style={{ border: "2px solid black", display: "block" }}
			/>
			{gameOver && (
				<div style={{ marginTop: 20 }}>
					<h2>Game Over!</h2>
					<button onClick={restartGame}>Restart</button>
				</div>
			)}
		</div>
	);
}
