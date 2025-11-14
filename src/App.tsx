import { useEffect, useMemo, useState } from "react";
import { imageSize } from "image-size";
import Decimal from "decimal.js";
import { isEmpty } from "es-toolkit/compat";
import { calcImageRow } from "./utils/layout";
import { v7 as uuid } from "uuid";
import md5 from "blueimp-md5";

class LocalStorageForImageSize {
	static getItem(key: string) {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : null;
	}
	static setItem(key: string, value: ImageItem) {
		localStorage.setItem(key, JSON.stringify(value));
	}
}

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

const GAP = 5;
const HEIGHT = 300;

function App() {
	const [images, setImages] = useState<ImageItem[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [processed, setProcessed] = useState<number>(0);
	// width
	const [width, setWidth] = useState<number>(window.innerWidth);
	const createImageItem = async (file: File): Promise<ImageItem> => {
		const objectUrl = URL.createObjectURL(file);
		const path = file.webkitRelativePath || file.name;
		const key = md5(path);
		const item = LocalStorageForImageSize.getItem(key);
		if (item) {
			item.url = objectUrl;
			setProcessed((prev) => prev + 1);
			return item;
		}
		const uint8Array = new Uint8Array(await file.arrayBuffer());
		const size = imageSize(uint8Array);
		const aspectRatio = new Decimal(size.width).div(size.height).toNumber();
		const imageItem: ImageItem = {
			id: uuid(),
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
		LocalStorageForImageSize.setItem(key, imageItem);
		setProcessed((prev) => prev + 1);
		return imageItem;
	};

	const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
		e,
	) => {
		if (e.target.files == null) return;
		const files = Array.from(e.target.files).filter((file) =>
			file.type.includes("image"),
		);

		const total = files.length;
		setTotal(total);
		setProcessed(0);
		const images = [];
		console.time("createImageItem");
		const promises = files.map(createImageItem);
		for await (const element of promises) {
			images.push(element);
		}
		setImages(images);
		console.timeEnd("createImageItem");
	};

	const layout = useMemo(() => {
		if (isEmpty(images)) return [];
		console.log("images :>> ", images);
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
			<div>
				图片处理中：{processed} / {total}
			</div>
			{/* ----------------- */}
			{/* 图片布局 */}
			{layout.map((row) => (
				<div
					key={row.id}
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
							className="shadow-md rounded-md overflow-hidden"
						>
							<img src={""} alt={image.name} loading="lazy" />
						</div>
					))}
				</div>
			))}
		</div>
	);
}

export default App;
