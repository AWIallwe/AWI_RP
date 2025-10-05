let state = {
    isRunning: false,
    currentTemp: 0.0,
    currentHumidityRelative: 0.0,
    currentHumidityAbsolute: 0.0,
    targetTemp: 0,
    timerHours: 0,
    timerMinutes: 0,
    timerSegunds: 0,
    infiniteTimer: false,
    elapsedTime: 0,
    status: 'idle',
    horaParaSalvar: 0,
    minutoParaSalvar: 0,
};


function showToast(title, message, variant = 'default') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${variant}`;
    toast.innerHTML = `
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

function handleStart() {
    if (!state.isRunning) {
        start();
    } else {
        stop();
    }
}

async function start() {
    state.isRunning = true;
    state.status = 'heating';
    state.elapsedTime = 0;
    updateControlButtons();
    updateDisplay();
    showToast('Processo iniciado', 'A secadora foi iniciada com sucesso');

    const statusEnvio = state.isRunning;
    const targetTemperatura = parseFloat(state.targetTemp);

    if (state.infiniteTimer == true) {
        try {
            const response = await fetch("/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ statusEnvio, targetTemperatura })
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            console.log("Comando START enviado com sucesso!");
        } catch (e) {
            console.error("Erro ao enviar comando START:", e);
        }
    } else {
        const horaEnvio = parseInt(state.horaParaSalvar);
        const minutoEnvio = parseInt(state.minutoParaSalvar);

        if (isNaN(horaEnvio) || isNaN(minutoEnvio)) {
            console.warn("Hora inválida:", horaEnvio + ":" + minutoEnvio);
            return;
        }
        try {
            const response = await fetch("/startTimer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ statusEnvio, horaEnvio, minutoEnvio, targetTemperatura })
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            console.log("Comando START TIMER enviado com sucesso!");
        } catch (e) {
            console.error("Erro ao enviar comando START TIMER:", e);
        }
    }
}

async function pause() {
    state.isRunning = false;
    state.status = 'idle';
    updateControlButtons();
    updateDisplay();

    const statusEnvio = state.isRunning;

    try {
        const response = await fetch("/pause", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ statusEnvio })
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        console.log("Comando PAUSE enviado com sucesso!");
    } catch (e) {
        console.error("Erro ao enviar comando PAUSE:", e);
    }
}

async function stop() {
    state.isRunning = false;
    state.timerHours = 0;
    state.timerMinutes = 0;
    state.timerSegunds = 0;
    state.status = 'idle';
    updateControlButtons();
    updateDisplay();
    showToast('Processo interrompido', 'A secadora foi parada', 'destructive');

    const statusEnvio = state.isRunning;
    const horaEnvio = 0;
    const minutoEnvio = 0;

    try {
        const response = await fetch("/stop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ statusEnvio, horaEnvio, minutoEnvio })
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        console.log("Comando STOP enviado com sucesso!");
    } catch (e) {
        console.error("Erro ao enviar comando STOP:", e);
    }
}


function updateControlButtons() {
    const controlButtons = document.getElementById('control-buttons');

    if (!state.isRunning) {
        controlButtons.innerHTML = `
            <button class="btn btn-primary" id="start-btn">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5,3 19,12 5,21"/>
                </svg>
                Iniciar
            </button>
        `;
        document.getElementById('start-btn').addEventListener('click', handleStart);
    } else {
        controlButtons.innerHTML = `
            <button class="btn btn-secondary" id="pause-btn">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                </svg>
                Pausar
            </button>
            <button class="btn btn-destructive" id="stop-btn">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
                Parar
            </button>
        `;
        document.getElementById('pause-btn').addEventListener('click', pause);
        document.getElementById('stop-btn').addEventListener('click', stop);
    }
}

function updateDisplay() {
    updateStatus();
    updateTemperatureGauge();
    updateHumidityGauge();
    updateTimeRemaining();
}

function updateStatus() {
    const statusLabel = document.getElementById('status-label');
    const statusCard = document.querySelector('.status-card');
    const statusIcon = document.querySelector('.status-icon');

    statusCard.classList.remove('status-heating', 'status-drying', 'status-completed', 'status-idle');

    const statusConfig = {
        heating: {
            label: 'Aquecendo',
            icon: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>`,
            class: 'status-heating'
        },
        drying: {
            label: 'Secando',
            icon: `<rect x="3" y="3" width="18" height="18" rx="2"/>`,
            class: 'status-drying'
        },
        completed: {
            label: 'Concluído',
            icon: `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>`,
            class: 'status-completed'
        },
        idle: {
            label: 'Standby',
            icon: `<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>`,
            class: 'status-idle'
        }
    };

    const config = statusConfig[state.status];
    statusLabel.textContent = config.label;
    statusIcon.innerHTML = config.icon;
    statusCard.classList.add(config.class);
}

function updateTemperatureGauge() {
    document.getElementById('current-temp').textContent = state.currentTemp.toFixed(1);
    document.getElementById('target-temp').textContent = state.targetTemp;

    const percentage = ((state.currentTemp - 0) / (60 - 0)) * 100;
    const targetPercentage = ((state.targetTemp - 0) / (61 - 0)) * 100;

    document.getElementById('temp-progress').style.width = `${Math.min(percentage, 100)}%`;
    document.getElementById('temp-target-indicator').style.left = `${targetPercentage}%`;
}

function updateHumidityGauge() {
    document.getElementById('humidity-relative').textContent = state.currentHumidityRelative.toFixed(1);
    document.getElementById('humidity-absolute').textContent = state.currentHumidityAbsolute.toFixed(1);

    const relativePercentage = ((state.currentHumidityRelative - 0) / (100 - 0)) * 100;
    const absolutePercentage = ((state.currentHumidityAbsolute - 0) / (20 - 0)) * 100;

    document.getElementById('humidity-relative-progress').style.width = `${Math.min(relativePercentage, 100)}%`;
    document.getElementById('humidity-absolute-progress').style.width = `${Math.min(absolutePercentage, 100)}%`;
}

function updateTimeRemaining() {
    let timeText = '--:--:--';

    if (state.infiniteTimer && state.isRunning) {
        const hours = Math.floor(state.elapsedTime / 3600);
        const minutes = Math.floor((state.elapsedTime % 3600) / 60);
        const seconds = state.elapsedTime % 60;
        timeText = '--:--:--';
    } else if (state.isRunning && !state.infiniteTimer) {
        const totalSeconds = state.timerHours * 3600 + state.timerMinutes * 60 + state.timerSegunds;
        const remaining = Math.max(0, totalSeconds - state.elapsedTime);
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        timeText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    document.getElementById('time-remaining').textContent = `Tempo restante: ${timeText}`;
}

function updateTimerDisplay() {
    const timerGroup = document.getElementById('timer-group');
    if (state.infiniteTimer) {
        timerGroup.classList.add('hidden');
    } else {
        timerGroup.classList.remove('hidden');
    }
}

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('show');
}


function bindEvents() {
    document.getElementById('start-btn').addEventListener('click', handleStart);
    document.getElementById('settings-btn').addEventListener('click', toggleSettings);

    document.getElementById('target-temp-input').addEventListener('input', (e) => {
        state.targetTemp = parseInt(e.target.value);
        if (state.targetTemp > 60) {
            state.targetTemp = 60;
            showToast('Temperatura definida muito alta', 'Definição maxima 60ºC', 'destructive');
        }
        updateDisplay();
    });

    document.getElementById('infinite-timer').addEventListener('change', (e) => {
        state.infiniteTimer = e.target.checked;
        updateTimerDisplay();
    });

    document.getElementById('timer-hours').addEventListener('input', (e) => {
        state.horaParaSalvar = parseInt(e.target.value);
    });

    document.getElementById('timer-minutes').addEventListener('input', (e) => {
        state.minutoParaSalvar = parseInt(e.target.value);
    });
}


function init() {
    bindEvents();
    updateDisplay();
}

const toastCSS = `
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: var(--shadow-elevated);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 1000;
    min-width: 300px;
}

.toast.show {
    transform: translateX(0);
}

.toast-destructive {
    border-color: var(--destructive);
}

.toast-content h4 {
    margin: 0 0 0.5rem 0;
    color: var(--foreground);
    font-weight: 600;
}

.toast-content p {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.875rem;
}
`;

const style = document.createElement('style');
style.textContent = toastCSS;
document.head.appendChild(style);

window.addEventListener('DOMContentLoaded', () => {
    init();
});

function atualizarDashboard(temperatura, umidadeInterna, umidaadeAbsoluta, tempoRestanteHH, tempoRestanteMM, tempoRestanteSS) {
    document.getElementById("Setpoint").innerText = state.targetTemp + "ºC";
    document.getElementById("UmidadeRelativa").innerText = umidadeInterna + "%";
    document.getElementById("UmidadeAbsoluta").innerText = umidaadeAbsoluta + "%";
    document.getElementById("TemperaturaReal").innerText = temperatura + "ºC";

    state.currentTemp = temperatura;
    state.currentHumidityRelative = umidadeInterna;
    state.currentHumidityAbsolute = umidaadeAbsoluta;

    if (state.isRunning == true) {
        state.timerHours = tempoRestanteHH;
        state.timerMinutes = tempoRestanteMM;
        state.timerSegunds = tempoRestanteSS;

        if (state.infiniteTimer == false) {
            if ((tempoRestanteHH == 0) && (tempoRestanteMM == 0) && (tempoRestanteSS == 0)) {
                state.isRunning = false;
                state.timerHours = 0;
                state.timerMinutes = 0;
                state.timerSegunds = 0;
                state.status = 'idle';
                state.isRunning = false;
                updateControlButtons();
            }
        }


    }
    updateDisplay();
}

async function buscarDados() {
    try {
        const response = await fetch("/data");
        const dados = await response.json();
        atualizarDashboard(dados.temperatura, dados.umidadeInterna, dados.umidaadeAbsoluta, dados.tempoRestanteHH, dados.tempoRestanteMM, dados.tempoRestanteSS);
    } catch (e) {
        console.error("Erro ao buscar dados:", e);
    }
}
setInterval(buscarDados, 1000);


const ctx = document.getElementById('myChart').getContext('2d');

const gradient1 = ctx.createLinearGradient(0, 0, 0, 400);
gradient1.addColorStop(0, '#ffa500');
gradient1.addColorStop(1, '#ffcc80');

const gradient2 = ctx.createLinearGradient(0, 0, 0, 400);
gradient2.addColorStop(0, '#42a5f5');
gradient2.addColorStop(1, '#90caf9');

const gradient3 = ctx.createLinearGradient(0, 0, 0, 400);
gradient3.addColorStop(0, '#8850efff');
gradient3.addColorStop(1, '#ba9aefff');

const gradient4 = ctx.createLinearGradient(0, 0, 0, 400);
gradient4.addColorStop(0, '#ef5350');
gradient4.addColorStop(1, '#ef9a9a');

const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [''],
        datasets: [
            {
                label: 'Setpoint',
                borderColor: gradient1,
                data: [0],
                fill: false,
                tension: 0.4,
                pointRadius: 2,
                borderWidth: 2,
            },
            {
                label: 'Umidade Relativa',
                borderColor: gradient2,
                data: [0],
                fill: false,
                tension: 0.4,
                pointRadius: 2,
                borderWidth: 2,
            },
            {
                label: 'Umidade Absoluta',
                borderColor: gradient3,
                data: [0],
                fill: false,
                tension: 0.4,
                pointRadius: 2,
                borderWidth: 2,
            },
            {
                label: 'Temperatura Real',
                borderColor: gradient4,
                data: [0],
                fill: false,
                tension: 0.4,
                pointRadius: 2,
                borderWidth: 2,
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Tempo (s)',
                    color: '#fff'
                },
                ticks: { color: '#aaa' },
                grid: {
                    color: 'rgba(255,255,255,0.1)'
                }
            },
            y: {
                beginAtZero: true,
                max: 80,
                display: true,
                title: {
                    display: true,
                    text: 'Valores',
                    color: '#fff'
                },
                ticks: { color: '#aaa' },
                grid: {
                    color: 'rgba(255,255,255,0.1)'
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: '#fff',
                    boxWidth: 12,
                }
            },
            tooltip: {
                mode: 'nearest',
                intersect: false,
                backgroundColor: '#333',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#fff',
                borderWidth: 1,
            }
        }
    }
});

let contador = 0;
function atualizarGrafico() {
    const setpoint = parseInt(document.getElementById('Setpoint').innerText.match(/\d+/)) || 0;
    const umidadeRelativa = parseInt(document.getElementById('UmidadeRelativa').innerText.match(/\d+/)) || 0;
    const umidadeAbsoluta = parseInt(document.getElementById('UmidadeAbsoluta').innerText.match(/\d+/)) || 0;
    const tempReal = parseInt(document.getElementById('TemperaturaReal').innerText.match(/\d+/)) || 0;
    chart.data.labels.push(contador++);
    chart.data.datasets[0].data.push(setpoint);
    chart.data.datasets[1].data.push(umidadeRelativa);
    chart.data.datasets[2].data.push(umidadeAbsoluta);
    chart.data.datasets[3].data.push(tempReal);

    const maxPontos = 60;
    if (chart.data.labels.length > maxPontos) {
        chart.data.labels.shift();

        chart.data.datasets.forEach(dataset => {
            dataset.data.shift();
        });
    }

    chart.update();
}
setInterval(atualizarGrafico, 1000);


window.onload = async () => {
    try {
        const response = await fetch("/status.json");
        const status = await response.json();

        console.log("📡 Status inicial:", status);
        state.targetTemp = status.Setpoint;
        state.isRunning = status.status;
        state.infiniteTimer = status.timerSecagem;

        if (state.isRunning == true) {
            state.status = 'heating';
        } else {
            state.status = 'idle';
        }

        document.getElementById("target-temp-input").value = state.targetTemp;
        document.getElementById("infinite-timer").checked = state.infiniteTimer;
        document.getElementById("timer-hours").value = status.horaRecebida;
        document.getElementById("timer-minutes").value = status.minutoRecebida;
    } catch (err) {
        console.error("❌ Erro ao carregar status:", err);
    }
};