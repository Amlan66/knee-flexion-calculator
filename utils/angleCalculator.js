// Make the function globally accessible
window.calculateKneeFlexionAngle = function(hip, knee, ankle) {
    try {
        // Calculate the lengths of the sides of the triangle
        const a = Math.hypot(knee.x - hip.x, knee.y - hip.y); // Hip to Knee
        const b = Math.hypot(ankle.x - knee.x, ankle.y - knee.y); // Knee to Ankle
        const c = Math.hypot(ankle.x - hip.x, ankle.y - hip.y); // Hip to Ankle

        // Validate that the lengths form a valid triangle
        if (a === 0 || b === 0 || c === 0) {
            throw new Error('One or more keypoints are overlapping.');
        }

        // Calculate the angle at the knee using the cosine rule
        const angleRad = Math.acos((a ** 2 + b ** 2 - c ** 2) / (2 * a * b));
        const angleDeg = angleRad * (180 / Math.PI);

        // Validate angle range
        if (isNaN(angleDeg)) {
            throw new Error('Invalid angle calculation due to keypoint positions.');
        }

        return angleDeg.toFixed(2);
    } catch (error) {
        console.error('Error calculating knee flexion angle:', error);
        return 'Error';
    }
};