/* =========================
   DAILY BOARD
========================= */

const STORAGE_KEY = "dailyPlannerTasks";

let tasks = JSON.parse(
    localStorage.getItem(STORAGE_KEY)
) || [];

let currentView = "board";

let counter = tasks.reduce(
    (max, task) => Math.max(max, task.createdIndex || 0),
    0
);

let modalContext = {
    view: "board",
    column: "Not Started"
};


/* =========================
   VIEW CONFIGURATION
========================= */

const views = {

    board: {
        key: "status",

        columns: [
            "Not Started",
            "In Progress",
            "Done!"
        ]
    },

    category: {
        key: "category",

        columns: [
            "Personal",
            "Work"
        ]
    },

    priority: {
        key: "priority",

        columns: [
            "High",
            "Medium",
            "Low"
        ]
    }

};


/* =========================
   COLLAPSED COLUMNS
========================= */

const collapsed = {
    board: {},
    category: {},
    priority: {}
};


/* =========================
   DOM ELEMENTS
========================= */

const columnsContainer =
    document.getElementById("columns");

const modal =
    document.getElementById("modal");

const taskForm =
    document.getElementById("taskForm");

const taskTitle =
    document.getElementById("taskTitle");

const taskCategory =
    document.getElementById("taskCategory");

const taskPriority =
    document.getElementById("taskPriority");

const toastElement =
    document.getElementById("toast");

const resetConfirm =
    document.getElementById("resetConfirm");


/* =========================
   STORAGE
========================= */

function saveTasks() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
    );

}


/* =========================
   TOAST
========================= */

function showToast(message) {

    toastElement.textContent = message;

    toastElement.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {

        toastElement.classList.remove("show");

    }, 2000);

}


/* =========================
   VIEW SWITCHING
========================= */

document
    .querySelectorAll(".tab")
    .forEach(button => {

        button.addEventListener("click", () => {

            currentView =
                button.dataset.view;

            document
                .querySelectorAll(".tab")
                .forEach(tab => {

                    tab.classList.toggle(
                        "active",
                        tab.dataset.view === currentView
                    );

                });

            render();

        });

    });


/* =========================
   RENDER BOARD
========================= */

function render() {

    const config =
        views[currentView];

    columnsContainer.innerHTML = "";

    if (window.innerWidth < 1100) {

        columnsContainer.style.gridTemplateColumns =
            "1fr";

    } else {

        columnsContainer.style.gridTemplateColumns =
            `repeat(${config.columns.length}, minmax(0, 1fr))`;

    }


    config.columns.forEach(columnName => {

        createColumn(
            columnName,
            config
        );

    });

}


/* =========================
   CREATE COLUMN
========================= */

function createColumn(
    columnName,
    config
) {

    const columnTasks = tasks

        .filter(
            task =>
                task[config.key] === columnName
        )

        .sort(
            (a, b) =>
                a.sortOrder - b.sortOrder
        );


    const isCollapsed =
        collapsed[currentView][columnName] === true;


    const column =
        document.createElement("section");

    column.className = "column";


    const titleClass =
        getTitleClass(
            currentView,
            columnName
        );


    const statusClass =
        getStatusClass(
            columnName
        );


    column.innerHTML = `

        <div class="column-header">

            <div class="column-title ${titleClass}">

                <span class="status ${statusClass}"></span>

                ${escapeHTML(columnName)}

            </div>


            <span class="column-count">
                ${columnTasks.length}
            </span>


            <button
                class="eye"
                type="button"
                aria-label="Collapse column"
            >
                ${isCollapsed ? "○" : "●"}
            </button>

        </div>


        <div
            class="column-body ${
                isCollapsed ? "collapsed" : ""
            }"
        >

            <div class="task-list"></div>

        </div>


        <div
            class="column-footer ${
                isCollapsed ? "hidden" : ""
            }"
        >

            <button
                class="add-column-task"
                type="button"
            >
                + NEW TASK
            </button>

        </div>

    `;


    columnsContainer.appendChild(column);


    const header =
        column.querySelector(".column-header");

    const eye =
        column.querySelector(".eye");

    const addButton =
        column.querySelector(".add-column-task");

    const taskList =
        column.querySelector(".task-list");


    /* Collapse */

    eye.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleColumn(
                columnName
            );

        }
    );


    header.addEventListener(
        "dblclick",
        () => {

            toggleColumn(
                columnName
            );

        }
    );


    /* Add task */

    addButton.addEventListener(
        "click",
        () => {

            openModal(
                columnName
            );

        }
    );


    /* Empty column */

    if (
        columnTasks.length === 0 &&
        tasks.length > 0
    ) {

        taskList.innerHTML = `
            <div class="empty-drop">
                DROP TASKS HERE
            </div>
        `;

    }


    /* Tasks */

    columnTasks.forEach(task => {

        taskList.appendChild(
            createTaskCard(task)
        );

    });


    setupDropZone(
        taskList,
        columnName
    );

}


/* =========================
   COLUMN COLORS
========================= */

function getTitleClass(
    view,
    name
) {

    if (view === "category") {

        if (name === "Personal") {
            return "personal";
        }

        return "work";

    }


    if (view === "priority") {

        return "priority";

    }


    return "";

}


/* =========================
   STATUS DOT
========================= */

function getStatusClass(name) {

    if (name === "Not Started") {
        return "not-started";
    }

    if (name === "In Progress") {
        return "in-progress";
    }

    if (name === "Done!") {
        return "done";
    }

    return "";

}


/* =========================
   CREATE TASK CARD
========================= */

function createTaskCard(task) {

    const card =
        document.createElement("article");

    card.className = "task";

    card.draggable = true;

    card.dataset.id = task.id;


    const categoryClass =
        task.category === "Personal"
            ? "personal"
            : "work";


    card.innerHTML = `

        <div class="task-top">

            <span class="task-title">
                ${escapeHTML(task.title)}
            </span>


            <div class="task-buttons">

                <button
                    class="edit"
                    type="button"
                    aria-label="Edit task"
                >
                    ✎
                </button>

                <button
                    class="delete"
                    type="button"
                    aria-label="Delete task"
                >
                    ×
                </button>

            </div>

        </div>


        <div class="tags">

            <span class="tag ${categoryClass}">
                ${escapeHTML(task.category)}
            </span>

            <span class="tag priority">
                ${escapeHTML(task.priority)}
            </span>

        </div>

    `;


    /* Delete */

    card
        .querySelector(".delete")
        .addEventListener(
            "click",
            () => deleteTask(task.id)
        );


    /* Edit */

    card
        .querySelector(".edit")
        .addEventListener(
            "click",
            () => editTask(task.id)
        );


    /* Drag start */

    card.addEventListener(
        "dragstart",
        event => {

            event.dataTransfer.effectAllowed =
                "move";

            event.dataTransfer.setData(
                "taskId",
                task.id
            );

            card.classList.add(
                "dragging"
            );

        }
    );


    /* Drag end */

    card.addEventListener(
        "dragend",
        () => {

            card.classList.remove(
                "dragging"
            );

        }
    );


    return card;

}


/* =========================
   DRAG & DROP
========================= */

function setupDropZone(
    zone,
    columnName
) {

    zone.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            event.dataTransfer.dropEffect =
                "move";

            zone.classList.add(
                "drag-over"
            );

        }
    );


    zone.addEventListener(
        "dragleave",
        () => {

            zone.classList.remove(
                "drag-over"
            );

        }
    );


    zone.addEventListener(
        "drop",
        event => {

            event.preventDefault();

            zone.classList.remove(
                "drag-over"
            );


            const taskId =
                event.dataTransfer.getData(
                    "taskId"
                );


            const task =
                tasks.find(
                    item => item.id === taskId
                );


            if (!task) {
                return;
            }


            const config =
                views[currentView];


            /* Move according to current view */

            if (currentView === "board") {

                task.status =
                    columnName;

            }


            if (currentView === "category") {

                task.category =
                    columnName;

            }


            if (currentView === "priority") {

                task.priority =
                    columnName;

            }


            /* Put task at end */

            const columnTasks =
                tasks

                    .filter(
                        item =>
                            item[config.key] ===
                                columnName &&
                            item.id !== taskId
                    )

                    .sort(
                        (a, b) =>
                            a.sortOrder -
                            b.sortOrder
                    );


            if (columnTasks.length > 0) {

                task.sortOrder =
                    Math.max(
                        ...columnTasks.map(
                            item =>
                                item.sortOrder
                        )
                    ) + 1;

            } else {

                task.sortOrder = 0;

            }


            saveTasks();

            render();


            /* Celebration */

            if (
                currentView === "board" &&
                columnName === "Done!"
            ) {

                celebrate();

            }

        }
    );

}


/* =========================
   MODAL
========================= */

function openModal(
    columnName = null
) {

    if (columnName) {

        modalContext = {
            view: currentView,
            column: columnName
        };


        if (currentView === "board") {

            taskCategory.value =
                "Personal";

            taskPriority.value =
                "Medium";

        }


        if (currentView === "category") {

            taskCategory.value =
                columnName;

        }


        if (currentView === "priority") {

            taskPriority.value =
                columnName;

        }

    }


    modal.classList.remove(
        "hidden"
    );


    setTimeout(() => {

        taskTitle.focus();

    }, 50);

}


/* Close modal */

function closeModal() {

    modal.classList.add(
        "hidden"
    );

    taskForm.reset();

}


/* New Task */

document
    .getElementById("newTaskBtn")
    .addEventListener(
        "click",
        () => openModal()
    );


/* Cancel */

document
    .getElementById("cancelBtn")
    .addEventListener(
        "click",
        closeModal
    );


/* Click outside */

modal.addEventListener(
    "click",
    event => {

        if (
            event.target === modal
        ) {

            closeModal();

        }

    }
);


/* Escape key */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            !modal.classList.contains("hidden")
        ) {

            closeModal();

        }

    }
);


/* =========================
   ADD TASK
========================= */

taskForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const title =
            taskTitle.value.trim();


        if (!title) {
            return;
        }


        counter++;


        let status =
            "Not Started";

        let category =
            taskCategory.value;

        let priority =
            taskPriority.value;


        /* Board */

        if (
            currentView === "board"
        ) {

            status =
                modalContext.column;

        }


        /* Category */

        if (
            currentView === "category"
        ) {

            category =
                modalContext.column;

        }


        /* Priority */

        if (
            currentView === "priority"
        ) {

            priority =
                modalContext.column;

        }


        const config =
            views[currentView];


        const columnValue =
            currentView === "board"
                ? status
                : currentView === "category"
                    ? category
                    : priority;


        const existing =
            tasks.filter(
                task =>
                    task[config.key] ===
                    columnValue
            );


        const sortOrder =
            existing.length > 0
                ? Math.max(
                    ...existing.map(
                        task =>
                            task.sortOrder
                    )
                ) + 1
                : 0;


        const newTask = {

            id:
                `task-${counter}`,

            title,

            status,

            category,

            priority,

            createdIndex:
                counter,

            sortOrder

        };


        tasks.push(
            newTask
        );


        saveTasks();

        closeModal();

        render();

        showToast(
            "Task added"
        );

    }
);


/* =========================
   DELETE TASK
========================= */

function deleteTask(id) {

    const task =
        tasks.find(
            item => item.id === id
        );


    if (!task) {
        return;
    }


    tasks =
        tasks.filter(
            item => item.id !== id
        );


    saveTasks();

    render();

    showToast(
        "Task deleted"
    );

}


/* =========================
   EDIT TASK
========================= */

function editTask(id) {

    const task =
        tasks.find(
            item => item.id === id
        );


    if (!task) {
        return;
    }


    const card =
        document.querySelector(
            `[data-id="${id}"]`
        );


    if (!card) {
        return;
    }


    const titleElement =
        card.querySelector(
            ".task-title"
        );


    const originalTitle =
        task.title;


    const input =
        document.createElement(
            "textarea"
        );


    input.value =
        originalTitle;

    input.maxLength =
        120;


    input.style.width =
        "100%";

    input.style.minHeight =
        "50px";

    input.style.border =
        "none";

    input.style.outline =
        "none";

    input.style.background =
        "transparent";

    input.style.font =
        "inherit";

    input.style.resize =
        "none";


    titleElement.replaceWith(
        input
    );


    input.focus();

    input.select();


    let saved =
        false;


    function saveEdit() {

        if (saved) {
            return;
        }


        saved = true;


        const value =
            input.value.trim();


        if (value) {

            task.title =
                value;

            saveTasks();

            render();

            showToast(
                "Task updated"
            );

        } else {

            render();

        }

    }


    input.addEventListener(
        "blur",
        () => {

            setTimeout(
                saveEdit,
                100
            );

        }
    );


    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                saveEdit();

            }


            if (
                event.key === "Escape"
            ) {

                saved = true;

                render();

            }

        }
    );

}


/* =========================
   REFRESH
========================= */

document
    .getElementById("refreshBtn")
    .addEventListener(
        "click",
        () => {

            const completed =
                tasks.filter(
                    task =>
                        task.status === "Done!"
                ).length;


            tasks =
                tasks.filter(
                    task =>
                        task.status !== "Done!"
                );


            saveTasks();

            render();

            showToast(
                `Refreshed — removed ${completed} done task(s)`
            );

        }
    );


/* =========================
   RESET
========================= */

document
    .getElementById("resetBtn")
    .addEventListener(
        "click",
        () => {

            resetConfirm.classList.remove(
                "hidden"
            );

        }
    );


/* Cancel reset */

resetConfirm
    .querySelector(".cancel")
    .addEventListener(
        "click",
        () => {

            resetConfirm.classList.add(
                "hidden"
            );

        }
    );


/* Confirm reset */

resetConfirm
    .querySelector(".yes")
    .addEventListener(
        "click",
        () => {

            tasks = [];

            counter = 0;

            saveTasks();

            render();

            resetConfirm.classList.add(
                "hidden"
            );

            showToast(
                "All tasks cleared"
            );

        }
    );


/* =========================
   COLLAPSE COLUMN
========================= */

function toggleColumn(
    columnName
) {

    collapsed[currentView][columnName] =
        !collapsed[currentView][columnName];


    render();

}


/* =========================
   CELEBRATION
========================= */

function celebrate() {

    if (
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
    ) {

        showToast(
            "Nice work! 🎉"
        );

        return;

    }


    showToast(
        "Nice work! 🎉"
    );


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        window.innerWidth;

    canvas.height =
        window.innerHeight;


    canvas.style.position =
        "fixed";

    canvas.style.left =
        "0";

    canvas.style.top =
        "0";

    canvas.style.width =
        "100%";

    canvas.style.height =
        "100%";

    canvas.style.pointerEvents =
        "none";

    canvas.style.zIndex =
        "999";


    document.body.appendChild(
        canvas
    );


    const ctx =
        canvas.getContext(
            "2d"
        );


    const colors = [
        "#fffdf1",
        "#4a9e8e",
        "#e8b84a",
        "#d4a574",
        "#2d5366"
    ];


    const particles = [];


    for (
        let i = 0;
        i < 35;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;


        const speed =
            5 +
            Math.random() * 7;


        particles.push({

            x:
                canvas.width / 2,

            y:
                canvas.height / 2,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            size:
                4 +
                Math.random() * 7,

            color:
                colors[
                    Math.floor(
                        Math.random() *
                        colors.length
                    )
                ],

            life: 1

        });

    }


    const start =
        performance.now();


    function animate(time) {

        const progress =
            Math.min(
                (time - start) / 1300,
                1
            );


        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        particles.forEach(
            particle => {

                particle.x +=
                    particle.vx;

                particle.y +=
                    particle.vy;

                particle.vy +=
                    0.15;

                particle.vx *=
                    0.98;

                particle.life =
                    1 - progress;


                ctx.globalAlpha =
                    particle.life;

                ctx.fillStyle =
                    particle.color;


                ctx.beginPath();

                ctx.arc(
                    particle.x,
                    particle.y,
                    particle.size,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

            }
        );


        ctx.globalAlpha = 1;


        if (progress < 1) {

            requestAnimationFrame(
                animate
            );

        } else {

            canvas.remove();

        }

    }


    requestAnimationFrame(
        animate
    );

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value;

    return div.innerHTML;

}


/* =========================
   WINDOW RESIZE
========================= */

window.addEventListener(
    "resize",
    () => {

        render();

    }
);


/* =========================
   INITIALIZE
========================= */

render();
