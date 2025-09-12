export const getSlotRarityColor = (rarity) => {
    const colors = {
      common: 'border-gray-400 bg-gray-600',
      uncommon: 'border-green-400 bg-green-600',
      rare: 'border-blue-400 bg-blue-600',
      epic: 'border-purple-400 bg-purple-600',
      legendary: 'border-yellow-400 bg-yellow-600'
    };
    return colors[rarity] || colors.common;
};

export const getTextRarityColor = (rarity) => {
    switch (rarity) {
        case 'legendary': return 'text-yellow-400';
        case 'epic': return 'text-purple-400';
        case 'rare': return 'text-blue-400';
        case 'uncommon': return 'text-green-400';
        default: return 'text-gray-300';
    }
}

export const getDurabilityColor = (current, max) => {
    const percentage = (current / max) * 100;
    if (percentage > 75) return 'bg-green-500';
    if (percentage > 50) return 'bg-yellow-500';
    if (percentage > 25) return 'bg-orange-500';
    return 'bg-red-500';
};

