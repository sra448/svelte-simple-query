type TreeNode<T> = {
	__value?: T;
} & {
	[K in Exclude<string, '__value'>]?: TreeNode<T>;
};

export default function () {
	const cache: TreeNode<unknown> = $state({});

	function setCache(key: string[], value: unknown): void {
		let current = cache;

		for (const part of key) {
			if (!(part in current)) {
				current[part] = {};
			}
			current = current[part]!;
		}

		current.__value = value;
	}

	function getCache(key: string[]): unknown {
		let current = cache;

		for (const part of key) {
			if (!(part in current)) {
				return undefined;
			}
			current = current[part]!;
		}

		return current.__value;
	}

	function removeCache(key: string[]): void {
		let current = cache;

		for (const part of key) {
			if (!(part in current)) {
				return;
			}
			current = current[part]!;
		}

		delete current.__value;
	}

	function getCaches(key: string[]): unknown[] {
		let current = cache;

		// Navigate to the node at the given key path
		for (const part of key) {
			if (!(part in current)) {
				// If the path doesn't exist, return an empty array
				return [];
			}
			current = current[part]!;
		}

		// Collect all __value properties starting from current node
		const values: unknown[] = [];

		function collectValues(node: TreeNode<unknown>): void {
			if (node.__value !== undefined) {
				values.push(node.__value);
			}

			for (const key in node) {
				if (key !== '__value') {
					const childNode = node[key];
					if (childNode) {
						collectValues(childNode);
					}
				}
			}
		}

		collectValues(current);
		return values;
	}

	return {
		cache,
		setCache,
		getCache,
		getCaches,
		removeCache
	};
}
