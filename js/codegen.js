document.getElementById('startBtn').addEventListener('click',
    async () => {
        const startBtn = document.getElementById('startBtn');
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const keyContainer = document.getElementById('keyContainer');
        const generatedKeys = document.getElementById('generatedKeys');
        const keyCount = parseInt(document.getElementById('keyCountSelect').value);
        const gameId = parseInt(document.getElementById('gameSelect').value);
        if (gameId === 1) {
            APP_TOKEN = 'd28721be-fd2d-4b45-869e-9f253b554e50';
            PROMO_ID = '43e35910-c168-4634-ad4f-52fd764a843f';
            EVENTS_DELAY = 20000;
        } else if (gameId === 2) {
            APP_TOKEN = 'd1690a07-3780-4068-810f-9b5bbf2931b2';
            PROMO_ID = 'b4170868-cef0-424f-8eb9-be0622e8e8e3';
            EVENTS_DELAY = 20000;
        } else if (gameId === 3) {
            APP_TOKEN = '74ee0b5b-775e-4bee-974f-63e7f4d5bacb';
            PROMO_ID = 'fe693b26-b342-4159-8808-15e3ff7f8767';
            EVENTS_DELAY = 120000;
        } else {
            if (gameId === 4) {
                APP_TOKEN = '82647f43-3f87-402d-88dd-09a90025313f';
                PROMO_ID = 'c4480ac7-e178-4973-8061-9ed5b2e17954';
                EVENTS_DELAY = 120000;
            }
        }
        // Reset UI for new generation
        progressBar.style.width = '0%';
        progressText.innerText = 'генерация... ожидайте';
        progressContainer.classList.remove('hidden');
        keyContainer.classList.add('hidden');
        generatedKeys.innerText = '';

        startBtn.disabled = true;

        let progress = 0;
        const updateProgress = (increment) => {
            progress += increment;
            progressBar.style.width = `${progress}%`;
            // progressText.innerText = `${progress}%`;
        };

        const generateKeyProcess = async () => {
            const clientId = generateClientId();
            let clientToken;
            try {
                clientToken = await login(clientId);
            } catch (error) {
                alert(`Login failed: ${error.message}`);
                startBtn.disabled = false;
                return;
            }

            for (let i = 0; i < 7; i++) {
                await sleep(EVENTS_DELAY * delayRandom());
                const hasCode = await emulateProgress(clientToken);
                updateProgress(15 / keyCount); // Update progress incrementally
                if (hasCode) {
                    break;
                }
            }

            try {
                const key = await generateKey(clientToken);
                updateProgress(60); // Finalize progress
                progressText.innerText = 'Готово!';
                return key;
            } catch (error) {
                alert(`Key generation failed: ${error.message}`);
                return null;
            }
        };

        const keys = await Promise.all(Array.from({length: keyCount}, generateKeyProcess));

        generatedKeys.innerText = keys.filter(key => key).join('\n');
        keyContainer.classList.remove('hidden');

        startBtn.disabled = false;
    });

function generateClientId() {
    const timestamp = Date.now();
    const randomNumbers = Array.from({ length: 19 }, () => Math.floor(Math.random() * 10)).join('');
    return `${timestamp}-${randomNumbers}`;
}

async function login(clientId) {
    const response = await fetch('https://api.gamepromo.io/promo/login-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appToken: APP_TOKEN, clientId, clientOrigin: 'deviceid' })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
    }
    return data.clientToken;
}

async function emulateProgress(clientToken) {
    const response = await fetch('https://api.gamepromo.io/promo/register-event', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${clientToken}`
        },
        body: JSON.stringify({
            promoId: PROMO_ID,
            eventId: crypto.randomUUID(),
            eventOrigin: 'undefined'
        })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to register event');
    }
    return data.hasCode;
}

async function generateKey(clientToken) {
    const response = await fetch('https://api.gamepromo.io/promo/create-code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${clientToken}`
        },
        body: JSON.stringify({ promoId: PROMO_ID })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to generate key');
    }
    return data.promoCode;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function delayRandom() {
    return Math.random() / 3 + 1;
}