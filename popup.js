console.log('popup.js started executing');

let lastLoadedImage = null;
let points = [];
let ctx;
let img;
let flexionChart = null; // Add this at the top of your file with other global variables

function checkElementVisibility() {
    const elements = ['canvas', 'calculateBtn', 'resetBtn', 'instructions'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`${id} is present in the DOM`);
        } else {
            console.log(`${id} is missing from the DOM`);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    
    const canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    const imageUpload = document.getElementById('imageUpload');
    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');
    const eraseDataBtn = document.getElementById('eraseDataBtn');
    const clearPointsBtn = document.getElementById('clearPointsBtn');
    const personNameInput = document.getElementById('personName');
    const dateTakenInput = document.getElementById('dateTaken');
    const analysisSection = document.getElementById('analysisSection');
    const eraseOptions = document.getElementById('eraseOptions');
    const eraseAllBtn = document.getElementById('eraseAllBtn');
    const eraseSpecificBtn = document.getElementById('eraseSpecificBtn');
    const specificDateErase = document.getElementById('specificDateErase');
    const dateSelect = document.getElementById('dateSelect');
    const confirmEraseBtn = document.getElementById('confirmEraseBtn');
    const cancelEraseBtn = document.getElementById('cancelEraseBtn');
    const resultElement = document.getElementById('result');
    const uploadInstruction = document.getElementById('uploadInstruction');

    // Set default date to today and max date to today
    const today = new Date().toISOString().split('T')[0];
    dateTakenInput.value = today;
    dateTakenInput.max = today;

    // Update erase button text when person name changes
    personNameInput.addEventListener('input', updateEraseButtonText);

    // Show instruction if no image is uploaded
    if (!imageUpload.files.length) {
        uploadInstruction.style.display = 'block';
    }

    if (imageUpload) {
        imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Hide instruction when an image is uploaded
                uploadInstruction.style.display = 'none';

                const reader = new FileReader();

                reader.onload = (event) => {
                    img = new Image();
                    img.onload = () => {
                        // Scale down the image
                        const scale = Math.min(400 / img.width, 400 / img.height);
                        canvas.width = img.width * scale;
                        canvas.height = img.height * scale;
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        analysisSection.style.display = 'block';
                    };
                    img.src = event.target.result;
                };

                reader.readAsDataURL(file);
            } else {
                console.log('No file selected');
            }
        });
    }

    if (canvas) {
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (points.length < 3) {
                points.push({x, y});
                drawPoint(x, y);
                
                if (points.length === 1) {
                    clearPointsBtn.style.display = 'inline-block';
                }
                
                if (points.length === 3) {
                    drawLines();
                    calculateBtn.disabled = false;
                }
            }
        });
    }

    if (clearPointsBtn) {
        clearPointsBtn.addEventListener('click', () => {
            clearPoints();
        });
    }

    if (calculateBtn) {
        calculateBtn.addEventListener('click', () => {
            const angle = calculateAngle();
            console.log("Calculated angle:", angle);
            if (angle !== null) {
                const personName = personNameInput.value.trim();
                const dateTaken = dateTakenInput.value;
                
                if (personName && dateTaken) {
                    saveFlexionAngle(personName, dateTaken, angle);
                    showResult(`Knee Flexion: ${angle.toFixed(2)}°`);
                    updateGraph(personName);
                    
                    // Lock the name input and update erase button
                    personNameInput.disabled = true;
                    updateEraseButtonText(personName);
                    eraseDataBtn.style.display = 'inline-block';
                    calculateBtn.disabled = true;
                    clearPointsBtn.style.display = 'none';
                    
                    // Hide the instructions
                    document.getElementById('instructions').style.display = 'none';
                } else {
                    showResult('Please enter person name and date.');
                }
            } else {
                showResult('Error calculating flexion. Please try again.');
            }
            // Add this line:
            document.getElementById('result').style.zIndex = '9999';
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetAll();
        });
    }

    if (eraseDataBtn) {
        eraseDataBtn.addEventListener('click', () => {
            eraseOptions.style.display = 'block';
            eraseDataBtn.style.display = 'none';
        });
    }

    if (eraseAllBtn) {
        eraseAllBtn.addEventListener('click', () => {
            const personName = personNameInput.value.trim();
            if (personName) {
                eraseAllPersonData(personName);
                document.getElementById('result').textContent = `All data for ${personName} has been erased.`;
                eraseDataBtn.style.display = 'none'; // Hide the erase data button
                eraseOptions.style.display = 'none'; // Hide the erase options
                
                // Update the graph to show no data points
                updateEmptyGraph(personName);

                // Disable the name input
                personNameInput.disabled = true;
            }
        });
    }

    if (eraseSpecificBtn) {
        eraseSpecificBtn.addEventListener('click', () => {
            const personName = personNameInput.value.trim();
            if (personName) {
                const dates = getPersonDates(personName);
                if (dates.length > 0) {
                    populateDateSelect(dates);
                    specificDateErase.style.display = 'block';
                    eraseOptions.style.display = 'none';
                } else {
                    // If no dates left, hide erase options and button
                    eraseOptions.style.display = 'none';
                    eraseDataBtn.style.display = 'none';
                    document.getElementById('result').textContent = `No data left for ${personName}.`;
                }
            }
        });
    }

    if (confirmEraseBtn) {
        confirmEraseBtn.addEventListener('click', () => {
            const personName = personNameInput.value.trim();
            const selectedDate = dateSelect.value;
            if (personName && selectedDate) {
                eraseSpecificDate(personName, selectedDate);
                updateGraph(personName);
                specificDateErase.style.display = 'none';
                
                // Check if there's any data left for the person
                const remainingDates = getPersonDates(personName);
                if (remainingDates.length > 0) {
                    eraseDataBtn.style.display = 'inline-block';
                    document.getElementById('result').textContent = `Data for ${personName} on ${selectedDate} has been erased.`;
                } else {
                    eraseDataBtn.style.display = 'none';
                    document.getElementById('result').textContent = `All data for ${personName} has been erased.`;
                }
            }
        });
    }

    if (cancelEraseBtn) {
        cancelEraseBtn.addEventListener('click', () => {
            specificDateErase.style.display = 'none';
            eraseDataBtn.style.display = 'inline-block';
        });
    }

    checkElementVisibility();
    hideResult();
});

function drawPoint(x, y) {
    // Add shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.stroke();

    // Reset shadow for the inner circle
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Add a small inner circle for extra elegance
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
}

function drawLines() {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; // Semi-transparent white
    ctx.stroke();

    // Add a blue line on top for better visibility
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.7)'; // Semi-transparent blue
    ctx.stroke();
}

function calculateAngle() {
    if (points.length !== 3) return null;

    const [hip, knee, ankle] = points;

    const vector1 = {
        x: hip.x - knee.x,
        y: hip.y - knee.y
    };

    const vector2 = {
        x: ankle.x - knee.x,
        y: ankle.y - knee.y
    };

    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

    const angleRadians = Math.acos(dotProduct / (magnitude1 * magnitude2));
    const angleDegrees = (angleRadians * 180) / Math.PI;

    // Calculate the final angle as 180 - (angle calculated from 3 dots)
    const finalAngle = 180 - Math.round(angleDegrees);

    return finalAngle;
}

function saveFlexionAngle(personName, date, angle) {
    let data = JSON.parse(localStorage.getItem('flexionAngles')) || {};
    if (!data[personName]) {
        data[personName] = [];
    }
    data[personName].push({ date, angle });
    localStorage.setItem('flexionAngles', JSON.stringify(data));
}

function updateGraph(personName) {
    const data = JSON.parse(localStorage.getItem('flexionAngles')) || {};
    const personData = data[personName] || [];

    // Sort data by date
    personData.sort((a, b) => new Date(a.date) - new Date(b.date));

    const dates = personData.map(item => item.date);
    const angles = personData.map(item => item.angle);

    const ctx = document.getElementById('flexionGraph').getContext('2d');
    
    // Destroy the existing chart if it exists
    if (flexionChart) {
        flexionChart.destroy();
    }

    // Create a new chart
    flexionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Knee Flexion Angle',
                data: angles,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Flexion Angle (degrees)'
                    }
                }
            }
        }
    });

    // After updating the graph, check if there's any data left
    const remainingDates = getPersonDates(personName);
    if (remainingDates.length === 0) {
        document.getElementById('eraseDataBtn').style.display = 'none';
    }
}

function erasePersonData(personName) {
    let data = JSON.parse(localStorage.getItem('flexionAngles')) || {};
    if (data[personName]) {
        delete data[personName];
        localStorage.setItem('flexionAngles', JSON.stringify(data));
    }
}

function resetAll() {
    points = [];
    img = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('result').textContent = '';
    document.getElementById('personName').value = '';
    document.getElementById('personName').disabled = false;
    document.getElementById('dateTaken').value = new Date().toISOString().split('T')[0];
    document.getElementById('imageUpload').value = '';
    
    const graphCanvas = document.getElementById('flexionGraph');
    const graphCtx = graphCanvas.getContext('2d');
    graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    
    if (flexionChart) {
        flexionChart.destroy();
        flexionChart = null;
    }

    updateEraseButtonText('');
    document.getElementById('eraseDataBtn').style.display = 'none';
    document.getElementById('calculateBtn').disabled = true;
    document.getElementById('clearPointsBtn').style.display = 'none';
    document.getElementById('analysisSection').style.display = 'none';

    // Show the instructions again
    document.getElementById('instructions').style.display = 'block';
    hideResult();

    // Show upload instruction again when resetting
    document.getElementById('uploadInstruction').style.display = 'block';
}

function updateEraseButtonText(personName) {
    const eraseDataBtn = document.getElementById('eraseDataBtn');
    if (personName) {
        eraseDataBtn.textContent = `Erase ${personName}'s Data`;
    } else {
        eraseDataBtn.textContent = 'Erase Person\'s Data';
    }
}

function clearPoints() {
    points = [];
    if (img) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    document.getElementById('calculateBtn').disabled = true;
    document.getElementById('clearPointsBtn').style.display = 'none';
}

function eraseAllPersonData(personName) {
    let data = JSON.parse(localStorage.getItem('flexionAngles')) || {};
    if (data[personName]) {
        delete data[personName];
        localStorage.setItem('flexionAngles', JSON.stringify(data));
    }
}

function getPersonDates(personName) {
    let data = JSON.parse(localStorage.getItem('flexionAngles')) || {};
    if (data[personName]) {
        return data[personName].map(entry => entry.date);
    }
    return [];
}

function populateDateSelect(dates) {
    const dateSelect = document.getElementById('dateSelect');
    dateSelect.innerHTML = '';
    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
        dateSelect.appendChild(option);
    });
}

function eraseSpecificDate(personName, date) {
    let data = JSON.parse(localStorage.getItem('flexionAngles')) || {};
    if (data[personName]) {
        data[personName] = data[personName].filter(entry => entry.date !== date);
        if (data[personName].length === 0) {
            delete data[personName];
        }
        localStorage.setItem('flexionAngles', JSON.stringify(data));
    }
}

function updateEmptyGraph(personName) {
    const ctx = document.getElementById('flexionGraph').getContext('2d');
    
    // Destroy the existing chart if it exists
    if (flexionChart) {
        flexionChart.destroy();
    }

    // Create a new empty chart
    flexionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Knee Flexion Angle',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'MMM D'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Flexion Angle (degrees)'
                    },
                    min: 0,
                    max: 180
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Knee Flexion Angles for ${personName}`,
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
}

function showResult(text) {
    const resultElement = document.getElementById('result');
    resultElement.textContent = text;
    resultElement.style.display = 'block';
    console.log("Showing result:", text);
}

function hideResult() {
    const resultElement = document.getElementById('result');
    resultElement.style.display = 'none';
    resultElement.textContent = '';
}

console.log('popup.js finished executing');
console.log('popup.js finished executing');
