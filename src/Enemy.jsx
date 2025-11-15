import { useState, useEffect } from "react";

export default function Enemy({ speed }) {
	const [pos, setPos] = useState({
		x: Math.random() * window.innerWidth,
		y: Math.random() * window.innerHeight,
	});
	const [dir, setDir] = useState({
		x: Math.random() > 0.5 ? 1 : -1,
		y: Math.random() > 0.5 ? 1 : -1,
	});

	// Move enemy automatically
	useEffect(() => {
		const interval = setInterval(() => {
			setPos((p) => {
				let newX = p.x + dir.x * speed;
				let newY = p.y + dir.y * speed;

				// bounce off walls
				if (newX <= 0 || newX >= window.innerWidth - 40)
					setDir((d) => ({ ...d, x: -d.x }));
				if (newY <= 0 || newY >= window.innerHeight - 40)
					setDir((d) => ({ ...d, y: -d.y }));

				return { x: newX, y: newY };
			});
		}, 50); // move every 50ms
		return () => clearInterval(interval);
	}, [dir, speed]);

	return (
		<div
			style={{
				width: 40,
				height: 40,
				backgroundColor: "crimson",
				position: "absolute",
				left: pos.x,
				top: pos.y,
				borderRadius: "50%",
			}}
			data-x={pos.x}
			data-y={pos.y}
		/>
	);
}
