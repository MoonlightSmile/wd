import Decimal from "decimal.js";
import type { ImageItem } from "../App";

export type calcImageRowParams<T extends ImageItem> = {
	list: T[];
	height: number;
	w: number;
	clientWidth: number;
	gap?: number;
};
export type Result<T extends ImageItem> = {
	height: Decimal;
	list: T[];
	notFull: boolean;
}[];
export function calcImageRow<T extends ImageItem>({
	list,
	height,
	w,
	clientWidth,
	gap = 0,
}: calcImageRowParams<T>): Result<T> {
	const grid = [
		{
			height: new Decimal(height),
			list: [] as T[],
			notFull: false,
		},
	];
	let currentRowIndex = 0;
	list.forEach((i) => {
		const currentRow = grid[currentRowIndex];
		const totalWidth = currentRow.list.reduce((acc, cur) => {
			const width = new Decimal(currentRow.height).mul(cur.ratio);
			return acc.add(width);
		}, new Decimal(0));
		/** 剩余宽度 */
		const remainWidth = new Decimal(clientWidth).sub(totalWidth);
		if (remainWidth.lt(w)) {
			currentRowIndex++;
			grid.push({
				height: new Decimal(height),
				list: [i],
				notFull: false,
			});
		} else {
			currentRow.list.push(i);
		}
	});

	grid.forEach((row) => {
		const totalWidth = row.list.reduce((acc, cur) => {
			const width = new Decimal(row.height).mul(cur.ratio);
			return acc.add(width);
		}, new Decimal(0));
		const totalRatio = row.list.reduce((acc, cur) => {
			return acc.add(cur.ratio);
		}, new Decimal(0));
		const gapWidth = new Decimal(row.list.length + 1).mul(gap);

		if (totalWidth.plus(w).gte(clientWidth)) {
			row.height = new Decimal(clientWidth).sub(gapWidth).div(totalRatio);
		} else {
			row.height = new Decimal(height);
			row.notFull = true;
		}
	});
	return grid;
}
