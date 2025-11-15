export default function Goal({ x, y }) {
	return (
		<div
			style={{
				width: 40,
				height: 40,
				backgroundColor: "limegreen",
				position: "absolute",
				left: x,
				top: y,
				borderRadius: "50%",
			}}
		/>
	);
}
