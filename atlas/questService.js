// Service for handling state and generic quest data
const BASE_QUESTS = [
    { id: 'q1', type: 'Explorer', title: 'Discover the Hidden Viewpoint', desc: 'Find the secluded overlook marked on your map.' },
    { id: 'q2', type: 'Cultural', title: 'Taste Local Delicacy', desc: 'Interact with a local vendor and sample the traditional dish.' },
    { id: 'q3', type: 'Memory', title: 'Capture the Sunset', desc: 'Take a memory photo from the peak during golden hour.' },
    { id: 'q4', type: 'Navigator', title: 'Trace the Ancient Path', desc: 'Draw the route connecting the three historical ruins.' },
    { id: 'q5', type: 'Explorer', title: 'Find the Artisan Market', desc: 'Navigate the narrow streets to uncover the hidden crafts market.' },
    { id: 'q6', type: 'Cultural', title: 'Learn a Local Greeting', desc: 'Exchange greetings with locals in their native dialect.' },
    { id: 'q7', type: 'Memory', title: 'Collect a Keepsake', desc: 'Acquire a small physical memory fragment from your journey.' }
];

export const QuestService = {
    getQuests(destinationId) {
        return BASE_QUESTS.map(q => ({ ...q, destId: destinationId }));
    },
    
    getProgress(destinationId) {
        const data = JSON.parse(localStorage.getItem('atlas_progress') || '{}');
        return data[destinationId] || { completed: [] };
    },
    
    completeQuest(destinationId, questId) {
        const data = JSON.parse(localStorage.getItem('atlas_progress') || '{}');
        if (!data[destinationId]) data[destinationId] = { completed: [] };
        if (!data[destinationId].completed.includes(questId)) {
            data[destinationId].completed.push(questId);
        }
        localStorage.setItem('atlas_progress', JSON.stringify(data));
        return data[destinationId];
    },
    
    getBadgeStatus(completedCount) {
        if (completedCount >= 7) return { label: 'Gold Explorer', class: 'gold' };
        if (completedCount >= 3) return { label: 'Silver Explorer', class: 'silver' };
        if (completedCount >= 1) return { label: 'Bronze Explorer', class: 'bronze' };
        return { label: 'Locked Quest', class: 'locked' };
    },
    
    getStory(destinationId, destTitle) {
        const p = this.getProgress(destinationId);
        const count = p.completed.length;
        if (count === 0) return `Your journey in ${destTitle} has not yet begun.`;
        if (count < 3) return `You have taken your first steps in ${destTitle}, uncovering small whispers of hidden magic.`;
        if (count < 7) return `You have deeply explored ${destTitle}, tasting its unique culture and charting ancient paths. Your memory fragment pulses with energy.`;
        return `A legend. You have uncovered absolutely every secret of ${destTitle}, weaving a perfect tapestry of profound exploration, rich culture, and eternal memory.`;
    }
};
