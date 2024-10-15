console.log('imageProcessor.js loaded');

let canvas, ctx;
let selectedPoints = [];

function initializeCanvas() {
    console.log('Initializing canvas');
    canvas = document.getElementById('imageCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        console.log('Canvas initialized');
        canvas.addEventListener('click', handleCanvasClick);
    } else {
        console.error('Canvas element not found');
    }
}

async function loadImage(file) {
    console.log('loadImage function called');
    return new Promise((resolve, reject) => {
        if (!canvas || !ctx) {
            console.log('Canvas not initialized, initializing now...');
            initializeCanvas();
        }

        const img = new Image();
        
        img.onload = () => {
            console.log('Image loaded successfully. Dimensions:', img.width, 'x', img.height);
            
            // Adjust canvas size to maintain aspect ratio
            const maxWidth = canvas.parentElement.clientWidth;
            const scale = Math.min(1, maxWidth / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            console.log('Image drawn on canvas. Canvas size:', canvas.width, 'x', canvas.height);
            selectedPoints = []; // Reset selected points
            lastLoadedImage = file; // Store the last loaded image
            resolve();
        };
        
        img.onerror = (error) => {
            console.error('Error loading image:', error);
            reject('Failed to load image.');
        };
        
        const objectURL = URL.createObjectURL(file);
        console.log('Image source set:', objectURL);
        img.src = objectURL;
    });
}

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    console.log('Click registered at:', x, y); // Add this line for debugging

    if (selectedPoints.length < 3) {
        selectedPoints.push({ x, y });
        drawPoint(x, y);
        updateInstructions();
    }

    if (selectedPoints.length === 3) {
        document.getElementById('calculateBtn').disabled = false;
    }
}

function drawPoint(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.strokeStyle = 'white'; // Add a white border to make the point more visible
    ctx.lineWidth = 2;
    ctx.stroke();
}

function updateInstructions() {
    const instructions = document.getElementById('instructions');
    switch (selectedPoints.length) {
        case 1:
            instructions.textContent = 'Select the knee point';
            break;
        case 2:
            instructions.textContent = 'Select the ankle point';
            break;
        case 3:
            instructions.textContent = 'Points selected. Click Calculate Angle.';
            break;
        default:
            instructions.textContent = 'Select the hip point';
    }
}

function calculateAngle() {
    if (selectedPoints.length !== 3) {
        console.error('Not enough points selected');
        return null;
    }

    const [hip, knee, ankle] = selectedPoints;

    // Calculate vectors
    const vectorA = { x: hip.x - knee.x, y: hip.y - knee.y };
    const vectorB = { x: ankle.x - knee.x, y: ankle.y - knee.y };

    // Calculate dot product
    const dotProduct = vectorA.x * vectorB.x + vectorA.y * vectorB.y;

    // Calculate magnitudes
    const magnitudeA = Math.sqrt(vectorA.x * vectorA.x + vectorA.y * vectorA.y);
    const magnitudeB = Math.sqrt(vectorB.x * vectorB.x + vectorB.y * vectorB.y);

    // Calculate angle in radians
    const angleRad = Math.acos(dotProduct / (magnitudeA * magnitudeB));

    // Convert to degrees
    const angleDeg = (angleRad * 180) / Math.PI;

    return 180 - angleDeg.toFixed(2);
}

function resetSelection() {
    selectedPoints = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateInstructions();
    document.getElementById('calculateBtn').disabled = true;
    document.getElementById('result').textContent = '';
    // Reset canvas size
    canvas.width = 0;
    canvas.height = 0;
    // Clear the last loaded image reference
    lastLoadedImage = null;
}

// Export functions for use in popup.js
window.loadImage = loadImage;
window.initializeCanvas = initializeCanvas;
window.calculateAngle = calculateAngle;
window.resetSelection = resetSelection;