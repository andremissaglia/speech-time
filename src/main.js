import './style.css';

const participantList = document.getElementById('participantList');
const participantNameInput = document.getElementById('participantName');
const addParticipantButton = document.getElementById('addParticipant');
const resetButton = document.getElementById('resetStatistics');
const statisticsDiv = document.getElementById('statistics');

let participants = [];
let timers = {};
let speechIntervals = {};

function addParticipant() {
  const name = participantNameInput.value.trim();
  if (name && !participants.find(p => p.name === name)) {
    participants.push({ name, speechTime: 0, speechCount: 0 });
    participantNameInput.value = '';
    renderParticipants();
    updateStatistics();
  }
}

addParticipantButton.addEventListener('click', addParticipant);

participantNameInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent default form submission if applicable
    addParticipant();
  }
});
resetButton.addEventListener('click', resetStatistics);

function renderParticipants() {
  participantList.innerHTML = '';
  participants.forEach((participant, index) => {
    const row = document.createElement('div');
    row.className = 'participant-info';
    const activeClass = timers[participant.name] ? 'active' : '';
    row.innerHTML = `
        <button data-index="${index}" class="play-pause material-icons ${activeClass}">play_arrow</button>
        <span>${participant.name}</span>
        <button data-index="${index}" class="remove material-icons">delete</button>
    `;
    participantList.appendChild(row);
  });

  document.querySelectorAll('.play-pause').forEach(button => {
    button.addEventListener('click', handlePlayPause);
  });

  document.querySelectorAll('.remove').forEach(button => {
    button.addEventListener('click', handleRemove);
  });
}

function handlePlayPause(event) {
  const index = parseInt(event.target.dataset.index);
  const participant = participants[index];
  const button = event.target;

  if (timers[participant.name]) {
    // Pause
    clearInterval(timers[participant.name]);
    delete timers[participant.name];
    button.classList.remove('active');
    const elapsedTime = (Date.now() - speechIntervals[participant.name]) / 1000;
    participant.speechTime += elapsedTime;
    delete speechIntervals[participant.name];

    // Check if anyone is still speaking
    if (Object.keys(timers).length === 0 && statisticsUpdateInterval) {
      clearInterval(statisticsUpdateInterval);
      statisticsUpdateInterval = null;
    }
  } else {
    // Pause all others
    Object.keys(timers).forEach(name => {
      clearInterval(timers[name]);
      const otherParticipant = participants.find(p => p.name === name);
      const elapsedTime = (Date.now() - speechIntervals[name]) / 1000;
      otherParticipant.speechTime += elapsedTime;
      delete speechIntervals[name];
      const otherButton = participantList.querySelector(`button.play-pause[data-index="${participants.indexOf(otherParticipant)}"]`);
      if (otherButton) {
        otherButton.classList.remove('active');
      }
      delete timers[name];
    });

    // Play
    participant.speechCount++;
    speechIntervals[participant.name] = Date.now();
    timers[participant.name] = setInterval(() => {
      // This interval is mainly to keep the timer active.
      // Actual time is calculated on pause.
    }, 1000);
    button.classList.add('active');
  }
  updateStatistics();
}

function handleRemove(event) {
  const index = parseInt(event.target.dataset.index);
  const participant = participants[index];
  if (timers[participant.name]) {
    clearInterval(timers[participant.name]);
    delete timers[participant.name];
    delete speechIntervals[participant.name];
  }
  participants.splice(index, 1);
  renderParticipants();
  updateStatistics();
}

function updateStatistics() {
  const totalSpeechTime = participants.reduce((sum, p) => sum + getSpeechTime(p), 0);
  statisticsDiv.innerHTML = '';

  if (participants.length === 0) {
    statisticsDiv.innerHTML = '<p>No participants yet.</p>';
    return;
  }

  participants.map(participant => {
    let speechTime = getSpeechTime(participant);
    const percentage = totalSpeechTime > 0 ? (speechTime / totalSpeechTime * 100).toFixed(2) : 0;

    const p = document.createElement('p');
    p.textContent = `${participant.name}: ${percentage}% (${participant.speechCount} speaks, ${speechTime.toFixed(2)}s)`;
    return {
      element: p,
      timer: speechTime,
    }
  }).sort((a, b) => b.timer - a.timer).forEach(({ element }) => {
    statisticsDiv.appendChild(element);
  });
}


function getSpeechTime(participant) {
  let time = participant.speechTime;
  if (timers[participant.name]) {
    // If the participant is currently speaking, add the time since the last interval
    time += (Date.now() - speechIntervals[participant.name]) / 1000;
  }
  return time;
}
function resetStatistics() {
  participants.forEach(participant => {
    participant.speechTime = 0;
    participant.speechCount = 0;
  });
  timers = {};
  speechIntervals = {};
  renderParticipants();
  updateStatistics();
}

// Initial render
renderParticipants();
updateStatistics();
setInterval(updateStatistics, 100);
