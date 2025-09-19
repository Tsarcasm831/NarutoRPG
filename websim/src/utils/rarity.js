export const getRarityColor = (rarity) => {
    switch (rarity) {
        case 'common': return 'text-gray-300 border-gray-400';
        case 'uncommon': return 'text-green-300 border-green-400';
        case 'rare': return 'text-blue-300 border-blue-400';
        case 'epic': return 'text-purple-300 border-purple-400';
        case 'legendary': return 'text-yellow-300 border-yellow-400';
        default: return 'text-gray-300 border-gray-400';
    }
};

