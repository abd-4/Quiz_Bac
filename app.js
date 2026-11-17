// ==================== إعدادات JSONBin.io والمطور ====================
const JSONBIN_BIN_ID = "6af7e806ffd5d16053c02657"; 
const JSONBIN_API_KEY = "$2a$10$4E5tRjBAaY8BZGvom1qx7OffYbN3aI5VxFZvBdjqIw5gzEgcjShRy";
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

const DEV_EMAIL = "abdalqadr3518@gmail.com";
const DEV_SECRET = "ABDALQADR_DEVELOPER";
const DEV_WHATSAPP = "963939084991";

// ملفات الـ PDF
const STUDY_PDFS = [
    { file: "pdfs/One_hundred_questions_on_neurosis.pdf", title: "علوم: 100 سؤال مؤتمت في العصبية 🧠" },
    { file: "pdfs/Ending_exercises.pdf", title: "رياضيات: تمارين على النهايات" },
    { file: "pdfs/Nuclear_Summary_Pxl.pdf", title: "كيمياء: ملخص نووية 🧪" },
    { file: "pdfs/Gases_Summary_Pxl.pdf", title: "كيمياء: ملخص غازات 💨" }
];

// روابط شروحات يوتيوب للمواد (اتركت لك أماكن النصوص والروابط لتعديلها بحرية)
const SUBJECT_VIDEOS_DATA = {
    math: [
        { text: "متتاليات (1)", url: "https://youtu.be/NQOLOW6kkiE?si=sUsS3gxonkl2sARt" },
        { text: "متتاليات (2)", url: "https://youtu.be/cQ835dUifbM?si=s3B_qoUesPUMKjHD" },
        { text: "متتاليات (3)", url: "https://youtu.be/YrHphQxsLuU?si=2HkqL6ki_R_NiG8M" },
        { text: "نص4", url: "#" }, { text: "نص5", url: "#" }, { text: "نص6", url: "#" }
    ],
    arabic: [
        { text: "نص1 (القواعد والنحو)", url: "#" },
        { text: "نص2 (البلاغة)", url: "#" },
        { text: "نص3 (النصوص الأدبية)", url: "#" }
    ],
    physics: [
        { text: "نص1 (المغناطيسية)", url: "#" },
        { text: "نص2 (الكهرباء)", url: "#" },
        { text: "نص3 (الأمواج)", url: "#" }
    ],
    chemistry: [
        { text: "نص1 (الكيمياء النووية)", url: "#" },
        { text: "نص2 (سرعة التفاعل)", url: "#" },
        { text: "نص3 (التوازن الكيميائي)", url: "#" }
    ],
    biology: [
        { text: "نص1 (العصبية)", url: "#" },
        { text: "نص2 (التكاثر)", url: "#" },
        { text: "نص3 (المستقبلات)", url: "#" }
    ],
    religion: [
        { text: "نص1 (الحديث الشريف)", url: "#" },
        { text: "نص2 (الفقه الإسلامي)", url: "#" },
        { text: "نص3 (السيرة)", url: "#" }
    ],
    english: [
        { text: "نص1 (Unit 1 Grammar)", url: "#" },
        { text: "نص2 (Unit 2 Reading)", url: "#" },
        { text: "نص3 (Writing Skills)", url: "#" }
    ],
    foreign: [
        { text: "نص1 (Leçon 1)", url: "#" },
        { text: "نص2 (Leçon 2)", url: "#" },
        { text: "نص3 (Grammaire)", url: "#" }
    ]
};

let db = { users: [], quizzes: [], ratings: [] };
let currentUser = null;
let isDeveloper = false;
let selectedStars = 0;
let editingQuizId = null;
let editingUserIndex = null;
let quizTimerInterval = null;

// ==================== وظائف تبويب الشروحات ====================
window.openSubjectVideos = (subjectKey) => {
    document.getElementById("subjects-main-menu").classList.add("hidden");
    const container = document.getElementById("subject-videos-container");
    container.classList.remove("hidden");

    const titles = {
        math: "رياضيات", arabic: "لغة عربية", physics: "فيزياء", chemistry: "كيمياء",
        biology: "علم الأحياء", religion: "تربية دينية", english: "لغة انكليزية", foreign: "لغة أجنبية"
    };

    document.getElementById("selected-subject-title").textContent = `شروحات مادة: ${titles[subjectKey]}`;
    const grid = document.getElementById("videos-buttons-grid");
    
    const videos = SUBJECT_VIDEOS_DATA[subjectKey] || [];
    grid.innerHTML = videos.map(v => `
        <a href="${v.url}" target="_blank" class="video-btn-item">
            <span>${v.text}</span>
        </a>
    `).join("");
};

window.backToSubjectsMenu = () => {
    document.getElementById("subject-videos-container").classList.add("hidden");
    document.getElementById("subjects-main-menu").classList.remove("hidden");
};

// ==================== إدارة قاعدة البيانات والاتصال ====================
function showLoader(text = "جاري التحميل...") {
    document.getElementById("loader-text").textContent = text;
    document.getElementById("loader").classList.remove("hidden");
}

function hideLoader() {
    document.getElementById("loader").classList.add("hidden");
}

async function fetchDatabase() {
    showLoader("جاري الاتصال بالخادم...");
    try {
        const res = await fetch(`${JSONBIN_URL}/latest`, {
            headers: { "X-Master-Key": JSONBIN_API_KEY }
        });
        const data = await res.json();
        db = data.record || { users: [], quizzes: [], ratings: [] };
        if (!db.users) db.users = [];
        if (!db.quizzes) db.quizzes = [];
        if (!db.ratings) db.ratings = [];
    } catch (err) {
        alert("تعذر الاتصال بقاعدة البيانات.");
        console.error(err);
    } finally {
        hideLoader();
    }
}

async function saveDatabase() {
    showLoader("جاري حفظ البيانات سحابياً...");
    try {
        await fetch(JSONBIN_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": JSONBIN_API_KEY
            },
            body: JSON.stringify(db)
        });
    } catch (err) {
        alert("حدث خطأ أثناء الحفظ!");
        console.error(err);
    } finally {
        hideLoader();
    }
}

function setupPasswordToggles() {
    const toggles = [
        { icon: "toggle-login-pass", input: "login-password" },
        { icon: "toggle-reg-pass", input: "reg-password" },
        { icon: "toggle-dev-pass", input: "dev-secret-input" },
        { icon: "toggle-old-pass", input: "old-pass-input" },
        { icon: "toggle-new-pass", input: "new-pass-input" },
        { icon: "toggle-dev-u-pass", input: "dev-u-password" }
    ];

    toggles.forEach(item => {
        const iconEl = document.getElementById(item.icon);
        const inputEl = document.getElementById(item.input);
        if (iconEl && inputEl) {
            iconEl.onclick = () => {
                if (inputEl.type === "password") {
                    inputEl.type = "text";
                    iconEl.className = "fa-solid fa-eye-slash toggle-password";
                } else {
                    inputEl.type = "password";
                    iconEl.className = "fa-solid fa-eye toggle-password";
                }
            };
        }
    });
}

window.addEventListener("DOMContentLoaded", async () => {
    renderPdfs();
    setupPasswordToggles();
    await fetchDatabase();

    const savedSession = JSON.parse(localStorage.getItem("bac_abdalqadr_session"));
    if (savedSession) {
        if (savedSession.isDev) {
            isDeveloper = true;
            currentUser = { fullName: "المطور عبدالقادر", email: DEV_EMAIL, username: "abdalqadr_dev", avatar: "" };
            enterApp();
        } else {
            const found = db.users.find(u => u.id === savedSession.userId);
            if (found) {
                currentUser = found;
                isDeveloper = false;
                enterApp();
            }
        }
    }
});

// ==================== تسجيل الدخول والحسابات ====================
document.getElementById("show-register-btn").onclick = () => {
    document.getElementById("login-form").classList.add("hidden");
    document.getElementById("register-form").classList.remove("hidden");
};

document.getElementById("show-login-btn").onclick = () => {
    document.getElementById("register-form").classList.add("hidden");
    document.getElementById("login-form").classList.remove("hidden");
};

document.getElementById("register-form").onsubmit = async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const password = document.getElementById("reg-password").value;

    if (email === DEV_EMAIL) {
        alert("هذا البريد مخصص لمطور الموقع!");
        return;
    }

    await fetchDatabase();
    if (db.users.some(u => u.email.toLowerCase() === email)) {
        alert("هذا البريد مسجل مسبقاً.");
        return;
    }

    const baseName = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    const generatedUsername = `${baseName || "student"}_${Math.floor(100 + Math.random() * 900)}`;

    const newUser = {
        id: "user_" + Date.now(),
        fullName, email, username: generatedUsername, password,
        avatar: "", hasRated: false, lastUsernameChange: 0
    };

    db.users.push(newUser);
    await saveDatabase();

    currentUser = newUser;
    isDeveloper = false;

    document.getElementById("generated-username-display").textContent = generatedUsername;
    document.getElementById("username-alert-modal").classList.remove("hidden");
};

document.getElementById("close-username-modal").onclick = () => {
    document.getElementById("username-alert-modal").classList.add("hidden");
    enterApp();
};

document.getElementById("login-form").onsubmit = async (e) => {
    e.preventDefault();
    const identifier = document.getElementById("login-identifier").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;
    const remember = document.getElementById("remember-me").checked;

    if (identifier === DEV_EMAIL) {
        document.getElementById("dev-modal").classList.remove("hidden");
        return;
    }

    await fetchDatabase();
    const user = db.users.find(u => (u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier) && u.password === password);

    if (!user) {
        alert("بيانات الدخول غير صحيحة!");
        return;
    }

    currentUser = user;
    isDeveloper = false;
    if (remember) {
        localStorage.setItem("bac_abdalqadr_session", JSON.stringify({ userId: user.id, isDev: false }));
    }
    enterApp();
};

document.getElementById("verify-dev-btn").onclick = async () => {
    const secret = document.getElementById("dev-secret-input").value.trim();
    if (secret === DEV_SECRET) {
        document.getElementById("dev-modal").classList.add("hidden");
        isDeveloper = true;
        currentUser = { fullName: "المطور عبدالقادر", email: DEV_EMAIL, username: "abdalqadr_dev", avatar: "" };
        if (document.getElementById("remember-me").checked) {
            localStorage.setItem("bac_abdalqadr_session", JSON.stringify({ isDev: true }));
        }
        await fetchDatabase();
        enterApp();
    } else {
        alert("كلمة سر المطور خاطئة!");
    }
};

document.getElementById("cancel-dev-btn").onclick = () => {
    document.getElementById("dev-modal").classList.add("hidden");
};

function enterApp() {
    document.getElementById("auth-screen").classList.add("hidden");
    document.getElementById("app-container").classList.remove("hidden");

    const badge = document.getElementById("role-badge");
    const navQuizLabel = document.getElementById("nav-quizzes-label");
    const quizHeading = document.getElementById("quizzes-tab-heading");

    if (isDeveloper) {
        badge.textContent = "وضع المطور";
        badge.className = "badge-dev";
        navQuizLabel.textContent = "اختبارات الطلاب";
        quizHeading.textContent = "اختبارات الطلاب";
        document.getElementById("create-quiz-btn").classList.remove("hidden");
        document.getElementById("request-quiz-btn").classList.add("hidden");
        document.getElementById("dev-users-panel").classList.remove("hidden");
        renderDevUsersList();
    } else {
        badge.textContent = "طالب";
        badge.className = "badge-student";
        navQuizLabel.textContent = "اختباراتي";
        quizHeading.textContent = "اختباراتي";
        document.getElementById("create-quiz-btn").classList.add("hidden");
        document.getElementById("request-quiz-btn").classList.remove("hidden");
        document.getElementById("dev-users-panel").classList.add("hidden");
    }

    updateStatsAndRating();
    renderQuizzes();
    loadProfileUI();
}

document.querySelectorAll(".nav-item").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const targetId = btn.getAttribute("data-target");
        document.querySelectorAll(".tab-view").forEach(tab => tab.classList.add("hidden"));
        document.getElementById(targetId).classList.remove("hidden");
    };
});

// ==================== الإحصائيات والتقييم ====================
function updateStatsAndRating() {
    document.getElementById("stat-users").textContent = db.users.length;
    document.getElementById("stat-quizzes").textContent = db.quizzes.length;

    let bestStudentName = "لا يوجد بعد";
    let maxCompleted = 0;
    let highestAvg = 0;

    db.users.forEach(user => {
        const userQuizzes = db.quizzes.filter(q => (q.targetUsername.toLowerCase() === user.username.toLowerCase() || q.targetUsername.toLowerCase() === 'all') && q.completed);
        if (userQuizzes.length > 0) {
            const avg = userQuizzes.reduce((acc, q) => acc + q.result.percentage, 0) / userQuizzes.length;
            if (userQuizzes.length > maxCompleted || (userQuizzes.length === maxCompleted && avg > highestAvg)) {
                maxCompleted = userQuizzes.length;
                highestAvg = avg;
                bestStudentName = user.fullName;
            }
        }
    });
    document.getElementById("stat-top-student").textContent = bestStudentName;

    if (db.ratings.length > 0) {
        const sum = db.ratings.reduce((a, b) => a + b, 0);
        document.getElementById("stat-rating").textContent = `${(sum / db.ratings.length).toFixed(1)} / 5`;
    } else {
        document.getElementById("stat-rating").textContent = "5.0 / 5";
    }

    if (!isDeveloper && currentUser.hasRated) {
        document.getElementById("submit-rating-btn").classList.add("hidden");
        document.getElementById("rating-locked-msg").classList.remove("hidden");
        document.querySelectorAll(".star-item").forEach(s => s.style.pointerEvents = "none");
    }
}

document.querySelectorAll(".star-item").forEach(star => {
    star.onclick = () => {
        if (!isDeveloper && currentUser.hasRated) return;
        selectedStars = parseInt(star.getAttribute("data-val"));
        document.querySelectorAll(".star-item").forEach(s => {
            s.classList.toggle("active", parseInt(s.getAttribute("data-val")) <= selectedStars);
        });
    };
});

document.getElementById("submit-rating-btn").onclick = async () => {
    if (selectedStars === 0) { alert("اختر النجوم أولاً!"); return; }
    db.ratings.push(selectedStars);
    if (!isDeveloper) {
        currentUser.hasRated = true;
        const idx = db.users.findIndex(u => u.id === currentUser.id);
        if (idx !== -1) db.users[idx].hasRated = true;
    }
    await saveDatabase();
    updateStatsAndRating();
};

// ==================== طلب اختبار عبر واتساب ====================
document.getElementById("request-quiz-btn").onclick = () => {
    document.getElementById("req-subject").value = "";
    document.getElementById("req-topic").value = "";
    document.getElementById("req-student-name").value = currentUser ? currentUser.fullName : "";
    document.getElementById("req-notes").value = "";
    document.getElementById("request-quiz-modal").classList.remove("hidden");
};

document.getElementById("cancel-quiz-request").onclick = () => {
    document.getElementById("request-quiz-modal").classList.add("hidden");
};

document.getElementById("send-quiz-request-whatsapp").onclick = () => {
    const subject = document.getElementById("req-subject").value.trim();
    const topic = document.getElementById("req-topic").value.trim();
    const studentName = document.getElementById("req-student-name").value.trim();
    const notes = document.getElementById("req-notes").value.trim();

    if (!subject || !topic || !studentName) { alert("يرجى تعبئة الحقول الأساسية!"); return; }

    const message = `السلام عليكم أستاذ عبدالقادر، أريد طلب اختبار جديد:%0A` +
        `- المادة: ${subject}%0A- البحث: ${topic}%0A- الطالب: ${studentName}%0A- ملاحظات: ${notes || "لا توجد"}`;

    window.open(`https://wa.me/+${DEV_WHATSAPP}?text=${message}`, "_blank");
    document.getElementById("request-quiz-modal").classList.add("hidden");
};

// ==================== إدارة الأعضاء للمطور ====================
function renderDevUsersList() {
    const container = document.getElementById("dev-users-list");
    if (db.users.length === 0) { container.innerHTML = "<p style='text-align:center; color:#94a3b8;'>لا توجد طلاب.</p>"; return; }
    container.innerHTML = db.users.map((u, idx) => `
        <div class="user-row-card">
            <div><strong>الاسم:</strong> ${u.fullName}</div>
            <div><strong>اليوزر:</strong> <span dir="ltr">${u.username}</span></div>
            <div><strong>البريد:</strong> <span dir="ltr">${u.email}</span></div>
            <div><strong>كلمة المرور:</strong> <span dir="ltr" style="color:#fbbf24;">${u.password}</span></div>
            <div style="margin-top:8px; display:flex; gap:8px;">
                <button onclick="openDevEditUser(${idx})" class="btn-small-gold">تعديل</button>
                <button onclick="devDeleteUser(${idx})" class="btn-text-danger">حذف</button>
            </div>
        </div>
    `).join("");
}

document.getElementById("dev-add-user-btn").onclick = () => {
    editingUserIndex = null;
    document.getElementById("dev-user-modal-title").textContent = "إضافة طالب";
    document.getElementById("dev-u-name").value = "";
    document.getElementById("dev-u-email").value = "";
    document.getElementById("dev-u-username").value = "";
    document.getElementById("dev-u-password").value = "";
    document.getElementById("dev-user-modal").classList.remove("hidden");
};

window.openDevEditUser = (idx) => {
    editingUserIndex = idx;
    const u = db.users[idx];
    document.getElementById("dev-user-modal-title").textContent = "تعديل طالب";
    document.getElementById("dev-u-name").value = u.fullName;
    document.getElementById("dev-u-email").value = u.email;
    document.getElementById("dev-u-username").value = u.username;
    document.getElementById("dev-u-password").value = u.password;
    document.getElementById("dev-user-modal").classList.remove("hidden");
};

document.getElementById("dev-save-user-btn").onclick = async () => {
    const fullName = document.getElementById("dev-u-name").value.trim();
    const email = document.getElementById("dev-u-email").value.trim();
    const username = document.getElementById("dev-u-username").value.trim();
    const password = document.getElementById("dev-u-password").value.trim();

    if (!fullName || !email || !username || !password) { alert("جميع الحقول مطلوبة!"); return; }

    if (editingUserIndex === null) {
        db.users.push({ id: "user_" + Date.now(), fullName, email, username, password, avatar: "", hasRated: false, lastUsernameChange: 0 });
    } else {
        Object.assign(db.users[editingUserIndex], { fullName, email, username, password });
    }

    await saveDatabase();
    document.getElementById("dev-user-modal").classList.add("hidden");
    renderDevUsersList();
    updateStatsAndRating();
};

document.getElementById("dev-cancel-user-btn").onclick = () => { document.getElementById("dev-user-modal").classList.add("hidden"); };

window.devDeleteUser = async (idx) => {
    if (confirm("هل تريد حذف هذا الطالب؟")) {
        db.users.splice(idx, 1);
        await saveDatabase();
        renderDevUsersList();
        updateStatsAndRating();
    }
};

// ==================== نظام الاختبارات (المؤقت الزمني، الحفظ سحابياً والمشاركة الفورية) ====================
function renderQuizzes() {
    const container = document.getElementById("quizzes-list");
    const list = isDeveloper
        ? db.quizzes
        : db.quizzes.filter(q => q.targetUsername.toLowerCase() === currentUser.username.toLowerCase() || q.targetUsername.toLowerCase() === 'all');

    if (list.length === 0) { container.innerHTML = "<p style='text-align:center; color:#94a3b8;'>لا توجد اختبارات.</p>"; return; }

    container.innerHTML = list.map(q => `
        <div class="item-card">
            <div class="item-card-top">
                <div>
                    <div class="item-card-title">${q.title}</div>
                    ${isDeveloper ? `<small style="color:#fbbf24;">إلى: @${q.targetUsername}</small>` : ""}
                </div>
                <span style="font-size:0.8rem; color:${q.completed ? '#4ade80' : '#facc15'};">${q.completed ? "مُنجز ✓" : "جاهز للحل"}</span>
            </div>
            <div class="card-actions">
                ${!isDeveloper ? `<button onclick="startQuiz('${q.id}')" class="btn-start-quiz">${q.completed ? "إعادة الحل" : "بدء الاختبار"}</button>` : ""}
                <button onclick="showQuizResult('${q.id}')" class="btn-result">النتيجة</button>
                ${isDeveloper ? `
                    <button onclick="editQuiz('${q.id}')" class="btn-small-gold">تعديل</button>
                    <button onclick="reShareQuiz('${q.id}')" class="btn-outline-gold" style="padding:5px 10px; font-size:0.8rem;">إعادة مشاركة</button>
                    <button onclick="deleteQuiz('${q.id}')" class="btn-text-danger">حذف</button>
                ` : ""}
            </div>
        </div>
    `).join("");
}

document.getElementById("create-quiz-btn").onclick = () => {
    editingQuizId = null;
    document.getElementById("builder-modal-title").textContent = "إنشاء اختبار جديد سحابياً";
    document.getElementById("quiz-title-input").value = "";
    document.getElementById("quiz-target-user").value = "";
    document.getElementById("builder-questions-list").innerHTML = "";
    setupCloudTemplatesSelect();
    document.getElementById("quiz-builder-modal").classList.remove("hidden");
};

// تعبئة قائمة الاختبارات السحابية المحفوظة مسبقاً لإعادة مشاركتها
function setupCloudTemplatesSelect() {
    const select = document.getElementById("cloud-quiz-templates-select");
    select.innerHTML = '<option value="">-- اختر اختباراً جاهزاً لإعادة استخدامه --</option>' +
        db.quizzes.map(q => `<option value="${q.id}">${q.title} (موجه إلى: @${q.targetUsername})</option>`).join("");
}

document.getElementById("load-cloud-template-btn").onclick = () => {
    const qId = document.getElementById("cloud-quiz-templates-select").value;
    if (!qId) return;
    const q = db.quizzes.find(item => item.id === qId);
    if (!q) return;

    document.getElementById("quiz-title-input").value = q.title + " (نسخة جديدة)";
    document.getElementById("quiz-target-user").value = q.targetUsername;
    document.getElementById("builder-questions-list").innerHTML = "";
    q.questions.forEach(ques => addQuestionBlock(ques.type, ques));
    alert("تم استيراد أسئلة الاختبار بنجاح، يمكنك حفظه ومشاركته فوراً!");
};

document.getElementById("add-mcq-btn").onclick = () => addQuestionBlock("mcq");
document.getElementById("add-text-q-btn").onclick = () => addQuestionBlock("text");

function addQuestionBlock(type, existingData = null) {
    const container = document.getElementById("builder-questions-list");
    const div = document.createElement("div");
    div.className = "builder-q-card";
    div.setAttribute("data-type", type);

    const timerVal = existingData && existingData.timerSeconds ? existingData.timerSeconds : 60;
    const groupName = "group_q_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    div.setAttribute('data-group-name', groupName);

    if (type === "mcq") {
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <strong>سؤال خيارات متعددة</strong>
                <button type="button" onclick="this.parentElement.parentElement.remove()" class="btn-text-danger">حذف</button>
            </div>
            <input type="text" class="q-text" placeholder="نص السؤال" value="${existingData ? existingData.question : ""}" style="width:100%; padding:8px; margin-bottom:6px; border-radius:8px; background:#222b35; color:#fff; border:1px solid #9a6326;">
            <div style="display:flex; gap:10px; margin-bottom:6px; align-items:center;">
                <label style="font-size:0.85rem; color:#fbbf24;">مدة السؤال (ثواني):</label>
                <input type="number" class="q-timer" value="${timerVal}" min="10" max="600" style="width:90px; padding:6px; border-radius:8px; background:#222b35; color:#fff; border:1px solid #9a6326;">
            </div>
            <select class="opt-count" onchange="updateMcqOptions(this)" style="width:100%; padding:6px; margin-bottom:6px; border-radius:8px; background:#222b35; color:#fff;">
                <option value="2" ${existingData?.options?.length === 2 ? "selected" : ""}>خيارين</option>
                <option value="3" ${existingData?.options?.length === 3 ? "selected" : ""}>ثلاث خيارات</option>
                <option value="4" ${!existingData || existingData?.options?.length === 4 ? "selected" : ""}>أربع خيارات</option>
            </select>
            <div class="mcq-options-inputs"></div>
        `;
        container.appendChild(div);
        updateMcqOptions(div.querySelector(".opt-count"), existingData);
    } else {
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <strong>سؤال إجابة كتابية</strong>
                <button type="button" onclick="this.parentElement.parentElement.remove()" class="btn-text-danger">حذف</button>
            </div>
            <input type="text" class="q-text" placeholder="نص السؤال" value="${existingData ? existingData.question : ""}" style="width:100%; padding:8px; margin-bottom:6px; border-radius:8px; background:#222b35; color:#fff; border:1px solid #9a6326;">
            <div style="display:flex; gap:10px; margin-bottom:6px; align-items:center;">
                <label style="font-size:0.85rem; color:#fbbf24;">مدة السؤال (ثواني):</label>
                <input type="number" class="q-timer" value="${timerVal}" min="10" max="600" style="width:90px; padding:6px; border-radius:8px; background:#222b35; color:#fff; border:1px solid #9a6326;">
            </div>
            <input type="text" class="q-correct-text" placeholder="الإجابة الصحيحة" value="${existingData ? existingData.correctAnswer : ""}" style="width:100%; padding:8px; border-radius:8px; background:#222b35; color:#4ade80; border:1px solid #4ade80;">
        `;
        container.appendChild(div);
    }
}

window.updateMcqOptions = (selectEl, existingData = null) => {
    const count = parseInt(selectEl.value);
    const box = selectEl.parentElement.querySelector(".mcq-options-inputs");
    if (!box) return;

    const questionCard = selectEl.closest('.builder-q-card');
    const groupName = questionCard ? questionCard.getAttribute('data-group-name') : ("group_" + Math.random());

    box.innerHTML = "";
    for (let i = 0; i < count; i++) {
        const val = existingData && existingData.options && existingData.options[i] ? existingData.options[i] : "";
        const isCorrect = existingData ? existingData.correctIndex === i : i === 0;
        box.innerHTML += `
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
                <input type="radio" name="${groupName}" class="opt-radio" ${isCorrect ? "checked" : ""}>
                <input type="text" class="opt-val" placeholder="الخيار ${i + 1}" value="${val}" style="flex:1; padding:6px; border-radius:6px; background:#222b35; color:#fff; border:1px solid #555;">
            </div>
        `;
    }
};

document.getElementById("save-quiz-btn").onclick = async () => {
    const title = document.getElementById("quiz-title-input").value.trim();
    const targetUsername = document.getElementById("quiz-target-user").value.trim();
    if (!title || !targetUsername) { alert("أدخل العنوان ويوزر الطالب أو all!"); return; }

    const questions = [];
    document.querySelectorAll(".builder-q-card").forEach(card => {
        const type = card.getAttribute("data-type");
        const qText = card.querySelector(".q-text").value.trim();
        const timerSeconds = parseInt(card.querySelector(".q-timer").value) || 60;
        if (!qText) return;

        if (type === "mcq") {
            const options = [];
            let correctIndex = 0;
            card.querySelectorAll(".opt-val").forEach((inp, idx) => {
                options.push(inp.value.trim());
                if (inp.previousElementSibling.checked) correctIndex = idx;
            });
            questions.push({ type: "mcq", question: qText, timerSeconds, options, correctIndex });
        } else {
            const correctAnswer = card.querySelector(".q-correct-text").value.trim();
            questions.push({ type: "text", question: qText, timerSeconds, correctAnswer });
        }
    });

    if (questions.length === 0) { alert("أضف سؤالاً واحداً على الأقل!"); return; }

    if (editingQuizId) {
        const idx = db.quizzes.findIndex(q => q.id === editingQuizId);
        if (idx !== -1) {
            db.quizzes[idx].title = title;
            db.quizzes[idx].targetUsername = targetUsername;
            db.quizzes[idx].questions = questions;
        }
    } else {
        db.quizzes.push({
            id: "quiz_" + Date.now(),
            title, targetUsername, questions,
            completed: false, result: null
        });
    }

    await saveDatabase();
    document.getElementById("quiz-builder-modal").classList.add("hidden");
    renderQuizzes();
    updateStatsAndRating();
    alert("تم حفظ الاختبار سحابياً وإرساله للطالب فوراً بنجاح!");
};

document.getElementById("cancel-quiz-builder").onclick = () => {
    document.getElementById("quiz-builder-modal").classList.add("hidden");
};

window.editQuiz = (id) => {
    const q = db.quizzes.find(item => item.id === id);
    if (!q) return;
    editingQuizId = id;
    document.getElementById("builder-modal-title").textContent = "تعديل الاختبار السحابي";
    document.getElementById("quiz-title-input").value = q.title;
    document.getElementById("quiz-target-user").value = q.targetUsername;
    document.getElementById("builder-questions-list").innerHTML = "";
    q.questions.forEach(ques => addQuestionBlock(ques.type, ques));
    setupCloudTemplatesSelect();
    document.getElementById("quiz-builder-modal").classList.remove("hidden");
};

window.reShareQuiz = async (id) => {
    const q = db.quizzes.find(item => item.id === id);
    if (!q) return;
    const targetUser = prompt("أدخل يوزرنيم الطالب الجديد (أو اكتب all لمشاركته للجميع):", "");
    if (!targetUser) return;

    const duplicatedQuiz = {
        ...q,
        id: "quiz_" + Date.now(),
        title: q.title + " (مكرر)",
        targetUsername: targetUser.trim(),
        completed: false,
        result: null
    };

    db.quizzes.push(duplicatedQuiz);
    await saveDatabase();
    renderQuizzes();
    updateStatsAndRating();
    alert("تم إعادة مشاركة الاختبار للطالب الجديد بنجاح فوري ودون إعادة كتابة!");
};

window.deleteQuiz = async (id) => {
    if (confirm("حذف هذا الاختبار نهائياً؟")) {
        db.quizzes = db.quizzes.filter(q => q.id !== id);
        await saveDatabase();
        renderQuizzes();
        updateStatsAndRating();
    }
};

// نظام حل الاختبار مع تشغيل المؤقت الزمني
let activeSolvingQuiz = null;

window.startQuiz = (id) => {
    activeSolvingQuiz = db.quizzes.find(q => q.id === id);
    if (!activeSolvingQuiz) return;

    document.getElementById("quizzes-list").classList.add("hidden");
    document.getElementById("quiz-solver-box").classList.remove("hidden");
    document.getElementById("solving-quiz-title").textContent = activeSolvingQuiz.title;

    const container = document.getElementById("solver-questions-container");
    container.innerHTML = activeSolvingQuiz.questions.map((q, idx) => {
        if (q.type === "mcq") {
            return `
                <div class="q-block">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <p style="margin:0;">${idx + 1}. ${q.question}</p>
                        <span class="quiz-timer-badge" id="timer_q_${idx}">${q.timerSeconds || 60} ثانية</span>
                    </div>
                    ${q.options.map((opt, oIdx) => `
                        <label class="option-label">
                            <input type="radio" name="ans_${idx}" value="${oIdx}">
                            <span>${opt}</span>
                        </label>
                    `).join("")}
                </div>
            `;
        } else {
            return `
                <div class="q-block">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <p style="margin:0;">${idx + 1}. ${q.question}</p>
                        <span class="quiz-timer-badge" id="timer_q_${idx}">${q.timerSeconds || 60} ثانية</span>
                    </div>
                    <input type="text" id="text_ans_${idx}" placeholder="اكتب إجابتك هنا..." style="width:100%; padding:10px; border-radius:8px; background:#222b35; color:#fff; border:1px solid #9a6326;">
                </div>
            `;
        }
    }).join("");

    startQuizTimers(activeSolvingQuiz.questions);
};

function startQuizTimers(questions) {
    if (quizTimerInterval) clearInterval(quizTimerInterval);

    let timeLefts = questions.map(q => q.timerSeconds || 60);
    
    quizTimerInterval = setInterval(() => {
        let allFinished = true;
        questions.forEach((q, idx) => {
            const badge = document.getElementById(`timer_q_${idx}`);
            if (badge && timeLefts[idx] > 0) {
                timeLefts[idx]--;
                badge.textContent = `${timeLefts[idx]} ثانية`;
                allFinished = false;
                if (timeLefts[idx] <= 10) badge.style.color = "#ef4444";
            } else if (badge && timeLefts[idx] <= 0) {
                badge.textContent = "انتهى الوقت!";
            }
        });

        if (allFinished) {
            clearInterval(quizTimerInterval);
        }
    }, 1000);
}

document.getElementById("exit-solver-btn").onclick = () => {
    if (quizTimerInterval) clearInterval(quizTimerInterval);
    document.getElementById("quiz-solver-box").classList.add("hidden");
    document.getElementById("quizzes-list").classList.remove("hidden");
};

document.getElementById("submit-quiz-answers-btn").onclick = async () => {
    if (quizTimerInterval) clearInterval(quizTimerInterval);
    let correctCount = 0;
    const total = activeSolvingQuiz.questions.length;
    const studentAnswers = [];

    activeSolvingQuiz.questions.forEach((q, idx) => {
        if (q.type === "mcq") {
            const selected = document.querySelector(`input[name="ans_${idx}"]:checked`);
            const ansVal = selected ? parseInt(selected.value) : null;
            studentAnswers.push(ansVal);
            if (ansVal === q.correctIndex) correctCount++;
        } else {
            const ans = document.getElementById(`text_ans_${idx}`).value.trim();
            studentAnswers.push(ans);
            if (ans.toLowerCase() === q.correctAnswer.trim().toLowerCase()) correctCount++;
        }
    });

    const wrongCount = total - correctCount;
    const percentage = Math.round((correctCount / total) * 100);
    let evaluation = percentage >= 90 ? "ممتاز جداً 🌟" : percentage >= 75 ? "جيد جداً 👍" : percentage >= 50 ? "مقبول 👌" : "يحتاج مراجعة";

    activeSolvingQuiz.completed = true;
    activeSolvingQuiz.studentAnswers = studentAnswers;
    activeSolvingQuiz.result = { correctCount, wrongCount, total, percentage, evaluation };

    await saveDatabase();
    document.getElementById("quiz-solver-box").classList.add("hidden");
    document.getElementById("quizzes-list").classList.remove("hidden");
    renderQuizzes();
    updateStatsAndRating();
    showQuizResult(activeSolvingQuiz.id);
};

window.showQuizResult = (id) => {
    const q = db.quizzes.find(item => item.id === id);
    const box = document.getElementById("result-details");
    if (!q || !q.completed || !q.result) {
        box.innerHTML = "<p style='text-align:center; color:#fbbf24;'>لم يُحل بعد!</p>";
    } else {
        const r = q.result;
        let detailsHtml = `
            <div style="margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px; text-align:right;">
                <div>👤 الطالب: <strong>@${q.targetUsername}</strong></div>
                <div>✅ الصحيحة: <strong>${r.correctCount}</strong></div>
                <div>❌ الخاطئة: <strong>${r.wrongCount}</strong></div>
                <div>📊 المجموع: <strong>${r.total}</strong></div>
                <div>🎯 النسبة: <strong>${r.percentage}%</strong></div>
                <div>🏅 التقييم: <strong>${r.evaluation}</strong></div>
            </div>
            <h4 style="color:var(--gold-light); margin-bottom:8px; text-align:right;">📝 إجابات الطالب والتدقيق البشري:</h4>
        `;

        if (q.questions && q.questions.length > 0) {
            detailsHtml += q.questions.map((ques, idx) => {
                const studentAns = q.studentAnswers ? q.studentAnswers[idx] : null;
                let studentAnsText = "";
                let isCorrect = false;

                if (ques.type === "mcq") {
                    studentAnsText = studentAns !== null && studentAns !== undefined ? ques.options[studentAns] : "لم يُجب";
                    isCorrect = studentAns === ques.correctIndex;
                } else {
                    studentAnsText = studentAns || "لم يُجب";
                    isCorrect = studentAns && studentAns.trim().toLowerCase() === ques.correctAnswer.trim().toLowerCase();
                }

                if (q.manualOverrides && q.manualOverrides[idx] === 'correct') isCorrect = true;
                if (q.manualOverrides && q.manualOverrides[idx] === 'wrong') isCorrect = false;

                return `
                    <div style="background:var(--input-bg); padding:10px; border-radius:8px; margin-bottom:8px; text-align:right;">
                        <div><strong>س${idx + 1}:</strong> ${ques.question}</div>
                        <div style="color:${isCorrect ? '#4ade80' : '#ef4444'}; margin-top:4px;">
                            إجابة الطالب: <strong>${studentAnsText}</strong> ${isCorrect ? '✓' : '✗'}
                        </div>
                        <div style="color:#fbbf24; font-size:0.85rem; margin-top:2px;">
                            الإجابة النموذجية: ${ques.type === 'mcq' ? ques.options[ques.correctIndex] : ques.correctAnswer}
                        </div>
                        ${isDeveloper ? `
                            <div style="margin-top:6px; display:flex; gap:6px; align-items:center; justify-content:flex-end;">
                                <label style="font-size:0.8rem; color:#cbd5e1;">تدقيق بشري:</label>
                                <select onchange="manualOverrideGrade('${q.id}', ${idx}, this.value)" style="padding:4px; border-radius:6px; background:#131c24; color:#fff; border:1px solid var(--border-gold); font-size:0.8rem;">
                                    <option value="auto" ${!q.manualOverrides?.[idx] ? 'selected' : ''}>حسب النظام</option>
                                    <option value="correct" ${q.manualOverrides?.[idx] === 'correct' ? 'selected' : ''}>تصحيح كـ (صحيح)</option>
                                    <option value="wrong" ${q.manualOverrides?.[idx] === 'wrong' ? 'selected' : ''}>تصحيح كـ (خطأ)</option>
                                </select>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join("");
        }

        box.innerHTML = detailsHtml;
    }
    document.getElementById("result-modal").classList.remove("hidden");
};

window.manualOverrideGrade = async (quizId, qIndex, status) => {
    const q = db.quizzes.find(item => item.id === quizId);
    if (!q || !q.result) return;
    
    if (!q.manualOverrides) q.manualOverrides = {};
    q.manualOverrides[qIndex] = status;

    let correctCount = 0;
    q.questions.forEach((ques, idx) => {
        const studentAns = q.studentAnswers ? q.studentAnswers[idx] : null;
        let isCorrect = false;
        if (ques.type === "mcq") {
            isCorrect = studentAns === ques.correctIndex;
        } else {
            isCorrect = studentAns && studentAns.trim().toLowerCase() === ques.correctAnswer.trim().toLowerCase();
        }

        if (q.manualOverrides[idx] === 'correct') isCorrect = true;
        if (q.manualOverrides[idx] === 'wrong') isCorrect = false;

        if (isCorrect) correctCount++;
    });

    q.result.correctCount = correctCount;
    q.result.wrongCount = q.questions.length - correctCount;
    q.result.percentage = Math.round((correctCount / q.questions.length) * 100);
    q.result.evaluation = q.result.percentage >= 90 ? "ممتاز جداً 🌟 (مصحح بشرياً)" : q.result.percentage >= 75 ? "جيد جداً 👍 (مصحح بشرياً)" : q.result.percentage >= 50 ? "مقبول 👌" : "يحتاج مراجعة";

    await saveDatabase();
    alert("تم تطبيق التدقيق البشري وتحديث النتيجة سحابياً بنجاح!");
};

document.getElementById("close-result-modal").onclick = () => {
    document.getElementById("result-modal").classList.add("hidden");
};

// ==================== ملفات PDF ====================
function renderPdfs() {
    const container = document.getElementById("pdfs-list");
    container.innerHTML = STUDY_PDFS.map(pdf => `
        <div class="item-card">
            <div class="item-card-top">
                <span class="item-card-title">${pdf.title}</span>
                <a href="${pdf.file}" target="_blank" class="btn-small-gold" style="text-decoration:none;"><i class="fa-solid fa-file-pdf"></i> فتح</a>
            </div>
        </div>
    `).join("");
}

// ==================== البروفايل والحساب ====================
function loadProfileUI() {
    document.getElementById("profile-display-name").textContent = currentUser.fullName;
    document.getElementById("profile-display-username").textContent = "@" + currentUser.username;
    document.getElementById("profile-display-email").textContent = currentUser.email;
    if (currentUser.avatar) document.getElementById("profile-avatar-img").src = currentUser.avatar;
}

document.getElementById("avatar-upload").onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function (event) {
        currentUser.avatar = event.target.result;
        document.getElementById("profile-avatar-img").src = currentUser.avatar;
        if (!isDeveloper) {
            const idx = db.users.findIndex(u => u.id === currentUser.id);
            if (idx !== -1) db.users[idx].avatar = currentUser.avatar;
            await saveDatabase();
        }
    };
    reader.readAsDataURL(file);
};

document.getElementById("save-fullname-btn").onclick = async () => {
    const newName = document.getElementById("edit-fullname-input").value.trim();
    if (!newName) return;
    currentUser.fullName = newName;
    if (!isDeveloper) {
        const idx = db.users.findIndex(u => u.id === currentUser.id);
        if (idx !== -1) db.users[idx].fullName = newName;
        await saveDatabase();
    }
    loadProfileUI();
    updateStatsAndRating();
    alert("تم تحديث الاسم!");
};

document.getElementById("save-username-btn").onclick = async () => {
    if (isDeveloper) { alert("لا يمكن تغيير يوزر المطور."); return; }
    const newUsername = document.getElementById("edit-username-input").value.trim().toLowerCase();
    if (!newUsername) return;

    if (currentUser.lastUsernameChange && (Date.now() - currentUser.lastUsernameChange) < 7 * 24 * 60 * 60 * 1000) {
        alert("لا يمكنك تغيير اليوزر إلا مرة في الأسبوع.");
        return;
    }

    currentUser.username = newUsername;
    currentUser.lastUsernameChange = Date.now();
    const idx = db.users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) db.users[idx] = currentUser;

    await saveDatabase();
    loadProfileUI();
    alert("تم تغيير اليوزر بنجاح!");
};

document.getElementById("save-pass-btn").onclick = async () => {
    if (isDeveloper) return;
    const oldPass = document.getElementById("old-pass-input").value;
    const newPass = document.getElementById("new-pass-input").value;
    if (oldPass !== currentUser.password) { alert("كلمة المرور السابقة خاطئة!"); return; }
    
    currentUser.password = newPass;
    const idx = db.users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) db.users[idx].password = newPass;
    await saveDatabase();
    alert("تم تغيير كلمة المرور!");
};

document.getElementById("logout-btn").onclick = () => {
    localStorage.removeItem("bac_abdalqadr_session");
    location.reload();
};

document.getElementById("delete-account-btn").onclick = async () => {
    if (isDeveloper) return;
    const confirmPass = prompt("أدخل كلمة المرور لتأكيد الحذف النهائي:");
    if (confirmPass !== currentUser.password) { alert("كلمة المرور خطأ!"); return; }

    db.users = db.users.filter(u => u.id !== currentUser.id);
    await saveDatabase();
    localStorage.removeItem("bac_abdalqadr_session");
    location.reload();
};
