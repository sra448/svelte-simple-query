type TreeNode<T> = {
	__value?: T;
} & {
	[K in Exclude<string, '__value'>]?: TreeNode<T>;
};

export default function () {
	const cache: TreeNode<unknown> = $state({});

	function setCache(key: string[], value: unknown): void {
		let current = cache;
		let i = 0;

		// Transit down the tree as far as possible on the existing structure
		while (i < key.length && key[i] in current) {
			current = current[key[i]]!;
			i++;
		}

		// Construct the missing part of the tree
		if (i < key.length) {
			const newBranch: TreeNode<unknown> = {};
			let temp = newBranch;
			for (let j = i; j < key.length; j++) {
				temp[key[j]] = {};
				temp = temp[key[j]] as TreeNode<unknown>;
			}

			temp.__value = value; // Attach the final value here

			// Attach the newly created branch to the original object
			// debugger;
			current[key[i]] = newBranch[key[i]];
		} else {
			// If we traversed the whole path, just set the value
			current.__value = value;
		}
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
