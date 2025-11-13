import { useEffect, useMemo, useState } from "react";
import { imageSize } from "image-size";
import Decimal from "decimal.js";
import { isEmpty } from "es-toolkit/compat";
import { calcImageRow } from "./utils/layout";
const formatBytes = (size: number) => {
	if (!size) return "0 B";
	const units = ["B", "KB", "MB", "GB", "TB"];
	let index = 0;
	let value = size;
	while (value >= 1024 && index < units.length - 1) {
		value /= 1024;
		index += 1;
	}
	return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDate = (timestamp: number) => {
	return new Intl.DateTimeFormat("zh-CN", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(timestamp);
};
export type ImageItem = {
	id: string;
	name: string;
	url: string;
	size: string;
	lastModified: string;
	aspectRatio: string;
	ratio: number;
	thumbs: {
		original: string;
		small: string;
	};
	path: string;
};
const createImageItem = async (file: File): Promise<ImageItem> => {
	const objectUrl = URL.createObjectURL(file);
	const path = file.webkitRelativePath || file.name;
	const uint8Array = new Uint8Array(await file.arrayBuffer());
	console.log("file :>> ", file);
	const size = imageSize(uint8Array);
	const aspectRatio = new Decimal(size.width).div(size.height).toNumber();
	return {
		id: `${file.name}-${file.lastModified}-${file.size}`,
		name: path,
		url: objectUrl,
		size: formatBytes(file.size),
		lastModified: formatDate(file.lastModified),
		ratio: aspectRatio,
		aspectRatio: `${size.width}x${size.height}`,
		thumbs: {
			original: objectUrl,
			small: objectUrl,
		},
		path,
	};
};

const GAP = 5;
const HEIGHT = 200;

function App() {
	const [images, setImages] = useState<ImageItem[]>([]);
	const [progress, setProgress] = useState<string>();
	// width
	const [width, setWidth] = useState<number>(window.innerWidth);

	const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
		e,
	) => {
		if (e.target.files == null) return;
		const files = Array.from(e.target.files).filter((file) =>
			file.type.includes("image"),
		);

		const total = files.length;
		let progress = 0;
		const images = [];
		console.time("createImageItem");
		for await (const element of files.map(createImageItem)) {
			progress += 1;
			setProgress(`${progress} / ${total}`);
			images.push(element);
		}
		setImages(images);
		console.timeEnd("createImageItem");
	};

	const layout = useMemo(() => {
		if (isEmpty(images)) return [];
		return calcImageRow({
			list: images,
			height: HEIGHT,
			w: 200,
			clientWidth: width,
			gap: GAP,
		});
	}, [images, width]);
	useEffect(() => {
		console.log("layout :>> ", layout);
	}, [layout]);

	useEffect(() => {
		const handleResize = () => {
			setWidth(window.innerWidth);
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return (
		<div>
			<input
				type="file"
				// @ts-ignore
				webkitdirectory=""
				directory=""
				multiple
				accept="image/*"
				onChange={handleFileChange}
			/>
			{progress && <div>{progress}</div>}
			{layout.map((row) => (
				<div
					key="1"
					style={{
						height: row.height.toNumber(),
						display: "flex",
						gap: GAP,
						marginLeft: GAP,
						marginBottom: GAP,
					}}
				>
					{row.list.map((image) => (
						<div
							key={image.id}
							style={{
								width: image.ratio * row.height.toNumber(),
								height: "100%",
							}}
						>
							<img src={image.url} alt={image.name} />
						</div>
					))}
				</div>
			))}
		</div>
	);
}

export default App;
