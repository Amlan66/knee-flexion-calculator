console.log('popup.js started executing');

let lastLoadedImage = null;

function checkElementVisibility() {
    console.log('Checking element visibility');
    const elements = ['canvasContainer', 'imageCanvas', 'instructions', 'calculateBtn', 'resetBtn'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}:`, element ? 'found' : 'not found');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    
    const imageUpload = document.getElementById('imageUpload');
    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (imageUpload) {
        console.log('imageUpload element found');
        imageUpload.addEventListener('change', (event) => {
            console.log('File input changed');
            const file = event.target.files[0];
            if (file) {
                console.log('File selected:', file.name, 'Size:', file.size, 'bytes', 'Type:', file.type);
                lastLoadedImage = file;
                loadImage(file).then(() => {
                    console.log('Image loaded and drawn on canvas');
                    checkElementVisibility();
                    document.getElementById('instructions').textContent = 'Select the hip point';
                    resetBtn.style.display = 'inline-block';
                }).catch(error => {
                    console.error('Error loading image:', error);
                });
            }
        });
    } else {
        console.error('imageUpload element not found');
    }

    if (calculateBtn) {
        calculateBtn.addEventListener('click', () => {
            const angle = calculateAngle();
            if (angle !== null) {
                document.getElementById('result').textContent = `Knee Flexion Angle: ${angle}°`;
            } else {
                document.getElementById('result').textContent = 'Error calculating angle. Please try again.';
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetSelection();
        });
    }

    checkElementVisibility();
});

console.log('popup.js finished executing');