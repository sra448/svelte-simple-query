const date = new Date();

function sleep() {
	return new Promise((resolve) => {
		setTimeout(resolve, 500 + Math.random() * 1000);
	});
}

const FRIENDS = [
	{ id: 1, name: 'Alice' },
	{ id: 2, name: 'Bob' },
	{ id: 3, name: 'Charlie' },
	{ id: 4, name: 'David' },
	{ id: 5, name: 'Eve' }
];

export async function requestFriends() {
	await sleep();
	return FRIENDS.map((friend) => ({
		...friend,
		age: Math.floor((+new Date() - +date) / 1000)
	}));
}

export async function requestFriend(id: number) {
	await sleep();
	const friend = FRIENDS.find((friend) => friend.id === id);

	if (!friend) {
		throw new Error('Friend not found');
	}

	return {
		...friend,
		age: Math.floor((+new Date() - +date) / 1000)
	};
}
