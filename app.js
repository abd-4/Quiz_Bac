// ==================== إعدادات JSONBin.io والمطور ====================
const JSONBIN_BIN_ID = "ضع_معرف_الخزنة_هنا_BIN_ID"; 
const JSONBIN_API_KEY = "ضع_مفتاح_التوكن_هنا_X_MASTER_KEY";
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

const DEV_EMAIL = "abdalqadr3518@gmail.com";
const DEV_SECRET = "ABDALQADR_DEVELOPER";
const DEV_WHATSAPP = "963939084991";

const STUDY_PDFS = [
    {
        file: "pdfs/One_hundred_questions_on_neurosis.pdf",
        title: "علوم: 100 سؤال مؤتمت في العصبية 🧠"
    },
    {
        file: "pdfs/Ending_exercises.pdf",
        title: "رياضيات: تمارين على النهايات"
    }
];

let db = { users: [], quizzes: [], ratings: [] };
let currentUser = null;
let isDeveloper = false;
let selectedStars = 0;
let editingQuizId = null;
let editingUserIndex = null;
let quizTimerInterval = null;

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
        alert("تعذر الاتصال بقاعدة البيانات. تأكد من معرف الخزنة والتوكن.");
        console.error(err);
    } finally {
        hideLoader();
    }
}

async function saveDatabase() {
    showLoader("جاري حفظ البيانات...");
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
        alert("حدث خطأ أثناء حفظ البيانات!");
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
            currentUser = {
                fullName: "المطور عبدالقادر",
                email: DEV_EMAIL,
                username: "abdalqadr_dev",
                avatar: ""
            };
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
        alert("هذا البريد مخصص لمطور الموقع فقط!");
        return;
    }

    await fetchDatabase();
    if (db.users.some(u => u.email.toLowerCase() === email)) {
        alert("هذا البريد الإلكتروني مسجل مسبقاً! قم بتسجيل الدخول.");
        return;
    }

    const baseName = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    const randomNum = Math.floor(100 + Math.random() * 900);
    const generatedUsername = `${baseName || "student"}_${randomNum}`;

    const newUser = {
        id: "user_" + Date.now(),
        fullName,
        email,
        username: generatedUsername,
        password,
        avatar: "",
        hasRated: false,
        lastUsernameChange: 0
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
    const user = db.users.find(
        u => (u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier) && u.password === password
    );

    if (!user) {
        alert("البريد الإلكتروني / اليوزرنيم أو كلمة المرور غير صحيحة!");
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
        currentUser = {
            fullName: "المطور عبدالقادر",
            email: DEV_EMAIL,
            username: "abdalqadr_dev",
            avatar: ""
        };
        if (document.getElementById("remember-me").checked) {
            localStorage.setItem("bac_abdalqadr_session", JSON.stringify({ isDev: true }));
        }
        await fetchDatabase();
        enterApp();
    } else {
        alert("كلمة سر المطور خاطئة! لا يُسمح بالدخول.");
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
        quizHeading.textContent = "إدارة واختبارات الطلاب";
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

function updateStatsAndRating() {
    document.getElementById("stat-users").textContent = db.users.length;
    document.getElementById("stat-quizzes").textContent = db.quizzes.length;

    let bestStudentName = "لا يوجد بعد";
    let maxCompleted = 0;
    let highestAvg = 0;

    db.users.forEach(user => {
        const userQuizzes = db.quizzes.filter(q => q.targetUsername.toLowerCase() === user.username.toLowerCase() && q.completed);
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
        const avgRating = (sum / db.ratings.length).toFixed(1);
        document.getElementById("stat-rating").textContent = `${avgRating} / 5`;
    } else {
        document.getElementById("stat-rating").textContent = "5.0 / 5";
    }

    if (!isDeveloper && currentUser.hasRated) {
        lockRatingUI();
    }
}

function lockRatingUI() {
    document.getElementById("submit-rating-btn").classList.add("hidden");
    document.getElementById("rating-locked-msg").classList.remove("hidden");
    document.querySelectorAll(".star-item").forEach(s => s.style.pointerEvents = "none");
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
    if (selectedStars === 0) {
        alert("يرجى اختيار عدد النجوم أولاً!");
        return;
    }
    db.ratings.push(selectedStars);
    if (!isDeveloper) {
        currentUser.hasRated = true;
        const idx = db.users.findIndex(u => u.id === currentUser.id);
        if (idx !== -1) db.users[idx].hasRated = true;
    }
    await saveDatabase();
    lockRatingUI();
    updateStatsAndRating();
};

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

    if (!subject || !topic || !studentName) {
        alert("يرجى تعبئة الحقول الأساسية (المادة، اسم البحث، اسم الطالب)!");
        return;
    }

    const message = `مرحباً مطور عبدالقادر، أطلب إنشاء اختبار جديد:%0A` +
        `- المادة: ${subject}%0A` +
        `- اسم البحث: ${topic}%0A` +
        `- اسم الطالب: ${studentName}%0A` +
        `- الملاحظات: ${notes || "لا توجد"}`;

    window.open(`https://wa.me/+${DEV_WHATSAPP}?text=${message}`, "_blank");
    document.getElementById("request-quiz-modal").classList.add("hidden");
};

function renderDevUsersList() {
    const container = document.getElementById("dev-users-list");
    if (db.users.length === 0) {
        container.innerHTML = "<p style='color:#94a3b8; text-align:center;'>لا يوجد طلاب مسجلون بعد.</p>";
        return;
    }
    container.innerHTML = db.users.map((u, idx) => `
        <div class="user-row-card">
            <div><strong>الاسم:</strong> ${u.fullName}</div>
            <div><strong>اليوزر:</strong> <span dir="ltr">${u.username}</span></div>
            <div><strong>البريد:</strong> <span dir="ltr">${u.email}</span></div>
            <div><strong>كلمة المرور:</strong> <span dir="ltr" style="color:#fbbf24;">${u.password}</span></div>
            <div style="margin-top:8px; display:flex; gap:8px;">
                <button onclick="openDevEditUser(${idx})" class="btn-small-gold">تعديل</button>
                <button onclick="devDeleteUser(${idx})" class="btn-text-danger">حذف الحساب</button>
            </div>
        </div>
    `).join("");
}

document.getElementById("dev-add-user-btn").onclick = () => {
    editingUserIndex = null;
    document.getElementById("dev-user-modal-title").textContent = "إضافة طالب جديد";
    document.getElementById("dev-u-name").value = "";
    document.getElementById("dev-u-email").value = "";
    document.getElementById("dev-u-username").value = "";
    document.getElementById("dev-u-password").value = "";
    document.getElementById("dev-user-modal").classList.remove("hidden");
};

window.openDevEditUser = (idx) => {
    editingUserIndex = idx;
    const u = db.users[idx];
    document.getElementById("dev-user-modal-title").textContent = "تعديل بيانات الطالب";
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

    if (!fullName || !email || !username || !password) {
        alert("جميع الحقول مطلوبة!");
        return;
    }

    if (editingUserIndex === null) {
        db.users.push({
            id: "user_" + Date.now(),
            fullName, email, username, password,
            avatar: "", hasRated: false, lastUsernameChange: 0
        });
    } else {
        Object.assign(db.users[editingUserIndex], { fullName, email, username, password });
    }

    await saveDatabase();
    document.getElementById("dev-user-modal").classList.add("hidden");
    renderDevUsersList();
    updateStatsAndRating();
};

document.getElementById("dev-cancel-user-btn").onclick = () => {
    document.getElementById("dev-user-modal").classList.add("hidden");
};

window.devDeleteUser = async (idx) => {
    if (confirm(`هل أنت متأكد من حذف حساب الطالب "${db.users[idx].fullName}" نهائياً؟`)) {
        db.users.splice(idx, 1);
        await saveDatabase();
        renderDevUsersList();
        updateStatsAndRating();
    }
};

function renderQuizzes() {
    const container = document.getElementById("quizzes-list");
    const list = isDeveloper
        ? db.quizzes
        : db.quizzes.filter(q => q.targetUsername.toLowerCase() === currentUser.username.toLowerCase() || q.targetUsername === "ALL");

    if (list.length === 0) {
        container.innerHTML = "<p style='color:#94a3b8; text-align:center;'>لا توجد اختبارات متاحة حالياً.</p>";
        return;
    }

    container.innerHTML = list.map(q => `
        <div class="item-card">
            <div class="item-card-top">
                <div>
                    <div class="item-card-title">${q.title}</div>
                    ${isDeveloper ? `<small style="color:#fbbf24;">المستهدف: ${q.targetUsername === 'ALL' ? '🌟 كافة الطلاب (جماعي)' : '@' + q.targetUsername}</small>` : ""}
                </div>
                <span style="font-size:0.8rem; color:${q.completed ? '#4ade80' : '#facc15'};">
                    ${q.completed ? "مُنجز ✓" : "بانتظار الحل"}
                </span>
            </div>
            <div class="card-actions">
                ${!isDeveloper ? `<button onclick="startQuiz('${q.id}')" class="btn-start-quiz">${q.completed ? "إعادة الاختبار" : "بدء الاختبار"}</button>` : ""}
                <button onclick="showQuizResult('${q.id}')" class="btn-result">النتيجة</button>
                ${isDeveloper ? `
                    <button onclick="editQuiz('${q.id}')" class="btn-small-gold">تعديل</button>
                    <button onclick="deleteQuiz('${q.id}')" class="btn-text-danger">حذف</button>
                ` : ""}
            </div>
        </div>
    `).join("");
}

// التحكم بنوع المؤقت في واجهة الإنشاء
document.getElementById("quiz-timer-type").onchange = (e) => {
    const val = e.target.value;
    const group = document.getElementById("timer-value-group");
    const label = document.getElementById("timer-label-text");
    if (val === "none") {
        group.classList.add("hidden");
    } else {
        group.classList.remove("hidden");
        label.textContent = val === "per_question" ? "زمن السؤال الواحد:" : "الزمن الكلي للاختبار:";
    }
};

// التحكم بالاستهداف الفردي أو الجماعي
document.querySelectorAll('input[name="target_mode"]').forEach(radio => {
    radio.onchange = (e) => {
        const targetInput = document.getElementById("quiz-target-user");
        if (e.target.value === "all") {
            targetInput.value = "ALL";
            targetInput.disabled = true;
        } else {
            targetInput.value = "";
            targetInput.disabled = false;
        }
    };
});

document.getElementById("create-quiz-btn").onclick = () => {
    editingQuizId = null;
    document.getElementById("builder-modal-title").textContent = "إنشاء اختبار مسبق / نشر جديد";
    document.getElementById("quiz-title-input").value = "";
    document.getElementById("quiz-target-user").value = "";
    document.getElementById("quiz-target-user").disabled = false;
    document.getElementById("mode-single").checked = true;
    document.getElementById("quiz-timer-type").value = "none";
    document.getElementById("timer-value-group").classList.add("hidden");
    document.getElementById("builder-questions-list").innerHTML = "";
    document.getElementById("quiz-builder-modal").classList.remove("hidden");
};

document.getElementById("add-mcq-btn").onclick = () => addQuestionBlock("mcq");
document.getElementById("add-text-q-btn").onclick = () => addQuestionBlock("text");

function addQuestionBlock(type, existingData = null) {
    const container = document.getElementById("builder-questions-list");
    const div = document.createElement("div");
    div.className = "builder-q-card";
    div.setAttribute("data-type", type);

    if (type === "mcq") {
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <strong>سؤال خيارات متعددة</strong>
                <button type="button" onclick="this.parentElement.parentElement.remove()" class="btn-text-danger">حذف</button>
            </div>
            <input type="text" class="q-text" placeholder="نص السؤال" value="${existingData ? existingData.question : ""}" style="width:100%; padding:8px; margin-bottom:6px; border-radius:8px; background:#222b35; color:#fff; border:1px solid #9a6326;">
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
            <input type="text" class="q-correct-text" placeholder="الإجابة الصحيحة النموذجية" value="${existingData ? existingData.correctAnswer : ""}" style="width:100%; padding:8px; border-radius:8px; background:#222b35; color:#4ade80; border:1px solid #4ade80;">
        `;
        container.appendChild(div);
    }
}

window.updateMcqOptions = (selectEl, existingData = null) => {
    const count = parseInt(selectEl.value);
    const box = selectEl.nextElementSibling;
    box.innerHTML = "";
    for (let i = 0; i < count; i++) {
        const val = existingData && existingData.options[i] ? existingData.options[i] : "";
        const isCorrect = existingData ? existingData.correctIndex === i : i === 0;
        box.innerHTML += `
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
                <input type="radio" name="correct_${selectEl.parentElement.rowIndex || Math.random()}" class="opt-radio" ${isCorrect ? "checked" : ""}>
                <input type="text" class="opt-val" placeholder="الخيار ${i + 1}" value="${val}" style="flex:1; padding:6px; border-radius:6px; background:#222b35; color:#fff; border:1px solid #555;">
            </div>
        `;
    }
    const groupName = "grp_" + Date.now() + "_" + Math.random();
    box.querySelectorAll(".opt-radio").forEach(r => r.name = groupName);
};

document.getElementById("save-quiz-btn").onclick = async () => {
    const title = document.getElementById("quiz-title-input").value.trim();
    const targetUsername = document.getElementById("quiz-target-user").value.trim();
    const timerType = document.getElementById("quiz-timer-type").value;
    const timerSeconds = parseInt(document.getElementById("quiz-timer-seconds").value);

    if (!title || !targetUsername) {
        alert("يرجى إدخال عنوان الاختبار وتحديد الطلاب المستهدفين!");
        return;
    }

    const questions = [];
    document.querySelectorAll(".builder-q-card").forEach(card => {
        const type = card.getAttribute("data-type");
        const qText = card.querySelector(".q-text").value.trim();
        if (!qText) return;

        if (type === "mcq") {
            const options = [];
            let correctIndex = 0;
            card.querySelectorAll(".opt-val").forEach((inp, idx) => {
                options.push(inp.value.trim());
                if (inp.previousElementSibling.checked) correctIndex = idx;
            });
            questions.push({ type: "mcq", question: qText, options, correctIndex });
        } else {
            const correctAnswer = card.querySelector(".q-correct-text").value.trim();
            questions.push({ type: "text", question: qText, correctAnswer });
        }
    });

    if (questions.length === 0) {
        alert("أضف سؤالاً واحداً على الأقل!");
        return;
    }

    const timerSettings = { type: timerType, seconds: timerSeconds };

    if (editingQuizId) {
        const idx = db.quizzes.findIndex(q => q.id === editingQuizId);
        if (idx !== -1) {
            db.quizzes[idx].title = title;
            db.quizzes[idx].targetUsername = targetUsername;
            db.quizzes[idx].questions = questions;
            db.quizzes[idx].timer = timerSettings;
        }
    } else {
        db.quizzes.push({
            id: "quiz_" + Date.now(),
            title,
            targetUsername,
            questions,
            timer: timerSettings,
            completed: false,
            result: null
        });
    }

    await saveDatabase();
    document.getElementById("quiz-builder-modal").classList.add("hidden");
    renderQuizzes();
    updateStatsAndRating();
};

document.getElementById("cancel-quiz-builder").onclick = () => {
    document.getElementById("quiz-builder-modal").classList.add("hidden");
};

window.editQuiz = (id) => {
    const q = db.quizzes.find(item => item.id === id);
    if (!q) return;
    editingQuizId = id;
    document.getElementById("builder-modal-title").textContent = "تعديل الاختبار";
    document.getElementById("quiz-title-input").value = q.title;
    document.getElementById("quiz-target-user").value = q.targetUsername;
    
    if (q.targetUsername === "ALL") {
        document.getElementById("mode-all").checked = true;
        document.getElementById("quiz-target-user").disabled = true;
    } else {
        document.getElementById("mode-single").checked = true;
        document.getElementById("quiz-target-user").disabled = false;
    }

    if (q.timer) {
        document.getElementById("quiz-timer-type").value = q.timer.type;
        document.getElementById("quiz-timer-seconds").value = q.timer.seconds;
        if (q.timer.type !== "none") {
            document.getElementById("timer-value-group").classList.remove("hidden");
        } else {
            document.getElementById("timer-value-group").classList.add("hidden");
        }
    }

    document.getElementById("builder-questions-list").innerHTML = "";
    q.questions.forEach(ques => addQuestionBlock(ques.type, ques));
    document.getElementById("quiz-builder-modal").classList.remove("hidden");
};

window.deleteQuiz = async (id) => {
    if (confirm("هل تريد حذف هذا الاختبار نهائياً؟")) {
        db.quizzes = db.quizzes.filter(q => q.id !== id);
        await saveDatabase();
        renderQuizzes();
        updateStatsAndRating();
    }
};

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
                    <p>${idx + 1}. ${q.question}</p>
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
                    <p>${idx + 1}. ${q.question}</p>
                    <input type="text" id="text_ans_${idx}" placeholder="اكتب إجابتك هنا..." style="width:100%; padding:10px; border-radius:8px; background:#222b35; color:#fff; border:1px solid #9a6326;">
                </div>
            `;
        }
    }).join("");

    // تشغيل المؤقت الزمني إذا كان مفعلاً
    if (quizTimerInterval) clearInterval(quizTimerInterval);
    const timerBadge = document.getElementById("quiz-timer-display");
    
    if (activeSolvingQuiz.timer && activeSolvingQuiz.timer.type === "total") {
        timerBadge.classList.remove("hidden");
        let timeLeft = activeSolvingQuiz.timer.seconds;
        updateTimerText(timeLeft);
        quizTimerInterval = setInterval(() => {
            timeLeft--;
            updateTimerText(timeLeft);
            if (timeLeft <= 0) {
                clearInterval(quizTimerInterval);
                alert("انتهى الوقت المخصص للاختبار! سيتم تسليم الإجابات تلقائياً.");
                document.getElementById("submit-quiz-answers-btn").click();
            }
        }, 1000);
    } else {
        timerBadge.classList.add("hidden");
    }
};

function updateTimerText(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    document.getElementById("time-left").textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

    activeSolvingQuiz.questions.forEach((q, idx) => {
        if (q.type === "mcq") {
            const selected = document.querySelector(`input[name="ans_${idx}"]:checked`);
            if (selected && parseInt(selected.value) === q.correctIndex) correctCount++;
        } else {
            const ansField = document.getElementById(`text_ans_${idx}`);
            const ans = ansField ? ansField.value.trim().toLowerCase() : "";
            if (ans === q.correctAnswer.trim().toLowerCase()) correctCount++;
        }
    });

    const wrongCount = total - correctCount;
    const percentage = Math.round((correctCount / total) * 100);
    let evaluation = "يحتاج إلى مراجعة إضافية";
    if (percentage >= 90) evaluation = "ممتاز جداً 🌟";
    else if (percentage >= 75) evaluation = "جيد جداً 👍";
    else if (percentage >= 50) evaluation = "مقبول 👌";

    activeSolvingQuiz.completed = true;
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
        box.innerHTML = "<p style='text-align:center; color:#fbbf24;'>لم يتم حل هذا الاختبار بعد!</p>";
    } else {
        const r = q.result;
        box.innerHTML = `
            <div>✅ الإجابات الصحيحة: <strong>${r.correctCount}</strong></div>
            <div>❌ الإجابات الخاطئة: <strong>${r.wrongCount}</strong></div>
            <div>📊 عدد الأسئلة الكلي: <strong>${r.total}</strong></div>
            <div>🎯 النسبة المئوية (المعدل): <strong>${r.percentage}%</strong></div>
            <div>🏅 تقييم الأداء: <strong>${r.evaluation}</strong></div>
        `;
    }
    document.getElementById("result-modal").classList.remove("hidden");
};

document.getElementById("close-result-modal").onclick = () => {
    document.getElementById("result-modal").classList.add("hidden");
};

function renderPdfs() {
    const container = document.getElementById("pdfs-list");
    container.innerHTML = STUDY_PDFS.map(pdf => `
        <div class="item-card">
            <div class="item-card-top">
                <span class="item-card-title">${pdf.title}</span>
                <a href="${pdf.file}" target="_blank" class="btn-small-gold" style="text-decoration:none;">
                    <i class="fa-solid fa-file-pdf"></i> فتح الملف
                </a>
            </div>
        </div>
    `).join("");
}

function loadProfileUI() {
    document.getElementById("profile-display-name").textContent = currentUser.fullName;
    document.getElementById("profile-display-username").textContent = "@" + currentUser.username;
    document.getElementById("profile-display-email").textContent = currentUser.email;
    if (currentUser.avatar) {
        document.getElementById("profile-avatar-img").src = currentUser.avatar;
    }
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
    alert("تم تحديث الاسم بنجاح!");
};

document.getElementById("save-username-btn").onclick = async () => {
    if (isDeveloper) {
        alert("لا يمكن تغيير يوزر حساب المطور الأساسي.");
        return;
    }
    const newUsername = document.getElementById("edit-username-input").value.trim().toLowerCase();
    if (!newUsername) return;

    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (currentUser.lastUsernameChange && (now - currentUser.lastUsernameChange) < oneWeekMs) {
        alert("عذراً! لن تتمكن من تغيير اليوزر إلا مرة في الأسبوع.");
        return;
    }

    if (db.users.some(u => u.username.toLowerCase() === newUsername && u.id !== currentUser.id)) {
        alert("هذا اليوزرنيم مستخدم من قبل طالب آخر!");
        return;
    }

    db.quizzes.forEach(q => {
        if (q.targetUsername.toLowerCase() === currentUser.username.toLowerCase()) {
            q.targetUsername = newUsername;
        }
    });

    currentUser.username = newUsername;
    currentUser.lastUsernameChange = now;

    const idx = db.users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) db.users[idx] = currentUser;

    await saveDatabase();
    loadProfileUI();
    alert("تم تغيير اليوزرنيم بنجاح!");
};

document.getElementById("save-pass-btn").onclick = async () => {
    if (isDeveloper) {
        alert("كلمة مرور المطور مرتبطة بالكود المصدري.");
        return;
    }
    const oldPass = document.getElementById("old-pass-input").value;
    const newPass = document.getElementById("new-pass-input").value;

    if (oldPass !== currentUser.password) {
        alert("كلمة المرور السابقة غير صحيحة!");
        return;
    }
    if (newPass.length < 4) {
        alert("يرجى إدخال كلمة مرور جديدة صالحة.");
        return;
    }

    currentUser.password = newPass;
    const idx = db.users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) db.users[idx].password = newPass;

    await saveDatabase();
    document.getElementById("old-pass-input").value = "";
    document.getElementById("new-pass-input").value = "";
    alert("تم تغيير كلمة المرور بنجاح!");
};

document.getElementById("logout-btn").onclick = () => {
    localStorage.removeItem("bac_abdalqadr_session");
    location.reload();
};

document.getElementById("delete-account-btn").onclick = async () => {
    if (isDeveloper) {
        alert("لا يمكن حذف حساب المطور!");
        return;
    }
    const confirmPass = prompt("لتأكيد حذف حسابك نهائياً من الموقع، أدخل كلمة المرور الخاصة بك:");
    if (confirmPass === null) return;

    if (confirmPass !== currentUser.password) {
        alert("كلمة المرور غير صحيحة! تم إلغاء عملية الحذف.");
        return;
    }

    db.users = db.users.filter(u => u.id !== currentUser.id);
    await saveDatabase();
    localStorage.removeItem("bac_abdalqadr_session");
    alert("تم حذف حسابك نهائياً.");
    location.reload();
};
