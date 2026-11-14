// ==================== إعدادات JSONBin.io والمطور ====================
const JSONBIN_BIN_ID = "6af7e806ffd5d16053c02657"; 
const JSONBIN_API_KEY = "$2a$10$4E5tRjBAaY8BZGvom1qx7OffYbN3aI5VxFZvBdjqIw5gzEgcjShRy";
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
    },
    {
        file: "pdfs/Nuclear_Summary_Pxl.pdf",
        title: "كيمياء: ملخص نووية 🧪"
    },
    {
        file: "pdfs/Gases_Summary_Pxl.pdf",
        title: "كيمياء: ملخص غازات 💨"
    }
];

let db = { users: [], quizzes: [], ratings: [] };
let currentUser = null;
let isDeveloper = false;
let selectedStars = 0;
let editingQuizId = null;
let sharingQuizId = null;
let editingUserIndex = null;
let currentDevFilter = "all";

// متغيرات المؤقت وحل الاختبارات
let quizTimerInterval = null;
let activeSolvingQuiz = null;
let currentQuestionIdx = 0;
let studentAnswers = {};

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
        quizHeading.textContent = "اختبارات الطلاب";
        document.getElementById("create-quiz-btn").classList.remove("hidden");
        document.getElementById("dev-quiz-filters").classList.remove("hidden");
        document.getElementById("request-quiz-btn").classList.add("hidden");
        document.getElementById("dev-users-panel").classList.remove("hidden");
        renderDevUsersList();
    } else {
        badge.textContent = "طالب";
        badge.className = "badge-student";
        navQuizLabel.textContent = "اختباراتي";
        quizHeading.textContent = "اختباراتي";
        document.getElementById("create-quiz-btn").classList.add("hidden");
        document.getElementById("dev-quiz-filters").classList.add("hidden");
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
        const userQuizzes = db.quizzes.filter(
            q => q.targetUsername && q.targetUsername.toLowerCase() === user.username.toLowerCase() && q.completed
        );
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

    const message = `السلام عليكم ،أستاذ عبدالقادر أريد طلب اختبار جديد لـِ:%0A` +
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

// ==================== إدارة وعرض الاختبارات (المطور والطالب) ====================
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentDevFilter = btn.getAttribute("data-filter");
        renderQuizzes();
    };
});

function getTimerBadgeText(quiz) {
    if (!quiz.timer || quiz.timer.mode === "none") return "";
    if (quiz.timer.mode === "custom_per_question") return "⏱️ مؤقت مخصص لكل سؤال";
    if (quiz.timer.mode === "equal_per_question") return `⏱️ ${quiz.timer.seconds} ثانية لكل سؤال`;
    if (quiz.timer.mode === "total_quiz") return `⏱️ ${Math.round(quiz.timer.seconds / 60 * 10) / 10} دقيقة للاختبار`;
    return "";
}

function renderQuizzes() {
    const container = document.getElementById("quizzes-list");
    let list = [];

    if (isDeveloper) {
        if (currentDevFilter === "saved") {
            list = db.quizzes.filter(q => q.isSavedTemplate || !q.targetUsername);
        } else if (currentDevFilter === "assigned") {
            list = db.quizzes.filter(q => !q.isSavedTemplate && q.targetUsername);
        } else {
            list = db.quizzes;
        }
    } else {
        list = db.quizzes.filter(
            q => !q.isSavedTemplate && q.targetUsername && q.targetUsername.toLowerCase() === currentUser.username.toLowerCase()
        );
    }

    if (list.length === 0) {
        container.innerHTML = "<p style='color:#94a3b8; text-align:center;'>لا توجد اختبارات في هذا القسم حالياً.</p>";
        return;
    }

    container.innerHTML = list.map(q => {
        const timerInfo = getTimerBadgeText(q);
        const statusBadge = q.isSavedTemplate
            ? `<span style="font-size:0.78rem; color:#38bdf8; background:rgba(56,189,248,0.12); padding:2px 8px; border-radius:6px;">محفوظ سحابياً ☁️</span>`
            : `<span style="font-size:0.8rem; color:${q.completed ? '#4ade80' : '#facc15'};">${q.completed ? "مُنجز ✓" : "بانتظار الحل"}</span>`;

        return `
        <div class="item-card">
            <div class="item-card-top">
                <div>
                    <div class="item-card-title">${q.title}</div>
                    ${isDeveloper && !q.isSavedTemplate ? `<small style="color:#fbbf24; display:block;">مُرسل إلى: @${q.targetUsername}</small>` : ""}
                    ${timerInfo ? `<small style="color:#94a3b8; display:block; margin-top:2px;">${timerInfo}</small>` : ""}
                </div>
                ${statusBadge}
            </div>
            <div class="card-actions">
                ${!isDeveloper ? `<button onclick="startQuiz('${q.id}')" class="btn-start-quiz">${q.completed ? "إعادة الاختبار" : "بدء الاختبار"}</button>` : ""}
                ${!q.isSavedTemplate ? `<button onclick="showQuizResult('${q.id}')" class="btn-result">النتيجة</button>` : ""}
                ${isDeveloper ? `
                    <button onclick="openShareQuizModal('${q.id}')" class="btn-share-quiz"><i class="fa-solid fa-share-nodes"></i> مشاركة لطلاب</button>
                    <button onclick="editQuiz('${q.id}')" class="btn-small-gold">تعديل</button>
                    <button onclick="deleteQuiz('${q.id}')" class="btn-text-danger">حذف</button>
                ` : ""}
            </div>
        </div>
        `;
    }).join("");
}

// ==================== بناء الاختبار (مؤقت مخصص + حفظ سحابي + إرسال جماعي) ====================
document.getElementById("quiz-timer-mode").onchange = (e) => {
    const mode = e.target.value;
    const globalGroup = document.getElementById("global-timer-group");
    const globalLabel = document.getElementById("global-timer-label");

    if (mode === "equal_per_question") {
        globalGroup.classList.remove("hidden");
        globalLabel.textContent = "اختر المدة المتساوية لكل سؤال:";
    } else if (mode === "total_quiz") {
        globalGroup.classList.remove("hidden");
        globalLabel.textContent = "اختر المدة الكلية لجميع أسئلة الاختبار:";
    } else {
        globalGroup.classList.add("hidden");
    }

    // إظهار أو إخفاء حقل الوقت الخاص داخل كل بطاقة سؤال
    document.querySelectorAll(".per-question-timer-box").forEach(box => {
        box.classList.toggle("hidden", mode !== "custom_per_question");
    });
};

document.getElementById("quiz-publish-mode").onchange = (e) => {
    const val = e.target.value;
    const targetGroup = document.getElementById("target-students-group");
    const targetLabel = document.getElementById("target-students-label");
    const multiHint = document.getElementById("multi-user-hint");
    const targetInput = document.getElementById("quiz-target-user");

    if (val === "saved" || val === "all") {
        targetGroup.classList.add("hidden");
    } else if (val === "single") {
        targetGroup.classList.remove("hidden");
        targetLabel.textContent = "يوزرنيم الطالب المستهدف:";
        targetInput.placeholder = "مثال: ahmad_123";
        multiHint.classList.add("hidden");
    } else if (val === "multiple") {
        targetGroup.classList.remove("hidden");
        targetLabel.textContent = "يوزرات الطلاب المستهدفين (مفصولة بفاصلة):";
        targetInput.placeholder = "ahmad_123, ali_456, sara_789";
        multiHint.classList.remove("hidden");
    }
};

document.getElementById("create-quiz-btn").onclick = () => {
    editingQuizId = null;
    document.getElementById("builder-modal-title").textContent = "إنشاء اختبار جديد";
    document.getElementById("quiz-title-input").value = "";
    document.getElementById("quiz-timer-mode").value = "none";
    document.getElementById("global-timer-group").classList.add("hidden");
    document.getElementById("quiz-publish-mode").value = "saved";
    document.getElementById("target-students-group").classList.add("hidden");
    document.getElementById("quiz-target-user").value = "";
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

    const isCustomTimer = document.getElementById("quiz-timer-mode").value === "custom_per_question";
    const qTimeVal = existingData && existingData.timeLimit ? existingData.timeLimit : 60;

    const timerSelectHTML = `
        <div class="per-question-timer-box ${isCustomTimer ? "" : "hidden"}" style="margin-bottom:8px; background:#222b35; padding:6px 10px; border-radius:8px; border:1px dashed #d9821e;">
            <label style="font-size:0.8rem; color:#fbbf24; margin-bottom:4px;">⏱️ مؤقت هذا السؤال تحديداً:</label>
            <select class="q-time-limit" style="width:100%; padding:5px; border-radius:6px; background:#2b343e; color:#fff; border:1px solid #9a6326;">
                <option value="30" ${qTimeVal == 30 ? "selected" : ""}>30 ثانية</option>
                <option value="60" ${qTimeVal == 60 ? "selected" : ""}>دقيقة واحدة (60 ثانية)</option>
                <option value="90" ${qTimeVal == 90 ? "selected" : ""}>دقيقة ونصف (90 ثانية)</option>
                <option value="120" ${qTimeVal == 120 ? "selected" : ""}>دقيقتان (120 ثانية)</option>
                <option value="180" ${qTimeVal == 180 ? "selected" : ""}>3 دقائق (180 ثانية)</option>
                <option value="300" ${qTimeVal == 300 ? "selected" : ""}>5 دقائق (300 ثانية)</option>
            </select>
        </div>
    `;

    if (type === "mcq") {
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <strong>سؤال خيارات متعددة</strong>
                <button type="button" onclick="this.parentElement.parentElement.remove()" class="btn-text-danger">حذف</button>
            </div>
            ${timerSelectHTML}
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
            ${timerSelectHTML}
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
                <input type="radio" class="opt-radio" ${isCorrect ? "checked" : ""}>
                <input type="text" class="opt-val" placeholder="الخيار ${i + 1}" value="${val}" style="flex:1; padding:6px; border-radius:6px; background:#222b35; color:#fff; border:1px solid #555;">
            </div>
        `;
    }
    const groupName = "grp_" + Date.now() + "_" + Math.random();
    box.querySelectorAll(".opt-radio").forEach(r => r.name = groupName);
};

document.getElementById("save-quiz-btn").onclick = async () => {
    const title = document.getElementById("quiz-title-input").value.trim();
    const timerMode = document.getElementById("quiz-timer-mode").value;
    const globalSeconds = parseInt(document.getElementById("quiz-global-seconds").value);
    const publishMode = document.getElementById("quiz-publish-mode").value;
    const rawTarget = document.getElementById("quiz-target-user").value.trim();

    if (!title) {
        alert("يرجى إدخال عنوان الاختبار!");
        return;
    }

    const questions = [];
    document.querySelectorAll(".builder-q-card").forEach(card => {
        const type = card.getAttribute("data-type");
        const qText = card.querySelector(".q-text").value.trim();
        const qTimeLimit = parseInt(card.querySelector(".q-time-limit")?.value || 60);
        if (!qText) return;

        if (type === "mcq") {
            const options = [];
            let correctIndex = 0;
            card.querySelectorAll(".opt-val").forEach((inp, idx) => {
                options.push(inp.value.trim());
                if (inp.previousElementSibling.checked) correctIndex = idx;
            });
            questions.push({ type: "mcq", question: qText, options, correctIndex, timeLimit: qTimeLimit });
        } else {
            const correctAnswer = card.querySelector(".q-correct-text").value.trim();
            questions.push({ type: "text", question: qText, correctAnswer, timeLimit: qTimeLimit });
        }
    });

    if (questions.length === 0) {
        alert("أضف سؤالاً واحداً على الأقل!");
        return;
    }

    const timerConfig = { mode: timerMode, seconds: globalSeconds };

    // إذا كان تعديل لاختبار موجود
    if (editingQuizId) {
        const idx = db.quizzes.findIndex(q => q.id === editingQuizId);
        if (idx !== -1) {
            db.quizzes[idx].title = title;
            db.quizzes[idx].questions = questions;
            db.quizzes[idx].timer = timerConfig;
            if (publishMode === "saved") {
                db.quizzes[idx].isSavedTemplate = true;
                db.quizzes[idx].targetUsername = "";
            } else if (publishMode === "single" && rawTarget) {
                db.quizzes[idx].isSavedTemplate = false;
                db.quizzes[idx].targetUsername = rawTarget;
            }
        }
    } else {
        // إنشاء جديد حسب طريقة النشر
        if (publishMode === "saved") {
            db.quizzes.push({
                id: "quiz_" + Date.now(),
                title,
                targetUsername: "",
                isSavedTemplate: true,
                questions,
                timer: timerConfig,
                completed: false,
                result: null
            });
        } else {
            let targets = [];
            if (publishMode === "single") {
                if (!rawTarget) { alert("أدخل يوزرنيم الطالب!"); return; }
                targets = [rawTarget];
            } else if (publishMode === "multiple") {
                if (!rawTarget) { alert("أدخل يوزرات الطلاب مفصولة بفاصلة!"); return; }
                targets = rawTarget.split(",").map(s => s.trim()).filter(Boolean);
            } else if (publishMode === "all") {
                if (db.users.length === 0) { alert("لا يوجد طلاب مسجلون بعد!"); return; }
                targets = db.users.map(u => u.username);
            }

            targets.forEach((uname, i) => {
                db.quizzes.push({
                    id: "quiz_" + (Date.now() + i),
                    title,
                    targetUsername: uname,
                    isSavedTemplate: false,
                    questions: JSON.parse(JSON.stringify(questions)),
                    timer: timerConfig,
                    completed: false,
                    result: null
                });
            });
        }
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

    const tMode = q.timer ? q.timer.mode : "none";
    document.getElementById("quiz-timer-mode").value = tMode;
    if (q.timer && q.timer.seconds) {
        document.getElementById("quiz-global-seconds").value = q.timer.seconds;
    }
    document.getElementById("global-timer-group").classList.toggle("hidden", tMode !== "equal_per_question" && tMode !== "total_quiz");

    if (q.isSavedTemplate) {
        document.getElementById("quiz-publish-mode").value = "saved";
        document.getElementById("target-students-group").classList.add("hidden");
    } else {
        document.getElementById("quiz-publish-mode").value = "single";
        document.getElementById("target-students-group").classList.remove("hidden");
        document.getElementById("quiz-target-user").value = q.targetUsername || "";
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

// ==================== مشاركة / إعادة مشاركة اختبار محفوظ أو محلول ====================
window.openShareQuizModal = (id) => {
    const q = db.quizzes.find(item => item.id === id);
    if (!q) return;
    sharingQuizId = id;
    document.getElementById("share-quiz-title-display").textContent = `الاختبار: ${q.title}`;
    document.getElementById("share-target-mode").value = "single";
    document.getElementById("share-input-group").classList.remove("hidden");
    document.getElementById("share-target-usernames").value = "";
    document.getElementById("share-multi-hint").classList.add("hidden");
    document.getElementById("share-quiz-modal").classList.remove("hidden");
};

document.getElementById("share-target-mode").onchange = (e) => {
    const mode = e.target.value;
    const grp = document.getElementById("share-input-group");
    const lbl = document.getElementById("share-input-label");
    const hint = document.getElementById("share-multi-hint");
    const inp = document.getElementById("share-target-usernames");

    if (mode === "all") {
        grp.classList.add("hidden");
    } else if (mode === "single") {
        grp.classList.remove("hidden");
        lbl.textContent = "أدخل يوزرنيم الطالب:";
        inp.placeholder = "مثال: ahmad_123";
        hint.classList.add("hidden");
    } else {
        grp.classList.remove("hidden");
        lbl.textContent = "أدخل يوزرات الطلاب (مفصولة بفاصلة):";
        inp.placeholder = "ahmad_123, ali_456, sara_789";
        hint.classList.remove("hidden");
    }
};

document.getElementById("cancel-share-quiz-btn").onclick = () => {
    document.getElementById("share-quiz-modal").classList.add("hidden");
};

document.getElementById("confirm-share-quiz-btn").onclick = async () => {
    const sourceQuiz = db.quizzes.find(q => q.id === sharingQuizId);
    if (!sourceQuiz) return;

    const mode = document.getElementById("share-target-mode").value;
    const rawVal = document.getElementById("share-target-usernames").value.trim();
    let targets = [];

    if (mode === "single") {
        if (!rawVal) { alert("يرجى إدخال يوزرنيم الطالب!"); return; }
        targets = [rawVal];
    } else if (mode === "multiple") {
        if (!rawVal) { alert("يرجى إدخال يوزرات الطلاب!"); return; }
        targets = rawVal.split(",").map(s => s.trim()).filter(Boolean);
    } else if (mode === "all") {
        if (db.users.length === 0) { alert("لا يوجد طلاب مسجلون في الموقع حالياً!"); return; }
        targets = db.users.map(u => u.username);
    }

    // إنشاء نسخة مستقلة لكل طالب مستهدف دون المساس بالاختبار الأصلي أو نتائجه السابقة
    targets.forEach((uname, index) => {
        db.quizzes.push({
            id: "quiz_" + (Date.now() + index + 1),
            title: sourceQuiz.title,
            targetUsername: uname,
            isSavedTemplate: false,
            questions: JSON.parse(JSON.stringify(sourceQuiz.questions)),
            timer: sourceQuiz.timer ? JSON.parse(JSON.stringify(sourceQuiz.timer)) : { mode: "none", seconds: 0 },
            completed: false,
            result: null
        });
    });

    await saveDatabase();
    document.getElementById("share-quiz-modal").classList.add("hidden");
    renderQuizzes();
    updateStatsAndRating();
    alert(`تمت مشاركة الاختبار بنجاح مع (${targets.length}) طالب!`);
};

// ==================== حل الاختبار مع دعم المؤقت لكل سؤال أو الكلي ====================
window.startQuiz = (id) => {
    activeSolvingQuiz = db.quizzes.find(q => q.id === id);
    if (!activeSolvingQuiz) return;

    if (quizTimerInterval) clearInterval(quizTimerInterval);
    currentQuestionIdx = 0;
    studentAnswers = {};

    document.getElementById("quizzes-list").classList.add("hidden");
    document.getElementById("quiz-solver-box").classList.remove("hidden");
    document.getElementById("solving-quiz-title").textContent = activeSolvingQuiz.title;

    const tMode = activeSolvingQuiz.timer ? activeSolvingQuiz.timer.mode : "none";
    const timerBadge = document.getElementById("quiz-timer-display");

    if (tMode === "custom_per_question" || tMode === "equal_per_question") {
        // وضع السؤال الواحد تلو الآخر مع مؤقت خاص لكل سؤال
        renderSingleQuestionStep();
    } else {
        // وضع عرض جميع الأسئلة دفعة واحدة (بدون مؤقت أو بمؤقت كلي)
        document.getElementById("question-progress-text").textContent = `عدد الأسئلة: ${activeSolvingQuiz.questions.length}`;
        document.getElementById("next-question-btn").classList.add("hidden");
        document.getElementById("submit-quiz-answers-btn").classList.remove("hidden");

        const container = document.getElementById("solver-questions-container");
        container.innerHTML = activeSolvingQuiz.questions.map((q, idx) => renderQuestionHTML(q, idx)).join("");

        if (tMode === "total_quiz") {
            timerBadge.classList.remove("hidden");
            let timeLeft = activeSolvingQuiz.timer.seconds;
            updateTimerText(timeLeft);
            quizTimerInterval = setInterval(() => {
                timeLeft--;
                updateTimerText(timeLeft);
                if (timeLeft <= 0) {
                    clearInterval(quizTimerInterval);
                    alert("انتهى الوقت المخصص للاختبار! سيتم تسليم إجاباتك تلقائياً.");
                    finishAndSubmitAllQuestions();
                }
            }, 1000);
        } else {
            timerBadge.classList.add("hidden");
        }
    }
};

function renderQuestionHTML(q, idx) {
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
}

function captureCurrentStepAnswer(idx) {
    const q = activeSolvingQuiz.questions[idx];
    if (!q) return;
    if (q.type === "mcq") {
        const selected = document.querySelector(`input[name="ans_${idx}"]:checked`);
        studentAnswers[idx] = selected ? parseInt(selected.value) : null;
    } else {
        const inp = document.getElementById(`text_ans_${idx}`);
        studentAnswers[idx] = inp ? inp.value.trim() : "";
    }
}

function renderSingleQuestionStep() {
    if (quizTimerInterval) clearInterval(quizTimerInterval);
    const total = activeSolvingQuiz.questions.length;
    const q = activeSolvingQuiz.questions[currentQuestionIdx];

    document.getElementById("question-progress-text").textContent = `السؤال ${currentQuestionIdx + 1} من ${total}`;
    document.getElementById("solver-questions-container").innerHTML = renderQuestionHTML(q, currentQuestionIdx);

    const nextBtn = document.getElementById("next-question-btn");
    const submitBtn = document.getElementById("submit-quiz-answers-btn");

    if (currentQuestionIdx < total - 1) {
        nextBtn.classList.remove("hidden");
        submitBtn.classList.add("hidden");
    } else {
        nextBtn.classList.add("hidden");
        submitBtn.classList.remove("hidden");
    }

    // حساب مدة السؤال الحالي
    const tMode = activeSolvingQuiz.timer.mode;
    let qSeconds = tMode === "custom_per_question" ? (q.timeLimit || 60) : (activeSolvingQuiz.timer.seconds || 60);

    const timerBadge = document.getElementById("quiz-timer-display");
    timerBadge.classList.remove("hidden");
    updateTimerText(qSeconds);

    quizTimerInterval = setInterval(() => {
        qSeconds--;
        updateTimerText(qSeconds);
        if (qSeconds <= 0) {
            clearInterval(quizTimerInterval);
            captureCurrentStepAnswer(currentQuestionIdx);
            if (currentQuestionIdx < total - 1) {
                currentQuestionIdx++;
                renderSingleQuestionStep();
            } else {
                alert("انتهى وقت السؤال الأخير! جاري احتساب النتيجة...");
                finishAndSubmitStepByStep();
            }
        }
    }, 1000);
}

document.getElementById("next-question-btn").onclick = () => {
    captureCurrentStepAnswer(currentQuestionIdx);
    currentQuestionIdx++;
    renderSingleQuestionStep();
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

document.getElementById("submit-quiz-answers-btn").onclick = () => {
    const tMode = activeSolvingQuiz.timer ? activeSolvingQuiz.timer.mode : "none";
    if (tMode === "custom_per_question" || tMode === "equal_per_question") {
        captureCurrentStepAnswer(currentQuestionIdx);
        finishAndSubmitStepByStep();
    } else {
        finishAndSubmitAllQuestions();
    }
};

async function finishAndSubmitStepByStep() {
    if (quizTimerInterval) clearInterval(quizTimerInterval);
    let correctCount = 0;
    const total = activeSolvingQuiz.questions.length;

    activeSolvingQuiz.questions.forEach((q, idx) => {
        const ans = studentAnswers[idx];
        if (q.type === "mcq") {
            if (ans !== null && ans !== undefined && ans === q.correctIndex) correctCount++;
        } else {
            if (ans && ans.toLowerCase() === q.correctAnswer.trim().toLowerCase()) correctCount++;
        }
    });

    await saveQuizFinalScore(correctCount, total);
}

async function finishAndSubmitAllQuestions() {
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

    await saveQuizFinalScore(correctCount, total);
}

async function saveQuizFinalScore(correctCount, total) {
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
}

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

// ==================== تبويب ملفات دراسية (PDF) ====================
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

// ==================== تبويب حسابي (البروفايل والإعدادات) ====================
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
        if (q.targetUsername && q.targetUsername.toLowerCase() === currentUser.username.toLowerCase()) {
            q.targetUsername = newUsername;
        }
    });

    currentUser.username = newUsername;
    currentUser.lastUsernameChange = n
