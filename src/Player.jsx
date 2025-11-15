export default function Player({ x, y }) {
	return (
		<div
			style={{
				width: 50,
				height: 50,
				backgroundColor: "tomato",
				position: "absolute",
				left: x,
				top: y,
				borderRadius: 8,
				transition: "left 0.1s, top 0.1s",
			}}
		/>
	);
}
