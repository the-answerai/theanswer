export const SENTIMENT_EMOJIS = {
    1: '😡', // Angry
    2: '😤', // Frustrated
    3: '😟', // Worried
    4: '😕', // Confused
    5: '😐', // Neutral
    6: '🙂', // Slightly Happy
    7: '😊', // Happy
    8: '😄', // Very Happy
    9: '😍', // Love
    10: '🤩' // Ecstatic
}

// Helper function to get sentiment emoji for a given score
export const getSentimentEmoji = (score) => {
    const roundedScore = Math.round(score)
    return SENTIMENT_EMOJIS[roundedScore] || '❓' // Fallback to question mark if score is invalid
}

// Helper function to get sentiment color gradient for UI elements
export const getSentimentGradient = () => {
    return 'linear-gradient(to right, #ff4d4d, #ffff4d, #4dff4d)'
}
