export const Themes = {
    dungeon: {
        name: 'Dungeon',
        colors: {
            floor: '#222',
            wall: '#444',
            wallText: '#666',
            floorText: '#333'
        },
        chars: {
            wall: '🧱',
            floor: '·',
            door_closed: '🚪',
            door_open: 'frame'
        }
    },
    cave: {
        name: 'Cave',
        colors: {
            floor: '#2e2722', // Dark brown
            wall: '#4e342e', // Brown
            wallText: '#795548',
            floorText: '#3e2723'
        },
        chars: {
            wall: '🪨',
            floor: '·',
            door_closed: '🚪',
            door_open: 'frame'
        }
    },
    crypt: {
        name: 'Crypt',
        colors: {
            floor: '#1a231a', // Dark green-ish
            wall: '#2f4f4f', // Dark Slate Gray
            wallText: '#556b2f', // Dark Olive Green
            floorText: '#2f4f4f'
        },
        chars: {
            wall: '⚰️',
            floor: '░',
            door_closed: '⛓️',
            door_open: 'frame'
        }
    },
    magma: {
        name: 'Magma Caverns',
        colors: {
            floor: '#220000', // Dark Red
            wall: '#440000', // Red
            wallText: '#ff4500', // Orange Red
            floorText: '#800000'
        },
        chars: {
            wall: '🌋',
            floor: '≈',
            door_closed: '🔥',
            door_open: 'frame'
        }
    }
};

export function getRandomTheme() {
    const keys = Object.keys(Themes);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return Themes[randomKey];
}
