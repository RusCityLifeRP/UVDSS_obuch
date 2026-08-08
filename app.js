// 1. Конфигурация Firebase Realtime Database
const firebaseConfig = {
    apiKey: "AIzaSyCm_VrQQuRcWBbaWXQ_X_kjjTIovnpbpnu",
    authDomain: "uvd-ss.firebaseapp.com",
    databaseURL: "https://uvd-ss-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "uvd-ss"",
    storageBucket: "uvd-ss.fire base storage.app",
    messagingSenderId: "182489841886",
    appId: "1:182489841886:web:2dd0ed4d1549080b86424f"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const staffRef = database.ref('uvd_rfo_staff');
const materialsRef = database.ref('uvd_rfo_materials');

// Пароль Лидера
const ADMIN_PASSWORD = "uvdpocao"; 

let isLeader = false;
let staff = [];
let materials = [];

// Стартовый состав УВД по Рублёвскому ФО
const defaultStaff = [
    { category: 'management', job: 'Начальник УВД по РФО', rank: 'Генерал-майор полиции', callsign: 'Рублёвка-1', name: 'Сергей Волков', onVacation: false, warns: 0, reps: 0 },
    { category: 'management', job: 'Зам. нач. УВД по РФО', rank: 'Полковник полиции', callsign: 'Рублёвка-2', name: 'Дмитрий Соколов', onVacation: false, warns: 0, reps: 0 },
    { category: 'heads', job: 'Нач. ОУР (Уголовный розыск)', rank: 'Подполковник полиции', callsign: 'Нач.ОУР', name: 'Игорь Орлов', onVacation: false, warns: 0, reps: 0 },
    { category: 'heads', job: 'Нач. ОППСП (Патрульная служба)', rank: 'Майор полиции', callsign: 'Ком.ППС', name: 'Роман Медведев', onVacation: false, warns: 0, reps: 0 },
    { category: 'special', job: 'Командир ОСН "ГРОМ"', rank: 'Подполковник полиции', callsign: 'Гром-1', name: 'Виктор Рыков', onVacation: false, warns: 0, reps: 0 },
    { category: 'officers', job: 'Старший оперуполномоченный ОУР', rank: 'Капитан полиции', callsign: 'Опер-1', name: 'Алексей Морозов', onVacation: false, warns: 0, reps: 0 }
];

const categoriesNames = {
    management: '⭐ Руководство УВД по Рублёвскому ФО',
    heads: '🛡️ Начальники Отделов и Подразделений',
    special: '⚡ Спецподразделение ОСН "ГРОМ"',
    officers: '👮 Личный состав'
};

// Элементы UI
const tbody = document.getElementById('staffList');
const addMemberBtn = document.getElementById('addMemberBtn');
const addMaterialBtn = document.getElementById('addMaterialBtn');
const addModal = document.getElementById('addModal');
const materialModal = document.getElementById('materialModal');

// Синхронизация состава с Firebase
staffRef.on('value', (snapshot) => {
    const data = snapshot.val();
    staff = data ? data : defaultStaff;
    if (!data) staffRef.set(defaultStaff);
    renderTable();
});

// Синхронизация материалов с Firebase
materialsRef.on('value', (snapshot) => {
    const data = snapshot.val();
    materials = data ? data : [];
    renderMaterials();
});

function saveStaff() { staffRef.set(staff); }
function saveMaterials() { materialsRef.set(materials); }

// Навигация по вкладкам
function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Отрисовка состава
function renderTable() {
    tbody.innerHTML = '';
    
    document.querySelectorAll('.admin-only').forEach(el => {
        isLeader ? el.classList.remove('hidden') : el.classList.add('hidden');
    });

    addMemberBtn.classList.toggle('hidden', !isLeader);
    addMaterialBtn.classList.toggle('hidden', !isLeader);

    ['management', 'heads', 'special', 'officers'].forEach(cat => {
        const catMembers = staff.filter(m => m.category === cat);

        if (catMembers.length > 0) {
            const headerRow = document.createElement('tr');
            headerRow.className = 'category-header';
            headerRow.innerHTML = `<td colspan="${isLeader ? 7 : 5}">${categoriesNames[cat]}</td>`;
            tbody.appendChild(headerRow);

            catMembers.forEach(member => {
                const globalIndex = staff.indexOf(member);
                const row = document.createElement('tr');
                if (member.onVacation) row.classList.add('on-vacation');

                let disciplineCell = '';
                if (isLeader) {
                    if (member.reps >= 2) {
                        disciplineCell = `
                            <div class="discipline-box">
                                <button class="btn btn-fire" onclick="fire(${globalIndex})">УВОЛИТЬ</button>
                                <button class="btn-sm" onclick="removeRep(${globalIndex})">-Выг</button>
                            </div>`;
                    } else {
                        disciplineCell = `
                            <div class="discipline-box">
                                <span class="badge-warn">${member.warns}/3 П.</span>
                                <span class="badge-rep">${member.reps}/2 В.</span>
                                <button class="btn-sm" onclick="addWarn(${globalIndex})">+Пред</button>
                                <button class="btn-sm" onclick="removeWarn(${globalIndex})">-Пред</button>
                                <button class="btn-sm" onclick="addRep(${globalIndex})">+Выг</button>
                                <button class="btn-sm" onclick="removeRep(${globalIndex})">-Выг</button>
                            </div>`;
                    }
                }

                row.innerHTML = `
                    <td>${member.job}</td>
                    <td>${member.rank}</td>
                    <td>${member.callsign}</td>
                    <td>${member.name}</td>
                    <td>
                        <button class="btn-status ${member.onVacation ? 'status-vac' : 'status-act'}" 
                                ${!isLeader ? 'disabled' : ''} onclick="toggleVacation(${globalIndex})">
                            ${member.onVacation ? 'В отпуске' : 'На службе'}
                        </button>
                    </td>
                    <td class="admin-only ${isLeader ? '' : 'hidden'}">${disciplineCell}</td>
                    <td class="admin-only ${isLeader ? '' : 'hidden'}">
                        <button class="btn btn-delete" onclick="removeStaff(${globalIndex})">Удалить</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    });
}

// Отрисовка материалов
function renderMaterials() {
    const lecturesContainer = document.getElementById('lecturesList');
    const trainingContainer = document.getElementById('trainingList');
    const videosContainer = document.getElementById('videosList');

    lecturesContainer.innerHTML = '';
    trainingContainer.innerHTML = '';
    videosContainer.innerHTML = '';

    materials.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card';

        let extraContent = '';
        if (item.type === 'lecture') {
            extraContent = `<button class="btn-sm" onclick="copyText('${item.id}')">📋 Скопировать текст</button>`;
        } else if (item.type === 'video' && item.link) {
            extraContent = `<a href="${item.link}" target="_blank" class="btn btn-add" style="text-decoration:none; text-align:center;">▶ Смотреть видео</a>`;
        }

        const deleteBtn = isLeader ? `<button class="btn btn-delete" onclick="deleteMaterial(${index})">Удалить</button>` : '';

        card.innerHTML = `
            <div>
                <h3>${item.title}</h3>
                <div class="card-text" id="text-${item.id}">${item.content}</div>
            </div>
            <div class="card-footer">
                ${extraContent}
                ${deleteBtn}
            </div>
        `;

        if (item.type === 'lecture') lecturesContainer.appendChild(card);
        else if (item.type === 'training') trainingContainer.appendChild(card);
        else if (item.type === 'video') videosContainer.appendChild(card);
    });
}

function copyText(id) {
    const text = document.getElementById(`text-${id}`).innerText;
    navigator.clipboard.writeText(text);
    alert('Текст лекции скопирован в буфер обмена!');
}

// Управление дисциплиной
function toggleVacation(i) { if(isLeader) { staff[i].onVacation = !staff[i].onVacation; saveStaff(); } }
function addWarn(i) { if(isLeader) { staff[i].warns++; if(staff[i].warns>=3){ staff[i].warns=0; staff[i].reps++; } saveStaff(); } }
function removeWarn(i) { if(isLeader && staff[i].warns>0) { staff[i].warns--; saveStaff(); } }
function addRep(i) { if(isLeader) { staff[i].reps++; saveStaff(); } }
function removeRep(i) { if(isLeader && staff[i].reps>0) { staff[i].reps--; saveStaff(); } }
function fire(i) { if(isLeader && confirm(`Уволить ${staff[i].name}?`)) { staff.splice(i, 1); saveStaff(); } }
function removeStaff(i) { if(isLeader && confirm(`Удалить ${staff[i].name}?`)) { staff.splice(i, 1); saveStaff(); } }

function deleteMaterial(i) {
    if (isLeader && confirm("Удалить этот учебный материал?")) {
        materials.splice(i, 1);
        saveMaterials();
    }
}

// Вход Лидера
document.getElementById('loginBtn').onclick = () => {
    const pin = prompt("Введите пароль Лидера УВД по РФО:");
    if (pin === ADMIN_PASSWORD) {
        isLeader = true;
        document.getElementById('roleBadge').innerText = "ЛИДЕР УВД РФО";
        document.getElementById('roleBadge').classList.add('badge-leader');
        document.getElementById('loginBtn').style.display = "none";
        renderTable();
        renderMaterials();
    } else if (pin !== null) {
        alert("Неверный пароль доступа!");
    }
};

// Модалки
addMemberBtn.onclick = () => addModal.style.display = "block";
addMaterialBtn.onclick = () => materialModal.style.display = "block";

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.onclick = () => {
        addModal.style.display = "none";
        materialModal.style.display = "none";
    }
});

// Форма добавления сотрудника
document.getElementById('addStaffForm').onsubmit = (e) => {
    e.preventDefault();
    if (!isLeader) return;

    staff.push({
        category: document.getElementById('newCategory').value,
        job: document.getElementById('newJob').value,
        rank: document.getElementById('newRank').value,
        callsign: document.getElementById('newCallsign').value,
        name: document.getElementById('newName').value,
        onVacation: false, warns: 0, reps: 0
    });

    saveStaff();
    document.getElementById('addStaffForm').reset();
    addModal.style.display = "none";
};

// Форма добавления материала
document.getElementById('addMaterialForm').onsubmit = (e) => {
    e.preventDefault();
    if (!isLeader) return;

    materials.push({
        id: Date.now().toString(),
        type: document.getElementById('matType').value,
        title: document.getElementById('matTitle').value,
        content: document.getElementById('matContent').value,
        link: document.getElementById('matLink').value
    });

    saveMaterials();
    document.getElementById('addMaterialForm').reset();
    materialModal.style.display = "none";
};
